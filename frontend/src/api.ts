import type { Notes, Question, User, Data } from './types';

const TOKEN_KEY = 'sp_token';
export const getToken = () => localStorage.getItem(TOKEN_KEY) || '';
export const setToken = (t: string) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

export class ApiError extends Error {
  status: number;
  constructor(msg: string, status: number) {
    super(msg);
    this.status = status;
  }
}

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };
  const t = getToken();
  if (t) headers.Authorization = `Bearer ${t}`;
  if (init.body && !(init.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  let r: Response;
  try {
    r = await fetch(`/api${path}`, { ...init, headers });
  } catch {
    throw new ApiError('Сервер недоступен. Проверьте, что backend запущен.', 0);
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new ApiError(j.error || `Ошибка ${r.status}`, r.status);
  return j as T;
}

const post = <T>(p: string, body: unknown) => req<T>(p, { method: 'POST', body: JSON.stringify(body) });

export interface AiResult<T> {
  data: T;
  engine: 'llm' | 'local';
  warning?: string;
}

export interface VerificationInfo {
  sent?: boolean;
  mode?: 'smtp' | 'ethereal' | 'demo';
  previewUrl?: string;
  demoCode?: string;
  alreadyVerified?: boolean;
}

export const api = {
  register: (name: string, email: string, password: string, avatar?: string) =>
    post<{ token: string; user: User; verification?: VerificationInfo }>('/auth/register', { name, email, password, avatar }),
  login: (email: string, password: string) => post<{ token: string; user: User }>('/auth/login', { email, password }),
  me: () => req<{ user: User }>('/auth/me'),
  sendVerification: () => post<{ ok: boolean } & VerificationInfo>('/auth/send-verification', {}),
  verifyEmail: (code: string) => post<{ ok: boolean; user: User }>('/auth/verify-email', { code }),
  updateProfile: (data: { name?: string; avatar?: string }) =>
    req<{ ok: boolean; user: User }>('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  forgot: (email: string) => post<{ code?: string; previewUrl?: string; message: string }>('/auth/forgot', { email }),
  reset: (email: string, code: string, password: string) => post<{ ok: boolean }>('/auth/reset', { email, code, password }),
  changePassword: (current: string, password: string) => post<{ ok: boolean }>('/auth/password', { current, password }),
  deleteAccount: () => req<{ ok: boolean }>('/auth/account', { method: 'DELETE' }),
  getData: () => req<{ data: Data | null }>('/data'),
  putData: (data: Data) => req<{ ok: boolean }>('/data', { method: 'PUT', body: JSON.stringify({ data }) }),
  upload: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return req<{ name: string; kind: string; text: string; chars: number }>('/upload', { method: 'POST', body: fd });
  },
  notes: (text: string, title: string, lang: string) => post<AiResult<Omit<Notes, 'engine' | 'createdAt'>>>('/ai/notes', { text, title, lang }),
  quiz: (text: string, count: number, types: string[], difficulty: string, lang: string) => post<AiResult<{ questions: Question[] }>>('/ai/quiz', { text, count, types, difficulty, lang }),
  flashcards: (text: string, lang: string) => post<AiResult<{ cards: { front: string; back: string }[] }>>('/ai/flashcards', { text, lang }),
  ask: (text: string, question: string, lang: string) => post<AiResult<{ found: boolean; answer: string; quotes?: string[] }>>('/ai/ask', { text, question, lang }),
  simplify: (fragment: string, lang: string) => post<AiResult<{ text: string }>>('/ai/simplify', { fragment, lang }),
};
