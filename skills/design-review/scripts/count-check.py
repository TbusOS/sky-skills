#!/usr/bin/env python3
"""
count-check.py — repo-wide verdict on count-bearing numbers.

facts.mjs guards a fixed set of carrier phrasings on a fixed set of surfaces.
This script is the wide net behind it (known-bugs §1.53): every tracked
*.html / *.md / *.mjs / *.js / *.py file plus bin/ scripts, word AND digit
number forms, prose AND SVG <text> AND attribute values (aria-label /
content / alt / title / data-label-*), with the previous and next line
joined into the match window so a number in one element and its label in
the next are seen together. Each carrier phrase is bound to a truth derived
from disk (facts.mjs --json), and gate counts are bound to the gate model
defined ONCE in skills/design-review/SKILL.md (the machine-readable
`gate-model:` marker); only disagreements are printed.

Beyond per-line carriers, three model-aware checks cover the
number-vs-adjacent-list class no single-line pattern can see:
  · gate-enum   — a gate-count claim next to an enumeration of the gate
                  scripts must claim the model's count AND enumerate the
                  model's full mechanical set (a 四道 heading over three
                  commands, a "4 Gates" card listing the old three + critic)
  · critic-as-gate — the LLM critic labelled 第 N 道 / gate N / [N/N] /
                  "third gate" (the model rules the critic OUTSIDE the four)
  · roster-subset — a design-skill count over an all-caps skin roster that
                  names fewer skins with no "+N" marker

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

# The gate model is defined ONCE, in skills/design-review/SKILL.md, as a
# machine-readable marker. This script parses it rather than hardcoding a
# gate count — change the model there and the probe here must still pass.
GATE_MODEL_SRC = os.path.join("skills", "design-review", "SKILL.md")
GATE_MODEL_RE = re.compile(
    r"<!--\s*gate-model:\s*mechanical\s*=\s*([^;]+);"
    r"\s*optional\s*=\s*([^;]+);\s*taste\s*=\s*([^>]+?)\s*-->")


def gate_model() -> dict:
    try:
        text = open(os.path.join(REPO, GATE_MODEL_SRC), encoding="utf-8").read()
    except OSError as err:
        print(f"count-check: cannot read {GATE_MODEL_SRC}: {err}", file=sys.stderr)
        sys.exit(2)
    m = GATE_MODEL_RE.search(text)
    if not m:
        print(f"count-check: the gate-model marker is missing from "
              f"{GATE_MODEL_SRC} — the single source of truth for gate "
              f"counts. Restore the '<!-- gate-model: ... -->' comment.",
              file=sys.stderr)
        sys.exit(2)
    return {
        "mechanical": [s.strip() for s in m.group(1).split(",") if s.strip()],
        "optional": [s.strip() for s in m.group(2).split(",") if s.strip()],
        "taste": m.group(3).strip(),
    }


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
        "gates": len(gate_model()["mechanical"]),
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
        ("design-zh-aesth", "design", rf"{n}\s*种(?:页面设计|设计|品牌)?美学", 0),
        ("design-zh-style", "design", rf"{n}\s*[种个]\s*风格", 0),
        ("design-zh-skill", "design",
         rf"{n}\s*个设计(?:类)?\s*(?:skill|生成器|generator|技能)", 0),
        ("design-zh-en",   "design", rf"{n}\s*个\s*design\s*skill", 0),
        ("design-zh-gen",  "design", rf"{n}\s*个生成器", 0),
        ("design-svg-cap", "design", rf"\bAESTHETICS\s+{d}\b", 0),
        ("design-band",    "design",
         rf"(?:Design\s+generators|设计生成器)\s*·\s*{d}", 0),
        ("design-primer",  "design", rf"{n}\s*本教画页面", 0),
        # -- gate counts (truth: the gate model in design-review/SKILL.md) --
        ("gates-zh",       "gates", rf"{n}\s*道\s*(?:机械|机器)\s*(?:检查|审查)", 0),
        # plain N 道检查 needs design-review context nearby: gated-dual-clone
        # legitimately has its own 三道(安全)检查 with none of these tokens.
        ("gates-zh-plain", "gates", rf"{n}\s*道\s*(?:检查|审查)", 0,
         r"design-review|dr-cli|verify|visual-audit|axe|screenshot"),
        ("gates-en",       "gates",
         rf"\b{n}\s+(?:machine|mechanical|review)\s+gates\b", I),
        ("gates-green",    "gates", rf"\b{n}\s+gates\s+green\b", I),
        ("gates-run",      "gates", rf"\brun\s+the\s+{n}\s+gates\b", I),
        ("gates-all",      "gates", rf"\ball\s+{n}\s+gates\b", I),
        ("gates-dr",       "gates",
         rf"\b{n}\s+`?bin/design-review`?\s+(?:mechanical\s+)?gates", I),
        # own slot: the shared one's trailing lookahead blocks '-', which is
        # exactly the joint this form hinges on ("three-gate design-review")
        ("gates-hyphen",   "gates",
         rf"(?<![0-9A-Za-z_.])((?:{EN_WORDS})|(?!0\d)\d{{1,2}})-gate\b", I),
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
        # 「当前 N 条，…」 and 「known-bugs.md(N 条,每条写…)」 — the two forms
        # that let a stale 82 sit next to a correct 83 in the SAME file
        # (index.html EN said 83 / zh said 82; SKILL.md:164 vs :215). 当前 N 条
        # is generic enough to need the known-bugs context guard.
        ("kb-zh-dangqian", "kb", rf"当前\s*{n}\s*条", 0, r"known-bugs|bug"),
        ("kb-zh-md-paren", "kb",
         rf"known-bugs(?:\.md)?`?\s*[(（]\s*{n}\s*条", I),
        ("kb-en-pitfall",  "kb", rf"\b{d}\s+recorded\s+pitfalls?", I),
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
    ("skills/design-review/scripts/facts.mjs",
     "its header records the drift history (44/44 …) that motivated the gate"),
    ("skills/design-review/scripts/coverage.mjs",
     "its header records the drift history (27/40, 44/44) that motivated it"),
    ("skills/design-review/scripts/axe-audit.mjs",
     "its PROMOTED comments carry the dated 2026-08-14 / 2026-08-25 element "
     "counts — numbers about axe findings, not about this repo's rosters, so "
     "no truth here can match them. NOTE: those comments also carry a LIVE "
     "claim (84 blocking across seven glass surfaces, known-bugs §6.6); this "
     "exclusion hides it, so re-verify it by hand when §6.6 changes"),
    ("skills/design-review/scripts/count-check.py",
     "quotes wrong numbers as exclusion patterns and probe material — its "
     "correctness is proven by the probe, not by scanning its source"),
    ("/references/canonical/*.md",
     "dated per-page decision records (canonical 20 → 21 …) — README.md is "
     "live instructions and IS scanned"),
]

# Findings on these EXACT lines are already handed to another task: printed
# as pending, never silently dropped, never failing this run. The pattern is
# load-bearing — a bare path would downgrade every FUTURE lie in that file
# too (probed: three unrelated fakes injected into sprint-contract.mjs must
# exit 1). Kinds:
#   auto   — the scanner detects the line itself; when its pattern stops
#            matching anything on a full scan the entry is spent and the run
#            says so — delete it then.
#   manual — the scanner CANNOT see the line, so the entry is an honest
#            hand-off note rather than a detection. The worked example was
#            cross-skill-rules.md:140's 「三道检查的命令」, whose tri-line
#            context window held no gate token; that line was corrected on
#            2026-08-25 and the entry retired, so the example is history, not
#            a live case. Reach for this kind when a claim is real but sits
#            outside every carrier's reach.
#
# Empty on purpose since 2026-08-25: both entries were paid. sprint-contract.mjs
# now models the four mechanical checks in its `gates` array and in every
# rendered sentence, and cross-skill-rules.md:140 now names all four commands.
PENDING = []


def pending_reason(rel: str, raw_line: str) -> tuple[int, str] | tuple[None, None]:
    for idx, (path, pat, why, _kind) in enumerate(PENDING):
        if rel == path and re.search(pat, raw_line):
            return idx, why
    return None, None

IGNORE_RE = re.compile(r"facts-ignore:\s*(\S.*?)\s*(?:-->|$)")

ATTR_RE = re.compile(
    r'(?:aria-label|content|alt|title|data-label[\w-]*)="([^"]*)"')
TAG_RE = re.compile(r"<[^>]+>")


def is_record_path(rel: str) -> str | None:
    # canonical README.md files are live instructions, not dated records —
    # they are scanned even though their sibling decision .md files are not.
    if rel.endswith("/references/canonical/README.md"):
        return None
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

def _ignore_why(raw: list[str], i: int) -> str | None:
    for cand in (raw[i], raw[i - 1] if i else None):
        got = IGNORE_RE.search(cand) if cand else None
        if got:
            return got.group(1)
    return None


SKIN_RE = re.compile(
    r"\b(ANTHROPIC|APPLE|EMBER|SAGE|GLASS|ECLAT|LECTERN|ATELIER|PRIMER)\b")
CAPS_LINE_RE = re.compile(r"^[\sA-Z0-9·&+/|-]+$")
# The EN word-form ordinal ("the third gate is the design-critic") was invisible
# until 2026-08-25 — the alternation only knew 第 N 道 / gate N / [N/N], so the
# critic sat mislabelled in .claude/agents/design-critic.md through a whole
# branch. Probe-locked below (§7.10: a caught bug becomes a check with a probe).
# The ordinal must still come BEFORE the critic word: the reverse order is how
# the TRUE statement is written ("critic 不是第四道机械检查"), and accepting it
# would flag the correct phrasing — that true form is in the probe's good list.
CRITIC_AS_GATE_RE = re.compile(
    r"(?:第\s*[一二两三四五六七八九十\d]+\s*道|\bgate\s+\d\b|\[\d+/\d+\]"
    r"|\b(?:first|second|third|fourth|fifth)\s+gate\b)"
    r"[^\n|]{0,24}?(?:critic|口味评审|taste\s+judge)", re.I)


# How each mechanical gate may be named inside an enumeration (zh docs write
# screenshot.mjs as 截图 and axe as axe-core); keys are script base names.
GATE_ALIASES = {
    "verify": ["verify", "结构"],
    "visual-audit": ["visual-audit", "渲染"],
    "axe-audit": ["axe", "可达性"],
    "screenshot": ["screenshot", "截图"],
    "pixel-gate": ["pixel"],
}


def special_findings(vis, raw, truth, model):
    """The number-vs-adjacent-list class no single-line carrier can see."""
    mech = [g.split(".")[0].lower() for g in model["mechanical"]]
    # 第-lookbehinds keep ordinals (第五道机械检查 = the optional 5th) out;
    # the carrier pass gets this for free from the EXCLUSIONS span-claim.
    n_any = (r"(?<![0-9A-Za-z_.+-])(?<![一二两三四五六七八九十])(?<!第)(?<!第 )("
             + EN_WORDS + "|" + ZH_WORDS + r"|(?!0\d)\d{1,2})(?![0-9A-Za-z_.%+-])")
    # For the bare-EN form only word numerals claim: digits next to "gates"
    # are routinely something else's number ("Wave 2 gates · …" on a dated
    # timeline). Qualified forms (machine/mechanical/review) accept digits.
    claim_re = re.compile(
        rf"{n_any}\s*道\s*(?:机械|机器)?\s*(?:检查|审查)"
        rf"|{n_any}\s+(?:machine|mechanical|review)\s+gates\b"
        rf"|(?<![0-9A-Za-z_.+-])({EN_WORDS})\s+gates\b", re.I)
    for i, cur in enumerate(vis):
        why = _ignore_why(raw, i)
        m = CRITIC_AS_GATE_RE.search(cur)
        if m:
            ex = " ".join(cur[max(0, m.start() - 8):m.end() + 8].split())[:96]
            yield (i + 1, "suppressed" if why else "violation",
                   "critic-as-gate", 0, truth["gates"],
                   f"critic labelled as a numbered gate — the model rules it "
                   f"outside the mechanical four «{ex}»", why)
        for m in claim_re.finditer(cur):
            tok = m.group(1) or m.group(2) or m.group(3)
            val = to_number(tok) if tok else None
            if val is None:
                continue
            # ≥3 gate names within 14 lines = a real enumeration; two can
            # be an incidental mention ("never edit verify.py/visual-audit").
            window = " ".join(vis[i:i + 14]).lower()
            found = {g for g in mech
                     if any(a in window for a in GATE_ALIASES.get(g, [g]))}
            if len(found) < 3:
                continue
            missing = [g for g in mech if g not in found]
            if val != truth["gates"]:
                yield (i + 1, "suppressed" if why else "violation",
                       "gate-enum-count", val, truth["gates"],
                       " ".join(cur.split())[:96], why)
            if missing:
                yield (i + 1, "suppressed" if why else "violation",
                       "gate-enum-missing", val, truth["gates"],
                       f"gate enumeration under the claim is missing: "
                       + ", ".join(missing), why)
    yield from roster_findings(vis, raw, truth)


def roster_findings(vis, raw, truth):
    """A design-skill count over an all-caps skin roster naming fewer skins."""
    i = 0
    while i < len(vis):
        s = vis[i].strip()
        if not (s and CAPS_LINE_RE.match(s) and SKIN_RE.search(s)):
            i += 1
            continue
        names, marked, j = set(), False, i
        while j < len(vis):
            sj = vis[j].strip()
            if not (sj and CAPS_LINE_RE.match(sj) and SKIN_RE.search(sj)):
                break
            names |= set(SKIN_RE.findall(sj))
            if re.search(r"\+\s*\d", sj):
                marked = True
            j += 1
        back = " ".join(vis[max(0, i - 5):i])
        claimed = re.search(
            rf"(?<![0-9A-Za-z_.+-]){truth['design']}(?![0-9A-Za-z_.%+-])", back)
        vocab = re.search(r"aesthetic|voice|skin|美学|声音|风格", back, re.I)
        if claimed and vocab and not marked and 2 <= len(names) < truth["design"]:
            why = _ignore_why(raw, i)
            yield (i + 1, "suppressed" if why else "violation",
                   "roster-subset", len(names), truth["design"],
                   f"claims {truth['design']} but the roster names only "
                   f"{len(names)} skins with no '+N' marker: "
                   + " · ".join(sorted(names)), why)
        i = j


def scan_lines(raw: list[str], truth: dict, rules, model):
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
                    why = _ignore_why(raw, i)
                    excerpt = " ".join(
                        joined[max(0, start - 34):end + 34].split())[:96]
                    yield (i + 1, "suppressed" if why else "violation",
                           name, val, truth[key], excerpt, why)
    yield from special_findings(vis, raw, truth, model)


def tracked_files() -> list[str]:
    # Code files are scanned too: design-loop.mjs's operator strings and
    # bin/design-review's header carried stale gate counts for months in
    # the unscanned zone (re-review round 3, finding 7).
    run = subprocess.run(
        ["git", "-C", REPO, "ls-files",
         "*.html", "*.md", "*.mjs", "*.js", "*.py", "bin/*"],
        capture_output=True, text=True)
    if run.returncode != 0:
        print("count-check: git ls-files failed", file=sys.stderr)
        sys.exit(2)
    return sorted(set(f for f in run.stdout.split("\n") if f))


# ------------------------------------------------------------------ probe ---

def en_word(v: int) -> str:
    for w, n in EN_NUM.items():
        if n == v:
            return w
    return str(v)


ZH_SMALL = {2: "两", 3: "三", 4: "四", 5: "五", 6: "六", 7: "七"}


def probe(truth: dict, rules, model) -> list[str]:
    """Inject a fake wrong number in every form this class has taken.

    Returns a list of failure messages; empty means the probe passed.
    """
    w = {k: v + 1 for k, v in truth.items()}          # guaranteed wrong
    w2 = {k: v + 2 for k, v in truth.items()}
    g = truth["gates"]
    g_low = 3 if g != 3 else 5                        # EN/zh low-numeral hole
    en_low = 3 if truth["design"] != 3 else 4
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
<p>{ZH_SMALL[g_low]}道机械检查都要绿。Run the {en_word(w['gates'])} machine gates.</p>
<p>Only {en_word(en_low)} design voices remain. A {en_word(g_low)}-gate design-review.</p>
<h3>发布前 checklist({ZH_SMALL.get(g, g)}道机械检查都要 exit 0)</h3>
<pre>python3 scripts/verify.py page.html</pre>
<pre>node scripts/visual-audit.mjs page.html</pre>
<pre>node scripts/screenshot.mjs page.html</pre>
<p>第四道检查 · LLM critic</p>
<p>Run the machine checks, then the third gate — the design-critic — scores taste.</p>
<text>{truth['design']}</text>
<text>aesthetics</text>
<text>APPLE · ANTHROPIC</text>
<text>EMBER · SAGE</text>
<p>共 {w2['design']} 种风格。另一页说 {w['design']} 种页面设计美学。</p>
<p>bug 大全现在当前 {w['kb']} 条,对应 38 项检查。</p>
<p>`references/known-bugs.md`({w2['kb']} 条,每条写 Reader sees / Why / Defense)</p>
""".split("\n")
    zh_probe_val = 3 if truth["design"] != 3 else 4
    hits = [(r[2], r[3]) for r in scan_lines(bad, truth, rules, model)
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
        # gate-model regressions: zh + EN low numerals, hyphen form,
        # enumeration-vs-count, critic mislabelled, caps-roster subset
        ("gates-zh", g_low), ("gates-en", w["gates"]),
        ("gates-hyphen", g_low), ("design-en", en_low),
        ("gate-enum-missing", g), ("critic-as-gate", 0), ("roster-subset", 4),
        # the round-4 carriers, locked per §7.10
        ("design-zh-style", w2["design"]), ("design-zh-aesth", w["design"]),
        # the two known-bugs forms that hid an 82 next to an 83 in one file
        ("kb-zh-dangqian", w["kb"]), ("kb-zh-md-paren", w2["kb"]),
    ]
    fails = [f"probe: injected fake not caught: {name} claiming {val}"
             for name, val in need if (name, val) not in hits]
    if hits.count(("design-en", w2["design"])) < 2:
        fails.append("probe: second candidate on a shared line not reported "
                     "(attribute value or per-line dedupe hole)")
    # Two critic-as-gate lines above: the zh 第 N 道 form and the EN word-form
    # ordinal. One hit means the alternation regressed to digits/zh only.
    if hits.count(("critic-as-gate", 0)) < 2:
        fails.append("probe: EN word-form ordinal not caught — "
                     "'the third gate — the design-critic' must be a violation")
    good = [
        f"<p>All {truth['total']} skills. {truth['design']} design skills.</p>",
        f"<p>覆盖 {truth['canonical']}/{truth['canonical']} canonical。"
        f"已收录 {truth['kb']} 条。第 13 个 skill。其余 8 个。</p>",
        "<p>rendered in all five aesthetics — atelier (5) and primer (3)</p>",
        f"<p>{ZH_SMALL.get(g, g)}道机械检查:{'、'.join(model['mechanical'])}。"
        f"critic 不是第{ZH_SMALL.get(g, g)}道机械检查,它在四道之外。</p>",
        "<p>第三道是 axe-core,color-contrast 是阻断项。"
        "可选的第五道机械检查是 pixel-gate.mjs。</p>",
        f"<p>run the {en_word(g)} gates, then a critic.</p>",
        f"<text>{truth['design']}</text>",
        "<text>aesthetics</text>",
        "<text>APPLE · ANTHROPIC</text>",
        "<text>EMBER · SAGE · +5</text>",
        f"<p>bug 大全当前 {truth['kb']} 条。"
        f"`known-bugs.md`({truth['kb']} 条,每条写 Reader sees)</p>",
    ]
    false_alarms = [r for r in scan_lines(good, truth, rules, model)
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
    model = gate_model()
    rules = carriers()

    if want_list:
        print("truths from facts.mjs --json + the gate model in "
              f"{GATE_MODEL_SRC}:")
        print("  " + " · ".join(f"{k} {v}" for k, v in truth.items()))
        print(f"  gate model: mechanical = {', '.join(model['mechanical'])}"
              f" · optional = {', '.join(model['optional'])}"
              f" · taste = {model['taste']} (outside the mechanical count)")
        print(f"named exclusions ({len(EXCLUSIONS)}):")
        for name, _, why in EXCLUSIONS:
            print(f"  · {name} — {why}")
        print(f"record paths, never scanned ({len(RECORD_PATHS)}):")
        for prefix, why in RECORD_PATHS:
            print(f"  · {prefix} — {why}")
        print(f"pending, handed to another task ({len(PENDING)}):")
        for path, pat, why, kind in PENDING:
            print(f"  · [{kind}] {path} «{pat}» — {why}")
        return 0

    fails = probe(truth, rules, model)
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
    skipped, suppressed, pending, violations = [], [], [], []
    fired: set[int] = set()
    for rel in files:
        why = is_record_path(rel)
        if why:
            skipped.append(rel)
            continue
        abspath = rel if os.path.isabs(rel) else os.path.join(REPO, rel)
        with open(abspath, encoding="utf-8", errors="replace") as fh:
            raw = fh.read().split("\n")
        for row in scan_lines(raw, truth, rules, model):
            if row[1] == "suppressed":
                suppressed.append((rel,) + row)
                continue
            idx, handed = pending_reason(rel, raw[row[0] - 1])
            if handed is not None:
                fired.add(idx)
                pending.append((rel,) + row + (handed,))
            else:
                violations.append((rel,) + row)

    print("truths: " + " · ".join(f"{k} {v}" for k, v in truth.items()))
    print(f"scanned {len(files) - len(skipped)} file(s); "
          f"{len(skipped)} record file(s) excluded by RECORD_PATHS")
    if suppressed:
        print(f"suppressed by facts-ignore ({len(suppressed)}):")
        for rel, line, _, name, val, exp, ex, why in suppressed:
            print(f"  {rel}:{line}  «{ex}» — {why}")
    if pending:
        print(f"pending, handed to another task — not failing this run "
              f"({len(pending)}):")
        for rel, line, _, name, val, exp, ex, _w, handed in pending:
            print(f"  {rel}:{line}  {name}  says {val}, model says {exp} — "
                  f"{handed}")
    if not paths:
        for idx, (path, pat, _why, kind) in enumerate(PENDING):
            if kind == "manual":
                print(f"manual hand-off (not detected by this scanner): "
                      f"{path} «{pat}» — 还清后手工删除本条")
            elif idx not in fired:
                print(f"⚠ spent PENDING entry — «{pat}» no longer matches "
                      f"anything in {path}: the debt was paid, delete the "
                      f"entry from PENDING")
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
