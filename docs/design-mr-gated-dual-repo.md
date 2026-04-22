# Design: `gated-dual-clone` Skill

**Status**: Design spec (ready to implement) · **设计稿（待实施）**
**Date**: 2026-04-22

> EN first, 中文紧随. 每节中英紧邻。

---

## TL;DR

**EN** — Package the "gateway repo pushes, satellite repo builds" dual-clone git workflow into a parameterised Skill. Any new project where the upstream integration branch is protected (MR/PR only) and builds are heavy/pollute-the-tree can spin up the topology with one command, and have a cheatsheet + troubleshooting on day one.

**ZH** — 把"gateway 仓库负责 push + satellite 仓库只 fetch 编译"的双 clone 模式做成参数化 Skill。任何新项目，只要上游集成分支受保护（必须走 MR/PR）且编译重、会污染工作树，就能一条命令搭起来，日常有 cheatsheet，踩坑有 troubleshooting。

This skill ships **self-contained** — no dependency on any other skill.

---

## 1. Background · 背景

### 1.1 When this pattern applies · 适用场景

**EN** — Engineers working under these constraints:

- Upstream integration branch (`main` / `release` / `develop`) is protected — no direct push, MR/PR only
- Developers have personal push branches on the same upstream (e.g. `feature/alice-auth`, `user/alice-m1`)
- Builds are **slow and pollute the working tree** (Android SDK, Yocto, large C++, ML workloads) — editing while compiling risks WIP contamination
- Physical isolation is wanted — prevent an accidental `git push` from the compile tree hitting the upstream

**ZH** — 工程师在以下约束下开发：

- 上游集成分支（`main` / `release` / `develop`）受保护，**无直接 push 权限**，必须走 MR/PR
- 开发者在上游有独立的 push 分支（如 `feature/alice-auth`、`user/alice-m1`），作为 MR 源
- 项目构建**耗时且污染工作树**（Android SDK / Yocto / 大型 C++ / ML），边改边编容易引入 WIP 脏状态
- 需要物理隔离，防止从编译树误推 commit 到上游

### 1.2 Why not the alternatives · 为什么别的方案不够

| Alternative | 替代 | Problem · 不够的地方 |
|---|---|---|
| **Single repo** 单仓库 | One working tree for edit + build | Build artefacts pollute `git status`; slow git ops; easy to `git add` the wrong thing · 编译产物污染 `git status`，git 操作慢，误加产物进 stage |
| **`git worktree`** | Shared `.git` with multiple working trees | Shares `origin` — compile worktree **can still push to upstream** (no physical guard); hook-only protection is advisory, bypassable with `--no-verify` · 共享 remote，编译 worktree 依然具备 push 权限，无法物理禁止；靠 hook 防护不可强制，`--no-verify` 可绕过 |

**EN** — **Gateway + satellite dual clone** solves both: separate working trees (no status pollution), separate `origin` pointers (satellite literally cannot push to upstream — it points to the local gateway).

**ZH** — **gateway + satellite 双 clone** 两个问题都解：两份独立工作树（status 不污染），两套独立 `origin`（satellite 压根无法 push 到上游，它指向本地 gateway）。

### 1.3 The topology · 拓扑

```
     ┌──────────────┐
     │   upstream   │        git@gitlab.example.com:team/project.git
     │   remote     │        (protected: main / release / ...)
     └──────▲───────┘
            │ push (MR source branch only)
            │ fetch
     ┌──────┴───────┐
     │  gateway/    │        origin = upstream URL
     │  (edit here) │        git-config user.email configured
     │              │        pre-push hook: reject protected branches
     └──────▲───────┘
            │ push (local protocol, hardlinked .git)
            │ fetch
     ┌──────┴───────┐
     │  satellite/  │        origin = file:///path/to/gateway/.git
     │  (build here)│        push URL = DISABLED
     │              │
     └──────────────┘
```

**EN** — When gateway and satellite sit on the same filesystem, git auto-hardlinks `.git/objects`. The satellite's `.git` costs essentially nothing; only its working tree is new on disk. LFS / large binary submodules are the exception (see §4.2).

**ZH** — gateway 和 satellite 在同一文件系统时，git 自动 hardlink `.git/objects`。satellite 的 `.git` 几乎不占额外盘，只有工作树是新的。LFS / 大型二进制 submodule 是例外（见 §4.2）。

---

## 2. Scope · 范围

### 2.1 In scope · 在 Skill 里

- Dual-clone bootstrap commands (gateway from remote, satellite from gateway local path)
- Branch strategy (track + personal push branch)
- Safety gates (satellite push-URL disabled, gateway pre-push hook for protected branches)
- Daily cheatsheet (edit → commit → fetch-to-satellite → build → push → MR)
- "Should I use this?" decision checklist
- Troubleshooting — common failure modes

### 2.2 Out of scope · 边界外

- Project-specific rules (commit message format, signing, CI) — belongs in the project's own CLAUDE.md
- Build commands (`make` / `ninja` / `soong` / `bazel` / `cargo`) — belongs to the project itself
- CI / hosting platform deep integration — touched lightly in `patterns.md`, not the main path

---

## 3. Skill spec · Skill 规格

### 3.1 Name · 命名

**`gated-dual-clone`** — recommended.

**Why** — "MR" is GitLab-specific; "PR" is GitHub-specific. `gated-dual-clone` is vendor-neutral and describes the mechanism: a **gated** (protected) upstream + **dual-clone** topology.

Alternative candidates if the implementer prefers:
- `protected-branch-dual-repo`
- `gated-push-dual-clone`
- `review-gated-dual-repo`

### 3.2 SKILL.md front-matter · 前置元数据

```yaml
---
name: gated-dual-clone
description: >
  Dual-repo git workflow bootstrapper for projects where upstream branches are
  protected (MR/PR required) and builds are heavy. Creates a gateway repo
  (push source) and a satellite repo (fetch-only build tree), with safety
  gates and a daily-workflow cheatsheet.
  · 双仓库 MR/PR 流 git 工作流搭建器。适用于：上游分支受保护 + 编译重 + 需
  物理隔离防误推的项目。
  TRIGGER: "dual clone workflow", "gateway repo", "verify repo",
  "compile sandbox", "protected branch workflow", "双仓库工作流",
  "编译仓库", "gateway 仓库".
  DO NOT TRIGGER: single-repo direct-push flow, pure worktree setup, monorepo
  package management, small projects where one clone is enough.
last-verified: 2026-04-22
---
```

### 3.3 Directory layout · 目录结构

```
skills/gated-dual-clone/
├── SKILL.md                       # entry + decision gate + command skeleton
├── scripts/
│   ├── bootstrap.sh               # main: one-shot build gateway + satellite
│   ├── sync-satellite.sh          # helper: sync satellite from gateway
│   └── install-hooks.sh           # helper: install pre-push hook on gateway
├── references/
│   ├── decision-checklist.md      # when to use / not use (4 questions)
│   ├── daily-workflow.md          # 4-step cheatsheet
│   ├── patterns.md                # variants (worktree fallback / N satellites / hosting diffs)
│   ├── guardrails.md              # safety-gate rationale + limits
│   ├── troubleshooting.md         # 10 common issues
│   └── comparison.md              # dual-clone vs worktree vs single-repo
└── (demo lives in `demos/gated-dual-clone/index.html`, not here)
```

All reference files ≤ 150 lines each, bilingual (EN section / ZH section per subsection).

---

## 4. SKILL.md content · SKILL.md 内容设计

SKILL.md is ≤ 200 lines. It is the **landing page**: orient, decide, point at detail files.

### 4.1 Recommended structure · 建议结构

```markdown
# Gated Dual-Clone Workflow

## One-liner · 一句话
Clone the upstream twice: gateway for pushing, satellite for building.
Physical isolation prevents mis-pushes from the compile tree.

双 clone 上游仓库：gateway 负责 push，satellite 只读编译。物理隔离防误推。

## Should I use this? · 该不该用
→ references/decision-checklist.md
4 questions; ≥ 3 yes → use this skill; otherwise fall back to single-repo or worktree.

## Minimal bootstrap · 最小搭建
\`\`\`bash
scripts/bootstrap.sh \\
  --remote          git@gitlab.example.com:team/project.git \\
  --upstream-branch release \\
  --push-branch     feature/alice-auth \\
  --gateway-dir     ~/projects/foo-work \\
  --satellite-dir   ~/projects/foo-verify \\
  --user-email      alice@example.com \\
  --user-name       alice
\`\`\`

## Post-setup · 搭建完成后（3 道闸）
... Gate A / Gate B / Gate C ...

## Daily operations · 日常操作
→ references/daily-workflow.md

## Something broke · 出问题了
→ references/troubleshooting.md

## Variants · 想要变体
→ references/patterns.md

## Pick vs worktree vs single-repo · 三种选哪种
→ references/comparison.md
```

### 4.2 Decision checklist — four questions · 决策闸 4 道题

Destination: `references/decision-checklist.md`.

1. **Is the upstream integration branch protected (MR/PR required)?**
   是否受保护，必须走 MR/PR？
2. **Does the build take > 10 minutes, OR produce > 500 MB of working-tree artefacts?**
   编译是否 > 10 分钟 **或**工作树产物 > 500 MB？
3. **Is there enough disk for two full working trees? AND — if the project uses git-lfs or large binary submodules — for two full LFS payloads?**
   硬盘能否放下两份工作树？**如果项目用 git-lfs 或大型二进制 submodule，能否放下两份 LFS 对象？**（LFS 和大二进制 submodule hardlink 不可用，真的是 2× 开销）
4. **Do you want physical isolation between edit and build trees?**
   是否希望 edit 和 build 树物理隔离？

≥ 3 yes → use this skill. Otherwise → `patterns.md` (worktree or single-repo fallback).

---

## 5. Scripts spec · 脚本规格

### 5.1 `bootstrap.sh`

**Params**:

| Flag | Required | Meaning · 说明 | Example · 例子 |
|---|---|---|---|
| `--remote` | ✅ | Upstream git URL | `git@gitlab.example.com:team/project.git` |
| `--upstream-branch` | ✅ | Upstream integration branch (tracked, not committed-to) | `release` |
| `--push-branch` | ✅ | Personal push branch (based on upstream-branch) | `feature/alice-auth` |
| `--gateway-dir` | ✅ | Gateway absolute path | `~/projects/foo-work` |
| `--satellite-dir` | ✅ | Satellite absolute path | `~/projects/foo-verify` |
| `--user-email` | ✅ | git user.email | `alice@example.com` |
| `--user-name` | ✅ | git user.name | `alice` |
| `--protect` | optional | pre-push protected-branch regex (default = upstream-branch) | `'^(release\|main)$'` |
| `--dry-run` | optional | print commands, don't execute | - |
| `--force` | optional | Allow overwriting **empty** existing target dirs. Non-empty dirs are rejected regardless — user must clear manually (no auto-`rm -rf`) | - |

**Execution (fail fast; each step says what failed and how to recover)**:

#### Step 1 — Pre-flight check
- `ssh -T <remote-host>` connects
- Gateway / satellite parent dirs exist and are writeable
- Target dirs do not exist (or are empty with `--force`)
- `git --version` ≥ 2.20 (for `--set-url --push` semantics we rely on)
- Disk free-space warning (non-blocking — real size is unknown pre-clone)

#### Step 2 — Clone gateway
```bash
git clone --progress "$REMOTE" "$GATEWAY_DIR"
```

#### Step 3 — Configure gateway
```bash
cd "$GATEWAY_DIR"
git config user.email "$EMAIL"
git config user.name  "$NAME"
git checkout -B "$UPSTREAM_BRANCH" "origin/$UPSTREAM_BRANCH"
git checkout -b "$PUSH_BRANCH" "$UPSTREAM_BRANCH"
```

#### Step 4 — Install pre-push hook
Invoke `install-hooks.sh --repo "$GATEWAY_DIR" --protect "$PROTECT"`.

#### Step 5 — Clone satellite (local path → hardlinked .git/objects)
```bash
git clone "$GATEWAY_DIR" "$SATELLITE_DIR"
```

#### Step 6 — Configure satellite
```bash
cd "$SATELLITE_DIR"
git remote set-url --push origin DISABLED
git config user.email "$EMAIL"
git config user.name  "$NAME"
git checkout "$PUSH_BRANCH"
```

#### Step 7 — Post-setup 3 gates (all must pass)

- **Gate A** — `cd "$SATELLITE_DIR" && git push 2>&1 | grep -qi "DISABLED\|does not accept"` → satellite push rejected
- **Gate B** — `cd "$GATEWAY_DIR" && git push origin "$UPSTREAM_BRANCH" --dry-run 2>&1 | grep -qi "protected\|hook\|rejected"` → gateway push-to-protected rejected by hook
- **Gate C** — `cd "$SATELLITE_DIR" && git fetch origin "$PUSH_BRANCH"` → satellite can fetch from gateway

#### Step 8 — Summary report
Print absolute paths, both `origin` URLs, branch list, next-step suggestion.

**Exit codes**:

| Code | Meaning |
|---|---|
| 0 | success |
| 1 | bad CLI |
| 2 | pre-flight failed |
| 3 | clone failed |
| 4 | configure failed |
| 5 | post-setup gate failed |

On failure, print **which artefacts were left behind** and whether manual cleanup is needed.

### 5.2 `sync-satellite.sh`

| Flag | Meaning | Default |
|---|---|---|
| `--satellite-dir` | satellite path | CWD |
| `--branch` | branch to sync | current branch |
| `--mode` | `fetch` / `reset-hard` / `merge-ff` | `fetch` |

Modes:
- `fetch` — `git fetch origin`; working tree untouched (safe default)
- `reset-hard` — `git fetch origin && git reset --hard origin/$BRANCH`; **confirm before running unless `--yes`**
- `merge-ff` — `git pull --ff-only`; refuses divergent history

### 5.3 `install-hooks.sh`

Params:
- `--repo` — target (usually gateway)
- `--protect` — protected-branch regex (default `'^(main|master)$'`)

Writes `$repo/.git/hooks/pre-push`:

```bash
#!/usr/bin/env bash
set -e
protected='__PROTECT_PATTERN__'
while read -r local_ref local_sha remote_ref remote_sha; do
  branch="${remote_ref#refs/heads/}"
  if [[ "$branch" =~ $protected ]]; then
    echo "=========================================" >&2
    echo "REJECTED: push to protected branch '$branch'" >&2
    echo "  Use MR/PR instead — push to your personal branch and raise MR." >&2
    echo "=========================================" >&2
    exit 1
  fi
done
exit 0
```

`chmod +x` after write. `install-hooks.sh --dry-run` prints without writing.

---

## 6. `references/` file specs · 文档规格

### 6.1 `decision-checklist.md`
Each of the 4 questions expanded with:
- How to answer objectively (CI logs, `du -sh`, hosting UI)
- If "no" — pointer to `patterns.md` fallback

### 6.2 `daily-workflow.md`
4-step cheatsheet with concrete commands; also covers: rebasing onto latest upstream, cherry-picking, tagging, branch cleanup.

### 6.3 `patterns.md`
- Basic (1 gateway + 1 satellite) — default
- Extended (1 gateway + N satellites) — `bootstrap.sh --skip-gateway` re-uses existing gateway
- Worktree fallback — when disk is tight and single-machine single-user is OK (trade isolation for disk)
- Hosting platform differences — GitLab MR / GitHub PR / Gerrit push-to-refs/for (Gerrit: pointer only, not v1 primary)
- Branch strategy variants — short-lived features vs long-running personal integration

### 6.4 `guardrails.md`

**Critical framing, on the first page**:

> **Client-side git hooks are advisory, not enforcement.**
> `--no-verify` bypasses them. Any laptop with this repo can push past the hook.
> Real protection = server-side protected-branch rules in GitLab / GitHub /
> Gerrit. This skill's hook is a second layer — catches finger-slips, not
> determined bypass. If your hosting allows it, enable server-side branch
> protection alongside.

Then the 3 gates explained:
1. Satellite `origin` = local path → push traffic can't even reach upstream (protocol-level barrier)
2. Satellite `push URL = DISABLED` → `git push` errors out fast (belt + braces)
3. Gateway pre-push hook → wraps the last mile with human-readable rejection

Plus: git identity explicit (no fallback to global), optional pre-commit hook on satellite (default off — too restrictive for everyday).

### 6.5 `troubleshooting.md`
10 common issues — satellite out of sync, accidental commit to upstream branch, LFS not hardlinked, submodule drift, gateway clone interrupted, hook bypassed, low disk, wrong identity, machine migration, etc. Each item: symptom + one-line fix + prevention.

### 6.6 `comparison.md` — three-way table

| Dimension · 维度 | Dual-clone (this skill) | `git worktree` | Single repo |
|---|---|---|---|
| Disk · 盘占用 | 2× working tree; `.git/objects` hardlinked | 1× `.git` + N× tree | 1× total |
| LFS / binary submodule · LFS 大二进制 | 2× (hardlink NA) | 1× | 1× |
| Physical push isolation · 物理防误推 | ✅ satellite origin = local path | ❌ shared remote | ❌ |
| Build pollutes `git status` · 污染 status | Isolated · 隔离 | Isolated · 隔离 | Polluted · 污染 |
| Cross-machine migration · 跨机迁移 | Medium (re-install hooks) · 中 | Low · 低 | Low · 低 |
| Multi-user / shared machine · 多人共用 | Safe · 安全 | Risky · 有风险 | Risky · 有风险 |
| Client hook bypass risk · hook 被绕 | Low (protocol barrier helps) · 低 | Full risk · 全风险 | Full risk · 全风险 |

---

## 7. Three gates for PR acceptance · 三道闸验收

Borrowed from the `design-review` skill's generator/evaluator separation pattern.

### Gate 1 — `bootstrap.sh --dry-run` produces a reviewable command sequence

Output must be a **fully-commented** shell transcript. Any reader (human or another Claude) should be able to follow along or hand-execute. Example snippet:

```bash
# Step 2 of 7 — clone gateway
# Resolves: git@gitlab.example.com:team/project.git → ~/projects/foo-work
git clone --progress git@gitlab.example.com:team/project.git ~/projects/foo-work

# Step 3 of 7 — configure gateway identity
cd ~/projects/foo-work
git config user.email alice@example.com
...
```

### Gate 2 — `bootstrap.sh` runs end-to-end against a public test repo

```bash
scripts/bootstrap.sh \
  --remote git@github.com:octocat/Hello-World.git \
  --upstream-branch master \
  --push-branch test-dual-clone \
  --gateway-dir /tmp/test-work \
  --satellite-dir /tmp/test-verify \
  --user-email test@example.com \
  --user-name tester
```

Must satisfy:
- `work/.git` origin → github
- `verify/.git` origin → `work` local path
- `cd verify && git push` errors with "DISABLED"
- `cd work && git push origin master --dry-run` rejected by hook
- `cd verify && git fetch origin test-dual-clone` succeeds

### Gate 3 — black-box cheatsheet read

A **second, isolated Claude Code session** reads **only** `references/daily-workflow.md` (no other files, no shell history). It must complete one "edit → commit → sync → push" loop without asking questions.

The point: if the cheatsheet requires cross-referencing `patterns.md` or `troubleshooting.md` to be usable, it's not a cheatsheet — it's a link index. Close the loop.

---

## 8. Bilingual & HTML demo · 双语与 HTML demo

### 8.1 Bilingual policy — mandatory

**All text artefacts of this skill are bilingual (EN + ZH)**:

- `SKILL.md` — each section has EN paragraph(s) then ZH paragraph(s), tight interleave
- `references/*.md` — same pattern
- `scripts/*.sh --help` output — EN primary, ZH as a second paragraph after the English help

**Rationale**:

- sky-skills targets a global developer audience; EN is the lingua franca
- The maintainer ships in a Chinese-speaking team; ZH is necessary for daily use
- Bilingual HTML `design-review` §G rule already enforces this for `/docs/` and `/references/canonical/` paths — this skill aligns

### 8.2 HTML demo — mandatory

**File**: `demos/gated-dual-clone/index.html`

**Design style**: `anthropic-design` (warm editorial — matches the skill's nature as a serious engineering workflow told with calm tone, not as a flashy UI).

**Required content**:

1. **Hero** — concept name + one-liner + bilingual toggle
2. **SVG topology diagram** — upstream ↔ gateway ↔ satellite, with push / fetch arrow semantics, hooks drawn as shields
3. **"Should I use this?" decision tree** — 4 questions rendered as a visual tree, with yes/no branches leading to this-skill vs fallbacks
4. **Bootstrap parameter example** — syntax-highlighted invocation + inline parameter explanations (hover tooltip or adjacent legend)
5. **Three safety gates** — three cards, each showing one gate's code-level mechanism + the test command that verifies it
6. **Comparison table** — dual-clone vs worktree vs single-repo (same data as `comparison.md`)
7. **Footer** — pointers to the skill's main files

**Quality bar**: must pass `bin/design-review --skill=anthropic` all three gates (verify.py / visual-audit.mjs / screenshot.mjs). No warnings except brand-intentional.

---

## 9. Deliverables checklist · 交付清单

Two peer skills — the generator and the independent evaluator.

### Generator · `skills/gated-dual-clone/`

- [ ] `SKILL.md` (≤ 200 lines, bilingual)
- [ ] `scripts/bootstrap.sh` (pre-flight + 3 post-setup gates)
- [ ] `scripts/sync-satellite.sh`
- [ ] `scripts/install-hooks.sh`
- [ ] `references/decision-checklist.md`
- [ ] `references/daily-workflow.md`
- [ ] `references/patterns.md`
- [ ] `references/guardrails.md`
- [ ] `references/troubleshooting.md`
- [ ] `references/comparison.md`

### Evaluator · `skills/gated-dual-clone-audit/`

- [ ] `SKILL.md` (bilingual)
- [ ] `bin/gated-dual-clone-audit`
- [ ] `scripts/audit-structural.sh`
- [ ] `scripts/audit-config.sh`
- [ ] `scripts/audit-behavioural.sh`
- [ ] `scripts/audit-critic.mjs` (Tier 4, optional)
- [ ] `references/gate-catalog.md`
- [ ] `references/known-drifts.md`
- [ ] `references/troubleshooting.md`
- [ ] `agents/gated-dual-clone-audit-critic.md`

### Repo-level

- [ ] `demos/gated-dual-clone/index.html` (anthropic-design, bilingual, passes `design-review`)
- [ ] `README.md` / `README_zh.md` — add rows for `gated-dual-clone` AND `gated-dual-clone-audit` in the skill table

Attach to the PR description:
- Gate 2 run log for `bootstrap.sh` (against a public test repo)
- `gated-dual-clone-audit` run log (all 3 tiers pass on the bootstrap output)
- `design-review` output on the demo HTML

---

## 10. Open questions for the implementer · 交实施方定

1. **Interactive mode** — currently pure flags. `--interactive` prompt could help first-timers but adds surface area. Not required for v1.
2. **Gerrit depth** — v1 references Gerrit only in `patterns.md`. If >10% of users are on Gerrit, add `scripts/bootstrap-gerrit.sh` in v2.
3. **CI/CD integration** — this skill is about local workflow. Out of v1.

---

## 11. Independent evaluator · 独立评估器 (`gated-dual-clone-audit`)

### 12.1 Why a separate auditor · 为什么要独立评估器

Two rules carried over from Anthropic's [harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps) and the GAN lineage:

1. **Agents praise their own work.** The skill that bootstraps the topology carries the mental model "I did this correctly" — it will not, on its own, notice that the pre-push hook was deleted last week or that `user.email` drifted back to the global default. The generator ships and moves on; it has no incentive to catch regressions in its own output.
2. **Independent, skeptical evaluators are the real leverage.** Within sky-skills, the `design-review` skill audits the 4 design-skill outputs without inheriting their assumptions — and it is deliberately **not** part of any design skill. `gated-dual-clone-audit` plays the same role for the git-workflow side.

**ZH** — 两条原则来自 Anthropic 的 harness-design 文章和 GAN 范式：(1) 做事的 agent 倾向自我称赞自己的作品；(2) 独立而持怀疑的 evaluator 才是真正的杠杆。`design-review` 在 sky-skills 里审 4 个设计 skill 的成品，不属于任何一个 skill。`gated-dual-clone-audit` 对 git 工作流做同一件事。

The auditor can run anytime — on a schedule, as a git hook, or before a big push — and re-verify that the safety gates still hold.

### 12.2 What the audit checks · 审计覆盖的维度

Four tiers, same shape as `design-review`:

**Tier 1 · Structural**（无副作用，只读文件系统）
- `$GATEWAY_DIR` / `$SATELLITE_DIR` 存在、是目录、是 git 仓库（`git rev-parse` 可跑）
- Pre-push hook 文件在、有 `execute` 位、regex 看起来合理
- `.git/objects` hardlinking：采样几个 blob，比 gateway / satellite 的 inode

**Tier 2 · Configuration**（只读 git config）
- `satellite: remote.origin.url` 以 `file://` 开头或指向 `$GATEWAY_DIR` 绝对路径
- `satellite: remote.origin.pushurl == "DISABLED"`（字符串精确匹配）
- `gateway: remote.origin.url` 协议符合预期（ssh / https）
- 两边 `user.email` / `user.name` 都显式设置（未 fallback 到全局）
- satellite 当前分支 = push-branch
- gateway 当前分支 = push-branch 且 tracks upstream

**Tier 3 · Behavioural**（跑 `--dry-run` git 命令，无状态修改）
- `cd satellite && git push --dry-run` → grep "DISABLED" — Gate A 协议墙还在
- `cd gateway && git push origin <upstream-branch> --dry-run` → grep "REJECTED" — Gate C hook 还在
- `cd satellite && git fetch origin <push-branch> --dry-run` — fetch 路径通
- satellite 工作树干净（`reset-hard` 不会丢未提交改动）

**Tier 4 · Taste（可选 LLM 评审）**— 对应 `design-review` 的 `--critic` / `--multi-critic`：
- 读当前状态 + 项目 git 历史，问机器查不出的问题：
  - `$PUSH_BRANCH` 还基于 `$UPSTREAM_BRANCH` 吗，还是已经 diverge 到无法快速 rebase？
  - 拓扑还必要吗，还是项目缩小到单仓就够了？
  - `.git/logs` 里有没有 `--no-verify` 的 push 记录（hook bypass）？

### 12.3 Entry point · 入口

```bash
bin/gated-dual-clone-audit [--strict] [--critic] [--multi-critic] \
  --gateway-dir=<path> --satellite-dir=<path>
```

Exit-code convention mirrors `design-review`:

| Code | Meaning |
|---|---|
| 0 | all gates pass |
| 1 | at least one gate warns |
| 2 | at least one gate fails (hook missing, config drift, etc.) |

Output: structured JSON verdict + narrative. Feed the JSON to `learning-loop.mjs` so a drift caught in the wild becomes a new check — same feedback loop design-review uses for taste-caught bugs.

### 12.4 Directory layout · 目录结构

Peer skill, not a sub-module of `gated-dual-clone`:

```
skills/gated-dual-clone-audit/
├── SKILL.md
├── bin/gated-dual-clone-audit        # wrapper, runs tiers 1-3 then optional 4
├── scripts/
│   ├── audit-structural.sh           # filesystem / hook / hardlink checks
│   ├── audit-config.sh               # git config inspection
│   ├── audit-behavioural.sh          # --dry-run behavioural tests
│   └── audit-critic.mjs              # LLM critic prompt builder
├── references/
│   ├── gate-catalog.md               # full check inventory
│   ├── known-drifts.md               # drift patterns caught in the wild
│   └── troubleshooting.md
└── agents/
    └── gated-dual-clone-audit-critic.md  # Claude subagent definition
```

**Does not import anything from `gated-dual-clone`.** The auditor reads the output topology; it does not share code with the generator. This is the same independence rule `design-review` holds against the 4 design skills.

### 12.5 Scheduled use · 自动化使用

```bash
# .git/hooks/pre-push — run audit before every push
#!/usr/bin/env bash
set -e
exec bin/gated-dual-clone-audit \
  --gateway-dir="$GATEWAY_DIR" --satellite-dir="$SATELLITE_DIR" \
  --strict
```

Or cron-weekly with `--multi-critic` to catch slow drift; the JSON verdict funnels into `learning-loop` so same drift doesn't need to be re-caught.

### 12.6 What this costs · 代价

- More scripts, more moving parts.
- Running the audit is user's responsibility; the generator does not nag.
- Tier 3 behavioural tests are real git invocations — safe (dry-run only) but adds ~1-2 seconds.
- Tier 4 LLM evaluator costs tokens.

**Worth it?** For a single-developer week-long project: probably no, overhead > risk. For a team setting where the topology persists for months and drift accumulates: yes — this is exactly the case the skill is pitched for. The `design-review` experience in sky-skills makes the same trade-off (small pages don't need it; real canonical deliverables do).

---

## 12. References · 参考

- `skills/design-review/SKILL.md` — three-gate acceptance pattern this doc borrows from. `gated-dual-clone-audit` mirrors the same generator/evaluator split.
- [Anthropic · harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps) — the source of the "separate the doing agent from the judging agent" lever.
- sky-skills conventions — `README.md` and `README_zh.md` at repo root

---

## Changelog · 变更记录

| Date · 日期 | Version · 版本 | Change · 变更 |
|---|---|---|
| 2026-04-22 | v3 | Add §11 `gated-dual-clone-audit` — independent 4-tier evaluator (structural / config / behavioural / taste). Split deliverables checklist into generator + evaluator. Cite Anthropic harness-design "separate doing from judging" as the grounding rule. Evaluator deliberately imports nothing from the generator — mirrors design-review's independence against the 4 design skills. |
| 2026-04-22 | v2 | Remove all repo-specific terms; remove dependency on external skills; skill renamed `mr-gated-dual-repo` → `gated-dual-clone` (vendor-neutral); bilingual EN/ZH throughout; HTML demo mandatory; --work-dir/--verify-dir → --gateway-dir/--satellite-dir; add comparison table; strengthen guardrails framing on hook limits; Q3 decision question adds LFS/submodule caveat; --force semantics locked to "empty dir only". |
| 2026-04-22 | v1 | Initial draft. |
