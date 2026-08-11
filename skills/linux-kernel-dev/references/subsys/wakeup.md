# System Wakeup — 唤醒源、`enable_irq_wake` 与 `wakeup-source`

> 权威源：`Documentation/driver-api/pm/`、`Documentation/power/`(`wakeup_sources`)、
> `include/linux/pm_wakeup.h`、`include/linux/pm_wakeirq.h`、`include/linux/interrupt.h`。
> API 以目标树为准。**本模块讲系统睡眠期的唤醒**，运行时电源见 `pm-runtime.md`。

何时加载本模块：让某个设备（按键、触摸、网口、RTC…）在系统 suspend 后还能把系统叫醒；
或排查「suspend 后叫不醒」「叫醒后关不掉」「`power/wakeup` 节点不存在」。

## 三层要分清（混淆是本主题最大的坑）

| 层 | 对象 | 关键 API | 回答的问题 |
|---|---|---|---|
| irq 层 | 一条中断线 | `enable_irq_wake()` / `disable_irq_wake()` | 这条 irq 在 suspend 后还留着吗 |
| device 层 | 一个 `struct device` | `device_init_wakeup()` / `device_may_wakeup()` | 这个设备**允不允许**唤醒系统（策略，userspace 可改） |
| 托管层 | device ↔ irq 的绑定 | `dev_pm_set_wake_irq()` / `dev_pm_arm_wake_irq()` | 让 PM 框架**代替驱动**去调 `enable_irq_wake` |

三层各自独立：只用 irq 层就能把系统叫醒，不需要 device 层；建了 device 层的 sysfs 节点也不
自动 arm 任何 irq。

## irq 层：`enable_irq_wake` 走到哪

```
driver: enable_irq_wake(irq)
  → irq_set_irq_wake()                 kernel/irq/manage.c
  → set_irq_wake_real()
  → irq_data 所属 irqchip 的 .irq_set_wake 回调
  → 由 irqchip 驱动决定：配置本级唤醒逻辑，或 irq_chip_set_wake_parent() 转发给上级
```

对 GPIO 中断，`.irq_set_wake` 落在 GPIO/pinctrl 控制器驱动里，由它去配 SoC 的唤醒
控制器（各家名字不同）。**整条路和该设备挂在哪条总线（i2c/spi/…）无关** —— 总线只是数据
通道，唤醒信号走的是中断线。

### `wake_depth` 是引用计数，不是布尔开关

```c
/* kernel/irq/manage.c，irq_set_irq_wake() */
if (on) {
        if (desc->wake_depth++ == 0)
                set_irq_wake_real(irq, on);           /* 只有 0→1 才真正配置硬件 */
} else {
        if (desc->wake_depth == 0)
                WARN(1, "Unbalanced IRQ %d wake disable\n", irq);
        else if (--desc->wake_depth == 0)
                set_irq_wake_real(irq, on);
}
```

**enable 两次只 disable 一次 ⇒ 该 irq 永久 armed，再也关不掉，且没有任何报错**
（`WARN` 只在反向不平衡时触发）。表现为「用户明明关了唤醒功能，设备还是能把系统叫醒」
+ 待机耗电升高。suspend/resume 两侧的判据必须**写成同一个条件**，
或用「这次到底 arm 过没有」的状态变量当判据。

## device 层：`/sys/.../power/wakeup` 从哪来

唯一判据是 `dev->power.can_wakeup`，两个 sysfs 挂载入口：

```c
int dpm_sysfs_add(struct device *dev)          /* drivers/base/power/sysfs.c —— 注册时已置位 */
{   ...
    if (device_can_wakeup(dev))
        rc = sysfs_merge_group(&dev->kobj, &pm_wakeup_attr_group);

int wakeup_sysfs_add(struct device *dev)       /* 同文件 —— 注册后才置位 */
{   return sysfs_merge_group(&dev->kobj, &pm_wakeup_attr_group); }
```

而 `can_wakeup` 的**唯一设置点**是：

```c
void device_set_wakeup_capable(struct device *dev, bool capable)   /* drivers/base/power/wakeup.c */
{
    dev->power.can_wakeup = capable;
    if (device_is_registered(dev) && !list_empty(&dev->power.entry)) {
        if (capable) wakeup_sysfs_add(dev);
        else         wakeup_sysfs_remove(dev);
    }
}
```

`device_init_wakeup(dev, true)` = `device_set_wakeup_capable()` + `device_set_wakeup_enable()`。
**任何驱动都能直接调它**，不需要设备树里写任何东西。

⇒ 诊断用法：**`power/` 下没有 `wakeup` 文件 ⇒ 从没有人调过 `device_set_wakeup_capable(dev, true)`**。
这是个可靠的反证，比读代码猜哪个分支跑了更快。

## `wakeup-source` 属性：没有统一解析入口

`wakeup-source` 是通用 DT binding 词汇，但**内核里没有一个统一的地方解析它**。
实测某 4.19 树 `grep -rn '"wakeup-source"' --include=*.c drivers/ | wc -l` → **24 处**，
全是各驱动 / 各总线 core 自己 `of_property_read_bool()` 读，读到之后各干各的。

**DT 属性没有全局语义 —— 谁实例化这个节点，谁才有机会解析它的属性。**

- 节点由某个总线 core 实例化（i2c/spi/…），而驱动自己没读该属性
  ⇒ 只有那个总线 core 会读它，要查语义就得去看那个 core。
- 节点是 platform device，驱动自己 `device_property_read_bool(dev, "wakeup-source")`
  ⇒ 语义完全由驱动定义。

以 i2c 为例（`drivers/i2c/i2c-core-of.c` + `i2c-core-base.c`）：属性存在 → 置
`I2C_CLIENT_WAKE` → probe 时 `device_init_wakeup(&client->dev, true)`，并把
`client->irq`（**由该节点的 `interrupts` 属性解析而来**）交给
`dev_pm_set_wake_irq()`；若 `interrupt-names` 里另有 `"wakeup"` 项则用
`dev_pm_set_dedicated_wake_irq()`。

**所以 `wakeup-source` 用的是哪只脚，取决于 `interrupts`，不取决于驱动私有的
`xxx,irq-gpio` 之类属性。** 二者不一致时不会有任何告警。

## 两条路只能选一条

| | 谁调 `enable_irq_wake` | 粒度 |
|---|---|---|
| PM 框架托管 | `dev_pm_arm_wake_irq()`，在 `device_may_wakeup()` 为真时于 suspend 自动调 | 粗：设备可唤醒就一律 arm |
| 驱动自管 | 驱动在自己的 suspend 回调里调 | 细：可以 `if (feature_enabled)` 条件 arm |

两条同时用 ⇒ 同一个 irq 被 `enable_irq_wake` 两次，`wake_depth` 到 2 而 resume 只减 1。

**选型判据**：唤醒能力需要按运行期开关（手势唤醒、接近感应之类，关掉时不该 arm）
⇒ 驱动自管；否则托管更省事。

## 常见坑

- **`wake_depth` 不配平**：suspend/resume 两侧条件写得不一样（一边多个 `||`），
  静默泄漏，irq 永久 armed。两侧必须同条件。
- **以为 `power/wakeup` 只能由 `wakeup-source` 生成**：它的唯一判据是 `can_wakeup`，
  驱动自己 `device_init_wakeup()` 一样能建。
- **以为唤醒跟总线有关**：唤醒走中断线 + SoC 唤醒控制器，总线只是数据通道。
  之所以常要去翻 i2c/spi core，是因为**属性写在了那个 core 实例化的节点上**。
- **同一只脚在 DT 里声明两遍**（`interrupts` 一份、驱动私有 `xxx,irq-gpio` 一份）：
  驱动只读后者时，前者写错也不报错；改 GPIO 分配时极易只改一处。
  驱动不用 `client->irq` 就应删掉 `interrupts`，让该脚在 DT 里只有一处声明。
- **补 `wakeup-source` 却没同步 `interrupts`**：PM 框架会拿错误的 irq 去 arm。
  只想要 sysfs 节点、不想让框架碰 irq 时，用驱动内 `device_init_wakeup()` 更干净。
- **`enable_irq_wake` 不改变 irq 是否 enabled**：它只标记「suspend 时保留」。
  suspend 里若还 `disable_irq()`，两者语义要分清。

## 排查清单

```bash
# 1) 这个设备允不允许唤醒（无此文件 = 从没 device_set_wakeup_capable(true)）
cat /sys/devices/.../power/wakeup

# 2) 系统认得的唤醒源对象
cat /sys/kernel/debug/wakeup_sources

# 3) 这条 irq 到底注册没有、hwirq 和触发方式对不对
cat /proc/interrupts | grep <driver-name>

# 4) 唤醒后确认是谁叫醒的（平台相关，常见于 SoC 唤醒控制器的 debugfs / dmesg）
dmesg | grep -i wakeup
```
