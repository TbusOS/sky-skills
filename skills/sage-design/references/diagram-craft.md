# Diagram Craft — 手工 SVG 图示工艺（sage-design）

> **约束分三层**:① 审美(米黄底 + sage 绿单焦点 + 靛蓝做墨 + hairline 分层 + 留白)不可变;
> ② 工艺质量(可读性 / 字号 / 不留白画布)机器闸强制;③ **图型与结构自由定制**——模板和 §6 谱系
> 是审美起点和设计思想,不是强制规格。内容决定结构,变体 / 混搭 / 自创图型都允许,只要 ①② 成立。

> 适用:架构图 / 流程图 / 层级图 / 时间线 / 时序图等一切工程类图示。
> 与 anthropic 的多色语义路线、apple 的灰阶柔影路线都不同,**sage 图的美感来自"安静"**:
> 米色 tint 分层、hairline 勾边、绿色全图只点一处、靛蓝当墨用。
> 模板:`templates/diagrams/`(architecture / flow / function-flowchart / build-pipeline /
> register-bitfield / soc-block / hw-timing-waveform / sched-timeline,共 **8 件(本批)**,全部按本文标准实现)。
> 案例库:`demos/sage-design/diagrams.html`(8 图,每张带 Copy SVG)。

## 0. 第一原则:绿单焦点 + 靛蓝做墨 + 暖灰分层

- **sage 绿 `#97B077` 全图只点一处**:主路径 + 1 张焦点卡(边)+ 同叙事的指针/色条;绿色元素 > 2 处即过量
- **靛蓝 `#393C54` 是墨,不是强调色**:主名文字、徽章填充、墨线、读出指针都用它——它出现再多也不抢焦点
- 层级靠 **米色 tint + hairline**,不靠饱和填充、不靠重阴影(阴影上限 `rgba(57,60,84,0.06)`)
- 白底画布 + 1px `#e5e8da` hairline 外框是默认画布语法(对齐 canonical landing 的编辑器 mock)

## 1. 调色板

| 用途 | 值 |
|---|---|
| 焦点路径 / 焦点卡边 / 指针 / 4px 色条 | `#97B077` |
| 深一档绿(hover / 焦点内描边) | `#7a9561` |
| 主名文字 / 徽章填充 / 墨线 / 读出指针 | `#393C54` |
| 副说明 / 弱标签 / 次要连线 | `#6d6f82` |
| hairline 边 / 时间轴 / lifeline | `#e5e8da` |
| 分组容器 / 决策菱形 / 焦点 tint | `#f0f3e2` |
| 深一档 tint(占用 cell / 焦点任务块) | `#c9d1b3` |
| 中性底(普通字段 / 非焦点任务) | `#eef2de` |
| 卡面 / 画布 | `#ffffff`(画布也可 `#f8faec`) |

**对比度红线**(design-tokens 实测):白字在 `#97B077` 上只有 2.4——**徽章、chip、按钮类小元素一律
靛蓝 `#393C54` 填充 + 白字**(11.3 ✓);绿只做线、边、指针、tint,不做有字的填充底。

## 2. 结构语法

- **分组容器**:`#f0f3e2` tint + rx 12 + 无边框(tint 本身就是分层);分组标签用 JetBrains Mono
  10.5-11px uppercase、letter-spacing 1.5px、`#6d6f82`——sage 的 `01 · SECTION` 编号语法搬进图里
- **节点卡**:白底 + 1px `#e5e8da` hairline 描边 + rx 12,**无阴影或羽量影**(柔影分层是 apple 的语言)
- **焦点卡**:白底 + sage `#97B077` 1.5px 描边,全图唯一的绿边卡
- **节点排版**:主名 13.5-15px 600 `#393C54` + 副说明 11.5-12px `#6d6f82`;icon 24×24、stroke 1.8、
  round cap/join、`fill="none"`、绿 `#97B077`(canonical 既有 icon 语法),无 tile 底块
- **连线**:圆角正交折线(8px 拐角)、边缘锚点出发(同 anthropic §4);主路径绿 1.8px 实线,
  次要 `#6d6f82` 1.2px 实线,回流/未定才用虚线;箭头 7px 同色小三角 marker
- **编号徽章**:r=10 靛蓝 `#393C54` 实心圆 + 11px 600 白字,只标主路径(绿底白字对比度不够,见 §1)
- **决策菱形**:`#f0f3e2` tint + sage 1.5px 边 + 12px 600 `#393C54` 问题文字;出口 `yes`/`no` 11px 600
  (yes 绿 `#7a9561` / no 灰 `#6d6f82`)

## 3. 先定尺寸再画 + 布局公式

**内容多的图必须画大,不准把元素缩小塞进固定画布**。画第一笔之前先算:

```
预估列数 C、最宽节点字符数、<text> 总数 T
viewBox 宽 = max(720, C × (节点宽 + 24) + 2 × 24)
scale = 容器内可用宽 / viewBox 宽 ≥ 0.82(11px 源字号 → 渲染 ≥ 9px)
```

| 容器档位(`assets/sage.css` 实测) | 可用宽(扣 24px 侧 padding) | 适用 |
|---|---|---|
| 960 标准(`sage-container`) | ≈ 912px | T ≤ 18 的图 |
| 1200 wide(`sage-container--wide` 或 `grid-column: 1 / -1`) | ≈ 1152px | **T ≥ 20 或 C ≥ 4 必须用** |

scale < 0.82 → 升档;1200 还不够 → 拆成两张图,不准缩字号。**viewBox 紧贴内容**:内容 bbox 距
viewBox 边 ≤ 24px(svg-letterbox 闸 §1.28;dense-diagram-cramped 闸 §1.29;diagram-tiny-text 闸覆盖所有 figure 图)。
通用布局规则同 anthropic §8.2:节点宽 = max(160, 英文字符 × 9, CJK × 18);4px 网格;SVG 文字 ≥ 11px
源字号;文字 bbox 互不相交 ≥ 4px。sage 特有坑(dos-and-donts 已踩):hero figure 的 padding 用
`var(--space-5) var(--space-6)`,用 `--space-7` 会吞掉 SVG 宽度。

## 4. 图密度合约

同 anthropic `diagram-craft.md` §12 的表格执行(≥3 步流程必须图、数字必须 stat、结构必须架构图、
>2 屏纯文字必须插视觉元素、每 1.5 屏 ≥ 1 个视觉元素)。机器闸:`text-desert`(连续 2600px 无视觉
元素 → warn,known-bugs §1.31)跨 skill 生效。

**diagram-monochrome 闸(0 饱和 hue)对 sage 生效**,结论与理由:

- sage 工程图**必须见绿**——绿是 sage 的签名,0 饱和 hue 的图(白卡 + 灰线 + 米底)是灰线稿,
  丢身份;sage 不像 apple 有"灰阶即身份"的豁免理由
- 机器口径:闸按 HSL `s > 0.25` 计 hue。`#97B077` s≈0.27 刚好过线;但 `#7a9561`(s≈0.21)和
  靛蓝 `#393C54`(s≈0.19)**都不计为 hue**——所以"绿在场"必须是实心 `#97B077` 元素
  (主路径线 / 指针 / 色条 / 焦点边),只用 sage-dark、ink、tint 的图机器上等于 0 hue
- 阈值与 anthropic 同款:0 hue 才告警(合法的"绿一处"图天然 ≥ 1 hue,不误伤)

## 5. figure 语义规范

同 anthropic §13:`<figure>` + 真实 `<figcaption>`(known-bugs §1.18);SVG 带 `role="img"` + `aria-label`。

## 6. 内核 / 嵌入式工程图谱系(sage 语法)

> 图型谱系同 anthropic §15(function-flowchart / algorithm / register-bitfield / soc-block /
> hw-timing-waveform / build-pipeline / sched-timeline),外加通用 architecture / flow。
> 模板是起点不是规格——结构、密度、布局按实际内容重设计,谱系之外的内容自创图型即可。
> 结构性工艺(布局、车道、交替、双箭头标注)参考 anthropic §15;本节只写 sage 的**翻译规则**。

核心问题只有一个:anthropic 用多 hue 编码类别,sage 只有一个绿 + 靛蓝墨——**每个图型必须先回答"绿给谁"**:

| 图型 | 绿的唯一归属(单一叙事) | 其余元素 |
|---|---|---|
| 架构图(architecture) | 主数据路径 + 1 张焦点卡的边 | zone 全 `#f0f3e2` 无边容器,其余连线 `#6d6f82` 1.2px |
| 流程图(flow) | happy path 主链 + 决策菱形边 | 徽章靛蓝实心,旁路灰实线 |
| 函数流程图 | happy path 主链 + 成功出口点缀 | 错误车道 `#6d6f82` 1.2px 虚线,出口白卡 + hairline |
| 算法原理图 | 写入侧指针(in/tail)——"新数据落在哪" | 占用格 `#c9d1b3` tint、空闲格白底,读出指针靛蓝 |
| 寄存器位域图 | 焦点字段:`#f0f3e2` tint + 绿 1.5px 边 + 4px 顶色条 | 普通字段 `#eef2de`,reserved 白底灰杠,访问权限 chip 靛蓝实心 |
| SoC 框图 | CPU 焦点卡 + 主数据路径 CPU→NoC→DDR | zone 全 `#f0f3e2`,互连 = 白色细长卡 + hairline,其余连线 `#6d6f82` |
| 波形时序图 | 焦点信号(CS_N / 触发)+ 其 active 窗口 tint | 其他 lane 用墨阶区分(`#393C54` / `#6d6f82` / `#e5e8da`) |
| 编译流程图 | 主链 + 终点交付物焦点卡(tint + 绿边) | 工具/产物卡都白底 hairline,分支 `#6d6f82` 实线汇入 |
| 调度时间线 | 被追踪的那一个任务(`#c9d1b3` 块 + 绿边 + 迁移箭头) | 其他任务 `#eef2de`,idle 白底灰虚线边,IRQ 标记用靛蓝不用绿 |

三条 sage 专属注意:

1. **类别信息不丢**:anthropic 靠 hue 区分的维度,sage 靠"tint 二档(`#f0f3e2`/`#c9d1b3`)+ 墨阶
   + 字重"补偿——波形 lane 用三档墨,寄存器字段靠 tint/白底二分。画完自问:黑白打印仍能读吗?
2. 位格 / 单元格阵列的 hairline(0.5-1px `#e5e8da`)是表格性结构的"格栅",和节点卡的 hairline 边
   同一语法——sage 全图可以处处 hairline,这是和 apple(无边框)的核心分界
3. 时序参数标注(tSU/tH)、wrap 注释等机制性文字一律 `#6d6f82` 11-12px;不准为了强调改绿——
   绿的预算已经花给焦点了

## 7. 反模式清单

- ❌ **串色**:anthropic 橙 `#d97757` / apple 蓝 `#0071E3` / ember 金 `#c49464`,以及紫、暖黄、棕——一个都不准进图
- ❌ 彩色分类(多 hue 是 anthropic 的语言;sage 只有绿一个焦点 + 靛蓝墨)
- ❌ 柔影浮卡当分层手段(那是 apple;sage 靠 hairline + tint,阴影 ≤ `rgba(57,60,84,0.06)`)
- ❌ dot-grid 纸纹理 / 手绘滤镜(anthropic 专属,用了就是 cross-skill smell)
- ❌ 绿底放白字徽章 / chip(对比度 2.4 fail → 靛蓝实心 + 白字,见 §1)
- ❌ 一图多焦点(绿元素 > 2 处 → 重新分配,次要的降为靛蓝/灰)
- ❌ 满宽饱和色带、纯文字盒子、斜线穿心、大箭头、坐标随手写(同 anthropic §14 通用反模式)
- ❌ 全图 0 饱和 hue 的灰线稿(→ §4;diagram-monochrome 闸,注意只有实心 `#97B077` 计数)
- ❌ viewBox 写大、内容挤中间一窄条(→ §3 先算再画;svg-letterbox 闸)
- ❌ ≥ 20 个 text 的密图塞 960 标准容器(→ 1200 wide 档;dense-diagram-cramped 闸)
- ❌ 长文页面通篇无图(→ §4 图密度合约;text-desert 闸)
