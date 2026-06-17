# Known Bugs / Gotchas

> 踩过的内核/BSP 坑（gotchas）。由 `/kernel-learn`（P3 建）随真实任务积累。
> 每条带可执行检查 + 配套 测试用例（建前 fail / 建后 pass），证明"这坑不再复现"。
> 当前为骨架。

## 条目格式

```
### KB-NNN: <坑的一句话>
- symptom: <表现 / 报错>
- root cause: <真因（抽象到通用原则）>
- fix: <怎么修>
- trigger: <什么关键词/症状该触发本条>
- range: <版本区间，无标=版本无关>
- check: <可执行检查：[CLAIMS] 或 scripts/checks/<name>>
- linked_eval_case: <KV-xxx>
- fires/catches: <由 evolve-rules 维护>
```

## 一行索引（grep 用，先读这里再钻具体条目）

- KB-ION-001 · 现代内核移除了 ION，分配 DMA 缓冲用 DMA-heap（dma_heap_buffer_alloc），别用 ion_alloc · KV-004 · range：ION-removed kernels
- KB-IRQ-001 · 硬中断 / 软中断(tasklet/softirq)上下文不能睡眠；要睡眠的延迟处理用 threaded IRQ 的 thread_fn 或 workqueue · KV-006 · range：版本无关

## 条目

### KB-ION-001：现代内核移除了 ION，分配 DMA 缓冲要用 DMA-heap API

- symptom：在较新内核上编译报 `implicit declaration of function 'ion_alloc'` / 链接 undefined reference；移植旧 BSP 的缓冲分配代码时尤甚。
- root cause：ION 子系统在较新内核已被移除。遗留代码与旧教程里的 `ion_alloc` / `ion_client_create` 在新树上根本不存在——这是个会随版本失效的断言，不是写法问题。
- fix：用 DMA-heap API 分配 DMA-able 缓冲（`dma_heap_buffer_alloc`）。
- trigger：见到 `ion_alloc` / `ion_client_create` / ION，或在新内核上移植旧 BSP 的缓冲分配。
- range：ION 在较新内核已移除；用 `version_drift.mjs` 对目标树核实（本条由 6.1→7.0 实跑抓出）。
- scope/limits：版本敏感条目，须对 ION-removed 的现代树验证；老树（ION 仍在）上 `ion_alloc` 仍解析得到。
- check：
  ```
  [CLAIMS]
  api: dma_heap_buffer_alloc
  [/CLAIMS]
  ```
- linked_eval_case：KV-004
- provenance：self（version_drift 实跑抓出 ion_alloc ROTTED）
- fires/catches：0 / 0

### KB-IRQ-001：原子/中断上下文不能睡眠，需要睡眠的延迟处理放对地方

- symptom：在中断处理函数 / tasklet / softirq 里调 `msleep` / `mutex_lock` / `GFP_KERNEL` 分配 / 读慢速总线，导致 `BUG: scheduling while atomic`、死锁、或偶发崩。
- root cause：硬中断半部和软中断（tasklet/softirq）都在原子上下文运行，不可调度、不可睡眠。把可睡眠的活放进了这些上下文。
- fix：可睡眠的延迟处理放到进程上下文——threaded IRQ 的 `thread_fn`（`request_threaded_irq`），或 workqueue（`INIT_WORK` + `schedule_work`）。硬中断半部只做最少快处理后返回 `IRQ_WAKE_THREAD`。
- trigger：见到中断 handler / tasklet / softirq 里出现 `msleep` / `mutex_lock` / `GFP_KERNEL` / 慢速 I/O，或问"中断里能不能睡 / 下半部用什么"。
- range：版本无关（原子上下文不睡眠是内核长期不变规则）。
- scope/limits：约束的是"在哪个上下文睡眠"；具体 API 名按目标树 `include/linux/interrupt.h` / `linux/workqueue.h` 核。
- check：
  ```
  [CLAIMS]
  api: request_threaded_irq, schedule_work
  [/CLAIMS]
  ```
- linked_eval_case：KV-006
- provenance：self（从内核子系统知识库内容源蒸馏 + 真树核对中断上下文语义；样板子系统：中断）
- fires/catches：0 / 0
