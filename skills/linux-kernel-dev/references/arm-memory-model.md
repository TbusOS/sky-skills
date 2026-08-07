# ARM 内存类型 · 对齐 · 异常入口(ARMv7-A)

> 权威源:**ARM DDI 0406C.d** — *ARM Architecture Reference Manual, ARMv7-A/R edition*。
> 本文每条断言都标了节号 + 页码,可直接回手册复核。
> 建议本机存一份 PDF 并 `pdftotext -layout` 出全文,后续 `grep` 全文即可。

用在哪:诊断"内存明明能读能写,程序却在那儿死掉"的一类故障 —— 尤其是启动早期
自建页表的代码(bootloader、解压器、早期 MMU 初始化),那里权限位一写错就是静默死机。

---

## 1. 三档内存类型 —— 它是行为契约,不是权限

内存类型规定 CPU 对该区域的访问**能不能缓存、能不能合并、能不能提前做、能不能换顺序、
什么时候算完成**。权限(读/写/执行)是另一套位,两者互不替代。

| 行为 | Normal | Device | Strongly-ordered | 出处 |
|---|---|---|---|---|
| `TEX[2:0]/C/B` 编码 | `000/1/1` 等 | `000/0/1` | **`000/0/0`** | Table B3-10, **B3-1363** |
| 可缓存 | 是 | 否 | 否 | 同上 |
| **写何时算完成** | — | **允许在到达目标前完成** | **只有到达目标才算完成** | A3.5.6 |
| 投机数据访问 | 允许 | **不允许** | **不允许** | A3.5.6 |
| 访问次数/顺序/大小 | 实现可自由改 | **不得改变** | **不得改变** | A3.5.7, **A3-135** |
| 非对齐访问 | `SCTLR.A=0` 时允许 | 含虚拟化扩展:**必 Alignment fault** | 同 Device | A3.2.1 Note, **A3-106** |

**Device 与 SO 只差一个 `B` 位,而 B = Bufferable** —— 这正对应"唯一架构强制的差别是
写完成时机"。A3.5.6 原文:

> The **only** architecturally-required difference between Device and Strongly-ordered
> memory is that: A write to Strongly-ordered memory can complete only when it reaches
> the peripheral or memory component accessed by the write; A write to Device memory is
> permitted to complete before it reaches…

⚠ **别按直觉给 Device 和 SO 再排别的差异** —— 缓存、乱序、投机这几项两者没有架构强制差别。

---

## 2. 为什么 SO 上的非对齐访问必然出错

这一步最容易被跳过,而它是很多"看不懂的死机"的根。

**非对齐访问在硬件上做不到"一次完成"**:跨越对齐边界读 4 字节,总线必须拆成两次再拼。
Normal memory 上无所谓 —— 拆几次是硬件自己的事。但 A3.5.7(page A3-135)对 Device / SO
明文规定:

> For any instruction that generates accesses to Device or Strongly-ordered memory,
> implementations **must not change the sequence of accesses** specified by the pseudocode
> of the instruction. This includes not changing: **How many accesses there are.**
> The time order of the accesses… The data size and other properties of each access.

"不得改变有几次访问" ⇒ 拆分被禁 ⇒ 非对齐访问无法完成 ⇒ 报 Alignment fault。
**这不是额外加的限制,是核心语义推出来的。**

### `SCTLR.A` 管不到这里

Table A3-1(page A3-106)给出 `SCTLR.A` 的作用域:`LDR/LDRT/STR/STRT` 做 Word 对齐检查,
`SCTLR.A=0` 时结果是 *Unaligned access*(允许),`=1` 才 *Alignment fault*。
**但整张表的前提是 "unaligned data accesses to Normal memory"。**

紧跟表后的 Note(page A3-106):

> In an implementation that **includes the Virtualization Extensions**, an unaligned access
> to Device or Strongly-ordered memory **always causes an Alignment fault Data Abort exception**.

不含虚拟化扩展的实现则是 UNPREDICTABLE(A3.5.7)。**两种情况下这次访问都不会正常完成。**

> **诊断上的含义**:看到"`SCTLR.A` 已清,所以非对齐是允许的"这种推理,先问一句
> **访问落在哪种内存上**。判断顺序是「先看内存类型,再看开关」,反了就会把真凶排除掉。

### 一个反直觉的推论

同一片 SO 内存上:**对齐访问全都正常**(只是慢:不缓存、不合并、严格按序),
**唯独非对齐的那次会死**。所以"这块内存能读能写"完全不能证明"访问它是安全的"。

---

## 3. 异常入口:Data Abort 那一刻硬件做了什么

ARMv7 把它写成伪代码逐行照做,不留实现自由度 —— **B1.9 `TakeDataAbortException()`,
page B1-1214~1215**:

```
new_lr_value  = if CPSR.T == '1' then PC+4 else PC;
new_spsr_value = CPSR;
vect_offset   = 16;                        // 0x10,Data Abort 向量
  ...
CPSR.M = '10111';                          // Abort mode
SPSR[] = new_spsr_value;
R[14]  = new_lr_value;
CPSR.I = '1';                              // 无条件关 IRQ
if !HaveSecurityExt() || HaveVirtExt() || SCR.NS == '0' || SCR.AW == '1' then
    CPSR.A = '1';                          // 关异步 abort —— 这条是有条件的
CPSR.IT = '00000000';
CPSR.J = '0'; CPSR.T = SCTLR.TE;
CPSR.E = SCTLR.EE;
BranchTo(ExcVectorBase() + vect_offset);   // CPU 继续取指,没有停
```

要点:

- **`CPSR.I ← 1` 是无条件的**,`CPSR.A ← 1` 有条件;`F`(FIQ)位不动
- 所以"中断不响应了"往往是**异常入口造成的**,不是原本就关着
- **CPU 不会停** —— 它跳向量继续取指。故障表现取决于向量表那一页能不能执行
- 向量偏移:Data Abort `0x10` / Prefetch Abort `0x0C`(B1.8 向量表,三列:
  `0x00000010` / `VBAR+0x10` / 高向量 `0xFFFF0010`)

### 静默死机的常见成因:异常向量自己也不可执行

如果代码自建了页表、而向量表所在页在新页表里是 **XN**,那么:

```
出错 → Data Abort → PC ← 向量基址+0x10 → 取指 → XN → Permission fault
     → 经 Prefetch Abort 上报 → PC ← 向量基址+0x0C → 同一页 → 又是 XN → …
```

**原地自触发,永远取不到一条能执行的指令。** 表现:完全静默、无 panic、CPU 满负荷。

`XN=1` 取指的后果见 **B3.7.2 Execute-never restrictions on instruction fetching**:

> When the XN bit is 1, a **Permission fault** is generated if the processor attempts to
> execute an instruction fetched from the corresponding memory region.

⚠ 措辞要分清:**Permission fault 是"原因"**,**Prefetch Abort 是"异常通道"**,不是一回事。

> **排查提示**:自建页表的代码若没有设过自己的 `VBAR`(CP15 `c12,c0`),向量基址就是
> 上一级(bootloader/固件)留下的。它多半不在你新页表映射为可执行的那一小段范围内。
> 这个推理**不依赖知道 VBAR 的确切值** —— 只要可执行窗口足够小,任何现实取值都在窗口外。

---

## 4. arm32 有内核自解压器,arm64 没有 —— 这是协议规定

**不是"arm64 不压缩"**:`arch/arm64/boot/Makefile` 里 `Image.gz` / `Image.lz4` /
`Image.lzma` / `Image.lzo` 都在。差别是**解压归谁管**,上游写进了各自的启动协议。

`Documentation/arch/arm64/booting.rst` 把解压列为 **bootloader 的职责**:

```
1. Setup and initialise the RAM
2. Setup the device tree
3. Decompress the kernel image          ← Requirement: OPTIONAL
4. Call the kernel image
```

> The AArch64 kernel **does not currently provide a decompressor** and therefore requires
> decompression (gzip etc.) **to be performed by the boot loader** if a compressed Image
> target (e.g. Image.gz) is used. For bootloaders that do not implement this requirement,
> the uncompressed Image target is available instead.

`Documentation/arch/arm/booting.rst` 口径正相反 —— 它**假定内核自带解压器**,反过来要求
bootloader 避让:多处交代设备树/initrd 要放在
*"a region of memory where **the kernel decompressor** will not overwrite it"*。

| | arm32 | arm64 |
|---|---|---|
| `arch/<a>/boot/compressed/` | **有** | **无** |
| 谁解压 | 内核自己(zImage = 解压器 + 压缩内核) | bootloader |
| 解压时建临时页表 | **建** —— 权限位写错就静默死机 | 不建 |
| 压缩失败的退路 | — | 直接用未压缩 `Image` |

**arm64 敢不实现的底气**就在那条退路:压缩是可选优化,不是启动必需,所以不必在内核里
养一套只能跑在「无 MMU、无 C 运行时、无 libc」环境里的代码。
*(这句是设计意图推断,依据是协议原文给出的 fallback;上游未单独陈述动机。)*

### EFI zboot 不是反例

arm64 上的 `vmlinuz.efi`(`drivers/firmware/efi/libstub/`)确实是自解压镜像,但机制完全不同:
它在 **EFI 环境**里跑,用 `efi_bs_call(allocate_pages, …)` 向固件要内存
(`libstub/zboot.c`),**不建临时页表,没有"可执行窗口上界"这个概念**。

---

## 5. arm32 解压器的那条界

`arch/arm/boot/compressed/head.S` 的 `__setup_mmu` 建临时页表时,逐个 1 MB section 判断:

```asm
        add     r10, r9, #0x10000000    @ 上游:界 = RAM 起点 + 256MB
        mov     r1, #0x12               @ bit4=XN, bit[1:0]=10 (section)
        orr     r1, r1, #3 << 10        @ AP=0b11 全权限
1:      cmp     r1, r9                  @ 当前 section >= RAM 起点?
        cmphs   r10, r1                 @  且 界 >= 当前 section?
        bic     r1, r1, #0x1c           @ 清 XN(b4) C(b3) B(b2)
        orrlo   r1, r1, #0x10           @ 界外:只置 XN → C=0 B=0 = Strongly-ordered
        orrhs   r1, r1, r6              @ 界内:置 C/B → Normal, Write-Back
        str     r1, [r0], #4
        add     r1, r1, #1048576        @ 下一个 1 MB
```

几个容易踩的点:

1. **界外不是"没映射",是映射成了 SO + XN。** AP 位两侧都是全权限,读写都能成功 ——
   所以"我往那儿写了能读回来"不能证明安全(见 §2 最后那条推论)。
2. **界是按 1 MB section 划的**,不是精确到字节。
3. **解压器会把自己整个搬到解压输出末尾之后**,栈与 malloc 区在搬迁块顶端 ——
   **内核越大,顶端越高**。量余量时要量 **malloc 区的顶**(`sp + heap 大小`),不是 `sp` 本身。
4. 某些 BSP 把这个立即数改成 Kconfig 并**调小**。调小到几十 MB 时,内核长大就会撞上,
   表现为**零日志静默死机**。

### 镜像增量怎么传导到落点(排查"加个驱动就起不来"时要会算)

| 驱动的段 | 进镜像? | 传导方式 |
|---|---|---|
| `.text` / `.rodata` | 是 | 段末尾若按 1 MB 对齐(`CONFIG_DEBUG_ALIGN_RODATA`),**余量内不涨,超出一次涨 1 MB** |
| `.data` | 是 | **线性**,加多少涨多少 |
| **`.bss`** | **否** | **零影响** —— 只占运行时内存,不占镜像字节 |

镜像每涨 1 字节,解压器顶端上移约 `1 + 压缩率` 字节(镜像自身 + 压缩体各涨一份)。
**所以"驱动有多大"和"驱动吃掉多少余量"是两个数**,可能差好几倍 ——
看目录大小、`.ko` 大小、`size` 命令的 total 都会高估。要按段汇总,且只看前三项。

---

## 6. 配套脚本

| 脚本 | 干什么 |
|---|---|
| `scripts/decompressor_limit_check.sh <树>` | 两级判据自动判断该树会不会踩这条界:① 编 arm64 → 不可能踩;② 编 arm32 → 看界是不是被调小。**两边都有/都没有 `configs/vendor` 时会诚实报"未判定"要求 `--arch`,不猜** |
| `scripts/binary_diff_classify.py <A> <B> --limit N` | 两个二进制的差异是**真实代码变化**还是**地址整体平移**。按 32 位字解码统计 delta 分布;`--limit` 用来把比较范围限制在未压缩区(否则压缩载荷的雪崩差异淹没一切)。带 `--self-test` |

两个脚本都以"检查没跑成"和"结论"分开的退出码设计(`3` = 没跑成,不代表结论)。
