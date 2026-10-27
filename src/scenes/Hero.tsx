import { motion } from 'framer-motion';
import { Rail } from '../components/Garments';
import { Reveal } from '../components/ui';
import type { SceneProps } from './common';

export default function Hero({ beat }: SceneProps) {
  return (
    <div className="hero">
      <motion.div className="heroRail" initial={{ x: 1900 }} animate={{ x: 0 }} transition={{ type: 'spring', stiffness: 38, damping: 15, delay: 0.3 }}>
        <Rail count={9} width={150} glowIndex={beat >= 2 ? 3 : -1} />
      </motion.div>
      <Reveal beat={beat} at={0} className="heroKicker"><span className="eyebrow light">CHANTILLY · OISE</span></Reveal>
      <h1 className="heroTitle" aria-label="PÉPITE">
        {'PÉPITE'.split('').map((ch, i) => (
          <motion.span key={i} initial={false} animate={{ opacity: beat >= 1 ? 1 : 0, y: beat >= 1 ? 0 : 60, filter: beat >= 1 ? 'blur(0px)' : 'blur(12px)' }}
            transition={{ duration: 0.9, delay: beat >= 1 ? i * 0.09 : 0, ease: [0.22, 1, 0.36, 1] }}>{ch}</motion.span>
        ))}
        <motion.i initial={false} animate={{ opacity: beat >= 1 ? 1 : 0 }} transition={{ delay: 0.9 }}>.</motion.i>
      </h1>
      <Reveal beat={beat} at={2} className="heroDef">
        <span className="word">pépite</span> <span className="ph">/pe.pit/ · noun</span>
        <p>A precious find. Something valuable that nobody had really noticed yet.</p>
      </Reveal>
      <Reveal beat={beat} at={3} className="heroTag">Second-hand, without the constraints of second-hand.<small>Piece n° 001</small></Reveal>
      <Reveal beat={beat} at={4} className="heroAgenda">
        {['The idea', 'The boutique', 'The numbers', 'The hard questions'].map((t, i) => (
          <span key={t}><b>0{i + 1}</b>{t}</span>
        ))}
      </Reveal>
    </div>
  );
}
