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

### DD-003: 判断一次访存合不合法,先看内存类型,再看开关 —— 顺序反了会把真凶排除掉
- since/until/range: ARMv7-A（ARM DDI 0406C.d）
- scope/limits: 自建页表的早期代码（bootloader / 解压器 / 早期 MMU 初始化）最易踩
- check: `references/arm-memory-model.md` §2；无独立脚本（属推理纪律，不是可扫描的形态）
- linked_eval_case: —
- provenance: self-distilled

  `SCTLR.A=0` 只允许 **Normal memory** 上的非对齐访问（Table A3-1, page A3-106）。
  对 Device / Strongly-ordered，含虚拟化扩展的实现 **always causes an Alignment fault**
  （A3.2.1 Note），不含的是 UNPREDICTABLE —— **两种情况下那次访问都不会正常完成**。

  为什么必错:非对齐访问要拆成两次总线操作才能完成，而 A3.5.7（page A3-135）规定对
  Device / SO **不得改变"有几次访问"** —— 拆分被禁，于是只能 fault。是核心语义推出来的，
  不是额外加的限制。

  **反面推理链**（真实踩过）:代码注释里写「`SCTLR.A` 已清，所以这条非对齐 load 是允许的」
  → 据此把它排除在嫌疑外 → 剩下的候选全是"看起来都该正常"的对齐访问 → 线索断掉。
  而那条 load 恰好落在界外的 SO 区。

### DD-004: 界外内存"能读能写"不能证明访问它安全
- since/until/range: ARMv7-A
- scope/limits: 同 DD-003
- check: `references/arm-memory-model.md` §2、§5
- linked_eval_case: —
- provenance: self-distilled

  被映射成 Strongly-ordered 的区域，AP 位可能仍是全权限 —— **对齐的读写全都成功**，
  只是慢（不缓存、不合并、严格按序）。**唯独非对齐的那次会死**。

  所以"我往那儿写了个图案又读回来，完全正常"这类探针**证明不了**那片内存可以安全使用；
  它只证明了"对齐访问没问题"。设计探针时要让探针的**访问形态**与被怀疑的代码一致。

### DD-005: 产物有差异不等于代码有变化 —— 先分类再下结论
- since/until/range: 版本无关
- scope/limits: 链接期地址会被内容长度推移的产物（zImage、含压缩载荷的镜像、带版本串的镜像）
- check: `scripts/binary_diff_classify.py <A> <B> --limit <未压缩区上界>`
- linked_eval_case: —
- provenance: self-distilled

  改了一处"不该影响功能"的东西（注释、日志文本、版本串），重编后产物却不是逐字节相同 ——
  这时**不能直接判定"改坏了"**，也不能直接判定"没事"。要分类:

  · 差异按 32 位字解码后集中在**一两个 delta** 上、且无长连续差异段 → **地址平移**
    （常见成因:载荷长度变了 N 字节 → 其后所有符号地址 +N → 引用它们的立即数全变）
  · 差异杂乱 / 出现长连续差异段 → **真实内容变化**

  两条纪律:
  1. **比之前先划范围**。压缩区一个字节的差异会雪崩，把未压缩区的信号淹掉。
     用符号（如解压器的 `input_data`）取出未压缩区的上界，只比那一段。
  2. **判定为平移后仍要独立印证**:平移量能否被长度差解释、关键结构量（段大小、镜像大小）
     是否未变、有条件时用运行时打印的地址偏移对一次。静态判据单独不构成证明。
