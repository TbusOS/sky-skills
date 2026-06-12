# Glass Components — 组件清单

> 全部定义在 `assets/glass.css`。页面局部样式用**无前缀** class 写页内
> `<style>`(verify 只校验 `glass-*` 前缀是否在 CSS 有定义)。

## 材质(glass-material.md 详)

| class | 说明 |
|---|---|
| `.glass-panel` | Tier 1 主面板(自带折射环 ::before) |
| `.glass-card` | Tier 2 卡片(折射环 + hover 抬升 + 扫光 ::after) |
| `.glass-overlay` | Tier 3 浮层 |
| `.glass-aurora` / `.glass-blob--cyan/--violet/--pink/--indigo` | 光晕层 + 四色 blob(尺寸/定位 inline) |
| `.glass-page--calm` | body 修饰:blob ×0.55(dashboard / report) |

## 导航 / 页脚

`.glass-nav` + `.glass-nav-inner` + `.glass-nav-brand` + `.glass-nav-links` ·
`.glass-theme-toggle`(主题切换,公开页必备)· `.glass-lang-toggle`(双语切换,样式同款)·
`.glass-footer` + `.glass-footer-grid` + `.glass-footer-group` + `.glass-footer-legal`

## 文字 / 行动

`.glass-eyebrow`(mono kicker)· `.glass-lead` · `.glass-caption` ·
`.glass-link`(cyan 下划线 + →,`--no-arrow` 变体)·
`.glass-button`(cyan 填充 + 深字)+ `.glass-button--ghost`(玻璃描边)·
`.glass-badge`(cyan pill)+ `.glass-badge--ghost` ·
`.glass-hairline`(2px cyan 短线,brand 三件套之一)·
`.glass-quote` + `.glass-quote-cite`(大字 roman 直落光场)

## 数据

`.glass-stat-number`(72px tabular,配 `data-count-to`)· `.glass-stat-label` ·
`.glass-stat-delta--up/--down` · `.glass-table` · `.glass-code` / `code` / `kbd`

## SVG 主题类(diagram-craft.md 详)

`.glass-svg-ink/-2/-3` · `.glass-svg-node` / `.glass-svg-node-strong` ·
`.glass-svg-line` / `.glass-svg-grid` · `.glass-svg-accent` / `.glass-svg-accent-stroke`

## 表单

`.glass-input` / `.glass-select` / `.glass-textarea` / `.glass-label`

## 动画属性(motion.md 详)

`data-reveal` · `data-count-to`(+`-prefix`/`-suffix`)· `data-tilt` ·
`data-draw`(svg)· `data-parallax` · 液态光标 v2(自动注入 `.glass-water-head`/`.glass-water-trail`/`.glass-water-fx`/`.glass-water-bead`,`<html data-no-liquid>` 退出,`.glass-cursor-toggle` 按钮切水珠/系统)· 冻结:`#freeze` hash 或 `data-motion-freeze`

## 布局

`.glass-container`(1040)+ `--narrow`(720)/ `--wide`(1280)·
`.glass-section`(+ `--alt`)· `.glass-hero` · `.glass-sr-only`
