interface Provider {
  name: string;
  base: string;
  key: string;
  model: string;
}

function getProviders(): Provider[] {
  const list: Provider[] = [];
  const primaryBase = (process.env.LLM_BASE_URL || 'http://127.0.0.1:31415/v1').replace(/\/$/, '');
  const primaryKey = process.env.LLM_API_KEY || '';
  const primaryModel = process.env.LLM_MODEL || 'auto';
  if (primaryKey) {
    list.push({ name: 'Unified-API', base: primaryBase, key: primaryKey, model: primaryModel });
  }
  if (process.env.GROQ_API_KEY) {
    list.push({ name: 'Groq-GPT-OSS-120B', base: 'https://api.groq.com/openai/v1', key: process.env.GROQ_API_KEY, model: 'openai/gpt-oss-120b' });
    list.push({ name: 'Groq-Qwen-3.8-27B', base: 'https://api.groq.com/openai/v1', key: process.env.GROQ_API_KEY, model: 'qwen/qwen3.8-27b' });
  }
  for (const [idx, k] of [process.env.GEMINI_API_KEY_1, process.env.GEMINI_API_KEY_2].entries()) {
    if (k) {
      list.push({ name: `Gemini-${idx + 1}-3.5`, base: 'https://generativelanguage.googleapis.com/v1beta/openai', key: k, model: 'gemini-3.5-flash' });
      list.push({ name: `Gemini-${idx + 1}-3.8`, base: 'https://generativelanguage.googleapis.com/v1beta/openai', key: k, model: 'gemini-3.8-flash' });
    }
  }
  if (process.env.ZHIPU_API_KEY) {
    list.push({ name: 'Zhipu-GLM', base: 'https://open.bigmodel.cn/api/paas/v4', key: process.env.ZHIPU_API_KEY, model: 'glm-4-flash' });
  }
  return list;
}

const MAX_CHARS = 45000;

export const llmConfigured = () => getProviders().length > 0;

async function callSingleProvider(p: Provider, system: string, user: string, json: boolean): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 65000);
  try {
    const r = await fetch(`${p.base}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p.key}` },
      body: JSON.stringify({
        model: p.model,
        temperature: 0.25,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
      signal: ctrl.signal,
    });
    if (!r.ok) throw new Error(`${p.name} HTTP ${r.status}: ${(await r.text()).slice(0, 160)}`);
    const data: any = await r.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error(`${p.name} вернул пустой ответ`);
    return json ? extractJson(content) : cleanMarkdown(String(content));
  } finally {
    clearTimeout(timer);
  }
}

async function chat(system: string, user: string, json: boolean): Promise<string> {
  const providers = getProviders();
  const errors: string[] = [];
  for (const p of providers) {
    try {
      return await callSingleProvider(p, system, user, json);
    } catch (e: any) {
      errors.push(`${p.name}: ${e?.message || e}`);
    }
  }
  throw new Error(errors.join(' | '));
}

function cleanMarkdown(s: string): string {
  const trimmed = s.trim();
  const fence = trimmed.match(/^```(?:markdown|md)?\s*([\s\S]*?)```$/i);
  return (fence ? fence[1] : trimmed).trim();
}

function sanitizeJsonLatex(raw: string): string {
  // Protect LaTeX commands inside JSON strings where \f, \t, \b, \n, \r or \Omega would break JSON.parse
  return raw
    .replace(/\\(frac|forall|flat|fbox|text|textbf|textit|textrm|tau|theta|times|to|top|triangle|beta|binom|bar|begin|big|bmod|bot|bullet|neq|nabla|nu|notin|ni|natural|neg|rightarrow|Rightarrow|rho|rangle|rbrace|rceil|rfloor|setminus|sqrt|sum|subset|subseteq|supset|supseteq|sigma|Sigma|sim|simeq|sin|cos|tan|log|ln|lim|leq|geq|ll|gg|left|right|lambda|Lambda|cup|cap|cdot|cdots|circ|cong|alpha|approx|ast|asymp|delta|Delta|gamma|Gamma|epsilon|varepsilon|zeta|eta|iota|kappa|mu|xi|Xi|pi|Pi|varpi|varsigma|upsih|upsilon|Upsilon|phi|Phi|varphi|chi|psi|Psi|omega|Omega|infty|int|oint|partial|prod|pm|mp|equiv|exists|emptyset|varnothing|in|ell|hbar|mathbb|mathcal|mathfrak|mathrm|mathbf|mathsf|mathtt|overline|underline|widehat|widetilde|vec|hat|dot|ddot|quad|qquad|colon|mid|parallel|perp|angle|measuredangle|sphericalangle|therefore|because|dots|ldots|vdots|ddots)/g, '\\\\$1')
    .replace(/\\(?![/\\"bfnrt]|u[0-9a-fA-F]{4})/g, '\\\\');
}

function extractJson(s: string): string {
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) s = fence[1];
  const a = s.search(/[\[{]/);
  const b = Math.max(s.lastIndexOf('}'), s.lastIndexOf(']'));
  if (a < 0 || b < a) throw new Error('LLM вернул не JSON');
  const slice = s.slice(a, b + 1);
  try {
    JSON.parse(slice);
    return slice;
  } catch {
    return sanitizeJsonLatex(slice);
  }
}

const lang = (l: string) => (l === 'en' ? 'English' : 'русском языке');

const SYS = (l: string) =>
  `Ты — академический AI-ассистент StudyPilot уровня ведущего университетского преподавателя. Работай ТОЛЬКО на основе текста лекции пользователя. Ничего не выдумывай от себя, но излагай весь материал из лекции максимально полно, глубоко, структурно и понятно. Пиши на ${lang(l)}.`;

const clip = (t: string) => (t.length > MAX_CHARS ? t.slice(0, MAX_CHARS) : t);

async function jsonTask<T>(l: string, instruction: string, text: string): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < 2; i++) {
    try {
      const raw = await chat(SYS(l), `${instruction}\n\nВерни ТОЛЬКО валидный JSON без пояснений.\n\nТЕКСТ ЛЕКЦИИ:\n"""\n${clip(text)}\n"""`, true);
      return JSON.parse(raw) as T;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

// ---------- Local deterministic fallback (no LLM) ----------
const STOP = new Set('и в во не что он на я с со как а то все она так его но да ты к у же вы за бы по только ее мне было вот от меня еще нет о из ему теперь когда даже ну вдруг ли если уже или ни быть был него до вас нибудь опять уж вам ведь там потом себя ничего ей может они тут где есть надо ней для мы тебя их чем была сам чтоб без будто чего раз тоже себе под будет ж тогда кто этот того потому этого какой совсем ним здесь этом один почти мой тем чтобы нее сейчас были куда зачем всех никогда можно при наконец два об другой хоть после над больше тот через эти нас про всего них какая много разве три эту моя впрочем хорошо свою этой перед иногда лучше чуть том нельзя такой им более всегда конечно всю между the a an of and to in is are was were be been that this it for on with as by at or from which can'.split(' '));

function sentences(t: string): string[] {
  return t
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25 && s.length < 450);
}
function words(t: string): string[] {
  return (t.toLowerCase().match(/[a-zа-яё0-9-]{4,}/gi) || []).filter((w) => !STOP.has(w));
}
function topWords(t: string, n: number): string[] {
  const f = new Map<string, number>();
  for (const w of words(t)) f.set(w, (f.get(w) || 0) + 1);
  return [...f.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map((e) => e[0]);
}
function scoreSentences(t: string): { s: string; score: number; i: number }[] {
  const top = new Set(topWords(t, 25));
  return sentences(t).map((s, i) => ({ s, i, score: words(s).filter((w) => top.has(w)).length / Math.sqrt(words(s).length + 1) }));
}
function extractDefinitions(t: string): { term: string; definition: string }[] {
  const out: { term: string; definition: string }[] = [];
  const re = /([A-ZА-ЯЁ][\wа-яё\- ()]{2,45}?)\s+(?:—|–|-|это|is|are|называется|представляет собой)\s+([^.!?\n]{15,260})/g;
  for (const m of t.matchAll(re)) {
    const term = m[1].trim();
    if (term.split(' ').length <= 5 && !out.find((o) => o.term.toLowerCase() === term.toLowerCase())) out.push({ term, definition: m[2].trim() });
    if (out.length >= 16) break;
  }
  return out;
}

function localNotes(text: string, title: string) {
  const sc = scoreSentences(text);
  const best = [...sc].sort((a, b) => b.score - a.score).slice(0, 10).sort((a, b) => a.i - b.i);
  const paras = text.split(/\n\s*\n/).filter((p) => p.trim().length > 35).slice(0, 16);
  const terms = extractDefinitions(text);
  const keys = topWords(text, 8);
  const detailed =
    `# РАСШИРЕННЫЙ КОНСПЕКТ: ${title.toUpperCase()}\n\n` +
    paras
      .map((p, i) => {
        const lines = p.split(/\n/).map((x) => x.trim()).filter(Boolean);
        const heading = lines[0]?.length < 95 ? lines[0].replace(/^[#*\-\d.)\s]+/, '') : `Раздел ${i + 1}`;
        const sents = sentences(p);
        const bullets = (sents.length ? sents : lines).map((s) => {
          const defMatch = s.match(/^([^—–:-]{3,55})\s*(?:—|–|:|-)\s*(.+)$/);
          if (defMatch) return `- **${defMatch[1].trim()}:** ${defMatch[2].trim()}`;
          if (/пример|например|example/i.test(s)) return `  - **Пример:** ${s}`;
          return `- ${s}`;
        });
        return `## Раздел ${i + 1}: ${heading}\n${bullets.join('\n')}`;
      })
      .join('\n\n');
  return {
    subject: title,
    topic: keys.slice(0, 4).join(', '),
    summary: best.map((b) => `- **Ключевой тезис:** ${b.s}`).join('\n') || text.slice(0, 800),
    detailed: detailed || text.slice(0, 3000),
    terms: terms.length ? terms : keys.map((k) => ({ term: k, definition: (sc.find((x) => x.s.toLowerCase().includes(k)) || { s: '' }).s })).filter((t) => t.definition),
    examTopics: keys.map((k) => `Тема: «${k}»`),
    mindmap: { root: title, branches: keys.slice(0, 5).map((k) => ({ title: k, items: sentences(text).filter((s) => s.toLowerCase().includes(k)).slice(0, 3).map((s) => s.slice(0, 90)) })) },
  };
}

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

function localQuiz(text: string, count: number, types: string[]) {
  const defs = extractDefinitions(text);
  const sents = shuffle(sentences(text));
  const qs: any[] = [];
  const pool = defs.length >= 4 ? defs : [];
  let ti = 0;
  for (let i = 0; i < count; i++) {
    const type = types[ti++ % types.length];
    const s = sents[i % Math.max(sents.length, 1)] || text.slice(0, 120);
    const d = pool[i % Math.max(pool.length, 1)];
    if (type === 'mcq' && d) {
      const wrong = shuffle(pool.filter((p) => p.term !== d.term)).slice(0, 3).map((p) => p.term);
      const opts = shuffle([d.term, ...wrong]);
      qs.push({ type, q: `Какому понятию соответствует определение: «${d.definition}»?`, options: opts, answer: opts.indexOf(d.term), explanation: `${d.term} — ${d.definition}` });
    } else if (type === 'tf') {
      qs.push({ type, q: s, answer: true, explanation: 'Утверждение взято прямо из лекции.' });
    } else if (type === 'short' && d) {
      qs.push({ type, q: `Дайте термин: ${d.definition}`, answer: d.term, explanation: `${d.term} — ${d.definition}` });
    } else {
      qs.push({ type: 'open', q: `Объясните своими словами: «${s.slice(0, 140)}»`, answer: s, explanation: 'Сравните ответ с фрагментом лекции.' });
    }
  }
  return { questions: qs };
}

function localFlashcards(text: string) {
  const defs = extractDefinitions(text);
  if (defs.length) return { cards: defs.map((d) => ({ front: d.term, back: d.definition })) };
  return { cards: scoreSentences(text).sort((a, b) => b.score - a.score).slice(0, 10).map((x) => ({ front: `Что говорится о «${topWords(x.s, 1)[0] || 'теме'}»?`, back: x.s })) };
}

function localAsk(text: string, question: string) {
  const qw = new Set(words(question));
  const ranked = sentences(text)
    .map((s) => ({ s, score: words(s).filter((w) => qw.has(w) || [...qw].some((q) => q.length > 5 && w.startsWith(q.slice(0, 5)))).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  if (!ranked.length) return { found: false, answer: 'В загруженной лекции нет информации по этому вопросу.' };
  return { found: true, answer: ranked.map((r) => r.s).join(' '), quotes: ranked.map((r) => r.s) };
}

// ---------- Public API ----------
export type Engine = 'llm' | 'local';
async function withFallback<T>(llmFn: () => Promise<T>, localFn: () => T): Promise<{ data: T; engine: Engine; warning?: string }> {
  if (llmConfigured()) {
    try {
      return { data: await llmFn(), engine: 'llm' };
    } catch (e: any) {
      return { data: localFn(), engine: 'local', warning: `LLM недоступен (${e?.message || e}). Использован локальный режим.` };
    }
  }
  return { data: localFn(), engine: 'local', warning: 'LLM_API_KEY не задан на сервере. Использован локальный режим.' };
}

export const aiNotes = (text: string, title: string, l: string) =>
  withFallback(
    async () => {
      const detailedPrompt = `Составь РАСШИРЕННЫЙ, ПОЛНЫЙ И ГЛУБОКИЙ АКАДЕМИЧЕСКИЙ КОНСПЕКТ по всему тексту лекции «${title}» (в стиле университетского учебника и NotebookLM).
Конспект НЕ должен быть кратким или поверхностным — разбери каждую тему, каждое определение, каждую теорему, формулу, классификацию и пример из текста.

СТРОГИЕ ПРАВИЛА ОФОРМЛЕНИЯ (Markdown + LaTeX):
1. Начни с заголовка \`# РАСШИРЕННЫЙ КОНСПЕКТ: ${title.toUpperCase()}\`.
2. Разбей материал на логические разделы или лекции с заголовками \`## Лекция / Раздел N: Название темы\`.
3. Внутри каждого раздела используй иерархические маркированные списки:
   - Каждый основной пункт начинай с жирного понятия и двоеточия:
     \`- **Название понятия или закона ($символ$):** подробное академическое определение, суть и смысл.\`
   - Вложенные подпункты (с отступом в 2 пробела \`  - \`) обязательно используй для примеров, свойств, операций и пояснений:
     \`  - **Пример (...):** конкретный пример с числами, множествами или ситуацией из лекции.\`
     \`  - **Свойство / Операция (...):** подробное пояснение.\`
4. ВСЕ математические выражения, формулы, множества, греческие буквы и индексы оформляй ТОЛЬКО в чистом LaTeX (чтобы в тексте не было «сырых» текстовых кодов):
   - Встроенные в текст символы и выражения пиши в одинарных знаках доллара: например, $\\Omega$, $\\Omega = \\{1, 2, 3, 4, 5, 6\\}$, $A \\cup B$, $A \\cap B$, $P(A)$.
   - Ключевые формулы и уравнения ОБЯЗАТЕЛЬНО выноси на отдельную строку в двойных знаках доллара \`$$ ... $$\`, например:
     $$P(A) = \\frac{|A|}{|\\Omega|} = \\frac{\\text{количество благоприятных исходов}}{\\text{общее число исходов}}$$
5. Не пиши никаких вступлений от себя и не оборачивай весь ответ в тройные кавычки \`\`\` — сразу выдавай готовый конспект.

ТЕКСТ ЛЕКЦИИ:
"""
${clip(text)}
"""`;

      const metaPrompt = `Проанализируй лекцию «${title}» и верни JSON следующей структуры:
{
  "subject": "Название предмета",
  "topic": "Основные темы через запятую",
  "summary": "Структурированная выжимка лекции на 1 страницу в Markdown: 6-10 пунктов вида '- **Понятие:** суть и главная формула в $...$'",
  "terms": [{"term": "Термин (и символ в $...$ если есть)", "definition": "Чёткое полное определение и формула в $...$ если применимо"}] (от 8 до 16 важнейших терминов),
  "examTopics": ["Вопрос или тема для экзамена 1", "Вопрос или тема 2"] (от 6 до 12 тем),
  "mindmap": {"root": "${title}", "branches": [{"title": "Название раздела", "items": ["Ключевой пункт 1", "Ключевой пункт 2", "Ключевой пункт 3"]}]} (от 4 до 6 веток)
}`;

      const [detailed, meta] = await Promise.all([
        chat(SYS(l), detailedPrompt, false),
        jsonTask<any>(l, metaPrompt, text),
      ]);

      return {
        subject: meta?.subject || title,
        topic: meta?.topic || title,
        summary: meta?.summary || detailed.slice(0, 1200),
        detailed: detailed || meta?.detailed || '',
        terms: Array.isArray(meta?.terms) ? meta.terms : [],
        examTopics: Array.isArray(meta?.examTopics) ? meta.examTopics : [],
        mindmap: meta?.mindmap && Array.isArray(meta.mindmap.branches) ? meta.mindmap : { root: title, branches: [] },
      };
    },
    () => localNotes(text, title),
  );

export const aiQuiz = (text: string, count: number, types: string[], difficulty: string, l: string) =>
  withFallback(
    () =>
      jsonTask<any>(
        l,
        `Составь тест из ровно ${count} вопросов. Допустимые типы: ${types.join(', ')} (mcq — 4 варианта; tf — верно/неверно; short — короткий ответ; open — открытый вопрос). Сложность: ${difficulty}. Формулы оформляй в $...$. JSON: {"questions":[{"type":"mcq|tf|short|open","q":string,"options":[string] (только mcq),"answer": для mcq — индекс правильного варианта (число), для tf — true/false, для short/open — строка с эталонным ответом,"explanation":string}]}. Вопросы должны проверяться только по тексту лекции.`,
        text,
      ),
    () => localQuiz(text, count, types),
  );

export const aiFlashcards = (text: string, l: string) =>
  withFallback(
    () => jsonTask<any>(l, `Создай 12-20 карточек для запоминания ключевых определений, формул и законов лекции. Формулы пиши в $...$. JSON: {"cards":[{"front":string,"back":string}]}`, text),
    () => localFlashcards(text),
  );

export const aiAsk = (text: string, question: string, l: string) =>
  withFallback(
    async () => {
      const r = await jsonTask<any>(
        l,
        `Ответь на вопрос пользователя ТОЛЬКО по тексту лекции, подробно и структурно (используй списки, **жирный шрифт** и формулы в $...$ или $$...$$ при необходимости). Если в тексте нет информации — верни found=false и честно скажи об этом. JSON: {"found":boolean,"answer":string,"quotes":[string] (1-2 короткие цитаты из лекции, подтверждающие ответ)}.\nВОПРОС: ${question}`,
        text,
      );
      return r;
    },
    () => localAsk(text, question),
  );

export const aiSimplify = (fragment: string, l: string) =>
  withFallback(
    () => chat(`Ты объясняешь учебный материал простыми словами, на ${lang(l)}. Используй только смысл данного фрагмента, добавь короткую жизненную аналогию или пример. Формулы пиши в $...$. До 140 слов.`, fragment.slice(0, 4000), false).then((t) => ({ text: t })),
    () => ({ text: `Простыми словами: ${fragment.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ')}` }),
  );
