import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useStore, useT } from '../store';
import { Icon } from './Icon';
import { OpenBook } from './Deco';

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
  <div className="empty">
    <OpenBook />
    <div className="hand">{title}</div>
    {text && <p style={{ maxWidth: 420, margin: '0 auto 14px' }}>{text}</p>}
    {action}
  </div>
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

export const ThemeLang = ({ app }: { app?: boolean }) => {
  const { theme, setTheme, lang, setLang } = useStore();
  const t = useT();
  const cls = app ? 'pill app-pill' : 'pill';
  return (
    <>
      <div className={cls} role="group" aria-label={t('Язык', 'Language')}>
        {(['ru', 'en'] as const).map((l) => (
          <button key={l} className={lang === l ? 'on' : ''} onClick={() => setLang(l)}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>
      <div className={cls} role="group" aria-label={t('Тема', 'Theme')}>
        {([['light', 'sun'], ['dark', 'moon'], ['system', 'settings']] as const).map(([k, ic]) => (
          <button key={k} className={theme === k ? 'on' : ''} onClick={() => setTheme(k)} title={k} aria-label={k}>
            <Icon name={ic} size={14} />
          </button>
        ))}
      </div>
    </>
  );
};

export const confirmBox = (msg: string) => window.confirm(msg);
