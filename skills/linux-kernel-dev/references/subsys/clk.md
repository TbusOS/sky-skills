# Clock Framework (CCF) — consumer & provider

> 权威源：`Documentation/driver-api/clk.rst`、`include/linux/clk.h`（消费者）、
> `include/linux/clk-provider.h`（写时钟驱动）。API 以目标树为准。
> DT 怎么引时钟见 `device-tree.md`；寄存器抽象见 `regmap.md`。

何时加载本模块：驱动要开/关/调一路时钟（消费者），或写时钟控制器驱动往 DT 暴露时钟（provider）。

## 消费者：拿时钟 → prepare+enable → 用 → disable+unprepare

```c
struct clk *clk = devm_clk_get(dev, "core");      /* DT clock-names 里的名字 */
if (IS_ERR(clk))
    return PTR_ERR(clk);

ret = clk_prepare_enable(clk);                     /* 进程上下文：可睡眠 */
if (ret)
    return ret;
/* ... 设备在跑 ... */
clk_disable_unprepare(clk);                        /* 配对释放 */
```

- `devm_clk_get` / `devm_clk_get_optional`（可选时钟不存在返 NULL，不报错）；非 devm 用 `clk_get` 配 `clk_put`。
- 多路时钟用 bulk：`devm_clk_bulk_get` + `clk_bulk_prepare_enable`。
- 调频：`clk_set_rate` / `clk_round_rate`（先问能给到的频率）/ `clk_get_rate`；换父：`clk_set_parent`。

## 两阶段：prepare/unprepare vs enable/disable（核心,别合并理解）

| 阶段 | API | 上下文 | 能否睡眠 |
|---|---|---|---|
| prepare | `clk_prepare` / `clk_unprepare` | 进程 | **会睡**（可能要等 PLL 锁定、走 I2C PMIC 等） |
| enable | `clk_enable` / `clk_disable` | 任意（含原子/中断） | **不睡**（只翻寄存器位） |
| 合并 | `clk_prepare_enable` / `clk_disable_unprepare` | 进程 | 会睡 |

拆两阶段就是为了：先在进程上下文 `clk_prepare`，之后在原子/中断上下文也能 `clk_enable`。详见 `known-bugs.md` KB-CLK-001。

## Provider：写时钟驱动 + 往 DT 暴露

```c
hw = devm_clk_hw_register(dev, &my_clk_hw);                 /* 注册一个 clk_hw */
devm_of_clk_add_hw_provider(dev, of_clk_hw_onecell_get, data); /* DT #clock-cells 解析 */
```

`CONFIG_COMMON_CLK` 是 CCF 开关。DT 消费侧 `clocks = <&ctrl ID>; clock-names = "core";`，见 `device-tree.md`。

## 常见坑

- 在原子/中断上下文调 `clk_prepare`(或 `clk_prepare_enable`)→ 可能睡眠，崩（KB-CLK-001）。
- 只 `clk_enable` 不先 prepare → CCF 报警/不工作；enable 和 disable 计数不配平 → 时钟提前关或关不掉。
- 把 `clk_set_rate` 当“通知频率变了”用——它真去改硬件，且受 provider 的 round_rate 约束。
