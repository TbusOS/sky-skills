# Reset Controller — consumer

> 权威源：`Documentation/driver-api/reset.rst`、`include/linux/reset.h`。
> API 以目标树为准。复位线在 DT 里用 `resets` / `reset-names` 描述。

何时加载本模块：驱动要把某外设拉进/放出复位（reset 信号），或脉冲复位一下。写 reset 控制器驱动是另一回事。

## 拿复位 → deassert（放出复位）→ 用

```c
struct reset_control *rst = devm_reset_control_get_exclusive(dev, "core");
if (IS_ERR(rst))
    return PTR_ERR(rst);

reset_control_deassert(rst);     /* 放出复位，设备开始工作 */
/* ... */
reset_control_assert(rst);       /* 重新拉进复位 */
```

- 自复位脉冲：`reset_control_reset`（assert + 延时 + deassert，一次性）。
- 查状态：`reset_control_status`；非 devm 用 `of_reset_control_get` 配 `reset_control_put`。
- 这些调用在进程上下文、会睡（控制器可能挂在 I2C/SPI 上）——别在原子/中断上下文调。

## exclusive vs shared（按硬件接线选,核心）

| 类型 | 获取 | 语义 |
|---|---|---|
| **exclusive** | `devm_reset_control_get_exclusive` / `devm_reset_control_get_optional_exclusive` | 这条复位线只此设备用；别人已占则获取失败 |
| **shared** | `devm_reset_control_get_shared` | 多设备共用一条复位线；deassert/assert **引用计数**，只有最后一个 assert 才真拉复位 |

复位线在硬件上接给多个外设时**必须**用 shared；给 shared 线用 exclusive 接口会失败。详见 `known-bugs.md` KB-RESET-001。

## DT 绑定

`resets = <&rcc RESET_ID>; reset-names = "core";`，`reset-names` 对上驱动里 get 的名字。`CONFIG_RESET_CONTROLLER` 是框架开关。详见 `device-tree.md`。

## 常见坑

- 共用复位线却用 exclusive 接口 → 获取失败或互相踩（KB-RESET-001）。
- 对 shared 复位线期望 `reset_control_assert` 立刻生效——它是引用计数的，别的使用者没 assert 时不会真复位。
- 在原子/中断上下文调 reset_control_*（会睡）→ 崩。
