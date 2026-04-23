---
name: design-review
description: "Independent evaluator for any design-skill output (anthropic-design / apple-design / ember-design / sage-design). TRIGGER when a demo / template / landing page has just been written with one of the 4 design skills and is about to be shipped. Runs four gates — structural verify (placeholders, BEM, undefined classes, bilingual toggles), rendered visual-audit (contrast, hero diagram sizing, orphan cards, SVG text, 26 known-bugs), full-page screenshot, and LLM taste judgment (solo design-critic or 4 parallel specialists — composition / copy / illustration / brand). Pairs with design-learner to codify every critic miss so the same bug is never caught twice. Inspired by GAN's discriminator: this skill deliberately lives outside the generator skills so the reviewer does not inherit the generator's assumptions."
last-verified: 2026-04-23
---

# design-review — Separate Evaluator for Design-Skill Output

## Why this skill exists · 为什么独立出来

**EN** — Two rules carried over from Anthropic's [harness design for
long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)
and the GAN paradigm:

1. **The agent doing the work praises its own work.** The 4 design skills
   (apple / anthropic / ember / sage) are **generators** — they know the
   style, they can produce HTML, and they will naturally rate their own
   output favourably.
2. **An independent, skeptical evaluator is the real lever.** This skill
   imports **nothing** from any generator. Its rules, scripts, known-bugs
   list, and critic agents live in one shared pool — the four styles pay
   the same quality floor.

**ZH** — 两条原则来自 Anthropic harness-design 和 GAN 范式:(1) 做事的
agent 倾向自评过高;(2) 独立持怀疑的 evaluator 才是真正的杠杆。4 个
design skill 是 generator,会给自己打高分;`design-review` 脚本、规则、
已知 bug 清单 **不属于任何一个风格**,4 种风格共用同一套工艺底线。

## What ships today · 当前交付

| 组件 | 状态 | 实体 |
|---|---|---|
| Gate 1 · structural verify | **shipped** | `scripts/verify.py`(8 类 check + 双语强制 + `--allow-monolingual` 豁免)|
| Gate 2 · rendered visual-audit | **shipped** | `scripts/visual-audit.mjs`(26 条 known-bugs 机器化)|
| Gate 3 · full-page screenshot | **shipped** | `scripts/screenshot.mjs`(Playwright · 绝对路径 + `file://` 通用)|
| Gate 4 · solo taste critic | **shipped** | `.claude/agents/design-critic.md` |
| Gate 4 · multi-critic(4 专家) | **shipped** (2026-04-22) | `.claude/agents/design-{composition,copy,illustration,brand}-critic.md` 权重 25/25/20/30 |
| Learning-loop · 闭环回灌 | **shipped** (2026-04-22) | `.claude/agents/design-learner.md` + `scripts/learning-loop.mjs` |
| Cross-repo 入口 | **shipped** | `bin/design-review --repo=<仓> --skill=<名> <html>` |
| 参考库 canonical | 13 张(目标 40 · 扩库中) | `skills/<style>-design/references/canonical/` |

## Entry points · 入口

### 一条命令跑完(推荐)

```bash
bin/design-review [--repo=<path>] [--skill=<name>] [--css=<path>]... \
                  [--critic | --multi-critic] [--learn] [--allow-monolingual] \
                  <html> [...]
```

- `--critic` / `--multi-critic` 跑 Gate 4(solo 或 4 专家并行)
- `--learn` 跑完把 verdict 喂 `learning-loop.mjs` 产出 `design-learner` prompt
- `--allow-monolingual` 对内部单语 memo 豁免双语强制(issue #2)
- 任一步 exit 非 0 整体 fail,截图存 `--out=` 或默认 `<repo>/shots/`

**本仓用例**:
```bash
bin/design-review index.html docs/HARNESS-ROADMAP.html
bin/design-review --multi-critic demos/gated-dual-clone/index.html
```

**跨仓用例**(例:engram):
```bash
bin/design-review --repo=/path/to/engram --skill=anthropic \
  --css=/path/to/engram/docs/assets/app.css \
  docs/en/index.html
```

### 分别调用(调试用)

```bash
# 1) 结构闸(静态)
python3 skills/design-review/scripts/verify.py \
  [--skill=<name>] [--css=<path>]... [--allow-monolingual] <html> [...]

# 2) 视觉闸(Playwright 渲染) · 加 --ignore-intentional 消掉 brand-intentional 噪音
node skills/design-review/scripts/visual-audit.mjs \
  [--ignore-intentional] <html>

# 3) 肉眼闸(全页截图)
node skills/design-review/scripts/screenshot.mjs <html> shot.png

# 4) 口味闸 · solo / multi critic
#    在 Claude Code 里:
Task(subagent_type="design-critic",              ...)  # 单专家
# or 4 并行:
Task(subagent_type="design-composition-critic",  ...)
Task(subagent_type="design-copy-critic",         ...)
Task(subagent_type="design-illustration-critic", ...)
Task(subagent_type="design-brand-critic",        ...)

# 5) 闭环回灌(critic 发现 → known-bugs + 机器 check)
node skills/design-review/scripts/learning-loop.mjs \
  --verdict=<path/to/verdict.json>  # 产出 design-learner prompt
# 然后在 Claude Code 里 Task(subagent_type="design-learner", ...)
```

**任一步 exit 非 0 = 没完成**。修完再跑。

## 闸口覆盖的 bug 类

| 闸口 | 抓哪些 | 依赖 |
|---|---|---|
| Gate 1 `verify.py` | 占位符(文档页 `<pre>`/`<code>` 块自动剥除,不误报)、BEM modifier-only、未定义 class(union: 默认 skill CSS + HTML link + `--css`)、`<svg>` 不平衡、hero 容器用错、`container --mod` 未与 base 同列(BEM base-less 错)、公开页缺双语(`lang-toggle` + `lang-en/zh`)| Python 标准库 |
| Gate 2 `visual-audit.mjs` | WCAG contrast < 4.5、hero 框图渲染 < 900px、SVG `<text>` 实际像素 < 9px、多列网格孤儿卡、SVG `<text>` 重叠、SVG 文字 fill 和承载 shape RGB 距离 < 40、多 h1 / heading 跳级 / 无 alt img / 无文本 a、brand 色在 top region 占比 < 0.4%、cross-skill-smell(别扮成另一个 skill)、hollow-card §10b、asymmetric-first-col-hero §10c、svg-foreign-hex、figure 无 figcaption、Fraunces/Newsreader 等非本 skill 字体、italic 滥用 —— 共 26 类,每类对应 `known-bugs.md` 1 行 | playwright |
| Gate 3 `screenshot.mjs` | 只产物不评审 —— 给人看的 | playwright |
| Gate 4 solo `design-critic` | 整页口味(构图 + 文案 + 插画 + 品牌)一位通才评审 | `Task()` subagent |
| Gate 4 multi-critic × 4 | 构图 / 文案 / 插画 / 品牌 四位专家独立 fresh-context · 权重 25/25/20/30 聚合 | `Task()` × 4 + 聚合 |

具体清单在:
- `references/known-bugs.md`(26 条,每条写 Reader sees / Why / Defense)
- `references/cross-skill-rules.md`(4 种风格共通工艺底线 · 有 §G 双语规则 + §I 卡片分组规则)
- `references/dos-and-donts.md`(每 skill 下的风格特定反例)

## Learning-loop · 闭环回灌流程

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
| 1 · 多风格 known-bugs 库 | 9 → 26 条 | **done · 扩展中** |
| 2a · canonical 参考库 | 13/40 张 | **next** · 每 session 1-2 张递进 |
| 3 · generator self-diff | 强制自评 note | 部分完成 |
| 5 · multi-critic | 4 专家并行 + 聚合 | **done** (2026-04-22) |
| 6 · `/design-loop` 编排 | planner → gen → review → critic × 3 轮 | Future(依赖 Phase 01 planner)|
| 7 · learning-loop | `design-learner` + `learning-loop.mjs` | **done** (2026-04-22) |
| 8 · library-grower | 5 张优秀产物 → 自动蒸馏新 canonical | Future(等 10+ 真实页数据)|

## 生命周期规则

design-review 发现一个 **不在 known-bugs.md 里** 的新问题 → **必须补**:

1. `known-bugs.md` 追加 1 行,写清 Reader sees / Why / Defense
2. 能静态扫 → 加 check 到 `verify.py`
3. 能渲染时扫 → 加 check 到 `visual-audit.mjs`
4. Style-specific → 同步更新对应 `<skill>-design/dos-and-donts.md`

**repo 级硬规则**:同一类问题不能被抓两次。

## Files · 文件

- `bin/design-review` — 一条命令跑完 4 闸 + 可选 `--multi-critic` / `--learn`
- `scripts/verify.py` — Gate 1 结构 check
- `scripts/visual-audit.mjs` — Gate 2 渲染 check(26 类)
- `scripts/screenshot.mjs` — Gate 3 全页截图
- `scripts/learning-loop.mjs` — Gate 4 critic verdict → design-learner prompt
- `references/known-bugs.md` — 26 条 bug 大全
- `references/cross-skill-rules.md` — 4 style 共通规则(含 §G 双语 / §I 卡片分组)
- `references/canonical/README.md` — canonical 参考库说明 + 扩库流程

## Reference

- [Anthropic · harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps) — "separate doing from judging"
- 同仓 pair:`skills/gated-dual-clone-audit/`(第 2 个独立 evaluator)
- 指南:`docs/HARNESS-ROADMAP.html`(8 组件路线图)
