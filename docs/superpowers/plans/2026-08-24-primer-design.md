# primer-design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增第 9 套设计 skill `primer-design`(小白图解读本:大图、少字、比喻先行),完整接入 design-review 机械检查与 critic 评审,并顺带清掉 atelier 落地时漏掉的注册欠账。

**Architecture:** 照 atelier(commit `c53aeea`)的既定路径:skill 本体(SKILL.md + assets + references)→ 9 处机械检查注册 → 3 个 canonical(每个都走 verify → visual-audit → axe → critic ≥90 的循环)→ demo + 图解集 → 画廊/README/critic-agent 全量接入。这里的"测试"就是 design-review 的检查链,红/绿循环 = 检查报错/检查通过。

**Tech Stack:** 纯 HTML/CSS/SVG + Google Fonts(Fredoka/Nunito/Noto Sans SC/JetBrains Mono);检查工具全在仓内(verify.py / visual-audit.mjs / axe-audit / critic subagent,Playwright 用仓内 node_modules)。

**Spec:** `docs/superpowers/specs/2026-08-24-primer-design-design.md` — 色板锁定值、TOL-55 禁色/豁免决策、拆解方法 6 条、页型定义都在 spec 里,本计划按它执行,冲突以 spec 为准。

## Global Constraints

- 命名绑死:目录 `skills/primer-design/`、样式 `assets/primer.css`、class 前缀 `primer-*`(修饰符 `--`)。
- 色板(spec §3.1 锁定):paper `#fdfaf3` · ink `#243244` · violet `#7a5cd6`(唯一注册招牌色)· violet-ink `#5b3fbf` · marker `#ffd23f`(**只此一档,禁止派生深黄**)· go `#3aa66b` · line `#e8e2d4`。所有文字色用实色,不用 rgba(axe color-contrast 是阻断项)。
- 禁色豁免(spec §4.1,写注释进代码):primer 的 forbiddenColors **不含** ember 金 / sage 绿 / lectern 蓝。
- 双语:每段 `<span class="lang-en">…</span><span class="lang-zh">…</span>` + `.lang-toggle`,默认中文;zh span 内标点全角。
- 文案遵守 `~/.claude/rules/language.md` 禁用词表;仓库文档禁写"闸",一律"机械检查/审查"。
- **facts.mjs 红灯窗口**:Task 1 建目录起,facts.mjs 的 prose 计数(8→9)会一直红,直到 Task 9 扫平。这是预期状态;Task 1–8 的 commit 以"新增文件自身全部检查通过 + facts 的 roster/coverage 两项审计通过"为绿,prose 计数的全绿在 Task 9 交付。
- 每个 canonical `</body>` 前必须内嵌 `design-review:self-diff v1` 注释决策块(从任一现有 canonical 抄结构)。
- 新写机械检查(如有)必须带探针,否则不收(known-bugs §7.10)。

---

### Task 1: skill 骨架 + 机械检查全量注册

**Files:**
- Create: `skills/primer-design/SKILL.md`、`skills/primer-design/assets/fonts.css`、`skills/primer-design/assets/primer.css`
- Modify: `skills/design-review/scripts/verify.py`(SKILLS dict,atelier 条目后)
- Modify: `skills/design-review/scripts/visual-audit.mjs`(SKILL_SIGNATURES,atelier 条目后)
- Modify: `skills/design-review/scripts/sprint-contract.mjs`(VALID_SKILLS L28 · BRAND · DIAGRAM · HELP)
- Modify: `skills/design-review/scripts/regression-gate.mjs`(VALID_SKILLS L33 · HELP)
- Modify: `skills/design-review/scripts/facts.mjs`(ROSTER · SHOWCASE_SURFACES)
- Modify: `skills/design-review/scripts/coverage.mjs`(TARGET)
- Modify: `skills/design-review/scripts/critic.mjs:44`、`multi-critic.mjs:57`、`audit.mjs:17,146`、`bin/design-review:24`(用法串)

**Interfaces:**
- Produces(后续所有任务依赖的 class 名,在 primer.css 里定义):容器 `primer-container`(1080px)/`primer-container--narrow`(720)/`primer-container--wide`(1280);`primer-hero`;招牌组件 `primer-step-num`(超大圆号数字)、`primer-analogy`(比喻卡)、`primer-term`(术语翻译气泡)、`primer-recap`(回顾条)、`primer-mark`(马克笔黄高亮 span)、`primer-figure`(插画容器);双语 `lang-en`/`lang-zh`/`lang-toggle`。
- Produces:CSS token 名 `--primer-paper/-ink/-violet/-violet-ink/-marker/-go/-line`。

- [ ] **Step 1: 复算 spec §4 的三通道色差(防手算笔误)**

```bash
node -e '
const P={violet:[122,92,214],violetInk:[91,63,191],ink:[36,50,68],marker:[255,210,63],go:[58,166,107]};
const S={anthropic:[217,119,87],apple:[0,113,227],ember:[196,148,100],sage:[151,176,119],glass:[34,211,238],eclat:[255,91,52],lectern1:[29,58,110],lectern2:[47,91,176],atelier:[221,79,146]};
for(const[pn,p]of Object.entries(P))for(const[sn,s]of Object.entries(S)){
const d=p.map((v,i)=>Math.abs(v-s[i]));const hit=d.every(x=>x<=55);
if(hit||Math.min(...d.filter((_,i)=>d[i]>55))<70)console.log(pn,"vs",sn,d,hit?"** HIT **":"clear");}'
```

Expected(spec §4 的豁免依据必须复现,否则回 spec 修正):`violetInk vs lectern2 ** HIT **`、`ink vs lectern1 ** HIT **`;violet 对所有 9 项 clear。

- [ ] **Step 2: 建目录 + SKILL.md**

`mkdir -p skills/primer-design/assets skills/primer-design/references/canonical`。SKILL.md 照 `skills/eclat-design/SKILL.md` 的骨架写,六节:§1 使用方式(引 fonts.css+primer.css、容器/前缀规则、比喻卡等招牌组件、双语 IIFE、先读 dos-and-donts 再抄 canonical)· §2 触发关键词(spec §1 的 TRIGGER 全列)· §3 不要用于(→ sage/anthropic 阅读站、apple/ember 营销页、lectern 汇报、eclat 发布会、atelier 应用界面、glass 玻璃)· §4 阅读顺序(dos-and-donts → explain-method → canonical)· §5 发布前检查(三道命令,把 eclat §5 的命令块里 `--skill=eclat` 换成 `--skill=primer`)· §6 primer 专属要点(黄单档铁律 · 比喻卡必有 · 一屏一概念 · 术语先翻译 · 厚描边不是简笔画)。frontmatter 的 description 写 TRIGGER + DO NOT TRIGGER,`last-verified: 2026-08-24`。

- [ ] **Step 3: 跑 facts.mjs,确认红在预期处**

Run: `node skills/design-review/scripts/facts.mjs`
Expected: FAIL,报 `skills/primer-design` 未分类(auditRoster)。这是本任务的失败测试。

- [ ] **Step 4: 写 assets/fonts.css + assets/primer.css**

fonts.css:Google Fonts @import — Fredoka 500/600 · Nunito 400/600/700 · Noto Sans SC 400/500/700 · JetBrains Mono 400。
primer.css 按 Interfaces 列的 token 与 class 全部实现,`:root` 抄 spec §3.1 表的七个 token 值;展示字栈 `"Fredoka","Noto Sans SC",sans-serif`,正文 `"Nunito","Noto Sans SC",sans-serif`;厚描边插画的公共规则(`.primer-figure svg` 描边 3–4px、`stroke-linecap:round`);`.primer-mark` 用 marker 黄做背景高亮;响应式(≤768px 单列、字号 clamp)。

- [ ] **Step 5: verify.py 注册(atelier 条目后追加)**

```python
    "primer": {
        "prefix": "primer-",
        "css": "primer.css",
        "dir": "primer-design",
        "narrow_hero": {"primer-container--narrow"},
        "acceptable_hero": {"primer-container", "primer-container--wide"},
        "container_modifiers": ("narrow", "wide"),
        "hero_advice": "primer-container (default 1080px) or primer-container--wide (1280px)",
    },
```

- [ ] **Step 6: visual-audit.mjs 注册(atelier 条目后追加,豁免注释必须写)**

```js
  primer: {
    name: 'primer violet',
    accents: [[122, 92, 214]],         // #7a5cd6 — ≥64 per-channel from all 8 sibling accents
    threshold: 0.004,                   // provisional; recalibrate on the 3 canonicals (Task 6)
    // ember gold, sage green and lectern navy OMITTED on purpose (spec §4.1):
    // marker-yellow-over-ink anti-aliasing lands inside TOL 55 of #c49464;
    // go-green white-blends land inside TOL 55 of #97B077; primer ink #243244
    // is inside TOL 55 of lectern #1d3a6e and violet-ink #5b3fbf inside #2f5bb0.
    forbiddenColors: [
      { rgb: [217, 119, 87], note: 'anthropic orange #d97757' },
      { rgb: [0, 113, 227], note: 'apple brand blue #0071E3' },
      { rgb: [34, 211, 238], note: 'glass aurora cyan #22D3EE' },
      { rgb: [255, 91, 52], note: 'eclat flare #ff5b34' },
      { rgb: [221, 79, 146], note: 'atelier rose #DD4F92' },
    ],
    forbiddenFonts: ['Fraunces', 'Instrument Serif', 'Poppins', 'Lora', 'Space Grotesk'],
  },
```

反向增补**这一任务先不做**(要靠现有 canonical 截图回归验证,归 Task 10)。

- [ ] **Step 7: sprint-contract.mjs 三处 + HELP**

`VALID_SKILLS` 追加 `'primer'`。BRAND(atelier 条目后):

```js
  primer: {
    accent: '#7a5cd6',
    name: 'primer violet',
    minCoverage: '0.4%',
    howTo: 'violet is carried by the oversized circled step numerals, the analogy-card frame, the nav wordmark dot and the hero illustration primary — a primer page announces its violet in the first screen',
    forbiddenFonts: ['Fraunces', 'Instrument Serif', 'Poppins', 'Lora', 'Space Grotesk'],
    // ember gold / sage green / lectern navy NOT forbidden — mirrors visual-audit.mjs, spec §4.1.
    forbiddenColors: ['#d97757 (anthropic)', '#0071E3 (apple)', '#22D3EE (glass)', '#ff5b34 (eclat)', '#DD4F92 (atelier)'],
  },
```

DIAGRAM(atelier 条目后):

```js
  primer: {
    tiers: '720 `primer-container--narrow` is for TEXT only — every explainer figure rides the full 1080 `primer-container` (≤14 labels) · 1280 `primer-container--wide` (**MUST when ≥16 labels or ≥3 cols**); a primer figure IS the section, never a sidebar',
    color: 'Thick-outline picture-book language: 3–4px rounded ink strokes + flat violet/yellow/green fills. Label budget is HALF the sibling skills — a figure that wants 20 labels must become two screens. One figure teaches exactly one idea; a decorative rainbow is the generic-infographic tell.',
  },
```

HELP 的 `--skill=` 行追加 `|primer`。

- [ ] **Step 8: 其余注册(照抄行内追加)**

- `regression-gate.mjs` L33 `VALID_SKILLS` 追加 `'primer'`;HELP 两行 `…|atelier` → `…|atelier|primer`
- `facts.mjs` ROSTER 的 design 组尾追加 `'primer-design': 'design',`;`SHOWCASE_SURFACES` 追加 `'demos/atelier-design/index.html',` 和 `'demos/primer-design/index.html',`(atelier 欠账一并补)
- `coverage.mjs` TARGET 追加 `primer: ['concept', 'process', 'compare'],`(注释一句:primer 的页型覆盖表是讲解页型,不是营销页型)
- `critic.mjs:44` / `multi-critic.mjs:57` / `audit.mjs:17` / `audit.mjs:146` / `bin/design-review:24` 五处 `lectern|atelier` → `lectern|atelier|primer`(bin 是 `… | atelier.` → `… | atelier | primer.`)

- [ ] **Step 9: 验证注册生效**

```bash
node skills/design-review/scripts/facts.mjs 2>&1 | grep -iE 'roster|coverage|unclassified' ; \
node skills/design-review/scripts/sprint-contract.mjs --skill=primer --page=concept | head -30 ; \
printf '<html><body class="primer-probe"></body></html>' > "$TMPDIR/primer-probe.html" && \
python3 skills/design-review/scripts/verify.py --skill=primer "$TMPDIR/primer-probe.html" 2>&1 | head -5
```

Expected:facts 不再报 unclassified/coverage 缺项(prose 计数仍红,预期);sprint-contract 产出 LOW-CONFIDENCE 契约且 BRAND/DIAGRAM 是 primer 的;verify 认得 `--skill=primer` 并对探针页报结构性 error(未定义 class 等),而不是 "unknown skill"。

- [ ] **Step 10: Commit**

```bash
git add skills/primer-design skills/design-review/scripts bin/design-review
git commit -m "feat: primer-design skill 骨架 + 9 处机械检查注册(第 9 套 · 小白图解读本)"
```

---

### Task 2: references 四件 + canonical 索引

**Files:**
- Create: `skills/primer-design/references/design-tokens.md`、`references/dos-and-donts.md`、`references/explain-method.md`、`references/illustration-craft.md`、`references/canonical/README.md`

**Interfaces:**
- Consumes: Task 1 的 token/class 名。
- Produces: 后续 canonical 任务照抄的规则文本;sprint-contract 生成契约时按路径引用 `design-tokens.md` 与 `dos-and-donts.md`(路径硬编码,文件名不能改)。

- [ ] **Step 1: design-tokens.md** — spec §3.1 表原样落地(七 token + 用途 + 三个豁免的一句话说明),加字栈、字号阶梯(hero clamp、正文 18–20px、圆号数字 clamp(72px,10vw,128px))、间距阶梯。
- [ ] **Step 2: dos-and-donts.md** — Don't + Why 表,至少含:黄单档铁律(spec §4.3)/ 比喻卡必有 / 一屏一概念(插画 ≥ section 一半,正文每屏 ≤2 短句)/ 术语先翻译后使用 / 厚描边不是简笔画(必须有平涂色块与细节层次,火柴人=slop)/ 不幼稚化(禁 emoji 当插画、禁卡通脸滥用)/ 禁纯 #000 / zh 全角标点。
- [ ] **Step 3: explain-method.md** — spec §5 六条硬规则逐条落地,每条配一个"违例→改写"示例(如"裸数字 2MB → 2MB,大约一首 MP3 的大小")。
- [ ] **Step 4: illustration-craft.md** — 厚描边画法:描边 3–4px 圆头、`--primer-ink` 描边色、平涂 violet/yellow/go 三色 + 各自 12–18% tint、手绘抖动用 ≤1.5px 的路径偏移、SVG text ≥13px、每图一个被 violet 强调的主体。
- [ ] **Step 5: canonical/README.md** — 三页型索引表(页型 / 主题 / 它证明了什么),照 atelier 的 `references/canonical/README.md` 格式。
- [ ] **Step 6: Commit**

```bash
git add skills/primer-design/references
git commit -m "feat: primer-design references(tokens/dos-and-donts/explain-method/illustration-craft)"
```

---

### Task 3: canonical `concept.html`(什么是数据库索引)

**Files:**
- Create: `skills/primer-design/references/canonical/concept.html` + `concept.md`

**Interfaces:**
- Consumes: Task 1 class 名、Task 2 全部规则。
- Produces: 双语 IIFE 与 self-diff 块的 primer 参考实现,Task 4/5/7 直接抄。

- [ ] **Step 1: 取契约** — `node skills/design-review/scripts/sprint-contract.mjs --skill=primer --page=concept`(LOW-CONFIDENCE,结构项当默认值,品牌/双语/排版项照办)。
- [ ] **Step 2: 写页面**。屏序(一屏一概念):① hero:大标题"数据库索引是什么?"+ 主插画(一本厚书 vs 带目录的书)+ 一句"这页 3 分钟讲明白" ② 比喻卡:"就像书后面的索引页"+ 插画 ③ 没有索引时(逐页翻的插画 + 术语气泡"全表扫描 → 一页页翻到底")④ 有索引时(直接翻到的插画,圆号步骤 1-2-3)⑤ 代价屏:"索引也要占地方"(数字给实物参照)⑥ 回顾条"现在你知道了"三点 + 绿勾。双语 span 全覆盖;`</body>` 前 self-diff v1 块(5 个决策)。
  **本页顺带定 spec §11 的字体备选**:大字号下截图看 Fredoka(拉丁圆体)+ Noto Sans SC(非圆体中文)混排是否突兀;突兀则展示字整体改 Nunito 700,Fredoka 只留数字与英文点缀,并回写 design-tokens.md 与 fonts.css —— 本任务内定死,后续任务不再动字栈。
- [ ] **Step 3: 机械检查(红→绿循环直到 0 error)**

```bash
python3 skills/design-review/scripts/verify.py --skill=primer skills/primer-design/references/canonical/concept.html
node skills/design-review/scripts/visual-audit.mjs skills/primer-design/references/canonical/concept.html
node skills/design-review/scripts/axe-audit.mjs skills/primer-design/references/canonical/concept.html
```

Expected: 三道全 0 error(axe 的 color-contrast 等阻断规则 0 违例)。每个报错先判定"页面错还是检查误报"——误报按 known-bugs §7.10 修检查并记录(供 Task 9 归档),不迁就页面。
- [ ] **Step 4: critic** — `skills/design-review/dr-cli --skill=primer --critic skills/primer-design/references/canonical/concept.html`,verdict ≥ 90;不足则按 issues 改页重跑(≤3 轮,仍不足升级给用户)。
- [ ] **Step 5: 写 concept.md** — "5 个让它成立的决策" + 排版规则表(表名与栏目照抄 atelier 任一 canonical .md,sprint-contract 按名引用)。
- [ ] **Step 6: Commit** — `git add skills/primer-design/references/canonical && git commit -m "feat: primer canonical concept(数据库索引)· 三道机械检查 0 error + critic 通过"`

---

### Task 4: canonical `process.html`(按下回车后网页如何加载)

**Files:** Create: `references/canonical/process.html` + `process.md`

与 Task 3 同构,差异仅内容:

- [ ] **Step 1: 契约** — `--page=process`。
- [ ] **Step 2: 写页面**。屏序:① hero:标题 + 一条从"手指按回车"到"页面亮起"的全程插画 ② 比喻卡:"就像点外卖"(下单→餐厅做→骑手送→开门收)③–⑥ 四个步骤屏,每屏一个超大圆号数字 + 单步插画 + 术语气泡(DNS → 查电话本 / 服务器 → 餐厅厨房 / 渲染 → 摆盘)⑦ 回顾条。步骤屏是 `primer-step-num` 的参考实现。
- [ ] **Step 3–6:** 同 Task 3 的检查→critic→.md→commit 循环,commit message `feat: primer canonical process(网页加载全程)`。

---

### Task 5: canonical `compare.html`(HTTP vs HTTPS)

**Files:** Create: `references/canonical/compare.html` + `compare.md`

- [ ] **Step 1: 契约** — `--page=compare`。
- [ ] **Step 2: 写页面**。屏序:① hero:两个并排信封插画(明信片 vs 密封挂号信)② 比喻卡:"就像寄明信片和寄密封信" ③ 相同处一屏 ④ 不同处一屏(左右对照,每行一个属性,图示优先)⑤ "怎么分辨"屏(浏览器锁图标插画 + 术语气泡"证书 → 身份证")⑥ 回顾条。对照排版遵守 1-hero-N-alt 比例纪律,禁空心卡。
- [ ] **Step 3–6:** 同 Task 3 循环,commit `feat: primer canonical compare(HTTP vs HTTPS)`。

---

### Task 6: 阈值校准 + 回归基线

**Files:**
- Modify: `skills/design-review/scripts/visual-audit.mjs`(threshold 终值)
- Create: regression-gate 基线记录(其数据文件由脚本自建)

- [ ] **Step 1: 校准 threshold** — 对三个 canonical 各跑一次 visual-audit,读输出里 primer violet 的实测覆盖率,取三页最小值的一半作为 threshold 终值(下限 0.002),更新注册处注释。
- [ ] **Step 2: 记基线** — `node skills/design-review/scripts/regression-gate.mjs --baseline --skill=primer`,随后 `--check --skill=primer` Expected: PASS。
- [ ] **Step 3: Commit** — `git commit -m "feat: primer 招牌色阈值校准 + 回归基线"`(含基线文件)。

---

### Task 7: 旗舰 demo + 图解集

**Files:**
- Create: `demos/primer-design/index.html`(主题:「Agent Skill 是什么?」,讲给完全不懂 AI 工具的人 —— 惯例=讲仓库自己)
- Create: `demos/primer-design/diagrams.html`(图解集,voice 命名 "picture gallery / 图解集")

**Interfaces:** Consumes: Task 3–5 的 canonical 做骨架参考(demo ≈ concept 页型的加长版)。

- [ ] **Step 1: 写 index.html**。屏序:① hero:"你每天让 AI 帮忙,但它记不住你的做事方式"+ 插画 ② 比喻卡:"Skill 就像给新同事的入职手册" ③ 没有 skill 时 / 有 skill 时对照屏 ④ 这个仓库有什么(9 套设计 + 检查 + 评审,数字给实物参照)⑤ 机械检查怎么工作(圆号步骤)⑥ 回顾条 + 指向仓库 README 的 CTA。**页内涉及仓库计数的句子,数值必须与 facts.mjs 输出一致**(它进了 SHOWCASE_SURFACES,计数会被核对)。
- [ ] **Step 2: 写 diagrams.html** — 收录三个 canonical 与 demo 的全部插画 + figcaption,格式对照 `demos/atelier-design/diagrams.html`。
- [ ] **Step 3: 两页各跑 Task 3 Step 3 的三道命令,0 error;index.html 加跑 critic ≥ 90。**
- [ ] **Step 4: Commit** — `git commit -m "feat: primer-design 旗舰 demo(Agent Skill 是什么)+ 图解集"`

---

### Task 8: 根 index.html 画廊接入(6 处)

**Files:**
- Modify: `index.html`(仓库根,214KB 手维护;atelier 的 6 处插入点在 L603-619 / L1128-1130 / L1260-1267 / L2321 / L2355 / L2363-2364 附近,以 `grep -n atelier index.html` 实时定位)

- [ ] **Step 1:** 六处逐一照 atelier 模式插 primer:skill 卡片(双语介绍 + See demo / Picture gallery / canonical 链接)· demo 预览 `<figure>`(内联手绘 SVG mock,**`<a aria-label="Open the primer-design demo">` 必须有** —— axe link-name 是阻断项,atelier 那次就是抄漏的)· demo showcase figcaption · "primer version" ghost 按钮 · 页脚 demos · 页脚 galleries。
- [ ] **Step 2:** `node skills/design-review/scripts/axe-audit.mjs index.html` Expected: 0 阻断违例;`node skills/design-review/scripts/visual-audit.mjs index.html` 无新增 error。
- [ ] **Step 3: Commit** — `git commit -m "feat: primer-design 接入根画廊(卡片/预览/展示/按钮/页脚)"`

---

### Task 9: 文档计数 8→9 全量扫平 + atelier 欠账 + critic agents

**Files:**
- Modify: `README.md`、`README_zh.md`(L9 计数、demo 列表、skill 表新行、design-review/design-planner 行内计数)
- Modify: `demos/README.md`(primer 行 + **补 atelier 行** + "seven aesthetics" 措辞)
- Modify: `docs/INSTALL.html`(primer 触发词行 + **补 atelier、datasheet-reading 缺行**)
- Modify: `docs/HARNESS-ROADMAP*.html` 等 facts.mjs 报告的所有 CORE_SURFACES
- Modify: `skills/design-review/SKILL.md`(description 与正文的 skill 枚举,7 套→9 套)
- Modify: `skills/design-review/references/cross-skill-rules.md`(§K 加 primer 品牌阈值 + 串味豁免;§H 加 Fredoka→Noto Sans SC 配对)
- Modify: `skills/design-review/references/known-bugs.md`(Task 3–7 落下的检查误报/新坑归档为 `## primer-design` 节;一个都没有则不建节,eclat/lectern 先例)
- Modify: `.claude/agents/design-critic.md`(L24 枚举 + voice 列表 + signature 表,**补 atelier + primer**)、`design-brand-critic.md`(色板表/品牌阈值/CJK 例外/signature moves ×2)、`design-composition-critic.md`(枚举 ×2)、`design-copy-critic.md`(voice 段 ×2 + 枚举)
- Modify: `.claude/commands/design-loop.md`、`design-distill.md`(argument-hint **补 atelier + primer**)
- Modify: `skills/design-planner/SKILL.md`(description + --skill 列表 ×2)、`skills/design-evolve/SKILL.md`(description 核对)
- Modify: `skills/anthropic-design/SKILL.md`、`skills/sage-design/SKILL.md`(§3/不要用于 加一行"零基础图解/eli5 → primer-design")

- [ ] **Step 1:** README 双语:L9 "Eight design skills … eight aesthetics"→nine ×2;skill 表在 design-review 行前插:
  `| [primer-design](skills/primer-design/) | EN/ZH | ELI5 picture explainers — thick-outline illustrations, analogy cards, jargon→plain-words chips; makes any topic legible to a complete beginner |`(zh 版:`小白图解读本 —— 厚描边插画 + 比喻卡 + 术语翻译气泡,把任何主题讲到零基础也能看懂`);"for the 8 design skills" → 9 ×4(两文件各 2 处)。
- [ ] **Step 2:** 其余文件逐个按 Files 清单改;primer 的 critic voice 文案:"科普绘本:一屏一概念、比喻先行、厚描边插画、术语先翻译;亲切不幼稚"。atelier 的 voice/signature 内容从 `skills/atelier-design/SKILL.md` §6 与其 design-tokens.md 摘录,不新编。
- [ ] **Step 3: 全绿测试** — `node skills/design-review/scripts/facts.mjs` Expected: **PASS,0 stale count**(这是本任务唯一验收;atelier 那次修了 139 处,逐条清到零)。
- [ ] **Step 4: 禁用词自审** — 对本任务改过的全部 .md/.html 跑 spec 提交前用过的禁用词 grep,Expected: CLEAN。
- [ ] **Step 5: Commit** — `git commit -m "docs: 设计 skill 计数 8→9 + primer 接入全部文档面 + atelier 注册欠账清理"`

---

### Task 10: 反向禁色/禁字体增补 + 全家回归收尾

**Files:**
- Modify: `skills/design-review/scripts/visual-audit.mjs`(其余 skill 的 forbiddenColors/forbiddenFonts)
- Modify: `skills/design-review/scripts/sprint-contract.mjs`(BRAND 镜像同步)

- [ ] **Step 1:** 给 anthropic/apple/ember/sage/glass/eclat/lectern/atelier 的 `forbiddenFonts` 各追加 `'Fredoka'`。
- [ ] **Step 2:** 按 spec §4.2 给 apple/ember/sage/eclat/atelier 的 `forbiddenColors` 追加 `{ rgb: [122, 92, 214], note: 'primer violet #7a5cd6' }`;glass/lectern 不加并写注释(aurora 紫系 / 图表蓝 margin 20);anthropic 先实测:跑其全部 canonical 的 visual-audit,若 0 误报则加,否则不加并写注释。
- [ ] **Step 3: 回归测试(这是本任务的验收)** — 对 9 套 skill 的全部 canonical 逐一跑 visual-audit(串行,避免 8801 端口相撞):

```bash
for f in skills/*-design/references/canonical/*.html; do
  node skills/design-review/scripts/visual-audit.mjs "$f" || echo "REGRESSED: $f";
done
```

Expected: 0 个 REGRESSED。任何误报 = 撤掉对应增补条目并在注释里记原因,不改人家的页面(误报≠缺陷)。
- [ ] **Step 4:** `node skills/design-review/scripts/regression-gate.mjs --check --skill=primer` Expected: PASS;`node skills/design-review/scripts/facts.mjs` Expected: PASS。
- [ ] **Step 5:** sprint-contract 的 BRAND 各 skill `forbiddenColors` 字符串列表与 visual-audit 最终状态镜像同步(含豁免注释)。
- [ ] **Step 6: Commit** — `git commit -m "feat: primer 紫反向禁色/Fredoka 禁字体增补,9 套 canonical 回归 0 误报"`

**收尾遗留(计划外,人工节点):** pixel 基线(`bin/design-review --pixel-baseline`)在用户人审通过 primer 的 5 个页面后再录;push 由用户决定(push hook 会开 Zed 评审)。
