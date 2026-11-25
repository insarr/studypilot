import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useStore, useT } from '../store';
import { Logo, Notebook, Pencil, Sticky, BookStack } from '../components/Deco';
import { ThemeLang } from '../components/UI';

export default function Auth({ mode }: { mode: 'login' | 'register' | 'forgot' }) {
  const t = useT();
  const nav = useNavigate();
  const loc = useLocation() as { state?: { from?: string } };
  const { setSession, user } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [demoCode, setDemoCode] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useStore((s) => s.toast);

  if (user && mode !== 'forgot') return <Navigate to={loc.state?.from || '/dashboard'} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      if (mode === 'register') {
        const r = await api.register(name, email, password);
        await setSession(r.token, r.user);
        nav('/dashboard', { replace: true });
      } else if (mode === 'login') {
        const r = await api.login(email, password);
        await setSession(r.token, r.user);
        nav(loc.state?.from || '/dashboard', { replace: true });
      } else if (step === 'email') {
        const r = await api.forgot(email);
        setDemoCode(r.code);
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

  const title = mode === 'login' ? t('С возвращением', 'Welcome back') : mode === 'register' ? t('Создать аккаунт', 'Create account') : t('Восстановление пароля', 'Reset password');

  return (
    <div className="auth-page">
      <div className="auth-art">
        <div className="stack" style={{ alignItems: 'center', gap: 24, position: 'relative' }}>
          <Notebook style={{ width: 230, transform: 'rotate(-5deg)' }} className="bob" />
          <Pencil style={{ position: 'absolute', width: 34, right: 10, top: 0, transform: 'rotate(24deg)' }} />
          <Sticky color="yellow" className="bob" style={{ position: 'absolute', left: -40, top: 30, width: 150 }}>{t('Ты справишься! ✨', 'You got this! ✨')}</Sticky>
          <BookStack style={{ width: 220 }} />
          <p className="hand" style={{ fontSize: '1.9rem', textAlign: 'center', maxWidth: 340 }}>{t('Загрузи лекцию — получи конспект, тест и план до экзамена', 'Upload a lecture — get notes, a quiz, and an exam plan')}</p>
        </div>
      </div>
      <div className="auth-form">
        <div className="auth-box stack" style={{ gap: 18 }}>
          <div className="row spread">
            <Link to="/" className="brand" style={{ padding: 0 }}><Logo /> <span>Study<b>Pilot</b></span></Link>
            <div className="row" style={{ gap: 6 }}><ThemeLang app /></div>
          </div>
          <h1 style={{ fontSize: '2rem' }}>{title}</h1>
          <form className="stack" onSubmit={submit} noValidate>
            {mode === 'register' && (
              <div className="field"><label htmlFor="n">{t('Имя', 'Name')}</label><input id="n" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required /></div>
            )}
            <div className="field"><label htmlFor="e">Email</label><input id="e" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" disabled={mode === 'forgot' && step === 'reset'} required /></div>
            {mode === 'forgot' && step === 'reset' && (
              <>
                <div className="card" style={{ background: 'var(--card-2)', boxShadow: 'none', padding: 12, fontSize: '.86rem' }}>
                  🧪 {t('Демо-режим: почтовый сервер не подключён, код показан здесь:', 'Demo mode: no mail server, the code is shown here:')} <b style={{ letterSpacing: 2 }}>{demoCode}</b>
                </div>
                <div className="field"><label htmlFor="c">{t('Код из письма', 'Reset code')}</label><input id="c" className="input" value={code} onChange={(e) => setCode(e.target.value)} required /></div>
              </>
            )}
            {(mode !== 'forgot' || step === 'reset') && (
              <div className="field"><label htmlFor="p">{mode === 'forgot' ? t('Новый пароль', 'New password') : t('Пароль', 'Password')}</label><input id="p" className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={6} required /></div>
            )}
            {err && <div role="alert" className="badge bad" style={{ whiteSpace: 'normal', padding: '8px 12px', borderRadius: 10 }}>{err}</div>}
            <button className="btn btn-primary btn-lg" disabled={busy}>
              {busy && <span className="spin" />}
              {mode === 'login' ? t('Войти', 'Log in') : mode === 'register' ? t('Зарегистрироваться', 'Sign up') : step === 'email' ? t('Получить код', 'Get code') : t('Сменить пароль', 'Change password')}
            </button>
          </form>
          <div className="row spread sm muted">
            {mode === 'login' && <><Link to="/forgot" style={{ color: 'var(--accent)' }}>{t('Забыли пароль?', 'Forgot password?')}</Link><Link to="/register" style={{ color: 'var(--accent)' }}>{t('Нет аккаунта? Регистрация', 'No account? Sign up')}</Link></>}
            {mode === 'register' && <Link to="/login" style={{ color: 'var(--accent)' }}>{t('Уже есть аккаунт? Войти', 'Have an account? Log in')}</Link>}
            {mode === 'forgot' && <Link to="/login" style={{ color: 'var(--accent)' }}>{t('← Назад ко входу', '← Back to login')}</Link>}
          </div>
        </div>
      </div>
    </div>
  );
}
