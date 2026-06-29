---
name: eclat-design
description: 产品发布会 / keynote 风格的 HTML 页面生成 —— 近黑哑光画布 + 满屏巨字 + 聚光/地面反射 + 单一 flare 高光 + 产品 hero(SVG 抽象或真渲染图)+ 满屏"时刻"叙事。暗调电影感,克制如熄了灯的发布厅。TRIGGER 当用户提到 发布会 / 产品发布 / keynote / 新品发布 / 苹果发布会风格 / launch event / product launch / 暗调电影感发布页 / "one more thing" 风格时使用。DO NOT TRIGGER:玻璃拟态/aurora(用 glass)、会议室/商务汇报 deck(用 lectern)、浅白消费极简官网(用 apple)。
last-verified: 2026-06-26
---

# Eclat Design — 发布会 / keynote HTML 风格

生成产品发布会质感的 HTML:哑光近黑画布上,产品被聚光从黑暗里打亮、落在有反射的地面上;铺屏的巨字一行一个气口;颜色极度克制 —— 唯一饱和的是冷白聚光、暖橙边光,和一个 flare 高光(CTA + 一颗直播红点)。**哑光,不是玻璃**:零 backdrop-filter、零 aurora。戏剧来自光、尺度和留白。
Generates product-keynote HTML: a matte near-black stage where the product is lit out of the dark by a spotlight and sits on a reflective floor; full-bleed headlines that each take one breath; colour kept to cool spotlight + warm rim + one flare accent. Matte, never glass.

## §1 使用方式

1. 引入 `assets/fonts.css` + `assets/eclat.css`(eclat 走系统 SF Pro 字栈,不打包 webfont)。
2. 页面骨架:`<body class="eclat-body">` → `.eclat-nav`(绝对定位浮在 hero 上)→ `.eclat-hero`(满屏,内裹 `.eclat-wrap`)→ 内容 section(`.eclat-wrap` 约束宽度)→ `.eclat-footer`。
3. 组件用 `eclat-` 前缀 class,**单连字符**(`eclat-hero-title`,不是 BEM `__`;修饰符用 `--`,如 `eclat-btn--ghost`);页面局部样式用**无前缀** class 写在页内 `<style>`(verify.py 只校验 `eclat-*` 是否定义于 CSS)。
4. **hybrid 产品 hero 槽**:`.eclat-stage` 里默认放 SVG 发光抽象产品;有真渲染图时换成 `<img class="eclat-stage-media" src="...">`(自有素材、压到 KB 级,见 dos-and-donts)。两条路都过门。
5. 双语:每段 `<span class="lang-en">…</span><span class="lang-zh">…</span>`;nav 放 `.lang-toggle` 按钮 + 页尾 IIFE 脚本(从 canonical 复制)。
6. 先读 `references/dos-and-donts.md`(品位边界),再复制 `references/canonical/<页型>.html` 起步。

## §2 触发关键词

发布会 / 产品发布 / 新品发布 / keynote / 苹果发布会风格 / 暗调电影感 / "one more thing" / launch event / product launch / unveil / product reveal / eclat 风格

## §3 不要用于

- 玻璃拟态 / aurora / 毛玻璃展示页 → 用 **glass**(eclat 哑光,backdrop-filter 是 glass 的语言)
- 会议室 / 董事会 / 商务汇报 / 内部评审 deck → 用 **lectern**(eclat 是对外戏剧,不是对内汇报)
- 浅白消费极简官网(apple.com 那种亮调营销)→ 用 **apple**
- 长文档 / 知识库阅读站 → 用 sage / anthropic(满屏巨字不是阅读语言)

## §4 阅读顺序

1. `references/dos-and-donts.md` — 品位边界(哑光 vs 玻璃那条线 · flare 单高光 · 巨号金属数字的豁免 · 产品图槽)
2. `references/canonical/launch.html` + 其它页型 — 对应页型的 canonical(含 self-diff 决策块)
3. (规划中)`references/typography.md` / `layout-patterns.md` / `motion.md`

## §5 发布前检查(MUST)

```bash
python3 ~/.claude/skills/design-review/scripts/verify.py --skill=eclat <your-page.html>          # 结构门
node    ~/.claude/skills/design-review/scripts/visual-audit.mjs <your-page.html>                 # 渲染门(自动跑第二视口)
~/.claude/skills/design-review/dr-cli --skill=eclat --critic <your-page.html>                    # 第四道 · LLM critic
```

任一 error = 任务没完成。canonical 自回归:verify + visual-audit 必须 0 error。页内 `</body>` 前 embed `design-review:self-diff v1` 注释块(canonical 必须)。

## §6 eclat 专属要点(机器检查 + critic 会抓)

- **哑光铁律**:零 `backdrop-filter`、零 aurora blob。戏剧靠 radial 聚光 + vignette + 地面反射。出现毛玻璃面板 = cross-skill smell(和 glass 撞)。
- **单 flare 高光**:`--eclat-flare #ff5b34` 只活在 CTA 填充、一颗直播红点(用 flare 本色,别另起第二种红)、至多一个被强调的 hero 数字(`.eclat-hl`)、产品 UI mock 内的产品自身强调色。其它前景颜色一律来自冷白聚光 / 暖橙边光。第二个 UI 高光色 = 创业公司模板味。
- **巨号金属数字是唯一豁免的文字渐变**:`.eclat-bignum`(满屏单数字"时刻")可用 `linear-gradient` 金属填充 —— 这是 keynote 招牌,且是**非阅读**的装饰字。其它任何文字渐变都禁(是 slop tell)。豁免按 class 锁死。
- **满屏时刻节奏**:hero 与 "one more thing" 各占 100vh,一屏一个气口。别把它堆成密集 above-the-fold 落地页(那是通用 SaaS 默认,会丢掉 keynote 调性)。
- **产品 hero 必有**:`.eclat-stage` 不能空。SVG 抽象物要有真实光影(rim 高光 + 地面反射 + 聚光锥),不是扁平占位图标(扁平笔记本+打钩=slop)。
- **never pure #000**:画布用 `--eclat-ink #040406`(暖近黑),纯黑杀掉景深。
- **双语全角标点**:zh span 内 `,;:` 一律全角 `，；：`(verify §1.22 抓)。
- **巨字铁律**:hero h1 用 `clamp(64px, 12.5vw, 176px)`;4 行以上是灾难,改窄容器 / 小一档 clamp,别硬塞。
