# atelier · typography

## 字体

| 角色 | 字体 | 为什么 |
|---|---|---|
| 显示 + UI | **Plus Jakarta Sans** | 印尼字体(Tokotype,为雅加达城市形象设计),而这套美学出自日惹。形状也对:几何骨架 + 人文末端 + 真等宽数字 |
| 数字 / ID / 时间戳 | JetBrains Mono | **只给记录 ID、时间戳、代码**,不给正文 |
| 中文 | Noto Sans SC | 必须在栈里,否则 CJK 落到系统默认,字重完全对不齐 |

栈:
```css
--font-display: "Plus Jakarta Sans", "Noto Sans SC", -apple-system, ...;
--font-body:    "Plus Jakarta Sans", "Noto Sans SC", -apple-system, ...;
--font-mono:    "JetBrains Mono", ui-monospace, Menlo, monospace;
```

**禁用字体**(会被串味闸拦):Fraunces · Instrument Serif · Lora · Poppins · Space Grotesk
—— 这五个分别是其他 skill 的显示字体。

## 字号表

| 角色 | 字号 | 字重 | 字距 |
|---|---|---|---|
| 页面标题 `.atl-topbar__title` | 34 | 700 | -0.028em |
| 记录标题 h1 | 31 | 700 | -0.024em |
| 主数字 `.atl-figure__value` | 52 | 800 | -0.035em |
| 卡标题 `.atl-card__title` | 18 | 700 | -0.02em |
| KPI 数字 `.atl-kpi__value` | 25 | 700 | -0.025em |
| 正文 | 15 | 400 | 0 |
| 卡内说明 | 13–13.5 | 400 | 0 |
| 表格 | 13.5 | 400 | 0 |
| 表头 / 字段标签 | 11 | 700 | 0.09–0.1em,大写 |
| 分组标签 | 10 | 700 | 0.16em,大写 |
| 图内文字(SVG) | ≥11 | 600+ | — |

**SVG 文字不得低于 11px 源尺寸**,且渲染缩放 ≥0.82 —— 低于 9px 渲染值会被闸拦。

## 中文

- 正文标点用**全角** `，；：`。半角紧贴汉字会破坏行节奏,verify.py 会拦(known-bugs §1.22)。
- 中英并排的双语页:`.lang-en` / `.lang-zh` 成对,`lang-toggle` 切换。
- 中文比英文短约 30%,同一个卡片双语切换时高度会跳。卡片不要写死高度。

## 禁

- ❌ 斜体。这套语言里没有斜体的位置。
- ❌ 字重低于 400 的正文。玻璃上的细字会被背景吃掉。
- ❌ 用大小之外的手段做层级(下划线、全大写正文、字距拉开的标题)。
