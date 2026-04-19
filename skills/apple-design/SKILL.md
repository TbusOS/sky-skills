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
5. `references/motion.md` — 动画缓动
6. `references/imagery.md` — 摄影与圆角规则
7. `references/data-display.md` — 巨字号统计 + 等距插画
8. `references/responsive.md` — 断点与 max-width
9. `references/dos-and-donts.md` — 反例 + **发布前 7 项 checklist（MUST）**

## 发布前检查（MUST — 可执行）

生成任何完整 HTML 页面后、宣布"完成"前，**必须**依次跑下面两条命令。它们不是建议，是闸口 —— exit 非 0 就是没完成。

### 1. 结构验证（必跑）

```bash
python3 skills/apple-design/scripts/verify.py <path/to/your.html>
```

这个脚本自动检查：
- 无 `[placeholder]` / `[hero]` / `[xxx.icon]` 等括号占位符
- `<!doctype html>` + viewport meta 存在
- Hero 段使用 `.apple-container--hero` 或 `.apple-container--wide`（**不得用窄容器**）
- 每个 `class="apple-*"` 在 `apple.css` 都有定义（无幽灵 class）
- `<svg>` 标签平衡

Exit 0 = 可以宣布完成；exit 1 = 列出每条失败原因，你必须全部修完再跑一次。

### 2. 视觉渲染验证（必跑 —— 这是最容易发现历史坑的一步）

```bash
# 一次性安装：npm i playwright && npx playwright install chromium
node skills/apple-design/scripts/visual-audit.mjs <path/to/your.html>
```

visual-audit 会 headless 渲染页面，然后检查：
- **WCAG 对比度**：所有 `.apple-link / .apple-badge / button` 在实际背景上计算 contrast ratio。< 3 是 error（阻断），3–4.5 是 warning。拦截 "cream on dark" / "dark on dark" 这类看不见的 CTA。
- **Hero 框图尺寸**：span-2 的 figure 里的 SVG 渲染宽度 ≥ 900px，否则 warn "容器太窄"。
- **SVG 文字像素**：hero 图里最小 `<text>` 在 1440 视口下实际渲染 ≥ 9px。
- **孤儿卡检测**：多列 grid 里，如果一张非 hero 卡孤单在一堆 `grid-column: 1 / -1` 中间，flag warn。

### 3. 全页截图，肉眼审核

```bash
node skills/apple-design/scripts/screenshot.mjs <path/to/your.html> demo-shot.png
```

**必须亲眼看这张图**再宣布完成 —— 排版 / 美感 / 文案是否说得通，这些脚本抓不出来。

### 规则（reference only — 上面三条命令已覆盖大部分）

详见 `references/dos-and-donts.md` 的 "Don't 带 Why" 表。简要：
- 禁止 `[placeholder]` 字符串 —— 必须真 inline SVG
- Hero 段必须 `class="apple-container apple-container--hero"`（**base + modifier 都要**）
- 信息密集的 hero 框图（SoC / code-arch / multi-repo）必须用 `--hero` 容器并 `grid-column: 1 / -1`
- 三道闸任一 exit 非 0 不算完成
