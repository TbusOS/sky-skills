#!/usr/bin/env node
// audit.mjs — batch-audit driver for the design-review pipeline.
//
// The other scripts (verify.py / visual-audit.mjs / critic.mjs) are
// "one-shot": they verify a single freshly-generated HTML page, exit on the
// first error, and feed into the four-gate publish flow. audit.mjs is the
// dual: walk a tree, run verify+visual on each .html, *don't* exit on
// failure, aggregate everything into one report.
//
// Use cases this enables:
//   1. Audit existing wiki / docs trees against an anthropic-design rule set
//   2. Regression-check old generated pages after a rule set update
//   3. Triage external HTML someone hands you: "is this anthropic style?"
//
// Usage:
//   node audit.mjs <path-or-url>
//                  [--skill=anthropic|apple|ember|sage|glass]
//                  [--out=<dir>]
//                  [--repo=<path>]            // webroot for serving CSS/img
//                  [--include='**/*.html']    // glob (NB: simple substring, not glob)
//                  [--exclude='shots,node_modules,.git,dist,build']
//                  [--max=<n>]                // hard cap on files audited
//                  [--strict]                 // count visual warnings as fails too
//                  [--allow-monolingual]      // pass through to verify.py
//                  [--no-visual]              // skip visual-audit (verify only, much faster)
//
// path-or-url:
//   - file        → audit just that file
//   - directory   → walk recursively, audit every .html (filtered by include/exclude)
//   - http(s)://… → fetch via Playwright into a tmp file, then audit that file
//                   (re-uses the playwright dep visual-audit already needs)
//
// Output (in --out, default <repo>/shots/):
//   audit-report-<ts>.md     human-readable summary table + per-file findings
//   audit-report-<ts>.json   machine-readable for tooling
//
// Exit code:
//   0 = every file passes (or only warnings, unless --strict)
//   1 = at least one file has an error

import { spawnSync } from 'node:child_process';
import { readdirSync, statSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, relative, basename, join, extname } from 'node:path';
import process from 'node:process';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';

const SCRIPT_DIR = dirname(new URL(import.meta.url).pathname);
const VERIFY = resolve(SCRIPT_DIR, 'verify.py');
const VISUAL = resolve(SCRIPT_DIR, 'visual-audit.mjs');

// ---------- arg parsing ----------
const argv = process.argv.slice(2);
let target = '';
let skill = '';
let outDir = '';
let repo = '';
let includeSubstr = '.html';
let excludeList = ['shots', 'node_modules', '.git', '.cache', 'dist', 'build', '.next', '.venv'];
let maxFiles = 0;
let strict = false;
let allowMonolingual = false;
let runVisual = true;
let discoverOnly = false;

for (const a of argv) {
  if (a === '-h' || a === '--help') { printHelp(); process.exit(0); }
  else if (a.startsWith('--skill=')) skill = a.slice(8);
  else if (a.startsWith('--out=')) outDir = a.slice(6);
  else if (a.startsWith('--repo=')) repo = a.slice(7);
  else if (a.startsWith('--include=')) includeSubstr = a.slice(10);
  else if (a.startsWith('--exclude=')) excludeList = a.slice(10).split(',').map(s => s.trim()).filter(Boolean);
  else if (a.startsWith('--max=')) maxFiles = parseInt(a.slice(6), 10) || 0;
  else if (a === '--strict') strict = true;
  else if (a === '--allow-monolingual' || a === '--internal') allowMonolingual = true;
  else if (a === '--no-visual') runVisual = false;
  else if (a === '--discover') discoverOnly = true;
  else if (a.startsWith('--')) { console.error(`unknown flag: ${a}`); process.exit(2); }
  else if (!target) target = a;
  else { console.error(`extra positional arg: ${a}`); process.exit(2); }
}

if (!target) { printHelp(); process.exit(2); }

// URL mode — fetch via Playwright (re-uses visual-audit's browser dep) into
// a tmp dir, then audit that as a normal local file. We do NOT inject any
// CSS automatically: external pages either link the right stylesheet or
// they don't, and that's part of what audit measures.
const isURL = /^https?:\/\//i.test(target);
let targetAbs;
let urlTmpDir = null;

if (isURL) {
  const fetched = await fetchURL(target);
  targetAbs = fetched.path;
  urlTmpDir = fetched.dir;
} else {
  if (!existsSync(target)) { console.error(`path not found: ${target}`); process.exit(2); }
  targetAbs = resolve(target);
}

const repoAbs = repo ? resolve(repo) : (statSync(targetAbs).isDirectory() ? targetAbs : dirname(targetAbs));
// Default report directory is <cwd>/shots — never buried inside the target
// subtree. The wrapper bin/design-review passes an explicit --out so this
// branch only matters when audit.mjs is invoked directly.
if (!outDir) outDir = join(process.cwd(), 'shots');
mkdirSync(outDir, { recursive: true });

async function fetchURL(url) {
  let chromium;
  try { ({ chromium } = await import('playwright')); }
  catch {
    console.error('URL mode requires playwright (the same dep visual-audit uses).');
    console.error('install: cd sky-skills && npm i playwright --no-save && npx playwright install chromium');
    process.exit(2);
  }
  const hash = createHash('sha1').update(url).digest('hex').slice(0, 10);
  const dir = join(tmpdir(), `audit-url-${hash}`);
  mkdirSync(dir, { recursive: true });
  const fileName = (url.replace(/[^a-z0-9]+/gi, '-').slice(0, 60) || 'page') + '.html';
  const fp = join(dir, fileName);
  console.log(`fetching ${url} via Playwright …`);
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    const html = await page.content();
    writeFileSync(fp, html);
    console.log(`  saved → ${fp}`);
    return { path: fp, dir };
  } finally {
    await browser.close();
  }
}

function printHelp() {
  const help = [
    'usage: node audit.mjs <path-or-url> [flags]',
    '',
    'targets:',
    '  <file.html>             audit a single file',
    '  <directory>             walk recursively, audit every .html',
    '  https://example.com/p   fetch via Playwright into a tmp file, then audit',
    '',
    'flags:',
    '  --skill=<name>          force skill (anthropic|apple|ember|sage|glass); auto-detect otherwise',
    '  --out=<dir>             where to write reports (default <repo>/shots/)',
    '  --repo=<path>           webroot for visual-audit static server',
    '  --include=<substr>      filename filter (default ".html")',
    '  --exclude=<csv>         dir names to skip (default node_modules,.git,shots,dist,build)',
    '  --max=<n>               cap on files audited',
    '  --strict                visual-audit warnings count as failure',
    '  --allow-monolingual     pass to verify.py for non-bilingual pages',
    '  --no-visual             skip visual-audit gate (verify-only, ~10x faster)',
    '  --discover              list every .html walk() finds (grouped by dir) and exit;',
    '                          no gating — shows nested/underscore pages so none ship ungated',
  ].join('\n');
  console.log(help);
}

// ---------- target resolution ----------
function findTargets(rootAbs) {
  const stat = statSync(rootAbs);
  if (stat.isFile()) return [rootAbs];
  const out = [];
  walk(rootAbs, out);
  return out;
}

// Does `dir` hold any matching file anywhere beneath it? Used to decide whether
// an underscore-prefixed dir is content (audit it) or pure assets (skip it).
function dirHasMatch(dir) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); }
  catch { return false; }
  for (const e of entries) {
    if (excludeList.includes(e.name)) continue;
    if (e.isFile() && e.name.includes(includeSubstr)) return true;
    if (e.isDirectory() && dirHasMatch(join(dir, e.name))) return true;
  }
  return false;
}

function walk(dir, out) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); }
  catch { return; }
  for (const e of entries) {
    if (excludeList.includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      // Underscore-dir convention (issue #21 §4): a `_foo` dir is audited only
      // when it actually holds pages (e.g. `_demos/` of sample HTML); a pure
      // asset dir (`_assets/` of css/js, no .html) is skipped — explicitly, so
      // the intent is visible rather than relying on "it happens to have no
      // HTML". Non-underscore dirs are always walked.
      if (e.name.startsWith('_') && !dirHasMatch(p)) continue;
      walk(p, out);
    } else if (e.isFile() && e.name.includes(includeSubstr)) {
      out.push(p);
    }
  }
}

const targets = findTargets(targetAbs);
if (targets.length === 0) {
  console.error(`no HTML files found under ${targetAbs} (filter="${includeSubstr}")`);
  process.exit(2);
}

// ---------- Discover mode (issue #21 §3 · page-coverage report) ----------
// The footgun: the common workflow gates one explicit file at a time, so pages
// living in a nested or underscore-prefixed dir (a `_demos/` of samples, copied
// report artifacts) are easy to forget and ship ungated. This lists every .html
// the SAME walk()+excludeList would reach, grouped by directory, so the hidden
// ones are VISIBLE before ship. Reporting only — exit 0, no gates run.
if (discoverOnly) {
  const relTo = statSync(targetAbs).isDirectory() ? targetAbs : dirname(targetAbs);
  const byDir = new Map();
  for (const f of targets) {
    const r = relative(relTo, f) || basename(f);
    const d = dirname(r) === '.' ? '(root)' : dirname(r);
    if (!byDir.has(d)) byDir.set(d, []);
    byDir.get(d).push(basename(f));
  }
  console.log('');
  console.log('┌─ design-review --discover · page-coverage report');
  console.log(`│  root: ${targetAbs}`);
  console.log(`│  found: ${targets.length} page(s) in ${byDir.size} dir(s)  (filter="${includeSubstr}")`);
  console.log('└──────────────────────────────────────────────────');
  for (const d of [...byDir.keys()].sort()) {
    const files = byDir.get(d).sort();
    const flag = d.split('/').some(seg => seg.startsWith('_')) ? '  ← underscore dir (content; would be audited)' : '';
    console.log(`\n  ${d}/${flag}`);
    for (const f of files) console.log(`    • ${f}`);
  }
  console.log('');
  console.log(`To gate every page above in one run: bin/design-review --audit ${target}`);
  console.log('(per-file gating misses nested pages — this is the backstop.)');
  console.log('');
  process.exit(0);
}

const finalTargets = maxFiles > 0 ? targets.slice(0, maxFiles) : targets;

const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
console.log('');
console.log('┌─ design-review --audit · ' + new Date().toISOString().slice(0, 19).replace('T', ' '));
console.log(`│  repo=${repoAbs}  skill=${skill || 'auto'}  visual=${runVisual ? 'on' : 'off'}  strict=${strict}`);
console.log(`│  files: ${finalTargets.length}${maxFiles && targets.length > maxFiles ? ` (capped from ${targets.length})` : ''}`);
console.log('└──────────────────────────────────────────────────');
console.log('');

// ---------- per-file gate runners ----------
function runVerify(htmlAbs) {
  const args = [VERIFY];
  if (skill) args.push(`--skill=${skill}`);
  if (allowMonolingual) args.push('--allow-monolingual');
  args.push(htmlAbs);
  const r = spawnSync('python3', args, { cwd: repoAbs, encoding: 'utf8' });
  return parseVerify(r);
}

function parseVerify(r) {
  const text = (r.stdout || '') + (r.stderr || '');
  const lines = text.split('\n');
  const findings = [];
  for (const line of lines) {
    const trimmed = line.trim();
    // verify.py emits failures as bullet lines: "  • <message>"
    if (trimmed.startsWith('•') || trimmed.startsWith('· ') || /^\s*•/.test(line)) {
      const message = trimmed.replace(/^[•·]\s*/, '');
      findings.push({ severity: 'error', kind: verifyKind(message), message });
    }
  }
  return {
    exitCode: r.status,
    findings,
    raw: text.trim(),
  };
}

function runVisualAudit(htmlAbs) {
  const args = [VISUAL, '--ignore-intentional', htmlAbs];
  const r = spawnSync('node', args, { cwd: repoAbs, encoding: 'utf8' });
  return parseVisual(r);
}

function parseVisual(r) {
  const text = (r.stdout || '') + (r.stderr || '');
  const lines = text.split('\n');
  const findings = [];
  for (const line of lines) {
    // visual-audit emits: "  [error] ..." or "  [warn] ..."
    const m = /\s*\[(error|warn)\]\s+(.+)$/.exec(line);
    if (m) {
      const message = m[2].trim();
      findings.push({ severity: m[1], kind: visualKind(message), message });
    }
  }
  return {
    exitCode: r.status,
    findings,
    raw: text.trim(),
  };
}

// ---------- kind classification ----------
// aggregate every finding's kind across all results → sorted descending list
// [{ kind, error, warn }, …]. Single source for both report formats.
function aggregateByKind(results) {
  const map = new Map();
  for (const r of results) {
    const all = [...r.verify.findings, ...(r.visual ? r.visual.findings : [])];
    for (const f of all) {
      const kind = f.kind || 'other';
      const prev = map.get(kind) ?? { error: 0, warn: 0 };
      map.set(kind, {
        error: prev.error + (f.severity === 'error' ? 1 : 0),
        warn: prev.warn + (f.severity === 'warn' ? 1 : 0),
      });
    }
  }
  return [...map.entries()]
    .map(([kind, cnt]) => ({ kind, ...cnt }))
    .sort((a, b) => (b.error + b.warn) - (a.error + a.warn) || a.kind.localeCompare(b.kind));
}

// verify.py prints plain strings ("<path>: <message>") with no kind field.
// Classify by stable message prefixes/fragments; each rule maps 1:1 to one
// `errors.append(...)` site in verify.py. Unmatched → verify:other.
const VERIFY_KIND_RULES = [
  [/placeholder strings:/, 'verify:placeholder'],
  [/missing <!doctype html>/, 'verify:doctype'],
  [/missing viewport meta/, 'verify:viewport'],
  [/hero uses narrow container|hero inner element lacks/, 'verify:hero-container'],
  [/--css path not found|no CSS source found/, 'verify:css-source'],
  [/undefined class '/, 'verify:undefined-class'],
  [/unbalanced <svg> tags/, 'verify:svg-balance'],
  [/used without base '/, 'verify:container-base-modifier'],
  [/missing bilingual support/, 'verify:bilingual-toggle'],
  [/design-review:self-diff|self-diff block present but incomplete/, 'verify:self-diff'],
  [/lang-zh body contains half-width/, 'verify:cjk-punctuation'],
];

function verifyKind(msg) {
  for (const [re, kind] of VERIFY_KIND_RULES) {
    if (re.test(msg)) return kind;
  }
  return 'verify:other';
}

// visual-audit.mjs has a real per-issue `kind` field but only prints formatted
// text. Recover the kind from each format's stable lead-in (the part before
// any interpolation). Keep this list in sync with visual-audit's print block.
const VISUAL_KIND_RULES = [
  [/^contrast \d/, 'contrast'],
  [/^hero diagram rendered at only/, 'diagram-narrow'],
  [/^diagram smallest text renders at/, 'diagram-tiny-text'],
  [/^svg-letterbox in/, 'svg-letterbox'],
  [/^dense diagram cramped:/, 'dense-diagram-cramped'],
  [/^diagram-monochrome:/, 'diagram-monochrome'],
  [/^text-desert:/, 'text-desert'],
  [/^orphan figure/, 'orphan-figure'],
  [/^<figure> without <figcaption>/, 'figure-no-caption'],
  [/^SVG text overlap in/, 'svg-text-overlap'],
  [/^text-overlap \(/, 'text-overlap'],
  [/^layout-overflow:/, 'layout-overflow'],
  [/^text-glyph-overflow/, 'text-glyph-overflow'],
  [/^grid-track-shrink-risk:/, 'grid-track-shrink-risk'],
  [/^page-overflow-x:/, 'page-overflow-x'],
  [/^margin:auto block renders off-center/, 'margin-auto-offcenter'],
  [/^svg-shape-over-text in/, 'svg-shape-over-text'],
  [/^\d+ <h1> elements on the page/, 'multiple-h1'],
  [/^page has no <h1>/, 'no-h1'],
  [/^heading level skipped/, 'heading-skip'],
  [/^<img> without alt/, 'img-no-alt'],
  [/^<a> with no text/, 'link-no-text'],
  [/^hollow card in/, 'hollow-card'],
  [/^asymmetric 3-col grid/, 'asymmetric-first-col-hero'],
  [/^SVG text colour too close/, 'svg-text-on-same-colour'],
  [/^italic overuse:/, 'italic-overuse'],
  [/^cross-skill smell:/, 'cross-skill-smell'],
  [/full-width saturated band/, 'saturated-band'],
  [/^brand not visible in top region/, 'no-brand-presence'],
];

function visualKind(msg) {
  for (const [re, kind] of VISUAL_KIND_RULES) {
    if (re.test(msg)) return kind;
  }
  return 'visual:other';
}

// ---------- main loop ----------
const results = [];
let printedFiles = 0;
const startMs = Date.now();
for (const htmlAbs of finalTargets) {
  printedFiles++;
  const rel = relative(repoAbs, htmlAbs) || basename(htmlAbs);
  process.stdout.write(`[${printedFiles}/${finalTargets.length}] ${rel} … `);

  const verify = runVerify(htmlAbs);
  let visual = null;
  if (runVisual) {
    try { visual = runVisualAudit(htmlAbs); }
    catch (e) {
      visual = { exitCode: -1, findings: [{ severity: 'error', kind: 'visual:crash', message: `visual-audit crashed: ${e.message}` }], raw: String(e) };
    }
  }

  const errors =
    verify.findings.filter(f => f.severity === 'error').length +
    (visual ? visual.findings.filter(f => f.severity === 'error').length : 0);
  const warns =
    verify.findings.filter(f => f.severity === 'warn').length +
    (visual ? visual.findings.filter(f => f.severity === 'warn').length : 0);

  const overallFail = errors > 0 || (strict && warns > 0);
  console.log(`${overallFail ? '✗ FAIL' : '✓ pass'}  err=${errors} warn=${warns}`);

  results.push({
    path: rel,
    abs: htmlAbs,
    verify,
    visual,
    errors,
    warns,
    overallFail,
  });
}

const elapsedSec = ((Date.now() - startMs) / 1000).toFixed(1);
const totalErr = results.reduce((s, r) => s + r.errors, 0);
const totalWarn = results.reduce((s, r) => s + r.warns, 0);
const failedFiles = results.filter(r => r.overallFail).length;
const byKind = aggregateByKind(results);

// ---------- report writers ----------
const mdPath = join(outDir, `audit-report-${ts}.md`);
const jsonPath = join(outDir, `audit-report-${ts}.json`);

writeFileSync(mdPath, renderMarkdown(results, { skill, runVisual, strict, elapsedSec, totalErr, totalWarn, failedFiles, repoAbs, byKind }));
writeFileSync(jsonPath, JSON.stringify({
  generated: new Date().toISOString(),
  skill: skill || 'auto',
  visual: runVisual,
  strict,
  repo: repoAbs,
  totals: {
    files: results.length,
    failed: failedFiles,
    errors: totalErr,
    warnings: totalWarn,
    // kind → issue count across every file, descending. Feeds learning-loop's
    // "which check fires most" distribution without re-parsing per-file findings.
    byKind: Object.fromEntries(byKind.map(k => [k.kind, k.error + k.warn])),
  },
  results: results.map(r => ({
    path: r.path,
    errors: r.errors,
    warnings: r.warns,
    overallFail: r.overallFail,
    verify: { exitCode: r.verify.exitCode, findings: r.verify.findings },
    visual: r.visual ? { exitCode: r.visual.exitCode, findings: r.visual.findings } : null,
  })),
}, null, 2));

console.log('');
console.log('┌─ Summary');
console.log(`│  audited:   ${results.length} file(s) in ${elapsedSec}s`);
console.log(`│  passed:    ${results.length - failedFiles}`);
console.log(`│  failed:    ${failedFiles}`);
console.log(`│  errors:    ${totalErr}`);
console.log(`│  warnings:  ${totalWarn}`);
console.log(`│  report:    ${mdPath}`);
console.log(`│  json:      ${jsonPath}`);
console.log('└──────────────────────────────────────────────────');

process.exit(failedFiles > 0 ? 1 : 0);

// ---------- markdown report ----------
function renderMarkdown(results, meta) {
  const lines = [];
  lines.push('# Design Audit Report');
  lines.push('');
  lines.push(`- Generated: ${new Date().toISOString()}`);
  lines.push(`- Skill: \`${meta.skill || 'auto'}\``);
  lines.push(`- Visual gate: ${meta.runVisual ? 'on' : 'off'}`);
  lines.push(`- Strict mode: ${meta.strict ? 'yes' : 'no'}`);
  lines.push(`- Repo root: \`${meta.repoAbs}\``);
  lines.push(`- Audited: **${results.length}** file(s) in ${meta.elapsedSec}s`);
  lines.push(`- Passed: **${results.length - meta.failedFiles}**, Failed: **${meta.failedFiles}**`);
  lines.push(`- Total errors: **${meta.totalErr}**, warnings: **${meta.totalWarn}**`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push('| # | File | verify | visual | err | warn | overall |');
  lines.push('|---:|---|:---:|:---:|---:|---:|:---:|');
  results.forEach((r, i) => {
    const v = r.verify.exitCode === 0 ? '✓' : '✗';
    const va = !r.visual ? '—' : (r.visual.exitCode === 0 ? '✓' : '✗');
    const overall = r.overallFail ? '**✗ FAIL**' : '✓';
    lines.push(`| ${i + 1} | \`${r.path}\` | ${v} | ${va} | ${r.errors} | ${r.warns} | ${overall} |`);
  });
  lines.push('');

  // Top failure modes — per-kind distribution across all files, descending.
  // verify findings carry a `verify:*` kind (message-prefix classification),
  // visual-audit findings carry the check's own kind name.
  if (meta.byKind.length > 0) {
    lines.push('## Top failure modes');
    lines.push('');
    lines.push('| Kind | error | warn | total |');
    lines.push('|---|---:|---:|---:|');
    for (const k of meta.byKind) {
      lines.push(`| \`${k.kind}\` | ${k.error} | ${k.warn} | ${k.error + k.warn} |`);
    }
    lines.push('');
  }

  // Per-file findings (only files with any finding)
  lines.push('## Findings (per file)');
  lines.push('');
  let any = false;
  for (const r of results) {
    const all = [
      ...r.verify.findings.map(f => ({ ...f, gate: 'verify' })),
      ...(r.visual ? r.visual.findings.map(f => ({ ...f, gate: 'visual' })) : []),
    ];
    if (all.length === 0) continue;
    any = true;
    lines.push(`### \`${r.path}\``);
    lines.push('');
    lines.push(`errors=${r.errors}  warnings=${r.warns}`);
    lines.push('');
    const errs = all.filter(f => f.severity === 'error');
    const warns = all.filter(f => f.severity === 'warn');
    if (errs.length) {
      lines.push('**Errors:**');
      errs.slice(0, 20).forEach(f => lines.push(`- (${f.gate}) ${f.message}`));
      if (errs.length > 20) lines.push(`- … ${errs.length - 20} more`);
      lines.push('');
    }
    if (warns.length) {
      lines.push('**Warnings:**');
      warns.slice(0, 20).forEach(f => lines.push(`- (${f.gate}) ${f.message}`));
      if (warns.length > 20) lines.push(`- … ${warns.length - 20} more`);
      lines.push('');
    }
  }
  if (!any) {
    lines.push('_No findings — every file passed both gates._');
    lines.push('');
  }

  return lines.join('\n');
}
