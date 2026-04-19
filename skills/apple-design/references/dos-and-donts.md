# Apple Do / Don't

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

## ❌ Don't

- 紫色 / 彩虹渐变（AI slop 标志）
- 饼图 / 3D 柱图 / 霓虹光效
- 大量彩色实心按钮堆叠（Apple 只在 Buy/Add to Bag 用）
- Inter / Roboto 作标题字
- 全页同一色无节奏
- 反弹 / 弹簧 / rotation 入场
- 斜切蒙版 / 不规则裁剪
- 紧贴屏幕边缘的内容（min padding 24px）
- 任何衬线字体
- `transition: all`（显式列属性）
- 硬编码 `#FFFFFF`（用 `var(--apple-bg)`）、硬编码 `240ms`（用 `var(--duration-sm)`）
- 数字分页（用 "View All ›"）
- **括号占位符**：`[hero image]` / `[icon]` / `[photo]` 这种字符串留在产物里 —— 永远不要
- **窄容器包 hero**：hero 必须用 `.apple-container--hero` (1280px) 或 `.apple-container--wide` (1068px)，不要用 `.apple-container` (980px) 或更窄

---

## 📋 发布前 checklist（**MUST**，生成完整 HTML / demo / 模板时必做）

每次生成可运行的 HTML 页面后、向用户宣布"完成"前，必须过一遍下列 7 项：

- [ ] **占位符零容忍**：全文 `grep '\['` 无 `[hero image]` / `[placeholder]` / `[xxx.icon]` 等。任何图像位都必须是**真 inline SVG**（见 `components.md` §28）或删除该元素。
- [ ] **容器正确**：Hero 段用 `.apple-container--hero`；lineup / 对比 grid 用 `.apple-container--wide`；默认正文用 `.apple-container`；文档三栏直接用 `max-width: 1280px; grid-template-columns: 240px 1fr 240px`。见 `layout-patterns.md` 容器表。
- [ ] **居中生效**：Hero 的 `text-align: center` 来自 `.apple-hero`；如果在子元素加 `style="..."` 覆盖要确认未误伤。
- [ ] **浏览器渲染**：`python3 -m http.server 8000` 打开产物目测 hero / 节奏 / 图标 / 响应式。**不做这一步不算完成**。
- [ ] **CSS 路径**：`<link>` 相对路径从输出文件所在目录能解析到 `apple.css`，HTTP 200。
- [ ] **class 定义完整**：每个 `class="apple-*"` 在 `apple.css` 都能 grep 到定义（不发明新类；如需要新组件先加到 CSS）。
- [ ] **a11y**：说明性 SVG 用 `role="img"` + `aria-label="..."`，装饰性 SVG 用 `aria-hidden="true"`。

⚠️ 把任意 `[foo]` 留在 HTML 里就叫完成 —— demo 没用，开发者看了就退出。
