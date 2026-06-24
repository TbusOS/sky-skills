# Runtime PM — 运行时电源管理

> 权威源：`Documentation/power/runtime_pm.rst`、`include/linux/pm_runtime.h`、
> `include/linux/pm.h`。API 以目标树为准。

何时加载本模块：让设备空闲时自动进低功耗、用时再上电——实现 runtime suspend/resume + 系统睡眠回调。

## 注册 + get/put 用法

```c
static const struct dev_pm_ops my_pm_ops = {
    SET_RUNTIME_PM_OPS(my_runtime_suspend, my_runtime_resume, NULL)
    SET_SYSTEM_SLEEP_PM_OPS(my_suspend, my_resume)
};

/* probe 里 */
pm_runtime_set_autosuspend_delay(dev, 2000);   /* 空闲 2s 再挂 */
pm_runtime_use_autosuspend(dev);
pm_runtime_enable(dev);                         /* 之后才能 get/put */

/* 要用硬件时：上电并加引用 */
ret = pm_runtime_resume_and_get(dev);           /* 失败时已自动回退引用 */
if (ret < 0)
    return ret;
/* ...访问硬件... */
pm_runtime_mark_last_busy(dev);
pm_runtime_put_autosuspend(dev);                /* 放引用，到点自动挂 */

/* remove 里 */
pm_runtime_disable(dev);
```

开关：`CONFIG_PM`(runtime PM)、`CONFIG_PM_SLEEP`(系统睡眠)。计数为 0 且 enable 时框架才调 `.runtime_suspend`。

## get_sync 失败也加了引用（核心，最常踩）

`pm_runtime_get_sync()` 即使返回负值(resume 失败)**也已经把 usage 计数加了 1**。错误路径直接 return 不配平 → 计数永久偏高，设备再也不会 autosuspend。要么失败分支补 `pm_runtime_put_noidle(dev)`，要么直接用 `pm_runtime_resume_and_get()`(失败时自动回退引用，新代码首选)。详见 `known-bugs.md` KB-PM-001。

## 常见坑

- `pm_runtime_get_sync` 失败不配平引用 → 设备永不挂起；改用 `pm_runtime_resume_and_get`(KB-PM-001)。
- `pm_runtime_enable` 之前就 get/put，或 remove 漏 `pm_runtime_disable` → enable 计数不平。
- 在 `.runtime_suspend` 回调里又 get 自己 → 递归/死锁。
- 系统睡眠 vs runtime 两套回调混用：用 `SET_SYSTEM_SLEEP_PM_OPS` / `SET_RUNTIME_PM_OPS` 分清。
