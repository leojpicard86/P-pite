import { boutique } from '../data/facts';
import { SceneProps } from './common';

export const STOPS = [
  { name: 'The street', text: 'Dusk in Chantilly: a dark façade, gilded letters, a lit window.' },
  { name: 'The window', text: 'A striped awning and a window display that stops people walking by.' },
  { name: 'The rails', text: 'Hand-picked pieces, presented like in a fashion boutique.' },
  { name: 'The fitting room', text: 'Velvet curtain, big mirror: try before you buy.' },
  { name: 'The counter', text: 'Marble, oak and a warm welcome, with advice and no pressure.' },
  { name: 'The whole boutique', text: '~25 m² of discoveries. Drag to look around.' }
];

/** UI overlay only: the WebGL scene lives in a persistent layer behind it (see App). */
export default function Tour({ beat }: SceneProps) {
  const s = STOPS[beat];
  return (
    <div className="tourUi">
      <div className="tourBadge">ARTIST'S IMPRESSION · OUR FUTURE BOUTIQUE · ~{boutique.area} m²</div>
      <div className="tourCaption" key={beat}>
        <span className="eyebrow">STOP {beat + 1} / {STOPS.length}</span>
        <h3>{s.name}</h3>
        <p>{s.text}</p>
      </div>
      <div className="tourDots" aria-hidden="true">{STOPS.map((_, i) => <i key={i} className={i === beat ? 'on' : i < beat ? 'done' : ''} />)}</div>
    </div>
  );
}
