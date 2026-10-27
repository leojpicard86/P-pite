import { ArrowRight, Coins, ShoppingBag, Sparkles, Tag } from 'lucide-react';
import { Reveal, Stamp } from '../components/ui';
import { KsfChart } from '../components/charts';
import { Heading, SceneProps } from './common';

const flow = [
  { Icon: Coins, t: 'Buy', s: 'Pieces from individuals', at: 0 },
  { Icon: Sparkles, t: 'Select', s: 'Quality · brand · condition', at: 1 },
  { Icon: Tag, t: 'Add value', s: 'Clean · label · price · display', at: 1 },
  { Icon: ShoppingBag, t: 'Resell', s: 'In-store, with advice', at: 1 }
];

export default function Model({ beat }: SceneProps) {
  return (
    <>
      <Heading eyebrow="BUSINESS MODEL">Turning wardrobes into value</Heading>
      <div className="flowRow">
        {flow.map((f, i) => (
          <div className="flowItem" key={f.t}>
            <Reveal beat={beat} at={f.at} delay={f.at === 1 ? 0.35 * (i - 1) : 0} className="flowNode">
              <span className="nodeIcon"><f.Icon size={38} strokeWidth={1.3} /></span><b>{f.t}</b><small>{f.s}</small>
            </Reveal>
            {i < flow.length - 1 && <Reveal beat={beat} at={flow[i + 1].at} delay={0.35 * i} className="flowArrow"><ArrowRight size={34} strokeWidth={1.2} /></Reveal>}
          </div>
        ))}
        <Reveal beat={beat} at={0} className="costTag"><Stamp tone="bad">Biggest cost</Stamp></Reveal>
        <Reveal beat={beat} at={1} delay={1.1} className="marginTag">Margin = selling price − buying price</Reveal>
      </div>
      <div className="modelLower">
        <div className="modelLeft">
          <Reveal beat={beat} at={2} className="chipList">
            <h4>REVENUE</h4>
            <span className="chip solid">In-store sales: margin by category, brand, condition</span>
            <span className="chip solid">Add-ons: accessories and shoes raise the basket</span>
            <span className="chip ghost">Later: online sales · private events</span>
          </Reveal>
          <Reveal beat={beat} at={4} className="kpiRow">
            {['Margin per item', 'Stock turnover', 'Average basket'].map(k => (
              <div className="kpi" key={k}><b>{k}</b><Stamp>To validate</Stamp></div>
            ))}
          </Reveal>
        </div>
        <Reveal beat={beat} at={3} className="ksfPanel">
          <h4>40 SUCCESS FACTORS · 8 FUNDAMENTAL</h4>
          <KsfChart active={beat >= 3} />
        </Reveal>
      </div>
    </>
  );
}
