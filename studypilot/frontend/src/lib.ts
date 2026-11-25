import type { Attempt, Card, Data, Lecture, Subject, Task } from './types';
import { todayStr, uid } from './store';

export const COLORS = ['#6366F1', '#22D3EE', '#A78BFA', '#10B981', '#F59E0B', '#F43F5E', '#3B82F6', '#EC4899'];

export const addDays = (s: string, n: number) => {
  const d = new Date(s + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return todayStr(d);
};
export const daysBetween = (a: string, b: string) => Math.round((new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 86400000);
export const fmtDate = (s: string, lang: string) => new Date(s.length === 10 ? s + 'T00:00:00' : s).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' });
export const fmtDateTime = (s: string, lang: string) => new Date(s).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Simplified SM-2. grade: 0 again, 1 hard, 2 good, 3 easy */
export function reviewCard(c: Card, grade: 0 | 1 | 2 | 3): Card {
  let { ease, interval, reps } = c;
  if (grade === 0) {
    reps = 0;
    interval = 0;
    ease = Math.max(1.3, ease - 0.2);
  } else {
    reps += 1;
    if (reps === 1) interval = grade === 3 ? 3 : 1;
    else if (reps === 2) interval = grade === 1 ? 2 : 4;
    else interval = Math.round(interval * ease * (grade === 1 ? 0.7 : grade === 3 ? 1.3 : 1));
    ease = Math.max(1.3, ease + (grade === 3 ? 0.15 : grade === 1 ? -0.15 : 0));
  }
  return { ...c, ease, interval, reps, due: addDays(todayStr(), interval) };
}

export const lectureScore = (d: Data, lectureId: string): number | null => {
  const at = d.attempts.filter((a) => a.lectureId === lectureId);
  if (!at.length) return null;
  const last = at.slice(0, 3);
  return Math.round((last.reduce((s, a) => s + a.score / Math.max(a.total, 1), 0) / last.length) * 100);
};

export const subjectProgress = (d: Data, sid: string): number => {
  const ls = d.lectures.filter((l) => l.subjectId === sid);
  if (!ls.length) return 0;
  let pts = 0;
  for (const l of ls) {
    if (l.notes) pts += 25;
    const sc = lectureScore(d, l.id);
    if (sc !== null) pts += 50 * (sc / 100) + 10;
    const cards = d.cards.filter((c) => c.lectureId === l.id);
    if (cards.length) pts += 15 * (cards.filter((c) => c.reps >= 2).length / cards.length);
  }
  return Math.min(100, Math.round(pts / ls.length));
};

export const overallProgress = (d: Data): number => {
  if (!d.subjects.length) return 0;
  return Math.round(d.subjects.reduce((s, x) => s + subjectProgress(d, x.id), 0) / d.subjects.length);
};

export const nextExam = (d: Data): Subject | null => {
  const t = todayStr();
  return d.subjects.filter((s) => s.examDate && s.examDate >= t).sort((a, b) => a.examDate!.localeCompare(b.examDate!))[0] || null;
};

export const weakLectures = (d: Data): { lecture: Lecture; score: number }[] =>
  d.lectures
    .map((l) => ({ lecture: l, score: lectureScore(d, l.id) }))
    .filter((x): x is { lecture: Lecture; score: number } => x.score !== null && x.score < 70)
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);

export const dueCards = (d: Data) => d.cards.filter((c) => c.due <= todayStr());

export function streak(d: Data): number {
  const days = new Set<string>([...d.activity.map((a) => a.ts.slice(0, 10)), ...d.attempts.map((a) => a.date.slice(0, 10))].map((x) => todayStr(new Date(x.length === 10 ? x + 'T12:00:00' : x))));
  let n = 0;
  let cur = todayStr();
  if (!days.has(cur)) cur = addDays(cur, -1);
  while (days.has(cur)) {
    n++;
    cur = addDays(cur, -1);
  }
  return n;
}

export function attemptsByDay(attempts: Attempt[], days = 14): { day: string; count: number; avg: number }[] {
  const out: { day: string; count: number; avg: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = addDays(todayStr(), -i);
    const at = attempts.filter((a) => todayStr(new Date(a.date)) === day);
    out.push({ day, count: at.length, avg: at.length ? Math.round((at.reduce((s, a) => s + a.score / Math.max(a.total, 1), 0) / at.length) * 100) : 0 });
  }
  return out;
}

/** Build a day-by-day plan from today to the exam date. */
export function buildPlan(subject: Subject, lectures: Lecture[], examDate: string, perDay: number): Task[] {
  const start = todayStr();
  const total = Math.max(1, daysBetween(start, examDate));
  const tasks: Task[] = [];
  const topics: { title: string; lectureId: string }[] = [];
  for (const l of lectures) {
    const ex = l.notes?.examTopics?.length ? l.notes.examTopics.slice(0, 3) : [];
    topics.push({ title: l.title, lectureId: l.id });
    for (const e of ex) topics.push({ title: `${l.title}: ${e}`, lectureId: l.id });
  }
  if (!topics.length) return tasks;
  const reserve = total >= 4 ? 2 : total >= 2 ? 1 : 0; // days for final review / mock test
  const studyDays = Math.max(1, total - reserve);
  const per = Math.max(1, Math.min(perDay, Math.ceil(topics.length / studyDays)));
  let ti = 0;
  for (let i = 0; i < studyDays && ti < topics.length; i++) {
    for (let k = 0; k < per && ti < topics.length; k++, ti++) {
      tasks.push({ id: uid(), subjectId: subject.id, lectureId: topics[ti].lectureId, title: topics[ti].title, date: addDays(start, i), done: false, kind: 'study' });
    }
    if (i > 0 && i % 3 === 0) tasks.push({ id: uid(), subjectId: subject.id, title: `Карточки / Flashcards: ${subject.name}`, date: addDays(start, i), done: false, kind: 'cards' });
  }
  if (reserve >= 1) tasks.push({ id: uid(), subjectId: subject.id, title: `Повторение / Review: ${subject.name}`, date: addDays(examDate, -Math.min(reserve, 2)), done: false, kind: 'review' });
  if (reserve >= 1) tasks.push({ id: uid(), subjectId: subject.id, title: `Пробный тест / Mock test: ${subject.name}`, date: addDays(examDate, -1), done: false, kind: 'test' });
  return tasks;
}

export const normalize = (s: string) => s.toLowerCase().replace(/[^a-zа-яё0-9 ]/gi, ' ').replace(/\s+/g, ' ').trim();

export const gradeShort = (given: string, expected: string): boolean => {
  const g = normalize(given);
  const e = normalize(expected);
  if (!g) return false;
  if (g === e || e.includes(g) && g.length >= 4 || g.includes(e)) return true;
  const ew = e.split(' ').filter((w) => w.length > 3);
  if (!ew.length) return false;
  const hits = ew.filter((w) => g.includes(w.slice(0, Math.max(4, w.length - 2)))).length;
  return hits / ew.length >= 0.6;
};

export const ensureSubject = (d: Data): string => d.subjects[0]?.id || '';
