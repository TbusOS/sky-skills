# Power supply — 电池 / 充电器

> 权威源：`Documentation/power/power_supply_class.rst`、`include/linux/power_supply.h`。
> API 以目标树为准。挂在 I2C(PMIC/电量计)上的接法见 `i2c.md` / `regmap.md`。

何时加载本模块：写电池/充电器/电源驱动，向用户态 `/sys/class/power_supply/...` 暴露电量、电压、充电状态。

## 驱动骨架

```c
static enum power_supply_property my_props[] = {
    POWER_SUPPLY_PROP_STATUS, POWER_SUPPLY_PROP_VOLTAGE_NOW, POWER_SUPPLY_PROP_CAPACITY,
};
static int my_get(struct power_supply *psy, enum power_supply_property psp,
                  union power_supply_propval *val)
{
    switch (psp) {
    case POWER_SUPPLY_PROP_VOLTAGE_NOW: val->intval = read_uV(); break;  /* 微伏 */
    ...
    }
    return 0;
}
static const struct power_supply_desc my_desc = {
    .name = "my-battery", .type = POWER_SUPPLY_TYPE_BATTERY,
    .properties = my_props, .num_properties = ARRAY_SIZE(my_props),
    .get_property = my_get,
};

psy = devm_power_supply_register(dev, &my_desc, &cfg);
```

`power_supply_get_property` 是上层读属性入口;值放 `union power_supply_propval`。

## 单位是固定微单位 + 状态变了要通知（核心,易错）

- 属性值用**固定微单位**：电压 `VOLTAGE_NOW` 微伏(µV)、电流 `CURRENT_NOW` 微安(µA)、电量 `CHARGE_*` µAh、温度 `TEMP` 0.1°C、容量百分比 `CAPACITY` 是 0–100。填错数量级(如填毫伏)用户态读数差 1000 倍。
- 状态变化(充↔放、容量跳变、插拔)时调 **`power_supply_changed(psy)`** 发 uevent 通知用户态，否则上层看不到更新。详见 `known-bugs.md` KB-PSY-001。

`CONFIG_POWER_SUPPLY` 是框架开关。

## 常见坑

- 属性值数量级填错(伏/毫伏当微伏)→ 用户态读数错(KB-PSY-001)。
- 状态变了不调 `power_supply_changed` → 用户态/上层策略收不到 uevent。
- get_property 不认的属性没返 `-EINVAL`。
