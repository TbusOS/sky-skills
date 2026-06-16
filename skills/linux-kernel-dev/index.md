# linux-kernel-dev · 目录

> 本 skill 的导航总览。先读 `SKILL.md`（hub：Core Principles + Forbidden Actions + 导航）。

## 结构

```
linux-kernel-dev/
├── SKILL.md                 # hub：trigger + Core Principles + Forbidden Actions + references 导航
├── HARNESS-DESIGN.md        # 自我进化引擎设计（事实检查/critic/eval/回归测试/kernel-learn + 版本适配 + 树绑定）
├── index.md                 # 本文件
├── dos-and-donts.md         # 随用积累的细则（带可执行检查）        [骨架]
├── known-bugs.md            # 踩过的坑 gotchas（带回归证明）        [骨架]
└── references/              # 按需加载的深潜（每份对齐 Documentation）
    ├── coding-style.md      # ← process/coding-style.rst
    ├── templates.md         # module/driver/chardev/Makefile/Kconfig/DT
    ├── concurrency.md       # ← locking/ + memory-barriers.txt + atomic_t.txt
    ├── debugging.md         # printk/ftrace/oops/工具
    ├── api-quick-ref.md     # ← core-api/ + driver-api/
    ├── patch-workflow.md    # ← process/submitting-patches.rst
    ├── bsp_discipline.md    # 通用 BSP 纪律（defconfig/上游gate/硬件读字节/4维度/冲突6步）
    ├── kernel_version_deltas.md  # 跨版本差异（版本敏感知识集中处）   [骨架/待核]
    └── claims-contract.md    # [CLAIMS] 答案验证契约（事实检查 靶子）
├── scripts/                 # 客观检查（P1）+ 回归测试（P2）
│   ├── fact_gate.mjs         # 查 API/CONFIG/符号/compatible 实存 vs 真树
│   ├── checkpatch_gate.sh    # 代码风格检查（内核自带 checkpatch.pl）
│   ├── kernel-tree.mjs       # 绑内核树（detect/add/list/clone）
│   ├── regression_test.mjs   # 回归测试:gold 用例 + 自降解校准 + 覆盖率
│   ├── kernel-critic.mjs     # 打分面板 prompt 准备（P3，4 轴）
│   ├── kernel_learn_validate.mjs  # /kernel-learn 原子三件套确定性验证（P3）
│   └── version_drift.mjs     # 版本适配:多版本树对比,报 rotted（P4）
├── tests/eval/              # 测试用例（P2）
│   ├── cases/*.json          # 每条:gold_claims + corruptions + objective/subjective
│   └── baseline.json         # 基线（--baseline 记录,--check 对比）
└── evolution/              # 记录表 + 规则（P4，复用 design-evolve 脚本）
    ├── ledger.tsv            # 改动实验流水（evolve-ledger.mjs --ledger=）
    └── rules.json            # 规则注册 + fires/catches（evolve-rules.mjs --registry=）

# 仓根 .claude/（symlink 到 ~/.claude，跨技能共享）
.claude/agents/kernel-{correctness,safety,coding-style,completeness}-critic.md   # 打分面板 4 轴（P3）
.claude/commands/kernel-learn.md                                                 # /kernel-learn 学习循环（P3）
```

## 加载指引

| 任务 | 读 |
|---|---|
| 写/审内核代码 | `references/coding-style.md` + `references/templates.md` |
| 锁/并发 | `references/concurrency.md` |
| 调 bug / oops | `references/debugging.md` |
| 查 API | `references/api-quick-ref.md` |
| 提 patch | `references/patch-workflow.md` |
| 板级/厂商定制、defconfig、迁移冲突 | `references/bsp_discipline.md` |
| 跨内核版本 | `references/kernel_version_deltas.md` |
| 引擎设计/状态 | `HARNESS-DESIGN.md` |

## 状态

P0（结构化）+ P1（客观检查）+ P2（测试用例 + 回归测试）+ P3（打分面板 + /kernel-learn）完成：
- P1：事实检查已对真树验证过"真假 CONFIG/API 当场分出"
- P2：3 条种子用例 + `regression_test.mjs`（gold 全过 + 自降解校准 + 覆盖率），`--baseline`/`--check` 跑通
- P3：4 轴打分面板（correctness 0.35 / safety 0.30 / coding-style 0.20 / completeness 0.15，`kernel-critic.mjs` 准备 prompt，Task 派子 agent）+ `/kernel-learn` 原子三件套（`kernel_learn_validate.mjs` 确定性验证:有 [CLAIMS]→过、无→拒）
- P4：记录表/规则复用 design-evolve（`evolve-ledger.mjs --ledger=` 直用、`evolve-rules.mjs --registry=` 加小补丁），`evolution/{ledger.tsv,rules.json}` 已建 + seed 规则；`version_drift.mjs` 实测 6.1→7.0 抓到 `ion_alloc` ROTTED（机器跑出版本漂）
引擎 6 组件全落。下一步 **Pages**（架构/能力/版本适配 3 页，过三检查 + anthropic-design）。阶段表见 `HARNESS-DESIGN.md` §9。
