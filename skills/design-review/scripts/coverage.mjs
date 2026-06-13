// coverage.mjs — canonical reference-library coverage tracker (component 02).
//
// The library is "done" only when the skill × page-type matrix is filled. The
// count drifted (roadmap said 27/40 while disk held 44) precisely because
// nothing mechanical tracked it. This script is that tracker: it prints the
// matrix, the per-skill totals against the target, and flags pages that exist
// on disk but are not yet committed (so "shipped" can't quietly mean
// "uncommitted on someone's machine").
//
// Usage:
//   node coverage.mjs                 print the full matrix + gaps + untracked
//   node coverage.mjs --skill=sage    one skill
//   node coverage.mjs --missing       list only the gaps (for a worklist)
//
// Exit: 0 always (reporting tool).

import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import process from 'node:process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../..');

// The target matrix. Light skills share a 10-type core; glass has its own set
// (it is the dashboard/report/diagram skill, not a marketing-site skill).
const CORE = ['landing', 'pricing', 'docs-home', 'feature-deep', 'comparison',
  'blog-index', 'product-detail', 'team', 'faq', 'changelog'];
const TARGET = {
  anthropic: CORE,
  apple: CORE,
  ember: CORE,
  sage: CORE,
  glass: ['landing', 'dashboard', 'data-report', 'diagram-gallery'],
};

function parseArgs(argv) {
  const out = {};
  for (const a of argv) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
    else if (a.startsWith('--')) out[a.slice(2)] = true;
  }
  return out;
}

async function presentPages(skill) {
  const dir = resolve(REPO_ROOT, `skills/${skill}-design/references/canonical`);
  if (!existsSync(dir)) return [];
  const files = await readdir(dir);
  return files.filter((f) => f.endsWith('.html')).map((f) => f.replace(/\.html$/, '')).sort();
}

// Git-tracked set (committed). On-disk-but-not-here = untracked / uncommitted.
function trackedSet() {
  try {
    const out = execFileSync('git', ['-C', REPO_ROOT, 'ls-files', 'skills/*/references/canonical/*.html'],
      { encoding: 'utf-8', maxBuffer: 16 * 1024 * 1024 });
    return new Set(out.split('\n').filter(Boolean));
  } catch {
    return null; // not a git repo / git unavailable
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const skills = args.skill ? [args.skill] : Object.keys(TARGET);
  const tracked = trackedSet();

  let totalTarget = 0, totalPresent = 0, totalUntracked = 0;
  const missingAll = [];

  for (const skill of skills) {
    if (!TARGET[skill]) { console.error(`unknown skill: ${skill}`); continue; }
    const target = TARGET[skill];
    const present = await presentPages(skill);
    const presentSet = new Set(present);
    const missing = target.filter((p) => !presentSet.has(p));
    const extra = present.filter((p) => !target.includes(p));
    totalTarget += target.length;
    totalPresent += target.filter((p) => presentSet.has(p)).length;

    const untracked = tracked
      ? present.filter((p) => !tracked.has(`skills/${skill}-design/references/canonical/${p}.html`))
      : [];
    totalUntracked += untracked.length;
    missing.forEach((p) => missingAll.push(`${skill}/${p}`));

    if (args.missing) continue;
    const have = target.length - missing.length;
    console.log(`${skill.padEnd(10)} ${have}/${target.length}` +
      (missing.length ? `   missing: ${missing.join(', ')}` : '   ✓ complete') +
      (extra.length ? `\n           extra (off-matrix): ${extra.join(', ')}` : '') +
      (untracked.length ? `\n           ⚠ uncommitted: ${untracked.join(', ')}` : ''));
  }

  if (args.missing) {
    console.log(missingAll.length ? missingAll.join('\n') : '(no gaps — matrix complete)');
    return 0;
  }

  console.log('─'.repeat(56));
  console.log(`TOTAL ${totalPresent}/${totalTarget} canonical page-types present` +
    (totalUntracked ? `  ·  ${totalUntracked} on disk but UNCOMMITTED` : '') +
    (missingAll.length ? `  ·  ${missingAll.length} gap(s)` : '  ·  matrix complete'));
  if (totalUntracked) {
    console.log('  (uncommitted pages are not "shipped" — git add them or remove them)');
  }
  return 0;
}

main().then((c) => process.exit(c));
