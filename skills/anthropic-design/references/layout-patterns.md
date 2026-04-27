# Anthropic Layout Patterns

六种可直接复用的版式骨架。所有示例假定已引入 `assets/anthropic.css` 与 `assets/fonts.css`。

## 1. Editorial card grid（博客 / News listing）

3 列卡片网格，编辑式风格 —— 每卡内：分类 badge → 标题 (h3 Poppins) → 摘要 (Lora) → 元信息（日期 + 作者）。中等屏幕降为 2 列，移动端单列。

```html
<section class="anth-section">
  <div class="anth-container--wide">
    <h2>Latest from Anthropic</h2>
    <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:var(--space-6); margin-top:var(--space-7);">
      <article class="anth-card">
        <span class="anth-badge">Research</span>
        <h3 style="margin-top:var(--space-3);">Constitutional AI</h3>
        <p>A method for training a helpful, harmless, and honest assistant using AI feedback.</p>
        <p class="anth-caption">April 14, 2026 · Research Team</p>
      </article>
      <article class="anth-card">
        <span class="anth-badge">Engineering</span>
        <h3 style="margin-top:var(--space-3);">Building Claude on TPUs</h3>
        <p>How we scaled training across heterogeneous accelerators.</p>
        <p class="anth-caption">April 09, 2026 · Infrastructure</p>
      </article>
      <article class="anth-card">
        <span class="anth-badge">Policy</span>
        <h3 style="margin-top:var(--space-3);">Responsible scaling</h3>
        <p>How we evaluate and deploy increasingly capable models safely.</p>
        <p class="anth-caption">April 02, 2026 · Policy Team</p>
      </article>
    </div>
  </div>
</section>
```

## 2. Long-form article（720px 单栏 Lora）

研究博客 / 长文。整篇用 `.anth-container--narrow` 锁住 720px，Lora 衬线呈现编辑感；标题分级用 Poppins。

```html
<article>
  <header class="anth-section">
    <div class="anth-container--narrow">
      <span class="anth-badge">Research</span>
      <h1 style="margin-top:var(--space-4);">Scaling Monosemanticity</h1>
      <p class="anth-caption">By the Interpretability Team · April 14, 2026 · 18 min read</p>
    </div>
  </header>
  <div class="anth-container--narrow">
    <p>Sparse autoencoders extract interpretable features from production-scale models...</p>
    <h2>Method</h2>
    <p>We trained sparse autoencoders on the residual stream activations...</p>
    <blockquote class="anth-quote">
      Monosemanticity gives us a microscope into what the model represents.
    </blockquote>
    <h2>Results</h2>
    <p>The features we extract correspond to recognizable concepts...</p>
  </div>
</article>
```

## 3. Research paper（hero + SVG 插画 + 多 heading 分节 + 内联图表）

包含：抽象 SVG hero illustration、多级标题分节、内联数据图。

```html
<section class="anth-hero">
  <div class="anth-container--narrow">
    <span class="anth-badge">Paper</span>
    <h1 style="margin-top:var(--space-4);">Discovering Language Model Behaviors with Model-Written Evaluations</h1>
    <p class="anth-caption">December 2025 · 47 pages</p>
    <p style="margin-top:var(--space-5);">
      <a class="anth-button">Read PDF</a>
      <a class="anth-link" style="margin-left:var(--space-4);">View on arXiv</a>
    </p>
  </div>
</section>

<figure>
  <svg viewBox="0 0 1200 1200" width="100%" role="img" aria-label="Abstract illustration">
    <circle cx="600" cy="600" r="320" fill="#d97757" opacity="0.85"/>
    <circle cx="820" cy="500" r="180" fill="#6a9bcc" opacity="0.85"/>
    <rect x="380" y="700" width="260" height="260" rx="40" fill="#788c5d" opacity="0.85"/>
  </svg>
  <figcaption class="anth-caption" style="text-align:center;">Figure 1. Distribution of evaluated behaviors.</figcaption>
</figure>

<div class="anth-container--narrow">
  <h2>1. Introduction</h2>
  <p>Large language models exhibit a wide range of behaviors...</p>
  <h2>2. Method</h2>
  <p>We generate evaluations by prompting a strong language model...</p>
  <figure>
    <svg viewBox="0 0 600 360" role="img" aria-label="Bar chart of evaluation results">
      <rect x="40" y="120" width="60" height="200" rx="4" fill="#6a9bcc"/>
      <rect x="160" y="60" width="60" height="260" rx="4" fill="#6a9bcc"/>
      <rect x="280" y="160" width="60" height="160" rx="4" fill="#6a9bcc"/>
      <rect x="400" y="100" width="60" height="220" rx="4" fill="#d97757"/>
    </svg>
    <figcaption class="anth-caption" style="text-align:center;">Figure 2. Sycophancy across model sizes.</figcaption>
  </figure>
  <h2>3. Results</h2>
  <p>...</p>
</div>
```

## 4. Product overview（claude.com 风）

Hero（标题 + 副标 + 橙色 CTA）→ 3 张能力卡 → 客户引用轮播。

```html
<section class="anth-hero">
  <div class="anth-container">
    <h1>Claude. AI for everyone.</h1>
    <p style="font-size:21px; max-width:640px; margin:var(--space-5) auto;">
      A trustworthy AI assistant that's helpful, harmless, and honest.
    </p>
    <p>
      <a class="anth-button">Try Claude</a>
      <a class="anth-link" style="margin-left:var(--space-4);">Talk to sales</a>
    </p>
  </div>
</section>

<section class="anth-section anth-section--subtle">
  <div class="anth-container--wide">
    <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:var(--space-6);">
      <div class="anth-card">
        <h3>Reasoning</h3>
        <p>Multi-step problem solving across domains.</p>
        <a class="anth-link">Learn more</a>
      </div>
      <div class="anth-card">
        <h3>Coding</h3>
        <p>Production-grade software engineering.</p>
        <a class="anth-link">Learn more</a>
      </div>
      <div class="anth-card">
        <h3>Writing</h3>
        <p>Long-context drafting and editing.</p>
        <a class="anth-link">Learn more</a>
      </div>
    </div>
  </div>
</section>

<section class="anth-section">
  <div class="anth-container">
    <div class="anth-carousel">
      <div class="anth-carousel-viewport">
        <blockquote class="anth-quote">
          Claude consistently produces the best responses in our internal evaluations.
          <cite class="anth-quote-cite">
            <img src="logos/notion.svg" alt="Notion" />
            <span>Simon Last · Co-founder, Notion</span>
          </cite>
        </blockquote>
      </div>
      <p class="anth-carousel-counter" style="text-align:right;">01 / 21</p>
    </div>
  </div>
</section>
```

## 5. Pricing cards（三列 plan 卡，推荐款橙细边高亮）

```html
<section class="anth-section">
  <div class="anth-container--wide">
    <h2 style="text-align:center;">Choose a plan</h2>
    <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:var(--space-6); margin-top:var(--space-7);">

      <div class="anth-card">
        <h3>Free</h3>
        <p class="anth-caption">For individuals exploring Claude.</p>
        <p style="font-family:var(--font-heading); font-size:36px; margin:var(--space-4) 0;">$0</p>
        <a class="anth-button anth-button--ghost">Try Claude</a>
      </div>

      <div class="anth-card" style="border:2px solid var(--anth-orange);">
        <span class="anth-badge">Most popular</span>
        <h3 style="margin-top:var(--space-3);">Pro</h3>
        <p class="anth-caption">For everyday productivity.</p>
        <p style="font-family:var(--font-heading); font-size:36px; margin:var(--space-4) 0;">$20<span style="font-size:14px;">/mo</span></p>
        <a class="anth-button">Get Pro</a>
      </div>

      <div class="anth-card">
        <h3>Team</h3>
        <p class="anth-caption">For teams that build with Claude.</p>
        <p style="font-family:var(--font-heading); font-size:36px; margin:var(--space-4) 0;">$30<span style="font-size:14px;">/mo</span></p>
        <a class="anth-button anth-button--ghost">Get Team</a>
      </div>

    </div>
  </div>
</section>
```

## 6. Enterprise（logo 墙 + 价值 props + 联系表单）

```html
<section class="anth-hero">
  <div class="anth-container">
    <h1>Claude for Enterprise</h1>
    <p style="font-size:21px; max-width:640px; margin:var(--space-5) auto;">
      Deploy frontier AI with the security, governance, and support your organization needs.
    </p>
    <p><a class="anth-button">Talk to sales</a></p>
  </div>
</section>

<section class="anth-section anth-section--subtle">
  <div class="anth-container--wide">
    <p class="anth-caption" style="text-align:center;">Trusted by leading organizations</p>
    <div class="anth-logo-wall" style="margin-top:var(--space-5);">
      <img src="logos/lyft.svg" alt="Lyft" />
      <img src="logos/notion.svg" alt="Notion" />
      <img src="logos/zoom.svg" alt="Zoom" />
      <img src="logos/asana.svg" alt="Asana" />
      <img src="logos/quora.svg" alt="Quora" />
      <img src="logos/dna.svg" alt="DNA" />
    </div>
  </div>
</section>

<section class="anth-section">
  <div class="anth-container--wide">
    <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:var(--space-6);">
      <div>
        <h3>Enterprise security</h3>
        <p>SSO, SCIM, audit logs, and SOC 2 Type II compliance.</p>
      </div>
      <div>
        <h3>Expanded context</h3>
        <p>500K-token context window for entire codebases or document libraries.</p>
      </div>
      <div>
        <h3>Dedicated support</h3>
        <p>White-glove onboarding and a named success engineer.</p>
      </div>
    </div>
  </div>
</section>

<section class="anth-section anth-section--subtle">
  <div class="anth-container--narrow">
    <h2>Contact our sales team</h2>
    <form style="display:grid; gap:var(--space-4); margin-top:var(--space-5);">
      <label>
        <span class="anth-label">Work email</span>
        <input class="anth-input" type="email" placeholder="you@company.com" />
      </label>
      <label>
        <span class="anth-label">Company</span>
        <input class="anth-input" type="text" />
      </label>
      <label>
        <span class="anth-label">Company size</span>
        <select class="anth-select">
          <option>1–50</option>
          <option>51–500</option>
          <option>501–5,000</option>
          <option>5,000+</option>
        </select>
      </label>
      <label>
        <span class="anth-label">How can we help?</span>
        <textarea class="anth-textarea" rows="4"></textarea>
      </label>
      <p><button class="anth-button" type="submit">Submit</button></p>
    </form>
  </div>
</section>
```

---

## 容器选择表（**按版式选正确容器**）

| 版式 | 推荐容器 | max-width | 为什么 |
|---|---|---|---|
| Hero 主视觉 | `.anth-container` 或 `.anth-container--wide` + 内层 `max-width:820` 约束 h1+lead | 960 / 1200 | hero 需要宽度承载视觉；窄容器会让 hero 内容在大屏幕靠左 |
| 产品总览 / 能力卡 3 列 | `.anth-container` | 960 | 卡片默认三列舒适宽度 |
| **长文正文（Lora）** | `.anth-container--narrow` | 720 | Lora serif 阅读最佳宽度 |
| Research 论文 | `.anth-container--narrow` | 720 | 同上 |
| 数据报告 / pricing 表 | `.anth-container--wide` | 1200 | 多列图表 / 比较表 |
| Enterprise / logo 墙 | `.anth-container--wide` | 1200 | 6 列 logo + 价值 props |
| Install / 短聚焦段 | `.anth-container--narrow` | 720 | 聚焦单栏内容 |

⚠️ **最常见错误**：把 hero 包在 `.anth-container--narrow` —— 720 是长文阅读宽度，不是 hero 宽度。hero 至少用 960。

---

## Scenario recipes

canonical 没覆盖的版式。遇到时按对应 recipe 写，不要把 §1-§6 的卡片 / 编辑式样硬套上去。

### L1 · 数据密集 dashboard（一屏 ≥ 4 个数据块）

```
容器:        .anth-container .anth-container--wide        （1200px）
grid 列数:    4 列（≤1024 降 2 列）
grid gap:    var(--space-4)                              16px（不是 32px）
card padding: var(--space-4)                              16px（不是 32px）
card border:  1px solid var(--anth-light-gray)           （替代默认 box-shadow）
card 圆角:    var(--radius-md)                            16px
```
- 不要 abstract SVG illustration；dashboard 只配 data viz
- 标签 / eyebrow：Poppins 0.8125rem (13px) / weight 500 / `text-transform: uppercase` / `letter-spacing: 0.05em` / `color: var(--anth-text-secondary)`
- 数据值：**Poppins 不是 Lora** / 2rem (32px) / weight 700 / `color: var(--anth-text)`
- 趋势 delta：13px / weight 600 / 上行 `var(--anth-green)` / 下行 `var(--anth-danger)` / 数字带 `↑` `↓` 不用色块
- 标题段（"Overview" 之类）：h2 仍 Poppins 40px，但 `margin-bottom: var(--space-5)` 不是 `--space-7`（dashboard 段间距比 landing 紧）

```html
<section class="anth-section">
  <div class="anth-container anth-container--wide">
    <h2>Usage overview</h2>
    <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:var(--space-4); margin-top:var(--space-5);">
      <div class="anth-card anth-card--data" style="padding:var(--space-4); border:1px solid var(--anth-light-gray); box-shadow:none;">
        <p class="anth-eyebrow" style="font-family:var(--font-heading); font-size:13px; font-weight:500; text-transform:uppercase; letter-spacing:0.05em; color:var(--anth-text-secondary); margin:0;">Active users</p>
        <p style="font-family:var(--font-heading); font-size:32px; font-weight:700; line-height:1; margin:var(--space-2) 0 0;">12,847</p>
        <p style="font-size:13px; font-weight:600; color:var(--anth-green); margin:var(--space-2) 0 0;">↑ 4.2% vs last week</p>
      </div>
      <!-- ×3 more -->
    </div>
  </div>
</section>
```

### L2 · Form / 表单

```
容器:       .anth-container .anth-container--narrow      （720px，不是 wide）
grid:       display:grid; gap:var(--space-4)              （不是 flex column）
section 间距: 大块表单段落用 <fieldset>，gap:var(--space-6)
```
- 见 §6 enterprise 范例与 components.md scenario recipes（input/textarea/select/radio/checkbox）
- 多列字段（"First name" + "Last name"）用 `grid-template-columns: 1fr 1fr; gap: var(--space-4)`
- Submit 按钮单独一行，`.anth-button` + `margin-top: var(--space-6)`
- 错误提示行 `.anth-form-error`：13px / `var(--anth-danger)` / `margin-top: var(--space-1)`，**不要**用红框替代文字
- 不要 floating label（anthropic 用 above-input label）

### L3 · 数据 / 比较表（HTML `<table>`）

```
容器:       .anth-container .anth-container--wide
表头 th:    Poppins / 13px / weight 600 / uppercase / letter-spacing 0.05em
            color: var(--anth-text-secondary)
            border-bottom: 1px solid var(--anth-light-gray)
            padding: var(--space-3) var(--space-4)
            text-align: left（数值列右对齐）
表体 td:    Lora / 16px / weight 400
            border-bottom: 1px solid var(--anth-light-gray)
            padding: var(--space-3) var(--space-4)
zebra:      偶数行 background: var(--anth-bg-subtle)        （可选；行数 ≤ 6 不要 zebra）
hover 行:   不要 hover 高亮（anthropic 表是阅读态，不是交互态）
```
- 不要圆角整表（`<table>` 直边，避免边框断裂）
- 长字段超出 → `text-overflow: ellipsis` + `title=""`，不要换行撑高
- 数值列右对齐：`<td style="text-align:right; font-variant-numeric: tabular-nums;">`

### L4 · Tabs（顶部分类切换）

```
容器:       .anth-container（与下方内容容器一致）
tab list:   role="tablist"; display:flex; gap:var(--space-2)
            border-bottom: 1px solid var(--anth-light-gray)
单 tab:     padding: var(--space-3) var(--space-4)
            font-family: var(--font-heading); font-size:15px; font-weight:500
            color: var(--anth-text-secondary)
            border-bottom: 2px solid transparent; margin-bottom:-1px
            transition: color var(--duration-sm) var(--ease-anth),
                        border-color var(--duration-sm) var(--ease-anth)
[aria-selected=true]:
            color: var(--anth-text)
            border-bottom-color: var(--anth-orange)
```
- 不要 pill / capsule tab（那是 ember 风格）；anthropic 是 underline tab
- 不要 4 个以上 tab（改 dropdown 或左侧 nav）
- tab 切换内容用 `var(--duration-sm)` opacity 淡入（见 motion §M3）

### L5 · Accordion / FAQ

```
容器:       .anth-container .anth-container--narrow（720px 阅读宽度）
单条:       <details> + <summary>（无 JS 即可）
            border-bottom: 1px solid var(--anth-light-gray)
            padding: var(--space-5) 0
summary:    Poppins / 18px / weight 500 / cursor:pointer
            list-style:none; （隐藏默认箭头）
            ::after content: "+";  open 时 "−"
            transition: color var(--duration-sm)
open 内容:   Lora / 18px / 1.65 line-height / color: var(--anth-text-secondary)
            margin-top: var(--space-3)
```
- 不要 chevron 图标，用 `+` / `−` 文字符号（与 anthropic 简洁感一致）
- 不要 box 包裹整条（仅底边线分隔）

### L6 · Modal / Dialog

```
overlay:    position:fixed; inset:0
            background: rgba(20,20,19,0.45)        （半透明实色，不要 blur）
            display:grid; place-items:center
dialog:     background: var(--anth-bg)
            border-radius: var(--radius-lg)         24px
            box-shadow: var(--shadow-pop)
            max-width: 560px
            padding: var(--space-7)                 48px
            内部用 .anth-container--narrow 内容布局
title:      h2 Poppins 28px weight 600（不是 40px section h2）
close 按钮: 右上角 24×24 图标按钮，aria-label="Close"
```
- modal 内不放复杂表单（> 5 字段就改成全页）
- 进出动画见 motion §M6

### L7 · Sidebar nav layout（docs / wiki）

```
全页:       display:grid; grid-template-columns:280px 1fr
            （≤1024 折叠 sidebar 为 hamburger）
sidebar:    background: var(--anth-bg-subtle)
            border-right: 1px solid var(--anth-light-gray)
            padding: var(--space-7) var(--space-5)
            position: sticky; top: 0; height: 100vh; overflow-y: auto
nav 组:     <h6> Poppins 12px uppercase letter-spacing 0.05em
            color: var(--anth-text-secondary)
            margin: var(--space-5) 0 var(--space-2)
nav 链接:   Poppins 14px weight 400 / color: var(--anth-text-secondary)
            active: color:var(--anth-orange); weight:500
            hover: color:var(--anth-text)
            padding: var(--space-2) 0
正文:       .anth-container--narrow（在右侧 1fr 列内居中）
```
- sidebar 不放 illustration / icon；纯文本链
- active link 用 orange 文字色，不用左侧 indicator bar（与 anthropic 极简一致）

### L8 · Changelog / 时间线列表

```
容器:       .anth-container--narrow
单条:       grid-template-columns: 88px 1fr; gap: var(--space-5)
            border-top: 1px solid var(--anth-light-gray)
            padding: var(--space-7) 0
日期:       Poppins 14px weight 500 / color:var(--anth-text-secondary)
内容标题:   Poppins 24px weight 600
内容正文:   Lora 18px / 1.65
版本 badge: .anth-badge（如 v1.4.0）
```
- 不要左侧时间线竖线 + 圆点（anthropic 用顶边线分隔，更克制）
- 倒序：最新在最上

### L9 · Video / Media embed

```
容器:       .anth-container（hero 用 --wide）
wrapper:    aspect-ratio: 16/9; border-radius: var(--radius-lg); overflow:hidden
            background: var(--anth-bg-subtle)
            border: 1px solid var(--anth-light-gray)
poster:     必须有，不要黑屏占位
play btn:   居中 80×80 圆形 var(--anth-orange) 背 + 白色三角
            box-shadow: var(--shadow-pop)
caption:    .anth-caption 居中 / margin-top: var(--space-3)
```
- 不要 autoplay 带声音（已在 motion 禁止）
- 加 `<track kind="captions">` 字幕，accessibility 不可省

### L10 · Empty state

```
容器:       .anth-container--narrow
布局:       text-align: center; padding: var(--space-10) 0
illustration: 240×180 抽象 SVG（橙圆 + 蓝矩 + 绿圆角矩；见 imagery.md）
            margin-bottom: var(--space-6)
title:      h3 Poppins 24px weight 600
hint:       Lora 18px / max-width:480px / margin:auto / color:var(--anth-text-secondary)
CTA:        .anth-button primary
```
- 不要 emoji 表情（"🤔 Nothing here"）；anthropic 用抽象 SVG，不用 emoji
- 文案见 ux-writing.md（"No conversations yet" 不写 "Oops! It looks like you haven't created..."）

---

## Scenario decision tree

```
要做哪类版式？
├─ 长文 / 研究 paper          → §2-§3
├─ 产品 / 营销主页             → §4 / §6
├─ 编辑式 listing / 博客       → §1
├─ pricing 三列                → §5
├─ 数据展示                    → L1 dashboard / L3 表 / L9 video
├─ 表单 / 客户输入              → L2
├─ 文档 / wiki                 → L7 sidebar layout
├─ 内容切换控件                 → L4 tabs / L5 accordion
├─ 状态浮层                    → L6 modal
├─ 时间线                       → L8 changelog
├─ 空数据                       → L10 empty state
└─ 都不是 → 回 §1-§6 找最近的版式 + dos-and-donts.md 对照检查
```
