<!-- BEGIN: sky-skills-autoupdate v1 -->
## sky-skills 自动更新提示

环境里装了 sky-skills-autoupdate hook。它会在 SessionStart / UserPromptSubmit 时(节流)
检测被监控的 skills 仓远端有没有更新,有就通过 additionalContext 注入一段
"远端领先 N 个提交 + 更新了什么"的提示。

见到这种提示时:
1. **简洁地**把更新内容(commit 标题)转告用户,问是否现在更新——别擅自更新。
2. 用户确认后,运行 `bash ~/.claude/hooks/sky-skills-autoupdate/bin/do-update.sh`。
3. 它做 `git pull --ff-only` + 给新 skill 补 symlink;若输出"需重启",转告用户重启 Claude Code。
4. 本地仓有改动 / 分叉被跳过时,如实转告,不要强行更新。

用户也可主动用 `/skills-sync` 命令随时检查或更新。
<!-- END: sky-skills-autoupdate v1 -->
