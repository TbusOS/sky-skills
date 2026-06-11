---
name: apple-design
description: "Render HTML/CSS in apple.com visual aesthetic — white/pale-gray alternating sections, SF Pro typography, minimal text links (no filled buttons except Buy CTA), large statistic callouts, product-photography-driven layout, isometric infographics, hand-drawn SVG flow/architecture diagrams. TRIGGER when the user says 'apple 风格' / 'apple style' / '苹果官网风格' / 'like apple.com', or asks to design a landing page / slide / doc / diagram / spec page / configurator matching Apple's web look. DO NOT TRIGGER for native iOS/macOS UI (use an Apple HIG skill instead)."
last-verified: 2026-04-19
---

# Apple Design — HTML 风格

这份 skill 让 Claude 在任何 HTML 任务里以 apple.com 的视觉语言输出：纯白底 + 交替浅灰段落、SF 字体、克制的文字链、巨字号统计、产品摄影主导、等距插画与手工 SVG 流程图。

## 使用方式

1. 在 HTML 里引入 `<link rel="stylesheet" href="assets/apple.css">`（或把 `assets/apple.tailwind.js` merge 到你的 tailwind config）。
2. 配合 `<link rel="stylesheet" href="assets/fonts.css">` 启用字体栈。
3. 写业务结构时套用 `apple-*` class 前缀。具体组件用法见 `references/components.md`。
4. 新开模板直接从 `templates/` 复制。

## 触发关键词

`apple 风格` / `apple style` / `苹果官网风格` / `like apple.com` / `SF Pro` / `apple 极简` / `产品叙事` / `巨字号统计`

## 不要用于

- iOS / iPadOS / macOS 原生 App UI（用 Apple HIG 专属 skill）
- 需要深色 Material / 彩虹渐变 / AI-slop 美学的场景

## 阅读顺序

1. `references/design-tokens.md` — 所有 CSS 变量
2. `references/typography.md` — 字体层级与规则
3. `references/layout-patterns.md` — 六类版式骨架 + **容器选择表**
4. `references/components.md` — 28 组件（含 §28 Inline SVG 插画模板）
5. `references/diagram-craft.md` — **手工 SVG 图示工艺（画任何架构/流程/层级/时间线/时序图前 MUST 读）**：美靠"少"、蓝色单焦点、柔影白卡、布局公式、时序图 pattern、图密度合约、反模式
6. `references/motion.md` — 动画缓动
7. `references/imagery.md` — 摄影与圆角规则
8. `references/data-display.md` — 巨字号统计 + 等距插画
9. `references/responsive.md` — 断点与 max-width
10. `references/dos-and-donts.md` — 反例 + **发布前 7 项 checklist（MUST）**

## 图密度合约（写任何页面前 MUST — 不只画图时）

**尽可能用图表达**——这是默认要求，不需要用户提醒。下表任一形态出现就该配视觉化
（图型列是**默认起点不是强制规格**——结构按实际内容定制、可混搭可自创，硬约束只有
"该有图的地方有图" + 工艺质量闸，三层约束见 `diagram-craft.md` 开头）：

| 内容形态 | 必须配 | 内容形态 | 必须配 |
|---|---|---|---|
| 数字对比 / 统计 | **巨字号统计**（apple 的视觉主角，计入视觉元素） | ≥3 步流程 / 启动链 / 数据流 | 流程图或时序图 |
| 系统结构 / 分层 / 依赖 | 架构图 | 时间演进 / 版本 / 里程碑 | 时间线 |
| 产品 / UI 描述 | 设备线稿 mock（diagram-craft §8 + `templates/diagrams/device-mock.svg`） | 连续纯文字 > 2 屏 | ≥ 1 个视觉元素 |
| 函数控制流 / 寄存器位域 | 函数流程图 / 位域图 | SoC 结构 / 信号时序 / 编译链 / 调度 | 对应内核图型（diagram-craft §12） |

节奏：每 1.5 屏（≈1300px @1440）≥ 1 个 SVG / figure / stat。机器闸 `text-desert` 在连续
2600px 无视觉元素时 warn（known-bugs 1.31）。动笔画图前再读 `references/diagram-craft.md`：
§6 先定尺寸再画（**内容多就加宽加高画布，禁止把图缩小去迁就版式——看不清 = 没画**；
信息密集图必须走 `--hero` 1280px 容器 + `grid-column: 1 / -1`，否则文字被压到 <9px）、
§0 色彩身份（灰阶为本 + 蓝 `#0071e3` 全图一处——apple 的"少"靠柔影和留白做层次，不是单调）。
现成图直接抄 `templates/diagrams/`（14 件图型 + device-mock 底版），案例库见
`demos/apple-design/diagrams.html`（每张带 Copy SVG）。

## 发布前检查(MUST — 交给 design-review skill)

### 生成**前**读 canonical + 拿合约

```bash
bin/design-review --plan --skill=apple --page=<pricing|landing|docs-home> > /tmp/contract.md
# 读 skills/apple-design/references/canonical/<page>.html + .md
```

### 生成**后**写 self-diff note(交付前 MUST)

生成器在写完 HTML、跑 4 闸之前,必须在 `</body>` 前 embed 一个
`design-review:self-diff v1` HTML 注释块,列出 5-7 条本次生成的关键
设计决策 + 2-3 条 known trade-offs。contract 见
`skills/design-review/references/cross-skill-rules.md §M`,示范参考
`skills/anthropic-design/references/canonical/comparison.html` 末尾。

没有 self-diff = canonical 不被 `verify.py` 承认。critic 也无法做实
质评审(没有作者意图的靶子)。HARNESS-ROADMAP Phase 03 的硬规则。

### 生成**后**跑四闸

```bash
bin/design-review --critic <path/to/your.html>
```

四闸:`verify.py` · `visual-audit.mjs`(加 §J italic / §K brand + smell)·
`screenshot.mjs` · `critic.mjs`(LLM taste 0-100 分)。

任一 error = 失败。critic 得分 < 75 必修。canonical 自回归 ≥ 90。

规则:`skills/design-review/references/cross-skill-rules.md` A-L +
`known-bugs.md`。canonical:`skills/apple-design/references/canonical/`。

Evaluator 和 generator 分离是刻意的 —— 参考 Anthropic
[harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)
里的 GAN 式 discriminator。

### apple 专属要点

- Hero 段必须 `class="apple-container apple-container--hero"`(**base + modifier 都要**)。apple 的 base container 是窄(980px)的, hero 必须 `--hero` (1280px) 否则 SoC / multi-repo 这种信息密集框图会被压得文字 <9px
- 信息密集的 hero 框图必须 `grid-column: 1 / -1`
- 风格规则详见 `references/dos-and-donts.md`
