# atelier · 交互与动效

## §1 为什么这个 skill 有 861 行 JS

其余 7 个 skill 画文档,JS 是装饰。atelier 画应用,**不能点的应用就是一张截图**。
交互是交付物的一半。

## §2 属性驱动契约

页面**不写一行 atelier JS**,只写属性:

| 属性 | 行为 |
|---|---|
| `data-route="pane"` | 侧栏项 → 显示 `[data-pane="pane"]`;`data-route-title` 写进标题槽 |
| `data-tab="pane"` + `data-tab-group` | 标签页 → `[data-tabpane]` |
| `data-seg-group="name"` | 分段控件(装饰) |
| `data-accordion` | 折叠同级 `.atl-accordion__body` |
| `data-expand="id"` | 结果行展开 `#id` |
| `data-switch` | 开关 |
| `data-sort="col"` | 表头排序,读 `td[data-col]` / `data-value` |
| `data-count-to="240"` | 0 → 240 滚动,结束后**恢复原始文本** |
| `data-grow` / `data-grow="width"` | 柱 / 条从 0 长到内联 style 里的值 |
| `data-reveal` + `data-reveal-delay` | 滚动浮现 |
| `data-lang-toggle="en\|zh"` · `data-theme-toggle` | 语言 / 主题 |

**一个无法用属性表达的行为,不该进 canonical。** 这条规矩让生成器保持诚实。

## §3 冻结契约(截图闸依赖)

`?freeze=1` 或 `html[data-motion="off"]` 或 `prefers-reduced-motion` ⇒
所有动画第一帧即终态。

**终态永远是 markup 里已经写好的东西。**
- count-up:先存 `data-count-final`,动画跑数字,结束恢复原字符串
- grow:终值在内联 `style`,JS 只是把它清零一帧再还回去
- reveal:直接加 `.is-in`

所以无 JS 读者、审查闸、确定性截图三者看到的是同一个页面。**JS 从不发明内容。**

## §4 动效预算

| 允许 | 禁止 |
|---|---|
| `transform` / `opacity` | 动画 `clip-path` / `border-radius` / 尺寸 —— 会让玻璃滤镜链每帧重跑 |
| 一次性 reveal | 循环动画、常驻脉冲 |
| 开关滑块的 spring | 页面级视差 |
| 悬停 `translateY(-1px~2px)` | 3D tilt(那是 glass / 落地页的语言) |

## §5 可达性

- 开关是 `<button role="switch" aria-checked>`。
- 标签是 `<button role="tab" aria-selected>`,面板用 `[hidden]`。
- 路由项切换时更新 `aria-current="page"`。
- 焦点环 `:focus-visible` 是 2px 玫红实线,不能去掉。
- ⚠ 已知缺口:booking 页的时长滑块是 markup 不是 `<input type=range>`,
  截图确定但**不可键盘操作**。生产构建必须换成真 range。
