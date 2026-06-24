# Patch Workflow (upstream submission)

> 权威源：`Documentation/process/submitting-patches.rst`、`Documentation/process/5.Posting.rst`、
> `Documentation/process/license-rules.rst`(SPDX)、`Documentation/process/coding-assistants.rst`(AI 助手)、
> `Documentation/dev-tools/`(checkpatch / sparse / smatch / coccinelle / clang-format)。

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

## 静态检查工具（比 checkpatch 更深）

checkpatch 只查表面风格；下面几类做语义/流分析，提交前按改动范围跑：

- **sparse**：类型检查——`__user` 指针误用、大小端注解（`__le32`/`__be32` 等）、`__iomem` 地址空间。`make C=1`（只查改动的文件）或 `make C=2`（全部）。
- **smatch**：流分析 + 跨函数分析——空指针解引用、上锁不配平、数组越界。`make CHECK=smatch C=1`。
- **coccinelle**：语义补丁（`.cocci`），模式匹配 + 批量重构/找同类错。`make coccicheck`。
- **clang-format**：按内核自带的 `.clang-format` 自动排版、排序 `#include`、对齐宏。

静态检查工具都有误报，逐条评估再改，别照提示盲改。

## SPDX 许可标识

每个源文件**首行**必须有 SPDX 许可标识（代替整段 license 样板）：

```c
// SPDX-License-Identifier: GPL-2.0
```

- C 源/头文件用 `//`（即使其它地方不让用 `//`，SPDX 行是规定写法）；脚本/Makefile/Kconfig 用 `#`。
- 所有代码必须与 `GPL-2.0-only` 兼容；具体标识符照 `license-rules.rst` 选。

## Commit message + Signed-off-by（DCO）

```
subsystem: brief description in imperative mood

What problem does this solve / why this approach / notable side effects.

Signed-off-by: Your Name <your@email.com>
```

- `Signed-off-by` 是对 Developer Certificate of Origin（DCO）的认证：你写的、或你有权以指明的开源许可把它传下去。`git commit -s` 自动加。revert 也要带。
- **一个补丁只做一件事**；大改动拆成一系列小补丁，每个能独立 review、独立编译过、不破坏二分（bisect）。

## AI 编程助手（coding-assistants.rst）

内核社区对 AI 助手参与有明确规矩，按它来：

- **AI / 工具绝不替人加 `Signed-off-by`**——只有人能在法律上认证 DCO。人类提交者对整个改动负全责。
- 用了 AI 辅助要**披露**，加 `Assisted-by:` 标签：

  ```
  Assisted-by: AGENT_NAME:MODEL_VERSION [tool1] [tool2]
  ```

- 人类提交者必须：审查**全部** AI 生成的代码、确保 GPL-2.0 兼容 + 正确 SPDX、加**自己的** `Signed-off-by`、对整个改动负责。

## Generate patches

```bash
git format-patch -1 HEAD                              # 单 commit
git format-patch origin/master..HEAD --cover-letter  # 系列 + cover letter

# 发送前
./scripts/checkpatch.pl *.patch
./scripts/get_maintainer.pl *.patch                  # 找该改动该发给谁
```
