# Apple Motion

## 缓动

- 默认：`--ease-apple-out` (`cubic-bezier(0.25, 1, 0.5, 1)`) —— 用于入场、hover。
- 平滑：`--ease-apple` (`cubic-bezier(0.42, 0, 0.58, 1)`) —— 用于持续中性过渡。

## 时长

- `--duration-sm` 240ms：hover、按钮态、tab 切换
- `--duration-md` 400ms：卡片入场
- `--duration-lg` 700ms：视频 fade-in、大块页面过渡

## 入场模式（IntersectionObserver）

```javascript
const io = new IntersectionObserver(entries => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      e.target.style.opacity = 1;
      e.target.style.transform = 'translateY(0)';
      e.target.style.transition = `all 700ms cubic-bezier(0.25,1,0.5,1) ${i * 80}ms`;
    }
  });
});
document.querySelectorAll('.apple-reveal').forEach(el => {
  el.style.opacity = 0;
  el.style.transform = 'translateY(24px)';
  io.observe(el);
});
```

## prefers-reduced-motion

`apple.css` 已内置全局禁用：
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
```
无需在模板里再处理。

## 禁止

❌ 反弹 / 弹簧 / rotate 入场
❌ 大幅缩放（> 1.2）
❌ 每个元素都动 —— Apple 一页通常只有 2-3 个动画节点
❌ 使用 `transition: all`（用显式属性列表代替）
