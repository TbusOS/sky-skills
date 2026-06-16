# BSP Customization Discipline

> 通用工程纪律：对上游内核（及 U-Boot / 其它框架）做厂商/板级定制时的硬规矩。
> 全部 tree-agnostic、无厂商专名。这些是 SKILL Forbidden Actions #6/#8/#9/#10 的展开。

## 1. defconfig 必须走框架原生流程

**绝不手改 `defconfig`。** 依赖链（`select`/`depends on`/`imply`）由 Kconfig 引擎算；手改漏连锁依赖 → 编过但 runtime 静默缺功能。

正规流程：
```bash
make <board>_defconfig
./scripts/kconfig/merge_config.sh -m .config frag.cfg   # 要加的选项放 frag.cfg
make olddefconfig                                        # 引擎跑 select/depends 连锁
make savedefconfig
diff configs/<board>_defconfig defconfig                 # 理解差异再 cp
```

**新增 vendor CONFIG 必须 Kconfig 先行**：先在对应 Kconfig 加 `config VENDOR_XXX`（含 `help` + `depends on` + 必要 `select`），再 merge/menuconfig 开启，最后 savedefconfig 回写。

**savedefconfig 省略某符号 ≠ bug**，分两种查清再动：
- A（是 bug）：符号在 Kconfig 树**无定义**。查：`grep -rn '^\(menu\)\?config XXX\b' <repo>/`——**pattern 必须同时覆盖 `config` 和 `menuconfig`**（两者等价）。无命中才是真缺定义。
- B（正常）：符号值 = Kconfig `default`，savedefconfig 最小化时自然省略，`.config` 里仍取 default，功能照编入。
- 切忌看到省略就惊呼"污染/失效"——先分清 A/B。

## 2. 硬件状态调试必须直接读字节

调硬件状态（寄存器 / OTP / eFuse / flash / sensor flag）**先加打印直接读出字节再下结论**。**禁止**"软件观察 → 推断硬件"的链条——链越长越容易错（中间任一跳的软件 bug 会让结论和硬件脱钩）。

- 硬件字段一律 dump bytes（`readl`/`misc_otp_read`/`regmap_read` 把目标地址前后字段全打出来）。
- 短路退出前（`if (already_done) return;`）先 dump 相关状态，别"看一眼就退、不留证据"。
- 操作前/后各 dump 一次，字节级对比看是否真生效。
- 不可逆操作（烧 OTP/eFuse、写 flash）前必须 dump 基线，操作后对比，零硬证据不下"已生效"结论。
- 推论 ≥2 跳（"A 现象 → B 状态 → C 硬件态"）→ 立刻停下加直接读。

## 3. 上游保留 + 下游宏 gate（不删上游代码）

定制默认**保留上游原码 + 加宏 gate 卡一下**，不删。上游原码是 blame / rebase / merge 的锚点，删一行就和上游永远分家。

```c
#if defined(CONFIG_FROM_UPSTREAM) && !defined(CONFIG_VENDOR_PURPOSE)
/* UPSTREAM_ORIGINAL: 上游原行为 */
...upstream...
#else
...vendor...
#endif
```

宏名三要素：vendor 前缀（`CONFIG_<VENDOR>_`）；名字说"我为什么要控制这里"（说意图不说手段）；在 Kconfig 里 `depends on <上游符号>`。注释标 `UPSTREAM_ORIGINAL` 让审阅者一眼认出上游原码。

只有 4 个极端条件之一才允许真删上游：上游已 deprecate 且影响编译 / 不可共存 ABI 冲突 / 4 维度分析确认删是唯一路径 / 上游 fork 已清除要保持 diff 最小。

## 4. 改动影响 4 维度分析

任何"删/禁某段代码或 config"、"判断某 config/函数是否必须"、"推翻原设计"，必须 4 维度全过，**单维通过不代表可改**：

1. **编译/链接**（最低要求，不是全部）：编过、无链接错
2. **运行时代码路径**：这段在**实际执行路径**上是否被触发、被哪些启动链/业务依赖（要追到调用点 + 数据流）
3. **业务/功能语义**：改动是否改变原含义（能跑 ≠ 功能没变）
4. **认证/合规**：是否影响安全认证 / 合规 / 客户 API 契约

不确定的维度明说"这层需要 X 团队/文档判断，我的技术分析不到"，不替人拍板。

## 5. 冲突解决 6 步（SDK 迁移 / 上游 rebase）

遇编译冲突/文件缺失，先完成分析再动手：

1. **三方对比**（旧 pristine / 定制分支 / 新 pristine）：确认这段是上游原有、定制独有、还是新增
2. **理解新设计意图**：上游为什么改？文件搬了？模块化重构？API 变更？
3. **确认有无定制**：定制分支和旧 pristine 逐行 diff，改过就不能直接删
4. **评估功能完整性**：按新设计改完，旧功能链条还完整吗？文件搬了引用要跟着移
5. **定制 + 新设计冲突时**：不能直接用新版覆盖，要在新架构上重新实现定制逻辑
6. **写分析记录**：编译现象 / 来龙去脉 / 三方对比 / 修复方案 / 风险表 / 影响范围 / 客户 API 影响
