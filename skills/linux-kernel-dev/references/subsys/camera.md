# Camera · V4L2 / Media

> 权威源：`Documentation/driver-api/media/`、`Documentation/userspace-api/media/v4l/`、
> `include/media/v4l2-device.h`、`v4l2-ioctl.h`、`videobuf2-*.h`。API 以目标树为准。
> 传感器多挂 I2C(控制走 i2c.md/regmap),数据走 CSI;DT 绑定见 `device-tree.md`。

何时加载本模块：写摄像头/视频采集驱动——v4l2_device、video_device、vb2 缓冲队列、sensor subdev。

## V4L2 对象与注册

| 对象 | 是什么 | 注册 |
|---|---|---|
| `v4l2_device` | 设备的 V4L2 根 | `v4l2_device_register(dev, &v4l2_dev)` |
| `video_device` | `/dev/videoN` 节点 | `video_device_alloc` + `video_register_device` |
| `v4l2_subdev` | 子设备(sensor / CSI / ISP) | `v4l2_async_register_subdev`(异步绑定) |
| `v4l2_ctrl_handler` | 控件(曝光/增益…) | `v4l2_ctrl_handler_init` + 加控件 |

`video_device` 挂 `v4l2_ioctl_ops`(`vidioc_*` 回调:querycap / enum_fmt / s_fmt / reqbufs …)和一个 vb2 队列。

## 缓冲:videobuf2 (vb2)

```c
struct vb2_queue q = { .ops = &my_vb2_ops, .mem_ops = &vb2_dma_contig_memops, ... };
vb2_queue_init(&q);
```

`struct vb2_ops` 核心回调:`queue_setup`(算 buffer 数/大小)、`buf_queue`(一个 buffer 入队 → 交给硬件 DMA)、`start_streaming`(启流)、`stop_streaming`(停流)。

**`stop_streaming` 必须把所有还在驱动手里的 buffer 还给 vb2**(对每个 `vb2_buffer_done(vb, VB2_BUF_STATE_ERROR)`),否则队列卡死/泄漏。见 `known-bugs.md` KB-V4L2-001。

## sensor subdev(传感器在 I2C 上)

sensor 是 `v4l2_subdev`,通常 I2C 驱动(寄存器走 regmap,见 `i2c.md`),用 `v4l2_async_register_subdev` 异步注册;桥接驱动用 async notifier 绑定。`v4l2_subdev_ops` 提供 `s_stream`(启停)、pad ops(格式协商)。

## 版本敏感(按目标树核)

- vb2 的 `queue_setup` / `buf_prepare` 等回调签名历史上有调整;`mem_ops`(dma-contig / vmalloc / dma-sg)按数据通路选。以 `include/media/videobuf2-core.h` 为准。

## 常见坑

- `stop_streaming` 不归还所有 buffer → 应用 `VIDIOC_STREAMOFF` 卡死(KB-V4L2-001)。
- buffer 内存类型(dma-contig vs vmalloc)和实际 DMA 能力对不上。
- sensor subdev 用同步注册而非 async,probe 顺序一变就绑不上。
- 在 `buf_queue`(可能原子上下文)里做会睡的操作。
