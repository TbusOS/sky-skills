# Do's and Don'ts

> 稳定的内核/BSP 规则。由 `/kernel-learn`（P3 建）随真实任务逐条添加。
> **地基规则（HARNESS-DESIGN §6.7）**：每条规则必须带可执行检查——内嵌 `[CLAIMS]` 子句 +
> 一条建前 fail / 建后 pass 的 eval case + `rules.json` 注册。**无可执行检查不准建条目。**
> 当前为骨架，规则随使用积累。

## 条目格式

```
### DD-NNN: <一句话规则（抽象通用原则，不写具体厂商/路径）>
- since/until/range: <版本区间，无标=版本无关>
- scope/limits: <arch 假设 / "对 RT/PREEMPT 未验证" 等>
- check: <可执行检查：[CLAIMS] grep 子句 或 scripts/checks/<name>>
- linked_eval_case: <KV-xxx>
- provenance: <self-distilled | external>
- fires/catches: <计数，由 evolve-rules 维护>
```

## Do's

（待积累）

## Don'ts

（待积累）

> 注：SKILL.md 的 Forbidden Actions 是常驻硬规矩；本文件是随用积累、带回归证明的细则。
