# Design Harness Roadmap

> 本文档锚定 sky-skills 4 个 design skill + 评审层的**最终架构**。
> 每一条组件都必须对应 **一个具体的模型弱点**,否则它不配留。
> 修改本文档的规矩写在文末。

## 指导来源

- **GAN**(Goodfellow et al. 2014):generator ↔ discriminator 对抗迭代,discriminator 越锐利 → generator 越强
- Anthropic [Harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps):planner / generator / evaluator 三段式,evaluator 必须独立,sprint contract,5–15 轮迭代,"simplicity first — 每个组件对应模型一个具体弱点"
- 用户硬规则:「**同一类问题不能被抓两次**」(见 `skills/design-review/references/known-bugs.md` 末尾流程)

## 目标

别人用这 9 个 skill 能达到的效果:**一句话需求 → 产物可以直接对上 anthropic.com / stripe.com / linear.app**。不是"技术上没 bug",而是有品位、有原创、有节奏、copy 过关、图示手工感强、首屏说清价值、全设备可用、无障碍、可分享。

## 8 个组件 + 每个挡的模型弱点

| # | 组件 | 落地位置 | 对应的模型弱点 |
|---|---|---|---|
| 1 | `design-planner` skill | `skills/design-planner/` | 面对模糊需求,模型用训练数据中位数填空,scope 失控 |
| 2 | **reference library**(每 style × 10 canonical page-type) | `skills/<style>-design/references/canonical/` | 无参考时输出向"最平均的 web 设计"收敛,到不了当前 style 的最好 |
| 3 | generator + self-diff 产出 | 现有 4 个 `skills/<style>-design/` | 模型不主动复盘设计决策,critic 没有具体靶子可打 |
| 4 | mechanical-review 扩展(多视口 / a11y / perf / SEO) | `skills/design-review/`(强化当前) | runtime 行为(跨视口、可达性、性能)模型不会自检 |
| 5 | **multi-critic**(4 个独立 subagent) | `.claude/agents/design-{composition,copy,illustration,brand-coherence}-critic.md` | 评判自己作品倾向整体称赞;单 critic 的注意力预算不够分给 4 个正交维度 |
| 6 | `/design-loop` 编排器 | `.claude/commands/design-loop.md` | 模型一次产出倾向"够用就停";无编排 → 实际只迭代 1–2 轮 |
| 7 | learning-loop | `.claude/commands/design-learn.md` + auto-PR | 模型不会自动归档"critic 抓到的新问题";不做 → 同类 bug 重复出现 |
| 8 | reference-library-grower | `.claude/commands/design-distill.md` + human approval | 模型无自组织"过去优秀产物"的能力;不做 → library 不会变好,system 半年失效 |

**裁剪规则**:某一行若未来有证据证明其弱点不真实,当场用数据裁掉。没证据 → 不裁。

## 硬依赖决定的推进顺序

```
期 0–1(已完成 2026-04-20 · commit a7cfc64):
  design-review skill + 三道闸去重 + known-bugs 入库

期 1.5(next · 补丁层):
  cross-repo --css / --repo / bin/design-review 壳 / --ignore-intentional
       ↓
期 2a(starter · 最大投入):
  每 style × 3 canonical(landing / pricing / docs-home)
       ↓
期 1(planner):
  design-planner + sprint contract(要 [2a] 让 planner 知道 page-type 长啥样)
       ↓
期 3(generator self-diff 约定 + mechanical-review 扩展)
       ↓
期 5(multi-critic,4 个独立 subagent):
  要 [2a] 作为每 style 的判定基准
       ↓
期 6(/design-loop 编排):
  前面全就位才能串起来
       ↓
跑 10+ 张真实页,数据够了 ↓
       ↓
期 7(learning-loop)+ 期 8(library-grower)+ 期 2b(每 style × 10 canonical 完整库)
```

## 4 个 style 的风格保全(硬约束)

这是最怕跑偏的一条:harness 越复杂,**越容易把 4 个 style 抹平成一个味道**。明确分层:

| 层 | 住哪 | 职责 | 会不会抹平风格 |
|---|---|---|---|
| Universal 质量规则 | `skills/design-review/references/cross-skill-rules.md` | 对比度、占位符、孤儿卡、SVG 文字像素 —— 只管"能不能用" | **不会**,不碰"什么样才对" |
| 跨 style 已知 bug + 各 style 专属分节 | `skills/design-review/references/known-bugs.md` | 已按分节组织,橙 CTA 在 anthropic 节,sage 绿对比度在 sage 节 | **不会**,按 style 分类 |
| **Style canonical 例子** | `skills/<style>-design/references/canonical/` | 每个 style 自己的 10 个 page-type 典范 | **强化风格** —— apple pricing 和 sage pricing 长得完全不一样 |
| Style 个性规则 | `skills/<style>-design/references/dos-and-donts.md` | 色板、字体、签名动作 | 强化风格 |
| critic 的判断基准 | subagent prompt 里读**该 style** 的 canonical + dos-and-donts | critic 永远只说"这是不是一张好的 <style> 页" | **不会** —— 品味锚定在 style 自己的 library |

**最硬的一条**:**4 个 style 的 canonical 不互抄、不共享、不跨 style 引用**。library 是 style 的身份证,拷贝另一个 style 的 canonical 就是偷身份。

## 质量验收(每期交付必过)

每完成一期,必须:

1. `skills/design-review/` 三道闸跑过本期 touches 到的所有 demo / canonical / 真实页,exit 0
2. 至少 1 张 **repo 内** 真实页 + 1 张 **跨仓** 真实页(engram)压测通过
3. `docs/HARNESS-ROADMAP.md` 的"今天的状态"章节同步一次
4. 如果本期引入新 bug 类 → `known-bugs.md` 加行 + 对应 check

## 今天的状态(2026-04-20)

- ✅ **期 0**:known-bugs 9 条从 memory 搬进 repo(`skills/design-review/references/known-bugs.md`)
- ✅ **期 1**:4 份重复脚本合并到 `skills/design-review/scripts/`,`--skill=` 或 CSS link 自动识别
- ✅ 跨仓压测过 engram/docs/en/index.html + repo 根 index.html,三道闸各 exit 0
- 🔨 **期 1.5**:next(补丁层 — `--css` / `--repo` / `bin/design-review` 壳 / `--ignore-intentional`)
- 🔨 **期 2a starter**:最大单项投入(每 style × 3 canonical = 12 页)

## 修改本文档的规矩

- **增组件** → 必须写出"对应什么模型弱点",没弱点不收
- **删组件** → 必须写出"证据表明这弱点不存在",靠感觉不删
- 每次跑完一张真实 web → 回"今天的状态"章节同步
- 每次发现 harness 在跑偏(抹平 style / 增加噪音 / 给生成器作弊机会),在文末"历史教训"追加一段

## 历史教训

### 2026-04-20 · "simplicity first" 不是硬规则

讨论架构时,我(Claude)一度引用文章里 "simplicity first" 把 8 组件砍到 5,退掉了 multi-critic、learning-loop、reference-grower。用户正确地反问"为什么又不是 8 了"。

**教训**:文章的 "simplicity first" 是 **通用 harness** 的经验法则,不是硬规则。用户显式目标是"做到最好,不考虑难度",这时应该以文章**真正的硬规矩**——"每个组件对应一个具体模型弱点"——为裁剪标准,而不是数目。

**以后的做法**:每次考虑删组件时,先问"这一条对应的模型弱点不存在了吗?"有证据才删,没证据不删。
