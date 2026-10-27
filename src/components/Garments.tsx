import { CSSProperties } from 'react';

export type GarmentKind = 'dress' | 'shirt' | 'coat' | 'trousers' | 'skirt';

const PATHS: Record<GarmentKind, string> = {
  dress: 'M38 44 L50 54 L62 44 L66 72 L58 78 L80 148 Q50 158 20 148 L42 78 L34 72 Z',
  shirt: 'M36 44 L50 52 L64 44 L90 68 L80 84 L70 74 L70 132 H30 L30 74 L20 84 L10 68 Z',
  coat: 'M34 44 L50 58 L66 44 L92 72 L84 130 L72 120 L74 154 H26 L28 120 L16 130 L8 72 Z',
  trousers: 'M30 46 H70 L76 152 H56 L50 88 L44 152 H24 Z',
  skirt: 'M34 46 H66 L86 142 H14 Z'
};
const DETAIL: Record<GarmentKind, string> = {
  dress: 'M50 54 V150 M42 78 H58',
  shirt: 'M50 52 V132 M44 62 H56',
  coat: 'M50 58 V154 M42 84 H46 M54 84 H58',
  trousers: 'M50 46 V88 M34 52 H66',
  skirt: 'M50 46 V142 M38 52 H62'
};

type Props = {
  kind: GarmentKind; color: string; width?: number; delay?: number; duration?: number;
  glow?: boolean; sway?: boolean; style?: CSSProperties; className?: string;
};

/** A garment on a hanger. Pure SVG; sways from the hook with a CSS animation. */
export function Garment({ kind, color, width = 120, delay = 0, duration = 5, glow, sway = true, style, className }: Props) {
  return (
    <svg viewBox="0 0 100 160" width={width} height={width * 1.6} className={`garment ${sway ? 'sway' : ''} ${glow ? 'glow' : ''} ${className ?? ''}`}
      style={{ animationDelay: `${delay}s`, animationDuration: `${duration}s`, ...style }} aria-hidden="true">
      <path d="M50 4 V13" stroke="#8d8174" strokeWidth="2" fill="none" />
      <path d="M50 13 L10 40 H90 Z" stroke="#8d8174" strokeWidth="2.2" fill="none" strokeLinejoin="round" />
      <path d="M50 4 a4 4 0 1 1 4 4" stroke="#8d8174" strokeWidth="2" fill="none" />
      <path d={PATHS[kind]} fill={color} stroke="rgba(32,32,32,.28)" strokeWidth="1.4" strokeLinejoin="round" />
      <path d={DETAIL[kind]} stroke="rgba(32,32,32,.22)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export const PALETTE = ['#cfc3b3', '#8b4545', '#d29a8f', '#8c9585', '#f4f0e8', '#b7a793', '#6b6259'];
const KINDS: GarmentKind[] = ['dress', 'shirt', 'coat', 'skirt', 'trousers', 'shirt', 'dress', 'coat', 'skirt'];

/** A rail of hanging garments, used as a decorative element. */
export function Rail({ count = 8, width = 120, glowIndex = -1, className, style }: { count?: number; width?: number; glowIndex?: number; className?: string; style?: CSSProperties }) {
  return (
    <div className={`rail ${className ?? ''}`} style={style}>
      <div className="railBar" />
      {Array.from({ length: count }, (_, i) => (
        <Garment key={i} kind={KINDS[i % KINDS.length]} color={PALETTE[(i * 3) % PALETTE.length]} width={width}
          delay={-i * 0.7} duration={4.4 + (i % 3) * 0.8} glow={i === glowIndex} />
      ))}
    </div>
  );
}
