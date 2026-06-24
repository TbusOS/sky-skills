# cpufreq — 写 CPU 调频驱动

> 权威源：`Documentation/admin-guide/pm/cpufreq.rst`、`Documentation/cpu-freq/`、
> `include/linux/cpufreq.h`。API 以目标树为准。

何时加载本模块：给 SoC 写 CPU 频率调速驱动——提供频率表,让 governor 按负载切频。

## cpufreq_driver + 频率表

```c
static int my_target_index(struct cpufreq_policy *policy, unsigned int index)
{
    /* index 是 policy->freq_table 的下标,不是 kHz */
    unsigned long rate = policy->freq_table[index].frequency * 1000;
    return dev_pm_opp_set_rate(get_cpu_device(policy->cpu), rate);
}

static int my_cpu_init(struct cpufreq_policy *policy)
{
    dev_pm_opp_init_cpufreq_table(cpu_dev, &freq_table);
    return cpufreq_table_validate_and_sort(policy, freq_table); /* core 据此管 */
}

static struct cpufreq_driver my_driver = {
    .flags  = CPUFREQ_NEED_INITIAL_FREQ_CHECK,
    .verify = cpufreq_generic_frequency_table_verify,
    .target_index = my_target_index,   /* 现代:给索引;旧 .target 给 kHz */
    .init   = my_cpu_init,
    .name   = "my-cpufreq",
};
cpufreq_register_driver(&my_driver);
```

开关：`CONFIG_CPU_FREQ` + governor(`CONFIG_CPU_FREQ_GOV_SCHEDUTIL` 等)。OPP 表用 `CONFIG_PM_OPP`。

## 异步改频率必须 transition_begin/end 成对（核心）

走 core 的 `.target_index` 时 core 自动发频率变化通知。但驱动若**自己异步改频率**(notifier、热限频回调等),必须用 `cpufreq_freq_transition_begin(policy, &freqs)` ... 改频率 ... `cpufreq_freq_transition_end(policy, &freqs, 0)` 成对包住,发出 PRECHANGE/POSTCHANGE 通知。漏 `end` → `transition_ongoing` 标志不清,后续任何调频卡死;依赖频率的状态(loops_per_jiffy 等)也会失准。详见 `known-bugs.md` KB-CPUFREQ-001。

## 常见坑

- 自己异步改频率漏 `cpufreq_freq_transition_begin/end` 成对 → transition 卡死(KB-CPUFREQ-001)。
- `.target_index` 把入参 index 当成 kHz 用(它是频率表下标)。
- `.init` 没 `cpufreq_table_validate_and_sort` 设好 `policy->freq_table` → governor 没频率表。
- 频率表 frequency 单位是 kHz,跟 OPP 的 Hz 差 1000 倍,转换填反。
