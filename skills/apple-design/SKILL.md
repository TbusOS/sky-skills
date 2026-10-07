---
name: apple-design
description: "apple.com 风格的讲解页 / 产品页 / 技术介绍页 HTML。定死的是它的配色和克制:白 #FFFFFF 与浅灰 #F5F5F7 交替、正文 #1D1D1F、次要字 #6E6E73、蓝 #0066CC 是全页唯一的强调色,层级靠灰阶和留白;版式、字体、动画由模型按内容自由发挥(推荐系统无衬线,Apple 设备上就是 SF Pro)。配图例库(templates/diagrams/ 33 张现成 SVG + diagram-craft.md + 图集页)和「让人看懂」三种做法的范例 demos/apple-design/explainer.html(首屏动画演示机制 · 证据模块 · 读者能点选的解释器)。检查只查客观缺陷:design-review/scripts/check_objective.mjs。TRIGGER: 'apple 风格' / 'apple style' / '苹果官网风格' / 'like apple.com' / SF Pro / apple 极简 / 产品叙事 / 巨字号统计. DO NOT TRIGGER: iOS / macOS 原生 App UI、深色玻璃展示(glass-design)、anthropic 配色(anthropic-design)。"
last-verified: 2026-10-07
---

# Apple 风格的讲解页

配色和克制照 apple,其余自由。目标只有一个:读者看完能懂这件事。

**2026-10-07 改版(user 定,和 anthropic-design 同一思路)**:原来有 10 行写着「必须」——
图密度配额、动笔前先跑 `dr-cli --plan`、交付前嵌 self-diff、critic ≥ 75、canonical 当评分标准、hero 必须用某个容器类。

现在只定死配色和「蓝色只用一处」的克制,其余改成指引和案例。`references/` 里写的「MUST」当经验看;和本文件冲突时以本文件为准。

## 1. 定死的:配色和克制

| 用途 | 颜色 |
|---|---|
| 页面底 · 交替段落底 · 黑色章节 | `#FFFFFF` · `#F5F5F7` · `#000000` |
| 正文字 · 次要字 · 分隔线 | `#1D1D1F` · `#6E6E73` · `#D2D2D7` |
| 唯一的强调色 | 蓝 `#0066CC`:链接、主按钮、图里的焦点 |
| 状态(只在需要表达状态时用) | 绿 `#1F7A37` · 橙 `#B25000` · 红 `#D70015`(白底上 5.39 / 5.20 / 5.38,能当小字) |
| 深色框(终端 / 代码) | 底 `#1D1D1F` · 标题条 `#2C2C2E` · 字 `#F5F5F7` · 次要字 `#98989D` |

- **蓝色只用一处**:强调靠位置、字号和留白,不靠多加颜色。层级、分类用灰阶区分。
- 文字用色要过 WCAG AA。下面的数是 2026-10-07 按 WCAG 相对亮度公式算的:
  - 次要字 `#6E6E73` 在白底 5.07、在 `#F5F5F7` 4.66,放到更深的灰块(代码块、选中态)上就不够了,那里用 `#636366`(≥ 4.85)。
  - 蓝底按钮上用白字(5.57);深字在 `#0066CC` 上只有 3.0。
  - 深色框里的次要字用 `#98989D`(在 `#2C2C2E` 上 4.85),`#8E8E93` 只有 4.27。
- `assets/apple.css`(`apple-*` 组件)和 `assets/fonts.css` 可以用,不强制。

## 2. 让人看懂的三种做法(案例,不是规则)

范例:`demos/apple-design/explainer.html` —— whetstone 介绍站首页换成 apple 风格(白 / 浅灰交替、蓝色单一强调、系统无衬线粗标题)。

| 做法 | 为什么管用 | 范例里看哪 |
|---|---|---|
| **首屏用动画演示机制** | 读者第一眼看到的是这个东西怎么动 | 首屏右侧:经验被分进 L1–L4 四层 |
| **证据模块** | 页面越好看,内容越容易被当真;证据让读者能自己核对 | `#evidence`:命令输出终端、检查计数条、REFUSED 票据、局限一节 |
| **读者能点选的解释器** | 自己点一下,比读三段文字快 | `#evidence` 的置信度表、`#layers` 点选岩层、`#flow` 流程步进 |

- 示意图要注明是示意:范例 `#why` 的曲线图下面写着 "illustration, not measured data"。
- 巨字号统计是 apple 的老办法,适合「一个数字说明一件事」;数字要有出处。
- 动画演示机制里的某一步,只是装饰的能删就删;打开「减少动态效果」时内容必须完整。

## 3. 图例库

先按内容选图型。下表是起点,结构按实际内容改,可以混搭,也可以自创:

| 内容 | 可以用 | 内容 | 可以用 |
|---|---|---|---|
| 数字对比 / 统计 | **巨字号统计**（apple 的视觉主角，计入视觉元素） | ≥3 步流程 / 启动链 / 数据流 | 流程图或时序图 |
| 系统结构 / 分层 / 依赖 | 架构图 | 时间演进 / 版本 / 里程碑 | 时间线 |
| 产品 / UI 描述 | 设备线稿 mock（diagram-craft §8 + `templates/diagrams/device-mock.svg`） | 连续纯文字 > 2 屏 | ≥ 1 个视觉元素 |
| 函数控制流 / 寄存器位域 | 函数流程图 / 位域图 | SoC 结构 / 信号时序 / 编译链 / 调度 | 对应内核图型（diagram-craft §12） |
| 排查一个具体故障 / 论证「改这里会影响那里」 | 调用链定位图（§17.5，每层挂 `file:line`、关键行贴原文；**不手画**，`gen_call_site_figure.py --style=apple` 从源文本生成） | 两条链共用了一个东西但彼此不调用 | 同上，并排画 · 蓝只给那道耦合 |

- `templates/diagrams/`:33 张现成 SVG(含 `device-mock.svg` 设备线稿底版),图集 `demos/apple-design/diagrams.html`(每张带 Copy SVG)。
- `references/diagram-craft.md`:画图手法(灰阶为本、蓝色一处、柔影白卡、先定尺寸再画)。
- 调用链定位图不手画:`python3 ~/.claude/skills/design-review/scripts/gen_call_site_figure.py <源文本> --style=apple`。
- 手机上的宽图包进 `<div class="apple-scroll" style="--pan-w:NNNpx">` 左右拖,`--pan-w` 是最小字刚好 9px 时图的宽度;不需要读字的图片类标 `data-allow-shrink`。

## 4. 检查:只查客观缺陷

```bash
node ~/.claude/skills/design-review/scripts/check_objective.mjs page.html [...]
```

五项:O1 JS 报错 · O2 文字对比度 · O3 真实横向滚动 · O4 手机上图里的字 ≥ 9px · O5 关掉动画也完整。
版式、字体、组件写法一概不查。每项怎么判、为什么这么判,见 `anthropic-design/SKILL.md` 第 4 节。

O2 用的 axe 不查 SVG 里文字的对比度,图里的小标签要自己看一眼。

## 5. 可选:想要风格上的第二意见时

- `design-review` 的四道检查 + critic 评分、`dr-cli --audit`:还能用,不是交付门槛。critic 拿 canonical 当靶子,偏离范例的版式会被扣分,在本 skill 里不算问题。
- 参考资料都当案例和经验看:`references/` 下 design-tokens / typography / layout-patterns / components(28 组件)/
  diagram-craft / motion(入场缓动 + 手势 spring)/ imagery / data-display / responsive / dos-and-donts,
  `references/canonical/` 10 个范例页,`templates/` 页面模板。
- 旧经验仍然有用的一条:apple 默认容器较窄(980px),信息密集的大图放进宽容器(`apple-container--hero`,1280px)再横跨整行,否则字会被压到 9px 以下。
