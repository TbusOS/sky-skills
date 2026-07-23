---
name: md-to-pdf
description: >
  Convert Markdown files to well-formatted PDF with Chinese support, bookmarks, and page numbers.
  Uses PyMuPDF Story HTML rendering with DroidSansFallbackFull font for full CJK + Latin + special character coverage.
  Trigger on phrases like "markdown to pdf", "md转pdf", "生成pdf", "导出pdf", "markdown导出",
  or any request to convert .md files to PDF with proper Chinese rendering and bookmarks.
  Not for the reverse direction: to turn PDF/DOCX into Markdown, use doc-to-markdown instead.
---

# Markdown to PDF Converter

Convert Markdown files to professional PDFs with full Chinese support, clickable bookmarks, and page numbers.

## Features

- Full CJK + Latin + special character support (├── └── │ etc.)
- Auto-generated bookmarks from h1/h2/h3 headings with accurate page jumps
- Code blocks with background shading
- Tables, blockquotes, lists properly formatted
- Page numbers at bottom
- Auto font discovery (DroidSansFallbackFull, NotoSansCJK, WQY, etc.)

## Workflow

### 1. Ensure dependencies

```bash
python3 -c "import fitz" 2>/dev/null || pip3 install pymupdf
```

### 2. Find a CJK font

The script auto-searches for fonts in these locations:
- User-specified `--font` path
- `~/.fonts/`
- `/usr/share/fonts/`
- Android SDK fonts (DroidSansFallbackFull.ttf)

If no font is found automatically, locate one:

```bash
find / -name "DroidSansFallbackFull.ttf" -o -name "NotoSansCJK*" -o -name "wqy-zenhei*" 2>/dev/null | head -5
```

### 3. Run the converter

```bash
python3 <skill-dir>/scripts/md2pdf.py input.md output.pdf
```

With explicit font:
```bash
python3 <skill-dir>/scripts/md2pdf.py input.md output.pdf --font /path/to/DroidSansFallbackFull.ttf
```

### 4. Verify output

After generating, verify the PDF:

```python
import fitz
doc = fitz.open("output.pdf")
print(f"Pages: {len(doc)}")
print(f"Bookmarks: {len(doc.get_toc())}")
# Check first page text renders correctly
print(doc[0].get_text()[:300])
```

## Supported Markdown Elements

| Element | Syntax | PDF Rendering |
|---------|--------|--------------|
| Headings | `# ## ###` | Sized text + bookmark entry |
| Code blocks | ` ``` ` | Gray background, monospace-style |
| Inline code | `` `code` `` | Red text with pink background |
| Tables | `\| col \|` | Bordered table with header shading |
| Blockquotes | `> text` | Gray text with left border |
| Lists | `- item` / `1. item` | Bulleted / numbered |
| Bold | `**text**` | Bold text |
| Links | `[text](url)` | Text preserved, URL stripped |
| HR | `---` | Spacer |

## Font Recommendation

**DroidSansFallbackFull.ttf** is the recommended font. It produces ~7.7MB PDFs and covers:
- Latin characters (A-Z, a-z, 0-9)
- CJK Chinese characters
- Box-drawing characters (├── └── │)
- All common symbols

This font is bundled in Android SDK at `frameworks/base/data/fonts/DroidSansFallbackFull.ttf`.

## Bookmark accuracy

Bookmarks are located by finding each heading's text in the rendered pages, with
three safeguards (added 2026-07-23 after real breakage in a CJK document):

1. **Fallback beyond `search_for()`** — PyMuPDF's `search_for()` silently fails on
   some headings (observed with `、（）/` and enclosed numerals like `②④`). It used to
   fall back to page 1, so those bookmarks jumped to the cover. Now a normalized
   `get_text()` line scan catches them.
2. **Monotonic search** — each heading is searched from the previous heading's page
   onward, so a later heading can't match an earlier page that repeats the same words.
3. **HTML entities un-escaped** — a heading like `路径 <version>` is `&lt;version&gt;`
   in the intermediate HTML but renders as `<version>`; without un-escaping, the
   lookup could never match.

Verify after generating:

```python
import fitz, unicodedata
def norm(s): return unicodedata.normalize("NFC", s).strip()
d = fitz.open("output.pdf")
lines = [[norm(l) for l in d[i].get_text().split("\n")] for i in range(len(d))]
for lvl, title, pg in d.get_toc():
    key = norm(title)
    real = next((i+1 for i, ls in enumerate(lines) if any(key == l or key in l for l in ls)), None)
    if real != pg:
        print(f"BAD: {title} -> bookmark p{pg}, actually p{real}")
```

Regression baseline: two CJK documents (8 pages / 19 bookmarks and 11 pages /
28 bookmarks) both report 0 mismatched bookmarks.

## Edge Cases

- **No CJK font available**: Script exits with error message. User must provide `--font`.
- **Very long documents**: PyMuPDF handles multi-page layout automatically.
- **Complex nested lists**: Only single-level lists are supported; nested items render as flat.
- **Images in markdown**: Not supported; only text content is converted.
