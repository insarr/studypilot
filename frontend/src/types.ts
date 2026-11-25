export type ID = string;

export interface Subject {
  id: ID;
  name: string;
  color: string;
  semester: string;
  modules: string[];
  description: string;
  examDate?: string; // YYYY-MM-DD
}

export interface MindBranch {
  title: string;
  items: string[];
}
export interface Notes {
  subject?: string;
  topic?: string;
  summary: string;
  detailed: string;
  terms: { term: string; definition: string }[];
  examTopics: string[];
  mindmap: { root: string; branches: MindBranch[] };
  engine: 'llm' | 'local';
  createdAt: string;
}

export interface ChatMsg {
  role: 'user' | 'ai';
  text: string;
  quotes?: string[];
  found?: boolean;
}

export interface Lecture {
  id: ID;
  subjectId: ID;
  module: string;
  title: string;
  text: string;
  kind: string;
  fileName?: string;
  createdAt: string;
  favorite: boolean;
  notes?: Notes;
  chat: ChatMsg[];
}

export type QType = 'mcq' | 'tf' | 'short' | 'open';
export interface Question {
  type: QType;
  q: string;
  options?: string[];
  answer: number | boolean | string;
  explanation?: string;
}
export interface Quiz {
  id: ID;
  lectureId: ID;
  title: string;
  createdAt: string;
  difficulty: string;
  questions: Question[];
}
export interface AnswerRec {
  qi: number;
  given: string;
  correct: boolean;
}
export interface Attempt {
  id: ID;
  quizId: ID;
  lectureId: ID;
  date: string;
  mode: 'practice' | 'exam';
  score: number;
  total: number;
  answers: AnswerRec[];
}
export interface Card {
  id: ID;
  lectureId: ID;
  front: string;
  back: string;
  ease: number;
  interval: number; // days
  reps: number;
  due: string; // YYYY-MM-DD
}
export interface Task {
  id: ID;
  subjectId: ID;
  lectureId?: ID;
  title: string;
  date: string;
  done: boolean;
  kind: 'study' | 'review' | 'test' | 'cards';
}
export interface Mistake {
  id: ID;
  lectureId: ID;
  quizId: ID;
  q: string;
  given: string;
  correct: string;
  explanation?: string;
  date: string;
  resolved: boolean;
}
export interface Activity {
  id: ID;
  ts: string;
  text: string;
}

export interface Data {
  subjects: Subject[];
  lectures: Lecture[];
  quizzes: Quiz[];
  attempts: Attempt[];
  cards: Card[];
  tasks: Task[];
  mistakes: Mistake[];
  activity: Activity[];
}

export const emptyData = (): Data => ({ subjects: [], lectures: [], quizzes: [], attempts: [], cards: [], tasks: [], mistakes: [], activity: [] });

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  emailVerified?: boolean;
}
