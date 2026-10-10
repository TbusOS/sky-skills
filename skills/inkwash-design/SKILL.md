---
name: inkwash-design
description: "中国水墨画风(水墨)的设计指引:讲解页、动图、短视频画面、壁纸、诗词、四季山水、武侠太极、电影动漫短剧、技术文档、技术框图、数学算法、网页和 UI、产品发布会都能用。只定死五样:宣纸(深色版是磁青纸配泥金,另画不反相)、墨分五色和水做的颜色(纯水墨 / 浅绛 / 青绿 / 没骨,不平涂)、有提按的毛笔(起笔斜切、收笔出锋、墨少了出飞白、落定后晕开)、留白当画、一方朱印加书法字;版式、构图、设色、动画都按场景定。先问场景四问再动笔;配 assets/brush.js(带种子的毛笔:提按、飞白、晕染、泼墨、印章、逐笔时间表)+ props.js(梅兰竹菊松、山石水云舟亭桥、人物剪影、鹤鱼马、墨块框、笔触箭头、代码卡)+ 48 张图例(多数会动);字、数、连线要准的图用代码画,艺术画面代码版和出图模型(本机 codex -m gpt-6-astra)各出一版择优;位图可抠成透明层做视差(scripts/layers.mjs)。越用越懂你:接 design-taste,按场景分开记口味(技术图爱淡、壁纸爱浓互不干扰),在 graphite 里说的「字太小」这里也生效,能从你喜欢的画里量留白和设色,画上一方小印点开看为什么画成这样。TRIGGER: 水墨 / 水墨风 / 国画风 / 中国风 / 毛笔 / 书法风 / 宣纸 / 泼墨 / 山水画 / 武侠风 / 仙侠 / 太极 / 诗词配图 / 古风 / 东方美学 / 水墨动画 / 水墨壁纸 / 水墨发布会 / 水墨 PPT / 水墨框图 / ink wash / sumi-e / chinese painting style / brush and ink. DO NOT TRIGGER: 铅笔手绘(graphite-design)、新拟态凹凸框图(relief-design)、日式极简 UI(各页面型 skill)、照片级 3D(hardware-3d)。"
last-verified: 2026-10-11
---

# 水墨:用一支笔和一池水,按场景画

宣纸、墨、几样国画颜料,一笔一笔按笔顺画出来,空着的地方也是画。
这个 skill 只教「水墨这种材料和画法」,不规定你做成什么:技术框图、产品首屏、诗词、壁纸、发布会大屏都行,
**先看场景,再定画法**(第 3 节在第 4 节前面,就是这个意思)。

展示页 `demos/inkwash-design/index.html`;图例库 `diagrams.html`;两版择优 `compare.html`;
短片 `reel.html`;发布会示范 `launch.html`。设计书 `docs/superpowers/specs/2026-10-10-inkwash-design-design.md`。

## 1. 定死的五样

五样都在,黑白、彩色、技术图、壁纸都还是水墨;少一样就不是了。色值和理由见 `references/material.md`(和 `assets/ink.css` 冲突时以 CSS 为准)。

| 样 | 怎么做 | 没有它会怎样 |
|---|---|---|
| 宣纸 | 暖白 `#f2ead8` 带纤维纹;深色版是磁青纸 `#14213a`,墨变成泥金 `#d9b96e`,**另画,不反相** | 纯白底像打印稿;反相成黑底白线像底片,墨的味道全没了 |
| 墨和色都是水做的 | 墨分五色(焦浓重淡清),层级靠浓淡;颜色用国画颜料,透明、一层层叠、边缘湿;不平涂,不用一眼看得出的矢量渐变 | 平涂像扁平插画或剪纸;硬渐变像 PPT |
| 笔有提按 | 起笔斜切按下、行笔略提、收笔出锋;墨少了笔毛分开出飞白(边上的毛先断,白丝在笔画里面);一笔落定后晕开 | 等宽线就成了线描或图标,跟 graphite 分不开 |
| 留白当画 | 水、天、雾不画,靠空着;字放在留白里。留多少按场景定,但留白一定是设计过的 | 画满了像西洋水彩或油画,也没地方放字 |
| 一方印 + 书法字 | 标题用毛笔字(马善政楷书),题诗用龙藏体,发布会大字用志莽行书;图里说明用霞鹜文楷,正文宋体;至少一方朱印,当画面的句号;可竖排 | 没有印像没画完;标题用无衬线体立刻退回网页模板 |

## 2. 放开的

版式、构图、画什么、用哪几样颜料、做成网页还是视频还是壁纸、动画怎么动、代码画还是出图模型画。

**图例是例子,不是模板。** 学的是材料和笔法:拿 `templates/src/` 的代码改字、改数据、换题目,
或者照 `assets/props.js` 的写法画一个新物件。别把 48 张图例的版式当成「水墨只能长这样」。

## 3. 先问场景,再动笔

动笔前回答四件事:

1. **在哪看**:网页、手机竖屏视频、桌面壁纸、发布会大屏、文档插图 → 定比例、最小字号、安全区。
2. **读者要得到什么**:看懂一个机制 / 感受一种气氛 / 记住一个产品 / 找到一个按钮 → 「读懂优先」还是「气氛优先」。
3. **动不动、多长** → 节奏(环境慢动周期 ≥ 6 秒;一张图逐笔画完 3–12 秒)。
4. **有没有必须准确的东西**(字、数、连线、代码)→ 有就代码画,不交给出图模型。

然后按读者要得到的东西找到下面一组。这 5 组也是口味学习的场景组(`--scene=tech|ui|launch|story|still`)。

| 场景组 | 优先 | 留白 | 设色 | 笔法 / 字 | 动画 | 谁画 | 常见坑 |
|---|---|---|---|---|---|---|---|
| 技术图 `tech`(框图、流程、算法、数学、代码讲解) | 读懂 | 2–3.5 成 | 纯墨或浅绛,一色一事 | 线要连对:框用游丝笔、箭头一笔带钩;楷体标签 + 等宽代码 | 按数据流 / 算法步骤画,墨点沿线走 | 代码 | 飞白把箭头断开(技术图里线一律 `dry: false`);晕染让字看不清 |
| 页面与界面 `ui`(文档、网页、UI) | 读懂 + 好用 | 按版式 | 水墨只做点缀:书法标题、墨痕分隔线、印章当徽标或状态、空状态小画 | 正文宋体或楷体,毛笔字不当正文 | 滚动时墨晕显出;按钮按下墨晕开 | 代码 | 宣纸纹理拉低正文对比度 |
| 发布会 `launch` | 记住产品 | 大 | 磁青泥金,或宣纸大留白 + 一处重彩 | 一屏一句话,巨大书法字 | 泼墨揭幕;一笔横扫写出标题 | 叠用 | 元素太多抢了产品 |
| 叙事画面 `story`(电影、动漫、短剧、武侠、太极) | 气氛 | 中到大 | 焦墨高对比,或彩墨 | 泼墨;刀光、速度线用飞白 | 镜头推拉,风、雨、落叶;剪影一笔画出 | 择优 | 出图模型乱写字;人脸崩 |
| 静赏 `still`(诗词、山水、四季、壁纸) | 气氛 | 5–7 成 | 春花青嫩绿胭脂,夏浓墨重绿,秋赭石朱膘,冬留白当雪 | 诗竖排题在留白处,配一方印 | 慢:雾移、水波、落花、落雪 | 择优 | 壁纸图标区和时间区被画占 |

**技术图里的水墨比喻**(起点,不是规定;用了要在说明里点明是比喻):远淡近浓 = 层次(底层淡墨远山,正在讲的那层浓墨);
水 = 数据流,分叉就是分支;墨块 = 节点;笔触箭头 = 调用;朱印 = 最重要的那一处或「通过」。

## 4. 谁来画:择优录取

| 画什么 | 用谁 | 为什么 |
|---|---|---|
| 技术类(框图、流程、代码、数学、数据图、界面) | 代码 | 字要对、线要连对、数要算对;出图模型会写错字、连错线 |
| 艺术类(诗词、四季、山水、武侠、电影、壁纸、发布会画面) | **两边各画一版,择优** | 出图模型质感好;代码画的能逐笔动、能换主题和语言。哪个更好看题目 |
| 开场、比喻 | 叠用 | 位图当底,代码画会动的部分(字、印、雾) |

择优:同一题目两版放进 `compare.html` 并排,按四条选 —— 五样都在没有、场景目标达到没有、动起来好不好看、能不能换主题和语言;
选中的进图例库,落选的连同理由记进 `references/image-prompts.md`。

出图模型:本机 `codex exec -m gpt-6-astra`,**提示词走标准输入**(`codex exec … -i 参考图.png < 提示词.txt`)。
提示词骨架、参考图、夜间版、「图里不要字」的写法见 `references/image-prompts.md`。

**位图怎么动起来**:让出图模型把远景、中景、主体分别画在白纸上,`scripts/layers.mjs` 抠成透明 WebP(纸色取亮度直方图最多的那档,
纸纹软过渡清零,不留白边灰点),网页里各层视差移动、层间夹雾。深色页另出深色位图,不要把浅色位图放到磁青纸上。

## 5. 代码画:`brush.js` + `props.js`

```html
<link rel="stylesheet" href="assets/fonts.css">
<link rel="stylesheet" href="assets/ink.css">       <!-- 色值、图里各种笔和字的样式、页面小部件 -->
<script src="assets/brush.js"></script>              <!-- window.Brush -->
<script src="assets/props.js"></script>              <!-- window.Props -->
<script src="assets/player.js"></script>             <!-- 主题 / 语言切换、重画、拖进度、慢机器回退 -->
```

```js
var B = Brush.create({ seed: 7, id: 'mine' });       // 同一个 seed 永远画出同一张
B.at(0, 2.4, function () {                            // 这一组在第 0–2.4 秒画完:一支笔,一笔接一笔
  Props.mountain(B, [[0, 300], [180, 120], [400, 300]], { tone: 'dan', cun: 4 });
  B.stroke([[60, 320], [200, 300], [340, 330]], { tone: 'nong', width: 14, press: 'zhong' });
  B.text(560, 80, '江雪', { size: 48, font: 'brush', vertical: true });
});
B.seal(600, 300, 40, '寒江');                         // 默认在这一组画完时盖下
svg.innerHTML = '<defs>' + Brush.filters() + B.defs() + '</defs><rect class="paper" width="100%" height="100%"/>' +
  '<g class="ink" filter="url(#ink-rough)">' + B.art() + '</g>' + B.labels();
```

| 函数 | 画什么 | 要点 |
|---|---|---|
| `B.stroke(点, o)` | 一笔 | `tone` 五档墨或颜料名;`width`;`press` 中锋 `zhong` / 侧锋 `ce` / 游丝 `si` / 兰叶 `leaf`;`load` 含墨量(低了出飞白);`wet` 晕开;`dry:false` 不出飞白 |
| `B.dot(x, y, 大小, o)` | 一点(水滴形) | `angle` 按下的方向 |
| `B.wash(轮廓, o)` | 大片淡墨或颜料 | `dir` 上浓下淡 `down` / `up` / `flat`;`ridge` 加一道山脊线 |
| `B.splash(x, y, r, o)` | 泼墨 | 发布会揭幕、乌云 |
| `B.seal(x, y, 大小, 字, o)` | 印 | `kind:'bai'` 白文;`round` 圆印;`at` 盖印时刻 |
| `B.text(x, y, 字, o)` | 字 | `font` brush / long / xing / kai / song / mono;`vertical` 竖排;`lang:{zh,en}` |
| `B.at` / `track` / `follow` / `window` / `animate` / `id` | 时间表 | 和 graphite 的 `sketch.js` 同一套接口:先画最终位置,早先的关键帧写成偏移 |

颜色写 class(`.k-nong`、`.k-huaqing`),`ink.css` 映射到变量;SVG 属性里不写 `var()`(不生效)。
物件用局部坐标换算,**不要**给物件套 `transform: scale`(会连笔宽一起缩)。

**笔数上限**:一张图 ≤ 800 笔(`build.mjs` 超了就报错)。每笔一个遮罩,P0 实测有 GPU 时 800 笔帧间隔 p95 17.5 ms;
软件渲染的机器上 `player.js` 量到持续低于 10 帧/秒,就直接显示画好的样子(拖进度、导出不受影响)。

**动画规则**:按笔顺,先主后次、先勾后染;一支笔同一时间只画一笔;落定后晕开;雾水云周期 ≥ 6 秒;
画面、高亮、计数、字幕从同一个时钟算;关掉动画(`prefers-reduced-motion`)直接显示画好的样子。

## 6. 越用越懂你(`design-taste`)

```bash
T=skills/design-taste/scripts/taste.mjs
node $T --style=inkwash --scene=tech suggest                   # 画技术图前:按这个人的口味给 brush 参数
node $T --style=inkwash --scene=still ab                       # 想问一题:只改一个参数,画两张给对方挑
node $T --style=inkwash --scene=still pick wet 0.42 0.58 "右边晕得太开"
node $T --style=inkwash say "飞白太多了,字太小"                # 说的话按词表换成方向
node $T --style=inkwash --scene=still ref 我喜欢的画.jpg        # 从参考图量留白、墨色、湿度、设色
node $T --style=inkwash --scene=tech explain inkDepth          # 这个值是被哪几条记录推到现在的
```

- 参数:墨色浓淡、湿度、飞白、笔粗细、留白、颜料数、字号、节奏;类别:主题、设色(纯水墨 / 浅绛 / 青绿 / 没骨)、插画来源。
- **分场景记**:技术图爱淡墨、壁纸爱浓墨,两组各学各的;某组记录少时跟着整体口味走。
- **跨风格**:在 graphite 里说的「字太小」「颜色太多」以半份分量影响这里的字号、颜料数;飞白、湿度这些水墨专属的不传。
- **画上留出处**:展示页里按口味画的图右下角有一方小印「味」,点开看改了哪些参数、被哪几条记录推的。
- 参数表 `assets/taste-profile.js`;算法见 `skills/design-taste/SKILL.md`。

## 7. 检查

```bash
node skills/inkwash-design/scripts/build.mjs --check             # 图例和展示页与源码一致;字的对比度 ≥ 4.5:1;每张 ≤ 800 笔;毛笔字都在子集里
node skills/design-taste/scripts/taste.mjs --self-test           # 口味学习
node skills/design-review/scripts/check_objective.mjs demos/inkwash-design/index.html --themes=dark,light
python3 skills/design-review/scripts/check_fonts.py              # 写了新汉字之后
```

写了新的毛笔字(标题、题诗)后:先跑 `build.mjs`,再跑 `python3 scripts/fonts.py` 重切毛笔字子集(要 `pip install fonttools brotli`)。

## 8. 踩过的坑

| 现象 | 原因 | 怎么办 |
|---|---|---|
| 远山整体偏深、颜色不对 | 渐变里的 `currentColor` 取的是渐变定义处的颜色,不是用它的那个形状 | 渐变元素自己带 `.k-*` class(`brush.js` 已这样写) |
| 点画成了小方块 | 很短的一笔装不下提按曲线,斜切起笔把它切成方的 | 点用 `B.dot`,单独画水滴形 |
| 飞白和遮罩冲突 | 飞白本身是断开的线;改虚线的落笔动画用不了 | 每笔套一层遮罩,遮罩沿笔路展开(P0 小样 1) |
| 晕开看不出来 | 晕边模糊半径太小 | `wet > 0.9` 换宽一档的 `ink-bleed` 滤镜 |
| 抠出的透明层白底上满是灰点 | 纸色估偏亮 | `layers.mjs` 取亮度直方图最多的那档(P0 小样 2) |
| 雾被切出一圈硬边 | 纸纹清零一刀切 | 软过渡:floor/2 以下清零,到 2·floor 按比例淡出 |
| 去掉打毛滤镜快一倍 | 但边缘像矢量图、飞白成了硬短条 | 不去;控制笔数 |

## 9. 文件

```
assets/ink.css         色值(浅 / 深)· 图里笔和字的样式 · 页面小部件(宣纸底、墨晕按钮、墨痕分隔线、印章徽标、代码卡)
assets/brush.js        毛笔:提按、飞白、晕染、泼墨、印章、字、时间表
assets/props.js        物件:植物、山水、人物动物、图表件
assets/player.js       页面:主题 / 语言、重画、拖进度、慢机器回退
assets/fonts.css       字体;assets/fonts/ 三个毛笔字体子集 + OFL 许可证
assets/taste-profile.js  口味参数表(接 design-taste)
templates/src/         图例源码 · categories.json 分类
templates/figures/     生成的单独 SVG + index.json
scripts/build.mjs      生成图例和展示页(--check)
scripts/export.mjs     PNG / MP4 / GIF 导出
scripts/layers.mjs     位图抠成透明层
scripts/fonts.py       毛笔字体子集
references/material.md       五样材料的色值和理由
references/recipes.md        各类图的画法要点
references/image-prompts.md  出图模型提示词 + 择优记录
```
