import { motion } from 'framer-motion';
import { Home, Shirt, Sparkles, Store, UserRound } from 'lucide-react';
import { Reveal } from '../components/ui';
import { Heading, SceneProps } from './common';

const nodes = [
  { Icon: Shirt, title: 'Full wardrobe', sub: 'The seller, e.g. Nathalie', at: 1 },
  { Icon: Home, title: 'Home buy-back', sub: 'By appointment: we choose, we offer a price', at: 1 },
  { Icon: Sparkles, title: 'PÉPITE selection', sub: 'Inspect · clean · label · price', at: 2 },
  { Icon: Store, title: 'The boutique', sub: 'Curated, warm, no pressure', at: 3 },
  { Icon: UserRound, title: 'New owner', sub: 'The buyer, e.g. Léa', at: 3 }
];
const X0 = 190, DX = 385, Y = 150;
const cx = (i: number) => X0 + i * DX;

export default function Solution({ beat }: SceneProps) {
  const reached = beat >= 3 ? 4 : beat >= 2 ? 2 : beat >= 1 ? 1 : 0;
  return (
    <>
      <Heading eyebrow="OUR SOLUTION">A local circle for<br />second-hand fashion</Heading>
      <div className="circuit">
        <svg viewBox="0 0 1920 560" className="circuitSvg" aria-hidden="true">
          <line x1={cx(0)} x2={cx(4)} y1={Y} y2={Y} stroke="#d9cfc0" strokeWidth="4" strokeDasharray="4 12" strokeLinecap="round" />
          <motion.line x1={cx(0)} y1={Y} y2={Y} stroke="#8b4545" strokeWidth="5" strokeLinecap="round" initial={false}
            animate={{ x2: cx(reached) }} transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }} />
          <motion.circle r="13" cy={Y} fill="#8b4545" initial={false} animate={{ cx: cx(reached), opacity: beat >= 1 ? 1 : 0 }} transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }} />
          <motion.path d={`M${cx(4)} ${Y + 205} C ${cx(4)} 500, ${cx(0)} 500, ${cx(0)} ${Y + 205}`} fill="none" stroke="#6b6259" strokeWidth="4" strokeLinecap="round"
            strokeDasharray="2 12" initial={false} animate={{ pathLength: beat >= 4 ? 1 : 0, opacity: beat >= 4 ? 1 : 0 }} transition={{ duration: 1.6 }} />
          <motion.path d={`M${cx(0) + 2} ${Y + 207} l-4 -30 m4 30 l28 -12`} fill="none" stroke="#6b6259" strokeWidth="4" strokeLinecap="round" initial={false} animate={{ opacity: beat >= 4 ? 1 : 0 }} transition={{ delay: 1.4 }} />
        </svg>
        {nodes.map((n, i) => (
          <Reveal key={n.title} beat={beat} at={n.at} delay={i % 2 ? 0.5 : 0} className="node" style={{ left: cx(i) - 140 }}>
            <span className="nodeIcon"><n.Icon size={44} strokeWidth={1.2} /></span>
            <b>{n.title}</b><small>{n.sub}</small>
          </Reveal>
        ))}
        <Reveal beat={beat} at={4} className="loopNote">The same person can be a seller today and a buyer tomorrow.</Reveal>
      </div>
    </>
  );
}
