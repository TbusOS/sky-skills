# Anthropic Do / Don't

> 这个文档既是美学指引，也是 **"这些坑我们已经踩过了"** 的防御清单。
> 每条 Don't 旁边都有一句"Why"——如果不懂 Why，就不要删掉它。

## 写边界版式 / 控件 / 文案 — 先读 scenario recipes

§1-§6 / §1-§28 列的是 canonical 已覆盖的版式和组件。**如果你要写的版式 / 控件 / 文案不在 canonical 里**，**必须**先读对应 reference 末尾的 scenario recipes，再下笔：

- 数据 dashboard / form / table / tab / accordion / modal / sidebar / changelog / video / empty-state → `references/layout-patterns.md` §L1-§L10
- input / select / check / switch / tab / accordion / toast / dialog / banner / tooltip / skeleton → `references/components.md` §C1-§C11
- hero 进入 / 列表 stagger / hover / modal / toast / loading / count-up / route → `references/motion.md` §M1-§M10
- CTA / 空态 / error / placeholder / 链接 / pricing 文案 + 禁用词清单 → `references/ux-writing.md`

每条 recipe 给的是量化合约（duration / padding / font-size / token / class）。按表执行。recipe class 已落到 `assets/anthropic.css`（C4-C11 + L1 一组），直接 `class="anth-*"` 用即可。

## ✅ Do

- 暖米白 `#faf9f5` 底 + Lora 衬线正文
- Poppins 标题（几何感）
- 橙色 `#d97757` 实心胶囊按钮做主 CTA + **纯白字 + `font-weight: 600`**
- 编辑式卡片网格 + 长文 720px 单栏
- 客户引用用 Lora italic + 橙色左边 + 公司 logo
- 低饱和图表（soft blue / olive green / mid gray）
- 抽象 SVG 矢量插画（500×500 / 1200×1200）
- 链接用 `→` 结尾（不是 `›`）
- 单一缓动 `cubic-bezier(0.25,1,0.5,1)` + 三档时长（240/400/700ms）
- 用 `var(--anth-*)` token，不写硬编码 hex
- Lora italic 在引用 / 强调处自然使用
- Hero diagrams 用 `.anth-container--wide` (1200px) 给 SoC / code-arch / multi-repo 足够空间

## ❌ Don't — 每条都带 Why

| Don't | Why（过去踩过的坑） |
|---|---|
| 白色主背景 | 白留给 `.anth-card`；页面底色是暖米白 `#faf9f5` |
| 标题用衬线 / 正文用无衬线 | 角色反了；anthropic 是 Poppins 标题 + Lora 正文 |
| 高饱和三原色图表 | 不符合 "低饱和 editorial" 气质 |
| Apple 式裸文字链做主 CTA | anthropic 主 CTA 是实心橙胶囊 |
| `›` 箭头 | anthropic 用 `→` |
| 紫色渐变 / 彩虹渐变 / 霓虹色 | AI slop 标志 |
| `transition: all` | 性能差 + 视觉跳动。显式列属性 |
| 硬编码 hex | 用 `var(--anth-*)` token |
| 5 色以外的插画色 | 限定 orange / blue / green / mid-gray / bg-subtle |
| 把 `[hero image]` / `[icon]` / `[SVG]` / `[abstract illustration]` 留在产物里 | 上线即暴露空白格子。必须**真 inline SVG** |
| `class="anth-container--wide"` 只写 modifier 不带 base | base 提供 `margin: 0 auto`；只写 modifier → 容器贴左。**必须** `class="anth-container anth-container--wide"` |
| `.anth-button` 的 color 给 `var(--anth-bg)` = cream `#faf9f5` | cream 在橙上对比度 2.96 fail AA。**必须** `color:#ffffff` + `font-weight:600` |
| 橙底 `.anth-badge` 的 color 给 cream | 同样对比度 fail，给 `#ffffff` |
| 在 nav 里的 button 不加更高特异性 | `.anth-nav a { color: var(--anth-text); }` 会吃掉 `.anth-button` 的 white color。**必须** `.anth-nav a.anth-button { color:#ffffff; }` 单独写。anthropic.css 已含此规则（2026-04-28 升级），page 内不必重复 |
| hero 框图 figure `padding: var(--space-7)` | 吞掉 SVG 宽度。用 `var(--space-6)` 即可 |
| SVG 里 `font-size="8"` 用在信息标签 | 渲染后 <9px 看不清。最小给 10，意图小字给 9.5 |
| 多列网格里一张非 hero 卡片夹在一堆 `grid-column: 1 / -1` 中间 | 孤儿卡。要么 span 2 并 `max-width + margin: 0 auto` 居中 SVG，要么配对 |
| Lineup 卡片塞一个 72×72 细线图标居中 | 像 wireframe。每张都做满版 illustration |
| SVG 里用冷色系 hex（`#eaf0f6` / `#3a5c7a` / 任何偏蓝的 RGB） | anthropic 调色板是暖系(orange + cream + warm-tan + 可选 sage-done-green),一点冷蓝都读出"apple 串味"。4 档区分用暖中性:`#dfeadb`(done-green)/ `#fde4d6`(next-orange)/ `#f0ede3`(cream-subtle)/ 白 + dashed border。**known-bugs 1.17** |
| `<figure>` 只放 SVG,不加 `<figcaption>` | SVG 里的 `<text>` + `aria-label` 是部分 a11y 兜底,但 figure+figcaption 的语义对不成立。真 `<figcaption>` 放在 `</svg>` 后,写具体信息(轴含义 / takeaway / 来源),不是占位 "Figure 1"。**known-bugs 1.18** |
| 3-col 或 2×N 等宽 grid 里用 border 或 "Now" pill 标出推荐项 | 等宽掩盖层级。border 在做本该由 grid 比例做的事,读者不扫宽度看不出主次。改 `grid-template-columns: 0.9fr 1.15fr 0.9fr`,或切成 1 hero + (N-1) alternatives,或分成 "shipping today" / "queued" 两段。**known-bugs 1.19** |
| 用 `grid-template-columns: Xfr 1fr 1fr`(X > 1.2)把第 1 列拉宽当 hero | 读作"行重心偏左 / 歪",不是"第一列是主角"。位置 1 没对称 peer 兜住,非对称读作失衡。改独占全行(`grid-column: 1 / -1` + 下一行 2-col peers),或把 hero 放中间(`1fr 1.2fr 1fr`)。**cross-skill-rules §I 第 4 问 / known-bugs 1.21** |
| `.anth-stat-number` 大数字用 `font-weight: 600` | canonical stat-strip 规约 Poppins **700** 做大号数字。600 在 42px 下偏细,和相邻正文 weight 差不够 —— 数字失去"指标"的分量感。固定 `font-weight: 700` |
| Hero 副标 `<p>` 用 `font-size: 20px` | canonical 范围 17-19px。20 在 Lora serif 下开始往"正文强调"走而不是副标。保持 19px + `max-width: 720px` |
| `.voice-bar` 的实例级 inline `background: transparent; border: none` | voice-switcher 没框就在页面里漂,读者不知道它是控件还是正文标签。保留默认 `.voice-bar` 的框和底色,不 override |

---

## 📋 发布前 checklist（**MUST** — 四闸都要 exit 0）

```bash
# 一键跑全部 4 闸（verify + visual-audit + screenshot + critic prompt）
bin/design-review --critic <path/to/your.html>
```

或分别跑：

```bash
# 1) 结构验证（placeholder / BEM / 未定义 class / SVG 平衡 / container base-modifier）
python3 skills/design-review/scripts/verify.py <path/to/your.html>

# 2) 视觉渲染验证（Playwright + WCAG 对比度 + 框图尺寸 + 孤儿卡 + brand-presence + italic + cross-skill smell）
node skills/design-review/scripts/visual-audit.mjs <path/to/your.html>

# 3) 全页截图，肉眼审核
node skills/design-review/scripts/screenshot.mjs <path/to/your.html> shot.png

# 4) LLM critic — 写 prompt 给 Claude / design-critic 子 agent，输出 0-100 分
node skills/design-review/scripts/critic.mjs <path/to/your.html> --out=critic.md
```

### 审存量页（不是新生成的） — `bin/design-review --audit`

四闸只跑刚生成的 HTML。要批量扫存量目录、回归老页面、审客户给的 HTML：

```bash
bin/design-review --audit --skill=anthropic --allow-monolingual <dir>/
bin/design-review --audit --skill=anthropic --no-visual <dir>/   # 10x 快，先看结构错
```

输出 `<repo>/shots/audit-report-<ts>.md` + `.json`：每页 errors/warnings + Top failure modes 直方图。详见 `SKILL.md` 末尾。

### 文案前发布 checklist 追加项（来自 ux-writing.md）

- [ ] CTA 文案 ≤ 3 词，动词开头，无 `!`
- [ ] 没有 `Click here` / `Learn more` 单独做主 CTA
- [ ] 没有 `Oops` / `Sorry` / emoji
- [ ] 链接末尾 `→`（U+2192 单字符），不是 `›` / `->` / 裸文字
- [ ] 没有禁用词（`leverage` / `cutting-edge` / `revolutionize` / `unlock` / `effortless` / `seamless` / `welcome to` / `we're excited to` / `meet the new` / 等等）
- [ ] 数字千位逗号；三连点 `…` 是 U+2026 单字符

任何一条 exit 非 0 → **任务没完成**。visual-audit 会报：
- `[error]` contrast < 3 — 修文字或背景颜色
- `[warn]` contrast 3–4.5 — brand-intentional 橙 CTA 视具体情况
- `[warn]` hero diagram rendered at only X px — 容器太窄，换 `.anth-container--wide`
- `[warn]` hero diagram smallest text renders at Xpx — SVG font-size 太小
- `[warn]` orphan figure — grid 里孤单非 hero 卡，span 2 或配对

## 📐 Lineup card 质量底线

每张卡 `aspect-ratio: 1`，满版 illustration，一眼能看出这个 skill 是干什么的。禁止"小图标 + 大片空白"。

## 📊 Hero diagram 质量底线

1. 在 1440 视口渲染宽度 ≥ 900px
2. 最小 SVG 字体 ≥ 10 (viewBox)，渲染 ≥ 9px
3. 用 stage labels 引导视线
4. 只用 anthropic 5 色调色板
5. 至少一个 texture 细节（grain dots / subtle gradient）让它不像 ppt
6. 任何 `<rect|text|path>` 的 `fill` / `stroke` hex 都必须是 `var(--anth-*)` 的值或 anthropic 允许色板成员；冷色禁入（known-bugs 1.17）
7. `<figure>` 必须配 `<figcaption>`，写清"图表说了什么"，不是 "Figure 1"（known-bugs 1.18）
