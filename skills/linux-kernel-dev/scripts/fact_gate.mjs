#!/usr/bin/env node
// fact_gate.mjs — objective fact gate for linux-kernel-dev (HARNESS-DESIGN §6.2).
// Parses a [CLAIMS] block from an answer and verifies each claim against a REAL
// kernel source tree. Tree-agnostic: no path is baked in (HARNESS-DESIGN §6.10).
//
// Usage:
//   node fact_gate.mjs <answer-file>        [--tree <path>] [--docs <path>] [--json]
//   node fact_gate.mjs --claims-file <f>    [--tree <path>] ...
//   cat answer.md | node fact_gate.mjs -    [--tree <path>] ...
//
// Claim types checked against the source tree:
//   config:     CONFIG_X  -> a `config X` / `menuconfig X` exists in some Kconfig
//   api/symbol: NAME      -> NAME appears (word-boundary) in some .c/.h
//   compatible: a,b       -> the literal string appears in tree (.c/.dts*/.yaml)
//   forbidden_respected:  informational only (critic territory, not tree-checkable)
//
// Exit codes (guard #3 — distinguish a real FAIL from a broken gate):
//   0  all claims resolved (clean)
//   1  >=1 claim failed (hallucination) — a real verdict
//   2  bad CLI / no [CLAIMS] block
//   3  gate-error: no usable tree, or grep tooling failed (NOT a content fail)

import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { homedir } from 'node:os';

// ---------- args ----------
function parseArgs(argv) {
  const o = { tree: null, docs: null, json: false, input: null, claimsFile: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--tree') o.tree = argv[++i];
    else if (a === '--docs') o.docs = argv[++i];
    else if (a === '--json') o.json = true;
    else if (a === '--claims-file') o.claimsFile = argv[++i];
    else if (a === '-') o.input = '-';
    else if (!a.startsWith('--')) o.input = a;
  }
  return o;
}

// ---------- tree resolution (HARNESS-DESIGN §6.10 discovery order) ----------
function looksLikeKernelTree(p) {
  try {
    const mk = join(p, 'Makefile');
    if (!existsSync(mk)) return false;
    const head = readFileSync(mk, 'utf8').slice(0, 400);
    const hasVer = /^VERSION\s*=/m.test(head) && /^PATCHLEVEL\s*=/m.test(head);
    return hasVer && existsSync(join(p, 'scripts', 'checkpatch.pl'));
  } catch { return false; }
}

function fromConfigFile() {
  try {
    const cfg = join(homedir(), '.config', 'linux-kernel-dev', 'trees.json');
    if (!existsSync(cfg)) return null;
    const j = JSON.parse(readFileSync(cfg, 'utf8'));
    const def = j.default;
    const trees = j.trees || [];
    const pick = def ? trees.find(t => t.version === def) : trees[0];
    return pick ? pick.path : null;
  } catch { return null; }
}

function walkUpForTree(start) {
  let dir = resolve(start);
  for (let i = 0; i < 40; i++) {
    if (looksLikeKernelTree(dir)) return dir;
    const up = dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return null;
}

function commonLocations() {
  const cands = ['/usr/src/linux'];
  try {
    const rel = execFileSync('uname', ['-r']).toString().trim();
    cands.unshift(`/lib/modules/${rel}/build`);
  } catch { /* ignore */ }
  return cands.find(p => existsSync(p) && looksLikeKernelTree(p)) || null;
}

function resolveTree(opt) {
  if (opt) return { path: resolve(opt), how: '--tree' };
  if (process.env.KERNELDEV_TREE) return { path: resolve(process.env.KERNELDEV_TREE), how: 'env KERNELDEV_TREE' };
  if (process.env.KDIR) return { path: resolve(process.env.KDIR), how: 'env KDIR' };
  const c = fromConfigFile(); if (c) return { path: resolve(c), how: 'config trees.json' };
  const w = walkUpForTree(process.cwd()); if (w) return { path: w, how: 'walk-up from cwd' };
  const k = commonLocations(); if (k) return { path: k, how: 'common location' };
  return null;
}

// ---------- grep helpers (git grep if available, else grep -r) ----------
function isGit(tree) { return existsSync(join(tree, '.git')); }

// returns { hits:number } or throws {gateError:true} on tooling failure
function grepCount(tree, pattern, globs) {
  const useGit = isGit(tree);
  let args, cmd;
  if (useGit) {
    cmd = 'git';
    args = ['-C', tree, 'grep', '-IlE', pattern];
    if (globs && globs.length) { args.push('--'); for (const g of globs) args.push(g); }
  } else {
    cmd = 'grep';
    args = ['-rIlE', pattern];
    if (globs && globs.length) for (const g of globs) args.push(`--include=${g}`);
    args.push(tree);
  }
  try {
    const out = execFileSync(cmd, args, { maxBuffer: 64 * 1024 * 1024, timeout: 120000 }).toString();
    return out.split('\n').filter(Boolean).length;
  } catch (e) {
    // grep/git grep exit 1 == no match (NOT an error)
    if (e.status === 1) return 0;
    const err = new Error(`grep tooling failed: ${cmd} (status ${e.status})`);
    err.gateError = true;
    throw err;
  }
}

// ---------- claim checks ----------
function checkConfig(tree, name) {
  const sym = name.replace(/^CONFIG_/, '');
  // a `config SYM` or `menuconfig SYM` line in any Kconfig
  const pat = `^[[:space:]]*(menu)?config[[:space:]]+${esc(sym)}([[:space:]]|$)`;
  return grepCount(tree, pat, ['*Kconfig*', 'Kconfig']) > 0;
}
function checkSymbol(tree, name) {
  // word-boundary existence in C sources/headers (catches made-up API names)
  return grepCount(tree, `(^|[^A-Za-z0-9_])${esc(name)}([^A-Za-z0-9_]|$)`, ['*.c', '*.h']) > 0;
}
function checkCompatible(tree, str) {
  return grepCount(tree, esc(str), ['*.c', '*.dts', '*.dtsi', '*.yaml']) > 0;
}
function esc(s) { return s.replace(/[.[\]{}()*+?^$|\\\/]/g, '\\$&'); }

// ---------- [CLAIMS] parse ----------
function parseClaims(text) {
  const m = text.match(/\[CLAIMS\]([\s\S]*?)\[\/CLAIMS\]/);
  if (!m) return null;
  const out = { api: [], symbol: [], config: [], compatible: [], forbidden_respected: [] };
  for (const line of m[1].split('\n')) {
    const mm = line.match(/^\s*([a-z_]+)\s*:\s*(.+?)\s*$/);
    if (!mm) continue;
    const key = mm[1];
    // compatible strings contain commas (vendor,device) -> separate them by ';'
    const sep = key === 'compatible' ? ';' : ',';
    const vals = mm[2].split(sep).map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    if (key in out) out[key].push(...vals);
  }
  return out;
}

// ---------- main ----------
const o = parseArgs(process.argv.slice(2));
let text = '';
try {
  if (o.claimsFile) text = readFileSync(o.claimsFile, 'utf8');
  else if (o.input === '-' || (!o.input && !process.stdin.isTTY)) text = readFileSync(0, 'utf8');
  else if (o.input) text = readFileSync(o.input, 'utf8');
  else { console.error('usage: fact_gate.mjs <answer-file|-> [--tree <path>] [--docs <path>] [--json]'); process.exit(2); }
} catch (e) { console.error(`cannot read input: ${e.message}`); process.exit(2); }

const claims = parseClaims(text);
if (!claims) { console.error('no [CLAIMS] block found (canary fail — answer must emit one)'); process.exit(2); }

const tree = resolveTree(o.tree);
if (!tree || !existsSync(tree.path)) {
  const msg = '[事实检查] gate-error: no usable kernel tree bound.\n' +
    '  bind one:  node scripts/kernel-tree.mjs add /path/to/linux\n' +
    '  or pass:   --tree /path/to/linux\n' +
    '  or clone:  git clone --depth 1 -b v6.12 \\\n' +
    '               https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git\n' +
    '  (degraded: claims UNVERIFIED — do not treat as pass)';
  if (o.json) console.log(JSON.stringify({ status: 'gate-error', reason: 'no-tree' }));
  else console.error(msg);
  process.exit(3);
}

const results = [];
let failed = 0;
try {
  for (const name of claims.config)     { const ok = checkConfig(tree.path, name);     results.push({ kind: 'config', name, ok }); if (!ok) failed++; }
  for (const name of [...claims.api, ...claims.symbol]) { const ok = checkSymbol(tree.path, name); results.push({ kind: 'symbol', name, ok }); if (!ok) failed++; }
  for (const name of claims.compatible) { const ok = checkCompatible(tree.path, name); results.push({ kind: 'compatible', name, ok }); if (!ok) failed++; }
} catch (e) {
  if (e.gateError) {
    if (o.json) console.log(JSON.stringify({ status: 'gate-error', reason: e.message }));
    else console.error(`[事实检查] gate-error: ${e.message} — NOT scoring as fail`);
    process.exit(3);
  }
  throw e;
}

if (o.json) {
  console.log(JSON.stringify({ status: failed ? 'fail' : 'clean', tree: tree.path, how: tree.how, failed, results, forbidden_respected: claims.forbidden_respected }, null, 2));
} else {
  console.log(`[事实检查] tree: ${tree.path}  (${tree.how})`);
  for (const r of results) console.log(`  ${r.ok ? '✓' : '✗ HALLUCINATION'}  ${r.kind}: ${r.name}`);
  if (claims.forbidden_respected.length) console.log(`  · forbidden_respected (打分员校,不在此检查): ${claims.forbidden_respected.join(', ')}`);
  console.log(failed ? `[事实检查] FAIL — ${failed} claim(s) not found in tree` : `[事实检查] clean — all ${results.length} claim(s) resolved`);
}
process.exit(failed ? 1 : 0);
