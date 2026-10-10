# 出图模型:提示词与择优记录

出图模型是本机 `codex exec -m gpt-6-astra`(Codex CLI 0.159.3),2026-10-11 出图,每题只出了一次。
**提示词必须走标准输入**:`codex exec -m gpt-6-astra -C "$PWD" --skip-git-repo-check -s workspace-write [-i 参考图.png] < 提示词.txt`(`-i` 会把写在后面的提示词也当成图片)。一张约 1 分钟。

## 1. 提示词骨架

| 段 | 写什么 | 为什么 |
|---|---|---|
| 尺寸 | `Use your image generation tool to create ONE 16:9 image (about 1536×864).` | 不写会出方图 |
| 纸 | 浅色:宣纸 `#f2ead8`、可见纤维;深色:磁青纸 `#14213a` 上的泥金 | 纸是定死的五样之一;深色版另画,不让它反相 |
| 内容 | 一两句话说画什么,再说**哪里必须空着**(诗、标题、图标、时间要放的地方) | 留白当画;后叠的代码层要有地方放 |
| 禁止 | `No seal, no calligraphy, no text, no letters, no signature, no watermark` | 出图模型写的汉字常错;印和字一律代码叠 |
| 分层 | 远景、中景、近景分开出,每张「只画这一层,其余是平整空白纸」,后出的附前面的当参考 | `scripts/layers.mjs` 才能抠成透明层做视差 |

## 2. 择优结论

| 题 | 选 | 代码版图例 |
|---|---|---|
| 《江雪》 | 叠用:位图打底,代码写诗、盖印、落雪 | `poem-jiangxue` |
| 《枫桥夜泊》 | 位图(要动时叠代码的钟声) | `poem-fengqiao` |
| 春:桃花 | 位图 | `season-spring` |
| 秋:枫与雁 | 位图(动图版用代码的雁阵) | `season-autumn` |
| 平远山水 · 远景层 | 位图三层抠透明做视差(首页) | `scroll-pingyuan` |
| 平远山水 · 中景层(附远景当参考) | 同上 | — |
| 平远山水 · 近景层(附远景、中景当参考) | 同上 | — |
| 竹林对决 | 位图(短视频开场用代码的「一剑」) | `bamboo-duel` |
| 桌面壁纸 16:10 | 位图(动态版叠代码的雾) | `wall-desktop` |
| 发布会泥金泼墨 | 叠用:位图打底,产品名用网页毛笔字 | `launch-splash` |
| 9:16 短剧封面 | 叠用:位图打底,片名和安全区用代码 | `drama-cover` |

位图赢在质感(山石、倒影、人物动态、颜色厚度),代码赢在:要逐字写出的诗、一字不能错的片名、会动的钟声和刀光、能换主题和语言。
所以艺术类多数题最好是**叠用**:位图打底,代码写字、盖印、加动画。并排对比见展示页 `compare.html`。

## 3. 提示词原文

### 《江雪》(`jiangxue.png`)

```
Use your image generation tool to create ONE 16:9 image (about 1536×864).
Traditional Chinese ink wash painting (shuimo) on plain warm rice paper (xuan paper, colour close to #f2ead8), visible soft paper fibre.
Scene: the poem 'River Snow' — a lone small boat on a vast frozen river, an old fisherman in a straw cloak and bamboo hat fishing alone; snow-covered mountains in pale ink on the left, every peak white with untouched paper. Pure ink only, no colour. Enormous empty paper: the right third of the picture must be completely empty paper (a vertical poem will be written there later). Quiet, cold, lonely.
No seal, no calligraphy, no text, no letters, no signature, no watermark, no border, no frame.
Save the PNG in the current directory as jiangxue.png and reply with only its path and pixel size.
```

### 《枫桥夜泊》(`fengqiao-night.png`)

```
Use your image generation tool to create ONE 16:9 image (about 1536×864).
Chinese painting in gold ink (nijin) on deep indigo blue paper (cijing paper, colour close to #14213a), like a sutra copied in gold; fine gold lines and soft gold washes, a few touches of muted vermilion.
Scene: 'Night Mooring by Maple Bridge' — an arched stone bridge, a small boat moored below with one glowing lantern, maple trees on the bank, a distant temple roof and pagoda in mist, a pale crescent moon, crows. Leave the upper-left quarter completely empty indigo paper.
No seal, no calligraphy, no text, no letters, no signature, no watermark, no border, no frame.
Save the PNG in the current directory as fengqiao-night.png and reply with only its path and pixel size.
```

### 春:桃花(`spring-peach.png`)

```
Use your image generation tool to create ONE 16:9 image (about 1536×864).
Traditional Chinese ink wash painting (shuimo) on plain warm rice paper (xuan paper, colour close to #f2ead8), visible soft paper fibre.
Scene: spring — peach blossom branches entering from the upper right in the boneless (mogu) style: petals laid in soft rouge and pink washes with no ink outline, young green leaves, a few falling petals, two swallows. Light, airy; the lower-left half is empty paper.
No seal, no calligraphy, no text, no letters, no signature, no watermark, no border, no frame.
Save the PNG in the current directory as spring-peach.png and reply with only its path and pixel size.
```

### 秋:枫与雁(`autumn-maple.png`)

```
Use your image generation tool to create ONE 16:9 image (about 1536×864).
Traditional Chinese ink wash painting (shuimo) on plain warm rice paper (xuan paper, colour close to #f2ead8), visible soft paper fibre.
Scene: autumn — light-ochre (qianjiang) landscape: pale ochre hills, a few maple trees with vermilion leaves on a rocky bank, a line of wild geese in a V across an empty sky, a small thatched hut. Mostly ink with light ochre and a little indigo. The upper half is empty sky.
No seal, no calligraphy, no text, no letters, no signature, no watermark, no border, no frame.
Save the PNG in the current directory as autumn-maple.png and reply with only its path and pixel size.
```

### 平远山水 · 远景层(`pingyuan-far.png`)

```
Use your image generation tool to create ONE 16:9 image (about 1536×864).
Traditional Chinese ink wash painting (shuimo) on plain warm rice paper (xuan paper, colour close to #f2ead8), visible soft paper fibre.
Paint ONLY the far layer of a level-distance (pingyuan) river landscape: two rows of very distant mountain ridges in pale diluted ink, darker along the ridge line, fading downward into mist. Nothing else. Leave the lower half and the whole sky completely empty, flat, evenly lit paper: no texture gradient, no vignette, no shadow.
No seal, no calligraphy, no text, no letters, no signature, no watermark, no border, no frame.
Save the PNG in the current directory as pingyuan-far.png and reply with only its path and pixel size.
```

### 平远山水 · 中景层(附远景当参考)(`pingyuan-mid.png`)

```
Use your image generation tool to create ONE 16:9 image (about 1536×864).
Traditional Chinese ink wash painting (shuimo) on plain warm rice paper (xuan paper, colour close to #f2ead8), visible soft paper fibre.
Paint ONLY the middle layer of the same level-distance river landscape (the attached image is the far layer — match its ink and paper): low hills with pine groves on the left and a wooded island on the right, in medium ink with texture strokes, sitting in the lower-middle band of the picture, their feet dissolving into mist. Nothing else. The sky and the bottom fifth are completely empty, evenly lit paper.
No seal, no calligraphy, no text, no letters, no signature, no watermark, no border, no frame.
Save the PNG in the current directory as pingyuan-mid.png and reply with only its path and pixel size.
```

### 平远山水 · 近景层(附远景、中景当参考)(`pingyuan-near.png`)

```
Use your image generation tool to create ONE 16:9 image (about 1536×864).
Traditional Chinese ink wash painting (shuimo) on plain warm rice paper (xuan paper, colour close to #f2ead8), visible soft paper fibre.
Paint ONLY the near layer of the same landscape (attached: far and middle layers — match ink and paper): dark rocks and two old pine trees at the lower left, a small open pavilion on the rocks, and a tiny boat with a fisherman at the lower right on blank water. Strong dark ink. Nothing else. Everything above the lower third is completely empty, evenly lit paper.
No seal, no calligraphy, no text, no letters, no signature, no watermark, no border, no frame.
Save the PNG in the current directory as pingyuan-near.png and reply with only its path and pixel size.
```

### 竹林对决(`bamboo-duel.png`)

```
Use your image generation tool to create ONE 16:9 image (about 1536×864).
Traditional Chinese ink wash painting (shuimo) on plain warm rice paper (xuan paper, colour close to #f2ead8), visible soft paper fibre.
Scene: a wuxia duel in a bamboo forest — two swordsmen as dark ink silhouettes facing each other in the middle distance, wide hats and flowing robes, one blade flashing as a long dry-brush streak; bamboo stalks in splashed wet ink, leaves cut and flying in the wind. High contrast burnt ink against white paper; dramatic but with a lot of empty paper around the figures.
No seal, no calligraphy, no text, no letters, no signature, no watermark, no border, no frame.
Save the PNG in the current directory as bamboo-duel.png and reply with only its path and pixel size.
```

### 桌面壁纸 16:10(`wall-desktop.png`)

```
Use your image generation tool to create ONE 16:10 image (about 1536×960).
Traditional Chinese ink wash painting (shuimo) on plain warm rice paper (xuan paper, colour close to #f2ead8), visible soft paper fibre.
Desktop wallpaper: blue-green (qinglv) landscape — mineral azurite and malachite mountains rising along the bottom and the right edge, golden-brown mist bands, a waterfall, a tiny pavilion. The upper-left two thirds stay calm empty paper with only faint distant ridges (desktop icons go there).
No seal, no calligraphy, no text, no letters, no signature, no watermark, no border, no frame.
Save the PNG in the current directory as wall-desktop.png and reply with only its path and pixel size.
```

### 发布会泥金泼墨(`launch-splash.png`)

```
Use your image generation tool to create ONE 16:9 image (about 1536×864).
Chinese painting in gold ink (nijin) on deep indigo blue paper (cijing paper, colour close to #14213a), like a sutra copied in gold; fine gold lines and soft gold washes, a few touches of muted vermilion.
A launch-stage backdrop: one huge splash of gold ink bursting from the lower left on deep indigo paper, with fine gold spatter and dry-brush streaks sweeping across; the centre and right half stay calm, nearly empty indigo (big title words will be placed there later).
No seal, no calligraphy, no text, no letters, no signature, no watermark, no border, no frame.
Save the PNG in the current directory as launch-splash.png and reply with only its path and pixel size.
```

### 9:16 短剧封面(`drama-cover.png`)

```
Use your image generation tool to create ONE 9:16 image (about 864×1536).
Traditional Chinese ink wash painting (shuimo) on plain warm rice paper (xuan paper, colour close to #f2ead8), visible soft paper fibre.
A vertical short-drama cover: a swordswoman in a long robe standing in rain, seen from three-quarters behind, holding a sheathed sword; rain as fine diagonal dry-brush lines; a city wall and a pagoda in pale ink behind her. Burnt ink with one touch of red on her sash. Keep the top 12% and the bottom 18% of the picture empty paper (title and buttons go there).
No seal, no calligraphy, no text, no letters, no signature, no watermark, no border, no frame.
Save the PNG in the current directory as drama-cover.png and reply with only its path and pixel size.
```
