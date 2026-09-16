#!/usr/bin/env python3
"""把网络字体搬进仓，中日韩做子集。

为什么要做这件事：现在所有页面都从 Google Fonts 现取字体。断网渲染跟基线
差 3.55%（比换浏览器还严重），而且**字体没生效是不报错的** —— 标题会悄悄
回落成系统字体，页面看着仍然成立。2026-09-16 修的那个「字体名用中文直角
引号」就是同一类坏法，那次是写错，这次是取不到，后果一模一样。

为什么不整份搬：全量是 11.5 MB，其中 87% 是中日韩（Noto Sans SC 4.31 MB +
Noto Serif SC 5.75 MB）。而整个仓库只用到两千多个字形，全量字体是两万多字。

所以分两种处理：
  · 拉丁字体 —— **原样搬 Google 自己的 woff2**，只挑 unicode-range 和本仓
    用字有交集的那些块。不做子集：拉丁本来就小，而且原样搬等于零缺字风险，
    可变字重也照样能用。
  · 中日韩 —— 必须做子集。用可变字体源，一档盖 100–900 全部字重。
    子集是按**当前仓库用字**切的，所以**必须配 check_fonts.py**：
    以后新写一个没出现过的汉字，它会回落到系统字体而不报错。

用法:
  python3 skills/design-review/scripts/build_fonts.py            # 生成
  python3 skills/design-review/scripts/build_fonts.py --dry-run  # 只报要下什么、多大
"""
import json, os, re, subprocess, sys, pathlib, urllib.request, urllib.parse

ROOT = pathlib.Path(__file__).resolve().parents[3]
OUT  = ROOT / 'assets' / 'fonts'
UA   = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 '
                      '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
DRY  = '--dry-run' in sys.argv

# 中日韩用可变字体源，一档盖全部字重。
CJK_SOURCES = {
    'Noto Sans SC':  'https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@main/Sans/Variable/OTF/Subset/NotoSansSC-VF.otf',
    # Serif SC 21.6 MB，超过 jsdelivr 的单文件上限会 403，只能走 raw
    'Noto Serif SC': 'https://raw.githubusercontent.com/notofonts/noto-cjk/main/Serif/Variable/OTF/Subset/NotoSerifSC-VF.otf',
}


def fetch(url, binary=True):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=180) as r:
        return r.read() if binary else r.read().decode('utf-8')


def used_codepoints():
    """仓库里出现过的全部字符。按文件扫,不区分是不是会渲染 —— 宁可多留。"""
    files = [f for f in subprocess.run(
        ['git', 'ls-files', '*.html', '*.css', '*.md', '*.svg'],
        cwd=ROOT, capture_output=True, text=True).stdout.split()
        if 'node_modules' not in f]
    cps = set()
    for f in files:
        try:
            for ch in (ROOT / f).read_text(encoding='utf-8').replace('\n', ''):
                cps.add(ord(ch))
        except (UnicodeDecodeError, OSError):
            continue
    # 空格一定要留！2026-09-16 踩过：以为空格不用管，subset 掉之后
    # 每个空格都回落到 DejaVu Sans，宽度不一样，整页版面偏移。
    # CDP 的 CSS.getPlatformFontsForNode 一问就看出来（"Noto Sans SC ×14
    # DejaVu Sans ×3"），而肉眼、截图、对比度检查全都看不出来。
    cps.add(0x20)
    return cps, len(files)


def parse_range(spec):
    """unicode-range: U+0-10FFFF, U+4e00-9fff → 一组 (lo,hi)"""
    out = []
    for part in spec.split(','):
        part = part.strip().upper().replace('U+', '')
        if not part:
            continue
        if '-' in part:
            a, b = part.split('-', 1)
            out.append((int(a, 16), int(b, 16)))
        elif '?' in part:
            out.append((int(part.replace('?', '0'), 16), int(part.replace('?', 'F'), 16)))
        else:
            out.append((int(part, 16), int(part, 16)))
    return out


def google_urls():
    urls = set()
    # 上一次跑记下的 source 优先 —— HTML 里的 <link> 改写之后就找不回来了，
    # 只有 manifest 还留着。脚本必须能跑第二遍。
    mf = OUT / 'manifest.json'
    if mf.exists():
        try:
            for owner, u in json.loads(mf.read_text(encoding='utf-8')).get('src_url', {}).items():
                urls.add((u, owner))
        except (ValueError, OSError):
            pass
    for f in subprocess.run(['git', 'ls-files', '*fonts*.css'],
                            cwd=ROOT, capture_output=True, text=True).stdout.split():
        if f.startswith('assets/fonts/'):
            continue                      # 这是生成目录，不是哪个 skill 的输入
        # 先认生成块里记下的 source（脚本跑过一遍之后 @import 已经不在了），
        # 再认原始的 @import。缺了这一步，重跑会生成空列表。
        txt = (ROOT / f).read_text(encoding='utf-8')
        m = re.search(r'/\* source: (https://fonts\.googleapis\.com/[^ ]*) \*/', txt) \
            or re.search(r'https://fonts\.googleapis\.com/css2\?[^"\')\s]*', txt)
        if m:
            urls.add((m.group(1) if m.lastindex else m.group(0), f))
    for line in subprocess.run(['git', 'grep', '-ohE',
                                r'https://fonts\.googleapis\.com/css2\?[^"]*', '--', '*.html'],
                               cwd=ROOT, capture_output=True, text=True).stdout.split('\n'):
        if line.strip():
            urls.add((line.strip(), '(html inline)'))
    return sorted(urls)


FACE = re.compile(r'@font-face\s*\{(.*?)\}', re.S)


def descr(block, key):
    m = re.search(re.escape(key) + r'\s*:\s*([^;]+);', block)
    return m.group(1).strip() if m else None


def ranges(cps):
    """把码点压成 ["U+20-7E", "U+4E00", ...] 这种区间，manifest 才读得下。"""
    out, i = [], 0
    while i < len(cps):
        j = i
        while j + 1 < len(cps) and cps[j + 1] == cps[j] + 1:
            j += 1
        out.append(f'U+{cps[i]:04X}' if i == j else f'U+{cps[i]:04X}-{cps[j]:04X}')
        i = j + 1
    return out


def slug(*parts):
    s = '-'.join(str(p) for p in parts).lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


BEGIN = '/* >>> 以下 @font-face 由 build_fonts.py 生成，别手改 <<< */'
# 生成块里要留住原始那条 Google 请求 —— 否则脚本跑第二遍就找不到「本来要哪些
# 字体」，会生成一份空的 face 列表，而且不报错。2026-09-16 真跑出来过一次。
SRCLINE = '/* source: %s */'
END   = '/* <<< 生成结束 >>> */'
IMPORT = re.compile(r'@import\s+url\(\s*["\']?https://fonts\.googleapis\.com/[^)]*\)\s*;')
LINK = re.compile(r'<link[^>]+fonts\.googleapis\.com[^>]*>\s*|<link[^>]+fonts\.gstatic\.com[^>]*>\s*')


def faces_css(faces, prefix, src_url=None):
    out = [BEGIN]
    if src_url:
        out.append(SRCLINE % src_url)
    for f in faces:
        parts = [f"@font-face{{font-family:'{f['family']}'",
                 f"font-style:{f['style']}",
                 f"font-weight:{f['weight']}",
                 "font-display:swap",
                 f"src:url({prefix}{f['file']}) format('woff2')"]
        if f.get('range'):
            parts.append('unicode-range:' + f['range'])
        out.append(';'.join(parts) + '}')
    out.append(END)
    return '\n'.join(out)


def write_css(manifest):
    """把各 skill 的 fonts.css 里那行 @import 换成本地 @font-face。

    只换那一行 —— 文件开头那段解释「为什么选这几个字体」的注释和底下的
    :root 变量都原样留着，它们是人写的。"""
    for owner, faces in manifest['per_css'].items():
        if owner == '(html inline)':
            continue
        path = ROOT / owner
        src = path.read_text(encoding='utf-8')
        depth = len(pathlib.Path(owner).parts) - 1        # 从这个 css 回到仓库根
        prefix = '../' * depth + 'assets/fonts/'
        block = faces_css(faces, prefix, manifest['src_url'].get(owner))
        if BEGIN in src:                                   # 重跑：换掉旧块
            src = re.sub(re.escape(BEGIN) + r'.*?' + re.escape(END), block, src, flags=re.S)
        else:
            m = IMPORT.search(src)
            assert m, f'{owner} 里找不到 @import，不知道该把 @font-face 放哪'
            src = src[:m.start()] + block + src[m.end():]
        path.write_text(src, encoding='utf-8')
        print(f'  改写 {owner}  ({len(faces)} 个 face)')

    # 直接在 HTML 里 link 的那两个页面：换成一个本地 css
    inline = manifest['per_css'].get('(html inline)', [])
    if inline:
        gen = OUT / 'inline-pages.css'
        gen.write_text(faces_css(inline, './',
                       manifest['src_url'].get('(html inline)')) + '\n', encoding='utf-8')
        for html in subprocess.run(['git', 'grep', '-l', 'fonts.googleapis.com', '--', '*.html'],
                                   cwd=ROOT, capture_output=True, text=True).stdout.split():
            hp = ROOT / html
            t = hp.read_text(encoding='utf-8')
            depth = len(pathlib.Path(html).parts) - 1
            rel = '../' * depth + 'assets/fonts/inline-pages.css'
            t = LINK.sub('', t)
            t = t.replace('</head>', f'<link rel="stylesheet" href="{rel}">\n</head>', 1)
            hp.write_text(t, encoding='utf-8')
            print(f'  改写 {html}')


def write_license():
    """生成 assets/fonts/LICENSE.md。

    把字体搬进公开仓 = 再分发。这十三个族全是 SIL OFL 1.1，
    **OFL 要求随附许可证正文和每个族的版权声明** —— 不是可选的。
    版权字串直接从字体文件的 name 表里读（nameID 0），不手抄，
    换字体或换版本时自动跟着变。"""
    from fontTools.ttLib import TTFont
    fams = {}
    for f in sorted(OUT.glob('*.woff2')):
        n = {r.nameID: str(r) for r in TTFont(str(f))['name'].names if r.platformID == 3}
        base = (n.get(16) or n.get(1, '?'))
        for suffix in (' Thin', ' Light', ' ExtraLight', ' Medium', ' SemiBold', ' Regular'):
            if base.endswith(suffix):
                base = base[: -len(suffix)]
        base = base.strip()
        fams.setdefault(base, {'c': n.get(0, ''), 'u': n.get(14, ''), 'n': 0})
        fams[base]['n'] += 1
    subset = {c['family'] for c in manifest_cjk}
    lines = ['# Fonts bundled in this repository', '',
             'Vendored so the pages render the same offline as online — and because a font that',
             'fails to load does not report an error, it just quietly renders in something else.',
             'Generated by `skills/design-review/scripts/build_fonts.py`; do not edit by hand.', '',
             'Every family below is licensed under the **SIL Open Font License 1.1**',
             '(full text at the end of this file).', '']
    lines.append('| Family | Files | Subset? | Copyright |')
    lines.append('|---|---|---|---|')
    for fam in sorted(fams):
        v = fams[fam]
        sub = 'yes — cut to the characters this repo uses' if fam in subset else 'no — upstream woff2 as served'
        lines.append(f'| [{fam}]({v["u"]}) | {v["n"]} | {sub} | {v["c"]} |')
    lines += ['',
              'The two CJK families are **subsets**: the full faces are about 10 MB together and',
              'this repository uses roughly two thousand glyphs. OFL permits subsetting; the',
              'subsets stay under the same licence. Everything else is the upstream woff2,',
              'unmodified, with only the unicode-range blocks this repository needs.', '',
              '---', '', '## SIL Open Font License, Version 1.1', '', '```']
    lines += (pathlib.Path(__file__).parent / 'OFL-1.1.txt').read_text(encoding='utf-8').rstrip().split('\n')
    lines += ['```', '']
    (OUT / 'LICENSE.md').write_text('\n'.join(lines), encoding='utf-8')
    print(f'  写了 LICENSE.md（{len(fams)} 个字体族，全部 OFL 1.1）')


def main():
    cps, nfiles = used_codepoints()
    print(f'扫了 {nfiles} 个文件，用到 {len(cps)} 个不同字符')
    cjk_used = sorted(c for c in cps if c > 0x2000)
    print(f'其中 U+2000 以上（中文、标点、箭头等）：{len(cjk_used)} 个')

    if not DRY:
        OUT.mkdir(parents=True, exist_ok=True)

    manifest = {'latin': [], 'cjk': [], 'per_css': {}, 'src_url': {}}
    cjk_by_owner = {}
    seen_files = {}          # 已落盘的 woff2，按源 URL 去重
    total = 0

    # ── 拉丁：原样搬 Google 的 woff2，只挑和本仓用字有交集的块 ──
    for url, owner in google_urls():
        manifest['src_url'][owner] = url
        css = fetch(url, binary=False)
        faces = []
        for block in FACE.findall(css):
            fam = (descr(block, 'font-family') or '').strip('\'"')
            if fam in CJK_SOURCES:
                # 记下这个 css 为这个族请求了哪些字重。**必须逐档声明** ——
                # Google 只声明请求过的那几档，浏览器遇到没声明的字重会就近取整；
                # 如果这里只写一条 font-weight:100 900，可变字体会渲染出真实的
                # 中间字重，和原来不一样。实测 600 会从 323px 变成 321px，
                # 800 从 343 变成 329 —— 页面高度差 51px，而且不报错。
                cjk_by_owner.setdefault(owner, {}).setdefault(fam, set()).add(
                    descr(block, 'font-weight') or '400')
                continue                      # 中日韩走下面的子集分支
            rng = descr(block, 'unicode-range')
            if rng:
                if not any(any(lo <= c <= hi for lo, hi in parse_range(rng)) for c in cps):
                    continue                  # 这一块一个字都用不到
            src = re.search(r'url\((https://fonts\.gstatic\.com/[^)]+)\)', block)
            if not src:
                continue
            u = src.group(1)
            if u in seen_files:
                name = seen_files[u]
            else:
                # 名字里不写字重 —— 可变字体的多个字重共用同一个文件，
                # 写上去会让人以为「500 的那个文件」存在，其实不存在。
                style = descr(block, 'font-style') or 'normal'
                name = f'{slug(fam, style)}-{len(seen_files):03d}.woff2'
                if not DRY:
                    data = fetch(u)
                    (OUT / name).write_bytes(data)
                    total += len(data)
                seen_files[u] = name
            faces.append({'family': fam, 'file': name,
                          'weight': descr(block, 'font-weight') or '400',
                          'style': descr(block, 'font-style') or 'normal',
                          'range': rng})
        manifest['per_css'].setdefault(owner, []).extend(faces)
        manifest['latin'] = sorted({f['file'] for v in manifest['per_css'].values() for f in v})

    # ── 中日韩：可变字体做子集，一档盖全部字重 ──
    for fam, src in CJK_SOURCES.items():
        if not any(fam in v for v in cjk_by_owner.values()):
            continue
        name = f'{slug(fam)}-subset.woff2'
        if not DRY:
            raw = ROOT / '.scratch' / 'fonts' / os.path.basename(src)
            raw.parent.mkdir(parents=True, exist_ok=True)
            if not raw.exists():
                raw.write_bytes(fetch(src))
            txt = raw.with_suffix('.chars.txt')
            # 用 --unicodes 传码点，不用 --text-file：文本文件里的空格和换行
            # 会被当成分隔符，正是上面那个坑的来源。
            txt.write_text(','.join(f'U+{c:04X}' for c in sorted(cps) if c != 0xFEFF),
                           encoding='utf-8')
            subprocess.run([sys.executable, '-m', 'fontTools.subset', str(raw),
                            f'--unicodes-file={txt}', '--flavor=woff2',
                            '--layout-features=*', '--name-IDs=*',
                            f'--output-file={OUT / name}'], check=True,
                           stdout=subprocess.DEVNULL)
            total += (OUT / name).stat().st_size
        manifest['cjk'].append({'family': fam, 'file': name})
        for owner, fams in cjk_by_owner.items():
            for w in sorted(fams.get(fam, ()), key=lambda x: int(x.split()[0])):
                manifest['per_css'].setdefault(owner, []).append(
                    {'family': fam, 'file': name, 'weight': w,
                     'style': 'normal', 'range': None, 'cjk': True})
        print(f'  {fam}: 子集 {name}'
              + ('' if DRY else f'  {(OUT/name).stat().st_size/1024:.0f} KB'))

    if not DRY:
        # 记下两件事，check_fonts.py 只比这两件：
        #   requested —— 生成时请求了哪些码点。仓库以后用到 requested 以外的字，
        #                 说明这份子集过期了，必须重跑。**空格那次就是这么漏的**。
        #   fallback  —— 请求了但连源字体都没有的码点（emoji、少见符号）。
        #                 它们本来就在回落，不是回归；但**新增一个要让人看见**。
        from fontTools.ttLib import TTFont
        import hashlib
        have = set()
        manifest['cmap_sha'] = {}
        for f in sorted(OUT.glob('*.woff2')):
            cm = sorted(TTFont(str(f)).getBestCmap())
            have |= set(cm)
            # 逐个字体记指纹。只记并集不够 —— Sans 掉了一个字、Serif 还有，
            # 并集看不出来，而页面上那个字照样会回落。2026-09-16 探针实测。
            manifest['cmap_sha'][f.name] = hashlib.sha256(
                ','.join(map(str, cm)).encode()).hexdigest()[:16]
        manifest['requested'] = ranges(sorted(cps))
        manifest['fallback'] = sorted(f'U+{c:04X}' for c in cps if c not in have)
        (OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=1),
                                           encoding='utf-8')
        write_css(manifest)
        globals()['manifest_cjk'] = manifest['cjk']
        write_license()
        print(f'记录：请求 {len(cps)} 个码点，其中 {len(manifest["fallback"])} 个'
              f'连源字体都没有（一直在回落，不是这次引入的）')
    print(f'\n拉丁 {len(seen_files)} 个文件' + ('' if DRY else f'，全部合计 {total/1048576:.2f} MB'))
    return manifest


if __name__ == '__main__':
    main()
