# primer-design · process canonical

主题:你按下回车后网页如何加载。`process` 页型的参考实现 —— "一步步发生了什么"这一问
怎么讲给完全不懂的人。生成任何 primer process 页之前先读这份,HTML 是参考实现。

内容先按 `references/explain-method.md` 的六列表拆过:每个数字都能用计算器验证
(一次心跳 ≈ 1 秒,按每分钟 60 次;2000 公里 ÷ 每秒 20 万公里 = 0.01 秒;
2MB ≈ 一首 MP3;1000 ÷ 60 ≈ 16.7 毫秒)。

## 5 个让它成立的决策

### 1. 一个比喻,而且画成一对一
全页只有"点外卖"一个比喻,第 1 节的映射图把外卖那一趟和网页那一趟逐列配对画出来:
下单 ↔ 报网址、厨房备餐 ↔ 备好文件、骑手送 ↔ 文件上路、开门 ↔ 页面亮。
图注只承诺这四条箭头真画出来的事(外卖的每一段都有对上的一段)—— 它**不是**第 2–5 节
那四个编号步骤(查地址 / 送请求单 / 文件送回 / 摆出页面)的逐条重画,编号步骤拆得更细。
**为什么**:`explain-method.md` §2 要求比喻一对一;process 页最容易犯的错是每步换一个
比喻(DNS 配邮差、服务器配仓库),第二个比喻出现的那一刻,第一个就作废了一半。
三个术语气泡里有两个本来就住在外卖世界里 —— 服务器那个的人话半边直接写着
"这一单的餐厅厨房",渲染那个是"摆盘" —— 所以这个比喻从第一屏一直付房租到最后一屏。

### 2. 圆号数字是节的脊柱
四个步骤屏各由一个超大圆号数字(`.primer-step` + `.primer-step-num`)开场,数字紧挨
该节 h2 —— 本页是这个组件在**节级**的参考实现(concept 页只在图注层用过它)。
**为什么**:数字承担了全部路标职责,每张图就能只画一个干净的单步场景、只留少量标签;
画成一张带编号的流程图会把四屏压成一屏,一屏一概念就没了。

### 3. 紫色永远画在"你这一单"上
紫的固定是"被送的那件东西"在每一步的形态:hero 的路上包裹与亮起的页面内容、
映射图网页行的地址笔迹/备好的文件/线上的包裹/摆好的色块、第 1 步查回的地址牌、
第 2 步的请求单、第 3 步的三个文件包裹、第 4 步摆进页面的零件。比喻卡的外卖袋
紫**一次**,作为"这袋外卖=你要的网页"的桥;映射图里紫只落在网页那一行,外卖行
保持墨线白底。黄仍然是 concept 页定下的"找到的那个位置"词汇:回车键、电话本里
查到的那条、文件到站点、正要放东西的空位。**为什么**:这页教的是一趟旅程,
招牌色就该跟着旅行者走 —— 眼睛先于文字学会"紫的就是我点的那单"。

### 4. 每个数字都能重算
一次心跳 ≈ 1 秒(每分钟约 60 次);光缆里每秒约 20 万公里,2000 公里单程
= 2000 ÷ 200000 = 0.01 秒;一页文件约 2MB ≈ 一首 MP3(`explain-method.md` §3 的
原例);屏幕每秒重画约 60 次 → 一格 1000 ÷ 60 ≈ 16.7 毫秒。
**为什么**:读者核一个数字核不上,就不再相信这页其它的数字。

### 5. 只翻译三个术语,第 3 步保持全人话
`DNS`、`服务器 server`、`渲染 render` 各一个气泡,都挂在第一次出现的位置;
第 3 步(文件送回来)刻意没有气泡 —— "响应 / HTTP / IP"从头到尾没出现,
打包、发回、文字图片按钮全是人话。**为什么**:气泡的工作是引进**后面还要用**的词;
没有词要引进的步骤配一个气泡,是词汇表,不是翻译。

## Typography rules

| Element | Font | Size | Weight |
|---|---|---|---|
| h1 hero | Fredoka(zh 落 Noto Sans SC) | `clamp(36px, 5.2vw, 60px)` | 600, `line-height:1.08`, `letter-spacing:-.015em` |
| h2 section / step title | Fredoka(zh 落 Noto Sans SC) | `clamp(26px, 3.2vw, 36px)` | 600, `line-height:1.18`;步骤屏的 h2 住在 `.primer-step-body` 里,和圆号数字同排(节级步骤行加 `.primer-step--centered`:数字对单行 h2 垂直居中,行下留 8px) |
| Hero lede | Nunito / Noto Sans SC | `clamp(17px, 1.6vw, 20px)` | 400, `--primer-mut`, `max-width:40ch` |
| Body | Nunito / Noto Sans SC | 17px(≤768px 16.5px) | 400, `line-height:1.66`, `max-width:62ch` |
| 圆号数字 `.primer-step-num` | Fredoka | `clamp(40px, 4.4vw, 56px)`,圈 `clamp(72px, 7.5vw, 96px)`(手机 34px / 64px) | 600 |
| Analogy lead(就像……) | Fredoka | 15px | 500, `letter-spacing:.04em`, `--primer-violet-ink` |
| Analogy body | Nunito / Noto Sans SC | 17px(跟正文) | 400, `max-width:54ch` |
| Term jargon `.primer-term-jargon` | JetBrains Mono | 14px | 400, `--primer-violet-ink` |
| Term plain `.primer-term-plain` | Nunito / Noto Sans SC | 15.5px | 400, `--primer-ink` |
| Recap title | Fredoka(zh 落 Noto Sans SC) | `clamp(20px, 2.2vw, 25px)` | 600 |
| Figcaption | Nunito / Noto Sans SC | 14.5px | 400, `line-height:1.55`, `--primer-mut`, `max-width:68ch` |
| 语言切换钮 | Nunito | 13px | 700 |
| SVG 图内标签 | Nunito / Noto Sans SC | 源 15–17px(行/面板标题 16–17 且 700,场景说明 15 且 600;下限 13px,见 `illustration-craft.md` §6) | 600–700 |

本页没有新增任何字号 —— 全部取自 `assets/primer.css` Section B 与上表;
concept 页的字栈裁决(Fredoka + Noto Sans SC 保留,两种文字不混排在同一行大字里)继续有效。

## Colour rules

- 紫 `#7a5cd6` 固定画在"你这一单"上(决策 3);紫字强调一律 `--primer-violet-ink #5b3fbf`。
  映射图的网页行另有 `--primer-violet-soft #efe9fc` 一块底板 —— 是"正在教的那一行"的面板
  tint(`illustration-craft.md` §9 第 3 条),不是新颜色。
- 黄 `#ffd23f` 只有一档:两处 `.primer-mark`(下了一单 / 数字地址;英文侧同两处
  places an order / numeric addresses —— 高亮笔在两种语言里都要在)+ 每图至多一处
  "找到的位置"(hero 的回车键、电话本查到的那条、第 3 步文件到站的圆点、第 4 步
  待放的空位圆点)。第 2 步那张图刻意没有黄 —— 那一步没有"找到"动作,只有"在路上"。
- 绿 `#3aa66b` 只在回顾条,只作图形,绿区文字仍是墨色。
- SVG 平涂直接写调色板 hex(`fill="var(…)"` 在部分浏览器不稳,`design-tokens.md` 开头的
  唯一例外),verify 对此报的 hardcoded-colour 是 warn 不是 error。

## 节面积口径(dos-and-donts §1 裁定版,本页按它量过)

插画层 = 节内 `.primer-figure` 的 svg + `.primer-analogy-fig` 那一栏,只有这两样;
圆号步骤行与比喻卡文案都算文字侧;回顾条那节点名豁免。1440 视口实测:

| 节 | zh | en |
|---|---|---|
| ① 这一趟像什么 | 0.587 | 0.573 |
| ② 先把名字换成地址 | 0.551 | 0.512 |
| ③ 把请求单送过去 | 0.511 | 0.511 |
| ④ 文件送回来 | 0.550 | 0.534 |
| ⑤ 把页面摆出来 | 0.551 | 0.513 |
| ⑥ 回顾 | 豁免 | 豁免 |

EN 比 zh 多折行(气泡与 figcaption 各多一行),所以 **EN 是紧的那一侧,以它为准**
(第 ③ 节的服务器气泡两种语言都折两行,两侧同为 0.511 —— 全页最紧的一格)。
为此:四张步骤图 viewBox 高 520 / 470 / 430 / 520(宽统一 900,描边换算只依赖宽度),
映射图 430;带 ≥3 个 `<text>` 的图渲染高都压在 640px 的 `diagram-oversized` 上限之下
(最高 624px)。每节正文只留一句,数字全部下放到各自插画的 figcaption。
比喻卡自己撑不起一个节(几何推论见 dos-and-donts §1 ⚠ 段),所以"像什么"和
它的全宽映射图同在第 1 节。

## 已知取舍

见 HTML 末尾的 self-diff 块。要点:窄视口全宽图靠 `primer-fig-wide` 的三级描边阶梯
保住 3px 下限(375 时主线 3.35px),图内标签缩到约 6px,数字全部由 figcaption 兜底;
第 2、3 步重复画同一台电脑和同一台服务器(你在西、服务器在东),重复是刻意的 ——
两张图只差传递方向,而方向正是要教的东西;hero 窗口的标题条和图片块用实紫不用 tint,
因为品牌可视性检查只认实紫像素(截图像素上的欧氏 55,不是这里原先写的逐通道);映射图外卖行不着紫,
保证"紫=网页那一单"的词汇在双行图里也成立。
