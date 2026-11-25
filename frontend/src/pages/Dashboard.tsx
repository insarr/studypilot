import { animate, stagger } from 'animejs';
import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore, useT, todayStr } from '../store';
import { Icon } from '../components/Icon';
import { Empty } from '../components/UI';
import {
  BookStack,
  Bulb,
  Calendar3D,
  FoxMascot,
  GraduationCapArt,
  OpenBook,
  StudentBoy3D,
  Target3D,
  TornPaper,
} from '../components/Deco';
import { daysBetween, dueCards, fmtDate, fmtDateTime, nextExam, overallProgress, streak, weakLectures } from '../lib';

export default function Dashboard() {
  const t = useT();
  const nav = useNavigate();
  const { user, data, lang } = useStore();
  const dashRef = useRef<HTMLDivElement>(null);

  const exam = nextExam(data);
  const progress = overallProgress(data);
  const weak = weakLectures(data);
  const due = dueCards(data).length;
  const today = data.tasks.filter((x) => x.date === todayStr());
  const hour = new Date().getHours();
  const greet =
    hour < 6
      ? t('Доброй ночи', 'Good night')
      : hour < 12
        ? t('Доброе утро', 'Good morning')
        : hour < 18
          ? t('Добрый день', 'Good afternoon')
          : t('Добрый вечер', 'Good evening');
  const last = data.lectures[data.lectures.length - 1];
  const st = streak(data);
  const doneTasks = data.tasks.filter((x) => x.done).length;
  const mastered = data.cards.filter((c) => c.reps >= 3).length;

  useEffect(() => {
    if (dashRef.current) {
      const cards = dashRef.current.querySelectorAll('.dash-anim');
      animate(cards, {
        translateY: [24, 0],
        opacity: [0, 1],
        delay: stagger(65),
        duration: 600,
        ease: 'outBack(1.3)',
      });
    }
  }, []);

  const stats = [
    { label: t('Предметов', 'Subjects'), val: data.subjects.length, to: '/subjects', img: '/assets3d/folder-blue-3d.png' },
    { label: t('Лекций в тетради', 'Lectures saved'), val: data.lectures.length, to: '/lectures', img: '/assets3d/notebook-aplus.png' },
    { label: t('Общий прогресс', 'Overall progress'), val: `${progress}%`, to: '/progress', img: '/assets3d/chart-3d.png' },
    { label: t('Серия дней', 'Day streak'), val: st, to: '/progress', img: '/badges/streak-fire.png' },
  ] as const;

  const achievements = [
    { title: t('Первая лекция', 'First lecture'), unlocked: data.lectures.length >= 1, img: '/badges/first-lecture.png' },
    { title: t('Первый тест', 'First quiz'), unlocked: data.attempts.length >= 1, img: '/badges/first-quiz.png' },
    { title: t('Отличник (≥90%)', 'Top score (≥90%)'), unlocked: data.attempts.some((a) => a.score / a.total >= 0.9), img: '/badges/top-score.png' },
    { title: t('Серия 3 дня', '3-day streak'), unlocked: st >= 3, img: '/badges/streak-3days.png' },
    { title: t('10 карточек выучено', '10 cards mastered'), unlocked: mastered >= 10, img: '/badges/cards-10.png' },
    { title: t('5 задач плана', '5 plan tasks'), unlocked: doneTasks >= 5, img: '/badges/plan-5tasks.png' },
  ];

  return (
    <div ref={dashRef}>
      <div
        className="card hero-card dash-anim"
        style={{
          marginBottom: 22,
          backgroundImage: 'url(/assets3d/hero-sky-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <TornPaper color="#fde99b" style={{ width: 180, right: 140, top: -24, transform: 'rotate(-8deg)', opacity: 0.7 }} />
        <TornPaper color="#9bd8a9" style={{ width: 170, right: -20, bottom: -25, transform: 'rotate(6deg)', opacity: 0.7 }} />
        <div className="in stack" style={{ gap: 12 }}>
          <div className="row" style={{ gap: 10 }}>
            <span className="craft-tag-pill" style={{ padding: '4px 12px', fontSize: 12 }}>
              <Icon name="note" size={14} /> {t('Цифровая учебная мастерская', 'Digital Study Scrapbook')}
            </span>
            <span className="hand" style={{ fontSize: '1.45rem', color: 'var(--color-papaya)' }}>{greet}!</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.85rem, 3.8vw, 2.75rem)', overflowWrap: 'anywhere', color: '#030302' }}>
            {user?.name}
          </h1>
          <p style={{ fontSize: 16, color: '#262624' }}>
            {exam
              ? t(
                  `До экзамена «${exam.name}» — ${daysBetween(todayStr(), exam.examDate!)} дн. (${fmtDate(exam.examDate!, lang)}). Ваш учебный план синхронизирован.`,
                  `Exam “${exam.name}” in ${daysBetween(todayStr(), exam.examDate!)} day(s) (${fmtDate(exam.examDate!, lang)}). Your study plan is synced.`,
                )
              : t(
                  'Загрузите лекцию или добавьте предмет с датой экзамена, чтобы собрать конспекты с формулами, карточки и план подготовки.',
                  'Upload a lecture or add a subject with an exam date to generate notes with formulas, flashcards, and a study plan.',
                )}
          </p>
          <div className="row" style={{ marginTop: 6, gap: 10 }}>
            <button className="btn btn-primary" onClick={() => nav('/lectures?new=1')}>
              <Icon name="upload" size={17} /> {t('Загрузить лекцию', 'Upload lecture')}
            </button>
            <button className="btn btn-ghost" style={{ borderRadius: 9999 }} onClick={() => nav('/subjects?new=1')}>
              <Icon name="plus" size={17} /> {t('Добавить предмет', 'Add subject')}
            </button>
            {last && (
              <button className="btn btn-soft" onClick={() => nav(`/lectures/${last.id}`)}>
                {t('Продолжить:', 'Continue:')} {last.title.slice(0, 22)}
              </button>
            )}
          </div>
        </div>
        <FoxMascot className="deco-r" style={{ width: 'clamp(130px, 18vw, 195px)', right: 16, bottom: 4 }} />
        <StudentBoy3D className="hide-m" style={{ position: 'absolute', right: 'clamp(185px, 23vw, 265px)', bottom: -6, width: 112 }} />
        <GraduationCapArt className="hide-m" style={{ position: 'absolute', right: 'clamp(150px, 19vw, 220px)', top: 14, width: 64 }} />
      </div>

      <div className="grid g4" style={{ marginBottom: 22 }}>
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="card stat hover dash-anim">
            <img
              src={s.img}
              alt={s.label}
              style={{ position: 'absolute', right: 14, top: 12, width: 52, height: 52, objectFit: 'contain' }}
            />
            <div className="num">{s.val}</div>
            <div className="lbl">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Achievements Showcase Row on Dashboard */}
      <div className="card dash-anim" style={{ marginBottom: 22 }}>
        <div className="row spread" style={{ marginBottom: 14 }}>
          <div className="row" style={{ gap: 10 }}>
            <h3 style={{ margin: 0 }}>{t('Ваши достижения', 'Your Achievements')}</h3>
            <span className="badge ok">
              {achievements.filter((a) => a.unlocked).length} / {achievements.length}
            </span>
          </div>
          <Link to="/progress" className="btn btn-ghost btn-sm">
            {t('Вся статистика', 'Full progress')}
          </Link>
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 12 }}>
          {achievements.map((b) => (
            <Link
              key={b.title}
              to="/progress"
              className="card"
              style={{
                boxShadow: b.unlocked ? 'var(--shadow-sm)' : 'none',
                textAlign: 'center',
                padding: '12px 10px',
                borderRadius: 18,
                background: b.unlocked ? 'color-mix(in srgb, var(--color-marigold) 22%, var(--card))' : 'var(--card-2)',
                borderColor: b.unlocked ? 'rgba(230, 184, 0, 0.45)' : 'var(--line)',
              }}
              onMouseEnter={(e) => {
                const img = e.currentTarget.querySelector('img');
                if (img) animate(img, { scale: [1, 1.14, 1.05], rotate: [0, -5, 5, 0], duration: 460 });
              }}
              onMouseLeave={(e) => {
                const img = e.currentTarget.querySelector('img');
                if (img) animate(img, { scale: 1, rotate: 0, duration: 240 });
              }}
            >
              <img
                src={b.img}
                alt={b.title}
                style={{
                  width: 68,
                  height: 68,
                  margin: '0 auto 6px',
                  objectFit: 'contain',
                  filter: b.unlocked ? 'drop-shadow(0 6px 12px rgba(230, 160, 0, 0.25))' : 'grayscale(1) opacity(0.42)',
                }}
              />
              <div className="sm" style={{ fontWeight: 700, opacity: b.unlocked ? 1 : 0.55 }}>
                {b.title}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid g2">
        <div className="card dash-anim">
          <div className="row spread" style={{ marginBottom: 10 }}>
            <h3 style={{ margin: 0 }}>{t('Фокус на сегодня', 'Today’s Focus')}</h3>
            <Calendar3D style={{ width: 46 }} />
          </div>
          {today.length === 0 && due === 0 && (
            <p className="muted">
              {t('На сегодня задач нет. Создайте расписание подготовки в разделе «План».', 'No tasks scheduled today. Create a study schedule in “Study plan”.')}
            </p>
          )}
          {today.map((x) => (
            <div key={x.id} className="list-row">
              <span className={`badge ${x.done ? 'ok' : ''}`}>{x.done ? '✓' : '•'}</span>
              <span className="grow">{x.title}</span>
            </div>
          ))}
          {due > 0 && (
            <div className="list-row">
              <span className="badge warn">{due}</span>
              <span className="grow">{t('карточек ждут повторения (SM-2)', 'flashcards due for review (SM-2)')}</span>
              <Link to="/flashcards" className="btn btn-soft btn-sm">{t('Учить', 'Study')}</Link>
            </div>
          )}
          <div className="row" style={{ marginTop: 14 }}>
            <Link to="/study-plan" className="btn btn-ghost btn-sm">{t('Открыть план подготовки', 'Open study plan')}</Link>
            <Link to="/notes" className="btn btn-ghost btn-sm">{t('Все конспекты', 'All notes')}</Link>
          </div>
        </div>

        <div className="card dash-anim">
          <div className="row spread" style={{ marginBottom: 10 }}>
            <div className="row"><h3 style={{ margin: 0 }}>{t('Темы для повторения', 'Topics to Review')}</h3><Bulb style={{ width: 32 }} /></div>
            <BookStack style={{ width: 52 }} />
          </div>
          {weak.length === 0 ? (
            <p className="muted" style={{ marginTop: 6 }}>
              {t('Пройдите тренировочный или экзаменационный тест — здесь появятся лекции, которым стоит уделить внимание.', 'Take a practice or exam quiz — lectures that need extra review will appear here.')}
            </p>
          ) : (
            weak.map((w) => (
              <Link key={w.lecture.id} to={`/lectures/${w.lecture.id}`} className="list-row">
                <span className="grow trunc">{w.lecture.title}</span>
                <span className="badge bad">{w.score}%</span>
              </Link>
            ))
          )}
        </div>

        <div className="card dash-anim">
          <div className="row spread" style={{ marginBottom: 10 }}>
            <h3 style={{ margin: 0 }}>{t('Последние результаты тестов', 'Recent Quiz Results')}</h3>
            <Target3D style={{ width: 44 }} />
          </div>
          {data.attempts.length === 0 ? (
            <p className="muted">{t('Тестов пока нет. Откройте любую лекцию и сгенерируйте тест.', 'No quizzes taken yet. Open any lecture to generate a quiz.')}</p>
          ) : (
            data.attempts.slice(0, 5).map((a) => {
              const q = data.quizzes.find((x) => x.id === a.quizId);
              const pct = Math.round((a.score / Math.max(a.total, 1)) * 100);
              return (
                <div key={a.id} className="list-row">
                  <span className="grow trunc">
                    {q?.title || t('Тест', 'Quiz')}
                    <br />
                    <span className="muted sm">{fmtDateTime(a.date, lang)}</span>
                  </span>
                  <span className={`badge ${pct >= 70 ? 'ok' : pct >= 50 ? 'warn' : 'bad'}`}>
                    {a.score}/{a.total} ({pct}%)
                  </span>
                </div>
              );
            })
          )}
        </div>

        <div className="card dash-anim">
          <div className="row spread" style={{ marginBottom: 10 }}>
            <h3 style={{ margin: 0 }}>{t('Журнал активности', 'Study Activity Log')}</h3>
            <OpenBook style={{ width: 64 }} />
          </div>
          {data.activity.length === 0 ? (
            <Empty
              title={t('Пока пусто', 'Nothing yet')}
              text={t('Загрузите первую лекцию — и здесь появится хроника вашей учёбы.', 'Upload your first lecture to see your study timeline here.')}
            />
          ) : (
            data.activity.slice(0, 6).map((a) => (
              <div key={a.id} className="list-row">
                <span className="grow">{a.text}</span>
                <span className="muted sm">{fmtDateTime(a.ts, lang)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
