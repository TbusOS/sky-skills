# Canonical · eclat-design pre-order

> 什么让这成为一张好的 eclat 预订页。生成新 eclat pre-order 页**前先读**。
> 完整设计决策见 `pre-order.html` 末尾的 `design-review:self-diff v1` 注释块。

---

## 5 个让它成立的决策

### 1. 倒计时复用 `.eclat-specs` strip
天/小时/分钟/秒就是四个大数字 + 标签 —— 正是 spec strip 的形状,直接继承品牌节奏,且保持**静态**(canonical 是冻结产物;真部署把同样 markup 接计时器)。

### 2. 价格当一个"时刻"
价格用满屏 `.eclat-bignum` 单独占一屏 —— 发布预订里价格就是 reveal;塞进定价表 = 读成 lectern。分期信息作为下方安静的细节。

### 3. 安抚信息放页头,不藏小字
"发货时才扣款。发货前随时可取消" 写在页头(不是星号小字)—— 既更高转化也更诚实,eclat 的克制延伸到不藏条款。

### 4. 单一 flare CTA
一个 flare "立即预订" + 一个 ghost "对比机型"。预订页只有一个主行动,第二个填充按钮会分散意图、稀释 keynote 克制。

### 5. "盒子里有什么",不是功能网格
一张点亮的产品+配件 SVG 讲清楚物理上到货的是什么,而不是把读者在 launch/spec 已看过的功能再卖一遍。一张诚实的清单图收口。

---

## 何时用
产品发布的预订 / 预售页(常配倒计时)。**不要**用于 SaaS 订阅定价表(那是密集对比,偏 lectern/其它)。
配色/字体/双语/标点规范同 [[launch.md]] 与 `dos-and-donts.md`。
