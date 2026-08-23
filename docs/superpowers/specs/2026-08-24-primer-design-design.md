# primer-design — 第 9 套设计 skill(小白图解读本)设计书

日期:2026-08-24 · 状态:待用户审阅 · 起因:GitHub 官方社区插件 [anthropics/claude-plugins-community 的 eli5](https://github.com/anthropics/claude-plugins-community/tree/main/eli5/skills/eli5)(全文两行:"用大图+极少文字的 HTML 页面,向零基础的人解释一个主题"),在 sky-skills 里做成有 canonical 参考、机械检查和 critic 评审保障的完整设计 skill。

---

## 1. 目标与定位

**一句话**:把一个复杂主题变成"零基础也能看懂"的图解读本页 —— 大图、少字、比喻先行。

- **视觉性格**:科普绘本感。像《How It Works》/ DK 图解百科:亲切不幼稚,成年小白看了不觉得被当小孩。
- **和其他 8 套的本质区别**:其他 8 套是"给定内容 → 按美学渲染";primer 多一步**内容转换** —— 先把主题拆解成小白能懂的结构(比喻、分步、术语翻译),再渲染。拆解规则单独成文(§5),critic 按它打分。
- **TRIGGER**:`eli5` / `小白也能看懂` / `图解` / `给外行解释` / `科普页` / `给我妈讲讲` / `picture explainer` / `explain simply` / `explain like I'm five`。
- **DO NOT TRIGGER**:长文阅读站(sage/anthropic)、营销落地页(apple/ember)、数据汇报 deck(lectern)、发布会(eclat)、应用界面(atelier)。
- **语言**:双语切换(EN/中文 toggle,默认中文),与现有 8 套一致,复用双语机械检查。

## 2. 命名与硬约束

三处命名被 verify.py / visual-audit.mjs 的自动识别绑死,必须一致:

| 项 | 值 | 绑定处 |
|---|---|---|
| 目录 | `skills/primer-design/` | facts.mjs 按 `-design` 后缀归类;detectSkill 按路径正则 |
| 样式 | `assets/primer.css` | visual-audit detectSkill 回落匹配 `<link href="…primer.css">`;verify.py `css` 字段 |
| class 前缀 | `primer-*`(单连字符,修饰符 `--`) | verify.py 只校验带前缀 class 是否定义于 CSS;页内局部样式用无前缀 class |

前缀不缩写(与 sage/eclat 同风格;atelier 缩写只因单词太长)。

## 3. 视觉语言

### 3.1 色板(已锁定;匹配规则见 §4)

| Token | 值 | 用途 |
|---|---|---|
| `--primer-paper` | `#fdfaf3` | 页面纸白底 |
| `--primer-ink` | `#243244` | 正文/标题深墨蓝灰(实色,不用 rgba —— axe color-contrast 是阻断项,atelier 踩过) |
| `--primer-violet` | `#7a5cd6` (122,92,214) | **注册的招牌色**:插画主色、大圆号步骤数字、CTA、比喻卡边 |
| `--primer-violet-ink` | `#5b3fbf` | 强调文字用深紫(小号紫字对比度不够时的替代;axe 实测不过则只准往更深调) |
| `--primer-marker` | `#ffd23f` | 马克笔黄高亮划线。**只此一档,禁止派生深黄**(压深会落进 ember 金容差,§4) |
| `--primer-go` | `#3aa66b` | "懂了"绿:勾、对号、回顾条。辅助色,不注册 |
| `--primer-line` | `#e8e2d4` | 发丝分隔线(纸白同族浅灰) |

紫色是 9 套里唯一没人占的饱和色相;黄、绿为辅助,不进机械检查的招牌色注册。

### 3.2 字体

- 展示:**Fredoka**(圆体,500/600)→ CJK 回落 **Noto Sans SC**(符合 cross-skill-rules §H;§H 需为 primer 增补一行配对)
- 正文:**Nunito**(400/600/700)→ Noto Sans SC
- 术语小片/代码:JetBrains Mono
- primer 的 `forbiddenFonts`:`['Fraunces', 'Instrument Serif', 'Poppins', 'Lora', 'Space Grotesk']`;反向把 `Fredoka` 加进其余 8 套的 forbiddenFonts。

### 3.3 招牌动作(critic 按此打分;写进 dos-and-donts + brand-critic 的 signature 表)

1. **一屏一概念**:每个 section 只讲一件事;插画占 section 面积 ≥ 一半;正文每屏最多两短句。
2. **比喻卡**:每个抽象概念配一张"就像……"卡,自带插画。这是 primer 的身份标志,一页至少一张。
3. **超大圆号步骤数字**:厚描边手绘感圆圈 + 大号数字。
4. **术语翻译气泡**:行话一出现就配"术语 → 人话"小片(mono 字排术语,人话用正文字)。
5. **厚描边插画**:SVG 3–4px 圆头描边 + 平涂色块 + 轻微手绘抖动。与其余 8 套的插画语言截然不同,是 cross-skill 辨识点。
6. **结尾回顾条**:"现在你知道了"三点总结 + 绿勾。

### 3.4 hero 与容器

primer **有 hero**(大标题 + 主插画 + 一句"这页讲什么"),verify.py 按有 hero 声明,不走 atelier 的"无 hero"豁免。容器宽度、`narrow_hero`/`acceptable_hero` 具体值在写 canonical 时随实页定。

## 4. 颜色注册与串味决策(TOL 55 分析,已算完)

visual-audit 匹配规则:**逐通道 |Δ| ≤ 55 三通道同时成立才算命中**(非欧氏距离)。以下结论据此计算,写实施时照抄:

### 4.1 primer 在 `SKILL_SIGNATURES` 的注册

```
primer: {
  name: 'primer violet',
  accents: [[122, 92, 214]],   // #7a5cd6 — 对全部 8 家招牌色至少一通道差 ≥64
  threshold: 暂定 0.004,前 3 个 canonical 截图实测后校准,
  forbiddenColors: [anthropic 橙 #d97757, apple 蓝 #0071E3, glass 青 #22D3EE,
                    eclat flare #ff5b34, atelier 玫红 #DD4F92],
  forbiddenFonts: ['Fraunces', 'Instrument Serif', 'Poppins', 'Lora', 'Space Grotesk'],
}
```

**三个刻意豁免**(不写进 primer 的 forbiddenColors,注释里写明原因,先例=eclat/atelier 豁免 anthropic 橙):

| 豁免 | 原因(实算) |
|---|---|
| ember 金 `#c49464` | 马克笔黄 (255,210,63) 压深墨字的抗锯齿混色,如 25% 混合点 ≈ (200,170,64),对 ember 金 Δ=(4,22,36) 全部 ≤55,命中。列了必误报 |
| sage 绿 `#97B077` | "懂了"绿 (58,166,107) 往纸白混 ~45% 时 Δ=(4,30,55) 命中 sage 绿。浅绿 tint 卡片同理 |
| lectern 蓝 `#2f5bb0` + `#1d3a6e` | 双重命中:深紫强调字 #5b3fbf (91,63,191) 对 #2f5bb0 Δ=(44,28,15);且 primer 墨色 #243244 (36,50,68) 对 #1d3a6e (29,58,110) Δ=(7,8,42) —— 正文墨色本身就在 lectern 深藏青容差内,列了每页必误报 |

### 4.2 反向:把 primer 紫加进其他 skill 的 forbiddenColors

不照抄——逐家先扫该家 canonical 截图确认无 TOL-55 邻近再加:

- **预计可加**:apple、ember、sage、eclat、atelier(各家自有色对紫至少一通道差 ≥64,已实算)
- **预计豁免**:glass(aurora 光晕含紫色系,会误报)、lectern(图表蓝家族对紫的最近通道差只有 20,margin 太薄,须以 lectern canonical 实测定夺)
- **待实测**:anthropic(其低饱和 dataviz 软蓝,如 (120,140,180) 一类,对紫 Δ=(2,48,34) 会命中;扫 anthropic canonical 的 dataviz 实色后再决定,大概率豁免)

### 4.3 黄色单档铁律

`--primer-marker #ffd23f` 靠 r/g 两通道各差 59/62 险胜 ember 金;任何压深的派生黄(如 hover 深黄 (230,178,60) 对 ember Δ=(34,30,40))直接命中。写进 dos-and-donts:**黄只有一档,禁止派生深黄 token**。

## 5. 拆解方法(`references/explain-method.md`,本 skill 的"材质文件")

可被 critic 引用的硬规则:

1. **术语先翻译后使用**:未用人话定义过的术语不许出现在正文里。
2. **抽象必配比喻**:每个抽象概念必须有一个日常生活比喻(比喻卡,§3.3-2)。
3. **数字给实物参照**:"2MB ≈ 一首歌"。裸数字不许单独出现。
4. **句长上限**:中文单句 ≤ 28 字;英文 ≤ 18 词。
5. **讲解顺序锁定**:是什么 → 像什么 → 怎么运作 → 为什么重要。不许倒着来,不许跳过"像什么"。
6. **一屏一概念**(同 §3.3-1,既是排版规则也是内容规则)。

## 6. 页型与 canonical(coverage.mjs `TARGET` 注册 3 个)

| 页型 | 内容 | canonical 主题 |
|---|---|---|
| `concept` | "X 是什么" | 什么是数据库索引 |
| `process` | "一步步发生了什么" | 你按下回车后网页如何加载 |
| `compare` | "A 和 B 有什么区别" | HTTP vs HTTPS |

每个页型 = `.html`(`</body>` 前内嵌 `design-review:self-diff v1` 决策块)+ `.md`("5 个让它成立的决策" + 排版规则表 —— sprint-contract 按名引用该表)。页型名不在 sprint-contract 的 `VALID_PAGES` 里,走 `FALLBACK_MAP` 出 LOW-CONFIDENCE 契约,canonical 落地后自然消除(atelier 先例)。

## 7. skill 文件清单(atelier 现行标准)

```
skills/primer-design/
  SKILL.md                        frontmatter(name/description=TRIGGER+DO NOT TRIGGER/last-verified)
                                  §1 使用方式 · §2 触发关键词 · §3 不要用于 · §4 阅读顺序
                                  §5 发布前检查(3 道命令块) · §6 primer 专属要点
  assets/fonts.css                Google Fonts:Fredoka + Nunito + Noto Sans SC + JetBrains Mono
  assets/primer.css               全部 token + 组件,primer-* 前缀
  references/
    design-tokens.md              sprint-contract 硬编码此路径,必须有(eclat/lectern 至今欠着,不继承这个坑)
    dos-and-donts.md              品位边界(黄单档铁律 · 比喻卡必有 · 厚描边不是简笔画 · 不幼稚化)
    explain-method.md             §5 的拆解规则
    illustration-craft.md         厚描边插画画法(描边宽度/圆头/抖动/平涂色序)
    canonical/README.md           页型索引表("它证明了什么")
    canonical/{concept,process,compare}.html + .md
demos/primer-design/
  index.html                      旗舰 demo,惯例=讲仓库自己:主题「Agent Skill 是什么?」,讲给完全不懂 AI 工具的人
  diagrams.html                   图解集(voice 命名:"picture gallery / 图解集")
```

不做 `prompts/`、`templates/`(eclat/lectern/atelier 都不带,已不属于现行契约)。

## 8. 接入清单

### 8.1 机械检查注册(9 处,均在 `skills/design-review/scripts/` 与 `bin/`)

| 文件 | 加什么 |
|---|---|
| `verify.py` `SKILLS` dict | `"primer"` 条目:prefix/css/dir/hero 配置(§3.4) |
| `visual-audit.mjs` `SKILL_SIGNATURES` | §4.1 的注册 + §4.2 的反向增补 |
| `sprint-contract.mjs` | `VALID_SKILLS` 追加 + `BRAND.primer` + `DIAGRAM.primer` + 帮助文本 |
| `regression-gate.mjs` | `VALID_SKILLS` 追加 + 帮助文本 |
| `facts.mjs` `ROSTER` | `'primer-design': 'design'`(**不加直接报错**);`SHOWCASE_SURFACES` 补 primer 与 atelier 的 demo |
| `coverage.mjs` `TARGET` | `primer: ['concept','process','compare']`(**不加直接报错**) |
| `critic.mjs` / `multi-critic.mjs` / `audit.mjs` | 用法串追加 `\|primer` |
| `bin/design-review` | L19 帮助文本追加(全文件唯一硬编码处) |

### 8.2 design-review 文档与参考

- `SKILL.md`:description 与正文的 skill 枚举(现在还停在 7 套/更旧,atelier 一并补)
- `references/known-bugs.md`:新增 `## primer-design` 节;头部总数由 facts.mjs 核对
- `references/cross-skill-rules.md`:§K 加 primer 品牌可视性阈值 + 串味清单(含 §4 的豁免注释);§H 加 Fredoka→Noto Sans SC 配对

### 8.3 站点 / 画廊 / README

- 根 `index.html` 6 处(对照 atelier 的插入点):skill 卡片 / demo 预览 figure(内联手绘 SVG mock,**`<a aria-label>` 必须有** —— axe link-name 是阻断项)/ demo showcase figcaption / "primer version" 按钮 / 页脚 demos / 页脚 galleries
- `README.md` + `README_zh.md`:L9 计数(八→九,两语言)、demo 列表、skill 表新行(design 家族序,design-review 行前)、design-review/design-planner 行内的 "8 个设计 skill" → 9
- `demos/README.md`:表行 + extra pages + 本地预览地址(顺带补 atelier 缺行、"seven aesthetics" 措辞)
- `docs/INSTALL.html`:触发词表加 primer 行(顺带补缺的 atelier、datasheet-reading 行)

### 8.4 critic agents 与命令(`.claude/agents/`、`.claude/commands/`,均为仓库文件,~/.claude 是 symlink)

- `design-critic.md`:skill 枚举 + voice 列表 + signature 表(补 atelier + primer)
- `design-brand-critic.md`:色板表 / 品牌可视性阈值 / CJK 例外 / signature moves,各加 primer(补 atelier)
- `design-composition-critic.md` / `design-copy-critic.md`:枚举 + primer voice 段(补 atelier)
- `design-loop.md` / `design-distill.md` 参数提示(补 atelier)
- `skills/design-planner/SKILL.md` description + `--skill` 列表(补 atelier);`design-evolve/SKILL.md` description 核对
- 各设计 skill 自己的 §3"不要用于":sage/anthropic(阅读站)与 primer 互指;primer 的 §3 指回全家

### 8.5 atelier 欠账(与 primer 同文件,一并清)

上面 8.2–8.4 括号里所有"补 atelier"项。这些文件本来就为 primer 而改,一次改对。

## 9. 验收标准

1. 3 个 canonical + demo + 图解集,全部:verify 0 error → visual-audit 0 error → axe(color-contrast 等阻断规则)0 违例 → critic ≥ 90。
2. `node skills/design-review/scripts/facts.mjs` 全绿(13 个核心页面的 prose 计数 8→9,中英数字与中文数字全形态;atelier 落地时修了 139 处,量级有预期)。
3. `regression-gate.mjs --baseline --skill=primer` 记基线;pixel 基线在人审通过后 `--pixel-baseline` 补录。
4. 现有 8 套的 canonical 自回归不退(反向 forbiddenColors 增补是唯一可能触碰它们的改动,加前逐家扫截图,§4.2)。

## 10. Commit 拆分(仓库规矩:按关注点,验干净才提交)

1. `feat: primer-design skill 本体`(skills/primer-design/ 全部 + canonical)
2. `feat: primer 注册进 9 处机械检查`(8.1 + 8.2)
3. `feat: primer demo + 图解集 + 画廊接入`(demos/ + index.html)
4. `docs: 计数 8→9 + atelier 欠账清理`(README 双语 / demos/README / INSTALL / critic agents / commands)

顺序可并 1+2(canonical 过检查需要注册先行,实际交错开发,提交时以"每个 commit 自身全绿"为准)。

## 11. 风险与备注

- **新 skill 历来会翻出 harness 自身的 bug**(atelier 翻出 3 个,known-bugs §7.1–7.3)。预算里留排查时间;若给 primer 写新检查,遵守 known-bugs §7.10:**新检查必须带探针,否则不收**。
- 色板的 §4 结论是手算,写进 visual-audit 前用小脚本复算一遍三通道差值,防笔误。
- 若 Fredoka 的 CJK 回落在大字号下视觉突兀(圆体拉丁 + 非圆体中文),备选:展示字整体换 Nunito 加粗,Fredoka 只用于数字与英文点缀。写 canonical 时定,不影响其余设计。
