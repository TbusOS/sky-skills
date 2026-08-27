---
name: primer-design
description: 把复杂主题变成"零基础也能看懂"的图解读本页 —— 纸白底 + 厚描边插画 + 超大圆号步骤数字 + 比喻卡 + 马克笔黄高亮。大图、少字、比喻先行:每屏只讲一件事,插画占一半以上面积,术语先翻译成人话再使用。科普绘本感,亲切但不幼稚。TRIGGER 当用户提到 eli5 / 小白也能看懂 / 图解 / 给外行解释 / 科普页 / 给我妈讲讲 / 讲人话 / picture explainer / explain simply / explain like I'm five / primer 风格 时使用。DO NOT TRIGGER:长文阅读站 / 知识库(用 sage / anthropic)、营销落地页 / 定价页(用 apple / ember)、数据汇报 deck(用 lectern)、产品发布会(用 eclat)、应用界面 / 仪表盘(用 atelier)、玻璃拟态 aurora(用 glass)。
last-verified: 2026-08-24
---

# Primer Design — 小白图解读本风格

生成"讲给完全不懂的人"的图解页:纸白底子上,一个复杂主题被拆成几屏,每屏一个概念、一张厚描边插画、两句短话。抽象的东西先给一个日常比喻,行话一出现就配"术语 → 人话"小片,结尾一条回顾条说清"现在你知道了什么"。质感来自《How It Works》/ DK 图解百科:**亲切,不幼稚** —— 成年小白看了不觉得被当小孩。

Generates picture-explainer pages for readers who know nothing about the topic: one idea per screen, one thick-outline illustration carrying more than half of it, at most two short sentences of prose. Every abstraction arrives with an everyday analogy first; every piece of jargon arrives with its plain-language translation attached.

**和其余 8 套的本质区别**:其余 8 套是"给定内容 → 按美学渲染";primer 多一步**内容转换** —— 先按 `references/explain-method.md` 把主题拆成小白能懂的结构(比喻、分步、术语翻译),再渲染。拆解规则是硬规则,critic 按它打分。

## §1 使用方式

1. 引入 `assets/fonts.css` + `assets/primer.css`。
2. 页面骨架:`<body class="primer-body">` → `.primer-nav` → `.primer-hero`(大标题 + 主插画 + 一句"这页讲什么")→ 若干 `.primer-section`(每节一个概念)→ `.primer-recap`(结尾回顾条)→ `.primer-footer`。
3. 容器三档:`.primer-container` 默认 1080px(**插画的工作档**)· `.primer-container--narrow` 720px(**只给正文**,别拿它裹插画)· `.primer-container--wide` 1280px(≥16 个标签或 ≥3 列时必须)。
4. 组件用 `primer-` 前缀 class,**单连字符**(`primer-step-num`,不是 BEM `__`;修饰符用 `--`,如 `primer-container--wide`,且修饰符不能单独出现,必须跟基类同写);页面局部样式用**无前缀** class 写在页内 `<style>`(verify.py 只校验 `primer-*` 是否定义于 CSS)。
5. 招牌组件(每一个都有对应 class,别自己另起名字):
   - `.primer-analogy` — 比喻卡("就像……"),自带小插画。**一页至少一张**,这是 primer 的身份标志。
     卡里的插画用 `<div class="primer-analogy-fig">` 裹,**别用 `<figure>`** —— 没有 `<figcaption>` 的
     `<figure>` 会被 visual-audit 警告(known-bugs 1.18),而比喻卡的说明文字本来就在 `.primer-analogy-body` 里。
   - `.primer-step-num` — 超大圆号步骤数字,厚描边手绘感圆圈 + 大号数字。装在 `.primer-step` 行里;这行当节标题用(体内只有一个 h2)时加修饰符 `.primer-step--centered`,数字对 h2 垂直居中 —— 别在页内 `<style>` 里自己写居中。
   - `.primer-term` — 术语翻译气泡:mono 排术语,正文字排人话。
   - `.primer-recap` — 结尾回顾条,三点总结 + 绿勾(`.primer-recap-tick`)。
   - `.primer-mark` — 马克笔黄高亮 span,只圈一句里最要紧的那几个字。
   - `.primer-figure` — 插画容器(`<figure>`),内含 `<svg>` + `.primer-figcaption`。
6. 双语:每段 `<span class="lang-en">…</span><span class="lang-zh">…</span>`;nav 放 `.primer-langtoggle lang-toggle` 按钮组 + 页尾 IIFE 脚本(从 canonical 复制:脚本翻 `html[data-lang]`,CSS 靠 `html[data-lang="en"] .lang-zh { display:none }` 收起另一语)。默认中文。
7. 先读 `references/dos-and-donts.md`(品位边界)和 `references/explain-method.md`(拆解规则),再复制 `references/canonical/<页型>.html` 起步。
8. 技术主题(位域 / 波形 / 总线 / IP core / 调用路径 / 算法 / 互连与地址带 / 协议分层 / 纵向地址映射)先读 `references/tech-figures.md`,现成 SVG 起点在 `templates/diagrams/`。

## §2 触发关键词

eli5 / ELI5 / explain like I'm five / explain simply / picture explainer /
小白也能看懂 / 讲人话 / 图解 / 图解页 / 科普页 / 给外行解释 / 给非技术的人讲 /
给我妈讲讲 / 零基础入门讲解 / primer 风格

## §3 不要用于

- 长文阅读站 / 知识库 / 文档首页 → 用 **sage** 或 **anthropic**(primer 是"少字大图",不是阅读排版;一段 300 字的正文在这里无处安放)
- 营销落地页 / 定价页 / 产品官网 → 用 **apple** 或 **ember**(primer 不卖东西,它只负责让人看懂)
- 数据汇报 / 董事会评审 / 季度 deck → 用 **lectern**(读者已经懂业务,不需要比喻)
- 产品发布会 / keynote → 用 **eclat**(primer 是白天的教室,不是熄了灯的发布厅)
- 应用界面 / 仪表盘 / 后台 → 用 **atelier**(primer 画的是解释,不是能点的产品)
- 玻璃拟态 / aurora 暗调展示页 → 用 **glass**(primer 零 backdrop-filter)

## §4 阅读顺序

1. `references/dos-and-donts.md` — 品位边界(黄单档铁律 · 比喻卡必有 · 厚描边不是简笔画 · 不幼稚化)
2. `references/explain-method.md` — 拆解规则(术语先翻译 · 抽象必配比喻 · 数字给实物参照 · 句长上限 · 讲解顺序锁定)
3. `references/illustration-craft.md` — 厚描边插画画法(描边宽度 / 圆头 / 抖动 / 平涂色序)
4. `references/design-tokens.md` — token 清单
5. `references/tech-figures.md` — **技术主题才读**:九类技术图的规格(位域 / 时序波形 / 总线 SoC /
   IP core 内部 / 调用路径 / 算法 / 互连与地址带 / 协议分层 / 纵向地址映射),每一类都带"必须画 / 禁止 / 违例改写 / viewBox 与标签预算"
6. `references/canonical/{concept,process,compare}.html` + 同名 `.md` — 对应页型的 canonical(含 self-diff 决策块)

## §5 发布前检查(MUST)

```bash
~/.claude/skills/design-review/dr-cli --skill=primer <your-page.html>          # 四道机械检查(结构/渲染/可达性/截图)
~/.claude/skills/design-review/dr-cli --skill=primer --critic <your-page.html> # 再加 LLM critic · 口味评审(四道之外)
```

任一 error = 任务没完成。canonical 自回归:verify + visual-audit 必须 0 error。
页内 `</body>` 前 embed `design-review:self-diff v1` 注释块(canonical 必须)。
机械检查是必要条件,不是充分条件:**截图必须人眼看过**。

## §6 primer 专属要点(机械检查 + critic 会抓)

- **黄单档铁律**(口味规则,机器不管):`--primer-marker #ffd23f` 只此一档,**禁止派生深黄 token**。压深的黄(如 hover 用 (230,178,60))不再像荧光笔划过纸,开始像 ember 的暖金 `#c49464` —— 换成了别家的声音。串味检查不会为它响(实测欧氏 60.5,阈值 22,而且 ember 金不在 primer 的禁忌清单里),所以这条只有 critic 和你自己盯着。要更重的强调就换 `--primer-violet-ink` 的紫字,不要压黄。
- **比喻卡必有**:一页至少一张 `.primer-analogy`。抽象概念没有比喻 = 这页没做 primer 该做的事,critic 直接扣。
- **一屏一概念**:每个 `.primer-section` 只讲一件事,插画占该节面积 ≥ 一半,正文每屏最多两短句。堆成密集 above-the-fold 落地页就丢掉了读本调性。
- **术语先翻译后使用**:没被 `.primer-term` 用人话定义过的行话,不许出现在正文里。裸数字同理 —— "2MB" 要跟一个实物参照("约一首歌")。
- **厚描边不是简笔画**:`.primer-figure svg` 用 3–4px 圆头描边 + 平涂色块 + 轻微手绘抖动,画的是**真东西**(有齿的齿轮、有抽屉的柜子、有页脚的书)。扁平图标 + 打钩是 slop tell。
- **插画标签预算是别家的一半**:1080 档 ≤14 个标签,想放 20 个就拆成两屏。一张图只教一件事;彩虹配色是通用信息图的味道。
- **紫是招牌色,第一屏就要看见**:`--primer-violet #7a5cd6` 活在超大圆号数字、比喻卡边框、nav 字标的点、hero 主插画的主色上。
- **实色,不用 rgba 调正文颜色**:`--primer-ink #243244` 是实值;alpha 淡化的正文是 axe color-contrast 的常见死法(atelier 踩过)。
- **双语全角标点**:zh span 内 `,;:` 一律全角 `，；：`(verify 抓)。
