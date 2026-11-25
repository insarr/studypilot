import { animate, stagger } from 'animejs';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useStore, useT } from '../store';
import { Empty, PageHead } from '../components/UI';
import { Chart } from '../components/Deco';
import { attemptsByDay, dueCards, lectureScore, overallProgress, streak, subjectProgress } from '../lib';

export default function Progress() {
  const t = useT();
  const { data, lang } = useStore();
  const badgesRef = useRef<HTMLDivElement>(null);
  const fireRef = useRef<HTMLImageElement>(null);

  const days = attemptsByDay(data.attempts, 14);
  const max = Math.max(1, ...days.map((d) => d.count));
  const avg = data.attempts.length
    ? Math.round((data.attempts.reduce((s, a) => s + a.score / Math.max(a.total, 1), 0) / data.attempts.length) * 100)
    : 0;
  const doneTasks = data.tasks.filter((x) => x.done).length;
  const mastered = data.cards.filter((c) => c.reps >= 3).length;
  const st = streak(data);

  const badges = [
    { title: t('Первая лекция', 'First lecture'), unlocked: data.lectures.length >= 1, img: '/badges/first-lecture.png' },
    { title: t('Первый тест', 'First quiz'), unlocked: data.attempts.length >= 1, img: '/badges/first-quiz.png' },
    { title: t('Отличник (≥90%)', 'Top score (≥90%)'), unlocked: data.attempts.some((a) => a.score / a.total >= 0.9), img: '/badges/top-score.png' },
    { title: t('Серия 3 дня', '3-day streak'), unlocked: st >= 3, img: '/badges/streak-3days.png' },
    { title: t('10 карточек выучено', '10 cards mastered'), unlocked: mastered >= 10, img: '/badges/cards-10.png' },
    { title: t('5 задач плана', '5 plan tasks'), unlocked: doneTasks >= 5, img: '/badges/plan-5tasks.png' },
  ];

  useEffect(() => {
    if (badgesRef.current) {
      const items = badgesRef.current.querySelectorAll('.ach-card');
      animate(items, {
        scale: [0.82, 1],
        opacity: [0, 1],
        translateY: [18, 0],
        delay: stagger(75),
        duration: 620,
        ease: 'outBack(1.7)',
      });
    }
    if (fireRef.current) {
      animate(fireRef.current, {
        translateY: [-3, 3],
        scale: [0.96, 1.06],
        duration: 1400,
        alternate: true,
        loop: true,
        ease: 'inOutSine',
      });
    }
  }, []);

  const W = 560,
    H = 170,
    bw = W / days.length;

  const statCards = [
    { label: t('Общий прогресс', 'Overall'), value: `${overallProgress(data)}%` },
    { label: t('Средний балл тестов', 'Avg quiz score'), value: `${avg}%` },
    { label: t('Серия дней', 'Streak'), value: st, isStreak: true },
    { label: t('Тестов пройдено', 'Quizzes taken'), value: data.attempts.length },
    { label: t('Карточек выучено', 'Cards mastered'), value: `${mastered}/${data.cards.length}` },
    { label: t('К повторению', 'Due cards'), value: dueCards(data).length },
    { label: t('Задач выполнено', 'Tasks done'), value: `${doneTasks}/${data.tasks.length}` },
    { label: t('Ошибок к разбору', 'Open mistakes'), value: data.mistakes.filter((m) => !m.resolved).length },
  ];

  return (
    <>
      <PageHead
        title={t('Прогресс', 'Progress')}
        sub={t('Статистика считается по вашим реальным данным.', 'Statistics are computed from your real data.')}
      />
      <div className="grid g4" style={{ marginBottom: 18 }}>
        {statCards.map((s) => (
          <div key={s.label} className="card stat" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div className="num">{s.value}</div>
              <div className="lbl">{s.label}</div>
            </div>
            {s.isStreak && (
              <img
                ref={fireRef}
                src="/badges/streak-fire.png"
                alt={t('Серия дней', 'Day streak')}
                style={{ width: 58, height: 58, objectFit: 'contain', flexShrink: 0 }}
              />
            )}
          </div>
        ))}
      </div>

      <div className="grid g2">
        <div className="card">
          <div className="row spread">
            <h3 style={{ margin: 0 }}>{t('Тесты за 14 дней', 'Quizzes, last 14 days')}</h3>
            <Chart style={{ width: 60 }} />
          </div>
          <svg className="chart" viewBox={`0 0 ${W} ${H + 24}`} role="img" aria-label="chart" style={{ marginTop: 10 }}>
            {days.map((d, i) => {
              const h = (d.count / max) * (H - 20);
              return (
                <g key={d.day}>
                  <rect x={i * bw + 6} y={H - h} width={bw - 12} height={Math.max(h, 3)} rx="5" fill={d.count ? 'var(--color-azure)' : 'var(--card-2)'}>
                    <title>
                      {d.day}: {d.count} · {d.avg}%
                    </title>
                  </rect>
                  {d.count > 0 && (
                    <text x={i * bw + bw / 2} y={H - h - 5} textAnchor="middle" fontSize="11" fill="var(--text-2)">
                      {d.count}
                    </text>
                  )}
                  <text x={i * bw + bw / 2} y={H + 16} textAnchor="middle" fontSize="10" fill="var(--muted)">
                    {d.day.slice(8)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="card">
          <h3>{t('По предметам', 'By subject')}</h3>
          {data.subjects.length === 0 ? (
            <Empty
              title={t('Нет предметов', 'No subjects')}
              action={
                <Link to="/subjects?new=1" className="btn btn-primary btn-sm">
                  {t('Создать', 'Create')}
                </Link>
              }
            />
          ) : (
            data.subjects.map((s) => (
              <div key={s.id} style={{ marginBottom: 12 }}>
                <div className="row spread sm">
                  <Link to={`/subjects/${s.id}`}>
                    <b>{s.name}</b>
                  </Link>
                  <span>{subjectProgress(data, s.id)}%</span>
                </div>
                <div className="bar">
                  <i style={{ width: `${subjectProgress(data, s.id)}%`, background: s.color }} />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <h3>{t('Освоение лекций', 'Lecture mastery')}</h3>
          {data.lectures.length === 0 ? (
            <p className="muted">{t('Лекций нет.', 'No lectures.')}</p>
          ) : (
            data.lectures.map((l) => {
              const sc = lectureScore(data, l.id);
              return (
                <div key={l.id} className="list-row">
                  <Link to={`/lectures/${l.id}`} className="grow trunc">
                    {l.title}
                  </Link>
                  {sc === null ? (
                    <span className="badge">{t('нет тестов', 'no quizzes')}</span>
                  ) : (
                    <span className={`badge ${sc >= 70 ? 'ok' : 'bad'}`}>{sc}%</span>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="card">
          <div className="row spread" style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>{t('Достижения', 'Achievements')}</h3>
            <span className="badge ok">
              {badges.filter((b) => b.unlocked).length} / {badges.length}
            </span>
          </div>
          <div ref={badgesRef} className="grid g3">
            {badges.map((b) => (
              <div
                key={b.title}
                className="card ach-card"
                style={{
                  boxShadow: b.unlocked ? 'var(--shadow-sm)' : 'none',
                  textAlign: 'center',
                  padding: '14px 10px',
                  borderRadius: 18,
                  background: b.unlocked ? 'color-mix(in srgb, var(--color-marigold) 22%, var(--card))' : 'var(--card-2)',
                  borderColor: b.unlocked ? 'rgba(230, 184, 0, 0.45)' : 'var(--line)',
                  transition: 'transform 0.3s var(--ease-craft)',
                }}
                onMouseEnter={(e) => {
                  const img = e.currentTarget.querySelector('img');
                  if (img) animate(img, { scale: [1, 1.14, 1.06], rotate: [0, -5, 5, 0], duration: 480 });
                }}
                onMouseLeave={(e) => {
                  const img = e.currentTarget.querySelector('img');
                  if (img) animate(img, { scale: 1, rotate: 0, duration: 260 });
                }}
              >
                <img
                  src={b.img}
                  alt={b.title}
                  style={{
                    width: 76,
                    height: 76,
                    margin: '0 auto 8px',
                    objectFit: 'contain',
                    filter: b.unlocked ? 'drop-shadow(0 6px 12px rgba(230, 160, 0, 0.25))' : 'grayscale(1) opacity(0.45)',
                    transition: 'filter 0.3s',
                  }}
                />
                <div className="sm" style={{ fontWeight: 700, opacity: b.unlocked ? 1 : 0.55 }}>
                  {b.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <span hidden>{lang}</span>
    </>
  );
}
