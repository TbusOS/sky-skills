# atelier · 组件清单

每个组件带**硬规矩**。规矩是从 canonical 页真实踩过的坑来的。

## 外壳
| class | 规矩 |
|---|---|
| `.atl-app` | 一页只有一个。`--full` 无侧栏,`--rail-wide` 288 |
| `.atl-rail` / `.atl-main` | 见 `app-shell.md` |
| `.atl-inksurface` | **任何不是 `.atl-card--ink` 的暗区域必须带它**,否则 `.atl-muted` 在深色上不可见 |

## 卡片
| class | 规矩 |
|---|---|
| `.atl-card` | 数据表面,0.80 alpha |
| `--flush` | padding 0 + overflow hidden。给表格 |
| `--solid` | 0.94。给表格、展开态 |
| `--ink` | **每屏恰好一张**。放需要动作的东西,不放汇总 |
| `.atl-card__head` | 标题 + 右侧控件,`align-items: baseline` |

## KPI
| class | 规矩 |
|---|---|
| `.atl-kpirow` | 一整块,内部用 `border-right` 分隔 —— **不是**四张独立卡 |
| `.atl-kpi__label` / `__value` | 两个都必须 `display:block`。忘了就变成 "Total employees 240" 一行 |
| `.atl-orb` | 三档 34/46/58。列表行用 `--soft` |

## 图表
| class | 规矩 |
|---|---|
| `.atl-bars__stack` | 轨道。**不能省** —— 见 `atelier-material.md` §5 |
| `.atl-bars__fill` | 内联 `style="height:62%"` + `data-grow` |
| `.atl-meter` / `__fill` | 行内进度条,`data-grow="width"` |
| `.atl-hbar` | 宽条 + 右端数值。填充用中强度渐变,不是 16% 淡色 |
| `.atl-axis` | 竖排刻度,`padding-bottom: 26px` 对齐 tick 行 |

## 列表
| class | 规矩 |
|---|---|
| `.atl-rank__badge` | **必须带 `data-allow-overlap`** —— 序号故意压在头像上,否则闸报 error |
| `.atl-rank__name` / `__meta` | 必须 `display:block` |
| `.atl-avatars` | **必须带 `data-allow-overlap`**。重叠 8px(`--sm` 6px),约 20% 而非 35% —— 首字母是文字,盖掉三分之一就读不出 |

## 表格
| class | 规矩 |
|---|---|
| `.atl-table` | 外面套 `.atl-scroll`,窄屏横向滚 |
| `.atl-table__sort` | `<button data-sort="col">`,单元格配 `data-col` / 可选 `data-value` |
| `.atl-table__id` | mono 12px |

## 控件
| class | 规矩 |
|---|---|
| `.atl-btn` | 默认近黑 = 主操作 |
| `--accent` | 实心 `--atl-accent-ink`。**不是渐变** |
| `--ghost` | 次操作、破坏性操作 |
| `.atl-seg` | 分段控件。**是装饰**,切换不改数 |
| `.atl-tabs` / `.atl-tab` | 选中态是玫红下划线 |
| `.atl-input` | 玻璃上必须有不透明底(`--atl-field-bg` 0.72)+ 真边框 |
| `.atl-switch` | `<button role="switch" aria-checked>`。**每个开关要写清打开后会怎样** |
| `.atl-accordion` | `<button data-accordion>` + 同级 `.atl-accordion__body` |

## 时间轴
`.atl-timeline` 是三列栅格,`__row` 用 `display: contents`。
`__time` / `__date` / `__spine` / `__dot` / `__body` **五个全部必须 `display:block`** ——
`__dot` 忘了就渲染成一根 2px 竖条而不是圆点。

## 结果行(搜索 / 预订)
`.atl-result` 是 5 列栅格 + `data-expand="id"` 展开同级面板。
`__time` / `__place` 必须 `display:block`,否则 `16:45YIA` 粘一起。

## 状态
`.atl-chip` + `--accent` / `--up` / `--down` / `--warn`。
`--down` 是**结论**,不是"红色好看" —— 一屏里最多一两处。
