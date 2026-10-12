# 讲清楚 + 口味学习接到所有设计 skill 和平常对话 —— 设计书

日期:2026-10-13 · 状态:待 user 审阅 · 需求:[2026-10-13-explain-taste-requirements.md](2026-10-13-explain-taste-requirements.md)

## 1. 总体:两条路

```
平常对话                                   用设计 skill 做页面 / 画图
────────                                   ──────────────────────────
常驻规则 always-on.md                      设计 skill 的 SKILL.md
(每轮都在上下文里,不靠触发)               └─ 第 0 节「每次都做」(模型加载 skill 后最先读到)
  ├─ 四级怎么选                                 ├─ 动笔前:taste.mjs suggest ──▶ design-taste
  ├─ STE 七条,默认开                            ├─ 页面文字按 STE、先给图 ───▶ explain-ladder
  └─ 要做网页 / 视频 ─▶ 加载 explain-ladder     ├─ 讲解类页面:三种做法 ─────▶ explain-ladder/references
                                                └─ 交付后:say / pick / ingest ▶ design-taste(写进本机口味记录)
```

**为什么分两条路**:skill 只有在模型判断「这次用得上」时才加载,做不到「每条回答都用」;
而常驻规则每轮都在,但每轮都占上下文,只能放最短的一份。所以平常对话靠常驻规则(≤ 25 行),
细节和工具留在 skill 里;设计 skill 被加载时,由它自己的第 0 节把两样带上。

**为什么第 0 节放在最前面**:长对话里早读到的步骤会被后面的内容冲淡。graphite 现在把口味学习放在第 6 节,
模型往往读到那里时已经画完了。

## 2. 常驻规则 `skills/explain-ladder/always-on.md`

放在 skill 目录里,跟着仓库走。全文如下(22 行,user 审的就是这段措辞):

```markdown
<!-- sky-skills explain-ladder 常驻规则 v1 · 源文件 skills/explain-ladder/always-on.md -->
# 讲清楚(sky-skills explain-ladder,常驻)

每条回答都要让读者一次看懂。先选形式,再动笔:

| 读者要的是 | 用 |
|---|---|
| 结论、数字、一步操作 | 文字 |
| 关系:谁调用谁、数据从哪到哪、卡在哪一步 | 先给图,再写字。终端里用 ASCII 图,≤ 80 列,汉字算两列 |
| 一大批记录、长时间线、要过滤排序 | 提议做一个看完就扔的网页(explain-ladder 第 3 级) |
| 先后顺序和时机本身就是要点 | 视频明显更好时提一句,对方点头才做(第 4 级) |

文字按 STE(ASD-STE100)打八折写,默认开着:
1. 一句只说一件事。 2. 写出谁做。 3. 同一个东西只用一个名字。
4. 句子短:说明句 ≤ 50 字或 25 词,操作句 ≤ 30 字或 20 词。
5. 动词直接写:写「烧录固件」,不写「对固件进行烧录」。
6. 一步一个动作,条件写在动作前面。 7. 不确定就直说,写出要查什么。

- 代码、命令、日志原文、引用不改写。回答用什么语言照旧。
- 对方说「停止」或「关掉 STE」:本次会话不再按 STE 写,新会话又默认开着。有任务在跑时单说「停止」,先停任务,再问 STE 要不要也关。
- 跟用户自己的规则冲突时,以用户的规则为准。
- 做给别人看的页面或正式出图,用 sky-skills 的设计 skill。
```

- **为什么 ≤ 25 行**:它每轮都在上下文里。四级表和七条已经够让回答变清楚;
  例子、检查命令、页面工具都在 explain-ladder 的 SKILL.md 里,需要时再加载。
- **「停止」的两种意思**:有任务在跑时,「停止」多半是让任务停下。所以先停任务,再问 STE 要不要也关(原型时补的,2026-10-13)。
- **「以用户的规则为准」**:装的人可能已经有自己的写作规则(user 本机就有 `conduct.md`「说人话」一节),
  常驻规则不能跟它抢。

## 3. 安装 `skills/explain-ladder/scripts/install_always_on.sh`

```bash
bash skills/explain-ladder/scripts/install_always_on.sh             # 装(或刷新)
bash skills/explain-ladder/scripts/install_always_on.sh --dry-run   # 只打印要改什么
bash skills/explain-ladder/scripts/install_always_on.sh uninstall   # 卸
bash skills/explain-ladder/scripts/install_always_on.sh --self-test # 在临时家目录里自测
```

### 3.1 三种 CLI 各装到哪

| CLI | 判断装没装 | 装到哪 | 怎么装 | 为什么 |
|---|---|---|---|---|
| Claude Code | `~/.claude` 存在 | `~/.claude/rules/sky-skills-explain-ladder.md` | 符号链接指向仓库里的 `always-on.md` | 单独一个文件,不碰用户的 `CLAUDE.md`;链接指向仓库,`git pull` 后自动是新版。2026-10-13 实测:Claude Code 2.1.296 开会话时自动加载了 `~/.claude/rules/` 下全部 10 个文件 |
| Codex | `command -v codex` 或 `~/.codex` 存在 | `~/.codex/AGENTS.md` | 插一段带起止标记的内容(复制进去) | Codex 读一个全局文件,不跟随单独的规则文件。本机 Codex 0.159.3 还没有这个文件,装时新建 |
| Gemini CLI | `command -v gemini` 或 `~/.gemini` 存在 | `~/.gemini/GEMINI.md` | 同 Codex | 本机没装 Gemini,这一路**没有实测**,写进 README |

起止标记:`<!-- BEGIN: sky-skills explain-ladder v1 -->` / `<!-- END: sky-skills explain-ladder v1 -->`。
重复装时先删掉旧的一段再插,所以永远只有一份;标记之外的内容一个字不动。

### 3.2 边界

- **Claude Code 从哪一版开始自动加载 `~/.claude/rules/`,还没查。** 安装后脚本打印一句自查方法:
  新开会话问「你现在加载了哪些全局规则」。旧版加载不到时,可以加 `--claude-md`,改成往 `~/.claude/CLAUDE.md` 插一段(同样带起止标记)。
- **Codex / Gemini 那一段是复制进去的,仓库更新后不会自己变。** 所以 §3.3 让 `do-update.sh` 刷新它。
- **装之前先备份**:要改的文件先复制一份 `.bak`,跟 `autoupdate/install.sh` 一样。
- **新加的规则要重开会话才生效。** 脚本最后打印这一句。

### 3.3 跟 autoupdate 配合(R-A4)

`autoupdate/bin/do-update.sh` 第 2 步 `git pull --ff-only` 成功后,如果本机已经装过常驻规则(三处任一处有标记或链接),
就跑一次 `install_always_on.sh`,只刷新已装的,不新装。Claude Code 是符号链接,本来就不用刷新。

### 3.4 安装说明(R-A6)

README 两种语言和 `docs/INSTALL.html` 在「安装方法」后加一节:

1. 装设计 skill 时,把 `design-taste` 和 `explain-ladder` 一起装。不装的话,设计 skill 的第 0 节会提醒,但学不到口味。
2. 想让平常对话也按 STE 写,跑 `install_always_on.sh`。不跑的话,只有设计 skill 被用到时才生效。

## 4. explain-ladder SKILL.md 的改动(R-A5)

| 地方 | 现在 | 改成 |
|---|---|---|
| 「开关:用 STE 讲」一节 | 说「用 STE 讲」才开;新会话默认关 | 默认开着;说「停止」「关掉 STE」本次会话关;说「用 STE 讲」重新打开;新会话默认开 |
| 新加一节「常驻规则和本 skill 的分工」 | 无 | 常驻规则管每轮都要做的(选级别 + 七条);本 skill 管例子、检查命令、第 3 级页面工具、第 4 级视频;怎么安装 |
| description | 只列触发词 | 加一句「装了常驻规则后,平常回答默认按 STE 写」;触发词不变 |
| 第 2 级「正式出图」表 | 指向各设计 skill 的图例库 | 加一句:设计 skill 第 0 节会反过来引用本 skill |
| 加载时自查 | 无 | 本 skill 被加载时,看 `~/.claude/rules/sky-skills-explain-ladder.md` 在不在;不在就提一句「常驻规则没装,平常对话不会默认按 STE 写」和安装命令 |

STE 打开时「回答语言照旧、内容照旧,只管句子怎么写」这条不变。

## 5. 公共文档 `skills/explain-ladder/references/finished-pages.md`(R-B3)

内容:三种做法的表(首屏动画演示机制 · 证据模块 · 读者能点选的解释器)、动画的分寸、三个范例页各看哪一块。
来源是 anthropic、apple、glass 现在那三节的共同部分。各风格 SKILL.md 那一节改成两行:
指向这份文档,再写本风格独有的一两句(比如 apple 的「巨字号统计」、glass 的「动画终态写在 markup 里」)。

**为什么放在 explain-ladder 下面**:三种做法讲的是「怎么让人看懂」,这是 explain-ladder 的事;
放进某一个设计风格,别的风格引用它就成了跨风格依赖。
**为什么放 `references/` 而不是 SKILL.md 正文**:explain-ladder 的 description 写明「给别人看的成品页不触发」,
这条不改;设计 skill 直接读这份文件,不需要加载 explain-ladder 本身。

## 6. 设计 skill 的第 0 节(R-B1、R-B2、R-B4)

标准写法(放进 design-taste SKILL.md「新风格怎么接」,各风格把 `<风格>` 换成自己的名字):

```markdown
## 0. 每次都做(先读这一节)

本节用到两个 skill:`design-taste`(口味学习)、`explain-ladder`(讲清楚)。
它们和本 skill 装在同一个目录下。找不到就告诉对方没装、怎么装,然后照默认值做。

**动笔前**
1. 跑 `node <本 skill 目录>/../design-taste/scripts/taste.mjs --style=<风格> suggest --css`。
   有输出就把它放进页面的 `<style>`,排在本风格 CSS 之后。没有输出说明还没有口味记录,照默认做。
2. 页面上的字按 STE 写:一句一件事,写出谁做,一个东西一个名字。
   讲关系的地方先给图,图要带出文字里没有的判断。
3. 讲解类页面按「让人看懂的三种做法」规划首屏、证据、可点选的部分:
   `<本 skill 目录>/../explain-ladder/references/finished-pages.md`。

**交给对方之后**
4. 对方评价了(「太挤」「字太小」),跑 `taste.mjs --style=<风格> say "<对方原话>"`。
   在两版里挑了一版,跑 `pick <参数> <选中的值> <没选的值> "<对方原话>"`。
   跑过 `check_objective.mjs`,跑 `ingest <输出文件>`。
5. 觉得做成视频更清楚时,按 explain-ladder 第 4 级先问一句,对方点头才做。
```

- **为什么用 `<本 skill 目录>/../`**:用户级安装、项目级安装、仓库里直接用,三种情况下设计 skill 和这两个 skill 都是同一个目录下的兄弟目录。
- **没有参数表的风格**(P1 之前的 9 个、P2 之前的 eclat / lectern / relief):第 1 步跑 `suggest` 会报错退出
  (2026-10-13 实测 `--style=apple`:`--style=<name> is required; known: graphite`,退出码 2)。
  第 0 节先照写,参数表接上之前第 1 步写成「本风格还没接口味参数,跳过;第 4 步照样记,接上后会用到」。
  记录先攒着不浪费:接上那天,之前的记录全部生效。
- **graphite**:第 6 节的口味说明保留(它是细节),第 0 节只放这五步;它的 `scripts/taste.mjs` 薄包装照常可用。

## 7. anthropic 参数表(R-C1–C3)

### 7.1 参数

| 参数 | 默认 / 范围 / 每步 | 作用到哪 | 为什么 |
|---|---|---|---|
| 留白 `whitespace` | 1 / 0.7–1.5 / 0.1 | 乘在 `--space-5`…`--space-10`(24–120px)上,取整到 px;`--space-1`…`4`(4–16px)不动 | 1–4 档是组件内部的距离(标题和正文之间、按钮内边距),一起放大只会让组件松垮,整页不会更透气 |
| 动画节奏 `pace`(大 = 慢) | 1 / 0.5–2 / 0.15 | 乘在 `--duration-sm/md/lg`(240/400/700ms)上 | 范围跟 graphite 一样,跨风格换算不走样 |

- 共享映射:`whitespace`、`pace` 两个;`abSkip: ['pace']`(两张静态截图看不出节奏)。
- 本风格词表:「太挤 / 太密 / 太满 / 太紧凑」→ 留白 +1;「太松 / 太散 / 太空 / 页面太长」→ 留白 −1;「动画太快」→ 节奏 +1;「动画太慢 / 拖沓」→ 节奏 −1。
- `fromMeasure`:**P0 不做**。网页截图里纸色像素的占比,跟「大间距乘几倍」之间没有可靠的换算(卡片底色、代码块都会算进去),
  硬配一个换算只会学偏。`ref` 命令对 anthropic 会明说「不能从图学」。
- **共享词照样记下**(原型时发现,2026-10-13):原来 `taste.mjs say` 只要本风格词表一个词都没认出来就拒绝记录,
  在没有字号参数的 anthropic 里说「字太小」就丢了,graphite 也学不到。改成引擎里一个 `heard()`:本风格认得的词,
  或别的风格能用上的共享词,有一样就记。自测 P6 测它,故意改坏(共享词不算数)P6 必须失败。

### 7.2 `suggest --css` 的输出

```css
:root{--space-5:29px;--space-6:38px;--space-7:58px;--space-8:77px;--space-9:96px;--space-10:144px}
```

(上例是留白 1.2、节奏默认。)只打印跟默认不同的变量;全部是默认值时什么都不打印(R-N1)。

### 7.3 A/B 实验

页面:`demos/anthropic-design/one-bit.html`(846 行;大间距 26 处,全部走变量,写死的 0 处)。
引擎的出题规则是当前值 ± 2 步,所以两版是 0.8 和 1.2,最大一档 `--space-10` 是 96px 对 144px。
两版放临时目录,不进仓库;user 挑完,用 `pick whitespace <选中> <没选> "<原话>"` 记一条。

### 7.4 动画节奏的边界

11 个示范页里手写的动画一处都没用 `--duration-*`,只有 anthropic.css 组件里的过渡跟着变(18 处用变量,3 处写死)。
所以这个参数对现有页面基本不起作用,第 0 节第 2 步之外再加一句:新页面写动画时长用这三个变量。

## 8. 其余风格(R-C4、R-C5)

2026-10-13 实测各风格 CSS(数法:`padding` / `margin` / `gap` 的值里有 `var(--…space…)` 或 `var(--…gutter…)` 算走变量;没有 `var()` 且有 ≥ 24px 的算写死):

| 风格 | 留白变量 | 时长变量 | 大间距走变量 / 写死 | 阶段 |
|---|---|---|---|---|
| apple、glass、sage、ember | `--space-1…10` | `--duration-sm/md/lg` | 31–39 / 1–3 | P1,照 anthropic 接 |
| atelier | `--space-1…10`(`--space-5` 是 20px) | `--duration-xs/sm/md/lg` | 52 / 1 | P1,大档从 `--space-5` 起 |
| primer | `--primer-space-1…9` | 无 | 35 / 0 | P1,只接留白 |
| eclat | 只有 `--eclat-gutter` | 无 | 2 / 24 | P2:先把间距改成变量 |
| lectern | 只有 `--lectern-gutter` | 无 | 2 / 7 | P2 |
| relief | 无 | 无 | 0 / 17 | P2 |

## 9. 检查

### 9.1 design-taste 自测加一组「P 页型风格」(R-D1)

对每个页型风格的参数表:

| 编号 | 查什么 |
|---|---|
| P1 | 全是默认值时 `describe(--css)` 输出为空 |
| P2 | 留白放到 1.3:`--space-10` = 156px,`--space-1`…`4` 不出现在输出里 |
| P3 | graphite 里说 20 次「太密了」,这个风格的留白变大,但比在本风格里说同样次数变得少 |
| P4 | 「太松了」让留白变小 |
| P5 | 「动画太快」让节奏变大(没有时长变量的风格跳过) |
| P6 | 没有字号参数的风格里说「字太小」:照样记下,graphite 的字号变大 |
| M | 故意把 1–4 档也放大、故意不取整,P2 必须失败;故意让共享词不算数,P6 必须失败 |

### 9.2 安装命令自测(R-D2)

在临时目录里造一个假家目录(`HOME=<临时目录>`),依次:装 → 再装一次 → 刷新 → 卸,共 15 项。
查:Claude Code 那边只有一个链接、指向仓库;`AGENTS.md` 里只有一段、标记之外原有的内容逐字节不变;卸完三处都干净;
另有三种实际会碰到的情况:原文件最后一行没换行、仓库搬家后链接指向旧路径、`AGENTS.md` 本身是 dotfiles 的链接。
故意去掉「先删旧段」那一步,「只有一段」这项必须失败;故意留下插入时加的空行,「卸完逐字节相同」这项必须失败。

### 9.3 `check_skill.mjs` 加 B9(R-D3,私有仓)

判法:SKILL.md 正文里标题之后的第一个 `## ` 是「0. 每次都做」;这一节里出现 `taste.mjs --style=<本风格> suggest`、`say`、`explain-ladder`。
基础档从 8 项变 9 项,方法 §2 的改造清单重跑一遍。

## 10. 风险和边界

| 风险 | 什么条件下会发生 | 坏的时候往哪边坏 | 怎么办 |
|---|---|---|---|
| 别人只复制了设计 skill,没装 design-taste / explain-ladder | 按 README 旧写法只装了一个目录 | 第 0 节会提醒,看得见 | README 写明三样一起装(§3.4) |
| 别人没跑 `install_always_on.sh` | 只装了 skill | **往放过坏**:平常对话不按 STE 写,没有任何提示 | README 写明;explain-ladder 被加载时检查常驻规则装没装,没装就提一句 |
| STE 默认开后回答写成电报 | 模型照字面压短句子 | 看得见 | 规则写的是打八折;对方说「停止」就关 |
| 常驻规则和用户自己的规则冲突 | 用户已有写作规则 | 看得见 | 规则里写明以用户的为准 |
| Codex / Gemini 那一段过期 | 拉了新版但没跑 `do-update.sh` | **往放过坏**:用的是旧规则,没有提示 | §3.3;段首标记带版本号 v1,改规则时升版本 |
| Claude Code 旧版不自动加载 `~/.claude/rules/` | 版本早于支持的那一版(哪一版还没查) | **往放过坏** | §3.2 的自查方法和 `--claude-md` |
| 口味参数表写错范围 | 实现时手误 | **往放过坏**:页面照样出来,只是调不动 | §9.1 的自测 |
| 口味记录只在本机 | 换机器、换人 | 这是本意:学的是这个人的口味 | `--file` 可以指定一份共享日志(design-taste 已支持) |
