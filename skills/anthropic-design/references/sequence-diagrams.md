# Sequence Diagrams · 时序流程图

UML-style sequence diagram · 适合展示**多 actor 之间随时间推进的交互**(API 调用 / 协议握手 / 硬件命令流 / 模块间通信).

---

## 适用场景

- ✅ API client → server 多步交互
- ✅ 硬件 CPU → 控制器 → 设备 命令流
- ✅ TLS / OAuth / 协议握手序列
- ✅ 模块间消息传递(actor model)
- ❌ 静态数据展示 → 用 table / cards
- ❌ 几何/拓扑关系 → 用 SVG 自由布局
- ❌ 决策树 / 流程分支 → 用 flowchart 或 决策表

---

## Pattern 结构

```
顶部:    [Actor 1]    [Actor 2]    [Actor 3]    ← 矩形 head + 名字
            │            │            │
            │            │            │       ← 垂直 lifeline 虚线
        ①   │ step 1 →   │            │
            │            │            │
        ②   │            │  step 2 →  │
            │            │  ┌──────┐  │       ← 内部操作框
            │            │  │ work │  │
            │            │  └──────┘  │
        ③   │ ← step 3   │            │       ← 反向箭头(返回值)
            ▼            ▼            ▼
```

- viewBox `1200 × 500`(横向 sequence 推荐)
- 顶部 actor 头矩形(rect + text)· 高 50px
- 垂直 lifeline:`stroke="#5e5b54"` `stroke-dasharray="4,3"` `stroke-width="1"`
- 横向箭头:`stroke-width="2"` 配 marker arrow
- step 编号圆圈在最左侧:`r="18"` 黑底(`#141413`)白字 + Poppins 700 weight
- 内部操作用 lighter 矩形包住(actor 内自己干活)

---

## Color tokens

| 元素 | Token | 用途 |
|---|---|---|
| Actor 1(主控/发起者) | `#141413` 黑 | CPU / user / client |
| Actor 2(中间通道) | `#5481b1` 蓝 | controller / proxy / API gateway |
| Actor 3(数据/资源) | `#a85730` 红 | storage / DB / hardware fuse |
| Step 编号圆圈 | `#141413` 黑底白字 | 1 / 2 / 3 / 4 ... |
| 主箭头 | `#5e5b54` | 普通操作 |
| 内部操作箭头 | `#557040` 绿 | actor 内部子流程 |
| 内部操作框背景 | `#eef3fa` lighter | 软框包"控制器内部硬件干活" |
| 副标签文字 | `#5e5b54` | 箭头下方说明 |

---

## 字体规则

- Actor 头名字:**Poppins 13-16px 700**
- 步骤编号:Poppins 16px 700
- 命令名 / 寄存器名 / 代码片段:**JetBrains Mono 13px 600**
- 普通描述 / 副标签:Poppins 11-12px regular
- 底部斜体说明:**Lora 13px italic**

---

## 关键约束(避坑)

### 🚫 SVG `<text>` 内禁止嵌 HTML 标签

```xml
<!-- ❌ 错 · 浏览器整 <svg> 解析中断 · 全空白 -->
<text>每次启动验 <strong>boot/vbmeta</strong> 签名</text>
<text>读 <code>OTP_DATA</code></text>

<!-- ✅ 对 · 全 plain text · 用 font-family attribute 切换字体 -->
<text font-family="Poppins, sans-serif">每次启动验 boot/vbmeta 签名</text>
<text font-family="JetBrains Mono, monospace">读 OTP_DATA</text>
```

需要部分加粗 / 换色 → 用 `<tspan font-weight="700" fill="#color">` 切片(plain text only).

### 🚫 不要用 `<pre>` ASCII art 画时序图

```text
❌ 错 · 中文 + emoji + ASCII 字符在 monospace 下宽度不一致(中文 = 2 char 宽 · emoji 1.5-2 char · ASCII 1 char)· 整体错位

CPU                    1 KB 寄存器                  2 KB 熔丝
 │                          │                              │
 │ 写 OTP_ADDR ─────────────→│                              │     ← 中文挤掉对齐
 │                          │ 控制器内部硬件 → 加电          │     ← 这一行竖线散
```

### 🚫 不要用 HTML table 替代 sequence diagram

table 行+列展示静态数据 OK · 但**无法表达"时间推进"和"actor 间穿梭"**的视觉感.user 看不出"流程"感.

---

## Template (copy-paste)

```html
<svg viewBox="0 0 1200 500"
     style="width: 100%; max-width: 1200px; height: auto; background: #faf9f5; border-radius: 12px; display: block;"
     xmlns="http://www.w3.org/2000/svg">

  <defs>
    <marker id="arr-seq" viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#5e5b54"/>
    </marker>
    <marker id="arr-seq-green" viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#557040"/>
    </marker>
  </defs>

  <!-- 3 actor 头 -->
  <rect x="60" y="20" width="120" height="50" rx="8" fill="#141413"/>
  <text x="120" y="51" text-anchor="middle"
        font-family="Poppins, sans-serif" font-size="16" font-weight="700" fill="#fff">Actor 1</text>

  <rect x="520" y="20" width="160" height="50" rx="8" fill="#5481b1"/>
  <text x="600" y="42" text-anchor="middle"
        font-family="Poppins, sans-serif" font-size="13" font-weight="700" fill="#fff">Actor 2</text>
  <text x="600" y="60" text-anchor="middle"
        font-family="Poppins, sans-serif" font-size="11" fill="#cfe1f3">subtitle</text>

  <rect x="1000" y="20" width="160" height="50" rx="8" fill="#a85730"/>
  <text x="1080" y="42" text-anchor="middle"
        font-family="Poppins, sans-serif" font-size="13" font-weight="700" fill="#fff">Actor 3</text>

  <!-- 3 lifelines -->
  <line x1="120" y1="70" x2="120" y2="460" stroke="#5e5b54" stroke-width="1" stroke-dasharray="4,3"/>
  <line x1="600" y1="70" x2="600" y2="460" stroke="#5481b1" stroke-width="1" stroke-dasharray="4,3"/>
  <line x1="1080" y1="70" x2="1080" y2="460" stroke="#a85730" stroke-width="1" stroke-dasharray="4,3"/>

  <!-- Step 1: Actor 1 → Actor 2 -->
  <circle cx="30" cy="105" r="18" fill="#141413"/>
  <text x="30" y="111" text-anchor="middle"
        font-family="Poppins, sans-serif" font-size="16" font-weight="700" fill="#fff">1</text>
  <line x1="120" y1="105" x2="600" y2="105"
        stroke="#5e5b54" stroke-width="2" marker-end="url(#arr-seq)"/>
  <text x="360" y="98" text-anchor="middle"
        font-family="JetBrains Mono, monospace" font-size="13" font-weight="700" fill="#141413">命令 / 调用名</text>
  <text x="360" y="118" text-anchor="middle"
        font-family="Poppins, sans-serif" font-size="11" fill="#5e5b54">说明</text>

  <!-- Step 2: 内部操作框 + 内部箭头 -->
  <circle cx="30" cy="200" r="18" fill="#141413"/>
  <text x="30" y="206" text-anchor="middle"
        font-family="Poppins, sans-serif" font-size="16" font-weight="700" fill="#fff">2</text>
  <rect x="450" y="180" width="300" height="40" rx="6" fill="#eef3fa" stroke="#5481b1" stroke-width="1.5"/>
  <text x="600" y="198" text-anchor="middle"
        font-family="Poppins, sans-serif" font-size="12" font-weight="700" fill="#3e6b9b">内部干活</text>
  <text x="600" y="214" text-anchor="middle"
        font-family="Poppins, sans-serif" font-size="11" fill="#5e5b54">详细描述</text>

  <line x1="600" y1="245" x2="1080" y2="245"
        stroke="#788c5d" stroke-width="2" marker-end="url(#arr-seq-green)"/>
  <text x="840" y="238" text-anchor="middle"
        font-family="Poppins, sans-serif" font-size="11" font-weight="600" fill="#557040">2a · 内部子操作</text>

  <line x1="1080" y1="285" x2="600" y2="285"
        stroke="#788c5d" stroke-width="2" marker-end="url(#arr-seq-green)"/>
  <text x="840" y="278" text-anchor="middle"
        font-family="Poppins, sans-serif" font-size="11" font-weight="600" fill="#557040">2b · 返回值</text>

  <!-- Step 3: 反向箭头 Actor 2 → Actor 1 -->
  <circle cx="30" cy="350" r="18" fill="#141413"/>
  <text x="30" y="356" text-anchor="middle"
        font-family="Poppins, sans-serif" font-size="16" font-weight="700" fill="#fff">3</text>
  <line x1="600" y1="350" x2="120" y2="350"
        stroke="#5e5b54" stroke-width="2" marker-end="url(#arr-seq)"/>
  <text x="360" y="343" text-anchor="middle"
        font-family="JetBrains Mono, monospace" font-size="13" font-weight="700" fill="#141413">返回数据</text>

  <!-- 底部说明 -->
  <text x="600" y="445" text-anchor="middle"
        font-family="Lora, serif" font-size="13" font-style="italic" fill="#5e5b54">一句话总结</text>
</svg>
```

---

## 布局参数速查

| viewBox 区域 | 用途 | y 坐标范围 |
|---|---|---|
| 顶部 actor heads | 名字 + subtitle | y = 20-70 |
| step 1 | 第一步交互 | y = 95-130 |
| step 2 | 第二步交互 | y = 145-180 |
| step 3 (含内部框) | 内部 + 子操作 | y = 195-300 |
| step 4 (反向) | 返回值 | y = 320-380 |
| 底部说明 | 斜体一句话 | y = 430-460 |

step 间距 50-60 px(纯外部交互) · 100 px(含内部框 + 子箭头) · 步骤多 → 拉长 viewBox height.

actor 横向间距:3 actor 用 `120 / 600 / 1080`(等距) · 4 actor 用 `120 / 480 / 840 / 1200` · 两两间距 360-480 px 文字才不拥挤.

---

## Examples

- [`secure-boot-guide` doc 44 §2.1 图 2](file:///home/zhangbh/af7/secure-boot-guide/docs/06_问题分析与杂项/44_OTP_硬件与代码烧录路径全调研.html) · CPU 读 OTP pubkey hash 4 步流程(3 actor:CPU / 1 KB 寄存器 / 2 KB 熔丝)

---

## Anti-pattern 反面教材

| 错法 | 后果 | 修法 |
|---|---|---|
| SVG `<text>` 内嵌 `<strong>` / `<code>` | 浏览器整 `<svg>` 解析中断 · 全空白 | 全 plain text · 用 font-family + tspan 切片 |
| `<pre>` ASCII art 画时序图 + 中文 emoji | 字符宽度不一致 · 整体错位 | 改 SVG sequence diagram |
| HTML 4 列 table 替代时序图 | 看不出"流程"感 · 静态感强 | 改 SVG sequence diagram |
| viewBox 太小 step 数太多 | 文字重叠 / 拥挤 | 拉长 viewBox height · step 间距 ≥ 50 px |
| step 编号写在箭头标签里 | 编号视觉权重不够 | 用左侧黑底圆圈 · r=18 · 醒目 |

---

## 发布前 checklist

- [ ] viewBox 比例合理(横向 1200 × 高度按 step 数)
- [ ] 全 plain text · grep `<text>` 内不应出现 `<strong>` / `<code>` / `<span` / `<em>`
- [ ] actor 头颜色对比合理(参考 color token 表)
- [ ] step 编号黑底白字 r=18 · 醒目
- [ ] 主箭头 #5e5b54 · 内部箭头 #557040 · 区分外部/内部交互
- [ ] 底部一句话斜体总结(Lora italic)
- [ ] 跑 `visual-audit.mjs` 0 error
- [ ] 截图肉眼看 · 文字不重叠 · 时间轴清晰
