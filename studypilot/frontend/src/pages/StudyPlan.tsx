import { useState } from 'react';
import { Link } from 'react-router-dom';
import { todayStr, uid, useStore, useT } from '../store';
import { Empty, PageHead, confirmBox } from '../components/UI';
import { Icon } from '../components/Icon';
import { addDays, buildPlan, daysBetween, fmtDate } from '../lib';
import type { Task } from '../types';

export default function StudyPlan() {
  const t = useT();
  const { data, mutate, log, lang, toast } = useStore();
  const [subjectId, setSubjectId] = useState(data.subjects[0]?.id || '');
  const subject = data.subjects.find((s) => s.id === subjectId);
  const [date, setDate] = useState(subject?.examDate || '');
  const [perDay, setPerDay] = useState(2);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(todayStr());

  const pick = (id: string) => { setSubjectId(id); setDate(data.subjects.find((s) => s.id === id)?.examDate || ''); };

  const generate = () => {
    if (!subject) return;
    if (!date || date <= todayStr()) return toast(t('Выберите дату экзамена в будущем', 'Pick a future exam date'), 'err');
    const lectures = data.lectures.filter((l) => l.subjectId === subject.id);
    if (!lectures.length) return toast(t('Сначала добавьте лекции к этому предмету', 'Add lectures to this subject first'), 'err');
    if (data.tasks.some((x) => x.subjectId === subject.id) && !confirmBox(t('Заменить существующий план этого предмета?', 'Replace the existing plan for this subject?'))) return;
    const tasks = buildPlan(subject, lectures, date, perDay);
    mutate((d) => {
      d.tasks = [...d.tasks.filter((x) => x.subjectId !== subject.id), ...tasks];
      const s = d.subjects.find((x) => x.id === subject.id);
      if (s) s.examDate = date;
    });
    log(t(`Создан план подготовки: «${subject.name}»`, `Study plan created: “${subject.name}”`));
    toast(t(`План готов: ${tasks.length} задач`, `Plan ready: ${tasks.length} tasks`), 'ok');
  };

  const toggle = (id: string) => mutate((d) => { const x = d.tasks.find((y) => y.id === id); if (x) x.done = !x.done; });
  const addTask = () => {
    if (!newTitle.trim() || !subjectId) return;
    const task: Task = { id: uid(), subjectId, title: newTitle.trim(), date: newDate, done: false, kind: 'study' };
    mutate((d) => { d.tasks.push(task); });
    setNewTitle('');
  };

  const tasks = data.tasks.filter((x) => !subjectId || x.subjectId === subjectId);
  const byDay = tasks.reduce<Record<string, Task[]>>((m, x) => ((m[x.date] ||= []).push(x), m), {});
  const days = Object.keys(byDay).sort();
  const done = tasks.filter((x) => x.done).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const icon: Record<string, string> = { study: '📖', review: '🔁', test: '📝', cards: '🃏' };

  if (!data.subjects.length) return <><PageHead title={t('План подготовки', 'Study plan')} /><div className="card"><Empty title={t('Нужен предмет', 'Subject required')} text={t('Создайте предмет с датой экзамена и добавьте лекции.', 'Create a subject with an exam date and add lectures.')} action={<Link to="/subjects?new=1" className="btn btn-primary">{t('Создать предмет', 'Create subject')}</Link>} /></div></>;

  return (
    <>
      <PageHead title={t('План подготовки', 'Study plan')} sub={t('Укажите дату экзамена — получите расписание по дням.', 'Set an exam date — get a day-by-day schedule.')} />
      <div className="card stack" style={{ marginBottom: 18 }}>
        <div className="grid g4">
          <div className="field"><label>{t('Предмет', 'Subject')}</label><select className="input" value={subjectId} onChange={(e) => pick(e.target.value)}>{data.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div className="field"><label>{t('Дата экзамена', 'Exam date')}</label><input className="input" type="date" min={addDays(todayStr(), 1)} value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="field"><label>{t('Тем в день', 'Topics per day')}</label><select className="input" value={perDay} onChange={(e) => setPerDay(Number(e.target.value))}>{[1, 2, 3, 4].map((n) => <option key={n}>{n}</option>)}</select></div>
          <div className="field"><label>&nbsp;</label><button className="btn btn-primary" onClick={generate}><Icon name="sparkle" size={16} />{t('Составить план', 'Build plan')}</button></div>
        </div>
        {date && <span className="muted sm">{t('До экзамена', 'Days to exam')}: {Math.max(0, daysBetween(todayStr(), date))}</span>}
      </div>

      {tasks.length > 0 && (
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="row spread"><b>{t('Выполнено', 'Completed')}: {done}/{tasks.length}</b><b>{pct}%</b></div>
          <div className="bar" style={{ marginTop: 8 }}><i style={{ width: `${pct}%` }} /></div>
        </div>
      )}

      <div className="card row" style={{ marginBottom: 18, flexWrap: 'wrap' }}>
        <input className="input grow" style={{ minWidth: 180 }} value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={t('Своя задача…', 'Custom task…')} onKeyDown={(e) => e.key === 'Enter' && addTask()} />
        <input className="input" type="date" style={{ width: 160 }} value={newDate} onChange={(e) => setNewDate(e.target.value)} />
        <button className="btn btn-soft" onClick={addTask}><Icon name="plus" size={16} />{t('Добавить', 'Add')}</button>
      </div>

      {days.length === 0 ? <div className="card"><Empty title={t('Плана пока нет', 'No plan yet')} text={t('Нажмите «Составить план».', 'Press “Build plan”.')} /></div> : (
        <div className="grid g3">
          {days.map((day) => (
            <div key={day} className={`day ${day === todayStr() ? 'today' : ''}`}>
              <div className="row spread" style={{ marginBottom: 6 }}><b>{fmtDate(day, lang)}</b>{day === todayStr() ? <span className="badge">{t('сегодня', 'today')}</span> : day < todayStr() && byDay[day].some((x) => !x.done) ? <span className="badge bad">{t('просрочено', 'overdue')}</span> : null}</div>
              {byDay[day].map((x) => (
                <div key={x.id} className={`task ${x.done ? 'done' : ''}`}>
                  <button className={`chk ${x.done ? 'on' : ''}`} onClick={() => toggle(x.id)} aria-label="Toggle"><Icon name="check" size={13} /></button>
                  <span className="grow" style={{ overflowWrap: 'anywhere' }}>{icon[x.kind]} {x.lectureId ? <Link to={`/lectures/${x.lectureId}`} style={{ color: 'inherit' }}>{x.title}</Link> : x.title}</span>
                  <button className="btn btn-icon" style={{ width: 24, height: 24, color: 'var(--muted)' }} aria-label="Delete" onClick={() => mutate((d) => { d.tasks = d.tasks.filter((y) => y.id !== x.id); })}><Icon name="x" size={13} /></button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
