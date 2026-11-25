import { api } from './api';
import { uid, todayStr, useStore } from './store';
import type { Card, Question, QType, Quiz } from './types';

const s = () => useStore.getState();
const tr = (ru: string, en: string) => (s().lang === 'ru' ? ru : en);

export async function generateNotes(lectureId: string): Promise<boolean> {
  const l = s().data.lectures.find((x) => x.id === lectureId);
  if (!l) return false;
  try {
    const r = await api.notes(l.text, l.title, s().lang);
    const d = r.data;
    const notes = {
      subject: d.subject, topic: d.topic,
      summary: String(d.summary || ''), detailed: String(d.detailed || ''),
      terms: Array.isArray(d.terms) ? d.terms.filter((x) => x?.term) : [],
      examTopics: Array.isArray(d.examTopics) ? d.examTopics.map(String) : [],
      mindmap: d.mindmap?.branches ? d.mindmap : { root: l.title, branches: [] },
      engine: r.engine, createdAt: new Date().toISOString(),
    };
    s().mutate((x) => { const t = x.lectures.find((y) => y.id === lectureId); if (t) t.notes = notes; });
    s().log(tr(`Создан конспект: «${l.title}»`, `Notes created: “${l.title}”`));
    if (r.warning) s().toast(r.warning, 'info'); else s().toast(tr('Конспект готов', 'Notes ready'), 'ok');
    return true;
  } catch (e: any) {
    s().toast(e.message, 'err');
    return false;
  }
}

export async function createQuiz(lectureId: string, count: number, types: QType[], difficulty: string): Promise<string | null> {
  const l = s().data.lectures.find((x) => x.id === lectureId);
  if (!l) return null;
  try {
    const r = await api.quiz(l.text, count, types, difficulty, s().lang);
    const qs: Question[] = (r.data.questions || []).filter((q) => q && q.q && ['mcq', 'tf', 'short', 'open'].includes(q.type)).map((q) => {
      if (q.type === 'mcq') {
        const opts = (q.options || []).map(String);
        let ans = typeof q.answer === 'number' ? q.answer : opts.findIndex((o) => o === String(q.answer));
        if (ans < 0 || ans >= opts.length) ans = 0;
        return { ...q, options: opts, answer: ans };
      }
      if (q.type === 'tf') return { ...q, answer: q.answer === true || String(q.answer).toLowerCase() === 'true' };
      return { ...q, answer: String(q.answer ?? '') };
    }).filter((q) => q.type !== 'mcq' || (q.options && q.options.length >= 2));
    if (!qs.length) throw new Error(tr('Не удалось составить вопросы по этой лекции', 'Could not build questions from this lecture'));
    const quiz: Quiz = { id: uid(), lectureId, title: `${l.title} · ${count}`, createdAt: new Date().toISOString(), difficulty, questions: qs.slice(0, count) };
    s().mutate((x) => { x.quizzes.unshift(quiz); });
    s().log(tr(`Создан тест: «${l.title}»`, `Quiz created: “${l.title}”`));
    if (r.warning) s().toast(r.warning, 'info');
    return quiz.id;
  } catch (e: any) {
    s().toast(e.message, 'err');
    return null;
  }
}

export async function generateCards(lectureId: string): Promise<number> {
  const l = s().data.lectures.find((x) => x.id === lectureId);
  if (!l) return 0;
  try {
    const r = await api.flashcards(l.text, s().lang);
    const existing = new Set(s().data.cards.filter((c) => c.lectureId === lectureId).map((c) => c.front.toLowerCase()));
    const cards: Card[] = (r.data.cards || []).filter((c) => c?.front && c?.back && !existing.has(String(c.front).toLowerCase())).map((c) => ({
      id: uid(), lectureId, front: String(c.front), back: String(c.back), ease: 2.5, interval: 0, reps: 0, due: todayStr(),
    }));
    if (!cards.length) { s().toast(tr('Новых карточек нет', 'No new cards'), 'info'); return 0; }
    s().mutate((x) => { x.cards.push(...cards); });
    s().log(tr(`Созданы карточки (${cards.length}): «${l.title}»`, `Flashcards created (${cards.length}): “${l.title}”`));
    s().toast(r.warning || tr(`Создано карточек: ${cards.length}`, `Cards created: ${cards.length}`), r.warning ? 'info' : 'ok');
    return cards.length;
  } catch (e: any) {
    s().toast(e.message, 'err');
    return 0;
  }
}
