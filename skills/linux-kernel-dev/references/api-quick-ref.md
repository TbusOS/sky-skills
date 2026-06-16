# Kernel API Quick Reference

> 权威源：`Documentation/core-api/`、`Documentation/driver-api/`。
> 速查表会随版本漂；具体签名按目标树核（fact-gate）。版本敏感项见 `kernel_version_deltas.md`。

## Memory

| API | 说明 |
|---|---|
| `kmalloc(size, flags)` | 连续内存 |
| `kzalloc(size, flags)` | 清零内存 |
| `kfree(ptr)` | 释放 |
| `devm_kzalloc(dev, size, flags)` | 设备托管分配（自动释放） |
| `vmalloc(size)` | 虚拟连续 |
| `dma_alloc_coherent()` | DMA 内存 |

## I/O

| API | 说明 |
|---|---|
| `ioremap(phys, size)` | 物理→虚拟映射 |
| `readl/writel` | MMIO 读写（32-bit） |
| `readb/readw/readq` | 8/16/64-bit |
| `devm_ioremap_resource(dev, res)` | 托管 ioremap + 范围检查 |
| `regmap_read/write()` | regmap 抽象 |

## Interrupts

| API | 说明 |
|---|---|
| `request_irq(irq, handler, flags, name, dev)` | 注册 IRQ |
| `devm_request_irq()` | 托管注册 |
| `free_irq(irq, dev)` | 注销 |
| `disable_irq()/enable_irq()` | 屏蔽/解屏 |
| `irq_set_affinity()` | CPU 亲和 |

## Timing

| API | 说明 |
|---|---|
| `msleep(ms)` | 睡眠（进程上下文） |
| `usleep_range(min, max)` | 精确短睡 |
| `udelay(us)` | 忙等（中断安全） |
| `schedule_timeout()` | 带唤醒睡眠 |
| `jiffies` | tick 计数 |
| `ktime_get()` | 高精时间戳 |
