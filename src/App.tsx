import { ComponentType, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Eye, EyeOff, Gauge, HelpCircle, LayoutGrid, Maximize2, Minimize2, Pause, Play, ChevronLeft, ChevronRight, ScrollText, X } from 'lucide-react';
import { scenes, TOTAL_SECONDS, TOTAL_WORDS, partOf, sceneWords, type SceneKind } from './data/script';
import { Pos, beatSeconds, beatStart, clampPos, mmss, nextPos, nextScene, prevPos, prevScene } from './engine';
import Boutique3D, { webglAvailable } from './components/Boutique3D';
import TourFallback from './components/TourFallback';
import { Rail } from './components/Garments';
import Hero from './scenes/Hero';
import Problem from './scenes/Problem';
import Why from './scenes/Why';
import Personas from './scenes/Personas';
import Solution from './scenes/Solution';
import Tour from './scenes/Tour';
import Competition from './scenes/Competition';
import Model from './scenes/Model';
import Actions from './scenes/Actions';
import Finance from './scenes/Finance';
import Verdicts from './scenes/Verdicts';
import Roadmap from './scenes/Roadmap';
import Sources from './scenes/Sources';

const VIEW: Record<SceneKind, ComponentType<{ beat: number }>> = {
  hero: Hero, problem: Problem, why: Why, personas: Personas, solution: Solution, tour: Tour,
  competition: Competition, model: Model, actions: Actions, finance: Finance, verdicts: Verdicts, roadmap: Roadmap, sources: Sources
};

const SHORTCUTS: [string, string][] = [
  ['→  Space  Enter  PageDown', 'Next beat (next animation / next line of the script)'],
  ['←  Backspace  PageUp', 'Previous beat'],
  ['Shift + →  /  Shift + ←', 'Next / previous scene'],
  ['Home  /  End', 'First scene / annex'],
  ['N', 'Speaker notes: script, cues, sources, hand-over'],
  ['P', 'Rehearsal autoplay at the planned pace'],
  ['T  /  R', 'Pause-resume / reset the 12-minute clock'],
  ['O', 'Scene overview (jump to any scene)'],
  ['H', 'Hide / show the interface'],
  ['L', 'Light mode: no WebGL, floor plan instead of 3D'],
  ['F', 'Fullscreen'],
  ['?', 'This help']
];

function useStageScale() {
  const [k, setK] = useState(1);
  useEffect(() => {
    const f = () => setK(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    f(); window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  return k;
}

/** A rail of garments sweeps across the stage between scenes. */
function Sweep({ trigger }: { trigger: number }) {
  const first = useRef(true);
  const [run, setRun] = useState(0);
  useEffect(() => { if (first.current) { first.current = false; return; } setRun(r => r + 1); }, [trigger]);
  if (!run) return null;
  return (
    <motion.div key={run} className="sweep" initial={{ x: 2100 }} animate={{ x: -2500 }} transition={{ duration: 1.25, ease: [0.65, 0, 0.35, 1] }} aria-hidden="true">
      <div className="sweepRail"><Rail count={5} width={150} /></div>
    </motion.div>
  );
}

export default function App() {
  const scale = useStageScale();
  const [pos, setPos] = useState<Pos>({ s: 0, b: 0 });
  const [notes, setNotes] = useState(false);
  const [hud, setHud] = useState(true);
  const [overview, setOverview] = useState(false);
  const [help, setHelp] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [light, setLight] = useState(() => !webglAvailable());
  const [glFailed, setGlFailed] = useState(false);
  const [full, setFull] = useState(false);
  const [clock, setClock] = useState({ running: false, base: 0, since: 0 });
  const [elapsed, setElapsed] = useState(0);
  const [controlsOn, setControlsOn] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<number>();

  const scene = scenes[pos.s];
  const View = VIEW[scene.id];
  const isTour = scene.id === 'tour';
  const use3D = !light && !glFailed;

  /* ---------------------------------------------------------- clock */
  const startClock = useCallback(() => setClock(c => (c.running ? c : { running: true, base: c.base, since: performance.now() })), []);
  useEffect(() => {
    if (!clock.running) { setElapsed(clock.base); return; }
    const tick = () => setElapsed(clock.base + (performance.now() - clock.since) / 1000);
    tick(); const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [clock]);
  const toggleClock = () => setClock(c => (c.running ? { running: false, base: c.base + (performance.now() - c.since) / 1000, since: 0 } : { running: true, base: c.base, since: performance.now() }));
  const resetClock = () => setClock({ running: false, base: 0, since: 0 });

  /* ----------------------------------------------------- navigation */
  const go = useCallback((fn: (p: Pos) => Pos, startsClock = false) => {
    setPos(p => clampPos(fn(p)));
    if (startsClock) startClock();
  }, [startClock]);

  const toggleFull = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void rootRef.current?.requestFullscreen?.();
  }, []);
  useEffect(() => {
    const sync = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key;
      const shift = e.shiftKey;
      if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(k)) { e.preventDefault(); go(shift && k === 'ArrowRight' ? nextScene : nextPos, true); return; }
      if (['ArrowLeft', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); go(shift && k === 'ArrowLeft' ? prevScene : prevPos); return; }
      if (k === 'Home') { e.preventDefault(); setPos({ s: 0, b: 0 }); return; }
      if (k === 'End') { e.preventDefault(); setPos({ s: scenes.length - 1, b: 0 }); return; }
      if (k === 'Escape') { setOverview(false); setHelp(false); return; }
      if (k === '?' || k === '/') { setHelp(v => !v); return; }
      switch (k.toLowerCase()) {
        case 'n': setNotes(v => !v); break;
        case 'p': setPlaying(v => !v); break;
        case 't': toggleClock(); break;
        case 'r': resetClock(); break;
        case 'o': setOverview(v => !v); break;
        case 'h': setHud(v => !v); break;
        case 'l': setLight(v => !v); break;
        case 'f': toggleFull(); break;
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [go, toggleFull]);

  /* --------------------------------- autoplay at the planned pace */
  useEffect(() => {
    if (!playing) return;
    startClock();
    const last = pos.s === scenes.length - 1 || (pos.s === scenes.length - 2 && pos.b === scene.beats.length - 1);
    if (last) { setPlaying(false); return; }
    const id = window.setTimeout(() => setPos(p => nextPos(p)), Math.max(1500, beatSeconds(pos.s, pos.b) * 1000));
    return () => window.clearTimeout(id);
  }, [playing, pos, scene.beats.length, startClock]);

  /* ----------------------------------------- auto-hiding controls */
  const wake = useCallback(() => {
    setControlsOn(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setControlsOn(false), 3200);
  }, []);
  useEffect(() => { wake(); return () => window.clearTimeout(hideTimer.current); }, [wake]);

  /* ------------------------------------------------------- derived */
  const planned = beatStart(pos.s, pos.b);
  const diff = elapsed - planned;
  const progress = Math.min(1, (scene.duration ? planned + beatSeconds(pos.s, pos.b) : TOTAL_SECONDS) / TOTAL_SECONDS);
  const words = useMemo(() => sceneWords(scene), [scene]);
  const line = scene.beats[pos.b];
  const lastBeat = pos.b === scene.beats.length - 1;
  const total = scenes.length;

  return (
    <div className="shell" ref={rootRef} onMouseMove={wake} onTouchStart={wake}>
      <div className="stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }} role="application" aria-label="PÉPITE immersive pitch">
        {/* persistent 3D layer: stays mounted so entering the tour never stalls */}
        <div className={`tourLayer ${isTour ? 'on' : ''}`} aria-hidden={!isTour}>
          {use3D ? <Boutique3D active={isTour} beat={isTour ? pos.b : 0} onFail={() => setGlFailed(true)} />
            : <TourFallback beat={isTour ? pos.b : 0} />}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.section key={scene.id} className={`scene scene-${scene.id}`} initial={{ opacity: 0, filter: 'blur(8px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(8px)' }} transition={{ duration: 0.45 }}>
            <View beat={pos.b} />
          </motion.section>
        </AnimatePresence>
        <Sweep trigger={pos.s} />

        {hud && (
          <>
            <div className={`topbar ${scene.id === 'roadmap' && pos.b >= 1 ? 'light' : ''} ${scene.id === 'hero' || (scene.id === 'roadmap' && pos.b >= 1) ? 'hide' : ''}`}>
              <span className="brand">PÉPITE</span>
              <span className="where">{scene.id === 'sources' ? 'ANNEX' : `${String(pos.s + 1).padStart(2, '0')} / ${String(total - 1).padStart(2, '0')}`}</span>
            </div>
            <div className={`footbar ${scene.id === 'hero' || (scene.id === 'roadmap' && pos.b >= 1) ? 'light' : ''}`}>
              <span className="srcNote">Source: {scene.sources.slice(0, 2).join(' · ')}</span>
              <div className="progress"><div style={{ width: `${progress * 100}%` }} />
                {scenes.filter(s => s.duration).map((s, i, a) => <i key={s.id} style={{ left: `${(a.slice(0, i).reduce((x, y) => x + y.duration, 0) / TOTAL_SECONDS) * 100}%` }} />)}
              </div>
              <span className="clockNote">{mmss(elapsed)} / {mmss(TOTAL_SECONDS)}</span>
            </div>
          </>
        )}

        {notes && (
          <aside className="notes" aria-label="Speaker notes">
            <div className="notesHead">
              <b>{scene.title}</b>
              <span>Beat {pos.b + 1}/{scene.beats.length} · planned {mmss(planned)} · scene {mmss(scene.duration)} · {words} words{scene.duration ? ` · ${(words / scene.duration * 60).toFixed(0)} wpm` : ''}</span>
            </div>
            <ol className="notesLines">
              {scene.beats.map((b, i) => <li key={i} className={i === pos.b ? 'cur' : i < pos.b ? 'past' : ''}>{b.say}</li>)}
            </ol>
            <p className="notesCue">▸ Animation: {line.cue}</p>
            {scene.duration > 0 && lastBeat && scene.handover && <p className="notesHand">⟶ Hand over to the next presenter after this line.</p>}
            <p className="notesSrc">Sources: {scene.sources.join(' · ')}</p>
          </aside>
        )}

        {overview && (
          <div className="overlay" onClick={() => setOverview(false)}>
            <div className="overviewPanel" onClick={e => e.stopPropagation()}>
              <button className="closeX" onClick={() => setOverview(false)} aria-label="Close overview"><X /></button>
              <h3>Scenes · {mmss(TOTAL_SECONDS)} · {TOTAL_WORDS} words</h3>
              <ol>
                {scenes.map((s, i) => (
                  <li key={s.id}><button className={i === pos.s ? 'cur' : ''} onClick={() => { setPos({ s: i, b: 0 }); setOverview(false); }}>
                    <span className="n">{String(i + 1).padStart(2, '0')}</span><span className="t">{s.title}</span>
                    <span className="d">{s.duration ? mmss(s.duration) : 'annex'} · part {partOf(i)}</span></button></li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {help && (
          <div className="overlay" onClick={() => setHelp(false)}>
            <div className="overviewPanel" onClick={e => e.stopPropagation()}>
              <button className="closeX" onClick={() => setHelp(false)} aria-label="Close help"><X /></button>
              <h3>Keyboard</h3>
              <dl className="keys">{SHORTCUTS.map(([k, d]) => <div key={k}><dt>{k}</dt><dd>{d}</dd></div>)}</dl>
            </div>
          </div>
        )}

        {hud && (
          <nav className={`controls ${controlsOn ? 'on' : ''}`} aria-label="Presentation controls">
            <button onClick={() => go(prevPos)} aria-label="Previous beat" title="Previous (←)"><ChevronLeft /></button>
            <button onClick={() => setPlaying(v => !v)} aria-label={playing ? 'Pause rehearsal autoplay' : 'Start rehearsal autoplay'} title="Autoplay (P)">{playing ? <Pause /> : <Play />}</button>
            <button onClick={() => go(nextPos, true)} aria-label="Next beat" title="Next (→)"><ChevronRight /></button>
            <span className="sep" />
            <button className={clock.running ? 'active' : ''} onClick={toggleClock} aria-label="Start or pause the clock" title="Clock (T)"><Clock /></button>
            <span className={`pace ${diff > 20 ? 'late' : diff < -20 ? 'early' : ''}`} title="Actual vs planned time"><Gauge size={18} />{diff >= 0 ? '+' : '−'}{mmss(Math.abs(diff))}</span>
            <span className="sep" />
            <button className={notes ? 'active' : ''} onClick={() => setNotes(v => !v)} aria-label="Toggle notes" title="Notes (N)"><ScrollText /></button>
            <button onClick={() => setOverview(true)} aria-label="Scene overview" title="Overview (O)"><LayoutGrid /></button>
            <button className={light ? 'active' : ''} onClick={() => setLight(v => !v)} aria-label="Toggle light mode" title="Light mode (L)">{light ? <EyeOff /> : <Eye />}</button>
            <button onClick={toggleFull} aria-label="Toggle fullscreen" title="Fullscreen (F)">{full ? <Minimize2 /> : <Maximize2 />}</button>
            <button onClick={() => setHelp(true)} aria-label="Keyboard help" title="Help (?)"><HelpCircle /></button>
          </nav>
        )}
        <div className="sr" aria-live="polite">{scene.title}</div>
      </div>
    </div>
  );
}
