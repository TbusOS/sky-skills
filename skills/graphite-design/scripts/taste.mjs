#!/usr/bin/env node
// taste.mjs — the reader's taste profile for graphite drawings, on the command line.
//
// The learning rule lives in assets/taste.js (shared with the taste lab on the
// showcase page); this file only reads and writes the log and prints things.
//
//   node taste.mjs show                       current values, how much evidence each has
//   node taste.mjs explain [knob]             which events moved each knob, oldest first
//   node taste.mjs suggest [--json|--css|--js]  what to draw with next
//   node taste.mjs ab                         the next A/B question: one knob, two values
//   node taste.mjs pick <knob> <winner> <loser> [note]    record an A/B answer
//   node taste.mjs say "<what the reader said>"           e.g. "颜色太多了,线太抖"
//   node taste.mjs keep|drop '<json knobs>' [note]        a figure was kept / thrown away
//   node taste.mjs ingest <file> [--from=objective|critic]  reviewer output -> events
//   node taste.mjs import <file.jsonl>        append events exported from the taste lab page
//   node taste.mjs reset --yes                start over (the old log is renamed, not deleted)
//   node taste.mjs --self-test                a simulated reader; the profile must move toward them
//
// The log: ${SKY_TASTE_DIR:-~/.config/sky-skills}/graphite-taste.jsonl, one JSON event per
// line, append-only. --file=<path> uses another log (a project, a team).
// It stays on this machine. Nothing in it is sent anywhere.
import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const T = require(join(HERE, '../assets/taste.js'));

const argv = process.argv.slice(2);
const flags = Object.fromEntries(argv.filter(a => a.startsWith('--')).map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const pos = argv.filter(a => !a.startsWith('--'));
const LOG = flags.file || join(process.env.SKY_TASTE_DIR || join(homedir(), '.config/sky-skills'), 'graphite-taste.jsonl');

function load(path = LOG) {
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8').split('\n').filter(Boolean).map((l, i) => {
    try { return JSON.parse(l); } catch { throw new Error(`${path}:${i + 1} is not JSON`); }
  });
}
function append(events, path = LOG) {
  mkdirSync(dirname(path), { recursive: true });
  const ts = new Date().toISOString();
  appendFileSync(path, events.map(e => JSON.stringify({ ts, ...e })).join('\n') + '\n');
  return events.length;
}
const fmt = v => (typeof v === 'number' ? String(v) : JSON.stringify(v));

function show(events) {
  const t = T.estimate(events);
  console.log(`log: ${LOG} · ${events.length} events`);
  for (const [k, K] of Object.entries(T.KNOBS)) {
    const v = t.knobs[k], moved = v !== K.def;
    const lim = [t.constraints.min[k] != null ? `≥${t.constraints.min[k]}` : '', t.constraints.max[k] != null ? `≤${t.constraints.max[k]}` : ''].filter(Boolean).join(' ');
    console.log(`  ${k.padEnd(13)} ${String(v).padStart(6)}  ${moved ? '(house ' + K.def + ')' : '       house'}  evidence ${t.evidence[k]}${lim ? '  constraint ' + lim : ''}  ${K.zh}`);
  }
  for (const [c, C] of Object.entries(T.CATS)) console.log(`  ${c.padEnd(13)} ${t.cats[c].padStart(6)}  ${C.zh}`);
}

function explain(events, only) {
  const t = T.estimate(events);
  for (const k of Object.keys(T.KNOBS)) {
    if (only && k !== only) continue;
    const tr = t.trace[k];
    console.log(`${k} = ${t.knobs[k]}  (house ${T.KNOBS[k].def}, ${tr.length} events)`);
    for (const s of tr) console.log(`    ${s.ts.slice(0, 10)} ${s.kind.padEnd(6)} x=${s.x} w=${s.w}  ${s.from} → ${s.to}  ${s.note}`);
    if (t.constraints.min[k] != null || t.constraints.max[k] != null) console.log(`    constraint min ${t.constraints.min[k] ?? '-'} max ${t.constraints.max[k] ?? '-'}`);
  }
}

function suggest(events) {
  const a = T.apply(T.estimate(events));
  const Sketch = require(join(HERE, '../assets/sketch.js'));
  if (flags.json) return console.log(JSON.stringify(a, null, 1));
  if (flags.css) return console.log(Sketch.cssVars(a.css));
  if (flags.js) return console.log(`Sketch.create({ seed: 1, taste: ${JSON.stringify(a.sketch)} })\nSketch.filters(${JSON.stringify(a.filters)})`);
  console.log('draw with:');
  console.log(`  sketch.js   Sketch.create({ taste: ${JSON.stringify(a.sketch)} })`);
  console.log(`  filter      Sketch.filters(${JSON.stringify(a.filters)})`);
  console.log(`  css         ${Sketch.cssVars(a.css) || '(house values)'}`);
  console.log(`  layout      at most ${a.layout.colorBudget} pencils per figure · about ${Math.round(a.layout.whitespace * 100)}% empty paper · labels ${a.layout.labelSize}px · animation × ${a.layout.pace}`);
  console.log(`  prefers     theme ${a.prefer.theme} · main character ${a.prefer.cast} · illustrations ${a.prefer.source}`);
}

// check_objective.mjs prints "  ❌ O4 手机上图里的字:…". Only O4 maps to a knob:
// labels too small on a phone -> a floor on labelSize (a constraint, not a taste).
// A critic verdict (JSON from design-critic or the multi-critic specialists) is
// free text; its issues go through the same word list as `say`, at review weight.
function ingest(file) {
  const txt = readFileSync(file, 'utf8');
  const from = flags.from || (/O[1-5]/.test(txt) && /通过|失败/.test(txt) ? 'objective' : 'critic');
  const out = [];
  if (from === 'objective') {
    const cur = T.estimate(load()).knobs.labelSize;
    for (const line of txt.split('\n')) {
      if (!/❌/.test(line)) continue;
      if (/O4/.test(line)) out.push({ kind: 'constraint', min: { labelSize: Math.min(26, cur + 2) }, note: 'check_objective O4: ' + line.trim().slice(0, 120), source: 'check_objective' });
      else out.push({ kind: 'review', note: 'check_objective: ' + line.trim().slice(0, 120), source: 'check_objective' });
    }
  } else {
    let issues = [];
    try {
      const j = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1));
      const walk = o => { if (typeof o === 'string') issues.push(o); else if (o && typeof o === 'object') Object.values(o).forEach(walk); };
      walk(j.issues || j.top_issues || j);
    } catch { issues = txt.split('\n'); }
    for (const s of issues) {
      const p = T.parse(s);
      if (Object.keys(p.dir).length || Object.keys(p.cat).length) out.push({ kind: 'review', dir: p.dir, cat: p.cat, note: 'critic: ' + s.trim().slice(0, 120), source: 'critic' });
    }
  }
  return out;
}

function selfTest() {
  // A simulated reader who likes sparse, faint colour and steady lines. Each round the
  // tool asks one A/B question; the reader picks whichever value is closer to what they
  // like. After 40 rounds every knob the reader cares about must have closed at least
  // half the distance from the house default to their taste (the first version of
  // the learner closed a quarter after 24 rounds and still "passed" a weaker test),
  // and the explanation must name the picks.
  const like = { hatchGap: 5.6, hatchOpacity: 0.4, rough: 0.7, grain: 0.3 };
  const day = 864e5, t0 = Date.parse('2026-01-01T00:00:00Z');
  let fails = 0;
  const ROUNDS = 40;
  function simulate(contrary) {
    const ev = [];
    for (let i = 0; i < ROUNDS; i++) {
      const now = t0 + i * day;
      const q = T.ab(ev, now), k = q.knob;
      const target = like[k] ?? T.KNOBS[k].def;
      const [a, b] = q.values;
      let win = Math.abs(a - target) <= Math.abs(b - target) ? a : b;
      if (contrary) win = win === a ? b : a;
      ev.push({ ts: new Date(now).toISOString(), ...T.pick(k, win, win === a ? b : a, 'sim') });
    }
    return T.estimate(ev, t0 + ROUNDS * day);
  }
  const closed = (est, k) => 1 - Math.abs(est.knobs[k] - like[k]) / Math.abs(T.KNOBS[k].def - like[k]);
  // probe first: a reader who always picks the side AWAY from their taste must leave
  // every knob short of the bar. If this "passes", the bar measures nothing.
  const wrong = simulate(true);
  const probeOk = Object.keys(like).every(k => closed(wrong, k) < 0.5);
  if (!probeOk) fails++;
  console.log(`  ${probeOk ? '通过' : '失败'}  probe: a contrary reader does not reach the bar (${Object.keys(like).map(k => k + ' ' + Math.round(closed(wrong, k) * 100) + '%').join(', ')})`);
  const end = simulate(false);
  for (const [k, v] of Object.entries(like)) {
    const before = Math.abs(T.KNOBS[k].def - v), after = Math.abs(end.knobs[k] - v);
    const ok = after <= before * 0.5;
    if (!ok) fails++;
    console.log(`  ${ok ? '通过' : '失败'}  ${k}: house ${T.KNOBS[k].def} → learned ${end.knobs[k]} (reader likes ${v}; gap closed ${Math.round((1 - after / before) * 100)}%)`);
  }
  // knobs the reader does not care about must not drift far
  // (they are still asked about; the simulated reader then picks whichever side is
  // closer to the house value, so they wobble around it)
  for (const k of ['lineWeight', 'warp']) {
    const drift = Math.abs(end.knobs[k] - T.KNOBS[k].def) / (T.KNOBS[k].max - T.KNOBS[k].min);
    const ok = drift <= 0.2;
    if (!ok) fails++;
    console.log(`  ${ok ? '通过' : '失败'}  ${k} stays near house: ${end.knobs[k]} (drift ${(drift * 100).toFixed(0)}% of range)`);
  }
  // words: "太密 颜色太多" must widen the gap and lower the pencil count
  const said = T.estimate([{ ts: new Date(t0).toISOString(), ...T.say('有点太密,颜色太多了') }], t0);
  const okSay = said.knobs.hatchGap > T.KNOBS.hatchGap.def && said.knobs.colorBudget < T.KNOBS.colorBudget.def;
  if (!okSay) fails++;
  console.log(`  ${okSay ? '通过' : '失败'}  say「有点太密,颜色太多了」: hatchGap ${said.knobs.hatchGap}, colorBudget ${said.knobs.colorBudget}`);
  // a wrong word must NOT move anything (probe: the word list is not matching everything)
  const none = T.estimate([{ ts: new Date(t0).toISOString(), ...T.say('今天天气不错') }], t0);
  const okNone = Object.keys(T.KNOBS).every(k => none.knobs[k] === T.KNOBS[k].def);
  if (!okNone) fails++;
  console.log(`  ${okNone ? '通过' : '失败'}  say「今天天气不错」moves nothing`);
  // constraints beat taste: a reader who wants tiny labels still gets the floor
  const c = T.estimate([
    { ts: new Date(t0).toISOString(), kind: 'say', dir: { labelSize: -1 } },
    { ts: new Date(t0).toISOString(), kind: 'say', dir: { labelSize: -1 } },
    { ts: new Date(t0).toISOString(), kind: 'constraint', min: { labelSize: 18 } }], t0);
  const okC = c.knobs.labelSize >= 18;
  if (!okC) fails++;
  console.log(`  ${okC ? '通过' : '失败'}  constraint labelSize ≥ 18 holds against two "smaller" requests: ${c.knobs.labelSize}`);
  // old events fade: the same pick a year ago counts for less than one today
  const old = T.estimate([{ ts: new Date(t0 - 365 * day).toISOString(), ...T.pick('rough', 1.6, 1, 'old') }], t0).knobs.rough;
  const fresh = T.estimate([{ ts: new Date(t0).toISOString(), ...T.pick('rough', 1.6, 1, 'new') }], t0).knobs.rough;
  const okD = fresh > old && old > T.KNOBS.rough.def;
  if (!okD) fails++;
  console.log(`  ${okD ? '通过' : '失败'}  a pick from a year ago moves less (${old}) than the same pick today (${fresh})`);
  // explanation is traceable
  const tr = end.trace.hatchGap.length;
  const okT = tr > 0 && end.trace.hatchGap.every(s => s.kind === 'pick');
  if (!okT) fails++;
  console.log(`  ${okT ? '通过' : '失败'}  explain lists the ${tr} picks that moved hatchGap`);
  // one knob must not swallow the questions. A reader whose line weight sits near the
  // floor (1.6, floor 1.4) answers "less" again and again while the estimate creeps
  // down; before STREAK_CAP that knob took 18 of 24 questions (2026-10-10).
  const like2 = { lineWeight: 1.6, hatchGap: 5.8, rough: 0.55, grain: 0.2 }, ev2 = [], asked = {};
  for (let i = 0; i < ROUNDS; i++) {
    const now = t0 + i * day, q = T.ab(ev2, now), k = q.knob, target = like2[k] ?? T.KNOBS[k].def, [a, b] = q.values;
    const win = Math.abs(a - target) <= Math.abs(b - target) ? a : b;
    asked[k] = (asked[k] || 0) + 1;
    ev2.push({ ts: new Date(now).toISOString(), ...T.pick(k, win, win === a ? b : a, 'sim') });
  }
  const [topK, topN] = Object.entries(asked).sort((x, y) => y[1] - x[1])[0];
  const okS = topN / ROUNDS <= 0.4;
  if (!okS) fails++;
  console.log(`  ${okS ? '通过' : '失败'}  no knob takes over the questions: busiest is ${topK}, ${topN} of ${ROUNDS} (limit 40%)`);
  console.log(`\n自测:${fails ? fails + ' 项失败' : '全部通过'}`);
  return fails ? 1 : 0;
}

function main() {
  if (flags['self-test']) return selfTest();
  const cmd = pos[0] || 'show';
  const ev = load();
  switch (cmd) {
    case 'show': show(ev); return 0;
    case 'explain': explain(ev, pos[1]); return 0;
    case 'suggest': suggest(ev); return 0;
    case 'ab': {
      const q = T.ab(ev);
      if (flags.json) console.log(JSON.stringify(q));
      else console.log(`ask about: ${q.knob} (${q.label.zh} / ${q.label.en})\n  A = ${q.values[0]}  (current)\n  B = ${q.values[1]}\nDraw the same figure twice with these values, show both, then:\n  node taste.mjs pick ${q.knob} <winner> <loser> "<what they said>"`);
      return 0;
    }
    case 'pick': {
      const [, k, w, l, ...note] = pos;
      if (!T.KNOBS[k] || isNaN(+w) || isNaN(+l)) { console.error('usage: pick <knob> <winner value> <loser value> [note]'); return 2; }
      append([T.pick(k, +w, +l, note.join(' '))]); show(load()); return 0;
    }
    case 'say': {
      const e = T.say(pos.slice(1).join(' '));
      if (!Object.keys(e.dir).length && !Object.keys(e.cat).length) { console.log('no known words in that — nothing recorded. Words it knows: assets/taste.js LEXICON'); return 1; }
      append([e]); console.log(`heard: ${e.hits.join(', ')} → ${fmt(e.dir)} ${Object.keys(e.cat).length ? fmt(e.cat) : ''}`); return 0;
    }
    case 'keep': case 'drop': {
      let knobs; try { knobs = JSON.parse(pos[1]); } catch { console.error(`usage: ${cmd} '{"hatchGap":4.2}' [note]`); return 2; }
      append([{ kind: cmd, knobs, note: pos.slice(2).join(' ') }]); return 0;
    }
    case 'ingest': {
      const e = ingest(pos[1]);
      if (!e.length) { console.log('nothing in that file maps to a knob — nothing recorded'); return 0; }
      append(e); e.forEach(x => console.log(`  ${x.kind} ${x.min ? 'min ' + fmt(x.min) : fmt(x.dir || {})}  ${x.note}`)); return 0;
    }
    case 'import': {
      const e = load(pos[1]);
      mkdirSync(dirname(LOG), { recursive: true });
      appendFileSync(LOG, e.map(x => JSON.stringify(x)).join('\n') + (e.length ? '\n' : ''));
      console.log(`imported ${e.length} events from ${pos[1]}`); return 0;
    }
    case 'reset': {
      if (!flags.yes) { console.error('reset renames the log; add --yes'); return 2; }
      if (existsSync(LOG)) { const to = LOG + '.' + new Date().toISOString().replace(/[:.]/g, '-') + '.bak'; renameSync(LOG, to); console.log('old log kept at ' + to); }
      return 0;
    }
    default: console.error('unknown command ' + cmd); return 2;
  }
}

process.exit(main());
