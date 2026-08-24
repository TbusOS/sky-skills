#!/usr/bin/env python3
"""
count-check.py — repo-wide verdict on count-bearing numbers.

facts.mjs guards a fixed set of carrier phrasings on a fixed set of surfaces.
This script is the wide net behind it (known-bugs §1.53): every tracked
*.html / *.md file, word AND digit number forms, prose AND SVG <text> AND
attribute values (aria-label / content / alt / title / data-label-*), with
the previous and next line joined into the match window so a number in one
element and its label in the next are seen together. Each carrier phrase is
bound to a truth derived from disk (facts.mjs --json); only disagreements
are printed.

Usage:
  python3 skills/design-review/scripts/count-check.py            # whole repo
  python3 skills/design-review/scripts/count-check.py <path>...  # given files
  python3 skills/design-review/scripts/count-check.py --list     # truths + exclusions
  python3 skills/design-review/scripts/count-check.py --probe    # self-test only

Exit code:
  0 — probe passed and every carrier phrase agrees with disk
  1 — at least one count disagrees (every disagreement is printed)
  2 — the tool itself is broken (probe failed / facts.mjs unreachable / bad CLI)

The self-probe runs BEFORE every scan (known-bugs §7.10: a check that has
never caught an injected fake is dead code). It feeds the matching engine a
synthetic document carrying a wrong count in every form this class has taken
— including the three structural holes §1.53's first inline scanner shipped
with (first-candidate-only `break`, numeral tables starting at four/四, and
a `\\w` lookahead that killed every zh numeral+measure-word pair) — and
refuses to scan if any injected fake survives or a true document is flagged.

Deliberate exclusions are never silent: path-level ones are listed in
RECORD_PATHS, phrase-level ones in EXCLUSIONS, both with reasons, both
printed by --list. Line-level one-offs reuse facts.mjs's
`facts-ignore: <reason>` comment (same line or the line above).
"""
from __future__ import annotations
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))

# ---------------------------------------------------------------- numbers ---

EN_NUM = {
    "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7,
    "eight": 8, "nine": 9, "ten": 10, "eleven": 11, "twelve": 12,
    "thirteen": 13, "fourteen": 14, "fifteen": 15, "sixteen": 16,
    "seventeen": 17, "eighteen": 18, "nineteen": 19, "twenty": 20,
}
for _i, _w in enumerate(
        ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine"], 21):
    EN_NUM[f"twenty-{_w}"] = _i

ZH_DIGIT = {"二": 2, "两": 2, "三": 3, "四": 4, "五": 5,
            "六": 6, "七": 7, "八": 8, "九": 9}
ZH_NUM = dict(ZH_DIGIT)
ZH_NUM["十"] = 10
for _c, _v in ZH_DIGIT.items():
    if _c != "两":
        ZH_NUM[f"十{_c}"] = 10 + _v
        ZH_NUM[f"二十{_c}"] = 20 + _v
ZH_NUM["二十"] = 20

EN_WORDS = "|".join(sorted(EN_NUM, key=len, reverse=True))
# 二十X before 十X before the single digits, so 二十四 never yields 十四 or 四.
ZH_WORDS = "二十[一二两三四五六七八九]?|十[一二两三四五六七八九]?|[二两三四五六七八九]"

# The lookarounds block only ASCII word characters on purpose: Python's \w
# counts CJK as word characters, and using it there is what silenced every
# 「中文数词 + 量词」 pair (九种 / 四道 / 三道) in §1.53's first scanner.
# Mid-numeral cuts (二十四 → 十四) are blocked by the zh-numeral lookbehind
# on the full slot built in carriers(); DIGITS is the digits-only slot for
# carriers that must not accept word forms (SVG stat labels, N/N pairs).
DIGITS = r"(?<![0-9A-Za-z_.+-])((?!0\d)\d{1,3})(?![0-9A-Za-z_.%+-])"


def to_number(token: str) -> int | None:
    t = token.strip()
    if re.fullmatch(r"\d{1,3}", t):
        return int(t)
    return EN_NUM.get(t.lower(), ZH_NUM.get(t))


# ----------------------------------------------------------------- truths ---

def derive_truths() -> dict[str, int]:
    """Ground truth comes from facts.mjs, never from this file."""
    try:
        run = subprocess.run(
            ["node", os.path.join(HERE, "facts.mjs"), "--json"],
            capture_output=True, text=True, cwd=REPO, timeout=60)
        data = json.loads(run.stdout)
    except (OSError, ValueError, subprocess.TimeoutExpired) as err:
        print(f"count-check: cannot derive truths from facts.mjs --json: {err}",
              file=sys.stderr)
        sys.exit(2)
    t = data["truth"]
    fam = t["skills"]["families"]
    return {
        "total": t["skills"]["total"],
        "design": t["skills"]["design"],
        "systems": fam["systems"],
        "harness": fam["harness"],
        "nondesign": t["skills"]["total"] - t["skills"]["design"],
        "canonical": t["canonical"]["total"],
        "kb": t["knownBugs"]["total"],
    }


# --------------------------------------------------------------- carriers ---
# Each carrier binds one phrasing to one truth. Every capturing group in the
# pattern is a number slot; every captured number must equal the truth.
# Narrow on purpose (facts.mjs's reasoning): a loose pattern that cries wolf
# kills the gate faster than a missed phrasing does.

def carriers() -> list[tuple[str, str, re.Pattern]]:
    # Same boundary guards as NUM: without them a slot matches the 2 in
    # "9+2" or the tail of a longer token.
    n = (r"(?<![0-9A-Za-z_.+-])(?<![一二两三四五六七八九十])("
         + EN_WORDS + "|" + ZH_WORDS + r"|(?!0\d)\d{1,3})(?![0-9A-Za-z_.%+-])")
    en_w = r"(?<![0-9A-Za-z_.+-])(" + EN_WORDS + r")(?![0-9A-Za-z_.%+-])"
    d = DIGITS
    I = re.IGNORECASE
    # Order is load-bearing: the first carrier to match a number claims it,
    # so the specific ones (另有 N 个技能 → nondesign) must run before the
    # generic ones (N 个技能 → total) or the generic binding wins wrongly.
    rows = [
        # -- skills that are not design voices -----------------------------
        ("nondesign-zh",   "nondesign", rf"(?:另有|还有)\s*{n}\s*个技能", 0),
        ("nondesign-more", "nondesign", rf"\b{n}\s+more\s+skills\b", I),
        # -- total skills shipped --------------------------------------
        ("total-all",      "total", rf"\ball\s+{n}\s+skills\b(?![/-])", I),
        ("total-total",    "total", rf"\b{n}\s+skills\s+total\b", I),
        ("total-of-the",   "total", rf"\bof\s+the\s+{n}\s+skills\b", I),
        ("total-in-repo",  "total",
         rf"\b{n}\s+(?:focused\s+)?skills\s+in\s+(?:one\s+)?repo", I),
        ("total-cc",       "total", rf"\b{n}\s+Claude\s+Code\s+skills", I),
        ("total-turn-w",   "total",
         rf"\b{en_w}\s+skills\b(?=\s*(?:[.,;:·—\"“”]|and\b))", I),
        ("total-turn-d",   "total", rf"\b{d}\s+skills\s*[.·]", 0),
        ("total-svg-cap",  "total", rf"\bSKILLS\s+{d}\b", 0),
        ("total-zh-all",   "total", rf"全部\s*{n}\s*个\s*skill", 0),
        # 「5 个 skill，其余的…」counts this page's own sections, so a
        # comma is NOT a turn here (facts.mjs draws the same line).
        ("total-zh-turn",  "total", rf"{n}\s*个\s*skill\s*(?=。|:|：|一张表|分三族)", 0),
        ("total-zh-jineng", "total", rf"{n}\s*个技能", 0),
        ("total-handbook", "total", rf"{n}\s*本手册", 0),
        # -- design skills ----------------------------------------------
        ("design-en",      "design",
         rf"\b{n}\s+design\s+(?:skills?|aesthetics?|generators?|voices?)\b", I),
        ("design-aesth",   "design",
         rf"\b{n}\s+(?:page-?design\s+|brand\s+)?aesthetics\b", I),
        ("design-voices",  "design", rf"\b{n}\s+(?:design\s+)?voices\b", I),
        ("design-gens",    "design", rf"\bthe\s+{n}\s+generators\b", I),
        ("design-gen-sk",  "design", rf"\b{n}\s+generator\s+skills\b", I),
        ("design-zh-voice", "design", rf"{n}\s*种(?:设计)?声音", 0),
        ("design-zh-aesth", "design", rf"{n}\s*种(?:设计|品牌)?美学", 0),
        ("design-zh-skill", "design",
         rf"{n}\s*个设计(?:类)?\s*(?:skill|生成器|generator|技能)", 0),
        ("design-zh-en",   "design", rf"{n}\s*个\s*design\s*skill", 0),
        ("design-zh-gen",  "design", rf"{n}\s*个生成器", 0),
        ("design-svg-cap", "design", rf"\bAESTHETICS\s+{d}\b", 0),
        ("design-band",    "design",
         rf"(?:Design\s+generators|设计生成器)\s*·\s*{d}", 0),
        ("design-primer",  "design", rf"{n}\s*本教画页面", 0),
        # -- systems & content family ------------------------------------
        ("systems-en",     "systems",
         rf"\b{n}\s+systems\s*(?:&|and|/)\s*content", I),
        ("systems-zh",     "systems", rf"{n}\s*个系统\s*/\s*内容", 0),
        ("systems-band",   "systems",
         rf"(?:Content\s*/\s*systems|内容\s*/\s*系统)\s*·\s*{d}", I),
        # -- harness family ----------------------------------------------
        ("harness-en",     "harness",
         rf"\b{n}\s+harness\s*(?:&|and)\s*workflow\s+skills", I),
        ("harness-band",   "harness",
         rf"(?:Harness\s+tooling|Harness\s*工具)[^·]{{0,80}}·\s*{d}", I),
        # -- canonical library --------------------------------------------
        ("canonical-frac", "canonical",
         rf"(?<![\d./]){d}\s*/\s*{d}(?![\d./])", 0,
         r"canonical|page-?types?|范本|覆盖|matrix"),
        ("canonical-of",   "canonical", rf"\bcomplete\s+at\s+{n}\s+of\s+{n}\b", I),
        ("canonical-ship", "canonical", rf"\ball\s+{n}\s+shipped\b", I),
        ("canonical-zh",   "canonical", rf"全部\s*{n}\s*张(?:交付|落库)", 0),
        ("canonical-fanben", "canonical", rf"{n}\s*张范本", 0),
        ("canonical-per",  "canonical",
         rf"\b{n}\s+of\s+them[^.|]{{0,40}}per\s+design\s+voice", I),
        # -- known-bugs catalogue ------------------------------------------
        ("kb-en",          "kb", rf"\b{d}\s+known-bugs?\b(?!\s+rows?)", I),
        ("kb-zh-shoulu",   "kb", rf"已收录\s*{n}\s*条", 0),
        ("kb-zh-tiao",     "kb", rf"{n}\s*条\s*known-bugs?", 0),
        ("kb-catalogued",  "kb", rf"\b{d}\s+bugs\s+catalogued", I),
        ("kb-zh-daquan",   "kb", rf"{n}\s*条\s*bug\s*大全", 0),
        ("kb-pitfall",     "kb", rf"(?:坑的记录|pitfall\s+log)\s*·\s*{n}", I),
        ("kb-zh-keng",     "kb", rf"{n}\s*条坑", 0),
    ]
    out = []
    for row in rows:
        name, key, pat, flags = row[0], row[1], row[2], row[3]
        ctx = row[4] if len(row) > 4 else None
        out.append((name, key, re.compile(pat, flags),
                    re.compile(ctx, re.IGNORECASE) if ctx else None))
    return out


# -------------------------------------------------------------- exclusions ---
# The four classes round 2 documented, each named with its reason. A number
# inside any of these spans is never judged. Greppable, never silent.

EXCLUSIONS = [
    ("ordinal",
     r"第\s*[一二两三四五六七八九十\d]{1,4}|\b\d{1,3}\s*(?:st|nd|rd|th)\b",
     "序数记录历史位置(第 13 个 skill),不描述现状 — facts.mjs 同规"),
    ("leftover",
     r"(?:其余|其它|其他|另外|剩下)\s*的?\s*(?:[一二两三四五六七八九十]{1,3}|\d{1,3})"
     r"|\b(?:the\s+)?other\s+(?:" + EN_WORDS + r"|\d{1,3})\b",
     "余数(其余 8 个 / the other eight)的基数因上下文而异,不绑总数"),
    ("per-skill",
     r"(?:ships\s+|随附\s*|各\s*)(?:\d{1,3}|[一二两三四五六七八九十]{1,3})\s*"
     r"(?:canonical|个?范本|张|件)"
     r"|\d{1,3}\s*/\s*\d{1,3}\s*(?:页|零)"
     r"|\b(?:anthropic|apple|ember|sage|glass|eclat|lectern|atelier|primer)\s*\(\d{1,2}\)",
     "每套 skill 自己的数(Ships 3 canonical page-types / atelier (5))不是仓级总数"),
    ("roadmap-renderings",
     r"(?:rendered\s+)?in\s+(?:all\s+)?five\s+aesthetics"
     r"|五种美学各[^，。]{0,8}版"
     r"|rendered\s+in\s+five\s+of\s+them|用其中五种各渲一版",
     "路线图渲染了五版(five aesthetics)——数的是渲染份数,不是设计 skill 数"),
]

# Files whose numbers are dated records: rewriting them would falsify the
# record rather than correct it (facts.mjs excludes dated specs the same way).
RECORD_PATHS = [
    ("docs/superpowers/",
     "dated plans and specs — a record of when they were written"),
    ("docs/design-mr-gated-dual-repo.md",
     "dated spec — facts.mjs excludes it for the same reason"),
    ("docs/KERNEL-REPOS-SURVEY.html",
     "counts skills in the upstream anthropics/skills repo, not this one"),
    ("skills/design-review/references/known-bugs.md",
     "quotes wrong numbers as examples of the bugs it catalogues"),
    ("/references/canonical/*.md",
     "dated per-page decision records (canonical 20 → 21 …)"),
]

IGNORE_RE = re.compile(r"facts-ignore:\s*(\S.*?)\s*(?:-->|$)")

ATTR_RE = re.compile(
    r'(?:aria-label|content|alt|title|data-label[\w-]*)="([^"]*)"')
TAG_RE = re.compile(r"<[^>]+>")


def is_record_path(rel: str) -> str | None:
    for prefix, why in RECORD_PATHS:
        if prefix.startswith("/"):
            pat = prefix.strip("/").replace(".", r"\.").replace("*", "[^/]*")
            if re.search("/" + pat + "$", "/" + rel):
                return why
        elif rel.startswith(prefix) or rel == prefix.rstrip("/"):
            return why
    return None


def visible(line: str) -> str:
    """Rendered text plus the attribute values a reader also sees."""
    attrs = " ".join(ATTR_RE.findall(line))
    text = TAG_RE.sub(" ", line).replace("&amp;", "&")
    text = re.sub(r"&[a-z]+;", " ", text)
    return f"{text} {attrs}" if attrs else text


# ----------------------------------------------------------------- engine ---

def scan_lines(raw: list[str], truth: dict, rules):
    """Yield (line_no, kind, name, claimed, expected, excerpt, why)."""
    vis = [visible(l) for l in raw]
    excl = [(name, re.compile(pat, re.IGNORECASE)) for name, pat, _ in EXCLUSIONS]
    for i, cur in enumerate(vis):
        prev = vis[i - 1] if i else ""
        nxt = vis[i + 1] if i + 1 < len(vis) else ""
        joined = f"{prev} {cur} {nxt}"
        lo, hi = len(prev) + 1, len(prev) + 1 + len(cur)
        claimed_spans = [m.span() for _, rx in excl for m in rx.finditer(joined)]
        seen: set[tuple[int, str]] = set()
        for name, key, rx, ctx in rules:
            for m in rx.finditer(joined):
                for g in range(1, (m.lastindex or 0) + 1):
                    tok = m.group(g)
                    if tok is None:
                        continue
                    start, end = m.span(g)
                    if not (lo <= start < hi):
                        continue          # belongs to the neighbour line's pass
                    if (start, tok) in seen:
                        continue
                    if any(a <= start < b for a, b in claimed_spans):
                        continue          # inside a named exclusion
                    if ctx and not ctx.search(
                            joined[max(0, start - 60):end + 60]):
                        continue          # carrier requires nearby context
                    val = to_number(tok)
                    if val is None:
                        continue
                    # A correct match still claims the span: 还有 13 个技能 is
                    # right as nondesign and must not fall through to the
                    # generic total carrier as a wrong 13 ≠ 22.
                    seen.add((start, tok))
                    if val == truth[key]:
                        continue
                    why = None
                    for cand in (raw[i], raw[i - 1] if i else None):
                        got = IGNORE_RE.search(cand) if cand else None
                        if got:
                            why = got.group(1)
                            break
                    excerpt = " ".join(
                        joined[max(0, start - 34):end + 34].split())[:96]
                    yield (i + 1, "suppressed" if why else "violation",
                           name, val, truth[key], excerpt, why)


def tracked_files() -> list[str]:
    run = subprocess.run(["git", "-C", REPO, "ls-files", "*.html", "*.md"],
                         capture_output=True, text=True)
    if run.returncode != 0:
        print("count-check: git ls-files failed", file=sys.stderr)
        sys.exit(2)
    return [f for f in run.stdout.split("\n") if f]


# ------------------------------------------------------------------ probe ---

def en_word(v: int) -> str:
    for w, n in EN_NUM.items():
        if n == v:
            return w
    return str(v)


def probe(truth: dict, rules) -> list[str]:
    """Inject a fake wrong number in every form this class has taken.

    Returns a list of failure messages; empty means the probe passed.
    """
    w = {k: v + 1 for k, v in truth.items()}          # guaranteed wrong
    w2 = {k: v + 2 for k, v in truth.items()}
    bad = f"""
<p>Same story, {en_word(w['design'])} page-design aesthetics. All {w['total']} skills.</p>
<p>{w['kb']} known-bugs. 覆盖 {w['canonical']}/{w['canonical']} canonical。已收录 {w2['kb']} 条。</p>
<p>全部 {w['total']} 个 skill。{'三' if truth['design'] != 3 else '四'}种声音。</p>
<text>SKILLS {w2['total']}</text> <text>AESTHETICS {w2['design']}</text>
<p>{en_word(w['design'])} design skills and {w2['design']} design skills sit on one line.</p>
<div aria-label="{w2['design']} design skills"></div>
<text>{w['canonical']} / {w['canonical']}</text>
<text>page-types covered</text>
<p>{w['design']} design generators, {w['systems']} systems / content utilities.</p>
<p>另有 {w['nondesign']} 个技能。{w['harness']} harness &amp; workflow skills.</p>
""".split("\n")
    zh_probe_val = 3 if truth["design"] != 3 else 4
    hits = [(r[2], r[3]) for r in scan_lines(bad, truth, rules)
            if r[1] == "violation"]
    need = [
        ("design-aesth", w["design"]), ("total-all", w["total"]),
        ("kb-en", w["kb"]), ("canonical-frac", w["canonical"]),
        ("kb-zh-shoulu", w2["kb"]), ("total-zh-all", w["total"]),
        ("design-zh-voice", zh_probe_val),        # low numeral + zh 量词 hole
        ("total-svg-cap", w2["total"]), ("design-svg-cap", w2["design"]),
        ("design-en", w["design"]), ("design-en", w2["design"]),  # both on ONE
        # line — the anti-`break` regression; plus the attribute-value form:
        ("systems-en", w["systems"]), ("nondesign-zh", w["nondesign"]),
        ("harness-en", w["harness"]),
    ]
    fails = [f"probe: injected fake not caught: {name} claiming {val}"
             for name, val in need if (name, val) not in hits]
    if hits.count(("design-en", w2["design"])) < 2:
        fails.append("probe: second candidate on a shared line not reported "
                     "(attribute value or per-line dedupe hole)")
    good = [
        f"<p>All {truth['total']} skills. {truth['design']} design skills.</p>",
        f"<p>覆盖 {truth['canonical']}/{truth['canonical']} canonical。"
        f"已收录 {truth['kb']} 条。第 13 个 skill。其余 8 个。</p>",
        "<p>rendered in all five aesthetics — atelier (5) and primer (3)</p>",
    ]
    false_alarms = [r for r in scan_lines(good, truth, rules)
                    if r[1] == "violation"]
    fails += [f"probe: true statement flagged: {r[2]} «{r[5]}»"
              for r in false_alarms]
    return fails


# ------------------------------------------------------------------- main ---

def main() -> int:
    args = sys.argv[1:]
    want_list = "--list" in args
    want_probe = "--probe" in args
    paths = [a for a in args if not a.startswith("--")]
    truth = derive_truths()
    rules = carriers()

    if want_list:
        print("truths from facts.mjs --json:")
        print("  " + " · ".join(f"{k} {v}" for k, v in truth.items()))
        print(f"named exclusions ({len(EXCLUSIONS)}):")
        for name, _, why in EXCLUSIONS:
            print(f"  · {name} — {why}")
        print(f"record paths, never scanned ({len(RECORD_PATHS)}):")
        for prefix, why in RECORD_PATHS:
            print(f"  · {prefix} — {why}")
        return 0

    fails = probe(truth, rules)
    if fails:
        for f in fails:
            print(f"  ✗ {f}")
        print("✗ count-check's own probe failed — fix the tool before "
              "trusting any scan")
        return 2
    print("self-probe: ✓ every injected fake caught, true statements pass")
    if want_probe:
        return 0

    files = paths or tracked_files()
    skipped, suppressed, violations = [], [], []
    for rel in files:
        why = is_record_path(rel)
        if why:
            skipped.append(rel)
            continue
        abspath = rel if os.path.isabs(rel) else os.path.join(REPO, rel)
        with open(abspath, encoding="utf-8", errors="replace") as fh:
            raw = fh.read().split("\n")
        for row in scan_lines(raw, truth, rules):
            (suppressed if row[1] == "suppressed" else violations).append(
                (rel,) + row)

    print("truths: " + " · ".join(f"{k} {v}" for k, v in truth.items()))
    print(f"scanned {len(files) - len(skipped)} file(s); "
          f"{len(skipped)} record file(s) excluded by RECORD_PATHS")
    if suppressed:
        print(f"suppressed by facts-ignore ({len(suppressed)}):")
        for rel, line, _, name, val, exp, ex, why in suppressed:
            print(f"  {rel}:{line}  «{ex}» — {why}")
    if violations:
        print(f"\nfalse counts ({len(violations)}):")
        for rel, line, _, name, val, exp, ex, _w in violations:
            print(f"  {rel}:{line}  {name:<16} says {val}, disk says {exp}"
                  f"   «{ex}»")
        return 1
    print("✓ no false counts — every carrier phrase agrees with disk")
    return 0


if __name__ == "__main__":
    sys.exit(main())
