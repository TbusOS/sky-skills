# USB Drivers (host side)

> 权威源：`Documentation/driver-api/usb/`、`include/linux/usb.h`。API 以目标树为准。
> 本模块讲 host 侧设备驱动（驱动一个插上来的 USB 设备）；gadget(设备侧)另说。

何时加载本模块：写驱动一个 USB 外设的驱动——绑定、控制/批量传输、URB。

## 驱动骨架

```c
static const struct usb_device_id my_ids[] = {
    { USB_DEVICE(0x1234, 0x5678) }, { }
};
MODULE_DEVICE_TABLE(usb, my_ids);

static int my_probe(struct usb_interface *intf, const struct usb_device_id *id)
{
    struct usb_device *udev = interface_to_usbdev(intf);
    /* 找端点、建 URB、usb_set_intfdata(intf, ctx) */
    return 0;
}
static void my_disconnect(struct usb_interface *intf) { /* 杀 URB、清理 */ }

static struct usb_driver my_driver = {
    .name = "my-usb", .id_table = my_ids,
    .probe = my_probe, .disconnect = my_disconnect,
};
module_usb_driver(my_driver);
```

USB 按 `usb_device_id`(VID/PID 或 class)匹配；探测以 `usb_interface` 为单位（一个设备可有多个接口）。

## 传输

| 类型 | 同步 | 异步(URB) |
|---|---|---|
| 控制 | `usb_control_msg`（新内核另有 `usb_control_msg_send/recv`，5.19+） | — |
| 批量 | `usb_bulk_msg` | `usb_alloc_urb` + `usb_fill_bulk_urb` + `usb_submit_urb` + `usb_free_urb` |
| 中断/等时 | — | 同上，填对应 fill 宏 |

管道宏：`usb_rcvbulkpipe(udev, ep)` / `usb_sndbulkpipe(udev, ep)` 由设备号 + 端点地址构造。

`usb_bulk_msg`/`usb_control_msg` 同步、会睡——进程上下文用。高吞吐/流式用 URB 异步。

## URB 完成回调（要害）

URB 的 completion 回调在**原子/软中断上下文**跑——**不能睡**。回调里要重新提交就用 `usb_submit_urb(urb, GFP_ATOMIC)`；要做会睡的活推给 workqueue（见 `interrupts.md`、`scheduler.md`）。见 `known-bugs.md` KB-USB-001。

## 常见坑

- 在 URB 完成回调里睡眠 / 用 `GFP_KERNEL` 提交 URB（回调是原子上下文）→ KB-USB-001。
- `disconnect` 里没 `usb_kill_urb` 就释放资源 → 回调用到已释放内存。
- 同步 `usb_bulk_msg` 用在原子上下文（会睡）。
- 端点方向/管道构造错（`usb_rcvbulkpipe` vs `usb_sndbulkpipe`）。
