---
name: design-planner
description: "Use when the user gives a vague one-line brief for a web page ('做个 X 的页面' / 'we need a dashboard for Y') and a design skill (anthropic/apple/ember/sage) will generate it. Expands the brief into a concrete plan: infer page-type + audience, pull the sprint contract via bin/design-review --plan (unknown page-types fall back to the nearest canonical, stamped LOW-CONFIDENCE), then write a section list with required content per section plus the hard numbers (diagram density, bilingual, brand presence). DO NOT TRIGGER when the user already provides a section-level spec, or for non-page work (components, refactors)."
last-verified: 2026-06-11
---

# design-planner — 把一句话需求展开成可执行的页面计划

用户常常只给一句话:"做个介绍我们调度器的页面"。直接开写的结果是结构随机、图不够、品牌信号缺失。这个 skill 的职责是在生成器动笔之前,把模糊 brief 变成:page-type + 受众 + section 清单 + 每个 section 必含的内容 + 硬指标,然后连同 sprint contract 一起交给生成流程。

## 三层约束哲学

规划时分清三类约束,别混在一起:

1. **审美不可变** — skill 的视觉语言(字体、色板、品牌色出现方式)由 `skills/<skill>-design/references/` 定义,规划阶段不讨论、不修改。
2. **质量是机器闸** — 图密度、双语、对比度等由 `verify.py` + `visual-audit.mjs` + critic 把关。计划里写明这些数字是为了第一稿就过闸,不是重新发明规则。
3. **结构自由定制** — section 的数量、顺序、形态由内容决定。contract §1 的结构 MUST 来自 canonical,对已知 page-type 是强默认;对 LOW-CONFIDENCE contract(无 canonical 的类型)只是参考。**这个 skill 输出的是计划,不是强制规格** — 生成器在审美与质量两层之内有完全的结构自由。

## 流程

### ① 问清或推断 page-type 与受众

从 brief 提取两件事;能推断就推断,推不出来才问(最多问一次,合并成一条消息):

- **page-type**:landing / pricing / docs-home / feature-deep / blog-index / comparison / product-detail,或这之外的任何类型(dashboard、form、changelog……)。关键词对照:卖东西+分档 → pricing;入口+导航 → docs-home / landing;讲透一个功能 → feature-deep;数据面板 → dashboard;文章列表 → blog-index。
- **受众**:工程师 / 决策者 / 普通用户?中文、英文还是双语?(公开页面默认双语,§G 强制。)

### ② 拿 sprint contract

```bash
bin/design-review --plan --skill=<anthropic|apple|ember|sage> --page=<type> > /tmp/contract.md
```

- 已知类型:contract 含该 canonical 的结构 MUST,照常执行。
- 未知类型:脚本自动借最近的 canonical(dashboard→docs-home、form→pricing、article/blog→blog-index、其他→landing),contract 标注 **LOW-CONFIDENCE**——结构条目降级为默认值,其余段(§1b 图密度、§2 品牌、§5 双语、§6 字体、§7 色板)照常绑定。stderr 会显式说明借用了谁。

### ③ 把 brief 展开成 section 计划

读完 contract 后,按下面模板输出计划。每个 section 一行结构 + 一行内容 + 一行视觉,逼自己回答"这一屏放什么图":

```markdown
# 页面计划 · <skill> · <page-type>[ · LOW-CONFIDENCE 借 <type>]

受众:<谁在看,带着什么问题来>
一句话定位:<这页让读者带走什么>

## Sections
1. <section 名> — <为什么排在这>
   内容:<必须出现的事实/数字/对象,具体到条目>
   视觉:<图的类型(flow/timeline/bit-field/stat…)+ 预估 label 数 → 容器档位>
2. …(每屏 ≈1300px 至少 1 个视觉,text-desert 在 2600px 处 warn)

## 硬指标(来自 contract,生成器不可越过)
- 图密度:≥1 visual / 1.5 屏;label ≥20 或 ≥4 列 → 用宽容器档
- 品牌:<accent 色> 在顶部 1440×500 内可见(≥<阈值> 覆盖)
- 双语:zh/en toggle + Noto 字体栈(apple 例外)
- 色板/字体:只用 design-tokens.md 定义的值

## 不确定点
- <LOW-CONFIDENCE 时:哪些借来的结构条目可能不适用,替代方案是什么>
```

内容展开的原则:把 brief 里每个名词变成"读者需要知道的 3 件事",每个数字、对比、流程都标注成视觉候选(contract §1b 的内容形状表是对照清单)。

### ④ 交给生成流程

把 `计划 + /tmp/contract.md` 一起交给生成器(对应 design skill)。生成器先读 contract §0 的文件,再按计划写;写完跑 `bin/design-review <page.html>` 三闸。计划与 contract 冲突时:审美/质量层听 contract,结构层听计划。

## 边界

- 不替用户做产品决策:brief 里没有的事实不要编造,留在"不确定点"里。
- 不改 contract、不改 canonical、不调闸的阈值——那是 design-review / design-learner 的领地。
- 计划超过 ~12 个 section 时先怀疑 scope:一页讲不完就拆页,不要塞。
