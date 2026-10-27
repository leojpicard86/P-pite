import { scenes, wordCount, sceneWords } from './data/script';

export type Pos = { s: number; b: number };

export const clampPos = (p: Pos): Pos => {
  const s = Math.min(scenes.length - 1, Math.max(0, p.s));
  return { s, b: Math.min(scenes[s].beats.length - 1, Math.max(0, p.b)) };
};
export const nextPos = (p: Pos): Pos => {
  const sc = scenes[p.s];
  if (p.b < sc.beats.length - 1) return { s: p.s, b: p.b + 1 };
  return p.s < scenes.length - 1 ? { s: p.s + 1, b: 0 } : p;
};
export const prevPos = (p: Pos): Pos => {
  if (p.b > 0) return { s: p.s, b: p.b - 1 };
  return p.s > 0 ? { s: p.s - 1, b: scenes[p.s - 1].beats.length - 1 } : p;
};
export const nextScene = (p: Pos): Pos => (p.s < scenes.length - 1 ? { s: p.s + 1, b: 0 } : p);
export const prevScene = (p: Pos): Pos => (p.b > 0 ? { s: p.s, b: 0 } : p.s > 0 ? { s: p.s - 1, b: 0 } : p);

/** Seconds from the start of the talk to the start of scene s. */
export const sceneStart = (s: number) => scenes.slice(0, s).reduce((a, x) => a + x.duration, 0);

/** Planned seconds of a beat (scene duration split in proportion to the words spoken). */
export const beatSeconds = (s: number, b: number) => {
  const sc = scenes[s];
  const total = sceneWords(sc) || 1;
  return sc.duration * (wordCount(sc.beats[b].say) / total);
};
/** Planned time at which a beat starts. */
export const beatStart = (s: number, b: number) => {
  let t = sceneStart(s);
  for (let i = 0; i < b; i++) t += beatSeconds(s, i);
  return t;
};
export const mmss = (sec: number) => {
  const v = Math.max(0, Math.round(sec));
  return `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`;
};
