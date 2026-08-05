# Do's and Don'ts

> 稳定的内核/BSP 规则。由 `/kernel-learn`（P3 建）随真实任务逐条添加。
> **地基规则（HARNESS-DESIGN §6.7）**：每条规则必须带可执行检查——内嵌 `[CLAIMS]` 子句 +
> 一条建前 fail / 建后 pass 的 测试用例 + `rules.json` 注册。**无可执行检查不准建条目。**
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

### DD-001: 不要凭 defconfig 的字面内容断言某选项已启用 —— 写进去 ≠ 生效
- since/until/range: 版本无关（Kconfig 语义一直如此）
- scope/limits: 需要一份该配置真实构建产出的 `.config` 才能判定；只有 defconfig 判不了
- check: `scripts/defconfig_gate.mjs --defconfig <p> --config <.config> --tree <t>`
  （exit 1 = 有声明未生效；`--selftest` 做自降解校准）
- linked_eval_case: —（闸自带 selftest，每类缺陷各种一个必须被抓）
- provenance: self-distilled
- fires/catches: 0/0

  defconfig 里明写 `CONFIG_X=y`，Kconfig 仍可能悄悄丢掉它：符号在本 arch 无定义、
  `depends on` 不满足、或早已被上游删除。三种情况都**不报错、不警告**，defconfig
  读起来一切正常。安全加固类选项（页表隔离、`VMAP_STACK` 之类）最容易这样静默失效。

  **不要用读 `savedefconfig` diff 的方式找它** —— savedefconfig 会重排序并最小化，
  真问题会淹没在几百行排序噪声里。判据必须是「按符号比对、无视顺序」。

### DD-002: `#CONFIG_X is not set` 少一个空格就不是配置，是注释
- since/until/range: 版本无关
- scope/limits: 仅 Kconfig 的 `.config` / defconfig 文件语法
- check: 同 DD-001 的闸，报为 `missing-space`(`#CONFIG_X=v` 这种正常注释掉的行不报)
- linked_eval_case: —
- provenance: self-distilled
- fires/catches: 0/0

  Kconfig 认的「未设置」形式是 `# CONFIG_X is not set`，**`#` 后必须有空格**。
  少了空格就是一条纯注释，被完全无视。这种写法常成批出现（有人一次注释掉一组选项），
  于是**整组都没生效**；而当这些符号的默认值恰好就是想要的值时不会有任何症状 ——
  直到上游改了默认值，问题才在某次升级后突然出现。

> 注：SKILL.md 的 Forbidden Actions 是常驻硬规矩；本文件是随用积累、带回归证明的细则。
