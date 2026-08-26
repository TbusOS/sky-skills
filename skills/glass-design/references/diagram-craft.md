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

`templates/diagrams/` 共 15 张:architecture / flow / sequence / state-machine /
timeline / bitfield / build-pipeline / hierarchy / function-flowchart /
deployment / soc-block / hw-timing-waveform / algorithm-ringbuffer /
sched-timeline / interconnect-map。从模板起步改内容,不要从零画。密图(≥20 label)进
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
