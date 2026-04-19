# Apple Layout Patterns

六种可直接复用的版式。所有示例假定已引入 `assets/apple.css`。

## 1. Alternating sections（产品页主节奏）

白 → 浅灰 → 白 → 黑 四段，每段 80px 上下 padding，居中 980px max-width。

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

5 列并排，每列：产品图 → 产品名 → 价格 → "Learn more" 文字链。

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

1:1 图像 + 底部渐变遮罩 + 白字标题 + 日期。

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

- 大视频 replay 块（`.apple-video` + `.apple-video-play`）
- 产品公告卡 grid（4 列）
- 过往事件缩略图轮播

具体骨架见 `templates/landing-page.html` 与 `templates/nav-footer.html`。
