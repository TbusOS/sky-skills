# `[CLAIMS]` 契约

> 答 kernel/BSP 任务时，在答案**末尾**附一个 `[CLAIMS]` 块，列出**可被机器核对**的断言。
> 这是 事实检查（`scripts/fact_gate.mjs`）的靶子——没有它，客观校验无从下手。

## 格式

```
[CLAIMS]
config: CONFIG_OF, CONFIG_REGMAP_MMIO
api: devm_kzalloc, platform_get_irq, devm_request_irq
symbol: regmap_read
compatible: vendor,my-device; another,compat
forbidden_respected: no-sleep-in-spinlock, no-gfp-kernel-in-atomic
[/CLAIMS]
```

字段：
- **config** — 引用的 Kconfig 选项（`CONFIG_` 前缀可带可不带）。逗号分隔。事实检查 校 `config X`/`menuconfig X` 在树里存在（grep 覆盖 `config` 和 `menuconfig` 两关键字）。
- **api** / **symbol** — 引用的内核函数/符号。逗号分隔。事实检查 校它在 `.c/.h` 里以词边界出现（抓编造的 API 名）。
- **compatible** — 设备树 compatible 串。**用 `;` 分隔**（因为每个串本身含逗号 `vendor,device`）。事实检查 校它在 `.c/.dts*/.yaml` 出现。
- **forbidden_respected** — 声称遵守的禁止动作。逗号分隔。**不在 事实检查 校**（打分面板的 safety 轴管），仅记录。

## 何时附

- 答案里**引了具体 API / CONFIG / 符号 / compatible** 时一律附。
- 纯概念/风格问题（不引具体符号）可不附——但凡报了具体名字，就该可核对。

## 验证标签（HARNESS-DESIGN §6.10）

- 绑了树跑过 事实检查 → 答案标 `[已对 linux <版本> 验证]`
- 没绑树 → 标 `[未验证 · 无内核树]`，不把未核的当结论。

## 跑法

```bash
node scripts/fact_gate.mjs <答案文件> --tree <内核源码树> [--docs <文档树>]
# exit 0 干净 / 1 有幻觉 / 2 没 [CLAIMS] / 3 检查坏(无树等,不算 fail)
```
