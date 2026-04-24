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
last-verified: 2026-04-24
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
- **3-clone with reproducibility gate** (see below) — add a `clean-verify`
  clone on separate disk/machine, with a pre-push hook that refuses to push
  anything clean-verify hasn't stamped. Trade extra disk + extra build time
  for catching "works on SSD, fails on HDD / CI" bugs before they reach
  upstream.
- **Worktree fallback** — if disk is tight (< 2× source size) and single
  developer, single machine: `git worktree` trades isolation for disk. See
  `decision-checklist.md` for when worktree beats this skill.
- **Hosting differences** — GitLab MR, GitHub PR, Gerrit push-to-`refs/for/*`.
  The skill is host-neutral; protected-branch regex is a per-project flag.

## Optional 3rd clone · reproducibility gate · 可选 第 3 仓 · reproducibility 关卡

For projects where a failed build on CI (different filesystem, different
disk speed, different filesystem cache state) has a real cost — add a
**clean-verify** clone on a separate disk (or separate machine) and gate
every push on a from-scratch full-build in it.

**When to use** (all four should be true):

1. Daily dev happens on SSD; CI / shipping happens on HDD or remote machine.
2. The project has reproducibility bugs that only surface from a cold, clean
   tree (SSD cache / generated files / stale build artefacts hide them on
   the iteration clone).
3. The push path is high-stakes (production branch, signed release, audit
   trail required).
4. The team already has discipline to run a pre-push command.

**Topology**:

```
                 ┌──────────┐       ┌──────────┐       ┌───────────────────┐
   upstream ───► │ gateway  │ ────► │satellite │       │  clean-verify     │
   (push only    │ (dev +   │ sync  │ (build · │       │  (pre-push gate · │
   from gateway) │  push)   │ via   │  disabled│       │   HDD / diff disk)│
                 │   SSD    │ local │  push)   │       │                   │
                 └──▲───────┘ path  └──────────┘       └───▲───────────────┘
                    │                                       │
                    │ pre-push hook reads .git/last-clean-verify
                    │ and refuses to push a commit whose sha ≠ stamped
                    │                                       │
                    └─── clean-verify-run.sh stamps on success ─┘
```

**Bootstrap it**:

```bash
scripts/bootstrap.sh \
  --remote              git@gitlab.example.com:team/project.git \
  --upstream-branch     release \
  --push-branch         feature/alice-auth \
  --gateway-dir         ~/projects/foo-work \
  --satellite-dir       ~/projects/foo-verify \
  --clean-verify-dir    /mnt/hdd/foo-clean-verify \
  --user-email          alice@example.com \
  --user-name           alice
```

Same as the 2-clone bootstrap, plus `--clean-verify-dir=<path>`. The
script adds:

- **Step 5b** — `git clone` the clean-verify from gateway (same local-path
  trick as satellite · origin on a local path, never the real remote).
- **Step 6b** — set `pushurl = DISABLED` on both `origin` and the
  diagnostic `upstream` remote. Check out `<push-branch>`.
- **Gate D** — in Step 7 post-setup, verify clean-verify push is DISABLED.
- **Pre-push hook gets a 2nd gate** — `install-hooks.sh` is invoked with
  `--enforce-clean-verify`, which adds a "stamp match" check alongside the
  protected-branch check.

**Daily flow** (5 steps instead of 4):

1. Edit in gateway, commit.
2. `sync-satellite.sh` → satellite → build + test there (fast iteration).
3. When ready to push, run:
   ```bash
   scripts/clean-verify-run.sh \
     --gateway-dir=<gw> --clean-verify-dir=<cv> \
     --push-branch=<br> --build-cmd='<full-build command>' --yes
   ```
   This syncs clean-verify from gateway, runs `git clean -fdx` (drops
   every untracked/ignored file), runs your full build end-to-end, and on
   success writes `gateway/.git/last-clean-verify`.
4. `git push origin <push-branch>` — the hook reads the stamp, refuses if
   commit doesn't match. Emergency bypass: `git push
   --push-option=allow-unverified` (use sparingly; the point of the gate
   is that it holds).
5. Raise MR/PR.

**What this catches that 2-clone doesn't**:

- SSD-only bugs: code depends on files that happen to be in OS filesystem
  cache on the dev SSD but not on a cold HDD.
- Stale-artefact bugs: satellite has build products from an earlier commit
  that accidentally satisfy a missing `#include` / missing codegen that the
  current commit wouldn't produce fresh.
- Dirty-tree bugs: satellite has hand-edits the author forgot about; they
  pass the build; clean-verify starts from git HEAD and fails.
- Build-command drift: `--build-cmd` is sha256-hashed into the stamp; if
  team changes build command out from under you, next push asks for a
  re-verify.

**Paired evaluator**: `gated-dual-clone-audit` auto-detects 3-clone mode
when you pass `--clean-verify-dir`, and runs 4 extra gates (S9-S11 + C9 +
B4) to re-verify the topology on demand.

## Files · 文件

- `scripts/bootstrap.sh` — the main setup command, runs all 8 steps + 3 gates (4 gates in 3-clone mode) · accepts optional `--clean-verify-dir`
- `scripts/sync-satellite.sh` — fetch / reset-hard / merge-ff modes for
  syncing satellite from gateway
- `scripts/clean-verify-run.sh` — sync + clean + full-build + stamp · the pre-push reproducibility gate for 3-clone mode
- `scripts/install-hooks.sh` — writes the `pre-push` hook on the gateway · `--enforce-clean-verify` adds the stamp-match gate
- `references/decision-checklist.md` — when to use / when not to use
- `references/daily-workflow.md` — 4-step cheatsheet
- `references/patterns.md` — N-satellite / worktree fallback / GitHub-GitLab-Gerrit shapes
- `references/guardrails.md` — why the three gates work / when they break / how to verify
- `references/server-side-enforcement.md` — GitLab / GitHub / Gerrit / pre-receive / Actions templates (real enforcement beyond advisory client-side hook)
- `references/troubleshooting.md` — 10 common failures, symptom → diagnose → fix → prevent
- `references/comparison.md` — dual-clone vs worktree vs single-repo, 11-dimension table

## Reference · 参考

- [Anthropic · harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- Full design spec: [`docs/design-mr-gated-dual-repo.md`](../../docs/design-mr-gated-dual-repo.md)
- Live demo: [`demos/gated-dual-clone/index.html`](../../demos/gated-dual-clone/index.html)
