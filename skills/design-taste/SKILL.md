---
name: design-taste
description: "所有设计风格 skill 共用的口味学习(越用越懂你):记下这个人挑了哪张、说了什么(「字太小」「太花」)、留下或删掉了哪张、审查器查出什么、给过哪些喜欢的参考图,算出下次画图用的参数,并能逐条解释每个参数是被哪几条记录推到现在的。按场景分开记(技术图爱淡、壁纸爱浓互不干扰);在一个风格里说的「字太小」会以半份分量影响其他风格的字号;从参考图量留白和颜色数;画上留一方小印,点开看出处。各风格只写一个参数表 assets/taste-profile.js 就能接入(graphite、inkwash 已接)。命令行 scripts/taste.mjs --style=<风格>。TRIGGER: 越用越懂你 / 口味学习 / 记住我的喜好 / 按我的口味画 / taste profile / 学我的审美 / 参考图学风格 / 这张为什么画成这样 / 新设计风格接口味学习。DO NOT TRIGGER: 页面审查打分(design-review)、某个风格具体怎么画(各风格 skill)。"
---

# design-taste:所有设计风格共用的口味学习

一个人用设计 skill 画图,每次的反应都是口味的证据:两张里挑了哪张、说了句「太密了」、
留下了这张删掉了那张、审查器说手机上字太小、拿来一张自己喜欢的画。
这个 skill 把这些反应记进一份本机日志,下次画图前算出该用的参数;每个参数都能查到是被哪几条记录推过去的。

它只管「学到什么、怎么解释」,不管怎么画:画法在各风格 skill 里(`graphite-design`、`inkwash-design`……)。

## 1. 怎么用

```bash
T=skills/design-taste/scripts/taste.mjs
node $T styles                                          # 哪些风格接了口味学习
node $T --style=inkwash --scene=tech suggest            # 画之前:这个人画技术图要用什么参数
node $T --style=inkwash --scene=tech ab                 # 想问一题:只改一个参数,给 A、B 两个值,各画一张给对方挑
node $T --style=inkwash --scene=tech pick inkDepth 0.42 0.58 "右边太黑"
node $T --style=inkwash say "颜色太多了,字太小"          # 对方说的话,按词表换成方向
node $T --style=inkwash ref 我喜欢的画.jpg 另一张.png     # 从参考图量留白、颜色数(水墨还量墨色、湿度)
node $T --style=inkwash ingest check_objective输出.txt   # 审查器的结果:客观问题定下限
node $T --style=inkwash --scene=tech explain inkDepth   # 这个值是被哪几条记录推到现在的
node $T --self-test                                     # 模拟读者 + 故意改坏
```

- `--scene` 的取值是那个风格的场景组(`node $T styles` 列出来);不带就是「整体口味」。
- 日志:`~/.config/sky-skills/taste.jsonl`(`SKY_TASTE_DIR` 可改),所有风格共用一份,每条写明风格和场景,只在本机,不发到任何地方。
  graphite 以前的 `graphite-taste.jsonl` 照读、不改写。`--file=<路径>` 用另一份日志(某个项目、某个团队)。
- 展示页上的口味实验室用的是同一个引擎(浏览器里加载 `assets/shared.js`、`assets/taste-core.js` 和风格的 `taste-profile.js`),
  页面上点「导出记录」,再 `taste.mjs --style=<风格> import 文件` 就接上了。

## 2. 一个值是怎么算出来的

| 步 | 做什么 | 为什么 |
|---|---|---|
| 起点 | 风格的默认值,算 2 份分量 | 一次误点不能把风格带跑 |
| 逐条加权平均 | 按时间顺序,`新值 = (旧值 × 已有分量 + 观测 × 这条的分量) / 两者之和`。二选一、说一句各 1 份;留下、删掉、参考图各 0.5 份;审查意见 0.3 份 | 一年也就一二十条记录,参数多的模型只会拟合噪声;加权平均是读者能手算核对的那种 |
| 越旧越轻 | 分量 × 0.5^(天数 / 90) | 口味会变 |
| 分量封顶 8 | 累计分量最多算 8 | 老用户的口味也还能变 |
| 下限、上限最后套 | 审查器查出的客观问题(手机上字 < 9px)定一条下限,不算口味,永不淡掉 | 「喜欢小字」不能越过「看不清」 |

**按场景分两步**(这是从 graphite 搬过来后加的):

1. 风格整体口味:这个风格的全部记录,按上表算。
2. 场景口味:从第 1 步的结果出发(同样算 2 份),只走这个场景组里的记录。

某个场景只有一两条记录时,结果仍贴近整体口味,不会被一次挑选带偏;记录多了才离开。
自测里读者 A 技术图爱淡墨(0.2)、壁纸爱浓墨(0.85),各答 30 题后学到 0.23 和 0.84;读者 B 两处口味相同,两组的值差不到一个步长。

**下一题问哪个参数**:挑最没把握的那个(步长相对范围大、记录少、问得少);连续几次答案都往同一边,说明还差得远,
这个参数优先再问,但加成最多算 2 次(graphite 2026-10-10 实测:不封顶时一个贴着下限的参数 24 题占了 18 题)。

## 3. 跨风格:只传五个共享参数

| 共享参数 | 意思 |
|---|---|
| `labelSize` | 图里的字号 |
| `colorBudget` | 一张图用几种颜色 |
| `whitespace` | 留白 |
| `pace` | 动画节奏 |
| `theme` | 浅色 / 深色 |

- 别的风格的记录在这里**算半份**,而且**只通过这五个参数**进来。「排线太密」「飞白太多」这种风格专属的话、专属参数一律不传。
- 传的是「比那个风格的默认值偏了多少,占它范围的几成」,到这边再按这边的范围换算回来。
  **为什么不传原值**:graphite 留白默认 0.45,水墨默认更大;直接搬 0.5 过来,水墨反而变满了。
- 说的话分两张词表:`assets/shared.js` 里的共享词(「字太小」「太花」「太快」「深色」……)能跨风格;风格自己 `LEXICON` 里的只在本风格生效。
- 审查器定的下限不跨风格:它是对那个风格的图查出来的。

## 4. 看图识口味

`taste.mjs ref 图…` 用浏览器读像素(本机没有 Python 图像库),每张图量:

| 量什么 | 怎么量 |
|---|---|
| 留白 | 出现最多的颜色当纸色,和它差 < 24 的像素占比 |
| 墨色五档 | 非纸像素按亮度从黑到纸分五档的占比 |
| 颜色数 | 饱和度够的像素按色相分组,占非纸像素 > 3% 的组数(灰墨不算颜色) |
| 晕开程度 | 边缘像素里过渡柔和的占比 |

- 量出来的数由风格的 `fromMeasure()` 换成参数,记一条 `ref`,分量 0.5(相当于留下一张图)。量不到的参数不换算。
- **飞白不量**:试过数笔画里的细白缝,纸纹和 JPEG 噪点产生的是同一种图案,数出来没有意义。
- 自测:代码生成留白 0.3 / 0.55 / 0.8 的测试图,量出来误差 ≤ 0.05;加了两种颜料的图数出 2 种颜色。

## 5. 画上留出处

`assets/provenance.js`:网页里每张按口味画的图,右下角一方小印「味」,点开列出改过的参数、改成多少、推动它的最近几条记录
(内容就是 `explain()` 的输出,和命令行 `explain` 是同一份)。SVG 根元素写 `data-taste`,记下当时的参数。
导出的壁纸、视频默认不带;导出脚本加 `--provenance` 才在角落写一行题跋小字。

```js
var T = TasteCore.create(InkwashTasteProfile), t = T.estimate(events, null, { scene: 'tech' });
TasteProvenance.mark(figureEl, T.explain(t), { lang: 'zh', stamp: T.stampOf(t) });
```

## 6. 新风格怎么接

写 `skills/<风格>-design/assets/taste-profile.js`(浏览器和 Node 都能加载的 UMD),导出:

| 字段 | 必填 | 内容 |
|---|---|---|
| `style` | 是 | 风格名,写进每条记录 |
| `KNOBS` | 是 | `{ 名: { def, min, max, step, zh, en, int? } }` |
| `CATS` | 否 | 类别参数 `{ 名: { def, values, zh, en } }` |
| `LEXICON` | 否 | 本风格的词表 `[{ re, dir: {参数: ±1}, cat? }]` |
| `shared` | 否 | 共享参数名 → 本风格的参数名,如 `{ labelSize: 'labelSize', whitespace: 'blank' }` |
| `SCENES` | 否 | 场景组,如 `[{ id: 'tech', zh: '技术图' }, …]` |
| `abSkip` | 否 | 两张静态图看不出差别的参数(颜色数、节奏……),不拿来出题 |
| `fromMeasure(m)` | 否 | 参考图的量值 → 参数 |
| `apply(t)` | 否 | 估计值 → 画法代码要的参数 |
| `describe(a, req, flags)` | 否 | `suggest` 打印什么(Node 里用 `req('x.js')` 加载本风格 assets 下的文件) |

然后 `node $T styles` 能看到它,`node $T --self-test` 照样全过。

## 7. 检查

```bash
node skills/design-taste/scripts/taste.mjs --self-test
```

| 组 | 查什么 |
|---|---|
| A | graphite 原来的 40 题模拟读者:在意的参数学到一半以上;故意选反的读者学不到;说话、下限、淡忘、解释、出题分布 |
| S | 分场景:读者 A 两组学对方向;读者 B 两组差 ≤ 1 步;没有记录的场景跟随整体口味 |
| X | 跨风格:graphite 说「字太小」水墨字号变大;分量比本风格说的小;按范围换算;排线参数传不过来;下限不跨风格;主题能传 |
| R | 参考图留白误差 ≤ 0.05;颜色数 |
| M | 故意改坏三处(去掉场景那一步 / 跨风格直接搬原值 / 别的风格算全份),各自对应的测试必须失败 |

graphite 迁过来时另验过:300 组随机记录上,新旧两版的估计值、证据、轨迹、下一题、`apply()` 逐值相同;
graphite「越用越懂你」3 张图重新生成后 `build.mjs --check` 无差异。

## 8. 文件

```
assets/shared.js       五个共享参数和共享词表
assets/taste-core.js   引擎:估计、出题、解释、跨风格换算(浏览器和命令行共用)
assets/provenance.js   画上的小印和弹出说明
scripts/taste.mjs      命令行
scripts/measure.mjs    看图识口味(playwright 读像素)
scripts/selftest.mjs   自测
```
