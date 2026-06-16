#!/usr/bin/env node
// version_drift.mjs — 版本适配检测 (HARNESS-DESIGN §6.9).
// 拿测试用例的 gold_claims 在多棵不同版本的内核源码树上各跑一遍 fact_gate,
// 报告哪些断言"这版有、那版没了"——即版本敏感/版本漂。
//   · rotted:旧版查得到、最新版查不到(API 被删/改名)→ 该给知识打版本标
//   · new:旧版没有、新版才有(新 API)
// 把 dirty_pages 那套"手维护"变成机器跑出来。
//
// 用法:
//   node version_drift.mjs --trees <path1,path2,...> [--json]
//   (树路径只走命令行/本机配置,不入库)
//
// exit: 0 无漂 / 1 检出版本漂(需要打版本标的知识) / 3 检查坏(树不足/不可用)

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL = resolve(__dirname, '..');
const FACT_GATE = join(__dirname, 'fact_gate.mjs');
const CASES_DIR = join(SKILL, 'tests', 'eval', 'cases');

function parseArgs(argv) {
  const o = { trees: [], json: false, casesDir: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--trees') o.trees = (argv[++i] || '').split(',').map(s => s.trim()).filter(Boolean);
    else if (a === '--tree') o.trees.push(argv[++i]);
    else if (a === '--cases') o.casesDir = argv[++i];
    else if (a === '--json') o.json = true;
  }
  return o;
}
function read(p) { try { return readFileSync(p, 'utf8'); } catch { return null; } }
function treeVersion(p) {
  const mk = read(join(p, 'Makefile')) || '';
  const g = k => (mk.match(new RegExp(`^${k}\\s*=\\s*(\\S+)`, 'm')) || [])[1];
  const v = g('VERSION'), pl = g('PATCHLEVEL'), s = g('SUBLEVEL');
  return v && pl ? (s ? `${v}.${pl}.${s}` : `${v}.${pl}`) : '?';
}
function verKey(v) { return v.split('.').map(n => parseInt(n, 10) || 0); }
function cmpVer(a, b) { const A = verKey(a), B = verKey(b); for (let i = 0; i < 3; i++) { if ((A[i] || 0) !== (B[i] || 0)) return (A[i] || 0) - (B[i] || 0); } return 0; }

function claimsText(c) {
  const L = ['[CLAIMS]'];
  if (c.config?.length) L.push(`config: ${c.config.join(', ')}`);
  if (c.api?.length) L.push(`api: ${c.api.join(', ')}`);
  if (c.symbol?.length) L.push(`symbol: ${c.symbol.join(', ')}`);
  if (c.compatible?.length) L.push(`compatible: ${c.compatible.join('; ')}`);
  L.push('[/CLAIMS]');
  return L.join('\n') + '\n';
}
// returns {status, results:[{kind,name,ok}]}
function runGate(text, tree) {
  const args = [FACT_GATE, '-', '--json', '--tree', tree];
  let out;
  try { out = execFileSync('node', args, { input: text }).toString(); }
  catch (e) { out = (e.stdout && e.stdout.toString()) || ''; }
  try { return JSON.parse(out); } catch { return { status: 'gate-error', results: [] }; }
}

const o = parseArgs(process.argv.slice(2));
const trees = o.trees.filter(t => existsSync(t)).map(t => ({ path: resolve(t), version: treeVersion(t) }));
if (trees.length < 2) { console.error('version_drift 需要 ≥2 棵可用的完整源码树:--trees <a>,<b>'); process.exit(3); }
trees.sort((a, b) => cmpVer(a.version, b.version));   // 旧 → 新
const newest = trees[trees.length - 1];

const casesDir = o.casesDir ? resolve(o.casesDir) : CASES_DIR;
if (!existsSync(casesDir)) { console.error(`no cases dir: ${casesDir}`); process.exit(3); }
const cases = readdirSync(casesDir).filter(f => f.endsWith('.json')).map(f => JSON.parse(read(join(casesDir, f))));

// claimKey -> { version -> ok }
const matrix = new Map();
for (const c of cases) {
  for (const t of trees) {
    const r = runGate(claimsText(c.gold_claims || {}), t.path);
    if (r.status === 'gate-error') { console.error(`[version_drift] 检查坏:${t.path} 不可用`); process.exit(3); }
    for (const res of r.results) {
      const key = `${res.kind}:${res.name}`;
      if (!matrix.has(key)) matrix.set(key, {});
      matrix.get(key)[t.version] = res.ok;
    }
  }
}

const drift = [];
for (const [key, byVer] of matrix) {
  const vals = trees.map(t => byVer[t.version]);
  const allSame = vals.every(v => v === vals[0]);
  if (allSame) continue;
  const inNewest = byVer[newest.version];
  const inOldest = byVer[trees[0].version];
  const kind = inOldest && !inNewest ? 'rotted' : (!inOldest && inNewest ? 'new' : 'mixed');
  drift.push({ key, kind, byVer: { ...byVer } });
}

if (o.json) {
  console.log(JSON.stringify({ trees: trees.map(t => `${t.version} @ ${t.path}`), drift }, null, 2));
} else {
  console.log(`[version_drift] 树: ${trees.map(t => t.version).join(' → ')}（旧→新）`);
  if (!drift.length) { console.log('  无版本漂:所有 gold 断言在各版本一致。'); }
  else {
    console.log(`  检出 ${drift.length} 处版本漂(需要给对应知识打版本标,见 references/kernel_version_deltas.md):`);
    for (const d of drift) {
      const cells = trees.map(t => `${t.version}:${d.byVer[t.version] ? '✓' : '✗'}`).join('  ');
      const tag = d.kind === 'rotted' ? '⚠ ROTTED(新版没了)' : d.kind === 'new' ? '＋ NEW(新版才有)' : '~ MIXED';
      console.log(`  ${tag}  ${d.key}   [${cells}]`);
    }
  }
}
process.exit(drift.length ? 1 : 0);
