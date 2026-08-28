# Glass Diagram Craft — 暗玻璃 SVG 图示工艺

> glass 的图示语言:**图和页面是同一块玻璃**。节点用面板同款材质,
> 线用同款 hairline,语义焦点用 cyan glow。图看起来像"嵌在玻璃里",
> 不是"贴在玻璃上"。

## 1. 材质映射(与页面 token 一一对应)

| 图内元素 | 写法 | 对应页面材质 |
|---|---|---|
| 节点容器 | `<rect class="glass-svg-node" rx="16">` | Tier 1/2 面板 |
| 强调节点 | `<rect class="glass-svg-node-strong" rx="16">`(cyan 描边) | 焦点面板 |
| 主文字 | `<text class="glass-svg-ink">` | `--glass-ink` |
| 次文字 / 数据 | `class="glass-svg-ink-2"` | `--glass-ink-2` |
| stage label(`01 · INGEST`) | mono 12px ls 2 `class="glass-svg-ink-3"` | eyebrow |
| 结构线 / 分隔 | `class="glass-svg-line"` | hairline |
| **真实存在的那根线**(物理介质 / 总线) | `class="glass-svg-ink-stroke"` 2-2.4px | 墨色实线 —— 和 `glass-svg-line` 的 hairline 差一个数量级,"有没有这根线"就靠这个差别读 |
| 点阵网格肌理 | `class="glass-svg-grid"` | 背景肌理 |
| 流向线 / 焦点 | `stroke="#22D3EE"` 或 `class="glass-svg-accent-stroke"` | accent |
| 流向节点 / 徽标点 | `fill="#22D3EE"` 实心圆 ≤6px | accent |

**双主题铁律**:墨色 / 节点 / 线一律走 `.glass-svg-*` 类 —— 写死白 fill 在 light
模式下隐形(2026-06-11 smoke 页实测)。**cyan 的"可写死"豁免只给形状**(流向线 stroke、
实心圆点、徽标块);**cyan 文字必须走 `.glass-svg-accent-ink`**(light 自动切 #0E7490,
写死的 cyan 文字在 light 下 1.7:1 —— gallery canonical critic 实抓,known-bugs 6.4,
visual-audit 的 `glass-cyan-svg-text` 检查在 light 跑时按 error 抓)。

## 2. 颜色合约

图有两层颜色:**tint 层**(节点底色编码类别)+ **accent 层**(cyan 实心元素标流向/焦点)。
只有中性玻璃节点的图是允许的下限,但信息分层的图应该用 tint 把类别画出来:

- **tint 层**:`.glass-svg-node--cyan`(热路径 / 焦点层 / 当前选中)和
  `.glass-svg-node--indigo`(存储 / 基础设施 / 次级类别),14-18% tint 底 +
  彩色描边,双主题自动换色(档位为投屏定:环境光下 10-12% 的类别编码会被
  洗掉)。**每图至多 2 个 tint 色相**,叠在中性玻璃底上。
- **状态轴**(独立于 tint 预算):`.glass-svg-node--ok/--warn/--danger`
  (pass / 降级·待办 / 错误路径·已知缺陷),每图至多 1 组状态色,
  danger 自带 `stroke-dasharray` 虚线(色盲通道),warn/ok 配 ⚠/✓ 图标或文字标签。
  状态轴与财务涨跌轴(`--glass-up/--glass-down`)不得同图混用。
- **类别溢出策略**(语义类别 > 2 个 tint 装不下时,按序尝试):
  1. **先归并**:同族语义合成一类(例:3 种签名方法 = 同一"签名"tint,
     节点内文字标签区分),把类别数压回 ≤2;
  2. **状态类语义改走状态轴**:错误/降级/通过本来就不该占 tint 预算;
  3. **第 3+ 类别换非颜色通道**:节点形状(圆角矩形 / 胶囊 / 六边形)、
     描边线型(实 / 虚 / 点)、角标 badge、行内 icon——这些通道顺带满足色盲规矩;
  4. **还装不下 = 图太重**:拆成两张图,每张 ≤2 tint + ≤1 状态组。
- **accent 层**:cyan glow 元素 **≤3 个**(语义焦点:当前 stage、关键路径、热点)——
  多了焦点互相打架;0 个则 `diagram-monochrome` 检查会报(glass 在白名单内)。
- 图表第二序列用 Depth Indigo `#4F46E5`(柱状对比、双折线)。
- violet / pink **永不**进图。
- 涨跌语义:`--glass-up` / `--glass-down`,只给 delta 徽标,不做面积填充。
- 满宽彩色带禁(saturated-band 检查):色带不填面积,焦点用 ≤56px 实心元素。

## 3. 尺寸档位(写图前先数 label)

| label 数 | 容器 | 渲染宽 |
|---|---|---|
| ≤10 | prose 列 | ≥660px |
| ≤18 | `.glass-container` | ≥990px |
| ≥20 或 ≥4 列 | `.glass-container--wide` 整行 figure | ≥1230px(figure 进 Tier 1 面板时按面板内宽计,允许 −48px padding 折让) |

- SVG 源码 `font-size ≥ 11`(worst-case 0.84 scale 下仍 ≥9px 渲染)。
- viewBox 紧贴内容,边距 ≤24px(svg-letterbox 检查 <72% 宽向填充即警)。
- featured diagram 进 Tier 1 面板 + 可选 `data-draw`(path-draw 只给 featured,gallery 卡静态)。

## 4. 工艺细节

- 节点圆角 rx 10–16 按节点尺寸取(小节点 10、常规 14–16);state 节点可用药丸 rx,位域格免圆角(相邻 bit 单元语义)。描边 1px。
- 软阴影不进 SVG(面板已带);图内层次靠 fill alpha 差(node 0.06 vs node-strong 0.08)。
- 肌理:可加 `.glass-svg-grid` 点阵线或 12% alpha 的 radial glow `<ellipse>`,每图 ≤1 处。
- 每张 figure 必有 `<figcaption>`,写 takeaway 不写 "Figure 1"(known-bugs 1.18)。
- `aria-label` 描述内容(a11y + 检查定位用)。
- 同 SVG 内 text bbox 不相交(svg-text-overlap 检查);写完渲染一遍再交。

## 5. 图型模板

`templates/diagrams/` 共 24 张:architecture / flow / sequence / state-machine /
timeline / bitfield / build-pipeline / hierarchy / function-flowchart /
deployment / soc-block / hw-timing-waveform / algorithm-ringbuffer /
sched-timeline / interconnect-map / protocol-stack / address-map
+ 芯片与代码七件 system-topology / die-floorplan / datapath / packet-encap /
terminal-annotated / struct-graph / bus-fabric(译法见 §10)。
另有 `glyphs.svg` 构件片段集(§8),是一张**表**不是一张图,不计入图型数。从模板起步改内容,不要从零画。密图(≥20 label)进
`.glass-container--wide` 整行 figure;tint 层按 §2 编码类别。

## 6. 互连拓扑 + 地址空间映射图(interconnect-map)

图型本身的工程规矩 —— 三层结构(拓扑 / 地址空间 / 缝合)、互连线的名字压在线上、
两条地址带永不合并、窗口用斜纹、`ld/st` 线必须落到某一段而不是整条带 ——
见 anthropic `diagram-craft.md` §15.8。那些是工程约束,跨 skill 通用。
**这一节只写 glass 独有的四处译法**,每一处都是被玻璃材质本身逼出来的:

1. **药丸不能"盖住"线,只能"坐进"线的缺口。** anthropic / apple 压在互连线上的药丸是实底,
   直接压在线上把线切断;glass 的面板是**半透明**的(`--glass-panel-bg` 暗档 0.08 / 亮档 0.62),
   压上去线会从底下透出来,读作"标签被划掉了"。所以互连线要**画成两段**,
   药丸(`class="glass-svg-node"` rx = 高/2)坐在中间的缺口里。模板的
   `<line x1="168" … x2="188">` / `<line x1="292" … x2="312">` 就是这么留的。
2. **斜纹必须是 `fill`,不能是 `stroke`。** glass.css 只给了 fill 类(`.glass-svg-ink-3`),
   没有对应的 stroke token —— 用 `stroke="rgba(255,255,255,…)"` 画斜线,light 主题下当场消失
   (§1 双主题铁律)。模板把 hatch 画成 `<rect width="1.6" height="7" class="glass-svg-ink-3">`,
   走 fill 类,两个主题各自换色。**再叠一层几何 `opacity="0.42"`** ——
   ink-3 满值 0.55 的斜纹会把压在上面的段名吃掉(实测,2026-08-26)。
   opacity 是几何属性不是颜色,不破坏主题切换。
3. **tint 两格已经用完,窗口只能走纹理。** cyan = device 一侧、indigo = 内存,
   两个 tint 色相的预算(§2)到此为止。"这块地不是本地的"是第三个类别,
   按 §2 的类别溢出策略第 3 步走**非颜色通道** —— 也就是上面那层斜纹。
   给窗口段再开一个色相,是这张图最容易犯的错。
4. **cyan 预算给"谁能直接访问"这一条叙事,一共 3 个元素**:
   发起访问的执行体胶囊(`.glass-svg-node-strong`)、那条 `ld/st` 路径(`#22D3EE` 2px)、
   它落到的那一段(cyan 1.5px 边)。另一侧的访问路径走 `.glass-svg-line` 灰。
   **段名和胶囊文字用 `.glass-svg-accent-ink` 不能写死 `#22D3EE`** ——
   写死的 cyan 文字在 light 下是 1.7:1,`glass-cyan-svg-text` 检查按 error 抓(§1)。

**尺寸**:天然 T ≥ 40,一律 `.glass-container--wide` 整行 figure。
模板是 `viewBox="0 0 1240 640"`,1230 渲染宽下算得 635px —— 离 `diagram-oversized`
的 640px 线只剩 5px,**再加一行内容就越线**。node 超过 2 个、或者要画第三条地址带,拆成两张图。

## 7. 协议分层对等图(protocol-stack)

图型本身的工程规矩 —— 两侧镜像、层高相同、纵向严禁跳层、横向线两端必须落在同一层、
最底下那根是全图唯一真实的横向连接 —— 见 anthropic `diagram-craft.md` §15.9。
**这一节只写 glass 独有的三处译法**,每一处都是被玻璃材质逼出来的:

1. **层名不做骑边标签,改用字体切换。** anthropic 让标签骑在容器上沿,用位置说"这是层的名字、
   不是层里的第一个部件";glass 的容器边是半透明的,骑上去边会从标签底下透出来(同 §6.1 的药丸问题)。
   glass 改用**排版**做这件事:层名走 `'JetBrains Mono'` 12px **大写 + letter-spacing 1.5** `.glass-svg-ink-2`,
   部件卡走 Inter sans —— 字体族一换,"这一行不是部件"就读出来了。
2. **"真的有这根线"靠 `.glass-svg-ink-stroke`,不靠 cyan。** 全图三类横线必须一眼分开:
   对等约定 = `.glass-svg-line` 1.5px 虚线(最淡)· **真实介质 = `.glass-svg-ink-stroke` 2.4px 实线**(最亮)·
   本次传输 = cyan 2px。cyan 的预算(§2 的 ≤3)要留给"这一次",
   把介质也画成 cyan,读者会以为那根线和这次传输是同一件事 —— 而它是一直在那儿的硬件。
3. **编号徽章用中性玻璃片 + cyan 数字**,不是 cyan 实心圆。6 个 cyan 实心圆会把 §2 的
   accent 配额一次用光,而这条路径本身才是那个焦点。写法:`<circle class="glass-svg-node">` +
   `<text class="glass-svg-accent-ink">` —— **cyan 文字必须走 accent-ink 类**,写死 `#22D3EE`
   在 light 主题下是 1.7:1,`glass-cyan-svg-text` 按 error 抓(§1)。

**尺寸**:3 层版 `viewBox="0 0 1240 560"`,1230 渲染宽下算 555px,离 640 线留 85px。
**加到 4 层要重算**(4×112 + 3×28 = 532,加头尾 = 620 单位 → 渲染 615px,只剩 25px),
5 层直接拆图。

## 8. 纵向地址映射图(address-map)+ 构件字形集(glyphs)

**address-map** 的工程规矩 —— 引线指边界不指区域、符号名与字面常量分两档、
两个视角永不合成一条带、窗口用斜纹 —— 见 anthropic §15.10。glass 改两处:

1. **符号名与常量的分档靠字体,不靠色相。** anthropic 用墨 / 橙两档药丸;
   glass 的两格 tint 已经花给"DRAM = indigo"和"这一段 = cyan"(§2),没有第三个色相可用。
   两种药丸都是 `.glass-svg-node`,**符号名 Inter 600 `.glass-svg-ink-2`,
   字面常量 JetBrains Mono `.glass-svg-ink-3`** —— 等宽字本身就在说"这是一个会变的数值"。
2. **引线也要留缺口。** 同 §6.1:药丸是半透明的,压不住线。边界引线画到药丸边缘为止,
   药丸坐在缺口里 —— 映射线同理,拆成两段,`direct` / `reclaim` 药丸坐中间。

cyan 预算在这张图正好用满 3 个:重映射线 + 它两端落到的两段(`.glass-svg-node--cyan`)。
所以**直映射线必须走 `.glass-svg-line`** —— "两边都是直映射"是背景事实,写进 figcaption。

**glyphs.svg** —— 片段集,不是图,不计入图型数。规矩见 anthropic §17。glass 改一处:
**cyan 只点每个字形"活着"的那一处**(写指针 `in`、插了卡的那个槽、link 起来的 LED),
读指针 `out` 和其余形状走 `.glass-svg-ink` / `.glass-svg-node`。
端口贴边用 indigo tint(它是"属于这块 die 的一部分",是类别不是状态)。

## 9. 三条通用工艺的 glass 译法(药丸 / 两类箭头 / 图族)

1. **药丸**(§6.1 已立规):坐进线的缺口,不压在线上 —— 半透明材质压不住东西。
   门槛不变:同类线 ≥ 2 条,每条写清是什么 + 一个指标。
2. **两类箭头**:结构 = `.glass-svg-line`;本节这一次 = cyan 2px。
   glass 不需要像 apple 那样避开虚线 —— 但**虚线在 glass 有第三种既定用法**
   (`--danger` 自带 `stroke-dasharray` 做色盲通道,§2),所以
   **本次传输的那条 cyan 路径一律画实线**,别用 cyan 虚线 —— 会和"错误路径"撞语义。
3. **图族**:同一 viewBox、同一坐标、同一 tint 分配,一张只加一层。
   glass 额外一条:**族内各张的主题相关类必须完全一致** ——
   某一张为了好看把一段从 `.glass-svg-node` 换成写死颜色,那一张在 light 下会和其余几张长得不一样,
   读者会以为这是"另一个状态"。

---

## 10. 芯片与代码七件的 glass 译法

模板：`templates/diagrams/` 的 `system-topology` / `die-floorplan` / `datapath` /
`packet-encap` / `terminal-annotated` / `struct-graph` / `bus-fabric`。
**图型工艺**（每一件为什么这么画）在 anthropic-design 的 `diagram-craft.md`
§15.11–15.17;本节只写 glass 皮下面不一样的地方。

### 10.1 四种语义色 → 两个色调 + 一个状态组

§2 的颜色合约给了上限：**每张图最多 2 个色调**，状态组另算一份。七件的映射固定成：

| anthropic 语义 | glass 类 | 理由 |
|---|---|---|
| 计算 / 设备（蓝） | `glass-svg-node--indigo` | indigo 是 glass 的"次级 / 基础设施"档 |
| 焦点 / 本次运行（橙） | `glass-svg-node--cyan` + `glass-svg-accent-stroke` | cyan 是 glass 的热路径 |
| 内存（绿） | `glass-svg-node`（不上色） | 色调预算只有两个,内存让位 |
| 窗口 / IO（琥珀） | `glass-svg-node--warn` | 走状态组,不占色调预算 |

**关键约束**：`die-floorplan` 的互连轨在 anthropic 是橙的，
在 glass **必须降成 `glass-svg-line`**，ring stop 降成 `glass-svg-ink-3`。
理由：cyan 在 glass 里的含义是"这一次走的路"，轨是一直在那儿的结构。
两者都上 cyan，图里就没有"这一次"了。

### 10.2 编号徽章：实心圆会瞎掉

anthropic 的徽章是实心橙圆 + 白字。直接翻译成实心 cyan 圆 + 白字，
**暗主题下 cyan 太亮、白字糊掉，亮主题下 accent 变深、白字倒是能看** —— 两头对不上。
落法固定为：圆用 `glass-svg-node--cyan`（15% 淡色底），字用 `glass-svg-accent-ink`。
两个主题下都是"淡底 + 同色深字"，稳。

### 10.3 斑马行删掉，别翻译

`struct-graph` 的隔行浅底（`#faf9f5`）在 glass 里没有对应物：
白色 4% 覆盖在亮主题下看不见，硬给个 token 又会跟卡面打架。
**直接删掉**——glass 的卡本来就是半透明面，行与行之间靠字距分得开。

### 10.4 marker 用类，不写死颜色

箭头 marker 里的 `fill` 也要走 `.glass-svg-*` 类。
写死 `#F4F7FF` 的白箭头在亮主题下会消失，而 marker 又不在 `verify.py`
的"未定义 class"检查范围里，**没人会替你发现**。cyan（`#22D3EE`）是双主题常量，
只有它可以写死。

### 10.5 尺寸

七件的 viewBox 是 `1120 × 560`。glass 的 gallery 图位是三家里最宽的（1230 px），
缩放 **1.098** —— 字号最舒服（12 → 13.2），但**高度是三家里最吃紧的**：
560 渲染成 615 px，离 `diagram-oversized` 的 640 只剩 25 px。
**这七件的 viewBox 高度不要再加**;要加内容先砍别的。
