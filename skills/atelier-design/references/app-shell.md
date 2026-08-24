# atelier · app shell

其余 8 个设计 skill 没有这一份 —— 它们画文档,文档没有外壳。

## §1 骨架

```html
<div class="atl-wall"></div>                 <!-- 必须。壁纸,fixed -->
<div class="atl-page atl-page--wide">
  <div class="page-head">…</div>             <!-- 壳外:kicker + 语言 / 主题切换 -->
  <div class="atl-app">                      <!-- 整块玻璃 -->
    <aside class="atl-rail">…</aside>
    <main class="atl-main">
      <div class="atl-topbar">…</div>
      <section class="atl-pane" data-pane="overview">…</section>
      <section class="atl-pane" data-pane="directory" hidden>…</section>
    </main>
  </div>
  <footer class="atl-foot">…</footer>
</div>
```

**壳外只放三样东西**:kicker、语言切换、主题切换。它们是"看这个页面的工具",
不是"这个应用的一部分"。放进壳里会让读者以为切主题是产品功能。

无侧栏的屏幕(搜索、登录、向导)用 `.atl-app--full`。

## §2 侧栏

```
.atl-brand                     品牌锁定:渐变标记 + 名字 + 小写副标
.atl-navgroup                  一组
  .atl-navgroup__label         10px / 0.16em / 大写
  .atl-nav                     一项(<button>,不是 <a>,除非真跳页)
    .atl-nav__icon             18px 线性图标(这里线性是对的 —— 见下)
    .atl-nav__badge            计数
  .atl-nav.is-active           白 pill + 轻投影
.atl-rail__foot                margin-top:auto —— 用户卡沉底
```

**为什么侧栏图标是线性、KPI 图标是渐变球**:侧栏是家具,渐变球在这里会跟数据抢注意力;
KPI 是内容,那里需要签名笔触。这不是不一致,是两个不同的职责。

宽度 244(`--rail-wide` 288)。1080px 以下侧栏转成横向可滚动条,分组标签隐藏。

## §3 路由

```html
<button class="atl-nav" data-route="directory" data-route-title="Directory">…</button>
…
<section class="atl-pane" data-pane="directory" hidden>…</section>
<h1 data-route-title-slot>Dashboard</h1>
```

- `data-route` 的值匹配 `data-pane`。
- `data-route-title` 会写进 `[data-route-title-slot]` —— 标题跟着路由走。
- **所有面板的 markup 都在页面里**,只用 `[hidden]` 切换。不 fetch、不构建。
  理由:canonical 页必须在没有 JS 时可读,评审者必须不运行任何东西就能看到第二个面板有什么。
- 切换后 `replay()` 会重跑该面板内的 count-up / grow / reveal。

## §4 标签页

```html
<button class="atl-tab" data-tab="fare" data-tab-group="detail">…</button>
<div data-tabpane="fare" data-tab-group="detail" hidden>…</div>
```

`data-tab-group` 允许一页有多组互不干扰的标签(booking 页同时有"行程类型"和"票价详情"两组)。
省略时归入 `default` 组。

## §5 顶栏

标题 + 右侧工具区。**顶栏必须比它服务的第一行数据矮**。
一个每小时要回来看的工具,第一行 KPI 要在第一屏出现;落地页那种大 hero 会把数据挤到折线以下。

## §6 保存栏(表单屏)

`position: sticky; bottom: 0`,负 margin 顶到壳边。
必须写清**改动什么时候生效** —— "从 10 月 1 日开始的周期生效,当前周期已校准不会变动"
这一句,比按钮本身重要。

## §7 响应式断点

| 宽度 | 发生什么 |
|---|---|
| ≤1080 | 侧栏转横向;`--main-side` / `--3` / `--4` 栅格塌成单列 |
| ≤760 | `--2` 也塌;标题 34→27;主数字 52→40;结果行转纵向 |

侧栏塌成横条而不是抽屉:抽屉需要一个汉堡按钮和一层遮罩,而 canonical 页要能被静态截图。
