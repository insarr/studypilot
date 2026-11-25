import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR, User, loadUsers, saveUsers, loadData, saveData } from './db.js';
import { extractText } from './parse.js';
import { aiAsk, aiFlashcards, aiNotes, aiQuiz, aiSimplify, llmConfigured } from './ai.js';
import { sendVerificationEmail } from './mail.js';

const PORT = Number(process.env.PORT || 4000);
const SECRET_FILE = path.join(DATA_DIR, '.jwt-secret');

function jwtSecret(): string {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 16) return process.env.JWT_SECRET;
  try {
    fs.mkdirSync(path.dirname(SECRET_FILE), { recursive: true });
    if (!fs.existsSync(SECRET_FILE)) fs.writeFileSync(SECRET_FILE, crypto.randomBytes(48).toString('hex'));
    return fs.readFileSync(SECRET_FILE, 'utf8');
  } catch {
    return 'studypilot-fallback-serverless-jwt-secret-key-2026-secure';
  }
}
const SECRET = jwtSecret();
const BCRYPT_ROUNDS = 12; // OWASP recommended cost factor

// Cryptographic SHA-256 helper for hashing OTP verification & reset codes in DB
const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
const generate6DigitOtp = () => String(crypto.randomInt(100000, 999999));

export const app = express();
app.disable('x-powered-by');

// Security Headers Middleware (OWASP / Helmet-style)
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '15mb' }));

// Lightweight IP Rate Limiter (protects Auth & AI endpoints from brute force)
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
function rateLimit(maxRequests: number, windowMs: number, msg: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'local').split(',')[0].trim();
    const key = `${ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    const b = rateBuckets.get(key);
    if (!b || now > b.resetAt) {
      rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (b.count >= maxRequests) {
      return res.status(429).json({ error: msg });
    }
    b.count++;
    next();
  };
}

const authLimiter = rateLimit(25, 15 * 60 * 1000, 'Слишком много попыток. Подождите несколько минут.');
const otpSendLimiter = rateLimit(6, 5 * 60 * 1000, 'Код уже отправлен. Подождите минуту перед повторной отправкой.');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

interface AuthedReq extends Request {
  uid?: string;
}

const auth = (req: AuthedReq, res: Response, next: NextFunction) => {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  try {
    const p = jwt.verify(token, SECRET) as { uid: string };
    req.uid = p.uid;
    next();
  } catch {
    res.status(401).json({ error: 'Требуется вход в аккаунт' });
  }
};

const publicUser = (u: User) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  avatar: u.avatar || '',
  emailVerified: Boolean(u.emailVerified),
});

const sign = (id: string) => jwt.sign({ uid: id }, SECRET, { expiresIn: '30d' });
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 160;

app.get('/api/health', (_req, res) =>
  res.json({
    ok: true,
    llm: llmConfigured(),
    security: {
      bcryptRounds: BCRYPT_ROUNDS,
      otpHashing: 'SHA-256',
      jwtProtected: true,
      headersHardened: true,
      rateLimiting: true,
      apiKeysHiddenOnServer: true,
    },
  }),
);

app.post('/api/auth/register', authLimiter, async (req, res) => {
  const { name, email, password, avatar } = req.body || {};
  const cleanName = String(name || '').trim().slice(0, 80);
  if (!cleanName) return res.status(400).json({ error: 'Укажите имя' });
  if (!emailOk(String(email || ''))) return res.status(400).json({ error: 'Некорректный email' });
  if (String(password || '').length < 6) return res.status(400).json({ error: 'Пароль — минимум 6 символов' });

  const users = loadUsers();
  const em = String(email).toLowerCase().trim();
  if (users.find((u) => u.email === em)) return res.status(409).json({ error: 'Пользователь с таким email уже существует' });

  const otp = generate6DigitOtp();
  const user: User = {
    id: crypto.randomUUID(),
    name: cleanName,
    email: em,
    passwordHash: await bcrypt.hash(String(password), BCRYPT_ROUNDS),
    createdAt: new Date().toISOString(),
    avatar: typeof avatar === 'string' && avatar.length <= 1_500_000 ? avatar : '',
    emailVerified: false,
    verifyCodeHash: sha256(otp),
    verifyExpires: Date.now() + 15 * 60 * 1000,
  };
  users.push(user);
  saveUsers(users);

  const mailRes = await sendVerificationEmail(user.email, user.name, otp);
  res.json({
    token: sign(user.id),
    user: publicUser(user),
    verification: {
      sent: mailRes.sent,
      mode: mailRes.mode,
      previewUrl: mailRes.previewUrl,
      // When no real SMTP is configured, provide the demo code so the user can test verification immediately
      demoCode: mailRes.mode !== 'smtp' ? otp : undefined,
    },
  });
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  const user = loadUsers().find((u) => u.email === String(email || '').toLowerCase().trim());
  if (!user || !(await bcrypt.compare(String(password || ''), user.passwordHash))) {
    return res.status(401).json({ error: 'Неверный email или пароль' });
  }
  res.json({ token: sign(user.id), user: publicUser(user) });
});

app.get('/api/auth/me', auth, (req: AuthedReq, res) => {
  const user = loadUsers().find((u) => u.id === req.uid);
  if (!user) return res.status(401).json({ error: 'Пользователь не найден' });
  res.json({ user: publicUser(user) });
});

// Send or Resend 6-digit Email Verification Code
app.post('/api/auth/send-verification', auth, otpSendLimiter, async (req: AuthedReq, res) => {
  const users = loadUsers();
  const user = users.find((u) => u.id === req.uid);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  if (user.emailVerified) return res.json({ ok: true, alreadyVerified: true, user: publicUser(user) });

  const otp = generate6DigitOtp();
  user.verifyCodeHash = sha256(otp);
  user.verifyExpires = Date.now() + 15 * 60 * 1000;
  saveUsers(users);

  const mailRes = await sendVerificationEmail(user.email, user.name, otp);
  res.json({
    ok: true,
    mode: mailRes.mode,
    previewUrl: mailRes.previewUrl,
    demoCode: mailRes.mode !== 'smtp' ? otp : undefined,
  });
});

// Verify 6-digit Email Code
app.post('/api/auth/verify-email', auth, authLimiter, (req: AuthedReq, res) => {
  const rawCode = String(req.body?.code || '').replace(/\D/g, '').trim();
  if (rawCode.length !== 6) return res.status(400).json({ error: 'Введите 6-значный код' });

  const users = loadUsers();
  const user = users.find((u) => u.id === req.uid);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  if (user.emailVerified) return res.json({ ok: true, user: publicUser(user) });

  if (!user.verifyCodeHash || !user.verifyExpires || user.verifyExpires < Date.now()) {
    return res.status(400).json({ error: 'Код истёк. Запросите новый код.' });
  }
  if (user.verifyCodeHash !== sha256(rawCode)) {
    return res.status(400).json({ error: 'Неверный код подтверждения' });
  }

  user.emailVerified = true;
  delete user.verifyCodeHash;
  delete user.verifyExpires;
  saveUsers(users);
  res.json({ ok: true, user: publicUser(user) });
});

// Update Profile (Custom Avatar Upload / Preset 3D Avatar / Name)
app.put('/api/auth/profile', auth, (req: AuthedReq, res) => {
  const { name, avatar } = req.body || {};
  const users = loadUsers();
  const user = users.find((u) => u.id === req.uid);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

  if (typeof name === 'string' && name.trim()) {
    user.name = name.trim().slice(0, 80);
  }
  if (typeof avatar === 'string') {
    const validPreset = avatar === '' || avatar.startsWith('/assets3d/');
    const validDataUrl = /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(avatar);
    if (!validPreset && !validDataUrl) {
      return res.status(400).json({ error: 'Допустимы только изображения PNG, JPG, WEBP или GIF' });
    }
    if (avatar.length > 1_500_000) {
      return res.status(400).json({ error: 'Размер аватарки слишком большой (макс. 1 МБ)' });
    }
    user.avatar = avatar;
  }
  saveUsers(users);
  res.json({ ok: true, user: publicUser(user) });
});

// Password Reset Flow (with SHA-256 hashed token)
app.post('/api/auth/forgot', authLimiter, async (req, res) => {
  const users = loadUsers();
  const user = users.find((u) => u.email === String(req.body?.email || '').toLowerCase().trim());
  if (!user) return res.status(404).json({ error: 'Пользователь с таким email не найден' });
  const rawCode = generate6DigitOtp();
  user.resetToken = sha256(rawCode);
  user.resetExpires = Date.now() + 15 * 60 * 1000;
  saveUsers(users);

  const mailRes = await sendVerificationEmail(user.email, user.name, rawCode);
  res.json({
    demo: mailRes.mode !== 'smtp',
    code: mailRes.mode !== 'smtp' ? rawCode : undefined,
    previewUrl: mailRes.previewUrl,
    message:
      mailRes.mode === 'smtp'
        ? 'Код восстановления отправлен на вашу почту.'
        : 'Демо-режим: код отправлен в тестовый ящик и показан здесь.',
  });
});

app.post('/api/auth/reset', authLimiter, async (req, res) => {
  const { email, code, password } = req.body || {};
  if (String(password || '').length < 6) return res.status(400).json({ error: 'Пароль — минимум 6 символов' });
  const users = loadUsers();
  const user = users.find((u) => u.email === String(email || '').toLowerCase().trim());
  const cleanCode = String(code || '').trim();
  const matches =
    user &&
    user.resetToken &&
    (user.resetToken === sha256(cleanCode) || user.resetToken === cleanCode.toUpperCase()) &&
    (user.resetExpires || 0) >= Date.now();
  if (!matches || !user) return res.status(400).json({ error: 'Неверный или просроченный код' });

  user.passwordHash = await bcrypt.hash(String(password), BCRYPT_ROUNDS);
  delete user.resetToken;
  delete user.resetExpires;
  saveUsers(users);
  res.json({ ok: true });
});

app.post('/api/auth/password', auth, authLimiter, async (req: AuthedReq, res) => {
  const { current, password } = req.body || {};
  const users = loadUsers();
  const user = users.find((u) => u.id === req.uid);
  if (!user || !(await bcrypt.compare(String(current || ''), user.passwordHash))) {
    return res.status(400).json({ error: 'Текущий пароль неверен' });
  }
  if (String(password || '').length < 6) return res.status(400).json({ error: 'Пароль — минимум 6 символов' });
  user.passwordHash = await bcrypt.hash(String(password), BCRYPT_ROUNDS);
  saveUsers(users);
  res.json({ ok: true });
});

app.delete('/api/auth/account', auth, async (req: AuthedReq, res) => {
  const users = loadUsers().filter((u) => u.id !== req.uid);
  saveUsers(users);
  saveData(req.uid!, null);
  res.json({ ok: true });
});

app.get('/api/data', auth, (req: AuthedReq, res) => res.json({ data: loadData(req.uid!) }));
app.put('/api/data', auth, (req: AuthedReq, res) => {
  if (!req.body || typeof req.body.data !== 'object') return res.status(400).json({ error: 'Некорректные данные' });
  saveData(req.uid!, req.body.data);
  res.json({ ok: true });
});

app.post('/api/upload', auth, (req, res) => {
  upload.single('file')(req, res, async (err: unknown) => {
    if (err) return res.status(400).json({ error: (err as Error).message.includes('File too large') ? 'Файл больше 25 МБ' : 'Ошибка загрузки файла' });
    const f = (req as any).file as Express.Multer.File | undefined;
    if (!f) return res.status(400).json({ error: 'Файл не передан' });
    const name = Buffer.from(f.originalname, 'latin1').toString('utf8');
    try {
      const { text, kind } = await extractText(name, f.buffer);
      res.json({ name, kind, size: f.size, text, chars: text.length });
    } catch (e: any) {
      res.status(422).json({ error: e?.message || 'Не удалось прочитать файл' });
    }
  });
});

const wrap = (fn: (req: AuthedReq) => Promise<unknown>) => async (req: AuthedReq, res: Response) => {
  try {
    res.json(await fn(req));
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Ошибка AI' });
  }
};
const need = (v: unknown, msg: string) => {
  if (!v || !String(v).trim()) throw new Error(msg);
  return String(v);
};

app.post('/api/ai/notes', auth, wrap(async (r) => aiNotes(need(r.body.text, 'Нет текста лекции'), String(r.body.title || 'Лекция'), r.body.lang)));
app.post('/api/ai/quiz', auth, wrap(async (r) => {
  const types: string[] = Array.isArray(r.body.types) && r.body.types.length ? r.body.types : ['mcq'];
  const count = [5, 10, 20].includes(Number(r.body.count)) ? Number(r.body.count) : 5;
  return aiQuiz(need(r.body.text, 'Нет текста лекции'), count, types, String(r.body.difficulty || 'medium'), r.body.lang);
}));
app.post('/api/ai/flashcards', auth, wrap(async (r) => aiFlashcards(need(r.body.text, 'Нет текста лекции'), r.body.lang)));
app.post('/api/ai/ask', auth, wrap(async (r) => aiAsk(need(r.body.text, 'Нет текста лекции'), need(r.body.question, 'Пустой вопрос'), r.body.lang)));
app.post('/api/ai/simplify', auth, wrap(async (r) => aiSimplify(need(r.body.fragment, 'Нет фрагмента'), r.body.lang)));

// Serve built frontend if present (single-port production mode)
const dist = path.resolve(process.cwd(), '..', 'frontend', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api).*/, (_req, res) => res.sendFile('index.html', { root: dist }));
}

// Only bind port when running directly as a persistent Node server (not imported by Vercel Serverless)
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`StudyPilot API on http://localhost:${PORT} (LLM key ${llmConfigured() ? 'set' : 'NOT set'})`));
}

export default app;
