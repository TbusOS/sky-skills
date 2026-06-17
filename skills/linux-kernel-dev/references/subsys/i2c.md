# I2C Client Drivers

> 权威源：`Documentation/i2c/`（`writing-clients.rst`、`smbus-protocol.rst`、`instantiating-devices.rst`）、
> `include/linux/i2c.h`、`include/linux/regmap.h`。API/probe 签名以目标树为准。
> DT 节点写法见 `device-tree.md` / `templates.md`；寄存器抽象首选 regmap。

何时加载本模块：写挂在 I2C 总线上的设备驱动（传感器、PMIC、codec、touch 等）——绑定、读写寄存器。

## 驱动骨架

```c
static const struct of_device_id my_of_match[] = {
    { .compatible = "vendor,my-chip" }, { }
};
MODULE_DEVICE_TABLE(of, my_of_match);

static int my_probe(struct i2c_client *client)   /* 现代签名：单参 */
{
    /* client->addr 是 7-bit 地址；regmap/smbus 读写见下 */
    return 0;
}

static struct i2c_driver my_driver = {
    .driver = { .name = "my-chip", .of_match_table = my_of_match },
    .probe  = my_probe,
};
module_i2c_driver(my_driver);
```

I2C 传输在进程上下文、**会睡**——别在中断/原子上下文里调（见 `interrupts.md` / SKILL Forbidden #1）。

## 读写寄存器（三选一，按设备复杂度）

| 方式 | API | 何时 |
|---|---|---|
| **regmap**（首选） | `devm_regmap_init_i2c` + `regmap_read` / `regmap_write` | 多寄存器设备，自动 cache/锁/字节序，少手写 |
| SMBus 协议 | `i2c_smbus_read_byte_data` / `i2c_smbus_write_byte_data` | 简单"寄存器=值"芯片 |
| 原始消息 | `i2c_transfer` + `struct i2c_msg[]` / `i2c_master_send` / `i2c_master_recv` | 非标准时序、连续写后读 |

## DT 绑定

设备节点挂在 i2c 控制器节点下，`reg = <0x1a>`（7-bit 地址），`compatible` 对上驱动的 `of_match_table`。详见 `device-tree.md`。

## 版本敏感（按目标树 `include/linux/i2c.h` 核）

- `i2c_driver.probe` 签名变过：旧 `.probe(client, const struct i2c_device_id *id)`（双参）→ `.probe_new(client)`（单参，5.0+）→ 6.x 起 `.probe` 本身改为单参 `.probe(client)` 且 `.probe_new` 移除。**6.1 过渡期两者都在；7.0 只剩单参 `.probe`**。移植旧代码必踩，见 `known-bugs.md` KB-I2C-001。

## 常见坑

- 在中断/原子上下文做 I2C 传输（I2C 会睡）→ 崩。
- probe 写成旧双参签名在新内核编译错（KB-I2C-001）。
- 自己手撸 i2c_transfer 管寄存器，而设备规则适合 regmap（白费力 + 容易错字节序）。
