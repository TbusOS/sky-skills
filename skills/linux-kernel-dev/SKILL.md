---
name: linux-kernel-dev
description: "Linux kernel and driver development assistant. TRIGGER when: user works on kernel modules, device drivers, kernel subsystems, Kconfig, Makefile, device tree (.dts/.dtsi), or C code using kernel APIs (kmalloc, printk, module_init, platform_driver, etc.). DO NOT TRIGGER when: userspace C/C++ programs, general systems programming without kernel involvement."
---

# Linux Kernel & Driver Development

Write, review, debug, and maintain Linux kernel code: modules, device drivers,
subsystem patches, build configs, device trees. Plus BSP customization discipline.

This file is the **hub**: it holds the always-on rules and a map to the deep
references. Load a reference only when the task needs it (progressive disclosure).

---

## Core Principles

1. **Kernel coding style is its own standard** — `Documentation/process/coding-style.rst`, NOT GNU or Google. Tabs (8 wide), `/* */` comments, K&R braces.
2. **Security first** — kernel code runs in ring 0; a bug can crash the system or become a CVE.
3. **No userspace habits** — no `malloc`/`free`, no `printf`, no floating point, no libc.
4. **Upstream mindset** — write as if submitting to LKML; run `checkpatch.pl` before any patch.
5. **Verify, don't guess** — when a real kernel tree is bound, every cited symbol / CONFIG / compatible should resolve in it (see HARNESS-DESIGN.md §6.10). State `[未验证]` when no tree is bound rather than asserting.

---

## Forbidden Actions (hard rules — not suggestions)

1. **Never sleep in atomic context** — no `mutex_lock`, `msleep`, `usleep_range`, or `GFP_KERNEL` allocation while holding a spinlock or in an interrupt/softirq handler. Use `spinlock` + `GFP_ATOMIC` there.
2. **Never use floating point** in kernel code — no FPU, no `float`/`double` math.
3. **Never use userspace idioms** — no `malloc`/`free`/`printf`/libc; use `kmalloc`/`kfree`/`pr_*`/`dev_*`.
4. **Never break UAPI** — changing `include/uapi/` headers breaks binary compatibility with existing userspace; needs a versioning/compat plan.
5. **Never rely on internal (non-stable) symbols** where a stable interface is required (e.g. vendor modules against a stable KMI) — internal symbols change across versions.
6. **Never hand-edit a `defconfig`** — go through the framework's native flow (`merge_config.sh` + `make olddefconfig` + `savedefconfig`). See `references/bsp_discipline.md`.
7. **Never ignore `checkpatch.pl` errors** before submitting a patch.
8. **Never delete upstream code to customize** — default to keeping it + a vendor config gate (`#if defined(CONFIG_<VENDOR>_<PURPOSE>)`). See `references/bsp_discipline.md`.
9. **Never conclude a hardware state from software observation alone** — read the bytes directly (register/OTP/eFuse dump). See `references/bsp_discipline.md`.
10. **Never decide a change is safe on the compile dimension alone** — check the 4 dimensions (compile / runtime path / semantics / compliance). See `references/bsp_discipline.md`.

---

## References (load on demand)

| 任务 | 加载 | 权威源（对齐） |
|---|---|---|
| 内核代码风格 / 审码 | `references/coding-style.md` | `Documentation/process/coding-style.rst` |
| 新建 module / driver / chardev / Makefile / Kconfig / DT | `references/templates.md` | `Documentation/kbuild/`, `Documentation/devicetree/bindings/` |
| 锁 / 并发 / 原子 | `references/concurrency.md` | `Documentation/locking/`, `memory-barriers.txt`, `atomic_t.txt` |
| 调试（printk / ftrace / oops / 工具） | `references/debugging.md` | `Documentation/admin-guide/`, `dev-tools/` |
| 内核 API 速查 | `references/api-quick-ref.md` | `Documentation/core-api/`, `driver-api/` |
| 提交 patch / checkpatch / format-patch | `references/patch-workflow.md` | `Documentation/process/submitting-patches.rst` |
| **BSP 定制纪律**（defconfig / 上游 gate / 硬件调试 / 改动分析 / 冲突解决） | `references/bsp_discipline.md` | 通用工程纪律 |
| 跨内核版本差异 | `references/kernel_version_deltas.md` | 各版本树 + `Documentation` |
| **答案验证契约**（引具体符号时附 `[CLAIMS]`） | `references/claims-contract.md` | fact-gate 靶子 |
| 该做 / 不该做速查 | `dos-and-donts.md` | 本 skill 积累 |
| 已知坑（gotchas） | `known-bugs.md` | 本 skill 积累 |

目录总览见 `index.md`。

---

## 关于本 skill 的自我进化引擎

本 skill 正在配一套有度量的自我改进机制（fact-gate / critic 面板 / eval 题库 / 回归门 / `/kernel-learn`），
并能跟随内核版本自更新。设计与状态见同目录 `HARNESS-DESIGN.md`。
`dos-and-donts.md` / `known-bugs.md` 会随真实任务由该机制逐步充实——每条都带可执行检查，不是空话。

**已落（P1 客观闸）**：
- `scripts/fact_gate.mjs` — 查答案 `[CLAIMS]` 里的 API / CONFIG / 符号 / compatible 是否在真内核树**实存**（树无关 `--tree`；exit 0 干净 / 1 有幻觉 / 3 闸坏不算 fail）
- `scripts/checkpatch_gate.sh` — 用内核自带 `checkpatch.pl` 校代码风格
- `scripts/kernel-tree.mjs` — 绑内核树（`detect` / `add` / `list` / `clone`），路径存本机配置不入库
- 引具体符号的答案附 `[CLAIMS]` 块（`references/claims-contract.md`）；绑树后跑 fact-gate，答案标 `[已对 linux <版本> 验证]` 或 `[未验证]`
