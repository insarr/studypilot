import { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useStore, useT, todayStr } from '../store';
import { Icon } from './Icon';
import { Logo } from './Deco';
import { ThemeLang } from './UI';
import { daysBetween, dueCards } from '../lib';

export default function AppShell() {
  const t = useT();
  const nav = useNavigate();
  const loc = useLocation();
  const { user, data, logout, save } = useStore();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [bell, setBell] = useState(false);
  const [prof, setProf] = useState(false);

  const items = [
    ['/dashboard', 'home', t('Главная', 'Dashboard'), 0],
    ['/subjects', 'folder', t('Предметы', 'Subjects'), data.subjects.length],
    ['/lectures', 'file', t('Лекции', 'Lectures'), data.lectures.length],
    ['/notes', 'note', t('Конспекты', 'Notes'), data.lectures.filter((l) => l.notes).length],
    ['/tests', 'test', t('Тесты', 'Tests'), data.quizzes.length],
    ['/flashcards', 'cards', t('Карточки', 'Flashcards'), dueCards(data).length],
    ['/study-plan', 'plan', t('План', 'Study plan'), 0],
    ['/progress', 'chart', t('Прогресс', 'Progress'), 0],
    ['/mistakes', 'alert', t('Ошибки', 'Mistakes'), data.mistakes.filter((m) => !m.resolved).length],
    ['/settings', 'settings', t('Настройки', 'Settings'), 0],
  ] as const;

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    const r: { to: string; label: string; sub: string; ic: string }[] = [];
    data.subjects.filter((x) => x.name.toLowerCase().includes(s)).forEach((x) => r.push({ to: `/subjects/${x.id}`, label: x.name, sub: t('Предмет', 'Subject'), ic: 'folder' }));
    data.lectures.filter((x) => x.title.toLowerCase().includes(s) || x.text.toLowerCase().includes(s)).slice(0, 8).forEach((x) => r.push({ to: `/lectures/${x.id}`, label: x.title, sub: t('Лекция', 'Lecture'), ic: 'file' }));
    return r;
  }, [q, data, t]);

  const notifs = useMemo(() => {
    const n: string[] = [];
    const today = todayStr();
    for (const s of data.subjects) if (s.examDate) {
      const d = daysBetween(today, s.examDate);
      if (d >= 0 && d <= 7) n.push(t(`Экзамен «${s.name}» через ${d} дн.`, `Exam “${s.name}” in ${d} day(s)`));
    }
    const due = dueCards(data).length;
    if (due) n.push(t(`Карточек к повторению: ${due}`, `Flashcards due: ${due}`));
    const od = data.tasks.filter((x) => !x.done && x.date < today).length;
    if (od) n.push(t(`Просроченных задач плана: ${od}`, `Overdue plan tasks: ${od}`));
    const td = data.tasks.filter((x) => !x.done && x.date === today).length;
    if (td) n.push(t(`Задач на сегодня: ${td}`, `Tasks today: ${td}`));
    return n;
  }, [data, t]);

  const close = () => {
    setOpen(false);
    setBell(false);
    setProf(false);
  };

  return (
    <div className="shell" onClick={() => (bell || prof) && (setBell(false), setProf(false))}>
      <div className={`scrim ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <Link to="/" className="brand">
          <Logo /> <span>Study<b>Pilot</b></span>
        </Link>
        {items.map(([to, ic, label, cnt]) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive || (to !== '/dashboard' && loc.pathname.startsWith(to)) ? 'active' : ''}`} onClick={close}>
            <Icon name={ic} size={19} /> <span>{label}</span>
            {cnt > 0 && <span className="cnt">{cnt}</span>}
          </NavLink>
        ))}
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="btn btn-ghost btn-icon menu-btn" onClick={(e) => (e.stopPropagation(), setOpen(true))} aria-label="Menu">
            <Icon name="menu" />
          </button>
          <div className="search">
            <Icon name="search" size={17} />
            <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Поиск по лекциям и предметам…', 'Search lectures & subjects…')} aria-label="Search" />
            {q.trim().length >= 2 && (
              <div className="dropdown">
                {results.length === 0 && <div className="dd-item muted">{t('Ничего не найдено', 'Nothing found')}</div>}
                {results.map((r) => (
                  <button key={r.to} className="dd-item" onClick={() => (setQ(''), nav(r.to))}>
                    <Icon name={r.ic} size={16} /> <span className="grow trunc">{r.label}</span> <span className="badge">{r.sub}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="grow" />
          <span className="badge hide-m" title={t('Состояние сохранения', 'Save status')} style={{ opacity: save === 'idle' ? 0.5 : 1 }}>
            {save === 'saving' ? t('Сохранение…', 'Saving…') : save === 'error' ? t('Ошибка сохранения', 'Save failed') : t('Сохранено ✓', 'Saved ✓')}
          </span>
          <span className="hide-m row" style={{ gap: 8 }}>
            <ThemeLang app />
          </span>
          <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <button className="btn btn-ghost btn-icon" onClick={() => (setBell(!bell), setProf(false))} aria-label="Notifications">
              <Icon name="bell" />
              {notifs.length > 0 && <span style={{ position: 'absolute', top: 6, right: 7, width: 9, height: 9, borderRadius: 9, background: 'var(--bad)' }} />}
            </button>
            {bell && (
              <div className="dropdown right">
                {notifs.length === 0 && <div className="dd-item muted">{t('Новых уведомлений нет', 'No notifications')}</div>}
                {notifs.map((n, i) => (
                  <div key={i} className="dd-item"><Icon name="bell" size={15} /> {n}</div>
                ))}
              </div>
            )}
          </div>
          <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <button className="avatar" onClick={() => (setProf(!prof), setBell(false))} aria-label="Profile">
              {(user?.name || '?').slice(0, 1).toUpperCase()}
            </button>
            {prof && (
              <div className="dropdown right">
                <div className="dd-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
                  <b>{user?.name}</b>
                  <span className="muted sm">{user?.email}</span>
                </div>
                <button className="dd-item" onClick={() => (setProf(false), nav('/settings'))}>
                  <Icon name="settings" size={16} /> {t('Настройки', 'Settings')}
                </button>
                <div className="dd-item show-m-only hide-d">
                  <ThemeLang app />
                </div>
                <button className="dd-item" onClick={() => (logout(), nav('/'))}>
                  <Icon name="logout" size={16} /> {t('Выйти', 'Log out')}
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
