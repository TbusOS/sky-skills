#!/usr/bin/env bash
# screenshot_selftest.sh — gate 5 produces an artefact nothing machine-checks;
# the only thing that reads it is a person, or a model standing in for one.
# That makes a wrong capture the most expensive kind of wrong here: it does not
# fail, it misleads. A blank block reads as "this section is missing its figure"
# and sends the reader off to fix something that was never broken.
#
# So both directions get a test: that content below the fold is actually in the
# image, and that a capture which still has holes says so out loud.

set -uo pipefail
PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH:-}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/../../.." && pwd)"
SHOT="$HERE/screenshot.mjs"
cd "$REPO"

pass=0; fail=0
t() { if [ "$1" = "$2" ]; then echo "  ok   $3"; pass=$((pass+1));
      else echo "  FAIL $3 (expected $2, got $1)"; fail=$((fail+1)); fi; }

command -v node >/dev/null 2>&1 || { echo "node is required"; exit 2; }
node -e "import('playwright')" >/dev/null 2>&1 || { echo "SKIP: playwright not installed"; exit 0; }

D="$REPO/.scratch/shot-selftest"
trap 'rm -rf "$D"' EXIT
mkdir -p "$D"

# A page built the way references/motion.md tells projects to build one: the
# element starts at opacity 0 and an observer adds the class on scroll. The
# spacer puts it far below the first viewport, which is the whole point — the
# bug only ever showed up below the fold.
cat > "$D/reveal.html" <<'EOF'
<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>reveal</title>
<link rel="stylesheet" href="../../skills/anthropic-design/assets/anthropic.css">
<style>.tall{height:1400px}</style></head>
<body>
<section class="anth-hero"><div class="anth-container"><h1>Above the fold</h1></div></section>
<section class="anth-section"><div class="anth-container tall"><p>spacer</p></div></section>
<section class="anth-section"><div class="anth-container">
  <figure class="anth-reveal"><figcaption>below the fold</figcaption></figure>
  <p class="anth-reveal">second revealed block</p>
</div></section>
<script>
const io = new IntersectionObserver((es) => es.forEach((e) => {
  if (e.isIntersecting) e.target.classList.add('is-visible');
}), { threshold: 0.1 });
document.querySelectorAll('.anth-reveal').forEach((el) => io.observe(el));
</script>
</body></html>
EOF

echo "content below the fold is in the image"
out="$(node "$SHOT" ".scratch/shot-selftest/reveal.html" "$D/shot.png" 2>&1)"; rc=$?
t "$rc" "0" "the capture succeeds"
t "$([ -s "$D/shot.png" ] && echo yes || echo no)" "yes" "and wrote a file"

# Pixels, not eyes. The tail band is where the revealed blocks live; before the
# scroll pass it measured exactly zero non-background pixels there.
ink="$(python3 - "$D/shot.png" <<'PY' 2>/dev/null
import sys
try:
    from PIL import Image
except ImportError:
    print("skip"); raise SystemExit
im = Image.open(sys.argv[1]).convert("L")
w, h = im.size
band = im.crop((0, max(0, h - 400), w, h))
print(sum(1 for p in band.getdata() if p < 240))
PY
)"
if [ "$ink" = "skip" ] || [ -z "$ink" ]; then
  echo "  --   pixel check skipped (no PIL)"
else
  t "$([ "$ink" -gt 500 ] && echo yes || echo no)" "yes" \
    "the bottom band has content in it, not blank ($ink dark pixels)"
fi
case "$out" in *"⚠"*) t n y "a page whose observer runs is not flagged";;
                  *) t y y "a page whose observer runs is not flagged";; esac

echo "a capture that still has holes says so"
# Same page with the observer removed: scrolling cannot help, the elements stay
# at opacity 0, and the image really is missing them. Silence here is the
# failure this whole file exists to prevent.
sed '/IntersectionObserver/,/^<\/script>/d' "$D/reveal.html" > "$D/nojs.html"
out2="$(node "$SHOT" ".scratch/shot-selftest/nojs.html" "$D/nojs.png" 2>&1)"; rc2=$?
t "$rc2" "0" "it still writes the file rather than failing the run"
case "$out2" in *"still at opacity 0"*) t y y "and warns that the capture has blank areas";;
                                     *) t n y "and warns that the capture has blank areas";; esac
case "$out2" in *"2 reveal element"*) t y y "and says how many";;
                                   *) t n y "and says how many";; esac

echo "it does not cry wolf on this repo's own pages"
for page in index.html docs/INSTALL.html demos/glass-design/index.html; do
  o="$(node "$SHOT" "$page" "$D/repo.png" 2>&1)"
  case "$o" in *"⚠"*) t n y "$page is clean";; *) t y y "$page is clean";; esac
done

echo ""
echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]
