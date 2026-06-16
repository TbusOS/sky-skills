# Known Bugs / Gotchas

> 踩过的内核/BSP 坑（gotchas）。由 `/kernel-learn`（P3 建）随真实任务积累。
> 每条带可执行检查 + 配套 eval case（建前 fail / 建后 pass），证明"这坑不再复现"。
> 当前为骨架。

## 条目格式

```
### KB-NNN: <坑的一句话>
- symptom: <表现 / 报错>
- root cause: <真因（抽象到通用原则）>
- fix: <怎么修>
- trigger: <什么关键词/症状该触发本条>
- range: <版本区间，无标=版本无关>
- check: <可执行检查：[CLAIMS] 或 scripts/checks/<name>>
- linked_eval_case: <KV-xxx>
- fires/catches: <由 evolve-rules 维护>
```

## 一行索引（grep 用，先读这里再钻具体条目）

（待积累）

## 条目

（待积累）
