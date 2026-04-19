# Anthropic Components

按 anthropic.com / claude.com 实测抽象出 27 个可复用小组件，按 **用途 / 关键 class / 示例 / 备注** 四段写。所有示例假定已引入 `assets/anthropic.css` 与 `assets/fonts.css`。

## 1. Nav 导航栏

**用途：** 顶部全站导航 sticky，左 logo + 中链接 + 右 `Try Claude` 橙胶囊 CTA。
**关键 class：** `.anth-nav` `.anth-nav-inner` `.anth-button`
**示例：**

```html
<nav class="anth-nav">
  <div class="anth-nav-inner">
    <a href="/" aria-label="Anthropic">Anthropic</a>
    <div>
      <a href="#">Claude</a>
      <a href="#">Research</a>
      <a href="#">Company</a>
      <a href="#">Careers</a>
      <a href="#">News</a>
    </div>
    <div>
      <a class="anth-button" href="#">Try Claude</a>
    </div>
  </div>
</nav>
```

**备注：** 64px 固定高度；底部 1px `--anth-light-gray`。链接字体 Poppins 14px / 500。`Try Claude` 是橙胶囊主 CTA —— 与 Apple 用文字链不同，Anthropic nav 顶角永远有一个橙按钮。

## 2. Footer 页脚

**用途：** 6 栏目录 + 法务行 + 社媒图标行。
**关键 class：** `.anth-footer` `.anth-footer-grid` `.anth-footer-group` `.anth-footer-legal` `.anth-social`
**示例：**

```html
<footer class="anth-footer">
  <div class="anth-footer-grid">
    <div class="anth-footer-group">
      <h5>Claude</h5>
      <a href="#">Overview</a>
      <a href="#">Team</a>
      <a href="#">Enterprise</a>
      <a href="#">API</a>
    </div>
    <div class="anth-footer-group">
      <h5>Research</h5>
      <a href="#">Overview</a>
      <a href="#">Index</a>
      <a href="#">Papers</a>
    </div>
    <div class="anth-footer-group">
      <h5>Company</h5>
      <a href="#">About</a>
      <a href="#">Customers</a>
      <a href="#">News</a>
    </div>
    <div class="anth-footer-group">
      <h5>Resources</h5>
      <a href="#">Docs</a>
      <a href="#">Status</a>
      <a href="#">Support</a>
    </div>
    <div class="anth-footer-group">
      <h5>Legal</h5>
      <a href="#">Privacy</a>
      <a href="#">Terms</a>
      <a href="#">Trust</a>
    </div>
    <div class="anth-footer-group">
      <h5>Locations</h5>
      <a href="#">San Francisco</a>
      <a href="#">London</a>
      <a href="#">Dublin</a>
    </div>
  </div>
  <div class="anth-footer-legal">
    <p>© 2026 Anthropic PBC</p>
    <div class="anth-social">
      <a href="#" aria-label="Twitter">Twitter</a>
      <a href="#" aria-label="LinkedIn">LinkedIn</a>
      <a href="#" aria-label="YouTube">YouTube</a>
      <a href="#" aria-label="GitHub">GitHub</a>
    </div>
  </div>
</footer>
```

**备注：** 底色 `--anth-bg-subtle` 与 page bg 形成柔分层。6 栏在 ≤768px 自动折成 2 栏，769–1024 折成 3 栏（已在 CSS 中处理）。

## 3. Button 按钮

**用途：** Anthropic **主用** filled orange pill 按钮（与 Apple 相反）。次级用 ghost 边框；辅助走 `.anth-link` 文字链 + `→` 箭头。
**关键 class：** `.anth-button` `.anth-button--dark` `.anth-button--ghost` `.anth-link` `.anth-link--no-arrow`
**示例：**

```html
<!-- 主 CTA：橙胶囊（最常用） -->
<a class="anth-button">Try Claude</a>

<!-- 次级：黑胶囊 -->
<a class="anth-button anth-button--dark">Talk to sales</a>

<!-- 三级：透明边框 -->
<a class="anth-button anth-button--ghost">Read the paper</a>

<!-- 文字链：默认带 → -->
<a class="anth-link">Learn more</a>

<!-- 文字链：不带箭头（导航 / footer） -->
<a class="anth-link anth-link--no-arrow">Privacy</a>
```

**备注：** Anthropic **USES** filled pill buttons —— 每个 hero / pricing card / form 提交都是橙胶囊；不必克制。圆角 9999px（pill），padding 12 24，Poppins 15 / 500。Apple 风格的"全文字链"在 Anthropic 仅用于次要操作。

## 4. Form 表单

**用途：** 联系销售 / 注册 / 搜索等输入。
**关键 class：** `.anth-input` `.anth-select` `.anth-textarea` `.anth-label` `.anth-button`
**示例：**

```html
<form style="display:grid; gap:var(--space-4);">
  <label>
    <span class="anth-label">Work email</span>
    <input class="anth-input" type="email" placeholder="you@company.com" />
  </label>
  <label>
    <span class="anth-label">Country</span>
    <select class="anth-select">
      <option>United States</option>
      <option>United Kingdom</option>
    </select>
  </label>
  <label>
    <span class="anth-label">Message</span>
    <textarea class="anth-textarea" rows="4"></textarea>
  </label>
  <p><button class="anth-button" type="submit">Submit</button></p>
</form>
```

**备注：** label 12px Poppins，控件 15px Lora；focus 态用 2px `--anth-orange` outline。圆角 16px（`--radius-md`），padding 12 16。

## 5. Radio / Checkbox

**用途：** 单选 / 多选输入。
**关键 class：** `.anth-radio` `.anth-checkbox`
**示例：**

```html
<label><input class="anth-radio" type="radio" name="plan" /> Free</label>
<label><input class="anth-radio" type="radio" name="plan" checked /> Pro</label>
<label><input class="anth-radio" type="radio" name="plan" /> Team</label>

<label><input class="anth-checkbox" type="checkbox" /> Subscribe to research updates</label>
<label><input class="anth-checkbox" type="checkbox" /> Subscribe to product updates</label>
```

**备注：** 用原生 `accent-color: var(--anth-orange)` 染色 —— 选中态自动呈品牌橙。尺寸 18×18px。

## 6. Option Cards / Segmented

**用途：** 月费 / 年费切换；plan 切换；语言切换。**复用 `.anth-tabs` tab 结构做分段控件 —— 不引入新 class。**
**关键 class：** `.anth-tabs` `.anth-tab` `.is-active`
**示例：**

```html
<div class="anth-tabs" role="radiogroup" aria-label="Billing cycle">
  <button class="anth-tab is-active" aria-checked="true">Monthly</button>
  <button class="anth-tab" aria-checked="false">Yearly</button>
</div>
```

**备注：** 视觉与标签页完全一致：选中态橙下划线，非选中态 secondary 文字。Anthropic 的"分段控件"实质就是水平 tab。

## 7. Table 表格

**用途：** Pricing 比较 / 模型 spec 对比 / docs 数据表。
**关键 class：** `.anth-table`
**示例：**

```html
<table class="anth-table">
  <thead>
    <tr>
      <th>Feature</th>
      <th>Free</th>
      <th>Pro</th>
      <th>Team</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Daily messages</td>
      <td>Limited</td>
      <td>5× more usage</td>
      <td>Higher limits</td>
    </tr>
    <tr>
      <td>Claude Opus 4</td>
      <td><span class="cross">—</span></td>
      <td><span class="check">Included</span></td>
      <td><span class="check">Included</span></td>
    </tr>
    <tr>
      <td>Projects</td>
      <td><span class="cross">—</span></td>
      <td><span class="check">Included</span></td>
      <td><span class="check">Included</span></td>
    </tr>
    <tr>
      <td>Central admin & billing</td>
      <td><span class="cross">—</span></td>
      <td><span class="cross">—</span></td>
      <td><span class="check">Included</span></td>
    </tr>
  </tbody>
</table>
```

**备注：** th 底色 `--anth-bg-subtle`，Poppins 500；td Lora 15px，行底 1px `--anth-light-gray` 分隔；tr hover 整行底色变 subtle。`.check` 绿、`.cross` 灰（CSS 已定义）。

## 8. Tabs 标签页

**用途：** 同一区域的多视角切换（research → engineering → policy 博客分类）。
**关键 class：** `.anth-tabs` `.anth-tab` `.is-active`
**示例：**

```html
<div class="anth-tabs" role="tablist">
  <button class="anth-tab is-active" role="tab" aria-selected="true">All</button>
  <button class="anth-tab" role="tab" aria-selected="false">Research</button>
  <button class="anth-tab" role="tab" aria-selected="false">Engineering</button>
  <button class="anth-tab" role="tab" aria-selected="false">Policy</button>
</div>
<div role="tabpanel"><p>All posts...</p></div>
```

**备注：** 选中态 2px 橙下划线 + 文字色升至 primary。Poppins 14。

## 9. Carousel 轮播

**用途：** 客户引用墙 / 案例研究循环。**显示 `01 / 21` 计数器 + 左右箭头。**
**关键 class：** `.anth-carousel` `.anth-carousel-viewport` `.anth-carousel-counter`
**示例：**

```html
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
  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:var(--space-4);">
    <span class="anth-carousel-counter">01 / 21</span>
    <div>
      <button aria-label="Previous">&larr;</button>
      <button aria-label="Next">&rarr;</button>
    </div>
  </div>
</div>
```

**备注：** viewport 用 `transform: translateX()` JS 切换；counter 永远是 `两位数 / 总数` 格式（`01 / 21`，不是 `1/21`）。Poppins 13 secondary。

## 10. Video 视频

**用途：** Research 论文配套讲解视频 / 产品发布短片。
**关键 class：** `.anth-video` `.anth-caption`
**示例：**

```html
<figure>
  <video class="anth-video" poster="poster.jpg" controls>
    <source src="claude-launch.mp4" type="video/mp4" />
  </video>
  <figcaption class="anth-caption" style="text-align:center;">Watch the launch</figcaption>
</figure>
```

**备注：** width 100% + 圆角 16px（`--radius-md`）。**禁止**自动播放带声音；poster 用品牌色调插画。

## 11. Badge / Chip 分类

**用途：** 卡片顶部分类标签（Research / Engineering / Policy）；新功能 NEW；状态。
**关键 class：** `.anth-badge`
**示例：**

```html
<span class="anth-badge">Research</span>
<span class="anth-badge">Engineering</span>
<span class="anth-badge">Policy</span>
<span class="anth-badge">New</span>
```

**备注：** 12px Poppins，padding 4 10，pill 形，底 `--anth-light-gray`，文字 primary。需要主色高亮时可内联 `style="background:var(--anth-orange); color:var(--anth-bg);"`。

## 12. Pull quote 引用

**用途：** 客户证言（带公司 logo）/ 论文引用。
**关键 class：** `.anth-quote` `.anth-quote-cite`
**示例：**

```html
<blockquote class="anth-quote">
  Claude is the most thoughtful and capable assistant we've worked with —
  it changed how our entire research team operates.
  <cite class="anth-quote-cite">
    <img src="logos/quora.svg" alt="Quora" />
    <span>Adam D'Angelo · CEO, Quora</span>
  </cite>
</blockquote>
```

**备注：** Lora italic 22px，左 3px 橙竖线，max-width 680。`.anth-quote-cite` 内**必须**含公司 logo `<img>`（高度 20px，已 CSS 定义）+ 作者姓名 / 职位（Poppins 14 normal）。

## 13. List

**用途：** 特性枚举 / 步骤说明。
**关键 class：** 无（原生 `<ul>` `<ol>` + Lora 正文样式即可）
**示例：**

```html
<ul>
  <li>Multi-step reasoning across long contexts.</li>
  <li>Tool use for retrieval, code, and data analysis.</li>
  <li>Constitutional AI fine-tuning.</li>
</ul>

<ol>
  <li>Sign up for a Claude account.</li>
  <li>Connect your data sources.</li>
  <li>Start chatting with your knowledge.</li>
</ol>
```

**备注：** Lora 18 / 1.65 行高；项与项间距 8px；不引入自定义 marker，保留原生 disc / decimal。

## 14. Banner

**用途：** 顶部模型发布 / 重要公告轮播条。
**关键 class：** `.anth-banner` `.anth-link`
**示例：**

```html
<div class="anth-banner">
  <span class="anth-badge">New</span>
  <p style="margin:0;">Claude Opus 4 is now available in the API.</p>
  <a class="anth-link">Read the announcement</a>
</div>
```

**备注：** 底 `--anth-bg-subtle` 圆角 16；横向 flex，gap 16；字号 14。可放 hero 上方做条带，也可塞进文章内做提示。

## 15. Breadcrumbs

**用途：** docs / research 子页层级导航。
**关键 class：** `.anth-breadcrumbs`
**示例：**

```html
<ul class="anth-breadcrumbs">
  <li><a href="/">Home</a></li>
  <li><a href="/research">Research</a></li>
  <li>Constitutional AI</li>
</ul>
```

**备注：** 分隔符 `›`（CSS `::after` 自动注入），最后一项无分隔符也无链接态。Poppins 13 secondary。

## 16. Pagination

**用途：** 博客 / news / case studies 列表翻页。**Anthropic 用橙胶囊"加载更多"，不用数字分页。**
**关键 class：** `.anth-button`
**示例：**

```html
<p style="text-align:center; margin-top:var(--space-7);">
  <button class="anth-button">Load more</button>
</p>
```

**备注：** **不要**写 `1 2 3 ...` 数字分页；Anthropic 列表统一橙胶囊"Load more"。点击后 append 下一批卡片，URL 用 `?page=N` query 参数。

## 17. Search

**用途：** docs.anthropic.com 站内搜索框。
**关键 class：** `.anth-input`
**示例：**

```html
<form role="search">
  <label class="anth-sr-only" for="search">Search docs</label>
  <input class="anth-input" id="search" type="search" placeholder="Search documentation..." />
</form>
```

**备注：** 用普通 `.anth-input` 即可 —— focus 态自动 2px 橙 outline。可与下拉建议面板组合（自定义 absolute 定位）。

## 18. Logo wall 客户墙

**用途：** Enterprise / 首页底部"被这些公司使用"。6 列 grayscale。
**关键 class：** `.anth-logo-wall`
**示例：**

```html
<div class="anth-logo-wall">
  <img src="logos/lyft.svg" alt="Lyft" />
  <img src="logos/notion.svg" alt="Notion" />
  <img src="logos/zoom.svg" alt="Zoom" />
  <img src="logos/asana.svg" alt="Asana" />
  <img src="logos/quora.svg" alt="Quora" />
  <img src="logos/dna.svg" alt="DNA" />
</div>
```

**备注：** 6 列 grid（≤768 折成 3 列）；图 max-height 32px；`grayscale(1) opacity(0.6)`，hover 还原。所有 logo 必须有 `alt`。

## 19. Pricing Card 套餐卡

**用途：** /pricing 页 plan 比较，三张并排，推荐款橙细边高亮。
**关键 class：** `.anth-card` `.anth-button` `.anth-button--ghost` `.anth-badge` `.anth-caption`
**示例：**

```html
<div style="display:grid; grid-template-columns:repeat(3,1fr); gap:var(--space-6);">

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
```

**备注：** 推荐款用内联 `border:2px solid var(--anth-orange)` 高亮（不抽象成单独 class）；非推荐款 ghost 按钮；推荐款实心橙按钮。

## 20. Customer quote carousel

**用途：** 大段客户引用 + 公司 logo + 作者；多个引用循环展示。
**关键 class：** `.anth-carousel` `.anth-carousel-viewport` `.anth-carousel-counter` `.anth-quote` `.anth-quote-cite`
**示例：**

```html
<section class="anth-section anth-section--subtle">
  <div class="anth-container">
    <div class="anth-carousel">
      <div class="anth-carousel-viewport">

        <blockquote class="anth-quote" style="flex:0 0 100%;">
          Claude has transformed how we serve our 400 million monthly users.
          The quality of responses is unmatched.
          <cite class="anth-quote-cite">
            <img src="logos/quora.svg" alt="Quora" />
            <span>Adam D'Angelo · CEO, Quora</span>
          </cite>
        </blockquote>

        <blockquote class="anth-quote" style="flex:0 0 100%;">
          We chose Claude for its safety guarantees and its ability to follow
          nuanced instructions across our enterprise workflows.
          <cite class="anth-quote-cite">
            <img src="logos/notion.svg" alt="Notion" />
            <span>Simon Last · Co-founder, Notion</span>
          </cite>
        </blockquote>

      </div>
      <div style="display:flex; justify-content:space-between; margin-top:var(--space-5);">
        <span class="anth-carousel-counter">01 / 21</span>
        <div>
          <button aria-label="Previous">&larr;</button>
          <button aria-label="Next">&rarr;</button>
        </div>
      </div>
    </div>
  </div>
</section>
```

**备注：** 与 §9 carousel 同结构，但 viewport 内放多个 100% 宽 quote。Section 用 subtle 背景把引用从主页面分出。

## 21. Code block

**用途：** 文档示例代码 / API 请求。
**关键 class：** `.anth-code`
**示例：**

```html
<pre class="anth-code"><code>import anthropic

client = anthropic.Anthropic()

message = client.messages.create(
    model="claude-opus-4-20250514",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Hello, Claude"}
    ]
)

print(message.content)
</code></pre>
```

**备注：** JetBrains Mono 14px，底 `--anth-bg-subtle`，圆角 16，padding 32，水平滚动；不显示行号；不强制语法高亮（如需 highlight.js 接入即可）。

## 22. Inline (code / kbd / mark)

**用途：** 行内代码 / 键盘按键 / 文本高亮。
**关键 class：** 无（语义标签 `<code>` `<kbd>` `<mark>` 已在 anthropic.css 中样式化）
**示例：**

```html
<p>Press <kbd>⌘</kbd>+<kbd>K</kbd> to open the search overlay.</p>
<p>Use the <code>messages.create()</code> method to send a request.</p>
<p>We focus on <mark>helpful, harmless, and honest</mark> AI.</p>
```

**备注：** `<code>` 灰底无边框；`<kbd>` 灰底 + 1px 边框；`<mark>` 用 20% 不透明橙底（`rgba(217,119,87,0.2)`）。

## 23. Figure / caption

**用途：** 配图 / 图表 + 说明文字。
**关键 class：** `.anth-caption`
**示例：**

```html
<figure>
  <svg viewBox="0 0 500 500" width="100%" role="img" aria-label="Abstract composition">
    <circle cx="240" cy="240" r="140" fill="#d97757" opacity="0.9"/>
    <circle cx="340" cy="180" r="80"  fill="#6a9bcc" opacity="0.9"/>
  </svg>
  <figcaption class="anth-caption" style="text-align:center;">Figure 1. Constitutional AI training loop.</figcaption>
</figure>
```

**备注：** caption 居中、13px、`--anth-text-secondary`，与图之间 12px gap。

## 24. Divider

**用途：** 章节 / 大块之间分隔。
**关键 class：** `.anth-divider`
**示例：**

```html
<section>...</section>
<hr class="anth-divider" />
<section>...</section>
```

**备注：** 1px `--anth-light-gray`，上下 64px margin（`var(--space-8)`）。**不要**用 box-shadow 做伪分隔。

## 25. Details 折叠

**用途：** FAQ / 法律条款 / 文档可展开段。
**关键 class：** `.anth-details`
**示例：**

```html
<details class="anth-details">
  <summary>What is Constitutional AI?</summary>
  <p>Constitutional AI (CAI) is an approach for training a helpful, harmless,
  and honest assistant using AI feedback rather than human labels for harmlessness.</p>
</details>

<details class="anth-details">
  <summary>How does Claude handle long contexts?</summary>
  <p>Claude supports up to 500K tokens of context...</p>
</details>
```

**备注：** summary 后的 `▸` 图标 open 状态旋转 90°，过渡 240ms。底 `--anth-bg-subtle`，圆角 16。

## 26. Admonition

**用途：** 文档正文中的提醒：info（默认）/ warning / success / danger。
**关键 class：** `.anth-admonition` `.anth-admonition--warning` `.anth-admonition--success` `.anth-admonition--danger`
**示例：**

```html
<!-- info（默认，无 modifier） -->
<aside class="anth-admonition">
  <h5>Note</h5>
  <p>This API endpoint requires an Anthropic API key.</p>
</aside>

<!-- warning -->
<aside class="anth-admonition anth-admonition--warning">
  <h5>Warning</h5>
  <p>This model is in beta and may change without notice.</p>
</aside>

<!-- success -->
<aside class="anth-admonition anth-admonition--success">
  <h5>Success</h5>
  <p>Your API key has been created and copied to clipboard.</p>
</aside>

<!-- danger -->
<aside class="anth-admonition anth-admonition--danger">
  <h5>Danger</h5>
  <p>Deleting an organization removes all API keys and audit logs irreversibly.</p>
</aside>
```

**备注：** info 是默认（无 `--info` modifier 类），h5 着色 `--anth-blue`；warning 着 `--anth-orange`；success 着 `--anth-green`；danger 着 `--anth-danger`。底色统一 `--anth-bg-subtle`。

## 27. Empty / 404

**用途：** 无结果页 / 404 页。
**关键 class：** `.anth-section` `.anth-container--narrow` `.anth-button` `.anth-link`
**示例：**

```html
<section class="anth-section" style="text-align:center;">
  <div class="anth-container--narrow">
    <h1>We can't find that page.</h1>
    <p>The link may be broken or the page may have moved. Try one of the links below.</p>
    <p style="margin-top:var(--space-6);">
      <a class="anth-button">Go to homepage</a>
      <a class="anth-link" style="margin-left:var(--space-4);">Contact support</a>
    </p>
  </div>
</section>
```

**备注：** 居中对齐，narrow 容器；不放抽象插画（保持简洁）；至少提供一个橙胶囊主入口 + 一个文字链辅助。
