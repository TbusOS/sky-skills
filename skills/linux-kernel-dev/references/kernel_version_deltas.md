# Kernel Version Deltas

> 跨内核版本的 API/行为差异。**版本敏感知识集中在这里**（SKILL §6.9）。
> 每条带版本区间，且必须**按目标树用 事实检查 核实**——不靠记忆。
> 候选条目由 `version_drift.mjs`（P4 建）对多版本树跑出来后，经回归测试入库。

## 条目格式

```
### <简述>
- range: <如 6.4+ / 6.1..6.7 / -6.3>
- 现象: <什么变了>
- 处理: <按版本怎么写>
- last_validated_against: <版本>  （信任衰减用）
- linked_eval_case: <KV-xxx>
```

## 稳定核 vs 版本易变面（提醒）

- **稳定核**（不打版本标、永远成立）：编码风格、goto 清理、`-errno`、devm_ 优先、锁上下文规则、并发语义、patch 流程。
- **版本易变面**（本文件管）：API 签名/参数个数、头文件、CONFIG 名、宏、子系统重构。

## 每条的版本号是怎么定出来的（可复现）

下面每个版本号都不是记忆，是在一棵**主线 git 树**上逐 tag 二分测出来的：

```bash
# 1. 在最新树上找到该符号的声明头文件
grep -rl '\bdevm_platform_ioremap_resource\b' include/linux

# 2. 在主版本 tag 上二分它的首次出现（必须限定到那个确切文件）
git grep -q '\bdevm_platform_ioremap_resource\b' v5.1 -- include/linux/platform_device.h && echo 有
```

`git grep <sym> <tag> -- <确切文件路径>` 约 1.5s；换成目录 pathspec（`-- include/linux/`）
会退化成全树遍历，慢两个数量级；对全历史跑 pickaxe（`git log -S`）更是分钟级起步。
二分 62 个主版本 tag 只要 6 次查询。

**引入版本 ≠ 旧 API 消失版本**——两者之间往往有一段并存窗口，那段时间里"该用哪个"
是风格问题而不是编译问题。下面凡查到并存窗口的都写出来了，因为它直接决定
"这次非改不可，还是可以先不动"。

## 正式条目

### i2c 动态建 client：`i2c_new_device` → `i2c_new_client_device`

- range: 新 API >= 5.3；旧 API 到 5.7 仍在、**5.8 删除**；并存窗口 5.3–5.7
- 现象: 照当前内核文档写的 `i2c_new_client_device()` / `i2c_new_dummy_device()`
  在老树上报 `implicit declaration`。反向也成立：旧 API 在 >=5.8 的树上已经没有。
- 处理: <=5.2 只能用 `i2c_new_device()` / `i2c_new_dummy()`（失败返回 `NULL`）；
  >=5.3 用新的（失败返回 `ERR_PTR`，判法是 `IS_ERR()` 而不是 `!ptr`）。
  并存窗口内两者都能编，不构成改动理由。
- last_validated_against: 主线 v5.2 无 / v5.3 有；`i2c_new_device` v5.7 有 / v5.8 无。
  4.19 BSP 树上新 API `include/` 0 命中
- linked_eval_case: KV-419-I2C-NEWDEV

### `pm_runtime_resume_and_get`

- range: >= 5.10
- 现象: 老树上没有这个函数。它存在的唯一理由，就是修
  `pm_runtime_get_sync()` **失败时引用已经加上了**这个坑。
- 处理: >=5.10 直接用它（失败自动回退引用）；<=5.9 用 `pm_runtime_get_sync()`，
  失败路径必须先 `pm_runtime_put_noidle()` 再返回，否则 `usage_count` 永远回不到 0、
  设备再也不进 suspend——症状严重滞后，很难关联到某次失败的 resume。
- last_validated_against: 主线 v5.9 无 / v5.10 有；4.19 BSP 树 0 命中
- linked_eval_case: KV-419-PM-GETSYNC

### `devm_platform_ioremap_resource`

- range: >= 5.1
- 现象: 老树上要写成 `platform_get_resource()` + `devm_ioremap_resource()` 两步。
- 处理: >=5.1 用一步的；<=5.0 用两步式，且 `platform_get_resource()` 返回 NULL 也要判。
- last_validated_against: 主线 v5.0 无 / v5.1 有；4.19 BSP 树 0 命中
- linked_eval_case: KV-419-IOREMAP

### `regmap_set_bits` / `regmap_clear_bits`

- range: >= 5.8
- 现象: 老树上没有这对便捷函数。**常被误记为 5.4**。
- 处理: <=5.7 用 `regmap_update_bits(map, reg, mask, mask)` 置位、
  `regmap_update_bits(map, reg, mask, 0)` 清位——语义完全等价，只是啰嗦。
- last_validated_against: 主线 v5.7 无 / v5.8 有；4.19 BSP 树 0 命中
- linked_eval_case: KV-419-REGMAP-BITS

### `tasklet_setup` 与回调签名

- range: >= 5.9
- 现象: `tasklet_setup()` 把回调参数从 `unsigned long data` 改成
  `struct tasklet_struct *t`，配合 `from_tasklet()` 取宿主结构。老树只有 `tasklet_init()`。
- 处理: <=5.8 用 `tasklet_init()`，回调收 `unsigned long`，自己 cast 回结构指针。
- last_validated_against: 主线 v5.8 无 / v5.9 有；4.19 BSP 树 0 命中
- linked_eval_case: KV-419-TASKLET

### `struct proc_ops`（procfs 不再复用 `file_operations`）

- range: >= 5.6
- 现象: 5.6 把 `proc_create()` 的第四参从 `struct file_operations *`
  换成 `struct proc_ops *`。老树上写 `proc_ops` 直接编不过。
- 处理: <=5.5 用 `struct file_operations`（`.owner` / `.open` / `.read` / `.llseek`）；
  >=5.6 用 `struct proc_ops`（`.proc_open` / `.proc_read` / `.proc_lseek`，无 `.owner`）。
- last_validated_against: 主线 v5.5 无 / v5.6 有；4.19 BSP 树的 `include/` 里**无**该结构定义，但全树 `grep` 会命中——若干厂商驱动的 `.c` 里写了 `struct proc_ops`（未被编入），另有一处是名为 `proc_ops` 的 `struct file_operations` 变量。判这条要看头文件，不能靠全树词频
- linked_eval_case: 无 —— **事实检查判不了**。它按符号是否在树里出现来判,而本条的判据是「`struct proc_ops` 有没有定义」。实测这棵 4.19 树:`include/` 里没有该结构定义,但若干厂商驱动的 `.c` 里写了 `struct proc_ops`(未被编入),于是全树扫描认定「存在」,corruption 抓不住。要判这条得看头文件里的定义,不是全树词频。

### `class_create()` 去掉 `owner` 参数

- range: 单参 >= 6.4；双参宏 <= 6.3
- 现象: <=6.3 是宏 `class_create(owner, name)`；6.4 起是函数
  `struct class *class_create(const char *name)`。参数个数变了，老写法在新树上报参数过多。
- 处理: 按目标树版本写。要同时支持两代就用 `LINUX_VERSION_CODE` 分支。
- last_validated_against: 主线 v6.3 为 `#define class_create(owner, name)` /
  v6.4 为 `struct class * __must_check class_create(const char *name)`
- linked_eval_case: 无 —— **事实检查判不了**。`class_create` 两代都在,变的是参数个数;符号存在性看不出 arity。要判这条得比对原型或实际编译。

### `platform_driver` 的 `.remove` / `.remove_new` 两次改形

- range: `.remove_new` 6.3 引入、6.13 起消失；`.remove` 由 `int` 改 `void` 在 6.11
- 现象: 这是**两步迁移**，中间那步是过渡脚手架，容易被当成终态照抄。
  6.3–6.12 存在 `.remove_new`（返回 `void`）；6.11 把 `.remove` 自己也改成返回 `void`；
  6.13 起 `.remove_new` 被删除，只剩改好签名的 `.remove`。
- 处理: <=6.10 用 `int (*remove)`（返回值内核基本忽略，返非 0 也拦不住卸载）；
  >=6.11 用 `void (*remove)`；只有在 6.3–6.12 之间做过渡才会碰到 `.remove_new`，
  新代码不要写它。
- last_validated_against: 主线逐 tag——`remove_new` v6.2 无 / v6.3 有 / v6.13 无；
  `.remove` v6.10 为 `int` / v6.11 为 `void`
- linked_eval_case: KV-419-PLATFORM-REMOVE

### `devm_thermal_of_zone_register`

- range: >= 6.1
- 现象: 老树上是 `thermal_zone_of_sensor_register()` 一族。**常被误记为 6.0**。
- 处理: 按树版本选；两代的注销方式也不同（devm 版不用手工注销）。
- last_validated_against: 主线 v6.0 无 / v6.1 有
- linked_eval_case: KV-419-THERMAL-ZONE

### `pwm_apply_might_sleep`

- range: >= 6.8
- 现象: 把 `pwm_apply_state()` 改名成 `pwm_apply_might_sleep()`，
  在名字里挑明它可能睡眠。**常被误记为 6.7**。
- 处理: <=6.7 用 `pwm_apply_state()`；>=6.8 用新名。两者都不能在原子上下文调。
- last_validated_against: 主线 v6.7 无 / v6.8 有
- linked_eval_case: KV-419-PWM-APPLY

### Android ION 从主线移除

- range: `drivers/staging/android/ion` 到 5.10 仍在，**5.11 移除**
- 现象: 上游没有 ION 了，`ion_alloc()` 无从谈起；对应能力由 dma-buf heaps 承接。
- 处理: 新代码走 dma-buf heaps（用户态 `/dev/dma_heap/*` 的 `DMA_HEAP_IOCTL_ALLOC`）。
  注意 `dma_heap_buffer_alloc()` 在 7.0 的 `include/` 里查不到——它不是导出给驱动的
  通用 API，实现在 `drivers/dma-buf/dma-heap.c`。厂商 BSP 常年自带 ION，
  是**下游保留**，不代表上游还有。
- last_validated_against: 主线 v5.10 有该目录 / v5.11 无
- linked_eval_case: KV-419-ION-DMAHEAP

### folio API 是分批落地的

- range: `folio_put` >= 5.16；`folio_get` >= 5.17
- 现象: 页缓存/内存管理侧从 `struct page` 迁到 `struct folio` 是**逐批**进行的，
  不存在"某一版一次性切换"。
- 处理: 驱动侧绝大多数场景不需要动；确实要用时**按目标树逐符号查**，
  别假设整套 API 同时可用——`folio_put` 比 `folio_get` 早一个版本就是现成的反例。
- last_validated_against: 主线 v5.15 无 `folio_put` / v5.16 有；v5.16 无 `folio_get` / v5.17 有
- linked_eval_case: KV-419-FOLIO

## 查过但**不属于**版本差异的（免得重复调查）

- **16KB page 相关 CONFIG**：`ARM64_16K_PAGES` 在 v4.19 和 v6.1 的
  `arch/arm64/Kconfig` 里都在，不是新引入的 CONFIG。真正的坑在别处
  （用户态 ELF 对齐、厂商是否开这个选项），不是内核版本差异，不该放本文件。
