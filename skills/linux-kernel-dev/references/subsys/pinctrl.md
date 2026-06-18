# Pin Control (pinctrl) — consumer states & PM

> 权威源：`Documentation/driver-api/pin-control.rst`、`include/linux/pinctrl/consumer.h`、
> `include/linux/pinctrl/pinctrl.h`（写控制器）。API 以目标树为准。
> 引脚的复用/上下拉一般在 DT 的 pinctrl 节点里描述，驱动只“选状态”。

何时加载本模块：设备要在运行时切引脚配置（如工作态 vs 睡眠态），或写一个 SoC 的 pin 控制器驱动。

## 关键前提：default 态由 driver core 自动应用

设备 probe **之前**，driver core 已自动选好 `pinctrl-0`（"default" 态）。所以普通驱动**不需要**在 probe 里再手动选 default——那是冗余，有时序还会出错。详见 `known-bugs.md` KB-PINCTRL-001。

## 消费者：只在要切“非 default 态”时显式选

```c
struct pinctrl *p = devm_pinctrl_get(dev);
struct pinctrl_state *s_sleep = pinctrl_lookup_state(p, "sleep");

pinctrl_select_state(p, s_sleep);     /* 运行时切到 sleep 态 */
```

DT 侧：`pinctrl-names = "default", "sleep"; pinctrl-0 = <&pins_active>; pinctrl-1 = <&pins_sleep>;`

## PM 便捷封装（suspend/resume 里直接用）

| 目的 | API |
|---|---|
| 切到 default | `pinctrl_pm_select_default_state(dev)` / `pinctrl_select_default_state(dev)` |
| 切到 sleep（省电） | `pinctrl_pm_select_sleep_state(dev)` |
| 切到 idle | `pinctrl_pm_select_idle_state(dev)` |

这些封装内部自己 lookup + select，suspend 调 sleep、resume 调 default 即可，不用手撸。

## DT 绑定

引脚的功能复用(pinmux)和电气配置(pinconf：上下拉/驱动强度)写在 pin 控制器节点下的子节点里，设备用 `pinctrl-names` + `pinctrl-N` phandle 引用。`CONFIG_PINCTRL` 是框架开关。详见 `device-tree.md`。

## 常见坑

- 在 probe 里手动选 default 态（driver core 已经做了）→ 冗余/时序错（KB-PINCTRL-001）。
- 拿不到某个 state 不判 `IS_ERR`（写错 `pinctrl-names` 里的名字时 lookup 失败）。
- 以为驱动必须自己 `pinctrl_select_state` 才能让引脚生效——default 态是自动的，多数驱动根本不碰 pinctrl API。
