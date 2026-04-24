# Known-Bug Catalogue

> 这是 design-review skill 的**事实清单** —— 每一行都是过去真实踩过的坑，
> 说清楚 **Reader sees → Why → Defense** 三件事。任何一个 bug 被重犯，
> 就是防御不够,要同时修脚本 + 修对应 skill 的 `dos-and-donts.md`。

使用方式：`design-review` 的 evaluator（脚本 + 将来的 critic subagent）
按这张表核对。读者发现一个本表之外的新问题 → 追加一行 +
回补到 visual-audit.mjs 或 verify.py。

---

## 1. 跨 skill 通用

### 1.1 `[hero]` / `[SVG]` / `[icon]` 占位符留在 HTML 里
- **Reader sees**：页面渲染出 `[placeholder]` 字样，上线即暴露。
- **Why**：LLM 草稿阶段用 `[...]` 占位，写完忘了替换为真 SVG。
- **Defense**：`verify.py` 的 `PLACEHOLDER_PATTERN` 扫所有 `[hero.*|svg|img|photo|abstract.*|workspace.*|*.icon|placeholder|todo|tbd|fixme]`。
- **Rule in skill**：每个 skill 的 `dos-and-donts.md` 都有 "把 `[hero]` 留在产物里 → 上线即暴露"。

### 1.2 BEM modifier-only（容器不居中）
- **Reader sees**：整个容器贴左，页面版心崩了。
- **Why**：CSS 里 `.ember-container { margin: 0 auto }` 是 base class 的规则，modifier `.ember-container--narrow` 只覆盖 max-width。作者只写了 `class="ember-container--narrow"`，base 的 `margin:0 auto` 不生效。
- **Defense**：`verify.py` 的规则 6 正则扫 `{prefix}-container--(narrow|wide|hero)` 必须与 `{prefix}-container` 同时出现。
- **Rule in skill**：所有 4 个 skill 的 `dos-and-donts.md`。
- **Applies to**：anthropic / apple / ember / sage（apple 的 base class 是"窄"的那一个，narrow 规则反过来）。

### 1.3 Hero 框图渲染宽度 < 900px → 字挤到不可读
- **Reader sees**：hero 里那张大 SVG 框图缩得很小，labels 在实际像素下 < 9px，完全认不出。
- **Why**：
  - figure 被关在默认 container（`apple-container` 980px / `anth-container` 960px）里；
  - figure padding 太大（`var(--space-7)`）吞掉 SVG 宽度；
  - figure 处在多列 grid 里未跨列，只占单列宽度。
- **Defense**：`visual-audit.mjs` 的 "hero diagram sizing audit"：`figure[grid-column: 1 / -1] > svg` 实测 rect.width < 900px 就 warn。
- **Fix playbook**：
  - 换用 `--hero` / `--wide` 版 container；
  - figure padding 改 `var(--space-5) var(--space-6)`；
  - figure `grid-column: 1 / -1`。

### 1.4 SVG `<text font-size="8">` 在 1440 视口实际 < 9px
- **Reader sees**：框图里的标签糊成一片。
- **Why**：作者在 viewBox 里写 `font-size="8"`，但 viewBox → 渲染宽度的 scale 通常 < 1.2，8 × 1.0 就 < 9px 了。
- **Defense**：`visual-audit.mjs` 的 "diagram-tiny-text" 检查：`effective_px = font_size * (rect.width / viewBox.width)`，< 9 就 warn。
- **Rule**：SVG 所有 `<text>` 源码 `font-size ≥ 9.5`（历史上被改过 8 → 9.5 的位置：Apple/Anthropic SoC + multi-repo diagram）。

### 1.5 多列网格里一张卡孤儿在 hero 卡旁边
- **Reader sees**：右半行大 hero 框图，左半行一张小卡片，中间撕裂感。
- **Why**：作者把一张普通 feature card 放进了一个"全行 hero figure"的 grid 里，没跨列也没配对。
- **Defense**：`visual-audit.mjs` 的 "orphan-figure" 检查：grid 里 N-1 张是 full-row hero，剩 1 张不是且宽度 < 70% 父容器 → warn。
- **Fix**：要么给孤儿 `grid-column: 1 / -1` + 给 SVG `max-width:640px; margin:0 auto` 居中，要么补一张配对卡。

### 1.6 Lineup 卡 = 小线条图标居中（看起来像 wireframe）
- **Reader sees**：skill grid 里每张卡都是 72×72 的细线图标在一个浅灰方块中心 —— 像占位符，不像成品。
- **Why**：偷懒用 Feather/Heroicons 图标当插画，aspect-ratio:1 的卡片大部分是空白。
- **Defense**：目前是文档级规则（未落到脚本，因为"是否像 wireframe"缺少客观判据 —— 这正是将来 design-critic subagent 的用武之地）。
- **Rule**：每个 skill 的 `dos-and-donts.md` 都有 "Lineup 卡片只放一个 72×72 细线图标居中 → 像 wireframe"。
- **正面教材**：每张都是满版 illustration，各有独特视觉语言（芯片 tile / 录制界面 / PDF→MD / palette 预览 …）。

### 1.7 CTA/按钮 contrast < 4.5（WCAG AA fail）
- **Reader sees**：按钮上的文字在品牌色底上发虚，失读障碍/夜间阅读看不清。
- **Why**：品牌色往往是中饱和中明度，配中性色文字差 0.5–1.0 就过不了 AA。
- **Defense**：`visual-audit.mjs` 的 "contrast audit"：扫所有按钮/徽章选择器，ratio < 3 报 error，3–4.5 报 warn。

### 1.8 SVG 里的 rotated / transformed 装饰文字穿过其他 label
- **Reader sees**:SVG 框图右侧有一条旋转 90° 的 "REQUEST · FLOWS · DOWN" 装饰文字,和其他静态标签重叠成乱码。用户主动报告此 bug (2026-04-20)。
- **Why**:generator 写 SVG 时用源码坐标思维;加上 `transform="translate(...) rotate(90)"` 之后,源码里看似安全的 x/y 坐标在渲染后变成另一方向的射线,穿过附近不该穿过的元素。**纯静态源扫描永远抓不到** —— 必须渲染后看 bounding box。
- **Defense**:`visual-audit.mjs` 的 **svg-text-overlap** check —— 同 SVG 内任意两个 `<text>` 的 `getBoundingClientRect()` 相交 ≥ 4px × 4px 就报 error。阈值 4px 跳过 title/subtitle 正常 font-metric 紧贴。
- **Rule**:`cross-skill-rules.md` §E 规定了修法优先级 —— **先问有没有设计意图,再挪位置 / 换布局,最后才考虑删**。
- **正确修法示例**:demos/{anthropic,apple,sage}-design/index.html 三处装饰文字 —— **第一次**我直接删了 (错误示范);**用户 push back 指正**后改为"横着放在 stage labels 那一行,顶部中线,箭头 ↓ REQUEST · FLOWS · DOWN ↓",保留设计意图(声明信息流方向)的同时消除 overlap。index.html 预览卡里两行大 h1 源码 y 偏移不够,调整 y 坐标(不是删 h1)。
- **教训**:2026-04-20 —— "overlap 出现时,删是最后一招,不是第一招"。这条教训已写进 cross-skill-rules §E.2 优先级规则。

### 1.9 SVG 里文字颜色和它所在的 shape 填充色太近
- **Reader sees**:某 rect 里的文字和 rect 的填充色看起来几乎一样,文字变不可见。
- **Why**:作者在源码里用 `fill="#fff"` 给文字,不小心 rect 也是 `fill="#fff"`,或两者色相差几个 RGB。
- **Defense**:`visual-audit.mjs` 的 **svg-text-on-same-colour** check —— 对每个 `<text>`,找到包含它中心点的**最小不透明** shape(忽略 fill-opacity < 0.5 的叠加层),计算 RGB 欧氏距离;< 40 就 warn。
- **注意**:该 check 的 heuristic 近似度不高,只用作提示。真色彩对比度要 WCAG 算法(带 gamma 曲线),不是简单 RGB 距离。

### 1.10 heading 层级跳级 h1 → h3(跳过 h2)
- **Reader sees**:视觉上没问题,屏幕阅读器用户会感觉章节结构残缺。
- **Why**:作者用 h1 标全页标题,直接用 h3 做子标题(因为 h2 太大了),h2 缺失。
- **Defense**:`visual-audit.mjs` 的 **heading-skip** check —— 扫所有可见 heading(跳过 footer / aside / nav,这些 landmark 里 h5 列标题是行业惯例),发现 jump > 1 级就 warn。
- **修法**:要么补一个 h2 层级,要么把 h3 改成 h2 + CSS 缩小字号(语义层级归语义,视觉层级归 CSS)。

### 1.11 多 `<h1>` 同页 / 无 `<h1>`
- **Reader sees**:没视觉异常;SEO 和 a11y 出问题。
- **Defense**:`visual-audit.mjs` 的 **multiple-h1** check —— 可见 h1 > 1 报 error;== 0 报 warn。

### 1.12 `<img>` 无 alt / `<a>` 无可访问文本
- **Reader sees**:视觉正常;屏幕阅读器读不出内容。
- **Defense**:`visual-audit.mjs` 的 **img-no-alt** 和 **link-no-text** check。`<img>` 必须有 alt(装饰性可 `alt=""`);可见 `<a>` 必须有文本或 aria-label 或 title。

### 1.14 品牌色在 hero 不可见(no brand presence)
- **Reader sees**:页面一打开,看到的是白/米底 + 黑字,第一眼读不出是哪个 skill 的风格。
- **Why**:作者按惯性把 nav 写成中性白/米色,brand 色只小剂量出现在正文深处。访客没品牌认知,第一眼的视觉信号决定"这是什么感觉"。
- **Defense**:`visual-audit.mjs` 的 **no-brand-presence** check。截图 top 1440×500px,数该 skill 的 signature 色像素覆盖,低于阈值 → warn。
- **Fix playbook**:nav bg 给品牌 tint(如 sage 用 `rgba(212,225,184,0.88)`)、hero kicker 用品牌色、或 hero 里放品牌色 badge / button。
- **历史**:2026-04-21 sage nav 曾经用 `rgba(255,242,223,0.85)`(ember 暖米)导致 sage 页看起来是黄的,用户 push back。修法:sage nav 改 sage 绿 + 加机器化 check。

### 1.15 Italic 滥用 / 铺满式 italic
- **Reader sees**:每个 h1 / h2 / h3 / card-title 都是 italic,页面像婚礼请柬,不像 editorial。
- **Why**:display 字体支持 italic 时(Fraunces / Instrument Serif / Lora),作者用 italic 代替层级拐杖,而不是用 size/weight/spacing 建立层级。
- **Defense**:`visual-audit.mjs` 的 **italic-overuse** check。display heading ≥5 个时,italic 比例 >40% → warn。排除 pull-quote 内的 heading(italic 在那儿是挣得的)。
- **规则**:`cross-skill-rules.md §J`。
- **历史**:2026-04-21 ember/sage landing 第一版我把 italic 铺满每个 heading,用户 push back "不好看"。

### 1.16 跨 skill 串味(cross-skill smell)
- **Reader sees**:sage 页出现 ember 的金色 / Fraunces 字体,或 apple 页出现 anthropic 橙,视觉上"像另一个风格"。
- **Why**:写作时复用了错风格的 snippet / token,或 inline style 硬编码了别的 skill 的 hex。
- **Defense**:`visual-audit.mjs` 的 **cross-skill-smell** check。扫所有可见元素的 computed font-family + color/bg/fill,匹配禁忌清单就 warn。禁忌清单在 script 内的 `SKILL_SIGNATURES` 表。
- **Fix playbook**:换成本 skill 的 token / 字体栈;如果真需要那个色 → 问自己是不是该换 skill。

### 1.13 等宽 grid 里的卡片空心(hollow card)
- **Reader sees**:3+ 列等宽 grid 里某卡片被拉到 400px 宽,但只有 3 行文本 + 一个小 code block,看起来"空心拉伸"。
- **Why**:作者写 `repeat(3, 1fr)` 放不同重要性的选项,用 ABC 标注,内容根本撑不满这个宽度。
- **Defense**:`visual-audit.mjs` 的 **hollow-card** (§10b) check:等宽 grid 的子卡 aspect > 1.8 且文本 < 180 字 → warn。
- **例外(2026-04-21 tuning)**:子卡内有 ≥36px 大字号(stat-strip / metric display)时跳过 —— `18,000+ writers` 这种指标卡稀疏文本是设计本意。
- **例外(2026-04-23 tuning · issue #8)**:子元素**本身没有任何卡片视觉锚**(无 border、无 box-shadow、背景色和父容器一致)时跳过 —— 这类 `<div>` 是父卡内的文本分组,不是独立的卡。场景:android-llm-bridge `webui-preview.html` Playground 指标栏 6 连警告。
- **Fix playbook**:
  - 如果真是内容层级不均:改为 1 hero + (N-1) 小卡(参考 cross-skill-rules §I);
  - 如果内容真的少:改 `minmax(0, Npx)` 限宽,不走全行。

### 1.17 SVG 内部 foreign hue(skill 色板外的色偷渡)
- **Reader sees**:anthropic docs-home 的 phase-order 图第 3 列用 `fill="#eaf0f6"` / `stroke="#3a5c7a"` —— 冷蓝色。anthropic 调色板是暖系(orange / cream / warm-tan) + 可选 sage-done-green,冷蓝没有锚点,读出"apple 调色偷渡"。
- **Why**:1.16 的 cross-skill-smell check 只对 3 个参考 hex(apple #0071E3 / sage #97B077 / ember #c49464)做 22-RGB 容差匹配。一个冷蓝 `#eaf0f6` 和 apple blue RGB 距离 ~212,不触发,但仍然不在 anthropic 自己的色板家族里。SVG 属性 fill/stroke 也没经过 CSS cascading,走的是另一条路径。
- **How caught**:multi-critic 的 illustration 专家(solo critic 和 brand 专家都漏了)。2026-04-22 首次命中。
- **Defense**:`visual-audit.mjs` 新 check **svg-foreign-hex** —— 扫 inline SVG 的 `<rect|path|circle|ellipse|polygon|text|line>` 的 fill / stroke 属性,每个 hex 对照当前 skill 的 `allowedPalette` 允许清单 + 通用中性色(黑白近灰),都不沾就 warn。`SKILL_SIGNATURES[skill].allowedPalette` 存允许 hex 数组。
- **Fix playbook**:换成本 skill 允许色。4 档区分用暖中性档:`#dfeadb` (done-green) / `#fde4d6` (next-orange) / `#f0ede3` (cream-subtle) / 白 + dashed border。保留 orange 作唯一 accent。
- **和 1.16 的关系**:1.16 是"别扮成另一个 skill"的大教义,通过 3 个参考 hex + 字体名走 computed-style 匹配;1.17 是 SVG-属性 内部 色板外新 hue 的 sub-case,**方向相反** —— 不是"匹配到某个具体 foreign hex"而是"不在本 skill allow-list 内"。两个 check 互补,不是重复。

### 1.18 `<figure>` 没有 `<figcaption>`(语义 contract 违反)
- **Reader sees**:肉眼没问题 —— 图里通常会有 inline SVG `<text>` 充当视觉说明。但 `<figure>` 和 `<figcaption>` 的 screen-reader 对应关系消失,语义上这是错的 figure。
- **Why**:generator 把"看上去像 caption"的文字塞进 SVG 里(因为它就在图下方),然后跳过 `<figcaption>`。SVG `<text>` + 外层 `aria-label` 是部分 a11y 兜底,但不满足 figure+caption 的语义对。
- **How caught**:multi-critic 的 illustration 专家。2026-04-22 首次命中。
- **Defense**:`visual-audit.mjs` 新 check **figure-no-caption** —— 每一个 `<figure>` 必须含至少一个直接子 `<figcaption>`。
- **Fix playbook**:在 `</svg>` 后加真的 `<figcaption>`,具体写清(轴含义 / 一行 takeaway / 来源),不是占位"Figure 1: ..."。

### 1.20 showcase page 上 cross-skill-smell 误报 (待修)
- **Reader sees**:一张合法展示 4 个 skill 的 showcase 页(如 `/index.html` 介绍所有 skill),视觉上本来就**需要**显示 apple blue / ember gold / sage green / Fraunces / Instrument Serif 作为 skill 样品。visual-audit 把这些全部判为 cross-skill-smell。
- **Why**:`cross-skill-smell` check 假设"一个 HTML 文件 = 一个 skill",但 showcase 页显式展示多 skill 是合法用法。
- **How caught**:2026-04-22 learning-loop 在 index.html 上跑 figure-no-caption check 的同时,顺带跑 cross-skill-smell,产出 5 条 warn。所有 5 条都是合法展示,不是真的 smell。
- **Defense**:待做 —— 给 `<html>` / `<body>` 加可选 `data-showcase="true"` 属性,visual-audit 的 cross-skill-smell 检查遇到这个属性就降级或跳过。或在 showcase 容器 `<section data-showcase>` 上做局部豁免。
- **Fix playbook** (脚本待改):
  - 短期:在 `bin/design-review` 加 `--showcase` flag,传给 visual-audit 后**跳过** cross-skill-smell。
  - 中期:scanner 遇到 `data-showcase` 属性的 element 及其后代,对该区 cross-skill-smell 跳过,其余正常跑。
  - 长期:showcase 页面用一个"多 skill 白名单"定义它合法引用哪些 skill 的元素。

### 1.19 等宽 grid 里的"推荐卡"靠 border 撑层级
- **Reader sees**:3-col 或 2×N `repeat(1fr)` grid 里,某一张卡有 `border: 2px solid orange` 或 "Now" pill 标出它是推荐项。但列宽仍然等分,所以读者得扫完内容才找到主项 —— border 在做"本该由 grid 比例做的事"。
- **Why**:generator 默认 `repeat(3, 1fr)` 因为内容放得下,忘了 §I "等宽只在 peer 情况下用"。HARNESS-ROADMAP 命中两处:`#status` 3 张卡中间 `border:2px solid orange`,`#components` 8 张卡重要性不均。
- **How caught**:multi-critic 的 composition 专家(一页两处)。2026-04-22 首次命中。
- **Defense**:`visual-audit.mjs` 新 check **recommended-card-equal-grid**(heuristic)—— 对 `repeat(N, 1fr)` 的 grid,如果恰有一张子卡的 border-width/color/style 和兄弟不一样且 >= 1.5px 非中性,warn。启发式会有假阳性,仅作提示。
- **Fix playbook**:
  - 改列宽:`0.9fr 1.15fr 0.9fr`(中间大)或 `1fr 1.3fr 1fr`;
  - 或切"1 hero + (N-1) alternatives":全行 hero 卡 + 下方 compact 行;
  - 或分两段:"shipping today"(2-col 大)+ "queued"(3-col 小)。

### 1.21 非等宽 3-col grid 第 1 列更宽 = 读作"左重",不是"hero 领头"
- **Reader sees**:`grid-template-columns: 1.4fr 1fr 1fr`(或任何 `Xfr 1fr 1fr` 且 X > 1.2)三列布局,本意是"放大第一列让它当主角",实际视觉上读成"整行的重量被拽向左边"。容器本身 `margin:0 auto` 居中也救不回来 —— 内容分布先于容器对齐定义视觉重心。
- **Why**:hero 卡和 peers 并排且在**第 1 位**,第一列宽度被读作"row 的起始点偏移",不是"这一列被特别处理"。位置 1 没有相邻对称的 peer 做对冲 → 非对称被放大感知成失衡。hero 在**中间**(`1fr 1.2fr 1fr`) 两侧对称,读作"被抬高的中心";hero 在**第 1 位**就读作"重心下坠"。
- **How caught**:人眼(2026-04-22)。composition-critic subagent 给 1.4fr 方案打 91/100 还建议"再宽一点" —— AI 评审认可了人眼判定崩坏的方案。`visual-audit.mjs` 的 grid 相关 check(hollow-card §10b / recommended-card-equal-grid §1.19)都只针对**等宽** grid,不审非等宽 grid 的位置效应。
- **Defense**:`visual-audit.mjs` 新 check **asymmetric-first-col-hero**(heuristic)—— 3-col grid 渲染后第 1 列宽度 ≥ 1.2× 其他列最小值,且第 1 列不是"全行 hero"(`grid-column: 1 / -1`)、不是"anchored hero"(深底色 lum<0.25 或 chromatic border-left ≥ 3px) → warn。启发式,仅作提示。
- **例外(2026-04-23 tuning · issue #9)**:grid 内含 `input / select / textarea / [contenteditable] / output` 时跳过 —— 这是表单行(label + control + unit)模式,宽度不对称是数据录入行的固有语义,不是内容 hero 布局。场景:android-llm-bridge `webui-preview.html` Playground 滑块参数面板 ~12 连警告。
- **Fix playbook** (按优先级):
  1. **1 hero 全行 + (N-1) alt 下一行**(推荐)——hero 独占 `grid-column: 1 / -1`;
  2. **居中放大** `1fr 1.2fr 1fr`——hero 在中间,两侧对称;
  3. 保留第 1 列宽 → 加视觉锚(深底 + accent border-left),让它读成"不同材质";
  4. **禁止**单纯拉宽第 1 列当 hero 手段(`1.4fr 1fr 1fr`)。
- **和 1.19 的关系**:1.19 是**等宽** grid 用装饰建层级(proportion 没承担 hero 的活被装饰接管);1.21 是**非等宽** grid proportion 放错位置(用了 proportion,但 hero 在第 1 位没对称 peer 对冲,读成失衡)。两者互为对照。

### 1.22 `<span class="lang-zh">` 内半角 ASCII 标点(,/;/:)打破 CJK 字体 metrics
- **Reader sees**:中文段落里夹 `,` `;` `:` 半角标点,字体栈是 Noto Sans SC / Noto Serif SC(§H),半角标点按 Latin metrics 渲染,和周围的 Han 字符 kern 不一致,行内视觉出现 "抖一下" 的不均匀。大段中文读起来像标点松了。
- **Why**:作者在写 `<span class="lang-zh">` 段落时,习惯性继续用英文段落里用的半角 `,` `;` `:`。中英文在同一 HTML 里切换时,语言栈切换了但标点没跟着切。`。` 句号多数作者会记得改,但 `,` `;` `:` 容易漏 —— 编辑器默认输入法半角状态下直接敲出来。
- **How caught**:multi-critic 的 brand + copy 双抓(2026-04-24, anthropic comparison canonical v1)。brand critic 用 "Noto CJK 的 Latin metrics 打破行内节奏" 的角度说清楚为什么这不是单纯"审美偏好"而是渲染问题;copy critic 也同时标出,但说 "out of lane · typography critic own this"。
- **Defense**:`verify.py` 新 check **zh-halfwidth-punct**:扫 HTML 里所有 `<span class="lang-zh">…</span>` 段落,若 body 内含半角 `,` `;` `:`(非 URL / 非 identifier · 通过"标点前后至少一个 CJK 字符" heuristic 降误报)→ fail,提示替换为对应全角 `,` `;` `:`。
- **Fix playbook**:
  - CSS 段落:`<span class="lang-zh">` 内部的 `,` → `,` · `;` → `;` · `:` → `:` · `!` → `!` · `?` → `?`
  - **保留半角**的场景:代码块(`<code>` / `<pre>`)· URL / 路径 · identifier(如 `record_id 882091`)· 仅含数字/字母的 list item(`grep, git, any editor works` 这种 —— 但这种通常在 lang-en 里,zh 侧应用顿号 `、`)
  - 重复性场景用脚本替换:见 2026-04-24 commit 里的 python one-liner · 限定 `<span class="lang-zh">` 范围,避免误伤 en span
- **延伸**:适用所有使用 anthropic/apple/ember/sage design 的双语页。所有 canonical 的 zh 侧都要过这一条 check。

### 1.23 canonical 页缺 generator self-diff note · critic 没靶子
- **Reader sees**:critic(solo 或 4 专家)评审 canonical 时只能凭感觉说"布局不错""copy 平衡"等印象级评语,没法指出作者"为什么选 A 不选 B"的取舍站不站得住。下一个作者想 port 这张 canonical 到另一个 skill,得翻 .md 逆向推断设计意图,搬到新 skill 时把作者的 trade-off 搬丢。
- **Why**:generator 写完 HTML 不会天然写出"我选了 two-truths 框架不选 declare-winner 框架,因为 comparison 一开头就站队立刻失去信任"。HARNESS-ROADMAP Phase 03 的模型弱点就是这条:模型天然不 articulate 自己的设计决策。没有强制:critic 只能凭感觉,同 page-type 不同 skill 的 port 过程把 trade-off 当成偏好搬丢。
- **How caught**:HARNESS-ROADMAP 长期挂 Phase 03 "Partly done",2026-04-24 的 comparison canonical 过 multi-critic 时 4 位 critic 都没引用作者决策——不是他们水平不够,是作者没留下靶子。
- **Defense**:`verify.py` 新 check **canonical-self-diff**:任何路径含 `/references/canonical/` 的 HTML,必须 embed `<!-- design-review:self-diff v1 ... /design-review:self-diff -->` HTML 注释块,内含 `Skill:` / `Page-type:` / `Created: YYYY-MM-DD` / `Decisions`(至少 3 条 · `[id] chose "A" over "B". Because: ...` 三段格式)/ `Known trade-offs:` 五个字段。缺任一 → fail。Contract 详见 `cross-skill-rules.md §M`。
- **Fix playbook**:
  - 生成新 canonical 时,作者完稿后把 5-7 条关键 decision + 2-3 条 trade-off 写成 self-diff 注释,embed 到 `</body>` 前。`Because:` 段必须回答"为什么不选替代方案",不是"A 的优点"。
  - 历史 canonical(2026-04-24 前)从对应 `.md` 设计决策里提取,明确标明"derived from existing canonical.md"而非作者原笔,但作为 critic 靶子已够用。
  - 修 placeholder check(`verify.py` 的 check 1)先剥 self-diff 块再扫方括号 —— self-diff 的决策 id `[hero-framing]` 不是占位符。

---

## 2. anthropic-design

### 2.1 cream 在橙 CTA 上 = 2.96（fail AA）
- **Reader sees**：橙底按钮上的 `"Try Claude"` 文字在暖奶白色下变得发灰。
- **Why**：`color: var(--anth-bg)` (`#faf9f5`) 在 `.anth-button` 的橙 (`#d97757`) 背景上 = 2.96。
- **Defense**：改为 `color: #ffffff; font-weight: 600;`（3.12，warn-level，品牌 intentional）;
  visual-audit 的 contrast 检查会在 ratio < 3 时 fail。

---

## 3. apple-design

### 3.1 Hero 框图被压缩因 `.apple-container` (980px) 包 span-2 figures
- **Reader sees**：SoC / multi-repo 两张大框图文字 < 9px，认不出。
- **Why**：apple 的 base container 是 **窄的** (980px for reading)，hero 得用 `apple-container--hero` (1280px) 或 `--wide` (1280px)。历史上作者把 hero 还是套在默认 container 里。
- **Defense**：
  - `verify.py` 的 hero container 规则：base `apple-container` 被标为 narrow，`--hero`/`--wide` 才被接受;
  - 模板里 hero 段已固定用 `.apple-container apple-container--hero`;
  - visual-audit 的 diagram-narrow + diagram-tiny-text 兜底。

### 3.2 apple 品牌蓝链接在浅灰段上 = 4.31(差 0.19 过 AA)
- **Reader sees**:`.apple-link`(#0071E3)用在 `background:#f5f5f7` 的 subtle section 上,contrast 4.31,差一点点。
- **Why**:apple.com 自己就是这么做的,品牌定位上是 intentional。
- **Defense**:visual-audit.mjs 的 INTENTIONAL_EXCEPTIONS 列表增加一条(fg #0071E3 × bg #f5f5f7),`--ignore-intentional` 过滤。

---

## 4. ember-design

### 4.1 `.ember-nav a` 吃掉 `.ember-button` 的 color → "Get skills" 按钮不可见
- **Reader sees**：导航里的橙色 CTA 文字变成暗棕，几乎和底色一样。
- **Why**：CSS 里 `.ember-nav a { color: var(--ember-text) }` 选择器特异性 ≥ `.ember-button { color: #fff }`，前者后定义或同特异性下胜出。
- **Defense**：在 `ember.css` 里追加 `.ember-nav a.ember-button { color: #ffffff }` 单独规则;
  visual-audit 的 contrast audit 在 rendered 时兜底。
- **Rule**：ember-design `dos-and-donts.md` 专条 —— "nav 里的 button 不加更高特异性 → `.ember-nav a { color: ... }` 会吃掉 `.ember-button` 的 color"。

---

## 5. sage-design

### 5.1 `#97B077` sage 绿在白底上 = 2.4（fail AA）
- **Reader sees**：白底上的 sage 绿按钮/链接文字太淡，看不清。
- **Why**：sage 是装饰性颜色，不是 primary ink。当 CTA 底色 = 白 / 文字 = sage 绿时 contrast = 2.4。
- **Defense**：
  - 规则：primary CTA 用 `--sage-ink` (#393C54, 对 cream 底 11.3 ✓) 作为文字色或按钮底色；
  - sage 绿只做 accent / illustration / 大面积填充 + 白字（`#ffffff` on `#97B077` = 4.1，warn 但可用）;
  - 在 `design-tokens.md` 文档化。

---

## 新 bug 类的处置流程（每次必做）

1. design-critic 或人发现一个本表之外的问题。
2. 决定：**这是偶发还是一个 bug 类?**
   - 偶发 → 只修这一页。
   - bug 类 → 走步骤 3。
3. 追加一行到本文件，写清 Reader sees / Why / Defense。
4. 如果能在 render 时检测 → 加一个 check 到 `scripts/visual-audit.mjs`。
5. 如果能在静态扫时检测 → 加一个 check 到 `scripts/verify.py`。
6. 如果是 style-specific → 也更新对应 skill 的 `references/dos-and-donts.md`。
7. 至少给一个 fixture demo 或测试证据说明"改完以后这条 bug 跑脚本能被捉到"。
