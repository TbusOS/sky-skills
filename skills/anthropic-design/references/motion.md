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

---

## Scenario recipes

canonical 没覆盖的动画场景。遇到时按表执行，不要凭感觉拼。

### M1 · Hero 大块文案进入

```
触发: 页面加载 → hero 段标题 + 副标 + CTA 入场
duration: var(--duration-lg)        700ms
easing:   var(--ease-anth)
transform 起点: translateY(24px)    （不要 scale 起点 0；起 0 视觉跳跃太大）
transform 终点: translateY(0)
opacity:  0 → 1
stagger:  hero h1 → 0ms / lead → 80ms / CTA → 160ms
```
- 等同 `.anth-reveal` + IntersectionObserver；hero 段是初次可见，无需 IO，可直接 `.is-visible` 在 `<body>` 添加 class
- 不要 scale > 1.05；anthropic 几乎不用 scale entrance

### M2 · 列表 / 卡片 stagger 进入

```
触发: 滚到视口 → 3-4 张卡片依次淡入
单元素 duration: var(--duration-md)  400ms
stagger delay:   80ms（已是 motion.md §入场模式默认值）
easing: var(--ease-anth)
transform: translateY(24px) → 0
```
- 5 张以上的 stagger：delay 降到 60ms（不然末尾元素入场过晚）
- 同一行卡片同时进入（不 stagger 行内），跨行才 stagger

### M3 · 按钮 / 链接 hover

```
duration: var(--duration-sm)         240ms
easing:   var(--ease-anth)
properties: background-color, color, transform
.anth-button hover:
  background: var(--anth-orange-hover)
  transform:  translateY(-1px)        （不要 scale > 1.02；anthropic 是细微位移不放大）
```
- 不要 box-shadow 弹起；anthropic hover 是色变 + 1px 上移，不是 elevation
- 不要 hover 改 border-radius

### M4 · 卡片 hover

```
duration: var(--duration-sm)
properties: box-shadow, transform
hover:
  box-shadow: var(--shadow-pop)       （var(--shadow-card) → var(--shadow-pop)）
  transform:  translateY(-2px)
```
- 不要 hover 时改 background；保持 white card identity

### M5 · 链接箭头 `→` 推进

```
.anth-link 的 → 默认状态: margin-left:4px
hover: margin-left:8px  duration:var(--duration-sm) easing:var(--ease-anth)
```
- 不要箭头改色，只移位
- 已写入 `assets/anthropic.css`，新模板直接 class 即可

### M6 · 模态 / 抽屉 进入

```
overlay (背板):
  duration: var(--duration-md)        400ms
  opacity: 0 → 1
  background: rgba(20,20,19,0.45)
dialog (内容):
  duration: var(--duration-md)
  easing:   var(--ease-anth)
  transform 起点: translateY(16px) scale(0.98)
  transform 终点: translateY(0) scale(1)
  opacity:  0 → 1
退出: 起止反转，duration 缩到 var(--duration-sm) 240ms
```
- 不要从底部 slide-up 整屏（那是 mobile sheet 模式，anthropic web 用 center dialog）
- 不要 backdrop-filter blur（anthropic 用半透明实色背板，不毛玻璃）

### M7 · Toast 通知

```
进入: bottom-right 滑入
  duration: var(--duration-md)
  transform: translateY(16px) → 0 + opacity 0 → 1
停留:  3500ms（错误 toast 6000ms）
退出:  duration: var(--duration-sm) opacity → 0 + translateY(0 → -8px)
```

### M8 · Loading / Skeleton

```
shimmer 横扫:
  duration: 1400ms（不在 sm/md/lg 三档里 —— skeleton 是慢速循环）
  easing:   linear
  background: linear-gradient(90deg,
              var(--anth-bg-subtle) 0%,
              #f5f3ec 50%,
              var(--anth-bg-subtle) 100%)
  background-size: 200% 100%
  animation:  shimmer 1.4s linear infinite
```
- 不要 spinner 转圈（anthropic 用 skeleton block 占位）
- 长任务（> 3s）配旁注文字 "Generating response…"，不要进度条

### M9 · 进度 / 数值滚动

```
数字 count-up（dashboard / stat 卡）:
  duration: var(--duration-lg)
  easing:   var(--ease-anth)
  起点 0 → 终点目标值
  小数位与终点一致（不要先整数再补小数）
```
- 不要 odometer 翻牌效果（anthropic 是平滑数字插值）

### M10 · 页面 / 路由切换（SPA）

```
duration: var(--duration-sm)（240ms — 路由切换要快，不要让用户等动画）
opacity: 当前 1 → 0 → 新页 0 → 1（无 transform）
```
- 不要 slide 整页（破坏空间感）
- 不要 cross-dissolve > 300ms

---

## Scenario decision tree

```
要做动画？
├─ 元素首次进入视口 → §入场模式 .anth-reveal 或 M1/M2 recipe
├─ hover/focus 反馈 → M3 (button) / M4 (card) / M5 (link arrow)
├─ 状态过渡（modal/toast/loading） → M6 / M7 / M8
├─ 数字 / 进度 → M9
├─ 路由切换 → M10
└─ 都不是 → 不要动。anthropic 是克制美学，静态优先。
```
