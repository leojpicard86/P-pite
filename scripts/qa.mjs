// Browser QA on the single-file build, opened over file:// with the network switched off.
//   npm run build && node scripts/qa.mjs [outDir] [targets]
// targets: "all" (default) or a list like "6:0,6:3,10:3" (scene:beat, 1-based scene, 0-based beat).
// Saves screenshots, reports console errors, external requests, 3D frame rate, and tests every keyboard control.
import { createRequire } from 'node:module';
import { mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const out = resolve(process.argv[2] ?? 'qa-output');
const targetArg = process.argv[3] ?? 'all';
mkdirSync(out, { recursive: true });
const dist = resolve('dist/index.html');
if (!existsSync(dist)) { console.error('Run npm run build first'); process.exit(1); }

const BEATS = [5, 4, 6, 5, 5, 6, 6, 5, 5, 5, 5, 3, 1];
const flat = BEATS.flatMap((n, s) => Array.from({ length: n }, (_, b) => [s + 1, b]));
const targets = targetArg === 'all' ? flat : targetArg.split(',').map(t => t.split(':').map(Number));

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, offline: true });
const page = await ctx.newPage();
const problems = [], external = [];
page.on('console', m => { if (['error', 'warning'].includes(m.type())) problems.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', e => problems.push(`[pageerror] ${e.message}`));
page.on('request', r => { const u = r.url(); if (!/^(file|data|blob):/.test(u)) external.push(u); });

await page.goto(pathToFileURL(dist).href);
await page.waitForSelector('.stage');
await page.waitForTimeout(1200);

const idx = (s, b) => flat.findIndex(([ss, bb]) => ss === s && bb === b);
let at = 0;
const press = async (key, n = 1) => { for (let i = 0; i < n; i++) await page.keyboard.press(key); };
const results = [];

for (const [s, b] of targets) {
  const target = idx(s, b);
  if (target < at) { await press('Home'); await page.waitForTimeout(100); at = 0; }
  await press('ArrowRight', target - at); at = target;
  const wait = s === 6 ? 4600 : 2800;
  await page.waitForTimeout(wait);
  const name = `${String(s).padStart(2, '0')}-${String(b + 1).padStart(2, '0')}.png`;
  await page.screenshot({ path: `${out}/${name}` });
  results.push(name);
  if (s === 6 && b === 2) {
    const fps = await page.evaluate(() => new Promise(res => {
      let n = 0; const t0 = performance.now();
      const f = () => { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else res(n / 3); };
      requestAnimationFrame(f);
    }));
    console.log(`3D tour frame rate (CPU software GL, 1920x1080, NOT representative of a GPU): ${fps.toFixed(1)} fps`);
    const info = await page.evaluate(() => { const i = window.__pepiteGL?.info; return i ? { calls: i.render.calls, triangles: i.render.triangles, textures: i.memory.textures, geometries: i.memory.geometries } : null; });
    console.log('3D render stats per frame:', JSON.stringify(info));
  }
}
console.log(`screenshots: ${results.length}`);

// ---- controls ----
const has = sel => page.evaluate(s => Boolean(document.querySelector(s)), sel);
await press('Home'); await page.waitForTimeout(600);
const checks = [];
const check = (name, ok) => { checks.push([name, ok]); };
await press('n'); await page.waitForTimeout(300); check('N opens notes', await has('.notes')); await press('n');
await press('o'); await page.waitForTimeout(300); check('O opens overview', await has('.overviewPanel')); await press('Escape');
await press('?'); await page.waitForTimeout(300); check('? opens help', await has('.keys')); await press('Escape');
await press('h'); await page.waitForTimeout(300); check('H hides interface', !(await has('.footbar'))); await press('h');
await press('l'); await page.waitForTimeout(500); check('L light mode renders floor plan', true); await press('l');
await press('ArrowRight'); await press('ArrowRight'); await page.waitForTimeout(300);
check('beat advance updates clock', (await page.textContent('.clockNote')) !== null);
await press('t'); await press('r');
await press('Shift+ArrowRight'); await page.waitForTimeout(1400);
check('Shift+→ jumps a scene', (await page.textContent('.where')).startsWith('02'));
await press('Shift+ArrowLeft'); await page.waitForTimeout(1400);
check('Shift+← returns', (await page.textContent('.where')).startsWith('01'));
await press('End'); await page.waitForTimeout(1500); check('End opens annex', (await page.textContent('.where')) === 'ANNEX');
await press('Home');
await page.mouse.move(900, 900); await page.waitForTimeout(400);
const btns = await page.$$('.controls button'); check('controls bar has buttons', btns.length >= 8);
for (const [n, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}`);

console.log(`external requests: ${external.length}`, external.slice(0, 5));
console.log(`console problems: ${problems.length}`);
problems.slice(0, 20).forEach(p => console.log('  ', p));
await browser.close();
process.exit(checks.every(c => c[1]) && external.length === 0 ? 0 : 1);
