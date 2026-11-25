import { Link } from 'react-router-dom';
import { useStore, useT } from '../store';
import { Empty, PageHead } from '../components/UI';
import { Chart } from '../components/Deco';
import { attemptsByDay, dueCards, lectureScore, overallProgress, streak, subjectProgress } from '../lib';

export default function Progress() {
  const t = useT();
  const { data, lang } = useStore();
  const days = attemptsByDay(data.attempts, 14);
  const max = Math.max(1, ...days.map((d) => d.count));
  const avg = data.attempts.length ? Math.round((data.attempts.reduce((s, a) => s + a.score / Math.max(a.total, 1), 0) / data.attempts.length) * 100) : 0;
  const doneTasks = data.tasks.filter((x) => x.done).length;
  const mastered = data.cards.filter((c) => c.reps >= 3).length;
  const st = streak(data);
  const badges = [
    [t('Первая лекция', 'First lecture'), data.lectures.length >= 1, '📚'],
    [t('Первый тест', 'First quiz'), data.attempts.length >= 1, '📝'],
    [t('Отличник (≥90%)', 'Top score (≥90%)'), data.attempts.some((a) => a.score / a.total >= 0.9), '🏆'],
    [t('Серия 3 дня', '3-day streak'), st >= 3, '🔥'],
    [t('10 карточек выучено', '10 cards mastered'), mastered >= 10, '🃏'],
    [t('5 задач плана', '5 plan tasks'), doneTasks >= 5, '✅'],
  ] as const;

  const W = 560, H = 170, bw = W / days.length;
  return (
    <>
      <PageHead title={t('Прогресс', 'Progress')} sub={t('Статистика считается по вашим реальным данным.', 'Statistics are computed from your real data.')} />
      <div className="grid g4" style={{ marginBottom: 18 }}>
        {[[t('Общий прогресс', 'Overall'), `${overallProgress(data)}%`], [t('Средний балл тестов', 'Avg quiz score'), `${avg}%`], [t('Серия дней', 'Streak'), `${st} 🔥`], [t('Тестов пройдено', 'Quizzes taken'), data.attempts.length], [t('Карточек выучено', 'Cards mastered'), `${mastered}/${data.cards.length}`], [t('К повторению', 'Due cards'), dueCards(data).length], [t('Задач выполнено', 'Tasks done'), `${doneTasks}/${data.tasks.length}`], [t('Ошибок к разбору', 'Open mistakes'), data.mistakes.filter((m) => !m.resolved).length]].map(([l, v]) => (
          <div key={String(l)} className="card stat"><div className="num">{v}</div><div className="lbl">{l}</div></div>
        ))}
      </div>
      <div className="grid g2">
        <div className="card">
          <div className="row spread"><h3 style={{ margin: 0 }}>{t('Тесты за 14 дней', 'Quizzes, last 14 days')}</h3><Chart style={{ width: 60 }} /></div>
          <svg className="chart" viewBox={`0 0 ${W} ${H + 24}`} role="img" aria-label="chart" style={{ marginTop: 10 }}>
            {days.map((d, i) => {
              const h = (d.count / max) * (H - 20);
              return (
                <g key={d.day}>
                  <rect x={i * bw + 6} y={H - h} width={bw - 12} height={Math.max(h, 3)} rx="5" fill={d.count ? 'var(--accent)' : 'var(--card-2)'}><title>{d.day}: {d.count} · {d.avg}%</title></rect>
                  {d.count > 0 && <text x={i * bw + bw / 2} y={H - h - 5} textAnchor="middle" fontSize="11" fill="var(--text-2)">{d.count}</text>}
                  <text x={i * bw + bw / 2} y={H + 16} textAnchor="middle" fontSize="10" fill="var(--muted)">{d.day.slice(8)}</text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="card">
          <h3>{t('По предметам', 'By subject')}</h3>
          {data.subjects.length === 0 ? <Empty title={t('Нет предметов', 'No subjects')} action={<Link to="/subjects?new=1" className="btn btn-primary btn-sm">{t('Создать', 'Create')}</Link>} /> : data.subjects.map((s) => (
            <div key={s.id} style={{ marginBottom: 12 }}><div className="row spread sm"><Link to={`/subjects/${s.id}`}><b>{s.name}</b></Link><span>{subjectProgress(data, s.id)}%</span></div><div className="bar"><i style={{ width: `${subjectProgress(data, s.id)}%`, background: s.color }} /></div></div>
          ))}
        </div>
        <div className="card">
          <h3>{t('Освоение лекций', 'Lecture mastery')}</h3>
          {data.lectures.length === 0 ? <p className="muted">{t('Лекций нет.', 'No lectures.')}</p> : data.lectures.map((l) => { const sc = lectureScore(data, l.id); return <div key={l.id} className="list-row"><Link to={`/lectures/${l.id}`} className="grow trunc">{l.title}</Link>{sc === null ? <span className="badge">{t('нет тестов', 'no quizzes')}</span> : <span className={`badge ${sc >= 70 ? 'ok' : 'bad'}`}>{sc}%</span>}</div>; })}
        </div>
        <div className="card">
          <h3>{t('Достижения', 'Achievements')}</h3>
          <div className="grid g3">{badges.map(([l, on, ic]) => <div key={l} className="card" style={{ boxShadow: 'none', textAlign: 'center', opacity: on ? 1 : 0.45, padding: 12 }}><div style={{ fontSize: '1.8rem', filter: on ? 'none' : 'grayscale(1)' }}>{ic}</div><div className="sm"><b>{l}</b></div></div>)}</div>
        </div>
      </div>
      <span hidden>{lang}</span>
    </>
  );
}
