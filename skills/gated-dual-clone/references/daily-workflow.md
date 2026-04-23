# Daily workflow cheatsheet · 日常流程速查

> The core 4-step loop. Copy-paste ready. Assumes these shell variables are
> set (or substitute the real values inline):
>
> - `$GATEWAY_DIR`   — absolute path of the gateway clone
> - `$SATELLITE_DIR` — absolute path of the satellite clone
> - `$PUSH_BRANCH`   — your personal branch name (e.g. `feature/xxx`)
> - `$UPSTREAM_BRANCH` — the protected upstream branch (e.g. `main`)
> - `$SKILL_DIR`     — where the skill lives, one of:
>     - `~/.claude/skills/gated-dual-clone` (after `claude install` or `cp -r`)
>     - `<path-to>/sky-skills/skills/gated-dual-clone` (source checkout)
>
> 核心 4 步流程,可直接复制。假设 shell 已设好上面 5 个变量(或替换真实值)。

Example setup once per shell:

```bash
export GATEWAY_DIR=~/work/myproj-gw
export SATELLITE_DIR=~/work/myproj-sat
export PUSH_BRANCH=feature/alice-auth
export UPSTREAM_BRANCH=main
export SKILL_DIR=~/.claude/skills/gated-dual-clone
```

---

## Step 1 · Edit in gateway · 在 gateway 里改代码

```bash
cd "$GATEWAY_DIR"
git checkout "$PUSH_BRANCH"

# edit files in your editor...

git add -p                    # review each hunk interactively
git commit -m "concise description of the change"
```

**Why gateway for edits · 为什么 edit 在 gateway**: this is the tree with
push permission; your commits need to land here before they can be pushed.
Satellite is read-only from git's perspective once `bootstrap.sh` ran.

---

## Step 2 · Sync satellite · 同步到 satellite

```bash
"$SKILL_DIR/scripts/sync-satellite.sh" \
  --satellite-dir="$SATELLITE_DIR" \
  --mode=reset-hard
```

Three modes:

| Mode | What it does | When to use |
|---|---|---|
| `fetch` | `git fetch origin`; working tree untouched | You want to see what's new without applying |
| `reset-hard` | `git fetch origin && git reset --hard origin/<branch>` | Default for pre-build sync · drops satellite-side changes |
| `merge-ff` | `git pull --ff-only` | Safer · refuses if satellite has diverged |

**Why reset-hard as default · 为什么默认 reset-hard**: satellite is a build
tree, not an edit tree. You should never have work-in-progress there.
`reset-hard` makes satellite an exact mirror of what gateway has committed.

⚠️ `reset-hard` **DROPS** any local changes in satellite. If you have
uncommitted work there, something went wrong — commit it in gateway instead,
then re-sync.

---

## Step 3 · Build in satellite · 在 satellite 里编译

```bash
cd "$SATELLITE_DIR"

# your build commands · 用项目自己的编译命令
make -j$(nproc)
# or: ninja, cargo build, ./build.sh, etc.
```

Build artefacts land in satellite's working tree. Gateway's `git status`
stays clean. Next time you sync satellite with `reset-hard`, artefacts are
wiped (but the hardlinked `.git/objects` stay intact, so it's fast).

**If build fails · 编译失败**: don't try to fix in satellite. Go back to
step 1, fix in gateway, commit, then step 2 re-sync, then step 3 rebuild.

---

## Step 4 · Push from gateway · 从 gateway push

```bash
cd "$GATEWAY_DIR"
git push origin "$PUSH_BRANCH"
```

Then open a **MR / PR** on your hosting platform: `$PUSH_BRANCH` →
`$UPSTREAM_BRANCH`.

**If `git push` errors with "REJECTED: protected branch"** — you are trying
to push to the upstream branch directly. The pre-push hook caught you. Push
to your personal `$PUSH_BRANCH` instead, then open an MR.

**如果报 "REJECTED: protected branch"** — 你在直接推上游分支。hook 拦
住了。推你自己的 `$PUSH_BRANCH`,再发 MR。

---

## Bonus · 常用加料

### Sync gateway with latest upstream · 跟上游最新

```bash
cd "$GATEWAY_DIR"
git fetch origin "$UPSTREAM_BRANCH"
git rebase "origin/$UPSTREAM_BRANCH" "$PUSH_BRANCH"
# resolve conflicts if any, then:
git push --force-with-lease origin "$PUSH_BRANCH"
# then re-sync satellite:
"$SKILL_DIR/scripts/sync-satellite.sh" --satellite-dir="$SATELLITE_DIR" --mode=reset-hard
```

### Cherry-pick a commit onto push-branch · cherry-pick 一个 commit

```bash
cd "$GATEWAY_DIR"
git checkout "$PUSH_BRANCH"
git cherry-pick <commit-sha>
git push origin "$PUSH_BRANCH"
```

### Tag a release from gateway · 打 release tag

```bash
cd "$GATEWAY_DIR"
git tag -a "v1.2.3" -m "release 1.2.3"
git push origin "v1.2.3"
```

### Clean up merged feature branches · 清理已合入的分支

```bash
cd "$GATEWAY_DIR"
# list merged feature branches (example: anything starting with 'feature/')
git branch --merged "$UPSTREAM_BRANCH" | grep '^  feature/' | xargs -n1 git branch -d
# push deletions if you push feature branches:
# git branch --merged origin/"$UPSTREAM_BRANCH" | grep feature/ | xargs -n1 git push origin --delete
```

---

## The shape · 全景

```
                   [edit]                            [build]
  ┌─────────────────────────────┐      ┌─────────────────────────────┐
  │        gateway/             │      │        satellite/           │
  │                             │◄────►│                             │
  │  * git commits              │      │  * build artefacts          │
  │  * push to upstream         │ sync │  * push = DISABLED          │
  │  * pre-push hook active     │      │  * reset-hard before build  │
  └──────────┬──────────────────┘      └─────────────────────────────┘
             │ push (personal branch only)
             ▼
        upstream remote   ← MR / PR flow lands changes on upstream-branch
```

Four moves, same shape every day. The skill only shows up at setup time; day
to day you just run these four commands.

**四步,每天同样的形状**。skill 只在搭建时露面,日常就是这 4 条命令。
