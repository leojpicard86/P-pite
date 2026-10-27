import { motion } from 'framer-motion';
import { Reveal } from '../components/ui';
import { Rail } from '../components/Garments';
import { roadmap } from '../data/facts';
import { Heading, SceneProps } from './common';

export default function Roadmap({ beat }: SceneProps) {
  return (
    <>
      <Heading eyebrow="NEXT CHAPTER">From a pépite to a boutique</Heading>
      <div className="roadRow">
        <div className="roadLine" />
        {roadmap.map((r, i) => (
          <Reveal key={r.n} beat={beat} at={0} delay={0.9 * i} className="roadStep">
            <span className="roadNo">{r.n}</span><b>{r.title}</b><small>{r.text}</small>
          </Reveal>
        ))}
      </div>
      <motion.div className="closing" initial={false} animate={{ opacity: beat >= 1 ? 1 : 0 }} transition={{ duration: 1.1 }} style={{ pointerEvents: beat >= 1 ? 'auto' : 'none' }}>
        <Rail count={9} width={110} glowIndex={4} className="closingRail" />
        <Reveal beat={beat} at={1} until={2} className="closingQuote">{'“'}A pépite is something valuable that nobody had really noticed.{'”'}<small>We believe there are many in the wardrobes around Chantilly.</small></Reveal>
        <Reveal beat={beat} at={2} className="closingAsk"><h2>Who wants to build<br />PÉPITE with us?</h2><p>Thank you · Questions</p></Reveal>
      </motion.div>
    </>
  );
}
