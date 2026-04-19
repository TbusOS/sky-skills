# Apple-Design & Anthropic-Design HTML Skills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `sky-skills/skills/` 下实现两个对称独立的 HTML 风格 skill，`apple-design` 与 `anthropic-design`，将两家公司官网的设计美学（token + 组件 + 模板 + 图表）落成可直接 `<link>` 引用的资产。

**Architecture:** 纯静态文件，无构建步骤。每个 skill 内部结构一致：`SKILL.md`（顶部触发）+ `references/`（9 份 md，Claude 阅读的知识层）+ `assets/`（drop-in CSS / Tailwind preset / 字体声明）+ `templates/`（9 个 HTML + 4 个 SVG）+ `prompts/`（示例调用）。两 skill 完全独立，互不 import。

**Tech Stack:** 原生 HTML5 + CSS3 + SVG。Tailwind preset 交付 `.js` 但无需运行。字体：SF 系统栈（Apple）/ Google Fonts（Poppins, Lora, JetBrains Mono）。验证工具：`python3` 原生（YAML 解析）、`python3 -m http.server`（本地预览）、浏览器（Chrome / Safari）目测。

**Spec:** `docs/superpowers/specs/2026-04-19-html-style-skills-design.md`

**Total tasks:** 44（Phase 0: 1 / Phase 1 Apple: 20 / Phase 2 Anthropic: 20 / Phase 3 集成: 3）

---

## Phase 0 — 共享准备

### Task 0.1: 建立目录骨架

**Files:**
- Create: `skills/apple-design/` (dir)
- Create: `skills/anthropic-design/` (dir)

- [ ] **Step 1: 创建两个 skill 的完整目录树**

```bash
cd /Users/sky/linux-kernel/github/sky-skills
mkdir -p skills/apple-design/{references,assets,templates/diagrams,prompts}
mkdir -p skills/anthropic-design/{references,assets,templates/diagrams,prompts}
```

- [ ] **Step 2: 验证结构**

```bash
ls -R skills/apple-design skills/anthropic-design
```

Expected：每个 skill 下都能看到 `references/ assets/ templates/diagrams/ prompts/`。

- [ ] **Step 3: Commit**

```bash
git add skills/apple-design skills/anthropic-design
git commit --allow-empty -m "chore: 建立 apple-design 与 anthropic-design skill 目录骨架"
```

说明：空目录需 `--allow-empty` 或先放 `.gitkeep`。推荐后者 —— 在后续 task 中写文件进去即可。

---

## Phase 1 — Apple Design Skill

### Task 1.1: 写 SKILL.md（触发层）

**Files:**
- Create: `skills/apple-design/SKILL.md`

- [ ] **Step 1: 写入完整 SKILL.md**

内容如下（完整复制）：

```markdown
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
3. `references/layout-patterns.md` — 六类版式骨架
4. `references/components.md` — nav/footer/form/table/tabs/... 全部组件
5. `references/motion.md` — 动画缓动
6. `references/imagery.md` — 摄影与圆角规则
7. `references/data-display.md` — 巨字号统计 + 等距插画
8. `references/responsive.md` — 断点与 max-width
9. `references/dos-and-donts.md` — 反例
```

- [ ] **Step 2: 验证 YAML frontmatter 合法**

```bash
python3 -c "
import yaml
with open('skills/apple-design/SKILL.md') as f:
    content = f.read()
parts = content.split('---')
data = yaml.safe_load(parts[1])
assert data['name'] == 'apple-design'
assert 'description' in data
assert 'TRIGGER' in data['description']
print('OK', data['name'])
"
```

Expected: `OK apple-design`

- [ ] **Step 3: Commit**

```bash
git add skills/apple-design/SKILL.md
git commit -m "feat(apple-design): 新增 SKILL.md 定义触发规则与索引"
```

---

### Task 1.2: 写 `references/design-tokens.md`（token 清单）

**Files:**
- Create: `skills/apple-design/references/design-tokens.md`

- [ ] **Step 1: 写入完整 token 文档**

内容（按 spec §3.2 实际值展开）：

```markdown
# Apple Design Tokens

所有 token 均以 CSS 自定义属性形式在 `assets/apple.css` 的 `:root` 下声明。本文件是人类可读的索引。

## 颜色

| Token | Hex | 用途 |
|---|---|---|
| `--apple-bg` | `#FFFFFF` | 主背景 |
| `--apple-bg-alt` | `#F5F5F7` | 交替段落 / 页脚 / 代码块底 |
| `--apple-bg-dark` | `#000000` | 黑色章节（Pro 系列风） |
| `--apple-text` | `#1D1D1D` | 主文字 |
| `--apple-text-secondary` | `#6E6E73` | 次级文字 |
| `--apple-text-on-dark` | `#F5F5F7` | 黑底主文字 |
| `--apple-link` | `#0071E3` | 文字链 / Buy CTA |
| `--apple-link-hover` | `#0077ED` | 链接 hover |
| `--apple-divider` | `#D2D2D7` | 细分隔线 |
| `--apple-system-green` | `#34C759` | toggle 开启 |
| `--apple-system-orange` | `#FF9500` | warning admonition |
| `--apple-system-red` | `#FF3B30` | danger admonition |

## 字体栈

```css
--font-display: "SF Pro Display", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
--font-text:    "SF Pro Text",    -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
--font-mono:    "SF Mono", ui-monospace, Menlo, Monaco, "Cascadia Mono", monospace;
```

## 字号层级

| Role | size / line-height / weight / letter-spacing |
|---|---|
| Hero headline | 64px / 1.05 / 700 / -0.015em |
| Section headline | 48px / 1.08 / 600 / -0.01em |
| Subhead | 28px / 1.14 / 500 / -0.005em |
| Lead body | 21px / 1.38 / 400 / normal |
| Body | 17px / 1.47 / 400 / normal |
| Caption | 12px / 1.33 / 400 / normal |
| Stat number | 120px / 1 / 600 / -0.02em |

## 间距（4px grid）

```
--space-1: 4px   --space-2: 8px    --space-3: 12px   --space-4: 16px
--space-5: 24px  --space-6: 32px   --space-7: 48px   --space-8: 64px
--space-9: 80px  --space-10: 120px
```

## 圆角

```
--radius-sm: 6px     # 输入 / 标签
--radius-md: 12px    # 卡片 / 图片
--radius-lg: 18px    # 大模块
--radius-pill: 9999px
```

## 阴影

```
--shadow-product: 0 20px 60px -20px rgba(0,0,0,0.15);
--shadow-card:    0 2px 8px rgba(0,0,0,0.04);
--shadow-nav:     0 0 0 1px rgba(0,0,0,0.04);
```

## 缓动 / 时长

```
--ease-apple:     cubic-bezier(0.42, 0, 0.58, 1);
--ease-apple-out: cubic-bezier(0.25, 1, 0.5, 1);
--duration-sm: 240ms;
--duration-md: 400ms;
--duration-lg: 700ms;
```

## 断点

```
--bp-mobile:  734px
--bp-tablet:  1068px
--bp-desktop: 1440px
```

容器 max-width：980（常规）/ 1068（wide）/ 1280（hero）。
```

- [ ] **Step 2: Commit**

```bash
git add skills/apple-design/references/design-tokens.md
git commit -m "feat(apple-design): 新增 design-tokens.md（颜色/字号/间距/圆角/缓动/断点）"
```

---

### Task 1.3: 写 `assets/apple.css`（核心 CSS）

**Files:**
- Create: `skills/apple-design/assets/apple.css`

此文件是整个 skill 的"心脏"。内容由多个 section 组成，每 section 落一组相关规则。

- [ ] **Step 1: 写 `:root` token 声明**

```css
/* === Apple Design System — Core CSS ===
 * Last verified: 2026-04-19
 * Docs: ../references/design-tokens.md
 */

:root {
  /* Colors */
  --apple-bg: #FFFFFF;
  --apple-bg-alt: #F5F5F7;
  --apple-bg-dark: #000000;
  --apple-text: #1D1D1D;
  --apple-text-secondary: #6E6E73;
  --apple-text-on-dark: #F5F5F7;
  --apple-link: #0071E3;
  --apple-link-hover: #0077ED;
  --apple-divider: #D2D2D7;
  --apple-system-green: #34C759;
  --apple-system-orange: #FF9500;
  --apple-system-red: #FF3B30;

  /* Fonts */
  --font-display: "SF Pro Display", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
  --font-text: "SF Pro Text", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
  --font-mono: "SF Mono", ui-monospace, Menlo, Monaco, "Cascadia Mono", monospace;

  /* Space */
  --space-1: 4px;  --space-2: 8px;   --space-3: 12px;  --space-4: 16px;
  --space-5: 24px; --space-6: 32px;  --space-7: 48px;  --space-8: 64px;
  --space-9: 80px; --space-10: 120px;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --radius-pill: 9999px;

  /* Shadow */
  --shadow-product: 0 20px 60px -20px rgba(0, 0, 0, 0.15);
  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.04);
  --shadow-nav: 0 0 0 1px rgba(0, 0, 0, 0.04);

  /* Motion */
  --ease-apple: cubic-bezier(0.42, 0, 0.58, 1);
  --ease-apple-out: cubic-bezier(0.25, 1, 0.5, 1);
  --duration-sm: 240ms;
  --duration-md: 400ms;
  --duration-lg: 700ms;
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: var(--font-text);
  font-size: 17px;
  line-height: 1.47;
  color: var(--apple-text);
  background: var(--apple-bg);
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 2: 追加版式 / 排版层**

```css
/* === Typography === */
h1, h2, h3, h4, h5 { font-family: var(--font-display); margin: 0; }
h1 { font-size: 64px; line-height: 1.05; font-weight: 700; letter-spacing: -0.015em; }
h2 { font-size: 48px; line-height: 1.08; font-weight: 600; letter-spacing: -0.01em; }
h3 { font-size: 28px; line-height: 1.14; font-weight: 500; letter-spacing: -0.005em; }
h4 { font-size: 21px; line-height: 1.38; font-weight: 500; }
p  { margin: 0 0 var(--space-4); }
small, .apple-caption { font-size: 12px; line-height: 1.33; color: var(--apple-text-secondary); }
.apple-lead { font-size: 21px; line-height: 1.38; }

/* === Link === */
.apple-link {
  color: var(--apple-link);
  text-decoration: underline;
  text-underline-offset: 0.2em;
  text-decoration-thickness: 1px;
  transition: color var(--duration-sm) var(--ease-apple-out);
}
.apple-link:hover { color: var(--apple-link-hover); }
.apple-link::after { content: " \203A"; }  /* › */

/* === Button (sparingly, only Buy/CTA) === */
.apple-button {
  display: inline-block;
  padding: 8px 16px;
  border-radius: var(--radius-pill);
  background: var(--apple-link);
  color: #fff;
  font-size: 14px;
  font-weight: 400;
  text-decoration: none;
  transition: background var(--duration-sm) var(--ease-apple-out);
}
.apple-button:hover { background: var(--apple-link-hover); }
.apple-button--secondary {
  background: transparent;
  color: var(--apple-link);
  border: 1px solid var(--apple-link);
}
```

- [ ] **Step 3: 追加 section / container / card / stat**

```css
/* === Layout === */
.apple-container { max-width: 980px; margin: 0 auto; padding: 0 var(--space-5); }
.apple-container--wide { max-width: 1068px; }
.apple-container--hero { max-width: 1280px; }

.apple-section { padding-block: var(--space-9); }
.apple-section--alt { background: var(--apple-bg-alt); }
.apple-section--dark { background: var(--apple-bg-dark); color: var(--apple-text-on-dark); }
.apple-section--dark h1, .apple-section--dark h2, .apple-section--dark h3 { color: var(--apple-text-on-dark); }

.apple-hero { text-align: center; padding-block: var(--space-10); }

.apple-card {
  background: var(--apple-bg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  padding: var(--space-5);
}

/* === Stat callout === */
.apple-stat { text-align: center; }
.apple-stat-number {
  font-family: var(--font-display);
  font-size: 120px;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1;
  display: block;
}
.apple-stat-label {
  font-size: 17px;
  color: var(--apple-text-secondary);
  margin-top: var(--space-4);
  display: block;
  max-width: 240px;
  margin-inline: auto;
}
```

- [ ] **Step 4: 追加 Nav / Footer / Badge / Quote / Divider**

```css
/* === Nav === */
.apple-nav {
  position: sticky; top: 0; z-index: 100;
  height: 44px;
  background: rgba(251, 251, 253, 0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--apple-divider);
}
.apple-nav-inner {
  max-width: 1024px; margin: 0 auto; height: 100%;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 var(--space-5);
}
.apple-nav a {
  color: var(--apple-text);
  font-size: 12px;
  text-decoration: none;
  margin-right: var(--space-6);
  opacity: 0.8;
  transition: opacity var(--duration-sm);
}
.apple-nav a:hover { opacity: 1; }

/* === Footer === */
.apple-footer {
  background: var(--apple-bg-alt);
  border-top: 1px solid var(--apple-divider);
  padding-block: var(--space-7);
  font-size: 12px;
  color: var(--apple-text-secondary);
}
.apple-footer-grid {
  max-width: 980px; margin: 0 auto; padding: 0 var(--space-5);
  display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--space-6);
}
.apple-footer-group h5 {
  font-size: 12px; font-weight: 600; color: var(--apple-text); margin-bottom: var(--space-3);
}
.apple-footer-group a { display: block; color: var(--apple-text-secondary); text-decoration: none; margin-bottom: var(--space-2); }
.apple-footer-group a:hover { text-decoration: underline; }
.apple-footer-legal {
  max-width: 980px; margin: var(--space-6) auto 0; padding: var(--space-5) 0 0;
  border-top: 1px solid var(--apple-divider);
  display: flex; justify-content: space-between; flex-wrap: wrap; gap: var(--space-4);
}

/* === Badge === */
.apple-badge {
  font-size: 11px; font-weight: 500;
  text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--apple-text-secondary);
}

/* === Blockquote === */
.apple-quote {
  font-family: var(--font-display);
  font-size: 32px; font-weight: 500;
  line-height: 1.3; letter-spacing: -0.005em;
  max-width: 720px; margin: var(--space-7) auto;
  text-align: center;
}
.apple-quote-cite {
  display: block; font-size: 14px; color: var(--apple-text-secondary);
  text-align: center; margin-top: var(--space-4);
}

/* === Divider === */
.apple-divider { border: 0; height: 1px; background: var(--apple-divider); margin: var(--space-7) 0; }

/* === Promo banner === */
.apple-banner {
  height: 44px;
  background: var(--apple-bg-alt);
  border-bottom: 1px solid var(--apple-divider);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: var(--apple-text);
}
```

- [ ] **Step 5: 追加 Form / Input / Select / Radio / Checkbox / Toggle / Card 选项**

```css
/* === Form === */
.apple-input, .apple-select, .apple-textarea {
  width: 100%;
  background: var(--apple-bg-alt);
  border: 1px solid var(--apple-divider);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  font-family: var(--font-text);
  font-size: 14px;
  color: var(--apple-text);
}
.apple-input:focus, .apple-select:focus, .apple-textarea:focus {
  outline: 2px solid var(--apple-link);
  outline-offset: 0;
  border-color: transparent;
}
.apple-radio, .apple-checkbox { accent-color: var(--apple-link); width: 18px; height: 18px; }
.apple-label { font-size: 13px; color: var(--apple-text-secondary); margin-bottom: var(--space-2); display: block; }

.apple-toggle {
  appearance: none; width: 51px; height: 31px;
  background: var(--apple-divider); border-radius: var(--radius-pill);
  position: relative; cursor: pointer; transition: background var(--duration-sm);
}
.apple-toggle::before {
  content: ''; position: absolute; top: 2px; left: 2px;
  width: 27px; height: 27px; border-radius: 50%; background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: transform var(--duration-sm) var(--ease-apple-out);
}
.apple-toggle:checked { background: var(--apple-system-green); }
.apple-toggle:checked::before { transform: translateX(20px); }

/* === Option cards (color swatch / storage / segmented) === */
.apple-swatch {
  width: 28px; height: 28px; border-radius: 50%;
  border: 1px solid var(--apple-divider);
  cursor: pointer;
}
.apple-swatch--selected {
  border: 2px solid var(--apple-text);
  padding: 2px;
  background-clip: content-box;
}
.apple-option-card {
  border: 1px solid var(--apple-divider);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  cursor: pointer;
  transition: border-color var(--duration-sm);
}
.apple-option-card--selected { border: 2px solid var(--apple-text); }

.apple-segmented {
  display: inline-flex; border: 1px solid var(--apple-divider); border-radius: var(--radius-pill); padding: 2px;
}
.apple-segmented button {
  background: transparent; border: 0;
  padding: 6px 16px; border-radius: var(--radius-pill);
  font-size: 13px; cursor: pointer;
}
.apple-segmented button.is-active { background: var(--apple-text); color: #fff; }
```

- [ ] **Step 6: 追加 Tabs / Carousel / Video / Details / Admonition / Code**

```css
/* === Tabs === */
.apple-tabs { display: flex; gap: var(--space-6); border-bottom: 1px solid var(--apple-divider); }
.apple-tab {
  background: transparent; border: 0; padding: var(--space-3) 0;
  font-size: 14px; color: var(--apple-text-secondary); cursor: pointer;
  border-bottom: 2px solid transparent; transition: all var(--duration-sm);
}
.apple-tab.is-active { color: var(--apple-text); border-bottom-color: var(--apple-link); }

/* === Carousel dots === */
.apple-carousel-dots { display: flex; gap: var(--space-2); justify-content: center; }
.apple-carousel-dots button { width: 4px; height: 4px; border-radius: 50%; background: var(--apple-divider); border: 0; cursor: pointer; }
.apple-carousel-dots button.is-active { background: var(--apple-text); }

/* === Video === */
.apple-video { width: 100%; border-radius: var(--radius-md); }
.apple-video-play {
  width: 56px; height: 56px; border-radius: 50%; background: rgba(255,255,255,0.9);
  display: inline-flex; align-items: center; justify-content: center;
  transition: transform var(--duration-sm) var(--ease-apple-out);
}
.apple-video-play:hover { transform: scale(1.08); }

/* === Details === */
.apple-details { border-bottom: 1px solid var(--apple-divider); padding: var(--space-4) 0; }
.apple-details summary { cursor: pointer; font-size: 17px; list-style: none; display: flex; justify-content: space-between; }
.apple-details summary::after { content: '+'; font-weight: 300; font-size: 24px; color: var(--apple-text-secondary); }
.apple-details[open] summary::after { content: '−'; }

/* === Admonition === */
.apple-admonition { background: var(--apple-bg-alt); border-left: 4px solid var(--apple-link); padding: var(--space-4); margin: var(--space-5) 0; border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }
.apple-admonition--warning { border-left-color: var(--apple-system-orange); }
.apple-admonition--success { border-left-color: var(--apple-system-green); }
.apple-admonition--danger { border-left-color: var(--apple-system-red); }

/* === Code === */
.apple-code, pre.apple-code {
  font-family: var(--font-mono); font-size: 13px;
  background: #F5F5F5; border-radius: var(--radius-md);
  padding: var(--space-5); overflow-x: auto;
}
code { font-family: var(--font-mono); font-size: 0.93em; background: var(--apple-bg-alt); padding: 2px 4px; border-radius: 2px; }
kbd { font-family: var(--font-mono); font-size: 12px; background: #fff; border: 1px solid var(--apple-divider); padding: 2px 6px; border-radius: 4px; }
mark { background: rgba(0, 113, 227, 0.15); }
```

- [ ] **Step 7: 追加响应式 + a11y + reduced-motion**

```css
/* === Responsive === */
@media (max-width: 734px) {
  h1 { font-size: 40px; }
  h2 { font-size: 32px; }
  .apple-stat-number { font-size: 72px; }
  .apple-footer-grid { grid-template-columns: repeat(2, 1fr); }
  .apple-section { padding-block: var(--space-7); }
}
@media (min-width: 735px) and (max-width: 1068px) {
  h1 { font-size: 56px; }
  .apple-footer-grid { grid-template-columns: repeat(3, 1fr); }
}

/* === A11y === */
.apple-sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}
:focus-visible { outline: 2px solid var(--apple-link); outline-offset: 2px; border-radius: 2px; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
}
```

- [ ] **Step 8: 验证 CSS 语法**

```bash
python3 -c "
content = open('skills/apple-design/assets/apple.css').read()
# 简单括号平衡检查
assert content.count('{') == content.count('}'), 'Unbalanced braces'
assert content.count('/*') == content.count('*/'), 'Unbalanced comments'
# 必含 token 抽查
for t in ['--apple-bg', '--apple-text', '--apple-link', '--font-display', '--space-4', '--radius-md', '--ease-apple']:
    assert t in content, f'Missing token: {t}'
print('OK', len(content), 'bytes')
"
```

Expected: `OK <size> bytes`

- [ ] **Step 9: 浏览器目测（用 data:URL 快速验证）**

```bash
cd /Users/sky/linux-kernel/github/sky-skills/skills/apple-design
python3 -m http.server 8787 &
sleep 1
echo "Open http://localhost:8787/assets/apple.css — confirm no 404"
kill %1 2>/dev/null
```

- [ ] **Step 10: Commit**

```bash
git add skills/apple-design/assets/apple.css
git commit -m "feat(apple-design): 新增 apple.css 全量 CSS（token + 版式 + 布局 + 组件 + 响应式 + a11y）"
```

---

### Task 1.4: 写 `assets/fonts.css`

**Files:**
- Create: `skills/apple-design/assets/fonts.css`

- [ ] **Step 1: 写入 fonts.css**

```css
/* Apple Design — Font Declarations
 * SF Pro 仅在 Apple 平台可用，通过 -apple-system / BlinkMacSystemFont 自动命中。
 * 非 Apple 平台由 Inter（Google Fonts）作 fallback。
 * 本文件仅需手动引入当需要 Inter fallback 时。
 */

@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
}

/* 覆盖：若系统无 SF，使用 Inter */
body { font-family: "SF Pro Text", -apple-system, BlinkMacSystemFont, "Inter", "Helvetica Neue", Arial, sans-serif; }
h1, h2, h3, h4, h5 { font-family: "SF Pro Display", -apple-system, BlinkMacSystemFont, "Inter", "Helvetica Neue", Arial, sans-serif; }
```

- [ ] **Step 2: Commit**

```bash
git add skills/apple-design/assets/fonts.css
git commit -m "feat(apple-design): 新增 fonts.css（SF 系统栈 + Inter fallback）"
```

---

### Task 1.5: 写 `references/typography.md`

**Files:**
- Create: `skills/apple-design/references/typography.md`

- [ ] **Step 1: 写入**

```markdown
# Apple Typography

## 核心规则

1. **全程无衬线**。不使用任何衬线字体。
2. **Display 用于 24px 及以上**；**Text 用于 24px 以下**。两者均在系统 SF 栈命中，`-apple-system` 自动切换。
3. **Tracking（字距）**：标题取负值（-0.015 ~ -0.005em），正文保持 `normal`；Hero 约 -0.015em，Section 约 -0.01em。
4. **Max-width**：段落 ≤ 680px 以保持舒适阅读。
5. **代码**：`SF Mono` 或 `ui-monospace`，`#F5F5F5` 底。
6. **下划线链接**：`text-underline-offset: 0.2em; text-decoration-thickness: 1px;`。

## 字号层级表

详见 `design-tokens.md`。

## 实践示例

```html
<h1>Designed for Apple Intelligence</h1>
<p class="apple-lead">A new era of personal AI, private by design.</p>
<p>Built on groundbreaking generative models...</p>
<a class="apple-link">Learn more</a>
```

## 反例

❌ Inter / Roboto / system-ui 直接做标题字（失去 SF Display 的几何特征）
❌ 任何斜体正文（Apple 官网极少用 italic body）
❌ 大于 -0.02em 的负 tracking（视觉会挤压）
```

- [ ] **Step 2: Commit**

```bash
git add skills/apple-design/references/typography.md
git commit -m "feat(apple-design): 新增 typography.md"
```

---

### Task 1.6: 写 `references/layout-patterns.md`

**Files:**
- Create: `skills/apple-design/references/layout-patterns.md`

- [ ] **Step 1: 写入六类版式（含 HTML 骨架）**

```markdown
# Apple Layout Patterns

六种可直接复用的版式。所有示例假定已引入 `assets/apple.css`。

## 1. Alternating sections（产品页主节奏）

白 → 浅灰 → 白 → 黑 四段。

```html
<section class="apple-section"><div class="apple-container"><h2>Innovation</h2></div></section>
<section class="apple-section apple-section--alt"><div class="apple-container"><h2>Cameras</h2></div></section>
<section class="apple-section"><div class="apple-container"><h2>Privacy</h2></div></section>
<section class="apple-section apple-section--dark"><div class="apple-container"><h2>Pro.</h2></div></section>
```

## 2. Hero with full-bleed image

```html
<section class="apple-hero">
  <div class="apple-container--hero">
    <h1>iPhone 17 Pro</h1>
    <p class="apple-lead">The ultimate iPhone.</p>
    <p><a class="apple-link">Learn more</a> &nbsp; <a class="apple-link">Buy</a></p>
    <img src="hero.jpg" alt="iPhone 17 Pro" />
  </div>
</section>
```

## 3. Product grid (lineup)

```html
<section class="apple-section apple-section--alt">
  <div class="apple-container">
    <h2>Explore the lineup</h2>
    <div style="display:grid; grid-template-columns:repeat(5,1fr); gap:var(--space-5);">
      <article>
        <img src="iphone-17-pro.png" alt="" />
        <h3>iPhone 17 Pro</h3>
        <p class="apple-caption">From $999</p>
        <a class="apple-link">Learn more</a>
      </article>
      <!-- 重复 4 次 -->
    </div>
  </div>
</section>
```

## 4. Three-column docs

```html
<div style="display:grid; grid-template-columns:240px 1fr 240px; gap:var(--space-7); max-width:1280px; margin:0 auto;">
  <aside><!-- sidebar nav --></aside>
  <main style="max-width:680px;"><!-- article --></main>
  <aside><!-- TOC --></aside>
</div>
```

## 5. Newsroom card grid

```html
<div style="display:grid; grid-template-columns:repeat(3,1fr); gap:var(--space-5);">
  <a href="#" class="apple-card" style="padding:0; overflow:hidden;">
    <img src="story.jpg" style="width:100%; aspect-ratio:1; object-fit:cover;" />
    <div style="padding:var(--space-4);">
      <span class="apple-badge">Announcements</span>
      <h3 style="font-size:21px; margin-top:var(--space-2);">Headline</h3>
      <p class="apple-caption">September 9, 2025</p>
    </div>
  </a>
</div>
```

## 6. Event page

- 大视频 replay + ASL badge
- 产品公告卡 grid（4 列）
- 过往事件缩略图

见 `templates/landing-page.html` 与 `templates/nav-footer.html`。
```

- [ ] **Step 2: Commit**

```bash
git add skills/apple-design/references/layout-patterns.md
git commit -m "feat(apple-design): 新增 layout-patterns.md（6 种版式 HTML 骨架）"
```

---

### Task 1.7: 写 `references/components.md`

**Files:**
- Create: `skills/apple-design/references/components.md`

- [ ] **Step 1: 从 spec §10 复制所有 Apple 侧内容**

内容完整覆盖（从 spec 抽 Apple 列）：nav / footer / button / form / option-cards / table / tabs / carousel / video / badge / quote / list / banner / breadcrumbs / pagination / search / cart / region / theme toggle / code / inline / figure / divider / details / admonition / empty / stat / 响应式 / a11y。

写作模板（每组件一节，含：用途、CSS 类、骨架 HTML）：

```markdown
# Apple Components

本文件是 `references/components.md`，覆盖所有常用 HTML 组件的 Apple 风实现。每节含：用途 / 关键 class / 最小 HTML 示例。

## Nav 导航栏

**用途：** 顶栏，sticky + 毛玻璃。
**关键 class：** `.apple-nav` `.apple-nav-inner`
**示例：**
\`\`\`html
<nav class="apple-nav"><div class="apple-nav-inner">
  <a href="/"><svg width="14" height="17">...</svg></a>
  <div><a>Store</a><a>Mac</a><a>iPad</a><a>iPhone</a></div>
  <div><button aria-label="Search">🔍</button><a aria-label="Bag">🛍<sup>0+</sup></a></div>
</div></nav>
\`\`\`

（后续按 spec §10 逐节写完。）
```

完整内容直接从 spec §10 的 Apple 列逐节展开，不得省略；必须含 nav/footer/button/form/option-cards/table/tabs/carousel/video/badge/quote/list/banner/breadcrumbs/pagination/search/cart/region/theme-toggle/code/inline/figure/divider/details/admonition/empty/stat 共 27 节。

- [ ] **Step 2: 验证完整性（所有组件都已写）**

```bash
python3 -c "
content = open('skills/apple-design/references/components.md').read()
required = ['Nav', 'Footer', 'Button', 'Form', 'Option', 'Table', 'Tab', 'Carousel', 'Video', 'Badge', 'Quote', 'List', 'Banner', 'Breadcrumb', 'Pagination', 'Search', 'Cart', 'Region', 'Theme', 'Code', 'Inline', 'Figure', 'Divider', 'Details', 'Admonition', 'Empty', 'Stat']
missing = [r for r in required if r not in content]
assert not missing, f'Missing sections: {missing}'
print('OK all 27 sections present')
"
```

- [ ] **Step 3: Commit**

```bash
git add skills/apple-design/references/components.md
git commit -m "feat(apple-design): 新增 components.md（27 种组件完整规范）"
```

---

### Task 1.8: 写 `references/motion.md`

**Files:**
- Create: `skills/apple-design/references/motion.md`

- [ ] **Step 1: 写入**

```markdown
# Apple Motion

## 缓动

- 默认：`--ease-apple-out` (`cubic-bezier(0.25, 1, 0.5, 1)`) —— 用于入场、hover。
- 平滑：`--ease-apple` (`cubic-bezier(0.42, 0, 0.58, 1)`) —— 用于持续中性过渡。

## 时长

- `--duration-sm` 240ms：hover、按钮态、tab 切换
- `--duration-md` 400ms：卡片入场
- `--duration-lg` 700ms：视频 fade-in、大块页面过渡

## 入场模式（IntersectionObserver）

```javascript
const io = new IntersectionObserver(entries => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      e.target.style.opacity = 1;
      e.target.style.transform = 'translateY(0)';
      e.target.style.transition = `all 700ms cubic-bezier(0.25,1,0.5,1) ${i * 80}ms`;
    }
  });
});
document.querySelectorAll('.apple-reveal').forEach(el => {
  el.style.opacity = 0;
  el.style.transform = 'translateY(24px)';
  io.observe(el);
});
```

## 禁止

❌ 反弹 / 弹簧 / rotate 入场
❌ 大幅缩放（> 1.2）
❌ 每个元素都动 —— Apple 一页通常只有 2-3 个动画节点
```

- [ ] **Step 2: Commit**

```bash
git add skills/apple-design/references/motion.md
git commit -m "feat(apple-design): 新增 motion.md"
```

---

### Task 1.9: 写 `references/imagery.md`

**Files:**
- Create: `skills/apple-design/references/imagery.md`

- [ ] **Step 1: 写入**

```markdown
# Apple Imagery

## 产品摄影

- **背景**：纯白或透明 PNG
- **构图**：产品居中，环境仅用于生活方式叙事（如相机演示）
- **阴影**：`var(--shadow-product)` 仅用于浮于白背景之上的产品图
- **圆角**：产品本体不加圆角；容器图片可加 `--radius-md`

## 人物 / 环境

- 必须高质量、纪实感；避免 stock 图片感
- 可全屏 hero，此时**不加**圆角
- 文字叠加时使用 `background: rgba(0,0,0,0.4)` 或底部线性渐变

## 等距（isometric）插画

用于 environment / privacy 页的信息可视化：
- 色板：铜色 `#B87333` / 绿 `--apple-system-green` / 灰阶
- 线粗 1.5-2px
- 无阴影，靠色块深浅造层次

## 禁止

❌ 彩虹渐变 / 紫色渐变
❌ drop-shadow 过重（> 30px blur）
❌ 斜切裁剪 / 不规则蒙版
```

- [ ] **Step 2: Commit**

```bash
git add skills/apple-design/references/imagery.md
git commit -m "feat(apple-design): 新增 imagery.md"
```

---

### Task 1.10: 写 `references/data-display.md`

**Files:**
- Create: `skills/apple-design/references/data-display.md`

- [ ] **Step 1: 写入**

```markdown
# Apple Data Display

## 巨字号统计（Apple 标志性做法）

用法：生活方式 / 环保 / 隐私页报告数据。

```html
<div style="display:grid; grid-template-columns:repeat(3,1fr); gap:var(--space-7); text-align:center;">
  <div class="apple-stat">
    <span class="apple-stat-number">75%</span>
    <span class="apple-stat-label">Reduction in emissions by 2030</span>
  </div>
  <div class="apple-stat">
    <span class="apple-stat-number">17B</span>
    <span class="apple-stat-label">Gallons of freshwater saved in 2025</span>
  </div>
  <div class="apple-stat">
    <span class="apple-stat-number">100%</span>
    <span class="apple-stat-label">Renewable electricity in operations</span>
  </div>
</div>
```

## 传统图表（避免）

Apple 营销页**几乎不使用**柱图 / 饼图 / 折线。如必须：
- 单色 `--apple-link` 实色柱
- 细 0.5px 轴线，无网格
- 标签 SF Pro Text 12px

## 等距信息图

见 `imagery.md`。参考 environment 页的"生命周期 tab"与 Daisy 机器人插图。
```

- [ ] **Step 2: Commit**

```bash
git add skills/apple-design/references/data-display.md
git commit -m "feat(apple-design): 新增 data-display.md"
```

---

### Task 1.11: 写 `references/responsive.md`

**Files:**
- Create: `skills/apple-design/references/responsive.md`

- [ ] **Step 1: 写入**

```markdown
# Apple Responsive

## 断点（实测 apple.com）

```
mobile:   ≤734px
tablet:   735–1068px
desktop:  1069–1440px
large:    ≥1441px
```

## 容器 max-width

| Variant | Value |
|---|---|
| `.apple-container` | 980px |
| `.apple-container--wide` | 1068px |
| `.apple-container--hero` | 1280px |

## 字号缩放

见 `apple.css` 底部媒体查询：h1 从 64 → 56 → 40 随断点递减。

## Grid 列数

| 版式 | ≤734 | 735–1068 | ≥1069 |
|---|---|---|---|
| Product lineup | 1 | 2-3 | 5 |
| Newsroom | 1 | 2 | 3 |
| Footer | 2 | 3 | 5 |

## 图片

用 `<picture>` 在 hero 位置给不同断点的 1x/2x 资源：

```html
<picture>
  <source srcset="hero-mobile.jpg" media="(max-width:734px)">
  <source srcset="hero-tablet.jpg" media="(max-width:1068px)">
  <img src="hero-desktop.jpg" alt="" />
</picture>
```
```

- [ ] **Step 2: Commit**

```bash
git add skills/apple-design/references/responsive.md
git commit -m "feat(apple-design): 新增 responsive.md"
```

---

### Task 1.12: 写 `references/dos-and-donts.md`

**Files:**
- Create: `skills/apple-design/references/dos-and-donts.md`

- [ ] **Step 1: 写入**

```markdown
# Apple Do / Don't

## ✅ Do

- 白 / 浅灰 / 黑三段交替叙事
- 产品摄影居中 + 大量留白
- 巨字号统计（120px）
- 文字链 + 下划线 + `›` 结尾
- SF Pro 全家族（Display/Text/Mono）
- 章节间 80–120px padding
- 毛玻璃 nav（`backdrop-filter: blur(20px)`）
- 圆角 12px 卡片

## ❌ Don't

- 紫色 / 彩虹渐变（AI slop 标志）
- 饼图 / 3D 柱图 / 霓虹光效
- 大量彩色实心按钮堆叠（Apple 只在 Buy/Add to Bag 用）
- Inter / Roboto 作标题字
- 全页同一色无节奏
- 反弹 / 弹簧 / rotation 入场
- 斜切蒙版 / 不规则裁剪
- 紧贴屏幕边缘的内容（min padding 24px）
```

- [ ] **Step 2: Commit**

```bash
git add skills/apple-design/references/dos-and-donts.md
git commit -m "feat(apple-design): 新增 dos-and-donts.md"
```

---

### Task 1.13: 写 `assets/apple.tailwind.js`

**Files:**
- Create: `skills/apple-design/assets/apple.tailwind.js`

- [ ] **Step 1: 写入 preset**

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        apple: {
          bg: '#FFFFFF',
          'bg-alt': '#F5F5F7',
          'bg-dark': '#000000',
          text: '#1D1D1D',
          'text-secondary': '#6E6E73',
          'text-on-dark': '#F5F5F7',
          link: '#0071E3',
          'link-hover': '#0077ED',
          divider: '#D2D2D7',
          'system-green': '#34C759',
          'system-orange': '#FF9500',
          'system-red': '#FF3B30',
        },
      },
      fontFamily: {
        'apple-display': ['"SF Pro Display"', '-apple-system', 'BlinkMacSystemFont', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        'apple-text': ['"SF Pro Text"', '-apple-system', 'BlinkMacSystemFont', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        'apple-mono': ['"SF Mono"', 'ui-monospace', 'Menlo', 'Monaco', '"Cascadia Mono"', 'monospace'],
      },
      fontSize: {
        'apple-hero': ['64px', { lineHeight: '1.05', fontWeight: '700', letterSpacing: '-0.015em' }],
        'apple-section': ['48px', { lineHeight: '1.08', fontWeight: '600', letterSpacing: '-0.01em' }],
        'apple-subhead': ['28px', { lineHeight: '1.14', fontWeight: '500', letterSpacing: '-0.005em' }],
        'apple-lead': ['21px', { lineHeight: '1.38' }],
        'apple-body': ['17px', { lineHeight: '1.47' }],
        'apple-caption': ['12px', { lineHeight: '1.33' }],
        'apple-stat': ['120px', { lineHeight: '1', fontWeight: '600', letterSpacing: '-0.02em' }],
      },
      spacing: {
        'apple-1': '4px', 'apple-2': '8px', 'apple-3': '12px', 'apple-4': '16px',
        'apple-5': '24px', 'apple-6': '32px', 'apple-7': '48px', 'apple-8': '64px',
        'apple-9': '80px', 'apple-10': '120px',
      },
      borderRadius: {
        'apple-sm': '6px', 'apple-md': '12px', 'apple-lg': '18px', 'apple-pill': '9999px',
      },
      boxShadow: {
        'apple-product': '0 20px 60px -20px rgba(0,0,0,0.15)',
        'apple-card': '0 2px 8px rgba(0,0,0,0.04)',
      },
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.42, 0, 0.58, 1)',
        'apple-out': 'cubic-bezier(0.25, 1, 0.5, 1)',
      },
      transitionDuration: {
        'apple-sm': '240ms', 'apple-md': '400ms', 'apple-lg': '700ms',
      },
      screens: {
        'apple-mobile': { 'max': '734px' },
        'apple-tablet': { 'min': '735px', 'max': '1068px' },
        'apple-desktop': { 'min': '1069px' },
      },
    },
  },
};
```

- [ ] **Step 2: 语法验证**

```bash
node -e "const c = require('./skills/apple-design/assets/apple.tailwind.js'); console.log('keys:', Object.keys(c.theme.extend));"
```

Expected: `keys: [ 'colors', 'fontFamily', 'fontSize', 'spacing', 'borderRadius', 'boxShadow', 'transitionTimingFunction', 'transitionDuration', 'screens' ]`

- [ ] **Step 3: Commit**

```bash
git add skills/apple-design/assets/apple.tailwind.js
git commit -m "feat(apple-design): 新增 Tailwind preset"
```

---

### Task 1.14: 写 `templates/nav-footer.html`

**Files:**
- Create: `skills/apple-design/templates/nav-footer.html`

- [ ] **Step 1: 写完整独立页面**

```html
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Apple · Nav & Footer</title>
<link rel="stylesheet" href="../assets/apple.css">
</head>
<body>

<!-- Promo banner -->
<div class="apple-banner">Get credit toward iPhone 17 when you trade in. <a class="apple-link">Shop</a></div>

<!-- Nav -->
<nav class="apple-nav"><div class="apple-nav-inner">
  <a href="#" aria-label="Apple" style="font-weight:600;">Apple</a>
  <div>
    <a href="#">Store</a><a href="#">Mac</a><a href="#">iPad</a>
    <a href="#">iPhone</a><a href="#">Watch</a><a href="#">Support</a>
  </div>
  <div style="display:flex; gap:16px;">
    <button aria-label="Search" style="background:transparent;border:0;cursor:pointer;">🔍</button>
    <a aria-label="Bag" href="#">🛍 <span class="apple-badge">0+</span></a>
  </div>
</div></nav>

<!-- Page content placeholder -->
<main class="apple-section"><div class="apple-container">
  <h1>Page content goes here.</h1>
</div></main>

<!-- Footer -->
<footer class="apple-footer">
  <div class="apple-footer-grid">
    <div class="apple-footer-group">
      <h5>Shop and Learn</h5>
      <a>Store</a><a>Mac</a><a>iPad</a><a>iPhone</a><a>Watch</a>
    </div>
    <div class="apple-footer-group">
      <h5>Apple Wallet</h5>
      <a>Wallet</a><a>Apple Card</a><a>Apple Pay</a><a>Apple Cash</a>
    </div>
    <div class="apple-footer-group">
      <h5>Account</h5>
      <a>Manage Your Apple Account</a><a>Apple Store Account</a><a>iCloud.com</a>
    </div>
    <div class="apple-footer-group">
      <h5>Entertainment</h5>
      <a>Apple One</a><a>Apple TV+</a><a>Apple Music</a><a>Apple Arcade</a>
    </div>
    <div class="apple-footer-group">
      <h5>Apple Values</h5>
      <a>Accessibility</a><a>Education</a><a>Environment</a><a>Privacy</a>
    </div>
  </div>
  <div class="apple-footer-legal">
    <span>Copyright © 2026 Apple Inc. All rights reserved.</span>
    <span><a>Privacy Policy</a> &nbsp;|&nbsp; <a>Terms of Use</a> &nbsp;|&nbsp; <a>Sales and Refunds</a> &nbsp;|&nbsp; <a>Legal</a></span>
    <span>🌐 United States</span>
  </div>
</footer>

</body>
</html>
```

- [ ] **Step 2: 本地预览 + HTML 合法性**

```bash
python3 -c "
from html.parser import HTMLParser
class P(HTMLParser):
    err = None
    def error(self, m): self.err = m
p = P(); p.feed(open('skills/apple-design/templates/nav-footer.html').read())
print('OK' if not p.err else p.err)
"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add skills/apple-design/templates/nav-footer.html
git commit -m "feat(apple-design): 新增 nav-footer.html 模板"
```

---

### Task 1.15: 写 `templates/landing-page.html`

**Files:**
- Create: `skills/apple-design/templates/landing-page.html`

- [ ] **Step 1: 写完整落地页**

内容要求：引用 `../assets/apple.css` → 复用 Task 1.14 的 nav/banner/footer → 添加 hero + 4 段交替 section（白/灰/白/黑）+ 产品 lineup grid。

```html
<!doctype html>
<html lang="zh-CN"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Apple · Landing Page</title>
<link rel="stylesheet" href="../assets/apple.css">
</head><body>

<nav class="apple-nav"><div class="apple-nav-inner">
  <a href="#" style="font-weight:600;">Apple</a>
  <div><a>Store</a><a>Mac</a><a>iPhone</a><a>Watch</a></div>
  <div><button style="background:transparent;border:0;">🔍</button><a>🛍</a></div>
</div></nav>

<section class="apple-hero">
  <div class="apple-container--hero">
    <h1>iPhone 17 Pro</h1>
    <p class="apple-lead" style="color:var(--apple-text-secondary); max-width:640px; margin:var(--space-4) auto var(--space-6);">
      The ultimate iPhone. Forged in a new aluminum unibody.
    </p>
    <p><a class="apple-link">Learn more</a> &nbsp;&nbsp; <a class="apple-link">Buy</a></p>
    <div style="margin-top:var(--space-8); padding-inline:var(--space-5);">
      <div style="background:var(--apple-bg-alt); border-radius:var(--radius-lg); aspect-ratio:16/9; display:grid; place-items:center; color:var(--apple-text-secondary);">
        [Product hero image]
      </div>
    </div>
  </div>
</section>

<section class="apple-section apple-section--alt">
  <div class="apple-container">
    <h2 style="text-align:center;">Innovation</h2>
    <p class="apple-lead" style="text-align:center; max-width:720px; margin:var(--space-5) auto;">
      The A19 Pro chip. A new camera system. A color-changing finish.
    </p>
  </div>
</section>

<section class="apple-section">
  <div class="apple-container" style="display:grid; grid-template-columns:repeat(3,1fr); gap:var(--space-7); text-align:center;">
    <div class="apple-stat"><span class="apple-stat-number">48</span><span class="apple-stat-label">MP Pro Fusion camera</span></div>
    <div class="apple-stat"><span class="apple-stat-number">33h</span><span class="apple-stat-label">Video playback</span></div>
    <div class="apple-stat"><span class="apple-stat-number">A19</span><span class="apple-stat-label">Pro chip</span></div>
  </div>
</section>

<section class="apple-section apple-section--dark">
  <div class="apple-container" style="text-align:center;">
    <h2>Pro.</h2>
    <p class="apple-lead">Beyond.</p>
  </div>
</section>

<section class="apple-section apple-section--alt">
  <div class="apple-container">
    <h2 style="text-align:center; margin-bottom:var(--space-7);">Explore the lineup</h2>
    <div style="display:grid; grid-template-columns:repeat(5,1fr); gap:var(--space-5);">
      <article style="text-align:center;">
        <div style="background:#fff; border-radius:var(--radius-md); aspect-ratio:1; margin-bottom:var(--space-3); display:grid;place-items:center;color:var(--apple-text-secondary);font-size:12px;">[IMG]</div>
        <h4>iPhone 17 Pro</h4>
        <p class="apple-caption">From $999</p>
        <a class="apple-link">Learn more</a>
      </article>
      <article style="text-align:center;">
        <div style="background:#fff; border-radius:var(--radius-md); aspect-ratio:1; margin-bottom:var(--space-3); display:grid;place-items:center;color:var(--apple-text-secondary);font-size:12px;">[IMG]</div>
        <h4>iPhone 17</h4>
        <p class="apple-caption">From $799</p>
        <a class="apple-link">Learn more</a>
      </article>
      <article style="text-align:center;">
        <div style="background:#fff; border-radius:var(--radius-md); aspect-ratio:1; margin-bottom:var(--space-3); display:grid;place-items:center;color:var(--apple-text-secondary);font-size:12px;">[IMG]</div>
        <h4>iPhone Air</h4>
        <p class="apple-caption">From $699</p>
        <a class="apple-link">Learn more</a>
      </article>
      <article style="text-align:center;">
        <div style="background:#fff; border-radius:var(--radius-md); aspect-ratio:1; margin-bottom:var(--space-3); display:grid;place-items:center;color:var(--apple-text-secondary);font-size:12px;">[IMG]</div>
        <h4>iPhone 16</h4>
        <p class="apple-caption">From $599</p>
        <a class="apple-link">Learn more</a>
      </article>
      <article style="text-align:center;">
        <div style="background:#fff; border-radius:var(--radius-md); aspect-ratio:1; margin-bottom:var(--space-3); display:grid;place-items:center;color:var(--apple-text-secondary);font-size:12px;">[IMG]</div>
        <h4>iPhone 15</h4>
        <p class="apple-caption">From $499</p>
        <a class="apple-link">Learn more</a>
      </article>
    </div>
  </div>
</section>

<footer class="apple-footer">
  <div class="apple-footer-grid">
    <div class="apple-footer-group"><h5>Shop and Learn</h5><a>Store</a><a>Mac</a><a>iPhone</a></div>
    <div class="apple-footer-group"><h5>Account</h5><a>Apple ID</a><a>iCloud.com</a></div>
    <div class="apple-footer-group"><h5>Entertainment</h5><a>Apple TV+</a><a>Apple Music</a></div>
    <div class="apple-footer-group"><h5>Apple Store</h5><a>Find a Store</a><a>Genius Bar</a></div>
    <div class="apple-footer-group"><h5>Apple Values</h5><a>Privacy</a><a>Accessibility</a></div>
  </div>
  <div class="apple-footer-legal">
    <span>Copyright © 2026 Apple Inc.</span>
    <span>🌐 United States</span>
  </div>
</footer>

</body></html>
```

- [ ] **Step 2: 浏览器预览**

```bash
cd /Users/sky/linux-kernel/github/sky-skills && python3 -m http.server 8787 &
sleep 1
echo "Open http://localhost:8787/skills/apple-design/templates/landing-page.html"
# 手动打开浏览器查看：
# - hero 居中大标题
# - 4 段交替明暗
# - 巨字号统计 3 列
# - 产品 lineup 5 列
# - 页脚 5 列
kill %1 2>/dev/null
```

- [ ] **Step 3: Commit**

```bash
git add skills/apple-design/templates/landing-page.html
git commit -m "feat(apple-design): 新增 landing-page.html 模板（hero + 交替 + 统计 + lineup）"
```

---

### Task 1.16: 写 `templates/article.html`

**Files:**
- Create: `skills/apple-design/templates/article.html`

- [ ] **Step 1: 写 newsroom 文章模板**

文件需含：nav → hero title + date + category badge → 680px 单栏正文（含 h2/h3/p/pull-quote/figure/code block）→ footer。

完整 HTML 结构参考 Task 1.15，正文部分用 `<main class="apple-container" style="max-width:680px;">` 包裹，内含：

```html
<main class="apple-container" style="max-width:680px; padding-block: var(--space-9);">
  <span class="apple-badge">Announcements</span>
  <h1 style="margin:var(--space-4) 0 var(--space-3);">iPhone 17 Pro: the ultimate iPhone</h1>
  <p class="apple-caption">September 9, 2025</p>

  <p class="apple-lead">Apple today introduced iPhone 17 Pro, featuring the A19 Pro chip, a redesigned camera system, and an aluminum unibody.</p>

  <h2>A new camera system</h2>
  <p>The Pro Fusion camera system brings 48-megapixel sensors to main, ultra-wide, and telephoto lenses...</p>

  <figure class="apple-figure" style="margin:var(--space-7) 0;">
    <div style="background:var(--apple-bg-alt);aspect-ratio:16/9;border-radius:var(--radius-md);display:grid;place-items:center;color:var(--apple-text-secondary);">[Photo]</div>
    <figcaption class="apple-caption" style="text-align:center;margin-top:var(--space-3);">Pro Fusion camera system on iPhone 17 Pro.</figcaption>
  </figure>

  <blockquote class="apple-quote">"The most advanced iPhone we've ever designed."<cite class="apple-quote-cite">— Greg Joswiak, SVP of Worldwide Marketing</cite></blockquote>

  <h2>Built for Apple Intelligence</h2>
  <p>With the A19 Pro chip, iPhone 17 Pro delivers faster on-device AI inference...</p>

  <pre class="apple-code"><code>import CoreML
let model = try AIModel()
let output = model.predict(input)</code></pre>

  <hr class="apple-divider">

  <p><a class="apple-link">Read the full press release</a></p>
</main>
```

外层 nav + footer 复用 Task 1.14 的骨架（精简版）。

- [ ] **Step 2: Commit**

```bash
git add skills/apple-design/templates/article.html
git commit -m "feat(apple-design): 新增 article.html 模板（newsroom 长文）"
```

---

### Task 1.17: 写 `templates/docs.html`

**Files:**
- Create: `skills/apple-design/templates/docs.html`

- [ ] **Step 1: 写开发者文档三栏模板**

包含：顶部 nav → 三栏布局（240px sidebar + 680px article + 240px TOC）→ 文章内含面包屑 + h1 + TOC 锚点 + 代码块 + admonition + details 折叠 → footer。

关键骨架：

```html
<main style="display:grid; grid-template-columns:240px 1fr 240px; gap:var(--space-7); max-width:1280px; margin:0 auto; padding:var(--space-7) var(--space-5);">
  <aside>
    <nav aria-label="Docs">
      <h5 style="font-size:13px;">SwiftUI</h5>
      <a class="apple-link" href="#">Essentials</a><br>
      <a class="apple-link" href="#">Layout</a><br>
      <a class="apple-link" href="#">View modifiers</a>
    </nav>
  </aside>
  <article style="max-width:680px;">
    <nav aria-label="Breadcrumb" class="apple-caption">SwiftUI › Views › View</nav>
    <h1 id="view">View</h1>
    <p class="apple-lead">A type that represents part of your app's user interface.</p>

    <h2 id="overview">Overview</h2>
    <p>You create custom views by declaring types that conform to the <code>View</code> protocol.</p>

    <pre class="apple-code"><code>struct ContentView: View {
    var body: some View {
        Text("Hello, world!")
    }
}</code></pre>

    <div class="apple-admonition">
      <strong>Note.</strong> The <code>body</code> property is required.
    </div>

    <details class="apple-details"><summary>See also</summary>
      <p>Related: <code>ViewBuilder</code>, <code>ViewModifier</code>.</p>
    </details>
  </article>
  <aside>
    <h5 style="font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:var(--apple-text-secondary);">On this page</h5>
    <a class="apple-link" href="#overview">Overview</a>
  </aside>
</main>
```

外层套 nav / footer。

- [ ] **Step 2: Commit**

```bash
git add skills/apple-design/templates/docs.html
git commit -m "feat(apple-design): 新增 docs.html 模板（三栏开发者文档）"
```

---

### Task 1.18: 写 `templates/slide-deck.html`

**Files:**
- Create: `skills/apple-design/templates/slide-deck.html`

- [ ] **Step 1: 写 scroll-snap 演示**

10 页滚动对齐演示（封面 / 目录 / 问题 / 方案 / 统计 / 对比 / 结论 / 致谢）。每页全视口 `100vh`，`scroll-snap-align: start`。

骨架：

```html
<style>
  .apple-slides { scroll-snap-type: y mandatory; overflow-y: scroll; height: 100vh; }
  .apple-slide { scroll-snap-align: start; height: 100vh; display: grid; place-items: center; padding: var(--space-9); }
</style>

<div class="apple-slides">
  <section class="apple-slide"><div style="text-align:center;">
    <h1>Deck Title</h1>
    <p class="apple-lead" style="color:var(--apple-text-secondary);">Subtitle goes here</p>
  </div></section>
  <section class="apple-slide apple-section--alt"><div>
    <h2>Agenda</h2>
    <ol style="font-size:21px;">
      <li>Problem</li><li>Solution</li><li>Impact</li>
    </ol>
  </div></section>
  <section class="apple-slide"><div class="apple-stat" style="text-align:center;">
    <span class="apple-stat-number">75%</span>
    <span class="apple-stat-label">reduction observed</span>
  </div></section>
  <!-- 7 more slides similarly -->
</div>
```

- [ ] **Step 2: Commit**

```bash
git add skills/apple-design/templates/slide-deck.html
git commit -m "feat(apple-design): 新增 slide-deck.html（scroll-snap 10 页演示）"
```

---

### Task 1.19: 写 `templates/stat-callout.html`

**Files:**
- Create: `skills/apple-design/templates/stat-callout.html`

- [ ] **Step 1: 写单屏巨字号统计**

```html
<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<title>Stat Callout</title>
<link rel="stylesheet" href="../assets/apple.css">
</head><body>
<main style="min-height:100vh; display:grid; place-items:center;">
  <div class="apple-container" style="text-align:center;">
    <p class="apple-badge">Environment</p>
    <h2 style="margin:var(--space-4) 0 var(--space-8);">Our progress</h2>
    <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:var(--space-7);">
      <div class="apple-stat"><span class="apple-stat-number">75%</span><span class="apple-stat-label">emissions reduction goal</span></div>
      <div class="apple-stat"><span class="apple-stat-number">17B</span><span class="apple-stat-label">gallons of freshwater saved</span></div>
      <div class="apple-stat"><span class="apple-stat-number">100%</span><span class="apple-stat-label">renewable electricity</span></div>
    </div>
  </div>
</main>
</body></html>
```

- [ ] **Step 2: Commit**

```bash
git add skills/apple-design/templates/stat-callout.html
git commit -m "feat(apple-design): 新增 stat-callout.html"
```

---

### Task 1.20: 写 `templates/form.html`

**Files:**
- Create: `skills/apple-design/templates/form.html`

- [ ] **Step 1: 写表单展示页**

包含：input / select / textarea / radio / checkbox / toggle / segmented / button。

```html
<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<title>Form</title><link rel="stylesheet" href="../assets/apple.css">
</head><body>
<main class="apple-container" style="max-width:560px; padding-block:var(--space-9);">
  <h1 style="font-size:40px;">Contact sales</h1>
  <p class="apple-lead" style="color:var(--apple-text-secondary);">Tell us about your team.</p>

  <form style="display:grid; gap:var(--space-5); margin-top:var(--space-7);">
    <div>
      <label class="apple-label">Full name</label>
      <input class="apple-input" type="text" placeholder="Jane Appleseed">
    </div>
    <div>
      <label class="apple-label">Work email</label>
      <input class="apple-input" type="email" placeholder="jane@company.com">
    </div>
    <div>
      <label class="apple-label">Company size</label>
      <select class="apple-select">
        <option>1–10</option><option>11–50</option><option>51–200</option><option>201+</option>
      </select>
    </div>
    <div>
      <label class="apple-label">Primary interest</label>
      <div class="apple-segmented">
        <button type="button" class="is-active">Mac</button>
        <button type="button">iPad</button>
        <button type="button">iPhone</button>
      </div>
    </div>
    <div>
      <label class="apple-label">How did you hear about us?</label>
      <label><input type="radio" class="apple-radio" name="src"> Search engine</label><br>
      <label><input type="radio" class="apple-radio" name="src"> Referral</label><br>
      <label><input type="radio" class="apple-radio" name="src"> Event</label>
    </div>
    <div>
      <label><input type="checkbox" class="apple-checkbox"> Subscribe to Apple Business newsletter</label>
    </div>
    <div>
      <label>Enable notifications &nbsp; <input type="checkbox" class="apple-toggle"></label>
    </div>
    <div>
      <label class="apple-label">Message</label>
      <textarea class="apple-textarea" rows="4"></textarea>
    </div>
    <div>
      <button type="submit" class="apple-button">Submit</button>
    </div>
  </form>
</main>
</body></html>
```

- [ ] **Step 2: Commit**

```bash
git add skills/apple-design/templates/form.html
git commit -m "feat(apple-design): 新增 form.html（全控件展示）"
```

---

### Task 1.21: 写 `templates/product-configurator.html`

**Files:**
- Create: `skills/apple-design/templates/product-configurator.html`

- [ ] **Step 1: 写商品选配器**

两栏：左侧大图，右侧：颜色 swatch + 容量 option card + carrier segmented + sticky buy 栏。

```html
<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<title>Buy iPhone</title><link rel="stylesheet" href="../assets/apple.css">
</head><body>

<main class="apple-container" style="padding-block:var(--space-8);">
  <h1 style="text-align:center;">Buy iPhone 17 Pro</h1>

  <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-8); margin-top:var(--space-7);">
    <div style="position:sticky; top:64px; height:fit-content;">
      <div style="background:var(--apple-bg-alt); aspect-ratio:1; border-radius:var(--radius-md); display:grid; place-items:center; color:var(--apple-text-secondary);">[Product photo]</div>
    </div>

    <div>
      <section style="margin-bottom:var(--space-7);">
        <h3>Finish. <span style="color:var(--apple-text-secondary);">Deep Blue</span></h3>
        <div style="display:flex; gap:var(--space-3); margin-top:var(--space-3);">
          <button class="apple-swatch apple-swatch--selected" style="background:#2B3A55;"></button>
          <button class="apple-swatch" style="background:#D0CEC8;"></button>
          <button class="apple-swatch" style="background:#D9773E;"></button>
        </div>
      </section>

      <section style="margin-bottom:var(--space-7);">
        <h3>Storage.</h3>
        <div style="display:grid; gap:var(--space-3); margin-top:var(--space-3);">
          <button class="apple-option-card apple-option-card--selected"><strong>256GB</strong><div class="apple-caption">$1,199</div></button>
          <button class="apple-option-card"><strong>512GB</strong><div class="apple-caption">$1,399</div></button>
          <button class="apple-option-card"><strong>1TB</strong><div class="apple-caption">$1,599</div></button>
          <button class="apple-option-card"><strong>2TB</strong><div class="apple-caption">$1,999</div></button>
        </div>
      </section>

      <section style="margin-bottom:var(--space-7);">
        <h3>Carrier.</h3>
        <div class="apple-segmented" style="margin-top:var(--space-3);">
          <button class="is-active">AT&T</button><button>T-Mobile</button><button>Verizon</button><button>Connect later</button>
        </div>
      </section>
    </div>
  </div>
</main>

<div style="position:sticky; bottom:0; background:rgba(255,255,255,0.9); backdrop-filter:blur(20px); border-top:1px solid var(--apple-divider); padding:var(--space-4) var(--space-5);">
  <div class="apple-container" style="display:flex; justify-content:space-between; align-items:center;">
    <div>
      <strong style="font-size:17px;">iPhone 17 Pro · Deep Blue · 256GB</strong><br>
      <span class="apple-caption">$1,199.00 or $49.95/mo for 24 months</span>
    </div>
    <button class="apple-button" style="padding:12px 24px;">Add to Bag</button>
  </div>
</div>

</body></html>
```

- [ ] **Step 2: Commit**

```bash
git add skills/apple-design/templates/product-configurator.html
git commit -m "feat(apple-design): 新增 product-configurator.html（色板/容量/carrier/sticky buy）"
```

---

### Task 1.22: 写 `templates/specs-page.html`

**Files:**
- Create: `skills/apple-design/templates/specs-page.html`

- [ ] **Step 1: 写规格对比页**

Apple 风格：不用真表格，用并排段落 + h3 分类。含"Both models"共享区块 + 两列分别展示差异。

```html
<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<title>iPhone 17 Pro · Specs</title>
<link rel="stylesheet" href="../assets/apple.css"></head><body>

<main class="apple-container" style="padding-block:var(--space-9);">
  <h1 style="text-align:center;">Tech Specs</h1>
  <p class="apple-caption" style="text-align:center;">iPhone 17 Pro · iPhone 17 Pro Max</p>

  <section style="margin-top:var(--space-8);">
    <h2>Finish</h2>
    <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:var(--space-5); margin-top:var(--space-4);">
      <div>Silver</div><div>Cosmic Orange</div><div>Deep Blue</div>
    </div>
  </section>

  <hr class="apple-divider">

  <section>
    <h2>Display</h2>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-7); margin-top:var(--space-4);">
      <div>
        <h3 style="font-size:17px;">iPhone 17 Pro</h3>
        <p>6.3″ Super Retina XDR display<br>ProMotion up to 120Hz<br>Always-On display</p>
      </div>
      <div>
        <h3 style="font-size:17px;">iPhone 17 Pro Max</h3>
        <p>6.9″ Super Retina XDR display<br>ProMotion up to 120Hz<br>Always-On display</p>
      </div>
    </div>
  </section>

  <hr class="apple-divider">

  <section>
    <h2>Both models</h2>
    <div style="margin-top:var(--space-4);">
      <h3 style="font-size:17px;">Camera</h3>
      <p>48MP Pro Fusion main<br>48MP Ultra Wide<br>48MP Telephoto with 5x optical zoom</p>
    </div>
  </section>
</main>

</body></html>
```

- [ ] **Step 2: Commit**

```bash
git add skills/apple-design/templates/specs-page.html
git commit -m "feat(apple-design): 新增 specs-page.html（Apple 风规格页，并排段落）"
```

---

### Task 1.23: 写 4 个 SVG 图模板

**Files:**
- Create: `skills/apple-design/templates/diagrams/flow.svg`
- Create: `skills/apple-design/templates/diagrams/architecture.svg`
- Create: `skills/apple-design/templates/diagrams/hierarchy.svg`
- Create: `skills/apple-design/templates/diagrams/timeline.svg`

- [ ] **Step 1: 写 `flow.svg`（4 节点 + 1 gate，左→右）**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 200" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#1D1D1D"/></marker>
    <style>
      .node { fill: #fff; stroke: #D2D2D7; stroke-width: 1; }
      .node-text { fill: #1D1D1D; font-size: 13px; text-anchor: middle; dominant-baseline: middle; }
      .flow-line { stroke: #1D1D1D; stroke-width: 1.5; fill: none; }
      .gate { fill: #fff; stroke: #0071E3; stroke-width: 1.5; }
    </style>
  </defs>

  <rect class="node" x="20" y="75" width="140" height="50" rx="12"/>
  <text class="node-text" x="90" y="100">Input</text>

  <line class="flow-line" x1="160" y1="100" x2="200" y2="100" marker-end="url(#arrow)"/>

  <rect class="node" x="200" y="75" width="140" height="50" rx="12"/>
  <text class="node-text" x="270" y="100">Process</text>

  <line class="flow-line" x1="340" y1="100" x2="380" y2="100" marker-end="url(#arrow)"/>

  <polygon class="gate" points="430,75 480,100 430,125 380,100"/>
  <text class="node-text" x="430" y="103">Decision</text>

  <line class="flow-line" x1="480" y1="100" x2="520" y2="100" marker-end="url(#arrow)"/>

  <rect class="node" x="520" y="75" width="140" height="50" rx="12"/>
  <text class="node-text" x="590" y="100">Output</text>
</svg>
```

- [ ] **Step 2: 写 `architecture.svg`（3 层分层，浅灰底）**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 360" font-family="-apple-system, sans-serif">
  <rect width="600" height="360" fill="#F5F5F7"/>
  <g font-size="12" fill="#6E6E73" text-anchor="start">
    <text x="20" y="40">Presentation Layer</text>
    <text x="20" y="160">Service Layer</text>
    <text x="20" y="280">Data Layer</text>
  </g>
  <g>
    <rect x="20" y="50" width="560" height="80" rx="12" fill="#fff" stroke="#D2D2D7"/>
    <rect x="20" y="170" width="560" height="80" rx="12" fill="#fff" stroke="#D2D2D7"/>
    <rect x="20" y="290" width="560" height="50" rx="12" fill="#fff" stroke="#D2D2D7"/>
  </g>
  <g font-size="13" fill="#1D1D1D" text-anchor="middle">
    <text x="120" y="95">UI Components</text><text x="300" y="95">Routing</text><text x="480" y="95">State</text>
    <text x="120" y="215">API</text><text x="300" y="215">Auth</text><text x="480" y="215">Cache</text>
    <text x="300" y="320">Database · Object Storage · Queue</text>
  </g>
</svg>
```

- [ ] **Step 3: 写 `hierarchy.svg`（View 树式缩进）**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 280" font-family="-apple-system, sans-serif" font-size="13" fill="#1D1D1D">
  <rect width="400" height="280" fill="#fff"/>
  <g stroke="#D2D2D7" stroke-width="1">
    <line x1="40" y1="50" x2="40" y2="240"/>
    <line x1="40" y1="80" x2="70" y2="80"/>
    <line x1="40" y1="120" x2="70" y2="120"/>
    <line x1="70" y1="120" x2="70" y2="200"/>
    <line x1="70" y1="160" x2="100" y2="160"/>
    <line x1="70" y1="200" x2="100" y2="200"/>
    <line x1="40" y1="240" x2="70" y2="240"/>
  </g>
  <g>
    <text x="50" y="30" font-weight="600">RootView</text>
    <text x="80" y="84">HeaderView</text>
    <text x="80" y="124">ContentView</text>
    <text x="110" y="164">ListItem</text>
    <text x="110" y="204">DetailRow</text>
    <text x="80" y="244">FooterView</text>
  </g>
</svg>
```

- [ ] **Step 4: 写 `timeline.svg`（6 节点水平生命周期，tab 风）**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 120" font-family="-apple-system, sans-serif" font-size="13" fill="#1D1D1D">
  <line x1="60" y1="60" x2="840" y2="60" stroke="#D2D2D7" stroke-width="1"/>
  <g text-anchor="middle">
    <circle cx="60" cy="60" r="10" fill="#0071E3"/><text x="60" y="95">Design</text>
    <circle cx="216" cy="60" r="10" fill="#fff" stroke="#D2D2D7" stroke-width="2"/><text x="216" y="95">Make</text>
    <circle cx="372" cy="60" r="10" fill="#fff" stroke="#D2D2D7" stroke-width="2"/><text x="372" y="95">Package</text>
    <circle cx="528" cy="60" r="10" fill="#fff" stroke="#D2D2D7" stroke-width="2"/><text x="528" y="95">Ship</text>
    <circle cx="684" cy="60" r="10" fill="#fff" stroke="#D2D2D7" stroke-width="2"/><text x="684" y="95">Use</text>
    <circle cx="840" cy="60" r="10" fill="#fff" stroke="#D2D2D7" stroke-width="2"/><text x="840" y="95">Recover</text>
  </g>
</svg>
```

- [ ] **Step 5: 批量验证 SVG**

```bash
python3 -c "
import xml.etree.ElementTree as ET, os
for f in ['flow','architecture','hierarchy','timeline']:
    p = f'skills/apple-design/templates/diagrams/{f}.svg'
    ET.parse(p)
    print('OK', p, os.path.getsize(p), 'bytes')
"
```

Expected: 4 个 OK。

- [ ] **Step 6: Commit**

```bash
git add skills/apple-design/templates/diagrams/
git commit -m "feat(apple-design): 新增 4 个 SVG 图模板（flow/architecture/hierarchy/timeline）"
```

---

### Task 1.24: 写 `prompts/example-prompts.md`

**Files:**
- Create: `skills/apple-design/prompts/example-prompts.md`

- [ ] **Step 1: 写示例调用 prompt**

```markdown
# Apple Design 示例 Prompt

## 基础调用

```
用 apple-design 做一个"个人简介"落地页，包含 hero、项目 lineup、3 个巨字号统计、
联系方式页脚。引用 skills/apple-design/assets/apple.css。
```

## 文章排版

```
把这段 Markdown 文章用 apple-design 的 article.html 模板渲染成单页 HTML：
- 680px 单栏
- 顶部 category badge
- 日期用 apple-caption
- 代码块用 apple-code 类
```

## 开发者文档

```
用 apple-design 的 docs.html 三栏布局渲染这份 API 文档。左栏放目录，
右栏放 TOC，代码块 SF Mono。
```

## 演示页

```
用 apple-design 的 slide-deck.html 模板做一个 10 页季度汇报：
封面 / 目标 / 现状（3 个统计）/ 方案 / 时间线 / 风险 / Q&A。
```

## 商品配置器

```
模仿 apple-design 的 product-configurator.html，做一个"订阅套餐选购"页：
左侧套餐大图，右侧颜色主题、档位选项、周期分段，底部 sticky 购买栏。
```

## 流程图 / 架构图

```
用 apple-design/templates/diagrams/flow.svg 为模板，画一个"用户注册 → 邮箱验证 →
（是否通过）→ 入驻 / 失败"四节点流程图。节点保持 Apple 圆角矩形 + 细灰描边。
```

## 仅套色板

```
按 apple-design 的色板（白 + F5F5F7 + 0071E3 链接 + 1D1D1D 文字）重写这段 HTML，
不要动结构，只改样式。
```

## 不要这样做

❌ "用 apple-design 做一个紫色渐变的赛博朋克页面" — 违背品牌。
❌ "用 apple-design 做 iOS 原生应用界面" — 用 Apple HIG skill。
```

- [ ] **Step 2: Commit**

```bash
git add skills/apple-design/prompts/example-prompts.md
git commit -m "feat(apple-design): 新增 example-prompts.md"
```

---

### Task 1.25: Apple skill 集成验证

- [ ] **Step 1: 检查文件完整性**

```bash
cd /Users/sky/linux-kernel/github/sky-skills
python3 <<'EOF'
import os
base = 'skills/apple-design'
expected = [
  'SKILL.md',
  'references/design-tokens.md', 'references/typography.md', 'references/layout-patterns.md',
  'references/components.md', 'references/motion.md', 'references/imagery.md',
  'references/data-display.md', 'references/responsive.md', 'references/dos-and-donts.md',
  'assets/apple.css', 'assets/apple.tailwind.js', 'assets/fonts.css',
  'templates/landing-page.html', 'templates/article.html', 'templates/docs.html',
  'templates/slide-deck.html', 'templates/stat-callout.html', 'templates/nav-footer.html',
  'templates/form.html', 'templates/product-configurator.html', 'templates/specs-page.html',
  'templates/diagrams/flow.svg', 'templates/diagrams/architecture.svg',
  'templates/diagrams/hierarchy.svg', 'templates/diagrams/timeline.svg',
  'prompts/example-prompts.md',
]
missing = [f for f in expected if not os.path.exists(os.path.join(base, f))]
assert not missing, f'Missing: {missing}'
print(f'OK — {len(expected)} files present')
EOF
```

Expected: `OK — 26 files present`

- [ ] **Step 2: 浏览器目测全部模板**

```bash
python3 -m http.server 8787 &
sleep 1
for f in landing-page article docs slide-deck stat-callout nav-footer form product-configurator specs-page; do
  echo "http://localhost:8787/skills/apple-design/templates/$f.html"
done
# 手动打开每页，确认：
# - 没有 404 资源
# - 字体栈正确（macOS 上显示 SF）
# - 色板与 spec 一致
# - 响应式在 mobile 视图不崩
kill %1 2>/dev/null
```

- [ ] **Step 3: Commit 验证记录（空提交占位）**

```bash
git commit --allow-empty -m "test(apple-design): 26 个文件齐备、模板浏览器目测通过"
```

---

## Phase 2 — Anthropic Design Skill

Phase 2 结构与 Phase 1 完全对称。以下任务按相同粒度展开，但只给出 **差异** 内容。共用的结构模式（YAML 检查、CSS 句法检查、浏览器目测、commit）与 Phase 1 一致。

### Task 2.1: 写 `skills/anthropic-design/SKILL.md`

- [ ] **Step 1: 写入**

```markdown
---
name: anthropic-design
description: "Render HTML/CSS in anthropic.com visual aesthetic — warm cream background (#faf9f5), Poppins headings + Lora serif body, orange accent (#d97757) for CTAs and emphasis, rounded filled pill buttons, editorial card grids, abstract SVG illustrations, low-saturation data visualizations (soft blue/gray/teal), hand-drawn SVG architecture diagrams with orange/blue/green node categorization and diamond decision gates. TRIGGER when the user says 'anthropic 风格' / 'anthropic style' / 'claude 官网风格' / 'Anthropic 品牌', or asks for an editorial/long-form page, research article layout, pricing card grid, or a filled-button-with-warmth feel. DO NOT TRIGGER for generic 'beautiful web page' requests (use frontend-design) or Apple aesthetic (use apple-design)."
last-verified: 2026-04-19
---

# Anthropic Design — HTML 风格

让 Claude 以 anthropic.com / claude.com 视觉语言输出：暖米白底、Poppins + Lora 字体、橙色主强调、编辑式卡片网格、抽象 SVG 插画、低饱和图表、手工 SVG 架构图。

（使用方式、触发词、禁用场景、阅读顺序按 Apple 版结构照抄，替换字段。）
```

- [ ] **Step 2: YAML 验证 + Commit**

```bash
python3 -c "
import yaml
parts = open('skills/anthropic-design/SKILL.md').read().split('---')
d = yaml.safe_load(parts[1])
assert d['name'] == 'anthropic-design'
print('OK')
"
git add skills/anthropic-design/SKILL.md
git commit -m "feat(anthropic-design): 新增 SKILL.md"
```

---

### Task 2.2: 写 `references/design-tokens.md`

- [ ] **Step 1: 写入**

颜色（差异点）：

| Token | Hex | 用途 |
|---|---|---|
| `--anth-bg` | `#faf9f5` | 主暖背景 |
| `--anth-bg-subtle` | `#f0ede3` | 次级段落底 |
| `--anth-text` | `#141413` | 主文字 |
| `--anth-text-secondary` | `#6b6a5f` | 次级文字 |
| `--anth-orange` | `#d97757` | 主强调 / CTA |
| `--anth-orange-hover` | `#c56544` | 按钮 hover |
| `--anth-blue` | `#6a9bcc` | 次强调 / 分类 / 数据图 |
| `--anth-green` | `#788c5d` | 第三强调 / 分类 |
| `--anth-mid-gray` | `#b0aea5` | 辅色 |
| `--anth-light-gray` | `#e8e6dc` | 分隔 / 卡片底 |
| `--anth-danger` | `#a14238` | danger admonition |

字体：

```
--font-heading: "Poppins", "Helvetica Neue", Arial, sans-serif;
--font-body:    "Lora",    Georgia, "Times New Roman", serif;
--font-mono:    "JetBrains Mono", ui-monospace, Menlo, monospace;
```

字号（差异表）：

| Role | size / line-height / weight |
|---|---|
| Hero headline | 56px / 1.1 / 600 |
| Section headline | 40px / 1.15 / 600 |
| Subhead | 24px / 1.3 / 500 |
| Body | 18px / 1.65 / 400 (Lora) |
| Caption | 13px / 1.4 / 400 |
| Stat number | 64px / 1 / 700 |

间距 / 缓动：与 Apple 相同。

断点：

```
mobile:   ≤768px
tablet:   769–1024px
desktop:  ≥1025px
```

容器 max-width：720 / 960 / 1200。

- [ ] **Step 2: Commit**

```bash
git add skills/anthropic-design/references/design-tokens.md
git commit -m "feat(anthropic-design): 新增 design-tokens.md"
```

---

### Task 2.3: 写 `assets/anthropic.css`

**Files:**
- Create: `skills/anthropic-design/assets/anthropic.css`

内容与 `apple.css` 同结构（8 个 step），差异点：

- [ ] **Step 1: `:root` 用 `--anth-*` 变量**

```css
:root {
  --anth-bg: #faf9f5;
  --anth-bg-subtle: #f0ede3;
  --anth-text: #141413;
  --anth-text-secondary: #6b6a5f;
  --anth-orange: #d97757;
  --anth-orange-hover: #c56544;
  --anth-blue: #6a9bcc;
  --anth-green: #788c5d;
  --anth-mid-gray: #b0aea5;
  --anth-light-gray: #e8e6dc;
  --anth-danger: #a14238;
  --font-heading: "Poppins", "Helvetica Neue", Arial, sans-serif;
  --font-body: "Lora", Georgia, "Times New Roman", serif;
  --font-mono: "JetBrains Mono", ui-monospace, Menlo, monospace;
  /* space/radius/shadow/ease 同 apple.css */
  --space-1:4px;--space-2:8px;--space-3:12px;--space-4:16px;--space-5:24px;--space-6:32px;--space-7:48px;--space-8:64px;--space-9:80px;--space-10:120px;
  --radius-sm:6px;--radius-md:16px;--radius-lg:24px;--radius-pill:9999px;
  --shadow-card:0 2px 12px rgba(20,20,19,0.05);
  --shadow-pop:0 10px 40px rgba(20,20,19,0.08);
  --ease-anth:cubic-bezier(0.25,1,0.5,1);
  --duration-sm:240ms;--duration-md:400ms;--duration-lg:700ms;
}
* { box-sizing: border-box; }
html, body { margin:0; padding:0; }
body {
  font-family: var(--font-body);
  font-size: 18px;
  line-height: 1.65;
  color: var(--anth-text);
  background: var(--anth-bg);
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 2: Typography（serif body！）**

```css
h1, h2, h3, h4, h5 { font-family: var(--font-heading); margin: 0; font-weight: 600; }
h1 { font-size: 56px; line-height: 1.1; }
h2 { font-size: 40px; line-height: 1.15; }
h3 { font-size: 24px; line-height: 1.3; font-weight: 500; }
h4 { font-size: 20px; line-height: 1.4; }
p  { margin: 0 0 var(--space-4); }
.anth-caption { font-size: 13px; line-height: 1.4; color: var(--anth-text-secondary); }
```

- [ ] **Step 3: Button（实心胶囊 —— 与 Apple 相反）**

```css
.anth-button {
  display: inline-block;
  padding: 12px 24px;
  border-radius: var(--radius-pill);
  background: var(--anth-orange);
  color: #faf9f5;
  font-family: var(--font-heading);
  font-weight: 500;
  font-size: 15px;
  text-decoration: none;
  border: 0;
  cursor: pointer;
  transition: background var(--duration-sm) var(--ease-anth);
}
.anth-button:hover { background: var(--anth-orange-hover); }
.anth-button--dark { background: var(--anth-text); color: #faf9f5; }
.anth-button--ghost { background: transparent; color: var(--anth-text); border: 1px solid var(--anth-text); }
.anth-link { color: var(--anth-orange); text-decoration: underline; text-underline-offset: 0.2em; }
.anth-link::after { content: " \2192"; }  /* → */
```

- [ ] **Step 4: Layout + Card + Nav + Footer**

```css
.anth-container { max-width: 960px; margin: 0 auto; padding: 0 var(--space-5); }
.anth-container--narrow { max-width: 720px; }
.anth-container--wide { max-width: 1200px; }
.anth-section { padding-block: var(--space-8); }
.anth-section--subtle { background: var(--anth-bg-subtle); }
.anth-card { background: #fff; border-radius: var(--radius-md); box-shadow: var(--shadow-card); padding: var(--space-5); }

.anth-nav { position: sticky; top: 0; z-index: 100; height: 64px; background: var(--anth-bg); border-bottom: 1px solid var(--anth-light-gray); }
.anth-nav-inner { max-width: 1200px; margin: 0 auto; padding: 0 var(--space-5); height: 100%; display: flex; align-items: center; justify-content: space-between; }
.anth-nav a { color: var(--anth-text); font-family: var(--font-heading); font-size: 14px; font-weight: 500; text-decoration: none; margin-right: var(--space-5); }

.anth-footer { background: var(--anth-bg-subtle); padding-block: var(--space-7); font-size: 13px; color: var(--anth-text-secondary); }
.anth-footer-grid { max-width: 1200px; margin: 0 auto; padding: 0 var(--space-5); display: grid; grid-template-columns: repeat(6, 1fr); gap: var(--space-6); }
.anth-footer-group h5 { font-family: var(--font-heading); font-size: 13px; color: var(--anth-text); margin-bottom: var(--space-3); }
.anth-footer-group a { display: block; color: var(--anth-text-secondary); text-decoration: none; margin-bottom: var(--space-2); }
.anth-footer-legal { max-width: 1200px; margin: var(--space-6) auto 0; padding: var(--space-5) var(--space-5) 0; border-top: 1px solid var(--anth-light-gray); display: flex; justify-content: space-between; flex-wrap: wrap; gap: var(--space-4); }
.anth-social { display: flex; gap: var(--space-3); }
```

- [ ] **Step 5: Badge / Quote / Form / Tabs / Code / Admonition / Table**

```css
.anth-badge { display: inline-block; font-family: var(--font-heading); font-size: 12px; padding: 4px 10px; border-radius: var(--radius-pill); background: var(--anth-light-gray); color: var(--anth-text); }

.anth-quote { font-family: var(--font-body); font-style: italic; font-size: 22px; line-height: 1.55; padding-left: var(--space-5); border-left: 3px solid var(--anth-orange); max-width: 680px; margin: var(--space-6) 0; }
.anth-quote-cite { display: flex; align-items: center; gap: var(--space-3); margin-top: var(--space-4); font-size: 14px; font-style: normal; font-family: var(--font-heading); }
.anth-quote-cite img { height: 20px; width: auto; }

.anth-input, .anth-select, .anth-textarea { width: 100%; background: #fff; border: 1px solid var(--anth-light-gray); border-radius: var(--radius-md); padding: 12px 16px; font-family: var(--font-body); font-size: 15px; color: var(--anth-text); }
.anth-input:focus, .anth-select:focus, .anth-textarea:focus { outline: 2px solid var(--anth-orange); outline-offset: 0; border-color: transparent; }
.anth-radio, .anth-checkbox { accent-color: var(--anth-orange); width: 18px; height: 18px; }
.anth-label { font-family: var(--font-heading); font-size: 14px; color: var(--anth-text); margin-bottom: var(--space-2); display: block; }

.anth-tabs { display: flex; gap: var(--space-5); border-bottom: 1px solid var(--anth-light-gray); }
.anth-tab { background: transparent; border: 0; padding: var(--space-3) 0; font-family: var(--font-heading); font-size: 14px; color: var(--anth-text-secondary); cursor: pointer; border-bottom: 2px solid transparent; transition: all var(--duration-sm); }
.anth-tab.is-active { color: var(--anth-text); border-bottom-color: var(--anth-orange); }

.anth-code, pre.anth-code { font-family: var(--font-mono); font-size: 14px; background: var(--anth-bg-subtle); border-radius: var(--radius-md); padding: var(--space-6); overflow-x: auto; }
code { font-family: var(--font-mono); font-size: 0.93em; background: var(--anth-bg-subtle); padding: 2px 6px; border-radius: var(--radius-sm); }
kbd { font-family: var(--font-mono); font-size: 12px; background: #fff; border: 1px solid var(--anth-light-gray); padding: 2px 6px; border-radius: var(--radius-sm); }
mark { background: rgba(217, 119, 87, 0.2); }

.anth-admonition { background: var(--anth-bg-subtle); border-radius: var(--radius-md); padding: var(--space-5); margin: var(--space-5) 0; }
.anth-admonition h5 { color: var(--anth-blue); margin-bottom: var(--space-2); }
.anth-admonition--warning h5 { color: var(--anth-orange); }
.anth-admonition--success h5 { color: var(--anth-green); }
.anth-admonition--danger h5 { color: var(--anth-danger); }

.anth-table { width: 100%; border-collapse: collapse; font-size: 15px; }
.anth-table th { text-align: left; padding: 12px 16px; background: var(--anth-bg-subtle); font-family: var(--font-heading); font-weight: 500; }
.anth-table td { padding: 12px 16px; border-bottom: 1px solid var(--anth-light-gray); }
.anth-table tr:hover td { background: var(--anth-bg-subtle); }
.anth-table .check { color: var(--anth-green); }
.anth-table .cross { color: var(--anth-mid-gray); }
```

- [ ] **Step 6: Stat / Logo wall / Details / Divider / Responsive / A11y**

```css
.anth-stat-number { font-family: var(--font-heading); font-size: 64px; font-weight: 700; color: var(--anth-text); }
.anth-stat-label { font-family: var(--font-body); color: var(--anth-text-secondary); font-size: 14px; }

.anth-logo-wall { display: grid; grid-template-columns: repeat(6, 1fr); gap: var(--space-6); align-items: center; }
.anth-logo-wall img { max-height: 32px; width: auto; filter: grayscale(1) opacity(0.6); transition: filter var(--duration-sm); }
.anth-logo-wall img:hover { filter: none; }

.anth-details { background: var(--anth-bg-subtle); border-radius: var(--radius-md); padding: var(--space-4); margin: var(--space-3) 0; }
.anth-details summary { cursor: pointer; font-family: var(--font-heading); font-weight: 500; list-style: none; display: flex; justify-content: space-between; }
.anth-details summary::after { content: '▸'; transition: transform var(--duration-sm); }
.anth-details[open] summary::after { transform: rotate(90deg); }

.anth-divider { border: 0; height: 1px; background: var(--anth-light-gray); margin: var(--space-8) 0; }

@media (max-width: 768px) {
  h1 { font-size: 36px; }
  h2 { font-size: 28px; }
  .anth-footer-grid { grid-template-columns: repeat(2, 1fr); }
  .anth-section { padding-block: var(--space-7); }
}
@media (min-width: 769px) and (max-width: 1024px) {
  h1 { font-size: 48px; }
  .anth-footer-grid { grid-template-columns: repeat(3, 1fr); }
}

.anth-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
:focus-visible { outline: 2px solid var(--anth-orange); outline-offset: 2px; border-radius: 2px; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
}
```

- [ ] **Step 7: 语法检查 + Commit**

```bash
python3 -c "
c = open('skills/anthropic-design/assets/anthropic.css').read()
assert c.count('{') == c.count('}')
for t in ['--anth-bg','--anth-orange','--anth-text','--font-heading','--font-body','--space-4','--radius-md']:
    assert t in c, t
print('OK', len(c), 'bytes')
"
git add skills/anthropic-design/assets/anthropic.css
git commit -m "feat(anthropic-design): 新增 anthropic.css 全量 CSS"
```

---

### Task 2.4: 写 `assets/fonts.css`

- [ ] **Step 1: 写入（真 @font-face，因为 Poppins/Lora/JetBrains Mono 都在 Google Fonts 自由使用）**

```css
/* Anthropic Design — Font Declarations
 * 三个字体全部来自 Google Fonts（OFL 许可）。
 */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap');
```

- [ ] **Step 2: Commit**

```bash
git add skills/anthropic-design/assets/fonts.css
git commit -m "feat(anthropic-design): 新增 fonts.css（Poppins + Lora + JetBrains Mono）"
```

---

### Task 2.5–2.12: 写 8 份 references/*.md

与 Phase 1 Task 1.5–1.12 一一对应，每份替换为 Anthropic 视觉规则。差异要点：

**typography.md**：强调 "正文使用 Lora 衬线体 —— 这是 Anthropic 与 Apple 最核心的差异"，max-width 720px。

**layout-patterns.md**：六种版式为 Editorial card grid / Long-form article（720px 衬线）/ Research paper（hero + SVG 插画 + 低饱和图表）/ Product overview（橙 CTA + 能力卡 + 客户引用轮播 + pricing teaser）/ Pricing cards（三列，推荐款橙细边高亮）/ Enterprise（logo 墙 + 安全徽章 + 联系表单）。

**components.md**：从 spec §10 复制 Anthropic 列。所有 27 节必须齐全。

**motion.md**：同 Apple，但缓动改为 `--ease-anth`。

**imagery.md**：核心是"抽象 SVG 插画"，500×500 / 1200×1200 规格，仅用 anth-orange / blue / green / mid-gray。禁摄影。

**data-display.md**：完整数据可视化色板（见 spec §10.29）。柱/折/散/地图/Lorenz 曲线都给规则。

**responsive.md**：断点 768 / 1024；容器 720 / 960 / 1200。

**dos-and-donts.md**：
- Do：橙色胶囊 CTA，Lora serif 正文，低饱和图表，SVG 插画。
- Don't：高饱和三原色图表，照片替代插画，Apple 式裸文字链，Inter/Roboto。

每 task 单独 commit。

- [ ] **Task 2.5–2.12 每份 md 完成后：**

```bash
git add skills/anthropic-design/references/<name>.md
git commit -m "feat(anthropic-design): 新增 <name>.md"
```

---

### Task 2.13: 写 `assets/anthropic.tailwind.js`

- [ ] **Step 1: 写入**

与 `apple.tailwind.js` 同结构，替换 token：

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        anth: {
          bg: '#faf9f5',
          'bg-subtle': '#f0ede3',
          text: '#141413',
          'text-secondary': '#6b6a5f',
          orange: '#d97757',
          'orange-hover': '#c56544',
          blue: '#6a9bcc',
          green: '#788c5d',
          'mid-gray': '#b0aea5',
          'light-gray': '#e8e6dc',
          danger: '#a14238',
        },
      },
      fontFamily: {
        'anth-heading': ['Poppins', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        'anth-body': ['Lora', 'Georgia', '"Times New Roman"', 'serif'],
        'anth-mono': ['"JetBrains Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
      fontSize: {
        'anth-hero': ['56px', { lineHeight: '1.1', fontWeight: '600' }],
        'anth-section': ['40px', { lineHeight: '1.15', fontWeight: '600' }],
        'anth-subhead': ['24px', { lineHeight: '1.3', fontWeight: '500' }],
        'anth-body': ['18px', { lineHeight: '1.65' }],
        'anth-caption': ['13px', { lineHeight: '1.4' }],
        'anth-stat': ['64px', { lineHeight: '1', fontWeight: '700' }],
      },
      borderRadius: {
        'anth-sm': '6px', 'anth-md': '16px', 'anth-lg': '24px', 'anth-pill': '9999px',
      },
      boxShadow: {
        'anth-card': '0 2px 12px rgba(20,20,19,0.05)',
        'anth-pop': '0 10px 40px rgba(20,20,19,0.08)',
      },
      transitionTimingFunction: { 'anth': 'cubic-bezier(0.25, 1, 0.5, 1)' },
      screens: {
        'anth-mobile': { 'max': '768px' },
        'anth-tablet': { 'min': '769px', 'max': '1024px' },
        'anth-desktop': { 'min': '1025px' },
      },
    },
  },
};
```

- [ ] **Step 2: Commit**

```bash
node -e "require('./skills/anthropic-design/assets/anthropic.tailwind.js'); console.log('OK');"
git add skills/anthropic-design/assets/anthropic.tailwind.js
git commit -m "feat(anthropic-design): 新增 Tailwind preset"
```

---

### Task 2.14–2.22: 写 9 个 HTML 模板

| 文件 | 内容要点 |
|---|---|
| `nav-footer.html` | 顶 nav 含 Try Claude 橙胶囊 CTA + 6 栏 footer + 社媒图标行（LinkedIn/X/YouTube） |
| `landing-page.html` | Hero + 橙色双 CTA + 3 能力卡 + 客户引用 pull-quote + pricing teaser |
| `article.html` | Research/news 风：大标题 + 日期 + Lora serif 720px 单栏 + 内联低饱和 bar chart + 客户 logo 带 |
| `docs.html` | 左 sidebar + 720px 正文 + 右 TOC，全程 warm cream |
| `slide-deck.html` | 10 页 scroll-snap，橙色强调 |
| `pricing.html` | 三列 plan 卡，Team 推荐橙细边 + 下方比较表 |
| `data-report.html` | 长报告：hero + 多个低饱和图表（bar/line/scatter/map）内联 + 结论 |
| `enterprise.html` | Logo 墙 + 安全徽章 + 三列 value props + 联系表单 |
| `product-overview.html` | 模仿 claude.com：hero + 能力 grid + 模型卡 + CTA |

每 task 按 Phase 1 同样粒度：

- [ ] **Step 1: 写入完整 HTML（引用 `../assets/anthropic.css` + `../assets/fonts.css`）**
- [ ] **Step 2: 浏览器目测（同 Task 1.15 命令，端口 8787）**
- [ ] **Step 3: Commit**

```bash
git add skills/anthropic-design/templates/<name>.html
git commit -m "feat(anthropic-design): 新增 <name>.html 模板"
```

每模板必须含 nav 与 footer（复用 nav-footer 骨架）。

---

### Task 2.23: 写 4 个 SVG 图模板

与 Phase 1 Task 1.23 同结构，但配色替换：

- `flow.svg`：4 节点矩形填色按分类（`--anth-orange` 入口 / `--anth-blue` 处理 / `--anth-green` 输出），gate 菱形 `--anth-orange` 填充 white stroke。文字用 Poppins。
- `architecture.svg`：三层每层一个强调色（橙/蓝/绿），底 `--anth-bg-subtle`，连线 1.5px `--anth-text`。
- `hierarchy.svg`：orchestrator-subagent 风格（参考 Anthropic 工程博客）。中央大圆 `--anth-orange` 填充，4 个放射 subagents `--anth-blue` 填充，连线辐射。
- `timeline.svg`：水平里程碑，圆点 `--anth-orange`，连线 `--anth-light-gray`。

- [ ] **Step 1: 写全 4 个 SVG（每个含 font-family Poppins）**

示例 `flow.svg`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 200" font-family="Poppins, 'Helvetica Neue', Arial, sans-serif">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#141413"/></marker>
    <style>
      .node-text { fill: #faf9f5; font-size: 13px; font-weight: 500; text-anchor: middle; dominant-baseline: middle; }
      .flow-line { stroke: #141413; stroke-width: 1.5; fill: none; }
    </style>
  </defs>
  <rect x="20" y="75" width="140" height="50" rx="16" fill="#d97757"/>
  <text class="node-text" x="90" y="100">Input</text>
  <line class="flow-line" x1="160" y1="100" x2="200" y2="100" marker-end="url(#arrow)"/>
  <rect x="200" y="75" width="140" height="50" rx="16" fill="#6a9bcc"/>
  <text class="node-text" x="270" y="100">Process</text>
  <line class="flow-line" x1="340" y1="100" x2="380" y2="100" marker-end="url(#arrow)"/>
  <polygon points="430,75 480,100 430,125 380,100" fill="#d97757" stroke="#141413" stroke-width="1"/>
  <text class="node-text" x="430" y="103">Decision</text>
  <line class="flow-line" x1="480" y1="100" x2="520" y2="100" marker-end="url(#arrow)"/>
  <rect x="520" y="75" width="140" height="50" rx="16" fill="#788c5d"/>
  <text class="node-text" x="590" y="100">Output</text>
</svg>
```

（`architecture.svg` / `hierarchy.svg` / `timeline.svg` 按同规则写。）

- [ ] **Step 2: 批量验证**

```bash
python3 -c "
import xml.etree.ElementTree as ET, os
for f in ['flow','architecture','hierarchy','timeline']:
    p = f'skills/anthropic-design/templates/diagrams/{f}.svg'
    ET.parse(p)
    print('OK', p, os.path.getsize(p), 'bytes')
"
```

- [ ] **Step 3: Commit**

```bash
git add skills/anthropic-design/templates/diagrams/
git commit -m "feat(anthropic-design): 新增 4 个 SVG 图模板（橙/蓝/绿分类 + 菱形 gate）"
```

---

### Task 2.24: 写 `prompts/example-prompts.md`

- [ ] **Step 1: 参照 Apple 版结构，替换场景：**

```markdown
# Anthropic Design 示例 Prompt

## 基础

```
用 anthropic-design 风格做一个研究论文风格的长文页面，Lora serif 正文，
橙色 pull-quote，低饱和图表。
```

## 产品落地页

```
用 anthropic-design 做 SaaS 产品首页：hero + 橙色 Try 按钮 + 3 个能力卡 +
客户引用 + Team 推荐款 pricing teaser。
```

## 研究报告

```
用 anthropic-design 的 data-report.html 模板做一个季度经济指数报告，
含 3 个柱图、1 个折线图、1 个地图，全部低饱和色。
```

## 企业页

```
用 anthropic-design 的 enterprise.html 模板做一个企业客户页：logo 墙 +
安全徽章 + 3 列价值主张 + 联系销售表单（橙色提交按钮）。
```

## 架构图

```
用 anthropic-design/templates/diagrams/hierarchy.svg 画一个
orchestrator → 4 subagents 的架构图，中央节点橙色，子节点蓝色。
```

## 色板套用

```
按 anthropic-design 的色板（#faf9f5 底 + #d97757 橙 + Poppins/Lora）
重写这段 HTML。
```
```

- [ ] **Step 2: Commit**

```bash
git add skills/anthropic-design/prompts/example-prompts.md
git commit -m "feat(anthropic-design): 新增 example-prompts.md"
```

---

### Task 2.25: Anthropic skill 集成验证

- [ ] **Step 1: 文件完整性（镜像 Task 1.25）**

```bash
python3 <<'EOF'
import os
base = 'skills/anthropic-design'
expected = [
  'SKILL.md',
  'references/design-tokens.md','references/typography.md','references/layout-patterns.md',
  'references/components.md','references/motion.md','references/imagery.md',
  'references/data-display.md','references/responsive.md','references/dos-and-donts.md',
  'assets/anthropic.css','assets/anthropic.tailwind.js','assets/fonts.css',
  'templates/landing-page.html','templates/article.html','templates/docs.html',
  'templates/slide-deck.html','templates/nav-footer.html','templates/pricing.html',
  'templates/data-report.html','templates/enterprise.html','templates/product-overview.html',
  'templates/diagrams/flow.svg','templates/diagrams/architecture.svg',
  'templates/diagrams/hierarchy.svg','templates/diagrams/timeline.svg',
  'prompts/example-prompts.md',
]
missing = [f for f in expected if not os.path.exists(os.path.join(base, f))]
assert not missing, f'Missing: {missing}'
print(f'OK — {len(expected)} files present')
EOF
```

Expected: `OK — 26 files present`

- [ ] **Step 2: 浏览器目测全部模板**

- [ ] **Step 3: Commit 占位**

```bash
git commit --allow-empty -m "test(anthropic-design): 26 个文件齐备、模板浏览器目测通过"
```

---

## Phase 3 — 集成与 README

### Task 3.1: 更新根 `README.md`

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 在"Skills"列表下插入两个新 skill 条目**

打开 `README.md`，在现有 skills 表格的末尾添加：

```markdown
| [`apple-design`](skills/apple-design/) | Render HTML/CSS in apple.com visual aesthetic (SF Pro, minimal text links, stat callouts, product-photography layout) |
| [`anthropic-design`](skills/anthropic-design/) | Render HTML/CSS in anthropic.com visual aesthetic (cream bg + orange CTA, Poppins+Lora, editorial cards, SVG illustrations) |
```

如果当前 README 没有 skills 表格，在文件合适位置新增一节。

- [ ] **Step 2: 同步更新 `README_zh.md`**

加入对应中文条目：

```markdown
| [`apple-design`](skills/apple-design/) | 以 apple.com 网页美学渲染 HTML/CSS（SF Pro 字体、克制的文字链、巨字号统计、产品摄影主导） |
| [`anthropic-design`](skills/anthropic-design/) | 以 anthropic.com 网页美学渲染 HTML/CSS（米白底+橙色 CTA、Poppins+Lora、编辑式卡片、SVG 插画） |
```

- [ ] **Step 3: Commit**

```bash
git add README.md README_zh.md
git commit -m "docs: 在 README 登记 apple-design 与 anthropic-design"
```

---

### Task 3.2: 跨 skill 独立性验证

- [ ] **Step 1: 确认两 skill 互不依赖**

```bash
python3 <<'EOF'
import re, os
for base in ['skills/apple-design', 'skills/anthropic-design']:
    other = 'anthropic-design' if 'apple' in base else 'apple-design'
    for root, _, files in os.walk(base):
        for f in files:
            p = os.path.join(root, f)
            content = open(p, errors='ignore').read()
            assert other not in content, f'{p} references {other}'
print('OK — 两个 skill 互不引用')
EOF
```

Expected: `OK — 两个 skill 互不引用`

- [ ] **Step 2: Commit 占位**

```bash
git commit --allow-empty -m "test: 跨 skill 独立性通过（apple-design 与 anthropic-design 互不引用）"
```

---

### Task 3.3: 最终 lint / 回归扫描

- [ ] **Step 1: 扫描 placeholder / TBD**

```bash
grep -RIn -E 'TBD|TODO|FIXME|XXX' skills/apple-design skills/anthropic-design && echo "FOUND PLACEHOLDERS" || echo "CLEAN"
```

Expected: `CLEAN`

- [ ] **Step 2: 所有 HTML 可打开（ping 每个文件）**

```bash
cd /Users/sky/linux-kernel/github/sky-skills && python3 -m http.server 8787 &
sleep 1
for skill in apple-design anthropic-design; do
  for f in $(ls skills/$skill/templates/*.html 2>/dev/null); do
    code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8787/$f")
    echo "$code $f"
  done
done
kill %1 2>/dev/null
```

Expected: 全部 `200`。

- [ ] **Step 3: Final commit**

```bash
git commit --allow-empty -m "feat: apple-design 与 anthropic-design skill 全部实现完毕"
```

---

## Self-Review Checklist

### 1. Spec coverage

所有 spec 要求均已覆盖：

| Spec 节 | 实现任务 |
|---|---|
| §2 仓库结构 | Task 0.1 + 全部 Phase 1/2 task |
| §3.1 SKILL.md | Task 1.1 |
| §3.2 design-tokens | Task 1.2 + 1.3 (`:root`) |
| §3.3 typography.md | Task 1.5 |
| §3.4 layout-patterns | Task 1.6 |
| §3.5 motion | Task 1.8 |
| §3.6 imagery | Task 1.9 |
| §3.7 data-display | Task 1.10 |
| §3.8 dos-and-donts | Task 1.12 |
| §3.9 apple.css | Task 1.3 |
| §3.10 Tailwind preset | Task 1.13 |
| §3.11 fonts.css | Task 1.4 |
| §3.12 templates（9 个） | Task 1.14–1.22 |
| §3.13 example-prompts | Task 1.24 |
| §4.1–4.6 Anthropic 对称 | Task 2.1–2.24 |
| §5 触发规则 | Task 1.1 & 2.1 (SKILL.md frontmatter) |
| §10 HTML 元素全量清单 | Task 1.7 (components.md) + Task 1.3/1.14–1.22 (实际 CSS + 模板) + 同构 2.x |

### 2. Placeholder scan

Task 3.3 Step 1 自动化扫 `TBD|TODO|FIXME`，必须 CLEAN 才算完成。

### 3. Type consistency

- CSS 类前缀：`.apple-*` / `.anth-*` 两 skill 互不混用 — Task 3.2 验证。
- Token 命名：`--apple-*` / `--anth-*` 严格对称。
- 文件命名：两 skill 同结构，除 `apple.css` vs `anthropic.css` 主文件名差异外完全一致。

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-19-html-style-skills.md`. Two execution options:

**1. Subagent-Driven (recommended)** — 我派新 subagent 每次执行一个 task，task 间 review；迭代快。

**2. Inline Execution** — 在本会话里直接执行，按 task 批量推进，每 Phase 结束 checkpoint 一次。

**Which approach?**
