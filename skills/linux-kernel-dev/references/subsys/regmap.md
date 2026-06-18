# Regmap — 寄存器访问抽象

> 权威源：`Documentation/driver-api/regmap.rst`、`include/linux/regmap.h`。
> API 以目标树为准。绑总线的驱动见 `i2c.md` / `spi.md`；初始化在进程上下文。

何时加载本模块：设备有一堆寄存器要读写，想要自动的锁/字节序/缓存，而不是手撸 i2c/spi 传输。

## 建 regmap（按总线选 init）

```c
static const struct regmap_config cfg = {
    .reg_bits = 8,            /* 必填：寄存器地址位宽 */
    .val_bits = 8,            /* 必填：寄存器值位宽 */
    .max_register = 0x7f,
    .cache_type = REGCACHE_RBTREE,
    .volatile_reg = my_is_volatile,   /* 会自己变的寄存器要标，否则 cache 返陈旧值 */
};

regmap = devm_regmap_init_i2c(client, &cfg);   /* SPI: devm_regmap_init_spi；MMIO: devm_regmap_init_mmio */
if (IS_ERR(regmap))
    return PTR_ERR(regmap);
```

`reg_bits` 和 `val_bits` 不填 → 初始化失败。详见 `known-bugs.md` KB-REGMAP-001。`CONFIG_REGMAP` 由具体总线后端（`CONFIG_REGMAP_I2C` 等）自动选上。

## 读写

| 操作 | API |
|---|---|
| 单寄存器 | `regmap_read` / `regmap_write` |
| 读改写（原子 RMW，首选） | `regmap_update_bits` / `regmap_set_bits` / `regmap_clear_bits` |
| 批量连续 | `regmap_bulk_read` / `regmap_bulk_write` / `regmap_multi_reg_write` |
| 轮询到位 | `regmap_read_poll_timeout` |

改某几个 bit 用 `regmap_update_bits`（regmap 内部加锁做 RMW），别自己 read→改→write，会跟 cache/并发抢。

## 缓存 + PM（suspend/resume）

```c
/* suspend：标脏 + 转只读缓存，停止真访问 */
regcache_mark_dirty(regmap);
regcache_cache_only(regmap, true);
/* resume：退出 only 模式 + 把脏值刷回硬件 */
regcache_cache_only(regmap, false);
regcache_sync(regmap);
```

## 常见坑

- `regmap_config` 漏 `reg_bits`/`val_bits` → init 失败（KB-REGMAP-001）。
- 状态/数据/FIFO 这类硬件自己改的寄存器没标 `volatile_reg` → 读到 cache 里的陈旧值。
- 手动 read→modify→write 改 bit，而不是 `regmap_update_bits`——丢原子性、和 cache 不一致。
