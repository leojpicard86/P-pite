import { Reveal, Stamp } from '../components/ui';
import { personas } from '../data/facts';
import { Heading, SceneProps } from './common';

type P = typeof personas.lea;

function Avatar({ tone, hair, long }: { tone: string; hair: string; long?: boolean }) {
  return (
    <svg viewBox="0 0 160 160" width="150" height="150" aria-hidden="true">
      <circle cx="80" cy="80" r="78" fill={tone} />
      <path d="M22 152 Q24 108 80 106 Q136 108 138 152 Z" fill="#4a433b" />
      <rect x="68" y="88" width="24" height="24" rx="8" fill="#e9d6c6" />
      <ellipse cx="80" cy="66" rx="26" ry="30" fill="#f1e1d3" />
      <path d={long ? 'M52 70 Q50 30 82 32 Q112 32 110 72 Q108 52 82 50 Q60 52 52 70 Z M52 70 Q46 100 56 118 Q50 90 56 72 Z M110 72 Q116 100 106 118 Q112 90 106 74 Z'
        : 'M54 64 Q54 34 82 34 Q108 34 108 62 Q100 48 82 48 Q64 48 54 64 Z'} fill={hair} />
    </svg>
  );
}

function Card({ p, beat, at, tone, hair, long, side }: { p: P; beat: number; at: number; tone: string; hair: string; long?: boolean; side: 'l' | 'r' }) {
  return (
    <Reveal beat={beat} at={at} className={`personaCard ${side}`} y={50}>
      <div className="personaTop">
        <Avatar tone={tone} hair={hair} long={long} />
        <div>
          <span className="roleChip">{p.role.toUpperCase()}</span>
          <h3>{p.name}, {p.age}</h3>
          <p>{p.job}<br />{p.place}<br />{p.income}</p>
        </div>
      </div>
      <blockquote>{'“'}{p.verbatim}{'”'}</blockquote>
      <Reveal beat={beat} at={at + 1} className="personaDetails">
        <dl>
          <dt>Brands</dt><dd>{p.brands}</dd>
          <dt>Media</dt><dd>{p.media}</dd>
          <dt>Frustrations</dt><dd>{p.pain}</dd>
        </dl>
      </Reveal>
    </Reveal>
  );
}

export default function Personas({ beat }: SceneProps) {
  return (
    <>
      <Heading eyebrow="THE CUSTOMERS">Two needs. One boutique.</Heading>
      <div className="personaGrid">
        <Card p={personas.lea} beat={beat} at={0} tone="#d29a8f" hair="#3a2e29" side="l" />
        <Card p={personas.nathalie} beat={beat} at={2} tone="#8c9585" hair="#b9b2a8" long side="r" />
      </div>
      <Reveal beat={beat} at={4} className="banner"><Stamp tone="info">Working hypotheses</Stamp> Personas built by our team, to be tested by our customer survey.</Reveal>
    </>
  );
}
