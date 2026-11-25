import gsap from 'gsap';
import { type CSSProperties, type MouseEvent, type ReactNode, useRef } from 'react';

export default function GsapTiltCard({
  children,
  className = '',
  style,
  onClick,
  intensity = 7,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    gsap.to(el, {
      rotateY: x * intensity,
      rotateX: -y * intensity,
      y: -5,
      scale: 1.012,
      transformPerspective: 900,
      duration: 0.35,
      ease: 'power2.out',
    });
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    gsap.to(el, {
      rotateY: 0,
      rotateX: 0,
      y: 0,
      scale: 1,
      duration: 0.5,
      ease: 'elastic.out(1, 0.6)',
    });
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{ willChange: 'transform', ...style }}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </div>
  );
}
