# Glass Motion — 动画体系与冻结契约

> glass 是五个 skill 里唯一带富 JS 动画的。它能进三道机械检查体系的前提是
> **冻结契约**:一切动画的终态 = 静态 markup,三条独立路径都能到达终态。

## 0. 冻结契约(先读这个)

任一条件为真,glass.js 设 `html[data-motion="off"]` 且不安装任何动画模块:

1. `prefers-reduced-motion: reduce`(媒体查询 —— 审查脚本用 Playwright `reducedMotion:'reduce'` 触发它)
2. URL hash 含 `freeze`(`page.html#freeze` 手动调试用)
3. `<html data-motion-freeze>` 静态属性

终态语义(机器检查逐条验收):

| 动画 | 终态 | 检查 |
|---|---|---|
| reveal | 元素直接可见(初始隐藏门控在 `html.js-enabled:not([data-motion="off"])` 后面;无 JS 时页面天然全可见) | `glass-reveal-stuck`(error) |
| count-up | markup 文本就是终值,JS 只是从 0 动画到它 | `glass-countup-mismatch`(warn) |
| path-draw | dashoffset 永不被设置,路径全绘 | 截图像素 |
| blob 漂移 | `animation:none` 停在 0% 帧 | 截图像素 |
| tilt / parallax | 模块不安装 | — |

验收命令:连截两张全页 PNG 必须**字节一致**(2026-06-11 实测通过)。

## 1. 动画清单

| 动画 | 触发 | 写法 | 时长 / easing | 预算 |
|---|---|---|---|---|
| 光晕漂移 | CSS keyframes 自动 | `.glass-blob`(自带) | 26/34/42s ease-in-out alternate,transform-only | ≤3 blob/视口 |
| 滚动浮现 | IO threshold 0.15 | `data-reveal` | 640ms `--ease-glass`,同组 stagger 70ms × ≤5 | 每 section 一组,不要全页每个元素都 reveal |
| hover 抬升 + 扫光 | `:hover`(`pointer:fine` 限定) | `.glass-card`(自带) | 抬升 240ms;sheen 单程 700ms | 仅卡片 |
| 3D tilt | pointermove + rAF | `data-tilt` | max 6°,perspective 900,回弹 400ms | **每视口 ≤1 个元素**(hero mock 或 featured 卡) |
| SVG path-draw | IO 进视口 | `svg[data-draw]` | 1100ms ease-out,逐条 stagger 90ms,≤8 条 | 每页 ≤2 张图开 draw,集中给 featured |
| count-up | IO threshold 0.4 | `data-count-to="N"`(+ 可选 `data-count-prefix/suffix`) | 1200ms easeOutExpo,tabular-nums | stat 数字专用 |
| 视差 | scroll + rAF | `data-parallax="0.08"` | 位移 clamp ±40px | **禁用于文字块**,只给装饰层 |
| 液态光标 v2(真折射水珠) | pointermove + rAF 弹簧 + backdrop-filter 位移透镜 | 自动(`<html data-no-liquid>` 退出;`.glass-cursor-toggle` 运行时切换,localStorage `sky-cursor`) | 弹簧 k=0.22 d=0.72;6 档等面积拉伸椭圆;快划拖连续水流(失稳缩颈断珠,920ms 蒸发);停驻 140ms 回抽尾流;双击爆裂→450ms 后汇聚;`data-water-refr`(默认 52)/`data-water-tint`(默认 12)可调 | 仅 hover+fine 指针 + `backdrop-filter:url()` 支持;light 主题自动换高光烘焙;冻结下不安装,截图永远看不到它 |

## 2. 禁项

- 反弹 / 弹簧 / rotation 入场 —— glass 的 easing 只有 `cubic-bezier(0.22,1,0.36,1)`
- `transition: all`
- 每张卡都 tilt / 都扫光 —— 全员起舞 = 廉价
- scale > 1.15 的 hover 放大
- 用 JS 写 `el.style.opacity = 0` 做初始态(绕过冻结门控,`glass-reveal-stuck` 必抓)
- 动画里改 layout 属性(width/height/top)—— 只动 transform / opacity

## 3. 写法范式

```html
<!-- 浮现:一组卡片,JS 自动按兄弟顺序 stagger -->
<article class="glass-card" data-reveal>…</article>
<article class="glass-card" data-reveal>…</article>

<!-- count-up:终值写死在 markup,千分位照常写 -->
<span class="glass-stat-number" data-count-to="12847">12,847</span>
<span class="glass-stat-number" data-count-to="99.98" data-count-suffix="%">99.98%</span>

<!-- featured 图开 path-draw;tilt 只给 hero mock -->
<svg data-draw role="img" aria-label="…">…</svg>
<div class="glass-panel" data-tilt>…</div>
```

JS 引擎在 `assets/glass.js`,一份源,canonical / demos 相对路径引用,**不要每页拷一份**(拷贝漂移)。lang-toggle 是例外:按全站契约 inline 在每页(sprint-contract §5)。
