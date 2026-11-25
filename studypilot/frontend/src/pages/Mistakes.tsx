import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore, useT } from '../store';
import { Empty, PageHead } from '../components/UI';

export default function Mistakes() {
  const t = useT();
  const { data, mutate, lang } = useStore();
  const [show, setShow] = useState<'open' | 'all'>('open');
  const [rev, setRev] = useState<Record<string, boolean>>({});
  const list = data.mistakes.filter((m) => show === 'all' || !m.resolved);
  return (
    <>
      <PageHead title={t('Работа над ошибками', 'Mistakes')} sub={t('Неверные ответы из тестов с правильным ответом и ссылкой на лекцию.', 'Wrong answers from quizzes with the correct answer and a link to the lecture.')}
        actions={<div className="tabs"><button className={`tab ${show === 'open' ? 'active' : ''}`} onClick={() => setShow('open')}>{t('К разбору', 'Open')} ({data.mistakes.filter((m) => !m.resolved).length})</button><button className={`tab ${show === 'all' ? 'active' : ''}`} onClick={() => setShow('all')}>{t('Все', 'All')}</button></div>} />
      {list.length === 0 ? <div className="card"><Empty title={data.mistakes.length ? t('Всё разобрано! 🎉', 'All reviewed! 🎉') : t('Ошибок пока нет', 'No mistakes yet')} text={t('Ошибки из тестов появятся здесь автоматически.', 'Mistakes from quizzes appear here automatically.')} action={<Link to="/tests" className="btn btn-primary">{t('К тестам', 'Go to quizzes')}</Link>} /></div> : (
        <div className="stack">
          {list.map((m) => {
            const l = data.lectures.find((x) => x.id === m.lectureId);
            return (
              <div key={m.id} className="card stack" style={{ borderLeft: `4px solid ${m.resolved ? 'var(--ok)' : 'var(--bad)'}` }}>
                <b style={{ overflowWrap: 'anywhere' }}>{m.q}</b>
                <div className="sm" style={{ color: 'var(--bad)' }}>✗ {t('Ваш ответ', 'Your answer')}: {m.given}</div>
                {rev[m.id] || m.resolved ? <div className="sm" style={{ color: 'var(--ok)' }}>✓ {t('Правильно', 'Correct')}: {m.correct}{m.explanation && <div className="muted">{m.explanation}</div>}</div> : <button className="btn btn-soft btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setRev({ ...rev, [m.id]: true })}>{t('Показать правильный ответ', 'Show correct answer')}</button>}
                <div className="row sm muted">
                  {l && <Link to={`/lectures/${l.id}`} className="badge">{l.title}</Link>}
                  <Link to={`/tests/${m.quizId}`} className="badge">{t('Пересдать тест', 'Retake quiz')}</Link>
                  <span>{new Date(m.date).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US')}</span>
                  <span style={{ marginLeft: 'auto' }} className="row">
                    <button className="btn btn-ghost btn-sm" onClick={() => mutate((d) => { const x = d.mistakes.find((y) => y.id === m.id); if (x) x.resolved = !x.resolved; })}>{m.resolved ? t('Вернуть в разбор', 'Reopen') : `✓ ${t('Разобрано', 'Mark reviewed')}`}</button>
                    <button className="btn btn-danger btn-sm" onClick={() => mutate((d) => { d.mistakes = d.mistakes.filter((y) => y.id !== m.id); })}>{t('Удалить', 'Delete')}</button>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
