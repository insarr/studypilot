import { CheckCircle2, Cpu, Loader2, Sparkles } from 'lucide-react';
import { AnimatePresence, motion, type Transition } from 'motion/react';
import { useState } from 'react';

export type IslandTaskStatus = 'running' | 'done' | 'error';

export interface IslandTask {
  id: string;
  label: string;
  detail?: string;
  status: IslandTaskStatus;
  progress?: number;
  action?: { label: string; onClick: () => void };
}

export interface StatusIslandProps {
  tasks: IslandTask[];
  streakCount?: number;
  aiOnline?: boolean;
  className?: string;
}

const MORPH: Transition = { type: 'spring', duration: 0.45, bounce: 0.18 };

export function RollingNumber({ value }: { value: number }) {
  return (
    <motion.span
      key={value}
      initial={{ y: 8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.22 }}
      style={{ display: 'inline-block', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}
    >
      {value}
    </motion.span>
  );
}

export default function StatusIsland({
  tasks,
  streakCount = 1,
  aiOnline = true,
  className = '',
}: StatusIslandProps) {
  const [expanded, setExpanded] = useState(false);
  const current = tasks[tasks.length - 1];

  return (
    <div className={`ku-island-anchor ${className}`}>
      <motion.div
        layout
        transition={MORPH}
        onClick={() => setExpanded((v) => !v)}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={`ku-island ${expanded ? 'open' : ''}`}
        role="status"
        aria-live="polite"
      >
        <motion.div layout="position" className="ku-island-bar">
          <span className={`ku-island-led ${current?.status === 'running' ? 'pulse' : aiOnline ? 'ok' : 'warn'}`}>
            {current?.status === 'running' ? (
              <Loader2 size={13} className="ku-spin" />
            ) : (
              <Sparkles size={13} />
            )}
          </span>
          <span className="ku-island-title">{current?.label || 'AI Ready'}</span>
          {current?.detail && <span className="ku-island-sub hide-m">· {current.detail}</span>}
          <span className="ku-island-streak" title="Study streak">
            <img src="/badges/streak-fire.png" alt="" style={{ width: 17, height: 17, objectFit: 'contain' }} />
            <RollingNumber value={streakCount} />
          </span>
        </motion.div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="ku-island-body"
            >
              <div className="ku-island-grid">
                {tasks.map((t) => (
                  <div key={t.id} className="ku-island-row">
                    <span className="ku-island-ic">
                      {t.status === 'running' ? (
                        <Loader2 size={14} className="ku-spin" />
                      ) : t.status === 'done' ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <Cpu size={14} />
                      )}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{t.label}</div>
                      {t.detail && <div style={{ fontSize: 11, opacity: 0.72 }}>{t.detail}</div>}
                    </div>
                    {t.action && (
                      <button
                        type="button"
                        className="ku-island-act"
                        onClick={(e) => {
                          e.stopPropagation();
                          t.action?.onClick();
                        }}
                      >
                        {t.action.label}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
