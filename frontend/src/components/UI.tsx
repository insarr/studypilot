import { Monitor, Moon, Sun } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, type ReactNode } from 'react';
import { useStore, useT } from '../store';
import { Icon } from './Icon';
import EmptyState from './kokonutui/empty-state';

export const Toasts = () => {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismiss);
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`} onClick={() => dismiss(t.id)}>
          {t.text}
        </div>
      ))}
    </div>
  );
};

export const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) => {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="row spread" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: '1.25rem' }}>{title}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export const Empty = ({ title, text, action }: { title: string; text?: string; action?: ReactNode }) => (
  <EmptyState title={title} description={text} action={action} />
);

export const Spinner = ({ label }: { label?: string }) => (
  <span className="row" style={{ gap: 8 }}>
    <span className="spin" /> {label}
  </span>
);

export const PageHead = ({ title, sub, actions, crumbs }: { title: string; sub?: string; actions?: ReactNode; crumbs?: ReactNode }) => (
  <>
    {crumbs && <div className="crumbs">{crumbs}</div>}
    <div className="page-head">
      <div style={{ minWidth: 0 }}>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {actions && <div className="row">{actions}</div>}
    </div>
  </>
);

export const ThemeLang = ({ app, showLabels = false }: { app?: boolean; showLabels?: boolean }) => {
  const { theme, setTheme, lang, setLang } = useStore();
  const t = useT();
  const cls = app ? 'ku-themelang app-pill' : 'ku-themelang';
  const langIdx = lang === 'en' ? 1 : 0;
  const themeIdx = theme === 'dark' ? 1 : theme === 'system' ? 2 : 0;

  return (
    <div className="row" style={{ gap: 8, flexWrap: 'nowrap', flexShrink: 0 }}>
      {/* Bounded Deterministic Sliding Language Switcher (RU / EN) */}
      <div
        className={`${cls} ku-tl-grid-2`}
        role="group"
        aria-label={t('Язык', 'Language')}
      >
        <span
          className="ku-tl-slider"
          style={{ transform: `translate3d(${langIdx * 100}%, 0, 0)` }}
          aria-hidden="true"
        />
        {(['ru', 'en'] as const).map((l) => {
          const active = lang === l;
          return (
            <button
              key={l}
              type="button"
              className={`ku-tl-btn ${active ? 'on' : ''}`}
              onClick={() => setLang(l)}
            >
              <span className="ku-tl-in">
                <span className={`ku-flag-dot ${l}`} />
                <span>{l.toUpperCase()}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Bounded Deterministic Sliding Day/Night/System Theme Switcher */}
      <div
        className={`${cls} ku-tl-grid-3 ${showLabels ? 'with-labels' : ''}`}
        role="group"
        aria-label={t('Тема', 'Theme')}
      >
        <span
          className="ku-tl-slider"
          style={{ transform: `translate3d(${themeIdx * 100}%, 0, 0)` }}
          aria-hidden="true"
        />
        {(
          [
            ['light', Sun, t('Светлая', 'Light'), '#f59e0b'],
            ['dark', Moon, t('Тёмная', 'Dark'), '#60a5fa'],
            ['system', Monitor, t('Авто', 'Auto'), 'currentColor'],
          ] as const
        ).map(([k, Ic, lbl, activeIcColor]) => {
          const active = theme === k;
          return (
            <button
              key={k}
              type="button"
              className={`ku-tl-btn ${active ? 'on' : ''}`}
              onClick={() => setTheme(k)}
              title={lbl}
              aria-label={lbl}
            >
              <motion.span
                className="ku-tl-in"
                animate={{
                  rotate: active ? (k === 'light' ? 35 : k === 'dark' ? -12 : 0) : 0,
                  scale: active ? 1.08 : 0.96,
                }}
                transition={{ type: 'spring', stiffness: 360, damping: 22 }}
                style={{ color: active ? activeIcColor : undefined }}
              >
                <Ic size={14} strokeWidth={2.2} />
                {showLabels && <span style={{ color: 'inherit', marginLeft: 4 }}>{lbl}</span>}
              </motion.span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const confirmBox = (msg: string) => window.confirm(msg);
