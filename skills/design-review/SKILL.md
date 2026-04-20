---
name: design-review
description: "Independent evaluator for any design-skill output (anthropic-design / apple-design / ember-design / sage-design). TRIGGER when a demo / template / landing page has just been written with one of the 4 design skills and is about to be shipped. Runs three hard gates — structural verify (placeholders, BEM, undefined classes), rendered visual-audit (contrast, hero diagram sizing, orphan cards, SVG text), and full-page screenshot. Inspired by GAN's discriminator: this skill deliberately lives outside the generator skills so the reviewer does not inherit the generator's assumptions."
last-verified: 2026-04-20
---

# design-review — Separate Evaluator for Design-Skill Output

## Why this skill exists

在 Anthropic [harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps) 一文里，最要紧的一条：

> "Agents tend to praise their own work confidently — even when quality is
>  obviously mediocre to a human observer. Separating the agent doing the work
>  from the agent evaluating it is a powerful lever."

4 个 design skill 是 **generator**。它们知道风格、会写 HTML，但也**天然会给自己打高分**。
`design-review` 是独立的 **evaluator**：

- 它的脚本、规则、已知 bug 清单**不属于任何一个风格**，4 种风格共用同一套工艺底线。
- 它只负责评判，不负责生成。任何修复动作回到对应的 generator skill 里执行。
- 将来（期 3）还会再加一个 `design-critic` subagent，在**独立 context** 里读截图 + 本 skill 的 rules，做 taste 级评审。

这一期（期 0 + 期 1）是静态基础：合并 4 份重复脚本、把 9 条已知 bug 从我的 memory 搬进 repo。

## 使用方式

### 推荐:一条命令(本仓 / 跨仓通用)

```bash
bin/design-review [--repo=<path>] [--skill=<name>] [--css=<path>]... <html> [...]
```

一次性跑完 3 闸:verify.py + visual-audit.mjs `--ignore-intentional` + screenshot.mjs。
任一步 exit 非 0 整体 fail,截图存到 `--out=` 或默认 `<repo>/shots/`。

**本仓用例**:
```bash
bin/design-review index.html docs/HARNESS-ROADMAP.html
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
  [--skill=<name>] [--css=<path>]... <path/to/html> [...]

# 2) 视觉闸(Playwright 渲染) —— 加 --ignore-intentional 消掉 3.12 brand 噪音
node skills/design-review/scripts/visual-audit.mjs \
  [--ignore-intentional] <path/to/html>

# 3) 肉眼闸(全页截图)
node skills/design-review/scripts/screenshot.mjs <path/to/html> shot.png
```

**任一步 exit 非 0 = 没完成**。修完再跑。

### 参数语义

- **`--skill=<name>`**(verify.py / bin/design-review)—— 选 `anthropic|apple|ember|sage`。省略时 verify.py 从 HTML 的 `<link href="...*.css">` 自动识别;识别不到就要求显式传入。
- **`--css=<path>`**(verify.py / bin/design-review,可重复)—— 追加 CSS 文件到 class 定义查找。跨仓常用:sky-skills 默认只看 sky-skills/skills/&lt;skill&gt;-design/assets/&lt;skill&gt;.css,engram 自己的 `docs/assets/app.css` 需要显式传入。
- **自动 link 识别**(verify.py 默认开启)—— HTML 里的 `<link rel="stylesheet" href="...*.css">` 被解析并加入查找集合(相对 HTML 目录),跨仓 HTML 无需手动配置就能工作。
- **`--ignore-intentional`**(visual-audit.mjs / bin/design-review 默认开启)—— 过滤已在 known-bugs.md 登记为 brand-intentional 的对比度告警(当前:anthropic 橙 CTA 白字 3.12)。信号变干净,真新 bug 不被淹没。

## 闸口覆盖的 bug 类

| 闸口 | 抓哪些 | 依赖 |
|---|---|---|
| verify.py | 占位符字符串(文档页的 `<pre>`/`<code>` 块自动剥除,不误报)、BEM modifier-only、未定义 class(union: 默认 skill CSS + HTML link + --css)、`<svg>` 不平衡、hero 容器用错 | Python 标准库 |
| visual-audit.mjs | WCAG contrast < 4.5 (按钮/徽章)、hero 框图渲染 < 900px、SVG `<text>` 实际像素 < 9px、多列网格孤儿卡、**SVG `<text>` 互相重叠 ≥ 4×4 px(known-bugs 1.8)**、**SVG 文字 fill 和承载 shape fill 的 RGB 距离 < 40(known-bugs 1.9)**、**多 h1 / heading 跳级 / 无 alt img / 无文本 a(known-bugs 1.10-1.12)** | playwright |
| screenshot.mjs | 只产物不评审 —— 给人看的 | playwright |

具体清单在 `references/known-bugs.md` 和 `references/cross-skill-rules.md`。

## 阅读顺序

1. `references/cross-skill-rules.md` — 4 种风格共通的工艺底线（结构 / 渲染 / 视觉原创性 / 代码质量）
2. `references/known-bugs.md` — 9 条已知 bug，每条都写了 Reader sees / Why / Defense

## 生命周期规则（每次都要做）

design-review 发现一个**不在 known-bugs.md 里**的新问题 → 这条规则必须补上：

1. 在 `references/known-bugs.md` 追加一行，写清 Reader sees / Why / Defense。
2. 能静态扫到的 → 加一个 check 到 `scripts/verify.py`。
3. 能渲染时扫到的 → 加一个 check 到 `scripts/visual-audit.mjs`。
4. 如果是 style-specific → 同时更新对应 skill 的 `references/dos-and-donts.md`。

这是 repo 级的硬规则:**同一类问题不能被抓两次**。

## 将来要做什么（路线图，和本 skill 解耦）

- 期 2 · `design-planner` skill:把一句话需求展开成 sprint contract，和本 skill 配套做"开工前先协商完成标准"。
- 期 3 · `design-critic` agent:独立 context 的 LLM 评审员,读截图 + 本 skill 的 `references/` + sprint contract,打结构化分数并返回 must_fix 清单。
- 期 4 · `/design-loop` 命令:planner → generator → review(本 skill) → critic → 迭代,3 轮内通过或停。

期 0–1（本次）只完成"reviewer 独立于 generator"这一件事。
