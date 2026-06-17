# Interrupts & Deferred Work

> 权威源：`Documentation/core-api/genericirq.rst`、`Documentation/core-api/irq/concepts.rst`、
> `Documentation/core-api/irq/irq-domain.rst`、`Documentation/driver-api/basics.rst`（IRQ 一节）。
> 原型/标志/上下文以目标树 `include/linux/interrupt.h` 为准——中断 bug 直接崩内核，别凭记忆。

何时加载本模块：申请/释放中断、写中断处理函数、做下半部/延迟处理、threaded IRQ、tasklet/softirq/workqueue 选型、共享中断、中断与进程上下文共享数据。

## 上下文速查（最关键，决定能不能睡）

| 在哪 | 能睡? | 干什么 |
|---|---|---|
| 硬中断处理（`request_irq` 的 handler / `request_threaded_irq` 的 primary handler） | **否** | 只做最少：ack 硬件、读状态，重活推后 |
| threaded handler（`thread_fn`，内核线程） | **是** | 实际处理，可睡可分配 `GFP_KERNEL` |
| tasklet / softirq | **否** | 软中断上下文，极短延迟处理 |
| workqueue（`schedule_work` / `queue_work` 的 work fn） | **是** | 可睡眠的延迟处理 |

「原子/中断上下文不睡眠」是硬规则，见 SKILL Forbidden Actions #1。与中断共享的数据加锁见 `concurrency.md`（用 `spin_lock_irqsave`，不是 `mutex`）。

## 申请 / 释放中断

```c
int request_irq(unsigned int irq, irq_handler_t handler,
                unsigned long flags, const char *name, void *dev_id);

int request_threaded_irq(unsigned int irq, irq_handler_t handler,
                         irq_handler_t thread_fn, unsigned long flags,
                         const char *name, void *dev_id);
```

- 第 2 参 `handler` 是**硬中断半部**（hardirq 上下文，**不能睡**）；`request_threaded_irq` 的第 3 参 `thread_fn` 才是**线程半部**（进程上下文，**能睡**）。
- `handler` 传 `NULL` 时核心装默认 primary（直接唤醒线程），此时**必须**带 `IRQF_ONESHOT`。
- handler 返回值：`IRQ_HANDLED`（我处理了）/ `IRQ_NONE`（不是我的，共享中断必须能认出）/ `IRQ_WAKE_THREAD`（去跑 thread_fn）。返回类型 `irqreturn_t`。
- 优先 `devm_request_irq` / `devm_request_threaded_irq`：probe 失败和 remove 自动释放，免清理顺序错。
- `free_irq()` 会 `synchronize_irq()` **同步等待**正在跑的 handler 跑完——别在持锁或原子上下文里调。
- 共享中断（`IRQF_SHARED`）：`dev_id` 必须唯一且非 NULL（`free_irq` 靠它区分），handler 必须能判断「这次不是我的设备」并返回 `IRQ_NONE`。

```c
static irqreturn_t my_isr(int irq, void *dev_id)   /* hardirq, 不能睡 */
{
    struct my_dev *d = dev_id;
    if (!my_irq_is_mine(d))
        return IRQ_NONE;
    /* ack + 读状态，重活交给 thread_fn / workqueue */
    return IRQ_WAKE_THREAD;
}
static irqreturn_t my_thread(int irq, void *dev_id) /* 进程上下文, 可睡 */
{
    /* 实际处理：可 mutex_lock / GFP_KERNEL / 读慢速总线 */
    return IRQ_HANDLED;
}
```

## 延迟处理（下半部）选型

| 机制 | 上下文 | 能睡? | 何时用 |
|---|---|---|---|
| threaded IRQ `thread_fn` | 进程 | 是 | 中断驱动、需要睡眠的处理——**首选** |
| workqueue（`INIT_WORK` + `schedule_work` / `queue_work`） | 进程（kworker） | 是 | 与中断解耦、或非中断触发的可睡眠延迟 |
| tasklet（`tasklet_setup` + `tasklet_schedule`） | 软中断 | 否 | 极短、不可睡的延迟——**新代码尽量避免**，优先 threaded/workqueue |
| softirq | 软中断 | 否 | 内核核心子系统（网络/块层）专用，驱动一般不自己加 |

需要睡眠 → threaded `thread_fn` 或 workqueue；绝不在 tasklet/softirq/硬中断里睡。

## 版本敏感（按目标树 `include/linux/interrupt.h` 核）

- tasklet 新 API：`tasklet_setup()` 初始化 + `from_tasklet()` 宏从 `struct tasklet_struct *` 恢复父结构；handler 签名为 `void f(struct tasklet_struct *t)`。
- `DECLARE_TASKLET(name, callback)` 现为 2 参；旧的 3 参 `DECLARE_TASKLET(name, func, data)` 形式已移除（6.1/7.0 均为 2 参新签名）。
- 引具体 API/标志时，附 `[CLAIMS]`（见 `claims-contract.md`），绑树后过 `fact_gate` 验实存。

## 常见坑

- 在硬中断 handler / tasklet / softirq 里 `msleep` / `mutex_lock` / `GFP_KERNEL` 分配 → 崩或死锁。要睡就用 `thread_fn` 或 workqueue。见 `known-bugs.md` KB-IRQ-001。
- `handler==NULL` 的 threaded IRQ 忘了 `IRQF_ONESHOT`。
- 共享中断里 handler 不判断归属、乱返回 `IRQ_HANDLED`，吞掉别的设备的中断。
- 在持锁/原子上下文里调 `free_irq`（它会同步等待）。
