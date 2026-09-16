---
name: relief-design
description: 用新拟态（neumorphism / soft UI）画**技术框图和控件**的 HTML 页面 —— 凸起 = 一个存在的东西，凹陷 = 够不到的地方 / 一个条件 / 刻进面料的一道槽，深度本身就是图例。七套皮肤(暖米白 / 中性灰 / 磨砂黑 / 墨黑 / 雾青 / 陶土 / 鼠尾草)，含状态机 · 时序图 · 寄存器位域 · IP 内部框图 · 内存布局 · 数据通路 · 时钟树七种硬件图，流程链 · 树状 · 左右对比 · 分层调用 · 结构体字段五种通用框图，启动链 · 分区表 · 编号翻译 · 引脚复用 · 电源域五种平台框图，函数堆栈（含两栈对比 · 栈溢出 · 中断栈）· 调用关系 · 代码架构 · 运行调度 · 函数时序图 · 结构体指针九种代码框图，probe 绑定 · 锁持有 · 引用计数 · 竞态窗口 · oops 解读 · 等待队列六种排查框图，分支合并 · 仓库拓扑 · 补丁流向 · 领先落后四种 git 关系图，以及结构体内存布局 · 嵌入指针链表三种关系 · 私有指针链 · 设备树到字段四种数据结构关系图。TRIGGER 当用户提到 新拟态 / neumorphism / neomorphism / soft UI / 凹凸感 / 浮雕风格 / relief 风格 / 拟物按钮，或要画 框图 / 状态机 / 时序图 / 寄存器位域 / 芯片内部框图 / 内存布局 / 数据通路 / 时钟树 / 架构框图 时使用。DO NOT TRIGGER：玻璃拟态 aurora 展示页(用 glass)、应用界面 / 仪表盘(用 atelier)、科普图解读本(用 primer)、营销落地页(用 apple / ember / anthropic)、商务汇报 deck(用 lectern)、发布会(用 eclat)、照片级 3D 硬件动画(用 hardware-3d)。
last-verified: 2026-09-15
---

# Relief Design — 新拟态技术框图风格

## §0 一句话

**深度就是图例。** 凸起 = 一个存在的东西；凹陷 = 够不到的地方、一个条件、或刻进面料的一道槽。
定死这两样，多数技术框图就只剩「怎么摆」的问题，读者永远不用看图例。

## §1 配方（全部秘密就这三条）

```css
/* 凸起：控件底色 = 页面底色，靠一对方向相反的外阴影顶出来 */
.relief-raised{background:var(--surf);
  box-shadow:calc(var(--off)*-1) calc(var(--off)*-1) var(--blur) var(--lite),
             var(--off) var(--off) var(--blur) var(--dark)}
/* 凹陷：同样两道，各加一个 inset */
.relief-sunken{background:var(--surf);
  box-shadow:inset calc(var(--off)*-1) calc(var(--off)*-1) var(--blur) var(--lite),
             inset var(--off) var(--off) var(--blur) var(--dark)}
/* 浮雕 + 厚度：凸起再加一道外落影，把块抬离底面 */
.relief-solid{...}
```

**唯一的硬约束：控件和方块的底色必须和页面底色一模一样。** 一旦单独填色，凹凸当场消失。
唯一例外是强调色块 —— 它靠颜色跳出来，不要求凹凸干这个活。

## §2 使用方式

```html
<link rel="stylesheet" href="<skill>/assets/fonts.css">
<link rel="stylesheet" href="<skill>/assets/relief.css">
<div class="relief-wrap">
  <header class="relief-hero"><div class="relief-container">
    <span class="relief-badge">…</span><h1 class="relief-h1">…</h1>
  </div></header>
  <div class="relief-board relief-raised">
    <div class="relief-bt">图名<em>一句注解</em></div>
    …部件…
  </div>
</div>
```

尺寸档：`.relief-thin`（薄件，位移 5/10）· 默认（9/18）· `.relief-thick`（26px 以上的大块，13/26）。
**位移要跟着件的大小缩**，否则小件上的阴影糊成一坨。

## §3 触发关键词

新拟态 · neumorphism · neomorphism · soft UI · 凹凸感 · 浮雕风格 · relief 风格 · 拟物按钮 ·
框图 · 状态机 · 时序图 · 寄存器位域 · 位域图 · 芯片内部框图 · IP 框图 · SoC 框图 ·
内存布局 · 地址空间图 · 数据通路 · 时钟树 · 架构框图 · 流程链 · 分层调用图 ·
启动链 · 分区表 · GPT 布局 · 中断路径 · 引脚复用 · pinmux ·
函数堆栈 · 栈回溯 · backtrace · 栈溢出 · 调用关系 · call graph · 代码架构 · 调度关系 ·
执行上下文 · 函数时序图 · sequence diagram · 缓存一致性 · MESI · DMA 描述符链 · 电源域 ·
probe 没跑 · 死锁 · deadlock · lockdep · 引用计数 · use-after-free · 竞态 · race ·
oops · panic · 空指针 · 丢失唤醒 · 总线时序 · i2c 时序 · git 分支图 · 提交图 ·
仓库拓扑 · cherry-pick · 领先落后 · ahead behind · 结构体布局 · pahole · 内存对齐 ·
container_of · list_head · 私有数据 · drvdata · 设备树属性 · 越界 · KASAN · dmesg 空档

## §4 不要用于

| 需求 | 用这个 |
|---|---|
| 玻璃拟态 / aurora 暗色展示页 | `glass-design` |
| 应用界面 / 仪表盘 / 后台 | `atelier-design` |
| 零基础科普图解读本 | `primer-design` |
| 营销落地页 / 定价页 | `apple` / `ember` / `anthropic` |
| 商务汇报 deck | `lectern-design` |
| 产品发布会 | `eclat-design` |
| 照片级 3D 硬件动画 | `hardware-3d` |

## §5 阅读顺序

1. `references/design-tokens.md` — 变量层、七套皮肤、尺寸档
2. `references/diagram-craft.md` — 四十九种框图各自的画法与判断依据 · **开头第一条是「图为了让代码更直观」**
3. **`references/snippets.md` — 每个部件可直接复制的标记。画新图从这里开始，
   不用再去 canonical 里扒**。四十二段，每段都被 `check_snippets.mjs` 渲染核对过
4. `references/dos-and-donts.md` — 已经踩过的坑，含每条的实测数字
5. `references/canonical/` — 八张参考页（controls / diagram / hardware / platform / code / struct / debug / git）

## §6 发布前检查（MUST）

```bash
R=skills/relief-design
python3 skills/design-review/scripts/verify.py $R/references/canonical/<页>.html
node    skills/design-review/scripts/visual-audit.mjs $R/references/canonical/<页>.html   # 0 error
python3 $R/scripts/check_skin_contrast.py $R/assets/relief.css                            # 全部皮肤通过
for t in gray ink matte mist clay sage; do
  node skills/design-review/scripts/axe-audit.mjs --theme=$t $R/references/canonical/<页>.html
done
node    $R/scripts/check_gallery_links.mjs        # 改过图集页或任何 canonical 页就跑
node    $R/scripts/check_snippets.mjs             # 改过 relief.css 或 snippets.md 就跑
python3 $R/scripts/gen_struct_figure.py --check    # 结构体布局图和 pahole 对不对得上
```

**两道对比度检查查的不是一回事，缺一不可：**

| 检查 | 查什么 | 另一道为什么查不到 |
|---|---|---|
| `check_skin_contrast.py` | 渐变底上的文字 | **axe 算不了渐变背景**，白字压在橙渐变上它一条都不报 |
| `axe-audit.mjs --theme=<皮肤>` | 真实 DOM 每个元素 | 脚本只查列出的角色对，不扫 DOM |

**结构体布局图是生成的，不许手敲。** `references/structs/tp_data.c` 里放图上
展示的那段结构体，`gen_struct_figure.py` 用真编译器编出 DWARF、让 `pahole` 算布局，
再渲染成 `.relief-layout` 写回 `<!-- gen:struct X -->` 块。
**一张算错的布局图比没有图更糟** —— 读者会拿它当依据去改代码，
而第一版手写的图就写过「两个空洞共 15 字节」，实际 7+7=14。
生成器还比人细：它标出了我手写时漏掉的那处非对齐（`u16` 落在偏移 1）。

**改过 `relief.css` 就跑 `check_snippets.mjs`。** 片段库最容易的坏法不是写错，
是**跟着 CSS 一起老掉** —— 类名改了名，片段还写着旧的，复制过去渲染出来是一堆
没有凹凸的方块，不报错。它查四件事：类名都有定义（**不分前缀** —— 漏写 `relief-`
写成 `class="sn"` 正是最常见的那个错）· 每段渲染得出尺寸 · 七套皮肤下文字都够 4.5:1 ·
`diagram-craft.md` 点名的部件都有对应片段。

**图集页改过就跑 `check_gallery_links.mjs`。** 它点一遍 49 个按钮，核对落到的那张图
是不是按钮上写的那张。这道检查不看链接字符串 —— 看的是浏览器解析出来的 `:target`
元素自己的标题。**用同一套字符串匹配去改、再去验，改错了它也说过。**

**`--theme` 不传就等于没测。** 七个皮肤不传参数会报出一模一样的数字，看着像「都过了」，
其实是把默认皮肤测了七遍（本仓 glass 的浅色主题因此漏测 11 天、带着 84 个阻塞元素）。

## §7 relief 专属要点（机械检查 + critic 会抓）

1. **SVG 描边吃不到 `box-shadow`。** 框图里占比最大的元素是连线，只能用成对
   `filter: drop-shadow()` 起浮雕，否则整页方块是凸的、线是平的，而且没有任何报错。
2. **`<b>` 不是 SVG 元素。** 在 `<text>` 里加粗要用 `<tspan font-weight="700">`。
3. **并联的支路不连线。** 凹槽表示「信号从这走到那」，把并联的兄弟节点串起来 = 把并联画成了串联。
4. **`<button>` 要显式写 `background`。** 浏览器默认按钮底色在浅皮肤下碰巧接近面料看不出来，
   暗皮肤下就是一块浅灰。
5. **写死的色值不跟皮肤走。** 一律用变量层的角色名（见 design-tokens.md §1）。
6. **暗色皮肤的高光不能用白。** 白边在近黑底上读作发光灯管，不是受光边缘。
