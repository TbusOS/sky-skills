# LED class — 驱动一颗 LED

> 权威源：`Documentation/leds/`、`include/linux/leds.h`。API 以目标树为准。
> LED 挂在 GPIO/PWM/I2C 上的接法见对应模块;DT 用 leds 节点描述。

何时加载本模块：写 LED 驱动，把一颗灯暴露成 `/sys/class/leds/...`，支持设亮度/触发器。

## 驱动骨架

```c
static int my_set_blocking(struct led_classdev *cdev, enum led_brightness b)
{
    return regmap_write(priv->rm, REG_LED, b);   /* 走 I2C,会睡 → 用 blocking 版 */
}

priv->cdev.name = "my:status";
priv->cdev.max_brightness = 255;
priv->cdev.brightness_set_blocking = my_set_blocking;   /* 见下:会睡选 blocking */

return devm_led_classdev_register(dev, &priv->cdev);
/* 带 DT init_data(label/默认触发器等)用 devm_led_classdev_register_ext */
```

`led_set_brightness` 是上层设亮度入口;`led_classdev` 是核心结构。

## brightness_set vs brightness_set_blocking（核心,易错）

| 回调 | 上下文 | 何时实现 |
|---|---|---|
| `.brightness_set` | **原子,不能睡** | LED 直挂寄存器/GPIO,设亮度不阻塞 |
| `.brightness_set_blocking` | 进程,可睡 | LED 在 **I2C/SPI/regmap** 后面,设亮度会睡 |

`.brightness_set` 在原子上下文被调（可能从软中断/定时器路径），**不能睡**。LED 挂在会睡的总线上时实现 `.brightness_set_blocking`，不要在 `.brightness_set` 里做 I2C 传输。详见 `known-bugs.md` KB-LED-001。`CONFIG_LEDS_CLASS` / `CONFIG_NEW_LEDS` 是框架开关。

## DT 绑定

`leds { my-led { label/color; gpios 或 pwms = <...>; linux,default-trigger = "..."; } }`。GPIO LED 常用通用 `leds-gpio`，无需自写驱动。详见 `device-tree.md`。

## 常见坑

- 在 `.brightness_set`(原子)里做 I2C/SPI 传输(会睡)→ 崩;应实现 `.brightness_set_blocking`(KB-LED-001)。
- 漏设 `max_brightness`(默认 1,只能开/关,设不了中间亮度)。
