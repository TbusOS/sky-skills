// SPDX-License-Identifier: GPL-2.0
/*
 * Firmware version and gesture-mode helpers for the tp touch controller.
 */
#include <linux/i2c.h>
#include "tp_core.h"

#define TP_REG_FW_VERSION	0xa6
#define TP_REG_GESTURE		0xd0
#define TP_GESTURE_DOUBLE_TAP	0x01

/* Written once at probe, read on every resume. */
static u8 tp_fw_major;

static int tp_fw_version_read(struct tp_data *tp)
{
	u8 buf[2];
	int ret;

	ret = tp_read_regs(tp, TP_REG_FW_VERSION, buf, sizeof(buf));
	if (ret)
		return ret;
	tp_fw_major = buf[0];
	return 0;
}

int tp_fw_init(struct tp_data *tp)
{
	int ret;

	ret = tp_fw_version_read(tp);
	if (ret)
		return ret;
	dev_dbg(&tp->client->dev, "fw %u.x\n", tp_fw_major);
	return tp_load_config(tp);
}

int tp_gesture_enable(struct tp_data *tp)
{
	/* Double-tap wake needs firmware 3.x or newer. */
	if (tp_fw_major < 3)
		return 0;

	return tp_write_reg(tp, TP_REG_GESTURE, TP_GESTURE_DOUBLE_TAP);
}
