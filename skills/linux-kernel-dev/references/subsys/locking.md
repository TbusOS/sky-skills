# Locking — 内核并发原语

> 权威源：`Documentation/locking/`、`include/linux/spinlock.h`、`include/linux/mutex.h`、
> `include/linux/rcupdate.h`。API 以目标树为准。

何时加载本模块：要保护被多个上下文(进程/软中断/硬中断/多核)并发访问的共享数据——选锁、配平、避免睡眠态下持锁。

## 选哪把锁

```c
/* 进程上下文之间，临界区可能睡眠 → mutex */
static DEFINE_MUTEX(my_lock);
mutex_lock(&my_lock);
/* ...可睡眠的临界区... */
mutex_unlock(&my_lock);

/* 数据被中断上下文也碰 → spinlock + irqsave，关本核中断防同核死锁 */
static DEFINE_SPINLOCK(my_slock);
unsigned long flags;
spin_lock_irqsave(&my_slock, flags);
/* ...短、不可睡眠的临界区... */
spin_unlock_irqrestore(&my_slock, flags);

/* 读多写少、读侧要极快 → RCU */
rcu_read_lock();
p = rcu_dereference(gp);          /* 读侧不阻塞写侧 */
/* ...用 p... */
rcu_read_unlock();
rcu_assign_pointer(gp, new);      /* 写侧发布 */
synchronize_rcu();                /* 等所有读侧退出后再释放旧 p */
```

调试开关：`CONFIG_PROVE_LOCKING`(lockdep 查死锁/锁序)、`CONFIG_DEBUG_ATOMIC_SLEEP`(原子态睡眠告警)、`CONFIG_DEBUG_SPINLOCK`。

## 持 spinlock / 原子上下文里不能睡眠（核心）

spinlock 临界区、硬/软中断里**禁止任何会睡眠的调用**(`mutex_lock`、`kmalloc(GFP_KERNEL)`、`copy_from_user`、`msleep` 等)——会触发调度，要么死锁要么破坏调度。会睡眠的路径标了 `might_sleep()`。同一把锁若既在进程上下文又在中断上下文取，进程侧必须用 `spin_lock_irqsave` 关本核中断，否则中断打断持锁的进程→同核重入死锁。详见 `known-bugs.md` KB-LOCK-001。

## 常见坑

- 同核进程态持普通 `spin_lock` 时被中断打断、中断里又取同锁 → 死锁；要 `spin_lock_irqsave`(KB-LOCK-001)。
- 持 spinlock 时 `mutex_lock` / `kmalloc(GFP_KERNEL)` / `copy_from_user`(睡眠)→ atomic sleep。
- RCU 读侧临界区里阻塞/睡眠；或释放旧指针没等 `synchronize_rcu`。
- 锁配平：异常/错误路径漏 unlock；嵌套取锁顺序不一致(lockdep 报 AB-BA)。
