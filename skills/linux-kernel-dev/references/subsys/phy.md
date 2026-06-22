# PHY (generic PHY framework) — USB / PCIe / MIPI / SATA phy

> 权威源：`Documentation/driver-api/phy/`、`include/linux/phy/phy.h`。API 以目标树为准。
> **这是通用 PHY 框架(`drivers/phy`, `struct phy`)**,不是网络 MDIO PHY(那是 `struct phy_device` / `phy_connect`,见网络子系统)——两者别混。

何时加载本模块：控制器驱动(USB/PCIe/MIPI/SATA 等)要拿并初始化它的 PHY,或写一个 PHY provider。

## 消费者：init → power_on → 用 → power_off → exit（顺序很重要）

```c
phy = devm_phy_get(dev, "usb2-phy");      /* DT phys/phy-names;可选用 devm_phy_optional_get */
if (IS_ERR(phy))
    return PTR_ERR(phy);

phy_init(phy);          /* 1. 初始化(时钟/复位等),可睡 */
phy_power_on(phy);      /* 2. 上电,可睡 */
/* ... 控制器工作 ... */
phy_power_off(phy);     /* 3. 关电(与 power_on 配对) */
phy_exit(phy);          /* 4. 反初始化(与 init 配对) */
```

顺序固定:**init 在前、power_on 在后;拆除反序(power_off 再 exit)**。两对都是引用计数的。`phy_set_mode` 切模式(host/device 等)。详见 `known-bugs.md` KB-PHY-001。`CONFIG_GENERIC_PHY` 是框架开关。

## Provider：写一个 PHY 驱动

```c
static const struct phy_ops my_ops = { .init = ..., .power_on = ..., .power_off = ..., .exit = ..., .owner = THIS_MODULE };
phy = devm_phy_create(dev, np, &my_ops);
phy_set_drvdata(phy, priv);
devm_of_phy_provider_register(dev, of_phy_simple_xlate);
```

## 常见坑

- 顺序错:没 `phy_init` 就 `phy_power_on`,或拆除时先 `phy_exit` 再 `phy_power_off`(KB-PHY-001)。
- 把通用 PHY 跟网络 MDIO PHY 搞混(API 完全不同)。
- 拿 PHY 返 -EPROBE_DEFER 不传播给 probe 重试。
