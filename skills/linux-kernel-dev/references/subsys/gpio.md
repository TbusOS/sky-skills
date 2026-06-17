# GPIO (consumer & provider)

> 权威源：`Documentation/driver-api/gpio/`、`include/linux/gpio/consumer.h`、`gpio/driver.h`。
> API 以目标树为准。DT 里的 `*-gpios` 属性见 `device-tree.md`。

何时加载本模块：驱动里用 GPIO（复位脚、使能脚、中断脚、读按键），或写 GPIO 控制器（gpiochip）。

## 消费侧（用 GPIO）—— 用描述符 API，不用旧整数 API

```c
struct gpio_desc *rst;
rst = devm_gpiod_get(dev, "reset", GPIOD_OUT_LOW);   /* DT: reset-gpios = <...> */
if (IS_ERR(rst)) return PTR_ERR(rst);
gpiod_set_value(rst, 1);                              /* 拉高 */
```

| 要什么 | API |
|---|---|
| 拿一个 GPIO（设备托管） | `devm_gpiod_get` / `devm_gpiod_get_optional`（可选脚） |
| 设方向 | `gpiod_direction_input` / `gpiod_direction_output` |
| 读 / 写电平 | `gpiod_get_value` / `gpiod_set_value` |
| GPIO 当中断 | `gpiod_to_irq` → `devm_request_irq`（见 `interrupts.md`） |

`gpiod_get` 按 DT 里的 `<name>-gpios` 属性名取（`devm_gpiod_get(dev, "reset", ...)` ↔ `reset-gpios`）。描述符 API 自动处理 active-low（DT 里 `GPIO_ACTIVE_LOW`），`gpiod_set_value(d, 1)` 是"逻辑有效"不是"物理高"。

**旧的整数 GPIO API（`gpio_request` / `gpio_set_value` / `gpio_get_value`）已不推荐**（在淘汰中）——新代码一律用 `gpiod_*` 描述符 API。见 `known-bugs.md` KB-GPIO-001。

## 提供侧（写 GPIO 控制器）

填 `struct gpio_chip`（`.get` / `.set` / `.direction_input` / `.direction_output` / `.to_irq`），`devm_gpiochip_add_data` 注册。要做 GPIO 中断控制器则配 `gpio_irq_chip`。深入读 `Documentation/driver-api/gpio/driver.rst`。

## 常见坑

- 用旧整数 API `gpio_request`/`gpio_set_value`（KB-GPIO-001）→ 改 `gpiod_*`。
- 自己判断 active-low 再取反——描述符 API 已按 DT 处理，再取反就反了。
- 不检查 `devm_gpiod_get` 的 `IS_ERR`（可能 `-EPROBE_DEFER`）。
- 在原子上下文用可能睡眠的 GPIO（扩展器上的 GPIO 经 i2c/spi，会睡）——用 `gpiod_set_value_cansleep` 并在进程上下文。
