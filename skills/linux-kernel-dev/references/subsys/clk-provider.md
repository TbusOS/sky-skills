# Clock provider — 写时钟控制器驱动

> 权威源：`Documentation/driver-api/clk.rst`、`include/linux/clk-provider.h`。API 以目标树为准。
> 消费侧(clk_get/prepare/enable)见 `clk.md`;本模块是 **provider 侧**(实现 clk_ops、暴露给 DT)。

何时加载本模块：写一个时钟控制器(PLL/分频/门控/复用),实现 `clk_ops` 并向 DT 暴露时钟。

## clk_hw + clk_ops 骨架

```c
struct my_clk { struct clk_hw hw; void __iomem *reg; };
#define to_my(_hw) container_of(_hw, struct my_clk, hw)

static int my_enable(struct clk_hw *hw) { /* 翻使能位 */ return 0; }   /* 原子,不能睡 */
static void my_disable(struct clk_hw *hw) { ... }
static unsigned long my_recalc_rate(struct clk_hw *hw, unsigned long parent) { return parent / div; }

static const struct clk_ops my_ops = {
    .prepare = my_prepare, .unprepare = my_unprepare,   /* 可睡:等 PLL 锁定等 */
    .enable  = my_enable,  .disable   = my_disable,      /* 原子:只翻寄存器位 */
    .recalc_rate = my_recalc_rate, .round_rate = ..., .set_rate = ...,
};

struct clk_init_data init = { .name = "my-clk", .ops = &my_ops, .parent_names = (const char *[]){ "parent" }, .num_parents = 1 };
mc->hw.init = &init;
devm_clk_hw_register(dev, &mc->hw);
devm_of_clk_add_hw_provider(dev, of_clk_hw_onecell_get, clk_data);   /* DT #clock-cells 解析 */
```

固定类时钟有现成构造器:`clk_hw_register_fixed_rate` / `clk_hw_register_gate` / `_divider` / `_mux`,不用手写 ops。`CONFIG_COMMON_CLK` 是框架开关。

## clk_ops 上下文：enable/disable 原子,prepare/unprepare 可睡（核心）

`clk_ops.enable`/`.disable` 在持 `enable_lock`(自旋锁)下被调,**不能睡**——只翻寄存器位。需要睡眠的初始化(等 PLL 锁定、走 I2C 配 PMIC)放 `.prepare`/`.unprepare`(持 prepare mutex,可睡)。这是消费侧 prepare/enable 两阶段在 provider 侧的对应。详见 `known-bugs.md` KB-CLKP-001。

## 常见坑

- 在 `clk_ops.enable`(原子)里做会睡的操作(等锁定/I2C)→ 崩;应放 `.prepare`(KB-CLKP-001)。
- `.recalc_rate` 返回错的实际频率(没按真实分频算)→ 全树频率算错。
- 子频率要能传到父时钟却没设 `CLK_SET_RATE_PARENT` flag。
