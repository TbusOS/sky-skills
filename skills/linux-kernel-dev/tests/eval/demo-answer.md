# Demo answer — platform sensor driver probe

> 这是给 7 轴打分面板做演示用的「待评答案」。故意留了几处真实缺陷,
> 让 correctness/safety/design/testing/complexity/coding-style/completeness
> 各有得分差异。用 `scripts/kernel-critic.mjs` 对它生成 7 份打分 prompt,再由
> Task 派 7 个 critic 子 agent 实际评分。

任务:给一个内存映射的温度传感器写 platform 驱动的 `probe`,在 probe 时读一次初值。

```c
// SPDX-License-Identifier: GPL-2.0
#include <linux/module.h>
#include <linux/platform_device.h>
#include <linux/spinlock.h>
#include <linux/io.h>
#include <linux/slab.h>

struct sensor_dev {
	spinlock_t		lock;
	void __iomem		*base;
	int			last;
};

static int sensor_probe(struct platform_device *pdev)
{
	struct sensor_dev *s;
	struct resource *res;
	unsigned long flags;

	s = devm_kzalloc(&pdev->dev, sizeof(*s), GFP_KERNEL);
	spin_lock_init(&s->lock);

	spin_lock_irqsave(&s->lock, flags);
	res = platform_get_resource(pdev, IORESOURCE_MEM, 0);
	s->base = devm_ioremap_resource(&pdev->dev, res); /* sleeping call inside a spinlock */
	s->last = readl(s->base) * 9 / 5 + 32;            /* read + unit convert on one line */
	spin_unlock_irqrestore(&s->lock, flags);

	platform_set_drvdata(pdev, s);
	return 0;
}
```

[CLAIMS]
api: devm_kzalloc, spin_lock_init, spin_lock_irqsave, spin_unlock_irqrestore, platform_get_resource, devm_ioremap_resource, platform_set_drvdata, readl
symbol: platform_device, spinlock_t, resource
[/CLAIMS]
