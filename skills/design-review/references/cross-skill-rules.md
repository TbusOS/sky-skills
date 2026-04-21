# Cross-Skill Rules

> 适用于 **所有 4 个 design skill**（anthropic / apple / ember / sage）的共通规则。
> 每个 skill 的 `dos-and-donts.md` 负责**风格独有**的规则（调色板、字体、签名动作）；
> 这份文件负责**跨风格的工艺底线**。evaluator 先读这份，再读对应 skill 的 dos-and-donts。

---

## A. 结构卫生（verify.py 强制）

1. **零占位符**：产物里不得出现 `[hero]` / `[SVG]` / `[icon]` / `[placeholder]` / `[todo]` / `[tbd]` / `[fixme]` / `[<name>.icon]`。
2. **DOCTYPE + viewport**：`<!doctype html>` + `<meta name="viewport" content="...">` 缺一不可。
3. **容器 BEM**：modifier class（`--narrow` / `--wide` / `--hero`）必须和 base class 同时出现。只写 modifier = 丢失 `margin:0 auto`。
4. **SVG 标签平衡**：`<svg>` 与 `</svg>` 数量一致。
5. **类名必须定义**：每个 `class="{prefix}-*"` 在对应的 `assets/{skill}.css` 都要有定义，不得有幽灵 class。

## B. 渲染工艺（visual-audit.mjs 强制）

1. **CTA/徽章 contrast ≥ 4.5**：按钮、徽章、nav 链接在实际背景上的 WCAG 对比度；< 3 判 error，3–4.5 判 warn。
2. **Hero 框图渲染宽度 ≥ 900px**（在 1440 视口下）：`figure[grid-column: 1 / -1] > svg` 实测 rect.width；不到就 warn。例外：作者明确用 `max-width + margin:0 auto` 居中限宽的 intentional 场景。
3. **SVG `<text>` 渲染像素 ≥ 9px**：`effective_px = font_size * (rect.width / viewBox.width)`。小于 9 就 warn。**写源码时 font-size ≥ 9.5 作为缓冲**。
4. **孤儿卡检测**：多列 grid 里 N-1 张是 `grid-column: 1 / -1` 的全行 hero 卡，剩 1 张不是且宽度 < 父容器 70% → warn。

## C. 视觉原创性（目前文档级，将来 design-critic 强制）

1. **Lineup / skill grid 卡片**：每张都必须
   - aspect-ratio: 1 或明确的比例
   - 满版背景 / 独立视觉语言（产品截图、illustration、palette 预览、数据面板 …）
   - **禁止** 72×72 细线图标居中在浅灰方块（像 wireframe）
   - 叠加文字 contrast ≥ 4.5
2. **Hero 框图**：
   - viewBox 宽度 / container 宽度 ≥ 0.85（不被 padding 吞掉）
   - 有明确的信息结构：stage labels（`01 · 02 · 03`）、对比色引导视线
   - 颜色用该 skill 的 token，不引入陌生色
   - 至少 1–2 个肌理细节（hairline 网格、柔和阴影、小装饰点），避免"ppt 感"

## D. 代码质量

1. 不写死 hex：能用 `var(--{skill}-*)` 就用 token。
2. 不用 `transition: all`：只 transition 具体属性（opacity / transform / color）。
3. 不要把衬线 display 字体用作正文（Instrument Serif / Lora 做 display + italic pull-quote，不做 body）。

## E. SVG 规则(visual-audit 强制)

1. **transform 之后先渲染确认 bbox**:`<text>` 加了 `rotate()` / `translate()` 之后,源码坐标和渲染位置脱节。**写完渲染一次,看实际 bounding box 有没有穿过别的元素**。静态扫描永远抓不到这类,必须眼睛或 playwright 看。
2. **overlap 出现时的修法优先级**(**重要** —— 不要上来就删):
   - **(a)** 先问**有没有设计意图**。如果这元素在传达一件其他元素不传达的事(例如 "REQUEST FLOWS DOWN" 声明信息流方向),它有意图,不该删。
   - **(b)** **优先挪位置 / 换布局** —— 顶部横条带、扩 viewBox 给它专属一列、换成更短的记号(`↓ FLOW` 代替 "REQUEST · FLOWS · DOWN")、改方向(旋转 → 横置)。
   - **(c)** 只在设计意图确实是冗余(其他元素已经表达了同一件事)时才**删**。删之前问 "这屏上还有谁传达这同一个意思?"
   - 历史教训:2026-04-20 第一次抓到 rotated text overlap 时,我直接删了 3 个 demo 里的装饰文字。用户指出:这是最省事不是最好的路。后来改成"横着放在 stage labels 那一行,顶部中线",既保留意图又消除 overlap。
3. **同 SVG 内任意两个 `<text>` 的 rendered rect 不应相交 ≥ 4×4 px**(svg-text-overlap check)。title + subtitle 垂直紧贴的 1-2px 叠加不算。
4. **文字颜色不要和它所在 shape 的填充色接近**:文字 `fill` 和承载它的最小不透明 rect/circle/path 的 `fill` RGB 欧氏距离 ≥ 40(simple heuristic,见 known-bugs 1.9)。半透明叠加层(fill-opacity < 0.5)不算背景 —— 真正的背景在它底下。
5. **SVG `<text>` 源码 `font-size` ≥ 11** 才能在 worst-case 0.84 scale 下仍 ≥ 9 渲染像素。

## F. HTML 语义 + a11y(visual-audit 强制)

1. **每页恰好一个 `<h1>`**(multiple-h1 error / no-h1 warn)。
2. **不跳 heading 层级**:h1 → h3 (跳 h2) warn;footer / aside / nav 内的 h5 列标题是行业惯例,不算跳级。
3. **`<img>` 必须有 `alt`**:装饰性用 `alt=""`,内容性用描述。
4. **可见的 `<a>` 必须有文本 / `aria-label` / `title`**:空链接屏幕阅读器读不出。

## I. 布局比例(visual-audit 强制 + 写之前自问)

**问题模式**:等宽 grid(`repeat(3, 1fr)` / `repeat(4, 1fr)` 等)强行把内容拉到容器宽度的 1/N,但实际内容**不够填满**这个宽度 → 卡片看着"空心"、"拉伸"、"奇怪"。

**visual-audit §10b hollow-card check**:任何等宽 grid 里,子卡 aspect > 1.8 且文本 < 180 字 → warn `hollow card`。

**例外:stat-strip**。如果卡内有 ≥36px 的大字号(big number display),跳过 —— 这是指标卡(比如 `18,000+ writers`),稀疏文本是设计本意,不是 bug。

**写之前的自问(rule)**:每次用等宽 grid 放卡时,检查三件事:

1. **每张卡的内容能撑起这个宽度吗?** 3 行 + 1 段 + 1 小 code block 塞在 400px 宽里,大概率是空心。
2. **卡的"权重"真的一样吗?** 如果其中一张是"推荐",其他是"替代",强行等宽等高**掩盖层级** → 用户分不清主次。改成 **1 hero + (N-1) 小卡** 或 **主区 + 侧栏**。
3. **ABC / 123 这种没有语义的标签是装饰还是信息?** 如果只是"需要 3 个字母",就是装饰 → 删。有序号语义(Phase 01 / 02 / 03)才留。

**正确布局模板**:

```
[ 主推方法 — 全宽 hero card (60% 文字说明 + 40% 代码) ]
           ↓
[ 替代方法 A — compact ]  [ 替代方法 B — compact ]
```

**历史**:2026-04-20 INSTALL 的 "三种方式 abc" 就是等宽 3-col 横排太宽,用户指出"一长排太宽,看着很奇怪"。scaffold 原本没 hollow-card check,现在加了。同时规则里写清"层级式 > 等权式"。

## L. 完整评审流程(每次生成新页面必走)

生成器生成任何 HTML 页之前、之中、之后都走这个流程:

### 生成**前**(plan 阶段)

```bash
bin/design-review --plan --skill=<skill> --page=<type>
```

script 输出一份 sprint-contract md,必含:
- 要读的 4 个文件(canonical.html + canonical.md + cross-skill-rules +
  dos-and-donts)
- 本页的结构 MUST(从 canonical.md 提)
- brand-presence / italic / cross-skill-smell 的 MUST
- 三闸命令

**生成器把这份 contract 读完再动手**。不读 canonical 就写 = 又一次让读者
push back。

### 生成**后**(review 阶段 —— 4 闸)

```bash
bin/design-review --critic <page.html>
```

四闸依次跑:

1. **verify.py** — 结构(占位符、DOCTYPE、BEM、SVG 平衡、class 定义、
   bilingual §G)
2. **visual-audit.mjs** — 渲染 + Playwright pngjs:
   - contrast / hero 宽 / SVG 字号 / 孤儿 figure / text overlap /
     多 h1 / heading 跳级 / img-alt / link-text / hollow card / SVG
     同色
   - **brand-presence** (§K) · **italic-overuse** (§J) ·
     **cross-skill-smell** (§K)
3. **screenshot.mjs** — 全页 PNG 存 shots/
4. **critic.mjs** — LLM 口味评审(写一份 critic prompt md,喂给 Claude;
   Claude Code 环境下直接 Task(subagent_type='design-critic'))。输出
   0-100 分 + 7 维度分解 + 具体 issues + narrative

任一 error 整个失败;warn 要人判定是否放行。critic 得分 < 75 必修。

### 自回归保底(self-regression)

每次 canonical 升级,canonical 自己跑 critic 必须 ≥ 90 分。如果达不到,
说明 rubric 偏离了 canonical 代表的那种"好",是 rubric 错,不是 canonical 错。

### 规则总览(A-L 索引)

| § | 范围 | 机器化 | 规则要点 |
|---|---|---|---|
| A | 结构 | verify.py | 占位符/DOCTYPE/BEM/SVG/class 定义 |
| B | 渲染 | visual-audit.mjs | contrast/hero 宽/SVG 字号 |
| C | 原创性 | 文档级 | lineup 卡 / hero 框图反 AI slop |
| D | 代码质量 | 文档级 | 禁写死 hex / `transition: all` |
| E | SVG | visual-audit.mjs | 先渲染确认 bbox / 删是最后一招 / 同色警告 |
| F | a11y | visual-audit.mjs | 单 h1 / heading 跳 / alt / link text |
| G | 双语 | verify.py | 公开站页必须 lang-toggle + lang-en/zh |
| H | 中文字体 | 文档级 | Noto Serif SC + Noto Sans SC(apple 例外) |
| I | 布局比例 | visual-audit.mjs §10b | hollow card + 1 hero + N 替代 |
| J | italic 纪律 | visual-audit.mjs italic-overuse | italic 仅做强调 |
| K | 品牌可视 + 串味 | visual-audit.mjs brand-presence / smell | 本风格 vs 跨风格 |
| L | 评审流程 | bin/design-review | plan → write → 4 闸 → self-regression |

---

## K. 品牌可视性 + 串味(visual-audit 强制)

每个 skill 的页面**第一眼必须能被认出**属于哪个 skill。`visual-audit.mjs` 有两层机器 check:

1. **no-brand-presence**:top 1440×500 像素区里,该 skill 的 signature 色覆盖率 ≥ 阈值。
   - anthropic 橙 ≥ 0.4%(canonicals 实测 0.5-0.9%)
   - apple 蓝 ≥ 0.02%(apple 极简,低阈值)
   - ember 金 ≥ 0.01%(金色作 hairline,小剂量)
   - sage 绿 ≥ 1.5%(sage 必须 carry 绿色身份 —— nav band 实现)
   - 实现:Playwright 截图 → pngjs 像素距匹配(tolerance 55,兜住 antialiasing)
2. **cross-skill-smell**:可见元素的 computed font-family 第一项 / color / bg / fill,若匹配禁忌清单(别 skill 的 signature),warn 一次。
   - sage 禁忌:Fraunces / Poppins / Lora / 金色 #c49464 / 橙 #d97757
   - ember 禁忌:Instrument Serif / Poppins / Lora / sage 绿 / apple 蓝
   - apple 禁忌:Fraunces / Instrument Serif / Poppins / Lora / 橙 / 金 / sage 绿
   - anthropic 禁忌:Fraunces / Instrument Serif / apple 蓝 / sage 绿 / 金

**fix playbook**:
- brand 不可见 → nav 给品牌 tint 背景,hero 加品牌色 kicker,CTA 用品牌色
- 串味 → 换回本 skill 的 token / 字体栈;不要偷别人的 snippet

**历史**:2026-04-21 sage nav 用 ember 暖米(跨味)+ sage 绿不在 top 可见,两类坑一起命中;sage/ember landing 第一版 Fraunces/Instrument Serif italic 铺满(也是字体 signature 错用)。机器化后同类 bug 再犯即抓。

## J. Italic 是强调,不是默认(写稿前自检)

当 display 字体支持 italic(Fraunces / Instrument Serif / Lora italic),italic 必须作为**强调**出现,不是每个 h1/h2/h3 的默认样式。

**允许 italic 的场景**(earned):
- Pull-quote(`blockquote` / `.ember-quote` / dark-band quote)
- Tagline / 副标(已有更大的名字在上面,italic 做柔化陪衬,如 `.tier-card__tagline`)
- 一个 heading 里的**单个强调词**(比如 `<em>by hand</em>` / `<em>to think</em>`)
- 品牌 quote mark / 单独装饰 run

**禁止** blanket italic:
- 整页每个 h1 / h2 / h3 都是 italic
- 每张卡片标题 + 每个定价档名 + 每条 FAQ 问题同时都是 italic
- 长段落正文(CJK 没有真 italic;英文长段落可读性差)

**为什么**:真正的 editorial 设计(Kinfolk / Aesop / 文学期刊)一次只让一个东西是 italic —— 一条 pull-quote,或者一个 tagline,或者一个词。满屏 italic 就不是排版,是视觉噪音。相比 apple / anthropic landing(标题都是 roman,italic 只在 pull-quote)的精致度,italic-everywhere 看起来是在用样式代替层级。

**正确写法**:
- 所有 heading 默认用字体的**正体**(roman upright)。
  - Fraunces 400 / 500 / 600 roman 做 h1-h3。
  - Instrument Serif 400 roman(它的正体本身就够优雅)。
  - Lora italic **只** 给 pull-quote,不给 h1。
- Italic 靠上面四条之一挣来。
- 如果去掉 italic 后标题感觉"太平",说明层级在靠 italic 当拐杖 —— 改 size / spacing / contrast,不是加回 italic。

**历史**:2026-04-21 写 ember + sage landing 时,我把 Fraunces / Instrument Serif 的 italic 铺在每个 h1/h2/h3/feat-title/use-tile h3 上,用户 push back:"另外两个风格的字体为什么很多斜体,你不觉得不好看吗?相比apple和anthropic的字体以及布局差很多"。修法:全部 heading 改 roman,italic 只留在:
- `.pull-quote-dark blockquote`
- 一个 hero 里的 `<em>` accent word
- tier tagline(ember pricing)

现在锁进规则,也让 pricing/docs-home/后续 canonical 都守。

## H. Chinese font stack(每 skill fonts.css 强制)

每个 design skill 的 `assets/fonts.css` 必须包含中文字体导入,配对规则如下:

| 英文字体类 | 对应中文 | 配对逻辑 |
|---|---|---|
| Lora / Fraunces / Instrument Serif(editorial 衬线) | **Noto Serif SC** | 中英都是 serif,书卷气一致 |
| Poppins / Inter(display / body sans) | **Noto Sans SC** | 中英都是 sans,几何一致 |
| IBM Plex Mono / JetBrains Mono(code) | `monospace` fallback | CJK 等宽字稀有,浏览器默认即可 |

**apple-design 例外**:系统原生 PingFang SC 是 Apple 自己的中文字体设计,和 SF Pro 原装配对,**不改**。只给 non-Apple 平台加 Noto Sans SC fallback。

**实现模板**(每 skill 的 fonts.css `@import`):
```css
@import url('https://fonts.googleapis.com/css2?
  family=<主英文字体>&
  family=Noto+Serif+SC:wght@400;500;600;700&
  family=Noto+Sans+SC:wght@400;500;600&
  display=swap');
```

**html[data-lang="zh"] 规则**(每张双语 HTML 的 `<style>` 或主 CSS):
```css
html[data-lang="zh"] body,
html[data-lang="zh"] p,
html[data-lang="zh"] li,
html[data-lang="zh"] .<skill>-quote,
html[data-lang="zh"] .<reading-elements> {
  font-family: "Noto Serif SC", "Source Han Serif SC", "PingFang SC", serif;
  font-style: normal;  /* CJK 无真 italic,强制消掉英文侧的 italic */
}
html[data-lang="zh"] h1,
html[data-lang="zh"] h2,
html[data-lang="zh"] h3,
html[data-lang="zh"] .<skill>-badge {
  font-family: "Noto Sans SC", "PingFang SC", sans-serif;
}
```

**为什么锁死这个栈**:
- Noto 系列是 Google + Adobe 合作的泛语言项目,中文 glyph 覆盖 18,000+ 字,editorial-grade 品质
- Source Han 同源(一样的 glyph 数据,不同品牌)作第一 fallback
- PingFang SC 作 Apple 系统保底
- 以后新 skill 加进来 **不能用** `"PingFang SC"` 当单独主字体(那是 2010 年代 web 默认,看得出懒)

**历史**:2026-04-20 写 canonical 时默认用 PingFang 系统栈,用户 push back ("中文字体要选个好看的"),改为 Noto Serif SC / Noto Sans SC 配对栈。现在锁进规则,不再走回老路。

## G. 公开站页必须中英双语(verify.py 强制)

**规则**:任何在 `docs/` 或 `skills/<style>/references/canonical/` 下的 HTML,都会被 GitHub Pages 发布到 `doc.tbusos.com/sky-skills/`(公开站的一部分)。这些页面 **必须** 支持中英切换,理由:

1. 主站 `index.html` 有切换按钮 —— 用户点进 docs 或 canonical 后,切换突然消失 → UX 断裂。
2. 4 个 design skill 的 SKILL.md TRIGGER 同时列出中英关键词(sage 风格 / sage style 等),站点自己得 match。
3. 我的中文母语用户在 sky-skills 是一等公民,不是 i18n afterthought。

**实现方式**(所有 canonical / docs HTML 遵循)—— 复用 roadmap.html 的模板:

```html
<html data-lang="en">  <!-- JS 会替换为读取的 localStorage 或 navigator.language -->
<style>
  html[data-lang="en"] .lang-zh { display: none !important; }
  html[data-lang="zh"] .lang-en { display: none !important; }
  /* 中文字体按 §H 规则:Noto Serif SC 做 editorial body,Noto Sans SC 做 display */
  html[data-lang="zh"] body, html[data-lang="zh"] p, html[data-lang="zh"] li {
    font-family: "Noto Serif SC", "Source Han Serif SC", "PingFang SC", serif;
    font-style: normal;
  }
</style>

<!-- nav 含 toggle 按钮 -->
<button type="button" class="lang-toggle" aria-label="Switch language">中 / EN</button>

<!-- 所有 user-facing 文本都成对包 spans -->
<h1>
  <span class="lang-en">Simple writing. Honest pricing.</span>
  <span class="lang-zh">写作,简单。定价,诚实。</span>
</h1>

<!-- script in <body> 末尾 handle 切换 + localStorage -->
```

**verify.py 强制**:检测 public path 下的 HTML 若缺 lang-toggle / lang-en / lang-zh 任一标记,直接 fail。

**历史教训**:2026-04-20 写 5 张 canonical 时,直接英文写了 —— 用户 push back。现在写进规则并机器化 check。

---

## 出坑以后

任何一次 evaluator 抓到的新 bug 类，都要走 `known-bugs.md` 末尾的"新 bug 类处置流程"。
这个 repo 的规则是：**同一个问题不该被抓两次**。
