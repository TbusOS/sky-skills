# Diagram Craft — 手工 SVG 图示工艺(ember-design)

> **约束分三层**:① 审美(暖棕灰阶 + 金一处、暖米分组底、暖棕柔影、Mono 小标签)不可变;
> ② 工艺质量(可读性 / 字号 / 不留白画布)机器闸强制;③ **图型与结构自由定制**——模板和
> §8 翻译表是审美起点和设计思想,不是强制规格。内容决定结构,变体 / 混搭 / 自创图型都允许,只要 ①② 成立。

> 适用:架构图 / 流程图 / 层级图 / 时间线 / 时序图等一切工程类图示。
> ember 图的语法是"**暖而不闹**":暖棕灰阶做信息层级,金 `#c49464` 全图只点一处,像书页上的一枚烫金。
> 模板:`templates/diagrams/`(architecture / flow + 内核六件 function-flowchart / build-pipeline /
> register-bitfield / soc-block / hw-timing-waveform / sched-timeline,共 **8 件(本批)**,全部按本文标准实现)。
> 案例库:`demos/ember-design/diagrams.html`(8 张图,每张带 Copy SVG)。

## 0. 第一原则:暖棕灰阶 + 金单焦点

- 结构靠**暖棕灰阶**(`#312520` / `#6b5a4f` / `#8a7564`)+ 暖米 tint 分层,不靠多 hue 分类(多 hue 是 anthropic 的语言)
- **金 `#c49464` 全图只点一处**:主路径 + 1 张焦点卡 + 编号徽章(同属一个叙事焦点);金色元素 > 2 处即过量
- 金的覆盖率目标 < 5%;visual-audit 聚合饱和填充 > 30% viewBox 告警(saturated-band 闸,known-bugs §1.27)
- 深棕 `#492d22` 是"重墨"不是第二强调色:只用于焦点卡主名 / 波形信号线这类结构性深色,不抢金的焦点
- 不用 dot-grid(anthropic 专属);肌理用 ember 自己的:hairline 网格 `#e6d9bf`、金色三点 ornament、Mono 大写小标签

## 1. 调色板

| 用途 | 值 |
|---|---|
| 焦点 / 主路径 / 徽章 / 焦点卡边 | `#c49464`(金,唯一强调色) |
| 重墨:焦点主名 / 波形信号线 | `#492d22` |
| 主名文字 | `#312520` |
| 次级文字 / 次要连线 | `#6b5a4f` |
| 弱标签 / 弱 lane / 支线 | `#8a7564`(canonical 实际用色) |
| hairline / 位格栅格 / 轴线 | `#e6d9bf` |
| 分组容器底 | `#fbeedd`(canonical 实际用色) |
| tint(决策菱形 / 焦点字段 / 数据格) | `#f5e5c8` |
| 节点卡底 | `#ffffff` |
| 画布底(页面即背景) | `#fff2df` |

**禁色**:anthropic 橙 `#d97757` / apple 蓝 `#0071E3` / sage 绿 `#97B077`;一切冷灰(`#888` 类中性灰)、冷蓝——dos-and-donts 明令禁止,用了就是 cross-skill smell。

## 2. 结构语法

- **分组容器**:`#fbeedd` + rx 16 + 无边框(或 1px `#e6d9bf` hairline 二选一);标签用 **IBM Plex Mono 10.5-11px、letter-spacing 0.1em、大写、`#8a7564`**——这是 ember 的签名小标签(canonical hero 里的 `JOURNAL` / `LINKED FROM` 同款)
- **节点卡**:白底 `#ffffff` + rx 12 + 无描边 + 暖棕柔影 `feDropShadow dx=0 dy=4 stdDeviation=8 flood-color=#492d22 flood-opacity=0.08`——白卡靠暖影从米色分组里浮起来
- **焦点卡**:白底 + 金 `#c49464` 1.5px 描边(全图唯一带边框的卡),主名可升重墨 `#492d22`
- 圆角体系:分组 16 / 卡 12 / chip 8——与 token 的 `--radius-md: 12px` 一致
- 位格 / 单元格阵列的 hairline(0.5-1px `#e6d9bf`)是允许的"格栅"例外——无边框原则针对卡片,不针对表格性结构

## 3. 节点卡排版与 icon

- 字阶反差做分类:主名 13-15px Inter 600 `#312520` + 副说明 11-12px Inter `#8a7564`;图题可用 Fraunces(衬线只给标题,机制注释一律 Inter / Plex Mono)
- icon 浮在卡内左侧,无 tile 底块:24×24 坐标、stroke 1.6-1.8、round cap/join、`fill="none"`、金 `#c49464`(canonical 三卡同款)——icon 的金属于装饰微量,不计入焦点预算,但同卡不再出现第二处金
- 留白:卡高 80(主行)/ 64(次行),组间距 40,分组上下 padding ≥ 32

## 4. 连线与徽章

- 圆角正交折线(8px quadratic 拐角)、边缘锚点出发,结构同 anthropic §4
- 主路径金 `#c49464` 1.8px 实线;次要 `#6b5a4f` 1.2px 实线;支线 / 回流 `#8a7564` 1.2px 虚线 `4 4`
- 箭头 7px 同色小三角 marker
- 编号徽章:r=10 金圆 + 11px 700 `#312520` 字(白字在金上对比不足,禁),只标主路径;stage labels(`01 · 02 · 03`)是 dos-and-donts 既有底线

## 5. 决策菱形

tint `#f5e5c8` + 金 1.5px 边 + 12px 600 `#312520` 问题文字。全图唯一的 tint+金边组合(与焦点卡共用预算,二选一或同属一个叙事)。出口标注 `yes` / `no` 11px 600(yes 金 / no `#8a7564`),text-anchor="middle",与徽章保持 ≥ 4px。

## 6. 先定尺寸再画 + 布局公式

**内容多的图必须画大,不准把元素缩小塞进固定画布**。画第一笔之前先算:

```
预估列数 C、最宽节点字符数、<text> 总数 T
viewBox 宽 = max(720, C × (节点宽 + 24) + 2 × 24)
scale = 容器内可用宽 / viewBox 宽 ≥ 0.9(10px 源字号 → 渲染 ≥ 9px)
```

| 容器档位 | 适用 |
|---|---|
| 960 标准(`ember-container`) | T ≤ 18 的图 |
| 1200 宽(`ember-container ember-container--wide` + `grid-column: 1 / -1`) | **T ≥ 20 或 C ≥ 4 必须用** |

modifier 必须带 base class(`ember-container--wide` 单独写会贴左,dos-and-donts 既有坑)。scale < 0.9 → 升档;1200 还不够 → 拆成两张图,不准缩字号。hero 框图 figure 的 padding 用 `var(--space-5) var(--space-6)`,不准 `var(--space-7)`(吞 SVG 宽度,既有坑)。**viewBox 紧贴内容**:内容 bbox 距 viewBox 边 ≤ 24px(svg-letterbox 闸 §1.28;dense-diagram-cramped 闸 §1.29;diagram-tiny-text 闸覆盖所有 figure 图)。

通用布局规则同 anthropic §8.2:节点宽 = max(160, 英文字符 × 9, CJK × 18);4px 网格;viewBox padding ≥ 24;SVG 文字 ≥ 10px 源字号(ember 既有底线;主名建议 13+);文字 bbox 互不相交 ≥ 4px;1440 视口渲染宽度 ≥ 900px(hero 图)。

## 7. 图密度合约

同 anthropic `diagram-craft.md` §12 的表格执行(≥3 步流程必须图、数字必须 stat、结构必须架构图、>2 屏纯文字必须插视觉元素、每 1.5 屏 ≥ 1 个视觉元素)。ember 的 72px Fraunces stat 和 pull-quote 可计入视觉元素。机器闸:`text-desert`(连续 2600px 无视觉元素 → warn,known-bugs §1.31)跨 skill 生效。

**diagram-monochrome(0 饱和 hue 闸)对 ember 适用,不豁免**:apple 豁免是因为无彩灰阶是它的身份;ember 的身份恰好相反——它的"灰"全是带 hue 的暖棕灰(`#6b5a4f` / `#8a7564` 饱和度 > 0),一张 0 饱和的纯中性灰工程图 = 冷灰入侵 = dos-and-donts 第一条禁令。ember 工程图必须至少含一处饱和暖色(金焦点或暖米 tint)。

## 8. 内核 / 嵌入式工程图谱系(ember 翻译表)

> 图型与 anthropic §15 同谱系,模板在 `templates/diagrams/` 同名 .svg。模板是起点不是规格——结构、密度、
> 布局按实际内容重设计,谱系之外的内容自创图型即可。结构性工艺(布局、lane、车道、交替、双箭头标注)
> 参考 anthropic §15;本节只写 ember 的**翻译规则**。核心问题:anthropic 用多 hue 编码类别,
> ember 只有暖棕灰阶 + 一个金——**每个图型必须先回答"金给谁"**:

| 图型 | 金的唯一归属(单一叙事) | 其余元素 |
|---|---|---|
| 架构图(architecture) | 焦点模块卡(金 1.5px 边)+ 主数据路径 | 分组 `#fbeedd` 容器,次连线 `#6b5a4f` 1.2px |
| 流程图(flow) | happy path 主链 + 编号徽章 + 决策菱形边 | 错误支线 `#8a7564` 虚线,出口白卡 |
| 函数流程图 | 同 flow:主链 + 徽章 | 错误车道 `#8a7564` 1.2px 虚线,出口灰卡 |
| 编译流程图 | 主链 + 终点交付物焦点卡 | devicetree 等分支 `#8a7564` 实线汇入 |
| 寄存器位域图 | 焦点字段(EN 位类):tint `#f5e5c8` + 金 1.5px 边 | 普通字段白底 + `#e6d9bf` 格栅,reserved 白底灰杠,字段名一律 `#312520` |
| SoC 框图 | CPU 焦点卡 + 主数据路径 CPU→NoC→DDR | zone 全部 `#fbeedd` 无边容器,其余连线 `#8a7564` |
| 波形时序图 | 触发信号(CS_N 类)+ 其 active 窗口 tint | 其他 lane 信号线用墨阶区分(`#492d22` / `#6b5a4f` / `#8a7564`),栅格 `#e6d9bf` |
| 调度时间线 | 被追踪的那一个任务(块 tint + 金边 + 迁移箭头) | 其他任务 `#f5e5c8` 块,IRQ 标记用墨 `#312520` 不用金 |

三条 ember 专属注意:

1. **类别信息不丢**:anthropic 靠 hue 区分的维度,ember 靠"暖棕灰阶值 + 字重 + tint 有无"补偿——波形 lane 用三档墨,寄存器字段靠 tint/白底二分。画完自问:黑白打印仍能读吗?
2. 时序参数标注(tSU/tH)、wrap 注释等机制性文字一律 `#8a7564` 10.5-12px Plex Mono;不准为了强调改金——金的预算已经花给焦点了。
3. 产品形态优先画"纸感" SVG mock(canonical hero 同款:cream 标题栏 + 金/暖棕三圆点 + Mono 状态栏),不画拟真材质;数字优先 72px Fraunces stat,柱图/饼图是最后选项。

## 9. 反模式清单

- ❌ 多 hue 彩色分类(anthropic 的语言;ember 只有金一个焦点色)
- ❌ 冷灰 / 冷蓝 / 0 饱和纯中性灰工程图(→ §7 monochrome 闸结论)
- ❌ 一图多焦点(金色元素 > 2 处,icon 装饰微量除外)
- ❌ 金底白字徽章(对比不足;徽章用金圆 + `#312520` 字)
- ❌ 卡片加边框 + 阴影双重描边(普通卡只用暖棕柔影,焦点卡只加金边)
- ❌ dot-grid 纸纹理 / apple 式无标签纯净分组(前者 anthropic 专属,后者 apple 专属;ember 用 Mono 大写小标签)
- ❌ 满宽色带、纯文字盒子、斜线穿心、大箭头、坐标随手写(同 anthropic §14 通用反模式)
- ❌ 高饱和渐变 / 拟真材质 / 阴影 opacity > 0.12 / 黑色阴影(ember 阴影必须是棕 alpha)
- ❌ viewBox 写大、内容挤中间一窄条(→ §6 先算再画;svg-letterbox 闸)
- ❌ ≥ 20 个 text 的密图塞 960 标准容器(→ 1200 宽档;dense-diagram-cramped 闸)
- ❌ 长文页面通篇无图(→ §7 图密度合约;text-desert 闸)
