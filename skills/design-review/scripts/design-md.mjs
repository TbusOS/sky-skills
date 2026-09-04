// design-md.mjs — read a project's DESIGN.md and say what it means.
//
// A project that uses these skills makes decisions the skills cannot guess:
// which of the nine languages it writes in, which findings it has looked at and
// decided to live with, and what it is actually trying to sound like. Today
// those decisions live in someone's head, so every run re-argues the same
// warnings and the taste critics judge the page against a demo about a fictional
// notebook app rather than against this project's intent.
//
// The obvious way to fix that is a prose file. That is also the thing this repo
// exists to argue against, so the machine-readable half is a strict schema with
// a validator, and the prose half is passed to the critics rather than to a
// parser.
//
// Shape:
//
//   ---
//   skill: anthropic
//   waivers:
//     - check: visual-audit:figure-no-caption
//       reason: the figures here are section headers; a caption repeats the h2
//       until: 2026-12-31
//   ---
//
//   # Design decisions for <project>
//   ...prose the critics read...
//
// A waiver DOWNGRADES an error to a warning. It never silences one. Something
// you have decided to live with is still something the next person should see,
// and a mute button is how a check quietly stops meaning anything.
//
// Usage:
//   node design-md.mjs --check [path]     validate, exit 1 on a problem
//   node design-md.mjs --json  [path]     machine-readable
//   node design-md.mjs --explain [path]   what it changes about a run
//   node design-md.mjs --flags   [path]   tab-separated, for bin/design-review

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..', '..');

export const SKILLS = ['anthropic', 'apple', 'atelier', 'eclat', 'ember',
                       'glass', 'lectern', 'primer', 'sage'];

// The check ids a waiver may name. visual-audit's are read out of its source so
// this list cannot drift from the checks that actually exist — a waiver for a
// check that was renamed should fail loudly, not sit there doing nothing.
export function knownChecks() {
  const out = new Set();
  try {
    const src = readFileSync(join(REPO_ROOT, 'skills/design-review/scripts/visual-audit.mjs'), 'utf-8');
    for (const m of src.matchAll(/kind:\s*'([a-z0-9-]+)'/g)) out.add(`visual-audit:${m[1]}`);
  } catch { /* running outside the repo: fall back to the fixed ids below */ }
  for (const k of ['console-error', 'new-violation', 'stale-inert',
                   'dead-control', 'broken-anchor', 'revealed-overlap']) {
    out.add(`interaction:${k}`);
  }
  // axe rule ids are axe-core's, not ours, so any well-formed slug is accepted.
  return out;
}

const isAxe = (id) => /^axe:[a-z0-9-]+$/.test(id);

// A deliberately small YAML subset: scalars and a list of maps, two levels, no
// anchors, no flow style, no multi-line scalars. Anything outside it is an
// error rather than a guess, because a config silently misread is worse than a
// config rejected.
function parseFrontMatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!m) return { data: {}, body: text, problems: [] };
  const problems = [];
  const data = {};
  let listKey = null;
  let item = null;
  const lines = m[1].split(/\r?\n/);
  lines.forEach((raw, i) => {
    const ln = i + 1;
    if (!raw.trim() || raw.trim().startsWith('#')) return;
    const indent = raw.length - raw.trimStart().length;
    const line = raw.trim();

    if (indent === 0) {
      if (item && listKey) { data[listKey].push(item); item = null; }
      listKey = null;
      const kv = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
      if (!kv) { problems.push(`line ${ln}: expected "key: value", got ${JSON.stringify(line)}`); return; }
      const [, key, val] = kv;
      if (val === '') { listKey = key; data[key] = []; }
      else data[key] = stripQuotes(val);
      return;
    }
    if (line.startsWith('- ')) {
      if (!listKey) { problems.push(`line ${ln}: a list item with no key above it`); return; }
      if (item) data[listKey].push(item);
      item = {};
      const kv = /^-\s+([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
      if (!kv) { problems.push(`line ${ln}: expected "- key: value"`); return; }
      item[kv[1]] = stripQuotes(kv[2]);
      return;
    }
    const kv = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
    if (!kv) { problems.push(`line ${ln}: expected "key: value", got ${JSON.stringify(line)}`); return; }
    if (!item) { problems.push(`line ${ln}: indented key outside a list item`); return; }
    item[kv[1]] = stripQuotes(kv[2]);
  });
  if (item && listKey) data[listKey].push(item);
  return { data, body: text.slice(m[0].length), problems };
}

const stripQuotes = (s) => s.replace(/^(['"])([\s\S]*)\1$/, '$2').trim();

const TOP_KEYS = new Set(['skill', 'waivers']);
const WAIVER_KEYS = new Set(['check', 'reason', 'until']);

export function load(file) {
  const problems = [];
  if (!existsSync(file)) return { found: false, skill: null, waivers: [], body: '', problems };
  const text = readFileSync(file, 'utf-8');
  const { data, body, problems: parseProblems } = parseFrontMatter(text);
  problems.push(...parseProblems);

  for (const k of Object.keys(data)) {
    if (!TOP_KEYS.has(k)) problems.push(`unknown key "${k}" — expected one of: ${[...TOP_KEYS].join(', ')}`);
  }

  let skill = null;
  if (data.skill !== undefined) {
    if (typeof data.skill !== 'string' || !SKILLS.includes(data.skill)) {
      problems.push(`skill: "${data.skill}" is not one of ${SKILLS.join(' / ')}`);
    } else skill = data.skill;
  }

  const known = knownChecks();
  const today = new Date().toISOString().slice(0, 10);
  const waivers = [];
  const raw = Array.isArray(data.waivers) ? data.waivers : [];
  if (data.waivers !== undefined && !Array.isArray(data.waivers)) {
    problems.push('waivers: must be a list of "- check: … / reason: …" items');
  }
  raw.forEach((w, i) => {
    const at = `waiver ${i + 1}`;
    for (const k of Object.keys(w)) {
      if (!WAIVER_KEYS.has(k)) problems.push(`${at}: unknown key "${k}"`);
    }
    if (!w.check) { problems.push(`${at}: no check named`); return; }
    if (!w.reason || w.reason.length < 12) {
      // The reason is what makes a waiver reviewable instead of a mute button.
      problems.push(`${at} (${w.check}): needs a reason, written out — "${w.reason || ''}" is not one`);
    }
    if (!isAxe(w.check) && !known.has(w.check)) {
      problems.push(`${at}: "${w.check}" is not a check this repo has. ` +
        'Ids look like visual-audit:<kind>, axe:<rule>, interaction:<kind>.');
    }
    if (w.until !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(w.until)) problems.push(`${at}: until must be YYYY-MM-DD`);
      else if (w.until < today) problems.push(`${at} (${w.check}): expired on ${w.until} — decide again or extend it`);
    }
    waivers.push({ check: w.check, reason: w.reason || '', until: w.until || null });
  });

  return { found: true, file, skill, waivers, body: body.trim(), problems };
}

// Look for DESIGN.md next to the page, then upward to the repo root: a project
// with several sites keeps one file per site rather than one for all of them.
export function find(fromPath, root = REPO_ROOT) {
  let dir = resolve(dirname(fromPath));
  const stop = resolve(root);
  for (;;) {
    const p = join(dir, 'DESIGN.md');
    if (existsSync(p)) return p;
    if (dir === stop || dir === dirname(dir)) return null;
    dir = dirname(dir);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const mode = args.find((a) => a.startsWith('--')) || '--explain';
  const target = args.find((a) => !a.startsWith('--'));
  const file = target
    ? (target.endsWith('DESIGN.md') ? resolve(target) : find(resolve(target)))
    : join(process.cwd(), 'DESIGN.md');

  if (!file) {
    console.log('no DESIGN.md found — the checks run with their defaults, which is fine.');
    process.exit(0);
  }
  const r = load(file);
  if (mode === '--json') { console.log(JSON.stringify(r, null, 2)); process.exit(r.problems.length ? 1 : 0); }

  // Tab-separated lines for bin/design-review to read. Deliberately dumb: one
  // record per line, no quoting rules to get wrong on either side.
  if (mode === '--flags') {
    console.log(`file\t${file}`);
    if (r.skill) console.log(`skill\t${r.skill}`);
    for (const w of r.waivers) console.log(`waive\t${w.check}|${w.reason.replace(/[\t\n]/g, ' ')}`);
    for (const p of r.problems) console.log(`problem\t${p}`);
    process.exit(r.problems.length ? 1 : 0);
  }

  console.log(`DESIGN.md · ${file.replace(process.cwd() + '/', '')}`);
  console.log(`  skill    ${r.skill ?? '(not set — the checks auto-detect from the stylesheet link)'}`);
  console.log(`  waivers  ${r.waivers.length}`);
  for (const w of r.waivers) {
    console.log(`    · ${w.check}${w.until ? `  until ${w.until}` : ''}`);
    console.log(`      ${w.reason}`);
  }
  console.log(`  prose    ${r.body ? `${r.body.split(/\n/).length} lines, passed to the taste critics` : '(none)'}`);
  if (r.problems.length) {
    console.log('');
    console.log(`✗ ${r.problems.length} problem(s):`);
    for (const p of r.problems) console.log(`    ${p}`);
    process.exit(1);
  }
  console.log('');
  console.log('✓ DESIGN.md is well formed');
  console.log('  A waiver downgrades an error to a warning. It never hides one.');
}
