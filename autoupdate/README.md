# sky-skills-autoupdate

让你的 AI CLI 在 skills 仓远端有更新时**主动提示你**,确认后**自动更新**——
不用每次自己想起来 `git pull`。支持 **Claude Code / Codex / Gemini CLI**。

## 原理

这些 CLI 都不后台轮询,所以"自动提示"挂在它们的生命周期 hook 上。三家的 hook 机制
高度一致(都用 `hookSpecificOutput.additionalContext` 注入文本),所以核心是一份 **CLI 无关**的 shell:

- 会话期 hook(**SessionStart** 开会话;做事中:Claude/Codex 用 **UserPromptSubmit**、
  Gemini 用 **BeforeAgent**,节流 30 分钟)跑 `hooks/check-update.sh`:节流 `git fetch`
  + 比对本地与远端,**落后就注入提示**(远端领先几个提交、更新了什么),AI 就主动转告你、问要不要更新。
  **只读,绝不偷偷改仓库。**
- 你确认后,AI(或 Claude 的 `/skills-sync`)跑 `bin/do-update.sh`:`git pull --ff-only`
  + 给新 skill 补 `~/.claude/skills/` 下的 symlink,并报告更新了什么。

sky-skills 是 symlink 安装的(`~/.claude/skills/X → clone/skills/X`),pull 完文件即刻最新;
只有新增 skill 要补 symlink、新 hook 要重启对应 CLI。

## 安装

```bash
cd <你的 sky-skills clone>
bash autoupdate/install.sh            # 先看一眼:加 --dry-run
```

它**探测本机装了哪些 CLI**,分别把 hook 接进各自配置(jq 幂等 merge,先备份 `.bak`):

| CLI | 配置文件 | 事件 |
|---|---|---|
| Claude Code | `~/.claude/settings.json` | SessionStart + UserPromptSubmit |
| Codex | `~/.codex/hooks.json` | SessionStart + UserPromptSubmit |
| Gemini CLI | `~/.gemini/settings.json` | SessionStart + BeforeAgent |

并播种 `~/.config/sky-skills-autoupdate/repos`(CLI 无关,写入本 clone 路径)、
往 `~/.claude/CLAUDE.md` 插一段行为规则(装了 Claude 才插)。装完**重启对应 CLI** 生效。

升级 / 卸载:`bash autoupdate/install.sh upgrade` / `uninstall`。

## 用法

- 自动:开会话或做事中,远端有更新时 AI 主动问你。
- 手动:Claude 用 `/skills-sync`;任意 CLI 都可直接跑
  `bash autoupdate/hooks/check-update.sh --report` 查状态、`bash autoupdate/bin/do-update.sh` 更新。
- 配多仓:编辑 `~/.config/sky-skills-autoupdate/repos`,一行一个仓库根。

## 边界

- 离线 / 网络慢:`timeout 5 git fetch` 失败即静默,不卡你。
- 本地仓有改动或与远端分叉:do-update 跳过并提示,绝不强行 merge。
- 只跟当前分支的 upstream(`@{u}`),只快进(`--ff-only`)。
- **适用范围**:配置在用户级,所以本机这个用户**任何目录**开对应 CLI 都生效(与 cwd 无关);
  新 hook 需重启一次该 CLI 加载。三家共用同一份 repos 配置 + 检测/更新核心。
