#!/usr/bin/env node
// kernel_learn_validate.mjs — 把 /kernel-learn 的“原子三件套”做成确定性闸 (HARNESS-DESIGN §6.7).
// 地基规则:没有可执行检查就不准建笔记。本脚本确定性校验一条新规则 + 配套用例:
//   1) 用例有 gold_claims + corruptions
//   2) gold_claims 在真树全部查得到(修法是真的)          —— fact_gate 应 clean
//   3) 每个 corruption(那个坑)必须被抓                    —— fact_gate 应 fail  (建前 fail/建后 pass 的客观化)
//   4) 规则文本内嵌 [CLAIMS] 块(可执行检查)
//   5) 去重:规则首行跟现有 known-bugs/dos 的明显重叠 → 警告
// 全过才允许把规则落库 + 注册。
//
// 用法:
//   node kernel_learn_validate.mjs --case <KV-NNN.json> --rule <rule.md|-> [--tree <t>]
//
// exit: 0 三件套有效 / 1 无效(缺检查 / 坑没抓到 / gold 不实存) / 3 检查坏(无树)

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL = resolve(__dirname, '..');
const FACT_GATE = join(__dirname, 'fact_gate.mjs');

function parseArgs(argv) {
  const o = { case: null, rule: null, tree: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--case') o.case = argv[++i];
    else if (a === '--rule') o.rule = argv[++i];
    else if (a === '--tree') o.tree = argv[++i];
  }
  return o;
}
function read(p) { try { return readFileSync(p, 'utf8'); } catch { return null; } }
function claimsText(c) {
  const L = ['[CLAIMS]'];
  if (c.config?.length) L.push(`config: ${c.config.join(', ')}`);
  if (c.api?.length) L.push(`api: ${c.api.join(', ')}`);
  if (c.symbol?.length) L.push(`symbol: ${c.symbol.join(', ')}`);
  if (c.compatible?.length) L.push(`compatible: ${c.compatible.join('; ')}`);
  L.push('[/CLAIMS]');
  return L.join('\n') + '\n';
}
function runGate(text, tree) {
  const args = [FACT_GATE, '-', '--json'];
  if (tree) args.push('--tree', tree);
  let out;
  try { out = execFileSync('node', args, { input: text }).toString(); }
  catch (e) { out = (e.stdout && e.stdout.toString()) || ''; }
  try { return JSON.parse(out).status; } catch { return 'gate-error'; }
}
function corrupt(gold, cor) {
  const g = JSON.parse(JSON.stringify(gold));
  const b = cor.type === 'fake-config' ? 'config' : cor.type === 'fake-compatible' ? 'compatible' : 'api';
  (g[b] ||= []).push(cor.claim);
  return g;
}

const o = parseArgs(process.argv.slice(2));
if (!o.case || !o.rule) { console.error('用法: kernel_learn_validate.mjs --case <KV.json> --rule <rule.md|-> [--tree <t>]'); process.exit(2); }

const caseName = o.case.endsWith('.json') ? o.case : `${o.case}.json`;
const caseRaw = read(o.case) || read(join(SKILL, 'tests', 'eval', 'cases', caseName));
if (!caseRaw) { console.error(`找不到用例: ${o.case}`); process.exit(2); }
const c = JSON.parse(caseRaw);
const ruleText = o.rule === '-' ? readFileSync(0, 'utf8') : (read(o.rule) || '');

const fails = [];

// 1) 结构
if (!c.gold_claims || !Object.keys(c.gold_claims).length) fails.push('用例缺 gold_claims');
if (!c.corruptions || !c.corruptions.length) fails.push('用例缺 corruptions(没有“坑”就无法证明建前fail)');

// 4) 规则内嵌可执行检查
if (!/\[CLAIMS\][\s\S]*\[\/CLAIMS\]/.test(ruleText)) fails.push('规则文本没有内嵌 [CLAIMS] 块(无可执行检查 → 拒绝)');

// 2)+3) 实存 + 抓坑(需树)
let gateRan = false;
if (c.gold_claims && c.corruptions) {
  const goldStatus = runGate(claimsText(c.gold_claims), o.tree);
  if (goldStatus === 'gate-error') {
    console.error('[kernel-learn-validate] 检查坏:无树,gold/坑都没法验。先 --tree 或 kernel-tree add。');
    process.exit(3);
  }
  gateRan = true;
  if (goldStatus !== 'clean') fails.push(`gold_claims 在树里没全查到(修法不实存?status=${goldStatus})`);
  c.corruptions.forEach(cor => {
    const st = runGate(claimsText(corrupt(c.gold_claims, cor)), o.tree);
    if (st !== 'fail') fails.push(`坑没被抓到: ${cor.claim}(检查判 ${st},应 fail)`);
  });
}

// 5) 去重(轻量:用例 topic / 规则首行关键词 与现有 known-bugs/dos 重叠)
const firstLine = (ruleText.split('\n').find(l => l.trim()) || '').replace(/^#+\s*/, '').slice(0, 40);
const existing = (read(join(SKILL, 'known-bugs.md')) || '') + (read(join(SKILL, 'dos-and-donts.md')) || '');
if (firstLine && existing.includes(firstLine)) console.error(`[提示] 规则首行疑似与现有条目重复:"${firstLine}" —— 考虑合并而非新建。`);

if (fails.length) {
  console.error('[kernel-learn-validate] 三件套无效:');
  for (const f of fails) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`[kernel-learn-validate] ✓ 三件套有效${gateRan ? '(gold 实存 + 坑全抓)' : ''} —— 可落库 + 注册`);
process.exit(0);
