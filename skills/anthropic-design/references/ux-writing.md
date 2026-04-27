# Anthropic UX Writing

文案是品牌的另一半。token / 排版 / 配色都对了，CTA 写成 "Click here to start your AI journey now!" 也立刻穿帮。下面是 anthropic.com / claude.com 的真实文案模式，按场景给规则 + 对照表。

## 总规则（贯穿所有文案）

1. **直陈，不感叹**。anthropic 几乎不用 `!`。"Try Claude" 不写 "Try Claude!"。
2. **动词开头 + 短**。"Read the paper" / "Talk to sales" / "Get started"。CTA ≤ 3 词。
3. **不卖弄"AI"**。不要 "AI-powered" / "intelligent" / "smart" / "magical"。直接说做什么（"Summarize long documents"）。
4. **不写"我们的 AI"**。直接说 "Claude"。第三人称 + 具体名。
5. **数字优先于形容词**。"500K-token context" 不写 "massive context window"。
6. **现在式 + 主动语态**。"Claude reasons across documents" 不写 "Claude is able to reason across multiple documents"。
7. **不写空话动词**。砍 leverage / utilize / facilitate / empower / enable / unlock。换成具体动作。
8. **链接末尾用 `→`**，不用 `›`、不用裸文字、不用 `Read more`。
9. **Title-case 用于按钮和短标题**；句子大小写用于 hero 副标。
10. **Oxford comma**。"helpful, harmless, and honest"。

## CTA / 按钮文案

| 场景 | ✅ Anthropic 模式 | ❌ 反例 | Why |
|---|---|---|---|
| 主入口（注册 / 试用） | `Try Claude` / `Get started` | `Click here to start now!` / `Sign up FREE!` | 动词 + 名 + 句号；不感叹 |
| 销售联系 | `Talk to sales` / `Contact us` | `Request a demo today` / `Get in touch with our team` | 短，不绕 |
| 购买套餐 | `Get Pro` / `Get Team` | `Buy now` / `Subscribe and save` | 拥有感（get），不强迫感（buy now） |
| 阅读文档 / 论文 | `Read the paper` / `Read the docs` | `Learn more` / `Dive in` | 说清读什么 |
| 次要导航 | `Learn more →` (只在卡片里用) | `Click here →` / `Find out more` | 卡片末尾 OK，hero CTA 不用 |
| 表单提交 | `Submit` / `Send message` / `Subscribe` | `Click to submit` / `Hit me up!` | 单词够清楚 |
| 危险动作 | `Delete account` / `Cancel subscription` | `Yes, I really want to delete` | 平实；危险靠按钮颜色不靠文字戏剧 |

> "Learn more" 只在 4-列能力卡这种"次级深入"场景用，hero 主 CTA 不用。

## 链接文案

```
✅ Read the safety paper →
✅ View pricing →
✅ See API reference →
❌ Click here →
❌ Read more
❌ More info ›
```

- 链接文字本身要能描述目的地（无障碍 + SEO）
- 内文链接不带 `→`：`We trained the model on <a>this dataset</a>.`
- 卡片底部 / list 末尾的"继续阅读"链才带 `→`

## Hero / 标题文案

```
✅ AI research & products that put safety at the frontier
✅ Claude. AI for everyone.
✅ Build with Claude

❌ Revolutionize Your Workflow With Cutting-Edge AI!
❌ The Most Advanced AI Assistant of 2026
❌ Unlock the Power of Generative Intelligence
```

规则：
- h1 不用感叹号
- 不写 superlative（"most"、"best"、"#1"）
- 不写 "next-gen" / "revolutionary" / "game-changer"
- 句子大小写或简短 title-case
- 副标 1-2 句，说清这页是讲什么

## 副标 / lead 段

```
✅ A trustworthy AI assistant that's helpful, harmless, and honest.
✅ Deploy frontier AI with the security, governance, and support your organization needs.

❌ Welcome to the future of AI! Our cutting-edge platform empowers...
❌ We are excited to introduce a revolutionary new way to leverage AI.
```

- 一句直陈，不寒暄（不 "We're excited to..."）
- 不用 "welcome"、"introducing"、"meet the new..."
- 把"做什么 + 给谁 + 关键差异"塞进 1-2 句
- 长度 17-20 词

## Empty state 文案

| 场景 | ✅ | ❌ |
|---|---|---|
| 无对话历史 | `No conversations yet. Start one to see it here.` | `Oops! It looks like you haven't started any conversations yet 🤔` |
| 无搜索结果 | `No results for "{query}". Try a different term.` | `Sorry! We couldn't find anything matching your search 😢` |
| 无文档 | `No documents in this folder. Upload one to get started.` | `This folder is empty! Click the button below to add your first doc!` |
| 无通知 | `You're all caught up.` | `Yay! All clear ✨` |

规则：
- **不用 emoji** 表情（"🤔" / "😢" / "✨"）。anthropic 用抽象 SVG 配图，不用情绪 emoji。
- 不写 "Oops"、"Sorry"、"Yay"
- 一句陈述 + 一句下一步动作（`Start one to see it here`）

## Error 文案

| 类型 | ✅ | ❌ |
|---|---|---|
| 字段必填 | `Required` | `This field cannot be empty!` |
| 邮箱格式 | `Enter a valid email address.` | `Please enter a valid email!!!` |
| 密码弱 | `Password must be at least 12 characters.` | `Your password is too weak. Try harder!` |
| 网络故障 | `Network error. Try again.` | `Oops! Something went wrong 😞` |
| 服务器 5xx | `Something went wrong on our end. Try again in a moment.` | `Whoops! Looks like our servers are taking a coffee break ☕` |
| 鉴权失败 | `Incorrect email or password.` | `Login failed! Please check your credentials and try again.` |
| 配额超限 | `You've reached today's limit. Try again at midnight UTC.` | `Whoa there! Slow down, you've hit the limit!` |

规则：
- 不写 "Oops"、"Whoops"、"Something went wrong" 单独出现（必须有"怎么办"跟一句）
- 不归咎用户（不 "you have entered an invalid email"，写 "Enter a valid email"）
- 提供下一步动作（`Try again` / `Try again in a moment` / `Contact support`）
- 不感叹

## Placeholder 文案

```
✅ <input placeholder="you@company.com">
✅ <textarea placeholder="What would you like to ask?">
✅ <select> 第一项: "Choose a team size"

❌ <input placeholder="Enter your email here...">
❌ <textarea placeholder="Type your question and we'll help you out!">
```

- 用真实示例（`you@company.com`），不写 "Enter your email"
- 不超过 5 个词
- 不写完整句号
- 不模拟 label（label 必须独立显示在输入框上方，placeholder 只是提示）

## Form label 文案

```
✅ Work email
✅ Company size
✅ How can we help?
✅ Password (12+ characters)        ← 提示放括号里，不要新建一行 hint

❌ Please enter your work email address
❌ What is your company's size?
❌ Tell us how we can help you today
```

- 名词 / 名词短语，不是问句（除"How can we help?"这种自然问形）
- 必填用 ` *` 加在 label 末尾，不写 "(required)"
- 可选用 ` (optional)` 加在 label 末尾

## Success / 完成态文案

```
✅ Saved.
✅ Sent. We'll reply within 1 business day.
✅ Subscription updated.
✅ Account deleted.

❌ Successfully saved!
❌ Yay! Your message has been sent! 🎉
❌ Thanks for subscribing! Welcome aboard!
```

- 一两个词够：动词过去式 + 句号
- 后续信息分号断开，不连成长句

## Pricing 文案

| 元素 | ✅ | ❌ |
|---|---|---|
| 套餐名 | `Free` / `Pro` / `Team` / `Enterprise` | `Starter` / `Premium` / `Ultimate` / `Pro Max` |
| 价格行 | `$20/mo` （/mo 小一号） | `Only $20/month!` |
| 套餐描述 | `For everyday productivity.` | `Everything you need to supercharge your workflow!` |
| 功能项 | `5x usage limit` / `Priority support` | `Unlimited everything!` / `Lightning-fast support` |
| 推荐标记 | `Most popular` (badge) | `BEST VALUE!!!` |

- 不写 "Free forever" / "No credit card required" 在主价格行（放在按钮下方小字）
- 不写 "Save XX%" 红字（用次级文字 `Save $50/year` 即可）

## Loading 文案

```
✅ Loading…
✅ Generating response…
✅ Searching across 1,247 documents…

❌ Please wait while we process your request 🔄
❌ Hold tight! We're working on it!
❌ Almost there...
```

- 进行式动词 + 三连点（`…` U+2026 单字符，不是 `...` 三个 ASCII 句点）
- 长任务（>3s）说明在做什么（`Generating response…`），不只 `Loading…`

## 数字 / 单位

```
✅ 500K-token context window      （不 "500,000 token" / "half a million tokens"）
✅ 99.9% uptime                    （不 "near-perfect uptime"）
✅ $20/mo                          （不 "$20 / month" / "twenty dollars a month"）
✅ 18 min read                     （不 "It'll take you about 18 minutes"）
✅ April 14, 2026                  （月份英文展开 + 逗号 + 4 位年）

❌ ~500K
❌ Up to 500K
❌ Around 99.9% (除非真的不确定)
```

- 大数字千位逗号（`12,847` 不 `12847`）
- K/M 缩写常见（`500K`），但 article 正文里写完整（`500,000`）
- `min` 不带句号（`18 min read` 不 `18 mins read.`）

## 禁用词 / 短语清单

下列在 anthropic.com / claude.com 公共文案里**几乎从不出现**，写到的话立刻偏离品牌：

| 禁用 | 改成 |
|---|---|
| Click here | （写真链接文字）`Read the docs` |
| Learn more about how to ... | `Read the guide` / `See API reference` |
| Powered by AI | （直接说做什么）`Summarize, draft, and edit` |
| Cutting-edge / state-of-the-art | （省略；或换成具体差异） |
| Revolutionary / game-changing | （省略） |
| Seamless / seamlessly | （省略；如必须，换 `with no setup`） |
| Effortless / effortlessly | `with one command` / 具体描述 |
| Unlock / unleash | `enable` / `give you access to` |
| Empower / empowering | `help` / `let you` |
| Leverage | `use` |
| Utilize | `use` |
| Facilitate | `make easier` / 直接说做什么 |
| Welcome to ... | （省略；直接进主标题） |
| We're excited to ... | （省略） |
| Introducing ... | （省略；或用 `New: <thing>`） |
| Meet the new ... | （省略） |
| Reach out | `Contact us` / `Email us` |
| Loop in | `Tell` / `Notify` |
| Circle back | `Follow up` |
| Stay tuned | （省略；给具体日期或 RSS） |
| 🎉 / 🚀 / ✨ / 👋 emoji | 抽象 SVG 配图 |

## Voice tone — 一句话

> 像写技术备忘录给同行：直说、具体、不寒暄、信任读者读得懂。

---

## 发布前 checklist 追加项

- [ ] CTA 文案 ≤ 3 词，动词开头，无 `!`
- [ ] 没有 `Click here` / `Learn more` 单独做主 CTA
- [ ] 没有禁用词清单中的词
- [ ] 链接末尾 `→`（U+2192 单字符），不是 `->` 或 `›` 或裸文字
- [ ] 错误 / empty state 文案没有 `Oops` / `Sorry` / emoji
- [ ] 数字用千位逗号，单位无句号
- [ ] 三连点 `…` 是 U+2026 单字符，不是 `...`
