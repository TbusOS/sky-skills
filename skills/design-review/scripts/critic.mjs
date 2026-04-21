// critic.mjs — prepare the LLM prompt for the design-critic subagent.
//
// In Claude Code: the `.claude/agents/design-critic.md` agent is invoked
// via the Task tool; Claude Code loads the agent's system prompt and the
// user's target path, and the agent reads the canonical files itself.
//
// Outside Claude Code: this script assembles the full prompt + attached
// files into one self-contained document that can be sent to any LLM
// (anthropic-api, OpenAI, offline review, etc).
//
// Usage:
//   node skills/design-review/scripts/critic.mjs <target.html>
//   node skills/design-review/scripts/critic.mjs <target.html> --skill=sage --page=landing
//   node skills/design-review/scripts/critic.mjs <target.html> --out=critic-prompt.md
//
// Output: markdown to stdout (or --out= file). The consumer LLM runs with
// this prompt and produces the JSON + narrative verdict.

import { readFile, writeFile, stat } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../..');

function parseArgs(argv) {
  const out = { files: [] };
  for (const a of argv) {
    if (a.startsWith('--skill=')) out.skill = a.split('=')[1];
    else if (a.startsWith('--page=')) out.page = a.split('=')[1];
    else if (a.startsWith('--out=')) out.out = a.split('=')[1];
    else if (a === '-h' || a === '--help') out.help = true;
    else if (!a.startsWith('--')) out.files.push(a);
  }
  return out;
}

const HELP = `
critic.mjs — prepare design-critic prompt

Usage:
  node skills/design-review/scripts/critic.mjs <target.html>
    [--skill=anthropic|apple|ember|sage]
    [--page=pricing|landing|docs-home|feature-deep]
    [--out=prompt.md]
`;

function detectFromPath(path) {
  const norm = path.split('\\').join('/');
  const m = norm.match(/skills\/([a-z]+)-design\/references\/canonical\/([a-z0-9-]+)\.html/);
  if (m) return { skill: m[1], page: m[2] };
  const m2 = norm.match(/skills\/([a-z]+)-design\//);
  if (m2) return { skill: m2[1], page: null };
  return { skill: null, page: null };
}

async function safeRead(path) {
  try { return await readFile(path, 'utf-8'); } catch { return null; }
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
  if (!skill) {
    console.error('cannot infer --skill from path; pass it explicitly');
    return 2;
  }
  if (!page) {
    console.error('cannot infer --page from path; pass it (pricing / landing / docs-home / feature-deep)');
    return 2;
  }

  // Load every file the critic needs.
  const agentSpec = await safeRead(resolve(REPO_ROOT, '.claude/agents/design-critic.md')) || '(agent spec not found)';
  const targetHtml = await safeRead(resolve(REPO_ROOT, target)) || '';
  const canonicalHtmlPath = `skills/${skill}-design/references/canonical/${page}.html`;
  const canonicalMdPath = `skills/${skill}-design/references/canonical/${page}.md`;
  const canonicalHtml = await safeRead(resolve(REPO_ROOT, canonicalHtmlPath));
  const canonicalMd = await safeRead(resolve(REPO_ROOT, canonicalMdPath));
  const crossRules = await safeRead(resolve(REPO_ROOT, 'skills/design-review/references/cross-skill-rules.md'));
  const knownBugs = await safeRead(resolve(REPO_ROOT, 'skills/design-review/references/known-bugs.md'));
  const dosDonts = await safeRead(resolve(REPO_ROOT, `skills/${skill}-design/references/dos-and-donts.md`));

  if (!canonicalHtml) {
    console.error(`canonical HTML missing: ${canonicalHtmlPath}`);
    return 1;
  }
  if (!canonicalMd) {
    console.error(`canonical MD missing: ${canonicalMdPath} — Phase C1 must be complete`);
    return 1;
  }

  const prompt = buildPrompt({
    skill, page, target, targetHtml, canonicalHtml, canonicalMd,
    crossRules, knownBugs, dosDonts, agentSpec,
  });

  if (args.out) {
    await writeFile(resolve(REPO_ROOT, args.out), prompt, 'utf-8');
    console.error(`wrote critic prompt to ${args.out} (${prompt.length} chars)`);
  } else {
    console.log(prompt);
  }
  return 0;
}

function fence(lang, body) { return '```' + lang + '\n' + (body || '') + '\n```'; }

function buildPrompt({ skill, page, target, targetHtml, canonicalHtml, canonicalMd, crossRules, knownBugs, dosDonts, agentSpec }) {
  return `<!-- design-critic prompt · skill=${skill} · page=${page} · target=${target} -->

# System prompt · design-critic

${agentSpec}

---

# User prompt

Please review the target page below against the canonical reference for
\`${skill}-design ${page}\`. Follow the rubric in your system prompt.
Return the JSON verdict first, then the 2-4 paragraph narrative.

## Target page (\`${target}\`)

${fence('html', targetHtml.slice(0, 100000))}

## Canonical reference (\`skills/${skill}-design/references/canonical/${page}.html\`)

${fence('html', canonicalHtml.slice(0, 100000))}

## Canonical.md (7 decisions · acceptance rubric)

${fence('markdown', canonicalMd)}

## Cross-skill rules A–K

${fence('markdown', crossRules || '(cross-skill-rules.md not found)')}

## Known bug catalogue

${fence('markdown', knownBugs || '(known-bugs.md not found)')}

${dosDonts ? `## ${skill}-design specific dos-and-donts\n\n${fence('markdown', dosDonts)}` : ''}

---

**Produce your verdict now.** JSON first, then narrative.
`;
}

main().then((code) => process.exit(code));
