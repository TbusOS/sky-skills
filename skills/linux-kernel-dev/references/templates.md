# Kernel Templates

> 权威源：`Documentation/kbuild/`（Makefile/Kconfig）、`Documentation/devicetree/bindings/writing-{bindings,schema}.rst`（DT）。
> 模板是起点；具体 API 签名按目标内核版本核（见 `kernel_version_deltas.md` + fact-gate）。

## Kernel Module

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

## Platform Driver

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

> 版本敏感：`platform_driver.remove` 的签名在不同版本有 `remove` / `remove_new` 变迁；按目标树核（`kernel_version_deltas.md`）。

## Character Device

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
/* init/exit: alloc_chrdev_region → cdev_add → class_create → device_create,
 * 逆序清理。class_create() 参数个数版本敏感（见 kernel_version_deltas.md）。 */
```

> 版本敏感：`class_create()` 的参数在 6.4 前后有变化；按目标树核。

## Makefile

### Out-of-tree module

```makefile
# SPDX-License-Identifier: GPL-2.0-only
obj-m += my_module.o
# 多文件： my_module-y := main.o util.o hw.o

KDIR ?= /lib/modules/$(shell uname -r)/build

all:
	$(MAKE) -C $(KDIR) M=$(PWD) modules
clean:
	$(MAKE) -C $(KDIR) M=$(PWD) clean
install:
	$(MAKE) -C $(KDIR) M=$(PWD) modules_install
.PHONY: all clean install
```

### In-tree Kbuild

```makefile
# SPDX-License-Identifier: GPL-2.0-only
obj-$(CONFIG_MY_DRIVER) += my_driver.o
my_driver-y := core.o hw.o debugfs.o
obj-$(CONFIG_MY_DRIVER_TEST) += my_driver_test.o
```

## Kconfig

```kconfig
# SPDX-License-Identifier: GPL-2.0-only
config MY_DRIVER
	tristate "My Device Driver"
	depends on OF && HAS_IOMEM
	select REGMAP_MMIO
	help
	  Say Y or M here to enable support for My Device.

	  To compile as a module choose M: the module will be called my_driver.
```

> 改配置走框架原生流程，**不手改 defconfig**（见 `bsp_discipline.md`）。

## Device Tree

### Binding (YAML schema, `Documentation/devicetree/bindings/`)

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

### DTS node

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
