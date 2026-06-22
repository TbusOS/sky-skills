# MTD — NAND / NOR / SPI flash

> 权威源：`Documentation/driver-api/mtd/`、`include/linux/mtd/mtd.h`、
> `include/linux/mtd/rawnand.h`(NAND)。API 以目标树为准。分区在 DT/cmdline 定义。

何时加载本模块：写裸 flash(NAND/NOR/SPI-NOR)驱动,或在内核里读写 MTD 分区(存校准/env/固件)。

## 注册 MTD 设备（带分区）

```c
mtd->name = "my-flash"; mtd->size = ...; mtd->erasesize = 0x10000; mtd->writesize = ...;
mtd->_read = my_read; mtd->_write = my_write; mtd->_erase = my_erase;

/* 按 DT/cmdline 分区注册(推荐),一步到位: */
ret = mtd_device_parse_register(mtd, NULL, &parser_data, parts, nr_parts);
/* 移除: mtd_device_unregister(mtd); */
```

`mtd_device_parse_register` 会解析分区并注册;无分区可用 `mtd_device_register`。

## 写之前必须先擦,且按 erasesize 对齐（核心,易错）

flash 不能直接覆写——写只会把 bit 往一个方向清,要先擦成全 1 再写。擦的区域(offset 和 length)**必须按 `mtd->erasesize` 对齐**,否则 `mtd_erase` 返 `-EINVAL`。

```c
struct erase_info ei = { .addr = off, .len = round_up(len, mtd->erasesize) };  /* 对齐 */
mtd_erase(mtd, &ei);
mtd_write(mtd, off, len, &retlen, buf);   /* 擦后才写 */
```

详见 `known-bugs.md` KB-MTD-001。`CONFIG_MTD` 是框架开关。

## NAND

裸 NAND 填 `struct nand_chip`(读写时序/ECC/oob),`nand_scan` 探测芯片并建立 `mtd_info`,再 `mtd_device_register`。多数 SPI-NOR 用通用 `spi-nor` 框架,无需自写。

## 常见坑

- 不擦直接写、或擦的区域没按 `erasesize` 对齐(-EINVAL / 数据损坏)(KB-MTD-001)。
- 读写没检查 `retlen`(部分完成);写跨坏块没处理(NAND)。
- `mtd_read`/`_write` 的 buffer 大小与 `writesize`/页对齐没核对。
