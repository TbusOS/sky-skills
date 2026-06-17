# Device Tree (driver side)

> 权威源：`Documentation/devicetree/`（`usage-model.rst`、`kernel-api.rst`、`overlay-notes.rst`、
> `bindings/`）、`include/linux/of.h`、`of_device.h`、`of_platform.h`。
> binding(YAML schema)和 `.dts` 节点的写法模板见 `templates.md`；本模块讲**驱动里怎么消费 DT**。
> 属性/API 以目标树为准——DT 是硬件描述，写错驱动不 probe 或读到垃圾。

何时加载本模块：驱动通过 compatible 绑定 DT、从 DT 读配置（寄存器/中断/时钟/GPIO/自定义属性）、遍历 DT 节点、运行时 overlay。

## 概念

DT 描述**不可探测的硬件**（地址、中断号、时钟、GPIO……）。内核按节点的 `compatible` 字符串匹配驱动；属性是键值；`&label` 是 phandle（引用另一个节点，如 `clocks = <&cru CLK_X>`）。标准属性：`reg`（MMIO 基址+长度）、`interrupts`、`clocks`/`clock-names`、`*-gpios`、`pinctrl-*`。

## 驱动绑定（compatible → probe）

```c
static const struct of_device_id my_of_match[] = {
    { .compatible = "vendor,my-device", .data = &my_variant_a },
    { }
};
MODULE_DEVICE_TABLE(of, my_of_match);

static struct platform_driver my_driver = {
    .probe = my_probe,
    .driver = {
        .name = "my-device",
        .of_match_table = my_of_match,
    },
};
module_platform_driver(my_driver);
```

probe 里拿匹配项的私有数据：`const struct my_variant *v = of_device_get_match_data(dev);`（按 compatible 区分型号变体）。

## 从 DT 读资源 / 属性

| 要什么 | 用什么 |
|---|---|
| MMIO 寄存器（`reg`） | `devm_platform_ioremap_resource(pdev, 0)` |
| 中断（`interrupts`） | `platform_get_irq(pdev, 0)` → `devm_request_irq`（见 `interrupts.md`） |
| 整数属性 | `of_property_read_u32(np, "vendor,freq", &val)`（返回 0 成功，**必须检查**） |
| 字符串 / 布尔 | `of_property_read_string` / `of_property_read_bool` |
| 时钟 / GPIO / regulator（phandle） | 各子系统 API：`devm_clk_get` / `gpiod_get`（见 `gpio.md`）/ `devm_regulator_get` |

`of_property_read_*` 失败返回负值；属性可选时用返回值判断有没有，别假设一定存在。

## 遍历节点（注意引用计数）

```c
struct device_node *child;
for_each_child_of_node(np, child) {
    /* 用 child …；提前 break/return 前要 of_node_put(child) */
}
```

`of_find_*` / `for_each_child_of_node` 拿到的 `device_node` 增了引用计数——**用完 `of_node_put()`**，否则漏引用。见 `known-bugs.md` KB-DT-001。

## Overlay（运行时改 DT）

`of_overlay_fdt_apply` 等在运行时叠加/移除节点（可热插拔扩展板）。深入读 `Documentation/devicetree/overlay-notes.rst`。

## 版本敏感（按目标树核）

- binding 文档从纯文本 `.txt` 迁到 **YAML schema**（`Documentation/devicetree/bindings/**/*.yaml`，可被 `dt_binding_check` 校验）；新增 binding 写 YAML。
- 节点遍历的具体宏/函数以目标树 `include/linux/of.h` 为准。

## 常见坑

- `for_each_child_of_node` / `of_find_*` 后忘 `of_node_put` → 漏引用（KB-DT-001）。
- `compatible` 和驱动 `of_match_table` 对不上 → 驱动根本不 probe。
- 不检查 `of_property_read_*` 返回值，属性缺失时用了未初始化的值。
- 手动 `ioremap` 不用 `devm_platform_ioremap_resource` → 清理顺序错/泄漏。
