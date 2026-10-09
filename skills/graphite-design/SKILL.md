---
name: graphite-design
description: "石墨铅笔手绘画风的 HTML 讲解页、动图、短视频画面和壁纸。定死的只有五样:暖纸底(深色版是藏青墨纸 + 粉笔线,另画不反相)、深灰褐石墨线(会抖、冲出角)、少量来回涂的彩铅(一种颜色一件事,大片留白)、手写批注(霞鹜文楷)、先线后色按讲故事顺序一笔一笔画出来;版式、构图、角色、动画方式都自由。配 assets/sketch.js(带种子的手绘线、彩铅排线、落笔时间表)+ props.js(机器人、人物、物件、框图节点、代码卡)+ 27 张图例(角色 · 场景 · 电影画风 · 框图架构 · 流程图 · 代码大白话 · 数学算法 · 数据图 · 标注,22 张会动)。大场景、电影画面、壁纸交给出图模型(本机 codex -m gpt-6-astra,提示词模板在 references/image-prompts.md),图表类用代码画,两者可叠用。scripts/export.mjs 逐帧导出 MP4 / GIF / PNG;scripts/taste.mjs 记下这个人选了哪张、说了什么、审查器查出什么,下次按他的口味调参数。TRIGGER: 手绘风 / 铅笔画风 / 素描风 / 彩铅 / 白板动画 / 白板手绘 / 手绘动图 / 手绘讲解视频 / 代码大白话动图 / 算法动图 / 手绘流程图 / 手绘架构图 / 电影感插画 / 手绘壁纸 / ai-doc 那种画风 / graphite 风格 / pencil sketch / hand-drawn / whiteboard animation / sketchy diagram. DO NOT TRIGGER: 新拟态凹凸框图(relief-design)、厚描边零基础图画书(primer-design)、anthropic 配色编辑长文(anthropic-design)、照片级 3D 硬件(hardware-3d)、应用界面(atelier-design)。"
last-verified: 2026-10-10
---

# 石墨:用铅笔,把一件事讲清楚

暖纸、石墨线、几支彩铅,画面像随手画的草图,一笔一笔按讲故事的顺序画出来。
拿它做讲解页、短视频、动图、壁纸都行。

出处:ai-doc 的论文图解(autoresearch 那一篇,`http://doc.tbusos.com/ai-doc/zh/explain/autoresearch.html`)
和它借鉴的 srt-whiteboard-animation(MIT,`https://github.com/geeklee/srt-whiteboard-animation`)。
展示页:`demos/graphite-design/index.html`;图例库 `diagrams.html`;素材 `assets.html`;短片样片 `reel.html`。

## 1. 定死的五样

这五样就是这个画风。少一样就不是它了;五样都在,别的怎么做都还是它。具体色值和理由见 `references/material.md`。

| 样 | 怎么做 | 没有它会怎样 |
|---|---|---|
| 暖纸 | 页面底 `#f6efe2`,不用纯白;深色版底 `#131925` 藏青墨纸,线变粉笔色 `#ddd5c6` | 纯白底上的铅笔线像打印稿;反相出来的夜景,夜空变白天、亮屏变暗 |
| 石墨线 | 深灰褐 `#39332c`,不用纯黑;线会抖、转角冲出去一点、圈收不严,主线 + 一道细的第二笔 | 线太准就像矢量图标,手画感全靠这点不准 |
| 少量彩铅 | 来回涂的排线 + 一层很淡的底色,不平涂;一张图里一种颜色只干一件事,大片纸面空着 | 平涂像扁平插画;颜色多了没有重点 |
| 手写批注 | 图里的说明用手写体(霞鹜文楷 GB 屏幕阅读版);代码和数字用等宽字;插画本身不写字 | 换成无衬线体,整张图立刻变回「PPT 框图」 |
| 先线后色,一笔一笔 | 按故事顺序画(场景 → 主角 → 动作 → 结果),每组先勾线再上色(时间约 2:1);关掉动画直接显示画好的样子 | 一下子全部出现,就只是一张静态插画 |

## 2. 放开的

版式、构图、用哪些角色和道具、用哪几支彩铅、动画怎么动、标题用什么字、位图还是代码、做成网页还是视频还是壁纸。

**图例是例子,不是模板。** 学的是材料和手法:拿 `templates/src/` 里的代码改字、改颜色、改数据,
或者照着 `assets/props.js` 的写法画一个新角色。别把 27 张图例的版式当成「这个风格只能长这样」。

## 3. 谁来画:代码、出图模型、还是叠起来

2026-10-10 同一个题目让两边各画了一张(展示页「谁来画」一节并排放着),结论:

| 画什么 | 用谁 | 为什么 |
|---|---|---|
| 大场景、电影画面、壁纸、片头 | 出图模型 | 人、木头、光影的质感代码画不出来;这些画面不要求每一笔准确 |
| 框图、流程图、架构图 | 代码 | 字要对、箭头要连对;出图模型会写错字、连错线 |
| 代码讲解、数学、算法动图、数据图 | 代码 | 每一步的数是真跑算法算出来的,画面要和代码行同步 |
| 开场、比喻 | 叠起来 | 位图当舞台,在它留出的空白处(白板、屏幕)用代码画会动的部分 |

出图模型:本机 `codex exec -m gpt-6-astra`,**提示词走标准输入**(`-i` 会把后面的提示词也当成图片路径)。
提示词模板、参考图怎么附、夜间版怎么出、叠加区域怎么量,见 `references/image-prompts.md`;
本 skill 用到的 7 张图的提示词原文和挑选理由也记在那里。没有出图工具时全部用代码画,`templates/src/20-scene.mjs` 有现成场景。

## 4. 代码画:两个库

```html
<link rel="stylesheet" href="assets/graphite.css">          <!-- 色值、图里各种线和字的样式、页面小部件 -->
<script src="assets/sketch.js"></script>                     <!-- window.Sketch -->
<script src="assets/props.js"></script>                      <!-- window.Props -->
```

```js
var S = Sketch.create({ seed: 7, id: 'mine' });     // 同一个 seed 永远画出同一张
S.at(0, 1.6, function () {                          // 这一组在第 0–1.6 秒画完
  Props.robot(S, 120, 260, 0.8, { pose: 'wave' });
  var a = Props.node(S, 240, 60, 160, 64, { zh: '缓存', en: 'cache' }, { pen: 'orange' });
});
svg.innerHTML = '<defs>' + Sketch.filters() + '</defs><g filter="url(#g-pencil)">' + S.art() + '</g>' + S.labels() + '<style>' + S.css() + '</style>';
```

- 笔:`line` `path` `rect` `ellipse` `circle` `blob` `poly` `loop` `arrow` `ring`(圈重点)`underline` `dot` `star` `burst`
- 彩铅:`fill(points, 'blue', { style: 'zig' | 'hatch' | 'cross' | 'wash', gap })`;图形函数都能带 `fill:` 参数;`shade` 是石墨阴影
- 字:`text(x, y, '…', { size, anchor, ink, font: 'mono' })`,`ink` 用 `2` `orange` `green` `red` `blue` `term`
- 时间:`at(start, dur, fn)` 一组按长度分时间;`track(keys, fn)` 按时刻走到几个位置;`window(t0, t1, fn)` 只在这段时间出现;`move` `animate` 任意 CSS 动画
- 角色和物件(`props.js`):`robot` `person` `desk` `monitor` `laptop` `chair` `plant` `lamp` `window` `bed` `mug` `books` `bulb` `cloud` `server` `gear` `doc` `magnifier` `clock` `sun` `moon` `tree` `phone` `envelope` `cat`
- 图表件:`node` `decision` `cylinder` `link`(框到框的箭头)`token`(沿线走的小点)`code`(深色代码卡,带 `cursor` 高亮行)

颜色从不写进 SVG:每样东西带一个 class(`.ln` 线、`.p-blue` 彩铅……),由 `graphite.css` 映射到 CSS 变量。
所以同一张图换主题就变色。**别在 SVG 属性里写 `var()`**,不生效。

图例在 `templates/src/*.mjs`(源)→ `node scripts/build.mjs` → `templates/figures/*.svg`(单独文件,跟随系统深浅色)
和 `demos/graphite-design/*.html`(页面由 `site/graphite-design/*.tpl` 生成,别手改)。

## 5. 动起来、做成视频

规则五条:一支笔(同时只画一样,时长和长度成正比)· 按故事顺序 · 先线后色 · 一个时钟(画面、代码高亮、计数挂在同一条时间线上)· 关掉动画也完整。

动画全是 CSS,时间由 `sketch.js` 写进每个元素。所以:

- 页面里 `assets/player.js` 提供 `Graphite.replay(svg)` `Graphite.seek(svg, 秒)`:滚到哪张画哪张、拖进度条、单步
- 导出:`node scripts/export.mjs video 页面或图.html 输出.mp4 --size=1280x720 --fps=30`
  (也支持 `.gif` `.webm`;`png` 子命令导出任意一秒的静帧)。逐帧把所有动画拨到同一时刻再截图,不是录屏,第 300 帧永远是第 10 秒。
- 一个页面有自己的时间线时,挂 `window.graphite = { duration, seek(t) }`,导出就调它。范例:`demos/graphite-design/reel.html`(位图镜头推拉 + 代码图 + 字幕,33 秒)。
- 短视频安全区:图例 `mark-video-safe`(16:9 字幕离底边 ≥ 8%;9:16 避开右侧和底部的平台按钮)。

## 6. 越用越懂这个人:口味档案

```bash
node scripts/taste.mjs suggest          # 画之前:按这个人的口味给出 sketch / 滤镜 / CSS 参数
node scripts/taste.mjs ab               # 想问一题:只改一个参数,给出 A、B 两个值,各画一张给他挑
node scripts/taste.mjs pick hatchGap 4.7 3.7 "他说右边太密"   # 他挑了 A
node scripts/taste.mjs say "颜色太多了,线太抖"              # 他说的话,按词表换成方向
node scripts/taste.mjs ingest check_objective输出.txt       # 审查器的结果
node scripts/taste.mjs explain hatchGap # 这个值是被哪几条记录推到现在的
```

- **每次画完、他有反应,就记一条。** 挑了哪张(权重 1)、说了什么(1)、留下或删掉了哪张(0.5)、
  critic 评审的意见(0.3,审查器不是这个人)。90 天前的记录只算一半。
- **审查器查出的客观问题定下限,不算口味。** `check_objective` 的 O4(手机上字太小)→ 图中字号的下限;
  口味再怎么往小走也不越过它,也不会随时间淡掉。
- 记录存在 `~/.config/sky-skills/graphite-taste.jsonl`(`SKY_TASTE_DIR` 可改),只在本机。展示页的「口味实验室」用同一套算法,导出后 `taste.mjs import` 就能接上。
- 算法和为什么这么设计写在 `assets/taste.js` 文件头。自测:`node scripts/taste.mjs --self-test`
  (模拟读者答 40 题,在意的参数要学到一半以上;故意选反的读者必须学不到)。

## 7. 检查

```bash
node skills/design-review/scripts/check_objective.mjs --themes=dark,light 页面.html   # JS 报错 / 对比度 / 横滚 / 手机上的字 / 关掉动画
node skills/graphite-design/scripts/build.mjs --check      # 图例和页面是不是最新生成的
node skills/graphite-design/scripts/taste.mjs --self-test
python3 skills/design-review/scripts/check_fonts.py        # 在本仓库写了新汉字时:字体子集够不够
```

手机上图里的字会缩:页面里把图包进 `<div class="gpan">`,`build.mjs` 按图里最小字号给 svg 写好
`min-width`,窄屏时图框左右拖,字不小于 9px;只当缩略图用的标 `data-allow-shrink`。

## 8. 踩过的坑

| 现象 | 原因 | 怎么办 |
|---|---|---|
| 圆角框的线冲出去 30px | 样条的控制柄按相邻点算,4px 的角挨着 460px 的边 | `spline` 把控制柄限制在本段一半以内,长边先补点(已修) |
| 栈帧弹出了,它的字还留着 | 分组只包了一层,框在图层、字在文字层 | `S.group` 默认两层都包(已修) |
| 虚线没有落笔动画,或者变成实线 | 落笔动画本身就是改虚线样式 | 虚线不进时间表,用淡入(已修) |
| 深色模式下脸是一团黑、眼睛看不见 | 皮肤用了木头色,五官用粉笔色 | 皮肤、头发、五官各有自己的变量,夜里脸还是浅的 |
| 浅色页面上同时出现浅、深两张插画 | `.hero-art img{display:block}` 比 `.illo-dark{display:none}` 优先 | 主题切换规则加 `!important` |
| 字幕在宽银幕镜头里不见了 | 黑边伪元素的层级比字幕高 | 字幕 `z-index: 5` |
| 梯度下降画成了山而不是谷 | SVG 的 y 轴朝下 | 曲线写成 `y = 底 - L(x)` |
| 说明里写「四步找到」,实际三步 | 数字是手写的 | 说明里的步数由同一段二分查找代码算出来 |
| codex 报「No prompt provided」 | `-i` 吃多个参数,把提示词当成了图片 | 提示词走标准输入 |
| 手机上图里的字 5px | 760 宽的图缩到 350 | `gpan` + `min-width`(见上一节) |

## 9. 文件

```
assets/graphite.css   色值(浅 / 深)· 图里线和字的样式 · 页面小部件(纸底、方格纸、手画框、便签、终端卡、字幕条)
assets/sketch.js      手绘线、彩铅、时间表、铅笔滤镜(Sketch.filters)
assets/props.js       角色、物件、图表件
assets/taste.js       口味学习(浏览器和命令行共用)
assets/player.js      页面:主题 / 语言切换、重画、拖进度
assets/fonts.css      字体(本仓库里由 build_fonts.py 换成本地文件)
templates/src/        27 张图例 + 6 个页面部件的源码 · categories.json 分类
templates/figures/    生成的单独 SVG + index.json
scripts/build.mjs     生成图例和展示页(--check)
scripts/export.mjs    PNG / MP4 / GIF / WebM 导出
scripts/taste.mjs     口味档案
references/material.md       五样材料的色值和理由
references/image-prompts.md  出图模型的提示词写法 + 本 skill 7 张图的原始记录
references/recipes.md        九类图各自的画法要点
```
