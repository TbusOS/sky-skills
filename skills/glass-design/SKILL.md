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
4. `references/motion.md` — 7 种动画 + 冻结契约(截图检查依赖)
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

生成**后**:页内 `</body>` 前 embed `design-review:self-diff v1` 注释块(§M 契约,canonical 必须)。然后跑四道检查:

```bash
~/.claude/skills/design-review/dr-cli --skill=glass <your-page.html>          # 三道机械检查 · 自动 dark+light 双跑
~/.claude/skills/design-review/dr-cli --skill=glass --critic <your-page.html> # 第四道检查 · LLM critic
```

任一 error = 任务没完成。critic < 75 必修;canonical 自回归 ≥ 90。

## §6 glass 专属要点(机器检查会抓)

- **双主题契约**:`<html data-theme="dark">` 必须显式声明(verify 8c);公开页必须有 `.glass-theme-toggle`。三道机械检查对 glass 自动跑 dark + light 两遍,**两遍都要 0 error**。
- **冻结契约**:一切动画的终态 = 静态 markup。reveal 初始隐藏必须门控在 `html.js-enabled:not([data-motion="off"])` 后面(裸写 `opacity:0` 会被 `glass-reveal-stuck` 检查报);count-up 终值必须写在 markup 文本里(`glass-countup-mismatch` 检查)。
- **R1 可读性铁律**:<28px 的文字要么落在 `.glass-panel/.glass-card/.glass-overlay` 内,要么落在无 blob 核的纯画布区;blob 核照亮的区域只允许 ≥32px 全不透明 display 文字(h1 / pull-quote)。
- **blob 几何**:每视口 ≤3 个 blob;blob 核心区(内 40% 半径)不得压在文字面板 bbox 之下。
- **前景只有 cyan**:violet `#A78BFA` / pink `#F472B6` 只活在背景 blob 和 1px 折射环里,一旦做文字 / 图标 / 按钮色就是 AI slop(dos-and-donts 第一条)。
- **light 模式 accent 文字**走 `var(--glass-accent-ink)`(自动切 `#0E7490`);手写 cyan hex 在白底 1.6:1 必挂 contrast 检查。
- **按钮配方锁死**:cyan 填充 + `--glass-button-ink` 深字。白字在 cyan 上 1.9:1,禁。
- **双主题 SVG**:图示里的墨色 / 节点 / 线必须用 `.glass-svg-*` 类或 `style="fill:var(--glass-*)"`;写死白色 fill 在 light 模式下隐形。cyan `#22D3EE` 主题恒定,可以写死。
- **液态光标 v2**:glass.js 在 hover+fine 指针环境自动把鼠标变成一颗真折射水珠(backdrop-filter + SDF 圆顶位移图,折射真实页面内容 + RGB 色散;随速度拉伸;快划拖出连续水流,按 Plateau–Rayleigh 失稳缩颈断珠、1 秒内蒸发;停驻回抽尾流;双击爆裂成水舌四溅再汇聚)。light 主题自动换浅底高光烘焙。冻结契约下不安装,截图与机械检查永远看不到它;单页退出加 `<html data-no-liquid>`;页面放 `.glass-cursor-toggle` 按钮可让访客切水珠/系统光标(localStorage `sky-cursor` 持久);`<html data-water-refr data-water-tint>` 调折射强度/水色;水流的折射层默认关(实测它让叠满毛玻璃面板的页面 60→27fps,canvas 光效层的水流照常可见,主珠真折射透镜保留),演示页可用 `<html data-water-trail-refr>` 开启(带自动降级兜底)。
- **aurora 层必须 `pointer-events:none`**(`.glass-aurora` 自带;自己加装饰层时记得)— `glass-cta-obstructed` 检查报点击遮挡。
