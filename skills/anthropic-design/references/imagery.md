# Anthropic Imagery

## 核心素材：抽象 SVG 矢量插画

参考 anthropic.com engineering 博客卡片：圆 / 圆角矩形 / 柔和曲线叠置，几何抽象，无具象内容。**矢量优先；位图仅在客户头像 / 真实截图时使用。**

## 配色（严格遵守）

仅允许下列五色，禁用其它色相：

| Token | Hex | 用途 |
|---|---|---|
| `--anth-orange` | `#d97757` | 主形 / 焦点 |
| `--anth-blue` | `#6a9bcc` | 次形 |
| `--anth-green` | `#788c5d` | 第三形 |
| `--anth-mid-gray` | `#b0aea5` | 辅助形 / 背景纹理 |
| `--anth-bg-subtle` | `#f0ede3` | 插画底（如填底） |

不透明度允许 0.7–1.0；禁用渐变。

## 画幅

- 卡片插图：500 × 500（viewBox `0 0 500 500`）
- Hero / 文章首图：1200 × 1200 或 1200 × 800

## SVG 模板示例

```html
<svg viewBox="0 0 500 500" width="100%" role="img" aria-label="Abstract composition">
  <circle cx="240" cy="240" r="140" fill="#d97757" opacity="0.9"/>
  <circle cx="340" cy="180" r="80"  fill="#6a9bcc" opacity="0.9"/>
  <rect   x="120" y="280" width="140" height="140" rx="24" fill="#788c5d" opacity="0.85"/>
  <path   d="M60 60 Q 120 120 180 60" stroke="#b0aea5" stroke-width="6" fill="none"/>
</svg>
```

## 客户引用头像

可以用真实头像（公司 logo + 作者头像组合），但优先：
- 加 `filter: grayscale(1)` 处理（与 logo wall 一致）
- 圆形裁剪 32–40px
- 旁置公司 logo（高度 20px，灰度）

```html
<cite class="anth-quote-cite">
  <img src="avatars/simon.jpg" alt="" style="width:32px; height:32px; border-radius:50%; filter:grayscale(1);" />
  <img src="logos/notion.svg" alt="Notion" />
  <span>Simon Last · Co-founder, Notion</span>
</cite>
```

## Logo wall（客户墙）

见 `components.md` §18。统一灰度，hover 还原原色。

## 反例

- 真人产品摄影 / 高质感产品渲染图
- 彩虹渐变 / 紫粉霓虹
- 低质 stock 照片
- 5 色以外的色相（如红、紫、青）
- 渐变填充（仅纯色 + opacity）
- 立体阴影 / 拟物风格
- AI 生成的写实人脸
