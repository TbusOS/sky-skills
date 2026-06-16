#!/usr/bin/env node
// kernel-critic.mjs — 准备 4 个 kernel 打分员的 prompt (HARNESS-DESIGN §6.5).
// 照 design-review/scripts/multi-critic.mjs 的模式:本脚本只“拼 prompt”,真正打分由
// Claude Code 的 Task 工具并行派给 4 个子 agent,再聚合。
//
//   correctness 0.35 · safety 0.30 · coding-style 0.20 · completeness 0.15
//
// 用法:
//   node kernel-critic.mjs <answer.md> [--case KV-001] [--tree <t>] [--out-dir <dir>]
//
// 产出:4 个 prompt 文件 + 1 个聚合模板,写到 out-dir(默认 .scratch/critic);
// stdout 打 JSON manifest(含 Task 派发说明)。out-dir 应在 .scratch(不入库)。

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL = resolve(__dirname, '..');
const REPO_ROOT = resolve(SKILL, '../..');
const AGENTS = join(REPO_ROOT, '.claude', 'agents');

const SPECIALISTS = [
  { axis: 'correctness',  weight: 0.35, agent: 'kernel-correctness-critic.md',  refs: ['references/claims-contract.md'] },
  { axis: 'safety',       weight: 0.30, agent: 'kernel-safety-critic.md',       refs: ['references/bsp_discipline.md'] },
  { axis: 'coding-style', weight: 0.20, agent: 'kernel-coding-style-critic.md', refs: ['references/coding-style.md'] },
  { axis: 'completeness', weight: 0.15, agent: 'kernel-completeness-critic.md', refs: ['references/claims-contract.md'] },
];

function parseArgs(argv) {
  const o = { answer: null, case: null, tree: null, outDir: join(SKILL, '.scratch', 'critic') };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--case') o.case = argv[++i];
    else if (a === '--tree') o.tree = argv[++i];
    else if (a === '--out-dir') o.outDir = argv[++i];
    else if (!a.startsWith('--')) o.answer = a;
  }
  return o;
}
function read(p) { try { return readFileSync(p, 'utf8'); } catch { return null; } }
function fence(lang, body) { return '```' + lang + '\n' + (body || '(无)') + '\n```'; }

const o = parseArgs(process.argv.slice(2));
if (!o.answer || !existsSync(o.answer)) {
  console.error('用法: kernel-critic.mjs <answer.md> [--case KV-001] [--tree <t>] [--out-dir <dir>]');
  process.exit(2);
}
const answer = read(o.answer);

// 拉用例上下文(rubric / forbidden / gold)
let caseCtx = '(未指定 --case)';
if (o.case) {
  const cf = join(SKILL, 'tests', 'eval', 'cases', `${o.case}.json`);
  const c = read(cf);
  if (c) {
    const j = JSON.parse(c);
    caseCtx = `id: ${j.id}\n问题: ${j.q}\nrubric: ${j.rubric || '(无)'}\nforbidden: ${(j.forbidden || []).join(' / ') || '(无)'}`;
  } else caseCtx = `(找不到用例 ${o.case})`;
}

// 跑 fact_gate 把结果喂给 correctness/completeness
let gateOut = '(未跑 fact_gate —— 未指定 --tree)';
if (o.tree) {
  const args = [join(__dirname, 'fact_gate.mjs'), o.answer, '--tree', o.tree];
  try { gateOut = execFileSync('node', args).toString(); }
  catch (e) { gateOut = (e.stdout && e.stdout.toString()) || `(fact_gate exit ${e.status})`; }
}

mkdirSync(o.outDir, { recursive: true });
const base = basename(o.answer).replace(/\.[^.]+$/, '');
const promptFiles = [];

for (const s of SPECIALISTS) {
  const spec = read(join(AGENTS, s.agent)) || `(agent 定义缺失: ${s.agent})`;
  const refBlocks = s.refs.map(r => `## 参考 ${r}\n\n${fence('markdown', read(join(SKILL, r)) || '(缺)')}`).join('\n\n');
  const needsGate = s.axis === 'correctness' || s.axis === 'completeness';
  const needsForbidden = s.axis === 'safety';
  const forbiddenBlock = needsForbidden
    ? `## SKILL.md Forbidden Actions\n\n${fence('markdown', (read(join(SKILL, 'SKILL.md')) || '').split('## Forbidden Actions')[1]?.split('## References')[0] || '(缺)')}`
    : '';
  const prompt = `<!-- kernel-critic · axis=${s.axis} · case=${o.case || '-'} · answer=${o.answer} -->

# System prompt · ${s.agent.replace('.md', '')}

${spec}

---

# User prompt

按 **${s.axis}** 这一个角度评下面的答案。其它角度有别的打分员并行评,别越界。
先输出 JSON 裁决,再写 2-3 句narrative。

## 任务上下文
${fence('text', caseCtx)}

## 待评答案 (\`${o.answer}\`)
${fence('markdown', answer)}

${needsGate ? `## fact_gate 结果(实存校验,你 correctness/completeness 要用)\n\n${fence('text', gateOut)}` : ''}

${forbiddenBlock}

${refBlocks}

---

**现在给出你 ${s.axis} 这一个角度的裁决。** JSON 先,narrative 后。
`;
  const pf = join(o.outDir, `kernel-critic-${s.axis}-${base}.md`);
  writeFileSync(pf, prompt);
  promptFiles.push(pf);
  console.error(`wrote ${s.axis} → ${pf} (${prompt.length} chars)`);
}

const aggPath = join(o.outDir, `kernel-critic-AGGREGATE-${base}.md`);
writeFileSync(aggPath, `# kernel-critic 聚合

4 个角度裁决(各读对应 prompt 文件的子 agent 输出):
${SPECIALISTS.map((s, i) => `- ${s.axis} (权重 ${(s.weight * 100).toFixed(0)}%) → ${promptFiles[i]}`).join('\n')}

## 你的活
1. 读每个角度的 JSON 裁决(不看 narrative)。
2. 加权总分: overall = 0.35·correctness + 0.30·safety + 0.20·coding-style + 0.15·completeness
3. 合并 issues,各标来源角度。
4. **safety 是硬轴**:safety 有 error 级问题 → overall 直接判 fail,不管总分。
5. 给统一裁决 + 2-3 句:哪轴最低、哪些问题跨轴、最该先修的一件。

阈值: ≥90 pass(可交) · 75-89 带告警 pass · 60-74 warn · <60 fail
`);

console.log(JSON.stringify({
  answer: o.answer, case: o.case, tree: o.tree || null,
  specialists: SPECIALISTS.map((s, i) => ({ axis: s.axis, weight: s.weight, agent: s.agent, prompt_file: promptFiles[i] })),
  aggregator: aggPath,
  dispatch: 'Claude Code: Task(subagent_type="kernel-<axis>-critic", prompt=该文件内容) ×4 并行,再用聚合模板合成。safety 有 error → fail。',
}, null, 2));
