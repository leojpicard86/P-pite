import { Camera, Clock, FileText, HelpCircle, LayoutGrid, ListFilter, MessageSquare, Package, Scale, Search } from 'lucide-react';
import { Reveal } from '../components/ui';
import { Heading, SceneProps } from './common';

const seller = [
  [Camera, 'Photos'], [FileText, 'Listing'], [MessageSquare, 'Messages'], [Scale, 'Negotiation'], [Package, 'Parcel']
] as const;
const buyer = [
  [LayoutGrid, 'Hundreds of listings'], [Search, 'Searching'], [ListFilter, 'Sorting'], [HelpCircle, 'Size? Condition?'], [Clock, 'Hours lost']
] as const;

function Column({ title, quote, steps, beat, at }: { title: string; quote: string; steps: typeof seller | typeof buyer; beat: number; at: number }) {
  return (
    <div className={`probCol ${beat >= 3 ? 'dim' : ''}`}>
      <Reveal beat={beat} at={0}><h3 className="colTitle">{title}</h3></Reveal>
      <ol className="steps5">
        {steps.map(([Icon, label], i) => (
          <Reveal key={label} beat={beat} at={at} delay={0.35 * i} className="step5">
            <span className="stepNo">{String(i + 1).padStart(2, '0')}</span><Icon size={34} strokeWidth={1.4} /><span>{label}</span>
          </Reveal>
        ))}
      </ol>
      <Reveal beat={beat} at={at} delay={2} className="quote">{quote}</Reveal>
    </div>
  );
}

export default function Problem({ beat }: SceneProps) {
  return (
    <>
      <Heading eyebrow="THE PROBLEM">Our wardrobes are full.<br />Reselling is hard work.</Heading>
      <div className="probGrid">
        <Column title="THE SELLER" quote={'“I want to empty my wardrobe without spending hours reselling.”'} steps={seller} beat={beat} at={1} />
        <Column title="THE BUYER" quote={'“I want to buy second-hand without searching for hours.”'} steps={buyer} beat={beat} at={2} />
      </div>
      <Reveal beat={beat} at={3} className="gapLine">The gap: <em>second-hand, without the constraints of second-hand.</em></Reveal>
    </>
  );
}
