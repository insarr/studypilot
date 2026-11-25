import { motion } from 'motion/react';
import { type ReactNode, useEffect, useRef, useState } from 'react';

export interface ScrollIndexProps {
  children?: ReactNode;
  selector?: string;
  className?: string;
  label?: string;
}

interface SectionItem {
  el: HTMLElement;
  text: string;
  level: number;
}

export default function ScrollIndex({
  children,
  selector = 'h1, h2, h3',
  className = '',
  label = 'Оглавление',
}: ScrollIndexProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    const root = containerRef.current || document;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>(selector));
    const list: SectionItem[] = nodes
      .map((el) => ({
        el,
        text: (el.textContent || '').trim(),
        level: Number(el.tagName.replace('H', '')) || 2,
      }))
      .filter((s) => s.text.length > 1);
    setSections(list);
  }, [children, selector]);

  useEffect(() => {
    if (!sections.length) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const threshold = window.innerHeight * 0.32;
        let idx = 0;
        for (let i = 0; i < sections.length; i++) {
          const rect = sections[i].el.getBoundingClientRect();
          if (rect.top <= threshold) idx = i;
        }
        setActive(idx);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, [sections]);

  const jumpTo = (i: number) => {
    const target = sections[i]?.el;
    if (!target) return;
    setActive(i);
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div ref={containerRef} className={`ku-scroll-index-layout ${className}`}>
      <div className="ku-scroll-index-content">{children}</div>
      {sections.length > 1 && (
        <aside className="ku-scroll-rail-wrap hide-m" aria-label={label}>
          <div className="ku-scroll-rail">
            <div className="ku-scroll-rail-title">{label}</div>
            {sections.map((sec, i) => {
              const isCurrent = i === active;
              const isPassed = i < active;
              const dist = hovered === null ? 99 : Math.abs(hovered - i);
              const widthScale = dist === 0 ? 1.45 : dist === 1 ? 1.2 : 1;
              return (
                <button
                  key={`${sec.text}-${i}`}
                  type="button"
                  onClick={() => jumpTo(i)}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  className={`ku-scroll-tick ${isCurrent ? 'current' : isPassed ? 'passed' : 'ahead'} lv-${sec.level}`}
                >
                  <motion.span
                    animate={{ scaleX: widthScale }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    className="ku-scroll-bar"
                  />
                  <span className="ku-scroll-text trunc">{sec.text}</span>
                </button>
              );
            })}
          </div>
        </aside>
      )}
    </div>
  );
}
