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

### DD-006: 提交前把 diff 当整体看一遍 —— 每一行都要能指回需求
- since/until/range: 版本无关
- scope/limits: 需要能说出"这次被要求改的范围"才能判越界;说不出范围时闸只做其余检查并明示跳过
- check: `scripts/diff_discipline.mjs --diff <patch> --scope '<范围 glob>'`
  （或 `--git <range>`;exit 1 = 有发现;`--selftest` 做自降解校准）
- linked_eval_case: —（闸自带 selftest,每类缺陷各种一个必须被抓,且配一个干净 diff 校准假阳）
- provenance: external（社区流传的 CLAUDE.md,归属未证实,见 `references/change-discipline.md §4`）
- fires/catches: 0/0

  两类问题**逐个 hunk 读 diff 时看不出来**,每个 hunk 单看都合理,只有把 diff 当整体看才暴露:
  改超了范围(顺手改的变量名、重排的 include、重新缩进的一段),和加了没人要的东西。

  判据只有一条:**能不能指出是哪句需求让这一行成为必要的**。理由是"反正我都进来了顺手…"
  就撤掉。四条推论:不该碰的别碰 · 匹配文件既有风格而不是个人偏好 · 只清理自己造成的垃圾
  (本来就有的死代码不是你的事)· 不重排版(重排版会把真改动淹在几百行噪声里)。

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

### DD-007: 改动开始级联时不要闷头改完 —— 停下来说明现状再继续
- since/until/range: 版本无关
- scope/limits: 阈值是启发式(默认 8 文件 / 3 个目录),大重构本来就该超;超了要的是确认不是撤销
- check: `scripts/diff_discipline.mjs` 的 `spread`（`--max-files` / `--max-dirs` 可调）
- linked_eval_case: —
- provenance: external（同 DD-006 出处）
- fires/catches: 0/0

  改一处牵出另一处,那处又牵出下一处;二十分钟后动了 15 个文件,已经说不清最初要干什么。
  **SDK 升级的冲突修复天生是级联的** —— 解开一个冲突点必然带出下一个,最容易一路解到
  一个 commit 里混着三件不相干的事。

  规则不是"不许级联",是**级联到新的一件事就开新 commit**,并且在继续之前把现状说清楚。
  `sdk-migration` / `code-migration-workflow` 里"阶段独立 commit"就是这条的具体落法。

### DD-008: 不要为"以防以后需要"新增旋钮或抽象
- since/until/range: 版本无关
- scope/limits: 只判机器可判的两类(module_param / Kconfig 符号、单调用点的 static 函数);
  臆想式错误处理判不了,要人看
- check: `scripts/diff_discipline.mjs` 的 `speculative-knob`；`lone-wrapper` 需 `--tree`
  数真实调用点（无树时报 undetermined,不猜）
- linked_eval_case: —
- provenance: external（同 DD-006 出处）
- fires/catches: 0/0

  四类形态(内核语境):**过早抽象**(只有一个调用点的 static 包装、只有一个实现的 ops 表)·
  **臆想式错误处理**(对本文件静态函数的入参判空、对刚 `kzalloc` 成功的指针再判一次)·
  **不必要的可配置性**(新增 `module_param`/Kconfig/sysfs 旋钮而那个值不会变)·
  **无用的灵活性**(只被一种硬件用到的 quirk 位图)。

  总判据:**"以防以后需要"不是需求,是对未来的猜测,而猜测通常是错的。**

  **必须配的纠偏**(否则这条会误伤):内核本身就有大量通用框架(regmap / ops 表 / notifier /
  devres)。**用框架已有的抽象是走正路,不是过度设计**;自己在框架旁边再包一层平行抽象才是。
  同理闸报 `speculative-knob` 不是指控,它只要求你答两个问题:谁会去设它?设错了会怎样?
  答得上就留着。

  另一半是**抽象的时机**:重复远比错误的抽象便宜。两颗料的驱动只差三个寄存器就急着抽公共层,
  等第三颗料来了哪条都不符合,拆回去比当初不抽还贵。第二份重复时不动,第三份出现再看共性。

### DD-009: 不要把难以撤销的选择埋在 diff 里不标注
- since/until/range: 版本无关
- scope/limits: 属推理纪律,不是可扫描的形态(判不了"这算不算一个决策"),无独立脚本
- check: `references/change-discipline.md §3.2`；接口面的影响枚举走 `scripts/check_api_change.sh`
- linked_eval_case: —
- provenance: external（同 DD-006 出处）
- fires/catches: 0/0

  sysfs 节点名、DT binding 属性名、ioctl 号、进 UAPI 的结构体布局 —— **一旦有用户就改不动了**。
  这类东西在 diff 里往往只是一行,代价却是永久的,而且看 diff 的人未必意识到自己正在
  批准一个不可逆的决定。

  规则:这类改动的 commit message 要写成"**我选了 A,没选 B,因为 X**",不是只写"新增 xxx 属性" ——
  让评审的人有机会在它固化之前反对。与 Forbidden Actions §4(UAPI)、§10(改动 4 维度)、
  `api-contract-change.md` 是同一件事的不同侧面。

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
