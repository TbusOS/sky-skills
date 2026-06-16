# Patch Workflow (upstream submission)

> 权威源：`Documentation/process/submitting-patches.rst`、`Documentation/process/5.Posting.rst`。

## checkpatch.pl —— 提交前必跑

```bash
# 检查 patch 文件
./scripts/checkpatch.pl my-change.patch
# 直接检查源文件（无树时加 --no-tree）
./scripts/checkpatch.pl --file --no-tree drivers/my_subsystem/my_driver.c
# 严格 + 拼写
./scripts/checkpatch.pl --strict --codespell my-change.patch
```

提交前修掉所有 error 和 warning。常见问题：
- 行尾空白；空格代替 tab
- 超 100 列（checkpatch 告警线；首选 80，见 `coding-style.md`）
- 缺 SPDX；注释用了 `//`（SPDX 行除外）

## Commit message

```
subsystem: brief description in imperative mood

Longer explanation:
- What problem does this solve
- Why this approach
- Notable side effects

Signed-off-by: Your Name <your@email.com>
```

## Generate patches

```bash
git format-patch -1 HEAD                              # 单 commit
git format-patch origin/master..HEAD --cover-letter  # 系列 + cover letter

# 发送前
./scripts/checkpatch.pl *.patch
./scripts/get_maintainer.pl *.patch
```
