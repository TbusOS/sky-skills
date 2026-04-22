---
name: gated-dual-clone
description: >
  Dual-repo git workflow bootstrapper for projects where upstream branches are
  protected (MR/PR required) and builds are heavy. Creates a gateway repo
  (push source) and a satellite repo (fetch-only build tree), with three
  safety gates verified post-setup and a daily-workflow cheatsheet. 双仓库
  MR/PR 流 git 工作流搭建器。适用于上游分支受保护 + 编译重 + 需物理隔离防
  误推的项目。
  TRIGGER: "dual clone workflow", "gateway repo", "verify repo", "compile
  sandbox", "protected branch workflow", "双仓库工作流", "编译仓库",
  "gateway 仓库", "set up dual clone".
  DO NOT TRIGGER: single-repo direct-push flow, pure worktree setup, monorepo
  package management, small projects where one clone is enough.
last-verified: 2026-04-22
---

# Gated Dual-Clone Workflow

## One-liner · 一句话

**EN** — Clone the upstream twice: a **gateway** repo that pushes, and a
**satellite** repo that builds. The satellite's `origin` points at the local
gateway path — so a stray `git push` from the compile tree is physically
unable to reach the remote.

**ZH** — 把上游仓库 clone 两份:一个 **gateway** 仓库负责 push,一个
**satellite** 仓库只读编译。satellite 的 `origin` 指向本地 gateway 路径,
编译树里误跑一条 `git push` 在物理上也够不到远程。

## Should I use this? · 该不该用

→ See **[references/decision-checklist.md](references/decision-checklist.md)**

Four yes/no questions. Three or more "yes" → use this skill. Otherwise fall
back to a single repo or `git worktree`.

**四道是非题**:≥ 3 个 yes 用本 skill,否则单仓库或 `git worktree` 更合适。

## Minimal bootstrap · 最小搭建

```bash
scripts/bootstrap.sh \
  --remote          git@gitlab.example.com:team/project.git \
  --upstream-branch release \
  --push-branch     feature/alice-auth \
  --gateway-dir     ~/projects/foo-work \
  --satellite-dir   ~/projects/foo-verify \
  --user-email      alice@example.com \
  --user-name       alice
```

All 7 flags are required. `--dry-run` prints the command sequence without
executing. `--force` is only valid for empty target dirs (non-empty is always
rejected; clean up by hand first). See `scripts/bootstrap.sh --help` for
detail.

## Post-setup · 搭建完成后(3 道闸)

`bootstrap.sh` verifies three safety layers before exiting 0:

- **Gate A · Protocol wall** — `cd satellite && git push` rejected
  ("DISABLED" in error). Satellite's `origin` is a local path; no network
  route to upstream exists.
- **Gate B · Explicit disable** — Satellite's push URL is literally set to
  `DISABLED`, so even malformed config still errors fast instead of silently
  trying.
- **Gate C · Pre-push hook** — Gateway's `pre-push` hook rejects any push
  to a protected-branch regex (default: the upstream branch passed in).

Gate failures halt bootstrap with a clear reason — nothing is left in a
partial state that the user has to hand-clean.

**三道闸都过才算 bootstrap 成功**。任一失败会明确说明原因,不留一半成品。

## Daily operations · 日常操作

→ See **[references/daily-workflow.md](references/daily-workflow.md)**

The core loop: edit in gateway, sync satellite with `scripts/sync-satellite.sh`,
build in satellite, push from gateway, open MR/PR. Four commands, copy-paste
ready.

**日常 4 步**:在 gateway 里改 → `sync-satellite.sh` 同步到 satellite →
satellite 里编译 → gateway 里 `git push` → GitLab / GitHub 上发 MR/PR。
cheatsheet 里每步都是现成命令。

## Safety model · 安全模型

**Three layers, each independent**. Any one holds; all three together is
belt, braces, and shoulder strap.

1. **Protocol layer** — satellite's `origin` is a file path; no TCP/SSH
   route to upstream exists from the compile tree.
2. **Config layer** — satellite's push URL = literal `DISABLED`. Explicit
   failure mode.
3. **Hook layer** — gateway's `pre-push` hook rejects protected-branch refs.

**Critical caveat · 关键注意**: Client-side git hooks are **advisory, not
enforcement**. `--no-verify` bypasses them. Real protection = server-side
protected-branch rules in GitLab / GitHub / Gerrit. This skill's hook is a
second layer — catches finger-slips, not determined bypass. Enable
server-side branch protection alongside.

**客户端 hook 只是提醒,不是强制边界**。`--no-verify` 可以绕过。真正的保护
在托管平台的 protected-branch 规则上。本 skill 的 hook 是第二层,接手滑,
不防恶意。服务端保护一起开。

## Variants · 变体

- **1 gateway + N satellites** — run `bootstrap.sh` again with
  `--skip-gateway` + a new `--satellite-dir`. Useful for `verify` / `debug`
  / `test` trees.
- **Worktree fallback** — if disk is tight (< 2× source size) and single
  developer, single machine: `git worktree` trades isolation for disk. See
  `decision-checklist.md` for when worktree beats this skill.
- **Hosting differences** — GitLab MR, GitHub PR, Gerrit push-to-`refs/for/*`.
  The skill is host-neutral; protected-branch regex is a per-project flag.

## Planned · 规划中

**`gated-dual-clone-audit`** — peer evaluator skill. Re-verifies the three
safety gates on demand (pre-push hook, pre-commit cron, manual). Independent
of the generator — same reason `design-review` is independent of the 4 design
skills: the doing agent praises its own work; a skeptical evaluator is the
real lever. See [design spec](../../docs/design-mr-gated-dual-repo.md) §11.

**`gated-dual-clone-audit`** 独立评估器(规划中),按需重验三道安全闸
(pre-push / 定时 cron / 手动)。独立于 generator,原因同 `design-review`
独立于 4 个设计 skill:做事的 agent 称赞自己的作品,独立 evaluator 才是
真正的杠杆。

## Files · 文件

- `scripts/bootstrap.sh` — the main setup command, runs all 8 steps + 3 gates
- `scripts/sync-satellite.sh` — fetch / reset-hard / merge-ff modes for
  syncing satellite from gateway
- `scripts/install-hooks.sh` — writes the `pre-push` hook on the gateway
- `references/decision-checklist.md` — when to use / when not to use
- `references/daily-workflow.md` — 4-step cheatsheet

## Reference · 参考

- [Anthropic · harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- Full design spec: [`docs/design-mr-gated-dual-repo.md`](../../docs/design-mr-gated-dual-repo.md)
- Live demo: [`demos/gated-dual-clone/index.html`](../../demos/gated-dual-clone/index.html)
