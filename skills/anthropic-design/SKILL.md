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

## 发布前检查（MUST）

生成任何完整 HTML 页面（demo / 模板 / 落地页）后、向用户宣布"完成"前，**必须**按 `dos-and-donts.md` 末尾的 7 项 checklist 逐项确认。重点：

- 禁止任何 `[placeholder]` 字符串留在产物里 —— 必须是真 inline SVG（见 `components.md` §28）。
- Hero 段必须用 `.anth-container` 或 `.anth-container--wide`；**不要**用 `.anth-container--narrow`（720 是长文正文宽度）。
- 提交前用 `python3 -m http.server` 打开目测 —— 不做这一步不算完成。
