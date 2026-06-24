# cpuidle — 写 CPU 空闲态驱动

> 权威源：`Documentation/driver-api/pm/cpuidle.rst`、`Documentation/admin-guide/pm/cpuidle.rst`、
> `include/linux/cpuidle.h`。API 以目标树为准。

何时加载本模块：给 SoC 写 CPU 空闲态驱动——声明各 idle state 的进入回调、延迟、驻留阈值,让 governor 选深度。

## cpuidle_driver + states

```c
static int my_enter(struct cpuidle_device *dev,
                    struct cpuidle_driver *drv, int index)
{
    /* 关中断的原子上下文调用,禁睡眠 */
    my_soc_enter_wfi(index);
    return index;          /* 返回实际进入的 state 下标(可 demote 成更浅的) */
}

static struct cpuidle_driver my_idle_driver = {
    .name = "my-idle",
    .owner = THIS_MODULE,
    .states = {
        { .enter = my_enter, .exit_latency = 1,   .target_residency = 1,
          .name = "WFI", .desc = "wait-for-interrupt" },
        { .enter = my_enter, .exit_latency = 500, .target_residency = 1000,
          .flags = CPUIDLE_FLAG_TIMER_STOP,        /* 此态停本地 timer */
          .name = "deep", .desc = "deep-sleep" },
    },
    .state_count = 2,
};
cpuidle_register(&my_idle_driver, NULL);   /* register_driver + 各 cpu register_device */
```

开关：`CONFIG_CPU_IDLE` + governor(menu/teo)。`exit_latency`/`target_residency` 单位是微秒。

## .enter 返回实际进入的 state + 停 timer 必标 TIMER_STOP（核心）

`.enter` 在**关本地中断的原子上下文**运行,里面**禁止睡眠**。返回值必须是**实际进入的 state 下标**(条件不满足而 demote 到更浅 state 时返回那个浅的),governor 靠返回值统计驻留、修正决策——返回入参而实际没进会让统计错乱。若某 idle state 会停掉本地 timer,必须给它标 `CPUIDLE_FLAG_TIMER_STOP`,否则 tick 不切到 broadcast,深睡里定时器停摆 → 唤醒丢失/系统卡死。详见 `known-bugs.md` KB-CPUIDLE-001。

## 常见坑

- `.enter` 返回入参 index 而非实际进入的 state(demote 时统计错乱)(KB-CPUIDLE-001)。
- 会停本地 timer 的深睡态没标 `CPUIDLE_FLAG_TIMER_STOP` → broadcast 没接管,唤醒丢失。
- `.enter` 里调会睡眠的函数(它在关中断原子上下文)。
- `exit_latency`/`target_residency` 单位填错(微秒),governor 选错深度。
