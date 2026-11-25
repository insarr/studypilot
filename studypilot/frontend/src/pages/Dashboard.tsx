import { Link, useNavigate } from 'react-router-dom';
import { useStore, useT, todayStr } from '../store';
import { Icon } from '../components/Icon';
import { daysBetween, dueCards, fmtDate, nextExam, overallProgress, streak, weakLectures } from '../lib';

const art = {
  data: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=85',
  design: 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=900&q=85',
  science: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=900&q=85',
};

export default function Dashboard() {
  const t = useT();
  const nav = useNavigate();
  const { user, data, lang } = useStore();
  const exam = nextExam(data);
  const progress = overallProgress(data);
  const weak = weakLectures(data);
  const due = dueCards(data).length;
  const today = data.tasks.filter((x) => x.date === todayStr());
  const hour = new Date().getHours();
  const greet = hour < 6 ? t('Доброй ночи', 'Good night') : hour < 12 ? t('Доброе утро', 'Good morning') : hour < 18 ? t('Добрый день', 'Good afternoon') : t('Добрый вечер', 'Good evening');
  const latest = [...data.lectures].reverse().slice(0, 3);
  const firstName = (user?.name || '').split(' ')[0] || t('студент', 'there');
  const stats = [
    { label: t('Предметы', 'Subjects'), value: data.subjects.length, note: t('В вашей библиотеке', 'In your workspace'), icon: 'folder' },
    { label: t('Лекции', 'Lectures'), value: data.lectures.length, note: t('Материалы загружены', 'Materials uploaded'), icon: 'file' },
    { label: t('Общий прогресс', 'Learning progress'), value: `${progress}%`, note: t('По всем предметам', 'Across all subjects'), icon: 'chart' },
    { label: t('Серия занятий', 'Study streak'), value: streak(data), note: t('Дней подряд', 'Consecutive days'), icon: 'star' },
  ];

  return <div className="premium-dashboard">
    <div className="dash-heading">
      <div><div className="eyebrow">{new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}</div><h1>{greet}, {firstName}.</h1><p>{t('Ваше учебное пространство. Продолжайте с того места, где остановились.', 'Your learning workspace. Pick up where you left off.')}</p></div>
      <button className="btn btn-primary" onClick={() => nav('/lectures?new=1')}><Icon name="upload" size={16}/>{t('Загрузить материал', 'Upload material')}</button>
    </div>

    <section className="dash-feature">
      <div className="feature-copy">
        <span className="feature-kicker">STUDYPILOT / LEARNING OVERVIEW</span>
        <h2>{t('Учитесь осознанно. Запоминайте надолго.', 'Learn with intention. Remember for longer.')}</h2>
        <p>{exam ? t(`Следующая цель — ${exam.name}. До экзамена ${daysBetween(todayStr(), exam.examDate!)} дн.`, `Your next milestone is ${exam.name}. ${daysBetween(todayStr(), exam.examDate!)} days until the exam.`) : t('Соберите лекции в одном месте и превратите их в понятный план обучения.', 'Bring your lectures together and turn them into a clear study plan.')}</p>
        <div className="feature-actions"><button className="btn btn-primary" onClick={() => nav('/progress')}>{t('Посмотреть прогресс', 'View progress')}<Icon name="back" size={15}/></button><button className="btn feature-secondary" onClick={() => nav('/study-plan')}>{t('План обучения', 'Study plan')}</button></div>
      </div>
      <div className="feature-art" role="img" aria-label="Abstract scientific data visualization"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-core"><span>SP</span></div><div className="art-label label-top">KNOWLEDGE<br/>SYSTEM</div><div className="art-label label-bottom">01 — 04 / FOCUS</div></div>
    </section>

    <section className="dash-stats">{stats.map((s) => <div className="dash-stat" key={s.label}><div className="stat-top"><span>{s.label}</span><Icon name={s.icon} size={17}/></div><strong>{s.value}</strong><small>{s.note}</small></div>)}</section>

    <div className="dash-section-title"><div><span className="eyebrow">YOUR WORKSPACE</span><h2>{t('Мои предметы', 'Your subjects')}</h2></div><Link to="/subjects" className="text-link">{t('Все предметы', 'All subjects')} <Icon name="back" size={14}/></Link></div>
    <section className="subject-showcase">
      {data.subjects.length === 0 ? <div className="dash-empty"><div className="empty-mark"><Icon name="folder" size={22}/></div><h3>{t('Начните с первого предмета', 'Start with your first subject')}</h3><p>{t('Создайте предмет, чтобы организовать лекции, тесты и заметки.', 'Create a subject to organize lectures, quizzes and notes.')}</p><button className="btn btn-primary" onClick={() => nav('/subjects?new=1')}>{t('Добавить предмет', 'Add subject')}</button></div> : data.subjects.slice(0, 3).map((s, i) => <Link to={`/subjects/${s.id}`} className={`subject-tile subject-tile-${i + 1}`} key={s.id}><div className="subject-image" style={{ backgroundImage: `linear-gradient(180deg,rgba(12,12,12,.05),rgba(12,12,12,.84)),url(${[art.data, art.design, art.science][i % 3]})` }}><span className="subject-index">0{i + 1}</span><div className="subject-meta"><small>{s.examDate ? t('ЭКЗАМЕН', 'EXAM') : t('ПРЕДМЕТ', 'SUBJECT')}</small><h3>{s.name}</h3><span>{s.examDate ? fmtDate(s.examDate, lang) : t('Открыть предмет', 'Open subject')}</span></div></div></Link>)}
      {data.subjects.length > 0 && <button className="subject-add" onClick={() => nav('/subjects?new=1')}><span><Icon name="plus" size={20}/></span>{t('Добавить предмет', 'Add subject')}</button>}
    </section>

    <div className="dash-lower-grid">
      <section className="dash-panel"><div className="panel-heading"><div><span className="eyebrow">CONTINUE LEARNING</span><h3>{t('Недавние лекции', 'Recent lectures')}</h3></div><Link to="/lectures" className="text-link">{t('Все', 'View all')} <Icon name="back" size={13}/></Link></div>
        {latest.length === 0 ? <p className="muted panel-empty">{t('Загрузите первую лекцию, чтобы она появилась здесь.', 'Upload your first lecture to see it here.')}</p> : latest.map((l, i) => <Link to={`/lectures/${l.id}`} className="lecture-line" key={l.id}><span className="lecture-file"><Icon name="file" size={18}/></span><span className="lecture-info"><b>{l.title}</b><small>{data.subjects.find(s => s.id === l.subjectId)?.name || t('Без предмета', 'Unassigned')}</small></span><span className="lecture-arrow"><Icon name="back" size={15}/></span></Link>)}
      </section>
      <section className="dash-panel coach-panel"><div className="panel-heading"><div><span className="eyebrow">PERSONAL INSIGHT</span><h3>{t('Фокус на сегодня', 'Today’s focus')}</h3></div><span className="coach-index">01</span></div>
        <div className="focus-number">{today.filter(x => !x.done).length + due}<span> {t('задач', 'items')}</span></div><p>{t('Небольшая регулярная практика помогает лучше закреплять материал.', 'Consistent short sessions help you retain what you learn.')}</p>
        <div className="focus-list">{today.slice(0, 2).map(x => <div className="focus-item" key={x.id}><span className={x.done ? 'focus-check done' : 'focus-check'}>{x.done ? '✓' : ''}</span>{x.title}</div>)}{due > 0 && <div className="focus-item"><span className="focus-check"/>{due} {t('карточек ждут повторения', 'flashcards due for review')}</div>}{today.length === 0 && due === 0 && <div className="focus-item"><span className="focus-check"/>{t('Добавьте задачу в план обучения', 'Add a task to your study plan')}</div>}</div>
        <Link to="/study-plan" className="btn btn-outline-dark">{t('Открыть план', 'Open study plan')} <Icon name="back" size={14}/></Link>
      </section>
    </div>
    {weak.length > 0 && <section className="dash-panel weak-panel"><div className="panel-heading"><div><span className="eyebrow">REVIEW RECOMMENDED</span><h3>{t('Темы для повторения', 'Topics to revisit')}</h3></div><Link to="/mistakes" className="text-link">{t('Работа над ошибками', 'Mistake review')}</Link></div>{weak.slice(0, 3).map(w => <Link className="weak-line" to={`/lectures/${w.lecture.id}`} key={w.lecture.id}><span>{w.lecture.title}</span><span className="weak-score">{w.score}%</span></Link>)}</section>}
  </div>;
}
