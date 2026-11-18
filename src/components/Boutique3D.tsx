import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerformanceMonitor, RoundedBox } from '@react-three/drei';
import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { GarmentKind } from './Garments';

/* PÉPITE — artist's impression of the future boutique (~25 m², 5.2 m × 4.8 m).
   Everything is procedural (canvas textures, primitive geometry, RoomEnvironment lighting): no GLB, no HDRI,
   no remote font, so it renders offline. Quality steps down automatically on slow machines. */

const W = 5.2, D = 4.8, H = 3.1;           // interior width (x), depth (z), height
const X0 = -W / 2, X1 = W / 2, Z0 = -D / 2, Z1 = D / 2;
const timeU = { value: 0 };

/* =============================================================== textures */
type Draw = (g: CanvasRenderingContext2D, w: number, h: number) => void;
function canvasTex(w: number, h: number, draw: Draw, opts: { repeat?: [number, number]; srgb?: boolean; aniso?: number } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d')!, w, h);
  const t = new THREE.CanvasTexture(c);
  if (opts.srgb !== false) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = opts.aniso ?? 8;
  if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...opts.repeat); }
  return t;
}
// deterministic pseudo-random, so textures are identical on every run
const rnd = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const noise = (g: CanvasRenderingContext2D, w: number, h: number, count: number, alpha: number, dark = true) => {
  for (let i = 0; i < count; i++) {
    g.fillStyle = dark ? `rgba(60,45,30,${alpha * rnd(i)})` : `rgba(255,255,255,${alpha * rnd(i)})`;
    g.fillRect(rnd(i * 3.1) * w, rnd(i * 7.7) * h, 1 + rnd(i * 1.3) * 3, 1 + rnd(i * 5.9) * 3);
  }
};

/** Oak herringbone parquet (4:1 planks). Periodic in 2n plank widths, so it tiles seamlessly. */
function herringbone() {
  const n = 4, pw = 24, S = 2 * n * pw * 4; // 768 px
  return canvasTex(S, S, g => {
    g.fillStyle = '#7a5838'; g.fillRect(0, 0, S, S);
    const plank = (x: number, y: number, w: number, h: number, seed: number) => {
      const tone = 0.82 + rnd(seed) * 0.3;
      const r = Math.round(176 * tone), gg = Math.round(128 * tone), b = Math.round(82 * tone);
      const grad = g.createLinearGradient(x, y, x + w, y + h);
      grad.addColorStop(0, `rgb(${r},${gg},${b})`); grad.addColorStop(1, `rgb(${r - 14},${gg - 12},${b - 10})`);
      g.fillStyle = grad; g.fillRect(x + 1, y + 1, w - 2, h - 2);
      g.strokeStyle = 'rgba(70,45,25,.18)'; g.lineWidth = 1;
      for (let k = 0; k < 5; k++) { // grain
        g.beginPath();
        const vertical = h > w;
        const off = rnd(seed + k) * (vertical ? w : h);
        if (vertical) { g.moveTo(x + off, y); g.bezierCurveTo(x + off + 3, y + h * .3, x + off - 3, y + h * .7, x + off, y + h); }
        else { g.moveTo(x, y + off); g.bezierCurveTo(x + w * .3, y + off + 3, x + w * .7, y + off - 3, x + w, y + off); }
        g.stroke();
      }
    };
    const span = S / pw + 2 * n;
    for (let b = -span; b < span; b++) for (let t = -span; t < span; t++) {
      const ox = (t + b * n) * pw, oy = (t - b * n) * pw;
      const seedH = ((((ox % S) + S) % S) * 13 + (((oy % S) + S) % S) * 7);
      plank(ox + pw, oy, n * pw, pw, seedH);
      plank(ox, oy + pw, pw, n * pw, seedH + 1);
    }
  }, { repeat: [2.3, 2.1] });
}

const plaster = () => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#efe7da'; g.fillRect(0, 0, w, h);
  noise(g, w, h, 9000, 0.05); noise(g, w, h, 4000, 0.08, false);
}, { repeat: [3, 2] });

const marble = (base = '#f1ede6') => canvasTex(1024, 1024, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  noise(g, w, h, 6000, 0.05);
  for (let v = 0; v < 26; v++) {
    g.strokeStyle = `rgba(120,110,100,${0.08 + rnd(v) * 0.22})`; g.lineWidth = 0.6 + rnd(v * 2) * 2.4;
    g.beginPath(); let x = rnd(v * 3) * w, y = 0; g.moveTo(x, y);
    while (y < h) { x += (rnd(x + y) - 0.5) * 70; y += 30 + rnd(y + v) * 50; g.lineTo(x, y); }
    g.stroke();
  }
});

const oak = (fluted = false) => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#a07a52'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 160; i++) { g.strokeStyle = `rgba(80,55,30,${0.05 + rnd(i) * .12})`; g.beginPath(); const y = rnd(i * 4) * h; g.moveTo(0, y); g.bezierCurveTo(w * .3, y + 6, w * .6, y - 6, w, y + 2); g.stroke(); }
  if (fluted) for (let x = 0; x < w; x += 22) { const gr = g.createLinearGradient(x, 0, x + 22, 0); gr.addColorStop(0, 'rgba(0,0,0,.22)'); gr.addColorStop(.5, 'rgba(255,255,255,.10)'); gr.addColorStop(1, 'rgba(0,0,0,.22)'); g.fillStyle = gr; g.fillRect(x, 0, 22, h); }
});

const pavers = () => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#6f685f'; g.fillRect(0, 0, w, h);
  const bw = 64, bh = 42;
  for (let r = 0; r < h / bh; r++) for (let c = -1; c < w / bw + 1; c++) {
    const x = c * bw + (r % 2) * bw / 2, y = r * bh, t = 0.85 + rnd(r * 31 + c) * 0.25;
    g.fillStyle = `rgb(${Math.round(150 * t)},${Math.round(143 * t)},${Math.round(132 * t)})`; g.fillRect(x + 2, y + 2, bw - 4, bh - 4);
  }
  noise(g, w, h, 5000, 0.12);
}, { repeat: [5, 2.4] });

const asphalt = () => canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#2b2a29'; g.fillRect(0, 0, w, h); noise(g, w, h, 6000, 0.25, false); }, { repeat: [12, 6] });

/** Haussmann-style stone façade above the shop; returns colour map + emissive map (lit windows). */
function facadeTextures() {
  const w = 1024, h = 704; // 10 m × 6.9 m
  const win = (g: CanvasRenderingContext2D, lit: boolean[], emissive: boolean) => {
    const cols = [190, 512, 834], rows = [470, 120];
    rows.forEach((y, r) => cols.forEach((x, c) => {
      const on = lit[r * 3 + c];
      if (emissive) { g.fillStyle = on ? '#ffcf8f' : '#000'; g.fillRect(x - 44, y, 88, 190); return; }
      g.fillStyle = '#cbbda6'; g.fillRect(x - 58, y - 14, 116, 222);            // stone surround
      g.fillStyle = on ? '#e8b878' : '#2d3440'; g.fillRect(x - 44, y, 88, 190);  // glass
      g.strokeStyle = '#efe7da'; g.lineWidth = 5; g.strokeRect(x - 44, y, 88, 190); g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 190); g.moveTo(x - 44, y + 70); g.lineTo(x + 44, y + 70); g.stroke();
      g.strokeStyle = '#1d1d1d'; g.lineWidth = 3;                                // wrought-iron balcony
      g.beginPath(); g.moveTo(x - 62, y + 150); g.lineTo(x + 62, y + 150); g.moveTo(x - 62, y + 200); g.lineTo(x + 62, y + 200); g.stroke();
      for (let k = -60; k <= 60; k += 10) { g.beginPath(); g.moveTo(x + k, y + 150); g.lineTo(x + k, y + 200); g.stroke(); }
    }));
  };
  const lit = [true, false, true, false, true, false];
  const map = canvasTex(w, h, g => {
    g.fillStyle = '#d8ccb6'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 44) { g.fillStyle = 'rgba(120,100,80,.25)'; g.fillRect(0, y, w, 2); }
    noise(g, w, h, 12000, 0.08);
    g.fillStyle = '#c7b9a1'; g.fillRect(0, h - 26, w, 26); g.fillRect(0, 330, w, 18);    // cornices
    win(g, lit, false);
  });
  const emissive = canvasTex(w, h, g => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); win(g, lit, true); });
  return { map, emissive };
}

const shutter = (dark: boolean) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = dark ? '#3a3835' : '#555049'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 8) { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, y, w, 2); g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(0, y + 2, w, 1); }
});

const awningStripes = () => canvasTex(512, 256, (g, w, h) => {
  for (let x = 0; x < w; x += 64) { g.fillStyle = '#8b4545'; g.fillRect(x, 0, 32, h); g.fillStyle = '#efe6d6'; g.fillRect(x + 32, 0, 32, h); }
  noise(g, w, h, 3000, 0.08);
}, { repeat: [5, 1] });

const valance = () => canvasTex(512, 128, (g, w, h) => {
  for (let x = 0; x < w; x += 64) { g.fillStyle = '#8b4545'; g.fillRect(x, 0, 32, h); g.fillStyle = '#efe6d6'; g.fillRect(x + 32, 0, 32, h); }
  g.globalCompositeOperation = 'destination-out';
  for (let x = 0; x < w; x += 64) { g.beginPath(); g.arc(x + 32, h + 12, 34, 0, Math.PI * 2); g.fill(); }
}, { repeat: [5, 1] });

const rugTex = () => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#e9e0d1'; g.beginPath(); g.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#b7a793'; g.lineWidth = 10; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 26, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 3; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 42, 0, Math.PI * 2); g.stroke();
  noise(g, w, h, 14000, 0.08);
});

const hatBox = (c1: string, c2: string) => canvasTex(256, 64, (g, w, h) => { for (let x = 0; x < w; x += 16) { g.fillStyle = c1; g.fillRect(x, 0, 8, h); g.fillStyle = c2; g.fillRect(x + 8, 0, 8, h); } });

function textTex(lines: { text: string; font: string; color: string; y: number; spacing?: number; glow?: string }[], w: number, h: number, bg?: string, gold = false) {
  return canvasTex(w, h, g => {
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); noise(g, w, h, 3000, 0.05, false); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const l of lines) {
      g.font = l.font;
      (g as unknown as { letterSpacing: string }).letterSpacing = `${l.spacing ?? 0}px`;
      if (l.glow) { g.shadowColor = l.glow; g.shadowBlur = 30; }
      if (gold) { const gr = g.createLinearGradient(0, l.y - 80, 0, l.y + 80); gr.addColorStop(0, '#f3dca0'); gr.addColorStop(.5, '#c9a15a'); gr.addColorStop(1, '#8a6a32'); g.fillStyle = gr; }
      else g.fillStyle = l.color;
      g.fillText(l.text, w / 2, l.y);
      g.shadowBlur = 0;
    }
  }, { aniso: 4 });
}

/** Builds text textures after the bundled web fonts are ready (otherwise the canvas would use a fallback face). */
function useFontTextures<T>(build: () => T): T | null {
  const [v, setV] = useState<T | null>(null);
  useEffect(() => {
    let alive = true;
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    const go = () => { if (alive) setV(build()); };
    if (fonts) Promise.all([fonts.load('600 80px "Cormorant Garamond"'), fonts.load('italic 500 80px "Cormorant Garamond"'), fonts.load('700 40px "Arimo"')]).then(go, go);
    else go();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return v;
}

/* ============================================================= garments */
type Pattern = 'plain' | 'stripe' | 'check' | 'dots' | 'denim' | 'leather' | 'knit';
type Spec = { k: GarmentKind; c: string; p: Pattern; s?: string };
const GARMENT_PATHS: Record<GarmentKind, string> = {
  dress: 'M38 44 L50 54 L62 44 L66 72 L58 78 L80 148 Q50 158 20 148 L42 78 L34 72 Z',
  shirt: 'M36 44 L50 52 L64 44 L90 68 L80 84 L70 74 L70 132 H30 L30 74 L20 84 L10 68 Z',
  coat: 'M34 44 L50 58 L66 44 L92 72 L84 130 L72 120 L74 154 H26 L28 120 L16 130 L8 72 Z',
  trousers: 'M30 46 H70 L76 152 H56 L50 88 L44 152 H24 Z',
  skirt: 'M34 46 H66 L86 142 H14 Z'
};
// A curated, vintage-chic wardrobe: camel coat, Breton top, silk dress, denim, tweed, little black dress…
const WARDROBE: Spec[] = [
  { k: 'coat', c: '#b48a5e', p: 'plain' },
  { k: 'shirt', c: '#f4f0e8', p: 'stripe', s: '#26324d' },
  { k: 'dress', c: '#d29a8f', p: 'plain' },
  { k: 'shirt', c: '#55708f', p: 'denim' },
  { k: 'coat', c: '#7d6b57', p: 'check', s: '#d5c2a4' },
  { k: 'dress', c: '#1f1f1f', p: 'plain' },
  { k: 'shirt', c: '#fbf8f2', p: 'plain' },
  { k: 'skirt', c: '#8b4545', p: 'plain' },
  { k: 'trousers', c: '#cdbfa9', p: 'plain' },
  { k: 'dress', c: '#8c9585', p: 'dots', s: '#f4f0e8' },
  { k: 'coat', c: '#3b2b22', p: 'leather' },
  { k: 'shirt', c: '#cfa35a', p: 'knit' }
];

const texCache = new Map<string, THREE.CanvasTexture>();
function garmentTexture(sp: Spec) {
  const key = `${sp.k}-${sp.c}-${sp.p}`;
  const hit = texCache.get(key); if (hit) return hit;
  const t = canvasTex(320, 512, g => {
    g.scale(3.2, 3.2);
    const path = new Path2D(GARMENT_PATHS[sp.k]);
    g.save(); g.clip(path);
    g.fillStyle = sp.c; g.fillRect(0, 0, 100, 160);
    const s = sp.s ?? '#000';
    if (sp.p === 'stripe') for (let y = 40; y < 160; y += 6) { g.fillStyle = s; g.fillRect(0, y, 100, 2.4); }
    if (sp.p === 'check') { g.globalAlpha = .35; g.fillStyle = s; for (let x = 0; x < 100; x += 7) g.fillRect(x, 0, 2, 160); for (let y = 0; y < 160; y += 7) g.fillRect(0, y, 100, 2); g.globalAlpha = 1; }
    if (sp.p === 'dots') { g.fillStyle = s; for (let y = 44; y < 160; y += 8) for (let x = (y / 8) % 2 ? 4 : 0; x < 100; x += 8) { g.beginPath(); g.arc(x, y, 1.4, 0, Math.PI * 2); g.fill(); } }
    if (sp.p === 'denim') { g.strokeStyle = 'rgba(255,255,255,.10)'; g.lineWidth = .4; for (let x = -160; x < 100; x += 1.6) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 160, 160); g.stroke(); } g.strokeStyle = '#c9a15a'; g.lineWidth = .5; g.setLineDash([1.2, 1]); g.strokeRect(34, 80, 12, 12); g.strokeRect(54, 80, 12, 12); g.setLineDash([]); }
    if (sp.p === 'knit') { g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = .6; for (let x = 0; x < 100; x += 2.4) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 160); g.stroke(); } g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(30, 126, 40, 6); }
    if (sp.p === 'leather') { for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(255,255,255,${rnd(i) * .05})`; g.fillRect(rnd(i * 2) * 100, rnd(i * 3) * 160, 1.2, 1.2); } }
    // soft folds and hem shading
    for (let i = 0; i < 7; i++) {
      const x = 18 + i * 11 + rnd(i + sp.c.length) * 6;
      const gr = g.createLinearGradient(x - 5, 0, x + 5, 0);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.5, `rgba(0,0,0,${0.08 + rnd(i * 9) * 0.08})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(x - 5, 60, 10, 100);
    }
    const hem = g.createLinearGradient(0, 40, 0, 160); hem.addColorStop(0, 'rgba(255,255,255,.10)'); hem.addColorStop(.25, 'rgba(0,0,0,0)'); hem.addColorStop(1, 'rgba(0,0,0,.22)');
    g.fillStyle = hem; g.fillRect(0, 0, 100, 160);
    // construction details
    g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = .7;
    if (sp.k === 'coat' || sp.k === 'shirt') { g.beginPath(); g.moveTo(50, 56); g.lineTo(50, 150); g.stroke(); g.fillStyle = sp.p === 'leather' ? '#b39257' : 'rgba(30,25,20,.6)'; for (let y = 72; y < 128; y += 14) { g.beginPath(); g.arc(53, y, 1.3, 0, Math.PI * 2); g.fill(); } }
    if (sp.k === 'coat') { g.beginPath(); g.moveTo(34, 44); g.lineTo(46, 76); g.lineTo(50, 58); g.moveTo(66, 44); g.lineTo(54, 76); g.lineTo(50, 58); g.stroke(); }
    if (sp.k === 'dress') { g.beginPath(); g.moveTo(42, 78); g.quadraticCurveTo(50, 82, 58, 78); g.stroke(); }
    g.restore();
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = .9; g.stroke(path);
  }, { aniso: 4 });
  texCache.set(key, t);
  return t;
}

// Gives each flat garment volume (a curved front) and a gentle sway from the hanger.
function patchCloth(shader: THREE.WebGLProgramParametersWithUniforms) {
  shader.uniforms.uTime = timeU;
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nuniform float uTime;')
    .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
      objectNormal = normalize(vec3(2.0 * 0.05 * position.x / 0.0529, 0.0, 1.0));`)
    .replace('#include <begin_vertex>', `#include <begin_vertex>
      float k = clamp((0.5 - position.y) / 1.0, 0.0, 1.0);
      float ph = modelMatrix[3].x * 1.7 + modelMatrix[3].z * 2.3;
      transformed.z += (1.0 - pow(position.x / 0.23, 2.0)) * 0.05;
      transformed.z += sin(uTime * 1.3 + ph + position.y * 3.5) * 0.035 * k * k;
      transformed.x += sin(uTime * 0.9 + ph * 0.7) * 0.01 * k;`);
}
const matCache = new Map<string, THREE.MeshPhysicalMaterial>();
function clothMaterial(sp: Spec) {
  const key = `${sp.k}-${sp.c}-${sp.p}`;
  const hit = matCache.get(key); if (hit) return hit;
  const leather = sp.p === 'leather';
  const m = new THREE.MeshPhysicalMaterial({
    map: garmentTexture(sp), alphaTest: 0.5, side: THREE.DoubleSide,
    roughness: leather ? 0.42 : sp.p === 'plain' && sp.k === 'dress' ? 0.55 : 0.88,
    sheen: leather ? 0 : 0.6, sheenRoughness: 0.55, sheenColor: new THREE.Color('#fff6ea'),
    clearcoat: leather ? 0.35 : 0, clearcoatRoughness: 0.4
  });
  m.onBeforeCompile = patchCloth;
  matCache.set(key, m);
  return m;
}
const garmentGeo = new THREE.PlaneGeometry(0.46, 1.0, 10, 16);

const BRASS = { color: '#c9a46a', metalness: 1, roughness: 0.28 };
const MIRROR = { color: '#eef2f2', metalness: 1, roughness: 0.06, envMapIntensity: 2.4, emissive: '#6b5a48', emissiveIntensity: 0.45 };
function Hanger() {
  return (
    <group>
      <mesh position={[0, 0.04, 0]}><torusGeometry args={[0.022, 0.0035, 6, 16, Math.PI * 1.4]} /><meshStandardMaterial {...BRASS} /></mesh>
      {[-1, 1].map(s => (
        <mesh key={s} position={[s * 0.105, -0.04, 0]} rotation={[0, 0, s * -0.36]} castShadow>
          <boxGeometry args={[0.23, 0.016, 0.012]} /><meshStandardMaterial color="#8a6440" roughness={0.45} />
        </mesh>
      ))}
    </group>
  );
}
function Hung({ sp, position, rotY = 0 }: { sp: Spec; position: [number, number, number]; rotY?: number }) {
  const ref = useRef<THREE.Group>(null);
  const phase = position[0] * 3.1 + position[2] * 1.7;
  useFrame(() => { if (ref.current) ref.current.rotation.z = Math.sin(timeU.value * 0.8 + phase) * 0.015; });
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <group ref={ref}>
        <Hanger />
        <mesh geometry={garmentGeo} material={clothMaterial(sp)} position={[0, -0.305, 0]} />
      </group>
    </group>
  );
}

/* ================================================================ shell */
// Merged classic French wall mouldings ("boiseries"): one draw call per wall.
function mouldings(width: number, panels: number) {
  const parts: THREE.BufferGeometry[] = [];
  const bar = (w: number, h: number, x: number, y: number) => { const b = new THREE.BoxGeometry(w, h, 0.018); b.translate(x, y, 0); parts.push(b); };
  const gap = 0.16, pw = (width - gap * (panels + 1)) / panels, t = 0.035;
  for (let i = 0; i < panels; i++) {
    const cx = -width / 2 + gap + pw / 2 + i * (pw + gap);
    for (const [y0, y1] of [[0.25, 0.8], [1.0, 2.72]] as const) {
      const h = y1 - y0, cy = (y0 + y1) / 2;
      bar(pw, t, cx, y0); bar(pw, t, cx, y1); bar(t, h, cx - pw / 2, cy); bar(t, h, cx + pw / 2, cy);
    }
  }
  bar(width, 0.03, 0, 0.9); // dado rail
  return mergeGeometries(parts)!;
}

function Walls({ plasterMap }: { plasterMap: THREE.Texture }) {
  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f1e9dc', map: plasterMap, roughness: 0.95 }), [plasterMap]);
  const trimMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f4ede2', roughness: 0.6 }), []);
  const back = useMemo(() => mouldings(W, 4), []);
  const side = useMemo(() => mouldings(D - 0.2, 4), []);
  const wall = (len: number) => (
    <>
      <mesh material={wallMat} position={[0, H / 2, -0.05]} receiveShadow><boxGeometry args={[len, H, 0.1]} /></mesh>
      <mesh geometry={len === W ? back : side} material={trimMat} position={[0, 0, 0.01]} />
      <mesh material={trimMat} position={[0, 0.07, 0.012]}><boxGeometry args={[len, 0.14, 0.025]} /></mesh>
      <mesh material={trimMat} position={[0, H - 0.07, 0.04]}><boxGeometry args={[len, 0.14, 0.09]} /></mesh>
    </>
  );
  return (
    <group>
      <group position={[0, 0, Z0]}>{wall(W)}</group>
      <group position={[X0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>{wall(D)}</group>
      <group position={[X1, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>{wall(D)}</group>
    </group>
  );
}

function Door({ open }: { open: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    const target = open ? 1.55 : 0;
    ref.current.rotation.y += (target - ref.current.rotation.y) * Math.min(1, dt * 2.2);
  });
  return (
    <group position={[-0.5, 0, Z1]} ref={ref}>
      <mesh position={[0.5, 1.2, 0]}><boxGeometry args={[0.98, 2.3, 0.02]} /><meshPhysicalMaterial color="#d8e6e4" transparent opacity={0.16} roughness={0.03} metalness={0.1} /></mesh>
      {[[0.03, 1.2, 0.06, 2.4], [0.97, 1.2, 0.06, 2.4], [0.5, 0.06, 1.0, 0.12], [0.5, 2.37, 1.0, 0.07], [0.5, 0.5, 1.0, 0.03]].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, 0]} castShadow><boxGeometry args={[w, h, 0.06]} /><meshPhysicalMaterial color="#202020" roughness={0.35} clearcoat={0.6} /></mesh>
      ))}
      <mesh position={[0.86, 1.1, 0.06]}><cylinderGeometry args={[0.012, 0.012, 0.42, 10]} /><meshStandardMaterial {...BRASS} /></mesh>
    </group>
  );
}

function Shopfront({ cutaway }: { cutaway: boolean }) {
  const paint = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#1f2022', roughness: 0.38, clearcoat: 0.7, clearcoatRoughness: 0.25 }), []);
  const glass = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#cfdedc', transparent: true, opacity: 0.12, roughness: 0.02, metalness: 0.2, envMapIntensity: 1.6 }), []);
  const fascia = useFontTextures(() => textTex([
    { text: 'PÉPITE', font: '600 230px "Cormorant Garamond"', color: '#c9a15a', y: 150, spacing: 34 },
    { text: 'SECONDE MAIN · CHANTILLY', font: '700 40px "Arimo"', color: '#c9a15a', y: 272, spacing: 16 }
  ], 2048, 340, '#1f2022', true));
  const stone = useMemo(facadeTextures, []);
  const awning = useMemo(awningStripes, []);
  const val = useMemo(valance, []);
  const shut = useMemo(() => [shutter(true), shutter(false)], []);
  const fw = W + 0.4;
  return (
    <group>
      {/* stall risers under the windows */}
      {[-1, 1].map(s => <mesh key={'r' + s} material={paint} position={[s * 1.6, 0.27, Z1 + 0.06]} castShadow><boxGeometry args={[1.95, 0.54, 0.16]} /></mesh>)}
      {/* pilasters, door jambs, transom */}
      {[-fw / 2 + 0.1, fw / 2 - 0.1].map(x => <mesh key={x} material={paint} position={[x, H / 2, Z1 + 0.08]} castShadow><boxGeometry args={[0.24, H, 0.2]} /></mesh>)}
      {[-0.58, 0.58].map(x => <mesh key={'j' + x} material={paint} position={[x, 1.3, Z1 + 0.05]}><boxGeometry args={[0.14, 2.6, 0.14]} /></mesh>)}
      <mesh material={paint} position={[0, 2.56, Z1 + 0.05]}><boxGeometry args={[fw, 0.1, 0.16]} /></mesh>
      {[-1, 1].map(s => <mesh key={'m' + s} material={paint} position={[s * 1.6, 2.15, Z1 + 0.04]}><boxGeometry args={[1.9, 0.04, 0.06]} /></mesh>)}
      {[-1, 1].map(s => <mesh key={'g' + s} material={glass} position={[s * 1.6, 1.55, Z1 + 0.03]}><planeGeometry args={[1.86, 2.0]} /></mesh>)}
      <mesh material={glass} position={[0, 2.42, Z1 + 0.03]}><planeGeometry args={[1.0, 0.2]} /></mesh>
      {!cutaway && (
        <>
      {/* fascia with gilded lettering */}
          <mesh material={paint} position={[0, 2.88, Z1 + 0.1]} castShadow><boxGeometry args={[fw, 0.52, 0.2]} /></mesh>
          {fascia && <mesh position={[0, 2.88, Z1 + 0.201]}><planeGeometry args={[fw - 0.3, 0.46]} /><meshStandardMaterial map={fascia} roughness={0.35} metalness={0.45} /></mesh>}
          {/* striped awning + scalloped valance */}
          <mesh position={[0, 2.4, Z1 + 0.62]} rotation={[-1.17, 0, 0]} castShadow><planeGeometry args={[W, 1.02]} /><meshStandardMaterial map={awning} roughness={0.9} side={THREE.DoubleSide} /></mesh>
          <mesh position={[0, 2.12, Z1 + 1.06]}><planeGeometry args={[W, 0.18]} /><meshStandardMaterial map={val} transparent alphaTest={0.5} roughness={0.9} side={THREE.DoubleSide} /></mesh>
          {[-1, 1].map(s => <mesh key={'a' + s} position={[s * W / 2, 2.4, Z1 + 0.55]} rotation={[-1.17, 0, 0]}><cylinderGeometry args={[0.01, 0.01, 1.1, 6]} /><meshStandardMaterial {...BRASS} /></mesh>)}
        </>
      )}
      {/* building above + neighbours (hidden in the cut-away overview) */}
      {!cutaway && (
        <mesh position={[0, H + 3.45, Z1 + 0.02]}><planeGeometry args={[10, 6.9]} /><meshStandardMaterial map={stone.map} emissiveMap={stone.emissive} emissive="#ffd29a" emissiveIntensity={1.6} roughness={0.9} /></mesh>
      )}
      {[-1, 1].map((s, i) => (
        <group key={'n' + s}>
          <mesh position={[s * 3.9, 1.45, Z1 + 0.16]}><planeGeometry args={[2.0, 2.4]} /><meshStandardMaterial map={shut[i]} roughness={0.6} metalness={0.4} /></mesh>
          <mesh position={[s * 4.42, 1.64, -0.1]} receiveShadow><boxGeometry args={[3.2, 3.28, 5.0]} /><meshStandardMaterial color="#cbbfa9" roughness={0.9} /></mesh>
        </group>
      ))}
    </group>
  );
}

function Boxwood({ seed }: { seed: number }) {
  const geo = useMemo(() => foliageGeometry(0.3, seed), [seed]);
  const tex = useMemo(() => leafTex('#3f5634', '#6f8a52'), []);
  return <mesh geometry={geo} position={[0, 0.7, 0]} castShadow><meshStandardMaterial map={tex} color="#c8d8b8" roughness={0.85} /></mesh>;
}

function Street() {
  const pv = useMemo(pavers, []);
  const asp = useMemo(asphalt, []);
  const board = useFontTextures(() => textTex([
    { text: 'Pépites', font: 'italic 500 130px "Cormorant Garamond"', color: '#f4f0e8', y: 120 },
    { text: 'du jour', font: 'italic 500 90px "Cormorant Garamond"', color: '#f4f0e8', y: 220 },
    { text: 'SECOND-HAND · CURATED', font: '700 30px "Arimo"', color: '#d29a8f', y: 330, spacing: 6 },
    { text: 'Home buy-back on appointment', font: '400 30px "Arimo"', color: '#e8e0d0', y: 395 }
  ], 512, 460, '#2a2b2a'));
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, Z1 + 2.05]} receiveShadow><planeGeometry args={[20, 4.1]} /><meshStandardMaterial map={pv} roughness={0.85} /></mesh>
      <mesh position={[0, -0.075, Z1 + 4.15]}><boxGeometry args={[20, 0.16, 0.2]} /><meshStandardMaterial color="#9a958c" roughness={0.8} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, Z1 + 12]} receiveShadow><planeGeometry args={[40, 16]} /><meshStandardMaterial map={asp} roughness={0.75} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}><planeGeometry args={[40, 12]} /><meshStandardMaterial color="#57504a" roughness={1} /></mesh>
      {/* boxwood planters either side of the door */}
      {[-1, 1].map(s => (
        <group key={s} position={[s * 1.05, 0, Z1 + 0.42]}>
          <mesh position={[0, 0.22, 0]} castShadow><boxGeometry args={[0.42, 0.44, 0.42]} /><meshPhysicalMaterial color="#1f2022" roughness={0.4} clearcoat={0.5} /></mesh>
          <Boxwood seed={s + 2} />
        </group>
      ))}
      {/* chalkboard A-frame */}
      {board && (
        <group position={[1.75, 0, Z1 + 1.35]} rotation={[0, -0.35, 0]}>
          <mesh position={[0, 0.5, 0.12]} rotation={[-0.22, 0, 0]} castShadow><boxGeometry args={[0.56, 0.98, 0.03]} /><meshStandardMaterial color="#3b2c20" roughness={0.6} /></mesh>
          <mesh position={[0, 0.52, 0.139]} rotation={[-0.22, 0, 0]}><planeGeometry args={[0.48, 0.86]} /><meshStandardMaterial map={board} roughness={0.95} /></mesh>
          <mesh position={[0, 0.5, -0.12]} rotation={[0.22, 0, 0]} castShadow><boxGeometry args={[0.56, 0.98, 0.03]} /><meshStandardMaterial color="#3b2c20" roughness={0.6} /></mesh>
        </group>
      )}
      {/* street lamp */}
      <group position={[3.6, 0, Z1 + 3.7]}>
        <mesh position={[0, 1.8, 0]}><cylinderGeometry args={[0.05, 0.08, 3.6, 12]} /><meshStandardMaterial color="#1c2420" roughness={0.5} metalness={0.6} /></mesh>
        <mesh position={[0, 3.75, 0]}><cylinderGeometry args={[0.12, 0.2, 0.36, 6]} /><meshStandardMaterial color="#ffd9a0" emissive="#ffcf8a" emissiveIntensity={4} toneMapped={false} /></mesh>
        <mesh position={[0, 4.0, 0]}><coneGeometry args={[0.24, 0.2, 6]} /><meshStandardMaterial color="#1c2420" metalness={0.6} roughness={0.5} /></mesh>
        <pointLight position={[0, 3.6, 0]} color="#ffc98a" intensity={14} distance={11} decay={1.6} />
      </group>
    </group>
  );
}

function Sky() {
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(70, 32, 16);
    const top = new THREE.Color('#141c2e'), mid = new THREE.Color('#3b3550'), low = new THREE.Color('#c27a55');
    const cols: number[] = []; const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i) / 70; const c = new THREE.Color();
      if (y > 0.25) c.copy(mid).lerp(top, Math.min(1, (y - 0.25) / 0.6)); else c.copy(low).lerp(mid, Math.max(0, (y + 0.05) / 0.3));
      cols.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    return g;
  }, []);
  return <mesh geometry={geo}><meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} /></mesh>;
}

/* ============================================================ furniture */
/** A leafy blob: an icosphere with layered noise displacement and smooth normals. */
function foliageGeometry(radius: number, seed: number) {
  const g = new THREE.IcosahedronGeometry(radius, 4);
  const p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = Math.sin(v.x * 23 + seed) * Math.sin(v.y * 19 + seed * 2) * Math.sin(v.z * 21 + seed * 3);
    const m = Math.sin(v.x * 61 + seed) * Math.sin(v.y * 57) * Math.sin(v.z * 67);
    v.multiplyScalar(1 + n * 0.12 + m * 0.05);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}
const leafTex = (a: string, b: string) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = a; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2200; i++) { g.globalAlpha = 0.35 + rnd(i * 11) * 0.4; g.fillStyle = rnd(i) > 0.55 ? b : 'rgba(30,40,25,.6)'; g.beginPath(); g.ellipse(rnd(i * 2) * w, rnd(i * 3) * h, 1.5 + rnd(i * 5) * 2.5, 0.8 + rnd(i * 7) * 1.2, rnd(i) * 3, 0, Math.PI * 2); g.fill(); }
  g.globalAlpha = 1;
});

function LeftRail() {
  const zs = Array.from({ length: 8 }, (_, i) => -1.6 + i * 0.34);
  const shoeColors = ['#3b2b22', '#8b4545', '#cdbfa9', '#1f1f1f'];
  const boxes = useMemo(() => [hatBox('#efe6d6', '#8b4545'), hatBox('#efe6d6', '#202020'), hatBox('#d29a8f', '#efe6d6')], []);
  return (
    <group>
      <mesh position={[X0 + 0.3, 1.78, -0.4]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.016, 0.016, 2.9, 12]} /><meshStandardMaterial {...BRASS} /></mesh>
      {[-1.8, 1.0].map(z => <mesh key={z} position={[X0 + 0.15, 1.78, z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.012, 0.012, 0.3, 8]} /><meshStandardMaterial {...BRASS} /></mesh>)}
      {zs.map((z, i) => <Hung key={i} sp={WARDROBE[i]} position={[X0 + 0.3, 1.8, z]} rotY={0.75 + (rnd(i) - 0.5) * 0.25} />)}
      {/* oak shelf with hat boxes and bags above the rail */}
      <mesh position={[X0 + 0.18, 2.2, -0.4]} castShadow><boxGeometry args={[0.32, 0.035, 2.9]} /><meshStandardMaterial color="#9b7650" roughness={0.6} /></mesh>
      {[-1.4, -0.55, 0.6].map((z, i) => (
        <mesh key={i} position={[X0 + 0.18, 2.32, z]} castShadow><cylinderGeometry args={[0.13, 0.13, 0.2, 24]} /><meshStandardMaterial map={boxes[i]} roughness={0.8} /></mesh>
      ))}
      <RoundedBox args={[0.24, 0.2, 0.3]} radius={0.03} position={[X0 + 0.18, 2.33, 0.05]} castShadow><meshPhysicalMaterial color="#6b3a2c" roughness={0.45} clearcoat={0.4} /></RoundedBox>
      {/* low bench with shoes */}
      <mesh position={[X0 + 0.22, 0.2, -0.4]} castShadow receiveShadow><boxGeometry args={[0.4, 0.4, 2.9]} /><meshStandardMaterial color="#efe6d6" roughness={0.7} /></mesh>
      {Array.from({ length: 5 }, (_, i) => (
        <group key={i} position={[X0 + 0.24, 0.41, -1.5 + i * 0.55]} rotation={[0, Math.PI / 2 + (rnd(i) - .5) * .4, 0]}>
          {[-0.06, 0.06].map(o => (
            <group key={o} position={[o, 0, 0]}>
              <RoundedBox args={[0.09, 0.07, 0.25]} radius={0.03} position={[0, 0.035, 0]} castShadow><meshPhysicalMaterial color={shoeColors[i % 4]} roughness={0.4} clearcoat={0.5} /></RoundedBox>
              {i % 2 === 0 && <mesh position={[0, 0.04, -0.1]}><cylinderGeometry args={[0.012, 0.016, 0.08, 8]} /><meshStandardMaterial color="#1a1a1a" /></mesh>}
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

function BackWall() {
  const neon = useFontTextures(() => textTex([{ text: 'Pépite', font: 'italic 500 300px "Cormorant Garamond"', color: '#fff1d6', y: 190, glow: '#ffb466' }], 1024, 380));
  const niche = useMemo(() => {
    const s = new THREE.Shape(); const w = 1.5, h = 2.15;
    s.moveTo(-w / 2, 0); s.lineTo(-w / 2, h - w / 2); s.absarc(0, h - w / 2, w / 2, Math.PI, 0, true); s.lineTo(w / 2, 0); s.lineTo(-w / 2, 0);
    return new THREE.ShapeGeometry(s, 32);
  }, []);
  const mirrorShape = useMemo(() => {
    const s = new THREE.Shape(); const w = 0.62, h = 1.85;
    s.moveTo(-w / 2, 0); s.lineTo(-w / 2, h - w / 2); s.absarc(0, h - w / 2, w / 2, Math.PI, 0, true); s.lineTo(w / 2, 0); s.lineTo(-w / 2, 0);
    return new THREE.ShapeGeometry(s, 24);
  }, []);
  return (
    <group>
      <mesh geometry={niche} position={[0, 0.15, Z0 + 0.025]}><meshStandardMaterial color="#c98e83" roughness={0.9} /></mesh>
      <mesh position={[0, 1.88, Z0 + 0.2]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.014, 0.014, 1.3, 10]} /><meshStandardMaterial {...BRASS} /></mesh>
      {[-0.62, 0.62].map(x => <mesh key={x} position={[x, 1.88, Z0 + 0.12]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.01, 0.01, 0.18, 8]} /><meshStandardMaterial {...BRASS} /></mesh>)}
      {[[-0.4, 4], [0, 2], [0.4, 10]].map(([x, i]) => <Hung key={x} sp={WARDROBE[i]} position={[x, 1.9, Z0 + 0.2]} rotY={0} />)}
      {neon && <mesh position={[0, 2.72, Z0 + 0.04]}><planeGeometry args={[1.25, 0.46]} /><meshBasicMaterial map={neon} transparent color={new THREE.Color(2.6, 2.2, 1.7)} toneMapped={false} depthWrite={false} /></mesh>}
      {/* arched floor mirror */}
      <group position={[-1.55, 0.02, Z0 + 0.12]} rotation={[-0.06, 0, 0]}>
        <mesh geometry={mirrorShape} scale={[1.08, 1.04, 1]} position={[0, -0.03, -0.012]}><meshStandardMaterial {...BRASS} /></mesh>
        <mesh geometry={mirrorShape}><meshStandardMaterial {...MIRROR} /></mesh>
      </group>
      {/* velvet pouf */}
      <mesh position={[0.95, 0.22, -1.0]} castShadow><cylinderGeometry args={[0.3, 0.3, 0.42, 32]} /><meshPhysicalMaterial color="#5f6b56" roughness={0.9} sheen={1} sheenColor="#c9d4bf" sheenRoughness={0.4} /></mesh>
    </group>
  );
}

function FittingRoom() {
  const curtain = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({ color: '#8b4545', roughness: 0.9, sheen: 1, sheenColor: '#f0b6a8', sheenRoughness: 0.35, side: THREE.DoubleSide });
    m.onBeforeCompile = shader => {
      shader.uniforms.uTime = timeU;
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;')
        .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
          objectNormal = normalize(vec3(-cos(position.x * 26.0) * 0.08 * 26.0, 0.0, 1.0));`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          float k = clamp((1.15 - position.y) / 2.3, 0.0, 1.0);
          transformed.z += sin(position.x * 26.0) * 0.08 + sin(position.x * 4.0 + uTime * 0.9) * 0.02 * k;`);
    };
    return m;
  }, []);
  const panel = useMemo(() => mouldings(1.15, 1), []);
  return (
    <group>
      {/* partition wall with mouldings */}
      <group position={[1.42, 0, -1.825]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh position={[0, 1.25, 0]} castShadow receiveShadow><boxGeometry args={[1.15, 2.5, 0.08]} /><meshStandardMaterial color="#f1e9dc" roughness={0.95} /></mesh>
        <mesh geometry={panel} position={[0, 0, 0.045]} scale={[1, 0.9, 1]}><meshStandardMaterial color="#f4ede2" roughness={0.6} /></mesh>
      </group>
      <mesh position={[2.0, 2.4, -1.25]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.014, 0.014, 1.2, 10]} /><meshStandardMaterial {...BRASS} /></mesh>
      <mesh material={curtain} position={[2.3, 1.18, -1.25]} castShadow><planeGeometry args={[0.56, 2.32, 40, 12]} /></mesh>
      {/* inside: mirror, stool, a dress on a hook */}
      <mesh position={[X1 - 0.02, 1.25, -1.85]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[0.7, 1.7]} /><meshStandardMaterial {...MIRROR} /></mesh>
      <mesh position={[X1 - 0.03, 1.25, -1.85]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[0.78, 1.78]} /><meshStandardMaterial {...BRASS} /></mesh>
      <mesh position={[1.85, 0.24, -2.0]} castShadow><cylinderGeometry args={[0.2, 0.2, 0.46, 24]} /><meshPhysicalMaterial color="#d29a8f" roughness={0.9} sheen={1} sheenColor="#ffd8cf" /></mesh>
      <Hung sp={WARDROBE[9]} position={[1.7, 1.95, Z0 + 0.12]} />
      <pointLight position={[2.0, 2.2, -1.85]} color="#ffdcb8" intensity={2.4} distance={2.6} decay={1.8} />
    </group>
  );
}

function Counter() {
  const top = useMemo(() => marble(), []);
  const wood = useMemo(() => oak(true), []);
  const pampas = useMemo(() => Array.from({ length: 9 }, (_, i) => ({ r: (rnd(i) - 0.5) * 0.7, t: (rnd(i * 3) - 0.5) * 0.7, h: 0.45 + rnd(i * 5) * 0.25 })), []);
  return (
    <group position={[2.18, 0, 0.75]}>
      <mesh position={[0, 0.48, 0]} castShadow receiveShadow><boxGeometry args={[0.56, 0.96, 1.5]} /><meshStandardMaterial map={wood} roughness={0.55} /></mesh>
      <mesh position={[-0.02, 0.985, 0]} castShadow><boxGeometry args={[0.66, 0.05, 1.6]} /><meshPhysicalMaterial map={top} roughness={0.18} clearcoat={0.6} /></mesh>
      {/* brass table lamp */}
      <group position={[0.05, 1.01, 0.55]}>
        <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.012, 0.05, 0.4, 12]} /><meshStandardMaterial {...BRASS} /></mesh>
        <mesh position={[0, 0.44, 0]}><cylinderGeometry args={[0.08, 0.16, 0.16, 24, 1, true]} /><meshStandardMaterial color="#f4ead6" emissive="#ffd8a0" emissiveIntensity={2.2} side={THREE.DoubleSide} toneMapped={false} /></mesh>
        <pointLight position={[0, 0.35, 0]} color="#ffd29a" intensity={2.2} distance={2.5} decay={2} />
      </group>
      {/* card terminal */}
      <RoundedBox args={[0.09, 0.03, 0.16]} radius={0.01} position={[-0.12, 1.025, 0.05]} rotation={[0, 0.3, 0]}><meshStandardMaterial color="#202020" roughness={0.3} /></RoundedBox>
      {/* vase with dried pampas */}
      <group position={[0.05, 1.01, -0.5]}>
        <mesh position={[0, 0.13, 0]}><cylinderGeometry args={[0.06, 0.09, 0.26, 20]} /><meshPhysicalMaterial color="#e9e1d3" roughness={0.3} clearcoat={0.8} /></mesh>
        {pampas.map((p, i) => (
          <group key={i} position={[0, 0.25, 0]} rotation={[p.r * 0.5, 0, p.t * 0.5]}>
            <mesh position={[0, p.h / 2, 0]}><cylinderGeometry args={[0.003, 0.003, p.h, 4]} /><meshStandardMaterial color="#b9a27c" /></mesh>
            <mesh position={[0, p.h + 0.08, 0]}><coneGeometry args={[0.035, 0.24, 6]} /><meshStandardMaterial color="#e8d8b6" roughness={1} /></mesh>
          </group>
        ))}
      </group>
      {/* branded kraft bags */}
      {[0, 1].map(i => (
        <group key={i} position={[-0.38, 0, -0.25 + i * 0.28]} rotation={[0, 0.2 * i, 0]}>
          <mesh position={[0, 0.17, 0]} castShadow><boxGeometry args={[0.12, 0.34, 0.26]} /><meshStandardMaterial color={i ? '#202020' : '#c79f74'} roughness={0.9} /></mesh>
          <mesh position={[0, 0.38, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.06, 0.006, 6, 16, Math.PI]} /><meshStandardMaterial color="#efe6d6" /></mesh>
        </group>
      ))}
    </group>
  );
}

function CentreTable() {
  const top = useMemo(() => marble('#ece6dd'), []);
  const rug = useMemo(rugTex, []);
  const folds = ['#cfa35a', '#efe6d6', '#8c9585', '#d29a8f', '#55708f', '#f4f0e8'];
  return (
    <group position={[0.05, 0, 0.35]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]} receiveShadow><circleGeometry args={[1.3, 64]} /><meshStandardMaterial map={rug} roughness={1} /></mesh>
      <mesh position={[0, 0.76, 0]} castShadow receiveShadow><cylinderGeometry args={[0.52, 0.52, 0.04, 48]} /><meshPhysicalMaterial map={top} roughness={0.15} clearcoat={0.7} /></mesh>
      <mesh position={[0, 0.38, 0]} castShadow><cylinderGeometry args={[0.1, 0.24, 0.74, 24]} /><meshStandardMaterial color="#8a6440" roughness={0.5} /></mesh>
      {[[-0.2, 0.05], [0.12, -0.2], [0.18, 0.2]].map(([x, z], k) => (
        <group key={k} position={[x, 0.78, z]} rotation={[0, k * 0.7, 0]}>
          {Array.from({ length: 3 + (k % 2) }, (_, j) => (
            <RoundedBox key={j} args={[0.3, 0.05, 0.22]} radius={0.02} position={[0, 0.026 + j * 0.05, 0]} castShadow>
              <meshPhysicalMaterial color={folds[(k * 2 + j) % folds.length]} roughness={0.95} sheen={0.8} sheenColor="#ffffff" />
            </RoundedBox>
          ))}
        </group>
      ))}
      <RoundedBox args={[0.26, 0.18, 0.1]} radius={0.03} position={[-0.25, 0.88, -0.28]} rotation={[0, 0.5, 0]} castShadow><meshPhysicalMaterial color="#8b4545" roughness={0.4} clearcoat={0.5} /></RoundedBox>
      <mesh position={[-0.25, 1.0, -0.28]} rotation={[0, 0.5, 0]}><torusGeometry args={[0.07, 0.008, 8, 20, Math.PI]} /><meshStandardMaterial {...BRASS} /></mesh>
    </group>
  );
}

function DressForm({ position, rotY, dress }: { position: [number, number, number]; rotY: number; dress: string }) {
  const torso = useMemo(() => new THREE.LatheGeometry([
    [0.0, 0.0], [0.15, 0.0], [0.17, 0.08], [0.13, 0.28], [0.16, 0.42], [0.17, 0.5], [0.12, 0.58], [0.05, 0.62], [0.0, 0.62]
  ].map(([x, y]) => new THREE.Vector2(x, y)), 32), []);
  const skirt = useMemo(() => new THREE.LatheGeometry([
    [0.165, 0.0], [0.22, -0.25], [0.3, -0.62], [0.31, -0.64]
  ].map(([x, y]) => new THREE.Vector2(x, y)), 40), []);
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.9, 0]}><cylinderGeometry args={[0.012, 0.012, 0.6, 8]} /><meshStandardMaterial {...BRASS} /></mesh>
      {[0, 2.1, 4.2].map(a => <mesh key={a} position={[Math.cos(a) * 0.12, 0.25, Math.sin(a) * 0.12]} rotation={[Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5]}><cylinderGeometry args={[0.015, 0.015, 0.6, 6]} /><meshStandardMaterial color="#5a3f28" /></mesh>)}
      <mesh geometry={torso} position={[0, 1.08, 0]} castShadow><meshPhysicalMaterial color={dress} roughness={0.6} sheen={0.8} sheenColor="#ffe3dc" /></mesh>
      <mesh geometry={skirt} position={[0, 1.14, 0]} castShadow><meshPhysicalMaterial color={dress} roughness={0.6} sheen={0.8} sheenColor="#ffe3dc" side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 1.74, 0]}><sphereGeometry args={[0.035, 16, 12]} /><meshStandardMaterial color="#e9dcc7" /></mesh>
    </group>
  );
}

function OliveTree({ position }: { position: [number, number, number] }) {
  const clusters = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    p: [(rnd(i) - 0.5) * 0.62, 1.3 + rnd(i * 2) * 0.7, (rnd(i * 3) - 0.5) * 0.62] as [number, number, number],
    s: 0.6 + rnd(i * 4) * 0.5, geo: foliageGeometry(0.2, i * 1.7)
  })), []);
  const tex = useMemo(() => leafTex('#7c8a68', '#b4bda0'), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, color: '#dfe6d2', roughness: 0.8 }), [tex]);
  return (
    <group position={position}>
      <mesh position={[0, 0.24, 0]} castShadow><cylinderGeometry args={[0.24, 0.19, 0.48, 32]} /><meshPhysicalMaterial color="#d9cdb8" roughness={0.6} clearcoat={0.3} /></mesh>
      <mesh position={[0, 0.47, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.22, 24]} /><meshStandardMaterial color="#4a3a2c" roughness={1} /></mesh>
      {[[0.08, 0.06], [-0.1, -0.05]].map(([a, b], i) => (
        <mesh key={i} position={[a * 0.6, 0.95, b * 0.6]} rotation={[b, 0, a]}><cylinderGeometry args={[0.025, 0.045, 1.05, 8]} /><meshStandardMaterial color="#6a5847" roughness={0.9} /></mesh>
      ))}
      {clusters.map((c, i) => <mesh key={i} geometry={c.geo} material={mat} position={c.p} scale={c.s} castShadow />)}
    </group>
  );
}

function Armchair() {
  const velvet = { color: '#5f6b56', roughness: 0.9, sheen: 1, sheenColor: '#d0dcc4', sheenRoughness: 0.4 };
  return (
    <group position={[-1.85, 0, 1.45]} rotation={[0, 2.4, 0]}>
      <RoundedBox args={[0.72, 0.2, 0.66]} radius={0.08} position={[0, 0.4, 0]} castShadow><meshPhysicalMaterial {...velvet} /></RoundedBox>
      <RoundedBox args={[0.72, 0.62, 0.18]} radius={0.08} position={[0, 0.72, -0.26]} rotation={[-0.12, 0, 0]} castShadow><meshPhysicalMaterial {...velvet} /></RoundedBox>
      {[-1, 1].map(s => <RoundedBox key={s} args={[0.14, 0.3, 0.62]} radius={0.06} position={[s * 0.33, 0.6, 0]} castShadow><meshPhysicalMaterial {...velvet} /></RoundedBox>)}
      {[[-0.3, -0.26], [0.3, -0.26], [-0.3, 0.26], [0.3, 0.26]].map(([x, z], i) => <mesh key={i} position={[x, 0.15, z]}><cylinderGeometry args={[0.018, 0.012, 0.3, 8]} /><meshStandardMaterial {...BRASS} /></mesh>)}
    </group>
  );
}

function Pendant({ x, z, drop = 0.8 }: { x: number; z: number; drop?: number }) {
  return (
    <group position={[x, H, z]}>
      <mesh position={[0, -drop / 2, 0]}><cylinderGeometry args={[0.004, 0.004, drop, 5]} /><meshStandardMaterial color="#2a2522" /></mesh>
      <mesh position={[0, -drop - 0.02, 0]}><cylinderGeometry args={[0.05, 0.05, 0.06, 16]} /><meshStandardMaterial {...BRASS} /></mesh>
      <mesh position={[0, -drop - 0.17, 0]}><sphereGeometry args={[0.15, 32, 20]} /><meshStandardMaterial color="#fff6e6" emissive="#ffd9a6" emissiveIntensity={1.7} toneMapped={false} /></mesh>
      <pointLight position={[0, -drop - 0.17, 0]} color="#ffdcb0" intensity={3.6} distance={6} decay={1.8} />
    </group>
  );
}

function Sconce({ position, rotY }: { position: [number, number, number]; rotY: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0, 0.02]}><cylinderGeometry args={[0.04, 0.04, 0.02, 16]} /><meshStandardMaterial {...BRASS} /></mesh>
      <mesh position={[0, 0.05, 0.1]}><cylinderGeometry args={[0.05, 0.035, 0.12, 16, 1, true]} /><meshStandardMaterial color="#fff2dc" emissive="#ffd7a0" emissiveIntensity={2.4} toneMapped={false} side={THREE.DoubleSide} /></mesh>
    </group>
  );
}

function WindowDisplays() {
  return (
    <group>
      <DressForm position={[-1.55, 0, Z1 - 0.45]} rotY={0.35} dress="#8b4545" />
      {/* plinth with books and a bag */}
      <mesh position={[-0.98, 0.18, Z1 - 0.4]} castShadow><boxGeometry args={[0.42, 0.36, 0.42]} /><meshStandardMaterial color="#efe6d6" roughness={0.8} /></mesh>
      {['#202020', '#8c9585', '#d29a8f'].map((c, i) => <mesh key={c} position={[-0.98, 0.39 + i * 0.035, Z1 - 0.4]} rotation={[0, i * 0.3, 0]}><boxGeometry args={[0.24, 0.034, 0.17]} /><meshStandardMaterial color={c} roughness={0.8} /></mesh>)}
      <RoundedBox args={[0.24, 0.17, 0.09]} radius={0.03} position={[-0.98, 0.57, Z1 - 0.4]} rotation={[0, -0.4, 0]} castShadow><meshPhysicalMaterial color="#c79f74" roughness={0.45} clearcoat={0.4} /></RoundedBox>
      <OliveTree position={[1.25, 0, Z1 - 0.55]} />
    </group>
  );
}

/* ========================================================= environment */
function StudioEnvironment({ intensity }: { intensity: number }) {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => { scene.environment = null; env.dispose(); pmrem.dispose(); };
  }, [gl, scene]);
  useEffect(() => { (scene as THREE.Scene & { environmentIntensity: number }).environmentIntensity = intensity; }, [scene, intensity]);
  return null;
}

function Boutique({ beat }: { beat: number }) {
  const floor = useMemo(herringbone, []);
  const plasterMap = useMemo(plaster, []);
  const cutaway = beat === 5;
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[W, D]} /><meshPhysicalMaterial map={floor} roughness={0.5} clearcoat={0.35} clearcoatRoughness={0.35} /></mesh>
      {!cutaway && <mesh position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[W, D]} /><meshStandardMaterial color="#f6f0e6" roughness={1} /></mesh>}
      <Walls plasterMap={plasterMap} />
      <Shopfront cutaway={cutaway} />
      <Door open={beat >= 1} />
      <Street />
      <Sky />
      <LeftRail />
      <BackWall />
      <FittingRoom />
      <Counter />
      <CentreTable />
      <Armchair />
      <WindowDisplays />
      <Pendant x={-1.0} z={-0.5} drop={0.6} /><Pendant x={0.05} z={0.35} drop={0.7} /><Pendant x={1.05} z={-0.4} drop={0.6} />
      <Sconce position={[X0 + 0.01, 2.35, 1.4]} rotY={Math.PI / 2} /><Sconce position={[X1 - 0.01, 2.35, -0.3]} rotY={-Math.PI / 2} />
      <Sconce position={[-1.1, 2.35, Z0 + 0.01]} rotY={0} /><Sconce position={[1.1, 2.35, Z0 + 0.01]} rotY={0} />
    </>
  );
}

/* ========================================================== camera rig */
type Pose = { p: [number, number, number]; t: [number, number, number] };
const POSES: Pose[] = [
  { p: [-0.9, 1.75, 11.8], t: [0.45, 2.2, Z1] },        // the street, dusk
  { p: [0.25, 1.55, 5.1], t: [0, 1.45, Z1] },            // the window
  { p: [1.3, 1.75, 0.25], t: [-2.2, 1.3, -0.6] },       // the rails
  { p: [0.75, 1.65, 1.15], t: [2.0, 1.1, -1.8] },        // the fitting room
  { p: [0.55, 1.75, -1.45], t: [2.2, 0.95, 0.8] },       // the counter
  { p: [1.4, 8.2, 7.4], t: [0, 0.3, -0.55] }             // cut-away overview (roof and upper façade lifted)
];
// Waypoints used when entering beat n (reversed when leaving it backwards) so the camera passes through the door.
const VIA: Record<number, Pose[]> = {
  2: [{ p: [0.12, 1.55, 3.4], t: [0, 1.4, 1.0] }, { p: [0.15, 1.6, 1.6], t: [-0.8, 1.3, -0.5] }, { p: [0.9, 1.68, 0.6], t: [-1.6, 1.25, -0.6] }],
  5: [{ p: [0.0, 1.62, 1.2], t: [0, 1.4, 4.0] }, { p: [0.05, 1.7, 3.3], t: [0, 1.5, 6.0] }, { p: [0.9, 4.2, 7.0], t: [0, 0.8, 0.0] }]
};

function CameraRig({ beat, onSettled }: { beat: number; onSettled: (done: boolean) => void }) {
  const { camera } = useThree();
  const state = useRef<{ pos: THREE.CatmullRomCurve3; tgt: THREE.CatmullRomCurve3; t: number; dur: number; prevBeat: number } | null>(null);
  const cur = useRef({ p: new THREE.Vector3(...POSES[0].p), t: new THREE.Vector3(...POSES[0].t) });
  const first = useRef(true);
  const look = useRef(new THREE.Vector3());

  useEffect(() => {
    const prev = state.current?.prevBeat ?? 0;
    if (first.current) {
      first.current = false;
      const v = (a: [number, number, number]) => new THREE.Vector3(...a);
      cur.current = { p: v(POSES[beat].p), t: v(POSES[beat].t) };
      camera.position.copy(cur.current.p); camera.lookAt(cur.current.t);
      state.current = { pos: new THREE.CatmullRomCurve3([cur.current.p.clone(), cur.current.p.clone()]), tgt: new THREE.CatmullRomCurve3([cur.current.t.clone(), cur.current.t.clone()]), t: 1, dur: 1, prevBeat: beat };
      onSettled(true);
      return;
    }
    const vias = beat > prev ? (VIA[beat] ?? []) : (VIA[prev] ?? []).slice().reverse();
    const pts = [{ p: cur.current.p.toArray() as [number, number, number], t: cur.current.t.toArray() as [number, number, number] }, ...vias, POSES[beat]];
    const v = (a: [number, number, number]) => new THREE.Vector3(...a);
    state.current = {
      pos: new THREE.CatmullRomCurve3(pts.map(x => v(x.p)), false, 'centripetal'),
      tgt: new THREE.CatmullRomCurve3(pts.map(x => v(x.t)), false, 'centripetal'),
      t: 0, dur: Math.abs(beat - prev) > 1 ? 4.4 : 3.4 + vias.length * 0.7, prevBeat: beat
    };
    onSettled(false);
  }, [beat, camera, onSettled]);

  useFrame((st, dt) => {
    // architectural wide angle inside the small shop, a longer lens in the street
    const cam = camera as THREE.PerspectiveCamera;
    const fov = beat >= 2 && beat <= 4 ? 55 : 40;
    if (Math.abs(cam.fov - fov) > 0.05) { cam.fov += (fov - cam.fov) * Math.min(1, dt * 1.6); cam.updateProjectionMatrix(); }
    const s = state.current; if (!s) return;
    if (s.t < 1) {
      s.t = Math.min(1, s.t + dt / s.dur); // real time: on a slow machine the move stays on schedule (fewer frames, same duration)
      const e = s.t * s.t * (3 - 2 * s.t);
      s.pos.getPoint(e, cur.current.p); s.tgt.getPoint(e, cur.current.t);
      if (s.t >= 1) onSettled(true);
    } else if (s.prevBeat === 5) return; // orbit controls take over in the overview
    // a slow "breathing" drift keeps every stop alive, like a handheld cinematic shot
    const tt = st.clock.elapsedTime, amp = s.t >= 1 ? 1 : 0;
    camera.position.set(cur.current.p.x + Math.sin(tt * 0.31) * 0.045 * amp, cur.current.p.y + Math.sin(tt * 0.23) * 0.018 * amp, cur.current.p.z + Math.cos(tt * 0.27) * 0.04 * amp);
    look.current.copy(cur.current.t); camera.lookAt(look.current);
  });
  return null;
}

function Ticker() { useFrame((_, dt) => { timeU.value += Math.min(dt, 0.1); }); return null; }

/* ============================================================ the layer */
// `?q=0|1|2` in the URL pins the quality level (used by scripts/qa.mjs, whose software renderer is too slow for auto mode).
const PINNED = (() => { const q = new URLSearchParams(window.location.search).get('q'); return q === '0' || q === '1' || q === '2' ? Number(q) : null; })();
/** quality 2: AO + bloom + soft shadows · 1: bloom + shadows · 0: plain render. Steps down when frames drop. */
export default function Boutique3D({ active, beat, onFail }: { active: boolean; beat: number; onFail: () => void }) {
  const [settled, setSettled] = useState(false);
  const [quality, setQuality] = useState(PINNED ?? 2);
  const free = beat === 5 && settled;
  const outside = beat === 0 || beat === 1 || beat === 5;
  return (
    <Canvas shadows={quality > 0 ? 'soft' : false} dpr={quality === 2 ? [1, 1.5] : quality === 1 ? [1, 1.25] : 1} frameloop={active ? 'always' : 'never'}
      // the stage is scaled with a CSS transform: measure layout size (offsetWidth), not the transformed bounding box
      resize={{ offsetSize: true }}
      camera={{ position: POSES[0].p, fov: 40, near: 0.05, far: 160 }} gl={{ antialias: quality === 0, powerPreference: 'high-performance', stencil: false }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05;
        scene.fog = new THREE.Fog('#2c2a35', 22, 60);
        (window as unknown as { __pepiteGL?: THREE.WebGLRenderer }).__pepiteGL = gl; // read by scripts/qa.mjs for draw-call stats
        gl.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); onFail(); }, { once: true });
      }}>
      {PINNED === null && <PerformanceMonitor onDecline={() => setQuality(q => Math.max(0, q - 1))} flipflops={3} onFallback={() => setQuality(0)} />}
      <StudioEnvironment intensity={outside ? 0.22 : 0.4} />
      <hemisphereLight args={['#ffe9cf', '#5a4636', 0.35]} />
      <directionalLight position={[1.5, 7, 2.5]} intensity={0.9} color="#ffe6c8" castShadow={quality > 0}
        shadow-mapSize={quality === 2 ? [2048, 2048] : [1024, 1024]} shadow-camera-left={-3.4} shadow-camera-right={3.4}
        shadow-camera-top={3.4} shadow-camera-bottom={-3.4} shadow-bias={-0.0003} shadow-normalBias={0.02} />
      <pointLight position={[0, 2.2, 1.9]} color="#ffd2a0" intensity={4} distance={5} decay={1.8} />
      <Boutique beat={beat} />
      <Ticker />
      <CameraRig beat={beat} onSettled={setSettled} />
      {free && <OrbitControls makeDefault enablePan={false} target={[0, 0.9, -0.2]} minDistance={3} maxDistance={13} maxPolarAngle={Math.PI / 2.05} enableDamping />}
      {quality === 2 && (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <N8AO halfRes aoRadius={0.55} distanceFalloff={0.6} intensity={2.4} quality="performance" />
          <Bloom mipmapBlur luminanceThreshold={1.0} luminanceSmoothing={0.2} intensity={0.6} radius={0.65} />
          <Vignette offset={0.28} darkness={0.55} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <SMAA />
        </EffectComposer>
      )}
      {quality === 1 && (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <Bloom mipmapBlur luminanceThreshold={1.0} luminanceSmoothing={0.2} intensity={0.6} radius={0.65} />
          <Vignette offset={0.28} darkness={0.55} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <SMAA />
        </EffectComposer>
      )}
    </Canvas>
  );
}

/** True when the browser can create a WebGL context at all. */
export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}
