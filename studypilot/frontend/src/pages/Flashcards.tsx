import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { todayStr, useStore, useT } from '../store';
import { Empty, PageHead } from '../components/UI';
import { InlineMd } from '../components/Md';
import { dueCards, reviewCard } from '../lib';

export default function Flashcards() {
  const t = useT();
  const { data, mutate, log } = useStore();
  const [sp] = useSearchParams();
  const [lecture, setLecture] = useState(sp.get('lecture') || 'all');
  const [flipped, setFlipped] = useState(false);
  const [all, setAll] = useState(false);
  const [done, setDone] = useState(0);

  const pool = useMemo(() => {
    const base = data.cards.filter((c) => lecture === 'all' || c.lectureId === lecture);
    return all ? base : base.filter((c) => c.due <= todayStr());
  }, [data.cards, lecture, all]);
  const card = pool[0];
  const withCards = data.lectures.filter((l) => data.cards.some((c) => c.lectureId === l.id));
  const mastered = data.cards.filter((c) => c.reps >= 3).length;

  const grade = (g: 0 | 1 | 2 | 3) => {
    if (!card) return;
    mutate((d) => { d.cards = d.cards.map((c) => (c.id === card.id ? reviewCard(c, g) : c)); });
    setFlipped(false);
    setDone((n) => n + 1);
    if ((done + 1) % 10 === 0) log(t(`Повторено карточек: ${done + 1}`, `Cards reviewed: ${done + 1}`));
  };

  return (
    <>
      <PageHead title={t('Карточки', 'Flashcards')} sub={t('Интервальное повторение: чем лучше помните — тем реже карточка появляется.', 'Spaced repetition: the better you remember, the rarer the card.')} />
      {data.cards.length === 0 ? (
        <div className="card"><Empty title={t('Карточек пока нет', 'No flashcards yet')} text={t('Откройте лекцию, вкладка «Карточки» → «Создать карточки».', 'Open a lecture, “Cards” tab → “Generate cards”.')} action={<Link to="/lectures" className="btn btn-primary">{t('К лекциям', 'To lectures')}</Link>} /></div>
      ) : (
        <>
          <div className="row" style={{ marginBottom: 16 }}>
            <select className="input" style={{ maxWidth: 260 }} value={lecture} onChange={(e) => { setLecture(e.target.value); setFlipped(false); }}><option value="all">{t('Все лекции', 'All lectures')}</option>{withCards.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}</select>
            <button className={`chip ${all ? 'on' : ''}`} onClick={() => { setAll(!all); setFlipped(false); }}>{t('Показать все (не только к повторению)', 'Show all (not only due)')}</button>
            <span className="badge warn">{t('К повторению', 'Due')}: {dueCards(data).length}</span>
            <span className="badge ok">{t('Выучено', 'Mastered')}: {mastered}/{data.cards.length}</span>
          </div>
          {!card ? (
            <div className="card"><Empty title={t('На сегодня всё! 🎉', 'All done for today! 🎉')} text={t(`Повторено: ${done}. Следующие карточки появятся по графику.`, `Reviewed: ${done}. The next cards will appear on schedule.`)} action={<button className="btn btn-ghost" onClick={() => setAll(true)}>{t('Повторить всё равно', 'Review anyway')}</button>} /></div>
          ) : (
            <div className="stack" style={{ alignItems: 'center' }}>
              <span className="muted sm">{t('Осталось', 'Remaining')}: {pool.length}</span>
              <div className={`flip ${flipped ? 'on' : ''}`} onClick={() => setFlipped(!flipped)} role="button" tabIndex={0} onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && (e.preventDefault(), setFlipped(!flipped))} aria-label={t('Перевернуть карточку', 'Flip card')}>
                <div className="flip-in">
                  <div className="face front"><InlineMd text={card.front} /></div>
                  <div className="face back"><InlineMd text={card.back} /></div>
                </div>
              </div>
              {!flipped ? <button className="btn btn-primary" onClick={() => setFlipped(true)}>{t('Показать ответ', 'Show answer')}</button> : (
                <div className="row" style={{ justifyContent: 'center' }}>
                  <button className="btn btn-danger" onClick={() => grade(0)}>{t('Забыл', 'Again')}</button>
                  <button className="btn btn-ghost" onClick={() => grade(1)}>{t('Трудно', 'Hard')}</button>
                  <button className="btn btn-soft" onClick={() => grade(2)}>{t('Хорошо', 'Good')}</button>
                  <button className="btn btn-primary" onClick={() => grade(3)}>{t('Легко', 'Easy')}</button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
