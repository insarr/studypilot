import {
  BookOpen,
  ChevronDown,
  Globe,
  LayoutDashboard,
  LogOut,
  Monitor,
  Moon,
  Settings,
  Sparkles,
  Sun,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { type ReactNode, useEffect, useId, useRef, useState } from 'react';
import type { Lang, Theme } from '../../store';

export interface ProfileMenuItem {
  label: string;
  icon?: ReactNode;
  value?: string;
  onSelect?: () => void;
}

export interface ProfileDropdownProps {
  name: string;
  email: string;
  avatar?: string;
  emailVerified?: boolean;
  plan?: string;
  theme: Theme;
  onThemeChange: (t: Theme) => void;
  lang: Lang;
  onLangChange: (l: Lang) => void;
  items?: ProfileMenuItem[];
  onNavigate?: (path: string) => void;
  onSignOut: () => void;
}

const SPRING = { type: 'spring', stiffness: 420, damping: 34 } as const;

export default function ProfileDropdown({
  name,
  email,
  avatar,
  emailVerified,
  plan = 'StudyPilot AI',
  theme,
  onThemeChange,
  lang,
  onLangChange,
  items,
  onNavigate,
  onSignOut,
}: ProfileDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const uid = useId();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const initials = (name || '?')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const defaultItems: ProfileMenuItem[] = items || [
    {
      label: lang === 'ru' ? 'Рабочий стол' : 'Dashboard',
      icon: <LayoutDashboard size={15} />,
      onSelect: () => onNavigate?.('/dashboard'),
    },
    {
      label: lang === 'ru' ? 'Мои конспекты' : 'My Notes',
      icon: <BookOpen size={15} />,
      onSelect: () => onNavigate?.('/notes'),
    },
    {
      label: lang === 'ru' ? 'Настройки аккаунта' : 'Account Settings',
      icon: <Settings size={15} />,
      onSelect: () => onNavigate?.('/settings'),
    },
  ];

  return (
    <div ref={ref} className="ku-profile-wrap">
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen((v) => !v)}
        className="ku-profile-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="ku-profile-avatar" style={avatar ? { padding: 0, overflow: 'hidden', background: 'var(--card-2)' } : undefined}>
          {avatar ? (
            <img src={avatar} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          ) : (
            initials
          )}
          <span className="ku-profile-dot" style={{ background: emailVerified ? '#10b981' : '#f59e0b' }} />
        </span>
        <span className="ku-profile-meta hide-m">
          <span className="ku-profile-name">{name}</span>
          <span className="ku-profile-plan">{plan}</span>
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="ku-profile-chev hide-m"
        >
          <ChevronDown size={14} />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={SPRING}
            className="ku-profile-menu"
          >
            <div className="ku-profile-head">
              <div className="ku-profile-avatar lg" style={avatar ? { padding: 0, overflow: 'hidden', background: 'var(--card-2)' } : undefined}>
                {avatar ? (
                  <img src={avatar} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  initials
                )}
                <span className="ku-profile-dot" style={{ background: emailVerified ? '#10b981' : '#f59e0b' }} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="row" style={{ gap: 6 }}>
                  <b className="trunc">{name}</b>
                  <span className="ku-plan-pill">
                    <Sparkles size={11} /> {plan}
                  </span>
                </div>
                <div className="muted sm trunc">
                  {email}{' '}
                  <span style={{ color: emailVerified ? 'var(--ok)' : 'var(--color-papaya)', fontWeight: 700, fontSize: 11 }}>
                    {emailVerified ? '✓' : '•'}
                  </span>
                </div>
              </div>
            </div>

            <div className="ku-profile-sep" />

            {/* Theme Segmented Switcher */}
            <div className="ku-profile-row">
              <span className="sm muted">{lang === 'ru' ? 'Тема' : 'Theme'}</span>
              <div className="ku-seg">
                {(
                  [
                    ['light', Sun, lang === 'ru' ? 'Светлая' : 'Light'],
                    ['dark', Moon, lang === 'ru' ? 'Тёмная' : 'Dark'],
                    ['system', Monitor, lang === 'ru' ? 'Авто' : 'Auto'],
                  ] as const
                ).map(([k, Ic, lbl]) => {
                  const active = theme === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => onThemeChange(k)}
                      className={`ku-seg-btn ${active ? 'active' : ''}`}
                      title={lbl}
                    >
                      {active && (
                        <motion.span
                          layoutId={`${uid}-theme`}
                          className="ku-seg-pill"
                          transition={SPRING}
                        />
                      )}
                      <span className="ku-seg-in">
                        <Ic size={13} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Language Switcher */}
            <div className="ku-profile-row">
              <span className="sm muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Globe size={13} /> {lang === 'ru' ? 'Язык' : 'Language'}
              </span>
              <div className="ku-seg">
                {(['ru', 'en'] as const).map((l) => {
                  const active = lang === l;
                  return (
                    <button
                      key={l}
                      type="button"
                      onClick={() => onLangChange(l)}
                      className={`ku-seg-btn ${active ? 'active' : ''}`}
                    >
                      {active && (
                        <motion.span
                          layoutId={`${uid}-lang`}
                          className="ku-seg-pill"
                          transition={SPRING}
                        />
                      )}
                      <span className="ku-seg-in">{l.toUpperCase()}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="ku-profile-sep" />

            {defaultItems.map((it) => (
              <button
                key={it.label}
                type="button"
                role="menuitem"
                className="ku-profile-item"
                onClick={() => {
                  setOpen(false);
                  it.onSelect?.();
                }}
              >
                {it.icon}
                <span className="grow">{it.label}</span>
                {it.value && <span className="muted sm">{it.value}</span>}
              </button>
            ))}

            <div className="ku-profile-sep" />

            <button
              type="button"
              role="menuitem"
              className="ku-profile-item danger"
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
            >
              <LogOut size={15} />
              <span>{lang === 'ru' ? 'Выйти из аккаунта' : 'Sign out'}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
