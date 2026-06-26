# Canonical · eclat-design launch

> 什么让这成为一张好的 eclat 发布会落地页。生成新 eclat launch 页**前先读**。
> 完整设计决策见 `launch.html` 末尾的 `design-review:self-diff v1` 注释块。

---

## 5 个让它成立的决策

### 1. 满屏"时刻",不是密集落地页
hero 与 "one more thing" 各占 `100vh`,一屏一个气口。一屏塞满 = 通用 SaaS 默认,丢掉 keynote 调性。密集叙事是 anthropic 的活。

### 2. 哑光,不是玻璃
零 `backdrop-filter`、零 aurora。戏剧来自 `.eclat-hero-cool`(冷白聚光)+ `.eclat-hero-warm`(暖橙边光)+ `.eclat-hero-vig`(vignette)+ 地面反射。出现毛玻璃面板 = 和 glass 撞。

### 3. 单一 flare 高光
`--eclat-flare #ff5b34` 只给 CTA 填充 + 一颗直播红点。其它前景颜色全来自冷白/暖橙光。第二个 UI 高光色 = 创业模板味。

### 4. hybrid 产品 hero 槽
`.eclat-stage` 默认放有真实光影的 SVG 抽象产品(rim 高光 + 地面反射 + 聚光锥)。有真渲染图时换成 `<img class="eclat-stage-media" src="...">`(**自有素材**、压 KB 级)。两条路都过门。绝不放扁平图标/打钩占位。

### 5. 巨号金属数字是唯一豁免的文字渐变
`.eclat-bignum`(满屏单数字"时刻")用金属 `linear-gradient` 填充 —— keynote 招牌、非阅读装饰字,按 class 锁死豁免。**其它任何文字渐变都禁**(slop tell)。

---

## 何时用
产品发布会 / keynote / 新品揭示落地页。对外、戏剧、一个产品主角。
**不要**用于:会议室汇报(→ lectern)、玻璃展示(→ glass)、消费极简营销(→ apple)。
