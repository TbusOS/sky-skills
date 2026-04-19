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
