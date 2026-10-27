// Generates docs/SCRIPT.md (full English script, cues, hand-overs, word counts) from the same data the app runs on.
// Run: npm run docs
import { writeFileSync } from 'node:fs';
import { scenes, timed, TOTAL_SECONDS, TOTAL_WORDS, sceneWords, wordCount } from '../src/data/script';
import { beatSeconds, beatStart, mmss } from '../src/engine';

const L: string[] = [];
const wpm = (w: number, s: number) => Math.round((w / s) * 60);

L.push('# PÉPITE — Full speaker script (English, B1–B2)', '');
L.push('> Generated from `src/data/script.ts` by `npm run docs`. Edit the script there, not here.', '');
L.push(`**Total:** ${mmss(TOTAL_SECONDS)} (${TOTAL_SECONDS} s) · **${TOTAL_WORDS} words** · average ${wpm(TOTAL_WORDS, TOTAL_SECONDS)} words per minute, pauses included.`, '');
L.push('How to read it: one line = one *beat*. Press `→` when you start saying the line; the animation in the *Cue* column then plays. ' +
  'Lines marked **⟶ HAND OVER** are where the next presenter takes over. No presenter is named: assign the four parts yourselves.', '');

// ----- parts
L.push('## The four parts', '', '| Part | Scenes | Time | Words |', '|---|---|---|---|');
let part = 1, secs = 0, words = 0, first = 1;
timed.forEach((s, i) => {
  secs += s.duration; words += sceneWords(s);
  if (s.handover || i === timed.length - 1) {
    L.push(`| ${part} | ${first}–${i + 1} | ${mmss(secs)} | ${words} (${wpm(words, secs)} wpm) |`);
    part++; secs = 0; words = 0; first = i + 2;
  }
});
L.push('');

// ----- timeline
L.push('## Timeline', '', '| # | Scene | Start | Duration | Words | wpm |', '|---|---|---|---|---|---|');
timed.forEach((s, i) => {
  const w = sceneWords(s);
  L.push(`| ${i + 1} | ${s.title} | ${mmss(beatStart(i, 0))} | ${mmss(s.duration)} | ${w} | ${wpm(w, s.duration)} |`);
});
L.push('');

// ----- script
L.push('## Script', '');
timed.forEach((s, i) => {
  L.push(`### ${i + 1}. ${s.eyebrow} — ${s.title}`, '');
  L.push(`*${mmss(beatStart(i, 0))} → ${mmss(beatStart(i, 0) + s.duration)} · ${sceneWords(s)} words · sources: ${s.sources.join('; ')}*`, '');
  L.push('| Time | Say | Cue (animation) |', '|---|---|---|');
  s.beats.forEach((b, k) => {
    const hand = s.handover && k === s.beats.length - 1 ? ' **⟶ HAND OVER**' : '';
    L.push(`| ${mmss(beatStart(i, k))} (${Math.round(beatSeconds(i, k))} s) | ${b.say}${hand} | ${b.cue} |`);
  });
  L.push('');
});
L.push('## Annex (backup slide)', '', `${scenes[scenes.length - 1].beats[0].say} Press \`End\` to open it during questions.`, '');
L.push(`_Sanity: ${scenes.flatMap(s => s.beats).reduce((a, b) => a + wordCount(b.say), 0)} words in total including the annex line._`, '');

writeFileSync(new URL('../docs/SCRIPT.md', import.meta.url), L.join('\n'));
console.log('wrote docs/SCRIPT.md');
