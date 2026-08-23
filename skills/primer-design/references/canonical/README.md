# primer-design · canonical pages

3 个页型,覆盖"讲给完全不懂的人"的三种问法:

| 文件 | 页型 | 主题 | 它证明了什么 |
|---|---|---|---|
| `concept.html` | `concept` — "X 是什么" | 什么是数据库索引 | 一个**摸不到的东西**能只靠比喻和三张图讲完:hero 主插画 → 比喻卡 → 术语气泡 → 回顾条,身份四件齐活 |
| `process.html` | `process` — "一步步发生了什么" | 你按下回车后网页如何加载 | 顺序靠**超大圆号数字**撑,不靠流程图;每步一张自己的图;而且 process 页**仍然要有比喻卡** —— 整条路线先给一个比喻,不然就成了流程文档 |
| `compare.html` | `compare` — "A 和 B 有什么区别" | HTTP vs HTTPS | 差异用**两张并排插画**讲,不是一张对照表(那是 lectern);马克笔黄只圈那一处真正的差异 |

三个页型注册在 `coverage.mjs` 的 `TARGET` 里:`primer: ['concept','process','compare']`。
**不注册直接报错**,不是漏一行的问题。

页型名不在 `sprint-contract.mjs` 的 `VALID_PAGES` 里,所以它走 `FALLBACK_MAP` 借最近的
canonical、出一份 LOW-CONFIDENCE 契约。这三页落地之后,契约就直接引用本页型自己的
`.html` + `.md`,LOW-CONFIDENCE 的标记自然消失(atelier 先例)。

**成对读**:每个 `.html` 配一个同名 `.md`,`.md` 讲"为什么这个实例长这样" ——
"5 个让它成立的决策" + 一张排版规则表(字号 / 字重 / 容器档位 / 插画尺寸)。

⚠ 那张表的标题必须**原样**写成英文的:

```markdown
## Typography rules
```

`sprint-contract.mjs` 生成契约时按这个字符串引用它("Exactly match the type scale defined
in … \"Typography rules\" table"),全部现有 canonical 的 `.md` 也都用这个标题。
写成"排版规则"契约就指不到它了 —— 表格内容用中文没问题,标题不能翻。

每个 `.html` 末尾还嵌了 `design-review:self-diff v1` 块(verify.py 强制),
里面是同样的决策 + **已知取舍** —— 后者是 `.md` 里没有的部分,专门写给下一个作者。

## 跑检查

```bash
bin/design-review --skill=primer skills/primer-design/references/canonical/*.html
```

3 个页面必须全绿:verify 0 error → visual-audit 0 error → axe 0 violation → critic ≥90。
截图**必须人眼看过**(见 SKILL.md §5),而且要看两次 —— 桌面一次,375 视口一次:
全宽插画的描边在手机上会变细,两个机器视口(1440 / 1024)都看不到那一格
(`illustration-craft.md` §3)。

## 这三页也是"内容转换"的样例

primer 比其余 8 套多一步:先按 `explain-method.md` 把主题拆成小白能懂的结构,再渲染。
三个 canonical 各带一份拆好的结构,照抄的是**结构**,不是句子:

- 每个概念都填过 `explain-method.md` 那张六列表(是什么 / 像什么 / 术语 → 人话 / 数字 + 参照物 / 为什么重要)。
- 讲解顺序锁死:是什么 → 像什么 → 怎么运作 → 为什么重要。
- 回顾条只收三点,而且里面**没有**比喻 —— 比喻是脚手架,读者懂了就该拆掉。

## 数字都是真的,而且算过

canonical 里的数字不是编的观感数据,是能验的量:2000 万行按一行一秒读要 231 天
(所以写"七个多月"),2MB 约等于一首 MP3。

**参照物算错比裸数字更糟** —— 读者会去核一个,核不上就不再相信这页其它的数字。
写完把每个参照物按计算器过一遍。
