# Diagram Craft — 手工 SVG 图示工艺（anthropic-design）

> **本文约束的是什么**——三层分清楚：
> ① **审美**（色彩语义、暖系调色板、编辑式克制）——不可变,这是 skill 的身份;
> ② **工艺质量**（可读性、字号、留白、不发灰、不满铺）——机器闸强制,这是底线不是风格;
> ③ **图型与结构**——**自由定制**。模板和 §15 图型谱系是审美起点和设计思想的载体,不是强制规格。
> 内容长什么样,图就该长什么样:可以变体、混搭(波形里嵌位域、架构图里嵌 mock)、自创新图型——
> 只要 ①② 仍然成立。"必须配图"约束的是**有没有图**,从不约束**图长成哪样**。

> 适用：架构图 / 流程图 / 层级图 / 时间线 / git graph / 一切"工程类"图示。
> 时序图另有专文 `sequence-diagrams.md`；抽象插画见 `imagery.md`（两者不受本文"工程图"规则约束的条目会单独标注）。
> 模板：`templates/diagrams/`（architecture / flow / hierarchy / timeline / sequence / state-machine / deployment + 内核七件 function-flowchart / algorithm-ringbuffer / register-bitfield / soc-block / hw-timing-waveform / build-pipeline / sched-timeline + 互连拓扑 interconnect-map,共 **15 件**,全部按本文标准实现）。案例库：`demos/anthropic-design/diagrams.html`（24 张图 × 工程 / 内核硬件 / 产品展示 / 演讲汇报四类场合，每张带 Copy SVG）。

## 0. 第一原则：颜色做语义，不做填充——但必须在场

颜色的职责是**编码类别和焦点**，不是涂满面积。同时颜色必须**看得见**：把一切都压成 8% tint + 灰线的图读作"没做完"。

- 大面积（分组容器、面板底）只允许 white / cream / **16-20% tint**（§1 容器 tint 列，2026-06-11 起加深一档——旧 8-12% 档实践证明发白）
- **纯色满填只允许 ≤ 56×56 的元素**（icon tile、徽章、色点、图例 chip、提交圆）——而且这些小元素**必须**用纯色满填，不准用空心环替代（§1）
- 单图饱和色覆盖率目标 **4-14%**：>15% 走向色块（saturated-band 上限闸，known-bugs §1.27）；<3% 发灰（diagram-monochrome 下限闸抓 0 饱和 hue，known-bugs §1.30）
- **反向红线：工程图不允许发灰**——0 个饱和 hue（全靠灰阶 + 白卡）的工程图读作 wireframe。每张工程图 ≥ 2 个语义 hue（§1）；单系列图表（data-display 默认单蓝合法）、纯插画、apple skill 不受此条约束
- 反面教材：三条满宽橙/蓝/绿色带的旧 architecture.svg（2026-06-10 已重写）——"PowerPoint SmartArt 感"的最大来源；以及全图白卡灰线的"幽灵图"（2026-06-11 加下限闸）

## 1. 色彩语义表

| hue | 主色 | 容器 tint（16-20%） | 强调 tint（24-28%） | label 深色 | 语义分工（默认） |
|---|---|---|---|---|---|
| 橙 | `#d97757` | `#f7e4dc` | `#f4d9cd` | `#c2613f` | 主路径 · 焦点节点 · 协调者 · 决策菱形 |
| 蓝 | `#6a9bcc` | `#e2ecf5` | `#d6e3f0` | `#4a7bab` | 表现层 · 数据 · 搜索类 |
| 橄榄绿 | `#788c5d` | `#e5e9dd` | `#e0e5d4` | `#5d7045` | 成功 · 分析类 · 领域层 |
| 金 | `#c9913f` | `#f0e4d8` | `#ecdcc8` | `#8a5a2a` | 暂存 · 镜像 · 次要类别 |
| 墨 | `#141413` | `#e7e4d9` | — | `#141413` | 基础设施 · 中性骨架 |

> 2026-06-11 起 tint 整体加深一档（旧值 `#fbeee7 / #eef3f9 / #eef1e8 / #f6efe3 / #edebe3` 退役）。
> 全部新 tint 明度 l ≥ 0.85，不触 saturated-band 闸，也不计入 hue 数——色彩在场感来自下面三条。
> 金主色同日从 `#c49464` 改为 `#c9913f`：旧值就是 ember 的签名金，在 anthropic 页里会触 cross-skill-smell（§K，RGB 距离 < 22 判串味）。新值距 ember 金 37.5，距橙 38.8，不串。

用法：**多色彩是允许且推荐的**（一层一个 hue / 一类 agent 一个 hue），但每个 hue 只以"容器 tint + 4px 色条 + 色点 + 彩色连线 + label 深色"出现，不以满填色块出现。焦点元素（主路径、协调者卡）固定用橙。三条硬规则：

1. **实心饱和小元素**：色点、编号徽章、git 提交圆、图例 chip、状态 dot 一律**主色实心填充**（`fill="#d97757"` 等）。**禁止空心环**（`fill="none" stroke=主色`）替代——空心环只允许表达 "未完成 / upcoming" 语义,且同图必须有实心态对照。这是 v2 工艺发白的主要原因之一。
2. **每图 ≥ 2 hue 合约（工程图）**：分层 / 分类各占一个 hue，焦点固定橙。单 hue 工程图（全橙或全蓝到底）按反模式处理（§14）。hue 按色板四主色计（橙 / 蓝 / 绿 / 金），窗口 mock 红绿灯不算语义 hue。单系列图表、纯插画不受约束。机器闸只抓 0 hue（diagram-monochrome,known-bugs §1.30）——存量合法单 hue 图（git graph / timeline）不受影响，但新图按 ≥ 2 hue 写。
3. **彩色连线**：主干线不只是橙——次类别的主干线用该类 hue 1.8px 实线，灰 `#a8a496` 只留给次要虚线关系。

辅助灰阶：连线 `#a8a496`、次级文字 `#6b6a5f`、弱标签 `#8c8a7d`、卡边 `#d8d4c8` / `#e3e0d4`、分组边 `#d9d5c7`、面板边 `#eceadf`。

## 2. 结构：嵌套分组

层次靠"包含关系"表达，不靠色带：

```
面板（white / cream 渐变 + dot-grid）
└─ 分组容器：tint 底 + 1px 边（同 hue 浅色，虚线 4 3 或实线）+ rx 10-12
   ├─ 左侧 4px 色条（rx 2，full hue）
   ├─ 标签：4px 色点 + 10.5-11px UPPERCASE letter-spacing 0.08em-1.2 label 深色
   ├─ 右侧可选注释：10px italic #8c8a7d，text-anchor="end"
   └─ 节点白卡若干
```

## 3. 节点卡

- 白底 `#ffffff` + 1px 边 + rx 8-10 + 微投影 `feDropShadow dx=0 dy=1 stdDeviation=2 flood-opacity=0.06`
- 两行排版：**主名 12.5-14px Poppins 600 `#141413`** + **副说明 9.5-11px `#6b6a5f`**——单行居中大字是 SmartArt 感的另一半来源
- 类别标记二选一：
  - 简洁版：主名前 3.5px 色点（适合密集行，见 architecture.svg）
  - 完整版：左侧 32-40px icon tile（tint 底 rx 8-10 + hue 深色线性 icon，见 hierarchy.svg / flow.svg）
- 焦点卡（全图最多 1-2 张）：橙 tint 底 `#fbeee7` + 橙 1.5px 边 + 橙 icon（旧 `#fdf6f2` 太接近白，焦点立不住）

## 4. 连线工艺

1. **圆角正交折线**，不用斜线直穿：`M x1,y1 V ym Q x1,ym x1±8,ym H x2∓8 Q x2,ym x2,ym+8 V y2`（拐角 8px quadratic）
2. **从节点边缘锚点出发**，不从盒子中心穿出；同一边多条线用偏移锚点（如卡底 380/420/460/500 四个锚位）
3. 主路径 1.8px 实线（橙）；次要关系 1.2px 虚线 `stroke-dasharray="4 3"`（灰 `#a8a496` 或类别色）
4. 箭头统一 7px 小实心三角 marker，颜色同线：
   ```svg
   <marker id="arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
     <path d="M0,0.5 L7.5,4 L0,7.5 Z" fill="#d97757"/>
   </marker>
   ```
5. 回流/失败路径走图形下方，灰虚线 + 11px 标签（如 `fail · retry`）

## 5. 编号徽章

主路径和流程步骤加叙事编号：r=9-10 橙色圆 + 11px 600 白字。位置：流程卡左上角压角（圆心 = 卡角坐标 +4）、路径中段（避开箭头和文字，横段放编号、留 4px 以上间隙）。

## 6. 决策菱形

`M cx,cy-42 L cx+46,cy L cx,cy+42 L cx-46,cy Z` + 橙强调 tint `#f4d9cd` 填充 + 橙 1.5px 边 + 12px 600 居中问题文字。**菱形是流程图里唯一用强调 tint 的色块**——稀缺性就是强调。出口标注 `pass` / `fail` 用 11px 600，置于线上方 8px 以上、与徽章保持 4px 间距（text-anchor="middle" 防止撞徽章）。

## 7. dot-grid 纸纹理（anthropic 专属）

```svg
<pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
  <circle cx="12" cy="12" r="1" fill="#141413" opacity="0.05"/>
</pattern>
```

铺在面板 rect 上（fill 一层底色再叠一层 `url(#dots)`），一行 defs 换"工程图纸"质感。只用于工程类图示，插画不用。

## 8. 先定尺寸再画：选档表 + 布局公式

**内容多的图必须画大,不准把元素缩小塞进固定画布**。读者体验第一:看不清的图等于没画。

### 8.1 选档（画第一笔之前算）

先预估三个数：列数 C、最宽节点的字符数、`<text>` 元素总数 T。

```
viewBox 宽 = max(720, C × (节点宽 + 24) + 2 × 24)     # 节点宽公式见 §8.2
scale = 容器内可用宽 / viewBox 宽
合格线：scale ≥ 0.82（11px 源字号 → 渲染 ≥ 9px）
```

| 容器档位 | 可用宽 | 适用 | viewBox 宽 |
|---|---|---|---|
| 720 正文列（prose 流内） | ~660 | T ≤ 10 且 C ≤ 2 的小图 | ≤ 760 |
| 960 标准（`anth-container`） | ~880 | T ≤ 18 | 880-1040 |
| 1200 wide（`anth-container anth-container--wide`） | ~1130 | **T ≥ 20 或 C ≥ 4 必须用** | 1080-1280 |

- scale < 0.82 → 升一档；1200 档还不够 → **拆成两张图**，不准缩字号
- **breakout（对齐让位于可读性）**：图的宽度由内容密度定档，**不由上文列宽定**——"为了和上面文字对齐把图压小"是用户点名反馈的坑（known-bugs §1.44），图看不清等于没画。prose 流中需要大图时，结束当前容器，单独开一段 `<div class="anth-container anth-container--wide"><figure>…</figure></div>`，图后再回窄列；**grid 单元格里禁放 ≥20 label 的密图**（要么 `grid-column: 1 / -1` 独占全行，要么拆图）
- **viewBox 紧贴内容**：内容 bbox 距 viewBox 边 ≤ 24px。viewBox 写大、内容挤中间 = 两侧死空间逼所有标签变小
- 机器闸：`svg-letterbox`（内容 < 72% 渲染宽,known-bugs §1.28）、`dense-diagram-cramped`（≥ 20 text 渲染 < 760px,§1.29）、`diagram-tiny-text`（任何 figure 图渲染 < 9px,不再限 hero）

### 8.2 布局公式（防文字溢出 / 防挤）

- **节点宽度 = max(160, 英文字符数 × 9, CJK 字符数 × 18)**——主名+副说明取较长者
- 架构图列间距 ≥ 14（卡间）/ 行高 = 卡高 + 28（标签区）；流程图卡间走线段 ≥ 32
- 分组容器 padding ≥ 16；面板 viewBox 四周 padding ≥ 24
- **所有坐标和尺寸落在 4px 网格上**；圆角全图统一（卡 8-10、容器 10-12、面板 14-16）
- SVG `<text>` font-size ≥ 11（audit 红线：渲染 < 9px 告警），副说明最低 9.5px 只允许出现在 ≥1000px 宽的 hero 图里
- 文字 bbox 互不相交 ≥ 4px（known-bugs §1.25）；写完先渲染再交付

## 9. icon 语法（lucide 风，4 条）

1. 24×24 设计坐标（`transform="translate(tileX+8, tileY+8)"` 放进 40px tile，32px tile 用 +6）
2. `stroke-width 1.5-1.6`，`stroke-linecap="round" stroke-linejoin="round"`
3. **不填充**（`fill="none"`；实心小点除外）
4. 颜色 = 类别 label 深色（中性 `#6b6a5f`）

常用现成 path 见 `templates/diagrams/` 内：chat 气泡 / code 尖括号 / globe / cpu / sliders / database / drive / sparkle / list / magnifier / bars / download / shield-check / send。

## 10. 窗口 mock 模板族（图多又好看的性价比之王）

LLM 画 UI mock 比画抽象插画稳定得多。骨架（浏览器窗）：

```svg
<rect x="0" y="0" width="W" height="H" rx="12" fill="#ffffff" stroke="#e8e6dc"/>
<rect x="0" y="0" width="W" height="36" rx="12" fill="#f0ede3"/><rect x="0" y="24" width="W" height="12" fill="#f0ede3"/>
<circle cx="20" cy="18" r="5" fill="#e2857a"/><circle cx="38" cy="18" r="5" fill="#e8c180"/><circle cx="56" cy="18" r="5" fill="#86a35c"/>
<!-- 绿灯用 #86a35c 不用 #9cb481:后者距 sage 签名绿 #97B077 仅 11.9(<22),会触 cross-skill-smell -->

<rect x="76" y="9" width="W-152" height="18" rx="9" fill="#ffffff" stroke="#e8e6dc"/>  <!-- 地址栏 -->
<!-- 内容区：白卡 + 文字行(线段模拟) + 橙色 CTA 块 -->
```

变体：终端窗（深底 `#141413` + JetBrains Mono 10-11px 绿/白文字）、手机框（rx 28 外框 + 顶部听筒线）、dashboard 卡片（stat 数字 + 迷你图表）。canonical landing hero 是现成范例。

## 11. 手绘质感（仅插画类，工程图禁用）

`imagery.md` 的抽象插画可叠加 feTurbulence 让边缘微抖：

```svg
<filter id="rough"><feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" result="n"/>
<feDisplacementMap in="SourceGraphic" in2="n" scale="3"/></filter>
```

约束：`scale ≤ 4`；只给 hero 插画 / 概念示意；**架构 / 流程 / 时序 / 时间线等工程图禁用**——手绘感用错地方就是潦草。进阶（可控版）按 rough.js 四规则手写"预抖动" path：端点 1-2px 随机偏移、关键线画两遍（第二遍 opacity 0.4）、椭圆不闭合、hachure 斜线填充。

## 12. 图密度合约（何时必须配图）

页面写作时遵守：

| 内容形态 | 必须的视觉化 |
|---|---|
| ≥ 3 步的流程 / 启动链 / 数据流 | 流程图或时序图 |
| 数字对比 / 统计 | stat callout 或图表（`data-display.md`），不准纯文字段落罗列 |
| 系统结构 / 分层 / 依赖 | 架构图 |
| 时间演进 / 版本 / 里程碑 | 时间线 |
| 产品 / UI 描述 | 窗口 mock |
| 函数控制流 / 错误处理路径 | 函数流程图（§15.1） |
| 数据结构 / 算法机制 | 算法原理图（§15.2） |
| 寄存器 / 位域 / 协议帧格式 | 位域图（§15.3） |
| 芯片 / SoC / 板级硬件结构 | SoC 框图（§15.4） |
| 多 die / 多插槽互连 · 两侧地址空间不同一套编号 | 互连拓扑 + 地址空间映射图（§15.8） |
| 硬件信号 / 总线协议时序 | 波形时序图（§15.5） |
| 编译 / 构建 / 打包链 | 编译流程图（§15.6） |
| 多核调度 / 抢占 / 时间片 | 调度时间线（§15.7） |
| 连续纯文字 > 2 屏 | 插入至少 1 个视觉元素（图/表/stat/pull-quote） |

节奏目标：每 1.5 屏高度（≈1300px @1440 视口）至少 1 个 SVG / figure / stat 元素。

**表里的图型是默认映射,不是唯一解**:它回答"这类内容值得一张什么样的图作起点",
实际结构按内容定制——拆图、合图、混搭、自创形态都允许,合约只在两件事上是硬的:
该有图的地方要有图(text-desert 闸),以及图本身的工艺质量(§0-§9 + 各闸)。

## 13. figure 语义规范

每张内容图示包 `<figure>` + 真实 `<figcaption>`（audit known-bugs §1.18：SVG aria-label 和内部 `<text>` 不能替代 figcaption）。SVG 本体必带 `role="img"` + `aria-label`；纯装饰 SVG 用 `aria-hidden="true"`。

## 14. 反模式清单

- ❌ 满宽高饱和色带当"层"（→ tint 容器 + 色条）
- ❌ 单行白字居中的纯文字盒子（→ 两行排版 + icon/色点）
- ❌ 斜线从盒子中心穿出（→ 边缘锚点 + 圆角正交折线）
- ❌ 大箭头 / 黑色粗箭头（→ 7px 同色小三角）
- ❌ 坐标随手写（→ 4px 网格）
- ❌ font-size < 11 的 SVG 文字、文字相互压盖
- ❌ 工程图上手绘滤镜 / 装饰渐变 / 3D 效果
- ❌ 图例缺失（≥ 2 种节点状态或 ≥ 2 个类别色就要图例：5px 色点 + 11px 灰字）
- ❌ 一图多焦点（橙色强调元素 > 2 处 → 重新分配，次要的降为灰阶/类别色）
- ❌ 全图 0 个饱和 hue 的"幽灵图"（白卡 + 灰线到底 → §1 每图 ≥ 2 hue；diagram-monochrome 闸）
- ❌ 色点 / 提交圆 / 徽章画成空心环（→ 实心主色；空心只表 upcoming）
- ❌ viewBox 写大、内容挤在中间一窄条（→ §8.1 先算 viewBox 再画；svg-letterbox 闸）
- ❌ ≥ 20 个 text 的密图塞进 960 以下容器（→ wide breakout;dense-diagram-cramped 闸）
- ❌ 长文页面通篇无图（→ §12 图密度合约;text-desert 闸）

## 15. 内核 / 嵌入式工程图谱系（8 个图型的专属工艺）

> 每个图型有现成模板（`templates/diagrams/` 同名 .svg），复制改内容比从零画稳得多——
> 但模板是**起点不是规格**:它示范这个图型的审美和常见坑的解法,结构、节点数、布局、信息密度
> 全部按你的实际内容重新设计;内容超出谱系时直接自创图型,套用 §0-§9 的工艺即可。
> 通用规则（§0-§9）全部适用；本节只写每个图型**额外**的工艺决定。案例见 `demos/anthropic-design/diagrams.html`。

### 15.1 函数流程图（function-flowchart）

- 纵向主路径（happy path 橙 1.8px + 编号徽章），**错误处理走右侧独立车道**：gold 1.2px 虚线逐级下汇到共享出口（`return -errno`）——错误路径穿插在主路径里是最常见的可读性灾难
- 菱形只给真判断（`ret < 0?`），用强调 tint `#f4d9cd`；cleanup 步骤（`iounmap` / `kfree`）是普通卡，不是菱形
- 入口/出口用胶囊（rx = 高/2）；成功出口绿色点缀，错误出口 gold
- 内容必须真实：真函数名、真 errno,不写 step1/step2

### 15.2 算法原理图（algorithm-*，模板示例 ring buffer）

- 数据结构 = 单元格阵列（cell ~56×48 rx 6）：**占用 = tint 填充,空闲 = 白底**,状态一眼可分
- 指针/游标 = 实心 hue 三角 + 标签（in/out、head/tail），不同指针不同 hue
- 机制性注释（`smp_wmb()` / `idx & (size-1)`）≤ 2 行,放阵列侧边或下方,12px;不要把伪码整段塞进图
- 环形结构优先画直线阵列 + wrap-around 圆角箭头,真画圆环文字会全歪

### 15.3 寄存器位域图（register-bitfield）

- 32 位拆两行（31..16 / 15..0），位格 56-60px 宽、44px 高,4px 网格;bit 号 10.5-11px 在格顶
- 字段 = 合并格 + 字段 hue tint + **4px 顶色条** + 居中字段名;焦点字段（EN 位类）用橙;reserved = 白底 + 灰 `—`
- 标题行必含三件套:寄存器名 14px 600 + `offset 0x..` + `reset 0x..`(11px 灰)
- 图下方 3-4 行字段说明:实心色点 + `字段 · RW/RO · 语义`(11.5px),访问权限用 ≤56px 实心 chip
- 同样适用于协议帧格式(CAN frame / TCP header):把"bit"换成"byte/field"

### 15.4 SoC / 芯片框图（soc-block）

- 子系统 = tint zone(CPU 橙焦点 / 内存绿 / 高速外设蓝 / 低速外设金 / 时钟复位墨),zone 内连线用 zone hue
- **互连(NoC / AXI / AHB 总线)= 中性细长卡**(白或墨 tint `#e7e4d9`),绝不允许画成饱和满宽色带(saturated-band 闸);APB 桥单独一张小卡喂低速 zone
- 唯一的主数据路径(CPU→NoC→DDR)橙 1.8px + 徽章;其余 zone 连线 1.2px
- 每张 IP 卡两行:IP 名 + 关键参数(`DDR4 ctrl + PHY` / `Cortex-A55 ×2 (L1 32K)`)
- **边界**:这一节画的是**一颗芯片内部**,只有一套物理地址空间。跨 die / 跨插槽、两侧各有一套编号的,是 §15.8 的图型 —— 别在 SoC 框图里塞第二套地址

### 15.5 硬件波形时序图（hw-timing-waveform）

- 一信号一 lane,左侧 12px 600 标签;波形线 1.8px;**焦点信号(CS / 触发 / 使能)用橙,其余 lane 各 hue 区分**(SCLK 墨 / MOSI 蓝 / MISO 绿)
- 数据段画成 tint cell + 居中 hex 值(`0x9F`);high-Z 用灰短划
- 采样点 = 浅灰虚线竖线(每个有效沿);时序参数(tSU/tH/tCSS)= 双箭头 + 11px 标注,**离波形线 ≥ 8px**
- 底部时间轴 t0..tn(10.5-11px);面板内放协议小标题 chip(`SPI mode 0 · CPOL=0 CPHA=0`)

### 15.6 编译流程图（build-pipeline）

- 工具步骤(橙点卡)和产物(蓝点卡)**交替**出现,主链橙 1.8px + 编号;产物卡副行写格式(`ELF + symbols`)
- 并行分支(dts→dtc→dtb)走 gold 1.2px,在打包步骤(mkimage FIT)圆角汇入
- 最终交付物(boot.itb / Image.gz)用焦点卡 `#fbeee7` + 橙边
- 图例:橙点=工具 · 蓝点=产物 · 金=分支

### 15.7 调度时间线（sched-timeline）

- 一 CPU 一 lane(左标签 `CPU 0/1/2`),底部统一时间轴 + ticks(ms)
- 任务块 = tint 块 + **4px 左色边** + 任务名 11.5px;同一任务跨 CPU 保持同 hue;idle = 白底灰虚线边
- IRQ/抢占 = 竖线 + 实心橙徽章 + 事件标签(`IRQ · eth0 rx`);任务迁移 = 灰虚线圆角箭头 + `migrate` 标注
- 图例必须有(任务数 ≥ 2 即多色);此图型天然 ≥ 3 hue,注意橙只给一个焦点事件/任务

### 15.8 互连拓扑 + 地址空间映射图（interconnect-map）

**这张图只回答一个问题:一次访存落在谁的编号上、字节走哪根线。**

拓扑单独画,读者知道"两块 die 之间有一根线",但不知道那根线意味着 `*p = 1` 直接写到对面,
还是必须 `dma_map_single()` 再让设备自己搬 —— 这两条路的驱动代码没有一行相同。
地址空间条单独画,读者知道有一段窗口,却不知道这段窗口的字节走哪根线、跨不跨一致性域。
**把两半缝在一起的那条虚线就是这个图型存在的全部理由**:它落在地址带的哪一段上,
就是在说"这一段能用一条普通访存指令读到"。分成两张图,这一步要读者自己在脑子里把两半对上 ——
而这一步对不上,正是异构内存最常见的误解来源(把"传指针"和"拷一份"当成两种等价写法)。

结构自上而下三层,三层都在同一个 viewBox 里,**不许拆成上下两张 figure**——一拆就回到了上面说的那个坑。

**① 拓扑层 —— 谁和谁之间有线**

- **节点分组容器**:一个插槽 / 一颗超级芯片 / 一块加速卡 = 一个 §2 分组(tint 底 + 虚线边 `4 3` + rx 10-12)。
  **框的边界必须正好落在私有域的边界上** —— 框存在的理由是画出"框内私有、框外要过互连"这条界,
  不是好看的分区。为了让边界排得整齐,把一块共享内存圈进某个框,这张图就开始说假话了。
- **芯片卡两行**(§3):die 名 + 关键参数(`Grace CPU · 72 core` / `H100 · 80 GB HBM3`)。
  同一 node 内的私有内存(DDR / HBM)**也是卡**,不是背景色块 —— 它是这张图里被寻址的对象之一。
- **互连线 = 线 + 药丸**。每条线的中段压一颗胶囊(rx = 高/2,墨 tint `#e7e4d9` 底 + 10.5-11px 600 `#141413`),
  写**协议名 + 一个关键指标**(`NVLink-C2C · 900 GB/s`)。这是本图型的签名动作,理由是几何的:
  线会拐弯、会交叉,标签写在线**旁**归属有歧义;压在线**上**归属由位置唯一确定,
  药丸底色顺带切断了交叉处的视觉打架。
- **方向即语义**:对等双向 = 两端箭头;主从单向 = 单端箭头;多方共享一个交换 = 全部汇聚到一张
  **中性交换卡**(白底或墨 tint,**不是**饱和色带 —— 同 §15.4 对互连的规定,saturated-band 闸也在看)。
  **一条线只表达一种关系**:"能互访"和"经由谁"是两件事,合成一根线就都读不出来了。

**② 地址空间层 —— 程序看到的编号**

- **一个视角一条水平条带**,条带贴 label chip 写清是谁的视角(`HOST PHYSICAL` / `DEVICE PHYSICAL` / `PCIe BUS`)。
  **两条带永不合并**:合并等于宣布两边编号是同一套,而"同一块 DRAM 在 CPU 眼里是 `0x8000_0000`、
  在设备眼里是 `0x0`"恰恰是这类系统最贵的坑。
- 条带内 1px 虚线分段,每段一个名字 + 起始地址(11px)。段宽**粗略**按容量成比例;
  比例做不准时在 figcaption 里说一句"宽度不按比例" —— 不说,读者会拿宽度去估容量。
- **窗口用斜纹,不换色相**。某段是从另一个空间开进来的窗(BAR / Export / EGM / DMA 区),
  在该段上叠 45° hatch(`#6a9bcc`,`opacity 0.35`,间距 6),底下的类别 tint 保持不变。
  斜纹和色相是**正交的两个通道**:色相说"这是哪类内存",斜纹说"这块地不是本地的"。
  给窗口换个鲜艳色相,就是把两件事挤进一个通道,读者只能二选一地理解。
- **跨空间映射线走条带下方**:从条带 A 的那一段拉 1.2px 虚线到条带 B 的那一段,中段压药丸写映射机制
  (`NVLink-C2C` / `IOMMU` / `BAR0`)。**一条映射线只连两段**;多对多的关系拆成两张图,别在一张里织网。

**③ 缝合层 —— 谁能直接访问**

- 一到两颗**执行体胶囊**(`CPU core · ld/st` / `GPU SM · ld/st`),各拉一条橙 1.2px 虚线箭头,
  **精确落在条带的某一段上**,不是落在整条带上。这条线是全图焦点,§1 的橙色预算(一图 1-2 处)优先给它。
- **figcaption 必须把这条线的结论写成一句话**:"GPU 的 SM 能用一条 `ld` 指令读到 host 的这一段,不走 memcpy"。
  图上有线、字上没有结论 = 读者仍然不知道能不能直接传指针,那这张图白画了。

**尺寸**:天然 T ≥ 30,**一律 1200 wide 档**(`anth-container--wide` + `grid-column: 1 / -1`),viewBox 宽 1200-1280。
高度是它最容易翻车的地方 —— 三层叠起来很容易冲过 `diagram-oversized` 的 640px 渲染线。
反解上限:`viewBox 高 ≤ 640 × viewBox 宽 / 渲染宽`,1240 宽进 wide 档(渲染 ~1130)算得 **702 单位**,工作值取 ≤620。
**node 超过 2 个就把地址层拆成第二张图**,不要靠压行高硬塞。

| ❌ 别画 | 它教错了什么 |
|---|---|
| 只画拓扑,地址范围当一行小字写在框里 | 地址是每个视角一套编号;写进同一个框等于宣布只有一套 |
| 两条地址带画成一条长带、中间竖线隔开 | 同上,而且竖线读作"同一空间的两段",意思正好反了 |
| 窗口段换一个鲜艳颜色 | 色相已经在编码内存类别;抢通道的结果是两件事都读不出 |
| 互连线的名字写在线旁边 | 线一交叉归属就不明;药丸压线是这个图型的立身之本 |
| 交换 / fabric 画成满宽饱和色带 | 互连是中性细长卡(§15.4 同款规定);色带会触 saturated-band 闸 |
| Load/Store 箭头落在整条带上 | 那句话退化成"CPU 能访问内存",等于没说;必须落到某一段才有信息 |
| 一张塞 4 个以上 node + 全部地址空间 | 高度冲线、标签压到 9px 以下 —— 拆图,别缩字号 |
