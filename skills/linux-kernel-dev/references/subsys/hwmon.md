# hwmon — 硬件监控(温度/电压/风扇/电流)

> 权威源：`Documentation/hwmon/`、`include/linux/hwmon.h`。API 以目标树为准。
> 暴露成 `/sys/class/hwmon/hwmonN/...`,被 lm-sensors 等读取。

何时加载本模块：写硬件监控驱动,暴露温度/电压/风扇/电流等传感读数。

## 现代注册：register_with_info（首选,别用旧的 sysfs attr group）

```c
static const struct hwmon_channel_info * const my_info[] = {
    HWMON_CHANNEL_INFO(temp, HWMON_T_INPUT | HWMON_T_MAX),
    HWMON_CHANNEL_INFO(in,   HWMON_I_INPUT),
    NULL,
};
static const struct hwmon_ops my_ops = { .is_visible = my_vis, .read = my_read, .write = my_write };
static const struct hwmon_chip_info my_chip = { .ops = &my_ops, .info = my_info };

hwmon = devm_hwmon_device_register_with_info(dev, "mychip", priv, &my_chip, NULL);
```

`hwmon_ops.read(dev, type, attr, channel, *val)` 按通道回填 `*val`。旧的 `hwmon_device_register_with_groups`(手写 sysfs attr)能用但不推荐。`CONFIG_HWMON` 是框架开关。

## sysfs 值是固定单位（核心,易错）

`.read` 回填到 sysfs 的值用 hwmon 约定的**固定单位**:

| 量 | sysfs(例) | 单位 |
|---|---|---|
| 温度 | `temp1_input` | **毫摄氏度**(m°C,25000=25°C) |
| 电压 | `in0_input` | 毫伏(mV) |
| 风扇 | `fan1_input` | 转/分(RPM) |
| 电流 | `curr1_input` | 毫安(mA) |
| 功率 | `power1_input` | 微瓦(µW) |

回填错单位(如温度填摄氏度)→ 上层读数差几个数量级。详见 `known-bugs.md` KB-HWMON-001。

## 常见坑

- `.read` 回填单位错(温度非毫摄氏度、电压非 mV 等)(KB-HWMON-001)。
- 还在用旧的手写 sysfs attr group,而非 `register_with_info` 的 chip_info/ops。
- `is_visible` 没正确返回权限(0 / 0444 / 0644),属性该隐藏却露出来。
