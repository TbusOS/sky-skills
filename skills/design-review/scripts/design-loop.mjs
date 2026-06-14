// design-loop.mjs — deterministic driver for /design-loop (harness component 06).
//
// /design-loop is agent-orchestrated: the model generates the page and dispatches
// the critic subagents. But the BOOKKEEPING must not be left to prose-following —
// the round counter, the ≥88 ship gate, the escalate-at-max rule, the .loop.log,
// and the deposit-on-ship into the corpus are exactly the parts a model "rounds
// off" when tired. This driver owns those so they are mechanical, not vibes.
//
// The agent calls:
//   --init   --skill --page --file --brief    once, at round 1 (pulls the contract)
//   --record --file --round --score --gates   after each round's gates + critic
//   --status --file                           inspect trajectory
//
// The .loop.log next to the HTML is the single source of truth (human-readable +
// machine-parseable via a meta header). On a ≥88 ship the driver deposits the
// page into corpus/<skill>/<page>/ to feed library-grower (component 08).
//
// Exit: 0 OK, 1 error, 2 bad CLI. --record prints the decision the agent must obey
// and encodes it in the exit-ish via a DECISION: line (ship|revise|fix|escalate).

import { readFile, writeFile, appendFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import process from 'node:process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../..');
const SHIP_MIN = 88;
const DEFAULT_MAX = 5;

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

const HELP = `design-loop.mjs — deterministic driver for /design-loop (component 06)

  --init --skill=<s> --page=<p> --file=<html> [--brief="…"] [--max-rounds=${DEFAULT_MAX}]
       create <html>.loop.log, pull the sprint contract, set the round counter to 1
  --record --file=<html> --round=<n> --score=<n> --gates=<pass|fail>
       [--critic=solo|multi] [--issues="i1; i2; …"]
       log the round and print the binding DECISION: fix | revise | ship | escalate
  --status --file=<html>
       print the score trajectory and where the loop stands

The driver owns the ≥${SHIP_MIN} ship gate, the round counter, escalate-at-max, the
.loop.log, and deposit-on-ship into corpus/. The agent owns generation + critics.`;

function logPath(htmlPath) { return resolve(htmlPath) + '.loop.log'; }

function parseLog(text) {
  const meta = {};
  const mh = text.match(/<!--\s*loop-meta\s+([^>]*?)-->/);
  if (mh) for (const kv of mh[1].trim().split(/\s+/)) {
    const [k, v] = kv.split('=');
    meta[k] = v;
  }
  // One logical round can have several "## Round N" blocks (a gate-fail retry
  // then the passing pass). Collapse by round number, keeping the latest
  // non-null score/verdict so the trajectory and count reflect rounds, not
  // gate retries.
  const byN = new Map();
  for (const part of text.split(/^##\s*Round\s*/m).slice(1)) {
    const nm = part.match(/^(\d+)/);
    if (!nm) continue;
    const n = +nm[1];
    const sm = part.match(/score\s+(\d+)/i);
    const vm = part.match(/verdict\s+(ship|revise|fix|escalate)/i);
    const prev = byN.get(n);
    byN.set(n, {
      n,
      score: sm ? +sm[1] : (prev ? prev.score : null),
      verdict: vm ? vm[1].toLowerCase() : (prev ? prev.verdict : null),
    });
  }
  return { meta, rounds: [...byN.values()].sort((a, b) => a.n - b.n) };
}

function deposit(skill, page, htmlPath) {
  return new Promise((res) => {
    const grower = resolve(__dirname, 'library-grower.mjs');
    execFile('node', [grower, '--deposit', `--skill=${skill}`, `--page=${page}`, resolve(htmlPath)],
      { cwd: REPO_ROOT }, (err, stdout, stderr) => res((stdout || '') + (stderr || '')));
  });
}

function runContract(skill, page) {
  return new Promise((res) => {
    const sc = resolve(__dirname, 'sprint-contract.mjs');
    execFile('node', [sc, `--skill=${skill}`, `--page=${page}`, '--format=json'],
      { cwd: REPO_ROOT, maxBuffer: 8 * 1024 * 1024 }, (err, stdout) => {
        try { res(JSON.parse(stdout)); } catch { res(null); }
      });
  });
}

async function init(args) {
  if (!args.skill || !args.page || !args.file) { console.error('--init needs --skill --page --file'); return 2; }
  const max = +(args['max-rounds'] || DEFAULT_MAX);
  const path = logPath(args.file);
  const contract = await runContract(args.skill, args.page);
  const conf = contract ? contract.confidence : 'unknown';
  const shipMin = contract && contract.selfRegressionMin ? contract.selfRegressionMin : SHIP_MIN;
  const header =
    `<!-- loop-meta skill=${args.skill} page=${args.page} max-rounds=${max} ship-min=${shipMin} confidence=${conf} -->\n` +
    `# /design-loop · ${args.skill}-design · ${args.page}${conf === 'low' ? ' (LOW-CONFIDENCE contract)' : ''}\n\n` +
    `- file: ${args.file}\n` +
    `- brief: ${args.brief || '(none recorded)'}\n` +
    `- max-rounds: ${max}  ·  ship bar: ≥ ${shipMin}\n` +
    (contract ? `- contract: ${contract.canonicalMd} · brand ${contract.brand.name} ≥${contract.brand.minCoverage} · gates ${contract.gates.join('/')}\n` : '- contract: (sprint-contract returned no JSON — check --skill/--page)\n') +
    `\n`;
  await writeFile(path, header, 'utf-8');
  console.log(`loop initialized → ${path}`);
  if (conf === 'low') console.log('  contract is LOW-CONFIDENCE — treat structural MUSTs as defaults.');
  console.log(`  round 1: generate per the contract + plan, run the 3 gates, then a critic, then --record.`);
  return 0;
}

async function record(args) {
  if (!args.file || !args.round || !args.gates) { console.error('--record needs --file --round --gates (and --score for a passed gate)'); return 2; }
  const path = logPath(args.file);
  if (!existsSync(path)) { console.error(`no loop log at ${path}; run --init first`); return 1; }
  const text = await readFile(path, 'utf-8');
  const { meta, rounds } = parseLog(text);
  const max = +(meta['max-rounds'] || DEFAULT_MAX);
  const shipMin = +(meta['ship-min'] || SHIP_MIN);
  const round = +args.round;
  if (round > max) { console.error(`round ${round} exceeds max-rounds ${max} — escalate, do not run another round`); return 1; }

  const gatesPass = args.gates === 'pass';
  const score = args.score != null ? +args.score : null;
  const critic = args.critic || 'solo';
  const issues = args.issues || '';

  let decision, carried, shipped = false, escalate = false;
  if (!gatesPass) {
    decision = 'fix';
    carried = 'machine-gate errors still open — fix and re-run gates in THIS round; no critic yet';
  } else if (score == null) {
    console.error('--gates=pass requires --score'); return 2;
  } else if (score >= shipMin) {
    decision = 'ship'; shipped = true;
    carried = 'none — shipped';
  } else if (round >= max) {
    decision = 'escalate'; escalate = true;
    carried = 'rounds exhausted — escalate to a human; do NOT lower the bar or run another round';
  } else {
    decision = 'revise';
    carried = issues ? issues : '(critic issues not captured — re-run critic and record them)';
  }

  const block =
    `## Round ${round}\n` +
    `- Gates:   ${gatesPass ? 'pass' : 'FAIL (errors open)'}\n` +
    (score != null ? `- Critic:  ${critic} · score ${score} · verdict ${decision === 'ship' ? 'ship' : decision === 'escalate' ? 'escalate' : 'revise'}\n` : `- Critic:  (not run — gates not green)\n`) +
    `- Carried: ${carried}\n\n`;
  await appendFile(path, block, 'utf-8');

  // Trajectory for the human-facing decision line.
  const traj = [...rounds.map((r) => `R${r.n} ${r.score ?? '–'}`), `R${round} ${score ?? 'gate-fail'}`].join(' → ');

  if (shipped) {
    const dep = await deposit(meta.skill, meta.page, args.file);
    console.log(`DECISION: ship  (score ${score} ≥ ${shipMin})`);
    console.log(`  trajectory: ${traj}`);
    console.log(`  ${dep.trim()}`);
    console.log(`  report: file=${args.file}, rounds used=${round}`);
  } else if (escalate) {
    console.log(`DECISION: escalate  (round ${round} = max ${max}, best ${score} < ${shipMin})`);
    console.log(`  trajectory: ${traj}`);
    console.log(`  hand to a human with: the trajectory above, unresolved issues, and a plateau hypothesis.`);
    console.log(`  forbidden: lowering the ${shipMin} bar, skipping gates, "one more round", silently shipping.`);
  } else if (decision === 'fix') {
    console.log(`DECISION: fix  (gate errors open in round ${round})`);
    console.log(`  resolve verify.py / visual-audit errors, re-run gates, then --record this round again with --gates=pass.`);
  } else {
    console.log(`DECISION: revise  (score ${score} < ${shipMin}, round ${round} of ${max})`);
    console.log(`  trajectory: ${traj}`);
    console.log(`  carry these verbatim into round ${round + 1}, smallest-scope edits only:`);
    console.log(`    ${carried}`);
  }
  return 0;
}

async function status(args) {
  if (!args.file) { console.error('--status needs --file'); return 2; }
  const path = logPath(args.file);
  if (!existsSync(path)) { console.error(`no loop log at ${path}`); return 1; }
  const { meta, rounds } = parseLog(await readFile(path, 'utf-8'));
  const max = meta['max-rounds'] || DEFAULT_MAX;
  console.log(`/design-loop · ${meta.skill}/${meta.page}  ·  ${rounds.length}/${max} rounds  ·  ship ≥ ${meta['ship-min'] || SHIP_MIN}`);
  console.log('  trajectory: ' + (rounds.length ? rounds.map((r) => `R${r.n} ${r.score ?? '–'}(${r.verdict ?? '?'})`).join(' → ') : '(no rounds yet)'));
  return 0;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) { console.log(HELP); return 0; }
  if (args.init) return init(args);
  if (args.record) return record(args);
  if (args.status) return status(args);
  console.log(HELP);
  return 2;
}

main().then((c) => process.exit(c));
