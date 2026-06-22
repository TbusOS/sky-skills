# Regulator driver — 写 PMIC / 稳压器驱动

> 权威源：`Documentation/power/regulator/`、`include/linux/regulator/driver.h`。API 以目标树为准。
> 消费侧(regulator_get/enable)见 `regulator.md`;本模块是 **driver 侧**(写 PMIC regulator)。

何时加载本模块：写 PMIC/稳压器驱动,把若干路输出暴露成 regulator。多数挂 I2C,寄存器访问见 `regmap.md`。

## regulator_desc + regmap helper ops（首选,少手写）

```c
static const struct regulator_ops my_ops = {
    .enable           = regulator_enable_regmap,          /* 框架现成,按 desc 的寄存器字段操作 */
    .disable          = regulator_disable_regmap,
    .is_enabled       = regulator_is_enabled_regmap,
    .get_voltage_sel  = regulator_get_voltage_sel_regmap,
    .set_voltage_sel  = regulator_set_voltage_sel_regmap,
    .list_voltage     = regulator_list_voltage_linear,
};
static const struct regulator_desc my_desc = {
    .name = "ldo1", .id = 0, .type = REGULATOR_VOLTAGE, .owner = THIS_MODULE,
    .ops = &my_ops,
    .n_voltages = 64, .min_uV = 800000, .uV_step = 25000,   /* list_voltage_linear 用 */
    .vsel_reg = 0x10, .vsel_mask = 0x3f,                    /* set/get_voltage_sel_regmap 用 */
    .enable_reg = 0x10, .enable_mask = BIT(7),              /* enable/disable_regmap 用 */
};

struct regulator_config cfg = { .dev = dev, .regmap = priv->regmap, .init_data = ... };
rdev = devm_regulator_register(dev, &my_desc, &cfg);
```

regmap 类 PMIC **直接用 `*_regmap` helper ops** + 在 `regulator_desc` 里填寄存器字段(vsel_reg/mask、enable_reg/mask),不用手写 ops。`list_voltage` 用 `regulator_list_voltage_linear`(配 min_uV/uV_step)把 selector 映射成 µV。详见 `known-bugs.md` KB-REGD-001。`CONFIG_REGULATOR` 是框架开关。

## 常见坑

- 手写 enable/set_voltage ops 操作寄存器,而 regmap helper(`regulator_enable_regmap` 等)+ desc 字段就够(白费力 + 易错)(KB-REGD-001)。
- `n_voltages`/`min_uV`/`uV_step` 跟 `list_voltage` 对不上 → selector↔电压映射错。
- `regulator_config` 漏 `regmap`(helper ops 没法访问寄存器)。
