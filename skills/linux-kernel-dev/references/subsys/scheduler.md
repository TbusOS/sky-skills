# Scheduler · Sleeping & Waking

> 权威源：`Documentation/scheduler/`（`sched-design-CFS.rst`、`sched-eevdf.rst`、`completion.rst`、
> `sched-deadline.rst`、`sched-rt-group.rst`、`sched-nice-design.rst`）、`include/linux/wait.h`、
> `include/linux/sched.h`、`include/linux/completion.h`。语义以目标树这些为准——别凭记忆。

何时加载本模块：让一段代码睡到某条件成立、等另一上下文的事件、唤醒别的任务、设调度策略/优先级/CPU 亲和性、抢占与「能不能 schedule」、理解 CFS/EEVDF/RT/DL 调度类。

写驱动/内核模块时和调度器打交道，**九成是"怎么正确地睡 + 怎么正确地唤醒"**——下面是核心；调度器内部（CFS/EEVDF/负载均衡）放在末尾，点到为止 + 给权威源。

## 睡到条件成立：等待队列（首选）

```c
DECLARE_WAIT_QUEUE_HEAD(my_wq);          /* 静态；动态用 init_waitqueue_head() */
/* 等待方（进程上下文，会睡） */
wait_event_interruptible(my_wq, data_ready);
/* 唤醒方（可在中断里调） */
data_ready = true;
wake_up_interruptible(&my_wq);
```

| 等待 API | 状态 | 返回值 |
|---|---|---|
| `wait_event` | `TASK_UNINTERRUPTIBLE` | void（信号唤不醒） |
| `wait_event_interruptible` | `TASK_INTERRUPTIBLE` | `0` 成立 / `-ERESTARTSYS` 被信号打断 |
| `wait_event_timeout` | `TASK_UNINTERRUPTIBLE` | 剩余 jiffies(>0) / `0` 超时 |
| `wait_event_interruptible_timeout` | `TASK_INTERRUPTIBLE` | >0 成立 / `0` 超时 / `-ERESTARTSYS` 信号 |
| `wait_event_killable` | `TASK_KILLABLE` | `0` / `-ERESTARTSYS`（仅 SIGKILL） |

- `_interruptible` 版**必须检查返回值**：`-ERESTARTSYS` 表示被信号打断，要把它传回去（让上层重启或返回 `-EINTR`）。
- `wait_event*` 是宏：条件作为表达式被反复求值，醒来先验条件再决定继续睡——不会丢唤醒。
- 唤醒：`wake_up` / `wake_up_interruptible` / `wake_up_all`。`wake_up_interruptible` 只唤 `TASK_INTERRUPTIBLE` 的等待者。

## 等一次性事件：completion

一个上下文要等另一个"干完了"（probe 等固件、DMA 完成、线程起来）：

```c
struct completion done;
init_completion(&done);
/* 等待方 */ wait_for_completion(&done);            /* 或 _interruptible / _timeout */
/* 完成方 */ complete(&done);                        /* 或 complete_all() */
```

比"自己拿等待队列 + 标志位"更简洁，专为一次性事件。

## 手动睡眠（拆开写时，顺序决定会不会丢唤醒）

```c
set_current_state(TASK_INTERRUPTIBLE);   /* 1. 先设状态 */
if (!condition)                          /* 2. 再查条件 */
    schedule();                          /* 3. 让出 CPU */
set_current_state(TASK_RUNNING);         /* 4. 醒来恢复 */
```

**顺序铁律**：先 `set_current_state` 再查条件。反了（先查条件后设状态）就有竞态——唤醒发生在"查完条件"和"设状态"之间时会丢，任务永久睡死。见 `known-bugs.md` KB-SCHED-001。能用 `wait_event*` 就别手写这套。

## 任务状态（睡眠态）

| 状态 | 含义 | 谁能唤 |
|---|---|---|
| `TASK_RUNNING` | 在跑或在运行队列 | — |
| `TASK_INTERRUPTIBLE` | 可被信号中断的睡眠 | 信号 / `wake_up` |
| `TASK_UNINTERRUPTIBLE` | 不可中断睡眠（`ps` 里 D 态） | 只有 `wake_up` |
| `TASK_KILLABLE` | 只能被 SIGKILL 打断 | SIGKILL / `wake_up` |
| `TASK_IDLE` | 不计入负载的不可中断睡眠（kthread 空等用） | `wake_up` |

长时间挂在 `TASK_UNINTERRUPTIBLE` 会**虚高系统负载**（D 态计入 loadavg）；纯等工作的 kthread 用 `TASK_IDLE`。

## 上下文 / 抢占

- **只有进程上下文能睡 / 能 `schedule()`**。中断 handler、tasklet、softirq、持 spinlock 时绝不能调 `wait_event` / `schedule` / `wait_for_completion`。见 SKILL Forbidden Actions #1、`interrupts.md`、`concurrency.md`。
- 长循环里用 `cond_resched()` 主动让出，避免长时间不让 CPU（非抢占内核下尤其重要）。
- `preempt_disable()` / `preempt_enable()` 进入不可抢占区——区内同样不能睡。

## 策略 / 优先级 / 亲和性

| 需求 | API / 机制 |
|---|---|
| 设调度策略（`SCHED_NORMAL` / `FIFO` / `RR` / `DEADLINE`） | `sched_setscheduler()`（及新内核的 `sched_set_fifo()` 等封装，按树核） |
| nice 值（普通任务权重） | `set_user_nice()` |
| 绑 CPU | `set_cpus_allowed_ptr()` |

实时策略（FIFO/RR/DEADLINE）会饿死普通任务，用前想清楚。

## 调度器内部（概览 · 深入读权威源）

- **调度类**按优先级链起来：`stop` → `dl`（Deadline）→ `rt`（实时）→ `fair`（公平）→ `idle`，高类优先选。
- **公平类的默认调度器：CFS → EEVDF**。EEVDF 自 6.6 起取代 CFS 成为默认；按目标树 `Documentation/scheduler/` 核——有 `sched-eevdf.rst` 即已是 EEVDF 时代，只有 `sched-design-CFS.rst` 则是 CFS。
- 负载跟踪 PELT、负载均衡（`Documentation/scheduler/sched-domains.rst`）、组调度与带宽（`sched-rt-group.rst` / `sched-bwc.rst`）——要改/调这些先读对应 `.rst`，不要凭印象。

## 版本敏感（按目标树核）

- 公平调度器默认实现 CFS→EEVDF（6.6）；以 `Documentation/scheduler/` 实际文件为准。
- 在线调度调试开关历史上叫 `CONFIG_SCHED_DEBUG`，较新内核已变化（7.0 树无该 config 符号）——别把它写进代码假设里，按目标树 Kconfig 核。

## 常见坑

- 在原子/中断上下文里 `schedule` / `wait_event` / `wait_for_completion` → `BUG: scheduling while atomic`。
- 手动睡眠先查条件后设状态 → 丢唤醒、睡死（KB-SCHED-001）。
- 裸 `schedule()` 没先 `set_current_state` → 立刻被调度回来，等于没睡。
- 忙等轮询标志位代替等待队列/completion → 烧 CPU、还可能因无屏障读不到更新。
- 长期 `TASK_UNINTERRUPTIBLE` 拉高 loadavg；空等用 `TASK_IDLE`。
