// multi-critic.mjs — build prompts for the 4 specialist critics in parallel.
//
// Companion to critic.mjs (single generalist critic). This one splits
// the taste-level gate into 4 orthogonal specialists:
//   - design-composition-critic  (25% weight) — grid / rhythm / §I proportion
//   - design-copy-critic         (25% weight) — voice / buzzword / §G / §J italic
//   - design-illustration-critic (20% weight) — SVG craft / icon / figcaption
//   - design-brand-critic        (30% weight) — typography / color / §H / §K
//
// Each specialist runs in fresh context and scores only its axis 0-100.
// The caller (Claude Code Task tool OR bin/design-review --multi-critic)
// dispatches all 4 in parallel, then aggregates.
//
// Usage:
//   node skills/design-review/scripts/multi-critic.mjs <target.html> \
//       --skill=anthropic --page=feature-deep --out-dir=shots/
//
// Writes four files: multi-critic-<specialist>-<name>-<ts>.md, each a
// self-contained prompt for one specialist. The runtime (Claude Code or
// external LLM caller) feeds each to the matching subagent.
//
// Output: JSON manifest on stdout listing the 4 prompt files + the
// aggregator contract, OR --out-dir writes all 5 to disk.

import { readFile, writeFile, stat, mkdir } from 'node:fs/promises';
import { resolve, dirname, basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../..');

const SPECIALISTS = [
  { name: 'composition',  weight: 0.25, agent: '.claude/agents/design-composition-critic.md' },
  { name: 'copy',         weight: 0.25, agent: '.claude/agents/design-copy-critic.md' },
  { name: 'illustration', weight: 0.20, agent: '.claude/agents/design-illustration-critic.md' },
  { name: 'brand',        weight: 0.30, agent: '.claude/agents/design-brand-critic.md' },
];

function parseArgs(argv) {
  const out = { files: [] };
  for (const a of argv) {
    if (a.startsWith('--skill=')) out.skill = a.split('=')[1];
    else if (a.startsWith('--page=')) out.page = a.split('=')[1];
    else if (a.startsWith('--out-dir=')) out.outDir = a.split('=')[1];
    else if (a === '-h' || a === '--help') out.help = true;
    else if (!a.startsWith('--')) out.files.push(a);
  }
  return out;
}

const HELP = `
multi-critic.mjs — prepare 4 specialist critic prompts in parallel

Usage:
  node skills/design-review/scripts/multi-critic.mjs <target.html>
    [--skill=anthropic|apple|ember|sage]
    [--page=pricing|landing|docs-home|feature-deep]
    [--out-dir=<dir>]          default: shots/

Output:
  - 4 prompt files: multi-critic-{composition,copy,illustration,brand}-<name>-<ts>.md
  - 1 aggregator template: multi-critic-AGGREGATE-<name>-<ts>.md
  - stdout: JSON manifest

Each prompt is self-contained and can be fed to the matching
design-<specialist>-critic subagent via Claude Code's Task tool.
`;

function detectFromPath(path) {
  const norm = path.split('\\').join('/');
  const m = norm.match(/skills\/([a-z]+)-design\/references\/canonical\/([a-z0-9-]+)\.html/);
  if (m) return { skill: m[1], page: m[2] };
  return { skill: null, page: null };
}

async function safeRead(path) {
  try { return await readFile(path, 'utf-8'); } catch { return null; }
}

async function safeMkdir(path) {
  try { await mkdir(path, { recursive: true }); } catch {}
}

function fence(lang, body) { return '```' + lang + '\n' + (body || '') + '\n```'; }

function buildSpecialistPrompt({ specialist, agentSpec, skill, page, target, targetHtml, canonicalHtml, canonicalMd, crossRules, knownBugs, dosDonts, languageRules }) {
  return `<!-- multi-critic · specialist=${specialist.name} · skill=${skill} · page=${page} · target=${target} -->

# System prompt · design-${specialist.name}-critic

${agentSpec}

---

# User prompt

Review the target page below as the **${specialist.name}** specialist.
Stay in your lane — other specialists are reviewing the other axes in
parallel. Score 0-100 on your axis only. Output the JSON verdict first,
then a short narrative.

## Target (\`${target}\`)

${fence('html', targetHtml.slice(0, 100000))}

## Canonical HTML (\`skills/${skill}-design/references/canonical/${page}.html\`)

${fence('html', canonicalHtml.slice(0, 80000))}

## Canonical MD (7 decisions · acceptance rubric)

${fence('markdown', canonicalMd)}

## Cross-skill rules

${fence('markdown', crossRules || '(not found)')}

${dosDonts ? `## ${skill} dos-and-donts\n\n${fence('markdown', dosDonts)}` : ''}

${specialist.name === 'copy' && languageRules ? `## User's language rules (buzzword ban)\n\n${fence('markdown', languageRules)}` : ''}

---

**Produce your ${specialist.name}-only verdict now.** JSON first, then narrative.
`;
}

function buildAggregatorPrompt({ skill, page, target, promptPaths }) {
  return `<!-- multi-critic aggregator · skill=${skill} · page=${page} · target=${target} -->

# Multi-Critic Aggregator

You have 4 specialist verdicts for \`${target}\`:

${SPECIALISTS.map((s, i) => `- **${s.name}** (weight ${(s.weight * 100).toFixed(0)}%) → \`${promptPaths[i]}\``).join('\n')}

## Your job

1. Read each specialist's JSON verdict (not the narrative).
2. Compute the weighted overall score:
   \`overall = 0.25·composition + 0.25·copy + 0.20·illustration + 0.30·brand\`
3. Merge the \`issues\` arrays, tagging each with its source specialist.
4. Produce a unified verdict in the format below.
5. Call out disagreements — if brand says the page is great but
   composition says it's broken, that's a signal worth naming.

## Output format

\`\`\`json
{
  "skill": "${skill}",
  "page_type": "${page}",
  "overall": "pass" | "warn" | "fail",
  "score": 0-100,
  "scores_by_specialist": {
    "composition": 0-100,
    "copy": 0-100,
    "illustration": 0-100,
    "brand": 0-100
  },
  "issues": [
    {
      "severity": "error" | "warn" | "info",
      "source": "composition" | "copy" | "illustration" | "brand",
      "element": "...",
      "observation": "...",
      "fix": "..."
    }
  ],
  "disagreements": [
    {
      "axis_a": "brand",
      "axis_b": "composition",
      "description": "<what they disagree about>"
    }
  ],
  "verdict_summary": "<2-3 sentences>"
}
\`\`\`

Then a 2-3 paragraph narrative covering:
- Which specialist scored lowest and why
- Which issues are cross-axis (raised by more than one specialist)
- The single most important thing to fix first

**Thresholds** (same as solo critic):
- 90-100 · pass · ship-ready
- 75-89 · pass with warnings
- 60-74 · warn
- <60 · fail
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.files.length === 0) {
    console.log(HELP);
    return args.help ? 0 : 2;
  }

  const target = args.files[0];
  try { await stat(resolve(REPO_ROOT, target)); }
  catch { console.error(`target not found: ${target}`); return 1; }

  const detected = detectFromPath(target);
  const skill = args.skill || detected.skill;
  const page = args.page || detected.page;
  if (!skill) { console.error('cannot infer --skill'); return 2; }
  if (!page) { console.error('cannot infer --page (pricing / landing / docs-home / feature-deep)'); return 2; }

  const outDir = args.outDir || 'shots';
  await safeMkdir(resolve(REPO_ROOT, outDir));

  const targetHtml = await safeRead(resolve(REPO_ROOT, target)) || '';
  const canonicalHtmlPath = `skills/${skill}-design/references/canonical/${page}.html`;
  const canonicalMdPath = `skills/${skill}-design/references/canonical/${page}.md`;
  const canonicalHtml = await safeRead(resolve(REPO_ROOT, canonicalHtmlPath));
  const canonicalMd = await safeRead(resolve(REPO_ROOT, canonicalMdPath));
  const crossRules = await safeRead(resolve(REPO_ROOT, 'skills/design-review/references/cross-skill-rules.md'));
  const knownBugs = await safeRead(resolve(REPO_ROOT, 'skills/design-review/references/known-bugs.md'));
  const dosDonts = await safeRead(resolve(REPO_ROOT, `skills/${skill}-design/references/dos-and-donts.md`));
  const languageRules = await safeRead('/Users/sky/.claude/rules/language.md');

  if (!canonicalHtml) { console.error(`canonical HTML missing: ${canonicalHtmlPath}`); return 1; }
  if (!canonicalMd) { console.error(`canonical MD missing: ${canonicalMdPath}`); return 1; }

  const ts = new Date().toISOString().replace(/[-:]/g, '').split('.')[0].replace('T', '-');
  const base = basename(target, '.html');
  const promptPaths = [];

  for (const specialist of SPECIALISTS) {
    const agentSpec = await safeRead(resolve(REPO_ROOT, specialist.agent)) || `(agent spec ${specialist.agent} not found)`;
    const prompt = buildSpecialistPrompt({
      specialist, agentSpec, skill, page, target, targetHtml,
      canonicalHtml, canonicalMd, crossRules, knownBugs, dosDonts, languageRules,
    });
    const outPath = join(outDir, `multi-critic-${specialist.name}-${base}-${ts}.md`);
    await writeFile(resolve(REPO_ROOT, outPath), prompt, 'utf-8');
    promptPaths.push(outPath);
    console.error(`wrote ${specialist.name} prompt → ${outPath} (${prompt.length} chars)`);
  }

  const aggregatorPrompt = buildAggregatorPrompt({ skill, page, target, promptPaths });
  const aggPath = join(outDir, `multi-critic-AGGREGATE-${base}-${ts}.md`);
  await writeFile(resolve(REPO_ROOT, aggPath), aggregatorPrompt, 'utf-8');
  console.error(`wrote aggregator template → ${aggPath} (${aggregatorPrompt.length} chars)`);

  const manifest = {
    skill, page, target,
    specialists: SPECIALISTS.map((s, i) => ({
      name: s.name, weight: s.weight, agent: s.agent, prompt_file: promptPaths[i],
    })),
    aggregator: aggPath,
    instructions: 'In Claude Code: Task(subagent_type="design-<specialist>-critic", prompt=contents-of-prompt-file) ×4 in parallel, then Task(subagent_type="general-purpose", prompt=aggregator-contents+4-verdicts) for synthesis.',
  };
  console.log(JSON.stringify(manifest, null, 2));

  return 0;
}

main().then((code) => process.exit(code));
