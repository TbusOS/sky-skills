# PWM — consumer

> 权威源：`Documentation/driver-api/pwm.rst`、`include/linux/pwm.h`。
> API 以目标树为准（apply 接口改过名，见下）。DT 里用 `pwms` / `pwm-names` 描述。

何时加载本模块：驱动要输出 PWM（背光、蜂鸣、马达、风扇等）——设周期/占空比/使能。

## 拿 PWM → 配置 state → 原子应用

```c
struct pwm_device *pwm = devm_pwm_get(dev, NULL);   /* DT: pwms = <&pwm0 0 ...>; */
if (IS_ERR(pwm))
    return PTR_ERR(pwm);

struct pwm_state state;
pwm_init_state(pwm, &state);        /* 拿默认/DT 参数填好 state */
state.duty_cycle = state.period / 2;
state.enabled = true;
pwm_apply_might_sleep(pwm, &state); /* 周期+占空比+使能一次性原子写入 */
```

- 读当前：`pwm_get_state`；释放（非 devm）`pwm_put`。
- `struct pwm_state` = period / duty_cycle（都以纳秒计）/ polarity / enabled。

## apply 接口（版本敏感 + 上下文,核心）

| 接口 | 上下文 | 说明 |
|---|---|---|
| `pwm_apply_might_sleep` | 进程（会睡） | 通用应用接口（**旧名 `pwm_apply_state`,已改名**） |
| `pwm_apply_atomic` | 原子 | 控制器支持时可在原子上下文应用 |

旧代码里的 `pwm_apply_state` 在新内核**编译不过**（已改名 `pwm_apply_might_sleep`）。一次性写整个 state，不要用 `pwm_config`+`pwm_enable`/`pwm_disable` 的老序列（多次调用之间会产生毛刺）。详见 `known-bugs.md` KB-PWM-001。`CONFIG_PWM` 是框架开关。

## DT 绑定

`pwms = <&pwm0 0 5000000 PWM_POLARITY_INVERTED>;`（控制器 phandle、通道、周期 ns、flags），`pwm-names` 对上驱动里 get 的名字。详见 `device-tree.md`。

## 常见坑

- 用旧名 `pwm_apply_state` 在新内核编译错（已改名，KB-PWM-001）。
- 用 `pwm_config`+`pwm_enable` 老序列分多步设置 → 周期/占空比切换时毛刺。
- 在原子上下文调 `pwm_apply_might_sleep`（会睡）；要原子上下文应用得用 `pwm_apply_atomic`（且控制器支持）。
