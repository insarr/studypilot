import { Check, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { type ReactNode, useState } from 'react';

export interface StackRow {
  id: string;
  label: string;
  detail?: string;
  to?: string;
  trailing?: ReactNode;
  onSelect?: () => void;
  selected?: boolean;
  checked?: boolean;
  tone?: 'default' | 'danger';
}

export interface StackSection {
  title?: string;
  rows: StackRow[];
  footer?: string;
}

export interface StackPage {
  title: string;
  subtitle?: string;
  sections: StackSection[];
}

export interface StackPanelProps {
  pages: Record<string, StackPage>;
  root: string;
  className?: string;
}

const PUSH = { type: 'spring', duration: 0.38, bounce: 0.08 } as const;

export default function StackPanel({ pages, root, className = '' }: StackPanelProps) {
  const [stack, setStack] = useState<string[]>([root]);
  const [dir, setDir] = useState<1 | -1>(1);
  const [toggles, setToggles] = useState<Record<string, boolean>>({});

  const currentKey = stack[stack.length - 1] || root;
  const currentPage = pages[currentKey] || pages[root];
  const prevKey = stack.length > 1 ? stack[stack.length - 2] : null;
  const prevPage = prevKey ? pages[prevKey] : null;

  const push = (to: string) => {
    if (!pages[to]) return;
    setDir(1);
    setStack((s) => [...s, to]);
  };

  const pop = () => {
    if (stack.length <= 1) return;
    setDir(-1);
    setStack((s) => s.slice(0, -1));
  };

  return (
    <div className={`ku-stack-panel ${className}`}>
      <div className="ku-stack-header">
        {prevPage ? (
          <button type="button" onClick={pop} className="ku-stack-back">
            <ChevronLeft size={16} />
            <span>{prevPage.title}</span>
          </button>
        ) : (
          <span className="ku-stack-root-badge">
            <Layers size={14} /> StudyPilot
          </span>
        )}
        <div className="ku-stack-title">{currentPage?.title}</div>
        <span style={{ width: 64 }} />
      </div>

      <div className="ku-stack-viewport">
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div
            key={currentKey}
            custom={dir}
            initial={{ opacity: 0, x: dir * 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -36 }}
            transition={PUSH}
            className="ku-stack-page"
          >
            {currentPage?.sections.map((sec, si) => (
              <div key={si} className="ku-stack-sec">
                {sec.title && <div className="ku-stack-sec-title">{sec.title}</div>}
                <div className="ku-stack-card">
                  {sec.rows.map((row) => {
                    const isChecked =
                      toggles[row.id] !== undefined ? toggles[row.id] : row.checked;
                    return (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => {
                          if (row.to) push(row.to);
                          else if (row.checked !== undefined) {
                            setToggles((t) => ({ ...t, [row.id]: !isChecked }));
                          }
                          row.onSelect?.();
                        }}
                        className={`ku-stack-row ${row.tone === 'danger' ? 'danger' : ''}`}
                      >
                        <span className="ku-stack-row-lbl">{row.label}</span>
                        <span className="ku-stack-row-right">
                          {row.detail && <span className="ku-stack-detail">{row.detail}</span>}
                          {row.trailing}
                          {row.selected && <Check size={15} className="ku-stack-check" />}
                          {row.checked !== undefined && (
                            <span className={`ku-switch ${isChecked ? 'on' : ''}`}>
                              <span className="ku-switch-thumb" />
                            </span>
                          )}
                          {row.to && <ChevronRight size={15} className="ku-stack-chev" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {sec.footer && <div className="ku-stack-footer">{sec.footer}</div>}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
