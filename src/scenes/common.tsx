import { ReactNode } from 'react';
import { motion } from 'framer-motion';

export type SceneProps = { beat: number };

export function Heading({ eyebrow, children }: { eyebrow: string; children: ReactNode }) {
  return (
    <header className="heading">
      <motion.span className="eyebrow" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.25 }}>{eyebrow}</motion.span>
      <motion.h2 className="title" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.h2>
    </header>
  );
}
