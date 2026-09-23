# 调用链定位图的源文本

调用链定位图（relief 第 32 种 · anthropic §15.50 · apple §17.5）**不手画**，从一段缩进文本生成：

```bash
python3 skills/design-review/scripts/gen_call_site_figure.py                  # 重新生成仓里登记的图
python3 skills/design-review/scripts/gen_call_site_figure.py --check          # 只核对，接在 runner 里
python3 skills/design-review/scripts/gen_call_site_figure.py 你的.chain --style=relief   # 画你自己的
```

## 为什么不手画

这张图的全部价值是「读者能自己去核」。手画的时候有两件事没人查：

1. **行号对不对**。代码一改，图上的 `file:line` 就过期了，而图看着一切正常。
2. **原文抄没抄错**。手抄会抄错，而这张图抄错一个字（`return 1` 抄成 `return 0`）结论就反了。

所以反过来：写图的人只写行号，**原文由生成器按行号从文件里读出来**；每一层的行号也都核过——那一行里必须真的出现这一层的函数名。同一份源渲染成三种风格，三家画出来的内容天然一样多。

## 格式

```
id: build-manifest
title: 英文标题 | 中文标题
subtitle: 英文 | 中文                       # 可选
couple: ship_manifest.txt                   # 两条链共用的那个东西（可选）
couple.note: 英文 | 中文                    # 可选
foot: 英文 | 中文                           # 图脚那一句（可选）

chain: 英文小标题 | 中文小标题
main()                      build.sh:34
  pack_release_archive()    build.sh:37    @removed   -- 副说明 | 中文
    copy_manifest()         build.sh:30    -- 副说明 | 中文
      > build.sh:25    share=ship_manifest.txt
      ! 为什么这一行是关键 | 中文

chain: …
CI job "verify"             - 为什么给不出行号 | 中文
  verify_all()              verify_all.sh:21
    …
      find_manifest()       check_coverage.sh:14    @focus
        > check_coverage.sh:6-9    mark=return 1    share=*manifest*.txt
  ^ CI job "verify" = exit 1 : 这个返回值落到这里之后怎样 | 中文
```

- **每级缩进两个空格**，字段之间**至少两个空格**。中英文用 ` | `（两边带空格）隔开；代码里的 `||` 不会被切开。
- 文件路径相对这份源所在的目录。

| 写法 | 意思 |
|---|---|
| `名字  file:行` | 一层。行号指向**这一层被调用的那一行**，和 `gdb bt` 的读法一样；根、以及经运行时分派才进来的那一层（上一层写的是「给不出行号」）指向它自己的定义 |
| `名字  - 理由` | 这一层给不出行号，**必须写为什么**（运行时按表分派 / 宏展开后才有 / 仓库外）。只写个破折号会被拦下 |
| `@removed` | 这次调用被人删掉了。它下面的层自动画成「没走到」 |
| `@focus` | 你要找的就是这一层。一条链最多一个 |
| `@skip` | 代码在，这次没走到 |
| `-- 说明` | 卡片上的副说明 |
| `> file:起-止` | 这一层要贴的原文。可以和上一层不在同一个文件里——原文会单独标出处 |
| `mark=词;词` | 原文里决定结局的那几个字 |
| `share=词` | 原文里两条链共用的那个东西。要和 `couple:` 一起用，**两头都得标** |
| `! 说明` | 为什么这一行是关键 |
| `^ 目标层 = 返回值 : 说明` | 失败往上传到哪。画在它真正落回的那一层的缩进上（anthropic §18 的约定） |

`mark` 和 `share` **按整词找**：写 `ret` 不会圈到 `return` 的前三个字母。

## 生成器会拦下的

任何一条不过，一张图都不出（`--self-test` 里每一条都有一个探针）：

- 那一行里没有这一层的函数名 · 行号超出文件 · 文件不存在
- 给不出行号却没写为什么
- `mark` / `share` 标的词不在原文里（按整词）· 两个标记重叠
- 耦合只标了一头
- 回传没有 `@focus` 可以出发 · 回传的目标不在焦点上方
- 缩进跳了一级 · 超过 7 层（读者会数不清在第几层，该拆成两张）· 一条链两个 `@focus`
- 不认识的标记 · 某一层没有出处

## 例子

| 目录 | 画到哪 | 讲什么 |
|---|---|---|
| `build-manifest/` | anthropic · apple | issue #28 的原场景：打包脚本的私有步骤是清单唯一的来源，验收脚本要读它，两边互不调用 |
| `touch-gesture/` | relief | 触摸驱动：开机时一次「看上去只为调试打印」的读被删掉，唤醒时手势判断读到 0，返回成功，功能悄悄失效 |

例子里的脚本和驱动都是**能读的真代码**（`bash -n` 过、`checkpatch.pl` 0 error 0 warning），故障在代码上真的成立：
`tp_gesture_enable()` 返回 0 时，`tp_resume()` 里那句 `dev_warn()` 确实不会打。
