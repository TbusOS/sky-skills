#!/usr/bin/env bash
# selftest.sh — feed the two hooks synthetic payloads and check what they do.
#
# A hook that is wrong is worse than no hook: it either blocks work for no
# reason or stays silent when it should not, and neither shows up until someone
# is already annoyed. The case that matters most here is the last one — a Stop
# hook that keeps refusing turns into a loop where the hook and the model repeat
# themselves until the harness force-overrides.

set -uo pipefail
PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH:-}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
POST="$HERE/post-edit.sh"
STOP="$HERE/stop.sh"
STATE="$REPO/.design-gate"
FIX="$REPO/skills/design-review/scripts/fixtures"

pass=0; fail=0
t() { if [ "$1" = "$2" ]; then echo "  ok   $3"; pass=$((pass+1));
      else echo "  FAIL $3 (expected $2, got $1)"; fail=$((fail+1)); fi; }

saved=""
if [ -d "$STATE" ]; then saved="$(mktemp -d)"; cp -R "$STATE/." "$saved/" 2>/dev/null; fi
cleanup() {
  rm -f "$FIX/selftest-hook-bad.html" "$FIX/selftest-hook-good.html"
  rm -rf "$STATE"
  if [ -n "$saved" ]; then mkdir -p "$STATE"; cp -R "$saved/." "$STATE/" 2>/dev/null; rm -rf "$saved"; fi
}
trap cleanup EXIT
rm -rf "$STATE"

# A page verify.py rejects: no viewport, a class no stylesheet defines.
cat > "$FIX/selftest-hook-bad.html" <<'HTML'
<!doctype html><html lang="en"><head><meta charset="utf-8"><title>bad</title>
<link rel="stylesheet" href="../../../anthropic-design/assets/anthropic.css"></head>
<body><section class="anth-hero"><div class="anth-container"><h1>Hi</h1>
<p class="anth-nonexistent-class">x</p></div></section></body></html>
HTML
cat > "$FIX/selftest-hook-good.html" <<'HTML'
<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>good</title>
<link rel="stylesheet" href="../../../anthropic-design/assets/anthropic.css"></head>
<body><section class="anth-hero"><div class="anth-container"><h1>Hi</h1></div></section></body></html>
HTML

edit_payload() { printf '{"tool_name":"Write","tool_input":{"file_path":"%s"},"cwd":"%s"}' "$1" "$REPO"; }
stop_payload()  { printf '{"hook_event_name":"Stop","stop_hook_active":%s,"cwd":"%s"}' "${1:-false}" "$REPO"; }

echo "post-edit"
out="$(edit_payload "$FIX/selftest-hook-bad.html" | bash "$POST" 2>&1)"; rc=$?
t "$rc" "2" "a page verify.py rejects exits 2"
case "$out" in *"verify.py failed"*) t y y "the failure text names the checker";; *) t n y "the failure text names the checker";; esac
case "$out" in *"bin/design-review"*) t y y "it says how to run the rest";; *) t n y "it says how to run the rest";; esac

out="$(edit_payload "$FIX/selftest-hook-good.html" | bash "$POST" 2>&1)"; rc=$?
t "$rc" "0" "a page verify.py accepts is silent"
n="$(grep -c . "$STATE/pending.tsv" 2>/dev/null || echo 0)"
t "$n" "2" "both writes are recorded as owing the full chain"

echo "post-edit · when it must stay out of the way"
out="$(printf '{"tool_input":{"file_path":"/tmp/notes.md"}}' | bash "$POST" 2>&1)"; rc=$?
t "$rc" "0" "a non-HTML file is ignored"
tmphtml="$(mktemp -d)/page.html"; printf '<html></html>' > "$tmphtml"
out="$(edit_payload "$tmphtml" | bash "$POST" 2>&1)"; rc=$?
t "$rc" "0" "an HTML file outside a design repo is ignored"
out="$(DESIGN_GATE_HOOK=off edit_payload "$FIX/selftest-hook-bad.html" | DESIGN_GATE_HOOK=off bash "$POST" 2>&1)"; rc=$?
t "$rc" "0" "DESIGN_GATE_HOOK=off disables it"
out="$(printf 'not json at all' | bash "$POST" 2>&1)"; rc=$?
t "$rc" "0" "malformed input does not break the session"

echo "stop"
out="$(stop_payload | bash "$STOP" 2>&1)"
case "$out" in *'"decision"'*'"block"'*) t y y "unverified files block the stop";; *) t n y "unverified files block the stop";; esac
case "$out" in *"selftest-hook-bad.html"*) t y y "the blocked reason names the file";; *) t n y "the blocked reason names the file";; esac

echo "stop · must not loop"
out2="$(stop_payload | bash "$STOP" 2>&1)"
case "$out2" in *'"block"'*) t n y "a second stop is silent — it blocks once, then clears";;
                *) t y y "a second stop is silent — it blocks once, then clears";; esac
edit_payload "$FIX/selftest-hook-good.html" | bash "$POST" >/dev/null 2>&1
out3="$(stop_payload true | bash "$STOP" 2>&1)"
case "$out3" in *'"block"'*) t n y "stop_hook_active=true is respected";;
                *) t y y "stop_hook_active=true is respected";; esac

echo "stop · a passing receipt clears the debt"
rm -rf "$STATE"
edit_payload "$FIX/selftest-hook-good.html" | bash "$POST" >/dev/null 2>&1
sha="$(python3 -c 'import hashlib,sys;print(hashlib.sha256(open(sys.argv[1],"rb").read()).hexdigest()[:16])' "$FIX/selftest-hook-good.html")"
printf '%s\t%s\n' "$sha" "skills/design-review/scripts/fixtures/selftest-hook-good.html" >> "$STATE/passed.tsv"
out4="$(stop_payload | bash "$STOP" 2>&1)"
case "$out4" in *'"block"'*) t n y "a file with a matching receipt is not reported";;
                *) t y y "a file with a matching receipt is not reported";; esac

echo "stop · editing a file invalidates its receipt"
rm -rf "$STATE"
printf '\n<!-- touched -->\n' >> "$FIX/selftest-hook-good.html"
edit_payload "$FIX/selftest-hook-good.html" | bash "$POST" >/dev/null 2>&1
printf '%s\t%s\n' "$sha" "skills/design-review/scripts/fixtures/selftest-hook-good.html" >> "$STATE/passed.tsv"
out5="$(stop_payload | bash "$STOP" 2>&1)"
case "$out5" in *'"block"'*) t y y "the old receipt no longer covers the edited file";;
                *) t n y "the old receipt no longer covers the edited file";; esac

echo ""
echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]
