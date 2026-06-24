# devfreq — 写设备调频驱动（GPU / 总线 / NPU 等）

> 权威源：`Documentation/driver-api/devfreq.rst`、`include/linux/devfreq.h`、
> `include/linux/pm_opp.h`。API 以目标树为准。（CPU 调频是 cpufreq,这是非-CPU 设备。）

何时加载本模块：给 GPU / 内存总线 / NPU 等写按负载调频的驱动——提供 OPP 表、target 切频、利用率反馈给 governor。

## devfreq_dev_profile + target

```c
static int my_target(struct device *dev, unsigned long *freq, u32 flags)
{
    struct dev_pm_opp *opp;
    /* *freq 是 governor 推荐值;取 >= 它的实际 OPP,并把 *freq 回填成实际频率 */
    opp = devfreq_recommended_opp(dev, freq, flags);
    if (IS_ERR(opp))
        return PTR_ERR(opp);
    dev_pm_opp_put(opp);
    return dev_pm_opp_set_rate(dev, *freq);
}

static int my_get_dev_status(struct device *dev, struct devfreq_dev_status *stat)
{
    stat->busy_time = read_busy_cycles();      /* 真实利用率,governor 靠这个 */
    stat->total_time = read_total_cycles();
    stat->current_frequency = my_get_cur_freq();
    return 0;
}

static struct devfreq_dev_profile my_profile = {
    .polling_ms = 50,
    .target = my_target,
    .get_dev_status = my_get_dev_status,
};
devm_devfreq_add_device(dev, &my_profile, DEVFREQ_GOV_SIMPLE_ONDEMAND, NULL);
```

开关：`CONFIG_PM_DEVFREQ` + governor;OPP 表 `CONFIG_PM_OPP`。

## .target 必须取实际 OPP，别直接用推荐频率（核心）

`.target` 收到的 `*freq` 是 governor 算出的目标,但硬件只支持离散的几档 OPP。必须用 `devfreq_recommended_opp(dev, freq, flags)`(内部 `dev_pm_opp_find_freq_ceil`)取到 >= 目标的**实际支持** OPP,并把 `*freq` 回填成那个实际频率,再 `dev_pm_opp_set_rate`。直接拿推荐值去设 → 设到硬件不支持的频率。`get_dev_status` 不回填真实 `busy_time`/`total_time` → simple_ondemand 等 governor 决策全错。详见 `known-bugs.md` KB-DEVFREQ-001。

## 常见坑

- `.target` 直接用推荐 `*freq` 不经 `devfreq_recommended_opp` 取 OPP ceil → 设硬件不支持的频率(KB-DEVFREQ-001)。
- `get_dev_status` 不回填真实利用率 → 负载型 governor 决策错。
- suspend/resume 漏 `devfreq_suspend_device`/`devfreq_resume_device` → 挂起后频率状态乱。
- 跟 cpufreq 混：devfreq 是非-CPU 设备调频,CPU 用 cpufreq。
