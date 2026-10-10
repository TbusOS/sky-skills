#!/usr/bin/env python3
"""把三个毛笔字体切成子集,只留水墨图例和展示页里真用到毛笔字的那些字。

为什么单独切、不走 design-review 的 build_fonts.py:那个脚本按「全仓库用到的字」切
(两千多字),毛笔字形笔画复杂,一个字体切两千字要好几百 KB;而毛笔字只用在标题、题字、
发布会大字上,用到的字少得多。所以这里只按「毛笔字体实际写过的字」切。

代价:以后新写一个毛笔字,它不在子集里就会回落到系统楷体,不报错。所以
build.mjs 每次构建都核对「毛笔字用到的字 ⊆ 子集里的字」,不满足就让构建失败,
提示重跑本脚本(和 check_fonts.py 防同一种坏法)。

字体来源:google/fonts 仓库固定提交 bd8f81dd(P0 查证许可证时的那个),三个都是 OFL 1.1,
OFL 允许做子集,子集仍按 OFL 发布;每个字体的 OFL.txt 随子集放在 assets/fonts/。
这三个字体没有 Reserved Font Name,子集不用改名。

用法(要 fontTools 和 brotli:pip install fonttools brotli):
  node skills/inkwash-design/scripts/build.mjs     # 先构建,写出 assets/fonts/brush-chars.txt
  python3 skills/inkwash-design/scripts/fonts.py   # 再切子集
"""
import json, pathlib, subprocess, sys, urllib.request

SKILL = pathlib.Path(__file__).resolve().parents[1]
ROOT = SKILL.parents[1]
OUT = SKILL / 'assets' / 'fonts'
RAW = ROOT / '.scratch' / 'fonts'
COMMIT = 'bd8f81ddb5c74d5c8897b36ad88b440266245103'
FONTS = {
    # 族名: (google/fonts 里的目录, 文件名, 输出名)
    'Ma Shan Zheng': ('mashanzheng', 'MaShanZheng-Regular.ttf', 'ma-shan-zheng-subset.woff2'),
    'Long Cang': ('longcang', 'LongCang-Regular.ttf', 'long-cang-subset.woff2'),
    'Zhi Mang Xing': ('zhimangxing', 'ZhiMangXing-Regular.ttf', 'zhi-mang-xing-subset.woff2'),
}


def fetch(path, dest):
    if dest.exists() and dest.stat().st_size > 0:
        return
    url = f'https://raw.githubusercontent.com/google/fonts/{COMMIT}/ofl/{path}'
    dest.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(url, timeout=180) as r:
        dest.write_bytes(r.read())


def main():
    chars_file = OUT / 'brush-chars.txt'
    if not chars_file.exists():
        sys.exit('没有 assets/fonts/brush-chars.txt —— 先跑 node skills/inkwash-design/scripts/build.mjs')
    chars = sorted(set(chars_file.read_text(encoding='utf-8')) - {'\n'})
    # ASCII 可打印字符全留:英文标题也用毛笔字体
    cps = sorted({ord(c) for c in chars} | set(range(0x20, 0x7F)))
    OUT.mkdir(parents=True, exist_ok=True)
    unicodes = OUT.parent.parent / '.fonts-unicodes.txt'
    unicodes.write_text(','.join(f'U+{c:04X}' for c in cps), encoding='utf-8')
    made = {}
    try:
        for fam, (d, fn, out) in FONTS.items():
            raw = RAW / f'{d}_{fn}'
            fetch(f'{d}/{fn}', raw)
            fetch(f'{d}/OFL.txt', RAW / f'{d}_OFL.txt')
            subprocess.run([sys.executable, '-m', 'fontTools.subset', str(raw), f'--unicodes-file={unicodes}',
                            '--flavor=woff2', '--layout-features=*', '--name-IDs=*', f'--output-file={OUT / out}'],
                           check=True, stdout=subprocess.DEVNULL)
            (OUT / f'{d}-OFL.txt').write_bytes((RAW / f'{d}_OFL.txt').read_bytes())
            made[fam] = {'file': out, 'bytes': (OUT / out).stat().st_size}
            print(f'  {fam}: {out}  {(OUT / out).stat().st_size / 1024:.0f} KB')
    finally:
        unicodes.unlink(missing_ok=True)
    (OUT / 'subset.json').write_text(json.dumps({
        'source': f'google/fonts@{COMMIT}', 'licence': 'SIL Open Font License 1.1',
        'chars': ''.join(c for c in chars if ord(c) > 0x7F), 'fonts': made,
    }, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(f'{len(chars)} 个字 → {len(made)} 个子集,清单 assets/fonts/subset.json')


if __name__ == '__main__':
    main()
