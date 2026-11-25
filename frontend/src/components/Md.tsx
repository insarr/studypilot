import { Fragment, useState, type ReactNode } from 'react';
import { Lightbulb } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { api } from '../api';
import { useStore, useT } from '../store';

function renderMath(expr: string, displayMode: boolean): string {
  const cleaned = expr.trim();
  if (!cleaned) return '';
  try {
    return katex.renderToString(cleaned, {
      displayMode,
      throwOnError: false,
      strict: false,
      trust: true,
    });
  } catch {
    return cleaned;
  }
}

// Render inline Markdown (**bold**, *italic*, `code`) and inline LaTeX ($...$)
export function InlineMd({ text }: { text: string }) {
  if (!text) return null;
  // Normalize \( ... \) to $ ... $
  let normalized = text.replace(/\\\(([\s\S]+?)\\\)/g, (_m, g1) => `$${g1}$`);

  // Also wrap bare LaTeX expressions like \frac{...}{...} or standalone Greek/set commands if outside $...$
  const tokenRegex = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\*\*[^*\n]+?\*\*|__[^_\n]+?__|\*[^*\n]+?\*|`[^`\n]+?`)/g;
  const parts = normalized.split(tokenRegex);

  const nodes: ReactNode[] = parts.map((part, idx) => {
    if (!part) return null;
    if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
      const html = renderMath(part.slice(2, -2), true);
      return <span key={idx} className="md-math-inline-block" dangerouslySetInnerHTML={{ __html: html }} />;
    }
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      const html = renderMath(part.slice(1, -1), false);
      return <span key={idx} className="md-math-inline" dangerouslySetInnerHTML={{ __html: html }} />;
    }
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      const inner = part.slice(2, -2);
      return <strong key={idx} className="md-strong"><InlineMd text={inner} /></strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      const inner = part.slice(1, -1);
      return <em key={idx}><InlineMd text={inner} /></em>;
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return <code key={idx} className="md-code">{part.slice(1, -1)}</code>;
    }
    // Check if plain text contains bare LaTeX commands like \Omega, \cup, \cap, \in, \subset, \frac{a}{b}
    if (/\\[a-zA-Z]{2,}/.test(part)) {
      const withMath = part.replace(
        /(\\frac\{[^{}]+\}\{[^{}]+\}|\\sqrt\{[^{}]+\}|\\(?:Omega|omega|alpha|beta|gamma|delta|Delta|epsilon|theta|lambda|Lambda|mu|pi|Pi|sigma|Sigma|tau|phi|Phi|psi|Psi|cup|cap|subset|subseteq|in|notin|forall|exists|infty|cdot|times|pm|leq|geq|neq|approx|equiv|rightarrow|Rightarrow))\b/g,
        (m) => `<span class="md-math-inline">${renderMath(m, false)}</span>`,
      );
      if (withMath !== part) {
        return <span key={idx} dangerouslySetInnerHTML={{ __html: withMath.replace(/\*\*/g, '') }} />;
      }
    }
    // Strip any stray unclosed ** symbols so raw asterisks never show
    return <Fragment key={idx}>{part.replace(/\*\*/g, '')}</Fragment>;
  });

  return <>{nodes}</>;
}

type Block =
  | { kind: 'h1' | 'h2' | 'h3'; text: string }
  | { kind: 'math'; latex: string }
  | { kind: 'bullet'; level: number; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'hr' };

function parseBlocks(rawText: string): Block[] {
  if (!rawText) return [];
  // Normalize line breaks and \[ ... \] display math
  let s = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\\\[([\s\S]+?)\\\]/g, (_m, g1) => `\n$$\n${g1.trim()}\n$$\n`);

  // Ensure inline $$...$$ on a line with text is split onto its own display math block
  s = s.replace(/([^\n])\s*\$\$([\s\S]+?)\$\$\s*([^\n]*)/g, (_m, before, math, after) => {
    return `${before}\n$$\n${math.trim()}\n$$\n${after}`;
  });

  const lines = s.split('\n');
  const blocks: Block[] = [];
  let inMath = false;
  let mathBuf: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Multi-line or single-line $$ math block
    if (trimmed.startsWith('$$')) {
      if (!inMath) {
        if (trimmed.endsWith('$$') && trimmed.length > 4) {
          blocks.push({ kind: 'math', latex: trimmed.slice(2, -2).trim() });
          continue;
        }
        inMath = true;
        const first = trimmed.slice(2).trim();
        if (first) mathBuf.push(first);
        continue;
      } else {
        const last = trimmed.slice(0, -2).trim();
        if (last) mathBuf.push(last);
        blocks.push({ kind: 'math', latex: mathBuf.join('\n') });
        mathBuf = [];
        inMath = false;
        continue;
      }
    }

    if (inMath) {
      if (trimmed.endsWith('$$')) {
        const last = trimmed.slice(0, -2).trim();
        if (last) mathBuf.push(last);
        blocks.push({ kind: 'math', latex: mathBuf.join('\n') });
        mathBuf = [];
        inMath = false;
      } else {
        mathBuf.push(rawLine);
      }
      continue;
    }

    if (!trimmed) continue;
    if (/^---+$/.test(trimmed)) {
      blocks.push({ kind: 'hr' });
      continue;
    }

    // Headings
    if (/^#\s+/.test(trimmed)) {
      blocks.push({ kind: 'h1', text: trimmed.replace(/^#\s+/, '').replace(/\*\*/g, '') });
      continue;
    }
    if (/^##\s+/.test(trimmed)) {
      blocks.push({ kind: 'h2', text: trimmed.replace(/^##\s+/, '').replace(/\*\*/g, '') });
      continue;
    }
    if (/^#{3,6}\s+/.test(trimmed)) {
      blocks.push({ kind: 'h3', text: trimmed.replace(/^#{3,6}\s+/, '').replace(/\*\*/g, '') });
      continue;
    }

    // Bullet / numbered list items with indentation level
    const bulletMatch = rawLine.match(/^(\s*)(?:[-•*◦]|\d+[.)])\s+(.+)$/);
    if (bulletMatch) {
      const indentSpaces = bulletMatch[1].replace(/\t/g, '  ').length;
      const body = bulletMatch[2].trim();
      let level = indentSpaces >= 4 ? 2 : indentSpaces >= 2 ? 1 : 0;
      // Auto-indent "Пример" / "Example" sub-items even if LLM forgot leading spaces
      if (level === 0 && /^(\*\*)?(Пример|Например|Example|Частный случай)/i.test(body)) {
        level = 1;
      }
      blocks.push({ kind: 'bullet', level, text: body });
      continue;
    }

    blocks.push({ kind: 'p', text: trimmed });
  }

  if (mathBuf.length) {
    blocks.push({ kind: 'math', latex: mathBuf.join('\n') });
  }

  return blocks;
}

export function Md({
  text,
  simplifiable = true,
  source,
}: {
  text: string;
  simplifiable?: boolean;
  source?: string;
}) {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const toast = useStore((s) => s.toast);
  const [out, setOut] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);

  const simplify = async (i: number, frag: string) => {
    if (out[i]) {
      setOut((o) => {
        const n = { ...o };
        delete n[i];
        return n;
      });
      return;
    }
    setBusy(i);
    try {
      const cleanFrag = frag.replace(/[*$`#]/g, '');
      const r = await api.simplify(cleanFrag, lang);
      setOut((o) => ({ ...o, [i]: r.data.text }));
    } catch (e: any) {
      toast(e.message, 'err');
    } finally {
      setBusy(null);
    }
  };

  const blocks = parseBlocks(text);

  return (
    <div className="md-doc">
      {blocks.map((b, i) => {
        if (b.kind === 'hr') return <hr key={i} className="md-hr" />;
        if (b.kind === 'h1') return <h1 key={i} className="md-h1"><InlineMd text={b.text} /></h1>;
        if (b.kind === 'h2') return <h2 key={i} className="md-h2"><InlineMd text={b.text} /></h2>;
        if (b.kind === 'h3') return <h3 key={i} className="md-h3"><InlineMd text={b.text} /></h3>;
        if (b.kind === 'math') {
          const html = renderMath(b.latex, true);
          return <div key={i} className="md-math-block" dangerouslySetInnerHTML={{ __html: html }} />;
        }

        const isBullet = b.kind === 'bullet';
        const level = isBullet ? b.level : 0;
        const showSource = source && isBullet && b.text.length > 22 && !b.text.endsWith(':');

        return (
          <div key={i} className={isBullet ? `md-li md-li-l${level}` : 'md-para'}>
            <div className="md-line-row">
              {isBullet && <span className="md-bullet-ring" aria-hidden="true" />}
              <div className="md-line-body">
                <InlineMd text={b.text} />
                {showSource && <span className="md-src-pill">{source}</span>}
              </div>
              {simplifiable && b.text.length > 35 && (
                <button
                  type="button"
                  className="md-simpler-btn"
                  onClick={() => simplify(i, b.text)}
                  disabled={busy === i}
                  title={t('Объяснить простыми словами', 'Explain in simple terms')}
                >
                  {busy === i ? <span className="spin" style={{ width: 12, height: 12 }} /> : <Lightbulb size={15} />}
                </button>
              )}
            </div>
            {out[i] && (
              <div className="md-simple-box">
                <span className="md-simple-tag"><Lightbulb size={14} style={{ display: 'inline', verticalAlign: '-2px' }} /> {t('Простыми словами:', 'In simple words:')}</span>{' '}
                <InlineMd text={out[i]} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
