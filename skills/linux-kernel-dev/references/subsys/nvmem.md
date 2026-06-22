# NVMEM — eeprom / efuse / otp

> 权威源：`Documentation/driver-api/nvmem.rst`、`include/linux/nvmem-provider.h`、
> `include/linux/nvmem-consumer.h`。API 以目标树为准。cell 在 DT 里定义。

何时加载本模块：写 NVMEM provider(eeprom/efuse/otp 后端)，或消费一段 NVMEM cell(读 MAC、校准值、序列号等)。

## 消费者：读一段 cell

```c
cell = nvmem_cell_get(dev, "mac-address");   /* DT nvmem-cells/nvmem-cell-names */
if (IS_ERR(cell))
    return PTR_ERR(cell);

size_t len;
void *buf = nvmem_cell_read(cell, &len);     /* 返回 kmalloc 的缓冲,len 是长度 */
if (IS_ERR(buf)) { nvmem_cell_put(cell); return PTR_ERR(buf); }
/* ... 用 buf[0..len) ... */
kfree(buf);                                  /* 必须:nvmem_cell_read 的缓冲自己 free */
nvmem_cell_put(cell);                         /* 非 devm 版要 put */
```

`nvmem_cell_read(cell, &len)` 返回一块**新 kmalloc 的缓冲**，用完**必须 `kfree`**。定长值用 `nvmem_cell_read_u8/u16/...` 直接拿整数，不用手动 free。详见 `known-bugs.md` KB-NVMEM-001。

## Provider：注册一个 NVMEM 设备

```c
struct nvmem_config cfg = {
    .name = "my-eeprom", .dev = dev, .size = 256, .word_size = 1, .stride = 1,
    .reg_read = my_reg_read, .reg_write = my_reg_write,
};
nvmem = devm_nvmem_register(dev, &cfg);
```

`CONFIG_NVMEM` 是框架开关。cell 的偏移/长度在 DT 的 nvmem 节点下定义。

## 常见坑

- `nvmem_cell_read` 的缓冲用完不 `kfree` → 内存泄漏(KB-NVMEM-001)。
- 非 devm 的 `nvmem_cell_get` 后忘 `nvmem_cell_put`。
- provider 的 `nvmem_config` 漏 `word_size`/`stride` → 读写偏移算错。
