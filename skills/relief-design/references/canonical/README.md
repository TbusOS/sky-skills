# relief-design · canonical

五张参考页。每张都是**这个风格在一种页型上的完整样子**，不是片段集。

| 文件 | page-type | 内容 |
|---|---|---|
| `controls.html` | `controls` | 四档质感对照（含一个故意做错的样本）+ 按钮 / 开关 / 滑块 / 输入框 / 分段控件 |
| `diagram.html` | `diagram` | 流程链 · 树状 · 左右对比 · 分层调用 · 结构体字段 |
| `hardware.html` | `hardware` | 状态机 · 时序 · 寄存器位域 · IP 内部框图 · 内存布局 · 数据通路 · 时钟树 · 缓存一致性 · DMA 描述符链 + 术语表 |
| `platform.html` | `platform` | 启动链 · 分区表 · 编号翻译（中断号）· 引脚复用 · 电源域 |
| `code.html` | `code` | 函数堆栈 · 调用关系 · 代码架构 · 运行调度关系 · 函数时序图 |

## 五张都必须满足

- **双语**（cross-skill-rules §G）：`lang-toggle` + 每段散文和每个图内标签都有 `lang-en` / `lang-zh`
- **self-diff 块**（§M）：`</body>` 前，至少 3 条决策 + Known trade-offs 段
- **品牌色出现在顶部 1440×500**（§K）：靠 `.relief-badge` 和 `.relief-rail`
- **七套皮肤都能切**：右上角皮肤条，`data-theme` 属性驱动

## 改完跑什么

```bash
R=skills/relief-design
python3 skills/design-review/scripts/verify.py $R/references/canonical/<页>.html
node    skills/design-review/scripts/visual-audit.mjs $R/references/canonical/<页>.html
python3 $R/scripts/check_skin_contrast.py $R/assets/relief.css
for t in gray ink matte mist clay sage; do
  node skills/design-review/scripts/axe-audit.mjs --theme=$t $R/references/canonical/<页>.html
done
```

**`--theme` 漏传等于没测。** 不传参数，七个皮肤会报出一模一样的数字 ——
那不是「都过了」，那是把默认皮肤测了七遍。
