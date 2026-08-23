# primer-design · concept canonical

主题:什么是数据库索引。`concept` 页型的参考实现 —— "X 是什么"这一问怎么讲给完全不懂的人。
生成任何 primer concept 页之前先读这份,HTML 是参考实现。

内容先按 `references/explain-method.md` 的六列表拆过:每个数字都能用计算器验证
(2000 万行 × 一行一秒 = 231 天 ≈ 七个多月;log₂(2000 万) ≈ 24.3 → 25 次对半;
4 秒 → 4 毫秒 = 一千倍;300MB / 3GB = 十分之一)。

## 5 个让它成立的决策

### 1. 五张图说同一个比喻
hero 的厚书、比喻卡的索引页、全表扫描的逐页翻、走索引的小册子、代价屏书架上的薄册子 ——
全部是书。**为什么**:读者没见过 B-tree,但用过书后面的索引页。比喻只有一个,
它才能从第一屏一直扛到最后一屏;第二个比喻出现的那一刻,第一个就作废了一半。

### 2. 对应关系画成一对一,不靠读者脑补
第 1 节的全宽图把"书的索引页"和"数据库的索引"并排画出来,中间两条双向箭头:
词条 ↔ 值、页码 ↔ 行号。**为什么**:`explain-method.md` §2 要求比喻一对一。
嘴上说"就像书的索引"人人会,把对应项逐一画出来,比喻才从修辞变成解释。

### 3. 圆号步骤是图的说明层,不在图里重复
走索引的那张图是干净的三段场景(小册子 → 对半排除的条 → 取出那一行),
1-2-3 画在图**下面**:三个超大圆号数字各居中对齐自己那一段,短语跟在圈下。
**为什么**:数字画进图里一次、组件再排一次,同一个"1"会出现两遍;
把组件当图注层,图保持零标签,步骤组件保持招牌地位,谁也不重复谁。

### 4. 紫色永远画在"索引"这个东西上
hero 的小册子、映射图的索引面板、检索图的册子和幸存格、书架上的薄册子 —— 紫的都是索引;
黄只出现在"找到的那个位置"和正文的两处马克笔;绿只在回顾条。**为什么**:招牌色如果只是装饰,
它就只是又一个颜色;让它固定等于页面正在教的那个概念,读者的眼睛先于文字学会词汇。

### 5. 只翻译两个术语
`索引 index` 和 `全表扫描 full table scan` 各有一个气泡,挂在第一次出现的位置;
"二分查找"刻意不出现 —— 正文说"一次丢一半",机制由图画完整。
**为什么**:concept 页翻译到第三个术语就开始像词汇表。名词只有在后面还要反复用时才值得翻译;
用不上的名词是没有工作的行话。

## Typography rules

| Element | Font | Size | Weight |
|---|---|---|---|
| h1 hero | Fredoka(zh 落 Noto Sans SC) | `clamp(36px, 5.2vw, 60px)` | 600, `line-height:1.08`, `letter-spacing:-.015em` |
| h2 section | Fredoka(zh 落 Noto Sans SC) | `clamp(26px, 3.2vw, 36px)` | 600, `line-height:1.18` |
| h3 step phrase | Fredoka(zh 落 Noto Sans SC) | `clamp(19px, 2vw, 22px)` | 500, `line-height:1.3` |
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
| SVG 图内标签 | Nunito / Noto Sans SC | 源 15–17px(面板标题 17,其余 15–16;下限 13px,见 `illustration-craft.md` §6) | 600–700 |

字栈裁决(本页定死,后续任务不再动):大字号截图判过,zh 展示字整段落在 Noto Sans SC、
en 整段落在 Fredoka,**两种文字不在同一行大字里混排**,错配看不出来 —— Fredoka + Noto Sans SC
的组合保留,`fonts.css` 与 `design-tokens.md` §3 不动。

## Colour rules

- 紫 `#7a5cd6` 固定画在"索引"上(决策 4);紫字强调一律用 `--primer-violet-ink #5b3fbf`。
- 黄 `#ffd23f` 只有一档:两处 `.primer-mark`(排好序的副本 / 表的十分之一)+
  图里"找到的位置"(hero 圆点、比喻卡圆点、映射图的行高亮、全表扫描图里埋着的那一行、
  取行卡的马克笔道)。全表扫描那张图里没有索引,所以那一行**不许**用紫 ——
  紫只画索引,是 critic 首轮抓过的错。
- 绿 `#3aa66b` 只在回顾条,只作图形,绿区文字仍是墨色。
- SVG 平涂直接写调色板 hex(`fill="var(…)"` 在部分浏览器不稳,`design-tokens.md` 开头的唯一例外),
  verify 对此报的 hardcoded-colour 是 warn 不是 error —— primer 单主题,没有要跟的主题切换。

## 节面积口径(dos-and-donts §1 裁定版,本页按它量过)

插画层 = 节内 `.primer-figure` 的 svg + `.primer-analogy-fig` 那一栏,只有这两样;
圆号步骤行与比喻卡文案都算文字侧;回顾条那节点名豁免。1440 视口实测(zh / en 同过):
第 1 节 0.548、第 2 节 0.539 / 0.526、第 3 节 0.526、第 4 节 0.525,全部 ≥ 0.5。
为此:映射图与扫描图 viewBox 高 430、检索图 490(宽统一 900);第 1–3 节正文各留一句,
"一行一秒翻七个多月"和"25 次对半"两组数字下放到各自插画的 figcaption。
比喻卡自己撑不起一个节(172px 图栏对 160px 节 padding,上限 ≈0.24),
所以"像什么"和它的全宽映射图同在第 1 节。

## 已知取舍

见 HTML 末尾的 self-diff 块。要点:窄视口下全宽图靠 `primer-fig-wide` 的三级描边阶梯
(primer.css Section L)保住 3px 下限、又不在平板宽度冲过头,375 时主线 3.35px,
但图内标签缩到约 6px,数字全部由 figcaption 兜底;比喻卡的小图是映射图左半的缩略,
桌面上略重复、手机上让卡片能独自撑起这一节;代价图的薄册子画的是约十分之一的厚度,
精确比例交给文字 —— 真按 1:10 画,册子就只剩描边了。
