---
name: skills-sync
description: 手动检查并更新 skills 仓(sky-skills 等）。检测远端是否领先、列出更新了什么、用户确认后 git pull --ff-only + 给新 skill 补 symlink。当用户说"检查 skills 更新""同步 skills""更新 sky-skills"时用。
---

# /skills-sync — 手动检查并更新 skills 仓

随时主动检查被监控的 skills 仓(sky-skills 以及 `~/.claude/sky-skills-autoupdate.repos`
里配置的其它仓)有没有远端更新,确认后更新。无需等 hook 自动提示。

## 步骤

1. **查状态** —— 运行:
   ```bash
   bash ~/.claude/hooks/sky-skills-autoupdate/hooks/check-update.sh --report
   ```
   会打印每个仓:`已是最新` 或 `落后 N 个提交` + 更新标题。

2. **没更新** → 告诉用户"都是最新",结束。

3. **有更新** → 把更新内容(commit 标题)简洁列给用户,问是否现在更新。

4. **用户确认后** → 运行:
   ```bash
   bash ~/.claude/hooks/sky-skills-autoupdate/bin/do-update.sh
   ```
   它对每个落后的仓 `git pull --ff-only` + 给新 skill 补 symlink,并报告结果。

5. **若输出"需重启"** → 转告用户重启 Claude Code,让新 skill / hook 生效。

## 注意
- 本地仓有未提交改动时,do-update 会跳过该仓(不强 pull),如实转告用户。
- 分叉(非快进)时 do-update 会停下,提示用户手动处理,别自动 merge/rebase。
- 配置文件 `~/.claude/sky-skills-autoupdate.repos`(每行一个仓库根路径),可加别的 skill 仓。
