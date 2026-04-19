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
- **括号占位符**：`[hero image]` / `[icon]` / `[SVG]` / `[abstract illustration]` 这种字符串留在产物里 —— 永远不要
- **窄容器包 hero**：`.anth-container--narrow` (720px) 是**长文正文**用的，**不是** hero 容器；hero 用 `.anth-container` (960px) 或 `.anth-container--wide` (1200px)

---

## 📋 发布前 checklist（**MUST**，生成完整 HTML / demo / 模板时必做）

每次生成可运行的 HTML 页面后、向用户宣布"完成"前，必须过一遍下列 7 项：

- [ ] **占位符零容忍**：全文 `grep '\['` 无 `[hero image]` / `[placeholder]` / `[xxx.icon]` / `[SVG]` / `[abstract illustration]` 等。任何图像位都必须是**真 inline SVG**（见 `components.md` §28）或删除该元素。
- [ ] **容器正确**：Hero 段用 `.anth-container` (960) 或 `.anth-container--wide` (1200)；**绝不要**用 `.anth-container--narrow`（720 是给长文用的）。长文正文 / focused install 段才用 `--narrow`。见 `layout-patterns.md` 容器表。
- [ ] **居中生效**：Hero 的 `text-align: center` 来自 `.anth-hero`；如果在子元素加 `style="..."` 覆盖要确认未误伤。
- [ ] **浏览器渲染**：`python3 -m http.server 8000` 打开产物目测 hero / 节奏 / 图标 / 响应式 / 字体加载（Google Fonts 联网）。**不做这一步不算完成**。
- [ ] **CSS 路径**：`<link>` 相对路径从输出文件所在目录能解析到 `fonts.css` 与 `anthropic.css`，HTTP 200。
- [ ] **class 定义完整**：每个 `class="anth-*"` 在 `anthropic.css` 都能 grep 到定义（不发明新类；如需要新组件先加到 CSS）。
- [ ] **a11y**：说明性 SVG 用 `role="img"` + `aria-label="..."`，装饰性 SVG 用 `aria-hidden="true"`。

⚠️ 把任意 `[foo]` 留在 HTML 里就叫完成 —— demo 没用，开发者看了就退出。
