---
name: lectern-design
description: 会议室 / 商务汇报 deck 风格的 HTML 页面生成 —— 浅底纸白画布 + 衬线标题 + 结构化议程/章节 + KPI 卡 + 低饱和深蓝图表 + 决议·行动项表 + 状态药丸。对内、商务、数据前置,可信而不喧哗,像一份尊重读者时间的董事会评审。TRIGGER 当用户提到 会议室 / 开会用 / 商务汇报 / 董事会评审 / 业务评审 / 季度汇报 / KPI 汇报 / 决议文档 / board review / boardroom deck / briefing / quarterly review / 内部评审 deck 时使用。DO NOT TRIGGER:产品发布会(用 eclat)、消费极简营销官网(用 apple)、玻璃拟态(用 glass)、长文阅读站(用 sage / anthropic)。
last-verified: 2026-06-26
---

# Lectern Design — 会议室 / 商务简报 HTML 风格

生成商务汇报质感的 HTML:浅底纸白上,衬线大标题给出一句结论;议程条编号、KPI 卡给大数字、低饱和深蓝图表讲趋势、决议表把"谁、何时、什么状态"摊开。对内、可信、数据前置 —— 一份尊重读者时间的董事会评审,不是营销页。
Generates business-briefing HTML: a serif headline states the conclusion; a numbered agenda, KPI cards, low-saturation navy charts and a decisions table lay out who/when/what-status. Internal, credible, data-forward — a board review that respects the reader's time.

## §1 使用方式

1. 引入 `assets/fonts.css` + `assets/lectern.css`(lectern 走系统衬线 Georgia/宋体 + 系统 sans,不打包 webfont)。
2. 页面骨架:`<body class="lectern-body">` → `.lectern-topbar`(品牌 + 元信息 + Confidential 标 + lang-toggle)→ `.lectern-title`(标题页:kicker + 衬线 h1 + lede + 议程)→ 内容 section(`.lectern-wrap` 约束 1080)→ `.lectern-footer`。
3. 组件用 `lectern-` 前缀 class,**单连字符**(`lectern-kpi-val`,不是 BEM `__`;修饰符用 `--`,如 `lectern-pill--done`);页面局部样式用**无前缀** class 写在页内 `<style>`(verify.py 只校验 `lectern-*` 是否定义于 CSS)。
4. **不用 `.lectern-hero`**:lectern 是汇报不是揭示,标题用 `.lectern-title`(不会触发满屏 hero 检查)。
5. 双语:每段 `<span class="lang-en">…</span><span class="lang-zh">…</span>`;topbar 放 `.lang-toggle` 按钮 + 页尾 IIFE 脚本(从 canonical 复制)。
6. 先读 `references/dos-and-donts.md`(品位边界),再复制 `references/canonical/<页型>.html` 起步。

## §2 触发关键词

会议室 / 开会用 / 商务汇报 / 董事会 / 董事会评审 / 业务评审 / 季度汇报 / KPI 汇报 / 周报月报 / 决议文档 / 行动项 / board review / boardroom / briefing deck / quarterly business review / QBR / internal review / lectern 风格

## §3 不要用于

- 产品发布会 / keynote / 新品揭示 → 用 **eclat**(lectern 是对内汇报,不是对外戏剧)
- 浅白消费极简营销官网(apple.com 那种)→ 用 **apple**(lectern 更结构化、数据/决议前置,有衬线 gravity)
- 玻璃拟态 / aurora / 炫酷暗色 → 用 **glass**
- 长文档 / 知识库阅读站 → 用 sage / anthropic

## §4 阅读顺序

1. `references/dos-and-donts.md` — 品位边界(可信而不营销 · 低饱和图表配色法 · 状态药丸非 RAG 点 · 可导出数字要重算)
2. `references/canonical/review.html` + 其它页型 — 对应页型的 canonical(含 self-diff 决策块)

## §5 发布前检查(MUST)

```bash
python3 ~/.claude/skills/design-review/scripts/verify.py --skill=lectern <your-page.html>          # 结构门
node    ~/.claude/skills/design-review/scripts/visual-audit.mjs <your-page.html>                   # 渲染门(自动跑第二视口)
~/.claude/skills/design-review/dr-cli --skill=lectern --critic <your-page.html>                    # 第四道 · LLM critic
```

任一 error = 任务没完成。canonical 自回归:verify + visual-audit 必须 0 error。页内 `</body>` 前 embed `design-review:self-diff v1` 注释块(canonical 必须)。

## §6 lectern 专属要点(机器检查 + critic 会抓)

- **衬线标题 + sans 正文**:大标题用 `--lectern-font-serif`(Georgia / 宋体)—— 衬线给"经过斟酌的文件"的可信感;全 sans 标题会读成消费营销页(apple 的地盘)。正文 sans 保密集可读。
- **图表低饱和、按数据类型选配色**:有序/连续数据(分层、时间)用**单色相明度梯**(深蓝 `#1d3a6e → #2f5bb0 → #7d9bd0`);无关分类才用多色相但**锁同一明度带**。彩虹色 = 文档失信。线图实线为实际、灰虚线为计划。
- **状态用带标签药丸,不用裸 RAG 色点**:`Needs board / In review / Approved`(青/琥珀/玫红)—— 状态是读者要据以行动的词,不是要解码的颜色;药丸灰度打印也读得出(董事会 deck 会被打印)。
- **数据密是对的**:lectern 一屏可以塞 KPI + 两图 + 表 —— 读者(扫数字的董事)**要**密度,这正是和 eclat"一屏一个气口"相反的地方。别学 eclat 把它拉稀。
- **KPI 大数字 ≥36px**:统计卡的数值字号要 ≥36px(既是设计也避 hollow-card 误判);横排 strip(议程)用 `flex` 不用 `grid`。
- **可导出数字必须从页内重算**:中位数 / 计数 / 占比 / 日期跨度 / 版本号发布前用页内数据核一遍 —— 汇报页是读者会随手验算的地方,一处失实全页失信。**known-bugs 1.35**
- **Confidential 标第一等公民**:内部文件就把 Confidential 标在 topbar,设定语域、也诚实(deck 会被截图转发)。
- **双语全角标点**:zh span 内 `,;:` 一律全角 `，；：`(verify §1.22 抓)。BEM 单连字符不用 `__`。
