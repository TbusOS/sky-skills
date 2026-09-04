#!/usr/bin/env bash
# stop.sh — before the turn ends, name the HTML files that were edited but never
# put through the full gate.
#
# post-edit.sh writes a content hash into .design-gate/pending.tsv on every HTML
# write. bin/design-review writes the same hash into passed.tsv when all five
# checks succeed. Anything in pending with no matching hash in passed is a page
# that changed after its last clean run — or never had one.
#
# It blocks ONCE and then clears the pending list, so the worst case is a single
# extra turn. A Stop hook that keeps refusing until some condition is met will
# refuse forever the moment that condition is not reachable, and the transcript
# becomes eight rounds of the hook and the model repeating themselves. The point
# here is to make the omission visible, not to enforce it.
#
# Contract: reads the Stop JSON on stdin, prints a JSON decision on stdout.
# Any unexpected condition exits 0 silently.

set -uo pipefail
PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH:-}"

[ "${DESIGN_GATE_HOOK:-on}" = off ] && exit 0

payload="$(cat 2>/dev/null || true)"

# Already inside a block this hook caused: say nothing, or the turn cannot end.
if printf '%s' "$payload" | grep -qs '"stop_hook_active"[[:space:]]*:[[:space:]]*true'; then
  exit 0
fi

cwd="$(printf '%s' "$payload" | python3 -c '
import json,sys
try: print((json.load(sys.stdin).get("cwd") or ""))
except Exception: pass
' 2>/dev/null)"
[ -n "$cwd" ] || cwd="$PWD"

dir="$(cd "$cwd" 2>/dev/null && pwd)" || exit 0
repo=""
while [ -n "$dir" ] && [ "$dir" != "/" ]; do
  if [ -f "$dir/skills/design-review/scripts/verify.py" ]; then repo="$dir"; break; fi
  dir="$(dirname "$dir")"
done
[ -n "$repo" ] || exit 0

state="$repo/.design-gate"
pending="$state/pending.tsv"
passed="$state/passed.tsv"
[ -s "$pending" ] || exit 0

owed="$(python3 - "$pending" "$passed" <<'PY' 2>/dev/null
import sys, os
pending, passed = sys.argv[1], sys.argv[2]
ok = set()
if os.path.exists(passed):
    for line in open(passed, encoding="utf-8", errors="replace"):
        parts = line.rstrip("\n").split("\t")
        if parts and parts[0]:
            ok.add(parts[0])
# Last write of each path wins: an earlier hash for the same file is a version
# that no longer exists on disk, and reporting it would be noise.
latest = {}
for line in open(pending, encoding="utf-8", errors="replace"):
    parts = line.rstrip("\n").split("\t")
    if len(parts) == 2:
        latest[parts[1]] = parts[0]
for path, sha in latest.items():
    if sha not in ok:
        print(path)
PY
)"

: > "$pending"          # cleared whether or not anything was owed: block once.
[ -n "$owed" ] || exit 0

n="$(printf '%s\n' "$owed" | grep -c .)"
list="$(printf '%s\n' "$owed" | sed 's/^/  · /' | head -12)"
cmd="$(printf '%s\n' "$owed" | head -6 | tr '\n' ' ' | sed 's/ $//')"

python3 - "$n" "$list" "$repo" "$cmd" <<'PY'
import json, sys
n, listing, repo, cmd = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
reason = (
    f"{n} HTML file(s) were edited this session and have not passed the full "
    f"design gate. verify.py ran on each write, but the rendered, accessibility "
    f"and interaction checks did not:\n{listing}\n\n"
    f"  cd {repo} && bin/design-review {cmd}\n\n"
    "Run it, or say why this page does not need it. This notice is not repeated."
)
print(json.dumps({"decision": "block", "reason": reason}, ensure_ascii=False))
PY
exit 0
