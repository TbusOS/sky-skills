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

# Locate the design repo that owns this file: the nearest ancestor holding the
# checker. Editing an HTML file in an unrelated project must stay silent.
dir="$(cd "$(dirname "$file")" 2>/dev/null && pwd)" || exit 0
repo=""
while [ -n "$dir" ] && [ "$dir" != "/" ]; do
  if [ -f "$dir/skills/design-review/scripts/verify.py" ]; then repo="$dir"; break; fi
  dir="$(dirname "$dir")"
done
[ -n "$repo" ] || exit 0

command -v python3 >/dev/null 2>&1 || exit 0

rel="${file#"$repo"/}"
state="$repo/.design-gate"
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

out="$(cd "$repo" && python3 skills/design-review/scripts/verify.py "$rel" 2>&1)"
rc=$?
[ "$rc" -eq 0 ] && exit 0

{
  echo "design gate · verify.py failed on $rel"
  echo ""
  printf '%s\n' "$out" | head -20
  echo ""
  echo "This is the structural check only — it needs no browser and cost 0.05s."
  echo "The rendered, accessibility and interaction checks have not run yet:"
  echo "  cd $repo && bin/design-review $rel"
} >&2
exit 2
