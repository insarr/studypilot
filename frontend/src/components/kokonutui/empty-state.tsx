import { BookOpen, FileText, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { type ReactNode, useState } from 'react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

const SPRING = { type: 'spring', stiffness: 380, damping: 28 } as const;

export default function EmptyState({
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  const [primed, setPrimed] = useState(false);

  return (
    <div
      className={`ku-empty-state ${className}`}
      onMouseEnter={() => setPrimed(true)}
      onMouseLeave={() => setPrimed(false)}
    >
      <div className="ku-empty-fan" aria-hidden="true">
        <motion.div
          animate={{
            rotate: primed ? -14 : -7,
            x: primed ? -30 : -18,
            y: primed ? -4 : 2,
          }}
          transition={SPRING}
          className="ku-empty-card c1"
        >
          <FileText size={20} />
        </motion.div>

        <motion.div
          animate={{
            y: primed ? -10 : 0,
            scale: primed ? 1.06 : 1,
          }}
          transition={SPRING}
          className="ku-empty-card c2"
        >
          <BookOpen size={22} />
        </motion.div>

        <motion.div
          animate={{
            rotate: primed ? 14 : 7,
            x: primed ? 30 : 18,
            y: primed ? -4 : 2,
          }}
          transition={SPRING}
          className="ku-empty-card c3"
        >
          <Sparkles size={20} />
        </motion.div>
      </div>

      <h3 className="ku-empty-title">{title}</h3>
      {description && <p className="ku-empty-desc">{description}</p>}
      {action && <div className="ku-empty-action">{action}</div>}
    </div>
  );
}
