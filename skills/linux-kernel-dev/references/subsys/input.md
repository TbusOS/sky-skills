# Input — 按键 / 触摸 / 传感器输入设备

> 权威源：`Documentation/input/`、`include/linux/input.h`。API 以目标树为准。
> 设备挂在 I2C/SPI/GPIO 上的接法见对应模块。

何时加载本模块：写输入设备驱动(按键、旋钮、触摸、加速度键等)，上报事件给用户态 `/dev/input/...`。

## 驱动骨架：alloc → 声明能力 → register → 上报

```c
idev = devm_input_allocate_device(dev);
idev->name = "my-keys";
input_set_capability(idev, EV_KEY, KEY_POWER);   /* 注册前声明能力 */
/* 多个键/绝对轴: input_set_capability 逐个声明,或 input_set_abs_params 设范围 */

ret = input_register_device(idev);               /* 注册即对用户态可见 */
```

中断/轮询里上报一帧事件：

```c
input_report_key(idev, KEY_POWER, pressed);   /* 可连报多个 report_* */
input_sync(idev);                             /* 必须:标记这一帧结束,事件才下发 */
```

## input_sync 是必须的（核心,易漏）

一组 `input_report_key` / `input_report_abs` / `input_report_rel` 之后**必须** `input_sync()`——它发 `EV_SYN`/`SYN_REPORT` 标记"这一帧事件包结束"。不调 `input_sync`，上报的事件不会作为完整帧下发给用户态。详见 `known-bugs.md` KB-INPUT-001。

## 声明能力要在 register 之前

`input_set_capability`(或 `__set_bit(EV_KEY, idev->evbit)` + keybit)必须在 `input_register_device` **之前**做。没声明的事件类型/码，上报时被静默丢弃。`CONFIG_INPUT` 是框架开关。

## DT 绑定

按键类常用通用 `gpio-keys`(无需自写)。自写驱动从 DT 拿 GPIO/中断/键码映射，见 `device-tree.md` / `gpio.md`。

## 常见坑

- 上报后漏 `input_sync` → 事件不下发(KB-INPUT-001)。
- 没 `input_set_capability` 声明就上报某键/轴 → 被静默丢弃。
- 在原子上下文做会睡的读(I2C 读坐标)——用 threaded IRQ 的 thread_fn(见 `interrupts.md`)。
