#!/usr/bin/env python3
"""
Markdown to PDF converter with Chinese support and bookmarks.
Uses PyMuPDF Story HTML rendering + DroidSansFallbackFull font.

Usage:
    python3 md2pdf.py <input.md> <output.pdf> [--font /path/to/font.ttf]
"""

import re
import os
import sys
import argparse
import fitz


DEFAULT_FONT_CANDIDATES = [
    # Android SDK fonts
    "DroidSansFallbackFull.ttf",
    # Common system fonts
    "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",
    "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf",
]


def find_font(font_arg=None):
    """Find a suitable CJK font."""
    if font_arg and os.path.exists(font_arg):
        return font_arg

    # Search common paths
    for candidate in DEFAULT_FONT_CANDIDATES:
        if os.path.exists(candidate):
            return candidate

    # Search recursively in common locations
    search_dirs = [
        os.path.expanduser("~/.fonts"),
        "/usr/share/fonts",
    ]
    for d in search_dirs:
        if not os.path.isdir(d):
            continue
        for root, dirs, files in os.walk(d):
            for f in files:
                if "DroidSansFallback" in f or "NotoSansCJK" in f or "wqy-zenhei" in f:
                    return os.path.join(root, f)

    return None


def build_css(font_path):
    return """
@font-face {
    font-family: 'CJKFont';
    src: url('%s');
}
body {
    font-family: 'CJKFont', sans-serif;
    font-size: 10pt;
    line-height: 1.6;
    color: #1a1a1a;
}
h1 {
    font-size: 20pt;
    margin-top: 20pt;
    margin-bottom: 12pt;
    color: #1a1a1a;
}
h2 {
    font-size: 15pt;
    margin-top: 16pt;
    margin-bottom: 8pt;
    color: #2a2a2a;
}
h3 {
    font-size: 12pt;
    margin-top: 12pt;
    margin-bottom: 6pt;
    color: #3a3a3a;
}
pre {
    font-family: 'CJKFont', monospace;
    font-size: 8pt;
    line-height: 1.4;
    background-color: #f5f5f5;
    border: 1px solid #e0e0e0;
    padding: 8px 10px;
    margin: 6pt 0;
    white-space: pre-wrap;
    word-wrap: break-word;
}
code {
    font-family: 'CJKFont', monospace;
    font-size: 8pt;
    color: #c7254e;
    background-color: #f9f2f4;
    padding: 1px 4px;
}
blockquote {
    color: #555;
    border-left: 3px solid #ccc;
    padding-left: 12px;
    margin-left: 0;
    font-size: 9pt;
}
table {
    border-collapse: collapse;
    margin: 8pt 0;
    width: 100%%%%;
}
th, td {
    border: 1px solid #ccc;
    padding: 5px 8px;
    font-size: 9pt;
    text-align: left;
}
th {
    background-color: #e8e8e8;
}
ul, ol {
    padding-left: 20pt;
}
li {
    margin-bottom: 3pt;
}
""" % font_path


def escape_html(text):
    return text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def inline_format(text):
    text = escape_html(text)
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
    return text


def md_to_html(md_path):
    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    html_parts = []
    i = 0

    while i < len(lines):
        line = lines[i].rstrip('\n')

        if not line.strip():
            i += 1
            continue

        # Headings
        m = re.match(r'^(#{1,3})\s+(.+)', line)
        if m:
            level = len(m.group(1))
            title = inline_format(m.group(2).strip())
            html_parts.append(f'<h{level}>{title}</h{level}>')
            i += 1
            continue

        # Code blocks
        if line.strip().startswith('```'):
            code_lines = []
            i += 1
            while i < len(lines) and not lines[i].strip().startswith('```'):
                code_lines.append(escape_html(lines[i].rstrip('\n')))
                i += 1
            i += 1
            code = '\n'.join(code_lines)
            html_parts.append(f'<pre>{code}</pre>')
            continue

        # Tables
        if '|' in line and i + 1 < len(lines) and re.match(r'^[\s|:-]+$', lines[i+1].strip()):
            headers = [c.strip() for c in line.strip('| \n').split('|')]
            i += 2
            rows = []
            while i < len(lines) and '|' in lines[i] and lines[i].strip():
                cells = [c.strip() for c in lines[i].strip('| \n').split('|')]
                rows.append(cells)
                i += 1
            html_parts.append('<table>')
            html_parts.append('<tr>' + ''.join(f'<th>{inline_format(h)}</th>' for h in headers) + '</tr>')
            for row in rows:
                html_parts.append('<tr>' + ''.join(f'<td>{inline_format(c)}</td>' for c in row) + '</tr>')
            html_parts.append('</table>')
            continue

        # Blockquotes
        if line.startswith('>'):
            parts = []
            while i < len(lines) and lines[i].startswith('>'):
                parts.append(inline_format(lines[i].lstrip('> ').strip()))
                i += 1
            html_parts.append('<blockquote>' + '<br/>'.join(parts) + '</blockquote>')
            continue

        # Unordered lists
        if re.match(r'^[-*]\s+', line):
            items = []
            while i < len(lines) and re.match(r'^[-*]\s+', lines[i]):
                items.append(inline_format(re.sub(r'^[-*]\s+', '', lines[i].rstrip('\n'))))
                i += 1
            html_parts.append('<ul>' + ''.join(f'<li>{item}</li>' for item in items) + '</ul>')
            continue

        # Ordered lists
        if re.match(r'^\d+\.\s+', line):
            items = []
            while i < len(lines) and re.match(r'^\d+\.\s+', lines[i]):
                items.append(inline_format(re.sub(r'^\d+\.\s+', '', lines[i].rstrip('\n'))))
                i += 1
            html_parts.append('<ol>' + ''.join(f'<li>{item}</li>' for item in items) + '</ol>')
            continue

        # Horizontal rules
        if re.match(r'^---+$', line.strip()):
            html_parts.append('<hr/>')
            i += 1
            continue

        # Normal paragraphs
        html_parts.append(f'<p>{inline_format(line)}</p>')
        i += 1

    return '\n'.join(html_parts)


def build_pdf(md_path, pdf_path, font_path):
    css = build_css(font_path)
    html_body = md_to_html(md_path)

    # Extract headings for bookmarks
    headings = []
    for m in re.finditer(r'<(h[1-3])>(.*?)</\1>', html_body):
        level = int(m.group(1)[1])
        title = re.sub(r'<[^>]+>', '', m.group(2))
        headings.append((level, title))

    full_html = f'<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body>{html_body}</body></html>'

    story = fitz.Story(full_html, user_css=css)

    page_w, page_h = fitz.paper_size("a4")
    content_rect = fitz.Rect(60, 50, page_w - 60, page_h - 40)
    mediabox = fitz.Rect(0, 0, page_w, page_h)
    tmp_path = pdf_path + '.tmp'

    doc_writer = fitz.DocumentWriter(tmp_path)

    def rectfn(rect_num, filled):
        return mediabox, content_rect, fitz.Identity

    story.write(doc_writer, rectfn)
    doc_writer.close()

    # Open temp PDF, add page numbers and bookmarks
    doc = fitz.open(tmp_path)

    for pn in range(len(doc)):
        page = doc[pn]
        page.insert_text(
            fitz.Point(page_w / 2 - 10, page_h - 25),
            f"- {pn + 1} -",
            fontsize=8, color=(0.6, 0.6, 0.6)
        )

    # Add bookmarks by searching heading text
    toc = []
    for level, title in headings:
        search = title[:15]
        found = False
        for pn in range(len(doc)):
            results = doc[pn].search_for(search)
            if results:
                toc.append([level, title, pn + 1, results[0].y0])
                found = True
                break
        if not found:
            toc.append([level, title, 1])

    if toc:
        doc.set_toc(toc)

    total = len(doc)
    doc.save(pdf_path)
    doc.close()
    os.remove(tmp_path)

    return total, len(toc)


def main():
    parser = argparse.ArgumentParser(description='Convert Markdown to PDF with Chinese support and bookmarks')
    parser.add_argument('input', help='Input Markdown file')
    parser.add_argument('output', help='Output PDF file')
    parser.add_argument('--font', help='Path to TTF/TTC font file with CJK support', default=None)
    args = parser.parse_args()

    if not os.path.exists(args.input):
        print(f'Error: {args.input} not found', file=sys.stderr)
        sys.exit(1)

    font_path = find_font(args.font)
    if not font_path:
        print('Error: No CJK font found. Use --font to specify one.', file=sys.stderr)
        sys.exit(1)

    print(f'Using font: {font_path}')
    pages, bookmarks = build_pdf(args.input, args.output, font_path)
    print(f'PDF generated: {args.output} ({pages} pages, {bookmarks} bookmarks)')


if __name__ == '__main__':
    main()
