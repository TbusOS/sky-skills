// audit-critic.mjs — Tier 4 prompt builder for gated-dual-clone-audit.
//
// Reads the audit-critic agent spec + the caller's gateway/satellite paths
// and produces a self-contained prompt for the `gated-dual-clone-audit-critic`
// subagent. The subagent runs in its own Claude Code context (fresh, not
// inheriting this skill's mental model) and returns a taste-level verdict.
//
// Usage:
//   node skills/gated-dual-clone-audit/scripts/audit-critic.mjs \
//     --gateway-dir=<path> --satellite-dir=<path> \
//     [--upstream-branch=<name>] [--push-branch=<name>] \
//     [--out=<file>]
//
// Output: writes the prompt to --out (default: shots/audit-critic-<ts>.md)
// and prints the path. The caller then invokes Task() with
// subagent_type="gated-dual-clone-audit-critic" and prompt=contents-of-file.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = resolve(__dirname, '..');
const REPO_ROOT = resolve(SKILL_DIR, '../..');

function parseArgs(argv) {
  const out = {};
  for (const a of argv) {
    if (a.startsWith('--gateway-dir='))     out.gateway = a.split('=')[1];
    else if (a.startsWith('--satellite-dir='))   out.satellite = a.split('=')[1];
    else if (a.startsWith('--upstream-branch=')) out.upstream = a.split('=')[1];
    else if (a.startsWith('--push-branch='))     out.push = a.split('=')[1];
    else if (a.startsWith('--out='))             out.out = a.split('=')[1];
    else if (a === '-h' || a === '--help')       out.help = true;
  }
  return out;
}

const HELP = `
audit-critic.mjs — build a Tier 4 taste prompt for a gated-dual-clone topology.

Usage:
  node audit-critic.mjs --gateway-dir=<path> --satellite-dir=<path>
                        [--upstream-branch=<name>] [--push-branch=<name>]
                        [--out=<file>]

Output: prompt file (default shots/audit-critic-<ts>.md). Invoke the
subagent with it via Task(subagent_type="gated-dual-clone-audit-critic").
`;

async function safeRead(path) {
  try { return await readFile(path, 'utf-8'); } catch { return null; }
}

function fence(lang, body) {
  return '```' + lang + '\n' + (body || '') + '\n```';
}

function pad(n) { return String(n).padStart(2, '0'); }
function timestamp() {
  const d = new Date();
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { console.log(HELP); return 0; }

  if (!args.gateway || !args.satellite) {
    console.error('--gateway-dir and --satellite-dir are required');
    console.error(HELP);
    return 2;
  }

  const agentSpec = await safeRead(resolve(SKILL_DIR, 'agents/gated-dual-clone-audit-critic.md'));
  if (!agentSpec) {
    console.error('missing agent spec at agents/gated-dual-clone-audit-critic.md');
    return 3;
  }

  const prompt = `<!-- audit-critic prompt · target gateway=${args.gateway} · satellite=${args.satellite} · ${new Date().toISOString()} -->

# System prompt · gated-dual-clone-audit-critic

${agentSpec}

---

# User prompt

You have been invoked to run Tier 4 (taste) of the gated-dual-clone audit.
Tiers 1-3 already ran and are out of your scope. Answer the three questions
in your system prompt — nothing more, nothing less.

## Topology under review

- **gateway_dir**: \`${args.gateway}\`
- **satellite_dir**: \`${args.satellite}\`
${args.upstream ? `- **upstream_branch**: \`${args.upstream}\`` : '- **upstream_branch**: (not provided — infer from gateway config or hook regex)'}
${args.push ? `- **push_branch**: \`${args.push}\`` : '- **push_branch**: (not provided — infer from gateway / satellite current branch)'}

## Starting probes (run these first, then adapt as needed)

${fence('bash', `# Q1 · push-branch divergence
cd "${args.gateway}"
git fetch origin --quiet 2>/dev/null || true
git symbolic-ref --short HEAD 2>/dev/null      # which branch gateway is on
${args.upstream && args.push
  ? `git rev-list --count origin/${args.upstream}..${args.push}
git rev-list --count ${args.push}..origin/${args.upstream}
git show --format='%ci' -s $(git merge-base ${args.push} origin/${args.upstream} 2>/dev/null) 2>/dev/null`
  : '# push / upstream branches not provided · infer first'}

# Q2 · project size / activity
du -sh "${args.gateway}" 2>/dev/null
du -sh --exclude=.git "${args.gateway}" 2>/dev/null
du -sh "${args.satellite}"/out "${args.satellite}"/build 2>/dev/null || true
cd "${args.gateway}"
git log --since='3 months ago' --oneline | wc -l
git log --since='3 months ago' --format='%ae' | sort -u | wc -l

# Q3 · --no-verify / bypass signals
cat "${args.gateway}/.git/logs/HEAD" 2>/dev/null | tail -30
ls "${args.gateway}/.git/logs/refs/remotes/origin/" 2>/dev/null
cd "${args.gateway}"
git reflog --date=iso 2>/dev/null | head -30`)}

## Expected output

Exactly the JSON shape from your system prompt, followed by a 2-3 sentence
verdict narrative. No extra scaffolding.

---

**Produce your verdict now.** Investigate the repos with Bash, then emit
the JSON + narrative. Do NOT modify any file.
`;

  const outPath = args.out || resolve(REPO_ROOT, `shots/audit-critic-${basename(args.gateway)}-${timestamp()}.md`);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, prompt, 'utf-8');

  console.log(`wrote audit-critic prompt → ${outPath} (${prompt.length} chars)`);
  console.log(`next: in Claude Code, invoke`);
  console.log(`  Task(subagent_type="gated-dual-clone-audit-critic",`);
  console.log(`       prompt=contents-of-${basename(outPath)})`);
  return 0;
}

process.exit(await main());
