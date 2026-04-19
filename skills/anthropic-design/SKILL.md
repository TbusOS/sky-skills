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

## 发布前检查（MUST — 交给 design-review skill）

生成任何完整 HTML 页面后、宣布"完成"前,**必须**依次跑三道闸:

```bash
# 1) 结构验证(静态扫描)
python3 skills/design-review/scripts/verify.py --skill=anthropic <path/to/your.html>

# 2) 视觉渲染验证(Playwright)
node skills/design-review/scripts/visual-audit.mjs <path/to/your.html>

# 3) 全页截图,肉眼审核
node skills/design-review/scripts/screenshot.mjs <path/to/your.html> shot.png
```

**任一脚本 exit 非 0 = 没完成**。规则与已知 bug 见
`skills/design-review/references/cross-skill-rules.md` +
`skills/design-review/references/known-bugs.md`。

Evaluator 和 generator 分离是刻意的 —— 参考 Anthropic
[harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)
里的 GAN 式 discriminator:reviewer 不继承 generator 的立场。

### anthropic 专属要点

- `.anth-button` 橙底必须 `color: #ffffff; font-weight: 600;`(cream 在橙上是 2.96, fail AA)
- Hero 段必须 `class="anth-container anth-container--wide"`(**base + modifier 都要**)
- 风格规则详见 `references/dos-and-donts.md`
