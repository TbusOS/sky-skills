// learning-loop.mjs — Harness component 07.
//
// After a critic (solo or multi) produces verdicts, this script
// packages them for the design-learner subagent. The learner reads
// each issue + the current state of known-bugs / visual-audit /
// dos-and-donts, then proposes codifications the user can paste in.
//
// Usage:
//   node skills/design-review/scripts/learning-loop.mjs [options]
//     --verdict=<file>           single critic verdict .md/.json
//     --verdicts-dir=<dir>       directory of verdict files (multi-critic)
//     --target=<html>            the page the verdicts are about (for context)
//     --out=<file>               default: shots/learning-loop-<ts>.md
//
// What it writes is a self-contained prompt for the `design-learner`
// subagent (or any LLM). The learner's output is proposals, not
// automatic edits.
//
// This is the promise: "same bug never caught twice."

import { readFile, writeFile, readdir, stat, mkdir } from 'node:fs/promises';
import { resolve, dirname, basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../..');

function parseArgs(argv) {
  const out = { verdicts: [] };
  for (const a of argv) {
    if (a.startsWith('--verdict=')) out.verdicts.push(a.split('=')[1]);
    else if (a.startsWith('--verdicts-dir=')) out.verdictsDir = a.split('=')[1];
    else if (a.startsWith('--target=')) out.target = a.split('=')[1];
    else if (a.startsWith('--out=')) out.out = a.split('=')[1];
    else if (a === '-h' || a === '--help') out.help = true;
  }
  return out;
}

const HELP = `
learning-loop.mjs — close the feedback loop from critic → codified defense

Usage:
  node skills/design-review/scripts/learning-loop.mjs [options]
    --verdict=<file>          one critic verdict (.md or .json)
    --verdicts-dir=<dir>      directory of verdict files (for multi-critic output)
    --target=<html>           the page being reviewed (for context)
    --out=<file>              where to write the learner prompt (default stdout)

Output: a self-contained prompt for the design-learner subagent. The
learner proposes known-bugs rows + visual-audit checks + dos-and-donts
entries for the user to review + paste in.

Examples:
  # single critic run
  node skills/design-review/scripts/learning-loop.mjs \\
    --verdict=shots/critic-HARNESS-ROADMAP-xxx.md \\
    --target=docs/HARNESS-ROADMAP.html \\
    --out=shots/learn-HARNESS.md

  # multi-critic (4 specialist verdicts together)
  node skills/design-review/scripts/learning-loop.mjs \\
    --verdicts-dir=shots/ --target=docs/HARNESS-ROADMAP.html
`;

async function safeRead(path) {
  try { return await readFile(path, 'utf-8'); } catch { return null; }
}

async function safeMkdir(path) {
  try { await mkdir(path, { recursive: true }); } catch {}
}

function fence(lang, body) { return '```' + lang + '\n' + (body || '') + '\n```'; }

async function discoverVerdicts(dir, targetBase) {
  // Find files matching multi-critic output pattern, preferring ones
  // whose name contains targetBase if given.
  const full = resolve(REPO_ROOT, dir);
  const names = await readdir(full);
  // Match any file starting with multi-critic- (specialist verdicts or
  // single-critic outputs). Prefer same-basename files.
  const matches = names.filter(n =>
    (n.startsWith('multi-critic-') || n.startsWith('critic-') || n.startsWith('verdict-')) &&
    (n.endsWith('.md') || n.endsWith('.json'))
  );
  const preferred = targetBase
    ? matches.filter(n => n.includes(targetBase))
    : matches;
  const chosen = preferred.length ? preferred : matches;
  // Most recent first — we look at filenames since they carry timestamps.
  chosen.sort().reverse();
  // Take the latest 6 (4 specialists + aggregator + maybe one solo).
  return chosen.slice(0, 6).map(n => join(dir, n));
}

function buildLearnerPrompt({ agentSpec, verdictBodies, target, knownBugs, visualAudit, crossRules, skillDosDonts }) {
  return `<!-- learning-loop prompt · target=${target || '(unspecified)'} -->

# System prompt · design-learner

${agentSpec}

---

# User prompt

Please read the critic verdicts below and propose codifications —
new known-bugs rows, new visual-audit checks, and per-skill dos-and-donts
entries. Dedup aggressively: one bug class per row, even if multiple
verdicts raised the same issue.

## Target page

\`${target || '(not provided)'}\`

## Critic verdict(s)

${verdictBodies.map((body, i) => `### Verdict ${i + 1}\n\n${fence('markdown', body.slice(0, 50000))}`).join('\n\n')}

## Current state — known-bugs.md

${fence('markdown', knownBugs || '(not found)')}

## Current state — visual-audit.mjs (head — check patterns + SKILL_SIGNATURES)

${fence('js', visualAudit ? visualAudit.slice(0, 20000) : '(not found)')}

## Current state — cross-skill-rules.md

${fence('markdown', crossRules ? crossRules.slice(0, 15000) : '(not found)')}

${skillDosDonts ? `## Current state — relevant dos-and-donts\n\n${fence('markdown', skillDosDonts.slice(0, 15000))}` : ''}

---

**Produce your 3-section proposal now** (known-bugs / visual-audit /
dos-and-donts), followed by the Summary. Dedup. Cite verdict source.
Do NOT apply anything automatically — proposals only.
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { console.log(HELP); return 0; }
  if (args.verdicts.length === 0 && !args.verdictsDir) {
    console.error('must pass --verdict=<file> (repeatable) OR --verdicts-dir=<dir>');
    console.error(HELP);
    return 2;
  }

  // Collect verdict file paths.
  const verdictPaths = [...args.verdicts];
  if (args.verdictsDir) {
    const targetBase = args.target ? basename(args.target, '.html') : '';
    const discovered = await discoverVerdicts(args.verdictsDir, targetBase);
    verdictPaths.push(...discovered);
  }
  if (verdictPaths.length === 0) {
    console.error(`no verdict files found`);
    return 1;
  }

  // Read each.
  const verdictBodies = [];
  for (const p of verdictPaths) {
    const body = await safeRead(resolve(REPO_ROOT, p));
    if (body) verdictBodies.push(body);
    else console.error(`skipping unreadable ${p}`);
  }
  if (verdictBodies.length === 0) {
    console.error('no verdict bodies readable');
    return 1;
  }

  // Load reference state.
  const agentSpec = await safeRead(resolve(REPO_ROOT, '.claude/agents/design-learner.md')) || '(agent spec not found)';
  const knownBugs = await safeRead(resolve(REPO_ROOT, 'skills/design-review/references/known-bugs.md'));
  const visualAudit = await safeRead(resolve(REPO_ROOT, 'skills/design-review/scripts/visual-audit.mjs'));
  const crossRules = await safeRead(resolve(REPO_ROOT, 'skills/design-review/references/cross-skill-rules.md'));

  // If target is given, try to infer skill → load its dos-and-donts.
  let skillDosDonts = null;
  if (args.target) {
    const skillMatch = args.target.match(/skills\/([a-z]+)-design/);
    if (skillMatch) {
      skillDosDonts = await safeRead(resolve(REPO_ROOT, `skills/${skillMatch[1]}-design/references/dos-and-donts.md`));
    }
  }

  const prompt = buildLearnerPrompt({
    agentSpec, verdictBodies, target: args.target,
    knownBugs, visualAudit, crossRules, skillDosDonts,
  });

  const outDir = 'shots';
  await safeMkdir(resolve(REPO_ROOT, outDir));
  const ts = new Date().toISOString().replace(/[-:]/g, '').split('.')[0].replace('T', '-');
  const base = args.target ? basename(args.target, '.html') : 'learning-loop';
  const outPath = args.out || join(outDir, `learning-loop-${base}-${ts}.md`);

  await writeFile(resolve(REPO_ROOT, outPath), prompt, 'utf-8');
  console.error(`wrote learner prompt → ${outPath} (${prompt.length} chars, ${verdictBodies.length} verdict(s) included)`);
  console.error('next: in Claude Code, Task(subagent_type="design-learner", prompt=contents-of-prompt)');
  console.log(outPath);
  return 0;
}

main().then((code) => process.exit(code));
