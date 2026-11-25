import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { uid, useStore, useT } from '../store';
import { Empty, Modal, PageHead, confirmBox } from '../components/UI';
import { Icon } from '../components/Icon';
import { COLORS, fmtDate, subjectProgress } from '../lib';
import type { Subject } from '../types';

function SubjectForm({ initial, onSave, onClose }: { initial?: Subject; onSave: (s: Subject) => void; onClose: () => void }) {
  const t = useT();
  const [s, setS] = useState<Subject>(initial || { id: uid(), name: '', color: COLORS[0], semester: '', modules: [], description: '', examDate: '' });
  const [mods, setMods] = useState((initial?.modules || []).join(', '));
  const [err, setErr] = useState('');
  return (
    <Modal title={initial ? t('Редактировать предмет', 'Edit subject') : t('Новый предмет', 'New subject')} onClose={onClose}>
      <form className="stack" onSubmit={(e) => {
        e.preventDefault();
        if (!s.name.trim()) return setErr(t('Введите название', 'Enter a name'));
        onSave({ ...s, name: s.name.trim(), modules: mods.split(',').map((x) => x.trim()).filter(Boolean), examDate: s.examDate || undefined });
      }}>
        <div className="field"><label>{t('Название', 'Name')}</label><input className="input" value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} autoFocus /></div>
        <div className="grid g2">
          <div className="field"><label>{t('Семестр', 'Semester')}</label><input className="input" value={s.semester} onChange={(e) => setS({ ...s, semester: e.target.value })} placeholder="1" /></div>
          <div className="field"><label>{t('Дата экзамена', 'Exam date')}</label><input className="input" type="date" value={s.examDate || ''} onChange={(e) => setS({ ...s, examDate: e.target.value })} /></div>
        </div>
        <div className="field"><label>{t('Модули (через запятую)', 'Modules (comma-separated)')}</label><input className="input" value={mods} onChange={(e) => setMods(e.target.value)} placeholder={t('Модуль 1, Модуль 2', 'Module 1, Module 2')} /></div>
        <div className="field"><label>{t('Описание', 'Description')}</label><textarea className="input" value={s.description} onChange={(e) => setS({ ...s, description: e.target.value })} style={{ minHeight: 70 }} /></div>
        <div className="field"><label>{t('Цвет', 'Color')}</label><div className="row">{COLORS.map((c) => <button type="button" key={c} aria-label={c} onClick={() => setS({ ...s, color: c })} style={{ width: 30, height: 30, borderRadius: 10, background: c, outline: s.color === c ? '3px solid var(--text)' : 'none', outlineOffset: 2 }} />)}</div></div>
        {err && <div className="badge bad">{err}</div>}
        <button className="btn btn-primary">{t('Сохранить', 'Save')}</button>
      </form>
    </Modal>
  );
}

export function Subjects() {
  const t = useT();
  const nav = useNavigate();
  const { data, mutate, log, lang, toast } = useStore();
  const [sp, setSp] = useSearchParams();
  const [edit, setEdit] = useState<Subject | 'new' | null>(sp.get('new') ? 'new' : null);
  useEffect(() => { if (sp.get('new')) setSp({}, { replace: true }); }, [sp, setSp]);

  const save = (s: Subject) => {
    const isNew = !data.subjects.find((x) => x.id === s.id);
    mutate((d) => { if (isNew) d.subjects.push(s); else d.subjects = d.subjects.map((x) => (x.id === s.id ? s : x)); });
    log(isNew ? t(`Добавлен предмет «${s.name}»`, `Subject “${s.name}” added`) : t(`Обновлён предмет «${s.name}»`, `Subject “${s.name}” updated`));
    toast(t('Сохранено', 'Saved'), 'ok');
    setEdit(null);
  };

  return (
    <>
      <PageHead title={t('Предметы', 'Subjects')} sub={t('Материалы хранятся по предметам, семестрам и модулям.', 'Materials are organized by subject, semester and module.')} actions={<button className="btn btn-primary" onClick={() => setEdit('new')}><Icon name="plus" size={17} />{t('Добавить предмет', 'Add subject')}</button>} />
      {data.subjects.length === 0 ? (
        <div className="card"><Empty title={t('Предметов пока нет', 'No subjects yet')} text={t('Создайте первый предмет, чтобы добавлять лекции.', 'Create your first subject to add lectures.')} action={<button className="btn btn-primary" onClick={() => setEdit('new')}>{t('Создать предмет', 'Create subject')}</button>} /></div>
      ) : (
        <div className="grid g3">
          {data.subjects.map((s) => {
            const n = data.lectures.filter((l) => l.subjectId === s.id).length;
            const p = subjectProgress(data, s.id);
            return (
              <div key={s.id} className="card hover" style={{ borderTop: `5px solid ${s.color}` }} onClick={() => nav(`/subjects/${s.id}`)}>
                <div className="row spread"><h3 className="trunc" style={{ margin: 0 }}>{s.name}</h3>{s.semester && <span className="badge">{t('Сем.', 'Sem.')} {s.semester}</span>}</div>
                <p className="muted sm" style={{ margin: '6px 0 12px', minHeight: 20 }}>{s.description || `${n} ${t('лекций', 'lectures')}`}</p>
                <div className="bar"><i style={{ width: `${p}%`, background: s.color }} /></div>
                <div className="row spread sm muted" style={{ marginTop: 8 }}><span>{n} {t('лекций', 'lectures')} · {p}%</span>{s.examDate && <span>🎓 {fmtDate(s.examDate, lang)}</span>}</div>
              </div>
            );
          })}
        </div>
      )}
      {edit && <SubjectForm initial={edit === 'new' ? undefined : edit} onSave={save} onClose={() => setEdit(null)} />}
    </>
  );
}

export function SubjectDetail() {
  const t = useT();
  const { id } = useParams();
  const nav = useNavigate();
  const { data, mutate, log, lang, toast } = useStore();
  const [edit, setEdit] = useState(false);
  const s = data.subjects.find((x) => x.id === id);
  if (!s) return <div className="card"><Empty title={t('Предмет не найден', 'Subject not found')} action={<Link to="/subjects" className="btn btn-primary">{t('К предметам', 'Back to subjects')}</Link>} /></div>;
  const lectures = data.lectures.filter((l) => l.subjectId === s.id);
  const mods = Array.from(new Set([...s.modules, ...lectures.map((l) => l.module).filter(Boolean)]));
  const groups: [string, typeof lectures][] = [...mods.map((m) => [m, lectures.filter((l) => l.module === m)] as [string, typeof lectures]), [t('Без модуля', 'No module'), lectures.filter((l) => !l.module)]];

  const del = () => {
    if (!confirmBox(t('Удалить предмет и все его лекции, тесты и карточки?', 'Delete this subject with all its lectures, quizzes and cards?'))) return;
    mutate((d) => {
      const ids = d.lectures.filter((l) => l.subjectId === s.id).map((l) => l.id);
      d.lectures = d.lectures.filter((l) => l.subjectId !== s.id);
      d.quizzes = d.quizzes.filter((q) => !ids.includes(q.lectureId));
      d.attempts = d.attempts.filter((a) => !ids.includes(a.lectureId));
      d.cards = d.cards.filter((c) => !ids.includes(c.lectureId));
      d.mistakes = d.mistakes.filter((m) => !ids.includes(m.lectureId));
      d.tasks = d.tasks.filter((x) => x.subjectId !== s.id);
      d.subjects = d.subjects.filter((x) => x.id !== s.id);
    });
    log(t(`Удалён предмет «${s.name}»`, `Subject “${s.name}” deleted`));
    nav('/subjects');
  };

  return (
    <>
      <PageHead crumbs={<><Link to="/subjects">{t('Предметы', 'Subjects')}</Link> / <span>{s.name}</span></>} title={s.name}
        sub={[s.semester && `${t('Семестр', 'Semester')} ${s.semester}`, s.examDate && `${t('Экзамен', 'Exam')}: ${fmtDate(s.examDate, lang)}`, s.description].filter(Boolean).join(' · ')}
        actions={<>
          <Link to={`/lectures?new=1&subject=${s.id}`} className="btn btn-primary"><Icon name="upload" size={17} />{t('Добавить лекцию', 'Add lecture')}</Link>
          <button className="btn btn-ghost" onClick={() => setEdit(true)}><Icon name="edit" size={16} />{t('Изменить', 'Edit')}</button>
          <button className="btn btn-danger" onClick={del}><Icon name="trash" size={16} /></button>
        </>} />
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="row spread"><b>{t('Прогресс по предмету', 'Subject progress')}</b><b>{subjectProgress(data, s.id)}%</b></div>
        <div className="bar" style={{ marginTop: 8 }}><i style={{ width: `${subjectProgress(data, s.id)}%`, background: s.color }} /></div>
      </div>
      {lectures.length === 0 ? <div className="card"><Empty title={t('Лекций пока нет', 'No lectures yet')} action={<Link to={`/lectures?new=1&subject=${s.id}`} className="btn btn-primary">{t('Загрузить лекцию', 'Upload lecture')}</Link>} /></div> : groups.filter(([, ls]) => ls.length).map(([m, ls]) => (
        <div key={m} className="card" style={{ marginBottom: 16 }}>
          <h3>📁 {m}</h3>
          {ls.map((l) => <Link key={l.id} to={`/lectures/${l.id}`} className="list-row"><Icon name="file" size={18} /><span className="grow trunc">{l.title}</span>{l.notes && <span className="badge ok">{t('конспект', 'notes')}</span>}<span className="muted sm">{fmtDate(l.createdAt, lang)}</span></Link>)}
        </div>
      ))}
      {edit && <SubjectForm initial={s} onClose={() => setEdit(false)} onSave={(x) => { mutate((d) => { d.subjects = d.subjects.map((y) => (y.id === x.id ? x : y)); }); toast(t('Сохранено', 'Saved'), 'ok'); setEdit(false); }} />}
    </>
  );
}
