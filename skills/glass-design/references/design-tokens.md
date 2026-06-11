# Glass Design Tokens

> `assets/glass.css` Section A 的索引。组件**只**引用语义 token;
> dark(默认 / 品牌正典)与 light(iOS-frost)各一套同名 token,
> `html[data-theme]` 切换,页面零写死色值。

## 官方五色

| 角色 | 名称 | Hex | 用途约束 |
|---|---|---|---|
| 主 accent(signature) | Aurora Cyan | `#22D3EE` | **唯一可上前景的彩色**:eyebrow、链接、按钮填充、hairline、SVG glow 节点。文字态在 light 模式自动降为 `#0E7490`(走 `--glass-accent-ink`) |
| aurora-2 | Veil Violet | `#A78BFA` | 只活在背景 blob 与折射环渐变里,**永不**做文字 / 图标 / 按钮色 |
| aurora-3 | Plasma Pink | `#F472B6` | 同上,且每页 ≤1 个 blob |
| aurora-4 | Depth Indigo | `#4F46E5` | blob + 图表第二序列色 |
| 中性对 | Ink / Navy | dark 底 `#0B1020` · dark 墨 `#F4F7FF` / light 底 `#F2F5FA` · light 墨 `#0D1220` | 底色是深藏青**不是纯黑** —— 纯黑下 blur 发闷,藏青给光晕反射感 |

语义辅助(小剂量,dashboard/data-report):`--glass-up`(涨)/ `--glass-down`(跌)。

## 语义 token 速查

| token | dark | light |
|---|---|---|
| `--glass-bg` / `--glass-bg-2` | `#0B1020` / `#0E1530` | `#F2F5FA` / `#E9EEF6` |
| `--glass-ink` / `-2` / `-3` | `#F4F7FF` / rgba(231,238,255,.74) / .55 | `#0D1220` / rgba(13,18,32,.72) / .55 |
| `--glass-accent` | `#22D3EE` | `#22D3EE`(填充恒定) |
| `--glass-accent-ink` | `#22D3EE` | `#0E7490`(白底 AA) |
| `--glass-button-ink` | `#062A33` | 同 |
| `--glass-panel-bg` / `-border` | rgba(255,255,255,.08) / .17 | rgba(255,255,255,.62) / rgba(13,18,32,.10) |
| `--glass-card-bg` / `-border` | rgba(255,255,255,.07) / .13 | rgba(255,255,255,.55) / rgba(13,18,32,.08) |
| `--glass-overlay-bg` | rgba(13,18,32,.62) | rgba(248,250,253,.80) |
| `--glass-line` | rgba(255,255,255,.08) | rgba(13,18,32,.08) |
| `--glass-highlight` | rgba(255,255,255,.26) | rgba(255,255,255,.85) |
| `--glass-blob-alpha` | 1 | 0.6 |

字体族:`--font-display`(Space Grotesk)/ `--font-body`(Inter)/ `--font-mono`(JetBrains Mono)。
间距 `--space-1..10`(4 → 120px)、圆角 `--radius-sm/md/lg/pill`(10/18/24/pill)、
缓动 `--ease-glass: cubic-bezier(0.22,1,0.36,1)`、时长 `--duration-sm/md/lg`(240/640/1200ms)
—— 与四个旧 skill 同 scale 体系。

## SVG 主题类

双主题图示必须通过这些类上色(写死白 fill 在 light 模式隐形):

`.glass-svg-ink` / `.glass-svg-ink-2` / `.glass-svg-ink-3`(文字)·
`.glass-svg-node` / `.glass-svg-node-strong`(节点)·
`.glass-svg-line` / `.glass-svg-grid`(线)·
`.glass-svg-accent` / `.glass-svg-accent-stroke`(cyan 形状,可写死 —— 主题恒定)·
`.glass-svg-accent-ink`(cyan 文字,必须用这个)· `.glass-svg-ref-ink`(indigo 文字)·
`.glass-svg-node--cyan` / `--indigo`(tint 节点,类别编码)· `.glass-svg-up` / `.glass-svg-down`(涨跌)。
