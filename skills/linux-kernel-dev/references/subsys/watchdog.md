# Watchdog — 看门狗驱动

> 权威源：`Documentation/watchdog/`、`include/linux/watchdog.h`。API 以目标树为准。
> 框架负责 `/dev/watchdog` 用户态接口和喂狗代理，驱动只实现硬件 ops。

何时加载本模块：写 SoC/外设看门狗驱动——实现启停/喂狗/设超时，接入 watchdog 框架。

## 驱动骨架

```c
static const struct watchdog_ops my_ops = {
    .owner = THIS_MODULE,
    .start = my_start, .stop = my_stop, .ping = my_ping,
    .set_timeout = my_set_timeout,
};
static const struct watchdog_info my_info = { .identity = "my-wdt", .options = WDIOF_SETTIMEOUT | WDIOF_KEEPALIVEPING };

struct watchdog_device *wdd = devm_kzalloc(dev, sizeof(*wdd), GFP_KERNEL);
wdd->info = &my_info;
wdd->ops  = &my_ops;
wdd->min_timeout = 1;
wdd->max_timeout = 60;
wdd->max_hw_heartbeat_ms = 60000;   /* 硬件最大喂狗间隔;比请求超时短时框架自动代喂 */
watchdog_init_timeout(wdd, 0, dev);  /* 按 DT timeout-sec / 模块参数取初值并 clamp 到 min/max */
watchdog_stop_on_reboot(wdd);        /* 干净重启时停狗,别让它在 reboot 中途复位 */

return devm_watchdog_register_device(dev, wdd);
```

- `.start` 上狗、`.ping` 喂狗、`.stop` 停狗、`.set_timeout` 改超时。
- 设了 `max_hw_heartbeat_ms` 后，请求超时大于硬件能力时**框架自己用内核 worker 代喂**——别自己开 kernel 线程喂狗。
- `CONFIG_WATCHDOG` 是框架开关。

## nowayout（安全语义,核心）

`watchdog_set_nowayout(wdd, nowayout)`(或 `CONFIG_WATCHDOG_NOWAYOUT`)置位后：看门狗一旦 start，**关 `/dev/watchdog` 也停不掉**——这是防呆设计(进程崩了也不该放任停狗)。驱动不能假设 `.stop` 一定被调用。详见 `known-bugs.md` KB-WDT-001。

## 常见坑

- nowayout 下指望关 fd 停狗 / 假设 `.stop` 必被调用(KB-WDT-001)。
- 自己开 kernel 线程定时喂狗，而不设 `max_hw_heartbeat_ms` 让框架代喂(重复造轮子)。
- 漏 `watchdog_stop_on_reboot` → 干净重启途中被狗复位。
- 不设 `min_timeout`/`max_timeout` → `watchdog_init_timeout` 可能拒绝配置的超时值。
