# 讲清楚 + 口味学习接到所有设计 skill 和平常对话 —— 需求文档

日期:2026-10-13 · 状态:待 user 审阅 · 配套设计书:
[2026-10-13-explain-taste-design.md](2026-10-13-explain-taste-design.md)
当前进度与下一步见 [ROADMAP](../ROADMAP.md)。

本文回答「要做出什么、做到什么程度算完成」;「怎么做」在设计书里。
每条需求有编号,标出对应的设计书章节和实施阶段(P0–P2,见 §7)。

---

## 1. 要解决的问题

目的(user 2026-10-13):别人的 AI 用我们的设计 skill 时,越用画得越好;
平常对话时,AI 发出的信息也要清楚。靠的是两个现有 skill:
`explain-ladder`(先选文字 / 图 / 网页 / 视频,文字按 STE 写)和 `design-taste`(口味学习)。

1. **设计 skill 跟这两样没接上。** 2026-10-13 在 `ad2e1d3` 上逐个查 11 个设计 skill 的 SKILL.md:

   | 接了什么 | 几个 | 是哪几个 |
   |---|---|---|
   | 写了「让人看懂的三种做法」并有范例页 `explainer.html` | 3 | anthropic、apple、glass(三份是同一张表抄了三遍) |
   | 有口味参数表 `assets/taste-profile.js` | 1 | graphite |
   | 提到 `explain-ladder` | 1 | anthropic,只在「不触发」那句里提了一次 |

2. **接上了也不会自动用。** Claude Code 按 skill 的简介决定加载哪个,一个 skill 不能强制加载另一个;
   模型读到 skill 正文里写的步骤才会去做。现在的写法让这些步骤容易被跳过:
   - graphite 的口味学习在第 6 节(共 9 节),读到时页面可能已经画完;
   - 没有一个 skill 写「交付后把对方的评价记下来」,不记就永远学不到;
   - 三种做法标的是「案例,不是规则」。
3. **平常对话里 explain-ladder 基本不会生效。** 它只在对方说「用 STE 讲」「画个图讲」这类话时才加载;
   STE 默认关着,新会话也是关着。
4. **别人装不上常驻的部分。** README 的三种安装方法只复制或链接 skill 目录;
   `autoupdate/install.sh` 只给 Claude Code 插了一段规则,Codex、Gemini 只装 hook、没有规则文字。

## 2. 用的人

| 谁 | 用来做什么 | 本期是否覆盖 |
|---|---|---|
| 装了 sky-skills 的人和他们的 AI | 用设计 skill 做页面 / 画图;平常对话 | **是,首要对象** |
| user 自己 | 同上 | 是 |
| 本仓维护者 | 加新设计风格、改设计 skill 时,知道第 0 节漏没漏 | 是 |

## 3. 使用场景

| 编号 | 场景 | 期望结果 |
|---|---|---|
| S1 | 对方说「用石墨风画个 X 的讲解页」 | AI 加载 graphite,先跑口味 `suggest`;页面文字按 STE 写;讲关系的地方先给图 |
| S2 | 交付后对方说「字太小」 | AI 跑 `say` 记下;下次再画,字号变大;`explain labelSize` 能列出是这条记录推的 |
| S3 | 对方在 graphite 说过「太密了」,之后用 anthropic 做页面 | anthropic 的留白也变大,分量是一半(引擎现成的跨风格规则) |
| S4 | 平常对话问「这个函数为什么这样写」 | 回答按 STE 七条写;讲调用关系时先给一张 ≤ 80 列的 ASCII 图 |
| S5 | 对方说「停止」 | 本次会话不再按 STE 写;新会话又默认开着 |
| S6 | 新装 sky-skills | 跑一条命令装好常驻规则(本机有的 CLI 都装);一条命令卸掉;重复装不会装出两份 |
| S7 | 维护者新加一个设计风格,忘了写第 0 节 | `check_skill.mjs` 报出来 |
| S8 | 口味记录是空的(新用户) | `suggest` 输出为空,页面跟现在逐字节相同 |

## 4. 功能需求

优先级:必须 / 应有 / 可选。

### 4.1 平常对话:常驻规则

| 编号 | 需求 | 优先级 | 设计书 | 阶段 |
|---|---|---|---|---|
| R-A1 | 常驻规则文件 `skills/explain-ladder/always-on.md`:四级怎么选 + STE 七条 + 开关,≤ 25 行 | 必须 | §2 | P0 |
| R-A2 | STE 默认开着(user 2026-10-13 定 A);说「停止」本次会话关,新会话默认开 | 必须 | §2、§4 | P0 |
| R-A3 | 安装命令:Claude Code 装成 `~/.claude/rules/` 下的符号链接;Codex 写进 `~/.codex/AGENTS.md`,Gemini 写进 `~/.gemini/GEMINI.md`,都是带起止标记的一段;只装本机有的 CLI;可重复运行;有 `--dry-run` 和 `uninstall` | 必须 | §3 | P0 |
| R-A4 | `autoupdate/bin/do-update.sh` 拉完新版后,重跑安装命令刷新已装的 Codex / Gemini 那一段 | 应有 | §3.3 | P0 |
| R-A5 | explain-ladder 的 SKILL.md:开关一节改成默认开;写明常驻规则和完整 skill 的分工;被加载时发现常驻规则没装就提一句 | 必须 | §4 | P0 |
| R-A6 | README 两种语言和 `docs/INSTALL.html` 加上这一步,并写明设计 skill 要和 design-taste、explain-ladder 一起装 | 必须 | §3.4 | P0 |

### 4.2 设计 skill:第 0 节

| 编号 | 需求 | 优先级 | 设计书 | 阶段 |
|---|---|---|---|---|
| R-B1 | 每个设计 skill 的 SKILL.md,标题之后第一节是「0. 每次都做」,统一写法:动笔前(口味 `suggest`、STE、先给图、讲解类页面按三种做法),交付后(`say` / `pick` / `ingest`,值得做视频时先问) | 必须 | §6 | P0:anthropic、graphite;P1:其余 9 个 |
| R-B2 | 第 0 节写明 design-taste 或 explain-ladder 没装时怎么办:告诉对方没装、怎么装,然后照默认做,不能不声不响跳过 | 必须 | §6 | 同上 |
| R-B3 | 「让人看懂的三种做法」抽成一份公共文档 `skills/explain-ladder/references/finished-pages.md`;anthropic、apple、glass 原来那一节改成指向它,只留各自不同的那一两句 | 应有 | §5 | P0:文档 + anthropic;P1:apple、glass |
| R-B4 | 第 0 节的标准写法放进 design-taste SKILL.md 的「新风格怎么接」,以后加风格照抄 | 必须 | §6 | P0 |

### 4.3 设计 skill:口味参数表

| 编号 | 需求 | 优先级 | 设计书 | 阶段 |
|---|---|---|---|---|
| R-C1 | anthropic 参数表:留白(乘在 `--space-5`…`10` 上,1–4 档不动)、动画节奏(乘在 `--duration-*` 上) | 必须 | §7 | P0 |
| R-C2 | `taste.mjs --style=<页型风格> suggest --css` 打印 `:root{…}` 覆盖值;口味是默认值时打印为空 | 必须 | §7 | P0 |
| R-C3 | 留白 A/B 实验:`demos/anthropic-design/one-bit.html` 按 0.8 和 1.2 各出一版,user 挑,用 `pick` 记一条 | 应有 | §7.3 | P0 |
| R-C4 | apple、glass、sage、ember、atelier 参数表(CSS 已有完整的 `--space-1…10` 和时长变量);primer 只接留白(`--primer-space-*`,没有时长变量) | 必须 | §8 | P1 |
| R-C5 | eclat、lectern、relief:先把写死的间距改成变量(实测写死的 ≥ 24px 间距分别 24 / 7 / 17 处),再接参数表 | 可选 | §8 | P2,做不做由 user 定 |

### 4.4 检查

| 编号 | 需求 | 优先级 | 设计书 | 阶段 |
|---|---|---|---|---|
| R-D1 | design-taste 自测加一组:每个页型风格的参数表,默认值打印为空、留白放大时只动大档、跨风格「太密」分量小于本风格;故意改坏必须报错 | 必须 | §9.1 | P0 起,每接一个加一个 |
| R-D2 | 安装命令带 `--self-test`:在临时家目录里装、重复装、卸载,不碰规则文件里别人的内容;故意改坏必须报错 | 必须 | §9.2 | P0 |
| R-D3 | 私有仓 `check_skill.mjs` 加一项 B9:第 0 节在标题后第一节,并且写到了 `taste.mjs --style=<风格> suggest`、`say` 和 `explain-ladder` | 必须 | §9.3 | P0 |

## 5. 非功能需求

| 编号 | 需求 |
|---|---|
| R-N1 | 不改坏现有页面:口味记录为空时 `suggest --css` 输出为空;接入前后示范页逐字节相同 |
| R-N2 | 常驻规则 ≤ 25 行。它每轮都在上下文里,长了每轮都多花 |
| R-N3 | 跟着仓库走:别人装上就生效,不依赖 user 本机的 `~/.claude/rules/` 或私有仓 |
| R-N4 | 中文文档推送前过两张词表(商业黑话、自造简称)和外发脱敏检查,都是 0 条 |
| R-N5 | 提交信息不加 AI 署名 |

## 6. 不做

| 不做什么 | 为什么 |
|---|---|
| hook 每轮注入提醒 | 常驻规则已经每轮在上下文里;hook 每轮再注入一遍是重复花费 |
| Stop hook 自动查每条回答的 STE | 会拦住回答逼着重写,打扰大;先看默认开着的效果,不够再说 |
| anthropic 参数表接字号、颜色数、深浅主题 | 字号:anthropic.css 没有字号变量,78 张图例写死 3137 处 font-size;颜色数:语义色是定死的;主题:只有浅色一套,接上的话别的风格说「深色」传过来也做不到 |
| 改 explain-ladder 第 3、4 级的工具 | 这次只改「什么时候用」,不改「怎么做」 |

## 7. 阶段

| 阶段 | 内容 | 做完的标志 |
|---|---|---|
| P0 | R-A1–A6、R-B1–B4(anthropic、graphite)、R-C1–C3、R-D1–D3 | 新开一个会话,不说任何关键词,回答已按 STE 写;用 anthropic、graphite 各做一次,AI 自己跑了 `suggest`,交付后自己记了评价;user 挑完 A/B;各项自测和故意改坏都按预期;`check_skill.mjs --all` 里 anthropic、graphite 的 B7、B9 通过 |
| P1 | 其余 9 个风格的第 0 节(R-B1)、apple / glass 改指向公共文档(R-B3)、R-C4 | `check_skill.mjs --all`:9 个风格 B9 通过,6 个页型风格 B7 通过 |
| P2 | R-C5 | user 定做不做 |
