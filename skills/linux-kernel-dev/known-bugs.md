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
