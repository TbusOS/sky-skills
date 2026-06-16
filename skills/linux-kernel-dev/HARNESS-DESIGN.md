# linux-kernel-dev 进化引擎 · 设计文档

> **状态:** DRAFT — 待用户过一遍再开建
> **日期:** 2026-06-16
> **目标技能:** `skills/linux-kernel-dev`
> **同构参照:** sky-skills 现有 design harness（design-review / design-evolve / multi-critic / design-learner）

---

## 0. 一句话

把 `linux-kernel-dev` 从一份静态文档，改造成一个**越用越聪明**的 kernel/BSP 专家：每次真任务沉成一条 测试用例，每个踩过的坑沉成一条**带回归证明**的规则，技能内容只在「通过冻结测试用例集且不退步」时才升级。并且**跟着内核版本自更新**——版本敏感的知识带版本标、按目标版本树自动验证、版本变化由 drift 检测器机器报出来，不靠手维护（见 §6.9）。机制跟 sky-skills 已有的 design harness 同构，能复用的现成代码就复用。

---

## 术语表（大白话）

| 词 | 大白话 | 内核里的例子 |
|---|---|---|
| **检查 (gate)** | 必须通过的检查，过不了就拦下 | `checkpatch.pl` 报 error 就不让过——它就是一道检查。本套三项检查：checkpatch(风格) / 事实检查(引的 API/CONFIG 在真树查得到吗) / 编译(模块能 make 过吗) |
| **记录表 (ledger)** | 一个流水记录文件(表格 .tsv) | 每次改完测完记一行："改了啥 / 分数 86→89 / 留下还是撤销" |
| **回归测试** | 改一次跑一次回归、不退步才保留 | 改动只有"修好≥1 个错且没搞坏别的"才留下，否则 `git revert`。质量只涨不跌 |
| **critic (打分员)** | 当评审的 LLM，给答案按角度打分 | 4 角度：对不对 / 风格 / 安全 / 完整 |
| **测试用例集 / 测试用例集** | 固定测试题 + 标准答案 | 量"skill 改完变好还是变坏" |
| **红线用例** | 碰了就单独报警的测试题 | "绝不能碰禁止路径"，单独算分，不被平均盖过 |
| **fires / catches** | 规则被触发几次 / 真逮到错几次 | 老触发从没逮到错的规则 = 没用，该删 |
| **baseline (基线)** | 改动前的成绩快照 | 改完跟它比，看有没有退步 |
| **冻结 (frozen)** | 固定不变的那份 | 测试用例集和检查在改 skill 内容时不动，否则没法公平比较 |
| **`[CLAIMS]` 块** | 答案末尾列出可被机器核对的断言 | 列出引的 API / CONFIG / 符号，给 事实检查 当核对靶子 |

> **一句话串起来：** 每改一次 kernel skill 内容，就拿固定测试用例集跑三项检查 + 打分员；改动只有"修好了错又没搞坏别的"才留下（回归测试），全程记进记录表——这样它只会越来越准。

---

## 1. 目标与范围

| 维度 | 内容 |
|---|---|
| **要做** | 优化 `skills/linux-kernel-dev`，给它配一套有度量的自我改进机制 |
| **改动范围** | 只在 `skills/linux-kernel-dev/` 下（SKILL.md 重构 + 新增 `references/` `scripts/` `tests/` `evolution/` + `known-bugs.md` / `dos-and-donts.md`） |
| **复用** | design harness 里**领域无关**的机制（ledger / rules / regression-gate / multi-critic 范式） |
| **绝不碰** | Android-Software 仓、design 系列技能、其它 sky-skills 技能 |
| **硬约束** | 通用（无厂商/SoC 专名）· 优先 kernel/BSP · commit 无 Claude 署名 · 不用 /tmp（临时产物落 `.scratch/`） |

---

## 2. 现状与差距

`linux-kernel-dev` 当前 = 643 行单个 `SKILL.md`，无任何子目录。

| 它有 | 它缺 | 为什么这挡住"变聪明" |
|---|---|---|
| 编码风格、driver/module/chardev 模板、Makefile/Kconfig/DT 模板、调试速查、并发表、checkpatch、patch 流程、API 速查 | **Forbidden Actions** 显式硬规则 | 没有"红线"可被 critic / gate 检查 |
| — | **memory**（gotchas / known-bugs） | 踩过的坑无处累积，下次重犯 |
| — | **scripts**（可执行检查） | 答案对不对全靠人眼，不可度量 |
| — | **测试用例集 + 回归** | 改了内容不知道是进步还是退步 |
| — | **版本跟踪**（6.1/6.6/6.12 delta） | 知识会过期且无人标记 |

根因：**它是静态文档，没有可累积的落点，也没有度量**。这两样不补，加再多内容也只是更长的文档，不会"越用越聪明"。

---

## 3. 借鉴源

### 3.1 Android-Software 仓（借机制，不改它）

| 它的机制 | 对 linux-kernel-dev 怎么用 | 取舍 |
|---|---|---|
| **Forbidden Actions** 清单 | kernel 硬规则一大堆：不浮点、spinlock 里不睡、atomic 里不 GFP_KERNEL、不用非稳定符号、不破 UAPI、defconfig 不手改… | **强用** |
| **被度量的 hindsight 笔记** | 变成 `known-bugs.md`，每条带 fires/catches | **强用** |
| **dirty_pages 版本新鲜度** | kernel 版本 delta + 失效标记 | **用** |
| **scripts/ 自动化** | checkpatch 包装、Kconfig 依赖/savedefconfig 检查、API/符号实存校验 | **强用** |
| **routing_accuracy 测试用例集** | 变成 kernel 任务 测试用例集 + ground truth | **强用** |
| **references/ 渐进披露** | 把 643 行拆成按需加载的深潜文档 | **用** |
| **拿真源码树做事实校验** | 事实检查 vs 真 kernel 树（树无关 `--tree`） | **强用** |
| L1/L2/L3 路由、cross_skill_triggers、MMU 框架 | 单技能不需要路由编排 | 不用 |

一句话：Android-Software 证明了"kernel 知识技能不该是静态文档"——该有 forbidden actions + 可度量记忆 + 测试 + 脚本 + 版本跟踪。

### 3.2 ai-doc 论文（借自我进化循环）

精读 18 篇后的可用思维（完整综合见 **附录 A**）。**地基规则（4 篇独立收敛）**：

> **没有可执行检查，就不准建笔记。** 每条 gotcha 必须原子地带上 ① 可 grep 的 `[CLAIMS]` ② 一条"建前 fail / 建后 pass"的冻结 测试用例 ③ rules 注册。缺一个就拒绝。

这条直接修掉"笔记写完没人验证它真防住复发"的开环问题。其余高价值条目：

| # | 思维 | 落点 | 工作量 |
|---|---|---|---|
| 1 | 原子三件套（地基规则） | 自动学习 | M |
| 2 | fires/catches + Laplace `s=(c_succ+1)/(c_use+2)` + leave-one-out 消融 prune；git-revert 是默认 | ledger | M（design-evolve 已有，搬） |
| 3 | 能力红线用例 case 单独门 + objective/subjective 标签，keep/revert 只看 objective 半 | 测试用例集 | **S** |
| 4 | gotcha 蒸成抽象通用原则（具体路径只留 must-cite）+ 建前去重 + 邻域 case | 自动学习 | M |
| 5 | 答题走有界多轮自纠，gate 失败原样喂回；只在 fail→pass 翻转时落笔记 | 事实检查 | M（推后） |
| 6 | router 按召回评分 + 不确定门 | router | 单技能基本不适用 |
| 7 | 生成式 self_model.json + strategies.json 学习策略菜单 | other | L（推后） |
| 8 | 写侧 index.md + 追加式 log.md + lint + 测试用例集通过率主指标曲线 | memory | M |

**判定无用**（只印证纪律、无可搬机制）：TurboQuant、FlashMoE、MoE-offload、autoresearch blog、MemGPT、SPIN。inference-optimization 整类对"知识技能怎么变聪明"几乎不相关。

### 3.3 外部真实源（开发期只读 · 路径绝不进 committed skill）

skill 内容**对齐这些真源写，不靠记忆**（合 CLAUDE.md 文档查证规则）。skill 本身保持树无关。**具体路径放本机配置**（`~/.config/linux-kernel-dev/trees.json`，§6.10）或 `.scratch/`，**绝不入库**（公开仓不留内部路径/用户名）。

| 源（路径不入库） | 是什么 | 在引擎里当什么 |
|---|---|---|
| **源码树**（`--tree`） | 一棵 6.x 内核源码树 + bootloader（自带 checkpatch.pl） | **事实检查 源码靶子**：查 API/符号/CONFIG/compatible **实存**；跑 checkpatch；（可选）真编译 out-of-tree 模块 |
| **文档树**（`--docs`） | mainline 内核文档树（如 7.0，`Documentation/*.rst`） | **内容权威源**：写 `references/` 时对齐 `coding-style.rst` / `submitting-patches.rst` / `devicetree/bindings/writing-{bindings,schema}.rst` / `kbuild/{kconfig-language,makefiles}.rst` / `locking/` / `memory-barriers.txt` / `atomic_t.txt` 等；**约定类 fact-check 的靶子**；**测试用例种子源** |
| **进化实现仓** | darwin / nuwa / autoresearch(-skill) | 进化机制素材（见附录 B） |

**两类 fact-check 分工**：① 实存类（符号/CONFIG/compatible 在不在）→ 查 **源码树**；② 约定类（coding-style 规则、DT binding 要求对不对）→ 查 **文档树**。源码树与文档树版本可不同（源码用某 BSP 树、文档用 mainline）是有意的：源码树验"引的东西在某真实树里存在"，文档树验"教的规则符合上游约定"。

---

## 4. 架构：kernel harness = design harness 同构映射

| design harness | kernel harness（本设计） | 复用/新建 |
|---|---|---|
| 5 个生成器技能 | linux-kernel-dev 本身（被改进的技能；"生成器"= agent 用此技能答 kernel 任务） | — |
| canonical 页面测试用例集 | 测试用例集：kernel/BSP 任务 case | 新建 |
| `verify.py`（结构检查） | **`checkpatch.pl` 包装**（kernel 树自带，可 `--no-tree` 独立跑） | 新建薄包装 |
| `visual-audit.mjs`（启发式渲染检查） | **事实检查**：引的 API/CONFIG/符号在真树存在 + 可选**编译检查** | 新建 |
| `multi-critic.mjs`（4 加权 LLM） | kernel 打分面板：correctness / coding-style / safety / completeness | 照 `multi-critic.mjs` 改 |
| `design-critic` 裁决 | accept/reject kernel 答案 | 照搬 |
| `references/dos-and-donts.md`（学到的规则） | `linux-kernel-dev/dos-and-donts.md` + `known-bugs.md` | 新建 |
| `design-learner`（learning-loop） | `/kernel-learn`：catch → 规则 + 测试用例 + 注册 | 照 agent 改 |
| `design-evolve`（回归测试） | kernel 回归测试：keep/revert 内容改动 vs 冻结测试用例集 | 复用机制 |
| `evolution/{ledger.tsv, rules.json, regression-baseline}` | 同格式，kernel 实例 | 复用格式 |
| `evolve-ledger.mjs` / `evolve-rules.mjs` / `regression-gate.mjs` | 领域无关，**优先直接复用**（指向 kernel 数据目录）；若太 design 专用则薄 fork | 建时确认 |

**kernel 比 design 的优势**：checkpatch.pl / 编译 / API 实存都是现成确定性硬检查，比 design 的 visual-audit 启发式更硬。

---

## 5. 完整循环（"越用越聪明"的过程）

```
真做一个 kernel/BSP 任务
  → agent 用 linux-kernel-dev 答，答案带 [CLAIMS] 块（引的 API / CONFIG / 符号 / compatible）
  → checkpatch 检查（coding-style，确定性）
  → 事实检查（CLAIMS vs 真 kernel 树 grep）→ 客观 pass/fail（0 幻觉 = 过）
  → 打分面板（correctness / coding-style / safety / completeness）→ 加权分
  → 踩坑 / critic 抓到问题
  → /kernel-learn：原子落 ① known-bug/dos-donts 规则（带 [CLAIMS]）② fail→pass 测试用例 ③ rules 注册
  → 回归测试脚本 跑全测试用例集：新内容不让旧 case 退步 + 修好新 case → keep 进 ledger；否则 git-revert
  → 下次同类坑：测试用例 证明不复现；规则 catch +1；高 fires 零 catch → 消融 prune
```

度量"是否真的越用越聪明" = **测试用例集通过率随 commit 的曲线**（主指标，论文 #8）。

---

## 6. 组件规格

### 6.1 答案契约 `[CLAIMS]`（地基）

agent 答 kernel 任务时，末尾吐一个机器可解析块，列出**可被客观校验**的断言：

```
[CLAIMS]
api:      devm_kzalloc, platform_get_irq, devm_request_irq
config:   CONFIG_OF, CONFIG_REGMAP_MMIO
symbol:   regmap_read
compatible: vendor,generic-device     # 通用占位，不写真厂商
forbidden_respected: no-sleep-in-spinlock, no-gfp-kernel-in-atomic
[/CLAIMS]
```

没有 `[CLAIMS]` 块 = 红线用例 fail。这是 事实检查 和 critic 的靶子。

### 6.2 事实检查（`scripts/fact_gate.mjs`，树无关）

- 输入：一段答案（取其 `[CLAIMS]`）+ `--tree <源码树>`（实存校验）+ `--docs <Documentation 树>`（约定校验）；两路径都不内置
- 实存校验（靶子 = 绑定的源码树）：
  - `api` / `symbol`：在树里 grep 到定义/导出（`EXPORT_SYMBOL` / 函数原型）
  - `config`：grep `^\(menu\)\?config XXX\b` —— **必须同时覆盖 `config` 和 `menuconfig`**（CLAUDE.md 硬规则）
  - `compatible`：在某 driver 的 `of_match_table` 出现
- 约定校验（靶子 = Documentation 树）：答案声称的规则/约定能在对应 .rst 找到依据（如 coding-style、DT binding required 字段）
- 输出：每条 pass/fail + 汇总。任一幻觉 = gate fail。
- 降级：缺 `--tree` 时退到打包的"稳定 API 快照"弱校验；缺 `--docs` 时约定校验跳过并标记。

### 6.3 checkpatch / compile 检查（`scripts/checkpatch_gate.sh` / `compile_gate.sh`）

- checkpatch：包装 `checkpatch.pl --no-tree --strict`，对答案里的代码块/patch 跑，error/warn 计数。
- compile（可选、需树）：out-of-tree 模块能不能 `make -C <KDIR> M=<tmp> modules` 过。临时目录走 `.scratch/`。

### 6.4 测试用例集（`tests/eval/cases/*.json`，冻结）

一条 case：

```json
{
  "id": "KV-001",
  "q": "给一个 MMIO 外设写 platform driver 的 probe，要做资源映射和中断申请",
  "must_cite": { "api": ["devm_platform_ioremap_resource", "platform_get_irq"] },
  "forbidden": ["manual-iounmap-with-devm", "request_irq-without-free"],
  "kind": "objective",                 // objective(gate可判) | subjective(critic判)
  "canary": false,                     // 红线用例:单独门,不进均分
  "rubric": "用 devm_ 托管;goto 清理顺序正确;返回 -errno"
}
```

要点（论文 #3）：
- 每条标 `objective` / `subjective`；**keep/revert 只看 objective 半**，critic movement 仅供参考。
- **红线用例 case 单独门**（如"必须吐合法 [CLAIMS]"/"绝不碰禁止路径"），不被均分抹平。
- 只收**有区分度**的 case（所有版本都轻松过的丢掉），保持测试用例集小而锐。

### 6.5 打分面板（`scripts/kernel-critic.mjs` + critic agent 类型）

4 个加权 LLM 专家，各有**输入契约**（论文）：

| 轴 | 读什么 | 看什么 |
|---|---|---|
| correctness | `[CLAIMS]` + gate 结果 | 解法对不对、API 用法对不对 |
| coding-style | 代码块 + checkpatch 结果 | tab/80列/注释风格/SPDX/devm_ |
| safety | Forbidden Actions | 并发(睡眠上下文)、内存、UAPI、KMI、锁 |
| completeness | 题目 + 答案 | 错误处理全不全、清理顺序、是否漏 handoff |

不重判 gate 已经定死的事实（省 token，论文 #3）。

### 6.6 记录表 + 回归测试（复用 design-evolve 机制）

- 每次内容改动 = 一个 experiment：lock baseline → 改 → 跑测试用例集 → **keep iff 修好 ≥1 失败 case 且 0 退步，否则 git-revert（默认结局）**
- 每条规则带 `c_use` / `c_succ` / `last_fired`，`s=(c_succ+1)/(c_use+2)`（Laplace，design-evolve 已实现）
- 周期 **leave-one-out 消融**：逐条停用规则重跑测试用例集，零边际贡献（高 fires 零 catch）→ prune（archive 不删）
- 数据落 `skills/linux-kernel-dev/evolution/{ledger.tsv, rules.json, regression-baseline.json}`

### 6.7 `/kernel-learn`（地基规则 · 原子三件套）

解完一个坑后，**一次事务**产出且自校验：

1. 一条规则（写进 `known-bugs.md` 或 `dos-and-donts.md`，**内嵌 `[CLAIMS]`**）
2. 一条 测试用例，跑 事实检查 **建前 fail / 建后 pass**，不翻转就**拒绝建笔记**
3. `rules.json` 注册（带 front-matter：purpose / trigger / expected-cite / forbidden / linked-case-id / provenance / fires / catches）

外加（论文 #4）：规则强制蒸成**抽象通用原则**（具体路径只活在 case 的 must-cite，保证通用）；建前**语义去重**（改述已有规则就合并不新建）；自动生成 **1-3 条邻域 case**（换 kernel 版本 / 邻近子系统 / 另一个 CONFIG），每条过 gate 才入库。

### 6.8 memory

- `known-bugs.md`：kernel gotchas（一行 grep 索引 + 完整体两层）
- `dos-and-donts.md`：稳定规则（同 design 技能结构）
- `references/kernel_version_deltas.md`：6.1 / 6.6 / 6.12 API/行为变化 + 失效标记（dirty-pages 类比）
- `index.md` + 追加式 `log.md`（论文 #8，写侧）

---

## 6.9 版本适配 / 自更新（核心能力 · 贯穿多组件）

> 内核版本会变（API 签名、头文件、CONFIG、子系统重构）。skill 不能一成不变——要带版本标、按目标版本验、版本变化机器报出来。

**原则：稳定核 vs 版本易变面 分离**（别让版本变动污染稳定核）

| | 版本稳定核（占大头，不打版本标，永远教） | 版本易变面（打版本标 + 按目标版本过 事实检查） |
|---|---|---|
| 例子 | 编码风格、goto 清理、`-errno`、devm_ 优先、锁上下文规则、并发原语语义、patch 流程 | API 签名/参数个数、头文件、CONFIG 名、宏、子系统重构（`class_create()` 参数、folio、`remove`→`remove_new`、`ion_alloc`→`dma_heap`） |

- **知识带版本元数据**：dos-and-donts / known-bugs / references 的版本敏感条目带 `since:` / `until:` / `range:`（如 `since: 6.4`）。无标 = 版本无关。
- **事实检查 多版本**：事实检查 本就树无关（`--tree`）。同一套测试用例集**跑多棵版本树**：一条 claim 在 6.1 过、6.12 fail → 它版本敏感、自动该打标；测试用例 带 `valid_versions`，gate 挑匹配的树跑。
- **drift 检测器** `scripts/version_drift.mjs --tree <新版本树>`（把 dirty_pages 变成机器可执行）：重跑版本敏感 claim/case，报告哪些 失效（API 移了/改了/没了）→ 喂给 `/kernel-learn` 生成版本条件更新，过回归测试。
- **自更新循环（版本维度）**：
  ```
  出新内核版本 / 换目标 BSP 版本
    → 拿它的树跑 version_drift.mjs → 报告 失效 的版本敏感知识
    → /kernel-learn 逐条：生成版本条件规则 + 多版本 测试用例（旧版仍 pass + 新版也 pass）
    → 回归测试：跑全版本树测试用例集，任何版本退步则 revert，全过才 keep
    → 记录表记"适配到 6.X"
  ```
- **信任衰减**（借 MemoryBank）：每条带 `last_validated_against: <version>`，目标树版本不同 → 降信任、强制重验后才引用。
- **度量加一维：跨版本通过率**（同测试用例集在 6.1/6.6/6.12/7.0 各自通过率），证明真适配多版本而非只在一个版本对。
- **前提**：多棵版本树当 `--tree`（见 §6.10 内核树绑定）。树只读、路径不进 committed skill。

---

## 6.10 内核树绑定（开源分发 · 让能力变强的关键）

> 矛盾：skill 开源，但最强能力（事实检查 / 约定校验 / 编译 / 版本适配）都要真内核树。别人装了没树。

**原则**：skill 不绑死任何路径；树是**用户机器上的 per-machine 配置**，绝不进 committed skill。这样开源干净，且每个用户绑自己的树后答案是为他的内核定制的。

**树发现顺序**（检查脚本解析 `--tree` 的优先级）：
```
1) --tree <path>                       命令行，最高优先
2) 环境变量 KERNELDEV_TREE / KDIR
3) 配置 ~/.config/linux-kernel-dev/trees.json
4) 从 CWD 往上走认内核树            Makefile 有 VERSION+PATCHLEVEL+SUBLEVEL
                                       + 有 Documentation/ + scripts/checkpatch.pl
5) 常见位置 /lib/modules/$(uname -r)/build, /usr/src/linux*
6) 都没有 → 降级 + 一次性提示
```
在树里干活的人第 4 条直接命中，**零配置**。

**没树时提示下载**（给确切命令）：
```
事实检查 需要内核源码树，当前没绑。
  · 绑已有的：  kernel-tree add /path/to/linux
  · 浅克隆(约1.3GB)：git clone --depth 1 -b v6.12 \
       https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git
  · 或不验证继续（纯模型知识，答案标 [未验证]）
```

**诚实降级 + 验证标签**（这就是"链接后能力更强"的回报）：
- 绑了树：答案标 `[已对 linux 6.12.x 验证]`，checkpatch 用其树的 `scripts/checkpatch.pl`，约定校验读其 `Documentation/`，版本适配按其版本驱动
- 没绑树：答案标 `[未验证 · 无内核树]`，退回静态参考 + 模型知识

**配置文件**支持多棵树（直接喂 §6.9 版本适配）：
```json
{ "trees": [
    {"version": "6.1",  "path": "/path/to/linux-6.1"},
    {"version": "6.12", "path": "/path/to/linux-6.12"} ],
  "default": "6.12" }
```

**`/kernel-tree` 命令**：`detect`（扫描报告找到的树+版本）/ `add <path>` / `list` / `clone <version>`（浅克隆封装）。写 `~/.config/linux-kernel-dev/trees.json`。

> 注意：Documentation/ 是内核树内子目录，所以"一棵内核树"同时满足实存校验（符号/CONFIG）、约定校验（Documentation）、checkpatch、编译四样，不用分别准备。

---

## 7. 通用 BSP 纪律内容（`references/bsp_discipline.md`，脱敏）

把 CLAUDE.md 那批硬规则抽成**通用**章节（去厂商/任务编号/内部路径）：

1. **defconfig 必须走框架原生流程**：Kconfig-first、`merge_config.sh` + `savedefconfig`，不手改 defconfig；savedefconfig 省略符号要先分清 A(无定义=bug)/B(等于 default=正常)
2. **硬件状态调试必须直接读字节**：禁"软件观察→推断硬件"链；短路退出前先 dump 相关寄存器/OTP/eFuse
3. **上游保留 + 下游宏 gate**：默认不删上游代码，加 `#if defined(CONFIG_<VENDOR>_<PURPOSE>)` + `RK_ORIGINAL` 类注释
4. **改动 4 维度分析**：编译 / 运行时代码路径 / 业务语义 / 认证合规，单维通过不等于可改
5. **冲突解决 6 步**：三方对比 → 理解新设计意图 → 确认定制 → 评估功能完整 → 重新实现 → 写分析记录

这些本身是通用工程纪律，脱敏后正好合 CLAUDE.md 的脱敏要求。

---

## 8. 复用 vs 新建（文件清单）

| 复用现成（design harness） | 新建（linux-kernel-dev 下） |
|---|---|
| `evolve-ledger.mjs`（指向 kernel ledger） | `scripts/fact_gate.mjs` |
| `evolve-rules.mjs`（指向 kernel rules） | `scripts/checkpatch_gate.sh` |
| `regression-gate.mjs`（指向 kernel baseline） | `scripts/compile_gate.sh`（可选） |
| `multi-critic.mjs` 范式 | `scripts/kernel-critic.mjs` + 4 个 critic agent |
| ledger.tsv / rules.json 格式 | `tests/eval/cases/*.json` |
| `design-learner` agent 范式 | `/kernel-learn` 命令 + agent |
| | `references/`（拆分深潜 + bsp_discipline + version_deltas）|
| | `known-bugs.md` / `dos-and-donts.md` / `index.md` / `log.md` |
| | `evolution/{ledger.tsv, rules.json, regression-baseline.json}` |

**复用边界（已读脚本确认，2026-06-16）：**

| 脚本 | 结论 | 依据 |
|---|---|---|
| `evolve-ledger.mjs` | **直接用 as-is** | 有 `--ledger=<path>` 覆盖；字段 skill/page/axis/base/new/decision 改义即用（skill=linux-kernel-dev、page=case-id、axis=correctness/safety…） |
| `evolve-rules.mjs` | **小补丁(~10 行)** | `REGISTRY` 写死且无 `--registry=` 覆盖；`--surface` 只收 `dos\|known-bug\|visual-audit`。加 `--registry=` 覆盖 + 放行 kernel surface 名即可。`--report`(打分+prune)/`--lint`(去重+死规则)已现成 |
| `regression-gate.mjs` | **照骨架重写一份 kernel 版脚本(~144 行)** | 检查引擎写死 `visual-audit.mjs`(line 33)、测试对象发现写死 `skills/${skill}-design/references/canonical`(line 61)——都设计专属。控制流(记基线→重跑→退步即 fail)照抄，只换两处:检查 visual-audit → checkpatch+事实检查；发现 网页 → eval-case |

---

## 9. 建法（9 步，带依赖序）

| 步 | 做什么 | 产物 | 前置 |
|---|---|---|---|
| 1 | linux-kernel-dev 结构化：SKILL.md 瘦身、拆 `references/`、加 **Forbidden Actions**、建 `dos-and-donts.md`/`known-bugs.md`/`index.md` 骨架 | 多文件技能 | — |
| 2 | 写 `references/bsp_discipline.md`（脱敏的通用 BSP 纪律）+ `kernel_version_deltas.md` | BSP 内容 | 1 |
| 3 | `[CLAIMS]` 答案契约写进 SKILL.md + `fact_gate.mjs` + `checkpatch_gate.sh` | 客观检查 | 1 |
| 4 | 测试用例集种子（通用 kernel/BSP 任务 + 红线用例）+ objective/subjective 标签 | `tests/eval/` | 3 |
| 5 | 回归测试脚本 + 基线（复用 regression-gate） | baseline | 4 |
| 6 | kernel 打分面板（4 轴） | critic | 4 |
| 7 | `/kernel-learn` 原子三件套 + 抽象去重 + 邻域 case | 命令 | 3,4,5 |
| 8 | ledger/rules：fires/catches + Laplace + 消融 prune（复用 evolve-ledger/rules） | 回归测试 | 5,7 |
| 9 | （推后）多轮自纠 §6.5、metacognitive self_model、写侧 log 主指标曲线 | — | 8 |

步 1-2 是引擎能咬住东西的最小结构（现在单文件，回归测试没有可把关的对象）。

**阶段分组（每段一个可演示里程碑）：**

| 阶段 | = 步 + 防护项 | 做完能演示 |
|---|---|---|
| **P0 结构化** | 步1-2 | skill 变结构化，零引擎也有用 |
| **P1 客观检查** ⭐ | 步3 + §6.10 树绑定 + 防护#3 | 事实检查 对真树抓幻觉（地基规则，最大单点跃升） |
| **P2 测试用例集+回归测试** | 步4-5 + 防护#1#2 | 通过率数字 + 坏改动自动 revert |
| **P3 critic+学习** | 步6-7 + 防护#7#8#10 | 解坑 → 自动产笔记+fail→pass case |
| **P4 记录表+版本适配** | 步8 + §6.9 + 防护#4#5#6#9 | 跨版本通过率曲线 + drift 报告 |
| **P5 推后** | 多轮自纠/metacognitive/coccinelle/路由limits | — |

顺序：先 P0（回归测试的前提，且单独有用）→ P1（事实检查，演示价值最高）→ P2…。

---

## 10. 通用化与脱敏 checklist（发布/commit 前）

- [ ] 全文/代码/注释 0 厂商专名、0 SoC 型号、0 任务编号、0 内部路径
- [ ] 禁用词清单 0 命中（矩阵/闭环/赋能/抓手… 见 CLAUDE.md）
- [ ] 测试用例 用通用占位 compatible/CONFIG，不绑真 SDK
- [ ] commit message 无 Claude 署名
- [ ] 临时产物在 `.scratch/`，不在 /tmp

---

## 11. 推后 / 开放问题

- 多轮自纠循环（论文 #5）：答题包成 ~3 轮，gate 失败喂回——推到引擎主体跑通后。
- metacognitive `self_model.json` + `strategies.json`（论文 #7，effort L）：测试用例集/规则规模大了再上。
- 编译检查要真 kernel 树 + 工具链，较重；先上 checkpatch + 事实检查，编译检查按需。
- ~~复用脚本是否需薄 fork~~ **已确认**（见 §8 复用边界表）：ledger 直接用、rules 小补丁、regression-gate 照骨架重写一份 kernel 版脚本。

**开发期测试树（不进 committed skill）：** `kernel-6.1`(Linux 6.1.141) + `u-boot`，自带 checkpatch.pl，开发时拿它当 `--tree` 跑 事实检查 / checkpatch / 编译检查。skill 保持树无关，该路径只在测试命令 / `.scratch/` 出现，对树只读。

---

## 12. GitHub Pages 展示计划

**时机：P1（事实检查 能跑）之后才开始做**——页里放真跑的 事实检查 抓幻觉，不做 画大饼（诚实状态，呼应"建好≠跑过"教训）。**3 页**，跟现有 `docs/HARNESS-ROADMAP.html`（design harness）平行——sky-skills 就有了 design + kernel 两个 harness，`index.html` 加链接。全部按团队标准：`anthropic-design` skill + 过三项检查（verify / visual-audit / screenshot）+ 通用脱敏（无厂商名、无内部路径）。

| 页 | 内容 | 何时做 |
|---|---|---|
| **架构页** | 它是什么、完整循环图、为什么越用越聪明、引擎组件、与 design harness 同构 | P1 后 |
| **能力页** | 三项检查实跑、打分面板、`/kernel-learn`、真实指标（通过率 / 记录表） | P2-P3 后（有真数据再放，不放假图） |
| **版本适配页** | 稳定核 vs 易变面、多版本树、drift 检测、跨版本通过率曲线、内核树绑定 | P4 后 |

---

## 附录 A：ai-doc 18 篇论文综合（run wf_57d9bafa-152）

### A.1 按引擎组件归类的可借思维

- **事实检查**：失败 grep 输出原样喂回下一轮（RISE）；自动学习 产的邻域 case 入库前先过 gate，防伪造 case 污染测试用例集（Test-Time SI）；自报"正确"在 grep 确认前都算未验证（MemGPT）；grep 靶子收窄到当前子系统 path-scope，更快且少误配（MoE-offload）；先跑确定性 gate，critic 只评 gate 判不了的残差（TurboQuant）。
- **打分面板**：判别器在生成器外、绝不自评；每轴显式输入契约不重叠不留缝（MAS survey / AgentCoder）；阈值按本技能历史分布标定（低于 1σ 才 fail），而非固定线（Test-Time SI / Cherry-IFD）；周期拿 事实检查 真值校 critic，校不准的轴降权（Metacognitive）；加一条"memory-applicability"轴——该用的笔记没被取用就 fail（Evo-Memory）。
- **测试用例集**：objective/subjective 分标，keep/revert 只认 objective（RISE）；二元能力红线用例单独门（LLM-in-a-Flash blog：2-bit 看着没差却悄悄搞坏 tool calling）；Batch1(冷,fail) vs Batch2(笔记入库后,pass) 证明笔记真防复发（AgentFactory）；只收有区分度的 case（Cherry-IFD）；周期对最新树重验引用，防陈旧引用悄悄封顶（SPIN ceiling）；答得好的难任务回填成新冻结 case（Karpathy LLM-Wiki）。
- **记录表+回归测试**：这就是 AFlow/AgentFactory 的隔离实验循环 + Test-Time-SI 的 adapt-respond-RESET；git-revert 设为默认；per-note `s=(c_succ+1)/(c_use+2)`（EvolveR）；leave-one-out 消融找死笔记；fires(命中) vs catches(翻转 fail→pass) 区分，高 fires 零 catch = 死策略（Metacognitive/OMNE）；时间感强度 `R=exp(-(now-last_fired)/S)`，S 被 catches 和严重度（砖板/数据丢失类）放大（MemoryBank）；测试用例集通过率随 commit = 主指标（Karpathy）。
- **自动学习**：原子产出且拒绝无可执行检查的笔记（地基规则）；只在多轮把 turn-1 fail 转成 pass 时才落（RISE-Self）；建前用 base 技能跑一遍，确认真 fail 才建（Cherry-IFD）；蒸成抽象通用原则，具体只留 must-cite（EvolveR/OMNE）；建前语义去重（EvolveR）；生成 1-3 邻域 case 每条过 gate（Test-Time SI）；写侧 ingest：一个坑折进最相关笔记 + 受影响 SKILL 的 forbidden/handoff + 交叉引用（Karpathy）。
- **router**：单技能基本不适用；保留"按召回评分 + 不确定门"备未来若拆子域。
- **hindsight-memory**：笔记 = 散文 + 配对可执行谓词（`.check` 或 事实检查 子句）；固定 front-matter；一行 grep 索引 + 完整体两层；每条带 specific 子句(gate 逐字 grep) + abstract 子句(子系统原则)；`index.md` 先读；prune 用 archive 不删，遇匹配的归档笔记复活而非重学。
- **other**：生成式 `self_model.json`（各路由/各轴/各版本真实统计，机器生成不手写）；显式 `strategies.json` 学习策略菜单，卡住换策略；外层学习循环改动本身也要过冻结测试用例集才提交。

### A.2 判定低价值的论文（诚实记录）

TurboQuant（纯量化，全是工程纪律类比）、FlashMoE（训练的缓存预测器，过度设计）、autoresearch blog（链接博客，唯一有用的红线用例点是已知测试设计陷阱非论文贡献）、MoE-offload（GPU/SSD 推理管道，唯一有用的 recall 路由跟 LLM-in-a-Flash 重复）、MemGPT（运行时 context 分页，正交，且它那套 LLM 自判正是本引擎要不信任的）、SPIN（自博弈收敛理论在小 N 离散测试用例集退化成"过冻结测试用例集"，易过拟合）。

### A.3 净建议（优先序）

1. 先把开环改掉：`/kernel-learn` 拒绝任何没有 `[CLAIMS]` + fail→pass case + rules 注册的笔记（最高杠杆）。
2. ledger 变成被度量的策展器：fires/catches + Laplace + leave-one-out 消融，git-revert 默认。
3. 加能力红线用例 + objective/subjective 标签，keep/revert 只看 objective 半。
4. `/kernel-learn` 蒸抽象通用 + 建前去重 + 2-3 邻域 case（过 gate）。
5. （推后）推理服务那批（热冷驻留/prefetch/衰减曲线/context 预算）等规模真成瓶颈再说——12 技能规模现在上是过度设计。
6. 刻意保留人 + 冻结测试用例集在环里；按 Metacognitive 的定义保持"extrinsic"，不追求无人自治。

---

## 附录 B：进化实现仓研究（run wf_6cbe4a31-cb2）

研究 darwin-skill / nuwa-skill / autoresearch / autoresearch-skill 四个自我进化实现仓。

**采用 vs 自建结论：自建，不采用任何仓整体。** 四个全是 Karpathy autoresearch 那同一套保留/撤销循环（`evolve-ledger.mjs` 头部已注明出处）。每个都更弱或跨域：darwin-skill = 纯主观 LLM 评 SKILL 散文质量、零客观检查（自报准确率 46-74%）；autoresearch-skill / nuwa-skill = 纯文档无引擎代码，TSV 学到的丢弃、无冻结测试用例集、无 事实检查、无规则表。我们要建的（事实检查 / 编译 checkpatch 检查 / 冻结测试用例集 / fires-catches 记录表 / 原子三件套）正是它们都缺的。**§8 复用计划不变**（ledger 直用、rules 小补丁、regression 重写 kernel 版）。

**这些仓确认我们已有**（无需动作）：单改动一实验、冻结评审器、只追加记录表 + 历史最好曲线、git-revert 默认、crash 第三态、fires/catches+Laplace+消融、盲多评委无自评、objective/subjective 分离且 keep/revert 锚客观半、原子三件套、结构检查、来源覆盖检查。

**冲突（保持我们设计，不要回退）**：darwin/autoresearch-skill 把 keep/revert 锚在 **100% 主观指标**上（darwin LLM 评散文；autoresearch-skill 信可作弊的用户 Verify 命令）——这正是我们 事实检查 要防的。我们 keep/revert **必须锚在客观半**（事实检查 + checkpatch/compile），critic 只对主观残差当参考。

**净收获：12 个循环操作防护项**（确认设计文档和复用脚本里都没有）。优先序如下，折进对应组件：

| # | 防护项 | 落点 | 量 |
|---|---|---|---|
| 1 | **评审器自降解校准**：故意改坏 gold 答案 N 种，断言检查+critic 给每种打分严格低于 gold（证明"能分好坏"；区别于红线用例=好答案仍 pass，这是坏答案必 fail） | 测试用例集（§6.4，`tests/eval/degraded/`） | M |
| 2 | **dry-run 覆盖率天花板**：记录表记每行是真跑客观检查还是只 critic；某轮 >30% 没跑检查 → 标"不可信、分数虚高" | ledger（§6.6，加 `eval_mode` 列） | S |
| 3 | **度量错误熔断**：分清"检查说 fail"和"检查自己崩了"（树缺/工具缺）；连崩 2 次 → 停回归测试升级，不把这些写成 fail 污染记录表 | 事实检查（§6.2，加 `gate-error` 终态） | S |
| 4 | **plateau 停**：track 离最佳多少轮没动（只数出有效客观指标的轮）；~15 轮没新高 → 暂停升级给人看 | ledger（§6.6/§11） | S |
| 5 | **防膨胀字节上限**：kept 改动字节超上限**且没加新可执行检查** → 强制 revert（防"塞内容骗评委") | ledger（§6.6 keep 决策） | S |
| 6 | **每轮超时预算**：每个 checkpatch/事实检查/compile/critic 调用设超时；挂了就 kill→crash 丢这轮 | ledger（§6.3/§6.6） | M |
| 7 | **critic 噪音纪律**：主观轴的 kept 改进要超 min-delta 噪音底 + 确认重跑；主观退步要二次确认才 revert | critic（§6.5） | M |
| 8 | **scope/limits 字段**：每条知识带版本区间/arch 假设/"对 X 未验证"；结构检查要求非空（呼应 §6.9 版本标） | 自动学习（§6.7 模板） | S |
| 9 | **revert 历史回读**：提改动前先 grep 记录表 revert 行,不重提死路 + surface 上次 kept diff | ledger（§6.6/§6.7） | S |
| 10 | **3 测准入过滤**：一个坑要变永久 case/rule 前测——通用性 / 预测性(对新答案也 fire) / 排他性(不被已有规则覆盖);部分过=降级软启发,全不过=丢 | 自动学习（§6.7，§9 步7） | M |
| 11 | **生成器自写领域检查器**：可机检的坑(atomic 里睡、漏 of_node_put、copy_to_user 没校验)→ 自动产 coccinelle/AST 小检查器当可执行物,不止 grep | 自动学习（§6.7 扩展，§9 步7） | L |
| 12 | **路由带 limits**：用户描述问题(非目标)时,need→子系统诊断表给路由 + 该路由的盲点(must-cite + "本路由不覆盖 X") | SKILL 路由层（§9 步1 顺手） | S |

前 6 个让无人值守的 `/kernel-learn` 回归测试有界、可比、崩溃安全，先做；#10/#11/#12 扩展 地基规则，放到 自动学习 建设（§9 步 7）。建法 §9 顺序不变。
