#!/usr/bin/env python3
"""核对搬进仓的字体还够用。

为什么必须有这道检查：中日韩字体是**按当时仓库用到的字**切出来的子集。
以后写一个从没出现过的汉字，它不在子集里 —— 浏览器回落到系统字体，
**不报错、不留痕**，页面看着仍然成立，只是那几个字长得不一样。

2026-09-16 真栽过，而且栽在最不起眼的字上：生成脚本里写了
`cps.discard(0x20)`（以为空格不用管），于是**每个空格都回落到 DejaVu Sans**，
整页版面偏移 51px。肉眼、截图对比、对比度检查全都没看出来 —— 是用 CDP 的
`CSS.getPlatformFontsForNode` 问「这个节点实际用哪个字体渲染」才看见的：
`Noto Sans SC ×14  DejaVu Sans ×3`。

判断依据不是「每个字都要在字体里」—— 那样会把 emoji 和少见符号全报出来，
它们本来就没有，一直在回落。真正要比的是两件事：

  1 仓库现在用到的字 ⊆ 生成时请求过的字。多出来的 = 这份子集过期了，
    必须重跑 build_fonts.py。**空格那个 bug 正是这一条抓得到的**。
  2 回落清单没有变长。生成时记下了「请求了但连源字体都没有」的那些码点
    （emoji、少见箭头），它们是既有状态；**新增一个要让人看见**。

另外查两件便宜的：还有没有 CSS/HTML 在联网取字体；@font-face 指的文件在不在。

用法: python3 skills/design-review/scripts/check_fonts.py
退出码 0 = 全过
"""
import json, re, subprocess, sys, pathlib, unicodedata

ROOT = pathlib.Path(__file__).resolve().parents[3]
FONTDIR = ROOT / 'assets' / 'fonts'
FACE = re.compile(r'@font-face\s*\{(.*?)\}', re.S)


def tracked(*globs):
    return [f for f in subprocess.run(['git', 'ls-files', *globs], cwd=ROOT,
                                      capture_output=True, text=True).stdout.split()
            if 'node_modules' not in f]


def expand(spec):
    out = set()
    for part in spec:
        part = part.replace('U+', '')
        if '-' in part:
            a, b = part.split('-', 1)
            out |= set(range(int(a, 16), int(b, 16) + 1))
        else:
            out.add(int(part, 16))
    return out


def used_now():
    """仓库里现在用到的字符。和 build_fonts.py 的取法必须一致 ——
    两边不一致，这道检查就只是在比两个不同的东西。"""
    cps = set()
    for f in tracked('*.html', '*.css', '*.md', '*.svg'):
        try:
            cps |= {ord(c) for c in (ROOT / f).read_text(encoding='utf-8').replace('\n', '')}
        except (UnicodeDecodeError, OSError):
            continue
    cps.add(0x20)
    return cps


def main():
    fail = []
    mf = FONTDIR / 'manifest.json'
    if not mf.exists():
        print('✗ 找不到 assets/fonts/manifest.json —— build_fonts.py 跑过吗？', file=sys.stderr)
        return 1
    man = json.loads(mf.read_text(encoding='utf-8'))
    for key in ('requested', 'fallback'):
        if key not in man:
            print(f'✗ manifest 里没有 {key} —— 是旧版 build_fonts.py 生成的，请重跑', file=sys.stderr)
            return 1

    requested = expand(man['requested'])
    if len(requested) < 500:
        # 子集为空怎么办：请求清单小到不像话，多半是生成时输入没取到。
        print(f'✗ manifest 只记了 {len(requested)} 个码点，太少，生成那一步多半没取到输入',
              file=sys.stderr)
        return 1

    # ── 1 现在用到的字，生成时都请求过吗 ──
    now = used_now()
    stale = sorted(c for c in now - requested
                   if not (c < 0x21 and c != 0x20)
                   and unicodedata.category(chr(c)) not in ('Cc', 'Cf'))
    for c in stale[:12]:
        where = next((f for f in tracked('*.html', '*.md')
                      if chr(c) in (ROOT / f).read_text(encoding='utf-8', errors='replace')), '?')
        fail.append(f'[过期] {chr(c)!r} (U+{c:04X}) 现在用到了（{where}），'
                    f'但生成字体时没请求过 —— 它会回落到系统字体且不报错。'
                    f'跑 build_fonts.py 重新生成')
    if len(stale) > 12:
        fail.append(f'[过期] 另有 {len(stale)-12} 个字同样没被请求过')

    # ── 2 回落清单有没有变长 ──
    try:
        from fontTools.ttLib import TTFont
    except ImportError:
        fail.append('[环境] 装一下 fontTools 才能查字体覆盖：pip3 install --user "fonttools[woff]"')
        TTFont = None
    if TTFont:
        import hashlib
        have = set()
        recorded_sha = man.get('cmap_sha', {})
        if not recorded_sha:
            fail.append('[清单过期] manifest 里没有 cmap_sha，重跑 build_fonts.py')
        for f in sorted(FONTDIR.glob('*.woff2')):
            cm = sorted(TTFont(str(f)).getBestCmap())
            have |= set(cm)
            # 逐个字体比指纹：只比并集的话，某个字体掉了字形而另一个还有，
            # 就看不出来 —— 可页面上那个字照样会回落。
            sha = hashlib.sha256(','.join(map(str, cm)).encode()).hexdigest()[:16]
            if f.name in recorded_sha and recorded_sha[f.name] != sha:
                fail.append(f'[字形变了] {f.name} 覆盖的字和生成时记录的不一样'
                            f'（{len(cm)} 个字形）—— 有字形被丢掉或多出来了，'
                            f'确认是有意的就重跑 build_fonts.py')
            elif f.name not in recorded_sha:
                fail.append(f'[没登记] {f.name} 不在 manifest 的 cmap_sha 里')
        recorded = expand(man['fallback']) if man['fallback'] else set()
        now_fb = {c for c in requested if c not in have}
        new_fb = sorted(now_fb - recorded)
        for c in new_fb[:10]:
            fail.append(f'[新回落] {chr(c)!r} (U+{c:04X}) 请求了但字体里没有，'
                        f'而生成时记录的回落清单里也没有它 —— 子集这一步丢了字形')
        gone = sorted(recorded - now_fb)
        if gone:
            fail.append(f'[清单过期] 有 {len(gone)} 个码点不再回落了，重跑 build_fonts.py 更新清单')

    # ── 3 还有没有联网取字体 ──
    for f in tracked('*.css', '*.html'):
        src = (ROOT / f).read_text(encoding='utf-8', errors='replace')
        for host in ('fonts.googleapis.com', 'fonts.gstatic.com'):
            for m in re.finditer(re.escape(host), src):
                line = src[:m.start()].count('\n') + 1
                if re.search(r'/\* source: [^*]*$', src[:m.start()].rsplit('\n', 1)[-1]):
                    continue                    # 生成块里记的来源注释，不是真去取
                fail.append(f'[联网] {f}:{line} 还在引用 {host}')
                break

    # ── 4 @font-face 指的文件在不在 / 有没有孤儿 ──
    used_files = set()
    for f in tracked('*fonts*.css') + ['assets/fonts/inline-pages.css']:
        p = ROOT / f
        if not p.exists():
            continue
        for block in FACE.findall(p.read_text(encoding='utf-8')):
            m = re.search(r'url\(([^)]+)\)', block)
            if not m:
                continue
            t = (p.parent / m.group(1).strip('\'"')).resolve()
            if not t.exists():
                fail.append(f'[缺文件] {f}: @font-face 指向 {m.group(1)}，文件不存在')
            else:
                used_files.add(t)
    for p in sorted(FONTDIR.glob('*.woff2')):
        if p.resolve() not in used_files:
            fail.append(f'[孤儿] {p.relative_to(ROOT)} 没有任何 @font-face 引用')

    total = sum(p.stat().st_size for p in FONTDIR.glob('*.woff2'))
    print(f'字体 {len(list(FONTDIR.glob("*.woff2")))} 个文件 {total/1048576:.2f} MB · '
          f'请求过 {len(requested)} 个码点 · 现在用到 {len(now)} 个 · '
          f'既有回落 {len(man["fallback"])} 个（emoji 和少见符号，源字体本来就没有）')
    if fail:
        print(f'\n{len(fail)} 条不过：')
        for x in fail:
            print('  ✗ ' + x)
        return 1
    print('全部通过')
    return 0


if __name__ == '__main__':
    sys.exit(main())
