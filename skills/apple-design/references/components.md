# Apple Components

按 Apple 官网实测抽象出 27 个可复用小组件，按 **用途 / 关键 class / 最小 HTML / 备注** 四段写。所有示例假定已引入 `assets/apple.css`。

## 1. Nav 导航栏

**用途：** 顶部全站导航，sticky + 毛玻璃。
**关键 class：** `.apple-nav` `.apple-nav-inner` `.apple-sr-only`（搜索按钮的 label）
**示例：**

```html
<nav class="apple-nav"><div class="apple-nav-inner">
  <a href="/" aria-label="Apple">Apple</a>
  <div>
    <a href="#">Store</a><a href="#">Mac</a><a href="#">iPad</a>
    <a href="#">iPhone</a><a href="#">Watch</a><a href="#">Support</a>
  </div>
  <div>
    <button aria-label="Search"><span class="apple-sr-only">Search</span>🔍</button>
    <a href="#" aria-label="Bag">🛍 <span class="apple-badge">0+</span></a>
  </div>
</div></nav>
```

**备注：** 使用 `--apple-bg-nav` 毛玻璃背景，高度固定 44px。链接默认 opacity 0.8，hover 1。

## 2. Footer 页脚

**用途：** 多列目录 + 法务 + 区域选择。
**关键 class：** `.apple-footer` `.apple-divider` `.apple-caption`
**示例：**

```html
<footer class="apple-footer">
  <div class="apple-container">
    <p class="apple-caption">More ways to shop: <a class="apple-link">Find an Apple Store</a> or <a class="apple-link">other retailer</a> near you. Or call 1-800-MY-APPLE.</p>
    <hr class="apple-divider" />
    <div style="display:grid; grid-template-columns:repeat(5,1fr); gap:var(--space-5);">
      <div><h4>Shop and Learn</h4><ul><li><a href="#">Store</a></li><li><a href="#">Mac</a></li></ul></div>
      <div><h4>Services</h4><ul><li><a href="#">Apple Music</a></li></ul></div>
      <div><h4>Account</h4><ul><li><a href="#">Manage Your Apple Account</a></li></ul></div>
      <div><h4>Apple Store</h4><ul><li><a href="#">Find a Store</a></li></ul></div>
      <div><h4>For Business</h4><ul><li><a href="#">Apple and Business</a></li></ul></div>
    </div>
    <hr class="apple-divider" />
    <p class="apple-caption">Copyright © 2026 Apple Inc. All rights reserved.</p>
  </div>
</footer>
```

**备注：** 字号 12px，`var(--apple-text-secondary)`。hover 才显示下划线。

## 3. Button 按钮

**用途：** Apple **克制使用**按钮。95% 的交互走 `.apple-link` 带箭头文字链；填色按钮 `.apple-button` 仅用于 Buy / Add to Bag / 付费 CTA 等转化场景。
**关键 class：** `.apple-link` `.apple-button` `.apple-button--secondary`
**示例：**

```html
<!-- 绝大多数场景：文字链 -->
<a class="apple-link">Learn more</a>

<!-- 转化场景：填色主按钮 -->
<a class="apple-button">Buy</a>

<!-- 并列次级按钮（灰底） -->
<a class="apple-button apple-button--secondary">Add to Bag</a>
```

**备注：** 实心按钮圆角 980px（胶囊形），padding 12px 22px。禁止把所有 CTA 都做成填色按钮。

## 4. Form 表单

**用途：** 登录 / 订单 / 搜索等输入。
**关键 class：** `.apple-input` `.apple-select` `.apple-textarea`
**示例：**

```html
<form>
  <label>
    <span class="apple-caption">Email</span>
    <input class="apple-input" type="email" placeholder="you@example.com" />
  </label>
  <label>
    <span class="apple-caption">Country</span>
    <select class="apple-select">
      <option>United States</option>
      <option>China mainland</option>
    </select>
  </label>
  <label>
    <span class="apple-caption">Message</span>
    <textarea class="apple-input apple-textarea" rows="4"></textarea>
  </label>
</form>
```

**备注：** label 与控件之间 8px 间距；focus 态用 `--apple-link` 作 2px 外框。

## 5. Radio / Checkbox / Toggle

**用途：** 单选 / 多选 / 开关态。
**关键 class：** `.apple-radio` `.apple-checkbox` `.apple-toggle`
**示例：**

```html
<label><input class="apple-radio" type="radio" name="plan" /> Individual</label>
<label><input class="apple-radio" type="radio" name="plan" checked /> Family</label>

<label><input class="apple-checkbox" type="checkbox" /> Subscribe to Apple emails</label>

<label style="display:flex; align-items:center; gap:var(--space-3);">
  Enable notifications
  <input type="checkbox" class="apple-toggle" />
</label>
```

**备注：** Toggle 选中态底色 `var(--apple-system-green)`（iOS 原生色）。

## 6. Option Cards

**用途：** 颜色 / 容量 / 存储的可视化选择（代替 radio）。
**关键 class：** `.apple-swatch` `.apple-option-card` `.apple-segmented`
**示例：**

```html
<!-- 颜色 swatch -->
<div role="radiogroup" aria-label="Color">
  <button class="apple-swatch" style="background:#1F2020;" aria-label="Black Titanium"></button>
  <button class="apple-swatch" style="background:#D5C4B0;" aria-label="Desert Titanium"></button>
  <button class="apple-swatch" aria-checked="true" style="background:#E9E4D4;" aria-label="Natural Titanium"></button>
</div>

<!-- 容量卡片 -->
<div>
  <label class="apple-option-card">
    <input type="radio" name="storage" class="apple-sr-only" />
    <span>256GB</span><span class="apple-caption">From $999</span>
  </label>
  <label class="apple-option-card" aria-checked="true">
    <input type="radio" name="storage" class="apple-sr-only" checked />
    <span>512GB</span><span class="apple-caption">From $1,199</span>
  </label>
</div>

<!-- 分段控件 -->
<div class="apple-segmented" role="tablist">
  <button aria-selected="true">Monthly</button>
  <button>Yearly</button>
</div>
```

**备注：** 选中态用 2px `--apple-text` 外框，不换底色。

## 7. Table 表格

**用途：** 规格对比 / 数据表。
**关键 class：** `.apple-table`（降级真 table 时）
**示例：**

```html
<!-- 首选：并排段落（Apple 官网规格页样式） -->
<div style="display:grid; grid-template-columns:repeat(3,1fr); gap:var(--space-6);">
  <div>
    <h3>iPhone 17 Pro</h3>
    <p class="apple-caption">Display</p>
    <p>6.3-inch Super Retina XDR</p>
    <p class="apple-caption">Chip</p>
    <p>A19 Pro</p>
  </div>
  <div>
    <h3>iPhone 17 Pro Max</h3>
    <p class="apple-caption">Display</p>
    <p>6.9-inch Super Retina XDR</p>
    <p class="apple-caption">Chip</p>
    <p>A19 Pro</p>
  </div>
  <div>
    <h3>iPhone 17</h3>
    <p class="apple-caption">Display</p>
    <p>6.1-inch Super Retina XDR</p>
    <p class="apple-caption">Chip</p>
    <p>A19</p>
  </div>
</div>

<!-- 降级：确实需要 table 时 -->
<table class="apple-table">
  <thead><tr><th>Feature</th><th>Pro</th><th>Pro Max</th></tr></thead>
  <tbody>
    <tr><td>Display</td><td>6.3"</td><td>6.9"</td></tr>
    <tr><td>Chip</td><td>A19 Pro</td><td>A19 Pro</td></tr>
  </tbody>
</table>
```

**备注：** Apple 几乎不用真 `<table>`；若必须用，去掉 border，仅保留 1px 底部分割线，字号沿用正文。

## 8. Tabs 标签页

**用途：** 同一内容的不同视角切换（lifecycle / gallery 等）。
**关键 class：** `.apple-tabs` `.apple-tab`
**示例：**

```html
<div class="apple-tabs" role="tablist">
  <button class="apple-tab" aria-selected="true">Overview</button>
  <button class="apple-tab">Materials</button>
  <button class="apple-tab">Recycling</button>
  <button class="apple-tab">Energy</button>
</div>
<div role="tabpanel"><p>Overview content...</p></div>
```

**备注：** 选中态底部 2px `--apple-text` 下划线；文字色 secondary → primary。

## 9. Carousel 轮播

**用途：** 过往事件 / 画廊图集 / 故事墙。
**关键 class：** `.apple-carousel-dots`
**示例：**

```html
<div class="apple-carousel">
  <div class="apple-carousel-viewport" style="display:flex; overflow-x:auto; gap:var(--space-4); scroll-snap-type:x mandatory;">
    <div style="flex:0 0 80%; scroll-snap-align:start;"><img src="slide-1.jpg" alt="" /></div>
    <div style="flex:0 0 80%; scroll-snap-align:start;"><img src="slide-2.jpg" alt="" /></div>
    <div style="flex:0 0 80%; scroll-snap-align:start;"><img src="slide-3.jpg" alt="" /></div>
  </div>
  <div class="apple-carousel-dots">
    <button aria-current="true"></button>
    <button></button>
    <button></button>
  </div>
</div>
```

**备注：** Apple 偏好原生 scroll-snap 而非 JS 动画；圆点在底部居中 12px。

## 10. Video 视频

**用途：** Keynote replay / product film。
**关键 class：** `.apple-video` `.apple-video-play`
**示例：**

```html
<figure class="apple-video">
  <img src="keynote-poster.jpg" alt="Keynote replay" />
  <button class="apple-video-play" aria-label="Play">▶</button>
  <figcaption class="apple-caption" style="text-align:center;">Watch the keynote</figcaption>
</figure>
```

**备注：** poster 图满宽，play 按钮居中 44×44，白底 80% 透明度 + 毛玻璃。

## 11. Badge 徽章 / 分类

**用途：** 新品 / 分类 / 购物车数字角标。
**关键 class：** `.apple-badge`
**示例：**

```html
<span class="apple-badge">New</span>
<span class="apple-badge">Announcements</span>
<a href="#" aria-label="Bag">🛍 <span class="apple-badge">3</span></a>
```

**备注：** 12px 字号，padding 2px 8px，圆角 980px，底色 `--apple-bg-alt`。

## 12. Quote / Pull-quote

**用途：** 客户证言 / 创始人话语。
**关键 class：** `.apple-quote`
**示例：**

```html
<blockquote class="apple-quote">
  <p>"We're doing the best work we've ever done."</p>
  <footer class="apple-caption">— Tim Cook, CEO</footer>
</blockquote>
```

**备注：** 字号 32px、Display 字体、左侧无引号装饰；`footer` 另一行灰色小字。

## 13. List 列表

**用途：** 特性枚举 / 步骤说明。
**关键 class：** 无（使用原生 ul/ol + 合理间距）
**示例：**

```html
<ul>
  <li>A19 Pro chip, the world's most advanced.</li>
  <li>48MP Fusion camera with 5x optical zoom.</li>
  <li>USB-C with Thunderbolt 4.</li>
</ul>

<ol>
  <li>Choose your carrier.</li>
  <li>Customize your iPhone.</li>
  <li>Review and place order.</li>
</ol>
```

**备注：** 标点项用原生 disc / decimal；行间距 1.5；标记与文字间距 8px。

## 14. Banner 促销条

**用途：** 顶部 / 页内提示 "Free delivery" 等。
**关键 class：** `.apple-banner` `.apple-link`
**示例：**

```html
<div class="apple-banner">
  <p>Free delivery and returns. <a class="apple-link">Shop Apple Store</a></p>
</div>
```

**备注：** 铺满宽度，浅灰底，padding 12px，字号 14px，居中对齐。

## 15. Breadcrumbs 面包屑

**用途：** 商品分类内导航。
**关键 class：** `.apple-breadcrumbs`
**示例：**

```html
<nav class="apple-breadcrumbs" aria-label="Breadcrumb">
  <ol>
    <li><a href="/shop">Shop</a></li>
    <li><a href="/shop/iphone">iPhone</a></li>
    <li aria-current="page">iPhone 17 Pro</li>
  </ol>
</nav>
```

**备注：** 仅用于 Store 子页面；分隔符用 `›`；当前页 `aria-current` 无链接态。

## 16. Pagination 分页

**用途：** 列表翻页。
**关键 class：** `.apple-link`
**示例：**

```html
<!-- Apple 样式：无数字分页 -->
<p style="text-align:center;">
  <a class="apple-link">View All</a>
</p>

<!-- 或：仅上/下一页 -->
<p>
  <a class="apple-link apple-link--no-arrow">‹ Previous</a>
  &nbsp; <a class="apple-link">Next</a>
</p>
```

**备注：** Apple 官网**不使用**数字分页（1 2 3 ...）。Newsroom / Support 列表末尾统一 "View All ›"。

## 17. Search 搜索

**用途：** 顶栏搜索入口，点击后全屏 overlay。
**关键 class：** `.apple-search-overlay` `.apple-input`
**示例：**

```html
<button aria-label="Search" class="apple-search-trigger">
  <span class="apple-sr-only">Search apple.com</span>🔍
</button>

<div class="apple-search-overlay" hidden>
  <div class="apple-container">
    <input class="apple-input" type="search" placeholder="Search apple.com" autofocus />
    <section><h3 class="apple-caption">Quick Links</h3><ul><li><a class="apple-link">Visit Apple Store</a></li></ul></section>
  </div>
</div>
```

**备注：** overlay 打开时 nav 保留，正文淡出。

## 18. Cart 购物车图标

**用途：** 顶栏购物袋入口。
**关键 class：** `.apple-badge`
**示例：**

```html
<a href="/bag" aria-label="Bag, 2 items">🛍 <span class="apple-badge">2</span></a>
```

**备注：** 数量为 0 时隐藏 badge（不显示 "0"）；超过 9 显示 "9+"。

## 19. Region Selector 区域选择器

**用途：** 页脚底部切换国家/语言。
**关键 class：** `.apple-link` `.apple-link--no-arrow`
**示例：**

```html
<p class="apple-caption">
  <a class="apple-link apple-link--no-arrow" href="/choose-country-region/">🌐 United States</a>
</p>
```

**备注：** 跳转独立的国家选择页；不使用 select 下拉。

## 20. Theme Toggle 主题切换

**用途：** Light / Dark / Auto 三态。**仅 Dev Portal** (developer.apple.com) 提供；主站 apple.com 不提供。
**关键 class：** `.apple-segmented`
**示例：**

```html
<div class="apple-segmented" role="radiogroup" aria-label="Appearance">
  <button aria-checked="false">Light</button>
  <button aria-checked="false">Dark</button>
  <button aria-checked="true">Auto</button>
</div>
```

**备注：** 主站产品页坚持亮色 / 黑色分节交替叙事，不暴露全局主题切换。

## 21. Code Block 代码块

**用途：** 开发者文档示例代码。
**关键 class：** `.apple-code`
**示例：**

```html
<pre class="apple-code"><code>import SwiftUI

struct ContentView: View {
  var body: some View {
    Text("Hello, Apple!")
  }
}</code></pre>
```

**备注：** 字体 SF Mono / ui-monospace；底 `--apple-bg-alt`；圆角 12px；padding 20px；不做行号。

## 22. Inline 内联元素

**用途：** 行内代码 / 按键 / 高亮 / 缩写。
**关键 class：** 无（使用语义标签 + apple.css 已定义的样式）
**示例：**

```html
<p>Press <kbd>⌘</kbd>+<kbd>Space</kbd> to open Spotlight.</p>
<p>Use the <code>NSLocalizedString</code> API.</p>
<p>We highlight <mark>what matters most</mark>.</p>
<p>Built on <abbr title="Advanced RISC Machine">ARM</abbr> architecture.</p>
```

**备注：** `<kbd>` 胶囊灰底；`<code>` 灰底无边框；`<mark>` 用淡黄；`<abbr>` 下划线虚线。

## 23. Figure / Caption 图像注释

**用途：** 配图 + 说明文字。
**关键 class：** `.apple-caption`
**示例：**

```html
<figure>
  <img src="iphone-back.jpg" alt="Back of iPhone 17 Pro showing triple-camera system" />
  <figcaption class="apple-caption" style="text-align:center;">The pro camera system, reimagined.</figcaption>
</figure>
```

**备注：** caption 居中、14px、`--apple-text-secondary`；上 padding 12px。

## 24. Divider 分隔线

**用途：** 章节或页脚块之间。
**关键 class：** `.apple-divider`
**示例：**

```html
<section>...</section>
<hr class="apple-divider" />
<section>...</section>
```

**备注：** 1px `--apple-divider` (#D2D2D7)；margin 上下 var(--space-6)；禁止使用 box-shadow 伪分隔。

## 25. Details 折叠

**用途：** FAQ / 法律条款可展开段。
**关键 class：** `.apple-details`
**示例：**

```html
<details class="apple-details">
  <summary>What's in the box?</summary>
  <p>iPhone with iOS 19, USB-C Charge Cable (1m), Documentation.</p>
</details>
```

**备注：** summary 后的 `›` 图标 open 状态旋转 90°；过渡 var(--duration-sm)。

## 26. Admonition 提示

**用途：** 文档正文中的 info / warning / success / danger 提醒。
**关键 class：** `.apple-admonition` `.apple-admonition--info` `.apple-admonition--warning` `.apple-admonition--success` `.apple-admonition--danger`
**示例：**

```html
<aside class="apple-admonition apple-admonition--info">
  <strong>Note.</strong> Works on iOS 18 and later.
</aside>
<aside class="apple-admonition apple-admonition--warning">
  <strong>Warning.</strong> This action cannot be undone.
</aside>
<aside class="apple-admonition apple-admonition--success">
  <strong>Success.</strong> Your order is confirmed.
</aside>
<aside class="apple-admonition apple-admonition--danger">
  <strong>Danger.</strong> Deleting removes all data.
</aside>
```

**备注：** 左侧 3px 色条：info = link 蓝、warning = system-orange、success = system-green、danger = system-red；底色均为 `--apple-bg-alt`。

## 27. Empty / 404 空状态

**用途：** 无结果 / 404 页。
**关键 class：** `.apple-container` `.apple-link`
**示例：**

```html
<section class="apple-section" style="text-align:center;">
  <div class="apple-container" style="max-width:560px;">
    <h1>We can't find that page.</h1>
    <p class="apple-lead">Use the links below to find what you're looking for.</p>
    <p>
      <a class="apple-link">Go to Apple homepage</a> &nbsp;
      <a class="apple-link">Browse the Store</a>
    </p>
  </div>
</section>
```

**备注：** 居中对齐，不使用插画；至少提供两个 `.apple-link` 指向主入口。
