# SPI Device Drivers

> 权威源：`Documentation/spi/`（`spi-summary.rst`、`spidev.rst`）、`include/linux/spi/spi.h`、
> `include/linux/regmap.h`。API 以目标树为准。DT 节点见 `device-tree.md`；寄存器抽象首选 regmap。

何时加载本模块：写挂在 SPI 总线上的设备驱动（ADC、显示控制器、flash、传感器等）——绑定、传输。

## 驱动骨架

```c
static const struct of_device_id my_of_match[] = {
    { .compatible = "vendor,my-spi-chip" }, { }
};
MODULE_DEVICE_TABLE(of, my_of_match);

static int my_probe(struct spi_device *spi)
{
    spi->mode = SPI_MODE_0;
    spi->max_speed_hz = 10000000;
    spi_setup(spi);          /* 应用 mode/速率/bits_per_word */
    return 0;
}

static struct spi_driver my_driver = {
    .driver = { .name = "my-spi-chip", .of_match_table = my_of_match },
    .probe  = my_probe,
};
module_spi_driver(my_driver);
```

SPI 传输在进程上下文、**会睡**——别在中断/原子上下文调（见 `interrupts.md` / SKILL Forbidden #1）。

## 传输

| 方式 | API | 何时 |
|---|---|---|
| **regmap**（首选） | `devm_regmap_init_spi` + `regmap_read` / `regmap_write` | 多寄存器设备 |
| 简单读写 | `spi_write` / `spi_read` | 单段写或读 |
| 全双工 / 多段 | `struct spi_transfer[]` + `spi_message_init` + `spi_message_add_tail` + `spi_sync` | 写命令再读数据、同时收发 |
| 异步 | `spi_async`（回调） | 不能阻塞的路径 |

**传输 buffer 必须 DMA-able**：不要用栈上数组当 `spi_transfer.tx_buf`/`rx_buf`，控制器可能 DMA。用 `kmalloc` 的缓冲。见 `known-bugs.md` KB-SPI-001。

## DT 绑定

设备节点挂在 spi 控制器节点下，`reg = <0>`（片选号），`spi-max-frequency`，`compatible` 对上驱动。详见 `device-tree.md`。

## 常见坑

- 把栈上数组当 `spi_transfer` 的 tx/rx buffer（DMA 取不到 / 踩栈）→ KB-SPI-001。
- 在中断/原子上下文做 SPI 传输（会睡）→ 崩。
- probe 里忘 `spi_setup()`，mode/速率没生效。
- 设备适合 regmap 还手撸 spi_message。
