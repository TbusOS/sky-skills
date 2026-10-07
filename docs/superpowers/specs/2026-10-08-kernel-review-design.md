# kernel-review — 接入 masoncl/review-prompts 的内核审查 skill 设计书

日期:2026-10-08 · 状态:规划,未开工 · 起因:社区已经开源了一套内核 patch 审查规则
([masoncl/review-prompts](https://github.com/masoncl/review-prompts),也是
[sashiko](https://github.com/sashiko-dev/sashiko) 用的那一套),本仓的
`linux-kernel-dev` 会写代码、不会审 patch。本文规划怎么把这套规则接进 sky-skills,
做成一个独立的「审查者」skill,先用在 BSP / 厂商 patch 上。

配套需求文档:[2026-10-08-kernel-review-requirements.md](2026-10-08-kernel-review-requirements.md)
(要做出什么、做到什么程度算完成,需求逐条编号,对应本文章节)。
当前进度与下一步见 [ROADMAP](../ROADMAP.md)。

---

## 0. 一句话

新建 `skills/kernel-review/`:用 git submodule 引用上游 review-prompts(不复制),
在它上面加三样上游没有的东西 —— BSP 驱动子系统的审查规则、审查前先跑的确定性脚本、
审查结果里引用的代码是否真实存在的核对 —— 再用一套真实 bug 的基准测试证明这些东西
确实让审查找到了更多 bug。

---

## 1. 背景:这两个东西是什么

| | review-prompts | sashiko |
|---|---|---|
| 是什么 | 一组 Markdown 审查规则:审查流程、误报排查清单、按子系统分的 bug 模式 | 一个 Rust 程序:把 patch 拆成 7 个并行分析阶段 + 合并 + 复核,产出发 LKML 的审查邮件 |
| 作者 / 许可 | Chris Mason,MIT | Linux Foundation 项目,Apache-2.0 |
| 关系 | **源头** | 把 review-prompts 复制进自己的 `third_party/prompts/`,两边互相同步(上游 PR #106「sync subsystem guides and updates from sashiko」) |
| 规模(2026-10-08 实测) | 968 星,149 fork,最近推送 2026-10-01(HEAD `d048f87`) | 内核子系统规则 65 份 / 12271 行(`third_party/prompts/kernel/subsystem/`,REVISION `4e9a905`) |
| 效果 | — | README 自报:对 1000 个带 `Fixes:` 的主线提交检出 53.6%,人工抽样误报低于 20%。**本文没有复现这个数** |

**没有它会怎样**:`linux-kernel-dev` 的 SKILL.md 里「审码」只指向
`references/coding-style.md`(`SKILL.md:50`),也就是只查风格。让模型审一个 patch,
它没有拆分改动、追调用链、排除误报的固定步骤,结果取决于当次发挥。

**为什么接它而不是自己写**:上游的流程(`review-core.md` / `callstack.md` /
`false-positive-guide.md`)已经有内核维护者在用、在改 —— 最近 100 个 PR 里合入的
多数来自内核维护者。自己从零写同样的东西,质量和更新速度都追不上。

---

## 2. 已经定下的决定

| # | 决定 | 谁定的 / 依据 |
|---|---|---|
| D1 | 审查者角色**先用来审 BSP / 厂商 patch**(老内核、厂商宏开关、defconfig) | user,2026-10-08 |
| D2 | **暂不向上游提 PR**,只在本仓做。但 BSP 规则一律按上游格式写(英文、上游子系统规则的版式、带内核源码出处),以后要提时不用改格式 | user,2026-10-08 |
| D3 | **引用上游,不复制**。上游文件不进本仓的 git 历史 | 见 §4 |
| D4 | `kernel-review` 做成**独立 skill**,不并进 `linux-kernel-dev` | 写代码的一方和审代码的一方分开,审查者不继承写代码时的假设 —— 本仓 `design-review` 与各 design skill 已经是这个分法(README「generator and evaluator are separate skills」) |

---

## 3. 跟 linux-kernel-dev 的分工

| | linux-kernel-dev(写) | kernel-review(审,新建) |
|---|---|---|
| 输入 | 一个开发任务 | 一个提交 / 一段提交范围 |
| 输出 | 代码 + 解释 + `[CLAIMS]` | 审查意见(上游 `review-inline.txt` 版式)+ 中文摘要 |
| 规则来源 | 本仓 `references/` | 上游 review-prompts + 本仓 `bsp-guides/` |
| 复用关系 | 提供确定性脚本 | **调用** linux-kernel-dev 的脚本(§7.3),不复制 |

两边各有长处,这次接入只补审查那一侧:

- 上游强在审查流程和误报控制(`false-positive-guide.md` 505 行的核对清单),以及主线核心子系统(mm / net / bpf / io_uring / kvm / drm)。
- 本仓强在确定性脚本(`check_api_change.sh` / `check_context_safety.py` /
  `show_guard_chain.py` / `defconfig_gate.mjs` —— 同样输入每次输出一样),以及 BSP 驱动框架。
- **上游没有、本仓有**的驱动子系统:gpio、spi、clk、regulator、pinctrl、pwm、thermal、
  iio、mmc、mtd、rtc、watchdog、regmap、reset、dmaengine、phy、cpufreq、devfreq、
  nvmem、mailbox、ASoC。两边文件名重合的只有 5 个:hwmon、i2c、input、locking、scheduler。

---

## 4. 接入方式:三个方案

| 方案 | 做法 | 好处 | 坏处 |
|---|---|---|---|
| **A. git submodule(选这个)** | `third_party/review-prompts` 指向上游,固定在某个提交 | GitHub 文件树里显示为「review-prompts @ 提交号」并链到上游,出处一眼可见;版本固定,基准测试可复现;上游文本不进本仓历史 | 用户要 `git clone --recurse-submodules` 或补一条 `git submodule update --init`;本仓的自动更新只做 `git pull --ff-only`,不会更新 submodule,要补(§9) |
| B. 复制进本仓(sashiko 的做法) | 拷 2 万多行进 `third_party/`,配 REVISION 文件和同步脚本 | 普通 clone 就能用,可以本地改 | 别人的 2 万行以本仓提交的形式出现,出处不清;本地一改就跟上游分叉 |
| C. 用户自己 clone 到固定位置 | 约定 `$HOME/src/review-prompts`(Chuck Lever 的 cel-kdev 用的就是这个位置) | 最简单,单一来源 | 本仓里看不到接入;不固定版本,上游改了索引格式,我们的规则会不再加载且不报错;基准不可复现 |

**选 A,同时兼容 C**:找规则目录的顺序是 环境变量 `KERNEL_REVIEW_PROMPTS_DIR` →
本仓 submodule → `$HOME/src/review-prompts`。已经按 cel-kdev 习惯 clone 过的人不用再装一份。

---

## 5. 目录结构

```
sky-skills/
├── third_party/review-prompts/        # submodule → masoncl/review-prompts(只读,不改)
└── skills/kernel-review/
    ├── SKILL.md                       # 触发条件 + 审查流程(§6)
    ├── bsp-guides/                    # 本仓的 BSP 规则,按上游格式写(英文)
    │   ├── index-rows.md              #   要并进上游 subsystem.md 的索引行
    │   ├── bsp-gpio.md                #   文件名一律加 bsp- 前缀,见 §7.2
    │   └── bsp-false-positive.md      #   BSP 场景专用的误报排除规则
    ├── scripts/
    │   ├── _common.py                 # 共用常量与小函数
    │   ├── locate_prompts.sh          # 按 §4 的顺序找上游目录
    │   ├── build_merged_prompts.py    # 上游 kernel/ + bsp-guides → 合并目录(§7.1)
    │   ├── prepare_review.py          # 审查前准备:解析提交、建产物目录、记内核树快照,写 session.json
    │   ├── finish_review.py           # 审查后核对:产物齐全、已读规则真实存在、内核树没被改
    │   ├── prefetch_facts.sh          # 审查前先跑确定性脚本(§7.3)
    │   ├── validate_quotes.py         # 审查意见里引用的代码行是否真实存在(§7.4)
    │   └── bench/                     # 基准测试(§8)
    └── tests/                         # 每个脚本的自测
```

---

## 6. 审查流程

```
用户:审一下 HEAD~3..HEAD
 │
 ├─ 1. prepare_review.py <提交>     内部先找上游目录(找不到就停,告诉用户怎么装),
 │                                  再生成合并目录(有缓存);建树外产物目录,记下内核树快照
 ├─ 2. prefetch_facts.sh <提交>     跑 checkpatch / 调用点分类 / 上下文安全 / 守卫链 /
 │                                  defconfig 检查,结果写进产物目录的 facts.md
 ├─ 3. 按合并目录里的 review-core.md 走上游流程
 │     (facts.md 作为已收集的上下文交给它;上游的子系统索引会自动加载匹配的 bsp-* 规则;
 │      上游要求写到「当前目录」的文件,改写到产物目录)
 ├─ 4. validate_quotes.py           review-inline.txt 里引用的每一行代码,
 │                                  必须在该提交的 diff 或文件里找得到;找不到的意见打回重查
 ├─ 5. finish_review.py <产物目录>   核对产物齐全、声称读过的规则真实存在、内核树没被改
 └─ 6. 输出:review-inline.txt(上游版式,英文)+ 对话里给中文摘要,摘要里列出这次实际加载了哪些规则
```

第 2、4 步(`prefetch_facts.sh`、`validate_quotes.py`)在 P1 加入;P0 只有第 1、3、5、6 步。

**审查产物不放在被审的内核树里。** 默认放 `~/.cache/sky-skills/kernel-review/<树目录名>/<提交号前 12 位>/`。
原因是上游 `review-core.md:247` 要求把 `review-inline.txt` 写到当前目录,也就是内核树里;
BSP 树里多出未跟踪文件,很容易被 `git add -A` 一起提交进 MR。

**输出里列出实际加载了哪些规则**,BSP 规则没加载时读结果的人能看出来(§7.1 说的那种
「不加载也不报错」的情况,在这里多一层可见性)。

**另一条路(可选)**:装了 sashiko 的人,可以把同一个合并目录交给它的多阶段流水线:
`sashiko review --prompts <合并目录> HEAD~3..HEAD`(参数定义见 sashiko
`src/main.rs:147-149`、`1501-1510`)。sashiko 支持用本机 Claude Code 当后端,
配置样例在它的 `docs/examples/Settings.claude-cli.toml`。BSP 规则只写一份,两条路都能用。

**不默认运行上游的 `setup.sh`**:它会往 `~/.claude/skills/kernel/` 装一个在任何内核树里
都自动加载的 skill,并往 `~/.claude/commands/` 装 `/kreview` 等命令,装进去的路径指向
submodule 的绝对位置。本 skill 直接读合并目录里的文件,不依赖这些全局安装。
想要上游原版命令的人可以自己跑 `third_party/review-prompts/setup.sh claude kernel`。

---

## 7. 组件规格

### 7.1 build_merged_prompts.py

- **做什么**:把上游 `kernel/` 复制进 `~/.cache/sky-skills/kernel-review-prompts/<内容哈希>/`,
  再放入 `bsp-guides/*.md`,把 `index-rows.md` 的行追加进合并后的 `subsystem/subsystem.md`。
  上游和 BSP 规则的内容都没变时复用上次的目录。
- **为什么要合并目录**:上游流程靠 `subsystem/subsystem.md` 这张索引表决定加载哪些规则;
  sashiko 的预筛阶段也读这张表。规则只有登记进这张表才会被加载。
- **参数**:`--base <目录>` 指定底座。用本 skill 时底座是 submodule;用 sashiko 时底座
  换成 sashiko 自带的规则包(`sashiko init --prompts` 安装的那份)。sashiko 的阶段指令
  编译在程序里,跟它自带的规则包版本一致;拿上游最新版当底座可能出现文件名对不上。
- **坏的时候往哪个方向坏**:如果上游改了索引表的列格式,追加的行可能解析不出来,
  BSP 规则**不加载,也不报错** —— 审查照常跑完,只是少了 BSP 那部分,没有任何报错。
  这是往「放过」方向坏,所以脚本必须在生成后核对:表头列数与预期一致,每一条 BSP 行
  都出现在最终索引里;不一致就退出码非 0 并说明哪一行。`--selftest` 要包含
  「故意给一个改了表头的上游」这一项,脚本必须报错。

### 7.2 bsp-guides(BSP 审查规则)

- **版式**:照上游 `kernel/subsystem/subsystem-template.md`。英文,短,只写
  「审查时容易漏的 bug 模式」,每条带内核源码出处(文件路径 + 函数名)。
- **不写什么**:常识和通用编程建议。sashiko 维护者指南原话是规则要「small and focused,
  avoid trivial facts or generic programming advice」(`MAINTAINERS_GUIDE.md:27`)。
  本仓现有的 `references/subsys/*.md` 是「怎么写」,不能原样搬,要改写成「审什么」。
- **文件名加 `bsp-` 前缀**:上游以后如果也加了 `gpio.md`,两份都会被加载(上游规则是
  「加载所有匹配的规则」),不会互相覆盖。代价是内容可能重复,发现后删掉我们那份。
- **不写厂商名**:公开仓库,规则一律用通用说法(vendor SoC、vendor config gate),
  发布前跑本仓的外发脱敏检查。
- **第一批 5 份,怎么选的**:要能被基准测试量出效果,所以先选 sashiko 基准里条目多的:
  gpio(19 条)、ASoC(14)、iio(13)、phy(11)、pinctrl(7),合计 64 条。
  clk、regulator 在 BSP 工作里同样常见,但 sashiko 基准里 clk 为 0 条、regulator 为 2 条,
  公开数据量不出效果,放第二批,用本地 BSP 基准(§8)来量。
- **bsp-false-positive.md**:BSP 场景专用的排除规则,补在上游误报清单之后。例如:
  老内核上没有某个新 API(4.19 没有 `pm_runtime_resume_and_get`),不能要求作者改用;
  厂商代码被 `#if defined(CONFIG_<VENDOR>_...)` 包住,要先判断该宏在目标配置里是否打开。
  每条都要写清楚「凭什么排除」,不允许只写「BSP 代码标准低」这类理由。
- **引用核对**:规则里引用的符号和路径,用上游 PR #86 的 `kernel/scripts/check-drift.py`
  对绑定的内核树检查(该 PR 尚未合入,上游作者留言表示打算合入);合入前先用本仓
  `linux-kernel-dev/scripts/fact_gate.mjs` 顶替。

### 7.3 prefetch_facts.sh(审查前先跑的确定性脚本)

全部调用 `skills/linux-kernel-dev/scripts/` 里已有的脚本,不复制:

| 什么时候跑 | 脚本 | 给审查提供什么 |
|---|---|---|
| 每次 | `checkpatch_gate.sh <patch>` | 风格问题先由机器报掉,审查不再花篇幅 |
| 改了函数体 | `check_context_safety.py <文件> <函数>` | 能不能睡眠、碰了哪些全局状态、调用者里有没有原子上下文 |
| 改了函数的返回值或参数 | `check_api_change.sh <函数>` | 所有调用点按风险分类(忽略返回值 / 流入全局 / 魔数比较) |
| 改动落在 `#if` / `#ifdef` 块里 | `show_guard_chain.py` | 这行代码在哪些配置下才会编译进去 |
| 改了 defconfig | `defconfig_gate.mjs` | 写了却没生效的配置项 |

上游流程本来要求模型自己去追调用者、被调函数(`callstack.md` Task 1-2),这些脚本的结果
可以省掉一部分查找。脚本只负责「把要看的行找全」,判断仍由审查流程做。

### 7.4 validate_quotes.py(引用核对)

- **核对什么**:`review-inline.txt` 里以 `> ` 开头的引用行,逐行到 `git show <提交>` 的 diff
  和该提交时的文件内容里找。找不到 = 这条意见引用了不存在的代码,打回重查。
- **为什么**:模型编造代码引用是审查类工具最难被读者发现的错误。sashiko 在流程里要求每条
  排除理由带代码片段(`linux_patch_review.rs:537` 会拒收缺字段的输出),但只检查字段有没有,
  不检查片段是不是真的。本仓做后一步。
- **边界**:它只能证明「引用的代码存在」,不能证明「意见是对的」。通过不等于审对了。
- **自测**:用一份故意改错一个字符的引用,脚本必须报错;改回后必须通过。

---

## 8. 怎么量效果:基准测试

`linux-kernel-dev` 现有的 148 条用例测不了这件事:`regression_test.mjs:6` 写明「无需 LLM」,
它测的是用例里的 API 名在树里查不查得到;`evolution/rules.json` 的 55 条规则
fires / catches 至今全是 0。审查效果必须用真实 bug 量。

- **题目格式**:照 sashiko 的 `benchmarks/benchmark.json`(`Commit` / `Fixed-by` /
  `subsystem` / `problem_description`)。题目 = 引入 bug 的那个提交,标准答案 = 修复说明。
- **公开题库**:从 sashiko 的 999 条里取第一批 5 个子系统的 64 条,只存提交号和描述,
  需要一棵主线内核树来检出。这部分结果可以提交进仓。
- **本地题库**:从我们自己的 BSP 树里 `git log --grep=Fixes:` 挖。**只存在本机**
  (`~/.config/sky-skills/kernel-review/bsp-bench.json`),不进仓库 —— 里面是公司代码的
  提交信息。
- **判分**:LLM 判「找到 / 部分找到 / 漏掉」,判分提示词改编自 sashiko
  `designs/DESIGN_BENCHMARK_VALIDATION.md`(Apache-2.0,保留出处)。
- **对照**:同一批题跑两遍 —— ① 只用上游规则 ② 上游 + BSP 规则。只有 ② 比 ① 找到的多、
  误报没有明显增加,BSP 规则才算有用。这一对数字也是以后提上游时要附的证据。
- **审查引擎**:跑分脚本支持两种引擎(Claude Code + 本 skill / sashiko CLI),
  规则目录是唯一的变量。
- **成本**:多阶段审查一次要花不少 token(sashiko README 也提醒了 API 费用)。
  先用 10 条做冒烟测试,确认流程和判分可用,再跑全部 64 条。

---

## 9. 在 GitHub 上怎么体现

| 做什么 | 说明 |
|---|---|
| submodule 本身 | 文件树里直接显示链到上游的「review-prompts @ 提交号」 |
| README / README_zh 技能表加一行 | `kernel-review`:基于 masoncl/review-prompts(sashiko 所用的规则),补 BSP 驱动子系统规则与确定性预检。同时更新 README 里「多少个 skill 带脚本」这类计数 |
| README 加致谢段 | 写清楚哪些来自上游、各自的许可(MIT / Apache-2.0) |
| 订正 `docs/KERNEL-REPOS-SURVEY.html` | 2026-07 那次调研漏了 review-prompts,页面上「社区 kernel skill 的 star 都在两位数以内」「GitHub 上没有第二个带 44 子系统模块…的 kernel skill」两句要改 |
| 展示页 `docs/KERNEL-REVIEW.html` | 等 §8 有真实数字后再做,用 anthropic-design。**没有实测数字之前不做这页,不放示意数字** |
| 自动更新 | `autoupdate` 的更新命令补 `git submodule update --init`,否则用户拉到新版本后 submodule 还停在旧提交 |
| 仓库 topics(可选) | 如 `linux-kernel` / `code-review`。改的是仓库设置,动手前单独问 user |

**不做**:不写「官方合作」「被 sashiko 采用」之类的话;不在上游仓库开 issue 要求加链接。

---

## 10. 以后提上游的条件(D2 暂缓,先写下来)

满足全部条件再提,一个子系统一个 PR:

1. 该规则在 §8 的对照里有正向结果(② 比 ① 多找到,误报没有明显增加);
2. 用上游的引用核对脚本跑过,0 条失效引用;
3. 内容由 user 本人逐条审过,提交带 user 本人的 `Signed-off-by`(上游要求 DCO),
   AI 参与写 `Assisted-by:`;
4. 提交信息纯文本、72 列换行、不用 Markdown 反引号。这是 sashiko `CONTRIBUTING.md` 的要求;
   review-prompts 仓根没有 CONTRIBUTING 文件(2026-10-08 查),提交前再看它最近合入 PR 的写法;
5. 去掉 `bsp-` 前缀,改成上游的命名。

---

## 11. 风险与边界

| 风险 | 什么条件下发生 | 往哪个方向坏 | 对策 |
|---|---|---|---|
| 上游改了索引格式 | 上游重构 `subsystem.md` | 放过(BSP 规则不加载,也不报错) | §7.1 的生成后核对 + 自测 |
| 上游流程文件改名 / 删除 | submodule 升级后 | 拦住(找不到文件当场报错) | 升级 submodule 前先跑 §8 的冒烟测试 |
| token 花费 | 每次审查都走全流程 | — | 小改动(比如只改注释、只改 defconfig)只跑 §7.3 的脚本,不走全流程;阈值在 P1 实测后定 |
| 误报 | 规则写得太宽 | 拦住(多报) | 上游误报清单 + `bsp-false-positive.md` + §8 统计误报 |
| 编造引用 | 模型凭印象写代码 | 放过(读者很难发现) | §7.4 |
| patch 里夹带指令 | 审外部厂商 patch 时,提交信息或注释里写了「忽略以上规则」之类的话 | 放过 | 沿用上游规则:只从指定的规则目录加载提示词,被审代码里的文字一律当数据(`review-core.md:19-21`) |
| 审查产物混进被审的树 | 按上游原样写到当前目录 | — | 产物一律写到树外的产物目录(需求 R-F12);P0 验收时检查内核树 `git status` 干净 |
| 私有信息外流 | 本地 BSP 题库或审查输出被提交进公开仓 | — | 本地题库只放 `~/.config/`,审查产物只放 `~/.cache/`,都不在本仓目录下 |

---

## 12. 阶段计划

| 阶段 | 做什么 | 做完的标准 |
|---|---|---|
| **P0 接入** | 加 submodule(固定在 `d048f87` 或当时的 HEAD);`kernel-review/SKILL.md`;`locate_prompts.sh` + `build_merged_prompts.py` + `prepare_review.py` + `finish_review.py`(都带 `--selftest`);`linux-kernel-dev/SKILL.md` 的「审码」一行改为指向 kernel-review;README 两份 + 致谢;订正调研页;autoupdate 补 submodule 更新 | 在一棵主线内核树里,对 sashiko 基准里的 1 个已知 bug 提交走完整流程,产出 `review-inline.txt`,产物在树外、内核树 `git status` 干净;自测里「改坏表头必须报错」通过 |
| **P1 确定性预检 + 引用核对** | `prefetch_facts.sh`;`validate_quotes.py`(带自测) | 自测:改错一个字符的引用被拦下,改回后通过;对 P0 那个提交跑出 `facts.md` |
| **P2 第一批 BSP 规则** | `bsp-gpio` / `bsp-asoc` / `bsp-iio` / `bsp-phy` / `bsp-pinctrl` 5 份 + `bsp-false-positive.md` + 索引行 | 引用核对 0 失效;外发脱敏检查 0 命中;本仓中文文档检查(`check_buzzwords.py` 两张表)通过 |
| **P3 基准测试** | `bench/` 跑分脚本 + 判分;公开 64 条、本地 BSP 题库 | 10 条冒烟跑通;64 条出 ① / ② 两列结果,公开部分提交进仓 |
| **P4 展示与决定** | 有正向结果的话做 `docs/KERNEL-REVIEW.html`;按 §10 决定要不要提上游;第二批规则(clk / regulator / regmap / spi / mmc)用本地题库量 | 页面上每个数字都能追到 P3 的结果文件 |

每个阶段单独写实施计划(`docs/superpowers/plans/`),上一阶段做完再开下一阶段。

---

## 13. 不做的事

- 不搬 sashiko 的 Rust 程序、邮件列表监听、数据库、webhook。
- 不翻译上游规则,不在本仓保存上游文件的副本。
- 不自己再写一套多阶段编排:要多阶段就用 sashiko(§6 的另一条路)。
- 不把主线专用规则(kvm、bpf、io_uring 等)改写进 BSP 规则。

---

## 附:数据出处

| 数据 | 怎么得到的 |
|---|---|
| review-prompts 星数、fork、最近推送、HEAD | `gh api repos/masoncl/review-prompts`;`gh api 'repos/masoncl/review-prompts/commits?per_page=1'`(2026-10-08) |
| 上游 PR 作者与合入情况、PR #86 / #106 | `gh api 'repos/masoncl/review-prompts/pulls?state=all&per_page=100'`;`gh api repos/masoncl/review-prompts/pulls/86/files` |
| sashiko 版本、规则数与行数 | sashiko clone,HEAD `390df02`(2026-10-07);`third_party/prompts/REVISION` = `4e9a905`;`ls`/`wc -l` `third_party/prompts/kernel/subsystem/*.md`(不计 `subsystem.md`、`subsystem-template.md`) |
| 基准条数与各子系统条数 | `benchmarks/benchmark.json` 共 999 条,按 `subsystem` 字段精确计数 |
| 本仓 44 份模块 / 2245 行、148 条用例、55 条规则 fires/catches 全 0 | `skills/linux-kernel-dev/references/subsys/`、`tests/eval/cases/`、`evolution/rules.json` |
| 上游 `setup.sh` 安装位置 | 上游仓根 `setup.sh` + `agents/claude.sh`(`SKILL_BASE_DIR=$HOME/.claude/skills`、`COMMANDS_DIR=$HOME/.claude/commands`);sashiko 内置的旧版是 `kernel/scripts/claude-setup.sh`,装到同样位置 |
| cel-kdev 用 `$HOME/src/review-prompts` | `chucklever/cel-kdev` 的 `plugin/cel-kdev/skills/sashiko/SKILL.md` |
