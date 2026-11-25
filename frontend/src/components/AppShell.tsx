import { Bell } from 'lucide-react';
import { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useStore, useT, todayStr } from '../store';
import { Icon } from './Icon';
import { Logo, BookStack, FoxMascot, Sticky } from './Deco';
import { daysBetween, dueCards, nextExam, streak } from '../lib';
import ProfileDropdown from './kokonutui/profile-dropdown';
import StatusIsland, { type IslandTask } from './kokonutui/status-island';

export default function AppShell() {
  const t = useT();
  const nav = useNavigate();
  const loc = useLocation();
  const { user, data, logout, save, theme, setTheme, lang, setLang } = useStore();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [bell, setBell] = useState(false);

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

  const islandTasks = useMemo<IslandTask[]>(() => {
    const list: IslandTask[] = [];
    const exam = nextExam(data);
    if (exam && exam.examDate) {
      const d = daysBetween(todayStr(), exam.examDate);
      list.push({
        id: 'exam',
        label: `${exam.name}: ${d} ${t('дн. до экзамена', 'days to exam')}`,
        detail: t('План активен', 'Plan active'),
        status: 'done',
        action: { label: t('План', 'Plan'), onClick: () => nav('/study-plan') },
      });
    }
    const due = dueCards(data).length;
    if (due > 0) {
      list.push({
        id: 'cards',
        label: t(`Карточек к повторению: ${due}`, `Cards due: ${due}`),
        detail: 'SM-2',
        status: 'done',
        action: { label: t('Учить', 'Study'), onClick: () => nav('/flashcards') },
      });
    }
    list.push({
      id: 'sync',
      label:
        save === 'saving'
          ? t('Синхронизация...', 'Syncing...')
          : save === 'error'
            ? t('Ошибка синхронизации', 'Sync error')
            : t('ИИ и облако готовы', 'AI & Cloud Ready'),
      detail: `${data.lectures.length} ${t('лекций', 'lectures')}`,
      status: save === 'saving' ? 'running' : save === 'error' ? 'error' : 'done',
      action: { label: '+ PDF', onClick: () => nav('/lectures?new=1') },
    });
    return list;
  }, [data, save, t, nav]);

  const close = () => {
    setOpen(false);
    setBell(false);
  };

  return (
    <div className="shell" onClick={() => bell && setBell(false)}>
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
        <div className="side-deco hide-m" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <FoxMascot style={{ width: 112 }} />
          <Sticky color="yellow" style={{ width: '100%', fontSize: '1rem', textAlign: 'center', transform: 'rotate(-2deg)' }}>
            {t('Готовься системно, сдавай легко', 'Study smart, ace every exam')}
          </Sticky>
          <BookStack style={{ width: 88 }} />
        </div>
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

          {/* Kokonut UI StatusIsland */}
          <StatusIsland tasks={islandTasks} streakCount={streak(data)} />

          <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <button className="btn btn-ghost btn-icon" style={{ borderRadius: 9999 }} onClick={() => setBell(!bell)} aria-label="Notifications">
              <Bell size={17} />
              {notifs.length > 0 && <span style={{ position: 'absolute', top: 6, right: 7, width: 8, height: 8, borderRadius: 9, background: 'var(--color-papaya)' }} />}
            </button>
            {bell && (
              <div className="dropdown right">
                {notifs.length === 0 && <div className="dd-item muted">{t('Новых уведомлений нет', 'No notifications')}</div>}
                {notifs.map((n, i) => (
                  <div key={i} className="dd-item">
                    <Bell size={14} style={{ color: 'var(--color-papaya)', flexShrink: 0 }} />
                    <span>{n}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Kokonut UI ProfileDropdown */}
          <ProfileDropdown
            name={user?.name || 'Student'}
            email={user?.email || ''}
            avatar={user?.avatar}
            emailVerified={user?.emailVerified}
            plan="AI Scrapbook"
            theme={theme}
            onThemeChange={setTheme}
            lang={lang}
            onLangChange={setLang}
            onNavigate={(path) => nav(path)}
            onSignOut={() => {
              logout();
              nav('/');
            }}
          />
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
