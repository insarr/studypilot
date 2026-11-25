import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { uid, useStore, useT } from '../store';
import { Empty, PageHead, Spinner, confirmBox } from '../components/UI';
import { Icon } from '../components/Icon';
import { Clock3D, GraduationCapArt, Target3D } from '../components/Deco';
import { InlineMd } from '../components/Md';
import { createQuiz } from '../actions';
import { fmtDateTime, gradeShort } from '../lib';
import type { AnswerRec, QType, Question } from '../types';

export function QuizMaker({ lectureId: fixed }: { lectureId?: string }) {
  const t = useT();
  const nav = useNavigate();
  const { data } = useStore();
  const [lectureId, setLectureId] = useState(fixed || data.lectures[0]?.id || '');
  const [count, setCount] = useState(5);
  const [types, setTypes] = useState<QType[]>(['mcq', 'tf']);
  const [difficulty, setDifficulty] = useState('medium');
  const [busy, setBusy] = useState(false);
  const labels: Record<QType, string> = { mcq: t('Варианты ответа', 'Multiple choice'), tf: t('Верно / неверно', 'True / false'), short: t('Короткий ответ', 'Short answer'), open: t('Открытый вопрос', 'Open question') };
  const toggle = (k: QType) => setTypes((p) => (p.includes(k) ? (p.length > 1 ? p.filter((x) => x !== k) : p) : [...p, k]));

  if (!data.lectures.length) return <div className="card"><Empty title={t('Нет лекций для теста', 'No lectures for a quiz')} action={<Link to="/lectures?new=1" className="btn btn-primary">{t('Загрузить лекцию', 'Upload lecture')}</Link>} /></div>;

  const make = async () => {
    setBusy(true);
    const id = await createQuiz(lectureId, count, types, difficulty);
    setBusy(false);
    if (id) nav(`/tests/${id}`);
  };

  return (
    <div className="card stack">
      <h3 style={{ margin: 0 }}>✨ {t('Сделать тест', 'Create a quiz')}</h3>
      {!fixed && <div className="field"><label>{t('Лекция', 'Lecture')}</label><select className="input" value={lectureId} onChange={(e) => setLectureId(e.target.value)}>{data.lectures.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}</select></div>}
      <div className="field"><label>{t('Количество вопросов', 'Number of questions')}</label><div className="chips">{[5, 10, 20].map((n) => <button key={n} className={`chip ${count === n ? 'on' : ''}`} onClick={() => setCount(n)}>{n}</button>)}</div></div>
      <div className="field"><label>{t('Тип вопросов', 'Question types')}</label><div className="chips">{(Object.keys(labels) as QType[]).map((k) => <button key={k} className={`chip ${types.includes(k) ? 'on' : ''}`} onClick={() => toggle(k)}>{labels[k]}</button>)}</div></div>
      <div className="field"><label>{t('Сложность', 'Difficulty')}</label><div className="chips">{[['easy', t('Лёгкая', 'Easy')], ['medium', t('Средняя', 'Medium')], ['exam', t('Экзаменационная', 'Exam-level')]].map(([k, l]) => <button key={k} className={`chip ${difficulty === k ? 'on' : ''}`} onClick={() => setDifficulty(k)}>{l}</button>)}</div></div>
      <button className="btn btn-primary" disabled={busy || !lectureId} onClick={make}>{busy ? <Spinner label={t('AI составляет тест…', 'AI is building the quiz…')} /> : <><Icon name="sparkle" size={16} />{t('Сделать тест', 'Create quiz')}</>}</button>
    </div>
  );
}

export function Tests() {
  const t = useT();
  const { data, lang, mutate } = useStore();
  return (
    <>
      <PageHead title={t('Тесты', 'Quizzes')} sub={t('Тренировка с мгновенной проверкой или экзамен с итоговым результатом.', 'Practice with instant feedback or an exam with a final score.')} />
      <div className="grid g2" style={{ alignItems: 'start' }}>
        <QuizMaker />
        <div className="card">
          <h3>{t('Мои тесты', 'My quizzes')}</h3>
          {data.quizzes.length === 0 && <p className="muted">{t('Тестов пока нет.', 'No quizzes yet.')}</p>}
          {data.quizzes.map((q) => {
            const at = data.attempts.filter((a) => a.quizId === q.id);
            const best = at.length ? Math.max(...at.map((a) => Math.round((a.score / a.total) * 100))) : null;
            return (
              <div key={q.id} className="list-row">
                <div className="grow" style={{ minWidth: 0 }}><b className="trunc" style={{ display: 'block' }}>{q.title}</b><span className="muted sm">{q.questions.length} · {fmtDateTime(q.createdAt, lang)}</span></div>
                {best !== null && <span className={`badge ${best >= 70 ? 'ok' : 'bad'}`}>{best}%</span>}
                <Link to={`/tests/${q.id}`} className="btn btn-primary btn-sm">{t('Пройти', 'Take')}</Link>
                <button className="btn btn-danger btn-sm" aria-label="Delete" onClick={() => confirmBox(t('Удалить тест?', 'Delete quiz?')) && mutate((d) => { d.quizzes = d.quizzes.filter((x) => x.id !== q.id); d.attempts = d.attempts.filter((x) => x.quizId !== q.id); })}><Icon name="trash" size={14} /></button>
              </div>
            );
          })}
        </div>
      </div>
      {data.attempts.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>{t('История попыток', 'Attempt history')}</h3>
          <table className="tbl"><tbody>{data.attempts.slice(0, 12).map((a) => <tr key={a.id}><td>{data.quizzes.find((q) => q.id === a.quizId)?.title || '—'}</td><td className="hide-m">{a.mode === 'exam' ? t('Экзамен', 'Exam') : t('Тренировка', 'Practice')}</td><td>{fmtDateTime(a.date, lang)}</td><td><span className={`badge ${a.score / a.total >= 0.7 ? 'ok' : 'bad'}`}>{a.score}/{a.total}</span></td></tr>)}</tbody></table>
        </div>
      )}
    </>
  );
}

const ansText = (q: Question): string => (q.type === 'mcq' ? `${String.fromCharCode(65 + (q.answer as number))}. ${q.options![q.answer as number]}` : q.type === 'tf' ? (q.answer ? 'True' : 'False') : String(q.answer));

export function TestRun() {
  const t = useT();
  const { id } = useParams();
  const nav = useNavigate();
  const { data, mutate, log, toast } = useStore();
  const quiz = data.quizzes.find((q) => q.id === id);
  const [mode, setMode] = useState<'practice' | 'exam' | null>(null);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState<Record<number, AnswerRec | { qi: number; given: string; correct: null }>>({});
  const [stage, setStage] = useState<'q' | 'review' | 'done'>('q');
  const [sec, setSec] = useState(0);
  const saved = useRef(false);

  useEffect(() => {
    if (!mode || stage === 'done') return;
    const i = window.setInterval(() => setSec((s) => s + 1), 1000);
    return () => window.clearInterval(i);
  }, [mode, stage]);

  if (!quiz) return <div className="card"><Empty title={t('Тест не найден', 'Quiz not found')} action={<Link to="/tests" className="btn btn-primary">{t('К тестам', 'Back to quizzes')}</Link>} /></div>;
  const lecture = data.lectures.find((l) => l.id === quiz.lectureId);
  const qs = quiz.questions;

  if (!mode) {
    return (
      <>
        <PageHead crumbs={<Link to="/tests">{t('Тесты', 'Quizzes')}</Link>} title={quiz.title} sub={`${qs.length} ${t('вопросов', 'questions')} · ${lecture?.title || ''}`} />
        <div className="grid g2">
          <button className="card hover row spread" style={{ textAlign: 'left' }} onClick={() => setMode('practice')}>
            <div style={{ flex: 1 }}>
              <h3>{t('Тренировка', 'Practice')}</h3>
              <p className="muted">{t('Проверка после каждого вопроса и объяснение ответа.', 'Check after each question with explanations.')}</p>
            </div>
            <Target3D style={{ width: 64 }} />
          </button>
          <button className="card hover row spread" style={{ textAlign: 'left' }} onClick={() => setMode('exam')}>
            <div style={{ flex: 1 }}>
              <h3>{t('Экзамен', 'Exam')}</h3>
              <p className="muted">{t('Таймер, результат только в конце.', 'Timer, result only at the end.')}</p>
            </div>
            <GraduationCapArt style={{ width: 64 }} />
          </button>
        </div>
      </>
    );
  }

  const q = qs[idx];
  const finishAll = (ans: typeof answers) => {
    const pending = qs.some((_, i) => ans[i]?.correct === null || !ans[i]);
    setAnswers(ans);
    setStage(pending ? 'review' : 'done');
    if (!pending) save(ans);
  };

  const save = (ans: typeof answers) => {
    if (saved.current) return;
    saved.current = true;
    const recs: AnswerRec[] = qs.map((_, i) => ({ qi: i, given: ans[i]?.given ?? '', correct: ans[i]?.correct === true }));
    const score = recs.filter((r) => r.correct).length;
    mutate((d) => {
      d.attempts.unshift({ id: uid(), quizId: quiz.id, lectureId: quiz.lectureId, date: new Date().toISOString(), mode: mode!, score, total: qs.length, answers: recs });
      for (const r of recs) if (!r.correct) {
        const qq = qs[r.qi];
        const exists = d.mistakes.find((m) => m.quizId === quiz.id && m.q === qq.q);
        const given = qq.type === 'mcq' ? (r.given !== '' ? qq.options?.[Number(r.given)] ?? '' : '') : qq.type === 'tf' ? r.given : r.given;
        if (exists) { exists.given = given; exists.resolved = false; exists.date = new Date().toISOString(); }
        else d.mistakes.unshift({ id: uid(), lectureId: quiz.lectureId, quizId: quiz.id, q: qq.q, given: given || '—', correct: ansText(qq), explanation: qq.explanation, date: new Date().toISOString(), resolved: false });
      } else {
        const m = d.mistakes.find((m) => m.quizId === quiz.id && m.q === qs[r.qi].q);
        if (m) m.resolved = true;
      }
    });
    log(t(`Пройден тест «${quiz.title}»: ${score}/${qs.length}`, `Quiz “${quiz.title}” finished: ${score}/${qs.length}`));
  };

  const submitCurrent = (given: string) => {
    let correct: boolean | null;
    if (given === '' && q.type !== 'open') correct = false;
    else if (q.type === 'mcq') correct = Number(given) === q.answer;
    else if (q.type === 'tf') correct = (given === 'true') === q.answer;
    else if (q.type === 'short') correct = gradeShort(given, String(q.answer));
    else correct = null;
    return { qi: idx, given, correct } as AnswerRec | { qi: number; given: string; correct: null };
  };

  const check = () => {
    if (input === '') return toast(t('Выберите или введите ответ', 'Select or enter an answer'), 'info');
    const a = submitCurrent(input);
    setAnswers({ ...answers, [idx]: a });
    setChecked(true);
  };
  const next = () => {
    const ans = answers[idx] ? answers : { ...answers, [idx]: submitCurrent(input === '' ? '' : input) };
    if (idx + 1 < qs.length) { setIdx(idx + 1); setInput(''); setChecked(false); setAnswers(ans); } else finishAll(ans);
  };
  const selfGrade = (i: number, ok: boolean) => {
    const cur = { ...answers, [i]: { ...(answers[i] || { qi: i, given: '' }), correct: ok } } as typeof answers;
    setAnswers(cur);
    if (stage === 'q' && i === idx) return;
    if (stage === 'review' && qs.every((_, k) => cur[k] && cur[k].correct !== null)) { setStage('done'); save(cur); }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (stage === 'review') {
    return (
      <>
        <PageHead title={t('Самопроверка открытых вопросов', 'Self-check open questions')} sub={t('Сравните свой ответ с эталоном и отметьте результат.', 'Compare your answer with the reference and mark the result.')} />
        <div className="stack">
          {qs.map((qq, i) => (answers[i]?.correct === null || !answers[i]) && (
            <div key={i} className="card stack">
              <b>{i + 1}. {qq.q}</b>
              <div className="muted sm">{t('Ваш ответ', 'Your answer')}: {answers[i]?.given || '—'}</div>
              <div className="paper" style={{ padding: '8px 16px 8px 40px' }}>{ansText(qq)}</div>
              <div className="row"><button className="btn btn-soft" onClick={() => selfGrade(i, true)}>✓ {t('Я ответил верно', 'I got it right')}</button><button className="btn btn-danger" onClick={() => selfGrade(i, false)}>✗ {t('Неверно', 'Wrong')}</button></div>
            </div>
          ))}
        </div>
      </>
    );
  }

  if (stage === 'done') {
    const recs = qs.map((_, i) => answers[i]);
    const score = recs.filter((r) => r?.correct === true).length;
    const pct = Math.round((score / qs.length) * 100);
    return (
      <>
        <PageHead title={t('Результат', 'Result')} />
        <div className="card stack" style={{ alignItems: 'center', textAlign: 'center' }}>
          <div className="score-ring" style={{ ['--p' as string]: pct }}><b>{pct}%</b></div>
          <h3>{score} / {qs.length} · {fmt(sec)}</h3>
          <p className="muted">{pct >= 85 ? t('Отлично! Вы готовы.', 'Excellent! You are ready.') : pct >= 60 ? t('Хорошо, но есть что повторить.', 'Good, but there is room to review.') : t('Стоит повторить материал и разобрать ошибки.', 'Review the material and your mistakes.')}</p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => { setMode(null); setIdx(0); setInput(''); setChecked(false); setAnswers({}); setStage('q'); setSec(0); saved.current = false; }}>{t('Пройти ещё раз', 'Retake')}</button>
            <Link to="/mistakes" className="btn btn-ghost">{t('Разбор ошибок', 'Review mistakes')}</Link>
            {lecture && <Link to={`/lectures/${lecture.id}`} className="btn btn-ghost">{t('К лекции', 'To lecture')}</Link>}
          </div>
        </div>
        <div className="stack" style={{ marginTop: 16 }}>
          {qs.map((qq, i) => (
            <div key={i} className="card" style={{ borderLeft: `4px solid ${recs[i]?.correct ? 'var(--ok)' : 'var(--bad)'}` }}>
              <b>{i + 1}. <InlineMd text={qq.q} /></b>
              <div className="sm" style={{ marginTop: 6 }}>{t('Ваш ответ', 'Your answer')}: {qq.type === 'mcq' ? (recs[i]?.given !== '' && recs[i] ? qq.options?.[Number(recs[i]!.given)] : '—') : recs[i]?.given || '—'}</div>
              {!recs[i]?.correct && <div className="sm" style={{ color: 'var(--ok)' }}>{t('Верно', 'Correct')}: <InlineMd text={ansText(qq)} /></div>}
              {qq.explanation && <div className="muted sm"><InlineMd text={qq.explanation} /></div>}
            </div>
          ))}
        </div>
      </>
    );
  }

  const cur = answers[idx];
  const showFeedback = mode === 'practice' && checked;
  return (
    <>
      <PageHead crumbs={<Link to="/tests">{t('Тесты', 'Quizzes')}</Link>} title={quiz.title} actions={<><Clock3D style={{ width: 32 }} /><span className="badge">{mode === 'exam' ? t('Экзамен', 'Exam') : t('Тренировка', 'Practice')} · {fmt(sec)}</span><button className="btn btn-ghost btn-sm" onClick={() => confirmBox(t('Выйти без сохранения?', 'Leave without saving?')) && nav('/tests')}>{t('Выйти', 'Quit')}</button></>} />
      <div className="bar" style={{ marginBottom: 18 }}><i style={{ width: `${((idx + (checked ? 1 : 0)) / qs.length) * 100}%` }} /></div>
      <div className="card stack">
        <span className="muted sm">{t('Вопрос', 'Question')} {idx + 1} / {qs.length}</span>
        <h3 style={{ margin: 0, fontSize: '1.2rem', overflowWrap: 'anywhere' }}><InlineMd text={q.q} /></h3>

        {q.type === 'mcq' && q.options!.map((o, i) => {
          const sel = input === String(i);
          const cls = showFeedback ? (i === q.answer ? 'right' : sel ? 'wrong' : '') : sel ? 'sel' : '';
          return <button key={i} className={`opt ${cls}`} disabled={showFeedback} onClick={() => setInput(String(i))}><span className="ltr">{String.fromCharCode(65 + i)}</span><span><InlineMd text={o} /></span></button>;
        })}
        {q.type === 'tf' && [['true', t('Верно', 'True')], ['false', t('Неверно', 'False')]].map(([v, l]) => {
          const sel = input === v;
          const cls = showFeedback ? ((v === 'true') === q.answer ? 'right' : sel ? 'wrong' : '') : sel ? 'sel' : '';
          return <button key={v} className={`opt ${cls}`} disabled={showFeedback} onClick={() => setInput(v)}><span className="ltr">{v === 'true' ? '✓' : '✗'}</span><span>{l}</span></button>;
        })}
        {q.type === 'short' && <input className="input" value={input} onChange={(e) => setInput(e.target.value)} disabled={showFeedback} placeholder={t('Ваш ответ', 'Your answer')} onKeyDown={(e) => e.key === 'Enter' && !checked && mode === 'practice' && check()} />}
        {q.type === 'open' && <textarea className="input" value={input} onChange={(e) => setInput(e.target.value)} disabled={showFeedback || (mode === 'practice' && checked)} placeholder={t('Напишите развёрнутый ответ', 'Write a detailed answer')} />}

        {showFeedback && q.type !== 'open' && (
          <div className="card" style={{ boxShadow: 'none', background: cur?.correct ? 'color-mix(in srgb, var(--ok) 10%, var(--card))' : 'color-mix(in srgb, var(--bad) 8%, var(--card))' }}>
            <b>{cur?.correct ? `✓ ${t('Верно!', 'Correct!')}` : `✗ ${t('Неверно', 'Wrong')}`}</b>
            {!cur?.correct && <div>{t('Правильный ответ', 'Correct answer')}: <InlineMd text={ansText(q)} /></div>}
            {q.explanation && <div className="muted sm" style={{ marginTop: 4 }}><InlineMd text={q.explanation} /></div>}
          </div>
        )}
        {showFeedback && q.type === 'open' && (
          <div className="stack">
            <div className="paper" style={{ padding: '8px 16px 8px 40px' }}><b>{t('Эталон', 'Reference')}:</b> {ansText(q)}</div>
            {cur?.correct === null ? <div className="row"><button className="btn btn-soft" onClick={() => selfGrade(idx, true)}>✓ {t('Верно', 'Right')}</button><button className="btn btn-danger" onClick={() => selfGrade(idx, false)}>✗ {t('Неверно', 'Wrong')}</button></div> : <span className={`badge ${cur?.correct ? 'ok' : 'bad'}`}>{cur?.correct ? t('Засчитано', 'Counted') : t('Не засчитано', 'Not counted')}</span>}
          </div>
        )}

        <div className="row" style={{ justifyContent: 'flex-end' }}>
          {mode === 'practice' && !checked && <button className="btn btn-primary" onClick={check}>{t('Проверить', 'Check')}</button>}
          {(mode === 'exam' || checked) && <button className="btn btn-primary" disabled={mode === 'practice' && q.type === 'open' && cur?.correct === null} onClick={next}>{idx + 1 < qs.length ? t('Далее', 'Next') : t('Завершить', 'Finish')}</button>}
        </div>
      </div>
    </>
  );
}
