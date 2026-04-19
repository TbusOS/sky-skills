# Anthropic Responsive

## 断点

```
mobile:   ≤768px
tablet:   769–1024px
desktop:  ≥1025px
```

## 容器 max-width

| Variant | Value | 用途 |
|---|---|---|
| `.anth-container--narrow` | 720px | 长文正文 / 表单 |
| `.anth-container` | 960px | 标准页面 |
| `.anth-container--wide` | 1200px | 仪表盘 / 数据报告 / enterprise / nav / footer |

## 字号缩放

`anthropic.css` 底部媒体查询：

| 元素 | ≤768 | 769–1024 | ≥1025 |
|---|---|---|---|
| h1 | 36 | 48 | 56 |
| h2 | 28 | 40 | 40 |

## Grid 列数

| 版式 | ≤768 | 769–1024 | ≥1025 |
|---|---|---|---|
| Editorial cards | 1 | 2 | 3 |
| Footer | 2 | 3 | 6 |
| Logo wall | 3 | 4 | 6 |
| Pricing | 1 | 2 | 3 |

`anthropic.css` 已为 `.anth-footer-grid` / `.anth-logo-wall` 预设 mobile / tablet 媒体查询。其它（编辑卡 / pricing）需在模板里自行添加 grid-template-columns 媒体查询。

## `<picture>` 示例

```html
<picture>
  <source srcset="hero-mobile.jpg"  media="(max-width:768px)">
  <source srcset="hero-tablet.jpg"  media="(max-width:1024px)">
  <img    src="hero-desktop.jpg" alt="" />
</picture>
```

## 内边距

```
mobile  (≤768)  : 容器 padding 0 16px，section padding-block 48px
tablet/desktop  : 容器 padding 0 24px，section padding-block 64px
```

`.anth-section` 已包含响应式 `padding-block`（`var(--space-7)` 移动 / `var(--space-8)` 桌面）。

## Nav 移动端

`.anth-nav` 仅提供桌面态（64px sticky）；≤768px 时建议在模板里改为汉堡 + 全屏 overlay 菜单。
