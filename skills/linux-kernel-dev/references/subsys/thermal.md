# Thermal — 温度传感器 zone + 冷却设备

> 权威源：`Documentation/driver-api/thermal/`、`include/linux/thermal.h`。
> API 以目标树为准（注册接口改过名，见下）。DT 用 `thermal-zones` 节点描述。

何时加载本模块：写温度传感器驱动(暴露成 thermal zone)，或写冷却设备(风扇/降频)接入热管理。

## 传感器侧：注册 thermal zone

```c
static int my_get_temp(struct thermal_zone_device *tz, int *temp)
{
    *temp = read_sensor_mC();   /* 毫摄氏度(m°C),不是摄氏度! */
    return 0;
}
static const struct thermal_zone_device_ops my_ops = { .get_temp = my_get_temp };

tz = devm_thermal_of_zone_register(dev, 0, priv, &my_ops);   /* 按 DT thermal-zones 绑定 */
if (IS_ERR(tz))
    return PTR_ERR(tz);
/* 温度变化时主动通知框架重新评估 trip: */
thermal_zone_device_update(tz, THERMAL_EVENT_UNSPECIFIED);
```

`get_temp` 回填的温度单位是**毫摄氏度**(25000 = 25°C)。回填成摄氏度(25)会被当成 0.025°C，trip 永不触发。详见 `known-bugs.md` KB-THERMAL-001。

## 冷却设备侧

```c
static const struct thermal_cooling_device_ops cool_ops = {
    .get_max_state = ..., .get_cur_state = ..., .set_cur_state = ...,
};
cdev = devm_thermal_of_cooling_device_register(dev, np, "my-fan", priv, &cool_ops);
```

冷却状态 0 = 不冷却，max_state = 最强，单调递增。`thermal_cooling_device_register` 是非 devm 版。

## 版本敏感(按目标树 thermal.h 核)

- OF 传感器注册接口改过名：旧 `thermal_zone_of_sensor_register` / `devm_thermal_zone_of_sensor_register` → 新 **`devm_thermal_of_zone_register`**。旧 `thermal_zone_device_register` 也被 `thermal_zone_device_register_with_trips` + OF 路径取代。移植旧驱动按目标树确认接口名。

## DT 绑定

传感器在 `thermal-zones` 节点里用 `thermal-sensors` 引用，trip 点和 `cooling-maps` 也写在那。`CONFIG_THERMAL` 是框架开关。详见 `device-tree.md`。

## 常见坑

- `get_temp` 回填摄氏度而非毫摄氏度 → trip 不触发(KB-THERMAL-001)。
- 用旧名 `thermal_zone_of_sensor_register` 在新内核编译错(已改 `devm_thermal_of_zone_register`)。
- 温度变了不调 `thermal_zone_device_update` → 框架不知道，冷却不及时。
