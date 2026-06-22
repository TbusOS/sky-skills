---
name: linux-kernel-dev
description: "Linux kernel and driver development assistant. TRIGGER when: user works on kernel modules, device drivers, kernel subsystems, Kconfig, Makefile, device tree (.dts/.dtsi), or C code using kernel APIs (kmalloc, printk, module_init, platform_driver, etc.). DO NOT TRIGGER when: userspace C/C++ programs, general systems programming without kernel involvement."
---

# Linux Kernel & Driver Development

Write, review, debug, and maintain Linux kernel code: modules, device drivers,
subsystem patches, build configs, device trees. Plus BSP customization discipline.

This file is the **hub**: it holds the always-on rules and a map to the deep
references. Load a reference only when the task needs it (progressive disclosure).

---

## Core Principles

1. **Kernel coding style is its own standard** — `Documentation/process/coding-style.rst`, NOT GNU or Google. Tabs (8 wide), `/* */` comments, K&R braces.
2. **Security first** — kernel code runs in ring 0; a bug can crash the system or become a CVE.
3. **No userspace habits** — no `malloc`/`free`, no `printf`, no floating point, no libc.
4. **Upstream mindset** — write as if submitting to LKML; run `checkpatch.pl` before any patch.
5. **Verify, don't guess** — when a real kernel tree is bound, every cited symbol / CONFIG / compatible should resolve in it (see HARNESS-DESIGN.md §6.10). State `[未验证]` when no tree is bound rather than asserting.

---

## Forbidden Actions (hard rules — not suggestions)

1. **Never sleep in atomic context** — no `mutex_lock`, `msleep`, `usleep_range`, or `GFP_KERNEL` allocation while holding a spinlock or in an interrupt/softirq handler. Use `spinlock` + `GFP_ATOMIC` there.
2. **Never use floating point** in kernel code — no FPU, no `float`/`double` math.
3. **Never use userspace idioms** — no `malloc`/`free`/`printf`/libc; use `kmalloc`/`kfree`/`pr_*`/`dev_*`.
4. **Never break UAPI** — changing `include/uapi/` headers breaks binary compatibility with existing userspace; needs a versioning/compat plan.
5. **Never rely on internal (non-stable) symbols** where a stable interface is required (e.g. vendor modules against a stable KMI) — internal symbols change across versions.
6. **Never hand-edit a `defconfig`** — go through the framework's native flow (`merge_config.sh` + `make olddefconfig` + `savedefconfig`). See `references/bsp_discipline.md`.
7. **Never ignore `checkpatch.pl` errors** before submitting a patch.
8. **Never delete upstream code to customize** — default to keeping it + a vendor config gate (`#if defined(CONFIG_<VENDOR>_<PURPOSE>)`). See `references/bsp_discipline.md`.
9. **Never conclude a hardware state from software observation alone** — read the bytes directly (register/OTP/eFuse dump). See `references/bsp_discipline.md`.
10. **Never decide a change is safe on the compile dimension alone** — check the 4 dimensions (compile / runtime path / semantics / compliance). See `references/bsp_discipline.md`.

---

## References (load on demand)

| 任务 | 加载 | 权威源（对齐） |
|---|---|---|
| 内核代码风格 / 审码 | `references/coding-style.md` | `Documentation/process/coding-style.rst` |
| 新建 module / driver / chardev / Makefile / Kconfig / DT | `references/templates.md` | `Documentation/kbuild/`, `Documentation/devicetree/bindings/` |
| 锁 / 并发 / 原子 | `references/concurrency.md` | `Documentation/locking/`, `memory-barriers.txt`, `atomic_t.txt` |
| 调试（printk / ftrace / oops / 工具） | `references/debugging.md` | `Documentation/admin-guide/`, `dev-tools/` |
| 内核 API 速查 | `references/api-quick-ref.md` | `Documentation/core-api/`, `driver-api/` |
| 提交 patch / checkpatch / format-patch | `references/patch-workflow.md` | `Documentation/process/submitting-patches.rst` |
| **BSP 定制纪律**（defconfig / 上游 gate / 硬件调试 / 改动分析 / 冲突解决） | `references/bsp_discipline.md` | 通用工程纪律 |
| **构建系统**（Kbuild Makefile / Kconfig 语言 / 配置流程 / 交叉编译 / in-tree·out-of-tree / 模块要素） | `references/build.md` | `Documentation/kbuild/` |
| 跨内核版本差异 | `references/kernel_version_deltas.md` | 各版本树 + `Documentation` |
| **答案验证契约**（引具体符号时附 `[CLAIMS]`） | `references/claims-contract.md` | 事实检查 靶子 |
| 该做 / 不该做速查 | `dos-and-donts.md` | 本 skill 积累 |
| 已知坑（gotchas） | `known-bugs.md` | 本 skill 积累 |

### 子系统模块（按需路由）

深入具体内核子系统时加载对应模块（命中才读，progressive disclosure），每个对齐该子系统的 `Documentation/<subsys>/`，并配套 eval 用例进 harness（fact_gate + 回归测）。

| 任务命中 | 加载 | 权威源（对齐） |
|---|---|---|
| 中断 / 下半部 / threaded IRQ / tasklet / softirq / workqueue 选型 | `references/subsys/interrupts.md` | `Documentation/core-api/genericirq.rst`、`core-api/irq/` |
| 睡眠/唤醒 / 等待队列 / completion / 抢占 / 调度策略·优先级·亲和性 / CFS·EEVDF·RT·DL | `references/subsys/scheduler.md` | `Documentation/scheduler/` |
| 内存分配（kmalloc/kvmalloc/vmalloc/alloc_pages/kmem_cache）/ GFP 标志 / 访问用户内存 / 驱动 mmap·缺页 | `references/subsys/memory.md` | `Documentation/mm/`、`core-api/memory-allocation.rst` |
| VFS / file_operations 实现 / 导出数据（debugfs·procfs·sysfs·seq_file）/ 写文件系统·挂载 / page cache | `references/subsys/filesystems.md` | `Documentation/filesystems/` |
| 设备树消费（compatible 绑定 / of_* 读属性 / 拿 MMIO·中断·时钟·GPIO / 遍历节点 / overlay） | `references/subsys/device-tree.md` | `Documentation/devicetree/`（`.dts`/binding 模板见 `templates.md`） |
| I2C 设备驱动（i2c_driver 绑定 / smbus·原始传输 / regmap-i2c / probe 签名版本） | `references/subsys/i2c.md` | `Documentation/i2c/`、`include/linux/i2c.h` |
| SPI 设备驱动（spi_driver 绑定 / spi_sync·多段传输 / regmap-spi / buffer DMA-able） | `references/subsys/spi.md` | `Documentation/spi/`、`include/linux/spi/spi.h` |
| GPIO（gpiod 描述符消费 / GPIO 当中断 / 写 gpiochip 控制器 / 弃旧整数 API） | `references/subsys/gpio.md` | `Documentation/driver-api/gpio/`、`include/linux/gpio/consumer.h` |
| USB host 驱动（usb_driver 绑定 / 控制·批量传输 / URB 异步 / 完成回调上下文） | `references/subsys/usb.md` | `Documentation/driver-api/usb/`、`include/linux/usb.h` |
| 网络（net_device 注册 / NAPI 收包 / ndo_start_xmit 发包 / sk_buff / 队列控制） | `references/subsys/networking.md` | `Documentation/networking/`、`include/linux/netdevice.h` |
| 音频 ASoC（codec/component · cpu DAI · machine 声卡 / DAI ops / trigger 上下文） | `references/subsys/audio.md` | `Documentation/sound/soc/`、`include/sound/soc.h` |
| 摄像 V4L2（v4l2_device/video_device 注册 / vb2 缓冲 / sensor subdev async / stop_streaming） | `references/subsys/camera.md` | `Documentation/driver-api/media/`、`include/media/` |
| 时钟 CCF（clk_get/prepare/enable 消费 / prepare·enable 两阶段上下文 / 写 clk provider 暴露给 DT） | `references/subsys/clk.md` | `Documentation/driver-api/clk.rst`、`include/linux/clk.h`、`clk-provider.h` |
| 引脚 pinctrl（运行时切 state / PM sleep·idle 封装 / default 态由 core 自动应用） | `references/subsys/pinctrl.md` | `Documentation/driver-api/pin-control.rst`、`include/linux/pinctrl/consumer.h` |
| 供电 regulator（get·enable·调压消费 / enable·disable 引用计数配平 / 可选供电 vs dummy） | `references/subsys/regulator.md` | `Documentation/power/regulator/consumer.rst`、`include/linux/regulator/consumer.h` |
| 寄存器抽象 regmap（按总线 init / read·write·update_bits / cache + PM / volatile 寄存器） | `references/subsys/regmap.md` | `Documentation/driver-api/regmap.rst`、`include/linux/regmap.h` |
| 复位 reset（assert·deassert·reset 消费 / exclusive vs shared 引用计数 / DT resets） | `references/subsys/reset.md` | `Documentation/driver-api/reset.rst`、`include/linux/reset.h` |
| PWM（pwm_get / pwm_state 原子应用 / apply 接口改名·原子 vs 会睡 / DT pwms） | `references/subsys/pwm.md` | `Documentation/driver-api/pwm.rst`、`include/linux/pwm.h` |
| IIO（写 sensor/ADC 驱动 / iio_priv 私有数据 / channels·info / 触发缓冲采集） | `references/subsys/iio.md` | `Documentation/driver-api/iio/`、`include/linux/iio/iio.h` |
| 温控 thermal（温度传感器 zone / get_temp 毫摄氏度 / 冷却设备 / OF 注册改名 / DT thermal-zones） | `references/subsys/thermal.md` | `Documentation/driver-api/thermal/`、`include/linux/thermal.h` |
| 看门狗 watchdog（watchdog_ops 启停喂狗 / nowayout 语义 / max_hw_heartbeat 代喂 / stop_on_reboot） | `references/subsys/watchdog.md` | `Documentation/watchdog/`、`include/linux/watchdog.h` |
| RTC（rtc_class_ops 读写时间 / rtc_time 遵循 struct tm·tm_year 自 1900 / allocate+register） | `references/subsys/rtc.md` | `Documentation/admin-guide/rtc`、`include/linux/rtc.h` |
| LED（led_classdev 注册 / brightness_set 原子上下文 vs blocking / DT init_data） | `references/subsys/led.md` | `Documentation/leds/`、`include/linux/leds.h` |
| 输入 input（input_dev 注册 / 声明能力 + 上报 + input_sync 帧同步 / 绝对轴范围） | `references/subsys/input.md` | `Documentation/input/`、`include/linux/input.h` |
| 电源 power-supply（power_supply_desc 注册 / 属性固定微单位 / power_supply_changed 通知 / propval） | `references/subsys/power-supply.md` | `Documentation/power/power_supply_class.rst`、`include/linux/power_supply.h` |
| DMA engine（slave DMA 消费 / prep·submit·issue_pending 序列 / 通道生命周期 / DT dmas） | `references/subsys/dmaengine.md` | `Documentation/driver-api/dmaengine/`、`include/linux/dmaengine.h` |
| NVMEM（eeprom/efuse/otp 消费 cell·缓冲要 kfree / 写 provider nvmem_config / DT cells） | `references/subsys/nvmem.md` | `Documentation/driver-api/nvmem.rst`、`include/linux/nvmem-consumer.h` |
| MMC/SD host（mmc_alloc_host·add / mmc_host_ops / .request 完成必 mmc_request_done） | `references/subsys/mmc.md` | `Documentation/mmc/`、`include/linux/mmc/host.h` |
| MTD flash（NAND/NOR / 写前必擦 + erasesize 对齐 / mtd_device_parse_register 分区 / nand_scan） | `references/subsys/mtd.md` | `Documentation/driver-api/mtd/`、`include/linux/mtd/mtd.h` |
| 通用 PHY（USB/PCIe/MIPI phy 消费 init→power_on / 写 provider phy_ops / 别和网络 MDIO PHY 混） | `references/subsys/phy.md` | `Documentation/driver-api/phy/`、`include/linux/phy/phy.h` |
| 硬件监控 hwmon（register_with_info / sysfs 固定单位 温度毫摄氏度·电压 mV / chip_info·ops·channel） | `references/subsys/hwmon.md` | `Documentation/hwmon/`、`include/linux/hwmon.h` |
| 写时钟控制器 clk-provider（clk_hw/clk_ops · enable 原子 vs prepare 可睡 · 暴露给 DT · 固定/门控构造器） | `references/subsys/clk-provider.md` | `Documentation/driver-api/clk.rst`、`include/linux/clk-provider.h`（消费见 `clk.md`） |
| 写 pin 控制器 pinctrl-driver（pinctrl_desc 三组 ops · dt_node_to_map · set_mux · pin_config_set） | `references/subsys/pinctrl-driver.md` | `Documentation/driver-api/pin-control.rst`、`include/linux/pinctrl/`（消费见 `pinctrl.md`） |
| Mailbox/IPC（client 收发 mbox_send_message · 写控制器 mbox_chan_ops · TX 完成必上报 txdone） | `references/subsys/mailbox.md` | `Documentation/driver-api/mailbox.rst`、`include/linux/mailbox_{client,controller}.h` |
| 写 PMIC/稳压器 regulator-driver（regulator_desc · *_regmap helper ops · list_voltage 映射） | `references/subsys/regulator-driver.md` | `include/linux/regulator/driver.h`（消费见 `regulator.md`） |
| 写 DMA 控制器 dmaengine-provider（dma_device · dma_cap_set · virt-dma vchan · 完成 complete cookie） | `references/subsys/dmaengine-provider.md` | `Documentation/driver-api/dmaengine/provider.rst`、`include/linux/dmaengine.h`（消费见 `dmaengine.md`） |
| IOMMU 驱动（iommu_ops · map_pages/unmap_pages · unmap 后必刷 IOTLB · domain 类型） | `references/subsys/iommu.md` | `Documentation/driver-api/iommu`、`include/linux/iommu.h` |

目录总览见 `index.md`。

---

## 关于本 skill 的自我进化引擎

本 skill 正在配一套有度量的自我改进机制（事实检查 / 打分面板 / 测试用例集 / 回归测试 / `/kernel-learn`），
并能跟随内核版本自更新。设计与状态见同目录 `HARNESS-DESIGN.md`。
`dos-and-donts.md` / `known-bugs.md` 会随真实任务由该机制逐步充实——每条都带可执行检查，不是空话。

**已落（P1 客观检查 + P2 回归测试 + P3 打分面板/学习循环 + P4 记录表/版本适配）**：
- `scripts/fact_gate.mjs` — 查答案 `[CLAIMS]` 里的 API / CONFIG / 符号 / compatible 是否在真内核树**实存**（树无关 `--tree`；exit 0 干净 / 1 有幻觉 / 3 检查坏不算 fail）
- `scripts/checkpatch_gate.sh` — 用内核自带 `checkpatch.pl` 校代码风格
- `scripts/kernel-tree.mjs` — 绑内核树（`detect` / `add` / `list` / `clone`），路径存本机配置不入库
- `scripts/regression_test.mjs` + `tests/eval/cases/*.json` — 回归测试:每条用例的 gold 必须在真树查得到 + 自降解校准（故意改坏必须被抓）+ 覆盖率统计；`--baseline` 记录、`--check` 对比退步
- `scripts/kernel-critic.mjs` + `.claude/agents/kernel-*-critic.md` — 4 轴打分面板（correctness/safety/coding-style/completeness）prompt 准备,Task 派子 agent 并行评分
- `/kernel-learn`（`.claude/commands/` + `scripts/kernel_learn_validate.mjs`）— 把踩过的坑沉成原子三件套（规则带 `[CLAIMS]` + 建前fail/建后pass 用例 + 注册），无可执行检查不准建
- `evolution/{ledger.tsv,rules.json}` + `scripts/version_drift.mjs` — 记录表/规则复用 design-evolve（`evolve-ledger.mjs --ledger=` / `evolve-rules.mjs --registry=`）带 fires/catches；`version_drift.mjs` 拿多版本树对比 gold,报"旧版有新版没"的 API（机器跑出版本漂,不靠手维护）
- 引具体符号的答案附 `[CLAIMS]` 块（`references/claims-contract.md`）；绑树后跑事实检查,答案标 `[已对 linux <版本> 验证]` 或 `[未验证]`
