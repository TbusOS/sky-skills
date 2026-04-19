# Design Spec: `apple-design` & `anthropic-design` HTML 风格 Skills

**Date:** 2026-04-19
**Author:** sky（与 Claude 共同设计）
**Status:** 待实现
**Repo:** `sky-skills`

---

## 1. 目的与使用场景

让 Claude 在写任何 HTML 产物（落地页、文章、演示、文档、图表、公众号图文）时，能以 **apple.com** 或 **anthropic.com** 的官方设计美学稳定输出。两个 skill 彼此独立、结构对称，使用者通过显式触发词或 prompt 中指定风格来调用。

**核心需求：**
1. 设计 token（颜色、字体、间距、圆角、阴影、缓动）必须与两家官网一致。
2. 必须覆盖多种 HTML 场景（不只是落地页），因此模板按场景分类。
3. 流程图 / 架构图使用**手工 SVG 模板**，**不使用 Mermaid**（默认样式不够克制）。
4. 同时交付原生 CSS 变量 + Tailwind preset，项目按需选。
5. 提供 example prompt 让使用者知道怎么调。

**非目标（显式排除）：**
- 不做 iOS / macOS 原生应用 UI 规范（HIG 领域已有多个 skill）。
- 不做 Mermaid 主题化。
- 不强制使用任何具体前端框架；交付的是框架中立的 CSS。

---

## 2. 仓库结构

```
sky-skills/skills/
├── apple-design/
│   ├── SKILL.md
│   ├── references/
│   │   ├── design-tokens.md
│   │   ├── typography.md
│   │   ├── layout-patterns.md
│   │   ├── motion.md
│   │   ├── imagery.md
│   │   ├── data-display.md
│   │   └── dos-and-donts.md
│   ├── assets/
│   │   ├── apple.css
│   │   ├── apple.tailwind.js
│   │   └── fonts.css
│   ├── templates/
│   │   ├── landing-page.html
│   │   ├── article.html
│   │   ├── docs.html
│   │   ├── slide-deck.html
│   │   ├── stat-callout.html
│   │   └── diagrams/
│   │       ├── flow.svg
│   │       ├── architecture.svg
│   │       ├── hierarchy.svg
│   │       └── timeline.svg
│   └── prompts/
│       └── example-prompts.md
└── anthropic-design/
    └── （与 apple-design 同构）
```

---

## 3. Apple Design Skill 详细规范

### 3.1 SKILL.md frontmatter

```yaml
---
name: apple-design
description: >
  Render HTML/CSS in apple.com visual aesthetic — white/pale-gray alternating
  sections, SF Pro typography, minimal text links (no filled buttons), large
  statistic callouts, product-photography-driven layout, isometric infographics,
  hand-drawn SVG flow/architecture diagrams. TRIGGER when the user says
  "apple 风格", "apple style", "苹果官网风格", "like apple.com", or asks
  to design a landing page / slide / doc / diagram matching Apple's web look.
  DO NOT TRIGGER for native iOS/macOS UI (use an Apple HIG skill instead).
---
```

### 3.2 设计 token（`references/design-tokens.md` + `assets/apple.css`）

**颜色**

| Token | Hex | 用途 |
|---|---|---|
| `--apple-bg` | `#FFFFFF` | 主背景 |
| `--apple-bg-alt` | `#F5F5F7` | 交替段落 / 页脚 / 代码块底 |
| `--apple-bg-dark` | `#000000` | 黑色章节（Pro 系列风） |
| `--apple-text` | `#1D1D1D` | 主文字（白底）|
| `--apple-text-secondary` | `#6E6E73` | 次级文字 / 元信息 |
| `--apple-text-on-dark` | `#F5F5F7` | 黑底上的主文字 |
| `--apple-link` | `#0071E3` | 文字链（几乎是唯一彩色元素）|
| `--apple-link-hover` | `#0077ED` | 链接 hover |
| `--apple-divider` | `#D2D2D7` | 细分隔线 |

**字体栈**

```css
--font-display: "SF Pro Display", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
--font-text:    "SF Pro Text",    -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
--font-mono:    "SF Mono", ui-monospace, Menlo, Monaco, "Cascadia Mono", monospace;
```

**字号层级**（Apple 的 Type Scale 对照官网实测）

| 角色 | size / line-height / weight / tracking |
|---|---|
| Hero headline | 64px / 1.05 / 700 / -0.015em |
| Section headline | 48px / 1.08 / 600 / -0.01em |
| Subhead | 28px / 1.14 / 500 / -0.005em |
| Lead body | 21px / 1.38 / 400 / normal |
| Body | 17px / 1.47 / 400 / normal |
| Caption | 12px / 1.33 / 400 / normal |
| Stat callout | 120px / 1 / 600 / -0.02em |

**间距系统**（4px grid）

```
--space-1: 4px   --space-2: 8px   --space-3: 12px  --space-4: 16px
--space-5: 24px  --space-6: 32px  --space-7: 48px  --space-8: 64px
--space-9: 80px  --space-10: 120px
```

段落间距 `padding-block: var(--space-9)` ~ `--space-10`。

**圆角**

```
--radius-sm: 6px      # 输入、标签
--radius-md: 12px     # 卡片、图片
--radius-lg: 18px     # 大型模块
--radius-pill: 980px  # 按钮罕用，若用此
```

**阴影**

```
--shadow-product: 0 20px 60px -20px rgba(0,0,0,0.15);
--shadow-card:    0 2px 8px rgba(0,0,0,0.04);
```

**缓动**

```
--ease-apple: cubic-bezier(0.42, 0, 0.58, 1);   /* 平滑 */
--ease-apple-out: cubic-bezier(0.25, 1, 0.5, 1);
--duration-sm: 240ms;  --duration-md: 400ms;  --duration-lg: 700ms;
```

### 3.3 `references/typography.md`

- 规则："正文一律无衬线；绝不使用衬线字体。"
- Display 用在 24px 以上；Text 用在 24px 以下。
- Tracking：标题偏负值（-0.01 ~ -0.015em），正文保持 normal。
- 段落 max-width 不超 680px。
- 代码块：`SF Mono` + `#F5F5F5` 底 + `--radius-md` + 内边距 `--space-5`。
- 下划线链接：`text-underline-offset: 0.2em; text-decoration-thickness: 1px;`

### 3.4 `references/layout-patterns.md`

六类模式，每种附 HTML 骨架示意：

1. **Alternating section**（产品页主节奏）：白 → 浅灰 → 白 → 黑，每段 80px 上下 padding，居中 980px max-width。
2. **Hero with large text over image**：图片 full-bleed，文字 absolute 定位上 1/3 处。
3. **Product grid (lineup)**：3–5 列并排，每列：产品图 → 产品名 → 价格 → "Learn more" / "Buy"。
4. **Three-column docs**：左 sidebar（固定）+ 中 article（680px）+ 右 TOC（固定）。
5. **Newsroom card grid**：1:1 图像 + 底部渐变遮罩 + 白字标题 + 日期。
6. **Event page**：大视频 replay 块 + 产品卡 grid + 过往事件缩略图。

### 3.5 `references/motion.md`

- 默认 `--ease-apple-out`；hover 用 240ms。
- 滚动触发的入场：opacity 0→1 + translateY 24→0，用 `IntersectionObserver`，stagger 80ms。
- 视频：自动循环静音播放；首次播放 fade in 600ms。
- 限制：禁止使用反弹（bounce）、弹簧（spring）动画；禁止 rotation 入场；一切要"精密克制"。

### 3.6 `references/imagery.md`

- 产品图：白底 / 透明背景，中心对齐，底部浅阴影 `--shadow-product`。
- 摄影：人物或环境摄影必须高质量；避免 stock 感。
- 圆角：图片默认 `--radius-md`；若为全屏 hero 不加圆角。
- 禁止：不用 gradient overlay 填色（除非在 newsroom 卡片做渐变黑遮罩）；不用 drop-shadow 过重。

### 3.7 `references/data-display.md`

- **巨字号统计**：`font-size: 120px; font-weight: 600; tracking: -0.02em;` + 下方 `font-size: 17px; color: var(--apple-text-secondary);` 的描述。
- **不使用**传统 bar / pie / donut chart 做营销内容；数据即排版。
- 需要图表时：单色实色柱、细轴线、无网格 glyph、labels 用 `SF Pro Text` 12px。
- 流程图使用 `templates/diagrams/*.svg`（下节）。

### 3.8 `references/dos-and-donts.md`

| ✅ Do | ❌ Don't |
|---|---|
| 产品摄影居中、留白 | 渐变紫+白的 AI 味配色 |
| 巨字号统计 | 饼图/3D 柱图 |
| 文字链加下划线 | 彩色实心按钮堆叠 |
| 黑白交替段落 | 全页同色无节奏 |
| SF Pro 全家族 | Inter / Roboto / system-ui 直接调 |

### 3.9 `assets/apple.css`

内容骨架：
```css
:root { /* 所有 --apple-* 变量 */ }
body { font-family: var(--font-text); color: var(--apple-text); }
.apple-section { padding-block: var(--space-9); }
.apple-section--alt { background: var(--apple-bg-alt); }
.apple-section--dark { background: var(--apple-bg-dark); color: var(--apple-text-on-dark); }
.apple-hero { text-align: center; padding-block: var(--space-10); }
.apple-hero h1 { font-family: var(--font-display); font-size: 64px; ... }
.apple-link { color: var(--apple-link); text-decoration: underline; ... }
.apple-stat { font-size: 120px; ... }
.apple-card { border-radius: var(--radius-md); box-shadow: var(--shadow-card); }
.apple-code { font-family: var(--font-mono); background: var(--apple-bg-alt); ... }
/* 不定义通用"button" 类 — Apple 几乎不用实心按钮 */
```

使用方式：`<link rel="stylesheet" href="apple.css">` + body 加 `class="apple-*"`。

### 3.10 `assets/apple.tailwind.js`

```js
module.exports = {
  theme: {
    extend: {
      colors: { apple: { bg: '#FFFFFF', 'bg-alt': '#F5F5F7', ... } },
      fontFamily: { display: ['SF Pro Display', ...], text: [...], mono: [...] },
      fontSize: { 'apple-hero': ['64px', { lineHeight: '1.05', ... }], ... },
      borderRadius: { 'apple-md': '12px', ... },
      transitionTimingFunction: { 'apple': 'cubic-bezier(0.42, 0, 0.58, 1)' },
    },
  },
};
```

### 3.11 `assets/fonts.css`

- SF Pro 不可商用直发；提供两种路径：
  1. 优先用 `-apple-system` 系统字体栈（macOS/iOS 自带 SF）。
  2. 非 Apple 平台 fallback：引入 [Inter](https://rsms.me/inter/) 作为近似替代，**但仅作为 fallback**，不作为主推。
- `fonts.css` 只做 fallback 的 `@font-face` 声明。

### 3.12 `templates/` —— 7 个模板

每个模板都是完整可渲染的单文件 HTML（`<link>` 相对路径引用 `../assets/apple.css`），填充 `Lorem Apple` 风示意内容：

| 文件 | 内容 |
|---|---|
| `landing-page.html` | Hero + 4 段交替（白/灰/白/黑）+ 产品 lineup grid + 页脚 |
| `article.html` | Newsroom 单篇：大标题 + 日期 + category tag + 680px 单栏正文 + pull quote |
| `docs.html` | 三栏：sidebar + 文章（含代码块）+ TOC |
| `slide-deck.html` | 10 页内联 scroll-snap 演示：封面 / 目录 / 主题 / 统计 / 对比 / 结论（可用于公众号图文） |
| `stat-callout.html` | 全屏巨字号统计段（"75%" 那种） |
| `diagrams/flow.svg` | 左→右流程，4 节点 + 1 gate 决策，节点为 12px 圆角白底 + 1px 灰边；箭头深灰；标签用 SF Mono 12px |
| `diagrams/architecture.svg` | 分层架构（3 层盒叠），浅灰底带细分隔线；组件盒 `--radius-sm` 白底 |
| `diagrams/hierarchy.svg` | View 树式缩进层级，细竖线连接 |
| `diagrams/timeline.svg` | 环保页 tab 风生命周期 6 节点水平分布 |

### 3.13 `prompts/example-prompts.md`

给使用者照抄的 prompt 示例：

```
用 apple-design 风格做一个"个人简介"落地页，包含 hero、项目 lineup、巨字号统计、联系方式页脚。
```
```
把这份技术文档的 HTML 换成 apple-design 的三栏文档版式，代码块用 apple 代码块样式。
```
```
用 apple-design 的 flow.svg 模板画一个 4 步流程图：X → Y → （判断）→ Z / W。
```

---

## 4. Anthropic Design Skill 详细规范

结构与 apple-design 完全对称，以下只列差异点。

### 4.1 SKILL.md frontmatter

```yaml
---
name: anthropic-design
description: >
  Render HTML/CSS in anthropic.com visual aesthetic — warm cream background
  (#faf9f5), Poppins headings + Lora serif body, orange accent (#d97757)
  for CTAs and emphasis, rounded filled pill buttons, editorial card grids,
  abstract SVG illustration, low-saturation data visualization (soft blue/
  gray/teal), hand-drawn SVG architecture diagrams with orange/blue/green
  node categorization and diamond decision gates. TRIGGER when the user
  says "anthropic 风格", "anthropic style", "claude 官网风格", "Anthropic 品牌",
  or asks for an editorial/long-form page, research article layout, or a
  filled-button-with-warmth feel.
---
```

### 4.2 设计 token 差异

**颜色**

| Token | Hex | 用途 |
|---|---|---|
| `--anth-bg` | `#faf9f5` | 主暖背景（唯一主底） |
| `--anth-bg-subtle` | `#f0ede3` | 次级段落底 |
| `--anth-text` | `#141413` | 主文字 |
| `--anth-text-secondary` | `#6b6a5f` | 次级文字 |
| `--anth-orange` | `#d97757` | 主强调色 / CTA / 链接 hover |
| `--anth-blue` | `#6a9bcc` | 次强调 / 分类 / 数据图 |
| `--anth-green` | `#788c5d` | 第三强调 / 分类 |
| `--anth-mid-gray` | `#b0aea5` | 辅色 |
| `--anth-light-gray` | `#e8e6dc` | 分隔 / 卡片底 |

**字体**

```css
--font-heading: "Poppins", "Helvetica Neue", Arial, sans-serif;
--font-body:    "Lora",    Georgia, "Times New Roman", serif;
--font-mono:    "JetBrains Mono", ui-monospace, Menlo, monospace;
```

**核心差异：正文 serif。**

**字号**

| 角色 | size / line-height / weight |
|---|---|
| Hero headline | 56px / 1.1 / 600 (Poppins) |
| Section headline | 40px / 1.15 / 600 |
| Subhead | 24px / 1.3 / 500 |
| Body | 18px / 1.65 / 400 (Lora) |
| Caption | 13px / 1.4 / 400 |

**圆角**：`--radius-md: 16px`；按钮 `--radius-pill: 9999px`（真正的胶囊）。

**按钮**：与 Apple 相反，Anthropic **用实心胶囊按钮**：
```css
.anth-button {
  background: var(--anth-orange);
  color: #faf9f5;
  padding: 12px 24px;
  border-radius: 9999px;
  font-family: var(--font-heading);
  font-weight: 500;
}
.anth-button--secondary { background: var(--anth-text); }
```

### 4.3 `references/layout-patterns.md` 差异

1. **Editorial card grid**（博客 / news listing）：3 列 / 2 列自适应，卡片为 SVG 插画 + 标题 + 日期 + category tag。
2. **Long-form article**：单栏 680–720px，Lora serif 正文，1.65 行高，大段落间距。
3. **Research paper layout**：顶部 hero + 抽象 SVG 插画 + 多个 heading 分节 + 低饱和图表（内联）+ 底部 footnotes。
4. **Product overview**：hero 橙色 CTA + 3 个能力卡 + 客户引用轮播 + 定价卡片。
5. **Pricing cards**：三列卡，推荐款用 `--anth-orange` 细边高亮（不是整张填色）。

### 4.4 `references/imagery.md` 差异

- **核心：SVG 抽象插画**，不用产品摄影。
- 插画风格：几何图形（圆 / 圆角矩形 / 柔和曲线），配色严格从 `--anth-orange` `--anth-blue` `--anth-green` `--anth-mid-gray` 中取。
- 插画画幅多为 500×500 或 1200×1200。
- 禁止：真人摄影（除客户引用带 logo 外）；禁止彩虹渐变。

### 4.5 `references/data-display.md` 差异

- 图表色板**严格低饱和**：
  - 主：`#6a9bcc`（柔蓝）
  - 辅：`#788c5d`（橄榄绿）
  - 点缀：`#d97757`（仅重点数据系列）
  - 网格：`#e8e6dc`
- 不使用高饱和三原色、彩虹调色板。
- 图表字体：Poppins 12px labels，Poppins 14px 轴标题。
- 柱状图柱体圆角 4px；折线图端点小圆点。
- 地图：`#e8e6dc` 底，按数值梯度从 `#f0ede3` → `#6a9bcc` 着色，不可用数据区用 `#b0aea5`。

### 4.6 `templates/` 差异

| 文件 | 内容 |
|---|---|
| `landing-page.html` | 橙 CTA hero + 3 能力卡 + 客户引用 + pricing teaser |
| `article.html` | Claude/news 风格：大标题 + 日期 + 作者 + Lora serif 680px 单栏 + 内联低饱和图表 + pull quote + 客户 logo 带 |
| `docs.html` | 左 sidebar + 中正文 + 右 TOC（整体 warm cream） |
| `slide-deck.html` | 10 页 scroll-snap 演示，橙色强调 |
| `pricing.html` | 三列 plan 卡 + 比较表（复选对勾） |
| `data-report.html` | 长报告，嵌入多个低饱和图表示例（bar / line / scatter / map） |
| `diagrams/flow.svg` | 4 节点 + gate，节点填充 `--anth-orange` / `--anth-blue` / `--anth-green`（按类别），gate 为 `--anth-orange` 菱形 |
| `diagrams/architecture.svg` | 三层，每层用不同强调色分类；连线 `--anth-text` 1.5px |
| `diagrams/hierarchy.svg` | orchestrator-subagent 风（参考 Anthropic 工程博客），中央节点 + 放射状 subagents |
| `diagrams/timeline.svg` | 水平里程碑，圆点 `--anth-orange`，连线 `--anth-light-gray` |

---

## 5. 触发规则

两个 skill 都是**显式触发**，不做自动抢占：

- **Apple**：出现以下任一时触发
  - 字面：`apple 风格` / `apple style` / `apple.com 风格` / `苹果风`
  - 意图：用户说"像苹果官网那样" / "SF Pro 字体" / "极简产品叙事"
- **Anthropic**：出现以下任一时触发
  - 字面：`anthropic 风格` / `anthropic style` / `claude 官网风格` / `Anthropic 品牌`
  - 意图：用户说"像 Claude 网站那样" / "暖米白 + 橙色" / "编辑式长文"
- **都不触发**：泛泛的"做个好看的页面"应使用 `frontend-design` skill。

---

## 6. 实现阶段（给 writing-plans 用）

建议拆成以下顺序：

1. **骨架阶段**：两个 skill 的目录结构 + 空的 SKILL.md（只有 frontmatter）+ `references/design-tokens.md`（完整 token 表）+ `assets/*.css`。
2. **模板阶段**：Apple 5 个 HTML + 4 个 SVG；Anthropic 6 个 HTML + 4 个 SVG。
3. **参考文档阶段**：剩余 6 个 `references/*.md` 填充。
4. **Tailwind preset 阶段**：`*.tailwind.js`。
5. **Prompt 阶段**：`example-prompts.md`。
6. **自检阶段**：用两个模板手工渲染，与官网截图对照校色。
7. **README 阶段**：更新根 README 中英文，列入两个新 skill。

---

## 7. 风险与权衡

- **字体合规**：SF Pro 不可公网直链下发；方案是只声明系统栈 + Inter fallback。Poppins 和 Lora 走 Google Fonts 即可。
- **视觉保真度**：SVG 插画的"手工 Anthropic 感"难以完全复现；我们交付的是骨架 + 色板 + 构图规则，具体插画仍需使用者在 Claude 中再生。
- **维护**：两家官网会改版；skill 的 token 以"2026-04 观察"为基准，未来需要重扒。在 SKILL.md 末尾标注 `last-verified: 2026-04-19`。
- **冲突**：若用户已有 Tailwind 项目，preset 可能与现有 theme 冲突；在 `example-prompts.md` 里提醒 merge 方式。

---

## 8. 成功标准

- ✅ 给 Claude 一个空白 prompt "用 apple-design 做一个 profile 页"，生成的 HTML 在无任何其他指导下视觉接近 apple.com 产品页。
- ✅ 同样 prompt 替换为 `anthropic-design` → 视觉接近 anthropic.com 研究文章页。
- ✅ 两个 skill 完全独立，互不 import。
- ✅ 纯静态 HTML 打开即可预览（无需 build 步骤）。
- ✅ 根 README 和中文 README 更新。

---

## 9. 开放问题（待确认后再写 plan）

目前无。结构已由用户在 brainstorming 中确认。
