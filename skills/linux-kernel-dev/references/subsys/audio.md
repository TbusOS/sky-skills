# Audio · ALSA SoC (ASoC)

> 权威源：`Documentation/sound/soc/`、`include/sound/soc.h`、`include/sound/soc-dai.h`。
> API 以目标树为准。I2C/SPI 控制总线见 `i2c.md` / `spi.md`;DT 绑定见 `device-tree.md`。

何时加载本模块：写嵌入式音频驱动——codec 驱动、平台(CPU DAI/DMA)驱动、machine(把它们连起来的声卡)。

## ASoC 三块(嵌入式音频的标准拆分)

| 块 | 是什么 | 注册 |
|---|---|---|
| **Codec / component** | 音频芯片驱动(寄存器、控件、DAPM) | `devm_snd_soc_register_component(dev, &comp_drv, &dai_drv, 1)` |
| **Platform / CPU DAI** | SoC 上的音频接口(I2S/PCM/TDM)+ DMA | 同 component 注册,挂 `snd_soc_dai_driver` |
| **Machine / card** | 把 codec + cpu DAI 连成一块声卡 | `devm_snd_soc_register_card(dev, &card)` |

`struct snd_soc_card` 里用 `struct snd_soc_dai_link[]` 描述每条链路(cpu / codec / platform 组件)。codec 通常挂在 I2C/SPI 控制总线上(寄存器用 regmap,见 `i2c.md`/`spi.md`),音频数据走 I2S。

## DAI 与回调

```c
static const struct snd_soc_dai_ops my_dai_ops = {
    .set_fmt    = my_set_fmt,     /* 主从、I2S/左对齐等格式 */
    .set_sysclk = my_set_sysclk,  /* 时钟 */
    .hw_params  = my_hw_params,   /* 采样率/位深/声道 → 配寄存器 */
    .trigger    = my_trigger,     /* START/STOP —— 原子上下文,不能睡 */
};
```

**`trigger` 回调在原子上下文(持 PCM stream 锁)调用——不能睡**(不能 `regmap` 经 I2C 慢速访问、不能 mutex)。要在 trigger 里启停的硬件操作必须是非睡眠的;慢速配置放 `hw_params`(进程上下文)。见 `known-bugs.md` KB-ASOC-001。

## 版本敏感(按目标树 `include/sound/soc.h` 核)

- 旧的 `snd_soc_codec` / `snd_soc_register_codec` 已被统一的 **component** 模型取代(`snd_soc_component` + `devm_snd_soc_register_component`)。移植旧 codec 驱动要改到 component。
- `snd_soc_dai_ops` 回调签名随版本有微调,按目标树核。

## 常见坑

- 在 `trigger` 回调里睡眠(慢速 I2C 写、mutex)→ 原子上下文违规(KB-ASOC-001);慢配置移到 `hw_params`。
- 还按旧 `snd_soc_codec` 写新 codec(应用 component 模型)。
- machine 的 `dai_link` 里 cpu/codec/platform 名字对不上注册的组件 → 声卡 probe 不起来。
- codec 寄存器不用 regmap 手撸,容易错(cache/字节序)。
