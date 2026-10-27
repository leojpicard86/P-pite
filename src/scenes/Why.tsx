import { Landmark, Scale, Users } from 'lucide-react';
import { Counter, Reveal, Stamp } from '../components/ui';
import { Ring } from '../components/charts';
import { market } from '../data/facts';
import { Heading, SceneProps } from './common';

const Unverified = () => <Stamp>Reported · unverified</Stamp>;

export default function Why({ beat }: SceneProps) {
  return (
    <>
      <Heading eyebrow="WHY NOW">A market in motion</Heading>
      <div className="whyGrid">
        <Reveal beat={beat} at={0} className="card statCard">
          <small>FRENCH SECOND-HAND MARKET, 2024</small>
          <strong className="big"><Counter value={market.secondHandBn2024} active={beat >= 0} prefix="€" suffix=" bn" /></strong>
          <span className="sub">+{market.growth2024Pct}% vs 2023</span>
          <Reveal beat={beat} at={1} className="stampRow"><Unverified /></Reveal>
        </Reveal>
        <Reveal beat={beat} at={0} delay={0.25} className="card statCard">
          <small>OF WHICH FASHION</small>
          <strong className="big"><Counter value={market.fashionBn2024} active={beat >= 0} prefix="€" suffix=" bn" /></strong>
          <span className="sub">Source quoted: Xerfi</span>
          <Reveal beat={beat} at={1} className="stampRow"><Unverified /></Reveal>
        </Reveal>
        <Reveal beat={beat} at={2} className="card ringCard">
          <Ring pct={market.boughtSecondHandPct2023} active={beat >= 2} size={230} />
          <div className="ringText"><strong className="mid"><Counter value={market.boughtSecondHandPct2023} active={beat >= 2} suffix="%" /></strong>
            <span>of French people bought second-hand in 2023</span><Unverified /></div>
        </Reveal>
        <Reveal beat={beat} at={3} className="card lawCard">
          <Scale size={40} strokeWidth={1.3} />
          <h3>Anti fast-fashion law<br />n° 2026-602 · July 2026</h3>
          <p>Implementing decrees <b>not yet published</b>: the rules may still change.</p>
          <Stamp tone="info">Decrees pending</Stamp>
        </Reveal>
        <Reveal beat={beat} at={4} className="card vintedCard">
          <Users size={40} strokeWidth={1.3} />
          <strong className="big"><Counter value={market.vintedUsersFr} active={beat >= 4} suffix=" M+" /></strong>
          <span className="sub">Vinted users in France, end 2024</span>
          <Unverified />
        </Reveal>
      </div>
      <Reveal beat={beat} at={5} className="callout"><Landmark size={34} strokeWidth={1.3} />
        <span>Demand is <em>not</em> our main risk. <em>Financing and sourcing</em> are.</span></Reveal>
    </>
  );
}
