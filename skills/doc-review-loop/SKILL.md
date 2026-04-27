---
name: doc-review-loop
description: "双 agent 交替评审循环 · writer agent 写技术决策书/评审文档/跨团队对齐文档，reviewer agent 扮演严苛评审员逐条质疑找问题，循环直到通过。适用于：技术决策书、出货前评审、复杂改动论证、跨团队对齐、改 vs 不改类问题。TRIGGER when the user says: '我要一份决策书' / '写评审文档' / '建立 writer 和 reviewer 双 agent' / '让评审 agent 评下' / '站在评审员角度看' / '这文档不严谨重写'。DO NOT TRIGGER for: 简单 README / 单页技术 memo / 个人笔记（开销过大不划算）。"
last-verified: 2026-04-27
---

# Doc Review Loop —— 双 agent 交替评审循环

## 解决什么问题

写技术决策书时，单 agent 容易出现：
- 前后矛盾（同份文档不同章节互相打脸）
- 论证不到位（"0 hits 所以可以删"这种弱论证）
- 缺乏来龙去脉（只说"这分区可删"不说"原本干嘛的 / 历史 / 影响 / 证据"）
- 站不住评审员的视角（评审员问"为什么"时答不上来）

每次都让用户手工 challenge、来回返工，效率低。

**双 agent 模式**：让 reviewer agent 在 writer agent 出稿后立刻扮演严苛评审员逐条质疑，writer 修改，循环到 reviewer 通过。质量在内部就过一道筛，不依赖用户每次手工 review。

## 适用场景

✅ **该用**：
- 出货前 / 评审前 决策书（"改 vs 不改 X，给充分理由"）
- 跨团队对齐文档（PM / 业务 / 上游平台 / 法务都要看）
- 复杂改动论证（涉及多分区 / 多模块 / 兼容性 / 历史包袱）
- 风险评估 / 影响分析

❌ **不该用**：
- 简单 README / 安装文档（杀鸡用牛刀）
- 单页技术 memo（< 500 字）
- 个人笔记 / TODO

## 工作流程

```
用户原始需求
    │
    ▼
┌──────────────────────────────────────┐
│ 主对话（你 / Claude 主线）              │
│ 任务：把需求拆成 writer agent prompt    │
│       + reviewer agent role 定义        │
└──────────────────────────────────────┘
    │
    ▼ 派 writer agent 出初稿
┌──────────────────────────────────────┐
│ Writer Agent (初稿)                   │
│ - 输入：需求 + 代码/实测证据             │
│ - 输出：HTML / Markdown / 文档草稿      │
└──────────────────────────────────────┘
    │
    ▼ 派 reviewer agent 评审
┌──────────────────────────────────────┐
│ Reviewer Agent (评审 v1)              │
│ - 角色：严苛 PM / 评审员（背景白纸）     │
│ - 任务：每个论断都质疑                  │
│ - 输出：N 个问题（按严重度排序）         │
└──────────────────────────────────────┘
    │
    ▼ 主对话整合 reviewer 输出 → writer prompt
┌──────────────────────────────────────┐
│ Writer Agent (改稿 v2)                │
│ - 逐条回应 reviewer 问题                │
│ - 修改文档                             │
└──────────────────────────────────────┘
    │
    ▼ 再 reviewer
    ▼ ... 循环到通过 / 达到上限（默认 3 轮）
    │
    ▼
最终稿 + 评审历史日志
```

## 关键约束

1. **主对话不写文档**，只协调 writer / reviewer。
2. **Writer agent 不评自己的稿**（自检会盲，必须独立 reviewer）。
3. **Reviewer agent 必须扮演无背景的评审员**（system prompt 里强调"假设你是 PM，对项目背景一无所知，每个论断都质疑"）。
4. **三轮上限**：超过 3 轮还过不了说明需求不清晰，回到主对话和用户对齐。
5. **每轮 diff 留档**：把每轮 reviewer 的问题列表存进 `<doc_root>.review.log` 文件，方便追溯。

## 步骤详解

### Step 1 · 主对话拆需求

主对话收到用户"我要一份关于 X 的决策书"后：

1. 列出**需求清单**：
   - 文档目标（决策？对齐？教育？）
   - 受众（PM / 工程师 / 上游平台工程师 / 业务方？）
   - 必须涵盖的论点（改 vs 不改、风险、成本、收益）
   - 需要的代码 / 实测证据

2. 派 writer agent 出初稿（看 `templates/writer-prompt.md`）

### Step 2 · Writer agent 出稿

Writer agent 收到的 prompt 包括：
- 文档主题 + 受众
- 用户给的代码证据（已经查过的部分）
- 需要补充查的部分（writer 可以再查）
- 要包含的论点 / 决策 / 数据
- 输出格式（HTML / MD）

Writer 出第一版后，主对话**不要动它**（留给 reviewer 评）。

### Step 3 · Reviewer agent 评审

Reviewer agent 收到的 prompt 强调：
- "你是没接触过这个项目的 PM / 评审员"
- "每个论断都问：为什么这么说？证据在哪？前后矛盾吗？"
- "找出**至少 5 个**问题，按严重度排序（A 阻塞 / B 必须改 / C 建议改）"
- "不要客气、不要 hedge，直接列问题"

输出格式（reviewer 必须遵循）：

```
## 评审 v{N}

### A 级问题（阻塞 · 不改无法发布）
1. [问题] [位置] [建议]
2. ...

### B 级问题（必改 · 论证不充分）
1. ...

### C 级问题（建议改 · 表述能更清晰）
1. ...

### 通过 / 不通过
[判断 + 理由]
```

### Step 4 · Writer agent 改稿

主对话把 reviewer 的问题清单 + 原稿一起给 writer，prompt 是：

> "Reviewer 给了 X 个问题（A:N1 / B:N2 / C:N3）。你的任务：(1) 逐条回应每个问题，说明怎么改 / 为什么不改；(2) 改文档；(3) 输出 diff（哪些章节改了什么）。"

### Step 5 · 循环

主对话再派 reviewer 看新稿。Reviewer 可能：
- 通过 → 流程结束
- 还有问题 → 继续 Step 4

最多 3 轮。3 轮还过不了 → 回主对话和用户重新对齐。

## 文件输出约定

每个文档跑完循环后，主对话产出：

1. `<doc_path>.html` 或 `<doc_path>.md` — 最终稿
2. `<doc_path>.review.log` — 评审历史日志（每轮 reviewer 问题 + writer 回应）
3. （可选）`<doc_path>.png` — 全页截图（如果是 HTML 且配套 anthropic-design）

## 模板文件

- `templates/writer-prompt.md` — writer agent 的 system prompt 模板
- `templates/reviewer-prompt.md` — reviewer agent 的 system prompt 模板
- `references/anti-patterns.md` — 写决策文档的反面教材清单（writer 必读）
- `references/review-checklist.md` — reviewer 必查的 N 项清单

## 触发关键词

主语义：
- "我要一份决策书"
- "写评审文档"
- "建立 writer 和 reviewer 双 agent"
- "让评审 agent 评下"
- "站在评审员角度看"
- "这文档不严谨重写"
- "改 vs 不改类问题需要充分论证"

强信号词：
- "评审"+"严谨"
- "决策"+"理由"
- "充分"+"论证"
- "出货前"+"评审"

## 反面教材（什么时候该用却没用）

抽象案例：用户要求"某重要 config 改 vs 不改的决策书"，主对话直接写了一稿。用户 review 时发现：
- 论证薄弱（"0 hits 所以可删" 不够）
- 前后矛盾（同项目不同章节给出冲突结论）
- 缺来龙去脉（某 config 原本干嘛的没说）

如果当时用 doc-review-loop，reviewer 在内部就会问出这些问题，writer 修完才给用户，免去用户手工 challenge。

## 不适合的反例

1. "写一份 README" → 简单文档，单 agent 出稿即可
2. "写个 commit message" → 太短，杀鸡用牛刀
3. "翻译这段英文" → 没有论证需求

## 参考

- `templates/writer-prompt.md`
- `templates/reviewer-prompt.md`
- `references/review-checklist.md`
