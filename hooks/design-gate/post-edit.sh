#!/usr/bin/env bash
# post-edit.sh — run the cheap half of the design gate the moment an HTML file
# is written, and remember that the expensive half still owes this file a pass.
#
# The gate chain costs 17-25 seconds a page because three of its five checks
# drive a browser. Nobody pays that on every edit, so in practice nobody runs it
# at all until just before publishing — which is exactly when a structural
# problem is most annoying to find. verify.py is the one check that needs no
# browser and takes 0.05 seconds, so it can run on every write and say something
# useful immediately.
#
# What it cannot do is judge the rendered page. So it also records the file's
# content hash in .design-gate/pending.tsv; bin/design-review records a hash in
# passed.tsv when the full chain succeeds, and the Stop hook reports the
# difference. Editing a file changes its hash, which invalidates its receipt
# without anyone having to remember to.
#
# Contract: reads the PostToolUse JSON on stdin. Exit 0 says nothing; exit 2
# sends stderr back to the model as feedback. Any unexpected condition exits 0 —
# a hook that breaks the session is worse than a check that missed one edit.

set -uo pipefail
PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH:-}"

[ "${DESIGN_GATE_HOOK:-on}" = off ] && exit 0

payload="$(cat 2>/dev/null || true)"
[ -n "$payload" ] || exit 0

# PostToolUse fires on every tool call, and this hook is deliberately installed
# without a matcher (see install.sh). That makes the not-mine path the hot one:
# it runs a few hundred times a session and the session waits for each. Parsing
# the JSON there costs a python3 cold start — 19 ms measured end to end, so
# ~6 seconds over a busy session spent proving the payload was never ours.
#
# A file_path ending in .html always puts the string ".html" somewhere in the
# payload, so this cannot miss one. A payload that merely mentions .html falls
# through to the parse and is rejected there, at the old cost. 19 ms → 0.05 ms.
case "$payload" in
  *.html*) ;;
  *) exit 0 ;;
esac

file="$(printf '%s' "$payload" | python3 -c '
import json,sys
try:
    d = json.load(sys.stdin)
except Exception:
    sys.exit(0)
ti = d.get("tool_input") or {}
p = ti.get("file_path") or ti.get("path") or ""
# MultiEdit and friends may carry the path under a different key; take the
# first plausible one rather than guessing a schema that may change.
if not p:
    for k, v in ti.items():
        if isinstance(v, str) and v.endswith(".html"):
            p = v
            break
print(p)
' 2>/dev/null)"

case "$file" in
  *.html) ;;
  *) exit 0 ;;
esac
[ -f "$file" ] || exit 0

command -v python3 >/dev/null 2>&1 || exit 0

# Which project owns this page, and where the checker lives — two questions,
# answered separately. See owner.sh for why that separation is the whole fix.
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd)" || exit 0
# shellcheck source=owner.sh
. "$HERE/owner.sh" 2>/dev/null || exit 0
dir="$(cd "$(dirname "$file")" 2>/dev/null && pwd)" || exit 0
dg_owner "$dir" || exit 0

rel="${file#"$DG_ROOT"/}"
state="$DG_ROOT/.design-gate"
mkdir -p "$state" 2>/dev/null || exit 0

sha="$(python3 - "$file" <<'PY' 2>/dev/null
import hashlib, sys
print(hashlib.sha256(open(sys.argv[1], "rb").read()).hexdigest()[:16])
PY
)"
[ -n "$sha" ] || exit 0

# Record that this version of the file has not been through the full chain.
# Deduplicated so a burst of edits does not grow the file without bound.
if ! grep -qs "^$sha	" "$state/pending.tsv" 2>/dev/null; then
  printf '%s\t%s\n' "$sha" "$rel" >> "$state/pending.tsv"
fi

# The same two flags bin/design-review would derive from this DESIGN.md, so the
# hook and a manual run say the same thing about the same page. Anything else
# and the hook becomes a second opinion nobody asked for.
flags=()
[ -n "$DG_SKILL" ] && flags+=("--skill=$DG_SKILL")
[ -n "$DG_MONO" ] && flags+=("--allow-monolingual")

out="$(cd "$DG_ROOT" && python3 "$DG_VERIFY" "${flags[@]+"${flags[@]}"}" "$rel" 2>&1)"
rc=$?
[ "$rc" -eq 0 ] && exit 0

# A downstream project has no bin/design-review of its own, so name the one in
# the checkout the hook came from. A command the reader cannot paste is not
# advice.
review="bin/design-review"
[ -x "$DG_ROOT/bin/design-review" ] || review="$DG_SKY_ROOT/bin/design-review"

{
  echo "design gate · verify.py failed on $rel"
  echo ""
  printf '%s\n' "$out" | head -20
  echo ""
  echo "This is the structural check only — it needs no browser and cost 0.05s."
  echo "The rendered, accessibility and interaction checks have not run yet:"
  echo "  cd $DG_ROOT && $review $rel"
} >&2
exit 2
