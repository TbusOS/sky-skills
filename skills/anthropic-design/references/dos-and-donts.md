# Anthropic Do / Don't

> 这个文档既是美学指引，也是 **"这些坑我们已经踩过了"** 的防御清单。
> 每条 Don't 旁边都有一句"Why"——如果不懂 Why，就不要删掉它。

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
| hero 框图 figure `padding: var(--space-7)` | 吞掉 SVG 宽度。用 `var(--space-6)` 即可 |
| SVG 里 `font-size="8"` 用在信息标签 | 渲染后 <9px 看不清。最小给 10，意图小字给 9.5 |
| 多列网格里一张非 hero 卡片夹在一堆 `grid-column: 1 / -1` 中间 | 孤儿卡。要么 span 2 并 `max-width + margin: 0 auto` 居中 SVG，要么配对 |
| Lineup 卡片塞一个 72×72 细线图标居中 | 像 wireframe。每张都做满版 illustration |

---

## 📋 发布前 checklist（**MUST** — 三道闸都要 exit 0）

```bash
# 1) 结构验证（placeholder / BEM / 未定义 class / SVG 平衡 / container base-modifier）
python3 skills/anthropic-design/scripts/verify.py <path/to/your.html>

# 2) 视觉渲染验证（Playwright + WCAG 对比度 + 框图尺寸 + 孤儿卡）
node skills/anthropic-design/scripts/visual-audit.mjs <path/to/your.html>

# 3) 全页截图，肉眼审核
node skills/anthropic-design/scripts/screenshot.mjs <path/to/your.html> shot.png
```

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
