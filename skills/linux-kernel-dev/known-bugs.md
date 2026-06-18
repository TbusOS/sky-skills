# Known Bugs / Gotchas

> 踩过的内核/BSP 坑（gotchas）。由 `/kernel-learn`（P3 建）随真实任务积累。
> 每条带可执行检查 + 配套 测试用例（建前 fail / 建后 pass），证明"这坑不再复现"。
> 当前为骨架。

## 条目格式

```
### KB-NNN: <坑的一句话>
- symptom: <表现 / 报错>
- root cause: <真因（抽象到通用原则）>
- fix: <怎么修>
- trigger: <什么关键词/症状该触发本条>
- range: <版本区间，无标=版本无关>
- check: <可执行检查：[CLAIMS] 或 scripts/checks/<name>>
- linked_eval_case: <KV-xxx>
- fires/catches: <由 evolve-rules 维护>
```

## 一行索引（grep 用，先读这里再钻具体条目）

- KB-ION-001 · 现代内核移除了 ION，分配 DMA 缓冲用 DMA-heap（dma_heap_buffer_alloc），别用 ion_alloc · KV-004 · range：ION-removed kernels
- KB-IRQ-001 · 硬中断 / 软中断(tasklet/softirq)上下文不能睡眠；要睡眠的延迟处理用 threaded IRQ 的 thread_fn 或 workqueue · KV-006 · range：版本无关
- KB-SCHED-001 · 手动睡眠必须先 set_current_state 再检查条件(反了丢唤醒)；能用 wait_event 就别手写 · KV-010 · range：版本无关
- KB-MM-001 · 原子/中断/持锁上下文分配内存用 GFP_ATOMIC，不用 GFP_KERNEL(后者会触发回收而睡眠) · KV-011 · range：版本无关
- KB-FS-001 · procfs 的 proc_create 末参自 5.6 起从 struct file_operations 改成 struct proc_ops；移植旧 /proc 代码必踩 · KV-016 · range：5.6+
- KB-DT-001 · 遍历 DT 节点(for_each_child_of_node / of_find_*)拿到的 device_node 用完要 of_node_put,提前 break 也要 · KV-019 · range：版本无关
- KB-I2C-001 · i2c_driver.probe 签名变过:旧双参 (client,id) → probe_new(client) → 6.x 起单参 .probe(client);移植旧驱动编译错 · KV-020 · range：6.x 起单参
- KB-SPI-001 · SPI 传输 buffer 必须 DMA-able(kmalloc),不能用栈上数组当 spi_transfer 的 tx_buf/rx_buf · KV-024 · range：版本无关
- KB-GPIO-001 · 用 gpiod 描述符 API(gpiod_get/gpiod_set_value),弃旧整数 API(gpio_request/gpio_set_value);描述符已按 DT 处理 active-low,别再取反 · KV-026 · range：版本无关(旧 API 淘汰中)
- KB-USB-001 · URB 完成回调在原子/软中断上下文,不能睡;回调里重新提交 URB 用 usb_submit_urb(urb, GFP_ATOMIC) · KV-031 · range：版本无关
- KB-BUILD-001 · 模块漏 MODULE_LICENSE → 内核被 taint,且 EXPORT_SYMBOL_GPL 导出的符号对该模块不可用(链接/加载失败) · KV-032 · range：版本无关
- KB-NET-001 · NAPI poll 在软中断上下文(不能睡);必须尊重 budget——收满 budget 就返回,done<budget 才 napi_complete_done 重开收中断,返回 done · KV-036 · range：版本无关
- KB-ASOC-001 · ASoC 的 trigger 回调在原子上下文(持 PCM stream 锁,不能睡);慢速配置(I2C regmap)放 hw_params,trigger 只做非睡眠启停 · KV-040 · range：版本无关
- KB-V4L2-001 · vb2 的 stop_streaming 必须把驱动手里所有 buffer 用 vb2_buffer_done 归还(VB2_BUF_STATE_ERROR),否则 STREAMOFF 卡死/泄漏 · KV-042 · range：版本无关
- KB-CLK-001 · 时钟分两阶段:clk_prepare/unprepare 进程上下文会睡,clk_enable/disable 不睡可在原子/中断上下文;别在原子上下文 clk_prepare(_enable) · KV-045 · range：版本无关
- KB-PINCTRL-001 · driver core 在 probe 前自动应用 default 态;别在 probe 里手动选 default;显式 pinctrl_select_state 只用于运行时切 sleep/idle · KV-049 · range：版本无关
- KB-REG-001 · regulator_enable/disable 引用计数必须配平,别 force_disable 修不平衡;可选供电用 devm_regulator_get_optional(普通 get 没配返 dummy 掩盖缺失) · KV-052 · range：版本无关
- KB-REGMAP-001 · regmap_config 必设 reg_bits/val_bits 否则 init 失败;硬件自改的寄存器要标 volatile_reg 否则 cache 返陈旧值;改 bit 用 regmap_update_bits · KV-055 · range：版本无关
- KB-RESET-001 · 复位线被多设备共用必须 devm_reset_control_get_shared(引用计数,最后一个 assert 才真复位);独占线才用 *_exclusive,给共用线用 exclusive 会失败 · KV-057 · range：版本无关
- KB-PWM-001 · pwm_apply_state 已改名 pwm_apply_might_sleep(旧名新内核编译错);用 apply 一次性写整个 state,别用 pwm_config+pwm_enable 老序列(会毛刺);原子上下文用 pwm_apply_atomic · KV-060 · range：apply 改名见目标树
- KB-IIO-001 · IIO 私有数据跟 iio_dev 一起分配:devm_iio_device_alloc(dev,sizeof(state)) + iio_priv() 取,别单独 kmalloc;register 放最后(注册即对用户态可见) · KV-063 · range：版本无关

## 条目

### KB-ION-001：现代内核移除了 ION，分配 DMA 缓冲要用 DMA-heap API

- symptom：在较新内核上编译报 `implicit declaration of function 'ion_alloc'` / 链接 undefined reference；移植旧 BSP 的缓冲分配代码时尤甚。
- root cause：ION 子系统在较新内核已被移除。遗留代码与旧教程里的 `ion_alloc` / `ion_client_create` 在新树上根本不存在——这是个会随版本失效的断言，不是写法问题。
- fix：用 DMA-heap API 分配 DMA-able 缓冲（`dma_heap_buffer_alloc`）。
- trigger：见到 `ion_alloc` / `ion_client_create` / ION，或在新内核上移植旧 BSP 的缓冲分配。
- range：ION 在较新内核已移除；用 `version_drift.mjs` 对目标树核实（本条由 6.1→7.0 实跑抓出）。
- scope/limits：版本敏感条目，须对 ION-removed 的现代树验证；老树（ION 仍在）上 `ion_alloc` 仍解析得到。
- check：
  ```
  [CLAIMS]
  api: dma_heap_buffer_alloc
  [/CLAIMS]
  ```
- linked_eval_case：KV-004
- provenance：self（version_drift 实跑抓出 ion_alloc ROTTED）
- fires/catches：0 / 0

### KB-IRQ-001：原子/中断上下文不能睡眠，需要睡眠的延迟处理放对地方

- symptom：在中断处理函数 / tasklet / softirq 里调 `msleep` / `mutex_lock` / `GFP_KERNEL` 分配 / 读慢速总线，导致 `BUG: scheduling while atomic`、死锁、或偶发崩。
- root cause：硬中断半部和软中断（tasklet/softirq）都在原子上下文运行，不可调度、不可睡眠。把可睡眠的活放进了这些上下文。
- fix：可睡眠的延迟处理放到进程上下文——threaded IRQ 的 `thread_fn`（`request_threaded_irq`），或 workqueue（`INIT_WORK` + `schedule_work`）。硬中断半部只做最少快处理后返回 `IRQ_WAKE_THREAD`。
- trigger：见到中断 handler / tasklet / softirq 里出现 `msleep` / `mutex_lock` / `GFP_KERNEL` / 慢速 I/O，或问"中断里能不能睡 / 下半部用什么"。
- range：版本无关（原子上下文不睡眠是内核长期不变规则）。
- scope/limits：约束的是"在哪个上下文睡眠"；具体 API 名按目标树 `include/linux/interrupt.h` / `linux/workqueue.h` 核。
- check：
  ```
  [CLAIMS]
  api: request_threaded_irq, schedule_work
  [/CLAIMS]
  ```
- linked_eval_case：KV-006
- provenance：self（从内核子系统知识库内容源蒸馏 + 真树核对中断上下文语义；样板子系统：中断）
- fires/catches：0 / 0

### KB-SCHED-001：手动睡眠先设状态再查条件，否则丢唤醒睡死

- symptom：自己写睡眠循环的任务偶发永久睡死（明明唤醒方调过 `wake_up`）；高负载或多核下更容易复现。
- root cause：把顺序写成"先检查条件，后 `set_current_state(TASK_INTERRUPTIBLE)`，再 `schedule()`"。若唤醒发生在"检查完条件"与"设睡眠状态"之间，这次唤醒把一个还是 `TASK_RUNNING` 的任务"唤醒"（无效），随后任务设成睡眠并 `schedule()`，再没人来唤——丢唤醒。
- fix：顺序必须是 `set_current_state(TASK_INTERRUPTIBLE)` →（再）检查条件 → `schedule()` → 醒来 `set_current_state(TASK_RUNNING)`。设状态在前，唤醒方把状态改回 RUNNING，`schedule()` 就不会真睡。能用 `wait_event*` 宏就别手写这套。
- trigger：见到手写 `set_current_state` / `schedule()` 睡眠循环，或问"自己写睡眠 / 丢唤醒 / 偶发睡死"。
- range：版本无关（调度器睡眠/唤醒内存序语义长期不变）。
- scope/limits：约束的是顺序与状态机；API 名按目标树 `include/linux/sched.h` / `wait.h` 核。
- check：
  ```
  [CLAIMS]
  api: set_current_state, schedule
  [/CLAIMS]
  ```
- linked_eval_case：KV-010
- provenance：self（从内核子系统知识库内容源蒸馏 + 真树核对睡眠/唤醒语义；样板子系统：调度器）
- fires/catches：0 / 0

### KB-MM-001：原子/中断上下文分配内存要用 GFP_ATOMIC，不是 GFP_KERNEL

- symptom：在中断处理 / tasklet / softirq / 持 spinlock 时分配内存，偶发 `BUG: sleeping function called from invalid context`、卡死或栈回溯指向 `__might_sleep` / 内存回收路径。
- root cause：`GFP_KERNEL` 允许直接回收和换出——内存紧张时会**睡眠**等内存。在不可睡眠的上下文用它就违规。这是 GFP **标志**选错，区别于"把可睡眠的活放错上下文"（那是 KB-IRQ-001）。
- fix：不可睡眠上下文（中断/原子/持锁）用 `GFP_ATOMIC`（动用紧急储备、不睡，但更易失败，要检查 NULL）；只有进程上下文才用 `GFP_KERNEL`。
- trigger：见到中断 handler / tasklet / softirq / 持 spinlock 段里 `kmalloc(..., GFP_KERNEL)` / `kzalloc(..., GFP_KERNEL)`，或问"中断里怎么分配内存 / GFP 用哪个"。
- range：版本无关（GFP_KERNEL 可睡、GFP_ATOMIC 不可睡是长期语义）。
- scope/limits：约束的是上下文与 GFP 标志的搭配；标志/函数名按目标树 `include/linux/gfp_types.h` / `slab.h` 核（注意 `__GFP_ATOMIC` 较新内核已移除，用组合宏 `GFP_ATOMIC`）。
- check：
  ```
  [CLAIMS]
  api: kmalloc
  symbol: GFP_ATOMIC
  [/CLAIMS]
  ```
- linked_eval_case：KV-011
- provenance：self（从内核子系统知识库内容源蒸馏 + 真树核对 GFP 上下文语义；样板子系统：内存管理。关联 KB-IRQ-001——同根不同面）
- fires/catches：0 / 0

### KB-FS-001：procfs 的 proc_create 末参 5.6 起从 file_operations 改成 proc_ops

- symptom：把旧 `/proc` 代码移植到新内核，编译报 `proc_create` 实参类型不匹配 / 期望 `struct proc_ops *`；或直接传 `&my_file_operations` 编译错。
- root cause：`proc_create()` 最后一个参数自 5.6 起由 `struct file_operations *` 改为 `struct proc_ops *`（procfs 不再复用通用 file_operations，单列一套精简回调）。旧教程/旧代码仍按 `file_operations` 写——这是个随版本失效的接口变更。
- fix：定义 `static const struct proc_ops my_proc_ops = { .proc_open=…, .proc_read=…, … };`，`proc_create(name, mode, parent, &my_proc_ops)`。注意回调名带 `proc_` 前缀（`.proc_open`/`.proc_read`/`.proc_lseek`/`.proc_release`）。
- trigger：见到 `proc_create` 末参传 `file_operations`，或问"建 /proc 入口 / proc_create 用什么结构 / 移植旧 proc 代码编译错"。
- range：5.6+（5.6 以前是 `file_operations`）。按目标树 `include/linux/proc_fs.h` 核。
- scope/limits：仅 procfs；debugfs/sysfs 不受此变更影响。
- check：
  ```
  [CLAIMS]
  symbol: proc_ops
  [/CLAIMS]
  ```
- linked_eval_case：KV-016
- provenance：self（从内核子系统知识库内容源蒸馏 + 真树核对 proc_create 接口；样板子系统：文件系统）
- fires/catches：0 / 0

### KB-DT-001：遍历 DT 节点拿到的 device_node 用完要 of_node_put

- symptom：长期运行后 DT 节点引用计数泄漏；卸载模块或移除设备时 `device_node` 不释放、`/sys/firmware/devicetree` 引用残留；用 `OF_DYNAMIC`/overlay 时尤其暴露。
- root cause：`for_each_child_of_node` / `of_find_node_by_*` / `of_get_*` 返回的 `device_node` 都**增加了引用计数**，需要 `of_node_put()` 配对释放。`for_each_child_of_node` 正常跑完循环会自动 put，但**提前 `break`/`return` 不会**——漏 put。
- fix：正常遍历完循环自动配平；任何提前 `break`/`goto`/`return` 之前手动 `of_node_put(child)`。`of_find_*` 单独拿的节点用完显式 `of_node_put`。
- trigger：见到 `for_each_child_of_node` / `of_find_node_by_*` / `of_get_child_by_name` 后没有对应 `of_node_put`，或循环里有提前退出。
- range：版本无关（DT 节点引用计数语义长期不变）。
- scope/limits：约束引用计数配对；遍历宏/函数名按目标树 `include/linux/of.h` 核。
- check：
  ```
  [CLAIMS]
  api: of_node_put, for_each_child_of_node
  [/CLAIMS]
  ```
- linked_eval_case：KV-019
- provenance：self（从内核子系统知识库内容源蒸馏 + 真树核对 of 遍历引用计数；子系统：设备树）
- fires/catches：0 / 0

### KB-I2C-001：i2c_driver.probe 签名变过,移植旧驱动会编译错

- symptom：把旧 I2C 驱动移到新内核，`i2c_driver` 的 `.probe` 赋值类型不匹配；或用了 `.probe_new` 在更新内核上字段不存在。
- root cause：`i2c_driver.probe` 历史上是 `(struct i2c_client *, const struct i2c_device_id *)`（双参）；5.0 引入单参 `.probe_new(struct i2c_client *)`；6.x 起把 `.probe` 本身改为单参并移除 `.probe_new`。所以同一份代码在不同内核上对不上——随版本变的接口。
- fix：现代内核（6.x+）用单参 `int probe(struct i2c_client *client)` 赋给 `.probe`；要兼容一段跨度时按目标树 `include/linux/i2c.h` 的实际字段写。型号/变体数据从 DT 用 `of_device_get_match_data` 取（不再依赖 `i2c_device_id`）。
- trigger：见到 `i2c_driver` 的 `.probe`/`.probe_new` 赋值，或问"i2c probe 签名/移植旧 i2c 驱动编译错"。
- range：6.x 起 `.probe` 单参；6.1 过渡期 `.probe`(双参) 与 `.probe_new`(单参) 并存；7.0 只剩单参 `.probe`。按目标树核。
- scope/limits：仅 i2c_driver 的 probe 字段；传输 API 不受影响。
- check：
  ```
  [CLAIMS]
  api: module_i2c_driver
  symbol: i2c_client
  [/CLAIMS]
  ```
- linked_eval_case：KV-020
- provenance：self（两棵树 6.1/7.0 实测 i2c.h probe 字段差异；子系统：i2c）
- fires/catches：0 / 0

### KB-SPI-001：SPI 传输 buffer 必须 DMA-able,别用栈上数组

- symptom：SPI 传输偶发读到垃圾/全 0、或栈被踩、`DMA-API: device driver maps memory from stack` 警告;某些控制器(走 DMA)上必现,PIO 控制器上侥幸不报。
- root cause：`spi_transfer.tx_buf`/`rx_buf` 指向的内存可能被 SPI 控制器**直接 DMA**。栈上的数组不保证 DMA-able(可能不在线性映射的可 DMA 区、且 cache 一致性无法保证),控制器 DMA 取不到正确数据或踩栈。
- fix：传输 buffer 用 `kmalloc`/`devm_kmalloc` 分配(在可 DMA 的内核堆),或用 SPI 核心的 bounce buffer 接口;不要用函数局部数组直接当 tx_buf/rx_buf。
- trigger：见到 `spi_transfer` 的 `tx_buf`/`rx_buf` 指向栈上局部数组,或问"SPI 传输 buffer 放哪/读到垃圾"。
- range：版本无关(DMA 对内存的要求长期不变)。
- scope/limits：约束传输 buffer 的内存来源;API 名按目标树 `include/linux/spi/spi.h` 核。
- check：
  ```
  [CLAIMS]
  api: spi_sync
  symbol: spi_transfer
  [/CLAIMS]
  ```
- linked_eval_case：KV-024
- provenance：self（从内核子系统知识库内容源蒸馏 + 真树核对 spi_transfer 语义;子系统:spi）
- fires/catches：0 / 0

### KB-GPIO-001：用 gpiod 描述符 API,别用旧整数 GPIO API

- symptom：新内核上用旧整数 GPIO API 报 deprecated/可能编译告警;active-low 脚电平搞反;移植旧驱动后 GPIO 行为不对。
- root cause：旧的整数 GPIO API(`gpio_request`/`gpio_free`/`gpio_set_value`/`gpio_get_value`,以裸 GPIO 编号操作)已被**描述符 API**(`gpiod_*`,以 `struct gpio_desc *` 操作)取代,旧 API 在淘汰中。描述符 API 还会**按 DT 的 `GPIO_ACTIVE_LOW` 自动处理极性**——`gpiod_set_value(d, 1)` 是"逻辑有效"。旧代码自己对 active-low 取反,换到描述符 API 后就反了。
- fix：用 `devm_gpiod_get(dev, "<name>", GPIOD_*)`(对应 DT 的 `<name>-gpios`)拿 `gpio_desc`,`gpiod_set_value`/`gpiod_get_value` 按逻辑电平操作;不要自己处理 active-low(描述符已处理);别用旧整数 API。
- trigger：见到 `gpio_request`/`gpio_set_value`/`gpio_get_value`/裸 GPIO 编号,或问"GPIO 怎么用/复位脚/active-low"。
- range：版本无关(旧 API 长期淘汰中);具体函数名按目标树 `include/linux/gpio/consumer.h` 核。
- scope/limits：消费侧 API 选择 + 极性处理;provider(gpiochip)另说。
- check：
  ```
  [CLAIMS]
  api: gpiod_get
  symbol: gpio_desc
  [/CLAIMS]
  ```
- linked_eval_case：KV-026
- provenance：self（从内核子系统知识库内容源蒸馏 + 真树核对 gpiod 消费 API;子系统:gpio）
- fires/catches：0 / 0

### KB-USB-001：URB 完成回调在原子上下文,不能睡;重提交用 GFP_ATOMIC

- symptom：USB 驱动偶发 `BUG: scheduling while atomic` / `sleeping function called from invalid context`,栈回溯指向 URB completion;或重新提交 URB 在高负载下失败。
- root cause：URB 的 completion 回调由 USB 核心在**软中断/原子上下文**调用,**不能睡眠**(不能 mutex_lock/msleep/GFP_KERNEL 分配/同步传输)。回调里直接做会睡的活,或用 `GFP_KERNEL` 重新 `usb_submit_urb`,就违规。
- fix：回调里要重新提交用 `usb_submit_urb(urb, GFP_ATOMIC)`;要做会睡的处理(解析、写文件、同步传输)推给 workqueue(见 `interrupts.md`/`scheduler.md`)。
- trigger：见到 URB completion 回调里有 msleep/mutex_lock/GFP_KERNEL/usb_bulk_msg,或问"URB 回调能不能睡/重提交 GFP 用哪个"。
- range：版本无关(URB 回调上下文长期是原子)。
- scope/limits：约束 completion 回调里的上下文;API 名按目标树 `include/linux/usb.h` 核。
- check：
  ```
  [CLAIMS]
  api: usb_submit_urb
  symbol: urb
  [/CLAIMS]
  ```
- linked_eval_case：KV-031
- provenance：self（从内核子系统知识库内容源蒸馏 + 真树核对 URB 回调上下文;子系统:usb。关联 KB-IRQ-001/KB-MM-001 同根"原子不睡"）
- fires/catches：0 / 0

### KB-BUILD-001：模块漏 MODULE_LICENSE,taint 内核 + 用不了 GPL-only 符号

- symptom：`insmod` 后 `dmesg` 报 `module license 'unspecified' taints kernel`;或链接/加载时找不到某个内核符号(明明存在),报 `Unknown symbol`。
- root cause：模块没声明 `MODULE_LICENSE`,内核视为非 GPL,标记 taint;并且**拒绝把 `EXPORT_SYMBOL_GPL` 导出的符号给它**——很多核心 API 是 GPL-only 导出的,于是该模块解析这些符号失败。
- fix：每个模块都写 `MODULE_LICENSE("GPL")`(或 "GPL v2" 等内核认可的 GPL-兼容串);需要 GPL-only 符号时尤其必须。配 `MODULE_AUTHOR`/`MODULE_DESCRIPTION` 更规范。
- trigger：见到内核模块源码没有 `MODULE_LICENSE`,或问"taint / Unknown symbol / 模块 license"。
- range：版本无关(license/taint/GPL 符号机制长期不变)。
- scope/limits：约束模块元数据;符号名按目标树 `include/linux/module.h` 核。
- check：
  ```
  [CLAIMS]
  symbol: MODULE_LICENSE, EXPORT_SYMBOL_GPL
  [/CLAIMS]
  ```
- linked_eval_case：KV-032
- provenance：self（从内核构建系统文档蒸馏 + 真树核对 module.h 宏;子系统:构建系统）
- fires/catches：0 / 0

### KB-NET-001：NAPI poll 在软中断上下文,不能睡 + 必须尊重 budget

- symptom：网卡驱动在高流量下软锁(`soft lockup`)、其他任务饿死、或收包停滞;`dmesg` 报 NAPI 相关 BUG;在 poll 里 mutex_lock/分配 GFP_KERNEL 直接 `scheduling while atomic`。
- root cause：NAPI 的 poll 回调由网络软中断(NET_RX_SOFTIRQ)调用,是**原子/软中断上下文,不能睡**。且 poll **必须尊重 `budget`**:一轮最多处理 budget 个包就返回(让出 CPU,下一轮再来);只有处理数 `done < budget`(说明收空了)才 `napi_complete_done(napi, done)` 并重开收中断。无视 budget 一直收 → 霸占 softirq、软锁。
- fix：poll 里只用非睡眠操作(`GFP_ATOMIC` / 无锁或 spinlock);`while (done < budget && 有包)` 收;`done == budget` 直接返回 `budget`(不 complete);`done < budget` 才 `napi_complete_done` + 重开中断,返回 `done`。要睡的活推 workqueue。
- trigger：见到 NAPI poll 回调里 msleep/mutex_lock/GFP_KERNEL,或循环不看 budget、无条件 napi_complete,或问"NAPI poll 怎么写/软锁/budget"。
- range：版本无关(NAPI 上下文与 budget 契约长期不变)。
- scope/limits：约束 poll 的上下文 + budget 协议;API/签名按目标树 `include/linux/netdevice.h` 核(注意 netif_napi_add 的 weight 参版本差异)。
- check：
  ```
  [CLAIMS]
  api: netif_napi_add, napi_complete_done
  [/CLAIMS]
  ```
- linked_eval_case：KV-036
- provenance：self（从内核子系统知识库内容源蒸馏 + 真树核对 NAPI 上下文/budget;子系统:网络。关联 KB-IRQ-001 同根"软中断不睡"）
- fires/catches：0 / 0

### KB-ASOC-001：ASoC trigger 回调在原子上下文,不能睡

- symptom：音频驱动 START/STOP 流时偶发 `scheduling while atomic` / 死锁;在 trigger 里经 I2C 写 codec 寄存器(慢速、会睡)就崩。
- root cause：ASoC 的 `snd_soc_dai_ops.trigger`(以及 PCM trigger)在**持 PCM substream 自旋锁的原子上下文**调用,**不能睡眠**——不能做经 I2C/SPI 的慢速 regmap 访问、不能 mutex_lock。
- fix：把慢速配置(采样率/格式/时钟、需要经控制总线写的寄存器)放 `hw_params` / `set_fmt` / `set_sysclk`(进程上下文,可睡);`trigger` 里只做非睡眠的启停(写本地 MMIO 寄存器、置标志)。要在启停时做慢速操作就 defer 到 workqueue。
- trigger：见到 ASoC `trigger` 回调里有 I2C/SPI regmap 写、msleep、mutex,或问"trigger 能不能慢速写 / ASoC 启停 codec"。
- range：版本无关(PCM trigger 的原子上下文长期不变)。
- scope/limits：约束 trigger 回调的上下文;回调结构按目标树 `include/sound/soc-dai.h` 核。
- check：
  ```
  [CLAIMS]
  api: devm_snd_soc_register_component
  symbol: snd_soc_dai_ops
  [/CLAIMS]
  ```
- linked_eval_case：KV-040
- provenance：self（从内核子系统知识库内容源蒸馏 + 真树核对 ASoC DAI ops 上下文;子系统:音频。关联 KB-IRQ-001 同根"原子不睡"）
- fires/catches：0 / 0

### KB-V4L2-001：vb2 stop_streaming 必须归还所有 buffer,否则队列卡死

- symptom：摄像头驱动 `VIDIOC_STREAMOFF` 卡住不返回 / 应用 hang;重新 streamon 失败;关流后 buffer 泄漏。
- root cause：流运行时驱动从 vb2 拿了 buffer 交给硬件 DMA(还没 `vb2_buffer_done`)。`stop_streaming` 回调里如果不把这些"仍在驱动手里"的 buffer 还给 vb2,vb2 会一直等它们,STREAMOFF 卡死。
- fix：`stop_streaming` 里先停硬件,再遍历驱动持有的 buffer 列表,对每个 `vb2_buffer_done(vb, VB2_BUF_STATE_ERROR)`(或 DONE)归还给 vb2,清空驱动的 in-flight 列表。
- trigger：见到 vb2 `stop_streaming` 回调没有把 in-flight buffer `vb2_buffer_done` 归还,或问"STREAMOFF 卡死 / vb2 buffer 没还"。
- range：版本无关(vb2 buffer 所有权契约长期不变)。
- scope/limits：约束 stop_streaming 的 buffer 归还;回调/状态名按目标树 `include/media/videobuf2-core.h` 核。
- check：
  ```
  [CLAIMS]
  api: vb2_queue_init, vb2_buffer_done
  [/CLAIMS]
  ```
- linked_eval_case：KV-042
- provenance：self（从内核子系统知识库内容源蒸馏 + 真树核对 vb2 buffer 所有权;子系统:摄像）
- fires/catches：0 / 0

### KB-CLK-001：时钟 prepare/enable 两阶段,别在原子上下文 prepare

- symptom：在中断/原子/持自旋锁上下文调 `clk_prepare_enable` 偶发睡眠告警("scheduling while atomic" / might_sleep);或只 `clk_enable` 没先 prepare,时钟不出/CCF 报警。
- root cause：CCF 把开时钟拆成两步——`clk_prepare` 可能要等 PLL 锁定、甚至走 I2C 访问 PMIC，**会睡**，只能在进程上下文调；`clk_enable` 只翻使能位，**不睡**，可在原子/中断上下文调。拆开就是为了让你先在进程上下文 prepare，之后在原子上下文按需 enable/disable。把两者混为一谈就会在错误上下文睡眠或漏 prepare。
- fix：可睡眠上下文图省事用 `clk_prepare_enable` / `clk_disable_unprepare` 配对；需要在原子/中断上下文开关时，提前在进程上下文 `clk_prepare`，临界区里只 `clk_enable`/`clk_disable`，退出后再 `clk_unprepare`。enable 计数必须和 disable 配平。
- trigger：见到原子/中断/持锁上下文里出现 `clk_prepare`/`clk_prepare_enable`，或问"clk prepare 和 enable 区别 / 能不能在中断里开时钟"。
- range：版本无关（CCF 两阶段语义长期不变）。
- scope/limits：约束 prepare/enable 的上下文；API 名按目标树 `include/linux/clk.h` 核。
- check：
  ```
  [CLAIMS]
  api: clk_prepare_enable, clk_enable
  [/CLAIMS]
  ```
- linked_eval_case：KV-045
- provenance：self（从内核子系统知识库内容源蒸馏 + 真树核对 clk.h 两阶段上下文;子系统:clk。关联 KB-IRQ-001 同根"原子不睡"）
- fires/catches：0 / 0

### KB-PINCTRL-001：default pinctrl 态由 driver core 自动应用,别在 probe 里手动选

- symptom：照搬别处代码在 probe 里 `pinctrl_select_state(p, default)`，引脚被选两次/时序错；或误以为不手动选 default 引脚就不工作而到处加冗余代码。
- root cause：driver core 在 probe **之前**已自动应用 `pinctrl-0`（"default"）态（设备模型在 really_probe 路径里做）。驱动再手动选一次 default 是冗余，个别控制器还会因重复切换出问题。显式 pinctrl 的真正用途是**运行时切非 default 态**（PM 的 sleep/idle）。
- fix：probe 里不要手动选 default；只在需要运行时切换时 `devm_pinctrl_get` + `pinctrl_lookup_state` + `pinctrl_select_state`，PM 场景直接用 `pinctrl_pm_select_sleep_state`/`_default_state` 封装。
- trigger：见到 probe 里手动选 default 态，或问"要不要手动选 pinctrl default / 引脚不生效"。
- range：版本无关。
- scope/limits：约束 default 态的处理；API 名按目标树 `include/linux/pinctrl/consumer.h` 核。
- check：
  ```
  [CLAIMS]
  api: pinctrl_select_state, pinctrl_lookup_state
  [/CLAIMS]
  ```
- linked_eval_case：KV-049
- provenance：self（从内核子系统知识库内容源蒸馏 + 真树核对 driver core 自动选 default;子系统:pinctrl）
- fires/catches：0 / 0

### KB-REG-001：regulator enable/disable 引用计数必须配平,别 force_disable 修不平衡

- symptom：`regulator_disable` 报"unbalanced disables"告警；或共享同一路 supply 的另一设备被意外断电；或可选供电没配也"成功"了，硬件其实没上电。
- root cause：一路 supply 可被多个消费者共享，`regulator_enable`/`regulator_disable` 维护一个使能引用计数。disable 多于 enable → 不平衡告警，且计数归零时会真断电，殃及还在用它的其他消费者。另外 `devm_regulator_get` 在 DT 没声明该 supply 时返回一个 **dummy**（恒成功、恒通），会把"配置漏了"掩盖成"正常工作"。
- fix：每个消费者各自 enable、各自 disable，严格配平；不要用 `regulator_force_disable` 去"修"不平衡（它强行清零计数，破坏共享语义）。真正可有可无的供电用 `devm_regulator_get_optional` 并 `IS_ERR` 判断，区分"没这路电"和"拿到 dummy"。
- trigger：见到 `regulator_force_disable`、enable/disable 不配对，或用 `devm_regulator_get` 拿可选供电，或问"regulator unbalanced / 共享 supply 被关 / 可选供电怎么拿"。
- range：版本无关。
- scope/limits：约束 enable/disable 配平和可选供电获取；API 名按目标树 `include/linux/regulator/consumer.h` 核。
- check：
  ```
  [CLAIMS]
  api: regulator_enable, regulator_disable
  [/CLAIMS]
  ```
- linked_eval_case：KV-052
- provenance：self（从内核子系统知识库内容源蒸馏 + 真树核对 regulator 引用计数与 dummy 语义;子系统:regulator）
- fires/catches：0 / 0

### KB-REGMAP-001：regmap_config 必设 reg_bits/val_bits;会变的寄存器要标 volatile

- symptom：`devm_regmap_init_*` 返回错误指针/init 失败；或读状态/数据寄存器总拿到旧值（regcache 缓存的）。
- root cause：`struct regmap_config` 的 `reg_bits` 和 `val_bits` 是必填项，不填 regmap 无法确定地址/值宽度，初始化失败。开了 regcache 后，被硬件自己改写的寄存器（状态、数据、FIFO、计数器）如果不在 `volatile_reg` 里标成 volatile，regmap 会从缓存返回写过的旧值，而不去读真硬件。
- fix：`regmap_config` 至少设 `reg_bits`/`val_bits`（按芯片手册）；用 `volatile_reg` 回调（或 volatile_table）标出所有硬件自改的寄存器；改某几个 bit 用 `regmap_update_bits`（regmap 内部加锁做 RMW），别手动 read→改→write。
- trigger：见到 `regmap_config` 没设 reg_bits/val_bits、状态寄存器没标 volatile，或问"regmap init 失败 / 读寄存器是旧值"。
- range：版本无关。
- scope/limits：约束 regmap_config 必填字段与 volatile 标注；字段/API 名按目标树 `include/linux/regmap.h` 核。
- check：
  ```
  [CLAIMS]
  symbol: regmap_config
  api: regmap_update_bits
  [/CLAIMS]
  ```
- linked_eval_case：KV-055
- provenance：self（从内核子系统知识库内容源蒸馏 + 真树核对 regmap_config 必填字段与 volatile;子系统:regmap）
- fires/catches：0 / 0

### KB-RESET-001：共用复位线必须按 shared 申请,别用 exclusive

- symptom：`devm_reset_control_get_exclusive` 返回 -EBUSY；或对一条共用复位线 `reset_control_assert` 后设备没复位/把别的还在用的外设也复位了。
- root cause：一条复位信号在硬件上可能接给多个外设。reset 框架区分 exclusive（独占，谁先拿谁占，别人再拿 exclusive 失败）和 shared（共享，deassert/assert 引用计数——deassert 把线放出复位，assert 只有在所有使用者都 assert 后才真把线拉进复位）。把共用线当独占申请，要么获取失败，要么 assert 语义不符预期。
- fix：按硬件接线选：复位线只此设备用 → `devm_reset_control_get_exclusive`（可选用 `_optional_exclusive`）；多设备共用 → `devm_reset_control_get_shared`，并理解 assert/deassert 是引用计数的。
- trigger：见到对共用复位线用 exclusive 接口、或期望 shared 复位 assert 立即生效，或问"reset EBUSY / 共享复位线怎么申请"。
- range：版本无关。
- scope/limits：约束 exclusive vs shared 选择；API 名按目标树 `include/linux/reset.h` 核。
- check：
  ```
  [CLAIMS]
  api: devm_reset_control_get_shared, reset_control_deassert
  [/CLAIMS]
  ```
- linked_eval_case：KV-057
- provenance：self（从内核子系统知识库内容源蒸馏 + 真树核对 reset.h exclusive/shared 语义;子系统:reset）
- fires/catches：0 / 0

### KB-PWM-001：pwm_apply_state 已改名,且别用 config+enable 老序列

- symptom：旧代码 `pwm_apply_state` 在新内核编译报未声明；或用 `pwm_config`+`pwm_enable` 分步设置时，周期/占空比切换出现毛刺。
- root cause：① 通用应用接口从 `pwm_apply_state` 改名为 `pwm_apply_might_sleep`（随版本变的接口），旧名在新内核不存在。② 老的 `pwm_config`/`pwm_enable`/`pwm_disable` 分多次调用，每次只改一部分，中间态会输出到硬件 → 毛刺；新模型用一个 `struct pwm_state` 一次性原子应用周期+占空比+使能。
- fix：用 `pwm_init_state` 取默认/DT 参数 → 改 `struct pwm_state` 的字段 → `pwm_apply_might_sleep`（进程上下文）一次性写入；需要原子上下文且控制器支持时用 `pwm_apply_atomic`。按目标树 `include/linux/pwm.h` 确认 apply 接口名。
- trigger：见到 `pwm_apply_state`、或 `pwm_config`+`pwm_enable` 老序列，或问"pwm_apply_state 编译错 / PWM 切换毛刺"。
- range：apply 接口改名以目标树为准（旧树 `pwm_apply_state`，新树 `pwm_apply_might_sleep`）。
- scope/limits：约束 apply 接口名与原子应用；字段名按目标树 `pwm.h` 核。
- check：
  ```
  [CLAIMS]
  api: pwm_apply_might_sleep, pwm_apply_atomic
  symbol: pwm_state
  [/CLAIMS]
  ```
- linked_eval_case：KV-060
- provenance：self（两棵树核对 pwm.h apply 接口:7.0 为 pwm_apply_might_sleep/pwm_apply_atomic,旧名 pwm_apply_state 已移除;子系统:pwm）
- fires/catches：0 / 0

### KB-IIO-001：IIO 私有数据用 iio_priv,register 放最后

- symptom：IIO 驱动私有数据另开 kmalloc 后生命周期/释放顺序乱；或注册太早，用户态读到还没配好的设备。
- root cause：`devm_iio_device_alloc(dev, sizeof(priv))` 把驱动私有数据**内联**分配在 `iio_dev` 之后，用 `iio_priv(indio_dev)` 取——这样私有数据和 iio_dev 同生命周期。另外 `iio_device_register`/`devm_iio_device_register` 一旦调用，sysfs/chardev 立刻对用户态可见，通道马上能被读，所以必须在 channels/info 都填好后作为最后一步。
- fix：`devm_iio_device_alloc(dev, sizeof(struct my_state))` + `iio_priv()` 取私有数据，不要单独 kmalloc；填好 `name`/`info`/`channels`/`num_channels` 后再 `devm_iio_device_register` 作为最后一步。
- trigger：见到 IIO 私有数据单独 kmalloc、或 register 在填通道之前，或问"iio_priv 怎么用 / IIO 注册顺序"。
- range：版本无关（`iio_device_alloc` 旧 API 仍在但推荐 devm 版）。
- scope/limits：约束私有数据分配方式与注册时机；API 名按目标树 `include/linux/iio/iio.h` 核。
- check：
  ```
  [CLAIMS]
  api: devm_iio_device_alloc, iio_priv
  [/CLAIMS]
  ```
- linked_eval_case：KV-063
- provenance：self（从内核子系统知识库内容源蒸馏 + 真树核对 iio.h alloc/priv/register;子系统:iio）
- fires/catches：0 / 0
