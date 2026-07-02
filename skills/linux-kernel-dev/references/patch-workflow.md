# Patch Workflow (upstream submission)

> 权威源：`Documentation/process/submitting-patches.rst`、`Documentation/process/5.Posting.rst`、
> `Documentation/process/license-rules.rst`(SPDX)、`Documentation/process/coding-assistants.rst`(AI 助手)、
> `Documentation/dev-tools/`(checkpatch / sparse / smatch / coccinelle / clang-format)；
> b4 见 <https://b4.docs.kernel.org/>；virtme-ng 见 <https://github.com/arighi/virtme-ng>。
> b4 / virtme-ng 两节的实战要点提炼自 [tzussman/kernel-dev-skill](https://github.com/tzussman/kernel-dev-skill)。

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

## Generate patches（手工基线）

```bash
git format-patch -1 HEAD                              # 单 commit
git format-patch origin/master..HEAD --cover-letter  # 系列 + cover letter

# 发送前
./scripts/checkpatch.pl *.patch
./scripts/get_maintainer.pl *.patch                  # 找该改动该发给谁
```

系列管理（版本迭代、cover letter、收 trailer）用下面的 b4 更省事。

## b4 —— 系列管理与投递（现代路径）

b4 是 kernel.org 官方的 patch 系列管理工具，把 format-patch + get_maintainer +
send-email + 收 Reviewed-by 的手工流程整合成一条：`prep → check → auto-to-cc → send`。

```bash
# 起新系列（从基线分叉建跟踪分支）；已有分支用 -e 登记
b4 prep -n my-feature -f origin/master
b4 prep -e origin/master

b4 prep --edit-cover        # 编辑 cover letter（存在 git notes 里,不在工作树）
b4 prep --check             # 发送前跑 checkpatch 等本地检查
b4 prep --auto-to-cc        # 用 get_maintainer.pl 自动填 To/Cc —— 不跑这步 patch 发不到人

b4 send --dry-run           # 预览要发什么
b4 send --reflect           # 先发给自己审一遍
b4 send                     # 真发（人确认后才执行）

# v2 迭代
b4 prep --compare-to v1     # 和上一版做 range-diff
b4 prep --edit-cover        # 补 "Changes in v2" 段
b4 send                     # 自动发成 [PATCH v2 ...]

# 收社区回的 tag（Reviewed-by / Acked-by / Tested-by）回写到本地 commit
b4 trailers -u

# 应用别人在 lore 上的系列
b4 shazam <message-id>      # 直接打到当前树
b4 am -o /tmp/patches <message-id>   # 只下载 mbox,手工 git am
```

坑速查：

| 症状 | 原因 | 修法 |
|---|---|---|
| patch 发出去没人理 | 没跑 `--auto-to-cc`，To/Cc 空 | 发送前必跑 |
| `b4 send --dry-run` 报 `patatt.signingkey is not set` | 没配签名 key 也没配 SMTP | `patatt genkey` 生成 ed25519 key；或只要 patch 文件用 `b4 prep -p <目录>` |
| `--edit-cover` 挂住不返回 | 它开 `$EDITOR` 交互等输入 | 脚本里用 `EDITOR=...` 覆盖成非交互写入 |
| `--show-info` 报错 / 系列为空 | `prep -n` 只建了 cover commit | 分支上先做至少一个 commit |
| 系列里混入意外 commit | 分叉点登记错 | 用正确基线重新 `prep -e` |

工具调用红线：**`b4 send`（不带 `--dry-run`/`--reflect`）会真发邮件到公开列表**，
必须人确认后才执行——和「AI 不加 Signed-off-by」同级的硬规矩。

## virtme-ng —— 投递前把 patch 真启动一遍

`vng` 用 QEMU 启动当前目录刚编出的内核，host 根文件系统以写时复制方式共享给
guest——不用装系统、不用磁盘镜像，几秒内验证「这个 patch 的内核能不能启动、
selftest 过不过」。投递前跑一遍，比只编译过硬得多；配 `git bisect run` 也是
现成的回归二分工具。

```bash
vng -- uname -a                                  # 跑一条命令,结束即退出
vng --user root -- <command>                     # 多数内核测试要 root
vng --run ./arch/x86/boot/bzImage -- <command>   # 指定 kernel 镜像
vng --run v6.6.17 -- <command>                   # 下载上游预编译内核

# 命令成功 ≠ 内核干净:退出码 0 时 dmesg 里可能有 splat,始终追加错误级检查
vng --user root -- sh -c '<command>; echo "=== DMESG ==="; dmesg -T --level=err,warn,crit,alert,emerg'

# 启动挂死诊断:切换真串口 + 早期打印,看内核停在哪一级
timeout 90 vng --user root --disable-microvm \
    --append "console=ttyS0,115200 earlyprintk=serial,ttyS0,115200 nokaslr panic=-1 oops=panic loglevel=7" \
    -- uname -a 2>&1
```

坑速查：

| 症状 | 原因 | 修法 |
|---|---|---|
| 工具调用卡死不返回 | 裸 `vng` 进交互 shell | 永远 `vng -- <cmd>`；工具调用一律套 `timeout 60-300` |
| 超时且零输出 | 启动挂死（不是命令慢） | 用上面 `--disable-microvm` + `--append` 串口诊断行重跑 |
| 早期启动/panic 输出丢失 | 默认 microvm 走 virtio-console（hvc0），无真串口 | `--disable-microvm` + `console=ttyS0` |
| 测试报 `ENOSYS` / 缺 `/proc` 项 | vng 最小化 config 没编进所需选项 | `--config <fragment>` 或 `--configitem CONFIG_X=y` 重编 |
| 测试写的文件不见了 | rootfs 默认写时复制，写进临时层 | 需要落盘用 `--rwdir <path>`；想丢弃用 `--overlay-rwdir` |
| `/dev/kvm` 不存在跑不起来 | 无 KVM 权限/模块 | 加 `--disable-kvm`（TCG 慢但能跑）或补 kvm 组权限 |

红线：`vng --force` 会把 git 树重置到目标分支、可能丢未提交改动——用户明确要求才用。
