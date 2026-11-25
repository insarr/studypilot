import { CheckCircle2, ExternalLink, Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { api, type VerificationInfo } from '../api';
import { useStore, useT } from '../store';
import {
  ExamGradeCard,
  FoxLogoFull,
  GraduationCapArt,
  Logo,
  OpenBook,
  StudentBoy3D,
  StudentGirl3D,
  TornPaper,
} from '../components/Deco';
import { ThemeLang } from '../components/UI';

export default function Auth({ mode }: { mode: 'login' | 'register' | 'forgot' }) {
  const t = useT();
  const nav = useNavigate();
  const loc = useLocation() as { state?: { from?: string } };
  const { setSession, setUser, user } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'reset' | 'verify'>('email');
  const [demoCode, setDemoCode] = useState('');
  const [verifyInfo, setVerifyInfo] = useState<VerificationInfo | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useStore((s) => s.toast);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  if (user && mode !== 'forgot' && step !== 'verify') {
    return <Navigate to={loc.state?.from || '/dashboard'} replace />;
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      if (mode === 'register' && step !== 'verify') {
        const r = await api.register(name, email, password);
        await setSession(r.token, r.user);
        setVerifyInfo(r.verification || null);
        setCode(r.verification?.demoCode || '');
        setCooldown(60);
        setStep('verify');
      } else if (step === 'verify') {
        const r = await api.verifyEmail(code);
        setUser(r.user);
        toast(t('Почта успешно подтверждена! 🦊', 'Email verified successfully! 🦊'), 'ok');
        nav('/dashboard', { replace: true });
      } else if (mode === 'login') {
        const r = await api.login(email, password);
        await setSession(r.token, r.user);
        nav(loc.state?.from || '/dashboard', { replace: true });
      } else if (step === 'email') {
        const r = await api.forgot(email);
        setDemoCode(r.code || '');
        setVerifyInfo({ previewUrl: r.previewUrl });
        setStep('reset');
      } else {
        await api.reset(email, code, password);
        toast(t('Пароль изменён. Войдите с новым паролем.', 'Password changed. Log in with the new one.'), 'ok');
        nav('/login');
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const resendOtp = async () => {
    if (cooldown > 0 || busy) return;
    setErr('');
    setBusy(true);
    try {
      const r = await api.sendVerification();
      setVerifyInfo(r);
      if (r.demoCode) setCode(r.demoCode);
      setCooldown(60);
      toast(t('Новый 6-значный код отправлен!', 'New 6-digit code sent!'), 'ok');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const title =
    step === 'verify'
      ? t('Подтверждение почты', 'Verify your email')
      : mode === 'login'
        ? t('С возвращением в тетрадь', 'Welcome back')
        : mode === 'register'
          ? t('Создать учебное пространство', 'Create your study space')
          : t('Восстановление пароля', 'Reset password');

  return (
    <div className="auth-page">
      <div
        className="auth-art"
        style={{
          backgroundImage: 'url(/assets3d/hero-sky-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <TornPaper color="#9bd8a9" style={{ width: 220, top: 40, left: 30, transform: 'rotate(-8deg)', opacity: 0.8 }} />
        <TornPaper color="#fde99b" style={{ width: 210, bottom: 50, right: 30, transform: 'rotate(7deg)', opacity: 0.8 }} />
        <div className="stack" style={{ alignItems: 'center', gap: 18, position: 'relative', zIndex: 2, maxWidth: 460, textAlign: 'center' }}>
          <div style={{ position: 'relative', padding: '10px 44px' }}>
            <FoxLogoFull style={{ width: 220 }} />
            <ExamGradeCard style={{ position: 'absolute', width: 84, right: -24, top: 10 }} />
            <GraduationCapArt style={{ position: 'absolute', width: 78, left: -24, top: 18 }} />
          </div>
          <div className="row" style={{ justifyContent: 'center', gap: 16 }}>
            <StudentBoy3D style={{ width: 108 }} />
            <OpenBook style={{ width: 150 }} />
            <StudentGirl3D style={{ width: 104 }} />
          </div>
          <h2 className="serif-head" style={{ fontSize: '1.9rem', color: '#030302' }}>
            {t('Твоё пространство для конспектов и экзаменов', 'Your crafted space for lecture notes and exams')}
          </h2>
          <p style={{ color: '#262624' }}>
            {t('Загрузите лекцию — получите расширенный конспект с формулами KaTeX, умные карточки и расписание подготовки.', 'Upload a lecture — get extended notes with KaTeX math, smart flashcards, and a daily prep schedule.')}
          </p>
        </div>
      </div>

      <div className="auth-form">
        <div className="auth-box stack" style={{ gap: 18 }}>
          <div className="row spread">
            <Link to="/" className="brand" style={{ padding: 0 }}>
              <Logo size={36} /> <span>Study<b>Pilot</b></span>
            </Link>
            <div className="row" style={{ gap: 6 }}><ThemeLang app /></div>
          </div>

          <h1 style={{ fontSize: '2.1rem' }}>{title}</h1>

          {step === 'verify' ? (
            <form className="stack" onSubmit={submit} noValidate>
              <div
                className="card stack"
                style={{
                  padding: 16,
                  background: 'color-mix(in srgb, var(--color-marigold) 26%, var(--card))',
                  border: '1px solid var(--line)',
                  boxShadow: 'none',
                  gap: 8,
                }}
              >
                <div className="row" style={{ gap: 8 }}>
                  <Mail size={18} />
                  <b style={{ fontSize: 14 }}>
                    {t(`Мы отправили 6-значный код на ${user?.email || email}`, `We sent a 6-digit code to ${user?.email || email}`)}
                  </b>
                </div>
                {verifyInfo?.previewUrl && (
                  <a
                    href={verifyInfo.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="row"
                    style={{ gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--color-azure)' }}
                  >
                    <ExternalLink size={14} />
                    {t('Открыть реальное тестовое письмо (Ethereal Inbox)', 'Open live test email (Ethereal Inbox)')}
                  </a>
                )}
                {verifyInfo?.demoCode && (
                  <div className="sm" style={{ color: 'var(--text-2)' }}>
                    {t('Быстрый код для локального теста:', 'Quick code for local test:')}{' '}
                    <b
                      onClick={() => setCode(verifyInfo.demoCode || '')}
                      style={{
                        cursor: 'pointer',
                        padding: '2px 8px',
                        borderRadius: 8,
                        background: 'var(--card)',
                        border: '1px solid var(--line)',
                        letterSpacing: 2,
                      }}
                    >
                      {verifyInfo.demoCode}
                    </b>
                  </div>
                )}
              </div>

              <div className="field">
                <label htmlFor="otp">{t('6-значный код подтверждения', '6-digit verification code')}</label>
                <input
                  id="otp"
                  className="input"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    letterSpacing: 10,
                    textAlign: 'center',
                    height: 54,
                  }}
                  required
                />
              </div>

              {err && <div role="alert" className="badge bad" style={{ whiteSpace: 'normal', padding: '8px 12px', borderRadius: 10 }}>{err}</div>}

              <button className="btn btn-primary btn-lg" disabled={busy || code.length !== 6}>
                {busy ? <span className="spin" /> : <CheckCircle2 size={18} />}
                {t('Подтвердить почту', 'Verify Email')}
              </button>

              <div className="row spread sm">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={cooldown > 0 || busy}
                  onClick={resendOtp}
                >
                  <RefreshCw size={14} />
                  {cooldown > 0
                    ? t(`Повторить через ${cooldown} с`, `Resend in ${cooldown}s`)
                    : t('Отправить код ещё раз', 'Resend code')}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => nav('/dashboard', { replace: true })}
                >
                  {t('Позже в настройках →', 'Verify later in Settings →')}
                </button>
              </div>
            </form>
          ) : (
            <form className="stack" onSubmit={submit} noValidate>
              {mode === 'register' && (
                <div className="field">
                  <label htmlFor="n">{t('Имя', 'Name')}</label>
                  <input id="n" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
                </div>
              )}
              <div className="field">
                <label htmlFor="e">Email</label>
                <input id="e" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" disabled={mode === 'forgot' && step === 'reset'} required />
              </div>
              {mode === 'forgot' && step === 'reset' && (
                <>
                  <div className="card stack" style={{ background: 'var(--card-2)', boxShadow: 'none', padding: 12, fontSize: '.86rem', gap: 6 }}>
                    <div>
                      {t('Код восстановления отправлен!', 'Recovery code sent!')}{' '}
                      {demoCode && <b style={{ letterSpacing: 2 }}>{demoCode}</b>}
                    </div>
                    {verifyInfo?.previewUrl && (
                      <a href={verifyInfo.previewUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-azure)', fontWeight: 700 }}>
                        {t('Открыть письмо в браузере (Ethereal) →', 'Open email in browser (Ethereal) →')}
                      </a>
                    )}
                  </div>
                  <div className="field">
                    <label htmlFor="c">{t('6-значный код из письма', '6-digit reset code')}</label>
                    <input id="c" className="input" value={code} onChange={(e) => setCode(e.target.value)} required />
                  </div>
                </>
              )}
              {(mode !== 'forgot' || step === 'reset') && (
                <div className="field">
                  <label htmlFor="p">{mode === 'forgot' ? t('Новый пароль', 'New password') : t('Пароль', 'Password')}</label>
                  <input id="p" className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={6} required />
                </div>
              )}
              {err && <div role="alert" className="badge bad" style={{ whiteSpace: 'normal', padding: '8px 12px', borderRadius: 10 }}>{err}</div>}
              <button className="btn btn-primary btn-lg" disabled={busy}>
                {busy && <span className="spin" />}
                {mode === 'login'
                  ? t('Войти в тетрадь', 'Log in')
                  : mode === 'register'
                    ? t('Создать аккаунт и получить код', 'Sign up & get verification code')
                    : step === 'email'
                      ? t('Получить код на почту', 'Send code to email')
                      : t('Сменить пароль', 'Change password')}
              </button>
            </form>
          )}

          <div className="row" style={{ gap: 6, fontSize: 12, color: 'var(--muted)' }}>
            <ShieldCheck size={14} style={{ color: 'var(--ok)', flexShrink: 0 }} />
            <span>{t('Защита паролей bcrypt (cost 12) · SHA-256 OTP · JWT Auth', 'Passwords hashed with bcrypt (cost 12) · SHA-256 OTP · JWT Auth')}</span>
          </div>

          <div className="row spread sm muted">
            {mode === 'login' && (
              <>
                <Link to="/forgot" style={{ color: 'var(--text)', fontWeight: 600 }}>{t('Забыли пароль?', 'Forgot password?')}</Link>
                <Link to="/register" style={{ color: 'var(--color-azure)', fontWeight: 600 }}>{t('Нет аккаунта? Регистрация', 'No account? Sign up')}</Link>
              </>
            )}
            {mode === 'register' && step !== 'verify' && <Link to="/login" style={{ color: 'var(--color-azure)', fontWeight: 600 }}>{t('Уже есть аккаунт? Войти', 'Have an account? Log in')}</Link>}
            {mode === 'forgot' && <Link to="/login" style={{ color: 'var(--color-azure)', fontWeight: 600 }}>{t('← Назад ко входу', '← Back to login')}</Link>}
          </div>
        </div>
      </div>
    </div>
  );
}
