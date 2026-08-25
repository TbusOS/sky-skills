# primer 技术图解包 Implementation Plan

> **For agentic workers:** 每页独立交付,独立过检查。被中断后从"下一个未完成页"继续即可。

**Goal:** 用 primer-design 的图解语言,做一组**硬件/内核/算法**主题的技术图解页 —— 让完全没接触过的人看懂寄存器、时序、SoC、IP core、驱动调用路径、二分查找。

**Why:** primer 现有三个 canonical 是 web 主题,但这个仓库的重心是内核与硬件(linux-kernel-dev / datasheet-reading / tech-pdf-reader)。技术图解才是 primer 在这个仓库里的主场。

**Spec:** 沿用 `docs/superpowers/specs/2026-08-24-primer-design-design.md`(视觉语言 / 拆解方法不变),本计划只新增"技术图画法"这一层。

## Global Constraints

- 位置:`demos/primer-design/tech/` —— `index.html`(入口)+ 六页。CSS 相对路径 `../../../skills/primer-design/assets/`。
- 每页必须过:`verify.py --skill=primer` 0 error → `visual-audit.mjs` 0 error → `axe-audit.mjs` 0 blocking → `dr-cli --skill=primer --critic` ≥ 90。
- 遵守 primer 现行规则书(`skills/primer-design/references/` 全部)+ 本计划新增的 `tech-figures.md`。
- 双语(zh 默认)、lang-zh 内全角标点、zh 单句 ≤28 汉字 / EN ≤18 词、马克笔黄单档、violet 每页一个贯穿语义。
- **这些页面不得写任何会过期的仓库计数**(skill 数、canonical 数、bug 数),避免再进 count-check 的维护面。技术数字(位宽、时钟频率、字节数)必须真实且给实物参照。
- 技术内容必须**工程上不失真**:简化可以,错不行。位序、时序关系、总线语义、握手协议要对得起工程师的眼睛。
- `primer-fig-wide` / `primer-fig-hero` / `.primer-step--centered` 来自 primer.css,页内不写笔画规则。
- 完成后:facts.mjs + count-check.py 仍需全绿。

---

### Task A: `references/tech-figures.md` — 技术图画法

**Files:** Create `skills/primer-design/references/tech-figures.md`

技术图和科普插画的差别在于**它要同时对得起小白和工程师**。这份文件定六类图的画法:

1. **位域图(bitfield)** — bit 编号方向(MSB 左 / LSB 右,标出 bit 号)、字段分格、当前讲解字段用 violet 平涂、保留位用发丝斜线、字段宽度必须与实际位宽成比例、位号字号 ≥13px。
2. **时序波形(timing)** — 时钟方波画法(上升沿标记)、数据线的有效窗口、建立/保持时间用双箭头 + 标注、采样点用马克笔黄圆点、多信号纵向对齐用发丝竖线贯穿。
3. **总线/SoC 框图** — 主从划分(master 在上、slave 在下或左右分区)、总线画成"街道"而不是细线、时钟域/电源域用极浅底色分区、跨域边界必须显式画出。
4. **IP core 内部图** — 数据通路(粗)与控制通路(细虚线)分层且视觉可区分、寄存器接口是外界唯一入口、握手信号(valid/ready)画成一对反向箭头 + 状态标注。
5. **调用路径图** — 分层带(用户态 / 系统调用 / 子系统 / 驱动 / 硬件),每层一条水平带,箭头跨带必须穿过边界线,返回路径用虚线。
6. **算法/数学图** — 状态快照序列(每步一张小图,而不是一张塞满箭头的大图)、被淘汰的部分用低透明度而不是删除、数量关系配实物参照。

每类给:必须画的元素 / 禁止的画法 / 一个"违例→改写"对照 / viewBox 尺寸建议(遵守 illustration-craft 的描边比例公式)。

- [ ] 写文件,遵守禁用词表与全角标点
- [ ] Commit: `feat: primer 技术图画法(位域/时序/总线/数据通路/调用路径/算法)`

---

### Task B: `tech/register.html` — 寄存器是什么

主题:**一个寄存器就是芯片上的一排开关**。以一个真实的 GPIO 方向寄存器为例。

屏序:① hero:芯片里一排小开关的插画 ② 比喻卡:"就像宿舍楼的配电箱,每一格开关管一个房间" ③ 位域图屏:32 位排开,标出 bit 号,violet 高亮正在讲的那一格 ④ 读-改-写三步屏(圆号 1-2-3:读出当前值 / 只改我要的那一位 / 写回去)⑤ "为什么不能直接写" 屏(直接写会把别人的开关也拨了)⑥ 回顾条。

数字给参照:32 位 = 32 个开关;寄存器地址就像门牌号。

- [ ] 契约 → 写页 → 四道检查 0 error → critic ≥90 → 双视口双语截图人眼过
- [ ] Commit: `feat: primer tech 页 register(寄存器是一排开关)`

---

### Task C: `tech/timing.html` — 一次 SPI 传输的时序

主题:**两个芯片怎么用两根线说话**。

屏序:① hero:两块芯片 + 四根线(SCLK/MOSI/MISO/CS)的插画 ② 比喻卡:"就像打拍子念数字 —— 一个人打拍子,另一个人只在拍子上听" ③ 时钟是什么屏(方波,标上升沿)④ 波形屏:CS 拉低 → 8 个时钟 → 每个上升沿采一位,采样点黄点标出 ⑤ 建立/保持时间屏(为什么数据要提前准备好)⑥ 回顾条。

工程准确性:采样沿与 SPI mode 的对应关系要说清(本页固定 mode 0),别含糊。

- [ ] 同上四道检查 + critic
- [ ] Commit: `feat: primer tech 页 timing(SPI 一次传输的时序)`

---

### Task D: `tech/soc.html` — 一颗 SoC 里面有什么

主题:**芯片内部像一座城**。

屏序:① hero:SoC 俯视框图(CPU / 总线 / 内存 / 外设)② 比喻卡:"CPU 是市政府,总线是主干道,外设是各个办事处" ③ 总线屏(为什么不能人人直连:一条主干道 vs 蛛网)④ 内存与外设怎么区分屏(地址空间画成门牌号段)⑤ 时钟域/电源域屏(哪些区域可以单独睡觉)⑥ 回顾条。

- [ ] 同上
- [ ] Commit: `feat: primer tech 页 soc(一颗 SoC 里面有什么)`

---

### Task E: `tech/ipcore.html` — 一个 IP core 是怎么设计出来的

主题:**从"要做什么"到"一块能接上总线的积木"**。

屏序:① hero:IP core 外壳 + 三个接口(寄存器接口 / 数据口 / 时钟复位)② 比喻卡:"就像一台自动售货机:面板是寄存器,里面的货道是数据通路,控制板决定什么时候动" ③ 寄存器接口屏(外界只能通过这个面板说话)④ 数据通路 vs 控制通路屏(粗线走货,细虚线发令)⑤ 握手屏(valid/ready:我准备好了 / 我能收了 —— 两个人递东西)⑥ 回顾条。

- [ ] 同上
- [ ] Commit: `feat: primer tech 页 ipcore(IP core 的设计原理)`

---

### Task F: `tech/kernel-path.html` — 一个字符从 echo 到硬件

主题:**你敲的字怎么走到串口线上**。

屏序:① hero:分层带全景(命令 → 系统调用 → 子系统 → 驱动 → 寄存器 → 引脚)② 比喻卡:"就像寄快递:你交给前台,前台交给分拣,分拣交给司机" ③–⑤ 三个步骤屏(圆号:write 进内核 / tty 层找到驱动 / 驱动写寄存器),各带术语气泡(系统调用 → 敲窗口递条子 / 驱动 → 会说这台机器方言的人)⑥ 回顾条。

- [ ] 同上
- [ ] Commit: `feat: primer tech 页 kernel-path(echo 到硬件的调用路径)`

---

### Task G: `tech/binary-search.html` — 为什么 25 次就够

主题:**对半砍的力量**(算法 + 数学原理)。

屏序:① hero:2000 万张卡片对半砍的插画 ② 比喻卡:"就像猜数字游戏,每次都猜中间" ③ 状态快照屏(每砍一次剩多少,五张小图一排)④ 数学屏(2 的多少次方 ≥ 2000 万 —— 用翻倍的纸张厚度做实物参照)⑤ "为什么必须先排好序" 屏 ⑥ 回顾条。

- [ ] 同上
- [ ] Commit: `feat: primer tech 页 binary-search(对半砍与 2 的幂)`

---

### Task H: `tech/index.html` + 接入

**Files:** Create `demos/primer-design/tech/index.html`;Modify `demos/primer-design/index.html`(加一处指向技术图解集的入口)、`demos/primer-design/diagrams.html`(同)、`demos/README.md`(一行)

`tech/index.html` 是这六页的封面:每页一张缩略插画 + 一句"这页讲什么"。

- [ ] 四道检查 + critic ≥90;facts.mjs + count-check.py 全绿
- [ ] Commit: `feat: primer 技术图解集入口 + 接进 demo 与 README`
