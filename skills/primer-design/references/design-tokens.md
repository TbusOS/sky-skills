# primer · design tokens

全部 token 定义在 `assets/primer.css` Section A。**页面里不写 hex** —— 例外只有一个:
SVG 平涂可以直接写调色板里的 hex(sprint-contract §7 允许 `var(--primer-*)` 或调色板 hex),
因为 `fill="var(…)"` 这种写法在各浏览器里不稳。

**单主题。** primer 没有暗色变体 —— 这套美学的全部前提是"一张印出来的纸,能凑着别人的肩膀读"。
想要暗底展示页就是选错 skill 了(用 glass 或 eclat)。

## §1 七个注册 token

| token | 值 | 用在哪 | 纸上对比度 |
|---|---|---|---|
| `--primer-paper` | `#fdfaf3` | 页面纸白底 | — |
| `--primer-ink` | `#243244` | 标题 + 正文,深墨蓝灰 | 12.48:1 |
| `--primer-violet` | `#7a5cd6` | **招牌色**。超大圆号数字的圈、比喻卡边框、字标的点、hero 主插画的主色 | 4.65:1(任何字号都合法) |
| `--primer-violet-ink` | `#5b3fbf` | 小号强调文字、正文链接、圆号数字本身 | 6.93:1 |
| `--primer-marker` | `#ffd23f` | 马克笔黄高亮(`.primer-mark`)。**只此一档** | 墨压在黄上 9.01:1 |
| `--primer-go` | `#3aa66b` | "懂了"绿:回顾条的左边、勾的圆底。**只作图形** | 2.94:1 —— 永远不承载文字 |
| `--primer-line` | `#e8e2d4` | 发丝分隔线,纸白同族 | — |

三条随之而来的硬规矩:

1. **紫要更重就往深调,不往浅调,更不淡化墨色。** 紫字读着薄 → 换 `--primer-violet-ink`。
2. **黄只有一档。** 见 `dos-and-donts.md` §2 的铁律和实算。
3. **绿色区域里的文字仍是 `--primer-ink`。** 绿在纸上只有 2.94:1,它是勾和轨道的颜色,不是字的颜色。

### 三个刻意豁免(不写进 primer 的 `forbiddenColors`)

visual-audit 的串味匹配是**逐通道 |Δ| ≤ 55 三通道同时成立**才算命中。按这个规则实算,
下面三家的招牌色和 primer 的正常用色必然重叠 —— 列进禁忌表就是每页必误报,所以刻意豁免
(先例:eclat / atelier 豁免 anthropic 橙):

| 豁免谁 | 一句话原因 |
|---|---|
| ember 金 `#c49464` | 马克笔黄压深墨字的抗锯齿混色(25% 混合点 ≈ 200,170,64)对它 Δ=(4,22,36),三通道全中 |
| sage 绿 `#97B077` | "懂了"绿往纸白混 ~45% 时 Δ=(4,30,55) 命中;浅绿 tint 卡片同理 |
| lectern 蓝 `#2f5bb0` + `#1d3a6e` | 双重命中:深紫强调字对 `#2f5bb0` Δ=(44,28,15);而 `--primer-ink` 本身对 `#1d3a6e` Δ=(7,8,42) —— **正文墨色就在 lectern 深藏青的容差里** |

豁免只是"不报警",不是"可以用"。真去用 ember 金或 lectern 蓝当强调色,机器抓不到,critic 会抓。

## §2 派生中性色与 tint(不注册)

| token | 值 | 用在哪 |
|---|---|---|
| `--primer-card` | `#ffffff` | 卡面(比喻卡、圆号圈的底)· 墨在上面 13.01:1 |
| `--primer-mut` | `#55617a` | figcaption、meta、次级说明 · 纸上 5.97:1 / 卡上 6.22:1 |
| `--primer-violet-soft` | `#efe9fc` | 术语气泡的底(含气泡尾巴的内三角)· 墨在上面 10.98:1。**比喻卡的底是白的**,不是这个 —— 卡靠 3.4px 的紫边框立住,再加淡紫底就成了一块色块 |
| `--primer-go-soft` | `#e9f5ee` | 回顾条的底。是 tint,不是字色 |

**次级文字也是实值,不是 `rgba` 淡化的墨。** 原因见 §7。

## §3 字栈

| token | 栈 | 用在哪 |
|---|---|---|
| `--primer-font-display` | `"Fredoka", "Noto Sans SC", "PingFang SC", system-ui, sans-serif` | h1/h2/h3、圆号数字、比喻卡开场语、回顾条标题、字标 |
| `--primer-font-body` | `"Nunito", "Noto Sans SC", "PingFang SC", system-ui, sans-serif` | 正文、figcaption、按钮 |
| `--primer-font-mono` | `"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace` | 只给 `.primer-term-jargon`(术语那一半) |

**Fredoka 零 CJK 覆盖** —— 一句中文展示字实际是 Noto Sans SC 在排。所以展示字号压在 ~60px 以内:
再大,"圆体拉丁 + 非圆体中文"的错配就看得出来了。跨 skill 规则 §H 的配对行按这个记。

primer 的 `forbiddenFonts`:`Fraunces` / `Instrument Serif` / `Poppins` / `Lora` / `Space Grotesk`。
反向,`Fredoka` 进其余 8 套的 `forbiddenFonts`。

## §4 字号阶梯

按 `assets/primer.css` Section B 的实值。**需要表里没有的字号,就近取表里的**。

| 位置 | 值 | 备注 |
|---|---|---|
| h1(hero 大标题) | `clamp(36px, 5.2vw, 60px)` / 行高 1.08 | display 字,600 |
| h2(每节标题) | `clamp(26px, 3.2vw, 36px)` / 行高 1.18 | display 字,600 |
| h3 | `clamp(19px, 2vw, 22px)` / 行高 1.3 | display 字,500 |
| hero lede(`.primer-hero-lede`) | `clamp(17px, 1.6vw, 20px)` | **全页只有这一处**是"读本大正文"那一档;色是 `--primer-mut`,`max-width: 40ch`(手机取消) |
| 正文基准 | `17px` / 行高 1.66 / `max-width: 62ch` | `.primer-body`;手机(≤768px)降到 `16.5px` |
| 比喻卡正文(`.primer-analogy-body p`) | 跟基准走:`17px`(手机 16.5px)· `max-width: 54ch` | CSS 只给它收窄了行宽,**没有加大字号** —— 比喻卡的份量来自 3.4px 的紫边框和插画,不是来自字号 |
| 圆号数字 | `clamp(40px, 4.4vw, 56px)`,装在 `clamp(72px, 7.5vw, 96px)` 的圈里 | 手机上固定 34px / 64px |
| 回顾条标题 | `clamp(20px, 2.2vw, 25px)` | |
| `.primer-term-plain`(人话那半) | `15.5px` | |
| figcaption / `.primer-term-jargon` | `14.5px` / `14px` | figcaption `max-width: 68ch` |
| 语言切换钮 | `13px` / 700 | |
| SVG 内文字 | **源尺寸 ≥13px**,且渲染后 ≥10px | 见 `illustration-craft.md` §6 |

**和设计书草案的两处出入**(草案先写、CSS 后定,以 CSS 为准):

- 草案写"正文 18–20px"。实际:基准 17px(手机 16.5px),而 17→20px 那一档
  **只落在 `.primer-hero-lede` 一个位置上**(primer.css:201)。比喻卡正文没有自己的字号,
  它跟基准走 —— primer.css:260 给 `.primer-analogy-body p` 的只有 `max-width: 54ch`。
  绘本的"大字正文"就出现在 hero 那一句,不铺到通篇 —— 通篇 19px 会把每节的正文块顶到插画的高度,
  一屏一概念就守不住了。
- 草案写圆号数字 `clamp(72px, 10vw, 128px)`。实际 `clamp(40px, 4.4vw, 56px)` 装在 72–96px 的圈里 ——
  这个值是拿 concept canonical 的截图定的:最早的 40px-in-78px 挨着 36px 的 h2 看着像列表圆点,
  不像招牌圆号,放大到 56px-in-96px 才有绘本感;草案的 128px 仍然不要 ——
  那个尺寸在 1080 工作档里会跟插画抢一节的主体位,数字是路标,不是主角。

## §5 间距阶梯

`--primer-space-1..9` = **4 / 8 / 14 / 20 / 28 / 40 / 56 / 80 / 112**

常用组合(照抄,别新造):

- 节内竖直节奏:`.primer-section` 上下 `--primer-space-8`(80px)。这个大留白**就是**"一屏一概念"的实现,不是装饰 —— 它是让第三个概念挤不进同一屏的那个东西。
- 插画上下:`--primer-space-6`(40px)
- 比喻卡:内 `--primer-space-5 / --primer-space-6`,外 `--primer-space-6`;手机上降一档
- 圆号数字和正文之间:`--primer-space-5`(28px),手机 `--primer-space-4`
- 段落上边距:`--primer-space-3`(14px)
- 栏距 `--primer-gutter` 32px,手机 20px

## §6 容器与形状

| class | 宽度 | 何时 |
|---|---|---|
| `.primer-container--narrow` | 720px | **只给正文**。别拿它裹插画 —— 720 档里 3.4px 的描边配不上任何一张需要看细节的图 |
| `.primer-container` | 1080px | 工作档,**插画住在这里**(减去 32×2 栏距 = 1016px 内容宽) |
| `.primer-container--wide` | 1280px | ≥16 个标签或 ≥3 列时**必须**升上来 |

- 修饰符不能单独出现:永远写 `class="primer-container primer-container--wide"`。
- **hero 有,而且 verify.py 会查**:`.primer-hero` 里第一个元素必须是 `.primer-container` 或
  `--wide`,用 `--narrow` 直接报错。primer 不走 atelier 的"无 hero"豁免。

形状与运动:

- 圆角:`--primer-radius-sm` 10 · `--primer-radius` 18 · `--primer-radius-lg` 26(比喻卡用 26)
- 描边:`--primer-stroke` **3.4px** 主线 · `--primer-stroke-hair` **1.8px** 只给内部细节
  (齿、缝、刻度)。⚠ 这两个值是 **SVG 用户单位**,不是渲染像素 —— viewBox 一大就被缩细。
  换算规则和实例见 `illustration-craft.md` §3,**画任何插画前先读那一节**。
- 阴影 `--primer-shadow`:两层(1px 接触影 + 26px 环境影)。alpha 只出现在阴影和发丝线上。
- 缓动 `--primer-ease` = `cubic-bezier(.22, 1, .36, 1)`。primer 的动效只有语言切换钮的 180ms
  颜色过渡,`prefers-reduced-motion` 下关掉。**读本不动。**

## §7 为什么承载文字的颜色都是实值

atelier 已经付过学费:`rgba(44,39,35,0.46)` 合成到卡面是 `#9d9996`,对比度 **2.74:1**,
axe-core 一次抓出 21 个元素,而自研的对比度检查完全没发现 —— 因为它不做图层合成。

alpha 墨色真正的问题是**作者算不出它落地是什么颜色**。所以 primer 的墨色阶梯是三个实值
(`--primer-ink` / `--primer-mut` / 卡上白底),不是一个墨色三个 alpha。上表每个值都按
**它能落到的最难的底**取(页面级文字按纸白算,tint 上的文字按 tint 算)。

axe color-contrast 是阻断项。要淡一点的层级,换 `--primer-mut`;不要给 `--primer-ink` 加 alpha。
