import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerformanceMonitor, RoundedBox } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { PALETTE, type GarmentKind } from './Garments';

/* Everything here is procedural: no GLB, no HDRI, no remote font, so it works offline.
   The boutique is a stylised concept, NOT the real premises. */

const timeU = { value: 0 };

/* ------------------------------------------------------------ textures */
const GARMENT_PATHS: Record<GarmentKind, string> = {
  dress: 'M38 44 L50 54 L62 44 L66 72 L58 78 L80 148 Q50 158 20 148 L42 78 L34 72 Z',
  shirt: 'M36 44 L50 52 L64 44 L90 68 L80 84 L70 74 L70 132 H30 L30 74 L20 84 L10 68 Z',
  coat: 'M34 44 L50 58 L66 44 L92 72 L84 130 L72 120 L74 154 H26 L28 120 L16 130 L8 72 Z',
  trousers: 'M30 46 H70 L76 152 H56 L50 88 L44 152 H24 Z',
  skirt: 'M34 46 H66 L86 142 H14 Z'
};
const garmentTex = new Map<GarmentKind, THREE.CanvasTexture>();
function getGarmentTexture(kind: GarmentKind) {
  let t = garmentTex.get(kind);
  if (t) return t;
  const c = document.createElement('canvas'); c.width = 320; c.height = 512;
  const g = c.getContext('2d')!;
  g.scale(3.2, 3.2);
  const p = new Path2D(GARMENT_PATHS[kind]);
  g.fillStyle = '#ffffff'; g.fill(p);
  g.strokeStyle = 'rgba(60,50,40,.35)'; g.lineWidth = 1.3; g.lineJoin = 'round'; g.stroke(p);
  g.beginPath(); g.moveTo(50, 50); g.lineTo(50, 140); g.stroke();
  t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  garmentTex.set(kind, t);
  return t;
}

function makeTextTexture(lines: { text: string; size: number; color: string; y: number; spacing?: number; weight?: number }[], w: number, h: number, bg?: string) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const l of lines) {
    g.font = `${l.weight ?? 600} ${l.size}px "Cormorant Garamond", Georgia, serif`;
    g.fillStyle = l.color;
    (g as unknown as { letterSpacing: string }).letterSpacing = `${l.spacing ?? 0}px`;
    g.fillText(l.text, w / 2, l.y);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

function useTextTexture(lines: Parameters<typeof makeTextTexture>[0], w: number, h: number, bg?: string) {
  const [tex, setTex] = useState<THREE.CanvasTexture | null>(null);
  useEffect(() => {
    let alive = true;
    const draw = () => { if (alive) setTex(makeTextTexture(lines, w, h, bg)); };
    // the Cormorant face is bundled as a web font: wait for it so the sign is not drawn in a fallback
    const f = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (f) f.load('600 80px "Cormorant Garamond"').then(draw, draw); else draw();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return tex;
}

function usePlankTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024;
    const g = c.getContext('2d')!;
    const n = 10, pw = 1024 / n;
    for (let i = 0; i < n; i++) {
      const shade = 150 + ((i * 37) % 28);
      g.fillStyle = `rgb(${shade + 38},${shade + 8},${shade - 28})`;
      g.fillRect(i * pw, 0, pw, 1024);
      for (let k = 0; k < 34; k++) {
        g.fillStyle = `rgba(90,60,35,${0.03 + ((k * 13 + i) % 7) * 0.006})`;
        g.fillRect(i * pw + ((k * 53) % pw), ((k * 211 + i * 97) % 1024), 2, 40 + ((k * 31) % 120));
      }
      g.fillStyle = 'rgba(60,40,25,.45)'; g.fillRect(i * pw, 0, 2.5, 1024);
      const cut = (i * 311) % 800 + 100; g.fillRect(i * pw, cut, pw, 2);
    }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1.5, 1.25);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  }, []);
}

/* ------------------------------------------------------------ materials */
const clothCache = new Map<string, THREE.MeshStandardMaterial>();
function clothMaterial(kind: GarmentKind, color: string) {
  const key = `${kind}-${color}`;
  let m = clothCache.get(key);
  if (m) return m;
  m = new THREE.MeshStandardMaterial({ map: getGarmentTexture(kind), color, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.92, metalness: 0 });
  m.onBeforeCompile = shader => {
    shader.uniforms.uTime = timeU;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float k = clamp((0.5 - position.y) / 1.0, 0.0, 1.0);
        float ph = modelMatrix[3].x * 1.7 + modelMatrix[3].z * 2.3;
        transformed.z += sin(uTime * 1.5 + ph + position.y * 4.0) * 0.04 * k * k;
        transformed.x += sin(uTime * 1.0 + ph * 0.7) * 0.012 * k;`);
  };
  clothCache.set(key, m);
  return m;
}
const garmentGeo = new THREE.PlaneGeometry(0.46, 1.0, 8, 14);

function Hanger() {
  return (
    <group>
      <mesh position={[0, 0.045, 0]}><torusGeometry args={[0.025, 0.004, 6, 14, Math.PI * 1.5]} /><meshStandardMaterial color="#8d8174" metalness={0.6} roughness={0.4} /></mesh>
      {[-1, 1].map(s => (
        <mesh key={s} position={[s * 0.115, -0.045, 0]} rotation={[0, 0, s * -0.42]}>
          <boxGeometry args={[0.26, 0.007, 0.007]} /><meshStandardMaterial color="#8d8174" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function Hung({ kind, color, x, y = 0, z = 0, rotY = 0, scale = 1 }: { kind: GarmentKind; color: string; x: number; y?: number; z?: number; rotY?: number; scale?: number }) {
  const ref = useRef<THREE.Group>(null);
  const phase = x * 3.1 + z;
  useFrame(() => { if (ref.current) ref.current.rotation.z = Math.sin(timeU.value * 0.9 + phase) * 0.018; });
  return (
    <group position={[x, y, z]} rotation={[0, rotY, 0]} scale={scale}>
      <group ref={ref}>
        <Hanger />
        <mesh geometry={garmentGeo} material={clothMaterial(kind, color)} position={[0, -0.305, 0]} />
      </group>
    </group>
  );
}

const KINDS: GarmentKind[] = ['dress', 'shirt', 'coat', 'skirt', 'trousers', 'shirt', 'dress', 'coat', 'skirt', 'trousers'];
function RailGroup({ position, count, width }: { position: [number, number, number]; count: number; width: number }) {
  const step = width / count;
  return (
    <group position={position}>
      <mesh position={[0, 1.62, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.018, 0.018, width + 0.2, 10]} /><meshStandardMaterial color="#b7a793" metalness={0.8} roughness={0.28} /></mesh>
      {[-1, 1].map(s => (
        <mesh key={s} position={[s * (width / 2 + 0.1), 0.81, 0]} castShadow><cylinderGeometry args={[0.02, 0.02, 1.62, 10]} /><meshStandardMaterial color="#b7a793" metalness={0.8} roughness={0.28} /></mesh>
      ))}
      {[-1, 1].map(s => (
        <mesh key={'f' + s} position={[s * (width / 2 + 0.1), 0.012, 0]}><boxGeometry args={[0.05, 0.024, 0.5]} /><meshStandardMaterial color="#6b6259" /></mesh>
      ))}
      {Array.from({ length: count }, (_, i) => (
        <Hung key={i} kind={KINDS[i % KINDS.length]} color={PALETTE[(i * 3 + count) % PALETTE.length]} x={-width / 2 + step * (i + 0.5)} y={1.64} rotY={0.85 + (i % 2) * 0.1} />
      ))}
    </group>
  );
}

/* ---------------------------------------------------------------- props */
const M = (c: string, r = 0.85, m = 0) => <meshStandardMaterial color={c} roughness={r} metalness={m} />;

function Shelf() {
  return (
    <group position={[-2.88, 0, -0.2]}>
      <mesh position={[0, 1.2, 0]}><boxGeometry args={[0.04, 2.4, 2.6]} />{M('#9a7f68')}</mesh>
      {[0.55, 1.1, 1.65].map((y, i) => (
        <group key={y}>
          <mesh position={[0.17, y, 0]} castShadow><boxGeometry args={[0.36, 0.04, 2.5]} />{M('#b79b83')}</mesh>
          {Array.from({ length: 4 }, (_, k) => (
            i === 1 ? (
              <RoundedBox key={k} args={[0.26, 0.2, 0.34]} radius={0.04} position={[0.2, y + 0.12, -0.9 + k * 0.62]}>{M(PALETTE[(k + 1) % 5], 0.7)}</RoundedBox>
            ) : (
              <group key={k} position={[0.22, y + 0.03, -0.95 + k * 0.62]} rotation={[0, 0.3, 0]}>
                <mesh position={[0, 0.045, 0]}><boxGeometry args={[0.26, 0.09, 0.1]} />{M(PALETTE[(k * 2 + i) % 5], 0.6)}</mesh>
                <mesh position={[0.1, 0.012, 0.13]}><boxGeometry args={[0.07, 0.024, 0.1]} />{M('#3a312b')}</mesh>
              </group>
            )
          ))}
        </group>
      ))}
    </group>
  );
}

function Table() {
  const colors = ['#d29a8f', '#cfc3b3', '#8c9585', '#b7a793', '#f4f0e8'];
  return (
    <group position={[-1.6, 0, 1.0]}>
      <mesh position={[0, 0.74, 0]} castShadow><cylinderGeometry args={[0.62, 0.62, 0.05, 28]} />{M('#a98569')}</mesh>
      <mesh position={[0, 0.37, 0]}><cylinderGeometry args={[0.06, 0.1, 0.74, 14]} />{M('#6b6259', 0.5, 0.5)}</mesh>
      {Array.from({ length: 3 }, (_, k) => (
        <group key={k} position={[-0.25 + k * 0.27, 0.77, (k % 2) * 0.18 - 0.08]} rotation={[0, k * 0.5, 0]}>
          {Array.from({ length: 3 + (k % 2) }, (_, j) => (
            <RoundedBox key={j} args={[0.3, 0.05, 0.24]} radius={0.015} position={[0, 0.03 + j * 0.052, 0]}>{M(colors[(k + j) % colors.length], 0.95)}</RoundedBox>
          ))}
        </group>
      ))}
    </group>
  );
}

function Counter() {
  return (
    <group position={[2.5, 0, 0.5]} rotation={[0, Math.PI / 2, 0]}>
      <RoundedBox args={[1.9, 1.0, 0.62]} radius={0.03} position={[0, 0.5, 0]} castShadow>{M('#8f7a68', 0.7)}</RoundedBox>
      <mesh position={[0, 1.01, 0]}><boxGeometry args={[2.0, 0.045, 0.72]} />{M('#d8cdbd', 0.35, 0.1)}</mesh>
      <RoundedBox args={[0.34, 0.26, 0.26]} radius={0.03} position={[0.45, 1.16, -0.05]}>{M('#2b2623', 0.4)}</RoundedBox>
      <mesh position={[0.45, 1.3, 0.06]} rotation={[-0.5, 0, 0]}><boxGeometry args={[0.3, 0.2, 0.02]} /><meshStandardMaterial color="#1e1e1e" emissive="#6b8c8a" emissiveIntensity={0.6} /></mesh>
      <mesh position={[-0.55, 1.07, 0.1]}><cylinderGeometry args={[0.07, 0.06, 0.12, 14]} />{M('#f4f0e8', 0.5)}</mesh>
      {[0, 1, 2].map(i => <mesh key={i} position={[-0.55, 1.2 + i * 0.07, 0.1]} rotation={[0, 0, (i - 1) * 0.3]}><cylinderGeometry args={[0.012, 0.012, 0.22, 6]} />{M('#8b4545')}</mesh>)}
    </group>
  );
}

function FittingRoom() {
  const curtain = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: '#d29a8f', roughness: 0.95, side: THREE.DoubleSide });
    m.onBeforeCompile = shader => {
      shader.uniforms.uTime = timeU;
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          float k = clamp((1.2 - position.y) / 2.4, 0.0, 1.0);
          transformed.z += sin(position.x * 9.0 + uTime * 1.4) * 0.045 * (0.35 + k);`);
    };
    return m;
  }, []);
  return (
    <group position={[2.2, 0, -1.9]}>
      <mesh position={[0, 0.02, 0]}><boxGeometry args={[1.5, 0.04, 1.2]} />{M('#cdbba9')}</mesh>
      <mesh position={[0, 2.2, 0.55]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.02, 0.02, 1.5, 8]} />{M('#b7a793', 0.3, 0.8)}</mesh>
      <mesh material={curtain} position={[0.12, 1.1, 0.55]}><planeGeometry args={[1.3, 2.2, 22, 18]} /></mesh>
      <RoundedBox args={[0.06, 1.7, 0.7]} radius={0.02} position={[0.7, 1.0, -0.2]} castShadow>{M('#8e705b', 0.5, 0.4)}</RoundedBox>
      <mesh position={[0.665, 1.0, -0.2]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[0.6, 1.55]} /><meshStandardMaterial color="#e9eeee" metalness={0.9} roughness={0.12} emissive="#dfe8e6" emissiveIntensity={0.25} /></mesh>
      <mesh position={[-0.2, 0.12, -0.1]}><cylinderGeometry args={[0.22, 0.22, 0.2, 18]} />{M('#9a8470')}</mesh>
    </group>
  );
}

function Plant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.18, 0.13, 0.4, 14]} />{M('#b7a793')}</mesh>
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[Math.sin(i * 1.1) * 0.12, 0.7 + (i % 3) * 0.12, Math.cos(i * 1.1) * 0.12]} rotation={[Math.sin(i) * 0.5, i, Math.cos(i) * 0.5]}>
          <coneGeometry args={[0.07, 0.62, 6]} />{M('#6f7d66', 0.8)}
        </mesh>
      ))}
    </group>
  );
}

function Pendant({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 2.55, 0]}><cylinderGeometry args={[0.004, 0.004, 0.9, 5]} />{M('#2b2623')}</mesh>
      <mesh position={[0, 2.05, 0]}><sphereGeometry args={[0.16, 18, 14]} /><meshStandardMaterial color="#ffe4bf" emissive="#ffcf94" emissiveIntensity={2.2} /></mesh>
    </group>
  );
}

/* ----------------------------------------------------------------- shell */
function Door({ open }: { open: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    const target = open ? -1.75 : 0;
    ref.current.rotation.y += (target - ref.current.rotation.y) * Math.min(1, dt * 2.4);
  });
  return (
    <group position={[-0.55, 0, 2.5]} ref={ref}>
      <mesh position={[0.55, 1.1, 0]}><boxGeometry args={[1.1, 2.2, 0.05]} /><meshPhysicalMaterial color="#cfe0df" transparent opacity={0.22} roughness={0.05} /></mesh>
      {[[0.03, 1.1, 0.04, 2.2], [1.07, 1.1, 0.04, 2.2], [0.55, 0.03, 1.1, 0.06], [0.55, 2.17, 1.1, 0.06]].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, 0]}><boxGeometry args={[w, h, 0.07]} />{M('#202020', 0.4, 0.3)}</mesh>
      ))}
      <mesh position={[0.95, 1.05, 0.06]}><cylinderGeometry args={[0.012, 0.012, 0.5, 8]} />{M('#b7a793', 0.25, 0.9)}</mesh>
    </group>
  );
}

function Shell() {
  const planks = usePlankTexture();
  const signOut = useTextTexture([{ text: 'PÉPITE', size: 210, color: '#f4f0e8', y: 120, spacing: 22 }, { text: 'PRE-LOVED FASHION · CHANTILLY', size: 46, color: '#b7a793', y: 220, spacing: 9, weight: 500 }], 1536, 300);
  const signIn = useTextTexture([{ text: 'PÉPITE', size: 220, color: '#6b6259', y: 190, spacing: 20 }], 1024, 340);
  const wall = '#efe6da';
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow><planeGeometry args={[6, 5]} /><meshStandardMaterial map={planks} roughness={0.7} /></mesh>
      <mesh position={[0, 1.5, -2.5]} receiveShadow><boxGeometry args={[6.1, 3, 0.12]} />{M(wall, 0.95)}</mesh>
      <mesh position={[-3, 1.5, 0]} receiveShadow><boxGeometry args={[0.12, 3, 5]} />{M('#e8dccd', 0.95)}</mesh>
      <mesh position={[3, 1.5, 0]} receiveShadow><boxGeometry args={[0.12, 3, 5]} />{M('#eadfd2', 0.95)}</mesh>
      <mesh position={[0, 3.0, 0]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[6, 5]} /><meshStandardMaterial color="#f6efe6" roughness={1} /></mesh>
      {/* front wall with a door gap (x -0.55..0.55) and big windows */}
      {[[-1.775, 2.45], [1.775, 2.45]].map(([x, w], i) => (
        <group key={i} position={[x, 0, 2.5]}>
          <mesh position={[0, 0.3, 0]}><boxGeometry args={[w, 0.6, 0.14]} />{M('#2a2622', 0.6)}</mesh>
          <mesh position={[0, 2.78, 0]}><boxGeometry args={[w, 0.45, 0.14]} />{M('#202020', 0.6)}</mesh>
          <mesh position={[0, 1.6, 0]}><boxGeometry args={[w - 0.1, 2.05, 0.02]} /><meshPhysicalMaterial color="#d7e6e4" transparent opacity={0.16} roughness={0.04} /></mesh>
          {[-1, 0, 1].map(k => <mesh key={k} position={[k * (w / 2 - 0.02), 1.6, 0]}><boxGeometry args={[0.05, 2.1, 0.08]} />{M('#202020', 0.4, 0.3)}</mesh>)}
        </group>
      ))}
      <mesh position={[0, 2.78, 2.5]}><boxGeometry args={[1.1, 0.45, 0.14]} />{M('#202020', 0.6)}</mesh>
      {signOut && <mesh position={[0, 2.78, 2.585]}><planeGeometry args={[2.9, 0.58]} /><meshBasicMaterial map={signOut} transparent /></mesh>}
      {signIn && <mesh position={[0, 2.25, -2.42]}><planeGeometry args={[2.4, 0.7]} /><meshBasicMaterial map={signIn} transparent opacity={0.92} /></mesh>}
      {/* street */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 9]} receiveShadow><planeGeometry args={[40, 14]} />{M('#3c3631', 1)}</mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 4.2]}><planeGeometry args={[40, 3.4]} />{M('#756a5f', 0.95)}</mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -9]}><planeGeometry args={[40, 12]} />{M('#2a2622', 1)}</mesh>
    </group>
  );
}

function ShopWithDoor({ doorOpen }: { doorOpen: boolean }) {
  return (
    <>
      <Shell />
      <Door open={doorOpen} />
      <RailGroup position={[-1.2, 0, -0.9]} count={6} width={2.0} />
      <RailGroup position={[0.1, 0, -2.0]} count={4} width={1.3} />
      <Shelf /><Table /><Counter /><FittingRoom />
      <Plant position={[2.55, 0, 2.05]} /><Plant position={[-2.55, 0, 2.05]} />
      <Pendant x={-1.2} z={0.3} /><Pendant x={0.6} z={0.6} /><Pendant x={-1.0} z={-1.6} /><Pendant x={2.0} z={0.5} />
    </>
  );
}

/* ---------------------------------------------------------- camera rig */
type Pose = { p: [number, number, number]; t: [number, number, number] };
const POSES: Pose[] = [
  { p: [0.8, 1.6, 9.8], t: [0, 1.55, 2.5] },
  { p: [0.15, 1.55, 5.0], t: [0, 1.45, 2.5] },
  { p: [0.9, 1.6, 1.9], t: [-1.1, 1.05, -1.0] },
  { p: [-0.9, 1.7, 1.4], t: [2.2, 1.0, -1.7] },
  { p: [-1.1, 1.7, -0.4], t: [2.5, 0.85, 0.6] },
  { p: [6.6, 5.0, 8.8], t: [0, 0.9, -0.2] }
];
// Waypoints inserted when moving forward into beat n (reversed when moving back out of it), to avoid cutting through walls.
const VIA: Record<number, Pose[]> = {
  2: [{ p: [0.1, 1.55, 3.4], t: [0, 1.4, 1.0] }, { p: [0.15, 1.55, 2.1], t: [-0.5, 1.2, -0.5] }],
  5: [{ p: [0.7, 2.0, 3.0], t: [0, 1.3, 0.0] }, { p: [3.2, 2.6, 6.4], t: [0, 1.0, 0.0] }]
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
      camera.position.copy(cur.current.p); camera.lookAt(cur.current.t);
      state.current = { pos: new THREE.CatmullRomCurve3([cur.current.p.clone(), cur.current.p.clone()]), tgt: new THREE.CatmullRomCurve3([cur.current.t.clone(), cur.current.t.clone()]), t: 1, dur: 1, prevBeat: beat };
      if (beat === 0) return;
    }
    const vias = beat > prev ? (VIA[beat] ?? []) : (VIA[prev] ?? []).slice().reverse();
    const end = POSES[beat];
    const pts = [{ p: cur.current.p.toArray() as [number, number, number], t: cur.current.t.toArray() as [number, number, number] }, ...vias, end];
    const v = (a: [number, number, number]) => new THREE.Vector3(...a);
    state.current = {
      pos: new THREE.CatmullRomCurve3(pts.map(x => v(x.p)), false, 'centripetal'),
      tgt: new THREE.CatmullRomCurve3(pts.map(x => v(x.t)), false, 'centripetal'),
      t: 0, dur: Math.abs(beat - prev) > 1 ? 4.2 : 3.4 + vias.length * 0.8, prevBeat: beat
    };
    onSettled(false);
  }, [beat, camera, onSettled]);

  useFrame((_, dt) => {
    const s = state.current; if (!s || s.t >= 1) return;
    s.t = Math.min(1, s.t + dt / s.dur);
    const e = s.t * s.t * (3 - 2 * s.t); // smoothstep
    s.pos.getPoint(e, cur.current.p); s.tgt.getPoint(e, cur.current.t);
    camera.position.copy(cur.current.p); look.current.copy(cur.current.t); camera.lookAt(look.current);
    if (s.t >= 1) onSettled(true);
  });
  return null;
}

function Ticker() { useFrame((_, dt) => { timeU.value += dt; }); return null; }

/* ------------------------------------------------------------ the layer */
export default function Boutique3D({ active, beat, onFail }: { active: boolean; beat: number; onFail: () => void }) {
  const [settled, setSettled] = useState(false);
  const [quality, setQuality] = useState(1);
  const free = beat === 5 && settled;
  return (
    <Canvas shadows={quality > 0.6} dpr={quality > 0.6 ? [1, 1.5] : 1} frameloop={active ? 'always' : 'never'}
      camera={{ position: POSES[0].p, fov: 42, near: 0.1, far: 80 }} gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.15;
        (window as unknown as { __pepiteGL?: THREE.WebGLRenderer }).__pepiteGL = gl; // read by scripts/qa.mjs for draw-call stats
        scene.background = new THREE.Color('#1f1b18'); scene.fog = new THREE.Fog('#1f1b18', 16, 38);
        gl.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); onFail(); }, { once: true });
      }}>
      <PerformanceMonitor onDecline={() => setQuality(q => Math.max(0.3, q - 0.4))} flipflops={3} onFallback={() => setQuality(0.3)} />
      <hemisphereLight args={['#fff1dc', '#6b5846', 0.85]} />
      <directionalLight position={[3, 8, 8]} intensity={1.0} color="#cfd8ff" castShadow={quality > 0.6} shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} shadow-bias={-0.0004} />
      <pointLight position={[-1.2, 2.1, 0.3]} intensity={7} color="#ffe0bd" distance={9} decay={1.6} />
      <pointLight position={[0.6, 2.1, 0.6]} intensity={7} color="#ffe0bd" distance={9} decay={1.6} />
      <pointLight position={[-1.0, 2.1, -1.6]} intensity={6} color="#ffe0bd" distance={7} decay={1.6} />
      <pointLight position={[2.0, 2.1, 0.5]} intensity={4} color="#ffe3c8" distance={5} decay={1.7} />
      <pointLight position={[2.2, 2.3, -1.2]} intensity={3.5} color="#ffd9d0" distance={5} decay={1.8} />
      <Suspense fallback={null}><ShopWithDoor doorOpen={beat >= 1} /></Suspense>
      <Ticker />
      <CameraRig beat={beat} onSettled={setSettled} />
      {free && <OrbitControls makeDefault enablePan={false} target={[0, 0.9, -0.2]} minDistance={3} maxDistance={13} maxPolarAngle={Math.PI / 2.05} enableDamping />}
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
