# Anthropic Do / Don't

## Do

- 暖米白 `#faf9f5` 底 + Lora 衬线正文
- Poppins 标题（几何感）
- 橙色 `#d97757` 实心胶囊按钮做主 CTA
- 编辑式卡片网格 + 长文 720px 单栏
- 客户引用用 Lora italic + 橙色左边 + 公司 logo
- 低饱和图表（soft blue / olive green / mid gray）
- 抽象 SVG 矢量插画（500×500 / 1200×1200）
- 链接用 `→` 结尾（不是 `›`）
- 橙胶囊"加载更多"代替数字分页
- 单一缓动 `cubic-bezier(0.25,1,0.5,1)` + 三档时长（240/400/700ms）
- 用 `var(--anth-*)` token，不写硬编码 hex
- Lora italic 在引用 / 强调处自然使用

## Don't

- 白色主背景（白色留给 `.anth-card`）
- 标题用衬线 / 正文用无衬线（角色反了）
- 高饱和三原色图表
- 真人产品摄影（抽象 SVG 插画优先）
- Apple 式裸文字链做主 CTA（Anthropic 主用填色橙胶囊）
- `›` 箭头（Anthropic 用 `→`）
- 紫色渐变 / 彩虹渐变 / 霓虹色
- `transition: all`（用显式属性列表）
- 硬编码 hex（用 `var(--anth-*)` token）
- 数字分页（用橙胶囊"加载更多"）
- 超过 720px 的 Lora 正文列
- 全程 italic（italic 仅用于引用、强调）
- 反弹 / 弹簧 / rotate 入场动画
- 5 色以外的插画色（仅 orange / blue / green / mid-gray / bg-subtle）
- 立体 / 拟物 / 阴影过重的卡片（`--shadow-card` 已足够）
