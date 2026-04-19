#!/usr/bin/env python3
"""
Unified structural verifier for all design skills.

Usage:
  python3 skills/design-review/scripts/verify.py [--skill=<name>] <html-path> [...]

If --skill is omitted, the script auto-detects the skill by scanning the HTML
for a `<link>` to one of {anthropic|apple|ember|sage}.css. Pass --skill when
detection is ambiguous.

Exit code:
  0 — all files pass
  1 — at least one check failed (every failure is printed)
  2 — bad CLI (no files / unknown skill / ambiguous autodetect)

Checks:
  1. No `[placeholder]` brackets leaked into HTML
  2. <!doctype html> + viewport meta present
  3. Hero inner element uses an acceptable container (per skill)
  4. Every `class="{prefix}-*"` token is defined in the skill's CSS
  5. <svg> tag balance
  6. Container modifier never used without its base class (BEM bug)
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
    # Prefix has a trailing '-'; match e.g. `.sage-[a-z0-9-]+`.
    pattern = re.compile(r"\.(" + re.escape(prefix) + r"[a-z0-9-]+)")
    return {m.group(1) for m in pattern.finditer(css_text)}


def used_classes(html: str, prefix: str) -> set[str]:
    used: set[str] = set()
    for m in re.finditer(r'class="([^"]+)"', html):
        for token in m.group(1).split():
            if token.startswith(prefix):
                used.add(token)
    return used


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


def check_file(path: str, forced_skill: str | None) -> list[str]:
    errors: list[str] = []
    if not os.path.exists(path):
        return [f"{path}: not found"]
    html = open(path, encoding="utf-8").read()

    skill = forced_skill or autodetect_skill(html)
    if skill is None:
        return [
            f"{path}: cannot auto-detect skill from HTML "
            f"(no unique link to one of anthropic.css/apple.css/ember.css/sage.css). "
            f"Pass --skill=<name> explicitly."
        ]
    if skill not in SKILLS:
        return [f"{path}: unknown --skill '{skill}'. Valid: {sorted(SKILLS)}"]

    cfg = SKILLS[skill]
    prefix = cfg["prefix"]
    hero_class = prefix + "hero"
    css_path = os.path.join(REPO_ROOT, "skills", cfg["dir"], "assets", cfg["css"])

    # 1. placeholder brackets
    brackets = PLACEHOLDER_PATTERN.findall(html)
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

    # 4. class usage — all classes used must exist in the skill's CSS
    if not os.path.exists(css_path):
        errors.append(f"{cfg['css']} not found at {css_path}")
    else:
        defined = defined_classes(open(css_path, encoding="utf-8").read(), prefix)
        for cls in sorted(used_classes(html, prefix)):
            if cls not in defined:
                errors.append(f"{path}: undefined class '{cls}' (not in {cfg['css']})")

    # 5. SVG tag balance
    opens = len(re.findall(r"<svg\b", html))
    closes = len(re.findall(r"</svg>", html))
    if opens != closes:
        errors.append(f"{path}: unbalanced <svg> tags ({opens} open, {closes} close)")

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

    return errors


def parse_args(argv: list[str]) -> tuple[str | None, list[str]]:
    skill: str | None = None
    files: list[str] = []
    for a in argv:
        if a.startswith("--skill="):
            skill = a.split("=", 1)[1].strip()
        elif a in ("-h", "--help"):
            print(__doc__)
            sys.exit(0)
        else:
            files.append(a)
    return skill, files


def main() -> int:
    skill, files = parse_args(sys.argv[1:])
    if not files:
        print(__doc__)
        return 2
    if skill is not None and skill not in SKILLS:
        print(f"unknown --skill '{skill}'. Valid: {sorted(SKILLS)}")
        return 2

    failures: list[str] = []
    for path in files:
        failures.extend(check_file(path, skill))
    if failures:
        print("design-review verify: FAIL")
        for line in failures:
            print(f"  • {line}")
        print(
            f"\n{len(failures)} issue(s). "
            f"See skills/design-review/references/known-bugs.md for the defense catalogue."
        )
        return 1
    label = f"--skill={skill}" if skill else "auto-detected skill"
    print(f"design-review verify: OK — {len(files)} file(s) passed ({label})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
