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
│   │   ├── components.md          # 全部 HTML 组件（nav/footer/form/table/tabs/carousel/...）
│   │   ├── motion.md
│   │   ├── imagery.md
│   │   ├── data-display.md
│   │   ├── responsive.md          # 断点 + 容器 max-width + grid
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
│   │   ├── nav-footer.html        # 独立 nav + footer 示范
│   │   ├── form.html              # 表单组件总览
│   │   ├── product-configurator.html  # 颜色/容量选择器 + sticky 购买栏
│   │   ├── specs-page.html        # 技术规格/对比页
│   │   └── diagrams/
│   │       ├── flow.svg
│   │       ├── architecture.svg
│   │       ├── hierarchy.svg
│   │       └── timeline.svg
│   └── prompts/
│       └── example-prompts.md
└── anthropic-design/
    └── （与 apple-design 同构，模板换为 product-overview / pricing / data-report / enterprise）
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
/* .apple-button 仅供 Buy/Add to Bag/付费 CTA 用，见 §10.3；其它一律 .apple-link */
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
2. **模板阶段**：Apple 9 个 HTML + 4 个 SVG；Anthropic 9 个 HTML + 4 个 SVG（详见第 2 节结构 + 第 10 节组件清单）。
3. **参考文档阶段**：剩余 `references/*.md` 填充（含新增 `components.md` 与 `responsive.md`，共 9 份）。
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

目前无。结构已由用户在 brainstorming 中确认；2026-04-19 经第二轮审核补齐所有 HTML 元素与组件。

---

## 10. HTML 元素全量清单（审核补齐）

第一版 spec 只覆盖 token + 高层布局，未定义常用 HTML 组件。本节按元素逐一给出两种风格的实现规范；`references/components.md` 将复制本节内容并附骨架代码。

### 10.1 导航栏 Nav

| | Apple | Anthropic |
|---|---|---|
| 高度 | 44px（紧凑） | 64px |
| 背景 | `rgba(251,251,253,0.72)` + `backdrop-filter: blur(20px)` 固定 | `--anth-bg` 透明 + scroll 后加细下边框 |
| 链接 | 12px SF Pro Text，间距 32px，hover 颜色加深 | 14px Poppins 500，间距 24px |
| 右侧 | 搜索图标 🔍 + 购物袋 🛍（含数字角标） | `Try Claude` 橙色胶囊 CTA + `Log in` 文字链 |
| 下拉 | 悬停触发 mega-menu（全宽白底 + 48px padding + 分栏），动画 `--duration-sm` fade+translateY | 点击下拉（不 hover）、白卡阴影 `0 10px 40px rgba(0,0,0,0.08)`、圆角 `--radius-md` |
| 移动 | 汉堡 + 全屏 overlay 菜单 | 汉堡 + 下滑抽屉 |

### 10.2 页脚 Footer

| | Apple | Anthropic |
|---|---|---|
| 列数 | ~10 组分类（Shop/Learn/Values…），每组 9-12 链接 | 6-7 组（Products/Models/Solutions/Platform/Resources/Company） |
| 背景 | `#F5F5F7`，上方 `--apple-divider` 细线起始 | `--anth-bg-subtle` |
| 字号 | 12px 链接，11px 法律条款 | 13px 链接，12px 法律 |
| 组标题 | 加粗 12px，深灰 | 加粗 13px Poppins |
| 底部条 | 版权 + 法律链接 + **国家/地区选择器**（下拉） | 版权 + 法律链接 + **社媒图标行**（LinkedIn/X/YouTube） |
| Newsletter | 无 | 无（订阅分散到文章） |

### 10.3 按钮 Buttons（完整集）

Apple：
```css
.apple-link { color:var(--apple-link); text-decoration:underline; text-underline-offset:0.2em; }
.apple-link::after { content:" ›"; }                       /* 箭头接续符 */
.apple-button { padding:8px 16px; border-radius:9999px; background:var(--apple-link); color:#fff; font-size:14px; font-weight:400; }    /* 仅 Buy/CTA 用 */
.apple-button--secondary { background:transparent; color:var(--apple-link); border:1px solid var(--apple-link); }
```

Anthropic：
```css
.anth-button { padding:12px 24px; border-radius:9999px; background:var(--anth-orange); color:#faf9f5; font-family:var(--font-heading); font-weight:500; font-size:15px; }
.anth-button--dark { background:var(--anth-text); color:#faf9f5; }
.anth-button--ghost { background:transparent; color:var(--anth-text); border:1px solid var(--anth-text); }
```

### 10.4 表单 Forms（inputs / select / textarea / radio / checkbox / toggle）

统一规则：边框 1px 灰、圆角、focus 显示 2px 品牌色 outline、28px 最小触控高度。

Apple：
```css
.apple-input,.apple-select,.apple-textarea {
  background:var(--apple-bg-alt); border:1px solid var(--apple-divider);
  border-radius:var(--radius-sm); padding:10px 12px;
  font-family:var(--font-text); font-size:14px;
}
.apple-input:focus { outline:2px solid var(--apple-link); outline-offset:0; }
.apple-radio,.apple-checkbox { accent-color:var(--apple-link); }
.apple-toggle { /* SF 风开关：34px 宽 round pill，开启 #34C759 绿 */ }
```

Anthropic：
```css
.anth-input,.anth-select,.anth-textarea {
  background:#fff; border:1px solid var(--anth-light-gray);
  border-radius:var(--radius-md); padding:12px 16px;
  font-family:var(--font-body); font-size:15px;
}
.anth-input:focus { outline:2px solid var(--anth-orange); }
.anth-radio,.anth-checkbox { accent-color:var(--anth-orange); }
```

### 10.5 选项卡组件 Option Cards（颜色/容量选择器，commerce）

Apple `product-configurator.html` 用：
- **色选 swatch**：28px 圆形，默认 `border:1px solid var(--apple-divider)`；选中 `border:2px solid var(--apple-text); padding:2px` 内圈描边。
- **容量 card**：白底、1px 灰边、16px padding；选中 `border:2px solid var(--apple-text)`；顶部粗字号容量、下行灰色价格。
- **carrier 分段控件**：等宽按钮组，整组 1px 灰边 pill，选中项 `background:var(--apple-text); color:#fff`。
- **Sticky buy 栏**：底部固定条，左 summary 右 `Add to Bag` 按钮，背景 `rgba(255,255,255,0.9) + backdrop-blur`。

Anthropic 不需要此模板（品牌无实体商品），但 `pricing.html` 的 plan 卡复用 Card 规则。

### 10.6 表格 Tables

**Apple（specs 页）：不用真表格**，用并排段落 + 分类 H3。若必须表格：无边框、行间距 16px、行间细灰横线 `border-bottom:1px solid var(--apple-divider)`。

Anthropic：带表格样式
```css
.anth-table { width:100%; border-collapse:collapse; font-family:var(--font-body); font-size:15px; }
.anth-table th { text-align:left; padding:12px 16px; background:var(--anth-bg-subtle); font-family:var(--font-heading); font-weight:500; }
.anth-table td { padding:12px 16px; border-bottom:1px solid var(--anth-light-gray); }
.anth-table tr:hover td { background:var(--anth-bg-subtle); }
.anth-table .check { color:var(--anth-green); }  /* 对勾 */
.anth-table .cross { color:var(--anth-mid-gray); }
```

### 10.7 标签页 Tabs

两种风格都用顶部下划线式（无外框）：
- Apple：文字链 + 选中项下方 2px 蓝色线 `var(--apple-link)`。
- Anthropic：Poppins 14px + 选中项下方 2px 橙线 `var(--anth-orange)`；切换 fade 240ms。

### 10.8 轮播 Carousel / Slider

Apple（accessibility hero、events replay）：
- 手势友好，左右箭头浮层显示在 hover 时；底部圆点 indicator（4px 直径，选中 `--apple-text`）。
- 自动播放 5s 一切，可暂停。

Anthropic（客户引用轮播，opus 4.5 发布页）：
- 显示 `01 / 21` 形式计数；左右箭头始终可见，`--radius-pill` 白底 + 1px 灰边。
- 卡片切换 400ms `--ease-apple-out`。

### 10.9 视频容器 Video

| | Apple | Anthropic |
|---|---|---|
| Hero 自动播放 | 静音循环，`autoplay muted loop playsinline`，首次 600ms fade-in | 同 |
| Replay 块 | 封面图 + 中央圆形播放按钮 56px，hover 放大 1.08 | 缩略图 + 左下角三角播放 icon |
| ASL 选项 | 显示 `ASL` badge 右下角（Apple events 页必备） | — |
| 控件 | 使用原生 `<video controls>` 但主题覆盖（进度条色、按钮色） | 同 |
| 圆角 | `--radius-md` | `--radius-md` |

### 10.10 徽章 / 标签 / 分类 Chip

Apple（newsroom category）：
```css
.apple-badge { font-size:11px; font-weight:500; text-transform:uppercase; letter-spacing:0.08em; color:var(--apple-text-secondary); }
```
纯文字无边框，小字大间距。

Anthropic（blog category）：
```css
.anth-badge { font-size:12px; font-family:var(--font-heading); padding:4px 10px; border-radius:9999px; background:var(--anth-light-gray); color:var(--anth-text); }
```
胶囊填色小标签。

### 10.11 引用块 Blockquote / Pull Quote

Apple：
```css
.apple-quote { font-family:var(--font-display); font-size:32px; font-weight:500; line-height:1.3; letter-spacing:-0.005em; max-width:720px; margin:48px auto; text-align:center; }
.apple-quote + .apple-quote-cite { display:block; font-size:14px; color:var(--apple-text-secondary); text-align:center; margin-top:16px; }
/* 无引号字符、无左边框，只靠字号和居中 */
```

Anthropic：
```css
.anth-quote { font-family:var(--font-body); font-style:italic; font-size:22px; line-height:1.55; padding-left:24px; border-left:3px solid var(--anth-orange); max-width:680px; }
.anth-quote-cite { display:flex; align-items:center; gap:12px; margin-top:16px; font-size:14px; }
.anth-quote-cite img { height:20px; width:auto; }  /* 客户公司 logo */
```

### 10.12 列表 Lists

- **Ordered**：Apple 用小字数字前缀 + 18px padding；Anthropic 用 Poppins 粗体大数字 + 段落。
- **Unordered**：Apple 实心小圆 4px；Anthropic 橙色 6px 点。
- **Description list**（规格页关键）：Apple 用 H3 + 段落平铺，不真正用 `<dl>`；Anthropic 用 `<dl>` 带 `--font-heading` term + `--font-body` description。
- **Feature list with icon**（privacy/accessibility 页）：24px icon 左对齐 + 16px gap + 标题 + 描述。

### 10.13 横幅 / 促销条 Banner

Apple 首页顶部常见 trade-in 促销条：
- 高 44px，居中文字 12px，背景 `var(--apple-bg-alt)`，下方 1px 分隔线。
- 右侧可选 "Shop" 链接。

Anthropic 用"Latest news 轮播条"：
- 宽度 960px，居中，白底，圆角 `--radius-md`，左侧品类 tag + 中间标题 + 右侧日期。

### 10.14 面包屑 Breadcrumbs

两者都只在 Dev docs / deep pages 用：
- 12px 小字 secondary 色，分隔符 `›`，最后一节不可点击。

### 10.15 分页 Pagination

**两家都不使用数字分页**。统一做法：
- Apple: 末尾大字 "View All" 链接 + 箭头。
- Anthropic: 加载更多按钮（胶囊）+ 可选无限滚。

### 10.16 搜索 Search

Apple：图标点击 → 全屏覆盖搜索（顶部大输入框 + 建议列表 + Esc 关闭）。
Anthropic：docs 站内有顶部搜索框；官网无显式搜索。

### 10.17 购物车 / 计数器（Apple 专属）

`🛍` 图标右上角显示数字角标 `0+`；点击进入 bag 页。skill 需提供 `.apple-bag-icon` 组件样式。

### 10.18 区域选择器（Apple 专属）

Footer 底部 "United States" 文字链 + 小三角 → 弹出区域列表（模态）。skill 提供 `.apple-region-select`。

### 10.19 主题切换（Apple Dev Portal）

`Light / Dark / Auto` 三态分段控件；主 apple.com 不提供，但 `docs.html` 模板应内置。

### 10.20 代码块 Code Block

| | Apple | Anthropic |
|---|---|---|
| 字体 | SF Mono 13px | JetBrains Mono 14px |
| 背景 | `#F5F5F5` | `var(--anth-bg-subtle)` |
| 圆角 | `--radius-md` | `--radius-md` |
| Padding | 20px | 24px |
| 复制按钮 | 右上角，hover 显示，无边框图标 | 同 |
| 语法高亮 | VSCode Light+ 近似，关键字蓝、字符串红橙、注释灰 | 关键字橙 `--anth-orange`、字符串绿 `--anth-green`、注释灰 |
| 行号 | docs 下可选，灰色 12px | 同 |

### 10.21 内联元素 Inline

- `<code>`：浅灰 bg 圆角 2px，前后各 2px 水平 padding，字号比正文小 1px。
- `<kbd>`：Apple 风小圆角按钮样 `background:#fff;border:1px solid var(--apple-divider);padding:2px 6px;border-radius:4px;font-family:mono;font-size:12px;`；Anthropic 同结构但用橙 accent。
- `<mark>`：Apple 用 `background:rgba(0,113,227,0.15)`；Anthropic 用 `background:rgba(217,119,87,0.2)`.
- `<abbr>`：虚线下划线。
- 外部链接图标：Apple 链接后附 `›`；Anthropic 附 `→`。

### 10.22 图像 Figure / Caption

```html
<figure class="apple-figure">
  <img src="..." alt="..." class="apple-figure-img" />
  <figcaption class="apple-caption">Description</figcaption>
</figure>
```
- Apple caption：12px `--apple-text-secondary` 居中，上方 12px gap。
- Anthropic caption：13px Lora italic 居中。

### 10.23 分隔线 Divider

- Apple：`<hr>` 渲染为 1px `--apple-divider`，上下 48px 间距。
- Anthropic：`<hr>` 为装饰花纹（3 个小圆点居中）或简单 1px，上下 64px。

### 10.24 详情折叠 Details / Summary

- Apple FAQ 风：左边 `+/−` 图标，点击展开 fade+slide，240ms。
- Anthropic docs 风：右边 `▸` 箭头旋转 90°，背景用 `--anth-bg-subtle`。

### 10.25 Admonition / Callout（docs 必备）

四类：info / warning / success / danger。
- Apple：左侧 4px 彩色边 + `--apple-bg-alt` 底。info 蓝、warning 橙、success 绿、danger 红，全部取 Apple 系统色。
- Anthropic：整块 `--anth-bg-subtle` 背景 + 12px 圆角，标题用对应品牌色（info 蓝、warning 橙、success 绿、danger 深红 `#a14238`）。

### 10.26 客户墙 / Logo Wall

Anthropic 企业页专属：6–8 个客户 logo 并排，灰度处理（`filter:grayscale(1) opacity(0.6)`），hover 还原色彩。
Apple 不使用此 pattern。

### 10.27 空状态 / 404

- Apple：居中 SF 图标 + 大标题 + 2 行描述 + 返回链接。
- Anthropic：SVG 插画 + 标题 + 返回主页橙色 CTA。

### 10.28 巨字号统计 Stat Callout（Apple 特色）

Apple：
```css
.apple-stat-number { font-family:var(--font-display); font-size:120px; font-weight:600; letter-spacing:-0.02em; line-height:1; }
.apple-stat-label { font-size:17px; color:var(--apple-text-secondary); margin-top:16px; max-width:240px; }
```
常并排 3 个在一行。

Anthropic 极少使用；若用则字号减半到 64px，Poppins 粗体。

### 10.29 数据可视化详细规范 Data Viz

Anthropic 专项（Economic Index 风）：
```css
--chart-primary: #6a9bcc;
--chart-secondary: #788c5d;
--chart-tertiary: #d97757;  /* 仅重点系列 */
--chart-grid: #e8e6dc;
--chart-axis: #b0aea5;
```
- 柱图：柱宽占格 60%，圆角 4px，间距 20%。
- 折线图：2px 粗线，端点 5px 圆点，区域填充 `rgba(106,155,204,0.1)` 仅当强调。
- 散点图：8px 圆点，log 轴。
- 地图：底色 `#e8e6dc`，数值梯度 5 级从 `#f0ede3` → `#6a9bcc`，不可用区域 `#b0aea5`。
- 轴线：0.5px `--chart-axis`；网格 0.5px `--chart-grid` dashed。
- 字体：Poppins 12px 标签、13px 轴标题、14px 图例。
- 图例：顶部水平排列，color swatch 12×12px 圆角 2px。

Apple：不建议用，除非复刻 environment 页。若用则单色 `--apple-link` 柱、无网格、刻度极简。

### 10.30 响应式断点 Responsive

Apple 断点（实测）：
```
mobile:      ≤734px
tablet:      735–1068px
desktop:     1069–1440px
large:       ≥1441px
```
容器 max-width 按断点：980 / 1068 / 1280。

Anthropic 断点：
```
mobile:      ≤768px
tablet:      769–1024px
desktop:     ≥1025px
```
容器 max-width：720（长文）/ 960（常规）/ 1200（wide）。

`references/responsive.md` 用 CSS container queries 与 media queries 双版本示例。

### 10.31 可访问性 A11y 最低要求

两个 skill 都必须包含：
- Skip-to-content 链接（`.sr-only` 除 focus 外隐藏）
- 色彩对比度 ≥ AA（WCAG 2.2）
- 所有 interactive 元素 focus-visible outline 2px
- 语义 HTML（`<nav>` `<main>` `<article>` `<aside>` `<footer>`）
- `prefers-reduced-motion` 时禁用入场动画

### 10.32 字体来源与合规

| 字体 | 来源 | 合规 |
|---|---|---|
| SF Pro Display / Text / Mono | Apple 官方仅限 Apple 平台；网页通过 `-apple-system` 系统栈 | **不做 @font-face** |
| Fallback for Apple skin | Inter（OFL） | 通过 Google Fonts |
| Poppins | Google Fonts (OFL) | 直接 @font-face |
| Lora | Google Fonts (OFL) | 直接 @font-face |
| JetBrains Mono | OFL | 通过 Google Fonts |

`fonts.css` 声明 `@font-face` + `font-display: swap`。

### 10.33 变更点汇总（写给自己的 checklist）

相对第一版 spec 新增：
- [x] 导航栏 / 页脚 / 促销条 / 面包屑
- [x] 所有表单控件（input / select / textarea / radio / checkbox / toggle / 色板 / 容量卡 / 分段控件 / sticky buy bar）
- [x] 表格 / 定义列表 / 列表完整规则
- [x] tabs / carousel / video / details-summary / admonition / empty-state / logo wall / region selector / theme toggle / cart
- [x] 徽章 / 引用 / 内联（code/kbd/mark/abbr） / 图像 caption / 分隔线
- [x] 响应式断点 / 容器 max-width 体系
- [x] A11y 最低清单
- [x] 字体合规分来源表
- [x] 完整 Anthropic 数据可视化色板
- [x] 新增模板：nav-footer / form / product-configurator / specs-page

此 checklist 用于实现阶段逐项核对。
