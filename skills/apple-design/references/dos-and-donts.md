# Apple Do / Don't

> 这个文档既是美学指引，也是 **"这些坑我们已经踩过了"** 的防御清单。
> 每条 Don't 旁边都有一句"Why"——如果不懂 Why，就不要删掉它。

## ✅ Do

- 白 / 浅灰 / 黑三段交替叙事
- 产品摄影居中 + 大量留白
- 巨字号统计（120px）
- 文字链 + 下划线 + `›` 结尾
- SF Pro 全家族（Display / Text / Mono）
- 章节间 80–120px padding
- 毛玻璃 nav（`backdrop-filter: blur(20px)` + `--apple-bg-nav`）
- 圆角 12px 卡片
- 无衬线正文，Text 用于 <24px 场景
- 使用 `var(--duration-sm)` 等 token，不写死毫秒
- `.apple-link::after` 的 `›` 如不需要用 `.apple-link--no-arrow` 取消
- **Hero 段**用 `.apple-container--hero`（1280px），让 SoC / code-arch / multi-repo 这类信息密集框图有足够空间

## ❌ Don't — 每条都带 Why

| Don't | Why（过去踩过的坑） |
|---|---|
| 紫色 / 彩虹渐变 | AI slop 标志 |
| 饼图 / 3D 柱图 / 霓虹光效 | 非 Apple 语言 |
| Inter / Roboto 作标题字 | 破坏 SF Pro 统一感 |
| 反弹 / 弹簧 / rotation 入场 | Apple easing 是 `cubic-bezier(0.25, 1, 0.5, 1)` |
| `transition: all` | 性能差 + 视觉跳动。显式列属性 |
| 硬编码 `#FFFFFF` | 用 `var(--apple-bg)` 才能跟主题变 |
| 把 `[hero image]` / `[icon]` / `[photo]` 留在产物里 | 上线即暴露空白格子。必须放**真 inline SVG** |
| 只写 `.apple-container--hero` 不带 base | base 提供 `margin: 0 auto`；只写 modifier → 容器贴屏幕左边。**必须** `class="apple-container apple-container--hero"` |
| 窄容器（`.apple-container` 980px）包信息密集的 hero 框图 | 框图被压缩到 ~920px，内部 8–10px 字体渲染后 <9px 看不清。用 `.apple-container--hero` 1280px |
| hero 框图 figure `padding: var(--space-7)` | 再吃掉 96px 宽度，SVG 进一步变小。用 `var(--space-5) var(--space-6)` |
| SVG 里 `font-size="8"` 用在信息标签 | 实际渲染 <9px 是失读线。最小给 10，意图小字给 9.5 |
| 多列网格里一张非 hero 卡片夹在一堆 `grid-column: 1 / -1` 中间 | 独占左半边很难看。要么跟它 span 2，要么 SVG `max-width + margin: 0 auto` 居中 |
| Lineup 卡片塞一个 72×72 细线图标居中 | 像 wireframe。每张都做满版 illustration，传达 skill 内容 |
| CTA 文字色在深底上对比度 < 4.5 | 可读性 fail。深底用 `#ffffff`，别用 `var(--apple-bg)` 那样的 off-white |
| 在 nav 里的 button 不加更高特异性 | `.apple-nav a { color: var(--apple-text); opacity: 0.8 }` 会吃掉 `.apple-button` 的 white color，渲染成深字 + 0.8 透明在 blue 上对比度 ~3.58:1 fail AA（2026-04-28 apple/feature-deep canonical 实测踩过）。**必须** `.apple-nav a.apple-button { color:#ffffff; opacity:1 }`。apple.css 已含此规则（2026-04-28 升级），page 内不必重复 |

---

## 📋 发布前 checklist（**MUST** — 三道闸都要 exit 0）

```bash
# 1) 结构验证（placeholder / BEM / 未定义 class / SVG 平衡 / container base-modifier）
python3 skills/apple-design/scripts/verify.py <path/to/your.html>

# 2) 视觉渲染验证（Playwright + WCAG 对比度 + 框图尺寸 + 孤儿卡）
node skills/apple-design/scripts/visual-audit.mjs <path/to/your.html>

# 3) 全页截图，肉眼审核
node skills/apple-design/scripts/screenshot.mjs <path/to/your.html> shot.png
```

任何一条 exit 非 0 → **任务没完成**。visual-audit 会报：
- `[error]` contrast < 3 — 修文字或背景
- `[warn]` contrast 3–4.5 — brand-intentional 除外
- `[warn]` hero diagram rendered at only X px — 容器太窄
- `[warn]` hero diagram smallest text renders at Xpx — SVG font-size 太小
- `[warn]` orphan figure — grid 里孤单非 hero 卡，span 2 或配对

## 📐 Lineup card 质量底线

每张卡 `aspect-ratio: 1`，满版 illustration，一眼能看出这个 skill 是干什么的。参考 demo 里 6 张（dark chip tile / REC 蓝 / PDF↔MD 双纸 / PDF 叠层 / palette 四宫格 / 暖色几何）。

## 📊 Hero diagram 质量底线

1. 在 1440 视口渲染宽度 ≥ 900px（用 `.apple-container--hero` + `grid-column: 1 / -1`）
2. 最小 SVG 字体 ≥ 10 (viewBox 坐标)，渲染 ≥ 9px
3. 有 stage labels（`01 · INPUT · 02 · MATCHER · 03 · DECISION`）引导视线
4. 用 soft shadow（blur 4–8, dy 5–12, alpha 0.10–0.14）而非粗描边
5. 至少一个细节 texture（dotted grid / subtle gradient / radial glow）让它不像 ppt
