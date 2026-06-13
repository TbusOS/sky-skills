// evolve-ledger.mjs — the experiment ledger for the self-evolution loop
// (design-evolve, harness component 09). Modeled on Karpathy autoresearch's
// flat results.tsv + analysis.ipynb frontier curve, adapted to design.
//
// Every round of the ratchet appends one row. The ledger is the audit trail of
// what was tried, what scored, and what was kept vs reverted — so a long
// unattended run produces a readable "what actually moved the needle" report
// rather than a pile of commits.
//
// Each experiment mutates ONE generator-skill asset (a dos-and-donts rule, a
// template, a canonical), regenerates a fixed test page, and scores it with the
// FROZEN evaluator. keep iff new beats the locked baseline by a noise margin;
// else the change is git-reverted. The branch tip carries the current best.
//
// Schema (tab-separated, append-only):
//   ts  round  skill  page  axis  change_id  base  new  delta  decision  note
// decision ∈ keep | revert | crash
//
// Usage:
//   node evolve-ledger.mjs --append --skill=sage --page=landing \
//     --axis=composition --change="tighten hero rhythm" \
//     --base=86 --new=89 --decision=keep [--ledger=<path>]
//   node evolve-ledger.mjs --frontier [--skill=sage] [--ledger=<path>]
//   node evolve-ledger.mjs --init
//
// Exit: 0 OK, 2 bad CLI.

import { readFile, writeFile, mkdir, appendFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../..');
const DEFAULT_LEDGER = resolve(REPO_ROOT, 'skills/design-review/evolution/ledger.tsv');
const COLUMNS = ['ts', 'round', 'skill', 'page', 'axis', 'change_id', 'base', 'new', 'delta', 'decision', 'note'];
const HEADER = COLUMNS.join('\t');

function parseArgs(argv) {
  const out = { _: [] };
  for (const a of argv) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
    else if (a.startsWith('--')) out[a.slice(2)] = true;
    else out._.push(a);
  }
  return out;
}

const HELP = `evolve-ledger.mjs — experiment ledger for design-evolve (component 09)

  --init                          create an empty ledger with header
  --append --skill --page --axis --change=<text> --base=<n> --new=<n>
           --decision=<keep|revert|crash> [--round=<n>] [--note=<text>]
                                  append one experiment row (ts auto-stamped*)
  --frontier [--skill=<s>]        print running-best curve + keep-rate + top gains
  --ledger=<path>                 override ledger location (default: ${DEFAULT_LEDGER.replace(REPO_ROOT + '/', '')})

* ts must be passed in via --ts when determinism matters; otherwise the wall
  clock is read once here (the only place the loop reads it).`;

async function ensureLedger(path) {
  if (!existsSync(path)) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, HEADER + '\n', 'utf-8');
    return true;
  }
  return false;
}

async function readRows(path) {
  if (!existsSync(path)) return [];
  const text = await readFile(path, 'utf-8');
  const lines = text.split('\n').filter((l) => l.trim() && !l.startsWith('ts\t'));
  return lines.map((l) => {
    const cells = l.split('\t');
    const row = {};
    COLUMNS.forEach((c, i) => { row[c] = cells[i] ?? ''; });
    return row;
  });
}

function tsv(v) {
  return String(v ?? '').replace(/\t/g, ' ').replace(/\n/g, ' ');
}

async function append(args) {
  const path = args.ledger ? resolve(args.ledger) : DEFAULT_LEDGER;
  await ensureLedger(path);
  const base = Number(args.base);
  const nw = Number(args.new);
  if (!args.skill || !args.page || !args.axis || Number.isNaN(base) || Number.isNaN(nw) || !args.decision) {
    console.error('append needs --skill --page --axis --base --new --decision');
    return 2;
  }
  if (!['keep', 'revert', 'crash'].includes(args.decision)) {
    console.error('--decision must be keep | revert | crash');
    return 2;
  }
  const ts = args.ts || new Date().toISOString();
  const row = [
    ts, args.round ?? '', args.skill, args.page, args.axis,
    args.change_id || args.change || '', base, nw, (nw - base).toFixed(2),
    args.decision, args.note || args.change || '',
  ].map(tsv).join('\t');
  await appendFile(path, row + '\n', 'utf-8');
  console.log(`appended: ${args.skill}/${args.page} ${args.axis} ${base}→${nw} (${args.decision})`);
  return 0;
}

// The frontier: per skill×page, the running-best score over time, plus the
// keep-rate and the biggest single gains — autoresearch's progress.png as text.
async function frontier(args) {
  const path = args.ledger ? resolve(args.ledger) : DEFAULT_LEDGER;
  let rows = await readRows(path);
  if (args.skill) rows = rows.filter((r) => r.skill === args.skill);
  if (!rows.length) { console.log('(ledger empty — no experiments logged yet)'); return 0; }

  const kept = rows.filter((r) => r.decision === 'keep');
  const crashes = rows.filter((r) => r.decision === 'crash');
  const keepRate = ((kept.length / rows.length) * 100).toFixed(0);

  // running best per skill×page
  const groups = new Map();
  for (const r of rows) {
    const k = `${r.skill}/${r.page}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }

  console.log(`evolve-ledger frontier${args.skill ? ' · ' + args.skill : ''}`);
  console.log(`  experiments: ${rows.length}  ·  kept: ${kept.length}  ·  reverted: ${rows.length - kept.length - crashes.length}  ·  crashes: ${crashes.length}  ·  keep-rate: ${keepRate}%`);
  console.log('');
  for (const [k, rs] of [...groups].sort()) {
    const keptHere = rs.filter((r) => r.decision === 'keep');
    const best = keptHere.length ? Math.max(...keptHere.map((r) => Number(r.new))) : NaN;
    const first = Number(rs[0].base);
    const lift = Number.isNaN(best) ? 0 : (best - first);
    console.log(`  ${k.padEnd(22)} baseline ${Number.isFinite(first) ? first : '?'} → best ${Number.isFinite(best) ? best : '?'}  (lift ${lift >= 0 ? '+' : ''}${lift.toFixed(1)}, ${keptHere.length}/${rs.length} kept)`);
  }
  const topGains = [...kept].sort((a, b) => Number(b.delta) - Number(a.delta)).slice(0, 5);
  if (topGains.length) {
    console.log('\n  top kept gains:');
    for (const r of topGains) {
      console.log(`    +${Number(r.delta).toFixed(1)}  ${r.skill}/${r.page} [${r.axis}]  ${r.note}`.slice(0, 110));
    }
  }
  return 0;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) { console.log(HELP); return 0; }
  if (args.init) {
    const path = args.ledger ? resolve(args.ledger) : DEFAULT_LEDGER;
    const created = await ensureLedger(path);
    console.log(created ? `created ${path}` : `ledger already exists at ${path}`);
    return 0;
  }
  if (args.append) return append(args);
  if (args.frontier) return frontier(args);
  console.log(HELP);
  return 2;
}

main().then((c) => process.exit(c));
