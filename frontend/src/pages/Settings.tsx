import { animate, stagger } from 'animejs';
import {
  Camera,
  Check,
  CheckCircle2,
  Cloud,
  ExternalLink,
  Globe,
  Lock,
  Mail,
  Monitor,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sun,
  Trash2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type VerificationInfo } from '../api';
import { useStore, useT } from '../store';
import {
  Bulb,
  Certificate3D,
  FileIcon3D,
  FoxMascot,
  Globe3D,
  Planet3D,
  Rocket3D,
} from '../components/Deco';
import GsapTiltCard from '../components/GsapTiltCard';
import LottieSparkle from '../components/LottieSparkle';
import { PageHead, confirmBox } from '../components/UI';
import { emptyData } from '../types';

const PRESET_AVATARS = [
  { label: 'Fox Pilot', src: '/assets3d/fox-mascot.png' },
  { label: 'Student Boy', src: '/assets3d/student-boy.png' },
  { label: 'Student Girl', src: '/assets3d/student-girl.png' },
  { label: 'Grad Cap', src: '/assets3d/gradcap-3d.png' },
  { label: 'Rocket', src: '/assets3d/rocket-3d.png' },
  { label: 'Atom', src: '/assets3d/atom-3d.png' },
];

/** Resize & crop uploaded image to a crisp 256x256 square WEBP/PNG Data URL under 180 KB */
function resizeAvatarFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Выберите изображение (PNG, JPG, WEBP или GIF)'));
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Повреждённое изображение'));
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas недоступен'));
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        resolve(canvas.toDataURL('image/webp', 0.88));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export default function Settings() {
  const t = useT();
  const nav = useNavigate();
  const { user, setUser, data, logout, toast, mutate, theme, setTheme, lang, setLang } = useStore();
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [cur, setCur] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);

  // Email verification state inside Settings
  const [otpBoxOpen, setOtpBoxOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpBusy, setOtpBusy] = useState(false);
  const [verifyInfo, setVerifyInfo] = useState<VerificationInfo | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNameInput(user?.name || '');
  }, [user?.name]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  useEffect(() => {
    if (gridRef.current) {
      const cards = gridRef.current.querySelectorAll('.set-card');
      animate(cards, {
        translateY: [24, 0],
        opacity: [0, 1],
        scale: [0.96, 1],
        delay: stagger(75),
        duration: 600,
        ease: 'outBack(1.4)',
      });
    }
  }, []);

  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAvatarBusy(true);
    try {
      const dataUrl = await resizeAvatarFile(file);
      const r = await api.updateProfile({ avatar: dataUrl });
      setUser(r.user);
      toast(t('Аватарка успешно обновлена! 📸', 'Custom avatar uploaded! 📸'), 'ok');
    } catch (err: any) {
      toast(err.message || t('Ошибка загрузки аватарки', 'Avatar upload failed'), 'err');
    } finally {
      setAvatarBusy(false);
    }
  };

  const selectPresetAvatar = async (src: string) => {
    setAvatarBusy(true);
    try {
      const r = await api.updateProfile({ avatar: src });
      setUser(r.user);
      toast(t('Аватар обновлён!', 'Avatar updated!'), 'ok');
    } catch (err: any) {
      toast(err.message, 'err');
    } finally {
      setAvatarBusy(false);
    }
  };

  const saveName = async () => {
    if (!nameInput.trim() || nameInput.trim() === user?.name) return;
    setAvatarBusy(true);
    try {
      const r = await api.updateProfile({ name: nameInput.trim() });
      setUser(r.user);
      toast(t('Имя профиля сохранено', 'Profile name saved'), 'ok');
    } catch (err: any) {
      toast(err.message, 'err');
    } finally {
      setAvatarBusy(false);
    }
  };

  const requestEmailCode = async () => {
    setOtpBusy(true);
    try {
      const r = await api.sendVerification();
      setVerifyInfo(r);
      setOtpBoxOpen(true);
      if (r.demoCode) setOtpCode(r.demoCode);
      setCooldown(60);
      toast(t('6-значный код отправлен на вашу почту!', '6-digit verification code sent!'), 'ok');
    } catch (err: any) {
      toast(err.message, 'err');
    } finally {
      setOtpBusy(false);
    }
  };

  const confirmEmailCode = async () => {
    if (otpCode.length !== 6) return;
    setOtpBusy(true);
    try {
      const r = await api.verifyEmail(otpCode);
      setUser(r.user);
      setOtpBoxOpen(false);
      toast(t('Почта успешно подтверждена! 🦊', 'Email verified! 🦊'), 'ok');
    } catch (err: any) {
      toast(err.message, 'err');
    } finally {
      setOtpBusy(false);
    }
  };

  const change = async () => {
    setBusy(true);
    try {
      await api.changePassword(cur, pw);
      toast(t('Пароль изменён', 'Password changed'), 'ok');
      setCur('');
      setPw('');
    } catch (e: any) {
      toast(e.message, 'err');
    } finally {
      setBusy(false);
    }
  };

  const exportJson = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    a.download = 'studypilot-data.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const clear = () => {
    if (!confirmBox(t('Удалить ВСЕ предметы, лекции, тесты и карточки?', 'Delete ALL subjects, lectures, quizzes and cards?'))) return;
    mutate((d) => Object.assign(d, emptyData()));
    toast(t('Данные очищены', 'Data cleared'), 'ok');
  };

  const del = async () => {
    if (!confirmBox(t('Удалить аккаунт навсегда? Это действие необратимо.', 'Delete your account permanently? This cannot be undone.'))) return;
    try {
      await api.deleteAccount();
      logout();
      nav('/');
    } catch (e: any) {
      toast(e.message, 'err');
    }
  };

  return (
    <>
      <PageHead
        title={t('Настройки', 'Settings')}
        sub={t('Персонализация аватарки, верификация почты, темы, языка, безопасности и деплоя.', 'Personalize your avatar, email verification, theme, language, security, and cloud deployment.')}
        actions={
          <div className="row" style={{ gap: 10 }}>
            <LottieSparkle size={28} />
            <Planet3D style={{ width: 58 }} />
          </div>
        }
      />

      <div ref={gridRef} className="grid g2" style={{ alignItems: 'start' }}>
        {/* 1. Student Profile, Custom Avatar Upload & Email Verification */}
        <GsapTiltCard className="card stack set-card" intensity={4}>
          <div className="row spread">
            <div>
              <h3 style={{ margin: 0 }}>{t('Профиль и аватарка', 'Profile & Custom Avatar')}</h3>
              <div className="muted sm" style={{ marginTop: 2 }}>
                {t('Загрузите своё фото или выберите 3D-маскота', 'Upload your own photo or pick a 3D mascot')}
              </div>
            </div>
            <Certificate3D style={{ width: 50 }} />
          </div>

          <div className="row" style={{ gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: 84, height: 84, flexShrink: 0 }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                title={t('Нажмите, чтобы загрузить свою аватарку', 'Click to upload custom avatar')}
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2.5px solid var(--text)',
                  background: 'var(--card-2)',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <FoxMascot style={{ width: 68 }} />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarBusy}
                aria-label={t('Загрузить фото', 'Upload photo')}
                style={{
                  position: 'absolute',
                  right: -2,
                  bottom: -2,
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: 'var(--color-ink)',
                  color: '#fff',
                  border: '2px solid var(--card)',
                  display: 'grid',
                  placeItems: 'center',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <Camera size={14} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
              />
            </div>

            <div style={{ flex: 1, minWidth: 180 }}>
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                <b style={{ fontSize: 18 }}>{user?.name}</b>
                {user?.emailVerified ? (
                  <span className="badge ok" style={{ gap: 4 }}>
                    <CheckCircle2 size={13} /> {t('Почта подтверждена', 'Email Verified')}
                  </span>
                ) : (
                  <span className="badge warn" style={{ gap: 4 }}>
                    <Mail size={13} /> {t('Не подтверждена', 'Unverified')}
                  </span>
                )}
              </div>
              <div className="muted sm" style={{ marginTop: 2 }}>{user?.email}</div>
              <div className="row" style={{ gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={avatarBusy}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera size={14} />
                  {t('Загрузить своё фото', 'Upload photo')}
                </button>
                {user?.avatar && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={avatarBusy}
                    onClick={() => selectPresetAvatar('')}
                  >
                    <Trash2 size={14} />
                    {t('Сбросить', 'Reset')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Preset 3D Avatars Strip */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: 8 }}>
              {t('Или выберите 3D-аватар StudyPilot:', 'Or pick a StudyPilot 3D avatar:')}
            </div>
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              {PRESET_AVATARS.map((p) => {
                const active = user?.avatar === p.src;
                return (
                  <button
                    key={p.src}
                    type="button"
                    onClick={() => selectPresetAvatar(p.src)}
                    title={p.label}
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 14,
                      padding: 4,
                      background: active
                        ? 'color-mix(in srgb, var(--color-marigold) 40%, var(--card))'
                        : 'var(--card-2)',
                      border: active ? '2px solid var(--text)' : '1px solid var(--line)',
                      display: 'grid',
                      placeItems: 'center',
                      transition: 'transform 0.2s',
                    }}
                  >
                    <img src={p.src} alt={p.label} style={{ width: 34, height: 34, objectFit: 'contain' }} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Edit Display Name */}
          <div className="row" style={{ gap: 8 }}>
            <input
              className="input"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder={t('Ваше имя', 'Your name')}
            />
            <button
              type="button"
              className="btn btn-ghost"
              disabled={avatarBusy || !nameInput.trim() || nameInput.trim() === user?.name}
              onClick={saveName}
            >
              {t('Сохранить имя', 'Save name')}
            </button>
          </div>

          {/* Email Verification Section inside Profile Card */}
          <div
            style={{
              padding: 14,
              borderRadius: 16,
              background: user?.emailVerified
                ? 'color-mix(in srgb, var(--color-mint) 22%, var(--card))'
                : 'color-mix(in srgb, var(--color-marigold) 26%, var(--card))',
              border: '1px solid var(--line)',
            }}
          >
            {user?.emailVerified ? (
              <div className="row" style={{ gap: 10 }}>
                <CheckCircle2 size={20} style={{ color: 'var(--ok)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>
                    {t('Ваша почта подтверждена', 'Your email address is verified')}
                  </div>
                  <div className="muted sm" style={{ fontSize: 12 }}>
                    {t('Аккаунт защищён двухэтапной проверкой OTP SHA-256.', 'Account protected by SHA-256 OTP verification.')}
                  </div>
                </div>
              </div>
            ) : (
              <div className="stack" style={{ gap: 10 }}>
                <div className="row spread" style={{ gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>
                      {t('Подтвердите почту через 6-значный код', 'Verify your email with a 6-digit code')}
                    </div>
                    <div className="muted sm" style={{ fontSize: 12 }}>
                      {t('Отправим письмо с кодом на ' + user?.email, 'We will send an email with an OTP code to ' + user?.email)}
                    </div>
                  </div>
                  {!otpBoxOpen && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={otpBusy}
                      onClick={requestEmailCode}
                    >
                      <Mail size={14} />
                      {t('Отправить код', 'Send code')}
                    </button>
                  )}
                </div>

                {otpBoxOpen && (
                  <div className="stack" style={{ gap: 8, paddingTop: 6, borderTop: '1px solid var(--line)' }}>
                    {verifyInfo?.previewUrl && (
                      <a
                        href={verifyInfo.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="row"
                        style={{ gap: 6, fontSize: 12.5, fontWeight: 700, color: 'var(--color-azure)' }}
                      >
                        <ExternalLink size={13} />
                        {t('Открыть отправленное письмо в браузере (Ethereal) →', 'Open sent email in browser (Ethereal) →')}
                      </a>
                    )}
                    {verifyInfo?.demoCode && (
                      <div className="sm">
                        {t('Код подтверждения:', 'Verification code:')}{' '}
                        <b
                          onClick={() => setOtpCode(verifyInfo.demoCode || '')}
                          style={{
                            cursor: 'pointer',
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: 'var(--card)',
                            border: '1px solid var(--line)',
                            letterSpacing: 2,
                          }}
                        >
                          {verifyInfo.demoCode}
                        </b>
                      </div>
                    )}
                    <div className="row" style={{ gap: 8 }}>
                      <input
                        className="input"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        style={{ fontWeight: 800, letterSpacing: 6, textAlign: 'center', maxWidth: 160 }}
                      />
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={otpBusy || otpCode.length !== 6}
                        onClick={confirmEmailCode}
                      >
                        {t('Подтвердить', 'Verify')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={otpBusy || cooldown > 0}
                        onClick={requestEmailCode}
                      >
                        <RefreshCw size={13} />
                        {cooldown > 0 ? `${cooldown}s` : t('Ещё раз', 'Resend')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </GsapTiltCard>

        {/* 2. Appearance & Language Card */}
        <GsapTiltCard className="card stack set-card" intensity={4}>
          <div className="row spread">
            <div>
              <h3 style={{ margin: 0 }}>{t('Внешний вид и язык', 'Appearance & Language')}</h3>
              <div className="muted sm" style={{ marginTop: 2 }}>
                {t('Выберите тему оформления и язык интерфейса', 'Choose your color theme and interface language')}
              </div>
            </div>
            <Bulb style={{ width: 44 }} />
          </div>

          {/* Crisp 3-Card Theme Selector Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 10,
              marginTop: 4,
            }}
          >
            {(
              [
                {
                  id: 'light',
                  title: t('Светлая', 'Light'),
                  sub: 'Craft Canvas',
                  Icon: Sun,
                  iconColor: '#f59e0b',
                  previewBg: 'linear-gradient(135deg, #fffdf9 0%, #fde99b 100%)',
                  previewCard: '#ffffff',
                  previewText: '#030302',
                },
                {
                  id: 'dark',
                  title: t('Тёмная', 'Dark'),
                  sub: 'Night Studio',
                  Icon: Moon,
                  iconColor: '#60a5fa',
                  previewBg: 'linear-gradient(135deg, #16181d 0%, #262936 100%)',
                  previewCard: '#1f222a',
                  previewText: '#f5f4ef',
                },
                {
                  id: 'system',
                  title: t('Система', 'System'),
                  sub: t('Авто-режим', 'Auto Sync'),
                  Icon: Monitor,
                  iconColor: '#10b981',
                  previewBg: 'linear-gradient(135deg, #d1eef9 0%, #1e222d 100%)',
                  previewCard: isDark ? '#1f222a' : '#ffffff',
                  previewText: isDark ? '#f5f4ef' : '#030302',
                },
              ] as const
            ).map((opt) => {
              const active = theme === opt.id;
              return (
                <motion.button
                  key={opt.id}
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setTheme(opt.id)}
                  style={{
                    textAlign: 'left',
                    padding: 12,
                    borderRadius: 18,
                    background: active
                      ? 'color-mix(in srgb, var(--color-marigold) 22%, var(--card))'
                      : 'var(--card-2)',
                    border: active ? '2px solid var(--text)' : '1.5px solid var(--line)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    position: 'relative',
                    transition: 'border-color 0.25s, background 0.25s',
                  }}
                >
                  {/* Mini High-DPI Vector Theme Preview Window */}
                  <div
                    style={{
                      height: 48,
                      borderRadius: 12,
                      background: opt.previewBg,
                      border: '1px solid rgba(0,0,0,0.1)',
                      padding: 7,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff5f56' }} />
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ffbd2e' }} />
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#27c93f' }} />
                    </div>
                    <div
                      style={{
                        background: opt.previewCard,
                        color: opt.previewText,
                        borderRadius: 6,
                        padding: '3px 6px',
                        fontSize: 9,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                      }}
                    >
                      <span>Aa</span>
                      <opt.Icon size={11} color={opt.iconColor} strokeWidth={2.4} />
                    </div>
                  </div>

                  <div className="row spread" style={{ gap: 4 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.2 }}>{opt.title}</div>
                      <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{opt.sub}</div>
                    </div>
                    {active && (
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: 'var(--text)',
                          color: 'var(--bg)',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Crisp 2-Card Language Selector */}
          <div style={{ marginTop: 4 }}>
            <div className="row spread" style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>
                {t('Язык интерфейса', 'Interface Language')}
              </span>
              <Globe3D style={{ width: 28 }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
              {(
                [
                  { id: 'ru', label: 'Русский', sub: 'RU · Основной', flag: 'ru' },
                  { id: 'en', label: 'English', sub: 'EN · International', flag: 'en' },
                ] as const
              ).map((l) => {
                const active = lang === l.id;
                return (
                  <motion.button
                    key={l.id}
                    type="button"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setLang(l.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      padding: '10px 14px',
                      borderRadius: 14,
                      background: active
                        ? 'color-mix(in srgb, var(--color-mint) 25%, var(--card))'
                        : 'var(--card-2)',
                      border: active ? '2px solid var(--text)' : '1.5px solid var(--line)',
                      textAlign: 'left',
                      transition: 'border-color 0.25s, background 0.25s',
                    }}
                  >
                    <div className="row" style={{ gap: 10 }}>
                      <span className={`ku-flag-dot ${l.flag}`} style={{ width: 14, height: 14 }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.2 }}>{l.label}</div>
                        <div className="muted" style={{ fontSize: 11 }}>{l.sub}</div>
                      </div>
                    </div>
                    {active ? (
                      <Check size={15} strokeWidth={2.6} />
                    ) : (
                      <Globe size={14} className="muted" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </GsapTiltCard>

        {/* 3. Security Audit & Password Card */}
        <GsapTiltCard className="card stack set-card" intensity={4}>
          <div className="row spread">
            <div>
              <h3 style={{ margin: 0 }}>{t('Безопасность и смена пароля', 'Security & Change Password')}</h3>
              <div className="muted sm" style={{ marginTop: 2 }}>
                {t('Криптографическая защита аккаунта и API-ключей', 'Cryptographic protection for your account & API keys')}
              </div>
            </div>
            <Rocket3D style={{ width: 46 }} />
          </div>

          <div
            className="stack"
            style={{
              gap: 6,
              padding: 12,
              borderRadius: 14,
              background: 'var(--card-2)',
              border: '1px solid var(--line)',
              fontSize: 12.5,
            }}
          >
            <div className="row" style={{ gap: 8 }}>
              <ShieldCheck size={15} style={{ color: 'var(--ok)', flexShrink: 0 }} />
              <span><b>bcrypt (12 раундов):</b> {t('Пароли хэшируются с солью и никогда не хранятся в открытом виде', 'Passwords salted & hashed with cost factor 12')}</span>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <Lock size={15} style={{ color: 'var(--color-azure)', flexShrink: 0 }} />
              <span><b>API-ключи скрыты:</b> {t('Ключи LLM хранятся строго на сервере в .env (0 ключей в браузере)', 'LLM API keys live strictly on backend in .env')}</span>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <CheckCircle2 size={15} style={{ color: 'var(--ok)', flexShrink: 0 }} />
              <span><b>SHA-256 OTP + Rate Limit:</b> {t('Защита от перебора паролей и кодов подтверждения', 'Brute-force rate limiting & SHA-256 OTP hashing')}</span>
            </div>
          </div>

          <div className="field">
            <label>{t('Текущий пароль', 'Current password')}</label>
            <input className="input" type="password" value={cur} onChange={(e) => setCur(e.target.value)} />
          </div>
          <div className="field">
            <label>{t('Новый пароль (мин. 6)', 'New password (min 6)')}</label>
            <input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
          </div>
          <button className="btn btn-primary" disabled={busy || !cur || pw.length < 6} onClick={change}>
            {t('Изменить пароль', 'Change password')}
          </button>
        </GsapTiltCard>

        {/* 4. Data, Backup & Vercel Cloud Ready Card */}
        <GsapTiltCard className="card stack set-card" intensity={4}>
          <div className="row spread">
            <div>
              <h3 style={{ margin: 0 }}>{t('Данные, бэкап и облако Vercel', 'Data, Backup & Vercel Cloud')}</h3>
              <div className="muted sm" style={{ marginTop: 2 }}>
                {t('Экспорт прогресса и готовность к деплою на Vercel', 'Export study progress & Vercel Serverless readiness')}
              </div>
            </div>
            <FileIcon3D kind="zip" width={44} />
          </div>

          <div
            className="row"
            style={{
              gap: 10,
              padding: 12,
              borderRadius: 14,
              background: 'color-mix(in srgb, var(--color-periwinkle) 24%, var(--card))',
              border: '1px solid var(--line)',
              fontSize: 12.5,
            }}
          >
            <Cloud size={18} style={{ color: 'var(--color-azure)', flexShrink: 0 }} />
            <div>
              <b>Vercel Ready (`vercel.json` + `/api/index.ts`):</b>{' '}
              {t('Проект полностью настроен для публикации на Vercel (Frontend + Serverless API).', 'Project is pre-configured for one-click Vercel deployment.')}
            </div>
          </div>

          <p className="muted sm">
            {t(
              `Предметов: ${data.subjects.length}, лекций: ${data.lectures.length}, тестов: ${data.quizzes.length}, карточек: ${data.cards.length}.`,
              `Subjects: ${data.subjects.length}, lectures: ${data.lectures.length}, quizzes: ${data.quizzes.length}, cards: ${data.cards.length}.`,
            )}
          </p>
          <div className="row">
            <button className="btn btn-ghost" onClick={exportJson}>
              {t('Экспорт JSON', 'Export JSON')}
            </button>
            <button className="btn btn-danger" onClick={clear}>
              {t('Очистить данные', 'Clear data')}
            </button>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--line)' }} />
          <div className="row">
            <button
              className="btn btn-ghost"
              onClick={() => {
                logout();
                nav('/');
              }}
            >
              {t('Выйти', 'Log out')}
            </button>
            <button className="btn btn-danger" onClick={del}>
              {t('Удалить аккаунт', 'Delete account')}
            </button>
          </div>
        </GsapTiltCard>
      </div>
    </>
  );
}
