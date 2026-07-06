# eclat-design — Do / Don't

发布会皮肤的品位边界。每条都是"做错会读成什么 → 怎么做对"。eclat 的身份 = **哑光电影感 keynote**:光、尺度、留白三件事撑场,颜色极度克制。下面按"会破坏身份的程度"排。

## 绝对不要(破坏身份 / 机器或 critic 会抓)

| Don't | 为什么 → 怎么做对 |
|---|---|
| 用毛玻璃面板 / `backdrop-filter` / aurora 光斑 | 那是 **glass** 的语言,eclat 一旦用就 cross-skill smell、两套撞。eclat 的面板是**不透明哑光**;戏剧来自 radial 聚光 + vignette + 地面反射,不是模糊。 |
| 第二个 UI 高光色(紫渐变 / 霓虹青 / 多色按钮) | 立刻读成创业公司模板 / AI slop。前景唯一饱和色是 `--eclat-flare #ff5b34`,**只活在这几处**:CTA 填充、一颗直播红点(`--eclat-flare` 本色,别另起 `#ff4d4d` 第二种红)、至多**一个**被强调的 hero 数字(`.eclat-hl`)、以及产品 UI mock 内描绘**产品自身**的强调色。除此之外的前景颜色全来自冷白聚光 / 暖橙边光。紫渐变、暗底霓虹辉光是公认 AI tell。 |
| 文字用 `background-clip:text` 渐变(除 `.eclat-bignum`) | 渐变文字是头号 slop tell。**唯一豁免**:满屏单数字"时刻"`.eclat-bignum` 的金属填充 —— 它是 keynote 招牌、且是非阅读装饰字,豁免按 class 锁死。标题 / 正文 / 任何要读的字一律纯色。 |
| 产品 hero 放扁平线框图标 / 占位方块 / 打钩 | 读成 wireframe 占位、廉价。`.eclat-stage` 的 SVG 抽象物必须有**真实光影**:rim 高光(冷白上缘 + 暖橙右缘)、地面反射、聚光锥、bloom。要更惊艳就换真渲染图(见下条)。 |
| 把别人的产品渲染图 / 金箔纹理直接拿来用 | 版权 + 品牌挪用。`.eclat-stage-media` 的 `<img>` 必须是**自有素材**(自己生成 / 买正版),且压成 webp/avif **KB 级**(单张 hero ~150–600KB,不是 MB 级)。没有自有图就用 SVG 抽象物兜底,门两种都放行。 |
| 把发布会堆成密集 above-the-fold 落地页 | 一屏塞满 = 通用 SaaS 默认,丢掉 keynote 调性。hero 与 "one more thing" 各占 `100vh`,一屏一个气口、一个产品时刻。密集叙事是 anthropic 的活,不是 eclat。 |
| 画布用纯黑 `#000` / 纯白文字 `#fff` | 纯黑杀景深、纯白刺眼。画布 `--eclat-ink #040406`(暖近黑),正文 `--eclat-bone #f6f3ec`(暖白)。 |
| zh span 内用半角 `,;:` | Noto CJK metrics 被 Latin 标点破坏。一律全角 `，；：`。**known-bugs 1.22** |
| BEM 双下划线 `eclat-hero__bg` | 仓库约定单连字符 `eclat-hero-bg`;verify 的类名正则不含 `_`,`__` 会报 undefined。修饰符才用 `--`(`eclat-btn--ghost`)。 |

## 克制地用(过量就成 tell)

| 节制 | 为什么 |
|---|---|
| hero h1 行数 | `clamp(64px,12.5vw,176px)`,**≤2–3 行**;4 行以上是灾难。撑不下改窄容器 / 小一档,别硬塞小字。 |
| eyebrow / 小标签 | 单个 mono eyebrow = 声音;每段都顶一个大写小标签 = AI 编辑脚手架味。整页 eyebrow 数 ≤ 段数/3。 |
| EN 文案的 em-dash `—` | 编辑性 em-dash 可以有,但**别每句都来** —— 滥用是 LLM 文案 tell。范围 / 区间用连字符不用 en-dash。 |
| "scroll to explore" 滚动提示 | hero 底一个克制的 `.eclat-cue` 够了;弹跳箭头 + "向下滑动探索" 一堆字是过度,用户知道怎么滚。 |
| 动效(若加) | keynote 动效是浮现 / 计数,不是弹跳 / 旋转。bounce / elastic 缓动读成玩具,不是产品。 |
| 文本容器写死 `height` / `position:absolute` 摆文字 / 负 margin 拉文字 | 文字重叠三大来源(2026-07-06 用户反馈跨美学反复出现)。固定高换 `min-height`;绝对定位只给角标且测过双语两种长度;负 margin 改父容器 gap。重叠 ≥40% 且 ≥80px² 现在是 **error** 直接 block。**known-bugs 1.25 两档升级** |
| 整页所有区块套同一个窄容器(或自定义 max-width < 640) | 1440 屏左右大片死空白,内容挤成一条(2026-07-06 用户反馈「左右留白太多,中间的字都挤在了一起」)。keynote 版面是全宽分屏,别把 spec / 参数区锁进一条窄列;区块宽度按内容定。`narrow-content-column` 兜底。**known-bugs 1.44** |
| 单个 `<p>` 写 15 行以上 / 连续 4+ 长段落中间无结构分隔 | 文字墙(2026-07-06 用户反馈「太多文字没有分段落…阅读不美观」)。单段 ≤5 行;≥3 并列要点改列表;成组论述拆成分屏卡片 / 参数块分组;概念关系直接上图。`prose-wall` 兜底。**known-bugs 1.45** |
| 为了和上文列宽对齐,把密图(≥20 label)压进窄列或 grid 单元格 | 对齐让位于可读性——图看不清等于没画(2026-07-06 用户反馈原话「没必要一定要和上面对齐」)。密图独占一屏或全宽区块,不塞半屏格子;塞不下就拆图。**known-bugs 1.29 / 1.44** |

## 一定要(身份成立的前提)

- **产品 hero 必有内容**:`.eclat-stage` 不能空 —— 发布会没有产品主角就不成立。
- **冷暖双光**:冷白聚光(`--eclat-cool`)打主光,暖橙边光(`--eclat-warm`)收一侧 —— 双色温是电影感的来源,单色光发平。
- **巨号数字当"时刻"**:关键规格(续航 / 速度 / 厚度)用满屏 `.eclat-bignum` 单独占一屏,而不是塞进密集参数表(参数表是 lectern 的活)。
- **双语对等**:每个 `.lang-en` 必有对应 `.lang-zh`;数字 + 单位双语各读一遍(`48h` + "小时" 别叠)。**known-bugs 1.41**
