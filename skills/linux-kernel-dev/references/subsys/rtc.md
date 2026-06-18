# RTC — 实时时钟驱动

> 权威源：`Documentation/admin-guide/rtc`、`include/linux/rtc.h`。API 以目标树为准。
> 框架负责 `/dev/rtcN`、sysfs、alarm 用户态接口，驱动实现读写时间的 ops。

何时加载本模块：写 RTC 驱动——实现读/设时间、闹钟，接入 rtc 框架。

## 驱动骨架：allocate → 填 ops → register（register 放最后）

```c
static const struct rtc_class_ops my_ops = {
    .read_time = my_read_time, .set_time = my_set_time,
    .read_alarm = my_read_alarm, .set_alarm = my_set_alarm,
};

rtc = devm_rtc_allocate_device(dev);   /* 先分配 */
if (IS_ERR(rtc))
    return PTR_ERR(rtc);
rtc->ops = &my_ops;
rtc->range_min = ...; rtc->range_max = ...;

return devm_rtc_register_device(rtc);  /* 最后注册:注册即对用户态可见 */
```

旧的 `devm_rtc_device_register` 仍在但推荐 allocate + register 两步(能在 register 前设 range/feature)。`CONFIG_RTC_CLASS` 是框架开关。

## struct rtc_time 遵循 struct tm 约定（核心,易错）

`read_time` 回填、`set_time` 收到的 `struct rtc_time` 字段跟 C 的 `struct tm` 一致：

| 字段 | 含义 | 易错点 |
|---|---|---|
| `tm_year` | **自 1900 起**的年数 | 2025 年要填 125,不是 2025 |
| `tm_mon` | **0–11**(0=一月) | 一月填 0,不是 1 |
| `tm_mday` | 1–31 | 这个才是 1 起 |

转换用 `rtc_time64_to_tm`(秒→tm)/ `rtc_tm_to_time64`(tm→秒)，别手算；`rtc_valid_tm` 校验。把 tm_year 当绝对年份、tm_mon 当 1 起会把时间写错一个世纪/一个月。详见 `known-bugs.md` KB-RTC-001。

## 常见坑

- `tm_year` 填实际年份(2025)而非自 1900 的偏移(125)、`tm_mon` 当 1 起(KB-RTC-001)。
- 手算秒↔年月日而不用 `rtc_time64_to_tm`/`rtc_tm_to_time64`(闰年/时区算错)。
- register 放太早:还没设好 ops/range 就注册,用户态读到半成品。
