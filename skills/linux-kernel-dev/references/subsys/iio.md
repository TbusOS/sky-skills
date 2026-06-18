# IIO (Industrial I/O) — sensor / ADC driver

> 权威源：`Documentation/driver-api/iio/`、`include/linux/iio/iio.h`、
> `include/linux/iio/triggered_buffer.h`。API 以目标树为准。
> 挂在总线上的 sensor 见 `i2c.md` / `spi.md`；寄存器访问见 `regmap.md`。

何时加载本模块：写 ADC / 传感器（加速度、光、温度、电压等）驱动，向用户态暴露通道读数。

## 驱动骨架：alloc（含 priv）→ 填 channels/info → 最后 register

```c
struct my_state { struct regmap *rm; /* ... */ };

indio_dev = devm_iio_device_alloc(dev, sizeof(struct my_state));  /* priv 内联在 iio_dev 里 */
if (!indio_dev)
    return -ENOMEM;
st = iio_priv(indio_dev);                 /* 取私有数据,不要另外 kmalloc */

indio_dev->name = "my-sensor";
indio_dev->info = &my_iio_info;           /* struct iio_info: read_raw/write_raw */
indio_dev->channels = my_channels;        /* struct iio_chan_spec[] */
indio_dev->num_channels = ARRAY_SIZE(my_channels);

return devm_iio_device_register(dev, indio_dev);  /* 最后一步:注册即对用户态可见 */
```

`iio_priv()` 拿到的私有数据是 `devm_iio_device_alloc` 跟 `iio_dev` **一起分配**的——别再单独 kmalloc。`register` 必须放在最后（注册完 sysfs/chardev 就活了，通道立刻可被读）。详见 `known-bugs.md` KB-IIO-001。`CONFIG_IIO` 是框架开关。

## 读数：read_raw

`iio_info.read_raw(indio_dev, chan, *val, *val2, mask)` 按 `mask`（`IIO_CHAN_INFO_RAW` / `_SCALE` 等）返回值，返回类型如 `IIO_VAL_INT` / `IIO_VAL_FRACTIONAL` 决定 val/val2 怎么组合。

## 缓冲采集（触发 + buffer）

```c
devm_iio_triggered_buffer_setup(dev, indio_dev, NULL, my_trigger_handler, NULL);
/* 中断/触发处理里把一帧样本推给上层: */
iio_push_to_buffers_with_timestamp(indio_dev, samples, timestamp);
```

## 常见坑

- 私有数据单独 kmalloc 而不用 `devm_iio_device_alloc(sizeof)` + `iio_priv()`（KB-IIO-001）。
- `iio_device_register` 放太早：还没填好 channels/info 就注册，用户态读到半成品。
- read_raw 返回类型（IIO_VAL_*）和 val/val2 填法对不上 → 用户态读数错。
