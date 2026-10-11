#!/usr/bin/env node
// taste.mjs — the reader's taste, for every design style, on the command line.
//
// The learning rule is assets/taste-core.js (shared with the taste labs on the
// showcase pages). Each style brings its own table: skills/<style>-design/assets/
// taste-profile.js. This file only reads and writes the log and prints things.
//
//   node taste.mjs --style=graphite show                current values, evidence per knob
//   node taste.mjs --style=<s> --scene=<group> show     the same, for one scene group
//   node taste.mjs --style=graphite explain [knob]      which events moved each knob
//   node taste.mjs --style=graphite suggest [--json]    what to draw with next
//   node taste.mjs --style=graphite ab [--json]         the next A/B question
//   node taste.mjs --style=graphite pick <knob> <winner> <loser> [note]
//   node taste.mjs --style=graphite say "<what the reader said>"
//   node taste.mjs --style=graphite keep|drop '<json knobs>' [note]
//   node taste.mjs --style=graphite ref <picture> [picture …]  measure pictures the reader likes
//   node taste.mjs --style=graphite ingest <file> [--from=objective|critic]
//   node taste.mjs --style=graphite import <file.jsonl>  events exported from a taste lab page
//   node taste.mjs styles                               which styles have a taste profile
//   node taste.mjs reset --yes                          start over (old log renamed, not deleted)
//   node taste.mjs --self-test                          simulated readers + deliberate breakage
//
// --scene=<group> records new events in that scene group and estimates for it.
// The log: ${SKY_TASTE_DIR:-~/.config/sky-skills}/taste.jsonl, one JSON event per line,
// append-only, all styles together (each event says its style). graphite's older
// graphite-taste.jsonl next to it is still read. --file=<path> uses one other log.
// It stays on this machine. Nothing in it is sent anywhere.
import { readFileSync, appendFileSync, existsSync, mkdirSync, renameSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const SKILLS = resolve(HERE, '../..');
const Core = require(join(HERE, '../assets/taste-core.js'));

const argv = process.argv.slice(2);
const flags = Object.fromEntries(argv.filter(a => a.startsWith('--')).map(a => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : true]; }));
const pos = argv.filter(a => !a.startsWith('--'));
const DIR = process.env.SKY_TASTE_DIR || join(homedir(), '.config/sky-skills');
const LOG = flags.file || join(DIR, 'taste.jsonl');
const LEGACY = flags.file ? [] : [{ path: join(DIR, 'graphite-taste.jsonl'), style: 'graphite' }];

// every skills/<x>/assets/taste-profile.js next to this skill
export function loadProfiles(root = SKILLS) {
  const out = {};
  for (const d of readdirSync(root, { withFileTypes: true })) {
    if (!d.isDirectory() && !d.isSymbolicLink()) continue;
    const p = join(root, d.name, 'assets/taste-profile.js');
    if (!existsSync(p)) continue;
    const prof = require(p);
    out[prof.style] = { engine: Core.create(prof), dir: join(root, d.name) };
  }
  return out;
}

function readLog(path, style) {
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8').split('\n').filter(Boolean).map((l, i) => {
    let e; try { e = JSON.parse(l); } catch { throw new Error(`${path}:${i + 1} is not JSON`); }
    return style && e.style == null ? { ...e, style, scene: e.scene ?? null } : e;
  });
}

// All events, with other styles' events given their shared part (annotate) so the
// engine can read them without knowing those styles.
export function loadEvents(profiles, own) {
  const all = [...LEGACY.flatMap(l => readLog(l.path, l.style)), ...readLog(LOG, null)];
  return all.map(e => {
    if (e.style == null) return { ...e, style: own };
    if (e.style !== own && !e.shared && !e.sdir && profiles[e.style]) return profiles[e.style].engine.annotate(e);
    return e;
  });
}

function append(engine, events) {
  mkdirSync(dirname(LOG), { recursive: true });
  const ts = new Date().toISOString(), scene = flags.scene && flags.scene !== true ? flags.scene : undefined;
  appendFileSync(LOG, events.map(e => JSON.stringify(engine.annotate({ ts, ...(scene ? { scene } : {}), ...e }))).join('\n') + '\n');
  return events.length;
}

const fmt = v => (typeof v === 'number' ? String(v) : JSON.stringify(v));
const opts = () => (flags.scene && flags.scene !== true ? { scene: flags.scene } : {});

function show(T, events) {
  const t = T.estimate(events, undefined, opts());
  const mine = events.filter(e => e.style === T.style).length;
  console.log(`log: ${LOG} · style ${T.style}${t.scene ? ' · scene ' + t.scene : ''} · ${mine} own events, ${events.length - mine} from other styles`);
  for (const [k, K] of Object.entries(T.KNOBS)) {
    const v = t.knobs[k], moved = v !== K.def;
    const lim = [t.constraints.min[k] != null ? `≥${t.constraints.min[k]}` : '', t.constraints.max[k] != null ? `≤${t.constraints.max[k]}` : ''].filter(Boolean).join(' ');
    const styleV = t.style ? `  style ${t.style.knobs[k]}` : '';
    console.log(`  ${k.padEnd(13)} ${String(v).padStart(6)}  ${moved ? '(house ' + K.def + ')' : '       house'}${styleV}  evidence ${t.evidence[k]}${lim ? '  constraint ' + lim : ''}  ${K.zh}`);
  }
  for (const [c, C] of Object.entries(T.CATS)) console.log(`  ${c.padEnd(13)} ${String(t.cats[c]).padStart(6)}  ${C.zh}`);
}

function explain(T, events, only) {
  const t = T.estimate(events, undefined, opts());
  for (const k of Object.keys(T.KNOBS)) {
    if (only && k !== only) continue;
    const tr = t.trace[k];
    console.log(`${k} = ${t.knobs[k]}  (house ${T.KNOBS[k].def}${t.style ? ', style ' + t.style.knobs[k] : ''}, ${tr.length} events)`);
    for (const s of tr) console.log(`    ${s.ts.slice(0, 10)} ${s.kind.padEnd(6)} x=${s.x} w=${s.w}  ${s.from} → ${s.to}  ${s.style ? '[from ' + s.style + '] ' : ''}${s.scene ? '[scene ' + s.scene + '] ' : ''}${s.note}`);
    if (t.constraints.min[k] != null || t.constraints.max[k] != null) console.log(`    constraint min ${t.constraints.min[k] ?? '-'} max ${t.constraints.max[k] ?? '-'}`);
  }
}

function suggest(T, P, events) {
  const t = T.estimate(events, undefined, opts()), a = T.apply(t);
  if (flags.json) return console.log(JSON.stringify({ ...a, stamp: T.stampOf(t) }, null, 1));
  const prof = T.profile;
  if (prof.describe) {
    const req = p => require(join(P.dir, 'assets', p));
    for (const line of prof.describe(a, req, flags)) console.log(line);
  } else console.log(JSON.stringify(a, null, 1));
  if (!flags.css && !flags.js) console.log(`  data-taste  ${T.stampOf(t)}`);
}

// check_objective.mjs prints "  ❌ O4 手机上图里的字:…". Only O4 maps to a knob:
// labels too small on a phone -> a floor on labelSize (a constraint, not a taste).
// A critic verdict is free text; its issues go through the word list at review weight.
function ingest(T, events, file) {
  const txt = readFileSync(file, 'utf8');
  const from = flags.from || (/O[1-5]/.test(txt) && /通过|失败/.test(txt) ? 'objective' : 'critic');
  const out = [];
  const label = T.SHARED.labelSize;
  if (from === 'objective') {
    const cur = T.estimate(events).knobs[label];
    for (const line of txt.split('\n')) {
      if (!/❌/.test(line)) continue;
      if (/O4/.test(line) && label) out.push({ kind: 'constraint', min: { [label]: Math.min(T.KNOBS[label].max, cur + 2) }, note: 'check_objective O4: ' + line.trim().slice(0, 120), source: 'check_objective' });
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

async function ref(T, files) {
  if (!files.length) { console.error('usage: ref <picture> [picture …]'); return 2; }
  if (!T.profile.fromMeasure) { console.error(`${T.style} has no fromMeasure() in its taste-profile.js — it cannot learn from pictures`); return 1; }
  const { measure } = await import('./measure.mjs');
  const ms = await measure(files);
  const evs = [];
  for (const m of ms) {
    // fromMeasure may also name a category (e.g. which colouring scheme); split the two
    const raw = T.profile.fromMeasure(m), knobs = {}, cat = {};
    for (const [k, v] of Object.entries(raw)) { if (T.KNOBS[k]) knobs[k] = v; else if (T.CATS[k]) cat[k] = v; }
    console.log(`${m.file}: empty paper ${Math.round(m.whitespace * 100)}% · colours ${m.colors}${m.hues.length ? ' (' + m.hues.join('°, ') + '°)' : ''} · ink tones ${m.tones.map(x => Math.round(x * 100) + '%').join(' ')} · soft edges ${Math.round(m.soft * 100)}%`);
    console.log(`    → ${Object.keys(raw).length ? fmt(raw) : 'nothing this style can use'}`);
    if (Object.keys(raw).length) evs.push({ kind: 'ref', knobs, ...(Object.keys(cat).length ? { cat } : {}), note: 'ref ' + m.file.split('/').pop(), source: 'ref' });
  }
  if (evs.length) append(T, evs);
  console.log(`recorded ${evs.length} reference${evs.length === 1 ? '' : 's'} (each weighs ${Core.WEIGHT.ref}, like keeping one figure)`);
  return 0;
}

async function main() {
  if (flags['self-test']) { const { selfTest } = await import('./selftest.mjs'); return selfTest(); }
  const profiles = loadProfiles();
  const cmd = pos[0] || 'show';
  if (cmd === 'styles') { for (const [s, p] of Object.entries(profiles)) console.log(`${s.padEnd(10)} ${Object.keys(p.engine.KNOBS).length} knobs · scenes ${p.engine.SCENES.map(x => x.id || x).join(' / ') || '-'} · ${p.dir}`); return 0; }
  if (cmd === 'reset') {
    if (!flags.yes) { console.error('reset renames the log; add --yes'); return 2; }
    if (existsSync(LOG)) { const to = LOG + '.' + new Date().toISOString().replace(/[:.]/g, '-') + '.bak'; renameSync(LOG, to); console.log('old log kept at ' + to); }
    return 0;
  }
  const style = flags.style;
  if (!style || style === true || !profiles[style]) {
    console.error(`--style=<name> is required; known: ${Object.keys(profiles).join(', ') || '(none found)'}`); return 2;
  }
  const P = profiles[style], T = P.engine;
  if (flags.scene && flags.scene !== true && T.SCENES.length && !T.SCENES.some(s => (s.id || s) === flags.scene)) {
    console.error(`unknown scene ${flags.scene}; ${style} has: ${T.SCENES.map(s => s.id || s).join(', ')}`); return 2;
  }
  const ev = loadEvents(profiles, style);
  switch (cmd) {
    case 'show': show(T, ev); return 0;
    case 'explain': explain(T, ev, pos[1]); return 0;
    case 'suggest': suggest(T, P, ev); return 0;
    case 'ab': {
      const q = T.ab(ev, undefined, opts());
      if (flags.json) console.log(JSON.stringify(q));
      else console.log(`ask about: ${q.knob} (${q.label.zh} / ${q.label.en})\n  A = ${q.values[0]}\n  B = ${q.values[1]}\nDraw the same figure twice with these values, show both, then:\n  node taste.mjs --style=${style}${flags.scene && flags.scene !== true ? ' --scene=' + flags.scene : ''} pick ${q.knob} <winner> <loser> "<what they said>"`);
      return 0;
    }
    case 'pick': {
      const [, k, w, l, ...note] = pos;
      if (!T.KNOBS[k] || isNaN(+w) || isNaN(+l)) { console.error('usage: pick <knob> <winner value> <loser value> [note]'); return 2; }
      append(T, [T.pick(k, +w, +l, note.join(' '))]); show(T, loadEvents(profiles, style)); return 0;
    }
    case 'say': {
      const e = T.say(pos.slice(1).join(' '));
      if (!Object.keys(e.dir).length && !Object.keys(e.cat).length) { console.log(`no known words in that — nothing recorded. Words it knows: ${style}'s taste-profile.js LEXICON`); return 1; }
      append(T, [e]); console.log(`heard: ${e.hits.join(', ')} → ${fmt(e.dir)} ${Object.keys(e.cat).length ? fmt(e.cat) : ''}`); return 0;
    }
    case 'keep': case 'drop': {
      let knobs; try { knobs = JSON.parse(pos[1]); } catch { console.error(`usage: ${cmd} '{"knob":value}' [note]`); return 2; }
      append(T, [{ kind: cmd, knobs, note: pos.slice(2).join(' ') }]); return 0;
    }
    case 'ref': return ref(T, pos.slice(1));
    case 'ingest': {
      const e = ingest(T, ev, pos[1]);
      if (!e.length) { console.log('nothing in that file maps to a knob — nothing recorded'); return 0; }
      append(T, e); e.forEach(x => console.log(`  ${x.kind} ${x.min ? 'min ' + fmt(x.min) : fmt(x.dir || {})}  ${x.note}`)); return 0;
    }
    case 'import': {
      const e = readLog(pos[1], null).map(x => T.annotate(x.style == null ? { ...x, style } : x));
      mkdirSync(dirname(LOG), { recursive: true });
      appendFileSync(LOG, e.map(x => JSON.stringify(x)).join('\n') + (e.length ? '\n' : ''));
      console.log(`imported ${e.length} events from ${pos[1]}`); return 0;
    }
    default: console.error('unknown command ' + cmd); return 2;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then(code => process.exit(code), err => { console.error(err.message); process.exit(1); });
}
