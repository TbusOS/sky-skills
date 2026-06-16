# Kernel Version Deltas

> 跨内核版本的 API/行为差异。**版本敏感知识集中在这里**（SKILL §6.9）。
> 每条带版本区间，且必须**按目标树用 事实检查 核实**——不靠记忆。
> 候选条目由 `version_drift.mjs`（P4 建）对多版本树跑出来后，经回归测试入库。

## 条目格式

```
### <简述>
- range: <如 6.4+ / 6.1..6.7 / -6.3>
- 现象: <什么变了>
- 处理: <按版本怎么写>
- last_validated_against: <版本>  （信任衰减用）
- linked_eval_case: <KV-xxx>
```

## 稳定核 vs 版本易变面（提醒）

- **稳定核**（不打版本标、永远成立）：编码风格、goto 清理、`-errno`、devm_ 优先、锁上下文规则、并发语义、patch 流程。
- **版本易变面**（本文件管）：API 签名/参数个数、头文件、CONFIG 名、宏、子系统重构。

## 种子候选（⚠ 待 事实检查 按目标树核，未经核实勿当结论）

> 下列是常被提到的版本敏感点，**P1 事实检查 建好后逐条对真树验证**再转正式条目。现仅作待核清单。

- `class_create()` 参数个数在 6.4 前后有变 —— `[待核]`
- `platform_driver` 的 `remove` / `remove_new` 迁移 —— `[待核]`
- `ion_alloc()` 被移除、改 `dma_heap_buffer_alloc()` —— `[待核]`
- folio API 引入对页缓存/驱动的影响 —— `[待核]`
- 16KB page 相关 CONFIG/对齐要求 —— `[待核]`

（正式条目须去掉 `[待核]`、补 range + last_validated_against + linked_eval_case。）
