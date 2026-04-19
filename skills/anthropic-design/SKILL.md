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

## 发布前检查（MUST — 可执行）

生成任何完整 HTML 页面后、宣布"完成"前，**必须**依次跑下面两条命令。它们不是建议，是闸口 —— exit 非 0 就是没完成。

### 1. 结构验证（必跑）

```bash
python3 skills/anthropic-design/scripts/verify.py <path/to/your.html>
```

自动检查：
- 无 `[placeholder]` / `[hero]` / `[abstract illustration]` 等括号占位符
- `<!doctype html>` + viewport meta 存在
- Hero 段用 `.anth-container`（默认 960）或 `.anth-container--wide`（**不得用 `.anth-container--narrow`**，它是给长文正文）
- 每个 `class="anth-*"` 在 `anthropic.css` 都有定义（无幽灵 class）
- `<svg>` 标签平衡

Exit 0 = 可以宣布完成；exit 1 = 列出每条失败原因，你必须全部修完再跑一次。

### 2. 视觉渲染验证（必跑 —— 最容易发现历史坑）

```bash
# 一次性安装：npm i playwright && npx playwright install chromium
node skills/anthropic-design/scripts/visual-audit.mjs <path/to/your.html>
```

visual-audit headless 渲染并检查：
- **WCAG 对比度**：`.anth-button / .anth-badge / .anth-link` 在实际背景上的 contrast ratio。cream 在橙上是 2.96（error），白在橙上是 3.12（warn，brand-intentional）。拦截任何低于 3 的。
- **Hero 框图尺寸**：span-2 figure 里的 SVG 渲染 ≥ 900px，否则 warn。
- **SVG 文字像素**：最小 `<text>` 在 1440 视口渲染 ≥ 9px。
- **孤儿卡检测**：grid 里一张非 hero 卡孤单在一堆 full-row hero 中间 → warn。

### 3. 全页截图，肉眼审核

```bash
node skills/anthropic-design/scripts/screenshot.mjs <path/to/your.html> demo-shot.png
```

**必须亲眼看**这张图再宣布完成 —— 留白 / 字重 / 层次靠肉眼判断。

### 规则（reference only）

详见 `references/dos-and-donts.md` 的 "Don't 带 Why" 表。核心：
- 禁止 `[placeholder]` —— 必须真 inline SVG
- Hero 用 `.anth-container anth-container--wide`（**base + modifier 都要**）
- `.anth-button` 橙底必须 `color: #ffffff; font-weight: 600;`（cream 会 fail AA）
- 三道闸任一 exit 非 0 不算完成
