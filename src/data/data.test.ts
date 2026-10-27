import { describe, expect, it } from 'vitest';
import { actions, finance, ksf, extrapolateMonth7, market, verdicts } from './facts';
import { scenes, timed, TOTAL_SECONDS, TOTAL_WORDS, sceneWords, wordCount } from './script';
import { beatSeconds, beatStart } from '../engine';

describe('timing', () => {
  it('twelve timed scenes sum to exactly 720 seconds (12 minutes)', () => {
    expect(timed).toHaveLength(12);
    expect(TOTAL_SECONDS).toBe(720);
  });
  it('four hand-over points give four parts of exactly 3 minutes', () => {
    const parts: number[] = []; let acc = 0;
    for (const s of timed) { acc += s.duration; if (s.handover || s === timed[timed.length - 1]) { parts.push(acc); acc = 0; } }
    expect(parts).toEqual([180, 180, 180, 180]);
  });
  it('beat durations add back up to the scene duration', () => {
    scenes.forEach((s, i) => {
      if (!s.duration) return;
      const sum = s.beats.reduce((a, _, b) => a + beatSeconds(i, b), 0);
      expect(Math.abs(sum - s.duration)).toBeLessThan(1e-6);
    });
    expect(beatStart(timed.length - 1, 0)).toBeGreaterThan(0);
  });
});

describe('script realism for B1-B2 speakers', () => {
  it('each scene is spoken at 85-125 words per minute', () => {
    for (const s of timed) {
      const wpm = (sceneWords(s) / s.duration) * 60;
      expect(wpm, `${s.id}: ${wpm.toFixed(0)} wpm`).toBeGreaterThanOrEqual(85);
      expect(wpm, `${s.id}: ${wpm.toFixed(0)} wpm`).toBeLessThanOrEqual(125);
    }
  });
  it('whole talk is about 1,000-1,400 words', () => {
    expect(TOTAL_WORDS).toBeGreaterThan(1000);
    expect(TOTAL_WORDS).toBeLessThan(1400);
  });
  it('sentences stay short (max 32 words)', () => {
    for (const s of scenes) for (const b of s.beats)
      for (const sent of b.say.split(/(?<=[.!?:])\s+/)) expect(wordCount(sent), sent).toBeLessThanOrEqual(32);
  });
  it('no presenter name or number leaks into the script or cues', () => {
    const all = scenes.flatMap(s => s.beats.flatMap(b => [b.say, b.cue])).join(' ');
    expect(all).not.toMatch(/speaker\s*\d|presenter\s*\d/i);
  });
});

describe('financial figures match the BGE plan', () => {
  it('uses of funds add up to 34,460 and equal the resources', () => {
    expect(finance.uses.reduce((a, u) => a + u.value, 0)).toBe(34460);
    expect(finance.personal + finance.loan).toBe(34460);
    expect(finance.totalUses).toBe(34460);
  });
  it('monthly table is internally consistent', () => {
    const m = finance.monthly;
    m.revenue.forEach((rev, i) => expect(rev - m.opex[i] - m.vat[i]).toBe(m.balance[i]));
    let cash = finance.startCash;
    m.balance.forEach((b, i) => { cash += b; expect(Math.abs(cash - m.cumulative[i])).toBeLessThanOrEqual(2); });
    expect(m.revenue.reduce((a, b) => a + b, 0)).toBe(finance.cumulativeRevenue6m.central);
  });
  it('headline scenario values are the ones in the plan', () => {
    expect(finance.scenarios.central.m6).toBe(207);
    expect(finance.scenarios.prudent.m6).toBe(-2644);
    expect(finance.scenarios.optimistic.m6).toBe(3758);
    expect(finance.monthly.cumulative[5]).toBe(finance.scenarios.central.m6);
    expect(finance.monthly.cumulative[2]).toBe(finance.scenarios.central.m3);
  });
  it('the month-7 extrapolation goes below zero and is labelled as such', () => {
    const e = extrapolateMonth7();
    expect(e.cash).toBeLessThan(0);
    expect(e.status).toBe('extrapolation');
  });
});

describe('other source data', () => {
  it('KSF counts add up to 40 and 8 fundamental', () => {
    const l = ksf.levels;
    expect(l.fundamental + l.high + l.medium + l.low).toBe(40);
    const sum = (k: 'f' | 'h' | 'm' | 'l') => ksf.byCategory.reduce((a, r) => a + r[k], 0);
    expect([sum('f'), sum('h'), sum('m'), sum('l')]).toEqual([8, 17, 12, 3]);
  });
  it('12 actions are bucketed consistently with the 3.5 threshold', () => {
    expect(actions).toHaveLength(12);
    for (const a of actions) {
      const hi = a.impact >= 3.5, fe = a.feas >= 3.5;
      const expected = hi && fe ? 'priority' : hi ? 'plan' : fe ? 'quick' : 'later';
      // action 5 (5/3) and 6 (5/2) are "plan"; 7-9 are quick wins by the source's own classification (impact 3 or 2, high feasibility)
      expect(a.bucket, `action ${a.n}`).toBe(expected);
    }
  });
  it('seven assumptions: 1 validated, 2 partly, 3 to validate, 1 invalid', () => {
    const c = (v: string) => verdicts.filter(x => x.verdict === v).length;
    expect([verdicts.length, c('validated'), c('partial'), c('tovalidate'), c('invalid')]).toEqual([7, 1, 2, 3, 1]);
  });
  it('market figures are flagged as reported, not verified', () => {
    expect(market.status).toBe('reported');
  });
});

describe('every number spoken is traceable', () => {
  const allowed = new Set<number>([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 21, 25, 40, 58, 2024, 2026, 2023, 70,
    market.secondHandBn2024, market.fashionBn2024, market.boughtSecondHandPct2023, market.vintedUsersFr,
    finance.totalUses, finance.personal, finance.loan, finance.startCash, 3758, 207, 2644, 15, 85, 24
  ]);
  it('spoken digits belong to the sourced set', () => {
    const digits = scenes.flatMap(s => s.beats.map(b => b.say)).join(' ').match(/\d[\d,]*/g) ?? [];
    for (const d of digits) expect(allowed.has(Number(d.replace(/,/g, ''))), `unexpected figure ${d}`).toBe(true);
  });
});

import { clampPos, nextPos, prevPos, nextScene, prevScene, type Pos } from '../engine';

describe('keyboard navigation engine', () => {
  const totalBeats = scenes.reduce((a, s) => a + s.beats.length, 0);
  it('pressing next from the start visits every beat once and stops on the annex', () => {
    let p: Pos = { s: 0, b: 0 }; let n = 1;
    for (;;) { const q = nextPos(p); if (q.s === p.s && q.b === p.b) break; p = q; n++; }
    expect(n).toBe(totalBeats);
    expect(p.s).toBe(scenes.length - 1);
  });
  it('previous is the exact inverse of next', () => {
    let p: Pos = { s: 0, b: 0 };
    for (let i = 0; i < totalBeats - 1; i++) { const q = nextPos(p); expect(prevPos(q)).toEqual(p); p = q; }
  });
  it('never leaves the valid range', () => {
    expect(prevPos({ s: 0, b: 0 })).toEqual({ s: 0, b: 0 });
    expect(clampPos({ s: 99, b: 99 })).toEqual({ s: scenes.length - 1, b: scenes[scenes.length - 1].beats.length - 1 });
    expect(clampPos({ s: -3, b: -1 })).toEqual({ s: 0, b: 0 });
  });
  it('scene jumps land on beat 0; previous-scene first rewinds the current scene', () => {
    expect(nextScene({ s: 2, b: 3 })).toEqual({ s: 3, b: 0 });
    expect(prevScene({ s: 3, b: 2 })).toEqual({ s: 3, b: 0 });
    expect(prevScene({ s: 3, b: 0 })).toEqual({ s: 2, b: 0 });
  });
  it('the 3D tour has exactly one beat per camera stop', () => {
    expect(scenes.find(s => s.id === 'tour')!.beats).toHaveLength(6);
  });
});
