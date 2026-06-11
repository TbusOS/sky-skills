# Glass Layout Patterns

## 容器档位

| class | 宽度 | 用途 |
|---|---|---|
| `.glass-container--narrow` | 720px | 长文正文(data-report prose)——**不许做 hero** |
| `.glass-container` | 1040px | 默认;hero 可用(比四个旧 skill 略宽:玻璃卡有光晕外溢边距) |
| `.glass-container--wide` | 1280px | featured diagram 整行、KPI 行、gallery 网格;**≥20 labels 或 ≥4 列的图必须用它** |

modifier 永远和 base 同写:`class="glass-container glass-container--wide"`(verify 6 强制)。

## 页面骨架

```
<html data-theme="dark">
  .glass-aurora(光晕层,inline 定位 ≤3 blob)
  .glass-nav(Tier 3 浮层 · brand + links + theme-toggle + lang-toggle + cyan CTA)
  section.glass-hero > .glass-container
  section.glass-section ×N(可加 --alt 交替)
  .glass-footer
  <script src=…glass.js>(+ inline lang-toggle JS)
```

## 节奏规则

1. **光预算前置**:hero 段集中全页最亮的 3 个 blob;后续区块至多补 1 个微 blob。整页都炫 = slop。
2. **玻璃—无玻璃交替**:不是每个 section 都要面板。pull-quote 大字直落光场(R1 例外),制造材质节奏。
3. **1 hero + N alternatives**(§I 铁律):等宽 grid 只给真正平权的内容(KPI 行、gallery 卡)。有主次时:主项独占整行(`grid-column: 1 / -1`),peers 下一行等分。第 1 列拉宽 = "整行重心偏左",禁(known-bugs 1.21)。
4. **section 间距**:`--space-9`(80px)起步,hero 上方 `--space-10`(120px)。玻璃页比浅色页更需要呼吸 —— 面板自带视觉重量。
5. **stat 行**:3–4 列等宽合法(peer 语义);数字 ≥64px 时 hollow-card 闸自动豁免。
6. **dashboard 网格**:KPI 行(4 × Tier 2)→ 主图 Tier 1(2/3 宽)+ 副图(1/3)→ 全宽表格。副图列不做第 1 列。
7. **图示密度**(全站合约):≥1 个视觉元素 / 1.5 屏;>2 屏纯文字 = text-desert 闸。
