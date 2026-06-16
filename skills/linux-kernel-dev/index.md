# linux-kernel-dev · 目录

> 本 skill 的导航总览。先读 `SKILL.md`（hub：Core Principles + Forbidden Actions + 导航）。

## 结构

```
linux-kernel-dev/
├── SKILL.md                 # hub：trigger + Core Principles + Forbidden Actions + references 导航
├── HARNESS-DESIGN.md        # 自我进化引擎设计（fact-gate/critic/eval/回归门/kernel-learn + 版本适配 + 树绑定）
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
    └── claims-contract.md    # [CLAIMS] 答案验证契约（fact-gate 靶子）
└── scripts/                 # 客观闸（P1）
    ├── fact_gate.mjs         # 查 API/CONFIG/符号/compatible 实存 vs 真树
    ├── checkpatch_gate.sh    # 代码风格闸（内核自带 checkpatch.pl）
    └── kernel-tree.mjs       # 绑内核树（detect/add/list/clone）
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

P0（结构化）+ P1（客观闸）完成：hub + references + `scripts/`（fact_gate / checkpatch_gate / kernel-tree）跑通——fact-gate 已对真树验证过"真假 CONFIG/API 当场分出"。下一步 **P2**（题库 + 回归门）。阶段表见 `HARNESS-DESIGN.md` §9。
