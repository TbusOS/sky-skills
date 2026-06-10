# Diagram Craft — 手工 SVG 图示工艺（anthropic-design）

> 适用：架构图 / 流程图 / 层级图 / 时间线 / git graph / 一切"工程类"图示。
> 时序图另有专文 `sequence-diagrams.md`；抽象插画见 `imagery.md`（两者不受本文"工程图"规则约束的条目会单独标注）。
> 模板：`templates/diagrams/`（architecture / flow / hierarchy / timeline 四件，全部按本文标准实现，新图直接复制改）。

## 0. 第一原则：颜色做语义，不做填充

颜色的职责是**编码类别和焦点**，不是涂满面积。

- 大面积（分组容器、面板底）只允许 white / cream / 8-12% tint
- **纯色满填只允许 ≤ 56×56 的元素**（icon tile、徽章、色点、图例 chip）
- 单图饱和色覆盖率目标 < 10%；visual-audit 在聚合饱和填充 > 30% viewBox 时告警（known-bugs §1.27）
- 反面教材：三条满宽橙/蓝/绿色带的旧 architecture.svg（2026-06-10 已重写）——"PowerPoint SmartArt 感"的最大来源

## 1. 色彩语义表

| hue | 主色 | 容器 tint | 强调 tint | label 深色 | 语义分工（默认） |
|---|---|---|---|---|---|
| 橙 | `#d97757` | `#fbeee7` | `#f7e4dc` | `#c2613f` | 主路径 · 焦点节点 · 协调者 · 决策菱形 |
| 蓝 | `#6a9bcc` | `#eef3f9` / `#eaf1f8` | — | `#4a7bab` | 表现层 · 数据 · 搜索类 |
| 橄榄绿 | `#788c5d` | `#eef1e8` | — | `#5d7045` | 成功 · 分析类 · 领域层 |
| 金 | `#c49464` | `#f6efe3` | — | `#8a5a2a` | 暂存 · 镜像 · 次要类别 |
| 墨 | `#141413` | `#edebe3` | — | `#141413` | 基础设施 · 中性骨架 |

用法：**多色彩是允许且推荐的**（一层一个 hue / 一类 agent 一个 hue），但每个 hue 只以"容器 tint + 4px 色条 + 色点 + 彩色连线 + label 深色"出现，不以满填色块出现。焦点元素（主路径、协调者卡）固定用橙。

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
- 焦点卡（全图最多 1-2 张）：橙 tint 底 `#fdf6f2` + 橙 1.5px 边 + 橙 icon

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

`M cx,cy-42 L cx+46,cy L cx,cy+42 L cx-46,cy Z` + 橙强调 tint `#f7e4dc` 填充 + 橙 1.5px 边 + 12px 600 居中问题文字。**菱形是流程图里唯一的 tint 色块**——稀缺性就是强调。出口标注 `pass` / `fail` 用 11px 600，置于线上方 8px 以上、与徽章保持 4px 间距（text-anchor="middle" 防止撞徽章）。

## 7. dot-grid 纸纹理（anthropic 专属）

```svg
<pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
  <circle cx="12" cy="12" r="1" fill="#141413" opacity="0.05"/>
</pattern>
```

铺在面板 rect 上（fill 一层底色再叠一层 `url(#dots)`），一行 defs 换"工程图纸"质感。只用于工程类图示，插画不用。

## 8. 布局公式（防文字溢出 / 防挤）

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
<circle cx="20" cy="18" r="5" fill="#e2857a"/><circle cx="38" cy="18" r="5" fill="#e8c180"/><circle cx="56" cy="18" r="5" fill="#9cb481"/>
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
| 连续纯文字 > 2 屏 | 插入至少 1 个视觉元素（图/表/stat/pull-quote） |

节奏目标：每 1.5 屏高度（≈1300px @1440 视口）至少 1 个 SVG / figure / stat 元素。

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
