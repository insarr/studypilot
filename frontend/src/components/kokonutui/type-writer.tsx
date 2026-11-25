import { useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

export interface TypewriterSequence {
  text: string;
  deleteAfter?: boolean;
  pauseAfter?: number;
}

export interface TypewriterProps {
  sequences: TypewriterSequence[];
  typingSpeed?: number;
  deleteSpeed?: number;
  pauseBeforeDelete?: number;
  autoLoop?: boolean;
  className?: string;
}

export default function Typewriter({
  sequences,
  typingSpeed = 42,
  deleteSpeed = 24,
  pauseBeforeDelete = 1600,
  autoLoop = true,
  className = '',
}: TypewriterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: false, amount: 0.2 });
  const reduced = useReducedMotion();
  const [seqIdx, setSeqIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const currentSeq = sequences[seqIdx] || sequences[0];
  const fullText = currentSeq?.text || '';

  // Reset cleanly when language / sequences change so text never glitches or jumps
  const seqKey = sequences.map((s) => s.text).join('|');
  useEffect(() => {
    setSeqIdx(0);
    setCharIdx(sequences[0]?.text?.length || 0);
    setDeleting(false);
  }, [seqKey]);

  useEffect(() => {
    if (reduced || !inView || !sequences.length) return;

    let timer: number;
    if (!deleting && charIdx < fullText.length) {
      timer = window.setTimeout(() => setCharIdx((c) => c + 1), typingSpeed);
    } else if (!deleting && charIdx === fullText.length) {
      if (currentSeq.deleteAfter === false && !autoLoop) return;
      timer = window.setTimeout(
        () => setDeleting(true),
        currentSeq.pauseAfter ?? pauseBeforeDelete,
      );
    } else if (deleting && charIdx > 0) {
      timer = window.setTimeout(() => setCharIdx((c) => c - 1), deleteSpeed);
    } else if (deleting && charIdx === 0) {
      setDeleting(false);
      setSeqIdx((i) => (i + 1) % sequences.length);
    }

    return () => window.clearTimeout(timer);
  }, [
    charIdx,
    deleting,
    fullText,
    inView,
    reduced,
    sequences,
    seqIdx,
    typingSpeed,
    deleteSpeed,
    pauseBeforeDelete,
    autoLoop,
    currentSeq,
  ]);

  const displayed = reduced ? fullText : fullText.slice(0, charIdx);

  return (
    <span ref={ref} className={`ku-typewriter ${className}`}>
      <span>{displayed}</span>
      <span className="ku-typewriter-caret" aria-hidden="true" />
    </span>
  );
}
