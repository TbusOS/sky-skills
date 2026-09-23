# relief-design · 可直接复制的部件

`diagram-craft.md` 回答「该画哪一种图」，这个文件回答「那一种图的标记长什么样」。
以前要画新图得去 `canonical/` 里扒标记，这个文件就是为了省掉那一步。

**怎么用**：找到部件 → 复制代码块 → 换成你的内容 → 跑 §末尾那几条检查。

**这个文件不会和 CSS 脱节** —— `scripts/check_snippets.mjs` 会把每一段都渲染一遍，
核对里面每个 `relief-` 类都真的在 `relief.css` 里有定义、渲染出来有尺寸、文字在七套皮肤下
都看得清。**漏写一个 `relief-` 前缀（写成 `class="sn"` 而不是 `class="relief-sn"`）
是这套东西最容易犯的错，而且三道现成的检查一个都看不见它** —— 文字会回落成继承色，
在深色皮肤上就是深底深字。这道检查专门堵它。

---

## §1 外壳：每张图都要有的两层

图本身不带标题也不带边框，外面这层负责。**少了它，图会直接贴在正文上，没有呼吸。**

```html
<div class="relief-board relief-raised" id="fig-power-domain-tree">
  <div class="relief-bt">
    <span class="lang-en">POWER DOMAIN TREE</span><span class="lang-zh">电源域树</span>
    <em><span class="lang-en">turning off the parent takes every child with it</span><span class="lang-zh">关掉父域，底下挂的全跟着掉电</span></em>
  </div>
  <!-- 部件放这里 -->
</div>
```

- `id` 是给图集页链接用的，**命名规则 `fig-` + 英文标题转小写连字符**。
  加了新图要同步改 `demos/relief-design/diagrams.html`，否则
  `check_gallery_links.mjs` 会报「落到的是另一张图」。
- `<em>` 里那句是图注，写**读者看完图之后应该记住的那一句**，不是复述标题。

## §2 三条基础配方

整套东西只有这三条，别的都是它们的组合。

```html
<div class="relief-raised">凸起 —— 一个存在的东西</div>
<div class="relief-sunken">凹陷 —— 一个够不到的地方 / 一个条件 / 一条通道</div>
<div class="relief-raised relief-thin">薄件：按钮、药丸、小方块</div>
<div class="relief-raised relief-thick">厚件：整块面板</div>
```

**深度就是图例，不是装饰。** 同一张图里凸和凹必须各自代表一件固定的事：
凸=有这个东西，凹=没有/够不到/是条件。乱用就等于图例自相矛盾。

薄件必须加 `relief-thin`。不加的话 9px 位移打在一个 24px 高的药丸上，
阴影会糊成一坨，看不出凹凸。

## §2b 固定像素宽的图要包一层 `.relief-pan`

状态机、波形图这两种的节点是**按坐标摆的，缩不了**。不包这一层，
窄屏下**整页**会跟着横向滚动 —— 每一段正文都被拖歪，不只是那张图。

```html
<div class="relief-pan" tabindex="0" role="region" aria-label="state machine">
  <div class="relief-fsm">…</div>
</div>
```

`tabindex="0"` + `role="region"` + `aria-label` 是因为它能横向滚动，
**键盘用户要能进去滚**。凡是会横滚的部件都要带这三个属性
（`.relief-dchain`、`.relief-slab`、`.relief-path` 同理，
它们自己带了滚动，直接写在部件上就行，不用再包 `.relief-pan`）。

按宽度自己排的部件（`.relief-flow`、`.relief-layers`、`.relief-memmap` 这些）
**不要包** —— 包了反而不会换行。

## §3 双语怎么写

**面向读者的散文要成对，标识符不用。**

```html
<!-- 散文：成对 -->
<span class="lang-en">holds the lock</span><span class="lang-zh">拿着锁</span>

<!-- 标识符、寄存器名、地址、函数名：直接写，两种语言一样 -->
<div class="relief-tnode relief-raised relief-thin">cpu@0</div>
<b>tp_read_frame()</b>
```

**`<svg>` 里面不能用 `<span>`**，浏览器会在那里跳出 SVG 解析，
后面的内容全漏成散文。SVG 里的双语写成两个 `<text>`：

```html
<div class="relief-scope relief-sunken">
  <svg viewBox="0 0 300 90">
    <text class="lang-en relief-siglbl" x="120" y="40" text-anchor="end">reset</text>
    <text class="lang-zh relief-siglbl" x="120" y="40" text-anchor="end">复位</text>
    <path class="relief-wave" d="M130 56 H190 V26 H290"></path>
  </svg>
</div>
```

---

# 通用框图

## 流程链 `.relief-flow`

**什么时候用**：一条线走到底，没有分支。终点用 `relief-hot` 标出来。

```html
<div class="relief-flow">
  <div class="relief-node relief-raised relief-thin"><span class="lang-en">schematic</span><span class="lang-zh">原理图</span></div>
  <div class="relief-wire"></div>
  <div class="relief-node relief-raised relief-thin"><span class="lang-en">device tree</span><span class="lang-zh">设备树</span></div>
  <div class="relief-wire"></div>
  <div class="relief-node relief-hot"><span class="lang-en">driver matches</span><span class="lang-zh">驱动匹配上</span></div>
</div>
```

`.relief-wire` 是空的，线由 CSS 画。**节点之间必须夹一个**，漏一个就断一截。

## 树状 `.relief-tree`

**什么时候用**：包含关系 —— 父节点管着子节点。设备树、目录结构、域的层级。

```html
<div class="relief-tree">
  <div class="relief-tier">
    <div class="relief-tnode relief-root">/ <span class="lang-en">root</span><span class="lang-zh">根节点</span></div>
  </div>
  <div class="relief-rung">
    <svg width="420" height="38" viewBox="0 0 420 38">
      <path d="M210 2v12a8 8 0 0 1-8 8H118a8 8 0 0 0-8 8v6M210 2v12a8 8 0 0 0 8 8h84a8 8 0 0 1 8 8v6"></path>
    </svg>
  </div>
  <div class="relief-tier" style="gap:172px">
    <div class="relief-tnode relief-raised relief-thin">cpu</div>
    <div class="relief-tnode relief-raised relief-thin">memory</div>
  </div>
  <div class="relief-tier" style="gap:44px">
    <div>
      <div class="relief-tnode relief-raised relief-thin">cpu@0</div>
      <div class="relief-leafrow"><span class="relief-prop">compatible</span></div>
    </div>
  </div>
</div>
```

**`.relief-rung` 里那段 path 是手画的**，两个 `a8 8` 是圆角。
子节点数量或 `gap` 一改，横杆的落点就要跟着改 —— 圆角折线是
`M<父x> 2v12a8 8 0 0 1-8 8H<子x+8>a8 8 0 0 0-8 8v6`。

## 左右对比 `.relief-split`

**什么时候用**：以前 vs 现在、错 vs 对。**两边必须是同一件事的两种做法**，
不是两件不同的事。

```html
<div class="relief-split">
  <div class="relief-panel relief-sunken">
    <div class="relief-cap"><span class="lang-en">Before</span><span class="lang-zh">以前</span></div>
    <div class="relief-body relief-raised" style="box-shadow:5px 5px 10px var(--dark),-5px -5px 10px var(--lite)">
      <span class="lang-en">a new board means editing code</span><span class="lang-zh">换块板子就得改代码</span>
    </div>
  </div>
  <div class="relief-bigarrow">
    <svg width="46" height="34" viewBox="0 0 46 34">
      <path d="M2 17h30M26 5l14 12-14 12" fill="none" stroke="var(--navy)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>
  </div>
  <div class="relief-panel relief-sunken">
    <div class="relief-cap"><span class="lang-en">Now</span><span class="lang-zh">现在</span></div>
    <div class="relief-body relief-raised" style="box-shadow:5px 5px 10px var(--dark),-5px -5px 10px var(--lite)">
      <span class="lang-en">a new board means editing the DTS</span><span class="lang-zh">换块板子只改 DTS</span>
    </div>
  </div>
</div>
```

`.relief-body` 上那条行内 `box-shadow` 是**必须的** —— 它嵌在凹陷面板里，
默认的 9px 位移会顶出边界，要压到 5px。

## 分层调用 `.relief-layers`

**什么时候用**：从上往下一层调一层，每层有个编号和一句「这层干什么」。

```html
<div class="relief-layers">
  <div class="relief-layer relief-raised relief-thin">
    <span class="relief-idx">1</span>
    <span class="relief-nm"><span class="lang-en">Application</span><span class="lang-zh">应用程序</span></span>
    <span class="relief-hint">open / read / write</span>
  </div>
  <div class="relief-drop">
    <svg width="20" height="18" viewBox="0 0 20 18">
      <path d="M10 2v10M4 8l6 6 6-6" fill="none" stroke="var(--line)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>
  </div>
  <div class="relief-layer relief-raised relief-thin">
    <span class="relief-idx">2</span>
    <span class="relief-nm"><span class="lang-en">System call</span><span class="lang-zh">系统调用</span></span>
    <span class="relief-hint">sys_read</span>
  </div>
</div>
```

`.relief-hint` 放**这一层里真实的函数名**，不是形容词。
读者就是靠这一列去代码里找对应位置的。

## 有的 / 没的 `.relief-grid4`

**什么时候用**：一张表里哪些填了哪些空着 —— `file_operations`、
`platform_driver` 的回调、一组标志位。

```html
<div class="relief-grid4">
  <div class="relief-slot relief-raised relief-thin relief-set">open</div>
  <div class="relief-slot relief-raised relief-thin relief-set">read</div>
  <div class="relief-slot relief-sunken relief-thin">llseek</div>
  <div class="relief-slot relief-sunken relief-thin">poll</div>
</div>
```

**填了的凸起 + `relief-set`，没填的凹陷。** 这是深度语义最直白的一个用法。

---

# 硬件框图

## 状态机 `.relief-fsm`

**什么时候用**：几个状态之间跳来跳去，**而且失败回退那条线必须画出来** ——
多数状态机图漏的就是它。

```html
<div class="relief-pan" tabindex="0" role="region" aria-label="state machine">
<div class="relief-fsm">
  <svg viewBox="0 0 960 430">
    <defs>
      <marker id="ah" viewBox="0 0 12 12" refX="10.5" refY="6" markerWidth="6.5" markerHeight="6.5" orient="auto">
        <path d="M0 0 L12 6 L0 12 Z" fill="var(--navy)"></path>
      </marker>
    </defs>
    <g class="relief-wire-stroke" marker-end="url(#ah)">
      <path d="M170 168 Q244 62 366 56"></path>
      <path d="M594 62 Q762 72 850 164"></path>
      <path d="M850 248 Q762 348 594 350"></path>
      <path d="M366 350 Q240 344 168 248"></path>
      <path d="M430 98 Q340 182 234 196" stroke-dasharray="9 7"></path>
      <path d="M72 246 C50 316 142 314 124 250"></path>
    </g>
  </svg>
  <div class="relief-st relief-entry" style="left:40px;top:170px;width:190px;height:72px">ACTIVE<small><span class="lang-en">in use</span><span class="lang-zh">在用</span></small></div>
  <div class="relief-st relief-raised relief-thin" style="left:372px;top:22px;width:216px;height:72px">SUSPENDING<small><span class="lang-en">callback running</span><span class="lang-zh">回调执行中</span></small></div>
  <div class="relief-st relief-raised relief-thin" style="left:752px;top:170px;width:190px;height:72px">SUSPENDED<small><span class="lang-en">powered down</span><span class="lang-zh">已掉电</span></small></div>
  <div class="relief-st relief-raised relief-thin" style="left:372px;top:316px;width:216px;height:72px">RESUMING<small><span class="lang-en">resume callback running</span><span class="lang-zh">正在调 resume</span></small></div>
  <div class="relief-lbl" style="left:186px;top:100px"><span class="lang-en">count hits zero</span><span class="lang-zh">计数归零</span></div>
  <div class="relief-lbl" style="left:654px;top:88px"><span class="lang-en">suspend returned 0</span><span class="lang-zh">suspend 返回 0</span></div>
  <div class="relief-lbl" style="left:646px;top:296px"><span class="lang-en">accessed · get_sync()</span><span class="lang-zh">被访问 · get_sync()</span></div>
  <div class="relief-lbl" style="left:196px;top:300px"><span class="lang-en">resume returned 0</span><span class="lang-zh">resume 返回 0</span></div>
  <div class="relief-lbl relief-bad" style="left:266px;top:146px"><span class="lang-en">suspend returned −EBUSY</span><span class="lang-zh">suspend 返回 −EBUSY</span></div>
  <div class="relief-lbl" style="left:16px;top:352px"><span class="lang-en">get() / put() only move the count</span><span class="lang-zh">get() / put() 只改计数，不换状态</span></div>
</div>
</div>
```

三件要命的：

1. **箭头交给 `marker`，别手画三角形。** `orient="auto"` 自己沿路径切线转，
   改了路径不用重算箭头方向。手算顶点必错方向。
2. **状态块是 HTML 不是 SVG**（要 `box-shadow` 才有凹凸，SVG 吃不到），
   用 `left/top/width/height` 绝对定位压在 SVG 上。**两套坐标必须对得上**：
   SVG 按 `viewBox` 缩放，状态块按像素定位，所以**改了 `viewBox` 的任何一个数，
   线就会整体错位**，而块不动。写这份文档时真踩了 —— 想把图收紧一点，
   把高度从 430 改成 270，六条线全部飘到了别处。
   要改尺寸，`viewBox` 和所有 `left/top` 得按同一个比例一起改。
3. **失败那条线画虚线 + `relief-bad` 标签。** 成功路径和失败路径长得一样，
   图就没讲清楚。
4. **自跳转画成一个小圈**：`M72 246 C50 316 142 314 124 250`。

**语义画错没有任何检查能抓。** 画完一定要对着状态表逐条念一遍箭头方向 ——
真把 E→M 标成过 M→E。

## 时序图 / 波形 `.relief-scope`

**什么时候用**：几路信号谁先谁后、每段延时多长。上电时序、总线事务。

```html
<div class="relief-pan" tabindex="0" role="region" aria-label="timing">
<div class="relief-scope relief-sunken">
  <svg viewBox="0 0 1120 170">
    <g class="relief-guide">
      <line x1="238" y1="20" x2="238" y2="120"></line>
      <line x1="342" y1="20" x2="342" y2="120"></line>
    </g>
    <text class="relief-siglbl" x="140" y="62" text-anchor="end">VCI</text>
    <text class="lang-en relief-signote" x="140" y="78" text-anchor="end">panel analog rail</text>
    <text class="lang-zh relief-signote" x="140" y="78" text-anchor="end">面板模拟电源</text>
    <path class="relief-wave" d="M162 78 H238 V48 H1090"></path>
    <text class="lang-en relief-tcap" x="250" y="150">t1 ≥ 10 ms</text>
    <text class="lang-zh relief-tcap" x="250" y="150">t1 ≥ 10 ms</text>
  </svg>
</div>
</div>
```

- **基准虚线先画**，压在波形底下。没有它，读者无法判断两路信号是不是同一时刻。
- 波形是一条 path：`H` 水平走，`V` 跳变。**高电平 y=顶，低电平 y=顶+30**，
  整张图所有信号用同一个跨度，否则高低看着不一样高。
- **每段延时要标数**。不标数的时序图只说了顺序，而顺序看波形本来就看得出来，
  延时才是抄板时会抄漏的东西。

## 寄存器位域 `.relief-regbar`

**什么时候用**：一个寄存器 32 位怎么分。

```html
<!-- 第一排：位号 -->
<div class="relief-regbar">
  <div class="relief-bitno" style="grid-column:span 12">31 ······ 20</div>
  <div class="relief-bitno" style="grid-column:span 4">19·16</div>
  <div class="relief-bitno" style="grid-column:span 8">15 ··· 8</div>
  <div class="relief-bitno" style="grid-column:span 3">7·5</div>
  <div class="relief-bitno">4</div>
  <div class="relief-bitno">3</div>
  <div class="relief-bitno">1</div>
  <div class="relief-bitno">0</div>
</div>
<!-- 第二排：字段格，span 要和上面一一对上 -->
<div class="relief-regbar" style="margin-top:0">
  <div class="relief-fld relief-sunken relief-rsvd" style="grid-column:span 12">RSVD</div>
  <div class="relief-fld relief-raised" style="grid-column:span 4">LANE_NUM<span class="relief-rst">0x3</span></div>
  <div class="relief-fld relief-raised" style="grid-column:span 8">TIMEOUT<span class="relief-rst">0xFF</span></div>
  <div class="relief-fld relief-sunken relief-rsvd" style="grid-column:span 3">RSVD</div>
  <div class="relief-fld relief-raised relief-narrow">LP_MODE</div>
  <div class="relief-fld relief-raised relief-narrow relief-wo">RESET</div>
  <div class="relief-fld relief-raised relief-narrow">ENABLE</div>
</div>
<div class="relief-regfoot">
  <span><span class="lang-en">reset value</span><span class="lang-zh">复位值</span> 0x0003_FF00</span>
  <span class="relief-acc relief-rw">RW</span>
  <span class="relief-acc relief-wo">WO</span>
</div>
```

**要写两排 `.relief-regbar`**：上面一排位号（`.relief-bitno`），
下面一排字段格（`.relief-fld`）。只写位号那排，图上就只剩一行小字，没有格子。

**两排的 `span` 要一一对上，而且各自加起来正好等于位宽**
（这里 12+4+8+3+1+1+1+1 = 31，加上最后那个不带 span 的 =32）。
加错了图会歪，**没有任何检查会告诉你** —— 自己加一遍。

写不下的窄字段加 `.relief-narrow`（竖排）。保留位 `.relief-rsvd` 用凹陷 ——
保留位是「你够不到的地方」，和别的图里凹的意思一致。
只写不读的字段加 `.relief-wo`，它会变成警示色。

## IP 内部框图 / 代码分层 `.relief-soc`

**什么时候用**：一块芯片里面有哪些模块、按总线分组；或者一个驱动分成哪几层。

```html
<div class="relief-soc">
  <div class="relief-socrow" style="grid-template-columns:2.15fr 1fr">
    <div class="relief-well relief-sunken">
      <div class="relief-wname"><span class="lang-en">CPU cluster</span><span class="lang-zh">CPU 集群</span></div>
      <div class="relief-blocks">
        <div class="relief-blk relief-big">Core A ×4<i><span class="lang-en">out-of-order</span><span class="lang-zh">乱序执行</span></i></div>
        <div class="relief-blk relief-raised">L3 Cache<i>4 MB</i></div>
      </div>
    </div>
    <div class="relief-well relief-sunken">
      <div class="relief-wname"><span class="lang-en">display</span><span class="lang-zh">显示</span></div>
      <div class="relief-blocks">
        <div class="relief-blk relief-hot">VOP<i><span class="lang-en">fetch DMA lives here</span><span class="lang-zh">取数 DMA 在这</span></i></div>
      </div>
    </div>
  </div>
  <div class="relief-bus relief-sunken"><span class="lang-en">system interconnect</span><span class="lang-zh">系统总线</span></div>
</div>
```

**`.relief-well` 是凹陷的「区」，`.relief-blk` 是凸起的「模块」** ——
区是一个地方，模块是一个东西，深度分得开读者才不用看图例。

## 内存布局 / 分区表 `.relief-memmap`

**什么时候用**：地址从高到低，一段一段是什么。物理地址空间、GPT 分区、
一个结构体在内存里的排布。

```html
<div class="relief-memmap">
  <div class="relief-addr">0xFFFF_FFFF</div><div></div><div></div>
  <div class="relief-addr">0x87E0_0000</div>
  <div class="relief-region relief-raised">
    <span class="relief-rn"><span class="lang-en">Usable system memory</span><span class="lang-zh">可用系统内存</span></span>
    <span class="relief-rd"><span class="lang-en">what the buddy allocator manages</span><span class="lang-zh">buddy 分配器管的就是这段</span></span>
  </div>
  <div class="relief-size">≈1.9 GB</div>
  <div class="relief-addr">0x8060_0000</div>
  <div class="relief-region relief-hot">
    <span class="relief-rn"><span class="lang-en">Kernel image</span><span class="lang-zh">内核镜像</span></span>
    <span class="relief-rd"><span class="lang-en">where the decompressed Image lands</span><span class="lang-zh">Image 解压后落在这</span></span>
  </div>
  <div class="relief-size">32 MB</div>
</div>
```

- 三列一组：**地址 / 区块 / 大小**。第一行那个 `<div></div><div></div>`
  是给最高地址占位的，别删。
- **地址要能减得出大小** —— `0x87E0_0000 − 0x8660_0000` 得等于你写的那个 1.9 GB。
  算错的布局图比没有图更糟：读者会照着它算偏移。
- 保留区用 `.relief-dead`（凹陷），表示「这段不归你用」。

## 数据通路 `.relief-path`

**什么时候用**：一帧数据从哪搬到哪，每一站的吞吐是多少。

```html
<div class="relief-path" tabindex="0" role="region" aria-label="path">
  <div class="relief-stagebox">
    <div class="relief-stage relief-raised relief-store">
      <span class="relief-sn">DDR</span>
      <span class="relief-ss">framebuffer</span>
    </div>
    <div class="relief-rate">1080×2400×4B<br><span class="lang-en">per frame</span><span class="lang-zh">每帧</span></div>
  </div>
  <div class="relief-gap">
    <svg width="26" height="22" viewBox="0 0 26 22">
      <path d="M1 11h16M14 3l9 8-9 8" fill="none" stroke="var(--navy)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>
  </div>
  <div class="relief-stagebox">
    <div class="relief-stage relief-raised">
      <span class="relief-sn">VOP</span>
      <span class="relief-ss"><span class="lang-en">fetch DMA</span><span class="lang-zh">取数 DMA</span></span>
    </div>
    <div class="relief-rate">≈ 500 MB/s</div>
  </div>
</div>
```

**`.relief-sn` 和 `.relief-ss` 一定要带 `relief-` 前缀。**
写成 `class="sn"` 页面不会报错，文字会回落成继承色，在深色皮肤上是深底深字 ——
`verify.py`、`visual-audit`、`axe` 三道**都看不见**，只有截图能看出来。
（本文件开头那道检查就是为这个加的。）

## 时钟树 `.relief-clk`

**什么时候用**：从晶振到某个外设时钟，中间过了几级分频、哪一级有门控。

```html
<div class="relief-clk">
  <div class="relief-clklbl"><span class="lang-en">source</span><span class="lang-zh">时钟源</span></div>
  <div class="relief-clkrow">
    <div class="relief-cnode relief-raised relief-src">
      <div class="relief-cn">OSC</div><div class="relief-cf">24 MHz</div>
    </div>
    <div class="relief-crun"></div>
    <div class="relief-cnode relief-raised">
      <div class="relief-cn">PLL_VIDEO</div><div class="relief-cf">×49.5 → 1188 MHz</div>
    </div>
  </div>
  <div class="relief-clklbl"><span class="lang-en">divide and gate</span><span class="lang-zh">分频与门控</span></div>
  <div class="relief-clkrow">
    <div class="relief-cnode relief-raised" style="margin-right:14px">
      <div class="relief-cn">÷ 2</div><div class="relief-cf">594 MHz</div>
    </div>
    <div class="relief-cnode relief-raised relief-gate">
      <div class="relief-cn">hclk_vop</div><div class="relief-cf"><span class="lang-en">gated</span><span class="lang-zh">可门控</span></div>
    </div>
  </div>
</div>
```

**每一级都要写出频率**，而且**上一级除以分频数要等于下一级**。
时钟树画错分频比，读者会拿它去算像素时钟。

## 描述符链 / 指针关系 `.relief-dchain`

**什么时候用**：一串靠指针连起来的结构体。DMA 描述符、链表、
`dev → platform_device → drvdata` 这种一路取下去的关系。

```html
<div class="relief-dchain" tabindex="0" role="region" aria-label="chain">
  <div class="relief-desc relief-raised">
    <h4>DESC 0</h4>
    <dl>
      <dt><span class="lang-en">buffer</span><span class="lang-zh">缓冲区</span></dt><dd>0x8720_0000</dd>
      <dt><span class="lang-en">length</span><span class="lang-zh">长度</span></dt><dd>4 KB</dd>
      <dt>next</dt><dd>→ DESC 1</dd>
    </dl>
  </div>
  <div class="relief-dlink">
    <svg width="26" height="20" viewBox="0 0 26 20">
      <path d="M1 10h14M12 3l9 7-9 7" fill="none" stroke="var(--navy)" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>
  </div>
  <div class="relief-desc relief-raised relief-live">
    <h4>DESC 1</h4>
    <dl>
      <dt><span class="lang-en">buffer</span><span class="lang-zh">缓冲区</span></dt><dd>0x8721_0000</dd>
      <dt>next</dt><dd class="relief-null">NULL</dd>
    </dl>
  </div>
  <div class="relief-dend"><i></i></div>
</div>
```

- `relief-live` 标「引擎现在正停在这一个」，`relief-null` 把链尾画成**空的槽**
  而不是一个值 —— 链断了和指着一个值，长得必须不一样。
- `tabindex="0" role="region"` 是因为它会横向滚动，**键盘用户要能进去滚**。
  凡是会横向滚的部件都要带这两个属性。

---

# 平台框图

## 启动链 `.relief-boot`

**什么时候用**：一段一段交接的过程，而且要区分「谁验了谁」。

```html
<div class="relief-boot">
  <div class="relief-bootband relief-sunken">
    <div class="relief-bandname">ROM<em><span class="lang-en">burned in silicon</span><span class="lang-zh">固化在芯片里</span></em></div>
    <div class="relief-stagerow">
      <div class="relief-bstage relief-raised relief-sealed"><b>BootROM</b><i><span class="lang-en">verifies the next one</span><span class="lang-zh">验下一级</span></i></div>
      <div class="relief-barrow">
        <svg width="20" height="16" viewBox="0 0 20 16">
          <path d="M1 8h11M9 2l7 6-7 6" fill="none" stroke="var(--navy)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
      </div>
      <div class="relief-bstage relief-raised relief-sealed"><b>SPL</b><i><span class="lang-en">brings up DDR</span><span class="lang-zh">把 DDR 拉起来</span></i></div>
    </div>
  </div>
  <div class="relief-banddrop">
    <svg width="18" height="16" viewBox="0 0 18 16">
      <path d="M9 1v8M4 6l5 6 5-6" fill="none" stroke="var(--line)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>
  </div>
</div>
```

`relief-sealed` = 这一级是签过名、改不了的。**分带（`.relief-bootband`）的意义
就是「同一带里的东西换存储介质是一起换的」** —— 不是随便分组。

## 编号翻译 `.relief-xlate`

**什么时候用**：同一个东西两边叫法不一样，而且**搞混了会查半天**。
hwirq/virq、物理地址/总线地址、次设备号/设备节点。

```html
<div class="relief-xlate relief-sunken">
  <div class="relief-xside">
    <b>hwirq 42</b>
    <i><span class="lang-en">what the SoC manual calls it — the GIC input line</span><span class="lang-zh">芯片手册上的叫法 —— GIC 的输入线号</span></i>
  </div>
  <div class="relief-xmid"><span class="lang-en">irq_domain maps it</span><span class="lang-zh">irq_domain 做映射</span><br>→</div>
  <div class="relief-xside">
    <b>virq 78</b>
    <i><span class="lang-en">what request_irq() takes — allocated at runtime</span><span class="lang-zh">request_irq() 收的是这个 —— 运行时分配</span></i>
  </div>
</div>
```

两边的 `<i>` 要写**「谁写它、谁读它」**，不是重复一遍名字。
读者混淆的根源就是不知道这两个号各自是给谁看的。

## 引脚复用 `.relief-pad`

**什么时候用**：一个焊盘能接几个功能，现在选的是哪个。

```html
<div class="relief-pad relief-sunken">
  <div class="relief-padname">GPIO2_A3<span>SPI0_CLK</span></div>
  <div class="relief-mux relief-sunken">
    <i class="on">func0 SPI0_CLK</i>
    <i>func1 I2C3_SCL</i>
    <i>func2 PWM1</i>
    <i>gpio</i>
  </div>
</div>
```

选中的那个加 `class="on"`。**没选中的不要删** —— 图的价值就在于
「这个脚还能改成什么」。

## 电源域 `.relief-pd`

**什么时候用**：关掉一个域会连带关掉谁。

```html
<div class="relief-pd">
  <div class="relief-pdom relief-sunken relief-alwayson">
    <div class="relief-pdname">PD_ALWAYS_ON<span><span class="lang-en">never gated</span><span class="lang-zh">不掉电</span></span></div>
    <div class="relief-blocks">
      <div class="relief-blk relief-raised">RTC</div>
      <div class="relief-blk relief-raised">PMU</div>
    </div>
  </div>
  <div class="relief-pdom relief-sunken">
    <div class="relief-pdname">PD_VIDEO<span><span class="lang-en">off when the screen is off</span><span class="lang-zh">灭屏就掉电</span></span></div>
    <div class="relief-blocks">
      <div class="relief-blk relief-hot">VOP</div>
      <div class="relief-blk relief-raised">DSI</div>
    </div>
  </div>
</div>
```

**域是凹的（一个地方），模块是凸的（一个东西）。**
`relief-alwayson` 给不掉电的域一个不一样的边，一眼能挑出来。

---

# 代码框图

## 函数调用栈 `.relief-stack`

**什么时候用**：一次崩溃或一次调用的完整栈，**而且要标出每一帧对应哪个文件哪一行**。

```html
<div class="relief-stack">
  <div class="relief-sp">0xffffffc0_11a4</div>
  <div class="relief-frame relief-raised relief-crash">
    <b>my_tp_report()</b><i>drivers/input/tp_core.c:412</i>
  </div>
  <div class="relief-fnote"><span class="lang-en">where it died</span><span class="lang-zh">出事的地方</span></div>

  <div class="relief-sp">0xffffffc0_11e8</div>
  <div class="relief-frame relief-raised">
    <b>tp_irq_thread()</b><i>drivers/input/tp_core.c:508</i>
  </div>
  <div class="relief-fnote"><span class="lang-en">caller</span><span class="lang-zh">调它的</span></div>

  <div class="relief-sp">0xffffffc0_1338</div>
  <div class="relief-frame relief-raised">
    <b>ret_from_fork()</b><i>arch/arm64/kernel/entry.S</i>
  </div>
  <div class="relief-fnote"><span class="lang-en">bottom of stack</span><span class="lang-zh">栈底</span></div>
</div>
```

三列一组：**栈指针 / 帧 / 注释**。注释列可以留空，但那一组
`<div class="relief-fnote"></div>` 不能少，少了后面全错位。

`<i>` 里那个 `文件:行号` 是这张图的全部价值 —— **没有它，图只是把 dmesg 抄了一遍**。

## 缩进式调用树 `.relief-ct`

**什么时候用**：这一次执行走了哪条路、时间花在哪一层。
**内核里看调用关系从来不是并排的** —— ftrace function_graph、oops 的
`Call trace:`、gdb `bt`，全是缩进的一棵树。照这个形状画，读者不用先学图例，
而且能和另一个终端里还开着的工具输出逐行对上。

```html
<div class="relief-ct">
  <div class="relief-ctrow" style="--d:0"><span class="relief-ctfn relief-raised relief-thin"><b>tp_irq_thread()</b><i>drivers/input/tp_core.c:508</i></span><span class="relief-ctus">148.3 µs</span></div>
  <div class="relief-ctrow" style="--d:1"><span class="relief-ctfn relief-hot"><b>tp_read_frame()</b><i><span class="lang-en">the one you came for</span><span class="lang-zh">你要找的就是它</span></i></span><span class="relief-ctus relief-slow">141.6 µs</span></div>
  <div class="relief-ctrow" style="--d:2"><span class="relief-ctfn relief-raised relief-thin"><b>i2c_transfer()</b><i>i2c-core-base.c</i></span><span class="relief-ctus relief-slow">138.2 µs</span></div>
  <div class="relief-ctrow" style="--d:3"><span class="relief-ctfn relief-atomic"><b>rk_i2c_xfer()</b><i><span class="lang-en">bus driver</span><span class="lang-zh">总线驱动</span></i></span><span class="relief-ctus">137.4 µs</span></div>
  <div class="relief-ctrow" style="--d:2"><span class="relief-ctfn relief-skip"><b>tp_recalibrate()</b><i><span class="lang-en">not entered this time</span><span class="lang-zh">这次没进去</span></i></span><span class="relief-ctus">—</span></div>
</div>
<div class="relief-ctnote relief-sunken"><span class="lang-en"><b>So what:</b> the expensive number is three levels deep, in code you do not own.</span><span class="lang-zh"><b>所以呢：</b>那个大数字在第三层，在不归你管的代码里。</span></div>
```

- **深度写在 `--d` 上，扁平地列出来就行** —— 不用嵌套 div。
  竖凹槽每行各画各的，前序遍历里「深度大于 k 的行」正好是那一级的全部子孙、
  而且连续，所以线自然接得上，深度一降槽自己消失。
- 修饰：`relief-hot` 这次最该看的一帧 · `relief-atomic` 这一支不能睡 ·
  **`relief-skip` 画成凹的 = 这条路这次没走**（凹=够不到，和别的图一致）·
  `relief-slow` 把耗时标成警示色。
- **`.relief-ctnote` 那一句是这张图的结论**，不是复述。没有它，读者只看到一堆数字。
- **和 `.relief-cg` 不是一回事**：`.relief-cg` 回答「谁调我 / 我调谁」（扇入扇出），
  这个回答「这一次发生了什么」（一条轨迹）。两张图别互相替代。

## 调用链定位图 `.relief-site`

**什么时候用**：排查一个具体故障、论证「改这里会影响那里」、评审一个改动的影响面。
**和上面那棵调用树不是一回事**：调用树答「这一次走了哪条路、时间花在哪层」，
这张答「**为什么这件事卡在这一行**」。

**不要照着下面这段手写** —— 写一份源文本，让生成器出这段标记：

```bash
python3 skills/design-review/scripts/gen_call_site_figure.py 你的.chain --style=relief
```

生成器按行号去文件里把原文读出来、核对每一层的行号，手写的话这两件事没人查。
格式见 `skills/design-review/references/callsites/README.md`。
下面这段就是它对 `touch-gesture/figure.chain` 的输出，放在这里是为了让你看清每个部件：

```html
<div class="relief-sitehead"><span class="lang-en">BOOT · probe runs this once</span><span class="lang-zh">开机 · probe 里跑一次</span></div>
<div class="relief-site">
  <div class="relief-siterow" style="--d:0"><span class="relief-sitefn relief-raised relief-thin"><b>tp_fw_init()</b><i><span class="lang-en">called once from probe</span><span class="lang-zh">probe 调它一次</span></i></span><span class="relief-siteat">drivers/input/tp_fw.c:27</span></div>
  <div class="relief-siterow" style="--d:1"><span class="relief-sitefn relief-removed"><b>tp_fw_version_read()</b><span class="relief-sitecut"><span class="lang-en">removed</span><span class="lang-zh">删掉了</span></span><span class="relief-sitepin">tp_fw_major</span><i><span class="lang-en">looked like it only fed the debug print</span><span class="lang-zh">看上去只是给那行调试打印用的</span></i></span><span class="relief-siteat">tp_fw.c:31</span></div>
  <div class="relief-sitesrc" style="--d:1"><span class="relief-sitequote"><span class="relief-siteat">tp_fw.c:23</span><code class="relief-sitecode"><u>tp_fw_major</u> = buf[0];</code></span><span class="relief-sitewhy"><span class="lang-en">← the only line in the driver that ever writes it</span><span class="lang-zh">← 整个驱动里唯一一次给它赋值</span></span></div>
</div>
<div class="relief-sitehead"><span class="lang-en">RESUME · the chain that broke</span><span class="lang-zh">唤醒 · 坏掉的那条链</span></div>
<div class="relief-site">
  <div class="relief-siterow" style="--d:0"><span class="relief-sitefn relief-raised relief-thin"><b>PM core</b></span><span class="relief-siteat relief-noline"><span class="lang-en">no line to give · dispatched at runtime through dev_pm_ops</span><span class="lang-zh">给不出行号 · 运行时按 dev_pm_ops 分派</span></span></div>
  <div class="relief-siterow" style="--d:1"><span class="relief-sitefn relief-raised relief-thin"><b>tp_resume()</b><i><span class="lang-en">the .resume slot of tp_pm_ops</span><span class="lang-zh">tp_pm_ops 的 .resume</span></i></span><span class="relief-siteat">drivers/input/tp_pm.c:16</span></div>
  <div class="relief-siterow" style="--d:2"><span class="relief-sitefn relief-hot"><b>tp_gesture_enable()</b><span class="relief-sitepin">tp_fw_major</span><i><span class="lang-en">the line you came here for</span><span class="lang-zh">你要找的就是这一行</span></i></span><span class="relief-siteat">tp_pm.c:24</span></div>
  <div class="relief-sitesrc" style="--d:2"><span class="relief-sitequote"><span class="relief-siteat">tp_fw.c:41-42</span><code class="relief-sitecode">if (<u>tp_fw_major</u> &lt; 3)
        <em>return 0</em>;</code></span><span class="relief-sitewhy"><span class="lang-en">← reads 0, decides the firmware is too old, returns success</span><span class="lang-zh">← 读到 0，判「固件太旧」，然后返回成功</span></span></div>
  <div class="relief-siterow" style="--d:3"><span class="relief-sitefn relief-skip"><b>tp_write_reg()</b><i><span class="lang-en">never reached — the write that arms double-tap</span><span class="lang-zh">没走到 —— 真正打开双击唤醒的那次写</span></i></span><span class="relief-siteat">tp_fw.c:44</span></div>
  <div class="relief-siteret" style="--d:2;--span:1"><span class="relief-siteretbar"></span><b>0</b><i><span class="lang-en">so the dev_warn() two lines below never fires</span><span class="lang-zh">所以下两行那句 dev_warn() 永远不打</span></i></div>
</div>
```

- **`.relief-siteat` 指向这一层被调用的那一行**（和 `gdb bt` 一样）；给不出的那一层用
  `.relief-noline` 并写清为什么
- **四种状态各管一件事**：普通凸起 = 跑了 · `.relief-hot` = 你要找的这一层 ·
  `.relief-skip` = 代码在、这次没走到 · **`.relief-removed` = 代码没了**（名字划掉 + `.relief-sitecut` 小字）。
  被删那一层下面的孩子画成 `.relief-skip`，因为它们是「因此没走到」
- **原文放在 `.relief-sitequote` 里**，上面压一条它自己的出处 —— 原文常常和调用不在同一个文件。
  `<em>` 是决定结局的那几个字，`<u>` 是两条链共用的那个东西（和 `.relief-sitepin` 同一种圈）
- **`.relief-siteret` 是失败往上传的落点**：`--d` = 落回的那一层，`--span` = 往上穿过了几层
- **两条互不相干的链各戴一个 `.relief-sitehead`** —— 不分段，读者会把第二条读成第一条的下一步
- 窄屏（640px 以下）自动改成上下排列，不用另写

## 两个栈并排比 `.relief-vs2`

**什么时候用**：能跑通的那次 vs 卡死的那次，差在哪几帧。

```html
<div class="relief-vs2">
  <div class="relief-lane relief-sunken">
    <div class="relief-lanename"><span class="lang-en">the run that worked</span><span class="lang-zh">跑通的那次</span></div>
    <div class="relief-vframe relief-same">i2c_transfer()</div>
    <div class="relief-vframe relief-same">tp_read_frame()</div>
    <div class="relief-vframe relief-same">irq_thread()</div>
  </div>
  <div class="relief-lane relief-sunken">
    <div class="relief-lanename"><span class="lang-en">the run that hung</span><span class="lang-zh">卡死的那次</span></div>
    <div class="relief-vframe relief-diff">__mutex_lock()<em><b><span class="lang-en">extra</span><span class="lang-zh">多出来的</span></b></em></div>
    <div class="relief-vframe relief-same">i2c_transfer()</div>
    <div class="relief-vframe relief-same">tp_read_frame()</div>
    <div class="relief-vframe relief-same">irq_thread()</div>
  </div>
</div>
```

**相同的帧一定要照原样重复写一遍**，不能写「…同上…」。
对比图的作用就是让人用眼睛扫出那一两行不一样，省掉重复=毁掉这张图。

## 栈溢出 `.relief-ovf`

**什么时候用**：某一帧吃掉了栈的一大块，离踩穿还剩多少。

```html
<div class="relief-ovf">
  <div class="relief-sp">0xffff…c000</div>
  <div class="relief-ovfcell relief-sunken"><span class="lang-en">stack top</span><span class="lang-zh">栈顶</span></div>
  <div class="relief-fnote"></div>

  <div class="relief-sp">0xffff…a100</div>
  <div class="relief-ovfcell relief-raised" style="box-shadow:5px 5px 11px var(--dark),-5px -5px 11px var(--lite),inset 0 0 0 2px var(--orange)">tp_fw_parse()<i><span class="lang-en">a 2 KB local array</span><span class="lang-zh">一个 2 KB 的局部数组</span></i></div>
  <div class="relief-fnote"></div>

  <div class="relief-sp">0xffff…8040</div>
  <div class="relief-ovfcell relief-guard">thread_info<i><span class="lang-en">overwrite this and there is no backtrace at all</span><span class="lang-zh">踩到它，崩溃时连回溯都打不出来</span></i></div>
  <div class="relief-fnote"></div>
</div>
```

**格子高度要按真实字节数成比例**，不然「吃掉四分之一」这句话图上看不出来。
底部那个 `relief-guard` 是 `thread_info`，它必须画出来 —— 踩穿的后果全在这一格。

## 函数调用关系 `.relief-cg`

**什么时候用**：一个函数上面谁调它、下面它调谁。

```html
<div class="relief-cg">
  <div class="relief-cgrow">
    <div class="relief-fn relief-raised"><b>tp_irq_thread()</b><i><span class="lang-en">threaded irq · may sleep</span><span class="lang-zh">中断线程 · 可以睡</span></i></div>
    <div class="relief-fn relief-raised"><b>tp_resume()</b><i><span class="lang-en">pm callback</span><span class="lang-zh">电源回调</span></i></div>
  </div>
  <div class="relief-cgedge">
    <svg viewBox="0 0 800 34" width="100%" height="34" preserveAspectRatio="none">
      <path d="M400 2 C400 18 90 14 90 32"></path>
      <path d="M400 2 C400 18 710 14 710 32"></path>
    </svg>
  </div>
  <div class="relief-cgrow">
    <div class="relief-fn relief-raised relief-focus"><b>tp_read_frame()</b><i><span class="lang-en">the one you are reading</span><span class="lang-zh">你正在看的这个</span></i></div>
  </div>
</div>
```

- 中间那个 `relief-focus` 是**你正在读的函数**，整张图围着它转。
- 连线用 `preserveAspectRatio="none"` 拉伸铺满，所以 `viewBox` 的 800
  是虚拟坐标，**x 值按「第几个 / 总共几个」算**：三个函数就是 133 / 400 / 666。
- 上下文不一样的函数标出来（`relief-atomic` 不能睡、`relief-cond` 有条件才调）
  —— 读者要判断「这条路上能不能加个 msleep」。

## 函数时序图 `.relief-seq`

**什么时候用**：几个模块之间来回几轮，**顺序和方向是重点**。

```html
<div class="relief-seq" style="grid-template-columns:repeat(4,1fr);grid-template-rows:auto repeat(4,46px)">
  <div class="relief-seqhead relief-raised" style="grid-column:1"><b>read()</b><i><span class="lang-en">user space</span><span class="lang-zh">用户态</span></i></div>
  <div class="relief-seqhead relief-raised" style="grid-column:2"><b>VFS</b></div>
  <div class="relief-seqhead relief-raised" style="grid-column:3"><b>tp_core.c</b></div>
  <div class="relief-seqhead relief-raised" style="grid-column:4"><b>i2c bus</b></div>

  <div class="relief-life" style="grid-column:1;grid-row:2/-1"></div>
  <div class="relief-life" style="grid-column:2;grid-row:2/-1"></div>
  <div class="relief-life" style="grid-column:3;grid-row:2/-1"></div>
  <div class="relief-life" style="grid-column:4;grid-row:2/-1"></div>

  <div class="relief-seqmsg" style="grid-column:1/3;grid-row:2;padding-left:25.000%;padding-right:25.000%">
    <span class="relief-lbl2">read(fd, buf, 16)</span>
    <span class="relief-seqline"><span class="relief-ln"></span><svg width="13" height="11" viewBox="0 0 13 11"><path d="M0 5.5h8M6 1l6 4.5-6 4.5" fill="none" stroke="var(--navy)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"></path></svg></span>
  </div>
  <div class="relief-seqmsg" style="grid-column:2/4;grid-row:3;padding-left:25.000%;padding-right:25.000%">
    <span class="relief-lbl2">.read = tp_read()</span>
    <span class="relief-seqline"><span class="relief-ln"></span><svg width="13" height="11" viewBox="0 0 13 11"><path d="M0 5.5h8M6 1l6 4.5-6 4.5" fill="none" stroke="var(--navy)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"></path></svg></span>
  </div>
</div>
```

**左右内缩必须按跨度算**：一条消息跨 `span` 个格子，两边各缩
`100 / (2 × span)` 个百分点。跨 2 格就是 25%。
不算这一下，消息线会从整列的最左画到最右，比生命线多伸出半格 —— 看着像连到了别人身上。

**回程箭头要把 svg 换到左边、path 方向反过来**，别只改标签文字。
箭头画反了没有任何检查会报。

---

# 数据结构

## 结构体内存布局 `.relief-layout`

**什么时候用**：结构体在内存里真实的样子 —— 哪里有空洞、跨不跨缓存行。

```html
<div class="relief-layout">
  <div class="relief-off">0</div>
  <div class="relief-fieldrow relief-raised"><b>present</b><i>bool</i></div>
  <div class="relief-sz">1 B</div>

  <div class="relief-off">1</div>
  <div class="relief-fieldrow relief-sunken relief-hole"><b>—</b><i><span class="lang-en">padding</span><span class="lang-zh">编译器填的空洞</span></i></div>
  <div class="relief-sz">7 B</div>

  <div class="relief-off">8</div>
  <div class="relief-fieldrow relief-raised"><b>last_ts</b><i>u64</i></div>
  <div class="relief-sz">8 B</div>

  <div class="relief-cl"><span>cache line 64 B</span></div>
</div>
```

**数字必须自洽**：偏移要连得上（0+1=1，1+7=8…），
空洞加起来要等于你在图注里写的那个数。
真栽过 —— 写「两个空洞共 15 字节」，实际 7+7=14。

**别手算，用 `pahole -C <结构体> <目标文件>.o` 的输出照抄。**

落在坏地方的字段加 `.relief-risk`（描一圈警示色，不动底色）——
比如 `__packed` 之后落到奇数偏移的 `u32`：

```html
<div class="relief-layout">
  <div class="relief-off">3</div>
  <div class="relief-fieldrow relief-raised relief-risk"><b>window</b><i><span class="lang-en">u32 at an odd offset — unaligned</span><span class="lang-zh">u32 落在奇数偏移 —— 非对齐</span></i></div>
  <div class="relief-sz">4 B</div>
</div>
```

位域本身用 `.relief-regbar` 画，把列数改成位宽即可
（一个字节就是 `style="grid-template-columns:repeat(8,1fr)"`）。
**小端上从最低位往上填**，所以 `bit 2:0` 画在最右边。

## 三种包含关系 `.relief-rel`

**什么时候用**：嵌进去 / 指过去 / 挂到链上 —— 这三种的**生命周期完全不同**，
而代码里长得差不多。

```html
<div class="relief-rel">
  <div class="relief-relcard relief-raised">
    <h4>struct A { struct B b; }</h4>
    <div class="relief-sub"><span class="lang-en">embedded</span><span class="lang-zh">嵌进去</span></div>
    <div class="relief-outer">
      <span class="relief-tag">struct A</span>
      <div class="relief-inner">u32 flags</div>
      <div class="relief-inner">struct B b</div>
    </div>
    <div class="relief-relnote">
      <span class="lang-en"><b>One allocation.</b> Free A and B is gone with it.</span>
      <span class="lang-zh"><b>只有一次分配。</b>释放 A，B 跟着没了 —— 你永远不 free B。</span>
    </div>
  </div>
  <div class="relief-relcard relief-raised">
    <h4>struct A { struct B *b; }</h4>
    <div class="relief-sub"><span class="lang-en">points at</span><span class="lang-zh">指过去</span></div>
    <div class="relief-outer">
      <span class="relief-tag">struct A</span>
      <div class="relief-inner relief-ptrfield">struct B *b →</div>
    </div>
    <div class="relief-hop">
      <svg width="16" height="18" viewBox="0 0 16 18">
        <path d="M8 1v10M3 7l5 6 5-6" fill="none" stroke="var(--line)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"></path>
      </svg>
    </div>
    <div class="relief-outer"><span class="relief-tag">struct B</span><div class="relief-inner">…</div></div>
    <div class="relief-relnote">
      <span class="lang-en"><b>Two allocations.</b> Two lifetimes, and A can outlive B.</span>
      <span class="lang-zh"><b>两次分配。</b>两条生命周期，A 可能活得比 B 久。</span>
    </div>
  </div>
</div>
```

`.relief-relnote` 必须写**生命周期**，不是写结构长什么样 ——
结构看代码就有，读者不知道的是「谁负责释放」。

## 联合体 `.relief-ovl`

**什么时候用**：几个成员压在同一批字节上。
**偏移表（`.relief-layout`）画不出联合体** —— 那种图的前提是「一个接一个」。

```html
<div class="relief-ovl" style="grid-template-columns:118px repeat(8,1fr)">
  <div class="relief-ovlname"><span class="lang-en">byte</span><span class="lang-zh">字节</span></div>
  <div class="relief-ovlno">0</div><div class="relief-ovlno">1</div><div class="relief-ovlno">2</div><div class="relief-ovlno">3</div>
  <div class="relief-ovlno">4</div><div class="relief-ovlno">5</div><div class="relief-ovlno">6</div><div class="relief-ovlno">7</div>

  <div class="relief-ovlname">raw</div>
  <div class="relief-ovlbar relief-raised" style="grid-column:2/6">u32<i>4 B</i></div>
  <div class="relief-ovltail" style="grid-column:6/10"><span class="lang-en">not covered</span><span class="lang-zh">没盖到</span></div>

  <div class="relief-ovlname">stamp</div>
  <div class="relief-ovlbar relief-raised" style="grid-column:2/10">u64<i><span class="lang-en">this one sets the size</span><span class="lang-zh">大小由它决定</span></i></div>
</div>
```

- **每个成员一行，都从第 2 列起**（第 1 列是名字）。横向占几格就是几个字节。
- 没被最短成员盖到的尾巴用 `.relief-ovltail`（凹的，不写值）——
  **那几个字节照样占着内存，只是这个成员管不到**。
- 最长那根决定 `sizeof`。图注要写清**「写了 A 读 B」会读到什么**，
  那才是这张图存在的理由。

## 越界落在哪 `.relief-slab`

**什么时候用**：讲 KASAN、讲 slab 越界为什么有时抓得到有时抓不到。

```html
<div class="relief-slab" tabindex="0" role="region" aria-label="slab">
  <div class="relief-slot relief-raised"><b>kmalloc-64 #0</b><i><span class="lang-en">someone else's object</span><span class="lang-zh">别人的对象</span></i></div>
  <div class="relief-gapx"></div>
  <div class="relief-slot relief-sunken relief-redzone"><b>REDZONE</b><i><span class="lang-en">KASAN fills this and watches it</span><span class="lang-zh">KASAN 往这里填标记然后盯着</span></i></div>
  <div class="relief-gapx"></div>
  <div class="relief-slot relief-raised relief-victim"><b>your object</b><i><span class="lang-en">32 bytes asked for, 64 handed out</span><span class="lang-zh">要了 32 字节，实际给了 64</span></i></div>
  <div class="relief-gapx"></div>
  <div class="relief-slot"><b>kmalloc-64 #2</b><i><span class="lang-en">a 40-byte overflow lands here and is silent</span><span class="lang-zh">越界 40 字节落到这里，一声不吭</span></i></div>
</div>
```

最后那格**故意既不凸也不凹** —— 它表示「越到这儿就没人看着了」。
这张图的结论全在那一格。

## 代码和图并排 `.relief-codefig`

**什么时候用**：只要是「这张图讲的是这段代码」，就用它。
**这是这套东西里最该常用的一个部件。**

```html
<div class="relief-codefig">
  <div>
    <div class="relief-code relief-sunken" tabindex="0" role="region" aria-label="source">
<i>/* drivers/input/tp_core.c */</i>
struct tp_data {
    <b>bool</b>              present;
    <b>u64</b>               last_ts;
    <b>struct mutex</b>      lock;
};
<i>/* $ pahole -C tp_data tp_core.o */</i>
<em>/* size: 72, holes: 2, sum holes: 14 */</em>
    </div>
    <div class="relief-figcap"><span class="lang-en">the source, as written</span><span class="lang-zh">源码原文</span></div>
  </div>
  <div>
    <!-- 这里放 .relief-layout 或别的部件 -->
  </div>
</div>
```

**左边凹陷放原文，右边凸起放解释。** 凹=这是别处来的东西（代码），
凸=这是我给你画的（图）。深度在这里也在传达意思。

`.relief-code` 里**直接写换行**，它是 `white-space:pre`。
`<b>` 标类型、`<i>` 标注释、`<em>` 标那行要读者注意的输出。

---

# 排查

## 一道一道过 `.relief-gates`

**什么时候用**：一件事要过好几关才成，卡在哪一关**各有各的症状**。
驱动没加载、设备没绑定、probe 没跑。

```html
<div class="relief-gates">
  <div class="relief-gnum">1</div>
  <div class="relief-gate2 relief-raised"><b>of_match_table</b><i><span class="lang-en">compatible string matches the node</span><span class="lang-zh">compatible 和节点对得上</span></i></div>
  <div class="relief-symptom"><span class="lang-en">no match → driver never binds, dmesg says nothing at all</span><span class="lang-zh">对不上 → 根本不绑定，dmesg 一个字都没有</span></div>

  <div class="relief-gnum">2</div>
  <div class="relief-gate2 relief-raised"><b>status = "okay"</b><i><span class="lang-en">the node is enabled</span><span class="lang-zh">节点是开的</span></i></div>
  <div class="relief-symptom"><span class="lang-en">disabled → the node is not even created</span><span class="lang-zh">是 disabled → 节点压根不会被创建</span></div>

  <div class="relief-gnum">3</div>
  <div class="relief-gate2 relief-raised relief-stuck"><b>probe()</b><i><span class="lang-en">stuck here</span><span class="lang-zh">卡在这</span></i></div>
  <div class="relief-symptom"><span class="lang-en">returns −EPROBE_DEFER forever → a supplier never showed up</span><span class="lang-zh">一直返回 −EPROBE_DEFER → 某个依赖始终没出现</span></div>
</div>
```

**第三列「症状」是这张图的全部价值。** 只画关卡不写症状，
读者还是不知道自己卡在第几关。

## 锁的持有关系 `.relief-locks`

**什么时候用**：谁拿着什么、在等什么。死锁。

```html
<div class="relief-locks">
  <div class="relief-lane relief-sunken">
    <div class="relief-lanename"><span class="lang-en">thread A · tp_fw_update()</span><span class="lang-zh">线程 A · tp_fw_update()</span></div>
    <div class="relief-lock relief-raised"><b>&amp;tp-&gt;lock</b><i><span class="lang-en">holds it</span><span class="lang-zh">拿着</span></i></div>
    <div class="relief-lock relief-sunken relief-blocked"><b>i2c bus lock</b><i><span class="lang-en">waiting for B</span><span class="lang-zh">在等 B 松手</span></i></div>
  </div>
  <div class="relief-cycle">
    <span class="lang-en">A waits on B</span><span class="lang-zh">A 等 B</span>
    <span><span class="lang-en">B waits on A · nobody moves</span><span class="lang-zh">B 等 A · 谁也动不了</span></span>
  </div>
  <div class="relief-lane relief-sunken">
    <div class="relief-lanename"><span class="lang-en">thread B · tp_irq_thread()</span><span class="lang-zh">线程 B · tp_irq_thread()</span></div>
    <div class="relief-lock relief-raised"><b>i2c bus lock</b><i><span class="lang-en">holds it</span><span class="lang-zh">拿着</span></i></div>
    <div class="relief-lock relief-sunken relief-blocked"><b>&amp;tp-&gt;lock</b><i><span class="lang-en">waiting for A</span><span class="lang-zh">在等 A 松手</span></i></div>
  </div>
</div>
```

**拿到的凸起，等着的凹陷。** 凹在这里的意思是「够不到」——
和别的图里凹的意思是一致的。

## 引用计数 `.relief-ref`

**什么时候用**：计数怎么涨怎么落，以及**它落到 0 之后谁还在用**。

```html
<div class="relief-ref">
  <div class="relief-refop">probe()</div>
  <div class="relief-refbar relief-raised"><b>get_device() → 1</b><span class="relief-pip"></span><i><span class="lang-en">the driver holds one</span><span class="lang-zh">驱动自己占一个</span></i></div>

  <div class="relief-refop">open()</div>
  <div class="relief-refbar relief-raised"><b>get() → 2</b><span class="relief-pip"></span><span class="relief-pip"></span><i><span class="lang-en">user space holds one too</span><span class="lang-zh">用户态也占一个</span></i></div>

  <div class="relief-refop">remove()</div>
  <div class="relief-refbar relief-raised relief-dead"><b>put() → 0</b><i><span class="lang-en">freed here</span><span class="lang-zh">在这里释放</span></i></div>

  <div class="relief-refop">irq</div>
  <div class="relief-refbar relief-uaf"><b>obj-&gt;buf</b><i><span class="lang-en">still running — this is the use-after-free</span><span class="lang-zh">还在跑 —— 这就是释放后使用</span></i></div>
</div>
```

**`relief-pip` 一个点代表一个持有者**，数量要和 `<b>` 里那个数字对得上。
最后那条 `relief-uaf` 是图的结论，**落在 0 之后还有一行，才说明了问题**。

## 竞态窗口 `.relief-race`

**什么时候用**：两条路交错执行，只有某一段里才会出事。

```html
<div class="relief-race">
  <div class="relief-rlane" style="grid-template-columns:150px repeat(6,1fr)">
    <div class="relief-rname"><span class="lang-en">irq thread</span><span class="lang-zh">中断线程</span></div>
    <div class="relief-rop relief-raised">read cnt = 1</div>
    <div class="relief-rop relief-raised">&nbsp;</div>
    <div class="relief-rop relief-raised">cnt = 1 − 1 = 0</div>
    <div class="relief-rop relief-raised relief-boom">kfree(obj)</div>
    <div class="relief-rop relief-raised">&nbsp;</div>
    <div class="relief-rop relief-raised">&nbsp;</div>
  </div>
  <div class="relief-window">
    <span class="lang-en">the window — both have read 1, neither has written back yet</span><span class="lang-zh">窗口在这 —— 两边都读到 1，谁都还没写回去</span>
  </div>
  <div class="relief-rlane" style="grid-template-columns:150px repeat(6,1fr)">
    <div class="relief-rname"><span class="lang-en">read() syscall</span><span class="lang-zh">read() 系统调用</span></div>
    <div class="relief-rop relief-raised">&nbsp;</div>
    <div class="relief-rop relief-raised">read cnt = 1</div>
    <div class="relief-rop relief-raised">cnt = 1 + 1 = 2</div>
    <div class="relief-rop relief-raised">&nbsp;</div>
    <div class="relief-rop relief-raised">&nbsp;</div>
    <div class="relief-rop relief-raised relief-boom">obj-&gt;buf</div>
  </div>
</div>
```

- **两条泳道的格子数必须一样**（这里都是 6），否则时间轴对不上，
  整张图的意思就错了。空格用 `&nbsp;` 占住，别省。
- 中间那条 `.relief-window` 就是结论：**不安全的是那一段时间，不是那一行代码**。

## oops 怎么读 `.relief-oops`

**什么时候用**：把一段崩溃日志逐行翻译成「这一行告诉你什么」。

```html
<div class="relief-oops">
  <div class="relief-dump relief-sunken">Unable to handle kernel NULL pointer dereference at virtual address <em>0000000000000018</em>
pc : <em>tp_read_frame+0x48</em>/0x120 [tp_core]
lr : tp_irq_thread+0x9c/0x1e0 [tp_core]
Call trace:
  tp_read_frame+0x48/0x120</div>
  <div class="relief-reads">
    <div class="relief-read relief-raised">
      <b>at virtual address 0x18</b>
      <i><span class="lang-en">A null pointer plus a field offset. 0x18 is the offset of the field you touched.</span><span class="lang-zh">空指针加上字段偏移。0x18 就是你碰的那个字段的偏移量。</span></i>
    </div>
    <div class="relief-read relief-raised">
      <b>pc : tp_read_frame+0x48</b>
      <i><span class="lang-en"><b>Where it died.</b> Feed the function plus 0x48 to addr2line and you get the source line.</span><span class="lang-zh"><b>死在哪。</b>把函数名加 0x48 喂给 addr2line，直接出源码行。</span></i>
    </div>
  </div>
</div>
```

**左边是原始日志一个字不改**（`.relief-dump` 是 `white-space:pre`），
用 `<em>` 高亮要讲的那几处。改了日志原文，读者就没法和自己手上那份对照。

## dmesg 空档 `.relief-tl`

**什么时候用**：**什么都没打印的那一段就是结论**。

```html
<div class="relief-tl">
  <div class="relief-ts">[12.004310]</div>
  <div class="relief-ev relief-raised">tp 1-0038: probe start</div>

  <div class="relief-gapband">
    <span class="lang-en">11.9 seconds with no output at all — this gap IS the finding</span><span class="lang-zh">整整 11.9 秒没有任何输出 —— 这段空档就是结论</span>
  </div>

  <div class="relief-ts">[23.918770]</div>
  <div class="relief-ev relief-raised">i2c 1: controller timed out<i><span class="lang-en">the timeout is what ended the gap</span><span class="lang-zh">是这次超时结束了空档</span></i></div>
</div>
```

**时间戳之差要等于 `.relief-gapband` 里写的那个秒数**
（23.918770 − 12.004982 ≈ 11.91）。

---

# git

## 分支与合并 `.relief-git`

**什么时候用**：分支从哪切出来、合到哪去、领先落后几个提交。

```html
<div class="relief-git">
  <div class="relief-branch" style="grid-template-columns:168px repeat(9,1fr)">
    <div class="relief-bname">upstream/main<span><span class="lang-en">vendor SDK</span><span class="lang-zh">厂商 SDK</span></span></div>
    <div class="relief-track" style="grid-column:2/9;grid-row:1"></div>
    <div class="relief-commit" style="grid-column:2;grid-row:1">r8.0</div>
    <div class="relief-commit" style="grid-column:4;grid-row:1">r8.1</div>
    <div class="relief-commit" style="grid-column:8;grid-row:1">r8.2</div>
  </div>
  <div class="relief-branch" style="grid-template-columns:168px repeat(9,1fr)">
    <div class="relief-bname">product/main<span><span class="lang-en">our fork</span><span class="lang-zh">我们的分叉</span></span></div>
    <div class="relief-track" style="grid-column:4/10;grid-row:1"></div>
    <div class="relief-commit relief-ghost" style="grid-column:4;grid-row:1">&nbsp;</div>
    <div class="relief-commit" style="grid-column:5;grid-row:1">A</div>
    <div class="relief-commit relief-merge" style="grid-column:8;grid-row:1">M</div>
  </div>
</div>
```

三件事：

1. **`.relief-track` 是那条槽，不能省。** 省了就只剩几个飘着的点，
   图会和自己的图注打架 —— 真犯过。
2. **切出点画成 `relief-ghost`（空心）**，它和上游同一列。
   rebase 挪的就是这个点，不画出来就讲不了 rebase。
3. **列号就是时间。** 两条分支上同一个时刻的提交必须在同一列，
   `grid-column` 随便填就等于时间轴是假的。

## 仓库拓扑 `.relief-repos`

**什么时候用**：几个克隆各自能干什么、不能干什么。

```html
<div class="relief-repos">
  <div class="relief-repo relief-raised">
    <h4>gateway</h4>
    <p><span class="lang-en">The only clone that can push. Never built in, so a stray object file can never ride along with a commit.</span><span class="lang-zh">唯一能推的克隆。从不在里面编译，所以漏下的目标文件搭不上提交的车。</span></p>
    <div class="relief-caps">
      <span class="relief-cap">push ✓</span>
      <span class="relief-cap relief-no">build ✗</span>
    </div>
  </div>
  <div class="relief-repo relief-sunken relief-readonly">
    <h4>satellite</h4>
    <p><span class="lang-en">Where the build runs. Fetch-only on purpose — the push remote is removed, not just discouraged.</span><span class="lang-zh">编译在这里跑。故意只能 fetch —— push 的远端是删掉的，不是靠自觉。</span></p>
    <div class="relief-caps">
      <span class="relief-cap relief-no">push ✗</span>
      <span class="relief-cap">build ✓</span>
    </div>
  </div>
</div>
```

**只读的仓凹陷 + `relief-readonly`。** `<p>` 里要写**为什么这么分**，
不是写它叫什么。

---

## 加完一张新图，跑这几条

```bash
R=skills/relief-design
node    $R/scripts/check_snippets.mjs                       # 本文件每段都能渲染、类名都有定义
python3 skills/design-review/scripts/verify.py --skill=relief $R/references/canonical/<页>.html
node    skills/design-review/scripts/visual-audit.mjs $R/references/canonical/<页>.html
python3 $R/scripts/check_skin_contrast.py $R/assets/relief.css
for t in gray ink matte mist clay sage; do
  node skills/design-review/scripts/axe-audit.mjs --theme=$t $R/references/canonical/<页>.html
done
node    skills/design-review/scripts/check_call_site_figures.mjs   # 画了 .relief-site 就跑
node    $R/scripts/check_gallery_links.mjs                  # 图集页的按钮点了落对地方
./bin/design-review --facts                                 # 图的数量变了，文档里的计数要跟着变
```

**加一张图要同步改三个地方**：canonical 页 · `diagram-craft.md` 的条目 ·
`demos/relief-design/diagrams.html` 的图集条目。
漏掉第三个，`check_gallery_links.mjs` 不会报（它只查已有的按钮）——
但 `--facts` 会因为计数对不上而报。
