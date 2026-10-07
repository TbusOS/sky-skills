---
name: glass-design
description: "Apple 液态玻璃 / aurora glassmorphism 风格的展示页 HTML。定死的是它的材质和配色:深藏青画布 #0B1020、背景里最多 3 团极光(cyan / violet / indigo)、三层毛玻璃面板、前景强调只用 cyan #22D3EE(violet / pink 只活在背景光晕里)、cyan 按钮配深色字;版式、字体、动画由模型按内容自由发挥,浅色主题和主题切换按钮改为推荐。配图例库(templates/diagrams/ 25 张 + 图集)和「让人看懂」三种做法的范例 demos/glass-design/explainer.html。检查只查客观缺陷:design-review/scripts/check_objective.mjs(双主题页加 --themes=dark,light);液态光标另有三道物理检查。TRIGGER: glass 风格 / glassmorphism / 玻璃拟态 / 液态玻璃 / liquid glass / aurora / frosted glass / 毛玻璃 / 炫酷暗色 / glass style. DO NOT TRIGGER: 长文档阅读站(用 anthropic / sage)、打印 / PDF、浅白极简(用 apple)。"
last-verified: 2026-10-07
---

# Glass 风格的展示页

材质和配色照 glass,其余自由。玻璃是展示语言:适合图表、图示、产品亮相,不适合长文阅读。

**2026-10-07 改版(user 定,和 anthropic-design 同一思路)**:原来有 8 行写着「必须」——
动笔前先跑 `dr-cli --plan`、嵌 self-diff、critic ≥ 75、canonical 当评分标准、公开页必须有主题切换按钮。

现在只定死材质和配色,其余改成指引和案例。`references/` 里写的「MUST」当经验看;和本文件冲突时以本文件为准。

## 1. 定死的:材质和配色

| 用途 | 值 |
|---|---|
| 画布 | 深藏青 `#0B1020` / `#0E1530`(不是纯黑) |
| 极光 | 背景层最多 3 团:cyan `#22D3EE` · violet `#A78BFA` · indigo `#4F46E5`;`pointer-events: none` |
| 毛玻璃面板 | 白 7–8% 底 + 1px 白 13–17% 描边 + `backdrop-filter: blur(20px) saturate(150%)` + 顶部 1px 高光;三层配方见 `references/glass-material.md` |
| 字 | 墨 `#F4F7FF` · 次要字 `#AEB4C5` · 更淡的小字 `#A3AABB` |
| 前景强调 | **只用 cyan** `#22D3EE`;violet / pink 做文字、图标、按钮就成了廉价的炫彩 |
| 按钮 | cyan 填充 + 深色字 `#062A33`(白字在 cyan 上只有 1.9) |
| 图表第二序列 | indigo(当色块 / 线条,不当小字) |

- **小字放在面板上,或者没有光晕的画布上**。光晕最亮的地方会把底色染成靛蓝 / 紫:2026-10-07 范例页上 `check_objective.mjs` 的 O2 报出,`#8A90A1` 落在染成 `#3A3561` 的底上只有 3.54,换 `#A3AABB` 后 4.85。
- 浅色纸张一类的元素(范例里的票据)可以保留,纸上的字和印章用深色。
- 浅色主题是推荐,不是门槛。做了的话浅色下的强调字用 `#0E7490`(手写 cyan 在白底只有 1.6),并用 `--themes=dark,light` 跑检查。
- `assets/glass.css` / `glass.js`(组件 + 动画引擎 + 液态光标)可以用,不强制。

## 2. 让人看懂的三种做法(案例,不是规则)

范例:`demos/glass-design/explainer.html` —— whetstone 介绍站首页换成 glass:深藏青 + 3 团极光 + 毛玻璃面板,强调色换成 cyan,只做了深色。

| 做法 | 为什么管用 | 范例里看哪 |
|---|---|---|
| **首屏用动画演示机制** | 读者第一眼看到的是这个东西怎么动 | 首屏右侧:经验被分进 L1–L4 四层 |
| **证据模块** | 页面越炫,内容越容易被当成营销;证据让读者能自己核对 | `#evidence`:命令输出终端、检查计数条、REFUSED 票据、局限一节 |
| **读者能点选的解释器** | 自己点一下,比读三段文字快 | `#evidence` 的置信度表、`#layers` 点选岩层、`#flow` 流程步进 |

- 示意图要注明是示意:范例 `#why` 的曲线图下面写着 "illustration, not measured data"。
- glass 的动画多(浮现、count-up、3D tilt、path-draw),但每个动画最好演示机制的一步;打开「减少动态效果」时内容必须完整。
- 动画的终态写在 markup 里(count-up 的终值写进文字,浮现的初始隐藏挂在 JS 打开之后),这样截图和检查拿到的是确定的画面。

## 3. 图例库

- `templates/diagrams/`:25 张现成 SVG,图集见 `demos/glass-design/diagrams.html`。
- `references/diagram-craft.md`:暗玻璃上的 SVG 画法;双主题时图里的墨色、节点、线用 `var(--glass-*)`,写死白色在浅色主题下会消失。
- 手机上的宽图包进 `.glass-scroll`(或 `.glass-scroll--wide`)并设 `style="--pan-w:NNNpx"` 左右拖;`--pan-w` 是最小字刚好 9px 时图的宽度。
- 选什么图型,和 anthropic-design 第 3 节那张「内容 → 图型」表通用。

## 4. 检查:只查客观缺陷

```bash
node ~/.claude/skills/design-review/scripts/check_objective.mjs page.html                     # 只有深色
node ~/.claude/skills/design-review/scripts/check_objective.mjs --themes=dark,light page.html  # 双主题
```

五项:O1 JS 报错 · O2 文字对比度 · O3 真实横向滚动 · O4 手机上图里的字 ≥ 9px · O5 关掉动画也完整。
每项怎么判见 `anthropic-design/SKILL.md` 第 4 节。O2 用的 axe 不查 SVG 里文字的对比度:
范例页 L3 / L4 两个岩层标签原来在深色岩层上发暗,检查没报,是看截图看出来的,图里的小标签要自己看一眼。

整页截图里极光会在第一屏底部「截断」:它是 `position: fixed`,整页截图只画在第一屏。看效果要滚到中段截当前窗口。

## 5. 液态光标

**液态光标 v3**:glass.js 在 hover+fine 指针环境自动把鼠标变成一颗真折射水珠。位移图按球面圆顶的高度和折射定律(水 n=1.333)烘出:中间放大约 1.4 倍(从烘好的位移图读出:半径 4–14px 处 1.38–1.44 倍)、边缘压缩;同一次烘焙带出它投在页面上的焦散和阴影(乘进页面,亮处看得见、黑处看不见),以及边缘的 Fresnel 反光和小高光。移动时按水珠在玻璃上滑动的实验来(Le Grand, Daerr & Limat 2005):前端始终是圆的,越快尾部越尖 —— 先长出两条直边夹成的尖角(半角的正弦 = 起始速度 / 当前速度),再变成尖嘴;**方向靠预烘的形状图,元素本身绝不旋转** —— Chromium 里带 `rotate()` 的元素,位移图会贴错位置,折射跑到水珠外面(`references/glass-material.md` §2)。运动是过阻尼的,速度跟着拉力走,急停时不会冲过指针再弹回;极慢拖动先粘住再滑;慢拖身后什么都不留,只有快到尖嘴(约 780px/s)才拖出细尾、沿中线按固定间距甩下小水珠(珠子直径约为水珠宽度的 1/23、间距约 6.4 个直径,从论文照片量出,越快珠子越大),小水珠留在原地蒸发(小的先干),水珠碰到才并进来;唯一不按物理的一条:静止 0.4 秒后水量慢慢回到原大小,光标不会越拖越小;双击按水珠撞玻璃的过程飞溅(放慢约 25 倍,真实过程约 15ms):液膜边缘先快后慢地扩开(半径按 √t 增长),停住时只有指状突起的尖端还在往外走,然后匀速回缩、收成水珠再回弹几下;少数指尖甩出小水珠直线飞出、落地即停,回缩时偶尔留下几颗,其余突起被拉回 —— 飞出去的水珠**不会被吸回来**,原地蒸发(小的先干),水珠移过去碰到才并进来;水量守恒,飞溅后水珠是原来的 0.99 倍(固定随机种子实测);运动按真实时间积分,120Hz 屏和 60Hz 一样。light 主题自动换表面层(房间反光把边缘压暗)。**改了水珠就跑 `node skills/glass-design/scripts/check_water_refraction.mjs`**(8 个方向停下后,实际折射必须和位移图预测的一致;把 `rotate()` 加回去它会报 8/8 不过);**改了拖动就跑 `check_water_drag.mjs`**(不冲过头 / 慢了不留痕 / 快了留串珠且不被吸回 / 静止回原样 4 条;旧版 4 条全不过,只加回一个问题的变体各在对应那条不过);**改了飞溅就跑 `check_water_splash.mjs`**(扩展先快后慢 / 扩得开收得回 / 落地不动 / 水量守恒 4 条,按截图和算出来的原背景比;旧版 4 条全不过,只加回一个问题的变体各在对应那条不过)。冻结契约下不安装,截图与机械检查永远看不到它;单页退出加 `<html data-no-liquid>`;页面放 `.glass-cursor-toggle` 按钮可让访客切水珠/系统光标(localStorage `sky-cursor` 持久);`<html data-water-refr data-water-tint>` 调折射强度(48 = 物理值)/水色;连续掉帧时自动降级(先不用透镜画大水珠,再减少同屏水珠数)。

## 6. 可选:想要风格上的第二意见时

- `design-review` 的四道检查 + critic 评分(glass 自动 dark + light 双跑):还能用,不是交付门槛。
- 参考资料当案例和经验看:`references/` 下 glass-material / design-tokens / dos-and-donts / motion / typography /
  layout-patterns / diagram-craft / data-display / components,`references/canonical/` 4 个范例页。
