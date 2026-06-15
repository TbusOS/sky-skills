---
name: ember-design
description: "Render HTML/CSS in a handcraft-editorial aesthetic — warm cream background (#fff2df), deep chocolate text (#312520), rich brown CTAs (#492d22), gold accent (#c49464), Fraunces display serif + Inter body + IBM Plex Mono. Evokes artisan brands (Aesop / Kinfolk / boutique hotels / literary journals / small-batch coffee). TRIGGER when the user says 'ember 风格' / 'ember style' / '暖棕 / 咖啡 / 手工 / 编辑风格' / 'Aesop style' / 'warm editorial', or asks for a landing page with craft / artisan / heritage / literary warmth. DO NOT TRIGGER for high-tech minimalism (use apple-design) or cream-with-orange (use anthropic-design)."
last-verified: 2026-04-19
---

# Ember Design — Handcraft Editorial

让 Claude 把任何 HTML 渲染成"匠心 · 暖色 · 编辑"的视觉语言：深米底、Fraunces 展示衬线、深巧克力文字、棕色填色按钮、一抹金作点缀。灵感来自 Aesop、Kinfolk、小众精品酒店与文学期刊。

## 使用方式

1. `<link rel="stylesheet" href="assets/fonts.css">` 然后 `<link rel="stylesheet" href="assets/ember.css">`。
2. 用 `ember-*` 前缀 class。
3. 模板见 `templates/`。

## 触发关键词

`ember 风格` / `ember style` / `暖棕` / `咖啡色系` / `手工感` / `编辑式` / `Aesop` / `Kinfolk` / `artisan` / `craft` / `heritage` / `boutique` / `literary journal`

## 不要用于

- 高科技冷极简（用 `apple-design`）
- 米底 + 橙色（用 `anthropic-design`）
- 霓虹 / 彩虹 / 赛博朋克
- 深色 / dark mode（ember 只活在明亮暖色下）

## 阅读顺序

1. `references/design-tokens.md` — 色板 + 字体 + 间距
2. `references/diagram-craft.md` — **手工 SVG 图示工艺（画任何图前 MUST 读）**：暖棕灰阶 + 金单焦点、先定尺寸再画、内核谱系翻译表、图密度合约、反模式
3. `references/dos-and-donts.md` — 反例 + **发布前 checklist**
4. `assets/ember.css` — CSS 变量与组件
5. `templates/landing-page.html` — 着陆页骨架（图示模板见 `templates/diagrams/`，8 件）

## 图密度合约（写任何页面前 MUST — 不只画图时）

**尽可能用图表达**——这是默认要求，不需要用户提醒。下表任一形态出现就该配视觉化
（图型列是**默认起点不是强制规格**——结构按实际内容定制、可混搭可自创，硬约束只有
"该有图的地方有图" + 工艺质量闸）：

| 内容形态 | 必须配 | 内容形态 | 必须配 |
|---|---|---|---|
| ≥3 步流程 / 启动链 / 数据流 | 流程图 | 数字对比 / 统计 | stat callout 或图表 |
| 系统结构 / 分层 / 依赖 | 架构图 | 时间演进 / 排程 | 时间线 |
| 函数控制流 / 寄存器位域 | 函数流程图 / 位域图 | SoC 结构 / 信号时序 / 编译链 | 对应内核图型（diagram-craft §8） |
| 产品 / UI 描述 | 窗口 mock（白卡 + hairline 语法） | 连续纯文字 > 2 屏 | ≥ 1 个视觉元素 |

节奏：每 1.5 屏（≈1300px @1440）≥ 1 个 SVG / figure / stat。机器闸 `text-desert` 在连续
2600px 无视觉元素时 warn（known-bugs 1.31）。动笔画图前再读 `references/diagram-craft.md`：
§6 先定尺寸再画（**内容多就加宽加高画布，禁止把图缩小去迁就版式——看不清 = 没画**）、
§0-1 色彩（暖棕灰阶 `#312520`/`#6b5a4f`/`#8a7564` 分层 + 金 `#c49464` 单焦点 + 低饱和 tint
`#fbeedd`/`#f5e5c8` 做层次——色彩有层次但不抢金的焦点）。现成图直接抄 `templates/diagrams/`
（8 件内核工程谱系），案例库见 `demos/ember-design/diagrams.html`（每张带 Copy SVG）。

## 发布前检查(MUST — 交给 design-review skill)

### 生成**前**读 canonical + 拿合约

```bash
~/.claude/skills/design-review/dr-cli --plan --skill=ember --page=<pricing|landing|docs-home>
# 读 ~/.claude/skills/ember-design/references/canonical/<page>.html + .md
```

### 生成**后**写 self-diff note(交付前 MUST)

生成器在写完 HTML、跑 4 闸之前,必须在 `</body>` 前 embed 一个
`design-review:self-diff v1` HTML 注释块,列出 5-7 条本次生成的关键
设计决策 + 2-3 条 known trade-offs。contract 见
`~/.claude/skills/design-review/references/cross-skill-rules.md §M`,示范参考
`~/.claude/skills/anthropic-design/references/canonical/comparison.html` 末尾。

没有 self-diff = canonical 不被 `verify.py` 承认。critic 也无法做实
质评审(没有作者意图的靶子)。HARNESS-ROADMAP Phase 03 的硬规则。

### 生成**后**跑四闸

```bash
~/.claude/skills/design-review/dr-cli --critic <path/to/your.html>
```

四闸:`verify.py` · `visual-audit.mjs`(加 §J italic / §K brand + smell)·
`screenshot.mjs` · `critic.mjs`(LLM taste 0-100 分)。

任一 error = 失败。critic 得分 < 75 必修。canonical 自回归 ≥ 90。

规则:`~/.claude/skills/design-review/references/cross-skill-rules.md` A-L +
`known-bugs.md`。canonical:`~/.claude/skills/ember-design/references/canonical/`。

Evaluator 和 generator 分离是刻意的 —— 参考 Anthropic
[harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)
里的 GAN 式 discriminator。

### ember 专属要点

历史坑:`.ember-button` 曾被 `.ember-nav a` 吃掉 color(选择器特异性),
在 nav 里的 button 必须写 `.ember-nav a.ember-button { color:#ffffff }` 单独规则。
风格规则详见 `references/dos-and-donts.md`。
