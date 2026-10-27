import { STOPS } from '../scenes/Tour';

// Top-down plan of the conceptual boutique (same layout as the 3D scene), used when WebGL is unavailable or "light mode" (L) is on.
// Scale: 120 px per metre across, 108 px per metre deep.
const stops = [
  { x: 480, y: 664 }, { x: 480, y: 612 }, { x: 336, y: 250 }, { x: 744, y: 168 }, { x: 696, y: 384 }, { x: 480, y: 340 }
];
export default function TourFallback({ beat }: { beat: number }) {
  return (
    <div className="tourFallback">
      <svg viewBox="0 0 960 720" aria-label={`Floor plan of the conceptual boutique, stop: ${STOPS[beat].name}`}>
        <rect x="120" y="60" width="720" height="540" rx="6" fill="#fbf8f2" stroke="#202020" strokeWidth="6" />
        <rect x="414" y="594" width="132" height="12" fill="#f4f0e8" />
        <path d="M414 600 a132 132 0 0 1 112 -112" fill="none" stroke="#8b4545" strokeWidth="4" strokeDasharray="8 8" />
        <rect x="124" y="168" width="30" height="281" fill="#b79b83" /><text transform="translate(188 308) rotate(-90)" textAnchor="middle" className="planLabel">SHELVES</text>
        <rect x="654" y="66" width="180" height="124" rx="4" fill="#d29a8f" opacity=".75" /><text x="744" y="104" textAnchor="middle" className="planLabel">FITTING</text>
        <rect x="743" y="281" width="74" height="206" rx="4" fill="#8f7a68" /><text transform="translate(782 384) rotate(-90)" textAnchor="middle" className="planLabel" fill="#fff">COUNTER</text>
        <line x1="216" x2="456" y1="233" y2="233" stroke="#b7a793" strokeWidth="10" /><text x="336" y="214" textAnchor="middle" className="planLabel">RAILS</text>
        <line x1="414" x2="570" y1="114" y2="114" stroke="#b7a793" strokeWidth="10" />
        <circle cx="288" cy="438" r="62" fill="#a98569" /><text x="288" y="444" textAnchor="middle" className="planLabel" fill="#fff">TABLE</text>
        {stops.map((s, i) => (
          <g key={i} opacity={i === beat ? 1 : 0.45}>
            <circle cx={s.x} cy={s.y} r={i === beat ? 30 : 20} fill={i === beat ? '#8b4545' : '#6b6259'} />
            <text x={s.x} y={s.y + 9} textAnchor="middle" className="planNo">{i + 1}</text>
          </g>
        ))}
      </svg>
      <p className="fallbackNote">Light mode: floor plan of the conceptual boutique (press L to return to 3D).</p>
    </div>
  );
}
