# Glass Typography

三族字体,全部 Google Fonts(`assets/fonts.css` 一次 @import):

- **Display**: Space Grotesk —— 几何、未来感,**没有 italic 字形**(glass 是零 italic skill,§J 自动满足)
- **Text**: Inter —— 中性正文,tabular-nums 完整(count-up 不抖)
- **Mono**: JetBrains Mono —— eyebrow、metadata、表头
- **中文**: Noto Sans SC(§H sans↔sans 配对;display 与正文都用它,**禁止**裸 PingFang)

## 字号表(binding —— canonical.md 同表)

| 元素 | 字体 | 字号 | 字重 | 备注 |
|---|---|---|---|---|
| Eyebrow / kicker(`.glass-eyebrow`) | JetBrains Mono | 12px | 600 | uppercase,ls 0.16em,色 `--glass-accent-ink` |
| h1 hero | Space Grotesk | 64–88px(默认 76) | 700 | ls -0.02em,lh 1.02 |
| h1 report/console 头(dashboard · data-report) | Space Grotesk | 40–60px | 700 | 工具页/报告页刻意低于 hero display 档 |
| h2 section | Space Grotesk | 40–52px(默认 48) | 600 | ls -0.015em |
| h3 panel/card title | Space Grotesk | 22–26px(数据密集页可至 22) | 600 | |
| Lead(`.glass-lead`) | Inter | 19–21px | 400 | lh 1.6,色 `--glass-ink-2` |
| Body | Inter | 15–16px | 400 | lh 1.65 |
| Stat number(`.glass-stat-number`) | Space Grotesk | 64–96px(默认 72) | 700 | tabular-nums,ls -0.03em |
| Stat label | Inter | 14px | 400 | 色 `--glass-ink-2` |
| Pull-quote(`.glass-quote`) | Space Grotesk | 36–44px(默认 40) | 500 | roman,**永不 italic** |
| 表格 / metadata | JetBrains Mono | 12–13px | 400–600 | 表头 uppercase ls 0.08em |
| Caption / figcaption | Inter | 12.5px | 400 | 色 `--glass-ink-3` |

## 规则

- 层级靠 **size / weight / spacing**,不靠 italic(没有)也不靠颜色堆砌。
- 文字色只用三档 ink token + accent-ink;第四种灰不存在。
- 中文侧:`html[data-lang="zh"]` 规则已内置于 glass.css(标题正文全 Noto Sans SC,`font-style:normal`,eyebrow 字距收到 0.06em);中文标点用全角(known-bugs 1.22,verify 强制)。CJK display 字号自动收一档(h1 76→64px,h2 48→42px,平板/手机断点同步收),h1/h2 全局 `text-wrap: balance`(Chromium 渐进增强)防止双字词被劈到两行。
- 数字大显示一律 `font-variant-numeric: tabular-nums`(count-up 动画期间不跳宽)。
