import { STOPS } from '../scenes/Tour';

// Top-down plan of the future boutique (same layout as the 3D scene), used when WebGL is unavailable or "light mode" (L) is on.
// Scale: 120 px per metre across (5.2 m), 108 px per metre deep (4.8 m).
const stops = [
  { x: 480, y: 676 }, { x: 480, y: 612 }, { x: 252, y: 280 }, { x: 618, y: 214 }, { x: 676, y: 400 }, { x: 480, y: 240 }
];
export default function TourFallback({ beat }: { beat: number }) {
  return (
    <div className="tourFallback">
      <svg viewBox="0 0 960 720" aria-label={`Floor plan of the future boutique, stop: ${STOPS[beat].name}`}>
        <rect x="168" y="60" width="624" height="518" rx="4" fill="#fbf8f2" stroke="#202020" strokeWidth="6" />
        <ellipse cx="486" cy="357" rx="156" ry="140" fill="#efe6d6" />
        <rect x="420" y="572" width="120" height="12" fill="#f4f0e8" />
        <path d="M420 578 a120 120 0 0 1 0 -120" fill="none" stroke="#8b4545" strokeWidth="4" strokeDasharray="8 8" />
        <rect x="168" y="119" width="48" height="313" fill="#e3dbcf" />
        <line x1="204" x2="204" y1="119" y2="432" stroke="#c9a46a" strokeWidth="8" />
        <text transform="translate(236 276) rotate(-90)" textAnchor="middle" className="planLabel">RAIL</text>
        <path d="M402 66 h156" stroke="#c98e83" strokeWidth="14" /><line x1="402" x2="558" y1="84" y2="84" stroke="#c9a46a" strokeWidth="6" />
        <text x="480" y="110" textAnchor="middle" className="planLabel">PÉPITES DU JOUR</text>
        <rect x="650" y="63" width="139" height="121" fill="#d29a8f" opacity=".75" /><line x1="650" x2="650" y1="60" y2="184" stroke="#202020" strokeWidth="4" />
        <text x="720" y="110" textAnchor="middle" className="planLabel">FITTING</text>
        <rect x="708" y="319" width="67" height="162" rx="3" fill="#8f7a68" /><text transform="translate(747 400) rotate(-90)" textAnchor="middle" className="planLabel" fill="#fff">COUNTER</text>
        <circle cx="486" cy="357" r="62" fill="#e8e1d6" stroke="#b7a793" strokeWidth="3" /><text x="486" y="363" textAnchor="middle" className="planLabel">TABLE</text>
        <circle cx="258" cy="476" r="38" fill="#8c9585" /><circle cx="294" cy="530" r="22" fill="#8b4545" /><circle cx="630" cy="519" r="30" fill="#7f8c6c" />
        {stops.map((s, i) => (
          <g key={i} opacity={i === beat ? 1 : 0.45}>
            <circle cx={s.x} cy={s.y} r={i === beat ? 30 : 20} fill={i === beat ? '#8b4545' : '#6b6259'} />
            <text x={s.x} y={s.y + 9} textAnchor="middle" className="planNo">{i + 1}</text>
          </g>
        ))}
      </svg>
      <p className="fallbackNote">Light mode: floor plan of the future boutique (press L to return to 3D).</p>
    </div>
  );
}
