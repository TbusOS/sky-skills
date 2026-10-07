# 开发路线

这个文件记录 sky-skills 里**正在进行**的开发:要做什么、做到哪一步、下一步做什么、
换一台电脑怎么接着做。每个项目的需求、设计、实施计划是单独的文档,这里只放入口和当前状态。

进度一变就更新本文件的「当前状态」和「下一步」。项目做完后,条目移到「已完成」,文档链接保留。

---

## 开发约定

1. **动代码之前先写三份文档,推到 main**:
   - 需求文档 —— 要做出什么、做到什么程度算完成;需求逐条编号,标优先级和所属阶段
   - 设计书 —— 怎么做、为什么这么做、有哪些风险
   - 实施计划 —— 逐个任务的步骤,写明要改的文件、代码、测试和预期输出

   放在 `docs/superpowers/specs/<日期>-<主题>-requirements.md`、`…-design.md` 和
   `docs/superpowers/plans/<日期>-<主题>-<阶段>.md`。
2. 实施计划里的代码,推送前先在临时目录里实跑一遍,测试要真的通过。
3. 每个新脚本带 `--selftest`;再把被测的逻辑临时去掉跑一次,测试必须失败,证明测试不是摆设。
4. 中文文档推送前跑作者本机的中文用词检查(两张词表:商业黑话、自造简称),0 条才推。
5. 提交信息不加 AI 署名。

---

## 进行中

### kernel-review —— 内核 / BSP patch 审查者

| | |
|---|---|
| 一句话 | 用 git submodule 引用 [masoncl/review-prompts](https://github.com/masoncl/review-prompts)([sashiko](https://github.com/sashiko-dev/sashiko) 所用的内核审查规则,MIT),新建一个独立的「审查者」skill,先用来审 BSP / 厂商 patch |
| 需求 | [specs/2026-10-08-kernel-review-requirements.md](specs/2026-10-08-kernel-review-requirements.md) |
| 设计 | [specs/2026-10-08-kernel-review-design.md](specs/2026-10-08-kernel-review-design.md) |
| P0 实施计划 | [plans/2026-10-08-kernel-review-p0.md](plans/2026-10-08-kernel-review-p0.md) |
| 开始日期 | 2026-10-08 |
| 当前阶段 | P0 规划完成,产品代码还没开始写 |

**为什么做**:`linux-kernel-dev` 只会写代码,审 patch 只有代码风格检查。社区的 review-prompts
有成熟的审查流程和误报排查清单,但没有 gpio / pinctrl / clk / regulator / ASoC 等 BSP 驱动
子系统的规则,这正是本仓能补的部分。

**已定的决策**(2026-10-08)

| # | 决策 |
|---|---|
| D1 | 审查者先用来审 BSP / 厂商 patch(老内核、厂商宏开关、defconfig) |
| D2 | 暂不向上游提 PR,只在本仓做;BSP 规则一开始就按上游格式写(英文、`bsp-` 前缀、带内核源码出处),以后要提不用改格式。提上游的条件见设计书 §10 |
| D3 | 引用上游,不复制;上游文件不进本仓 git 历史 |
| D4 | `kernel-review` 做成独立 skill,不并进 `linux-kernel-dev`:审查者不继承写代码时的假设 |

**当前状态**(2026-10-08)

- 三份文档已在 main 上。
- P0 计划里的代码已在临时目录里实跑:48 个单元测试通过;三处「故意改坏」的检查都按预期失败;
  自动更新的 submodule 测试打补丁前失败、打补丁后通过。
- 仓库里**还没有** `skills/kernel-review/` 目录和 `third_party/review-prompts` submodule,
  这两样是 P0 任务 1–6 的产物。

**下一步**

1. 选执行方式:逐个任务派新的 agent 做、每个任务单独审查;或者在一个会话里连续做完,最后整体审查一次。规划时推荐后者,因为四个脚本的代码已经实跑通过。
2. 按 P0 计划执行任务 1–11。
3. 任务 12 端到端验收:**需要人参与**。开一个不带上下文的新会话,在含该提交的内核树里说「用 kernel-review 审一下 7b9b77a8bba9」,不提示答案;再由人判断审查结果有没有指出标准答案(gpiolib_cdev_register() 出错路径泄漏 workqueue 和字符设备)。
4. P0 完成后写 P1 实施计划(审查前的确定性预检、审查意见里代码引用的核对)。

**阶段一览**

| 阶段 | 内容 | 状态 |
|---|---|---|
| P0 接入 | submodule、四个脚本、SKILL.md、自动更新、README / 安装页 / 首页、订正调研页、端到端验收 | 计划已写,未开始 |
| P1 确定性预检 + 引用核对 | 审查前调用 linux-kernel-dev 的脚本;核对审查意见引用的代码是否真实存在 | 未写计划 |
| P2 第一批 BSP 规则 | gpio / ASoC / iio / phy / pinctrl + BSP 误报排除规则 | 未写计划 |
| P3 基准测试 | sashiko 基准里这 5 个子系统的 64 条 + 本地 BSP 题库;对比「只用上游」和「上游 + BSP 规则」 | 未写计划 |
| P4 展示与决定 | 有正向结果才做展示页;决定是否提上游;第二批规则 | 未写计划 |

**换一台电脑接着做**

```bash
git clone --recurse-submodules https://github.com/TbusOS/sky-skills.git
cd sky-skills
# 按顺序读:需求 → 设计 → P0 实施计划,再看本文件的「下一步」
```

参考仓库(只读,用来查上游规则和基准题库,不放进本仓):

```bash
# 上游审查规则。P0 任务 1 加了 submodule 之后,这一步可以省掉
git clone https://github.com/masoncl/review-prompts.git ~/src/review-prompts
# sashiko:多阶段审查流水线,基准题库在 benchmarks/benchmark.json
git clone https://github.com/sashiko-dev/sashiko.git
```

任务 12 的端到端验收需要一棵包含提交 `7b9b77a8bba9` 的内核树(主线或 stable 都可以;
2026-10-08 在一棵本机 stable 树里确认过有这个提交)。没有现成的树时:

```bash
# --filter=blob:none:先只下载提交记录和目录结构,文件内容用到时再取。
# 审查只用 git show / git grep 读提交当时的文件,这样就够用,省时间和磁盘
git clone --filter=blob:none https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git
git -C linux cat-file -t 7b9b77a8bba9    # 应输出 commit
```

---

## 已完成

本文件 2026-10-08 新建。之前完成的工作见 `git log` 和各 skill 自己的文档。
