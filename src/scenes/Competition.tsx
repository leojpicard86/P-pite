import { Check, Minus } from 'lucide-react';
import { Reveal } from '../components/ui';
import { competitors } from '../data/facts';
import { Heading, SceneProps } from './common';

const at: Record<string, number> = { 'aux-bonheurs': 1, neighbours: 1, 'fait-affaire': 2, 'dressing-circulaire': 3, vinted: 4 };

export default function Competition({ beat }: SceneProps) {
  return (
    <>
      <Heading eyebrow="POSITIONING">More than another listing</Heading>
      <div className="compGrid">
        {competitors.map((c, i) => (
          <Reveal key={c.key} beat={beat} at={at[c.key]} delay={i === 1 ? 0.3 : 0}
            className={`card compCard ${c.key === 'vinted' ? 'vinted' : ''} ${c.key === 'vinted' && beat >= 5 ? 'shrunk' : ''}`}>
            <span className="place">{c.place.toUpperCase()}</span>
            <h3>{c.name}</h3>
            <em>{c.type}</em>
            <p className="plus"><Check size={22} strokeWidth={2} /> {c.strength}</p>
            <p className="minus"><Minus size={22} strokeWidth={2} /> {c.weakness}</p>
          </Reveal>
        ))}
        <Reveal beat={beat} at={5} className="card compCard pepiteCard">
          <span className="place">CHANTILLY · NEW</span>
          <h3>PÉPITE</h3>
          <em>Boutique + home buy-back</em>
          <p className="plus"><Check size={22} strokeWidth={2} /> Visit, try, discover; a service around the shop</p>
          <p className="minus"><Minus size={22} strokeWidth={2} /> Small space (25 m²), unknown brand, low contribution</p>
          <small className="asterisk">No local competitor offering home buy-back found, per our current analysis. To be confirmed on the ground.</small>
        </Reveal>
      </div>
    </>
  );
}
