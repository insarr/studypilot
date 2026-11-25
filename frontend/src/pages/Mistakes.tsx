import { animate, stagger } from 'animejs';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore, useT } from '../store';
import { Microscope3D, Target3D, Trophy3D } from '../components/Deco';
import { InlineMd } from '../components/Md';
import { Empty, PageHead } from '../components/UI';
import SmoothTab from '../components/kokonutui/smooth-tab';

export default function Mistakes() {
  const t = useT();
  const { data, mutate, lang } = useStore();
  const [show, setShow] = useState<'open' | 'all'>('open');
  const [rev, setRev] = useState<Record<string, boolean>>({});
  const listRef = useRef<HTMLDivElement>(null);

  const openCount = data.mistakes.filter((m) => !m.resolved).length;
  const list = data.mistakes.filter((m) => show === 'all' || !m.resolved);

  useEffect(() => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('.mistake-card');
      animate(items, {
        translateY: [18, 0],
        opacity: [0, 1],
        delay: stagger(60),
        duration: 480,
        ease: 'outQuad',
      });
    }
  }, [list.length, show]);

  return (
    <>
      <PageHead
        title={t('Работа над ошибками', 'Mistakes Notebook')}
        sub={t('Неверные ответы из тестов с правильным ответом, объяснением и ссылкой на лекцию.', 'Wrong answers from quizzes with the correct answer, explanation, and a link to the lecture.')}
        actions={
          <div className="row" style={{ gap: 12 }}>
            <Microscope3D style={{ width: 46 }} />
            <Target3D style={{ width: 46 }} />
            <SmoothTab
              value={show}
              onChange={(v) => setShow(v as 'open' | 'all')}
              items={[
                { id: 'open', title: t('К разбору', 'To review'), icon: AlertCircle, badge: openCount },
                { id: 'all', title: t('Все', 'All'), icon: CheckCircle2, badge: data.mistakes.length },
              ]}
            />
          </div>
        }
      />
      {list.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: -12 }}>
            <Trophy3D style={{ width: 84 }} />
          </div>
          <Empty
            title={data.mistakes.length ? t('Все ошибки разобраны!', 'All mistakes reviewed!') : t('Ошибок пока нет', 'No mistakes yet')}
            text={t('Ошибки из тестов появятся здесь автоматически для закрепления материала.', 'Mistakes from quizzes appear here automatically so you can master every topic.')}
            action={
              <Link to="/tests" className="btn btn-primary">
                {t('К тестам', 'Go to quizzes')}
              </Link>
            }
          />
        </div>
      ) : (
        <div ref={listRef} className="stack">
          {list.map((m) => {
            const l = data.lectures.find((x) => x.id === m.lectureId);
            return (
              <div key={m.id} className="card stack mistake-card">
                <div className="row spread">
                  <b style={{ overflowWrap: 'anywhere', fontSize: 17 }}>
                    <InlineMd text={m.q} />
                  </b>
                  <span className={`badge ${m.resolved ? 'ok' : 'bad'}`}>
                    {m.resolved ? t('Разобрано', 'Reviewed') : t('Нужно повторить', 'Needs review')}
                  </span>
                </div>
                <div className="sm" style={{ color: 'var(--bad)' }}>
                  ✗ {t('Ваш ответ', 'Your answer')}: <InlineMd text={m.given} />
                </div>
                {rev[m.id] || m.resolved ? (
                  <div className="sm" style={{ color: 'var(--ok)' }}>
                    ✓ {t('Правильно', 'Correct')}: <InlineMd text={m.correct} />
                    {m.explanation && (
                      <div className="muted" style={{ marginTop: 4 }}>
                        <InlineMd text={m.explanation} />
                      </div>
                    )}
                  </div>
                ) : (
                  <button className="btn btn-soft btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setRev({ ...rev, [m.id]: true })}>
                    {t('Показать правильный ответ', 'Show correct answer')}
                  </button>
                )}
                <div className="row sm muted">
                  {l && (
                    <Link to={`/lectures/${l.id}`} className="badge">
                      {l.title}
                    </Link>
                  )}
                  <Link to={`/tests/${m.quizId}`} className="badge">
                    {t('Пересдать тест', 'Retake quiz')}
                  </Link>
                  <span>{new Date(m.date).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US')}</span>
                  <span style={{ marginLeft: 'auto' }} className="row">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() =>
                        mutate((d) => {
                          const x = d.mistakes.find((y) => y.id === m.id);
                          if (x) x.resolved = !x.resolved;
                        })
                      }
                    >
                      {m.resolved ? t('Вернуть в разбор', 'Reopen') : `✓ ${t('Разобрано', 'Mark reviewed')}`}
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() =>
                        mutate((d) => {
                          d.mistakes = d.mistakes.filter((y) => y.id !== m.id);
                        })
                      }
                    >
                      {t('Удалить', 'Delete')}
                    </button>
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
