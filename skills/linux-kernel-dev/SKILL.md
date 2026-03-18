---
name: linux-kernel-dev
description: "Linux kernel and driver development assistant. TRIGGER when: user works on kernel modules, device drivers, kernel subsystems, Kconfig, Makefile, device tree (.dts/.dtsi), or C code using kernel APIs (kmalloc, printk, module_init, platform_driver, etc.). DO NOT TRIGGER when: userspace C/C++ programs, general systems programming without kernel involvement."
---

# Linux Kernel & Driver Development

This skill helps you write, review, debug, and maintain Linux kernel code including kernel modules, device drivers, subsystem patches, and build configurations.

## Core Principles

1. **Follow kernel coding style strictly** — Linux kernel has its own coding standard (Documentation/process/coding-style.rst), NOT GNU or Google style
2. **Security first** — Kernel code runs in ring 0, bugs can crash the system or create CVEs
3. **No userspace habits** — No malloc/free, no printf, no floating point, no libc
4. **Upstream mindset** — Write code as if submitting to LKML

---

## Coding Style Rules

### Formatting
- **Indentation**: Tabs (8 characters wide), NOT spaces
- **Line length**: 80 columns preferred, 100 max
- **Braces**: K&R style — opening brace on same line (except functions)
- **No typedef for structs** unless opaque type — use `struct foo` directly
- **Function length**: Keep under 50 lines; if longer, refactor

### Naming
- **Lowercase with underscores**: `my_function_name`, `struct my_device`
- **Global symbols**: Prefix with subsystem name: `pci_register_driver()`, `usb_submit_urb()`
- **Local variables**: Short names OK: `i`, `ret`, `dev`, `np`
- **Macros/constants**: UPPER_CASE: `MODULE_LICENSE`, `PAGE_SIZE`
- **No Hungarian notation**, no camelCase

### Comments
- Use `/* C89 style */` comments, NOT `//` C99 comments
- Kernel-doc format for exported functions:

```c
/**
 * my_func - Brief description
 * @param1: Description of param1
 * @param2: Description of param2
 *
 * Longer description if needed.
 *
 * Return: 0 on success, negative errno on failure.
 */
```

### Error Handling
- Return negative errno values: `-ENOMEM`, `-EINVAL`, `-EIO`
- Use `goto` cleanup pattern for resource deallocation:

```c
int my_init(struct device *dev)
{
	struct resource *res;
	void __iomem *base;
	int ret;

	res = platform_get_resource(dev, IORESOURCE_MEM, 0);
	if (!res)
		return -ENODEV;

	base = devm_ioremap_resource(dev, res);
	if (IS_ERR(base))
		return PTR_ERR(base);

	ret = clk_prepare_enable(clk);
	if (ret)
		goto err_unmap;

	ret = request_irq(irq, my_handler, 0, "my-dev", dev);
	if (ret)
		goto err_clk;

	return 0;

err_clk:
	clk_disable_unprepare(clk);
err_unmap:
	iounmap(base);
	return ret;
}
```

### Memory Management
- **Prefer devm_ managed APIs**: `devm_kzalloc()`, `devm_ioremap_resource()`, `devm_clk_get()`, `devm_request_irq()`
- **GFP flags**: `GFP_KERNEL` (can sleep), `GFP_ATOMIC` (interrupt/spinlock context)
- Always check allocation return values
- Never use `kmalloc` in interrupt context with `GFP_KERNEL`

---

## Kernel Module Template

When creating a new kernel module, use this template:

```c
// SPDX-License-Identifier: GPL-2.0-only
/*
 * Description of the module
 *
 * Copyright (C) YEAR Author Name
 */

#define pr_fmt(fmt) KBUILD_MODNAME ": " fmt

#include <linux/module.h>
#include <linux/init.h>

static int __init my_module_init(void)
{
	pr_info("module loaded\n");
	return 0;
}

static void __exit my_module_exit(void)
{
	pr_info("module unloaded\n");
}

module_init(my_module_init);
module_exit(my_module_exit);

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Author Name");
MODULE_DESCRIPTION("Brief description");
```

---

## Platform Driver Template

```c
// SPDX-License-Identifier: GPL-2.0-only

#include <linux/module.h>
#include <linux/platform_device.h>
#include <linux/of.h>
#include <linux/io.h>

struct my_dev {
	void __iomem *base;
	struct device *dev;
};

static int my_probe(struct platform_device *pdev)
{
	struct my_dev *priv;
	struct resource *res;

	priv = devm_kzalloc(&pdev->dev, sizeof(*priv), GFP_KERNEL);
	if (!priv)
		return -ENOMEM;

	priv->dev = &pdev->dev;

	priv->base = devm_platform_ioremap_resource(pdev, 0);
	if (IS_ERR(priv->base))
		return PTR_ERR(priv->base);

	platform_set_drvdata(pdev, priv);

	dev_info(&pdev->dev, "probed successfully\n");
	return 0;
}

static void my_remove(struct platform_device *pdev)
{
	struct my_dev *priv = platform_get_drvdata(pdev);

	dev_info(priv->dev, "removed\n");
}

static const struct of_device_id my_of_match[] = {
	{ .compatible = "vendor,my-device" },
	{ /* sentinel */ }
};
MODULE_DEVICE_TABLE(of, my_of_match);

static struct platform_driver my_driver = {
	.probe = my_probe,
	.remove = my_remove,
	.driver = {
		.name = "my-device",
		.of_match_table = my_of_match,
	},
};
module_platform_driver(my_driver);

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Author Name");
MODULE_DESCRIPTION("My platform device driver");
```

---

## Character Device Template

```c
// SPDX-License-Identifier: GPL-2.0-only

#include <linux/module.h>
#include <linux/fs.h>
#include <linux/cdev.h>
#include <linux/device.h>
#include <linux/uaccess.h>

#define DEVICE_NAME "mychardev"

struct mychar_dev {
	struct cdev cdev;
	struct class *class;
	struct device *device;
	dev_t devno;
	char buf[4096];
	size_t len;
	struct mutex lock;
};

static struct mychar_dev *mydev;

static int mychar_open(struct inode *inode, struct file *filp)
{
	filp->private_data = mydev;
	return 0;
}

static ssize_t mychar_read(struct file *filp, char __user *ubuf,
			    size_t count, loff_t *ppos)
{
	struct mychar_dev *dev = filp->private_data;
	ssize_t ret;

	mutex_lock(&dev->lock);
	ret = simple_read_from_buffer(ubuf, count, ppos, dev->buf, dev->len);
	mutex_unlock(&dev->lock);

	return ret;
}

static ssize_t mychar_write(struct file *filp, const char __user *ubuf,
			     size_t count, loff_t *ppos)
{
	struct mychar_dev *dev = filp->private_data;

	if (count > sizeof(dev->buf))
		return -ENOSPC;

	mutex_lock(&dev->lock);
	if (copy_from_user(dev->buf, ubuf, count)) {
		mutex_unlock(&dev->lock);
		return -EFAULT;
	}
	dev->len = count;
	mutex_unlock(&dev->lock);

	return count;
}

static const struct file_operations mychar_fops = {
	.owner = THIS_MODULE,
	.open = mychar_open,
	.read = mychar_read,
	.write = mychar_write,
};

static int __init mychar_init(void)
{
	int ret;

	mydev = kzalloc(sizeof(*mydev), GFP_KERNEL);
	if (!mydev)
		return -ENOMEM;

	mutex_init(&mydev->lock);

	ret = alloc_chrdev_region(&mydev->devno, 0, 1, DEVICE_NAME);
	if (ret)
		goto err_free;

	cdev_init(&mydev->cdev, &mychar_fops);
	ret = cdev_add(&mydev->cdev, mydev->devno, 1);
	if (ret)
		goto err_region;

	mydev->class = class_create(DEVICE_NAME);
	if (IS_ERR(mydev->class)) {
		ret = PTR_ERR(mydev->class);
		goto err_cdev;
	}

	mydev->device = device_create(mydev->class, NULL, mydev->devno,
				      NULL, DEVICE_NAME);
	if (IS_ERR(mydev->device)) {
		ret = PTR_ERR(mydev->device);
		goto err_class;
	}

	pr_info(DEVICE_NAME ": registered (major %d)\n", MAJOR(mydev->devno));
	return 0;

err_class:
	class_destroy(mydev->class);
err_cdev:
	cdev_del(&mydev->cdev);
err_region:
	unregister_chrdev_region(mydev->devno, 1);
err_free:
	kfree(mydev);
	return ret;
}

static void __exit mychar_exit(void)
{
	device_destroy(mydev->class, mydev->devno);
	class_destroy(mydev->class);
	cdev_del(&mydev->cdev);
	unregister_chrdev_region(mydev->devno, 1);
	kfree(mydev);
}

module_init(mychar_init);
module_exit(mychar_exit);

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Author Name");
MODULE_DESCRIPTION("Character device driver template");
```

---

## Makefile Templates

### Out-of-tree Module Makefile

```makefile
# SPDX-License-Identifier: GPL-2.0-only
obj-m += my_module.o

# For multi-file modules:
# my_module-y := main.o util.o hw.o

KDIR ?= /lib/modules/$(shell uname -r)/build

all:
	$(MAKE) -C $(KDIR) M=$(PWD) modules

clean:
	$(MAKE) -C $(KDIR) M=$(PWD) clean

install:
	$(MAKE) -C $(KDIR) M=$(PWD) modules_install

.PHONY: all clean install
```

### In-tree Kbuild (obj-y / obj-m)

```makefile
# drivers/my_subsystem/Makefile
# SPDX-License-Identifier: GPL-2.0-only

obj-$(CONFIG_MY_DRIVER) += my_driver.o
my_driver-y := core.o hw.o debugfs.o

obj-$(CONFIG_MY_DRIVER_TEST) += my_driver_test.o
```

---

## Kconfig Template

```kconfig
# SPDX-License-Identifier: GPL-2.0-only

config MY_DRIVER
	tristate "My Device Driver"
	depends on OF && HAS_IOMEM
	select REGMAP_MMIO
	help
	  Say Y or M here to enable support for My Device.

	  This driver supports the Vendor My Device hardware
	  found on Some Platform boards.

	  To compile this driver as a module, choose M here:
	  the module will be called my_driver.

config MY_DRIVER_DEBUG
	bool "My Device Driver debug support"
	depends on MY_DRIVER
	help
	  Enable debug features for My Device Driver.
	  This adds debugfs entries and verbose logging.
```

---

## Device Tree

### Binding Example (YAML schema, Documentation/devicetree/bindings/)

```yaml
# SPDX-License-Identifier: (GPL-2.0-only OR BSD-2-Clause)
%YAML 1.2
---
$id: http://devicetree.org/schemas/misc/vendor,my-device.yaml#
$schema: http://devicetree.org/meta-schemas/core.yaml#

title: Vendor My Device Controller

maintainers:
  - Author Name <author@email.com>

properties:
  compatible:
    const: vendor,my-device

  reg:
    maxItems: 1

  interrupts:
    maxItems: 1

  clocks:
    maxItems: 1

  clock-names:
    const: apb

required:
  - compatible
  - reg
  - interrupts
  - clocks
  - clock-names

additionalProperties: false

examples:
  - |
    my-device@10000000 {
        compatible = "vendor,my-device";
        reg = <0x10000000 0x1000>;
        interrupts = <0 42 4>;
        clocks = <&clk_apb>;
        clock-names = "apb";
    };
```

### DTS Node Example

```dts
my_device: my-device@10000000 {
	compatible = "vendor,my-device";
	reg = <0x10000000 0x1000>;
	interrupts = <GIC_SPI 42 IRQ_TYPE_LEVEL_HIGH>;
	clocks = <&cru CLK_MY_DEV>;
	clock-names = "apb";
	pinctrl-names = "default";
	pinctrl-0 = <&my_device_pins>;
	status = "disabled";
};
```

---

## Debugging Reference

### printk / dev_* Logging

```c
/* Prefer dev_* over pr_* when struct device is available */
dev_err(dev, "failed to init: %d\n", ret);
dev_warn(dev, "unexpected state: 0x%08x\n", val);
dev_info(dev, "device ready, version %d.%d\n", major, minor);
dev_dbg(dev, "register dump: 0x%x = 0x%08x\n", offset, val);

/* When no struct device (early boot, core code): */
pr_err("critical failure\n");
pr_info("subsystem initialized\n");

/* Dynamic debug (enabled at runtime): */
/* echo 'file my_driver.c +p' > /sys/kernel/debug/dynamic_debug/control */
```

### Common Debug Tools

| Tool | Usage | Purpose |
|------|-------|---------|
| `dmesg` | `dmesg -wH` | Kernel log (follow mode) |
| `ftrace` | `/sys/kernel/debug/tracing/` | Function tracing |
| `kprobe` | `echo 'p:my my_func' > kprobe_events` | Dynamic probe |
| `perf` | `perf top -g` | Performance profiling |
| `crash` / `kdump` | Analyze vmcore | Post-mortem crash analysis |
| `gdb` + QEMU | `gdb vmlinux` | Kernel source-level debug |
| `/proc` & `/sys` | `cat /proc/interrupts` | Runtime inspection |
| `strace` | `strace -e ioctl ./app` | Trace syscalls from userspace |
| `devmem` | `devmem 0x10000000` | Raw memory/register read |

### Ftrace Quick Start

```bash
# Trace a specific function
echo function > /sys/kernel/debug/tracing/current_tracer
echo my_driver_probe > /sys/kernel/debug/tracing/set_ftrace_filter
echo 1 > /sys/kernel/debug/tracing/tracing_on
cat /sys/kernel/debug/tracing/trace

# Function graph (call tree)
echo function_graph > /sys/kernel/debug/tracing/current_tracer
echo my_driver_* > /sys/kernel/debug/tracing/set_graph_function
```

---

## Concurrency & Synchronization

| Mechanism | Use Case | Can Sleep? |
|-----------|----------|------------|
| `mutex` | Long critical sections, process context | Yes |
| `spinlock` | Short critical sections, any context | No |
| `spin_lock_irqsave` | Shared with interrupt handler | No |
| `rcu` | Read-heavy, rare updates | Read: No lock |
| `atomic_t` | Simple counters | N/A |
| `completion` | Wait for event from another context | Yes (waiter) |
| `wait_queue` | Sleep until condition true | Yes |
| `seqlock` | Writer-priority, rare writes | Reader: No |

### Rules
- Never sleep while holding a spinlock
- Use `mutex` in process context, `spinlock` in interrupt context
- Prefer `devm_` APIs to avoid manual cleanup ordering issues
- Use `lockdep` (CONFIG_PROVE_LOCKING) to detect deadlocks

---

## checkpatch.pl

Before submitting any kernel patch, always run:

```bash
# Check a patch file
./scripts/checkpatch.pl my-change.patch

# Check a source file directly
./scripts/checkpatch.pl --file drivers/my_subsystem/my_driver.c

# Common flags
./scripts/checkpatch.pl --strict --codespell my-change.patch
```

Fix all errors and warnings before submission. Common issues:
- Trailing whitespace
- Spaces instead of tabs
- Lines over 80/100 columns
- Missing SPDX license identifier
- Incorrect comment style (`//` instead of `/* */`)

---

## Git / Patch Workflow (for upstream submission)

### Commit Message Format

```
subsystem: brief description in imperative mood

Longer explanation of the change:
- What problem does this solve
- Why this approach was chosen
- Any notable side effects

Signed-off-by: Your Name <your@email.com>
```

### Generate Patches

```bash
# Single commit
git format-patch -1 HEAD

# Series from branch point
git format-patch origin/master..HEAD --cover-letter

# Check before sending
./scripts/checkpatch.pl *.patch
./scripts/get_maintainer.pl *.patch
```

---

## Common Kernel API Quick Reference

### Memory
| API | Description |
|-----|-------------|
| `kmalloc(size, flags)` | Allocate contiguous memory |
| `kzalloc(size, flags)` | Allocate zeroed memory |
| `kfree(ptr)` | Free memory |
| `devm_kzalloc(dev, size, flags)` | Device-managed alloc (auto-free) |
| `vmalloc(size)` | Allocate virtually contiguous |
| `dma_alloc_coherent()` | DMA-able memory |

### I/O
| API | Description |
|-----|-------------|
| `ioremap(phys, size)` | Map physical to virtual |
| `readl(addr)` / `writel(val, addr)` | MMIO read/write (32-bit) |
| `readb/readw/readq` | 8/16/64-bit variants |
| `devm_ioremap_resource(dev, res)` | Managed ioremap with range check |
| `regmap_read/write()` | Regmap abstraction |

### Interrupts
| API | Description |
|-----|-------------|
| `request_irq(irq, handler, flags, name, dev)` | Register IRQ handler |
| `devm_request_irq()` | Managed IRQ registration |
| `free_irq(irq, dev)` | Unregister IRQ handler |
| `disable_irq()` / `enable_irq()` | Mask/unmask IRQ |
| `irq_set_affinity()` | Set CPU affinity |

### Timing
| API | Description |
|-----|-------------|
| `msleep(ms)` | Sleep (process context, can't be interrupted) |
| `usleep_range(min, max)` | Precise short sleep |
| `udelay(us)` | Busy-wait (interrupt safe) |
| `schedule_timeout()` | Sleep with wakeup |
| `jiffies` | Kernel tick counter |
| `ktime_get()` | High-resolution timestamp |

### Workqueue & Tasklet
| API | Description |
|-----|-------------|
| `INIT_WORK(&work, func)` | Initialize work item |
| `schedule_work(&work)` | Queue on system workqueue |
| `create_singlethread_workqueue()` | Private workqueue |
| `DECLARE_TASKLET(name, func)` | Declare tasklet (soft IRQ) |
| `tasklet_schedule(&tasklet)` | Schedule tasklet |
