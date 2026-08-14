# atelier · design tokens

全部 token 定义在 `assets/atelier.css` Section A。**页面里不写任何 hex。**

## 品牌常量(两个主题相同)

| token | 值 | 用在哪 |
|---|---|---|
| `--atl-rose` | `#DD4F92` | 身份色。品牌闸匹配这个 |
| `--atl-coral` | `#F5854F` | 玫红的暖色搭档,**只在渐变里出现** |
| `--atl-amber` | `#F6B24C` | 第三个色,只用于分类构成(饼图切片) |
| `--atl-grad` | `linear-gradient(158deg, coral, rose)` | 圆球 / 柱填充 / 进度条 / 品牌标记 |
| `--atl-grad-soft` | 同上,16% alpha | `--soft` 圆球底、头像底 |

⚠ **渐变不承载文字**,原因见 `dos-and-donts.md` §4。

## 亮色主题(canonical)

| token | 值 | 说明 |
|---|---|---|
| `--atl-wall-1/2/3` | `#F7D9C4` / `#F3C7CE` / `#FBF3EA` | 壁纸三停:桃 / 玫红尘 / 奶油 |
| `--atl-wall-base` | `#F6E4D6` | 壁纸底色 |
| `--atl-ink` | `#2C2723` | 暖炭色,**不是纯黑** |
| `--atl-ink-2` / `-3` | 0.68 / 0.46 alpha | 次级 / 静音文字 |
| `--atl-shell-bg` | `rgba(255,253,251,.52)` | 外壳玻璃 |
| `--atl-rail-bg` | `rgba(255,252,249,.40)` | 侧栏,比壳更透 |
| `--atl-card-bg` | `rgba(255,254,252,.80)` | 数据卡 |
| `--atl-card-2-bg` | `rgba(255,255,255,.94)` | 表格 / 展开态 |
| `--atl-ink-card-bg` | `#211C1A` | 那一张暗卡 |
| `--atl-track` | `rgba(88,62,50,.11)` | 柱状图轨道 / 进度条底 |
| `--atl-accent-ink` | `#C13877` | **玫红作为文字**(`#DD4F92` 在白底只有 3.4:1) |
| `--atl-up` / `--atl-down` / `--atl-warn` | `#1F8A5B` / `#C6453F` / `#B4761A` | 判断色,不是系列色 |

## 暗色主题(warm-night)

浓缩咖啡色,**不是藏青**。壁纸保留珊瑚 / 玫红停位,只翻明度。

两个必须知道的翻转:

1. `--atl-ink-card-bg` 翻成**奶油** `#F7EFE9`。这一笔是"一张卡打断明暗节奏",不是"一张卡是黑的"。
2. `--atl-accent-ink` 变亮成 `#F58FB6`(深棕上要过 AA)。因此 `.atl-btn--accent` 的**文字**
   翻成 `--atl-ink-inv`,而不是继续用白色 —— 否则白字压在亮玫红上。

## 尺度

- 间距 `--space-1..10`:4 / 8 / 12 / 16 / 20 / 28 / 40 / 56 / 80 / 112
- 圆角:`xs` 8 · `sm` 12(控件)· `md` 20(卡)· `lg` 28(外壳)· `pill`
  **应用窗口比文档更圆** —— 28 是这套语言的招牌半径。
- 缓动:`--ease-atl` 常规;`--ease-spring` 只给开关的滑块
- 时长:`xs` 140 / `sm` 240 / `md` 520 / `lg` 900

## 容器档位

| class | 宽度 | 何时 |
|---|---|---|
| `.atl-page--narrow` | 920 | 登录 / 单栏表单 |
| `.atl-page` | 1280 | 工作档 |
| `.atl-page--wide` | 1440 | **必须**:侧栏 244 + 4 列 KPI |

**没有 hero 档。** 应用没有 hero。
