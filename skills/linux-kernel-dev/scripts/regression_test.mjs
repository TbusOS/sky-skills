#!/usr/bin/env node
// regression_test.mjs — kernel 回归测试 (HARNESS-DESIGN §6.6 / §9 步5).
// 照 design-review/scripts/regression-gate.mjs 的骨架重写:控制流(记基线→重跑→退步即 fail)
// 照搬,只把两处换成 kernel 的——检查引擎 = fact_gate.mjs;测试对象 = tests/eval/cases/*.json。
//
// 每条用例做两件确定性的事(无需 LLM,可 CI):
//   1) gold_claims 必须在真内核树里全部查得到(用例本身有效 + 顺带抓版本漂:旧版有、新版没了)
//   2) 自降解校准(防护#1):把 gold 故意改坏(塞假 CONFIG/API),fact_gate 必须判 fail
//      —— 证明"检查真能分好坏",不是只会盖章
// 覆盖率(防护#2):统计多少用例真跑了检查;真跑比例 < 70% 标"不可信"。
//
// 用法:
//   node regression_test.mjs --baseline [--tree <t>]   记录当前通过情况到 tests/eval/baseline.json
//   node regression_test.mjs --check    [--tree <t>]   重跑,任一客观用例退步则 exit 1
//   node regression_test.mjs            [--tree <t>]   只报告
//
// exit: 0 干净 / 1 退步或校准失败 / 3 检查坏(无树,覆盖率 0)

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL = resolve(__dirname, '..');
const FACT_GATE = join(__dirname, 'fact_gate.mjs');
const CASES_DIR = join(SKILL, 'tests', 'eval', 'cases');
const BASELINE = join(SKILL, 'tests', 'eval', 'baseline.json');

function parseArgs(argv) {
  const o = { mode: 'report', tree: null, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--baseline') o.mode = 'baseline';
    else if (a === '--check') o.mode = 'check';
    else if (a === '--tree') o.tree = argv[++i];
    else if (a === '--json') o.json = true;
  }
  return o;
}

function claimsText(c) {
  const L = ['[CLAIMS]'];
  if (c.config?.length) L.push(`config: ${c.config.join(', ')}`);
  if (c.api?.length) L.push(`api: ${c.api.join(', ')}`);
  if (c.symbol?.length) L.push(`symbol: ${c.symbol.join(', ')}`);
  if (c.compatible?.length) L.push(`compatible: ${c.compatible.join('; ')}`);
  L.push('[/CLAIMS]');
  return L.join('\n') + '\n';
}

// run fact_gate on a claims block; returns status string: clean|fail|gate-error
function runGate(text, tree) {
  const args = [FACT_GATE, '-', '--json'];
  if (tree) { args.push('--tree', tree); }
  let out;
  try {
    out = execFileSync('node', args, { input: text, maxBuffer: 32 * 1024 * 1024 }).toString();
  } catch (e) {
    out = (e.stdout && e.stdout.toString()) || '';
  }
  try { return JSON.parse(out).status; } catch { return 'gate-error'; }
}

// apply one corruption to gold claims -> a copy with the bad claim injected
function corrupt(gold, cor) {
  const g = JSON.parse(JSON.stringify(gold));
  const bucket = cor.type === 'fake-config' ? 'config'
    : cor.type === 'fake-compatible' ? 'compatible' : 'api';
  (g[bucket] ||= []).push(cor.claim);
  return g;
}

// ---- load cases ----
if (!existsSync(CASES_DIR)) { console.error(`no cases dir: ${CASES_DIR}`); process.exit(3); }
const cases = readdirSync(CASES_DIR).filter(f => f.endsWith('.json'))
  .map(f => JSON.parse(readFileSync(join(CASES_DIR, f), 'utf8')));
if (!cases.length) { console.error('no cases found'); process.exit(3); }

const o = parseArgs(process.argv.slice(2));
const results = [];
let ran = 0, objPass = 0, calibFail = 0;

for (const c of cases) {
  const gold = c.gold_claims || {};
  const goldStatus = runGate(claimsText(gold), o.tree);
  if (goldStatus === 'gate-error') { results.push({ id: c.id, ran: false }); continue; }
  ran++;
  const goldOk = goldStatus === 'clean';            // gold 必须干净
  // 自降解校准:每个 corruption 必须被判 fail
  const calib = (c.corruptions || []).map(cor => {
    const st = runGate(claimsText(corrupt(gold, cor)), o.tree);
    return { claim: cor.claim, caught: st === 'fail' };
  });
  const calibOk = calib.every(x => x.caught);
  if (c.kind !== 'subjective' && goldOk) objPass++;
  if (!calibOk) calibFail++;
  results.push({ id: c.id, ran: true, kind: c.kind || 'objective', goldOk, calibOk, calib });
}

const coverage = cases.length ? ran / cases.length : 0;

function report() {
  console.log(`[回归测试] 用例 ${cases.length} · 真跑 ${ran} · 覆盖率 ${(coverage * 100).toFixed(0)}%${o.tree ? ` · 树 ${o.tree}` : ' · (未指定树,fact_gate 自寻)'}`);
  for (const r of results) {
    if (!r.ran) { console.log(`  ⃠  ${r.id}  跳过(无树)`); continue; }
    const g = r.goldOk ? 'gold✓' : 'gold✗(用例失效/版本漂?)';
    const k = r.calibOk ? '校准✓' : '校准✗(检查没抓到坏的!)';
    console.log(`  ${r.goldOk && r.calibOk ? '✓' : '✗'}  ${r.id}  ${g}  ${k}`);
  }
  console.log(`[回归测试] 客观用例通过 ${objPass} · 校准失败 ${calibFail}`);
  if (coverage < 0.7) console.log(`[回归测试] ⚠ 真跑覆盖率 ${(coverage * 100).toFixed(0)}% < 70% —— 结果不可信(多数用例没真跑检查,可能没绑树)`);
}

if (o.json) console.log(JSON.stringify({ total: cases.length, ran, coverage, objPass, calibFail, results }, null, 2));
else report();

if (ran === 0) { if (!o.json) console.error('[回归测试] 检查坏:没有用例真跑(无树?)'); process.exit(3); }

if (o.mode === 'baseline') {
  const base = {};
  for (const r of results) if (r.ran) base[r.id] = { goldOk: r.goldOk, calibOk: r.calibOk };
  writeFileSync(BASELINE, JSON.stringify(base, null, 2) + '\n');
  console.log(`[回归测试] 基线已记录 → ${BASELINE.replace(SKILL + '/', '')}（${Object.keys(base).length} 用例）`);
  process.exit(0);
}

if (o.mode === 'check') {
  if (!existsSync(BASELINE)) { console.error('[回归测试] 无基线,先跑 --baseline'); process.exit(3); }
  const base = JSON.parse(readFileSync(BASELINE, 'utf8'));
  let regressed = 0;
  for (const r of results) {
    if (!r.ran) continue;
    const b = base[r.id];
    if (!b) continue; // 新用例,不算退步
    if (b.goldOk && !r.goldOk) { console.log(`  退步: ${r.id} gold 从 ✓ 变 ✗`); regressed++; }
    if (b.calibOk && !r.calibOk) { console.log(`  退步: ${r.id} 校准从 ✓ 变 ✗`); regressed++; }
  }
  if (regressed || calibFail) { console.error(`[回归测试] FAIL —— ${regressed} 处退步,${calibFail} 处校准失败`); process.exit(1); }
  console.log('[回归测试] clean —— 无退步'); process.exit(0);
}

// report mode
process.exit(calibFail ? 1 : 0);
