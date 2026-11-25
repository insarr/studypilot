import { create } from 'zustand';
import { api, getToken, setToken } from './api';
import { emptyData } from './types';
import type { Data, User } from './types';

export type Theme = 'light' | 'dark' | 'system';
export type Lang = 'ru' | 'en';
export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
export const todayStr = (d = new Date()) => {
  const z = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};

interface Toast {
  id: string;
  text: string;
  kind: 'ok' | 'err' | 'info';
}

interface State {
  user: User | null;
  data: Data;
  ready: boolean; // auth resolved + data loaded
  save: SaveState;
  theme: Theme;
  lang: Lang;
  toasts: Toast[];
  boot: () => Promise<void>;
  setSession: (token: string, user: User) => Promise<void>;
  setUser: (user: User) => void;
  logout: () => void;
  mutate: (fn: (d: Data) => void) => void;
  log: (text: string) => void;
  setTheme: (t: Theme) => void;
  setLang: (l: Lang) => void;
  toast: (text: string, kind?: Toast['kind']) => void;
  dismiss: (id: string) => void;
}

let saveTimer: number | undefined;
const scheduleSave = (get: () => State, set: (p: Partial<State>) => void) => {
  window.clearTimeout(saveTimer);
  set({ save: 'saving' });
  saveTimer = window.setTimeout(async () => {
    try {
      await api.putData(get().data);
      set({ save: 'saved' });
    } catch {
      set({ save: 'error' });
    }
  }, 500);
};

// Flush pending save when the tab closes
export const applyTheme = (t: Theme) => {
  const dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
};

const initialTheme = (localStorage.getItem('sp_theme') as Theme) || 'light';
const initialLang = (localStorage.getItem('sp_lang') as Lang) || 'ru';
applyTheme(initialTheme);
document.documentElement.lang = initialLang;

export const useStore = create<State>((set, get) => ({
  user: null,
  data: emptyData(),
  ready: false,
  save: 'idle',
  theme: initialTheme,
  lang: initialLang,
  toasts: [],

  async boot() {
    if (!getToken()) return set({ ready: true });
    try {
      const { user } = await api.me();
      const { data } = await api.getData();
      set({ user, data: { ...emptyData(), ...(data || {}) }, ready: true });
    } catch (e: any) {
      if (e?.status === 401) setToken('');
      set({ ready: true });
    }
  },

  async setSession(token, user) {
    setToken(token);
    const { data } = await api.getData();
    set({ user, data: { ...emptyData(), ...(data || {}) }, ready: true, save: 'idle' });
  },

  setUser(user) {
    set({ user });
  },

  logout() {
    window.clearTimeout(saveTimer);
    setToken('');
    set({ user: null, data: emptyData(), save: 'idle' });
  },

  mutate(fn) {
    const d = structuredClone(get().data);
    fn(d);
    set({ data: d });
    scheduleSave(get, set);
  },

  log(text) {
    get().mutate((d) => {
      d.activity.unshift({ id: uid(), ts: new Date().toISOString(), text });
      d.activity = d.activity.slice(0, 200);
    });
  },

  setTheme(t) {
    localStorage.setItem('sp_theme', t);
    const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
    if (typeof doc.startViewTransition === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      doc.startViewTransition(() => {
        applyTheme(t);
        set({ theme: t });
      });
    } else {
      applyTheme(t);
      set({ theme: t });
    }
  },
  setLang(l) {
    localStorage.setItem('sp_lang', l);
    document.documentElement.lang = l;
    set({ lang: l });
  },

  toast(text, kind = 'info') {
    const id = uid();
    set({ toasts: [...get().toasts, { id, text, kind }] });
    window.setTimeout(() => get().dismiss(id), 4500);
  },
  dismiss(id) {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },
}));

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (useStore.getState().theme === 'system') applyTheme('system');
});

/** Bilingual helper: t('русский', 'english') */
export const useT = () => {
  const lang = useStore((s) => s.lang);
  return (ru: string, en: string) => (lang === 'ru' ? ru : en);
};
