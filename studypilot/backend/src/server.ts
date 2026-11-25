import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { loadUsers, saveUsers, loadData, saveData } from './db.js';
import { extractText } from './parse.js';
import { aiAsk, aiFlashcards, aiNotes, aiQuiz, aiSimplify, llmConfigured } from './ai.js';

const PORT = Number(process.env.PORT || 4000);
const SECRET_FILE = path.resolve(process.cwd(), 'data', '.jwt-secret');
function jwtSecret(): string {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  fs.mkdirSync(path.dirname(SECRET_FILE), { recursive: true });
  if (!fs.existsSync(SECRET_FILE)) fs.writeFileSync(SECRET_FILE, crypto.randomBytes(48).toString('hex'));
  return fs.readFileSync(SECRET_FILE, 'utf8');
}
const SECRET = jwtSecret();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '25mb' }));

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
const publicUser = (u: { id: string; name: string; email: string }) => ({ id: u.id, name: u.name, email: u.email });
const sign = (id: string) => jwt.sign({ uid: id }, SECRET, { expiresIn: '30d' });
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

app.get('/api/health', (_req, res) => res.json({ ok: true, llm: llmConfigured() }));

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Укажите имя' });
  if (!emailOk(String(email || ''))) return res.status(400).json({ error: 'Некорректный email' });
  if (String(password || '').length < 6) return res.status(400).json({ error: 'Пароль — минимум 6 символов' });
  const users = loadUsers();
  const em = String(email).toLowerCase().trim();
  if (users.find((u) => u.email === em)) return res.status(409).json({ error: 'Пользователь с таким email уже существует' });
  const user = { id: crypto.randomUUID(), name: String(name).trim(), email: em, passwordHash: await bcrypt.hash(String(password), 10), createdAt: new Date().toISOString() };
  users.push(user);
  saveUsers(users);
  res.json({ token: sign(user.id), user: publicUser(user) });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  const user = loadUsers().find((u) => u.email === String(email || '').toLowerCase().trim());
  if (!user || !(await bcrypt.compare(String(password || ''), user.passwordHash))) return res.status(401).json({ error: 'Неверный email или пароль' });
  res.json({ token: sign(user.id), user: publicUser(user) });
});

app.get('/api/auth/me', auth, (req: AuthedReq, res) => {
  const user = loadUsers().find((u) => u.id === req.uid);
  if (!user) return res.status(401).json({ error: 'Пользователь не найден' });
  res.json({ user: publicUser(user) });
});

// Demo reset flow: no email server, so the reset code is returned in the response.
app.post('/api/auth/forgot', (req, res) => {
  const users = loadUsers();
  const user = users.find((u) => u.email === String(req.body?.email || '').toLowerCase().trim());
  if (!user) return res.status(404).json({ error: 'Пользователь с таким email не найден' });
  user.resetToken = crypto.randomBytes(3).toString('hex').toUpperCase();
  user.resetExpires = Date.now() + 15 * 60 * 1000;
  saveUsers(users);
  res.json({ demo: true, code: user.resetToken, message: 'Почтовый сервер не подключён (демо-режим): код показан здесь.' });
});

app.post('/api/auth/reset', async (req, res) => {
  const { email, code, password } = req.body || {};
  if (String(password || '').length < 6) return res.status(400).json({ error: 'Пароль — минимум 6 символов' });
  const users = loadUsers();
  const user = users.find((u) => u.email === String(email || '').toLowerCase().trim());
  if (!user || !user.resetToken || user.resetToken !== String(code || '').toUpperCase() || (user.resetExpires || 0) < Date.now()) return res.status(400).json({ error: 'Неверный или просроченный код' });
  user.passwordHash = await bcrypt.hash(String(password), 10);
  delete user.resetToken;
  delete user.resetExpires;
  saveUsers(users);
  res.json({ ok: true });
});

app.post('/api/auth/password', auth, async (req: AuthedReq, res) => {
  const { current, password } = req.body || {};
  const users = loadUsers();
  const user = users.find((u) => u.id === req.uid);
  if (!user || !(await bcrypt.compare(String(current || ''), user.passwordHash))) return res.status(400).json({ error: 'Текущий пароль неверен' });
  if (String(password || '').length < 6) return res.status(400).json({ error: 'Пароль — минимум 6 символов' });
  user.passwordHash = await bcrypt.hash(String(password), 10);
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

app.listen(PORT, () => console.log(`StudyPilot API on http://localhost:${PORT} (LLM key ${llmConfigured() ? 'set' : 'NOT set'})`));
