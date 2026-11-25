import lottie, { type AnimationItem } from 'lottie-web';
import { useEffect, useRef } from 'react';

// Self-contained Lottie 4-point academic star & orbit pulse JSON (no external fetch required)
const SPARKLE_LOTTIE_DATA = {
  v: '5.7.4',
  fr: 60,
  ip: 0,
  op: 120,
  w: 100,
  h: 100,
  nm: 'StudyPilotSparkle',
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'Star',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: {
          a: 1,
          k: [
            { t: 0, s: [0], e: [180], i: { x: [0.42], y: [1] }, o: { x: [0.58], y: [0] } },
            { t: 120, s: [180] },
          ],
        },
        p: { a: 0, k: [50, 50, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [82, 82, 100], e: [108, 108, 100], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
            { t: 60, s: [108, 108, 100], e: [82, 82, 100], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
            { t: 120, s: [82, 82, 100] },
          ],
        },
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          it: [
            {
              ty: 'sr',
              sy: 1,
              d: 1,
              pt: { a: 0, k: 4 },
              p: { a: 0, k: [0, 0] },
              r: { a: 0, k: 0 },
              ir: { a: 0, k: 11 },
              is: { a: 0, k: 0 },
              or: { a: 0, k: 34 },
              os: { a: 0, k: 0 },
              nm: 'Polystar',
            },
            {
              ty: 'fl',
              c: { a: 0, k: [1, 0.35, 0.05, 1] },
              o: { a: 0, k: 100 },
              r: 1,
              nm: 'Fill',
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
          nm: 'StarGroup',
        },
      ],
      ip: 0,
      op: 120,
      st: 0,
      bm: 0,
    },
  ],
};

export default function LottieSparkle({ size = 26, className = '' }: { size?: number; className?: string }) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const anim: AnimationItem = lottie.loadAnimation({
      container: el,
      renderer: 'svg',
      loop: !reduced,
      autoplay: !reduced,
      animationData: structuredClone(SPARKLE_LOTTIE_DATA),
    });
    return () => {
      anim.destroy();
    };
  }, []);

  return (
    <span
      ref={containerRef}
      aria-hidden="true"
      className={className}
      style={{
        width: size,
        height: size,
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
      }}
    />
  );
}
