# Regulator (供电) — consumer API

> 权威源：`Documentation/power/regulator/consumer.rst`、`include/linux/regulator/consumer.h`。
> API 以目标树为准。供电关系在 DT 里用 `<name>-supply` 描述。

何时加载本模块：驱动要给外设/传感器/codec 上电、调电压、查供电（消费者）。写 regulator 驱动(PMIC)是另一回事，本模块只讲消费侧。

## 拿供电 → enable → 用 → disable

```c
struct regulator *vdd = devm_regulator_get(dev, "vdd");   /* DT: vdd-supply = <&reg>; */
if (IS_ERR(vdd))
    return PTR_ERR(vdd);

ret = regulator_enable(vdd);                  /* 会睡：进程上下文 */
if (ret)
    return ret;
/* ... 设备上电运行 ... */
regulator_disable(vdd);                       /* 配对，引用计数 -1 */
```

- 全部 regulator 消费者 API **都会睡**——别在原子/中断上下文调（见 `interrupts.md`）。
- 调压：`regulator_set_voltage`（受 DT constraints 允许的范围约束）/ `regulator_get_voltage`；负载提示：`regulator_set_load`。
- 多路供电：`devm_regulator_bulk_get` + `regulator_bulk_enable`。

## enable/disable 是引用计数,必须配平

`regulator_enable`/`regulator_disable` 维护一个使能计数（多个消费者可共享同一路 supply）。disable 多于 enable → 警告，且可能把别人还在用的共享 supply 误关。**别用 `regulator_force_disable` 去“修”不平衡**。详见 `known-bugs.md` KB-REG-001。

## 必有 vs 可选供电

| 场景 | API | 行为 |
|---|---|---|
| 必有供电 | `regulator_get` / `devm_regulator_get` | DT 没配这路 supply 时返回 **dummy**（总成功，恒通） |
| 真可选 | `regulator_get_optional` / `devm_regulator_get_optional` | 没配就返回错误指针，自己 `IS_ERR` 判断后跳过 |

想表达“这路电可有可无”，必须用 `_optional`——否则 dummy 会掩盖配置缺失。`CONFIG_REGULATOR` 是框架开关。

## 常见坑

- 在原子/中断上下文调 `regulator_enable`（会睡）→ 崩。
- enable/disable 不配平、或 disable 没 enable 过的 supply（KB-REG-001）。
- 用 `devm_regulator_get` 拿可选供电，结果永远拿到 dummy，配置漏了也发现不了——可选供电该用 `_optional`。
