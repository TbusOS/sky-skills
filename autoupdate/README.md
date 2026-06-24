# sky-skills-autoupdate

让 Claude Code 在 skills 仓远端有更新时**主动提示你**,确认后**自动更新**——
不用每次自己想起来 `git pull`。

## 原理

Claude Code 不会后台轮询,所以"自动提示"挂在它的生命周期 hook 上:

- **SessionStart**(开会话)+ **UserPromptSubmit**(做事中,节流 30 分钟)会跑
  `hooks/check-update.sh`:节流 `git fetch` + 比对本地与远端,**落后就注入一段提示**
  (远端领先几个提交、更新了什么),Claude 就会主动转告你并问要不要更新。**只读,绝不偷偷改仓库。**
- 你确认后,Claude(或 `/skills-sync`)跑 `bin/do-update.sh`:`git pull --ff-only`
  + 给新 skill 补 `~/.claude/skills/` 下的 symlink,并报告更新了什么。

sky-skills 是 symlink 安装的(`~/.claude/skills/X → clone/skills/X`),所以 pull 完文件即刻最新;
只有新增的 skill 要补 symlink、新 hook 要重启 Claude Code。

## 安装

```bash
cd <你的 sky-skills clone>
bash autoupdate/install.sh            # 看一眼:bash autoupdate/install.sh --dry-run
```

它会:把本仓的 hook 接进 `~/.claude/settings.json`(jq 幂等 merge,先备份 `.bak`)、
把 `~/.claude/hooks/sky-skills-autoupdate` 指向本仓 `autoupdate/`、
播种 `~/.claude/sky-skills-autoupdate.repos`(写入本 clone 路径)、
往 `~/.claude/CLAUDE.md` 插一段行为规则。装完**重启 Claude Code** 生效。

升级 / 卸载:`bash autoupdate/install.sh upgrade` / `uninstall`。

## 用法

- 自动:开会话或做事中,远端有更新时 Claude 会主动问你。
- 手动:`/skills-sync` 随时检查 / 更新。
- 配多仓:编辑 `~/.claude/sky-skills-autoupdate.repos`,一行一个仓库根。

## 边界

- 离线 / 网络慢:`timeout 5 git fetch` 失败即静默,不卡你。
- 本地仓有改动或与远端分叉:do-update 跳过并提示,绝不强行 merge。
- 只跟当前分支的 upstream(`@{u}`),只快进(`--ff-only`)。
- **适用范围**:hook 装在用户级 `~/.claude`,所以本机这个用户**任何目录**开 Claude Code 都生效(与 cwd 无关);新 hook 需重启一次 Claude Code 加载。这是 **Claude Code 专属**机制,Codex 等其它 CLI 不读 `~/.claude` 的 hook,收不到。
