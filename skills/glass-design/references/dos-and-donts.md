# Glass Do & Don't

> 核心教义一句话:**有品位的 aurora 是"背景光场",slop 渐变是"前景填充"。
> 渐变永远在内容后面,不在内容里面。**
> 紫色渐变在别的 skill 里是 AI slop 信号;glass 偏偏要用彩色光晕 ——
> 所以这条线必须画得比谁都清楚。

## ✅ Do

- 深藏青画布(`#0B1020`),不是纯黑 —— blur 在藏青上有反射感,在纯黑上发闷
- 每视口最多 3 个 blob,光预算前置:hero 最亮,往下逐段收
- 前景彩色只有一个:实心 cyan(eyebrow / 按钮 / hairline / glow 节点)
- 文字落玻璃面板(R1);直接落光场的只有 ≥32px 的 display 大字(hero h1 / pull-quote)—— "玻璃—无玻璃"的节奏本身是设计语言
- hover 才有 sheen,进视口才 reveal,每视口至多一个 tilt —— 动效是标点不是正文
- 双主题 SVG 用 `.glass-svg-*` 类上色
- 用 token,零写死 hex
- 零 italic:Space Grotesk 没有 italic 字形,这是 glass 与其他四个 skill 的差异点之一 —— 层级全靠 size / weight / spacing

## ❌ Don't

| Don't | Why |
|---|---|
| 渐变文字(`background-clip:text`)、渐变按钮、渐变标题 | **AI slop 第一信号**。彩色只以"远处光源"存在;前景只有实心 cyan 一色 |
| violet `#A78BFA` / pink `#F472B6` 做文字、图标、按钮 | 它们只活在 blob 与折射环里;上前景就是"紫色渐变 slop" |
| 一个视口 >3 个 blob,或 blob 总覆盖 >60% | 光场变彩虹泳池;光稀缺才贵 |
| blob 压在文字面板正下方(核心区) | R1 的几何前提;contrast 检查像素兜底会抓 |
| blob 用官方四色之外的颜色 | 彩虹 slop + cross-skill 串味双杀 |
| 玻璃叠玻璃 >2 层 | blur 叠加 = 噪糊 + 性能塌 |
| `feTurbulence` / `feDisplacementMap` 折射 | Chromium 下 backdrop 不进 SVG filter;非确定渲染炸截图检查(glass-material §2) |
| blur <8px 或 >32px | <8 假玻璃,>32 磨砂塑料 |
| 正文(<28px)直接落 aurora | R1;visual-audit contrast 必抓 |
| cyan 文字用在 light 模式(写死 hex) | 白底 1.6:1;必须走 `--glass-accent-ink` token |
| 白字放在 cyan 按钮上 | 1.9:1 fail;按钮配方锁死 `--glass-button-ink` 深字 |
| 每张卡都 tilt / 都扫光 / 全页 reveal | 动画预算;全员起舞 = 廉价 |
| 不透明面板 + blur 声明装玻璃 | `glass-fake-glass` 检查(error):blur 必须真的透出背景 |
| reveal 初始态裸写 `opacity:0` | 绕过冻结门控;`glass-reveal-stuck` 检查(error)+ 全页截图下半截空白 |
| count-up 终值只在 JS 里 | 无 JS / 冻结下页面是错的;`glass-countup-mismatch` 检查 |
| SVG 墨色写死白 fill | light 模式隐形(2026-06-11 smoke 页实测命中);用 `.glass-svg-*` |
| 借 apple 蓝 / anthropic 橙 / ember 金 / sage 绿 | cross-skill-smell 互查已登记四色 |
| `transition: all` / 硬编码 hex | 性能 + 主题切换断裂 |

## 📋 发布前 checklist

```bash
# 1) 结构(含 glass 双主题静态检查)
python3 skills/design-review/scripts/verify.py --skill=glass <page.html>
# 2+3) 渲染审计 + 截图 —— glass 自动 dark+light 双跑
bin/design-review --skill=glass <page.html>
# 4) 口味检查
bin/design-review --skill=glass --critic <page.html>
```

任何 error = 任务没完成。glass 专属检查:`glass-reveal-stuck` / `glass-fake-glass` /
`glass-countup-mismatch` / `glass-cta-obstructed`(均 visual-audit 内,kind 同名)。

## 📐 质量底线

- **Hero**:eyebrow + h1 + lead + 双按钮 + hairline;≥3 个实心 cyan 元素进 top 1440×500(brand-presence ≥0.2%)
- **featured diagram**:渲染宽 ≥1100px(`glass-container--wide` 整行),SVG 源码字号 ≥11,节点用页面同款玻璃材质
- **stat**:Space Grotesk 700 tabular-nums,64-96px,终值在 markup
- **卡片**:满版内容,不要 72px 小图标居中充数(§C.1)
