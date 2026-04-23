# Server-side enforcement · 服务端硬闸

> Client-side pre-push hooks are **advisory**. `--no-verify` bypasses
> them. This reference gives you the server-side templates for turning
> "advisory" into real enforcement.
>
> 客户端 pre-push hook 是**劝阻**。`--no-verify` 能绕过。这份 reference
> 给你服务端把"劝阻"升级成"真正拦住"的样例。

---

## When you need server-side enforcement · 什么时候必须做

Do this when **any** of these is true:

- Production / release branches carry signed tags / customer deployments
- Multiple teammates have push access (finger-slip risk × N)
- Regulated workflow (audits need "what got pushed when, by whom, and why")
- Client-side bypass shows up in the `gated-dual-clone-audit` Tier 4 Q3
  (`--no-verify` in `.git/logs`)

Client-side hooks remain useful as a second layer (catches the finger-slip
before it reaches the wire), but server-side is the one-way door.

---

## Three hosting platforms · 三种托管平台

### 1. GitLab · Protected Branches + push rules

GitLab ≥ 12 has a built-in "Protected branches" feature that
**enforces** "only allow MR merges to `main`, reject direct pushes" at
the server. No custom hook needed.

**Setup** (repo → Settings → Repository → Protected branches):

| Setting | Value |
|---|---|
| Branch | `main` (or whatever your protected branch is) |
| Allowed to merge | Maintainers only (or a specific group) |
| Allowed to push | **No one** — force all changes through MR |
| Code owner approval | Required (if `CODEOWNERS` exists) |
| Require MR approvals | ≥ 1 from maintainer |

Direct `git push origin main` will return:

```
remote: GitLab: You are not allowed to push code to protected branches on this project.
```

For a custom pre-receive hook (when you need rules the UI can't express —
e.g. "reject commits that touch `Kconfig` without a `Signed-off-by`
line"), drop a script at `/var/opt/gitlab/git-data/repositories/<namespace>/<repo>.git/custom_hooks/pre-receive`
(requires server shell access; Omnibus path varies).

### 2. GitHub · Branch protection rules

GitHub has native branch protection (Settings → Branches → Add rule):

| Setting | Value |
|---|---|
| Branch name pattern | `main` |
| Require a pull request before merging | ✓ |
| Require approvals | ≥ 1 |
| Dismiss stale approvals on new commits | ✓ (recommended) |
| Require status checks to pass | ✓ + add your CI checks |
| Restrict who can push to matching branches | add teams / users (keep empty for "no direct push") |

For custom server-side logic, GitHub does **not** expose pre-receive
hooks on cloud. Two alternatives:

- **GitHub Actions on `push` / `pull_request` events** — see template
  below. Runs after the push, but can auto-revert / open an issue if a
  rule is violated.
- **GitHub Apps with `check_suite` / `check_run`** — richer, requires
  hosting the app yourself.

### 3. Gerrit · ACLs + refs/meta/config

Gerrit is the strictest of the three — every change goes through a
review queue by design. The equivalent configuration lives in
`refs/meta/config` on each project:

```
[access "refs/heads/main"]
  push = deny group Anonymous Users
  push = deny group Registered Users
  submit = group Maintainers

[access "refs/for/refs/heads/main"]
  push = +1..+1 group Registered Users
```

Translation: nobody pushes `refs/heads/main` directly; everyone pushes
`refs/for/main` (the review queue), and only Maintainers can submit from
the queue.

---

## Server-side pre-receive hook template · pre-receive 脚本模板

Use this when the UI rules aren't enough (self-hosted GitLab / Gitea /
raw git over SSH). Drop it at the server's hook location and `chmod +x`.

```bash
#!/usr/bin/env bash
# pre-receive · server-side gate for protected branches
# Rejects any direct push to a branch matching $PROTECT that doesn't
# come through the MR/PR machinery.
set -eu

PROTECT='^main$|^release/'   # branches that MUST go through MR/PR
SERVICE="${GL_SERVICE:-${GIT_SERVICE:-}}"  # set by GitLab / Gitea

while read -r oldrev newrev refname; do
  branch="${refname#refs/heads/}"
  [[ "$branch" =~ $PROTECT ]] || continue

  # Deletion of a protected branch — reject.
  if [[ "$newrev" == "0000000000000000000000000000000000000000" ]]; then
    echo "REJECTED: cannot delete protected branch '$branch'" >&2
    exit 1
  fi

  # Direct push to protected branch — reject unless the platform marks
  # the push as originating from an MR/PR merge. (Name varies by host.)
  if [[ -z "$SERVICE" || "$SERVICE" != "gitlab-receive-pack-mr" ]]; then
    echo "REJECTED: '$branch' requires an MR/PR — direct push blocked" >&2
    echo "  push your personal branch instead, then open an MR" >&2
    exit 1
  fi
done

exit 0
```

**Deployment notes**:

- GitLab Omnibus: `/var/opt/gitlab/git-data/repositories/<group>/<project>.git/custom_hooks/pre-receive`
- Gitea: `<repo>.git/hooks/pre-receive` inside the Gitea data dir
- Self-hosted bare repo: `<repo>.git/hooks/pre-receive`
- Cloud-hosted GitLab/GitHub: **not supported** — use platform-native
  rules or CI actions instead

---

## GitHub Actions enforcement template · GitHub Actions 模板

Since GitHub cloud doesn't expose pre-receive, enforce via CI + auto-revert.
Drop this at `.github/workflows/protect-main.yml`:

```yaml
name: protect-main

on:
  push:
    branches: [main]

permissions:
  contents: write
  issues: write

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: reject direct pushes to main
        run: |
          PR_MERGE_PATTERN='^Merge pull request #[0-9]+'
          msg="$(git log -1 --pretty=%s)"
          if [[ ! "$msg" =~ $PR_MERGE_PATTERN ]]; then
            echo "::error::direct push to main detected (commit subject: '$msg')"
            echo "reverting and opening an issue..."
            git revert --no-edit HEAD
            git push origin main
            gh issue create \
              --title "Unauthorised direct push to main" \
              --body "Commit $(git rev-parse HEAD~1) was pushed directly to main by @${{ github.actor }}. Reverted automatically. Please open a PR."
            exit 1
          fi
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Trade-off**: this runs **after** the push, so there's a small window
where `main` is "broken" before the revert lands. For hard enforcement
with zero bad-state window, use **server-side** rules (first-class
"Branch protection rules" on GitHub settings) — Actions are the backstop
for rules the UI can't express.

---

## Verifying the server-side layer · 验证服务端这层真的生效

After you wire up any of the above, test from a throwaway clone:

```bash
# 1. clone + make a trivial commit on the protected branch
git clone <remote> /tmp/throwaway && cd /tmp/throwaway
git checkout main
echo "# test" >> README.md
git commit -am "direct push test — expect REJECTED"

# 2. attempt the push
git push origin main
# Expected: remote rejects with a message naming the protection rule.

# 3. clean up
cd /tmp && rm -rf throwaway
```

If the push **succeeds**, your server-side rules are not in place and
the gated-dual-clone hook is the only thing between you and a bad push.
Fix the server side before you trust the topology on anything that
matters.

---

## How this pairs with the client-side gate · 两层关系

| Layer | Mechanism | Catches | Bypassable by |
|---|---|---|---|
| Client (this skill) | gateway `.git/hooks/pre-push` + satellite `pushurl=DISABLED` | Finger-slips, muscle-memory pushes | `git push --no-verify` · any bypass shows up in `.git/logs` and is surfaced by `gated-dual-clone-audit` Tier 4 Q3 |
| Server (this doc) | Platform rules + optional `pre-receive` | Determined pushes, malicious bypass, revoked-key scenarios | Only by platform admin with server access |

**Defence in depth**: client-side stops the slip before it leaves the
machine; server-side stops the slip that evaded client-side. Both layers
together are the standard. Either layer alone is a gap.

---

## Audit integration · 和 audit 的联动

`gated-dual-clone-audit` Tier 3 B1/B2 tests the **client-side** gates.
The server-side rules live on the hosting platform and are not reachable
from the audit tool's scope (we don't reach out to GitLab/GitHub APIs
from the audit — it stays local and offline).

Tier 4 Q3 **indirectly** surfaces server-side gaps: if `--no-verify`
bypasses show up in `.git/logs`, that means someone pushed past the
client-side gate; if those pushes also reached the remote, the server
side isn't enforcing either. Combine Q3 findings with a manual check of
the platform's "Protected branches" settings.
