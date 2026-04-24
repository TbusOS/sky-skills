---
name: anthropic-design
description: "Render HTML/CSS in anthropic.com visual aesthetic — warm cream background (#faf9f5), Poppins headings + Lora serif body, orange accent (#d97757) for CTAs and emphasis, rounded filled pill buttons, editorial card grids, abstract SVG illustrations, low-saturation data visualizations (soft blue/gray/teal), hand-drawn SVG architecture diagrams with orange/blue/green node categorization and diamond decision gates. TRIGGER when the user says 'anthropic 风格' / 'anthropic style' / 'claude 官网风格' / 'Anthropic 品牌', or asks for an editorial/long-form page, research article layout, pricing card grid, or a filled-button-with-warmth feel. DO NOT TRIGGER for generic 'beautiful web page' requests (use frontend-design) or Apple aesthetic (use apple-design)."
last-verified: 2026-04-19
---

# Anthropic Design — HTML 风格

让 Claude 以 anthropic.com / claude.com 视觉语言输出：暖米白底、Poppins + Lora 字体、橙色主强调、编辑式卡片网格、抽象 SVG 插画、低饱和图表、手工 SVG 架构图。

## 使用方式

1. 在 HTML 里引入 `<link rel="stylesheet" href="assets/fonts.css">` 与 `<link rel="stylesheet" href="assets/anthropic.css">`。
2. 写业务结构时套用 `anth-*` class 前缀。具体组件用法见 `references/components.md`。
3. 新开模板直接从 `templates/` 复制。

## 触发关键词

`anthropic 风格` / `anthropic style` / `claude 官网风格` / `Anthropic 品牌` / `warm cream + orange` / `编辑式长文` / `Poppins Lora`

## 不要用于

- 通用"好看页面"（用 `frontend-design`）
- Apple 美学（用 `apple-design`）
- 高饱和 / 霓虹 / 赛博朋克

## 阅读顺序

1. `references/design-tokens.md` — 所有 CSS 变量
2. `references/typography.md` — 字体层级（Lora serif 正文是核心差异）
3. `references/layout-patterns.md` — 六类版式骨架 + **容器选择表**
4. `references/components.md` — 28 组件（含 §28 Inline SVG 插画模板）
5. `references/motion.md` — 动画缓动
6. `references/imagery.md` — 抽象 SVG 插画规则
7. `references/data-display.md` — 低饱和图表色板
8. `references/responsive.md` — 断点与 max-width
9. `references/dos-and-donts.md` — 反例 + **发布前 7 项 checklist（MUST）**

## 发布前检查(MUST — 交给 design-review skill)

### 生成**前**读 canonical + 拿合约

任何 page-type(pricing / landing / docs-home / 其他)开写之前必须:

```bash
# 生成 sprint-contract(把 MUST/MUST NOT 交给生成器自己)
bin/design-review --plan --skill=anthropic --page=pricing > /tmp/contract.md
# 然后读 skills/anthropic-design/references/canonical/<page>.html + .md
```

**不读 canonical 就写 = 必然偏掉风格**。canonical.md 里的 7-8 条设计
决定 + typography 表就是评分标准。

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

四闸依次:
1. `verify.py` — 结构(placeholders / DOCTYPE / BEM / SVG / class / §G 双语)
2. `visual-audit.mjs` — 渲染(contrast / hero 宽 / SVG 字号 / hollow card /
   **brand-presence §K / italic-overuse §J / cross-skill-smell §K**)
3. `screenshot.mjs` — 全页 PNG 存 `shots/`
4. `critic.mjs` — LLM taste 评审(输出 JSON + 0-100 分,canonical 自跑 ≥ 90)

**任一 error 整个失败**。warn 要判断是否放行。critic 得分 < 75 必修。

规则与已知 bug 全在 `skills/design-review/references/cross-skill-rules.md`
(A-L)+ `known-bugs.md`。canonical 文件在
`skills/anthropic-design/references/canonical/`(pricing / landing /
docs-home 各一对 .html + .md)。

Evaluator 和 generator 分离是刻意的 —— 参考 Anthropic
[harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)
里的 GAN 式 discriminator:reviewer 不继承 generator 的立场。

### anthropic 专属要点

- `.anth-button` 橙底必须 `color: #ffffff; font-weight: 600;`(cream 在橙上是 2.96, fail AA)
- Hero 段必须 `class="anth-container anth-container--wide"`(**base + modifier 都要**)
- 风格规则详见 `references/dos-and-donts.md`
