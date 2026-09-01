#!/usr/bin/env python3
"""
Unified structural verifier for all design skills.

Usage:
  python3 skills/design-review/scripts/verify.py [--skill=<name>] [--css=<path>]...
                                                  [--allow-monolingual]
                                                  [--force-public] <html-path> [...]

  --allow-monolingual (alias --internal) skips the bilingual-page rule for
  internal docs. Without it, HTML under /docs/, /references/canonical/ or
  /demos/ must have lang-toggle + lang-en + lang-zh spans (see
  cross-skill-rules.md §G).

  --force-public runs the SEO meta check (check 9) even when the path is not
  a public one (docs/, references/canonical/ or demos/). Test/fixture use only — it
  does NOT enable the bilingual or self-diff public-path rules.

If --skill is omitted, the script auto-detects the skill by scanning the HTML
for a `<link>` to one of
{anthropic|apple|ember|sage|glass|eclat|lectern|atelier|primer}.css. Pass --skill
when detection is ambiguous.

CSS class-definition lookup: unions classes from
  (a) the skill's default CSS at skills/<skill>-design/assets/<css> (if exists)
  (b) every `<link href="...*.css">` in the HTML, resolved relative to the HTML
  (c) every --css=<path> passed on the command line (relative to CWD)

(b) is what makes the tool work cross-repo: an external HTML's own local CSS
is auto-picked. (c) lets you add extra CSS files (e.g. engram's app.css).

Exit code:
  0 — all files pass
  1 — at least one check failed (every failure is printed)
  2 — bad CLI (no files / unknown skill / ambiguous autodetect)

Warnings (check 9) are printed but NEVER affect the exit code.

Checks:
  1. No `[placeholder]` brackets leaked into HTML
  2. <!doctype html> + viewport meta present
  3. Hero inner element uses an acceptable container (per skill)
  4. Every `class="{prefix}-*"` token is defined somewhere in the CSS union
  5. <svg> tag balance
  6. Container modifier never used without its base class (BEM bug)
  7. Bilingual toggle on public pages (lang-toggle / lang-en / lang-zh)
  8. Half-width ASCII punctuation inside lang-zh spans · self-diff block
  9. SEO meta on public pages (warn-only): non-empty <title>, meta
     description 50-160 chars, og:title + og:description present
     (viewport is already a hard check in 2)
 10. Hardcoded colour that already has a token (warn-only): a hex written in
     an attribute or <style> block that exactly equals a value the skill's CSS
     defines as a custom property. Text nodes are never scanned — a palette
     page printing "#DD4F92" as copy is documenting, not styling.
"""
from __future__ import annotations
import os
import re
import sys
from html.parser import HTMLParser


REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Per-skill config. Apple is the odd one out: its base container is the NARROW
# reading width (980px); hero rows must use --hero (1280px) or --wide. Others
# use the base container as the default acceptable width, with --narrow meaning
# "long-form body, do not use for hero".
SKILLS: dict[str, dict] = {
    "anthropic": {
        "prefix": "anth-",
        "css": "anthropic.css",
        "dir": "anthropic-design",
        "narrow_hero": {"anth-container--narrow"},
        "acceptable_hero": {"anth-container", "anth-container--wide"},
        "container_modifiers": ("narrow", "wide"),
        "hero_advice": "anth-container (default 960px) or anth-container--wide (1200px)",
    },
    "apple": {
        "prefix": "apple-",
        "css": "apple.css",
        "dir": "apple-design",
        "narrow_hero": {"apple-container"},
        "acceptable_hero": {"apple-container--hero", "apple-container--wide"},
        "container_modifiers": ("hero", "wide", "narrow"),
        "hero_advice": "apple-container--hero (1280px) or apple-container--wide",
    },
    "ember": {
        "prefix": "ember-",
        "css": "ember.css",
        "dir": "ember-design",
        "narrow_hero": {"ember-container--narrow"},
        "acceptable_hero": {"ember-container", "ember-container--wide"},
        "container_modifiers": ("narrow", "wide"),
        "hero_advice": "ember-container (default 960px) or ember-container--wide (1200px)",
    },
    "sage": {
        "prefix": "sage-",
        "css": "sage.css",
        "dir": "sage-design",
        "narrow_hero": {"sage-container--narrow"},
        "acceptable_hero": {"sage-container", "sage-container--wide"},
        "container_modifiers": ("narrow", "wide"),
        "hero_advice": "sage-container (default 960px) or sage-container--wide (1200px)",
    },
    "glass": {
        "prefix": "glass-",
        "css": "glass.css",
        "dir": "glass-design",
        "narrow_hero": {"glass-container--narrow"},
        "acceptable_hero": {"glass-container", "glass-container--wide"},
        "container_modifiers": ("narrow", "wide"),
        "hero_advice": "glass-container (default 1040px) or glass-container--wide (1280px)",
    },
    "eclat": {
        "prefix": "eclat-",
        "css": "eclat.css",
        "dir": "eclat-design",
        # eclat heroes are full-bleed cinematic (.eclat-hero), not a width-constrained
        # container; .eclat-wrap (1280) holds the in-flow sections.
        "narrow_hero": {"eclat-container--narrow"},
        "acceptable_hero": {"eclat-wrap", "eclat-hero", "eclat-stage"},
        "container_modifiers": ("narrow", "wide"),
        "hero_advice": "eclat-wrap (1280px) or the full-bleed eclat-hero",
    },
    "lectern": {
        "prefix": "lectern-",
        "css": "lectern.css",
        "dir": "lectern-design",
        # lectern is a briefing deck: a .lectern-title block, not a full-bleed hero.
        # The hero-container check is skipped when no .lectern-hero exists.
        "narrow_hero": {"lectern-container--narrow"},
        "acceptable_hero": {"lectern-wrap", "lectern-title"},
        "container_modifiers": ("narrow", "wide"),
        "hero_advice": "lectern-wrap (1080px)",
    },
    "atelier": {
        "prefix": "atl-",
        "css": "atelier.css",
        "dir": "atelier-design",
        # atelier draws APPLICATIONS, not documents: there is no hero tier at
        # all. The page is a .atl-page holding one .atl-app glass shell, so the
        # hero-container check never fires (no .atl-hero exists by design).
        "narrow_hero": {"atl-page--narrow"},
        "acceptable_hero": {"atl-page", "atl-page--wide", "atl-app"},
        "container_modifiers": ("narrow", "wide"),
        "hero_advice": "atl-page (1280px) or atl-page--wide (1440px)",
    },
    "primer": {
        "prefix": "primer-",
        "css": "primer.css",
        "dir": "primer-design",
        "narrow_hero": {"primer-container--narrow"},
        "acceptable_hero": {"primer-container", "primer-container--wide"},
        "container_modifiers": ("narrow", "wide"),
        "hero_advice": "primer-container (default 1080px) or primer-container--wide (1280px)",
    },
}

PLACEHOLDER_PATTERN = re.compile(
    r"\[(?:hero[^\]]*|svg|img|photo|abstract[^\]]*|workspace[^\]]*|"
    r"[a-z][a-z0-9-]*\.icon|placeholder|todo|tbd|fixme)\]",
    re.I,
)


class HeroContainerFinder(HTMLParser):
    """Finds the first element inside <section class="{prefix}-hero">."""

    def __init__(self, hero_class: str) -> None:
        super().__init__()
        self.hero_class = hero_class
        self.in_hero = False
        self.depth_inside_hero = 0
        self.found: str | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        classes = dict(attrs).get("class", "") or ""
        tokens = classes.split()
        if self.hero_class in tokens:
            self.in_hero = True
            self.depth_inside_hero = 0
            return
        if self.in_hero:
            self.depth_inside_hero += 1
            if self.found is None and self.depth_inside_hero == 1:
                self.found = classes

    def handle_endtag(self, tag: str) -> None:
        if self.in_hero:
            if self.depth_inside_hero == 0:
                self.in_hero = False
            else:
                self.depth_inside_hero -= 1


def defined_classes(css_text: str, prefix: str) -> set[str]:
    # Prefix has a trailing '-'; match e.g. `.sage-[a-z0-9_-]+`.
    #
    # The underscore is NOT optional. used_classes() splits the HTML class
    # attribute on whitespace, so it yields the whole token `atl-brand__name`;
    # if this pattern stops at the underscore it only learns `atl-brand`, and
    # every BEM element class in the stylesheet is reported "undefined" even
    # though it is defined one line above. anthropic.css has carried
    # `.anth-dialog__actions` since before this was noticed — the bug stayed
    # latent only because no page had used that class yet. atelier-design uses
    # 65 BEM element classes and surfaced it on its first canonical.
    pattern = re.compile(r"\.(" + re.escape(prefix) + r"[a-z0-9_-]+)")
    return {m.group(1) for m in pattern.finditer(css_text)}


def used_classes(html: str, prefix: str) -> set[str]:
    used: set[str] = set()
    for m in re.finditer(r'class="([^"]+)"', html):
        for token in m.group(1).split():
            if token.startswith(prefix):
                used.add(token)
    return used


def linked_stylesheets(html: str, html_path: str) -> list[str]:
    """Find <link rel=stylesheet href=...> in the HTML, resolved to absolute
    filesystem paths.  External (http/https///) URLs are skipped.
    """
    paths: list[str] = []
    html_dir = os.path.dirname(os.path.abspath(html_path))
    for m in re.finditer(r'<link[^>]+href=["\']([^"\']+\.css)["\']', html, re.I):
        href = m.group(1)
        if href.startswith(("http://", "https://", "//")):
            continue
        resolved = os.path.normpath(os.path.join(html_dir, href))
        if os.path.exists(resolved):
            paths.append(resolved)
    return paths


def autodetect_skill(html: str) -> str | None:
    """Pick a skill by finding a <link href="...{name}.css"> in the HTML.

    If exactly one skill's CSS is referenced, return it. If zero or multiple,
    return None — caller should ask user for --skill.
    """
    hits = [name for name, cfg in SKILLS.items() if re.search(
        r'href=["\'][^"\']*' + re.escape(cfg["css"]) + r'["\']', html
    )]
    if len(hits) == 1:
        return hits[0]
    # Fallback: look at prefix usage in class= attributes; pick the dominant one.
    counts: dict[str, int] = {}
    for name, cfg in SKILLS.items():
        counts[name] = sum(1 for _ in re.finditer(
            r'class="[^"]*\b' + re.escape(cfg["prefix"]), html
        ))
    if counts:
        top = max(counts.values())
        winners = [n for n, c in counts.items() if c == top and c > 0]
        if len(winners) == 1:
            return winners[0]
    return None


def check_file(
    path: str,
    forced_skill: str | None,
    extra_css: list[str],
    allow_monolingual: bool = False,
    force_public: bool = False,
) -> tuple[list[str], list[str]]:
    """Returns (errors, warnings). Errors fail the run; warnings are
    informational only and never affect the exit code."""
    errors: list[str] = []
    warnings: list[str] = []
    if not os.path.exists(path):
        return [f"{path}: not found"], warnings
    html = open(path, encoding="utf-8").read()

    skill = forced_skill or autodetect_skill(html)
    if skill is None:
        css_names = "/".join(cfg["css"] for cfg in SKILLS.values())
        return [
            f"{path}: cannot auto-detect skill from HTML "
            f"(no unique link to one of {css_names}). "
            f"Pass --skill=<name> explicitly."
        ], warnings
    if skill not in SKILLS:
        return [f"{path}: unknown --skill '{skill}'. Valid: {sorted(SKILLS)}"], warnings

    cfg = SKILLS[skill]
    prefix = cfg["prefix"]
    hero_class = prefix + "hero"
    default_css = os.path.join(REPO_ROOT, "skills", cfg["dir"], "assets", cfg["css"])

    # 1. placeholder brackets — strip <pre>, <code>, and the self-diff
    # comment block first, so:
    #  - docs pages discussing placeholders ("verify.py catches [hero]")
    #    don't false-positive against themselves
    #  - self-diff decision ids like `[hero-framing]` / `[pillars]` are
    #    not mistaken for placeholders (contract: §M)
    placeholder_scan = re.sub(
        r"<pre\b[^>]*>.*?</pre>", "", html, flags=re.DOTALL | re.I
    )
    placeholder_scan = re.sub(
        r"<code\b[^>]*>.*?</code>", "", placeholder_scan, flags=re.DOTALL | re.I
    )
    placeholder_scan = re.sub(
        r"<!--\s*design-review:self-diff\b.*?/design-review:self-diff\s*-->",
        "",
        placeholder_scan,
        flags=re.DOTALL,
    )
    brackets = PLACEHOLDER_PATTERN.findall(placeholder_scan)
    if brackets:
        errors.append(f"{path}: placeholder strings: {sorted(set(brackets))}")

    # 2. DOCTYPE + viewport
    if not re.search(r"<!doctype html>", html, re.I):
        errors.append(f"{path}: missing <!doctype html>")
    if not re.search(r'<meta[^>]+name=["\']viewport', html, re.I):
        errors.append(f"{path}: missing viewport meta")

    # 3. Hero container (if there is a hero)
    finder = HeroContainerFinder(hero_class)
    finder.feed(html)
    if finder.found is not None:
        tokens = set(finder.found.split())
        if tokens & cfg["narrow_hero"] and not tokens & cfg["acceptable_hero"]:
            errors.append(
                f"{path}: hero uses narrow container ({finder.found!r}); "
                f"expected {cfg['hero_advice']}"
            )
        elif not tokens & cfg["acceptable_hero"]:
            if not any(t.startswith(prefix + "container") for t in tokens):
                errors.append(
                    f"{path}: hero inner element lacks any .{prefix}container* class "
                    f"({finder.found!r})"
                )

    # 4. class usage — union classes from default CSS + HTML-linked CSS + --css=
    defined: set[str] = set()
    css_files_used: list[str] = []
    css_parts: list[str] = []          # raw text, for the colour-token map (check 10)

    if os.path.exists(default_css):
        _t = open(default_css, encoding="utf-8").read()
        defined |= defined_classes(_t, prefix)
        css_parts.append(_t)
        css_files_used.append(default_css)

    for linked in linked_stylesheets(html, path):
        if linked in css_files_used:
            continue
        try:
            _t = open(linked, encoding="utf-8").read()
            defined |= defined_classes(_t, prefix)
            css_parts.append(_t)
            css_files_used.append(linked)
        except (OSError, UnicodeDecodeError):
            pass

    for extra in extra_css:
        if not os.path.exists(extra):
            errors.append(f"--css path not found: {extra}")
            continue
        if extra in css_files_used:
            continue
        _t = open(extra, encoding="utf-8").read()
        defined |= defined_classes(_t, prefix)
        css_parts.append(_t)
        css_files_used.append(extra)

    if not css_files_used:
        errors.append(
            f"{path}: no CSS source found (default {cfg['css']} at {default_css} "
            f"missing, no <link> in HTML resolved, no --css= given)"
        )
    else:
        for cls in sorted(used_classes(html, prefix)):
            if cls not in defined:
                short = [os.path.relpath(p) for p in css_files_used]
                errors.append(
                    f"{path}: undefined class '{cls}' (not in any of {short})"
                )

    # 5. SVG tag balance
    opens = len(re.findall(r"<svg\b", html))
    closes = len(re.findall(r"</svg>", html))
    if opens != closes:
        errors.append(f"{path}: unbalanced <svg> tags ({opens} open, {closes} close)")

    # 5b. HTML-only inline tags inside <svg> — silent renderer corruption.
    # SVG has no <b>/<i>/<code>/<br>. Browsers do not error: they break out of
    # foreign-content parsing at that tag, so everything AFTER it in the same
    # <svg> escapes into the HTML flow as loose text. The diagram looks
    # half-drawn with a paragraph of stray words below it, and neither tag
    # balance (#5) nor any CSS check notices. Inside <text>, only <tspan>,
    # <textPath>, <tref> and <a> are legal — use
    # <tspan font-weight="600"> instead of <b>.
    illegal_in_svg = ("b", "i", "u", "em", "strong", "code", "br", "span",
                      "p", "div", "small", "sup", "sub", "mark")
    svg_tag_re = re.compile(r"<(" + "|".join(illegal_in_svg) + r")(?=[\s/>])",
                            re.IGNORECASE)
    def _blank_keep_offsets(m):
        # Preserve length and newlines so reported line numbers stay accurate.
        return re.sub(r"[^\n]", " ", m.group(0))

    for sm in re.finditer(r"<svg\b.*?</svg>", html, re.DOTALL | re.IGNORECASE):
        # <foreignObject> is the one place where HTML is legal inside SVG.
        block = re.sub(r"<foreignObject\b.*?</foreignObject>",
                       _blank_keep_offsets, sm.group(0),
                       flags=re.DOTALL | re.IGNORECASE)
        seen = set()
        for tm in svg_tag_re.finditer(block):
            tag = tm.group(1).lower()
            if tag in seen:
                continue
            seen.add(tag)
            line = html.count("\n", 0, sm.start() + tm.start()) + 1
            errors.append(
                f"{path}:{line}: <{tag}> inside <svg> — not an SVG element; "
                f"the renderer drops out of the SVG here and everything after "
                f"it leaks into the page as loose text. "
                f"Use <tspan font-weight=\"600\"> for emphasis."
            )

    # 6. Modifier-only container (BEM bug)
    mod_re = re.compile(
        re.escape(prefix) + r"container--(?:"
        + "|".join(cfg["container_modifiers"]) + r")"
    )
    base_class = prefix + "container"
    for m in re.finditer(r'class="([^"]+)"', html):
        classes = m.group(1).split()
        for cls in classes:
            if mod_re.fullmatch(cls) and base_class not in classes:
                errors.append(
                    f"{path}: '{cls}' used without base '{base_class}' — "
                    f"margin:0 auto won't apply; "
                    f"write class=\"{base_class} {cls}\""
                )

    # 7. Bilingual toggle — public-facing pages must support zh/en
    # switching. Any HTML under docs/, skills/<style>/references/canonical/
    # or demos/ is a public destination (linked from landing or GitHub
    # Pages). Missing
    # the lang-toggle / lang-en / lang-zh pattern = inconsistent UX for CJK
    # users. Rule is documented in cross-skill-rules.md §G.
    # Match on the ABSOLUTE path: a relative invocation like
    # `verify.py docs/page.html` has no leading slash, so the naive
    # `"/docs/" in path` test silently skipped this rule (and 8b below).
    norm_path = os.path.abspath(path).replace(os.sep, "/")
    public_path = (
        "/docs/" in norm_path
        or "/references/canonical/" in norm_path
        or "/demos/" in norm_path
    )
    if public_path and not allow_monolingual:
        has_toggle = re.search(r'class=["\'][^"\']*\blang-toggle\b', html) is not None
        has_lang_en = re.search(r'class=["\'][^"\']*\blang-en\b', html) is not None
        has_lang_zh = re.search(r'class=["\'][^"\']*\blang-zh\b', html) is not None
        if not (has_toggle and has_lang_en and has_lang_zh):
            missing = []
            if not has_toggle: missing.append("lang-toggle button")
            if not has_lang_en: missing.append("lang-en spans")
            if not has_lang_zh: missing.append("lang-zh spans")
            errors.append(
                f"{path}: public-facing page missing bilingual support "
                f"(missing: {', '.join(missing)}). "
                f"See cross-skill-rules.md §G."
            )

    # 8b. Self-diff contract — any HTML under /references/canonical/ MUST embed
    # a `design-review:self-diff v1` HTML comment block. Contract documented in
    # cross-skill-rules.md §M. See known-bugs.md §1.23. Critic + next author
    # both read this block to know "why does this instance look like this?"
    if "/references/canonical/" in norm_path:
        sd_pattern = re.compile(
            r"<!--\s*design-review:self-diff\s+v1\b(.*?)/design-review:self-diff\s*-->",
            re.DOTALL,
        )
        sd_match = sd_pattern.search(html)
        if not sd_match:
            errors.append(
                f"{path}: canonical page is missing the `design-review:self-diff v1` "
                f"HTML comment block before </body>. See cross-skill-rules.md §M "
                f"for the contract and known-bugs.md §1.23 for why."
            )
        else:
            body = sd_match.group(1)
            missing_fields: list[str] = []
            if not re.search(r"^\s*Skill:\s*\S+", body, re.MULTILINE):
                missing_fields.append("Skill:")
            if not re.search(r"^\s*Page-type:\s*\S+", body, re.MULTILINE):
                missing_fields.append("Page-type:")
            if not re.search(r"^\s*Created:\s*\d{4}-\d{2}-\d{2}", body, re.MULTILINE):
                missing_fields.append("Created: YYYY-MM-DD")
            if not re.search(r"^\s*Decisions\b", body, re.MULTILINE):
                missing_fields.append("Decisions header")
            # Count decisions: numbered lines in the Decisions section.
            decisions = re.findall(r"^\s*\d+\.\s*\[", body, re.MULTILINE)
            if len(decisions) < 3:
                missing_fields.append(
                    f"at least 3 decisions (found {len(decisions)})"
                )
            if not re.search(r"^\s*Known\s+trade-offs\b", body, re.MULTILINE | re.I):
                missing_fields.append("Known trade-offs: header")
            if missing_fields:
                errors.append(
                    f"{path}: self-diff block present but incomplete · missing "
                    f"{', '.join(missing_fields)}. See cross-skill-rules.md §M."
                )

    # 8. Half-width ASCII punctuation inside lang-zh spans (known-bugs 1.22).
    # Chinese body text rendered in Noto Sans/Serif SC uses CJK metrics; ASCII
    # "," ";" ":" keep Latin metrics and kern tight against Han glyphs, breaking
    # line rhythm. Replace with full-width ，；：. We only flag when a CJK char
    # sits on at least one side of the punctuation (guards against identifiers
    # like "record_id 882091" or stray URLs that legitimately keep half-width).
    CJK = r"[\u3400-\u9fff\u3000-\u303f\uff00-\uffef]"
    halfwidth_near_cjk = re.compile(
        rf"(?:{CJK}\s?[,;:]|[,;:]\s?{CJK})"
    )
    zh_span_pattern = re.compile(
        r'<span class=["\']lang-zh["\']\s*>(.*?)</span>',
        re.DOTALL,
    )
    zh_hits: list[str] = []
    for m in zh_span_pattern.finditer(html):
        body = m.group(1)
        # Ignore code spans inside the lang-zh body — identifiers legitimately
        # keep half-width punctuation.
        body_sansCode = re.sub(r"<code\b[^>]*>.*?</code>", "", body, flags=re.DOTALL | re.I)
        # Character references end in ";" — "&#183; 把" is a middot, not a
        # half-width semicolon glued to a Han glyph. Drop them before matching
        # or every entity-written separator reads as a violation (known-bugs
        # 1.22, false-positive guard added 2026-09-02).
        body_sansCode = re.sub(r"&(?:#\d+|#x[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);", " ", body_sansCode)
        hits = halfwidth_near_cjk.findall(body_sansCode)
        if hits:
            zh_hits.extend(hits[:3])
    if zh_hits:
        sample = ", ".join(repr(h) for h in zh_hits[:3])
        errors.append(
            f"{path}: lang-zh body contains half-width ASCII punctuation near "
            f"CJK ({sample}{'...' if len(zh_hits) > 3 else ''}). "
            f"Replace ',' with '，', ';' with '；', ':' with '：' — "
            f"Noto CJK metrics break when Latin punctuation kerns against "
            f"Han glyphs. See known-bugs.md §1.22."
        )

    # 8a. Hand-computed CJK numeric entities (known-bugs 1.62).
    # 2026-09-01, hardware.html: the generator wrote Chinese as decimal HTML
    # entities and got seven code points wrong. Every wrong one decoded to a
    # REAL but different character - 帧 (frame) became 帖 (a post) in 21 places,
    # 敞 became 敌, 拐弯 became 拥弧, 锁住 became 冒住. Wrong-but-valid characters
    # render perfectly and pass every other check, so nothing caught it until a
    # human read the page and asked what the word meant.
    #
    # There is no output-only check for "this is the wrong Chinese word" - 一帖
    # is a grammatical phrase. A character-frequency check was tried and
    # rejected: it missed the worst instance (帖 is a common character in other
    # corpora) while flagging four legitimate words. The only sound defence is
    # to close the channel: write CJK as literal UTF-8, never as a code point
    # a human or a model computed by hand.
    cjk_entities = {}
    for m in re.finditer(r"&#(\d{4,6});", html):
        cp = int(m.group(1))
        if 0x3400 <= cp <= 0x9FFF:            # CJK Unified Ideographs (+ Ext A)
            cjk_entities.setdefault(chr(cp), 0)
            cjk_entities[chr(cp)] += 1
    if cjk_entities:
        shown = ", ".join(f"{c}(&#{ord(c)};)&#215;{n}" for c, n in
                          sorted(cjk_entities.items(), key=lambda kv: -kv[1])[:4])
        errors.append(
            f"{path}: {sum(cjk_entities.values())} CJK character(s) written as "
            f"numeric HTML entities ({shown}). Write literal UTF-8 instead - a "
            f"hand-computed code point that is off by a few decodes to a real "
            f"but wrong character, which renders fine and passes every check. "
            f"See known-bugs.md 1.62."
        )

    # 8b. Jargon used but never defined (known-bugs 1.63).
    # A page can pass every structural and visual check and still be unreadable
    # because it uses domain vocabulary as if the reader already shared it.
    # Fires only when several listed terms appear with no definition anywhere on
    # the page, so a page written for specialists that defines nothing on
    # purpose gets one warning rather than a wall of them.
    _jf = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                       "references", "zh-jargon-terms.txt")
    if os.path.exists(_jf):
        with open(_jf, encoding="utf-8") as _fh:
            terms = [t.strip() for t in _fh if t.strip() and not t.startswith("#")]
        # 取待检正文。双语页只看 lang-zh span;**单语页(整页一个 lang-zh 都没有)
        # 退回整页**,否则待检文本恒为空、这道检查在纯中文页上完全空转。
        # 2026-09-01 实测:一批纯中文投资报告 err=0 warn=0 全绿,而人工按同样
        # 逻辑跑正文,5 个术语确实没定义 —— 闸一个都没看见,绿灯是假的。
        # 空转的检查比没有检查更糟:它让人以为查过了。见 known-bugs.md 1.63。
        zh_bodies = zh_span_pattern.findall(html)
        zh_src = " ".join(zh_bodies) if zh_bodies else html
        # script / style / HTML 注释 / 代码块都不是正文 —— 标识符、self-diff
        # 自评块里出现的词不算「在正文里用了这个术语」。整页退回时尤其要紧。
        for _drop in (r"<script\b.*?</script>", r"<style\b.*?</style>",
                      r"<!--.*?-->", r"<pre\b.*?</pre>", r"<code\b.*?</code>"):
            zh_src = re.sub(_drop, " ", zh_src, flags=re.DOTALL | re.I)
        # 标签去掉不留空格:`<strong>帧</strong>缓冲` 视觉上是一个词,要能拼回来。
        zh_plain = re.sub(r"<[^>]+>", "", zh_src)
        # 有定义的迹象:词后 40 字内出现「是 / 指 / 就是 / 即 / 意思是 / 叫」,
        # 或者页面上有术语表结构(class 含 term/glossary,或 <dt>)。
        has_glossary = bool(re.search(r'class="[^"]*(?:term|glossary|def)[^"]*"|<dt\b', html, re.I))
        undefined = []
        for t in terms:
            if t not in zh_plain:
                continue
            if has_glossary:
                continue
            near = re.search(re.escape(t) + r".{0,40}?(?:是|指|就是|即|意思是|叫做|叫)", zh_plain, re.S)
            if not near:
                undefined.append(t)
        if len(undefined) >= 4:
            warnings.append(
                f"{path}: {len(undefined)} domain terms used in Chinese prose with no "
                f"definition anywhere on the page ({', '.join(undefined[:6])}"
                f"{'...' if len(undefined) > 6 else ''}). A reader who does not already "
                f"know these cannot follow the argument. Define each on first use, or add "
                f"a glossary block (any element with a term/glossary class, or a <dt>). "
                f"See known-bugs.md 1.63."
            )

    # 8c. Glass dual-theme contract — glass pages declare an initial theme on
    # <html>, and public glass pages must ship the theme toggle. The light
    # theme is part of the skill's identity (iOS-frost variant), and the
    # review harness flips data-theme to audit both modes — a page without
    # the attribute can't be theme-audited. See glass-design/references/
    # glass-material.md.
    if skill == "glass":
        if not re.search(r'<html[^>]+data-theme=["\'](?:dark|light)["\']', html, re.I):
            errors.append(
                f"{path}: glass page must declare an initial theme on the root "
                f'element: <html data-theme="dark"> (dual-theme contract).'
            )
        # Same exemption as the bilingual rule: the toggle button is a
        # public-page UX affordance. Internal docs (--internal) still get
        # dual-theme AUDITING — visual-audit flips data-theme itself.
        if public_path and not allow_monolingual and not re.search(
            r'class=["\'][^"\']*\bglass-theme-toggle\b', html
        ):
            errors.append(
                f"{path}: public glass page missing the .glass-theme-toggle "
                f"button — dark/light duality is part of the glass contract."
            )

    # 9. SEO meta — public pages only (or --force-public for fixtures).
    # WARN-ONLY: search engines and link unfurlers read these, but a missing
    # og tag never blocks shipping the way a broken layout does. Viewport is
    # already a hard check (2), so it isn't repeated here.
    if public_path or force_public:
        title_m = re.search(r"<title[^>]*>(.*?)</title>", html, re.I | re.DOTALL)
        if not title_m or not title_m.group(1).strip():
            warnings.append(f"{path}: SEO — missing or empty <title>")
        # The capture is quote-aware via a backreference. The old `[^"\']*`
        # excluded BOTH quote characters, so an apostrophe inside a
        # double-quoted attribute truncated the value: content="Loka's people
        # console — …" measured as 4 chars ("Loka") and warned about a
        # description that was in fact 180 chars long. Any English possessive
        # in a description hit this.
        desc_m = re.search(
            r'<meta[^>]+name=["\']description["\'][^>]*content=(["\'])(.*?)\1',
            html,
            re.I | re.DOTALL,
        ) or re.search(
            # attribute order flipped: content= before name=
            r'<meta[^>]+content=(["\'])(.*?)\1[^>]*name=["\']description["\']',
            html,
            re.I | re.DOTALL,
        )
        if not desc_m:
            warnings.append(f'{path}: SEO — missing <meta name="description">')
        else:
            desc_len = len(desc_m.group(2).strip())
            if not 50 <= desc_len <= 160:
                warnings.append(
                    f"{path}: SEO — meta description is {desc_len} chars "
                    f"(recommended 50-160)"
                )
        og_missing = [
            prop
            for prop in ("og:title", "og:description")
            if not re.search(
                r'<meta[^>]+property=["\']' + re.escape(prop) + r'["\']', html, re.I
            )
        ]
        if og_missing:
            warnings.append(
                f"{path}: SEO — missing Open Graph tags: {', '.join(og_missing)}"
            )

    # 10. Hardcoded colour that ALREADY HAS A TOKEN (warn-only).
    #
    # Every design skill states "pages reference semantic tokens, zero hardcoded
    # hex". Until now that rule had no check at all, and a measurement on
    # 2026-08-14 found 3,642 raw hex values across the 55 canonical pages — the
    # rule had been pure prose for the life of the repo.
    #
    # Flagging all 3,642 would be useless. Most are one-off illustration colours
    # that legitimately have no token, and a warning that fires 931 times on one
    # skill is the shape that teaches people to skip the report (known-bugs
    # §7.3, same lesson).
    #
    # So this only flags a hex that EXACTLY equals a value the skill's own CSS
    # already defines as a custom property. Those are never judgement calls:
    # the author wrote #DD4F92 where --atl-rose is defined as exactly #DD4F92,
    # so the page silently opts out of theming — in a dual-theme skill that
    # literal survives the theme switch and the element stops responding.
    # Signal is high, noise is zero, and the fix is mechanical.
    token_values = colour_tokens("\n".join(css_parts))
    if token_values:
        # Scan only where a colour is APPLIED — attribute values and <style>
        # blocks — never text nodes. A palette page that prints "#DD4F92 rose ·
        # identity" as visible copy is documenting the colour, not styling with
        # it, and flagging that is the false positive this check exists to
        # avoid. Comments are dropped for the same reason.
        no_comments = re.sub(r"<!--.*?-->", "", html, flags=re.DOTALL)
        applied = "\n".join(
            [m.group(1) for m in re.finditer(r'="([^"]*)"', no_comments)]
            + re.findall(r"<style[^>]*>(.*?)</style>", no_comments, re.DOTALL | re.I)
        )
        seen: dict[str, set[str]] = {}
        for m in re.finditer(r"#([0-9a-fA-F]{6})\b", applied):
            key = "#" + m.group(1).upper()
            if key in token_values:
                seen.setdefault(key, set()).update(token_values[key])
        if seen:
            parts = [
                f"{hexv} → var({'/'.join(sorted(names))})"
                for hexv, names in sorted(seen.items())
            ]
            warnings.append(
                f"{path}: {len(seen)} hardcoded colour(s) that already have a "
                f"token: {', '.join(parts)} — a literal does not follow the "
                f"theme switch"
            )

    return errors, warnings


def colour_tokens(css_text: str) -> dict[str, set[str]]:
    """Map an uppercase #RRGGBB value to the custom properties defining it.

    Only 6-digit hex is collected. rgba()/hsl() token values are deliberately
    ignored: a page writing `rgba(221,79,146,0.12)` is usually building a tint
    the token set does not provide, which is a legitimate thing to do inline.
    """
    out: dict[str, set[str]] = {}
    for m in re.finditer(
        r"(--[a-z0-9-]+)\s*:\s*#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\s*[;}]",
        css_text,
        re.I,
    ):
        name, raw = m.group(1), m.group(2)
        if len(raw) == 3:
            raw = "".join(c * 2 for c in raw)
        out.setdefault("#" + raw.upper(), set()).add(name)
    return out


def parse_args(
    argv: list[str],
) -> tuple[str | None, list[str], list[str], bool, bool]:
    skill: str | None = None
    files: list[str] = []
    extra_css: list[str] = []
    allow_monolingual = False
    force_public = False
    for a in argv:
        if a.startswith("--skill="):
            skill = a.split("=", 1)[1].strip()
        elif a.startswith("--css="):
            extra_css.append(a.split("=", 1)[1].strip())
        elif a in ("--allow-monolingual", "--internal"):
            allow_monolingual = True
        elif a == "--force-public":
            force_public = True
        elif a in ("-h", "--help"):
            print(__doc__)
            sys.exit(0)
        else:
            files.append(a)
    return skill, files, extra_css, allow_monolingual, force_public


def main() -> int:
    skill, files, extra_css, allow_monolingual, force_public = parse_args(
        sys.argv[1:]
    )
    if not files:
        print(__doc__)
        return 2
    if skill is not None and skill not in SKILLS:
        print(f"unknown --skill '{skill}'. Valid: {sorted(SKILLS)}")
        return 2

    failures: list[str] = []
    warnings: list[str] = []
    for path in files:
        errs, warns = check_file(
            path, skill, extra_css, allow_monolingual, force_public
        )
        failures.extend(errs)
        warnings.extend(warns)
    if failures:
        print("design-review verify: FAIL")
        for line in failures:
            print(f"  • {line}")
        for line in warnings:
            print(f"  ⚠ {line}  [warn, non-blocking]")
        print(
            f"\n{len(failures)} issue(s). "
            f"See skills/design-review/references/known-bugs.md for the defense catalogue."
        )
        return 1
    label = f"--skill={skill}" if skill else "auto-detected skill"
    print(f"design-review verify: OK — {len(files)} file(s) passed ({label})")
    for line in warnings:
        print(f"  ⚠ {line}  [warn, non-blocking]")
    return 0


if __name__ == "__main__":
    sys.exit(main())
