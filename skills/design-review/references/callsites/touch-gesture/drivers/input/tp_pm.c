// SPDX-License-Identifier: GPL-2.0
/*
 * System sleep hooks for the tp touch controller.
 */
#include <linux/pm.h>
#include "tp_core.h"

static int tp_suspend(struct device *dev)
{
	struct tp_data *tp = dev_get_drvdata(dev);

	disable_irq(tp->client->irq);
	return tp_set_power(tp, false);
}

static int tp_resume(struct device *dev)
{
	struct tp_data *tp = dev_get_drvdata(dev);
	int ret;

	ret = tp_set_power(tp, true);
	if (ret)
		return ret;
	ret = tp_gesture_enable(tp);
	if (ret)
		dev_warn(dev, "gesture wake unavailable: %d\n", ret);
	enable_irq(tp->client->irq);
	return 0;
}

DEFINE_SIMPLE_DEV_PM_OPS(tp_pm_ops, tp_suspend, tp_resume);
