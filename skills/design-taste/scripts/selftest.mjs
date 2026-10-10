// selftest.mjs — `taste.mjs --self-test`. Simulated readers on the real engine, then
// the same tests on deliberately broken copies of the engine: each break must make
// the test written for it fail, or that test proves nothing.
//
//   A  graphite's original 40-question reader (unchanged from graphite taste.mjs)
//   S  scenes: reader A likes faint ink in tech diagrams and strong ink in wallpapers;
//      reader B likes the same everywhere
//   X  across styles: words and picks made in graphite reach the shared knobs of
//      another style, through ranges, at half weight, and nothing else moves
//   R  reference pictures: measured empty paper within ±0.05 of the truth
//   M  breakage: no scene step / raw values instead of ranges / full weight for
//      other styles — each must fail its test
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(HERE, '../assets');
const CORE_SRC = readFileSync(join(ASSETS, 'taste-core.js'), 'utf8');
const GRAPHITE = require(join(HERE, '../../graphite-design/assets/taste-profile.js'));
const DAY = 864e5, T0 = Date.parse('2026-01-01T00:00:00Z');
const iso = ms => new Date(ms).toISOString();

// Load the engine from source text (so a broken copy can be loaded the same way).
function coreFrom(src) {
  const m = { exports: {} };
  new Function('module', 'exports', 'require', src)(m, m.exports, p => require(join(ASSETS, p)));
  return m.exports;
}

// A small ink style with two scene groups, used only here, so these tests do not
// depend on any real style's numbers.
const INK = {
  style: 'testink',
  KNOBS: {
    inkDepth:    { def: 0.5, min: 0,   max: 1,    step: 0.08, zh: '墨色浓淡', en: 'ink depth' },
    wet:         { def: 0.5, min: 0,   max: 1,    step: 0.08, zh: '湿度', en: 'wetness' },
    labelSize:   { def: 20,  min: 14,  max: 30,   step: 1.5,  zh: '字号', en: 'label size', int: true },
    whitespace:  { def: 0.6, min: 0.4, max: 0.85, step: 0.05, zh: '留白', en: 'empty paper' },
    colorBudget: { def: 2,   min: 1,   max: 5,    step: 1,    zh: '颜色数', en: 'colours', int: true },
    pace:        { def: 1.2, min: 0.6, max: 2.2,  step: 0.15, zh: '节奏', en: 'pace' }
  },
  CATS: { theme: { def: 'auto', values: ['light', 'dark', 'auto'], zh: '主题', en: 'theme' } },
  LEXICON: [
    { re: '字太小', dir: { labelSize: 1 } },
    { re: '太淡', dir: { inkDepth: 1 } },
    { re: '太湿', dir: { wet: -1 } }
  ],
  shared: { labelSize: 'labelSize', whitespace: 'whitespace', colorBudget: 'colorBudget', pace: 'pace', theme: 'theme' },
  SCENES: ['tech', 'wallpaper'],
  abSkip: []
};

function graphiteReader(Core) {
  // graphite taste.mjs self-test, unchanged in substance (2026-10-10): a reader who likes
  // sparse, faint colour and steady lines; 40 A/B questions; every knob they care about
  // closes at least half the gap; a contrary reader must not; words; constraints; decay;
  // explain; no knob takes over the questions.
  const T = Core.create(GRAPHITE), res = [];
  const like = { hatchGap: 5.6, hatchOpacity: 0.4, rough: 0.7, grain: 0.3 }, ROUNDS = 40;
  function simulate(contrary) {
    const ev = [];
    for (let i = 0; i < ROUNDS; i++) {
      const now = T0 + i * DAY, q = T.ab(ev, now), k = q.knob, target = like[k] ?? T.KNOBS[k].def, [a, b] = q.values;
      let win = Math.abs(a - target) <= Math.abs(b - target) ? a : b;
      if (contrary) win = win === a ? b : a;
      ev.push({ ts: iso(now), ...T.pick(k, win, win === a ? b : a, 'sim') });
    }
    return T.estimate(ev, T0 + ROUNDS * DAY);
  }
  const closed = (est, k) => 1 - Math.abs(est.knobs[k] - like[k]) / Math.abs(T.KNOBS[k].def - like[k]);
  const wrong = simulate(true);
  res.push(['A0 probe: a contrary reader does not reach the bar', Object.keys(like).every(k => closed(wrong, k) < 0.5)]);
  const end = simulate(false);
  for (const k of Object.keys(like)) res.push([`A1 ${k}: house ${T.KNOBS[k].def} → ${end.knobs[k]} (likes ${like[k]}, closed ${Math.round(closed(end, k) * 100)}%)`, closed(end, k) >= 0.5]);
  for (const k of ['lineWeight', 'warp']) {
    const drift = Math.abs(end.knobs[k] - T.KNOBS[k].def) / (T.KNOBS[k].max - T.KNOBS[k].min);
    res.push([`A2 ${k} stays near house (drift ${(drift * 100).toFixed(0)}%)`, drift <= 0.2]);
  }
  const said = T.estimate([{ ts: iso(T0), ...T.say('有点太密,颜色太多了') }], T0);
  res.push(['A3 say「有点太密,颜色太多了」widens hatchGap, fewer pencils', said.knobs.hatchGap > T.KNOBS.hatchGap.def && said.knobs.colorBudget < T.KNOBS.colorBudget.def]);
  const none = T.estimate([{ ts: iso(T0), ...T.say('今天天气不错') }], T0);
  res.push(['A4 say「今天天气不错」moves nothing', Object.keys(T.KNOBS).every(k => none.knobs[k] === T.KNOBS[k].def)]);
  const c = T.estimate([{ ts: iso(T0), kind: 'say', dir: { labelSize: -1 } }, { ts: iso(T0), kind: 'say', dir: { labelSize: -1 } }, { ts: iso(T0), kind: 'constraint', min: { labelSize: 18 } }], T0);
  res.push([`A5 constraint labelSize ≥ 18 holds (${c.knobs.labelSize})`, c.knobs.labelSize >= 18]);
  const old = T.estimate([{ ts: iso(T0 - 365 * DAY), ...T.pick('rough', 1.6, 1, 'old') }], T0).knobs.rough;
  const fresh = T.estimate([{ ts: iso(T0), ...T.pick('rough', 1.6, 1, 'new') }], T0).knobs.rough;
  res.push([`A6 a year-old pick moves less (${old}) than today's (${fresh})`, fresh > old && old > T.KNOBS.rough.def]);
  res.push([`A7 explain lists the picks that moved hatchGap`, end.trace.hatchGap.length > 0 && end.trace.hatchGap.every(s => s.kind === 'pick')]);
  const like2 = { lineWeight: 1.6, hatchGap: 5.8, rough: 0.55, grain: 0.2 }, ev2 = [], asked = {};
  for (let i = 0; i < ROUNDS; i++) {
    const now = T0 + i * DAY, q = T.ab(ev2, now), k = q.knob, target = like2[k] ?? T.KNOBS[k].def, [a, b] = q.values;
    const win = Math.abs(a - target) <= Math.abs(b - target) ? a : b;
    asked[k] = (asked[k] || 0) + 1;
    ev2.push({ ts: iso(now), ...T.pick(k, win, win === a ? b : a, 'sim') });
  }
  const [topK, topN] = Object.entries(asked).sort((x, y) => y[1] - x[1])[0];
  res.push([`A8 no knob takes over the questions (busiest ${topK} ${topN}/${ROUNDS})`, topN / ROUNDS <= 0.4]);
  return res;
}

// A reader answering scene questions. want: { scene: { knob: value } }.
function sceneReader(T, want, rounds = 60) {
  const ev = [];
  for (let i = 0; i < rounds; i++) {
    const scene = T.SCENES[i % T.SCENES.length], now = T0 + i * DAY;
    const q = T.ab(ev, now, { scene }), k = q.knob, target = (want[scene] || {})[k] ?? T.KNOBS[k].def, [a, b] = q.values;
    const win = Math.abs(a - target) <= Math.abs(b - target) ? a : b;
    ev.push({ ts: iso(now), ...T.pick(k, win, win === a ? b : a, 'sim', { scene }) });
  }
  const now = T0 + rounds * DAY;
  return Object.fromEntries(T.SCENES.map(s => [s, T.estimate(ev, now, { scene: s })]));
}

function scenes(Core) {
  // Only the two ink knobs are asked about, so the 30 questions per scene test the
  // scene step, not how questions are spread over six knobs.
  const T = Core.create({ ...INK, abSkip: ['labelSize', 'whitespace', 'colorBudget', 'pace'] }), res = [];
  const A = sceneReader(T, { tech: { inkDepth: 0.2 }, wallpaper: { inkDepth: 0.85 } });
  res.push([`S1 reader A: tech diagrams fainter (${A.tech.knobs.inkDepth}), wallpapers stronger (${A.wallpaper.knobs.inkDepth}) than house 0.5`,
    A.tech.knobs.inkDepth < 0.42 && A.wallpaper.knobs.inkDepth > 0.58]);
  const B = sceneReader(T, { tech: { inkDepth: 0.75 }, wallpaper: { inkDepth: 0.75 } });
  const gap = Math.abs(B.tech.knobs.inkDepth - B.wallpaper.knobs.inkDepth);
  res.push([`S2 reader B: same taste everywhere, scenes ${B.tech.knobs.inkDepth} / ${B.wallpaper.knobs.inkDepth} differ ≤ 1 step`, gap <= INK.KNOBS.inkDepth.step && B.tech.knobs.inkDepth > 0.55]);
  const one = [{ ts: iso(T0), ...T.pick('inkDepth', 0.9, 0.5, 'x', { scene: 'tech' }) }];
  const st = T.estimate(one, T0 + DAY), sc = T.estimate(one, T0 + DAY, { scene: 'wallpaper' });
  res.push([`S3 a scene with no events of its own follows the style taste (${sc.knobs.inkDepth} = ${st.knobs.inkDepth})`, sc.knobs.inkDepth === st.knobs.inkDepth]);
  return res;
}

function across(Core) {
  const G = Core.create(GRAPHITE), I = Core.create(INK), res = [];
  const fromG = evs => evs.map(e => G.annotate({ ts: iso(T0), ...e }));
  const small = I.estimate(fromG([G.say('字太小了')]), T0 + DAY);
  res.push([`X1 graphite「字太小」raises ink label size (${small.knobs.labelSize} > 20)`, small.knobs.labelSize > 20]);
  const own = I.estimate([I.annotate({ ts: iso(T0), ...I.say('字太小了') })], T0 + DAY);
  const dF = small.raw.labelSize - 20, dO = own.raw.labelSize - 20;
  res.push([`X2 said in graphite moves it less (${dF.toFixed(2)}) than said here (${dO.toFixed(2)})`, dF > 0 && dF < dO * 0.75]);
  const ws = I.estimate(fromG([0, 1, 2].map(() => G.pick('whitespace', 0.7, 0.45))), T0 + DAY);
  res.push([`X3 graphite picks more empty paper (0.7 of 0.25–0.7) → ink empty paper goes up (${ws.knobs.whitespace} > 0.6)`, ws.knobs.whitespace > 0.6]);
  const hatch = I.estimate(fromG(Array.from({ length: 20 }, () => G.pick('hatchGap', 6.5, 3.7))), T0 + DAY);
  res.push(['X4 graphite hatch spacing picked 20 times moves nothing in ink', Object.keys(INK.KNOBS).every(k => hatch.knobs[k] === INK.KNOBS[k].def)]);
  const floor = I.estimate(fromG([{ kind: 'constraint', min: { labelSize: 26 } }]), T0 + DAY);
  res.push(['X5 a graphite constraint does not bind ink', floor.knobs.labelSize === 20]);
  const dark = I.estimate(fromG([G.say('想要深色'), G.say('深色')]), T0 + DAY);
  res.push([`X6 graphite「深色」carries the shared theme (${dark.cats.theme})`, dark.cats.theme === 'dark']);
  return res;
}

async function pictures() {
  const { measure, makeTestPicture } = await import('./measure.mjs');
  const { chromium } = require('playwright');
  const b = await chromium.launch(), dir = mkdtempSync(join(tmpdir(), 'taste-ref-')), res = [];
  try {
    const cases = [{ blank: 0.3 }, { blank: 0.55 }, { blank: 0.8, colors: [[62, 95, 122], [168, 100, 58]] }];
    const files = [];
    for (const [i, c] of cases.entries()) { const f = join(dir, `t${i}.png`); writeFileSync(f, await makeTestPicture(b, { ...c, seed: i + 3 })); files.push(f); }
    const ms = await measure(files, { browser: b });
    ms.forEach((m, i) => res.push([`R${i + 1} picture with ${cases[i].blank} empty paper measures ${m.whitespace}`, Math.abs(m.whitespace - cases[i].blank) <= 0.05]));
    res.push([`R4 two pigments counted as ${ms[2].colors} colours, grey ink not counted (first picture: ${ms[0].colors})`, ms[2].colors === 2 && ms[0].colors === 0]);
  } finally { await b.close(); rmSync(dir, { recursive: true, force: true }); }
  return res;
}

// Each break must make the named test fail.
const BREAKS = [
  { name: 'no scene step', find: 'if (!opts.scene) return base;', put: 'return base;', fails: 'S1' },
  { name: 'raw value instead of range', find: 'var x3 = K3.def + sv[n1] * (K3.max - K3.min);', put: 'var x3 = sv[n1];', fails: 'X3' },
  { name: 'full weight for other styles', find: 'var FOREIGN = 0.5;', put: 'var FOREIGN = 1;', fails: 'X2' }
];

export async function selfTest() {
  let fails = 0;
  const Core = coreFrom(CORE_SRC);
  const groups = [['A graphite reader', graphiteReader(Core)], ['S scenes', scenes(Core)], ['X across styles', across(Core)], ['R reference pictures', await pictures()]];
  for (const [title, rows] of groups) {
    console.log(title);
    for (const [name, ok] of rows) { if (!ok) fails++; console.log(`  ${ok ? '通过' : '失败'}  ${name}`); }
  }
  console.log('M deliberate breakage (each must fail its test)');
  for (const br of BREAKS) {
    if (!CORE_SRC.includes(br.find)) { fails++; console.log(`  失败  ${br.name}: text to break not found in taste-core.js — update BREAKS`); continue; }
    const broken = coreFrom(CORE_SRC.replace(br.find, br.put));
    const rows = [...scenes(broken), ...across(broken)].filter(([n]) => n.startsWith(br.fails));
    const caught = rows.length && rows.some(([, ok]) => !ok);
    if (!caught) fails++;
    console.log(`  ${caught ? '通过' : '失败'}  ${br.name} → ${br.fails} ${caught ? 'fails, as it must' : 'still passes: the test does not watch this'}`);
  }
  console.log(`\n自测:${fails ? fails + ' 项失败' : '全部通过'}`);
  return fails ? 1 : 0;
}
