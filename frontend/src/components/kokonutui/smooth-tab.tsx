import type { LucideIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { type ReactNode, useId, useState } from 'react';

export interface SmoothTabItem {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: string | number;
  content?: ReactNode;
}

export interface SmoothTabProps {
  items: SmoothTabItem[];
  defaultTabId?: string;
  value?: string;
  onChange?: (tabId: string) => void;
  className?: string;
  activeColor?: string;
  label?: string;
}

const SPRING = { type: 'spring', stiffness: 420, damping: 36 } as const;

export default function SmoothTab({
  items,
  defaultTabId,
  value,
  onChange,
  className = '',
  activeColor,
  label = 'Tabs',
}: SmoothTabProps) {
  const uid = useId();
  const [internal, setInternal] = useState(defaultTabId || items[0]?.id || '');
  const activeId = value !== undefined ? value : internal;

  const select = (id: string) => {
    if (value === undefined) setInternal(id);
    onChange?.(id);
  };

  const activeItem = items.find((it) => it.id === activeId) || items[0];

  return (
    <div className={`ku-smooth-tab-wrap ${className}`}>
      <div className="ku-smooth-tablist" role="tablist" aria-label={label}>
        {items.map((item) => {
          const isActive = item.id === activeId;
          const IconComp = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => select(item.id)}
              className={`ku-smooth-tab-btn ${isActive ? 'active' : ''}`}
            >
              {isActive && (
                <motion.span
                  layoutId={`${uid}-pill`}
                  className="ku-smooth-tab-pill"
                  style={activeColor ? { background: activeColor } : undefined}
                  transition={SPRING}
                />
              )}
              <span className="ku-smooth-tab-label">
                {IconComp && <IconComp size={15} strokeWidth={2.1} />}
                <span>{item.title}</span>
                {item.badge !== undefined && (
                  <span className="ku-smooth-tab-badge">{item.badge}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {activeItem?.content !== undefined && (
        <div className="ku-smooth-tab-panel">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeItem.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeItem.content}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
