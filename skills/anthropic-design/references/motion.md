# Anthropic Motion

## 缓动

- `--ease-anth` (`cubic-bezier(0.25, 1, 0.5, 1)`) —— 默认入场、hover、tab 切换。

Anthropic 只用一条缓动曲线；克制、统一。

## 时长

- `--duration-sm` 240ms：hover、按钮态、tab 切换、链接颜色
- `--duration-md` 400ms：卡片入场、轮播 viewport 平移
- `--duration-lg` 700ms：reveal 入场、视频 fade-in、大块页面过渡

## 入场模式（IntersectionObserver + `.anth-reveal`）

`anthropic.css` 已为 `.anth-reveal` 定义 opacity 0 → 1 + translateY(24px → 0) 的过渡，只需切换 `.is-visible` 类即可触发。

```javascript
const io = new IntersectionObserver(entries => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('is-visible'), i * 80);
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.anth-reveal').forEach(el => io.observe(el));
```

每个元素延迟 80ms 形成轻微 stagger；只触发一次。

## prefers-reduced-motion

`anthropic.css` 已内置全局禁用：

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
```

无需在模板里再处理。

## 动画节点密度

一页通常只有 3-5 个 `.anth-reveal`：hero 标题 / 段落 / 主 CTA / 第一行卡片。其余靠静态层级。

## 禁止

- 反弹 / 弹簧 / rotate 入场
- 大幅缩放（> 1.1）
- 每个元素都动 —— 视觉噪声
- `transition: all` —— 用显式属性列表（`transition: opacity, transform`）
- 自动播放视频带声音
- 视差滚动 + 旋转组合
