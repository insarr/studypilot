import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { uid, useStore, useT } from '../store';
import { Empty, Modal, PageHead, Spinner, confirmBox } from '../components/UI';
import { Icon } from '../components/Icon';
import { InlineMd, Md } from '../components/Md';
import { fmtDate, lectureScore } from '../lib';
import { generateCards, generateNotes } from '../actions';
import { QuizMaker } from './Tests';
import { NotesView } from './Notes';
import type { Lecture } from '../types';

const ACCEPT = '.pdf,.docx,.pptx,.txt,.md';

function UploadModal({ onClose, presetSubject }: { onClose: () => void; presetSubject?: string }) {
  const t = useT();
  const nav = useNavigate();
  const { data, mutate, log, toast } = useStore();
  const [mode, setMode] = useState<'file' | 'text'>('file');
  const [subjectId, setSubjectId] = useState(presetSubject || data.subjects[0]?.id || '');
  const [module, setModule] = useState('');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [kind, setKind] = useState('text');
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [err, setErr] = useState('');
  const [auto, setAuto] = useState(true);
  const input = useRef<HTMLInputElement>(null);
  const subject = data.subjects.find((s) => s.id === subjectId);

  const pick = async (f: File | undefined) => {
    if (!f) return;
    setErr('');
    const ext = f.name.toLowerCase().split('.').pop() || '';
    if (!['pdf', 'docx', 'pptx', 'txt', 'md'].includes(ext)) return setErr(t('Формат не поддерживается. Выберите PDF, DOCX, PPTX или TXT.', 'Unsupported format. Choose PDF, DOCX, PPTX or TXT.'));
    if (f.size > 25 * 1024 * 1024) return setErr(t('Файл больше 25 МБ', 'File is larger than 25 MB'));
    setBusy(true);
    try {
      const r = await api.upload(f);
      setText(r.text);
      setFileName(r.name);
      setKind(r.kind);
      if (!title) setTitle(r.name.replace(/\.[^.]+$/, ''));
      toast(t(`Текст извлечён: ${r.chars} символов`, `Text extracted: ${r.chars} characters`), 'ok');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setErr('');
    if (!subjectId) return setErr(t('Сначала создайте предмет', 'Create a subject first'));
    if (text.trim().length < 30) return setErr(t('Текста слишком мало (минимум 30 символов)', 'Text is too short (30 characters minimum)'));
    const l: Lecture = { id: uid(), subjectId, module: module.trim(), title: title.trim() || t('Без названия', 'Untitled'), text: text.trim(), kind, fileName: fileName || undefined, createdAt: new Date().toISOString(), favorite: false, chat: [] };
    mutate((d) => {
      d.lectures.push(l);
      if (l.module && subject && !subject.modules.includes(l.module)) { const s = d.subjects.find((x) => x.id === subjectId); s?.modules.push(l.module); }
    });
    log(t(`Загружена лекция «${l.title}»`, `Lecture “${l.title}” uploaded`));
    toast(t('Лекция сохранена', 'Lecture saved'), 'ok');
    if (auto) {
      setBusy(true);
      await generateNotes(l.id);
      setBusy(false);
    }
    onClose();
    nav(`/lectures/${l.id}`);
  };

  if (!data.subjects.length) return (
    <Modal title={t('Загрузить лекцию', 'Upload lecture')} onClose={onClose}>
      <Empty title={t('Нужен предмет', 'Subject required')} text={t('Сначала создайте предмет, к которому относится лекция.', 'Create a subject for the lecture first.')} action={<Link to="/subjects?new=1" className="btn btn-primary" onClick={onClose}>{t('Создать предмет', 'Create subject')}</Link>} />
    </Modal>
  );

  return (
    <Modal title={t('Загрузить лекцию', 'Upload lecture')} onClose={onClose}>
      <div className="stack">
        <div className="tabs"><button className={`tab ${mode === 'file' ? 'active' : ''}`} onClick={() => setMode('file')}>{t('Файл', 'File')}</button><button className={`tab ${mode === 'text' ? 'active' : ''}`} onClick={() => setMode('text')}>{t('Вставить текст', 'Paste text')}</button></div>
        {mode === 'file' ? (
          <div className={`drop ${over ? 'over' : ''}`} onClick={() => input.current?.click()} onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files[0]); }} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && input.current?.click()}>
            <input ref={input} type="file" accept={ACCEPT} hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
            {busy ? <Spinner label={t('Извлекаем текст…', 'Extracting text…')} /> : <>
              <Icon name="upload" size={34} />
              <b>{fileName || t('Перетащите файл сюда или нажмите', 'Drop a file here or click')}</b>
              <div className="muted sm">PDF · DOCX · PPTX · TXT · {t('до 25 МБ', 'up to 25 MB')}</div>
              {fileName && <div className="badge ok" style={{ marginTop: 8 }}>✓ {text.length} {t('символов', 'chars')}</div>}
            </>}
          </div>
        ) : (
          <div className="field"><label>{t('Текст лекции', 'Lecture text')}</label><textarea className="input" value={text} onChange={(e) => { setText(e.target.value); setFileName(''); setKind('text'); }} style={{ minHeight: 160 }} /></div>
        )}
        <div className="field"><label>{t('Название', 'Title')}</label><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="grid g2">
          <div className="field"><label>{t('Предмет', 'Subject')}</label><select className="input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>{data.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div className="field"><label>{t('Модуль', 'Module')}</label><input className="input" list="mods" value={module} onChange={(e) => setModule(e.target.value)} /><datalist id="mods">{subject?.modules.map((m) => <option key={m} value={m} />)}</datalist></div>
        </div>
        <label className="row sm"><input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> {t('Сразу создать конспект', 'Generate notes right away')}</label>
        {err && <div role="alert" className="badge bad" style={{ whiteSpace: 'normal', padding: '8px 12px' }}>{err}</div>}
        <button className="btn btn-primary" disabled={busy} onClick={save}>{busy ? <Spinner label={t('Обработка…', 'Processing…')} /> : t('Сохранить лекцию', 'Save lecture')}</button>
      </div>
    </Modal>
  );
}

export function Lectures() {
  const t = useT();
  const nav = useNavigate();
  const { data, lang } = useStore();
  const [sp, setSp] = useSearchParams();
  const [open, setOpen] = useState(!!sp.get('new'));
  const [preset] = useState(sp.get('subject') || undefined);
  const [q, setQ] = useState('');
  const [sub, setSub] = useState('all');
  const [sort, setSort] = useState('new');
  const [fav, setFav] = useState(false);
  useEffect(() => { if (sp.get('new')) setSp({}, { replace: true }); }, [sp, setSp]);

  let list = data.lectures.filter((l) => (sub === 'all' || l.subjectId === sub) && (!fav || l.favorite) && (!q || l.title.toLowerCase().includes(q.toLowerCase()) || l.text.toLowerCase().includes(q.toLowerCase())));
  list = [...list].sort((a, b) => (sort === 'name' ? a.title.localeCompare(b.title) : sort === 'old' ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt)));

  return (
    <>
      <PageHead title={t('Лекции', 'Lectures')} sub={t('Загружайте PDF, DOCX, PPTX, TXT или вставляйте текст.', 'Upload PDF, DOCX, PPTX, TXT or paste text.')} actions={<button className="btn btn-primary" onClick={() => setOpen(true)}><Icon name="upload" size={17} />{t('Загрузить лекцию', 'Upload lecture')}</button>} />
      <div className="row" style={{ marginBottom: 16 }}>
        <input className="input" style={{ maxWidth: 280 }} placeholder={t('Поиск…', 'Search…')} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input" style={{ maxWidth: 200 }} value={sub} onChange={(e) => setSub(e.target.value)}><option value="all">{t('Все предметы', 'All subjects')}</option>{data.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <select className="input" style={{ maxWidth: 180 }} value={sort} onChange={(e) => setSort(e.target.value)}><option value="new">{t('Сначала новые', 'Newest')}</option><option value="old">{t('Сначала старые', 'Oldest')}</option><option value="name">{t('По названию', 'By name')}</option></select>
        <button className={`chip ${fav ? 'on' : ''}`} onClick={() => setFav(!fav)}>★ {t('Избранное', 'Favorites')}</button>
      </div>
      {list.length === 0 ? <div className="card"><Empty title={data.lectures.length ? t('Ничего не найдено', 'Nothing found') : t('Лекций пока нет', 'No lectures yet')} text={t('Загрузите первую лекцию — и StudyPilot сделает конспект.', 'Upload your first lecture and StudyPilot will make notes.')} action={<button className="btn btn-primary" onClick={() => setOpen(true)}>{t('Загрузить', 'Upload')}</button>} /></div> : (
        <div className="grid g3">
          {list.map((l) => {
            const s = data.subjects.find((x) => x.id === l.subjectId);
            const sc = lectureScore(data, l.id);
            return (
              <div key={l.id} className="card hover" onClick={() => nav(`/lectures/${l.id}`)} style={{ borderTop: `4px solid ${s?.color || 'var(--accent)'}` }}>
                <div className="row spread"><span className="badge" style={{ background: 'transparent', padding: 0, color: 'var(--muted)' }}>{s?.name}{l.module && ` · ${l.module}`}</span>{l.favorite && <span style={{ color: 'var(--warn)' }}>★</span>}</div>
                <h3 style={{ margin: '6px 0', overflowWrap: 'anywhere' }}>{l.title}</h3>
                <p className="muted sm" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{l.text}</p>
                <div className="row" style={{ marginTop: 10, gap: 6 }}>
                  <span className="badge">{l.kind.toUpperCase()}</span>
                  {l.notes && <span className="badge ok">{t('конспект', 'notes')}</span>}
                  {sc !== null && <span className={`badge ${sc >= 70 ? 'ok' : 'bad'}`}>{sc}%</span>}
                  <span className="muted sm" style={{ marginLeft: 'auto' }}>{fmtDate(l.createdAt, lang)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {open && <UploadModal presetSubject={preset} onClose={() => setOpen(false)} />}
    </>
  );
}

type Tab = 'notes' | 'chat' | 'quiz' | 'cards' | 'text';

export function LectureDetail() {
  const t = useT();
  const { id } = useParams();
  const nav = useNavigate();
  const { data, mutate, log, lang, toast } = useStore();
  const [tab, setTab] = useState<Tab>('notes');
  const [busy, setBusy] = useState('');
  const l = data.lectures.find((x) => x.id === id);
  if (!l) return <div className="card"><Empty title={t('Лекция не найдена', 'Lecture not found')} action={<Link to="/lectures" className="btn btn-primary">{t('К лекциям', 'Back to lectures')}</Link>} /></div>;
  const s = data.subjects.find((x) => x.id === l.subjectId);
  const quizzes = data.quizzes.filter((q) => q.lectureId === l.id);
  const cards = data.cards.filter((c) => c.lectureId === l.id);

  const del = () => {
    if (!confirmBox(t('Удалить лекцию вместе с тестами и карточками?', 'Delete lecture with its quizzes and cards?'))) return;
    mutate((d) => {
      d.lectures = d.lectures.filter((x) => x.id !== l.id);
      d.quizzes = d.quizzes.filter((x) => x.lectureId !== l.id);
      d.attempts = d.attempts.filter((x) => x.lectureId !== l.id);
      d.cards = d.cards.filter((x) => x.lectureId !== l.id);
      d.mistakes = d.mistakes.filter((x) => x.lectureId !== l.id);
    });
    log(t(`Удалена лекция «${l.title}»`, `Lecture “${l.title}” deleted`));
    nav('/lectures');
  };
  const rename = () => {
    const n = window.prompt(t('Новое название', 'New title'), l.title);
    if (n && n.trim()) mutate((d) => { const x = d.lectures.find((y) => y.id === l.id); if (x) x.title = n.trim(); });
  };

  return (
    <>
      <PageHead crumbs={<><Link to="/lectures">{t('Лекции', 'Lectures')}</Link> / {s && <Link to={`/subjects/${s.id}`}>{s.name}</Link>}</>} title={l.title}
        sub={`${s?.name || ''}${l.module ? ` · ${l.module}` : ''} · ${l.kind.toUpperCase()} · ${l.text.length} ${t('символов', 'chars')} · ${fmtDate(l.createdAt, lang)}`}
        actions={<>
          <button className="btn btn-ghost" onClick={() => mutate((d) => { const x = d.lectures.find((y) => y.id === l.id); if (x) x.favorite = !x.favorite; })}>{l.favorite ? '★' : '☆'}</button>
          <button className="btn btn-ghost" onClick={rename}><Icon name="edit" size={16} /></button>
          <button className="btn btn-danger" onClick={del}><Icon name="trash" size={16} /></button>
        </>} />
      <div className="tabs" style={{ marginBottom: 18 }}>
        {([['notes', t('Конспект', 'Notes')], ['chat', t('Чат с AI', 'AI chat')], ['quiz', `${t('Тесты', 'Quizzes')} (${quizzes.length})`], ['cards', `${t('Карточки', 'Cards')} (${cards.length})`], ['text', t('Исходный текст', 'Source text')]] as [Tab, string][]).map(([k, label]) => (
          <button key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>

      {tab === 'notes' && (l.notes ? <NotesView lecture={l} /> : (
        <div className="card"><Empty title={t('Конспекта ещё нет', 'No notes yet')} text={t('AI составит краткий и подробный конспект, термины, mind map и темы для экзамена.', 'AI will build short & detailed notes, terms, a mind map and exam topics.')} action={<button className="btn btn-primary" disabled={busy === 'n'} onClick={async () => { setBusy('n'); await generateNotes(l.id); setBusy(''); }}>{busy === 'n' ? <Spinner label={t('Создаём…', 'Generating…')} /> : <><Icon name="sparkle" size={16} />{t('Создать конспект', 'Generate notes')}</>}</button>} /></div>
      ))}

      {tab === 'chat' && <Chat lecture={l} />}

      {tab === 'quiz' && (
        <div className="stack">
          <QuizMaker lectureId={l.id} />
          {quizzes.map((q) => {
            const at = data.attempts.filter((a) => a.quizId === q.id);
            return <div key={q.id} className="card row spread"><div><b>{q.title}</b><div className="muted sm">{q.questions.length} {t('вопросов', 'questions')} · {fmtDate(q.createdAt, lang)}{at.length ? ` · ${t('лучший', 'best')}: ${Math.max(...at.map((a) => Math.round((a.score / a.total) * 100)))}%` : ''}</div></div><Link to={`/tests/${q.id}`} className="btn btn-primary btn-sm">{t('Пройти', 'Take')}</Link></div>;
          })}
        </div>
      )}

      {tab === 'cards' && (
        <div className="stack">
          <div className="card row spread">
            <div><b>{t('Карточки для запоминания', 'Flashcards')}</b><div className="muted sm">{t('Интервальное повторение по алгоритму SM-2', 'Spaced repetition (SM-2)')}</div></div>
            <div className="row">
              <button className="btn btn-primary" disabled={busy === 'c'} onClick={async () => { setBusy('c'); await generateCards(l.id); setBusy(''); }}>{busy === 'c' ? <Spinner label={t('Создаём…', 'Generating…')} /> : <><Icon name="sparkle" size={16} />{t('Создать карточки', 'Generate cards')}</>}</button>
              {cards.length > 0 && <Link to={`/flashcards?lecture=${l.id}`} className="btn btn-ghost">{t('Учить', 'Study')}</Link>}
            </div>
          </div>
          {cards.map((c) => <div key={c.id} className="card"><b><InlineMd text={c.front} /></b><p className="muted"><InlineMd text={c.back} /></p></div>)}
        </div>
      )}

      {tab === 'text' && <div className="card"><div className="row spread" style={{ marginBottom: 10 }}><b>{t('Исходный текст', 'Source text')}</b><button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard?.writeText(l.text); toast(t('Скопировано', 'Copied'), 'ok'); }}>{t('Копировать', 'Copy')}</button></div><div className="md-p" style={{ maxHeight: 560, overflow: 'auto', overflowWrap: 'anywhere' }}>{l.text}</div></div>}
    </>
  );
}

function Chat({ lecture }: { lecture: Lecture }) {
  const t = useT();
  const { mutate, lang, toast } = useStore();
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [lecture.chat.length, busy]);

  const presets = [t('Объясни эту тему простыми словами', 'Explain this topic in simple words'), t('Дай пример', 'Give an example'), t('Сравни основные понятия', 'Compare the main concepts'), t('Какие формулы здесь важны?', 'Which formulas are important here?'), t('Что я могу не понять на экзамене?', 'What might I fail to understand at the exam?')];

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || busy) return;
    setQ('');
    setBusy(true);
    mutate((d) => { d.lectures.find((x) => x.id === lecture.id)?.chat.push({ role: 'user', text: question }); });
    try {
      const r = await api.ask(lecture.text, question, lang);
      const a = r.data;
      mutate((d) => { d.lectures.find((x) => x.id === lecture.id)?.chat.push({ role: 'ai', text: a.answer, quotes: a.quotes, found: a.found }); });
      if (r.warning) toast(r.warning, 'info');
    } catch (e: any) {
      toast(e.message, 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card stack">
      <div className="muted sm">🔒 {t('AI отвечает только по этой лекции. Если ответа в ней нет — он так и скажет.', 'AI answers only from this lecture. If the answer is not there, it will say so.')}</div>
      <div className="chips">{presets.map((p) => <button key={p} className="chip" onClick={() => send(p)} disabled={busy}>{p}</button>)}</div>
      <div className="chat">
        {lecture.chat.length === 0 && <div className="muted" style={{ textAlign: 'center', padding: 20 }}>{t('Задайте вопрос по лекции 👇', 'Ask a question about the lecture 👇')}</div>}
        {lecture.chat.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            {m.role === 'ai' ? <Md text={m.text} simplifiable={false} /> : m.text}
            {m.found === false && <div className="badge warn" style={{ marginTop: 6 }}>{t('Нет в лекции', 'Not in lecture')}</div>}
            {m.quotes?.map((qt, j) => <blockquote key={j}>“<InlineMd text={qt} />”</blockquote>)}
          </div>
        ))}
        {busy && <div className="msg ai"><Spinner label={t('Думаю…', 'Thinking…')} /></div>}
        <div ref={end} />
      </div>
      <form className="row" style={{ flexWrap: 'nowrap' }} onSubmit={(e) => { e.preventDefault(); send(q); }}>
        <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Ваш вопрос по лекции…', 'Your question about the lecture…')} />
        <button className="btn btn-primary btn-icon" disabled={busy || !q.trim()} aria-label="Send"><Icon name="send" size={17} /></button>
      </form>
      {lecture.chat.length > 0 && <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => mutate((d) => { const x = d.lectures.find((y) => y.id === lecture.id); if (x) x.chat = []; })}>{t('Очистить чат', 'Clear chat')}</button>}
    </div>
  );
}
// Md re-exported for convenience
export { Md };
