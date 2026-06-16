# Concurrency & Synchronization

> 权威源：`Documentation/locking/`、`Documentation/memory-barriers.txt`、`Documentation/atomic_t.txt`。
> 语义有疑问以这些为准——并发 bug 最贵，别凭记忆。

| 机制 | 用途 | 可睡眠? |
|---|---|---|
| `mutex` | 长临界区，进程上下文 | 是 |
| `spinlock` | 短临界区，任意上下文 | 否 |
| `spin_lock_irqsave` | 与中断处理共享 | 否 |
| `rcu` | 读多写少 | 读：免锁 |
| `atomic_t` | 简单计数 | N/A |
| `completion` | 等另一上下文的事件 | 是（等待方） |
| `wait_queue` | 睡到条件成立 | 是 |
| `seqlock` | 写优先，写罕见 | 读：否 |

## Rules

- **持 spinlock 时绝不睡**（不调 `mutex_lock`/`msleep`/`usleep_range`，不做 `GFP_KERNEL` 分配）。见 SKILL Forbidden Actions #1。
- 进程上下文用 `mutex`，中断上下文用 `spinlock`。
- 优先 `devm_` API，避开手工清理顺序错误。
- 开 `lockdep`（`CONFIG_PROVE_LOCKING`）查死锁。
- 内存序问题先读 `memory-barriers.txt`；原子语义先读 `atomic_t.txt`，不要自己推。

## Workqueue & Tasklet

| API | 说明 |
|---|---|
| `INIT_WORK(&work, func)` | 初始化 work item |
| `schedule_work(&work)` | 丢到 system workqueue（进程上下文，可睡眠） |
| `DECLARE_TASKLET(name, func)` | 声明 tasklet（软中断上下文，不可睡眠） |
| `tasklet_schedule(&tasklet)` | 调度 tasklet |
