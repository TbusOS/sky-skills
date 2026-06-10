# Diagram Craft — 手工 SVG 图示工艺（apple-design）

> **约束分三层**:① 审美(灰阶 + 一处蓝、无边框柔影、留白)不可变;② 工艺质量(可读性 / 字号 /
> 不留白画布)机器闸强制;③ **图型与结构自由定制**——模板和 §12 谱系是审美起点和设计思想,
> 不是强制规格。内容决定结构,变体 / 混搭 / 自创图型都允许,只要 ①② 成立。

> 适用：架构图 / 流程图 / 层级图 / 时间线 / 时序图等一切工程类图示。
> 与 anthropic 的多色语义路线不同，**apple 图的美感来自"少"**：无彩色为主、蓝色一处、柔影分层、留白比信息多。
> 模板：`templates/diagrams/`（architecture / flow / hierarchy / timeline / sequence / deployment / state-machine + 内核七件 function-flowchart / algorithm-ringbuffer / register-bitfield / soc-block / hw-timing-waveform / build-pipeline / sched-timeline,共 **14 件**,全部按本文标准实现）。案例库：`demos/apple-design/diagrams.html`（14 张图,每张带 Copy SVG）。

## 0. 第一原则：美靠"少"

- **无彩色为主**：白底、`#f5f5f7` 分组、灰阶文字与连线
- **蓝 `#0071e3` 全图只点一处**：主路径 + 1 张焦点卡 + 决策菱形（同属一个叙事焦点）；蓝色元素 > 2 处即过量
- 颜色覆盖率目标 < 5%；visual-audit 聚合饱和填充 > 30% viewBox 告警（known-bugs §1.27）
- 不用 dot-grid、不用纹理、不用虚线分组框——背景保持纯净（这是和 anthropic 的核心分界）

## 1. 调色板

| 用途 | 值 |
|---|---|
| 焦点 / 主路径 / 徽章 | `#0071e3` |
| 决策菱形 tint | `#eaf3fe` |
| 主名文字 | `#1d1d1f` |
| icon / 次级 | `#6e6e73` |
| 副说明 / 弱标签 | `#86868b` |
| 次要连线 / upcoming 环 | `#aeaeb2` |
| 时间线轴 / 分隔 | `#d2d2d7` |
| 分组底 | `#f5f5f7` |

## 2. 深度靠柔影，不靠边框

- 分组容器：`#f5f5f7` + rx 18 + **无边框**；标签 12px 500 `#86868b` 正常大小写（apple 不用 uppercase letter-spacing 标签）
- 节点卡：白底 + rx 14 + **无描边** + 柔影 `feDropShadow dx=0 dy=4 stdDeviation=8 flood-opacity=0.08`——白卡靠影子从浅灰分组里浮起来
- 焦点卡：白底 + 蓝 1.5px 描边（全图唯一带边框的卡）
- 圆角体系：分组 18 / 卡 14 / chip 10——比 anthropic 更圆润，对齐硬件语言

## 3. 节点卡排版

- **字阶反差替代颜色分类**：主名 13.5-15px 600 `#1d1d1f` + 副说明 11.5-12px `#86868b`
- icon 直接浮在卡内左侧（**无 tile 底块**，这点和 anthropic 不同）：24×24 坐标、stroke 1.5-1.6、round cap/join、`fill="none"`、灰 `#6e6e73`；焦点卡 icon 用蓝
- 留白配额比 anthropic 多 25%：卡高 88（主行）/ 72（次行），组间距 44，分组上下 padding ≥ 36

## 4. 连线

- 圆角正交折线（8px quadratic 拐角）、边缘锚点出发，同 anthropic §4
- 主路径蓝 1.8px 实线；次要灰 `#aeaeb2` 1.2px **实线**（apple 少用虚线；虚线只留给回流/未定状态）
- 箭头 7px 同色小三角 marker
- 编号徽章：r=10 蓝圆 + 11px 600 白字，只标主路径

## 5. 决策菱形

蓝 tint `#eaf3fe` + 蓝 1.5px 边 + 12px 600 `#1d1d1f` 问题文字。全图唯一的 tint 色块。出口标注 `yes` / `no` 11px 600（yes 蓝 / no 灰），text-anchor="middle"，与徽章保持 ≥ 4px。

## 6. 先定尺寸再画 + 布局公式

**内容多的图必须画大,不准把元素缩小塞进固定画布**。画第一笔之前先算：

```
预估列数 C、最宽节点字符数、<text> 总数 T
viewBox 宽 = max(720, C × (节点宽 + 24) + 2 × 24)
scale = 容器内可用宽 / viewBox 宽 ≥ 0.82（11px 源字号 → 渲染 ≥ 9px）
```

| 容器档位 | 适用 |
|---|---|
| 980 标准（`apple-container`） | T ≤ 18 的图 |
| 1280 hero（`apple-container--hero` + `grid-column: 1 / -1`） | **T ≥ 20 或 C ≥ 4 必须用** |

scale < 0.82 → 升档；1280 还不够 → 拆成两张图，不准缩字号。**viewBox 紧贴内容**：内容 bbox 距 viewBox 边 ≤ 24px——viewBox 写大、内容挤中间 = 两侧死空间逼所有标签变小（svg-letterbox 闸,known-bugs §1.28;dense-diagram-cramped 闸,§1.29;diagram-tiny-text 闸现在覆盖所有 figure 图,不再限 hero）。

通用布局规则同 anthropic §8.2：节点宽 = max(160, 英文字符 × 9, CJK × 18)；4px 网格；viewBox padding ≥ 24；SVG 文字 ≥ 11px 源字号；文字 bbox 互不相交 ≥ 4px。apple 特有：信息密集的 hero 框图必须放 `apple-container--hero`（1280px）并 `grid-column: 1 / -1`，否则 980px 窄容器把文字压到 < 9px（SKILL.md 既有红线）。

## 7. 时序图（sequence diagram）

apple 风时序图 pattern（anthropic 有专文 `sequence-diagrams.md`，apple 按下面适配）：

- **actor 卡**：顶部一排白卡 + 柔影（同 §2 节点卡），间距 ≥ 200px，每卡 icon + 名字
- **lifeline**：自 actor 卡底中心垂下，`#d2d2d7` 1px 实线
- **消息箭头**：水平线 + 7px 三角；请求实线、响应 1.2px 虚线；**主叙事链蓝色、其余灰色**
- **step 编号**：消息线起点 r=10 蓝徽章（主链）/ 灰徽章 `#aeaeb2`（支链）
- **激活条**：lifeline 上 8px 宽白色圆角条 + 柔影，表示处理区间
- 消息标签 11-12px `#1d1d1f` 置于线上方 6px；返回值标签 11px `#86868b`
- 文字一律平排（不旋转）；图宽不够就加宽 viewBox，不准缩字号

## 8. 数据表达优先级

复杂信息先考虑 **巨字号统计**（`data-display.md`：120px big number + caption），它是 apple 的视觉主角；柱图/饼图是最后选项。流程和结构才用本文的图示。产品形态用 SVG 设备线稿 mock：圆角矩形外框（手机 rx 28 / laptop rx 12 + 底座梯形）+ 浅灰描边 + 内容区极简线段——不要试图画拟真渐变金属质感（单文件 SVG 画不像，宁可线稿化）。

## 9. 图密度合约

同 anthropic `diagram-craft.md` §12 的表格执行（≥3 步流程必须图、数字必须 stat、结构必须架构图、>2 屏纯文字必须插视觉元素、每 1.5 屏 ≥ 1 个视觉元素）。apple 页面里 stat callout 可计入视觉元素。机器闸：`text-desert`（连续 2600px 无视觉元素 → warn,known-bugs §1.31）跨 skill 生效。注意 diagram-monochrome（0 饱和 hue 闸）**只对 anthropic 生效**——apple 的灰阶 + 蓝单焦点是身份,不是 bug。

## 10. figure 语义规范

同 anthropic §13：`<figure>` + 真实 `<figcaption>`（known-bugs §1.18）；SVG 带 `role="img"` + `aria-label`。

## 11. 反模式清单

- ❌ 彩色分类（多 hue 是 anthropic 的语言；apple 只有蓝一个焦点色）
- ❌ 卡片加边框 + 阴影双重描边（二选一：普通卡只用柔影，焦点卡只加蓝边）
- ❌ uppercase letter-spacing 分组标签 / dot-grid / 虚线分组框（anthropic 专属，用了就是 cross-skill smell）
- ❌ 满宽色带、纯文字盒子、斜线穿心、大箭头、坐标随手写（同 anthropic §14 通用反模式）
- ❌ 高饱和渐变 / 拟真材质 / 阴影 opacity > 0.12
- ❌ 一图多焦点（蓝色元素 > 2 处）
- ❌ viewBox 写大、内容挤中间一窄条（→ §6 先算再画;svg-letterbox 闸）
- ❌ ≥ 20 个 text 的密图塞 980 标准容器（→ 1280 hero 档;dense-diagram-cramped 闸）
- ❌ 长文页面通篇无图（→ §9 图密度合约;text-desert 闸）

## 12. 内核 / 嵌入式工程图谱系（apple 语法）

> 7 个图型与 anthropic §15 同谱系（function-flowchart / algorithm / register-bitfield / soc-block /
> hw-timing-waveform / build-pipeline / sched-timeline），模板在 `templates/diagrams/` 同名 .svg。
> 模板是起点不是规格——结构、密度、布局按实际内容重设计,谱系之外的内容自创图型即可。
> 结构性工艺（布局、lane、车道、交替、双箭头标注）参考 anthropic §15;本节只写 apple 的**翻译规则**。

核心问题只有一个：anthropic 用多 hue 编码类别，apple 只有灰阶 + 一个蓝——**每个图型必须先回答"蓝给谁"**：

| 图型 | 蓝的唯一归属（单一叙事） | 其余元素 |
|---|---|---|
| 函数流程图 | happy path 主链 + 编号徽章 | 错误车道灰 1.2px 虚线,出口灰卡 |
| 算法原理图 | 写入侧指针(in/tail)——"新数据落在哪" | 数据格 `#eaf3fe` tint,读出指针墨色 |
| 寄存器位域图 | 焦点字段(EN 位类):tint + 蓝 1.5px 边 + 蓝字段名 | 普通字段 `#f5f5f7`,reserved 白底灰杠 |
| SoC 框图 | CPU 焦点卡 + 主数据路径 CPU→NoC→DDR | zone 全部 `#f5f5f7` 无边容器,其余连线 `#aeaeb2` |
| 波形时序图 | CS_N / 触发信号 + 其 active 窗口 tint | 其他 lane 用灰阶值区分(#1d1d1f / #6e6e73 / #aeaeb2) |
| 编译流程图 | 主链 + 终点交付物焦点卡 | devicetree 等分支灰实线汇入 |
| 调度时间线 | 被追踪的那一个任务(块 tint + 蓝边 + 迁移箭头) | 其他任务 `#f5f5f7`,IRQ 标记用墨不用蓝 |

三条 apple 专属注意：

1. **类别信息不丢**：anthropic 靠 hue 区分的维度,apple 靠"灰阶值 + 字重 + tint 有无"补偿——波形 lane 用三档灰,寄存器字段靠 tint/白底二分。画完自问:黑白打印仍能读吗?
2. 位格 / 单元格阵列的 hairline(0.5-1px `#d2d2d7`)是允许的"格栅"例外——无边框原则针对卡片,不针对表格性结构。
3. 时序参数标注(tSU/tH)、wrap 注释等机制性文字一律 `#86868b` 11-12px;不准为了强调改蓝——蓝的预算已经花给焦点了。
