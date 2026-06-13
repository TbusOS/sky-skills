// regression-gate.mjs — the held-out anti-overfit gate for design-evolve
// (component 09). A self-evolution round changes a generator's rules/templates
// to lift ONE target page. This gate guards the rest: it re-scores every
// existing canonical of the skill and rejects the change if ANY page regressed.
//
// Without this, the ratchet overfits — a rule that flatters the target page can
// silently degrade five others, and a single-page score would never notice
// (autoresearch §"immutable harness" + the SPIN bound: the system can't get
// better than the evaluator can discriminate, so the evaluator must watch the
// whole held-out set, not just the page under optimization).
//
// The gate uses the MECHANICAL evaluator only (visual-audit.mjs error+warning
// counts) because that is deterministic and ungameable-by-prose; the LLM-critic
// part is too noisy for an automatic regression assertion and stays human-read.
//
// Usage:
//   node regression-gate.mjs --baseline --skill=<s> [--theme=dark|light]
//        → record current error/warning counts for every canonical of <skill>
//   node regression-gate.mjs --check --skill=<s> [--theme=dark|light]
//        → re-run, compare to baseline; exit 1 if any page regressed
//
// Exit: 0 clean / baseline written, 1 regression detected, 2 bad CLI.

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import process from 'node:process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../..');
const AUDIT = resolve(__dirname, 'visual-audit.mjs');
const VALID_SKILLS = ['anthropic', 'apple', 'ember', 'sage', 'glass'];

function parseArgs(argv) {
  const out = {};
  for (const a of argv) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
    else if (a.startsWith('--')) out[a.slice(2)] = true;
  }
  return out;
}

const HELP = `regression-gate.mjs — held-out anti-overfit gate (component 09)

  --baseline --skill=<anthropic|apple|ember|sage|glass> [--theme=dark|light]
       record error/warning counts for every canonical of the skill
  --check --skill=<s> [--theme=dark|light]
       re-run and FAIL (exit 1) if any canonical gained errors/warnings

Mechanical evaluator only (visual-audit.mjs counts) — deterministic, so a
regression is a real signal, not critic noise.`;

function baselinePath(skill) {
  return resolve(REPO_ROOT, `skills/design-review/evolution/regression-baseline.${skill}.json`);
}

async function canonicalPages(skill) {
  const dir = resolve(REPO_ROOT, `skills/${skill}-design/references/canonical`);
  if (!existsSync(dir)) return [];
  const files = await readdir(dir);
  return files.filter((f) => f.endsWith('.html')).sort()
    .map((f) => ({ name: f.replace(/\.html$/, ''), path: resolve(dir, f) }));
}

// Run visual-audit on one page; return {errors, warnings}. visual-audit prints
// a summary line:  "visual-audit: N error(s), M warning(s)  (path)".
function audit(htmlPath, theme) {
  return new Promise((res) => {
    const args = [AUDIT];
    if (theme) args.push(`--theme=${theme}`);
    args.push(htmlPath);
    execFile('node', args, { cwd: REPO_ROOT, maxBuffer: 32 * 1024 * 1024 }, (err, stdout) => {
      const out = (stdout || '') + (err && err.stdout ? err.stdout : '');
      // Two summary shapes: "visual-audit: OK" (0/0) or
      // "visual-audit: N error(s), M warning(s)".
      const m = out.match(/visual-audit:\s*(\d+)\s*error\(s\),\s*(\d+)\s*warning\(s\)/);
      if (m) { res({ errors: +m[1], warnings: +m[2], ok: true }); return; }
      if (/visual-audit:\s*OK\b/.test(out)) { res({ errors: 0, warnings: 0, ok: true }); return; }
      res({ errors: -1, warnings: -1, ok: false });
    });
  });
}

async function scoreAll(skill, theme) {
  const pages = await canonicalPages(skill);
  const result = {};
  for (const p of pages) {
    process.stderr.write(`  auditing ${skill}/${p.name}…\r`);
    result[p.name] = await audit(p.path, theme);
  }
  process.stderr.write(' '.repeat(40) + '\r');
  return result;
}

async function baseline(skill, theme) {
  const scores = await scoreAll(skill, theme);
  const path = baselinePath(skill);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify({ skill, theme: theme || 'default', scores }, null, 2) + '\n', 'utf-8');
  const n = Object.keys(scores).length;
  console.log(`baseline recorded for ${skill}: ${n} canonical(s) → ${path.replace(REPO_ROOT + '/', '')}`);
  return 0;
}

async function check(skill, theme) {
  const path = baselinePath(skill);
  if (!existsSync(path)) {
    console.error(`no baseline for ${skill}; run --baseline first`); return 2;
  }
  const base = JSON.parse(await readFile(path, 'utf-8')).scores;
  const now = await scoreAll(skill, theme);
  const regressions = [];
  for (const [page, b] of Object.entries(base)) {
    const n = now[page];
    if (!n || !n.ok) { regressions.push(`${page}: page no longer audits cleanly (was e${b.errors}/w${b.warnings})`); continue; }
    if (n.errors > b.errors) regressions.push(`${page}: errors ${b.errors} → ${n.errors}`);
    if (n.warnings > b.warnings) regressions.push(`${page}: warnings ${b.warnings} → ${n.warnings}`);
  }
  if (regressions.length) {
    console.log(`✗ regression-gate FAILED for ${skill} — ${regressions.length} regression(s):`);
    for (const r of regressions) console.log(`    ${r}`);
    return 1;
  }
  console.log(`✓ regression-gate clean for ${skill}: no canonical lost ground (${Object.keys(base).length} checked)`);
  return 0;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) { console.log(HELP); return 0; }
  if (!VALID_SKILLS.includes(args.skill)) {
    console.error(`--skill must be one of: ${VALID_SKILLS.join(', ')}`); return 2;
  }
  const theme = args.theme;
  if (args.baseline) return baseline(args.skill, theme);
  if (args.check) return check(args.skill, theme);
  console.log(HELP);
  return 2;
}

main().then((c) => process.exit(c));
