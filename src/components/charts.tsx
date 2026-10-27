import { motion } from 'framer-motion';
import { actions, finance, ksf, extrapolateMonth7 } from '../data/facts';
import { euro } from './ui';

const ease = [0.22, 1, 0.36, 1] as const;

/* ---------------------------------------------------------------- Ring */
export function Ring({ pct, active, size = 280 }: { pct: number; active: boolean; size?: number }) {
  const r = size / 2 - 22, c = 2 * Math.PI * r;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label={`${pct} percent`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e3dbcf" strokeWidth="22" />
      <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#8b4545" strokeWidth="22" strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} strokeDasharray={c} initial={false}
        animate={{ strokeDashoffset: active ? c * (1 - pct / 100) : c }} transition={{ duration: 1.6, ease }} />
    </svg>
  );
}

/* ------------------------------------------------- KSF stacked bars */
const KSF_COLORS = { f: '#8b4545', h: '#6b6259', m: '#b7a793', l: '#e3dbcf' };
export function KsfChart({ active }: { active: boolean }) {
  const W = 720, rowH = 38, unit = 96;
  return (
    <svg viewBox={`0 0 ${W + 220} ${ksf.byCategory.length * rowH + 64}`} className="chart" role="img" aria-label="Success factors by category and relevance">
      {ksf.byCategory.map((row, i) => {
        let x = 190;
        const segs = [['f', row.f], ['h', row.h], ['m', row.m], ['l', row.l]] as const;
        return (
          <g key={row.cat} transform={`translate(0 ${i * rowH + 8})`}>
            <text x={170} y={24} textAnchor="end" className="axisLabel">{row.cat}</text>
            {segs.map(([k, v]) => {
              const w = v * unit * 0.9;
              const el = v > 0 && (
                <motion.rect key={k} x={x} y={4} height={32} rx={3} fill={KSF_COLORS[k]} initial={false}
                  animate={{ width: active ? w : 0, opacity: active ? 1 : 0 }} transition={{ duration: 0.8, delay: 0.12 * i, ease }} />
              );
              const lbl = v > 0 && (
                <motion.text key={k + 't'} x={x + w / 2} y={24} textAnchor="middle" fontSize="18" fill={k === 'l' ? '#6b6259' : '#fbf8f2'} initial={false}
                  animate={{ opacity: active ? 1 : 0 }} transition={{ delay: 0.12 * i + 0.5 }}>{v}</motion.text>
              );
              x += w;
              return [el, lbl];
            })}
          </g>
        );
      })}
      <g transform={`translate(190 ${ksf.byCategory.length * rowH + 22})`} className="legend">
        {([['f', 'Fundamental', 8], ['h', 'High', 17], ['m', 'Medium', 12], ['l', 'Low', 3]] as const).map(([k, label, n], i) => (
          <g key={k} transform={`translate(${i * 200} 0)`}>
            <rect width="22" height="22" rx="3" fill={KSF_COLORS[k]} />
            <text x="32" y="18" className="legendText">{label} ({n})</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

/* ----------------------------------------------- Impact / feasibility */
const BUCKET_COLOR = { priority: '#8b4545', plan: '#6b6259', quick: '#8c9585', later: '#b7a793' } as const;
export function ActionMatrix({ beat }: { beat: number }) {
  const S = 760, pad = 70, inner = S - pad * 2;
  const px = (feas: number) => pad + ((feas - 1) / 4) * inner;
  const py = (impact: number) => S - pad - ((impact - 1) / 4) * inner;
  const groups = new Map<string, number>();
  const shownAt = (b: string) => (b === 'priority' ? 1 : b === 'plan' ? 2 : b === 'quick' ? 3 : 3);
  return (
    <svg viewBox={`0 0 ${S} ${S}`} className="chart matrix" role="img" aria-label="Impact versus feasibility of twelve actions">
      <rect x={px(3.5)} y={py(5.5)} width={px(5.5) - px(3.5)} height={py(3.5) - py(5.5)} fill="#8b4545" opacity=".08" />
      <rect x={px(0.5)} y={py(5.5)} width={px(3.5) - px(0.5)} height={py(3.5) - py(5.5)} fill="#6b6259" opacity=".07" />
      <rect x={px(3.5)} y={py(3.5)} width={px(5.5) - px(3.5)} height={py(0.5) - py(3.5)} fill="#8c9585" opacity=".12" />
      <line x1={px(3.5)} x2={px(3.5)} y1={py(5.5)} y2={py(0.5)} stroke="#202020" strokeDasharray="6 6" opacity=".55" />
      <line x1={px(0.5)} x2={px(5.5)} y1={py(3.5)} y2={py(3.5)} stroke="#202020" strokeDasharray="6 6" opacity=".55" />
      <text x={px(5.4)} y={py(5.35)} textAnchor="end" className="zoneLabel">DO FIRST</text>
      <text x={px(0.6)} y={py(5.35)} className="zoneLabel">PLAN CAREFULLY</text>
      <text x={px(5.4)} y={py(1.45)} textAnchor="end" className="zoneLabel">QUICK WINS</text>
      <text x={px(0.6)} y={py(1.45)} className="zoneLabel">LATER</text>
      <text x={S / 2} y={S - 8} textAnchor="middle" className="axisTitle">FEASIBILITY →</text>
      <text transform={`translate(18 ${S / 2}) rotate(-90)`} textAnchor="middle" className="axisTitle">IMPACT →</text>
      {[1, 2, 3, 4, 5].map(v => (
        <g key={v}>
          <text x={px(v)} y={S - pad + 34} textAnchor="middle" className="tick">{v}</text>
          <text x={pad - 22} y={py(v) + 6} textAnchor="middle" className="tick">{v}</text>
        </g>
      ))}
      {actions.map(a => {
        const key = `${a.impact}-${a.feas}`;
        const idx = groups.get(key) ?? 0; groups.set(key, idx + 1);
        const same = actions.filter(o => o.impact === a.impact && o.feas === a.feas).length;
        const dx = (idx - (same - 1) / 2) * 56;
        const on = beat >= shownAt(a.bucket);
        const delay = a.bucket === 'later' ? 1.4 : 0.15 * (a.n % 4);
        return (
          <motion.g key={a.n} initial={false} animate={{ opacity: on ? 1 : 0, scale: on ? 1 : 0.2 }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }} transition={{ duration: 0.6, delay: on ? delay : 0, ease }}>
            <circle cx={px(a.feas) + dx} cy={py(a.impact)} r="25" fill={BUCKET_COLOR[a.bucket]} stroke="#fbf8f2" strokeWidth="3" />
            <text x={px(a.feas) + dx} y={py(a.impact) + 8} textAnchor="middle" className="dotLabel">{a.n}</text>
          </motion.g>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------- Finance bars */
const USE_COLORS = ['#6b6259', '#b7a793', '#8c9585', '#d29a8f'];
export function FundsBar({ kind, active }: { kind: 'uses' | 'sources'; active: boolean }) {
  const W = 760;
  const items = kind === 'uses'
    ? finance.uses.map((u, i) => ({ label: u.label, value: u.value, color: USE_COLORS[i] }))
    : [{ label: 'Own contribution', value: finance.personal, color: '#8b4545' }, { label: 'Bank loan', value: finance.loan, color: '#4a433b' }];
  const total = items.reduce((a, b) => a + b.value, 0);
  let x = 0;
  return (
    <div className="fundsBar">
      <div className="fundsHead"><span>{kind === 'uses' ? 'USES OF FUNDS' : 'SOURCES OF FUNDS'}</span><strong>{euro(total)}</strong></div>
      <svg viewBox={`0 0 ${W} 56`} className="chart" role="img" aria-label={kind}>
        {items.map((it, i) => {
          const w = (it.value / total) * W; const cx = x; x += w;
          return <motion.rect key={it.label} x={cx} y={0} height={56} fill={it.color} initial={false} stroke="#fbf8f2" strokeWidth="3"
            animate={{ width: active ? w : 0 }} transition={{ duration: 1, delay: 0.15 * i, ease }} />;
        })}
      </svg>
      <ul className="fundsLegend">
        {items.map(it => (
          <li key={it.label}><i style={{ background: it.color }} />{it.label}<b>{euro(it.value)}</b>
            {kind === 'sources' && <em>{Math.round((it.value / total) * 100)}%</em>}</li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------------------------------------------- Scenario curves */
const SC = { w: 980, h: 520, l: 90, r: 190, t: 30, b: 60 };
const yMin = -3500, yMax = 8000;
const sx = (m: number) => SC.l + (m / 6) * (SC.w - SC.l - SC.r);
const sy = (v: number) => SC.t + ((yMax - v) / (yMax - yMin)) * (SC.h - SC.t - SC.b);
const pathOf = (pts: [number, number][]) => pts.map(([m, v], i) => `${i ? 'L' : 'M'}${sx(m)} ${sy(v)}`).join(' ');

export function ScenarioChart({ active }: { active: boolean }) {
  const start = finance.startCash;
  const central: [number, number][] = [[0, start], ...finance.monthly.cumulative.map((v, i) => [i + 1, v] as [number, number])];
  const prudent: [number, number][] = [[0, start], [3, finance.scenarios.prudent.m3], [6, finance.scenarios.prudent.m6]];
  const optimistic: [number, number][] = [[0, start], [3, finance.scenarios.optimistic.m3], [6, finance.scenarios.optimistic.m6]];
  const lines = [
    { id: 'o', pts: optimistic, color: '#8c9585', label: 'Optimistic', end: finance.scenarios.optimistic.m6, dash: undefined },
    { id: 'c', pts: central, color: '#4a433b', label: 'Central', end: finance.scenarios.central.m6, dash: undefined },
    { id: 'p', pts: prudent, color: '#8b4545', label: 'Prudent', end: finance.scenarios.prudent.m6, dash: undefined }
  ];
  return (
    <svg viewBox={`0 0 ${SC.w} ${SC.h}`} className="chart" role="img" aria-label="Cash balance by scenario over six months">
      {[-2000, 0, 2000, 4000, 6000, 8000].map(v => (
        <g key={v}>
          <line x1={SC.l} x2={SC.w - SC.r} y1={sy(v)} y2={sy(v)} stroke={v === 0 ? '#202020' : '#d9cfc0'} strokeWidth={v === 0 ? 2 : 1} />
          <text x={SC.l - 14} y={sy(v) + 6} textAnchor="end" className="tick">{v.toLocaleString('en-GB')}</text>
        </g>
      ))}
      {[0, 1, 2, 3, 4, 5, 6].map(m => <text key={m} x={sx(m)} y={SC.h - 24} textAnchor="middle" className="tick">{m === 0 ? 'Start' : `M${m}`}</text>)}
      {lines.map((l, i) => (
        <g key={l.id}>
          <motion.path d={pathOf(l.pts)} fill="none" stroke={l.color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" initial={false}
            animate={{ pathLength: active ? 1 : 0 }} transition={{ duration: 1.5, delay: 0.25 * i, ease }} />
          <motion.g initial={false} animate={{ opacity: active ? 1 : 0 }} transition={{ delay: 1.2 + 0.25 * i }}>
            <circle cx={sx(6)} cy={sy(l.end)} r="9" fill={l.color} />
            <text x={sx(6) + 20} y={sy(l.end) - 2} className="endLabel" fill={l.color}>{euro(l.end)}</text>
            <text x={sx(6) + 20} y={sy(l.end) + 24} className="endSub">{l.label}</text>
          </motion.g>
        </g>
      ))}
    </svg>
  );
}

/* ----------------------------------------------------- Monthly balance */
export function MonthlyChart({ active }: { active: boolean }) {
  const ex = extrapolateMonth7();
  const bal = finance.monthly.balance, cum = finance.monthly.cumulative;
  const W = 980, H = 540, l = 90, r = 40, t = 40, b = 70;
  const lo = -1800, hi = 6800;
  const x = (m: number) => l + ((m - 0.5) / 7) * (W - l - r);
  const y = (v: number) => t + ((hi - v) / (hi - lo)) * (H - t - b);
  const bw = 70;
  const cumPath = cum.map((v, i) => `${i ? 'L' : 'M'}${x(i + 1)} ${y(v)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Central scenario: monthly balance and cumulative cash">
      {[-1000, 0, 2000, 4000, 6000].map(v => (
        <g key={v}>
          <line x1={l} x2={W - r} y1={y(v)} y2={y(v)} stroke={v === 0 ? '#202020' : '#d9cfc0'} strokeWidth={v === 0 ? 2 : 1} />
          <text x={l - 14} y={y(v) + 6} textAnchor="end" className="tick">{v.toLocaleString('en-GB')}</text>
        </g>
      ))}
      {bal.map((v, i) => (
        <motion.rect key={i} x={x(i + 1) - bw / 2} y={y(0)} width={bw} rx="3" fill="#8b4545" initial={false}
          animate={{ height: active ? y(v) - y(0) : 0 }} transition={{ duration: 0.7, delay: 0.18 * i, ease }} />
      ))}
      <motion.path d={cumPath} fill="none" stroke="#4a433b" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" initial={false}
        animate={{ pathLength: active ? 1 : 0 }} transition={{ duration: 1.4, delay: 0.3, ease }} />
      {cum.map((v, i) => (
        <motion.g key={i} initial={false} animate={{ opacity: active ? 1 : 0 }} transition={{ delay: 0.5 + 0.18 * i }}>
          <circle cx={x(i + 1)} cy={y(v)} r="7" fill="#4a433b" />
          <text x={x(i + 1)} y={y(v) - 16} textAnchor="middle" className="valLabel">{euro(v)}</text>
          <text x={x(i + 1)} y={y(0) + 34} textAnchor="middle" className="barLabel">{euro(bal[i])}</text>
        </motion.g>
      ))}
      {/* month 7: our extrapolation, dashed and flagged */}
      <motion.g initial={false} animate={{ opacity: active ? 1 : 0 }} transition={{ delay: 2.4, duration: 0.8 }}>
        <rect x={x(7) - bw / 2} y={y(0)} width={bw} height={y(ex.balance) - y(0)} fill="none" stroke="#8b4545" strokeWidth="3" strokeDasharray="8 6" />
        <path d={`M${x(6)} ${y(cum[5])} L${x(7)} ${y(ex.cash)}`} stroke="#8b4545" strokeWidth="5" strokeDasharray="10 8" fill="none" />
        <circle cx={x(7)} cy={y(ex.cash)} r="9" fill="#fbf8f2" stroke="#8b4545" strokeWidth="4" />
        <text x={x(7)} y={y(ex.cash) + 44} textAnchor="middle" className="valLabel bad">≈ {euro(ex.cash)}</text>
        <text x={x(7)} y={y(ex.cash) + 70} textAnchor="middle" className="endSub">our extrapolation</text>
      </motion.g>
      {[1, 2, 3, 4, 5, 6, 7].map(m => <text key={m} x={x(m)} y={H - 20} textAnchor="middle" className="tick">M{m}</text>)}
    </svg>
  );
}
