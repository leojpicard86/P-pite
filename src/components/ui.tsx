import { ReactNode, useEffect, useRef, useState } from 'react';
import { animate, motion, useReducedMotion } from 'framer-motion';

/** Shows its children from beat `at` onwards, with a soft rise. */
export function Reveal({ beat, at, until, children, className, delay = 0, y = 28, style }: {
  beat: number; at: number; until?: number; children: ReactNode; className?: string; delay?: number; y?: number; style?: React.CSSProperties;
}) {
  const on = beat >= at && (until === undefined || beat < until);
  return (
    <motion.div className={className} style={{ ...style, pointerEvents: on ? 'auto' : 'none' }} initial={false}
      animate={{ opacity: on ? 1 : 0, y: on ? 0 : y }} transition={{ duration: 0.7, delay: on ? delay : 0, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

/** Number that rolls up to `value` when `active` becomes true. */
export function Counter({ value, active, prefix = '', suffix = '', decimals = 0, duration = 1.6, className }: {
  value: number; active: boolean; prefix?: string; suffix?: string; decimals?: number; duration?: number; className?: string;
}) {
  const reduce = useReducedMotion();
  const [v, setV] = useState(0);
  const first = useRef(true);
  useEffect(() => {
    if (!active) { setV(0); first.current = true; return; }
    if (reduce) { setV(value); return; }
    const c = animate(0, value, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: x => setV(x) });
    first.current = false;
    return () => c.stop();
  }, [active, value, duration, reduce]);
  const s = decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString('en-GB');
  return <span className={className}>{prefix}{s}{suffix}</span>;
}

export const Stamp = ({ children, tone = 'warn' }: { children: ReactNode; tone?: 'warn' | 'info' | 'bad' | 'good' }) => (
  <span className={`stamp stamp-${tone}`}>{children}</span>
);

export const euro = (n: number) => `${n < 0 ? '−' : ''}€${Math.abs(n).toLocaleString('en-GB')}`;
