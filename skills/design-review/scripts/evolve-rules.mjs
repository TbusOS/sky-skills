// evolve-rules.mjs — rule registry + EvolveR success-rate scoring for the
// design harness's accumulated knowledge (dos-and-donts entries, known-bugs
// rows, visual-audit checks). Component 09 (design-evolve) support.
//
// The learning-loop keeps ADDING rules; nothing ever retires them, so the
// catalog drifts toward bloat and over-constraint (the Darwin/EvolveR papers'
// central failure mode). This registry attaches an honesty score to each rule:
//
//   s(rule) = (catches + 1) / (fires + 2)      [Laplace-smoothed, EvolveR §]
//
//   fires   = times the rule/check triggered on a generated page
//   catches = times that trigger corresponded to a REAL regression
//             (a human/critic confirmed the flagged thing was actually wrong)
//
// A rule that fires a lot but rarely catches a real problem (low s) is noise —
// it nags the generator without improving output, and is a prune candidate.
// A rule that never fires on current-gen output is dead weight (the model
// already avoids that mistake) — archive it, don't delete (a future model
// regression can resurrect it).
//
// Usage:
//   node evolve-rules.mjs --register --id=<id> --surface=<dos|known-bug|visual-audit>
//        --text="..." [--skill=<s>]
//   node evolve-rules.mjs --fire=<id> [--catch]        (--catch implies a fire)
//   node evolve-rules.mjs --report [--surface=<s>]
//   node evolve-rules.mjs --lint                       (dedupe + dead-rule scan)
//
// Exit: 0 OK, 1 not-found, 2 bad CLI.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../..');
let REGISTRY = resolve(REPO_ROOT, 'skills/design-review/evolution/rules.json');

// Prune/archive thresholds. A rule is a prune candidate once it has had enough
// chances to prove itself (fires ≥ MIN_FIRES) yet scores below PRUNE_SCORE.
const MIN_FIRES = 5;
const PRUNE_SCORE = 0.34; // ≈ caught <1 in 3 of the times it nagged
const DEAD_FIRES = 0;     // never fired = dead weight (archive, don't delete)

function score(r) { return (r.catches + 1) / (r.fires + 2); }

function parseArgs(argv) {
  const out = {};
  for (const a of argv) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
    else if (a.startsWith('--')) out[a.slice(2)] = true;
  }
  return out;
}

const HELP = `evolve-rules.mjs — rule registry + EvolveR success-rate scoring

  --register --id=<id> --surface=<dos|known-bug|visual-audit> --text="..." [--skill=<s>]
  --fire=<id> [--catch]     record a trigger; --catch marks it a real catch
  --report [--surface=<s>]  table sorted by score; flags prune/dead candidates
  --lint                    near-duplicate detection + dead-rule (never-fired) scan

Score s = (catches+1)/(fires+2). Prune candidate: fires ≥ ${MIN_FIRES} and s < ${PRUNE_SCORE}.
Dead weight: fires = 0 (archive, don't delete — a future regression resurrects it).`;

async function load() {
  if (!existsSync(REGISTRY)) return { rules: [] };
  return JSON.parse(await readFile(REGISTRY, 'utf-8'));
}
async function save(db) {
  await mkdir(dirname(REGISTRY), { recursive: true });
  await writeFile(REGISTRY, JSON.stringify(db, null, 2) + '\n', 'utf-8');
}

function tokens(s) {
  return new Set(String(s || '').toLowerCase().match(/[a-z0-9一-鿿]+/g) || []);
}
function jaccard(a, b) {
  const A = tokens(a), B = tokens(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / (A.size + B.size - inter);
}

async function register(args) {
  if (!args.id || !args.surface || !args.text) {
    console.error('--register needs --id --surface --text'); return 2;
  }
  if (!['dos', 'known-bug', 'visual-audit'].includes(args.surface)) {
    console.error('--surface must be dos | known-bug | visual-audit'); return 2;
  }
  const db = await load();
  if (db.rules.find((r) => r.id === args.id)) {
    console.error(`rule "${args.id}" already registered`); return 1;
  }
  db.rules.push({
    id: args.id, surface: args.surface, skill: args.skill || 'all',
    text: args.text, fires: 0, catches: 0,
    added: args.ts || new Date().toISOString(),
  });
  await save(db);
  console.log(`registered ${args.surface} rule "${args.id}"`);
  return 0;
}

async function fire(id, isCatch) {
  const db = await load();
  const r = db.rules.find((x) => x.id === id);
  if (!r) { console.error(`rule "${id}" not found`); return 1; }
  r.fires += 1;
  if (isCatch) r.catches += 1;
  await save(db);
  console.log(`${id}: fires=${r.fires} catches=${r.catches} s=${score(r).toFixed(3)}`);
  return 0;
}

async function report(args) {
  const db = await load();
  let rules = db.rules;
  if (args.surface) rules = rules.filter((r) => r.surface === args.surface);
  if (!rules.length) { console.log('(no rules registered yet)'); return 0; }
  rules = [...rules].sort((a, b) => score(a) - score(b));
  console.log('evolve-rules report (lowest score first — these earn pruning scrutiny)');
  console.log('  score  fires catch surface       id');
  for (const r of rules) {
    const s = score(r);
    let flag = '';
    if (r.fires === DEAD_FIRES) flag = '  ⚠ dead (never fired — archive)';
    else if (r.fires >= MIN_FIRES && s < PRUNE_SCORE) flag = '  ⚠ prune candidate (nags, rarely right)';
    console.log(`  ${s.toFixed(3)}  ${String(r.fires).padStart(4)} ${String(r.catches).padStart(4)}  ${r.surface.padEnd(12)} ${r.id}${flag}`);
  }
  return 0;
}

async function lint() {
  const db = await load();
  const rules = db.rules;
  if (!rules.length) { console.log('(no rules registered yet)'); return 0; }
  console.log('evolve-rules lint');
  // near-duplicates
  let dupFound = false;
  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      const sim = jaccard(rules[i].text, rules[j].text);
      if (sim >= 0.6) {
        if (!dupFound) { console.log('  near-duplicate rules (consider merging):'); dupFound = true; }
        console.log(`    ${(sim * 100).toFixed(0)}%  ${rules[i].id}  ≈  ${rules[j].id}`);
      }
    }
  }
  if (!dupFound) console.log('  no near-duplicates (≥60% token overlap)');
  // dead rules
  const dead = rules.filter((r) => r.fires === DEAD_FIRES);
  console.log(dead.length ? `  dead (never fired): ${dead.map((r) => r.id).join(', ')}` : '  no dead rules');
  return 0;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.registry) REGISTRY = resolve(args.registry);   // 复用:kernel harness 指向自己的 rules.json (HARNESS-DESIGN §8)
  if (args.help || args.h) { console.log(HELP); return 0; }
  if (args.register) return register(args);
  if (args.fire) return fire(args.fire, !!args.catch);
  if (args.report) return report(args);
  if (args.lint) return lint();
  console.log(HELP);
  return 2;
}

main().then((c) => process.exit(c));
