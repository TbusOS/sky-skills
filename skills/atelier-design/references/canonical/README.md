# atelier-design · canonical pages

6 个页型,覆盖一个产品从门口到深处的完整路径,外加以图为主体的那一屏:

| 文件 | 页型 | 它证明了什么 |
|---|---|---|
| `signin.html` | 登录 | 玻璃壳能撑住只有一个表单的屏幕;错误态怎么写 |
| `dashboard.html` | 控制台 | KPI 行 + 图表 + 排行 + 暗卡 + 可排序表 + 侧栏路由 |
| `booking.html` | 搜索 / 预订 | 无侧栏的壳、筛选面板、可展开结果行、行程时间轴、航线图 |
| `detail.html` | 记录详情 | 面积图 + 环图 + 薪酬条 + 变更轨迹,三组标签页 |
| `settings.html` | 设置 | 玻璃上的表单、开关行、粘性保存栏、破坏性操作 |

**成对读**:每个 `.html` 配一个 `.md`,`.md` 讲"为什么这个实例长这样"。
每个 `.html` 末尾还嵌了 `design-review:self-diff v1` 块(verify.py 强制),
里面是同样的决策 + **已知取舍** —— 后者是 `.md` 里没有的部分,专门写给下一个作者。

## 跑闸

```bash
bin/design-review --skill=atelier skills/atelier-design/references/canonical/*.html
```

5 个页面必须全绿。截图**必须人眼看过**(见 SKILL.md §5)。

## 数据都是编的

人名、ID、票价、薪酬全是合成的,页脚每页都写了。
但**数字之间是自洽的**:240 人 = 28 驻场 + 77 混合 + 135 远程;
KPI 行的 7 个在招岗位对得上侧栏 Hiring 的徽标 7。
不自洽的假数据比没有数据更糟 —— 读者会花时间去对,然后发现对不上。
