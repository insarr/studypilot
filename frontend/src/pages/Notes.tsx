import {
  BookOpen,
  FileText,
  GitBranch,
  GraduationCap,
  Lightbulb,
  ListChecks,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore, useT } from '../store';
import { Empty, PageHead, Spinner } from '../components/UI';
import { Icon } from '../components/Icon';
import { InlineMd, Md } from '../components/Md';
import { Hl } from '../components/Deco';
import SmoothTab from '../components/kokonutui/smooth-tab';
import ScrollIndex from '../components/kokonutui/scroll-index';
import { api } from '../api';
import { generateNotes } from '../actions';
import { fmtDate } from '../lib';
import type { Lecture } from '../types';

type NTab = 'detailed' | 'short' | 'terms' | 'mind' | 'exam';

function Term({ term, definition }: { term: string; definition: string }) {
  const t = useT();
  const { lang, toast } = useStore();
  const [simple, setSimple] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async () => {
    if (simple) return setSimple('');
    setBusy(true);
    try {
      setSimple((await api.simplify(`${term} — ${definition}`, lang)).data.text);
    } catch (e: any) {
      toast(e.message, 'err');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="card" style={{ boxShadow: 'none' }}>
      <div className="row spread" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <b><Hl><InlineMd text={term} /></Hl></b>
          <p style={{ marginTop: 6, overflowWrap: 'anywhere', lineHeight: 1.6 }}><InlineMd text={definition} /></p>
        </div>
        <button className="btn btn-soft btn-sm" onClick={run} disabled={busy} style={{ flexShrink: 0 }}>
          {busy ? <span className="spin" style={{ width: 12, height: 12 }} /> : <Lightbulb size={14} />}
          <span className="hide-m"> {t('Проще', 'Simpler')}</span>
        </button>
      </div>
      {simple && (
        <p style={{ marginTop: 8, padding: '8px 12px', borderRadius: 10, background: 'color-mix(in srgb, var(--color-marigold) 35%, transparent)' }}>
          <Lightbulb size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
          <InlineMd text={simple} />
        </p>
      )}
    </div>
  );
}

export function NotesView({ lecture }: { lecture: Lecture }) {
  const t = useT();
  const [tab, setTab] = useState<NTab>('detailed');
  const [busy, setBusy] = useState(false);
  const n = lecture.notes!;
  const sourceLabel = lecture.fileName || `${lecture.title.slice(0, 28)}.${lecture.kind === 'text' ? 'txt' : lecture.kind}`;

  const exportMd = () => {
    const md = `# ${lecture.title}\n\n## ${t('Расширенный конспект', 'Extended notes')}\n${n.detailed}\n\n## ${t('Краткий конспект', 'Summary')}\n${n.summary}\n\n## ${t('Термины', 'Terms')}\n${n.terms.map((x) => `- **${x.term}** — ${x.definition}`).join('\n')}\n\n## ${t('Темы для экзамена', 'Exam topics')}\n${n.examTopics.map((x) => `- ${x}`).join('\n')}\n`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([md], { type: 'text/markdown;charset=utf-8' }));
    a.download = `${lecture.title.replace(/[^\p{L}\p{N}]+/gu, '_')}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="stack">
      <div className="row spread">
        {/* Kokonut UI SmoothTab */}
        <SmoothTab
          value={tab}
          onChange={(id) => setTab(id as NTab)}
          items={[
            { id: 'detailed', title: t('Расширенный конспект', 'Extended notes'), icon: BookOpen },
            { id: 'short', title: t('Кратко (1 стр.)', '1-Page Summary'), icon: FileText },
            { id: 'terms', title: t('Термины', 'Terms'), icon: ListChecks, badge: n.terms.length },
            { id: 'mind', title: 'Mind map', icon: GitBranch },
            { id: 'exam', title: t('Темы экзамена', 'Exam topics'), icon: GraduationCap },
          ]}
        />
        <div className="row">
          {n.engine === 'local' && (
            <span className="badge warn" title={t('LLM недоступен — использован локальный алгоритм', 'LLM unavailable — local algorithm used')}>
              {t('локальный режим', 'local mode')}
            </span>
          )}
          <button className="btn btn-ghost btn-sm" onClick={exportMd}>
            <Icon name="download" size={15} />.md
          </button>
          <button
            className="btn btn-primary btn-sm"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await generateNotes(lecture.id);
              setBusy(false);
            }}
          >
            {busy ? <Spinner label={t('Пишем конспект…', 'Writing notes…')} /> : <><Icon name="sparkle" size={15} />{t('Пересоздать с ИИ', 'Regenerate with AI')}</>}
          </button>
        </div>
      </div>

      {tab === 'detailed' && (
        /* Kokonut UI ScrollIndex for Extended Notes */
        <ScrollIndex label={t('Оглавление лекции', 'Lecture Index')} selector="h1, h2, h3">
          <div className="paper academic-notes">
            <Md text={n.detailed || n.summary} source={sourceLabel} />
          </div>
        </ScrollIndex>
      )}
      {tab === 'short' && (
        <div className="paper academic-notes">
          <h1 className="md-h1">{t('КРАТКАЯ ВЫЖИМКА ЛЕКЦИИ', 'LECTURE SUMMARY')}</h1>
          <Md text={n.summary} source={sourceLabel} />
        </div>
      )}
      {tab === 'terms' && (
        <div className="grid g2">
          {n.terms.length ? (
            n.terms.map((x, i) => <Term key={i} {...x} />)
          ) : (
            <div className="card"><Empty title={t('Термины не найдены', 'No terms found')} /></div>
          )}
        </div>
      )}
      {tab === 'mind' && (
        <div className="card">
          {n.mindmap.branches.length === 0 ? (
            <Empty title={t('Схема недоступна', 'No mind map')} />
          ) : (
            <div className="mind">
              <div className="mind-root"><InlineMd text={n.mindmap.root || lecture.title} /></div>
              <div className="mind-br">
                {n.mindmap.branches.map((b, i) => (
                  <div key={i} className="mind-node">
                    <b><InlineMd text={b.title} /></b>
                    {b.items?.length > 0 && (
                      <ul>
                        {b.items.map((it, j) => (
                          <li key={j}><InlineMd text={it} /></li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {tab === 'exam' && (
        <div className="card">
          <h3 className="row" style={{ gap: 8 }}>
            <GraduationCap size={20} />
            <span>{t('Что может встретиться на экзамене', 'What may appear on the exam')}</span>
          </h3>
          {n.examTopics.map((x, i) => (
            <div key={i} className="list-row">
              <span className="badge">{i + 1}</span>
              <span><InlineMd text={x} /></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Notes() {
  const t = useT();
  const { data, lang } = useStore();
  const withNotes = data.lectures.filter((l) => l.notes);
  const [sel, setSel] = useState<string>('');
  const cur = withNotes.find((l) => l.id === sel) || withNotes[0];
  const without = data.lectures.filter((l) => !l.notes);

  return (
    <>
      <PageHead
        title={t('Конспекты', 'Notes')}
        sub={t('Расширенные академические конспекты с формулами, примерами, терминами и mind map.', 'Extended academic notes with formulas, examples, terms, and mind maps.')}
      />
      {data.lectures.length === 0 ? (
        <div className="card">
          <Empty
            title={t('Конспектов пока нет', 'No notes yet')}
            text={t('Загрузите лекцию — конспект появится здесь.', 'Upload a lecture — notes will appear here.')}
            action={<Link to="/lectures?new=1" className="btn btn-primary">{t('Загрузить лекцию', 'Upload lecture')}</Link>}
          />
        </div>
      ) : (
        <div className="notes-grid">
          <div className="card">
            <h3>{t('Лекции', 'Lectures')}</h3>
            {withNotes.map((l) => (
              <button
                key={l.id}
                className="dd-item"
                style={{ background: cur?.id === l.id ? 'var(--card-2)' : undefined }}
                onClick={() => setSel(l.id)}
              >
                <Icon name="note" size={16} />
                <span className="grow trunc">{l.title}</span>
                <span className="muted sm">{fmtDate(l.notes!.createdAt, lang)}</span>
              </button>
            ))}
            {without.length > 0 && (
              <>
                <div className="muted sm" style={{ margin: '12px 0 4px' }}>{t('Без конспекта', 'Without notes')}</div>
                {without.map((l) => (
                  <Link key={l.id} to={`/lectures/${l.id}`} className="dd-item muted">
                    <Icon name="file" size={16} />
                    <span className="grow trunc">{l.title}</span>
                  </Link>
                ))}
              </>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            {cur ? (
              <>
                <h2 style={{ marginBottom: 12 }}>
                  {cur.title}{' '}
                  <Link to={`/lectures/${cur.id}`} className="btn btn-soft btn-sm">
                    {t('Открыть лекцию', 'Open lecture')}
                  </Link>
                </h2>
                <NotesView key={cur.id} lecture={cur} />
              </>
            ) : (
              <div className="card">
                <Empty
                  title={t('Выберите лекцию', 'Select a lecture')}
                  text={t('Создайте конспект на странице лекции.', 'Generate notes on the lecture page.')}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
