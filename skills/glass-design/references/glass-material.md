# Glass Material — 材质物理学(glass-design 独有文档)

> 这份文档定义"玻璃"本身:三层面板配方、折射环、aurora 光场。
> 其他 skill 没有等价物 —— 玻璃就是这个 skill 的身份。

## 1. 三层面板(tier table)

| 层级 | class | 用途 | dark 配方 | light 配方 |
|---|---|---|---|---|
| **Tier 1 主面板** | `.glass-panel` | hero mock、图表大板、featured diagram | bg `rgba(255,255,255,0.08)` · blur 28px saturate 185% **brightness 1.12** · border `rgba(255,255,255,0.17)` · radius 24 · 外影 + inset 顶高光 + 内透光 `inset 0 0 40px rgba(255,255,255,0.03)` | bg `rgba(255,255,255,0.62)` · blur 20px |
| **Tier 2 卡片** | `.glass-card` | gallery 卡、KPI 卡、feature 卡 | bg `rgba(255,255,255,0.07)` · blur 20px saturate 170% brightness 1.1 · border `rgba(255,255,255,0.13)` · radius 18 | bg `rgba(255,255,255,0.55)` |
| **Tier 3 浮层** | `.glass-overlay` / `.glass-nav` | nav、tooltip、悬浮 chrome | bg `rgba(13,18,32,0.62)`(更实——保字)· blur 32px saturate 160% brightness 1.06 | bg `rgba(248,250,253,0.80)` |

硬规则:

- **blur 合法区间 8–32px**。<8 = 假玻璃,>32 = 磨砂塑料 + 合成性能塌。
- **brightness 提亮是材质的一部分**(1.06–1.12):透过玻璃的背景要比裸背景亮——没有提亮的 blur 是磨砂,不是 iPhone 那种发光的玻璃。
- **叠层上限 2**:panel 内嵌 card 封顶。卡内再开第三层 blur,视觉读不出层级、只读出脏。
- **light 模式白面板 alpha ≥ 0.55**,低于即可读性违规(R5)。
- 一切配方走 token(`--glass-panel-bg` 等),页面里**零写死 hex/rgba**。

## 2. 折射环(refraction ring)

液态玻璃的"边缘折射感"= `.glass-panel::before` / `.glass-card::before` 的 1px 渐变描边环:
`linear-gradient(135deg, 白 0.65 → 白 0.08 @40% → cyan 0.38 @100%)` + mask-composite 抠出环形。
语义:光从左上进入,带 cyan 色散从右下离开。

**内部色散**(2026-06-11 材质升级):面板 background 第一层是一条 ≤7% alpha 的对角
光泽渐变(白入射 → 透明 → cyan/violet 微色散),让玻璃在纯色画布上也读得出材质
——iPhone 玻璃自带光泽,不全靠背景有光。它和折射环同属材质物理,不算"装饰渐变";
light 主题下色散只用白(彩色 cast 在白底上读作脏)。

**为什么不用 `feTurbulence`/`feDisplacementMap`(否决,写死):**

1. Chromium 里 backdrop 内容不参与 SVG filter 合成 —— 做不出真折射,只能扭曲面板自身;
2. 多卡片场景性能崩;
3. 渲染非确定,截图检查(像素回归)直接炸。

折射环 + inset 顶部白高光(`inset 0 1px 0 var(--glass-highlight)`)已经给足 specular 暗示。

## 3. Aurora 光场

- `.glass-aurora`:`position:fixed; inset:0; z-index:-1; pointer-events:none`,全页唯一光晕层。
- `.glass-blob`:radial-gradient alpha 衰减直接画光(**不用 `filter:blur`** —— 零滤镜成本、跨引擎确定)。
- 四个颜色变体:`--cyan`(核心 alpha 0.52)/ `--violet`(0.42)/ `--pink`(0.33)/ `--indigo`(0.48)。
- 尺寸 / 位置 per-page 内联 style;标准 landing hero 配置:cyan 720px 左上 + violet 560px 右中 + pink 或 indigo 480px 下方。
- 漂移动画:transform-only,26/34/42s(互质防同步),`alternate`;冻结时停在 0% 帧。

**几何铁律:**

- 每视口 **≤3 个** blob;blob 总覆盖 ≤60% 视口 —— 光要稀缺才贵。
- **blob 核心区(内 40% 半径)不得压在任何文字面板 bbox 之下** —— 这是面板配方能保住 WCAG 对比度的几何前提。
- pink 每页 ≤1 个。
- 阅读型页面(dashboard / data-report)给 `<body class="glass-page--calm">`:blob opacity ×0.55,光让位于数据。
- light 模式 blob 自动 ×0.6(`--glass-blob-alpha`)。

## 4. 可读性硬规则(R 系列)

| # | 规则 | 检查 |
|---|---|---|
| R1 | <28px 文字要么在玻璃面板内,要么落在**无 blob 核的纯画布区**(画布近纯色,安全);blob 核照亮的区域上只允许 ≥32px 全不透明 display 文字 | visual-audit contrast(像素兜底) |
| R2 | 主文字 dark `#F4F7FF` / light `#0D1220`,只走 `--glass-ink` | token 纪律 |
| R3 | 次级文字下限 `--glass-ink-2`(dark rgba 0.74 / light 0.72);更淡的 `--glass-ink-3` 只给 caption/metadata | contrast 检查 |
| R4 | accent 做文字一律 `--glass-accent-ink`(light 自动切 #0E7490);手写 `#22D3EE` 当文字色 = light 模式必挂 | contrast 检查 |
| R5 | light 模式白面板 alpha ≥ 0.55 | 文档级 |
| R6 | 按钮 = cyan 填充 + `--glass-button-ink` 深字(9.2:1);白字在 cyan 上 1.9:1,禁 | contrast 检查 + `.glass-nav a.glass-button` 预置防御(known-bugs 1.24) |

## 5. 双主题契约

- `<html data-theme="dark">` 显式声明(verify 8c 强制);dark 是品牌正典态,light 是 iOS-frost 变体。
- 公开页必须有 `.glass-theme-toggle`(glass.js 一行切换 + localStorage)。
- 审计:三道机械检查对 glass 自动 dark + light 双跑;brand-presence 只在 dark 检(light 下光晕覆盖率是另一个量级)。
- 组件只引用语义 token;凡是"在两个主题下应该不同"的颜色,必须有对应 token,没有就加 token,不要写死。
