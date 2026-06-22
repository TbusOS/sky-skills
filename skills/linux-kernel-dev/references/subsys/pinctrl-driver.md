# Pin controller driver — 写一个 pinctrl 控制器

> 权威源：`Documentation/driver-api/pin-control.rst`、`include/linux/pinctrl/pinctrl.h`、
> `pinmux.h`、`pinconf.h`、`pinconf-generic.h`。API 以目标树为准。
> 消费侧(选 state)见 `pinctrl.md`;本模块是 **driver 侧**(写 SoC pin 控制器)。

何时加载本模块：写 SoC 的 pin 控制器驱动——管引脚的复用(pinmux)和电气配置(pinconf)。

## pinctrl_desc + 三组 ops

```c
static const struct pinctrl_ops my_pctlops = {
    .get_groups_count = ..., .get_group_name = ..., .get_group_pins = ...,
    .dt_node_to_map = pinconf_generic_dt_node_to_map,   /* DT → map(通用实现) */
    .dt_free_map    = pinconf_generic_dt_free_map,
};
static const struct pinmux_ops my_pmxops = {
    .get_functions_count = ..., .get_function_name = ..., .get_function_groups = ...,
    .set_mux = my_set_mux,                               /* 真正切复用 */
};
static const struct pinconf_ops my_confops = {
    .pin_config_get = ..., .pin_config_set = my_pin_config_set,   /* 上下拉/驱动强度 */
};

static struct pinctrl_desc my_desc = {
    .name = "my-pinctrl", .pins = my_pins, .npins = ARRAY_SIZE(my_pins),
    .pctlops = &my_pctlops, .pmxops = &my_pmxops, .confops = &my_confops, .owner = THIS_MODULE,
};
pctl = devm_pinctrl_register(dev, &my_desc, priv);
```

三组 ops 各管一摊:`pinctrl_ops`(引脚组 + DT 解析)、`pinmux_ops`(复用)、`pinconf_ops`(电气)。`CONFIG_PINCTRL` 是框架开关。

## DT → map：dt_node_to_map 不可少（核心）

消费者从 DT 的 pinctrl 节点拿 "default"/"sleep" 等 state,靠控制器的 `pinctrl_ops.dt_node_to_map` 把 DT 子节点翻成核心的 pinctrl map。直接用通用实现 `pinconf_generic_dt_node_to_map` + `pinconf_generic_dt_free_map` 即可;不提供则 DT 里的 pin state 解析不出来,消费者拿不到。详见 `known-bugs.md` KB-PINCTRLD-001。

## 常见坑

- 没实现/没挂 `dt_node_to_map` → 消费者的 DT pin state 解析不出来(KB-PINCTRLD-001)。
- 漏 `pinmux_ops.set_mux`(复用不生效)或 `pinconf_ops.pin_config_set`(上下拉/驱动强度设不了)。
- `pinctrl_desc.pins` 没填全/编号和 group 对不上。
