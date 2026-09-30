---
name: glass-design
description: Apple 液态玻璃 / aurora glassmorphism 风格的 HTML 页面生成。深藏青暗底 + 彩色光晕背景 + 三层毛玻璃面板 + 富 JS 动画(滚动浮现 / count-up / 3D tilt / SVG path-draw),dark/light 双主题。TRIGGER 当用户提到 glass 风格 / 玻璃拟态 / glassmorphism / 液态玻璃 / liquid glass / aurora 风格 / 炫酷暗色展示页 / 玻璃卡片图表展示时使用。
last-verified: 2026-06-11
---

# Glass Design — HTML 风格

生成 Apple 液态玻璃质感的 HTML 页面:深藏青画布上最多 3 个 aurora 光晕,三层毛玻璃面板承载内容,唯一的前景彩色是实心 cyan。自带完整动画体系(全部可冻结,审查脚本确定性渲染)。最适合图表 / 图示 / 数据类内容的"炫酷"展示。
Generates Apple liquid-glass HTML: aurora light blobs on a deep-navy canvas, three tiers of frosted panels, one solid foreground accent (cyan), and a fully freezable motion system. Built for showing diagrams, charts and data with maximum visual impact.

## §1 使用方式

1. 引入 `assets/fonts.css` + `assets/glass.css` + `assets/glass.js`(动画引擎,`<script src>` 放 `</body>` 前)。
2. 页面骨架:`<html data-theme="dark">` → `.glass-aurora`(光晕层)→ `.glass-nav` → 内容 section → `.glass-footer`。
3. 组件用 `glass-` 前缀 class;页面局部样式用**无前缀** class 写在页内 `<style>`(verify.py 只校验 `glass-*` 是否定义于 CSS)。
4. 动画全部属性驱动:`data-reveal` / `data-count-to` / `data-tilt` / `data-draw` / `data-parallax`。
5. 先读 `references/glass-material.md`(材质配方)和 `references/dos-and-donts.md`(品位边界),再复制 canonical 起步。

## §2 触发关键词

glass 风格 / glassmorphism / 玻璃拟态 / 液态玻璃 / liquid glass / aurora / frosted glass / 毛玻璃 / 炫酷暗色 / glass style

## §3 不要用于

- 长文档 / 知识库阅读站(玻璃是展示语言,不是阅读语言 → 用 sage 或 anthropic)
- 打印物 / PDF 导出(backdrop-filter 不进打印管线)
- 政府 / 法律 / 医疗等严肃可信内容(玻璃读作"营销")
- 明确要求浅白极简的场景(→ apple)

## §4 阅读顺序

1. `references/glass-material.md` — 三层材质配方 + aurora 体系 + 折射环(skill 的物理学)
2. `references/design-tokens.md` — 双主题 token 全表
3. `references/dos-and-donts.md` — 品位边界(aurora ≠ AI slop 的那条线)
4. `references/motion.md` — 7 种动画 + 冻结契约(截图检查依赖)+ §4 手势交互 spring 层(跟手 / 可中断 / 速度交接,冻结契约整合)
5. `references/typography.md` — Space Grotesk / Inter / JetBrains Mono / Noto Sans SC 字号表
6. `references/layout-patterns.md` — 容器档位 + 区块节奏
7. `references/diagram-craft.md` — 暗玻璃 SVG 图示工艺(双主题 SVG 必须 token 化)
8. `references/data-display.md` — count-up 统计 + 图表配方
9. `references/components.md` — 组件清单
10. `references/canonical/` — 对应页型的 canonical html + md 成对读

## §5 发布前检查(MUST)

生成**前**:

```bash
~/.claude/skills/design-review/dr-cli --plan --skill=glass --page=<type>
```

读完 contract + 对应 canonical 再动手。

生成**后**:页内 `</body>` 前 embed `design-review:self-diff v1` 注释块(§M 契约,canonical 必须)。然后跑四道机械检查 + critic(检查模型的唯一定义在 `design-review/SKILL.md`):

```bash
~/.claude/skills/design-review/dr-cli --skill=glass <your-page.html>          # 四道机械检查 · gate 2-4 自动 dark+light 双跑
~/.claude/skills/design-review/dr-cli --skill=glass --critic <your-page.html> # 再加 LLM critic · 口味评审(四道之外)
```

任一 error = 任务没完成。critic < 75 必修;canonical 自回归 ≥ 90。

## §6 glass 专属要点(机器检查会抓)

- **双主题契约**:`<html data-theme="dark">` 必须显式声明(verify 8c);公开页必须有 `.glass-theme-toggle`。机械检查对 glass 自动双主题:渲染 / 可达性 / 截图三道(gate 2-4)跑 dark + light 两遍(verify 是静态检查,只跑一次),**两遍都要 0 error**。
- **冻结契约**:一切动画的终态 = 静态 markup。reveal 初始隐藏必须门控在 `html.js-enabled:not([data-motion="off"])` 后面(裸写 `opacity:0` 会被 `glass-reveal-stuck` 检查报);count-up 终值必须写在 markup 文本里(`glass-countup-mismatch` 检查)。
- **R1 可读性铁律**:<28px 的文字要么落在 `.glass-panel/.glass-card/.glass-overlay` 内,要么落在无 blob 核的纯画布区;blob 核照亮的区域只允许 ≥32px 全不透明 display 文字(h1 / pull-quote)。
- **blob 几何**:每视口 ≤3 个 blob;blob 核心区(内 40% 半径)不得压在文字面板 bbox 之下。
- **前景只有 cyan**:violet `#A78BFA` / pink `#F472B6` 只活在背景 blob 和 1px 折射环里,一旦做文字 / 图标 / 按钮色就是 AI slop(dos-and-donts 第一条)。
- **light 模式 accent 文字**走 `var(--glass-accent-ink)`(自动切 `#0E7490`);手写 cyan hex 在白底 1.6:1 必挂 contrast 检查。
- **按钮配方锁死**:cyan 填充 + `--glass-button-ink` 深字。白字在 cyan 上 1.9:1,禁。
- **双主题 SVG**:图示里的墨色 / 节点 / 线必须用 `.glass-svg-*` 类或 `style="fill:var(--glass-*)"`;写死白色 fill 在 light 模式下隐形。cyan `#22D3EE` 主题恒定,可以写死。
- **液态光标 v3**:glass.js 在 hover+fine 指针环境自动把鼠标变成一颗真折射水珠。位移图按球面圆顶的高度和折射定律(水 n=1.333)烘出:中间放大约 1.4 倍(从烘好的位移图读出:半径 4–14px 处 1.38–1.44 倍)、边缘压缩;同一次烘焙带出它投在页面上的焦散和阴影(乘进页面,亮处看得见、黑处看不见),以及边缘的 Fresnel 反光和小高光。移动时按水珠在玻璃上滑动的实验来(Le Grand, Daerr & Limat 2005):前端始终是圆的,越快尾部越尖 —— 先长出两条直边夹成的尖角(半角的正弦 = 起始速度 / 当前速度),再变成尖嘴;**方向靠预烘的形状图,元素本身绝不旋转** —— Chromium 里带 `rotate()` 的元素,位移图会贴错位置,折射跑到水珠外面(`references/glass-material.md` §2)。运动是过阻尼的,速度跟着拉力走,急停时不会冲过指针再弹回;极慢拖动先粘住再滑;慢拖身后什么都不留,只有快到尖嘴(约 780px/s)才拖出细尾、沿中线按固定间距甩下小水珠(珠子直径约为水珠宽度的 1/23、间距约 6.4 个直径,从论文照片量出,越快珠子越大),小水珠留在原地蒸发(小的先干),水珠碰到才并进来;唯一不按物理的一条:静止 0.4 秒后水量慢慢回到原大小,光标不会越拖越小;双击按水珠撞玻璃的过程飞溅(放慢约 25 倍,真实过程约 15ms):液膜边缘先快后慢地扩开(半径按 √t 增长),停住时只有指状突起的尖端还在往外走,然后匀速回缩、收成水珠再回弹几下;少数指尖甩出小水珠直线飞出、落地即停,回缩时偶尔留下几颗,其余突起被拉回 —— 飞出去的水珠**不会被吸回来**,原地蒸发(小的先干),水珠移过去碰到才并进来;水量守恒,飞溅后水珠是原来的 0.99 倍(固定随机种子实测);运动按真实时间积分,120Hz 屏和 60Hz 一样。light 主题自动换表面层(房间反光把边缘压暗)。**改了水珠就跑 `node skills/glass-design/scripts/check_water_refraction.mjs`**(8 个方向停下后,实际折射必须和位移图预测的一致;把 `rotate()` 加回去它会报 8/8 不过);**改了拖动就跑 `check_water_drag.mjs`**(不冲过头 / 慢了不留痕 / 快了留串珠且不被吸回 / 静止回原样 4 条;旧版 4 条全不过,只加回一个问题的变体各在对应那条不过);**改了飞溅就跑 `check_water_splash.mjs`**(扩展先快后慢 / 扩得开收得回 / 落地不动 / 水量守恒 4 条,按截图和算出来的原背景比;旧版 4 条全不过,只加回一个问题的变体各在对应那条不过)。冻结契约下不安装,截图与机械检查永远看不到它;单页退出加 `<html data-no-liquid>`;页面放 `.glass-cursor-toggle` 按钮可让访客切水珠/系统光标(localStorage `sky-cursor` 持久);`<html data-water-refr data-water-tint>` 调折射强度(48 = 物理值)/水色;连续掉帧时自动降级(先不用透镜画大水珠,再减少同屏水珠数)。
- **aurora 层必须 `pointer-events:none`**(`.glass-aurora` 自带;自己加装饰层时记得)— `glass-cta-obstructed` 检查报点击遮挡。
