---
name: design-review
description: "Independent evaluator for any design-skill output (anthropic-design / apple-design / ember-design / sage-design / glass-design / eclat-design / lectern-design / atelier-design / primer-design). TRIGGER when a demo / template / landing page has just been written with one of the 9 design skills and is about to be shipped. Runs the gate chain — structural verify (placeholders, BEM, undefined classes, bilingual toggles), rendered visual-audit (contrast, hero diagram sizing, orphan cards, SVG text, known-bugs), axe-core accessibility conformance (color-contrast and three structural rules blocking), full-page screenshot, opt-in pixel regression vs a committed baseline (--pixel), and LLM taste judgment (solo design-critic or 4 parallel specialists — composition / copy / illustration / brand). Pairs with design-learner to codify every critic miss so the same bug is never caught twice. Inspired by GAN's discriminator: this skill deliberately lives outside the generator skills so the reviewer does not inherit the generator's assumptions."
last-verified: 2026-04-23
---

# design-review — Separate Evaluator for Design-Skill Output

## Why this skill exists · 为什么独立出来

**EN** — Two rules carried over from Anthropic's [harness design for
long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)
and the GAN paradigm:

1. **The agent doing the work praises its own work.** The 9 design skills
   (apple / anthropic / ember / sage / glass / eclat / lectern / atelier / primer)
   are **generators** — they know the
   style, they can produce HTML, and they will naturally rate their own
   output favourably.
2. **An independent, skeptical evaluator is the real lever.** This skill
   imports **nothing** from any generator. Its rules, scripts, known-bugs
   list, and critic agents live in one shared pool — the nine styles pay
   the same quality floor.

**ZH** — 两条原则来自 Anthropic harness-design 和 GAN 范式:(1) 做事的
agent 倾向自评过高;(2) 独立持怀疑的 evaluator 才是真正的杠杆。9 个
design skill 是 generator,会给自己打高分;`design-review` 脚本、规则、
已知 bug 清单 **不属于任何一个风格**,9 种风格共用同一套工艺底线。

## 检查模型 · The gate model(全仓唯一定义)

**这一节是全仓"几道检查"的唯一出处。** 其它任何文件说到检查数量,以这里为准、
引用这里,不要自己另报一个数(2026-08 之前全仓有三套互相矛盾的数法,
计数检查追着改了四轮 —— 根因就是没有唯一定义)。EN — this section is the
single source of truth for the repo's gate counts; every other surface cites
it instead of asserting its own number.

**五道机械检查**(`bin/design-review` 默认全跑,按序):

1. `verify.py` — 结构(静态)
2. `visual-audit.mjs` — 渲染(Playwright)
3. `axe-audit.mjs` — 可达性(axe-core;阻断规则四条:color-contrast、
   link-name、aria-prohibited-attr、svg-img-alt。**全仓两主题实测 0 违规**
   —— glass light 那 84 处欠账已于 2026-08-27 在 CSS token 层还清,见 known-bugs §6.6)
4. `interaction-audit.mjs` — **点开之后才存在的那些状态**(2026-09-05 加)
5. `screenshot.mjs` — 全页截图(只产物;评判它的是人眼)

### 第四道在补什么(为什么前三道漏得掉)

前三道判的是**同一个静止画面**:verify 读源码,visual-audit 量首帧,
axe 跑加载后的 DOM。于是标签页点了没反应、手风琴展开后文字读不清、
按钮一点就抛异常 —— 三道全绿照样发布。

第四道逐个操作可交互元素(`button` / `summary` / `[role=tab]` / `[aria-expanded]` /
`th[aria-sort]` / `input` / `select` / 页内锚点),每点一次判五件事:

| 判定 | 级别 |
|---|---|
| 这一下点出了控制台报错或未捕获异常 | error |
| 这一下点出了**新的** axe 违规(点前没有、点后才有,四条阻断规则内) | error |
| 声明了 `data-inert-by-design` 却真的改了页面(声明过期) | error |
| 点完页面没有任何可测变化 —— 死控件,或长得像能点的装饰 | warn |
| 页内锚点指向的 id 在本页不存在 | warn |
| 点开后新露出的内容压在别的内容上 | warn |

**已经激活的控件不算死**:带 `aria-current` / `aria-selected="true"` /
`aria-pressed="true"`,或 class 里有 `active` / `selected` / `current` 的,
点它本来就不该有反应。**故意不接线的控件写
`data-inert-by-design="理由"`** —— 跟 `data-allow-overlap` 同一个约定,
必须写理由,声明才是可复核的而不是一个静音开关;而且一旦它真的动了,这一条会报 error。

**判「这个元素读者看得见吗」用浏览器自带的 `checkVisibility()`,不是手写那套判断。**
收起的 `<details>` **不会**给内容设 `display:none` —— 它保留一个真实的
640×122 盒子且 `visibility:visible`,这正是 known-bugs §1.40 那批幻觉重叠的根因。

代价:每个控件一次页面加载,一页 17-21 秒(前三道合计约 9 秒)。
同形状的控件只测前两个(`--per-shape`),八条一模一样的 FAQ 手风琴不必测八遍。
要跳过用 `--no-interact`,但**默认是开的** —— 选配的检查等于没有检查。
自检:`skills/design-review/scripts/interaction_selftest.sh` —— 7 个故意做坏的测试页,
10 项检查,每一类判定的正反两面都测。

### 让它不靠记性:编辑触发的 hook

五道跑一页要 17-25 秒,因为其中三道要开浏览器。**没人会在每次改动后都付这个代价**,
于是实际情况是发布前才想起来跑一次 —— 而那正是结构问题最难改、可访问性问题最可能
带着上线的时刻。

`verify.py` 是唯一不需要浏览器的一道,**0.05 秒**,所以它可以每次写 HTML 都跑。

`hooks/design-gate/` 两个 hook:

- **`post-edit.sh`**(PostToolUse)—— 每次写 HTML 跑一遍 `verify.py`,不过就把结果
  送回给模型;同时把这一版的内容哈希记进 `.design-gate/pending.tsv`。
  路径不是 `.html`、或者不在带 `verify.py` 的仓里,立刻退出不作声。
- **`stop.sh`**(Stop)—— 回合结束时,报出哈希在 `pending.tsv` 里、
  却不在 `passed.tsv` 里的文件。`bin/design-review` 五道全过才写这条回执,
  带 `--no-interact` 或 `--no-axe` 的部分运行不写(部分运行的回执是假的)。
  **改文件会改哈希,回执自动失效**,不用谁记得作废它。

**它只拦一次,然后清账。** 一个"条件不满足就一直不放行"的 Stop hook,
在条件根本达不到的时候会一直不放行,记录里就是 hook 和模型互相重复八轮
直到被强制放行。所以这个只拦一次,把待办清空,然后闭嘴 ——
**目的是让漏掉这件事被看见,不是强制执行。**

装:`hooks/design-gate/install.sh`(先 `--dry-run` 看它要改什么)。
单次关掉:`DESIGN_GATE_HOOK=off`。自检 `hooks/design-gate/selftest.sh`,15 项。

**五道之外**,按需叠加,不计入"五道":

- `pixel-gate.mjs`(`--pixel`)— 可选的第六道机械检查,像素回归比对已提交基线
- LLM critic(`--critic` solo / `--multi-critic` 4 专家)— 口味评审。
  **critic 不是第五道机械检查**,它在机械检查之外
- 人眼看截图 — 机械检查是必要条件,不是充分条件

<!-- gate-model: mechanical = verify.py, visual-audit.mjs, axe-audit.mjs, screenshot.mjs ; optional = pixel-gate.mjs ; taste = critic -->
(上面这行注释是机器可读形态,`scripts/count-check.py` 解析它做全仓计数判定。
改模型 = 改这一节 + 让 count-check 的探针继续过。)

## What ships today · 当前交付

| 组件 | 状态 | 实体 |
|---|---|---|
| Gate 1 · structural verify | **shipped** | `scripts/verify.py`(8 类 check + 双语强制 + `--allow-monolingual` 豁免)|
| Gate 2 · rendered visual-audit | **shipped** | `scripts/visual-audit.mjs`(86 条 known-bugs 里能机器化的那些)|
| Gate 3 · accessibility axe-audit | **shipped** (2026-08-14) | `scripts/axe-audit.mjs`(axe-core;四条阻断规则;当时清账每页只量一个主题,glass light 仍有欠账 —— known-bugs §6.6)|
| Gate 4 · full-page screenshot | **shipped** | `scripts/screenshot.mjs`(Playwright · 绝对路径 + `file://` 通用)|
| 口味评审(五道之外)· solo critic | **shipped** | `.claude/agents/design-critic.md` |
| 口味评审(五道之外)· multi-critic(4 专家) | **shipped** (2026-04-22) | `.claude/agents/design-{composition,copy,illustration,brand}-critic.md` 权重 25/25/20/30 |
| Learning-loop · 回灌成规则 | **shipped** (2026-04-22) | `.claude/agents/design-learner.md` + `scripts/learning-loop.mjs` |
| Cross-repo 入口 | **shipped** | `~/.claude/skills/design-review/dr-cli --repo=<仓> --skill=<名> <html>` |
| 参考库 canonical | 实时计数见 `~/.claude/skills/design-review/dr-cli --coverage`(扩库中) | `~/.claude/skills/<style>-design/references/canonical/` |

## Entry points · 入口

### 一条命令跑完(推荐)

```bash
~/.claude/skills/design-review/dr-cli [--repo=<path>] [--skill=<name>] [--css=<path>]... \
                  [--critic | --multi-critic] [--learn] [--allow-monolingual] \
                  <html> [...]
```

- `--critic` / `--multi-critic` 跑 LLM 口味评审(五道机械检查之外;solo 或 4 专家并行)
- `--learn` 跑完把 verdict 喂 `learning-loop.mjs` 产出 `design-learner` prompt
- `--allow-monolingual` 对内部单语 memo 豁免双语强制(issue #2)
- `--audit <dir>` 整树批量检查;加 `--discover` 只列出树里所有 `.html`(分目录,不跑检查),确认没有藏在子目录里漏检的页 —— 详见下面「多页交付」
- 第二视口几何复查**默认开**:Gate 2 主跑(1440)后,把 overlap/overflow 几类在更窄视口(默认 1024)再跑一遍,宽度相关的碰撞作 warn 标 `[at Npx]`(known-bugs §1.34)。`--viewport2=WxH` 调宽度、`--no-second-viewport` 关掉
- 任一步 exit 非 0 整体 fail,截图存 `--out=` 或默认 `<repo>/shots/`

**本仓用例**:
```bash
~/.claude/skills/design-review/dr-cli index.html docs/HARNESS-ROADMAP.html
~/.claude/skills/design-review/dr-cli --multi-critic demos/gated-dual-clone/index.html
```

**跨仓用例**(例:engram):
```bash
~/.claude/skills/design-review/dr-cli --repo=/path/to/engram --skill=anthropic \
  --css=/path/to/engram/docs/assets/app.css \
  docs/en/index.html
```

### 多页交付:发布前整树批量检查(防漏页)

逐页跑 `dr-cli <file>` 是写每一页时的常规做法,但**多页 deck 发布前要整树跑一遍**,否则放在子目录里的页(`_demos/` 样例、复制进来的报告产物等)很容易忘了过检查,带着真 bug 上线也没人发现。

```bash
# 整树批量检查(verify + visual-audit,递归子目录,一份汇总报告)
~/.claude/skills/design-review/dr-cli --audit <deck-dir>

# 只列出会被检查到的页(分目录,不跑检查)—— 先确认没有漏页
~/.claude/skills/design-review/dr-cli --audit --discover <deck-dir>
```

- `--audit <dir>` 递归走子目录,`_demos/` 这类装内容的下划线目录也会进(纯资源目录 `_assets/` 无 html 自动跳过)。逐页检查只覆盖你显式传的那一个文件,`--audit <dir>` 是发布前的兜底。
- `--audit --discover <dir>` 先把树里所有 `.html` 按目录列出来(不跑检查),一眼看清有没有藏在子目录里没被检查的页。

### 分别调用(调试用)

```bash
# 1) 结构检查(静态)
python3 skills/design-review/scripts/verify.py \
  [--skill=<name>] [--css=<path>]... [--allow-monolingual] <html> [...]

# 2) 视觉检查(Playwright 渲染) · 加 --ignore-intentional 消掉 brand-intentional 噪音
node skills/design-review/scripts/visual-audit.mjs \
  [--ignore-intentional] <html>

# 3) 可达性检查(axe-core · --strict 让阻断规则真的阻断)
node skills/design-review/scripts/axe-audit.mjs --strict <html>

# 4) 肉眼检查(全页截图)
node skills/design-review/scripts/screenshot.mjs <html> shot.png

# 5) 口味评审(五道之外)· solo / multi critic
#    在 Claude Code 里:
Task(subagent_type="design-critic",              ...)  # 单专家
# or 4 并行:
Task(subagent_type="design-composition-critic",  ...)
Task(subagent_type="design-copy-critic",         ...)
Task(subagent_type="design-illustration-critic", ...)
Task(subagent_type="design-brand-critic",        ...)

# 6) 回灌成规则(critic 发现 → known-bugs + 机器 check)
node skills/design-review/scripts/learning-loop.mjs \
  --verdict=<path/to/verdict.json>  # 产出 design-learner prompt
# 然后在 Claude Code 里 Task(subagent_type="design-learner", ...)
```

**任一步 exit 非 0 = 没完成**。修完再跑。

## 每道检查覆盖的 bug 类

| 检查 | 抓哪些 | 依赖 |
|---|---|---|
| Gate 1 `verify.py` | 占位符(文档页 `<pre>`/`<code>` 块自动剥除,不误报)、BEM modifier-only、未定义 class(union: 默认 skill CSS + HTML link + `--css`)、`<svg>` 不平衡、hero 容器用错、`container --mod` 未与 base 同列(BEM base-less 错)、公开页缺双语(`lang-toggle` + `lang-en/zh`)| Python 标准库 |
| Gate 2 `visual-audit.mjs` | WCAG contrast < 4.5、hero 框图渲染 < 900px、SVG `<text>` 实际像素 < 9px、多列网格孤儿卡、SVG `<text>` 重叠、SVG 文字 fill 和承载 shape RGB 距离 < 40、多 h1 / heading 跳级 / 无 alt img / 无文本 a、brand 色在 top region 占比 < 0.4%、cross-skill-smell(别扮成另一个 skill)、hollow-card §10b、asymmetric-first-col-hero §10c、svg-foreign-hex、figure 无 figcaption、Fraunces/Newsreader 等非本 skill 字体、italic 滥用 —— 共 26 类,每类对应 `known-bugs.md` 1 行 | playwright |
| Gate 3 `axe-audit.mjs` | axe-core 可达性:color-contrast、link-name、aria-prohibited-attr、svg-img-alt 阻断,其余只报告 | playwright + axe-core |
| Gate 4 `screenshot.mjs` | 只产物不评审 —— 给人看的 | playwright |
| 口味评审(五道之外)solo `design-critic` | 整页口味(构图 + 文案 + 插画 + 品牌)一位通才评审 | `Task()` subagent |
| 口味评审(五道之外)multi-critic × 4 | 构图 / 文案 / 插画 / 品牌 四位专家独立 fresh-context · 权重 25/25/20/30 聚合 | `Task()` × 4 + 聚合 |

具体清单在:
- `references/known-bugs.md`(84 条,每条写 Reader sees / Why / Defense)
- `references/cross-skill-rules.md`(9 种风格共通工艺底线 · 有 §G 双语规则 + §I 卡片分组规则)
- `references/dos-and-donts.md`(每 skill 下的风格特定反例)

## Learning-loop · 回灌成规则的流程

**目标**:同一类 bug 不被抓两次。

1. Critic 抓到新问题 → `learning-loop.mjs --verdict=<json>` 解析 verdict
2. 调 `design-learner` subagent → 产出 paste-ready 三件套:
   - `known-bugs.md` 新行
   - `visual-audit.mjs` 新机器 check(若能渲染时扫到)
   - `<skill>-design/references/dos-and-donts.md` 新行(若 style-specific)
3. 人审 paste → commit `closes #N`

首次实战(2026-04-22):13 条原始 issue → 5 类新 bug → 3 新 known-bugs(1.17/1.18/1.19)+ 1 新机器 check(figure-no-caption)+ 8 条 dos-and-donts。

## Roadmap · 对齐 [HARNESS-ROADMAP](../../docs/HARNESS-ROADMAP.html)

| Phase | 组件 | 状态 |
|---|---|---|
| 0 · 独立脚本 | verify / visual-audit / screenshot | **done** |
| 1 · 多风格 known-bugs 库 | 实时计数见 `--facts --list` | **done · 扩展中** |
| 2a · canonical 参考库 | 计数见 `--coverage` | **next** · 每 session 1-2 张递进 |
| 3 · generator self-diff | 强制自评 note | 部分完成 |
| 5 · multi-critic | 4 专家并行 + 聚合 | **done** (2026-04-22) |
| 6 · `/design-loop` 编排 | planner → gen → review → critic × 3 轮 | Future(依赖 Phase 01 planner)|
| 7 · learning-loop | `design-learner` + `learning-loop.mjs` | **done** (2026-04-22) |
| 8 · library-grower | 5 张优秀产物 → 自动蒸馏新 canonical | Future(等 10+ 真实页数据)|
| 10 · facts 检查 | `facts.mjs` —— 展示页宣称的数字 vs 磁盘真值,不符即非 0 退出 | **done** (2026-07-30) |

## 生命周期规则

design-review 发现一个 **不在 known-bugs.md 里** 的新问题 → **必须补**:

1. `known-bugs.md` 追加 1 行,写清 Reader sees / Why / Defense
2. 能静态扫 → 加 check 到 `verify.py`
3. 能渲染时扫 → 加 check 到 `visual-audit.mjs`
4. Style-specific → 同步更新对应 `<skill>-design/dos-and-donts.md`

**repo 级硬规则**:同一类问题不能被抓两次。

## Files · 文件

- `~/.claude/skills/design-review/dr-cli` — 一条命令跑完 5 道检查 + 可选 `--multi-critic` / `--learn`
- `scripts/verify.py` — Gate 1 结构 check
- `scripts/visual-audit.mjs` — Gate 2 渲染 check(51 项)
- `scripts/axe-audit.mjs` — Gate 3 可达性 check(axe-core)
- `scripts/screenshot.mjs` — Gate 4 全页截图
- `scripts/count-check.py` — 全仓计数判定(承载短语 vs 磁盘真值 + 检查模型)
- `scripts/learning-loop.mjs` — 组件 07 · critic verdict → design-learner prompt
- `references/known-bugs.md` — 84 条 bug 大全
- `references/cross-skill-rules.md` — 9 种风格共通规则(含 §G 双语 / §I 卡片分组)
- `references/canonical/README.md` — canonical 参考库说明 + 扩库流程

## Reference

- [Anthropic · harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps) — "separate doing from judging"
- 同仓 pair:`skills/gated-dual-clone-audit/`(第 2 个独立 evaluator)
- 指南:`docs/HARNESS-ROADMAP.html`(9 组件路线图)
