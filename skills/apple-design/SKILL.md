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

## 发布前检查（MUST — 交给 design-review skill）

生成任何完整 HTML 页面后、宣布"完成"前,**必须**依次跑三道闸:

```bash
# 1) 结构验证(静态扫描)
python3 skills/design-review/scripts/verify.py --skill=apple <path/to/your.html>

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
里的 GAN 式 discriminator。

### apple 专属要点

- Hero 段必须 `class="apple-container apple-container--hero"`(**base + modifier 都要**)。apple 的 base container 是窄(980px)的, hero 必须 `--hero` (1280px) 否则 SoC / multi-repo 这种信息密集框图会被压得文字 <9px
- 信息密集的 hero 框图必须 `grid-column: 1 / -1`
- 风格规则详见 `references/dos-and-donts.md`
