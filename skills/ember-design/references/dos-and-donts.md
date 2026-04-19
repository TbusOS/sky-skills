# Ember Do / Don't

## ✅ Do

- 暖米白 `#fff2df` 底 + 深巧克力 `#312520` 文字
- 标题用 Fraunces 衬线（SOFT=50, opsz=144 软化）
- 正文用 Inter，17px / 1.6 舒适阅读
- CTA 用实心棕 `#492d22` 胶囊按钮
- 金色 `#c49464` 作点缀（链接下划线 / 引号 / 卡片边）
- pull-quote 左侧大号引号 + Fraunces italic
- 卡片用纯白 `#ffffff`（与米底拉开对比）
- Gold badge 或 brown badge 看场景用
- 分隔用 `.ember-divider--ornament`（· · · 金色三点）提编辑感
- 用 `var(--ember-*)` token，不写死 hex

## ❌ Don't

- 冷蓝 / 冷灰（破坏暖调）
- 霓虹 / 彩虹 / 紫色渐变
- 标题用无衬线（失去手工感）
- 正文用衬线（Inter 才是正文）
- 高饱和 / 电子感色彩
- 直角矩形无圆角（ember 偏柔和圆角）
- `transition: all`
- Dark mode（ember 只活在暖亮环境）
- 括号 `[placeholder]` 占位字符串留在产物里
- 容器 BEM 只用 modifier 不带 base：必须 `class="ember-container ember-container--narrow"`

---

## 📋 发布前 checklist（MUST — 可执行）

生成完整 HTML 页面后，必须跑下列两条命令，exit 非 0 就是没完成：

```bash
# 1) 结构验证
python3 skills/ember-design/scripts/verify.py <path/to/your.html>

# 2) 视觉验证
node skills/ember-design/scripts/screenshot.mjs <path/to/your.html> shot.png
# 亲眼看 shot.png 再宣布完成
```

verify.py 自动扫：
- 占位符字符串（`[hero]` / `[SVG]` / `[placeholder]`）
- doctype + viewport
- Hero 容器（用 `.ember-container` 或 `.ember-container--wide`，不得只写 `--narrow`）
- 未定义的 `ember-*` class
- `<svg>` 平衡
- BEM modifier-only container（`ember-container--wide` 等必须和 `ember-container` base 连用）
