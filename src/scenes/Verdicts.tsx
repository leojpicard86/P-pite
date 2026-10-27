import { Check, CircleHelp, CircleSlash, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Reveal } from '../components/ui';
import { verdicts, type Verdict } from '../data/facts';
import { Heading, SceneProps } from './common';

const META: Record<Verdict, { label: string; Icon: typeof Check; at: number }> = {
  validated: { label: 'Validated', Icon: Check, at: 1 },
  partial: { label: 'Partly validated', Icon: Minus, at: 1 },
  tovalidate: { label: 'To validate', Icon: CircleHelp, at: 2 },
  invalid: { label: 'Not valid as it stands', Icon: CircleSlash, at: 3 }
};

export default function Verdicts({ beat }: SceneProps) {
  return (
    <>
      <Heading eyebrow="REALITY CHECK">What we still have to prove</Heading>
      <div className="verdictGrid">
        {verdicts.map((v, i) => {
          const m = META[v.verdict];
          const flipped = beat >= m.at;
          return (
            <div className="flipWrap" key={v.key}>
              <motion.div className="flip" initial={false} animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.9, delay: flipped ? 0.25 * (i % 3) : 0, ease: [0.22, 1, 0.36, 1] }}>
                <div className="face front"><span className="vNo">{String(i + 1).padStart(2, '0')}</span><p>{v.claim}</p><span className="q">?</span></div>
                <div className={`face back ${v.verdict}`}><m.Icon size={44} strokeWidth={1.6} /><b>{m.label}</b><p>{v.claim}</p><small>{v.note}</small></div>
              </motion.div>
            </div>
          );
        })}
      </div>
      <Reveal beat={beat} at={4} className="callout dark">Key risks: <em>financing</em> and <em>sourcing</em>. We know it, and we have a plan.</Reveal>
    </>
  );
}
