# 出图模型:怎么出这套画风的插画

代码画不出的大场景、电影画面、壁纸,交给出图模型。本文件分两部分:
一是写法(任何出图工具通用),二是本 skill 七张图的原始记录(模型、日期、参考图、提示词原文、为什么选它)。

## 一、写法

### 命令(本机 Codex CLI)

```bash
mkdir -p ~/illo && cd ~/illo
codex exec -m gpt-6-astra -C "$PWD" --skip-git-repo-check -s workspace-write \
  -i 画风参考.png [-i 同一套里已定稿的图.png] < 提示词.txt
```

- **提示词必须走标准输入。** `-i` 能接多个文件,写在它后面的提示词会被当成又一张图片,
  codex 报 `No prompt provided via stdin` 什么都不画(2026-10-10 实测,出处:第一次调用的日志原文
  `Reading prompt from stdin... No prompt provided via stdin.`;改成 `< 提示词.txt` 后同一条命令出图成功)。
- 一张图 2–6 分钟。几张图写进一个脚本顺序跑,别并发。
- 出图结果不能按种子复现;要重做时用同样的提示词和参考图,结果相近,不会一模一样
  (出处:ai-doc `explain-src/autoresearch/illustrations/intro-night.md`「GPT 出图不能按种子复现」)。
  所以本 skill 的 7 张图逐张留了记录(本文件第二部分)。

### 提示词骨架

```
Attached image 1 is the STYLE REFERENCE (drawing technique only: soft graphite pencil lines
with slight texture, warm cream paper, sparse coloured-pencil fills, friendly rounded figures,
lots of empty paper). [Attached image 2 is an approved illustration from the SAME SERIES; keep
its characters and pencil style.] Do not copy any content or composition.

Use your image generation tool to create ONE <比例> illustration:
- <画面:谁、在哪、做什么。一句一件事>
- <要留给网页的地方:「一块平整、均匀亮的 … 矩形,上面什么都不画」>
- Keep the top band (about 15 %) as plain empty paper.
- Colour budget: cream paper, graphite lines, <颜色> only on <一样东西>, …
- Absolutely no text, letters, digits, logos, UI or watermark anywhere.
Save the PNG in the current directory as <名字>.png and reply with only its path and pixel size.
```

要点(出处:ai-doc `explain-src/autoresearch/illustrations/intro-night.md` 的「怎么选出来的」表,
以及本文件第二部分的 7 张图):

1. **画风靠参考图定,文字只描述手法。** 只写「铅笔风」出来的线干净但偏冷,像图标;附上参考图后铅笔质感才对。
2. **同一套里的第二张,附上第一张已定稿的图**,角色才长得一样(本 skill 的人和机器人跨了五张图)。
3. **颜色预算写死**:「蓝色只在窗户」「橙色只在屏幕」。不写的话模型会到处上色。
4. **网页要叠东西的地方,要求画成平整、均匀亮、空白的矩形**(白板、屏幕)。出图后量出它的像素范围(见下),网页按百分比把代码画的图放上去。
5. **图里不要任何字。** 模型写的字常常是错的,而且没法切换语言。
6. **夜间版另出一张**:附上浅色版当构图参考,要求「同样的构图、同样的物体位置和大小,只改光线和颜色;深藏青墨纸(约 #141a26),浅灰粉笔线」。不要把浅色图反相。
7. 电影画面要求 21:9 时实际拿到约 2.33:1(1916×821),底部 12% 留平整,放字幕。

### 量出叠加区域

```python
from PIL import Image; import numpy as np
im = np.asarray(Image.open('hero.png').convert('RGB')).astype(int)
cy, cx = 430, 1030                                   # 空白区域中间的一个点
flat = np.abs(im - im[cy, cx]).sum(axis=2) < 30      # 和中心颜色接近的像素
# 从中心沿行、沿列往外走到颜色变了为止,得到 left/right/top/bottom,再除以宽高得百分比
```

浅、深两张图都量一遍,差几个像素以内才能共用一组百分比(本 skill 首屏图:差不到 2px)。
要叠的图放在比量出的区域再往里收一点的地方,避开画面里伸进来的东西(比如机器人举起的笔)。

## 二、本 skill 的七张图

共同点:2026-10-10,Codex CLI 0.159.2,`codex exec -m gpt-6-astra`。画风参考图都是 ai-doc 的
`docs/assets/explain/autoresearch/intro-night.webp`(转 PNG)。成品转 WebP(质量 82)放在 `demos/graphite-design/media/`。
每张都只出了一次就用了,没有挑选轮次;下面「看过的地方」是验收时逐项核对的。

| 文件 | 尺寸 | 附图 | 验收时核对的 |
|---|---|---|---|
| `hero.webp` | 1672×941 | 画风参考 | 白板是空的、平整的;没有字;蓝只在毛衣、橙只在笔和天线球 |
| `hero-dark.webp` | 1672×941 | `hero` 成品 | 和浅色版逐个物体对位;板面位置差 < 2px;脸还是浅的 |
| `cinema-roof.webp` | 1916×821 | 画风参考 + `hero` | 同一对角色;只有夕阳一个光源;底部平整 |
| `cinema-server.webp` | 1916×821 | 画风参考 + `hero` | 只有手电筒一个光源;远处正好一盏红灯(网页要在它上面画圈) |
| `wall-desktop.webp` | 1672×941 | 画风参考 + `hero` | 上面 55% 是空的天空(放桌面图标) |
| `wall-phone.webp` | 941×1672 | 画风参考 + `hero` | 中间大片空(放时钟和通知);只有灯笼一处暖色 |
| `hero` 的白板区域 | — | — | x 677–1384、y 220–639(浅色);x 678–1382、y 219–638(深色) |

### 提示词原文

`hero`:

```
The attached image is a STYLE REFERENCE only (drawing technique: soft graphite pencil lines with slight texture, warm cream paper, sparse coloured-pencil fills, friendly rounded figures, lots of empty paper). Do not copy any of its content or composition.

Use your image generation tool to create ONE wide 16:9 illustration (1672x941 or similar):
- A bright small studio / classroom corner in the daytime. Centre-right: a large empty whiteboard on a wooden easel, facing the viewer almost straight on. The whiteboard surface is a flat, evenly lit, very light cream rectangle with NOTHING drawn on it (a web page will draw a diagram on top of it later). Keep its edges clean and its frame simple.
- In front of the whiteboard, on the right, a small round friendly robot (simple dome head, two dot eyes, a little antenna with an orange ball, light grey body) stands on tiptoe holding up an orange marker towards the board, as if about to draw.
- On the left, a young person sits on a stool with a mug of coffee, looking at the board with a curious, happy face; clothes in one soft blue.
- A small potted plant with green leaves on the floor; a few sheets of paper and pencils scattered on a low table.
- Keep the top band of the image (about 15 %) as plain empty paper.
- Colour budget: cream paper, graphite lines, orange only on the marker and antenna ball, blue only on the person's clothes, a little green on the plant, light wood tones for furniture.
- Absolutely no text, letters, digits, logos, UI or watermark anywhere — the whiteboard must stay blank.
Save the PNG in the current directory as hero-v1.png and reply with only its path and pixel size.
```

`hero-dark`(附 `hero` 成品):

```
The attached image is the light version of an illustration. Use your image generation tool to create its NIGHT / DARK-MODE version: the exact same drawing, same composition, same objects in the same positions and sizes (the person on the stool with the mug, the easel and board, the small robot holding up the marker, the plants, the shelf, the round table with papers and pencils, the window). Only the lighting and palette change:
- Evening, room lights off except one small warm desk lamp glow on the left. Background becomes a deep navy-ink paper (around #141a26) with the same subtle pencil texture.
- Lines become soft light-grey chalk / pencil lines.
- The board keeps exactly the same position and size; its surface becomes a flat, evenly dim, very dark slate-blue rectangle (like a blackboard, around #1d2533) with NOTHING drawn on it.
- Through the window: deep-blue evening sky with a few stars.
- The person keeps a light, friendly face; the sweater stays a soft blue; the robot is light grey with a touch of warm orange on the marker and antenna ball.
- Absolutely no text, letters, digits, logos, UI or watermark.
Save the PNG in the current directory as hero-dark-v1.png and reply with only its path and pixel size.
```

`cinema-roof`:

```
Attached image 1 is the STYLE REFERENCE (drawing technique only: soft graphite pencil lines, warm cream paper, sparse coloured-pencil fills, friendly rounded figures). Attached image 2 is an approved illustration from the SAME SERIES; keep its characters (the young woman with a hair bun in a blue sweater, the small round light-grey robot with an orange antenna ball) and its pencil style. Do not copy either composition.

Use your image generation tool to create ONE very wide cinematic illustration, 21:9 widescreen framing (for example 1792x768), like a still from an animated film:
- A wide establishing shot at dusk. The woman and the small robot sit side by side on the edge of a flat rooftop, seen from behind and slightly to the side, small in the frame (lower-left third), legs dangling.
- Below and beyond them, a quiet city drawn in pencil: low-rise roofs, a few water towers, rows of windows, some windows lit warm yellow-orange. Far away, soft hills.
- The sky takes the upper half: a big pale sunset gradient in coloured pencil (soft peach near the horizon fading to light blue), one or two long thin clouds, a thin crescent moon.
- One light source: the low sun behind the hills; long soft shadows. Atmospheric perspective: far things paler and lighter.
- Keep the lowest 12 % of the image calm and simple (plain rooftop surface), it will sit under subtitles.
- Colour budget: cream paper, graphite lines, warm orange/peach only in the sky and lit windows, blue only on the sweater and the upper sky.
- Absolutely no text, letters, digits, signs with writing, logos, UI or watermark anywhere.
Save the PNG in the current directory as cinema-roof-v1.png and reply with only its path and pixel size.
```

`cinema-server`:

```
Attached image 1 is the STYLE REFERENCE (drawing technique only: soft graphite pencil lines, sparse coloured-pencil fills, friendly rounded figures). Attached image 2 is an approved illustration from the SAME SERIES; keep its small round light-grey robot with an orange antenna ball and its pencil style. Do not copy either composition.

Use your image generation tool to create ONE very wide cinematic illustration, 21:9 widescreen framing (for example 1792x768), like a still from an animated film, in a DARK palette:
- Night. A long corridor between two rows of tall server racks, drawn in one-point perspective, vanishing point slightly right of centre. Paper is deep navy ink (around #141a26), lines are light-grey chalk/pencil.
- The small robot walks down the corridor away from us, mid-ground, holding a flashlight; the flashlight throws a soft cone of warm yellow light on the floor ahead.
- The racks have rows of tiny status lights: mostly soft green, one single rack far ahead has a red light (the thing the robot is going to check).
- One light source besides the tiny status lights: the flashlight cone. Everything else is dim, with soft pencil hatching for shadows.
- Keep the lowest 12 % calm (plain floor), it will sit under subtitles.
- Absolutely no text, letters, digits, labels, logos, UI or watermark anywhere.
Save the PNG in the current directory as cinema-server-v1.png and reply with only its path and pixel size.
```

`wall-desktop`:

```
Attached image 1 is the STYLE REFERENCE (drawing technique only: soft graphite pencil lines, warm cream paper, sparse coloured-pencil fills, friendly rounded figures, lots of empty paper). Attached image 2 is an approved illustration from the SAME SERIES; keep its characters (the young woman with a hair bun in a blue sweater, the small round light-grey robot with an orange antenna ball). Do not copy either composition.

Use your image generation tool to create ONE 16:9 desktop wallpaper illustration (for example 1920x1080):
- A calm wide landscape: gentle rolling hills in light green coloured pencil across the lower third, a single small tree on the right hill, a winding path.
- On the left hill, small in the frame, the woman and the robot fly a kite together; the kite (a simple diamond, orange) is high in the sky at the upper right, its string a long thin pencil line.
- The whole upper 55 % is open sky: warm cream paper with only a very faint wash of light blue and two or three small soft clouds. This space must stay calm and empty (desktop icons and windows will sit there).
- Colour budget: cream paper, graphite lines, light green hills, orange only on the kite, blue only on the sweater and faint sky.
- Absolutely no text, letters, digits, logos, UI or watermark anywhere.
Save the PNG in the current directory as wall-desk-v1.png and reply with only its path and pixel size.
```

`wall-phone`:

```
Attached image 1 is the STYLE REFERENCE (drawing technique only: soft graphite pencil lines, sparse coloured-pencil fills, friendly rounded figures). Attached image 2 is an approved illustration from the SAME SERIES; keep its small round light-grey robot with an orange antenna ball. Do not copy either composition.

Use your image generation tool to create ONE tall 9:16 phone wallpaper illustration (for example 1080x1920) in a DARK palette:
- Night. Deep navy-ink paper (around #141a26), soft light-grey chalk/pencil lines.
- At the bottom fifth: a small grassy hill drawn in dark green pencil; the small robot sits on top of it, seen from behind, looking up. Next to it a small glowing paper lantern in warm orange.
- The upper four fifths are night sky: scattered small pencil stars, a thin crescent moon near the top right, and a very faint band of the milky way drawn with light pencil stippling. The middle of the sky stays calm and mostly empty (the phone clock and notifications sit there).
- Absolutely no text, letters, digits, logos, UI or watermark anywhere.
Save the PNG in the current directory as wall-phone-v1.png and reply with only its path and pixel size.
```

要求 1920×1080 时实际拿到 1672×941,壁纸页按实际尺寸标,没有放大。
