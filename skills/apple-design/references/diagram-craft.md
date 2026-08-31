# Diagram Craft — 手工 SVG 图示工艺（apple-design）

> **约束分三层**:① 审美(灰阶 + 一处蓝、无边框柔影、留白)不可变;② 工艺质量(可读性 / 字号 /
> 不留白画布)机器闸强制;③ **图型与结构自由定制**——模板和 §12 谱系是审美起点和设计思想,
> 不是强制规格。内容决定结构,变体 / 混搭 / 自创图型都允许,只要 ①② 成立。

> 适用：架构图 / 流程图 / 层级图 / 时间线 / 时序图等一切工程类图示。
> 与 anthropic 的多色语义路线不同，**apple 图的美感来自"少"**：无彩色为主、蓝色一处、柔影分层、留白比信息多。
> 模板：`templates/diagrams/`（architecture / flow / hierarchy / timeline / sequence / deployment / state-machine + 内核七件 function-flowchart / algorithm-ringbuffer / register-bitfield / soc-block / hw-timing-waveform / build-pipeline / sched-timeline + 互连拓扑 interconnect-map + 协议分层 protocol-stack + 地址映射 address-map + 芯片与代码七件 system-topology / die-floorplan / datapath / packet-encap / terminal-annotated / struct-graph / bus-fabric + 调用与时序六件 call-graph / call-stack / runtime-timeline / frame-pipeline / multicore-calls / power-sequence,共 **30 件**,全部按本文标准实现；另有 §8 配套的 device-mock.svg 设备线稿底版与 §15 的 glyphs.svg 构件片段集,均不计入图型谱系）。案例库：`demos/apple-design/diagrams.html`（31 张图,每张带 Copy SVG）。

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
- 圆角体系：分组 18 / 卡 14 / chip 10——比 anthropic 更圆润，贴近硬件语言

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

## 8. 数据表达优先级 + 设备线稿 mock

复杂信息先考虑 **巨字号统计**（`data-display.md`：120px big number + caption），它是 apple 的视觉主角；柱图/饼图是最后选项。流程和结构才用本文的图示。

产品形态用 SVG 设备线稿 mock，**线稿化不拟真**——渐变金属质感单文件 SVG 画不像，宁可全线稿。起点文件 `templates/diagrams/device-mock.svg`（三框并排、底边共线，复制需要的设备组单独用）：

| 设备 | 外框 w×h（比例） | 外框 rx | 屏区 | 结构细节 | 场景 |
|---|---|---|---|---|---|
| phone | 148×320（≈9:19.5） | 28 | 内缩 8 / rx 20 | 顶部胶囊岛 44×10 + 底部 home 条 44×4 | App / 移动端 UI |
| laptop | 屏 400×248（16:10） | 12 | 内缩 12 / rx 6 | 底座梯形（比屏宽各外扩 32、高 12、中央 48px 凹槽弧）+ 摄像头点 | 桌面端 / 控制台 |
| tablet | 220×296（≈3:4 竖屏） | 20 | 内缩 8 / rx 12 | 顶部摄像头点 r 1.5 | 阅读 / 中屏对比 |

- **描边**：机身 `#aeaeb2` 1.5px + `fill #ffffff`；屏区 `#d2d2d7` 1px 无填充；细节件（岛 / home 条 / 摄像头点）填 `#d2d2d7`——只用这两档灰，不引入新灰阶
- **内容区**：几条 stroke-width 8、round linecap 的 `#d2d2d7` 短线，长短错落示意标题/正文即可；模板内有注释标记，使用时替换为实际 UI 线段
- **焦点**：全图至多 1 条线换 `#0071e3`（如 CTA），或全灰阶零焦点；禁止渐变 / 金属质感 / 高饱和填充 / 实物照片描摹
- 多设备同图底边基线对齐；标注 11-12px `#86868b` 平排在设备下方，不旋转

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

> 23 个图型与 anthropic §15 同谱系(芯片与代码七件的 apple 译法见 §16,调用与时序六件见 §17)（function-flowchart / algorithm / register-bitfield / soc-block /
> hw-timing-waveform / build-pipeline / sched-timeline / interconnect-map / protocol-stack / address-map），模板在 `templates/diagrams/` 同名 .svg。
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
| 互连拓扑 + 地址映射 | **能用一条普通 `ld` / `st` 抵达的那一段,加上落到它的那条路径** —— 全图就为这一句存在 | 其余互连线、另一侧的访问路径、跨空间映射线全部 `#aeaeb2`;地址段 `#f5f5f7` |
| 协议分层对等图 | **本次这一笔传输走的那条路**(纵向下去 → 过线 → 纵向上来)+ 它的编号徽章 | 层区 `#f5f5f7` 无边框;对等虚线 `#aeaeb2`;最底下那根真线 `#1d1d1f` 2.4px |
| 纵向地址映射图 | **那条重映射线,以及它两端落到的两段**(段加蓝 1.5px 边 + 蓝段名) | 直映射线 `#aeaeb2` 1.2px;地址段 `#f5f5f7`;窗口段白底 + `#aeaeb2` 斜纹 |

三条 apple 专属注意：

1. **类别信息不丢**：anthropic 靠 hue 区分的维度,apple 靠"灰阶值 + 字重 + tint 有无"补偿——波形 lane 用三档灰,寄存器字段靠 tint/白底二分。画完自问:黑白打印仍能读吗?
2. 位格 / 单元格阵列的 hairline(0.5-1px `#d2d2d7`)是允许的"格栅"例外——无边框原则针对卡片,不针对表格性结构。
3. 时序参数标注(tSU/tH)、wrap 注释等机制性文字一律 `#86868b` 11-12px;不准为了强调改蓝——蓝的预算已经花给焦点了。

## 13. 互连拓扑 + 地址空间映射图（interconnect-map）的 apple 译法

图型本身的工程规矩(三层结构、药丸标互连线、两条地址带永不合并、窗口用斜纹、
Load/Store 线必须落到某一段)见 anthropic `diagram-craft.md` §15.8 —— 那些是工程约束,
跨 skill 通用。**这一节只写 apple 独有的四处翻译**,每一处都是把 anthropic 的做法换掉,
照搬过来就是串味(§11 反模式列的正是这几条)。

1. **节点分组不许画虚线框。** anthropic 用 tint 底 + 虚线边圈出一个插槽;apple 的分组是
   **`#f5f5f7` 平底 + rx 18 + 无边框**(§2)。"框内私有、框外过互连"这条界靠**底色的有无**读出来,
   不靠边框。虚线框是 anthropic 的签名,用了就触 cross-skill-smell。
2. **互连线上的药丸 = 白胶囊 + 柔影**,不是 tint chip。rx = 高/2、白底、`feDropShadow dy=2 stdDeviation=4`、
   文字 11.5px 500 `#6e6e73`。药丸要压在线上把线切断,所以**必须是实底**;
   apple 的实底只有白,层次靠影子(§2)。
3. **斜纹用灰不用蓝。** 窗口段的 hatch 是 `#aeaeb2` `opacity 0.5` —— 蓝的预算已经全部花给
   "谁能直接访问"那条叙事了(见 §12 表)。窗口段本身填白,靠斜纹和相邻的 `#f5f5f7` 分段区分。
4. **蓝只走一条链,两侧不对称是对的。** 两条 `ld/st` 线里只有**一条**是蓝 1.8px 实线,
   另一条 `#aeaeb2` 1.2px;蓝线落到的那一段加蓝 1.5px 边 + 蓝色段名。合起来是一处叙事焦点,
   不是三处蓝。**另一侧同样能直接访问这件事,写在 figcaption 里**,不靠再点一次蓝 ——
   "两边都能"是背景事实,"这一条是这页要讲的"才是图的焦点。

**尺寸**:天然 T ≥ 30,一律 `apple-container--hero`(1280) + `grid-column: 1 / -1`。
高度是这个图型最容易翻车的地方,而 apple 的留白配额比 anthropic 多 25%(§3),
同样的信息量更容易顶到 `diagram-oversized` 的 640px 渲染线。
**hero 档的渲染宽约等于 viewBox 宽,所以 viewBox 高几乎就是渲染高** ——
`templates/diagrams/interconnect-map.svg` 是 `1240 × 640`,1240 渲染宽下正好压在线上。
初稿按 anthropic 的行距排出来是 656 单位,在 hero 档渲染 656px、当场越线;
压回 640 靠的是把交换机那一段的纵向 gap 从 56 收到 40,**不是**压卡高或压字号 ——
留白一压,这张图就不再是 apple 了。**node 超过 2 个、或者要画第三条地址带,拆图。**

## 14. 三条通用工艺的 apple 译法（药丸 / 两类箭头 / 图族）

工程约束本身见 anthropic `diagram-craft.md` §4.6、§4.7、§16 —— 那三条跨 skill 通用。
这一节只写**换到 apple 语法后哪里必须改**,照搬 anthropic 的画法就是串味。

1. **线上药丸 = 白胶囊 + 柔影,不是 tint chip。** rx = 高/2、白底、
   `feDropShadow dy=2 stdDeviation=4 flood-opacity=0.10`、文字 12.5px 500 `#6e6e73`。
   门槛不变:**同类线 ≥ 2 条,每条都要写清是什么**(名字 + 一个指标或位宽)。
   药丸必须是实底 —— 它的作用之一就是把线切断,让交叉处不打架;apple 的实底只有白,层次靠影子(§2)。

2. **两类箭头在 apple 靠"颜色 + 线宽"分,不靠虚实。** 这是和 anthropic 最大的一处分歧,
   原因在 §4:**apple 少用虚线,虚线只留给回流 / 未定状态**。所以 ——
   - **一直在那儿的结构** = `#aeaeb2` 1.2px **实线**
   - **本节正在讲的这一次** = 蓝 `#0071e3` 1.8px **实线** + 蓝编号徽章
   - **虚线留给一类东西:根本不存在的那条连接**(协议分层图里的对等线就是它的正主 ——
     "同层之间看起来在对话"恰恰是一条不存在的线,用虚线画它是 apple 虚线配额最正当的用法)。
   照 anthropic 把"本次传输"画成彩虚线,在 apple 语法里读出来是"这条路径不确定 / 是回流",
   意思正好拧了。

3. **图族的"底不许动"在 apple 更严。** apple 的分组没有边框,地形靠 `#f5f5f7` 底色的形状认;
   底色形状一变,读者连"这是同一张图"都认不出来 —— anthropic 至少还有虚线框和 tint 色相兜底。
   所以族内各张的 zone 矩形坐标必须逐字节相同,**viewBox 高度按最后一张定,前几张下方留白**。

## 15. 协议分层 / 地址映射 / 构件字形（apple 独有的翻译点）

**protocol-stack** —— 结构规矩(两侧镜像、层高相同、纵向不许跳层、最底下那根是全图唯一横向实线)
见 anthropic §15.9。apple 改三处:

- **层区不许画虚线框**,`#f5f5f7` 平底 + rx 18 + 无边框(§2)。层与层之间靠**间隙**分开,不靠边框。
- **层名不做骑边标签**(没有边可骑),改成层区左上方 12.5px 500 `#86868b` **正常大小写**的一行小字
  (`Transaction layer`,不是 `TRANSACTION LAYER` —— apple 不用 uppercase + letter-spacing 标签)。
- **最底下那根真线加粗到 2.4px 墨色**,和蓝色的传输路径拉开层级:两者都是实线,靠粗细和颜色分。
  黑白打印时粗细仍在,这正是 §12 注 1 要的补偿。

**address-map** —— 结构规矩(引线指边界、符号名与常量分档、两条带永不合并、窗口用斜纹)
见 anthropic §15.10。apple 改两处:

- **符号名与字面常量的分档不靠颜色,靠字体。** anthropic 用墨 / 橙两档药丸;
  apple 全是白药丸 + 柔影,**符号名 12.5px 600 `#1d1d1f`,字面常量 12.5px 等宽 `#6e6e73`**。
  等宽字体本身就在说"这是一个会变的数值",和 §12 注 1 的"灰阶值 + 字重 + tint 有无"是同一套补偿。
- **蓝只给那条重映射线和它两端落到的两段**(段加蓝 1.5px 边 —— 这是全图唯一带边框的东西,§2)。
  直映射线全部 `#aeaeb2`;"两边都是直映射"是背景事实,写进 figcaption,不再点一次蓝。

**glyphs.svg** —— 片段集,不计入图型谱系。规矩见 anthropic §17(每个字形是一个意义固定的名词、
没有那样东西就不许画、厂商 logo 一律不进)。apple 改一处:**蓝只给"活着"的那一个状态** ——
写入指针 `in`、已插卡的那一个槽、link 起来的 LED;读出指针 `out` 和其余形状全部墨色。
`diagram-monochrome` 对 apple 豁免(灰阶是 apple 的身份),但**豁免不是"不许有蓝"** ——
一个状态都不点,读者分不出这张片段集里哪些是"有东西"哪些是"空的"。

**尺寸**:两张图都是 `viewBox 1240 × 560` / `1240 × 600`,走 `apple-container--wide`。
⚠ **apple 的 gallery 图位只有 946px 宽**(known-bugs §1.50 实测),viewBox 1240 时缩放 **0.763** ——
**最小源字号必须 ≥ 12.5**(渲染 9.54px)。anthropic 的同名模板用 11.5 源字号,
原样搬过来渲染 8.8px,当场触 `dense-diagram-labels-small`。**跨 skill 移植图先按 apple 这一档算。**

---

## 16. 芯片与代码七件的 apple 译法

模板：`templates/diagrams/` 的 `system-topology` / `die-floorplan` / `datapath` /
`packet-encap` / `terminal-annotated` / `struct-graph` / `bus-fabric`。
**图型本身的工艺**（为什么这么画、每一件的硬规矩）写在 anthropic-design 的
`diagram-craft.md` §15.11–15.17，不在这里重复；本节只写 apple 皮下面不一样的地方。

### 16.1 一个强调色的分配问题

anthropic 那七张各用了四种语义色（内存绿 / 计算蓝 / 窗口琥珀 / 焦点橙）。
apple 只有一个 `#0071e3`，其余全是灰阶 —— 所以**必须先决定这张图的蓝给谁**：

| 图 | 蓝给谁 | 为什么 |
|---|---|---|
| system-topology | **地址条上的 MMIO 窗口** | 整张图就是为了让窗口和设备卡对上;此图没有第二条被追踪的路径来抢蓝 |
| packet-encap | **每层加进来的那几个字段** | 图的结论就是"外面长出来的是什么" |
| die-floorplan | **被追踪的那一次请求** | 互连轨降成 `#d2d2d7` 灰;轨和请求都用蓝,请求就不再是请求 |
| datapath / bus-fabric / terminal-annotated / struct-graph | 被追踪的那条路 / 编号徽章 | 同上 |

**没有它会怎样**：把结构线和被追踪的路都涂成品牌蓝，读者分不出「一直在那儿的」
和「这一次走过的」—— 这正是 §14 两类箭头要解决的事，在单色系统里靠色相解决不了，
**只能靠"谁拿到蓝"**。

### 16.2 灰阶也要分层

去掉色相之后，类别只剩明度可用。固定三档：
`#ffffff` 卡面 · `#f5f5f7` 次级块 · `#d2d2d7` 边框 · `#aeaeb2` 结构线 · `#86868b` 说明文字。
**不要在这五档之外再造灰** —— 六档以上人眼排不出顺序，图就成了噪点。

### 16.3 字号台阶

apple 的 gallery 图位是三家里最窄的（946 px，known-bugs §1.50）。
七件的 viewBox 是 `1120 × 560`，缩放 0.845，所以**最小标签写 12.5，不写 12**
（12 会渲染成 10.14，勉强过；12.5 是 10.56，留了余量，且本来就是 apple 的字号）。
标题行 13.5。

### 16.4 终端卡在 apple 里的处理

`terminal-annotated` 的深色卡片**不跟随主题**：终端就是深色的，
卡面用 `#1d1d1f`、标题条 `#2c2c2e`、正文 `#d2d2d7`、次要行 `#86868b`。
高亮块用 `#0071e3` 加 0.26 透明度 —— 这是 apple 里唯一允许"色块盖字"的地方，
因为它盖的是等宽 log，不是版式文字。

---

## 17. 调用与时序六件的 apple 译法

模板：`templates/diagrams/` 的 `call-graph` / `call-stack` / `runtime-timeline` /
`frame-pipeline` / `multicore-calls` / `power-sequence`。
**图型工艺**在 anthropic-design `diagram-craft.md` §15.18–15.23;本节只写 apple 的译法。

### 17.1 五种边只剩一个色，用线型顶上

`call-graph` 在 anthropic 用五种颜色区分边。apple 只有一个 `#0071e3`，
所以**颜色让位给线型和箭头形状**：

| 边 | apple 画法 |
|---|---|
| 直接调用 | 实线 · 实心箭头 · `#1d1d1f` |
| **经 ops 表** | 实线 · **空心箭头** · `#0071e3` ← 唯一的蓝 |
| 异步交接 | **虚线** · 实心箭头 · `#aeaeb2` |
| 硬件事件 | 闪电折线 · `#aeaeb2` |
| 完成通知 | **点线** · 实心箭头 · `#aeaeb2` |

蓝给"经 ops 表"那一种，理由是这张图的结论就是**它是 grep 找不到的那一条**。
换句话说 —— **蓝给这张图真正要讲的那件事，不给最显眼的那个框**。

### 17.2 每张图先回答「蓝给谁」

六张各有各的答案，写死在这里免得下次又想一遍：

| 图 | 蓝给谁 | 其余 |
|---|---|---|
| call-graph | 经 ops 表的那条边 | 四种边靠线型区分 |
| call-stack | **出错的那一帧** | 断层线与幽灵卡走灰虚线 |
| runtime-timeline | **queue_work 到 worker 那 65 µs 的括线** | 另两条括线灰 |
| frame-pipeline | 后台缓冲 + 触发点徽章 + vsync + slack | 前台缓冲 / 扫描输出 / 面板全灰 |
| multicore-calls | IPI 与它逼出来的阻塞括线 | 应答走灰点线 |
| power-sequence | **RESET_N + t4 那条约束** | 四条电源轨全灰 |

### 17.3 淡蓝底上不要放蓝字

`#0071e3` 压在 `#eaf3fe` 上只有 4.4:1，差一点点过不了 AA。
**填色用 `#eaf3fe`、线条用 `#0071e3`、压在上面的文字一律 `#1d1d1f`。**
强调不靠字色靠形状 —— 蓝的框本身已经把眼睛拉过去了。

### 17.4 右对齐的行标签会从左边掉出去

这六张都是泳道图，行标签右对齐钉在泳道左边。
**apple 的字号比 anthropic 高半点（12.5 / 13.5），同一句话就宽出去一截** ——
`24 MHz · before reset rises` 在 anthropic 放得下，到 apple 就把左边界顶穿了，
而 SVG 不会报错，**它就是被裁掉**（known-bugs §1.59）。
落法:行标签写短，长条件搬到图脚;或者整列改成左对齐钉在 `x=32`。
