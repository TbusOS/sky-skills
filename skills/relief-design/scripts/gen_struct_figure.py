#!/usr/bin/env python3
"""结构体布局图从 pahole 的输出生成，不靠人算。

为什么：布局图上每个偏移、每个空洞、每个大小都必须自洽，而人算一定会错。
第一版手写的图就写过「两个空洞共 15 字节」，实际 7+7=14。
**一张算错的布局图比没有图更糟** —— 读者会拿它当依据去改代码。

做法：`references/structs/*.c` 里放图上展示的那段结构体（内核类型用形状相同
的占位声明），用真编译器编出 DWARF，让 pahole 算布局，再把布局渲染成
`.relief-layout` 标记，写回 canonical 页的 `<!-- gen:struct X -->` 块之间。

用法:
  python3 skills/relief-design/scripts/gen_struct_figure.py            # 生成并写回
  python3 skills/relief-design/scripts/gen_struct_figure.py --check    # 只比对，不写
退出码 0 = 生成成功 / 页面里的图和 pahole 一致
"""
import re, subprocess, sys, tempfile, pathlib, os

ROOT = pathlib.Path(__file__).resolve().parents[3]
SRC = ROOT / 'skills/relief-design/references/structs/tp_data.c'
PAGE = ROOT / 'skills/relief-design/references/canonical/struct.html'
CHECK = '--check' in sys.argv

# 图上要画哪几个结构体，各自写回哪个标记块
FIGURES = ['tp_data', 'tp_cfg']

ROW = re.compile(r'^\s+(?P<type>.+?)\s+(?P<name>[\w\[\]]+?)\s*'
                 r'(?::(?P<bits>\d+))?;\s*/\*\s*(?P<off>\d+)(?::\s*(?P<bitoff>\d+))?\s+(?P<size>\d+)\s*\*/')
HOLE = re.compile(r'/\* XXX (?P<n>\d+) (?P<unit>bytes?|bits?) hole')
SIZE = re.compile(r'/\* size: (?P<size>\d+), cachelines: (?P<cl>\d+)')
HOLES = re.compile(r'holes: (?P<n>\d+), sum holes: (?P<sum>\d+)')


def pahole(obj, name):
    out = subprocess.run(['pahole', '-C', name, str(obj)],
                         capture_output=True, text=True, check=True).stdout
    if not out.strip():
        raise SystemExit(f'✗ pahole 对 {name} 没有输出 —— 这个类型进 DWARF 了吗？')
    return out


def parse(text):
    """→ (rows, meta)。rows 里 hole 也是一行,因为图上要把空洞画出来。"""
    rows, meta, pending_hole = [], {}, None
    for line in text.split('\n'):
        h = HOLE.search(line)
        if h:
            pending_hole = (int(h.group('n')), h.group('unit').rstrip('s'))
            continue
        m = ROW.match(line)
        if m:
            off, size = int(m.group('off')), int(m.group('size'))
            if pending_hole and pending_hole[1] == 'byte':
                prev_end = rows[-1]['off'] + rows[-1]['size'] if rows else 0
                rows.append({'hole': True, 'off': prev_end, 'size': pending_hole[0],
                             'name': '—', 'type': ''})
            pending_hole = None
            rows.append({'hole': False, 'off': off, 'size': size,
                         'name': m.group('name'), 'type': m.group('type').strip(),
                         'bits': int(m.group('bits')) if m.group('bits') else None,
                         'bitoff': int(m.group('bitoff')) if m.group('bitoff') else None})
            continue
        s = SIZE.search(line)
        if s:
            meta['size'] = int(s.group('size')); meta['cachelines'] = int(s.group('cl'))
        hh = HOLES.search(line)
        if hh:
            meta['holes'] = int(hh.group('n')); meta['sum_holes'] = int(hh.group('sum'))
    return rows, meta


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def render(rows, meta, open_attrs=''):
    """→ .relief-layout 的标记。位域挤在同一个字节里的,合成一行。"""
    # 保住原来那个 div 上的行内属性（比如 style="margin-top:18px"）——
    # 生成器只该管内容，不该顺手改掉排版
    out = [f'<div class="relief-layout"{open_attrs}>']
    emitted_cl = False
    i = 0
    while i < len(rows):
        r = rows[i]
        if not r['hole'] and r.get('bits'):
            # 同一个字节里的位域并成一行 —— 图上它们本来就共用一格
            grp = [r]
            while i + 1 < len(rows) and rows[i+1].get('bits') and rows[i+1]['off'] == r['off']:
                i += 1; grp.append(rows[i])
            names = ' / '.join(g['name'] for g in grp)
            bits = sum(g['bits'] for g in grp)
            spare = r['size'] * 8 - bits
            note_en = f'{bits} bits used, {spare} left over'
            note_zh = f'用了 {bits} 位，剩 {spare} 位'
            out.append(f'  <div class="relief-off">{r["off"]}</div>')
            out.append(f'  <div class="relief-fieldrow relief-raised"><b>{esc(names)}</b>'
                       f'<i><span class="lang-en">{note_en}</span>'
                       f'<span class="lang-zh">{note_zh}</span></i></div>')
            out.append(f'  <div class="relief-sz">{r["size"]} B</div>')
            i += 1
            continue

        if (not emitted_cl and meta.get('cachelines', 1) > 1 and r['off'] >= 64):
            out.append('  <div class="relief-cl"><span>cache line 64 B</span></div>')
            emitted_cl = True

        if r['hole']:
            out.append(f'  <div class="relief-off">{r["off"]}</div>')
            out.append('  <div class="relief-fieldrow relief-sunken relief-hole"><b>—</b>'
                       '<i><span class="lang-en">padding the compiler inserted</span>'
                       '<span class="lang-zh">编译器填的空洞</span></i></div>')
            out.append(f'  <div class="relief-sz">{r["size"]} B</div>')
        else:
            # 非对齐:大小是 2/4/8 但偏移不是它的倍数 —— arm64 上每次读都要走修正
            risk = r['size'] in (2, 4, 8) and r['off'] % r['size'] != 0
            cls = 'relief-fieldrow relief-raised' + (' relief-risk' if risk else '')
            if risk:
                note = (f'<i><span class="lang-en">{r["size"]*8}-bit field at offset '
                        f'{r["off"]} — unaligned</span>'
                        f'<span class="lang-zh">{r["size"]*8} 位字段落在偏移 {r["off"]} —— 非对齐</span></i>')
            else:
                note = f'<i>{esc(r["type"])}</i>' if r['type'] else '<i></i>'
            out.append(f'  <div class="relief-off">{r["off"]}</div>')
            out.append(f'  <div class="{cls}"><b>{esc(r["name"])}</b>{note}</div>')
            out.append(f'  <div class="relief-sz">{r["size"]} B</div>')
        i += 1
    if meta.get('cachelines', 1) > 1 and not emitted_cl:
        out.append('  <div class="relief-cl"><span>cache line 64 B</span></div>')
    out.append('</div>')
    return '\n'.join(out)


def main():
    with tempfile.TemporaryDirectory() as td:
        obj = pathlib.Path(td) / 'x.o'
        subprocess.run(['gcc', '-g', '-c', '-o', str(obj), str(SRC)], check=True)
        blocks = {}
        for name in FIGURES:
            rows, meta = parse(pahole(obj, name))
            if not rows:
                raise SystemExit(f'✗ {name} 一个字段都没解析到 —— pahole 的输出格式变了？')
            blocks[name] = (rows, meta)

    src = PAGE.read_text(encoding='utf-8')
    changed, bad = [], []
    for name, (rows, meta) in blocks.items():
        pat = re.compile(r'(<!-- gen:struct ' + name + r' -->\n).*?(\n\s*<!-- /gen:struct -->)', re.S)
        m = pat.search(src)
        if not m:
            bad.append(f'{name}: struct.html 里找不到 <!-- gen:struct {name} --> 块')
            continue
        cur = src[m.end(1):m.start(2)]
        keep = re.search(r'<div class="relief-layout"([^>]*)>', cur)
        markup = render(rows, meta, keep.group(1) if keep else '')
        if cur.strip() != markup.strip():
            if CHECK:
                bad.append(f'{name}: 页面上的布局图和 pahole 算出来的不一样 —— '
                           f'跑 gen_struct_figure.py 重新生成')
            else:
                src = src[:m.end(1)] + markup + src[m.start(2):]
                changed.append(name)
        s = meta.get('size'); h = meta.get('holes', 0); sh = meta.get('sum_holes', 0)
        print(f'  {name}: size {s} · holes {h} · sum holes {sh} · '
              f'cachelines {meta.get("cachelines")}')

    if CHECK:
        if bad:
            print('\n' + '\n'.join('  ✗ ' + b for b in bad))
            return 1
        print('页面上的布局图和 pahole 一致')
        return 0
    if bad:
        print('\n' + '\n'.join('  ✗ ' + b for b in bad))
        return 1
    if changed:
        PAGE.write_text(src, encoding='utf-8')
        print(f'写回 struct.html：{", ".join(changed)}')
    else:
        print('页面已经和 pahole 一致，没改动')
    return 0


if __name__ == '__main__':
    sys.exit(main())
