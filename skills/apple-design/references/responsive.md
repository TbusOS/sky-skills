# Apple Responsive

## 断点（实测 apple.com）

```
mobile:   ≤734px
tablet:   735–1068px
desktop:  ≥1069px
```

## 容器 max-width

| Variant | Value |
|---|---|
| `.apple-container` | 980px |
| `.apple-container--wide` | 1068px |
| `.apple-container--hero` | 1280px |
| `.apple-nav-inner` | 1024px（Apple 专门的 nav 宽度） |

## 字号缩放

见 `apple.css` 底部媒体查询：h1 从 64 → 56 → 40 随断点递减；`.apple-stat-number` 120 → 72。

## Grid 列数

| 版式 | ≤734 | 735–1068 | ≥1069 |
|---|---|---|---|
| Product lineup | 1 | 2-3 | 5 |
| Newsroom | 1 | 2 | 3 |
| Footer | 2 | 3 | 5 |
| Docs 三栏 | 单栏 | 单栏 | 240/680/240 |

## 图片

用 `<picture>` 在 hero 位置给不同断点的 1x/2x 资源：

```html
<picture>
  <source srcset="hero-mobile.jpg" media="(max-width:734px)">
  <source srcset="hero-tablet.jpg" media="(max-width:1068px)">
  <img src="hero-desktop.jpg" alt="" />
</picture>
```

## Nav 移动端

≤734px 时顶栏应切换为汉堡 + 全屏 overlay 菜单（apple.css 仅提供桌面态，移动态由模板自行实现）。
