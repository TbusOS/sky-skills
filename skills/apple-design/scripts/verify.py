#!/usr/bin/env python3
"""
Verify a rendered HTML against apple-design invariants.

Usage:
  python3 skills/apple-design/scripts/verify.py path/to/output.html [...]

Exit code 1 if any check fails; prints every failure reason.
Run this BEFORE declaring any demo / template / flagship page done.
"""
from __future__ import annotations
import os
import re
import sys
from html.parser import HTMLParser


SKILL_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSS_PATH = os.path.join(SKILL_DIR, "assets", "apple.css")

PLACEHOLDER_PATTERN = re.compile(
    r"\[(?:hero[^\]]*|svg|img|photo|abstract[^\]]*|workspace[^\]]*|"
    r"[a-z][a-z0-9-]*\.icon|placeholder|todo|tbd|fixme)\]",
    re.I,
)

NARROW_HERO_CONTAINERS = {"apple-container"}
ACCEPTABLE_HERO_CONTAINERS = {"apple-container--hero", "apple-container--wide"}


class HeroContainerFinder(HTMLParser):
    """Finds the first element inside <section class="apple-hero">."""

    def __init__(self) -> None:
        super().__init__()
        self.in_hero = False
        self.depth_inside_hero = 0
        self.found: str | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        classes = dict(attrs).get("class", "") or ""
        tokens = classes.split()
        if "apple-hero" in tokens:
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


def defined_classes(css_text: str) -> set[str]:
    return {m.group(1) for m in re.finditer(r"\.(apple-[a-z0-9-]+)", css_text)}


def used_classes(html: str) -> set[str]:
    used: set[str] = set()
    for m in re.finditer(r'class="([^"]+)"', html):
        for token in m.group(1).split():
            if token.startswith("apple-"):
                used.add(token)
    return used


def check_file(path: str) -> list[str]:
    errors: list[str] = []
    if not os.path.exists(path):
        return [f"{path}: not found"]
    html = open(path, encoding="utf-8").read()

    # 1. placeholder brackets
    brackets = PLACEHOLDER_PATTERN.findall(html)
    if brackets:
        errors.append(
            f"{path}: placeholder strings: {sorted(set(brackets))}"
        )

    # 2. DOCTYPE + viewport
    if not re.search(r"<!doctype html>", html, re.I):
        errors.append(f"{path}: missing <!doctype html>")
    if not re.search(r'<meta[^>]+name=["\']viewport', html, re.I):
        errors.append(f"{path}: missing viewport meta")

    # 3. Hero container (if there is a hero)
    finder = HeroContainerFinder()
    finder.feed(html)
    if finder.found is not None:
        tokens = set(finder.found.split())
        if tokens.intersection(NARROW_HERO_CONTAINERS) and not tokens.intersection(
            ACCEPTABLE_HERO_CONTAINERS
        ):
            errors.append(
                f"{path}: hero uses narrow container ({finder.found!r}); "
                f"expected apple-container--hero or --wide"
            )
        elif not tokens.intersection(ACCEPTABLE_HERO_CONTAINERS):
            # hero exists but container is non-apple — warn if it's non-standard
            if not any(t.startswith("apple-container") for t in tokens):
                errors.append(
                    f"{path}: hero inner element lacks any .apple-container* class ({finder.found!r})"
                )

    # 4. class usage — all classes used must exist in apple.css
    if not os.path.exists(CSS_PATH):
        errors.append(f"apple.css not found at {CSS_PATH}")
    else:
        defined = defined_classes(open(CSS_PATH, encoding="utf-8").read())
        for cls in sorted(used_classes(html)):
            if cls not in defined:
                errors.append(f"{path}: undefined class '{cls}' (not in apple.css)")

    # 5. SVG tag balance
    opens = len(re.findall(r"<svg\b", html))
    closes = len(re.findall(r"</svg>", html))
    if opens != closes:
        errors.append(f"{path}: unbalanced <svg> tags ({opens} open, {closes} close)")

    # 6. Modifier-only container (BEM bug): '--hero' / '--wide' / '--narrow'
    #    without the base .apple-container will lose margin: 0 auto centering.
    for m in re.finditer(r'class="([^"]+)"', html):
        classes = m.group(1).split()
        for cls in classes:
            if re.fullmatch(r"apple-container--(?:hero|wide|narrow)", cls):
                if "apple-container" not in classes:
                    errors.append(
                        f"{path}: '{cls}' used without base 'apple-container' — "
                        f"margin:0 auto won't apply; write class=\"apple-container {cls}\""
                    )

    return errors


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    failures: list[str] = []
    for path in sys.argv[1:]:
        failures.extend(check_file(path))
    if failures:
        print("apple-design verify: FAIL")
        for line in failures:
            print(f"  • {line}")
        print(f"\n{len(failures)} issue(s). See references/dos-and-donts.md.")
        return 1
    print(f"apple-design verify: OK — {len(sys.argv) - 1} file(s) passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
