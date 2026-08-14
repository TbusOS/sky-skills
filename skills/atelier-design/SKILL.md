---
name: atelier-design
description: 暖渐变壁纸 + 整窗磨砂玻璃的**产品应用界面**生成(不是落地页)。桃/珊瑚 mesh 底 + 一整块玻璃承载 app 外壳 + 珊瑚→玫红渐变圆球图标 + 灰轨道渐变圆头柱状图 + 每屏一张近黑锚点卡。产出可点、可切、可排序的真界面:侧栏路由 / 标签页 / 手风琴 / 可展开结果行 / 表格排序 / 开关 / KPI 数字滚动。TRIGGER 当用户提到 atelier 风格 / 仪表盘 / dashboard / 后台 / 控制台 / admin / SaaS 界面 / 应用界面 / app UI / 产品界面 / 预订流 / 搜索结果页 / 设置页 / 登录页 / 暖色玻璃 / 桃色渐变 / 珊瑚渐变 / Dribbble 风仪表盘 时使用。DO NOT TRIGGER:深藏青 aurora 玻璃展示页(用 glass)、营销落地页 / 定价页 / 文档站(用 anthropic / apple / sage / ember)、发布会(用 eclat)、商务汇报 deck(用 lectern)。
last-verified: 2026-08-14
---

# Atelier Design — 应用界面风格

生成暖色渐变壁纸上浮着一整块磨砂玻璃的**产品界面**:侧栏、KPI 行、图表、筛选面板、记录表、预订流、设置表单、登录页。这是本仓 8 个设计 skill 里**唯一画应用界面**的一个——其余 7 个画的都是页面(落地 / 定价 / 文档 / deck / 发布会)。

Generates warm-gradient product UI: one frosted application shell floating on a peach-and-rose wallpaper, with gradient orb icons, round-cap bar charts over neutral tracks, and exactly one near-black anchor card per screen. The only skill in this repo that draws applications rather than documents — and the only one whose JavaScript is half the deliverable.

## §1 使用方式

1. 引入 `assets/fonts.css` + `assets/atelier.css` + `assets/atelier.js`(`<script src>` 放 `</body>` 前)。
2. 页面骨架:`<html data-theme="light">` → `.atl-wall`(壁纸层,必须有)→ `.atl-page` → `.atl-app`(整块玻璃)→ `.atl-rail` + `.atl-main`。
   无侧栏的屏幕用 `.atl-app--full`。
3. 组件用 `atl-` 前缀;页面局部样式用**无前缀** class 写在页内 `<style>`(verify.py 只校验 `atl-*` 是否定义于 CSS)。
4. 交互全部属性驱动,页面不写一行 atelier JS:
   `data-route` / `data-tab` / `data-seg-group` / `data-accordion` / `data-expand` /
   `data-switch` / `data-sort` / `data-count-to` / `data-grow` / `data-reveal` /
   `data-lang-toggle` / `data-theme-toggle`。
5. 先读 `references/atelier-material.md`(材质配方)和 `references/dos-and-donts.md`(品位边界),再复制 canonical 起步。

## §2 触发关键词

atelier 风格 / 仪表盘 / dashboard / 控制台 / 后台 / admin panel / SaaS 界面 / 应用界面 / app UI / 产品界面 / 预订流 / booking / 搜索结果 / 设置页 / settings / 登录页 / sign in / 暖色玻璃 / 桃色渐变 / 珊瑚渐变 / Dribbble 风仪表盘

## §3 不要用于

| 场景 | 用哪个 |
|---|---|
| 深藏青 aurora 玻璃的**展示页** | `glass`(同为玻璃,但暗底 + cyan + 光晕;atelier 是亮底暖色 + 应用界面) |
| 营销落地页 / 定价页 / 长文档站 | `anthropic` · `apple` · `sage` · `ember` |
| 产品发布会 / keynote | `eclat` |
| 会议室商务汇报 deck | `lectern` |
| 打印物 / PDF 导出 | 任何非玻璃 skill——`backdrop-filter` 不进打印管线 |
| 政府 / 法律 / 医疗等严肃可信内容 | `lectern` 或 `apple`(渐变圆球读作"消费级 SaaS") |

## §4 阅读顺序

1. `references/atelier-material.md` — 壁纸 + 三层玻璃 + 渐变圆球(skill 的物理学)
2. `references/dos-and-donts.md` — 品位边界(暖玻璃 ≠ 通用后台模板的那条线)
3. `references/design-tokens.md` — 双主题 token 全表
4. `references/app-shell.md` — 外壳 / 侧栏 / 路由 / 面板(应用界面独有,其余 7 个 skill 没有)
5. `references/components.md` — 组件清单 + 每个组件的硬规矩
6. `references/data-display.md` — 图表配方(一条渐变 + 中性轨道)
7. `references/typography.md` — Plus Jakarta Sans 字号表 + 中文字体栈
8. `references/motion.md` — 交互契约 + 冻结契约(截图检查依赖)
9. `references/diagram-craft.md` — SVG 图示工艺
10. `references/canonical/` — 5 个页型的 canonical html + md 成对读

## §5 发布前检查(MUST)

```bash
bin/design-review --skill=atelier <你的页面>.html            # 四闸
bin/design-review --skill=atelier --pixel <你的页面>.html    # 再加像素回归
```

四闸必须全绿:`verify.py`(结构)· `visual-audit.mjs`(渲染 + 品牌 + 串味)·
`axe-audit.mjs`(**可达性 · axe-core**)· 截图。
可选第五闸 `pixel-gate.mjs` 比对已提交的像素基线 —— 它是唯一能抓住"没有任何规则描述过"
的改动的闸(卡片位移、颜色漂移、字体回落)。
**截图必须人眼看过**——本 skill 建成当天,机器闸放过了三个只有人眼能发现的问题:
KPI 标签和数字挤成一行、时间轴圆点被压成竖条、暗面板上的 `.atl-muted` 几乎不可见。
**闸是必要条件,不是充分条件。**

atelier 目前 **7/7 页 axe 零 violation**(5 canonical + 2 demo),这是验收线。

## §6 三条不可让步的规矩

1. **渐变永远不承载文字。** 白字压在珊瑚端 `#F5854F` 上只有 **2.5:1**,压在玫红端只有 3.8:1。
   实心按钮用 `--atl-accent-ink`(`#B83370`,白字 5.6:1)或默认的近黑 `.atl-btn`。
   渐变只出现在:圆球、柱子、进度条、品牌标记。
2. **玻璃是外壳,不透明度是数据。** 外壳 0.32 → 数据卡 0.80 → 表格卡 0.94。
   任何承载数字的表面都往不透明走。数字压在会动的渐变上,读者要读两遍。
3. **每屏只有一张暗卡。** 亮底页面上暗卡是视线落点;两张就没有落点了。
   暗色主题下它翻成奶油色——这一笔是"一张卡打断明暗节奏",不是"一张卡是黑的"。

## §7 数据纪律(与其他 skill 不同的地方)

应用界面天生要显示数据,而 canonical 页**不能显示查不到来源的数据**。本 skill 的解法:

- 终值写在 markup 里,`data-count-to` / `data-grow` 只做动画。JS 永远不发明数字。
- 分段控件、筛选框、滑块**是装饰**:切"近一年"不会改写数字。切换即改数 = 编数据。
- 反常的数字必须当场解释(6 月 31% 是因为评估周期错过校准窗口;2 次中转更贵是因为要分开出票)。
  一个不解释自己的异常值,会被读成 bug。

## §8 来源

风格重建自 [Ghani Pradita](https://dribbble.com/ghanipradita)(印尼日惹 · Paperpillar)的仪表盘作品。
**没有照抄任何一稿**:配色、排版、组件、文案、数据全部重写,只借了这套语言的语法——
暖 mesh 壁纸 / 整窗磨砂 / 渐变圆球 / 灰轨道圆头柱 / 一张暗卡。
他的底子是渐变图标集与 3D 插画,这解释了为什么图标是**实心渐变球**而不是线性图标——
线性图标配细圆环是通用后台模板的标志,复刻错这一笔,出来的就是"另一个 admin 模板"。
