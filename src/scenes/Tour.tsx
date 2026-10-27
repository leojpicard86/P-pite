import { boutique } from '../data/facts';
import { SceneProps } from './common';

export const STOPS = [
  { name: 'The street', text: 'A conceptual vision of the ~25 m² boutique.' },
  { name: 'The window', text: 'A refreshed façade and a window that creates curiosity.' },
  { name: 'The rails', text: 'Curated pieces, new arrivals often.' },
  { name: 'The fitting area', text: 'Try before you buy: what online cannot offer.' },
  { name: 'The counter', text: 'Warm welcome, advice without pressure.' },
  { name: 'The overview', text: 'Small space, big experience. Drag to look around.' }
];

/** UI overlay only: the WebGL scene lives in a persistent layer behind it (see App). */
export default function Tour({ beat }: SceneProps) {
  const s = STOPS[beat];
  return (
    <div className="tourUi">
      <div className="tourBadge">CONCEPTUAL VISUALISATION · NOT THE REAL PREMISES · ~{boutique.area} m²</div>
      <div className="tourCaption" key={beat}>
        <span className="eyebrow">STOP {beat + 1} / {STOPS.length}</span>
        <h3>{s.name}</h3>
        <p>{s.text}</p>
      </div>
      <div className="tourDots" aria-hidden="true">{STOPS.map((_, i) => <i key={i} className={i === beat ? 'on' : i < beat ? 'done' : ''} />)}</div>
    </div>
  );
}
