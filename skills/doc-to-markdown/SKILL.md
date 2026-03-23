---
name: doc-to-markdown
description: >
  Convert documents (PDF, DOCX) in a directory to well-formatted Markdown files with images extracted.
  Use this skill whenever the user wants to convert documents to markdown, make documents readable
  for future reference, extract content from PDFs or Word files into markdown format, or batch-convert
  a folder of documents. Trigger on phrases like "convert to markdown", "转成markdown", "转换成md",
  "文档转换", "把文档变成可读的", "提取文档内容", or any request involving turning PDF/DOCX files
  into a text-based readable format with images preserved.
---

# Doc-to-Markdown Converter

Convert PDF and DOCX files to clean Markdown with extracted images. Supports single file or batch directory conversion.

## Output Structure

```
<output-dir>/
├── <doc1-name>.md
├── <doc2-name>.md
└── images/
    ├── <doc1-slug>/
    │   ├── sec01_01.png
    │   ├── sec01_02_boot_flow.png
    │   └── sec02_01.png
    └── <doc2-slug>/
        └── ...
```

Image naming convention: `sec{章节号}_{序号}_{描述}.png` — makes images easy to find and associate with document章节。

## Workflow

### 1. Confirm with user

Identify the source (single file or directory) and confirm:
- What to convert
- Where to put output (default: create a `markdown/` dir in project root, or user can specify)

### 2. Ensure dependencies

```bash
python3 -c "import fitz" 2>/dev/null || pip3 install pymupdf
python3 -c "from docx import Document" 2>/dev/null || pip3 install python-docx
```

### 3. Run the converter

The bundled `scripts/convert.py` handles the core conversion.

**Single file:**
```bash
python3 <skill-dir>/scripts/convert.py /path/to/file.pdf --output /project/markdown/
```

**Batch directory:**
```bash
python3 <skill-dir>/scripts/convert.py /path/to/docs/ --output /project/markdown/
```

What the script handles:
- **PDF**: Extracts text with heading detection, extracts embedded images per page. For scanned PDFs (no text layer), exports full page as 2x PNG.
- **DOCX**: Extracts text preserving heading/list/code styles, extracts PNG/JPEG images, attempts EMF/WMF conversion via LibreOffice or PIL.
- **Image placement**: Images are inserted inline near the paragraphs that reference them, not dumped at the end.
- **Tables**: Converted to markdown table format.

### 4. Post-processing (important!)

After the script runs, the output needs human-guided curation to become truly useful. This is where you add value beyond raw conversion:

1. **Read the generated markdown** to verify text quality — fix garbled headings, broken lists, or misformatted code blocks.

2. **Review extracted images** — read the image files to check which are:
   - Substantive (diagrams, flowcharts, architecture drawings, code screenshots) → **keep**
   - Decorative (logos, horizontal rules, tiny icons, blank images) → **delete**

3. **Rename images** to descriptive names based on content:
   - `sec01_01.png` → `sec01_01_验签流程图.png` (if it shows verification flow)
   - `sec03_02.png` → `sec03_02_efuse_layout.png` (if it shows eFuse layout)
   - Update the markdown references to match

4. **For EMF/WMF diagrams that couldn't be extracted**: If the user provides a screenshot or describes the diagram, recreate it using Python PIL and save as PNG. This is common for Visio diagrams embedded in Word docs — they're the most valuable images and worth recreating.

5. **Place images contextually** — if images ended up in "Other Images" section at the end, move the `![...]()` references to where they logically belong in the text.

### 5. Report results

Show the user:
- File tree of what was generated
- Number of images kept vs removed
- Any EMF/WMF files that couldn't be converted (suggest user provide screenshots from original doc)
- Any issues encountered

## Edge Cases

- **Scanned PDFs**: Page images are exported as fallback; text will be empty. Note this in the markdown.
- **Password-protected PDFs**: Report to user if PyMuPDF can't open.
- **Large PDFs (>50 pages)**: Still convert, but warn user. Consider extracting only pages with figures.
- **Chinese content**: PyMuPDF and python-docx handle CJK well, no special handling needed.
- **Complex tables with merged cells**: Best-effort markdown tables; suggest "see original" for very complex ones.
