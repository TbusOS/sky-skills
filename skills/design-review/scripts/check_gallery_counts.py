#!/usr/bin/env python3
"""每个图集「有几张图」，所有地方说的必须是同一个数。

为什么单开一道：`--facts` 管的是全仓计数（几个 skill、几张 canonical），
逐行扫一组固定文档面。图集张数是**每个画廊各一个数**，塞进那套里会串。

这个数特别容易烂：图一张一张加，而说明写在 `<title>`、`<meta>`、`<h1>` 和两份
README 里，加图的人不会想到去改 meta description。2026-09-16 实测，
**没有一处会报错**：apple 31 张写着 Fourteen · glass 25 张写着 fourteen ·
anthropic 76 张，页面写 60、index 写 36、README 写 76（三处互相矛盾）·
atelier 13 张写着 Nine。

**判断依据是「互相一致」，不是「等于 <figure> 个数」。**
后者会误报：primer 有 26 个 `<figure>`，其中一个是重复出现的 hero，
页面按 FIG 1–25 编号，说「25 张插画」是对的。图数只打印出来作参考。

只看两处，**都必须是紧的，不能靠「同一行提到 skill 名」去认** ——
README 的表格一行里会提到好几个 skill，还会提到模板目录的数量（那是另一个
事实），按名字认必串。写这道检查时先用窗口和名字匹配，一路串到八个图集
全部互相报错，才换成下面这个：
  1 图集页自己的 `<title>` / `<meta name=description>` / `<meta og:title>` / `<h1>`
  2 README / index.html 里**指向这个图集的那个链接元素本身**
    （markdown 是那一行；HTML 是整个 `<a href=…>…</a>`，因为 href 和文字常分两行）
页面中间 “Seven figures about …” 是分组小标题，引言里的「19 张加 6 张」是分项，
都不在范围内 —— 收进来只会制造误报。

用法: python3 skills/design-review/scripts/check_gallery_counts.py
退出码 0 = 每个图集的说法处处一致
"""
import re, sys, pathlib, glob, collections

ROOT = pathlib.Path(__file__).resolve().parents[3]

EN = {'four':4,'five':5,'six':6,'seven':7,'eight':8,'nine':9,'ten':10,'eleven':11,
      'twelve':12,'thirteen':13,'fourteen':14,'fifteen':15,'sixteen':16,'seventeen':17,
      'eighteen':18,'nineteen':19,'twenty':20,'twenty-one':21,'twenty-two':22,
      'twenty-three':23,'twenty-four':24,'twenty-five':25,'twenty-six':26,
      'twenty-seven':27,'twenty-eight':28,'twenty-nine':29,'thirty':30,
      'thirty-one':31,'thirty-two':32,'sixty':60,'sixty-five':65,'seventy-six':76}
ZH = {'八':8,'九':9,'十':10,'十三':13,'十四':14,'十五':15,'十九':19,'二十':20,
      '二十四':24,'二十五':25,'二十六':26,'二十七':27,'三十':30,'三十一':31,
      '三十二':32,'六十':60,'六十五':65,'七十六':76}
EN_RE = '|'.join(sorted(EN, key=len, reverse=True))
ZH_RE = '|'.join(sorted(ZH, key=len, reverse=True))

# 数词 + 量词。量词限死 —— 图里讲的「十四行 PCI 输出」是图的内容，不是张数。
CLAIM = re.compile(
    rf'(?i)\b({EN_RE}|\d{{1,3}})\s+(?:copy-ready\s+|hand-(?:built|crafted)\s+|dark-glass\s+'
    rf'|cinematic\s+|thick-outline\s+)?(?:SVG\s+)?(?:[a-z][a-z-]*\s+){{0,3}}?'
    rf'(?:diagrams?|figures?|templates?|illustrations?|compositions?|starting\s+points)\b'
    rf'|({ZH_RE}|\d{{1,3}})\s*(?:张|幅)\s*(?:手工\s*)?(?:SVG\s*)?(?:图|模板|插画|构图)')


JOIN = re.compile(r'(?i)\bplus\b|加这页|加上|另有|再加')
JOIN_NUM = re.compile(r'(?i)(?:\bplus\b|加这页|加上|另有|再加)[^0-9\n]{0,14}(\d{1,3})')


def by_language(seg):
    """中英是同一句话的两份，必须分开算。

    合在一起算,分项求和会把两版的数字加到一起（19+6 的英文版 加 19+6 的中文版
    = 50,而不是 25）。写这道检查时真这么错过一次。"""
    spans = re.findall(r'<span class="lang-(?:en|zh)"[^>]*>(.*?)</span>', seg, re.S)
    return spans if spans else [seg]


def claims_in(seg):
    """一段文字里的张数说法。

    引言常把总数写成分项：「All 19 figures from the three primers, plus 6 from
    this demo」—— 19 和 6 单独拿出来都是错的,19+6=25 才是它要说的。
    段里出现连接词就把分项相加。**只对一小段文字这么做** —— 早先对文档开
    上下两行的窗口再求和,把邻行讲别的图集的数字也加了进来,八个图集全报错。
    """
    vals = [num(m.group(1) or m.group(2)) for m in CLAIM.finditer(seg)]
    vals = [v for v in vals if v is not None]
    if not JOIN.search(seg):
        return vals
    # 分项的后半截常常没有量词（"plus 6 from this demo"、"加这页 demo 的 6 张"），
    # 光靠 CLAIM 只能抓到前半截,于是把一个正确的总数报成错。
    extra = [num(m.group(1)) for m in JOIN_NUM.finditer(seg)]
    vals += [v for v in extra if v is not None]
    return [sum(vals)] if len(vals) > 1 else vals


def num(tok):
    t = (tok or '').strip()
    return int(t) if t.isdigit() else EN.get(t.lower(), ZH.get(t))


def strip_tags(s):
    return re.sub(r'<[^>]+>', ' ', s)


def figure_count(src):
    """先剥掉注释和 style/script —— 里面的字面标签不是标签。
    primer 的 CSS 注释里就写着一个 <figure>,不剥会多数一个。"""
    t = re.sub(r'<!--.*?-->', ' ', src, flags=re.S)
    t = re.sub(r'<(style|script)\b.*?</\1>', ' ', t, flags=re.S | re.I)
    return len(re.findall(r'<figure[\s>]', t))


def main():
    galleries = {}
    for f in sorted(glob.glob(str(ROOT / 'demos/*/diagrams.html'))):
        p = pathlib.Path(f)
        src = p.read_text(encoding='utf-8')
        if figure_count(src):
            galleries[p.parent.name.replace('-design', '')] = (p, src, figure_count(src))
    if not galleries:
        print('✗ 一个 demos/*/diagrams.html 都没找到', file=sys.stderr)
        return 1

    docs = {d: (ROOT / d).read_text(encoding='utf-8')
            for d in ['README.md', 'README_zh.md', 'index.html'] if (ROOT / d).exists()}

    fail = []
    for skill, (p, src, n) in sorted(galleries.items()):
        claims = collections.defaultdict(list)
        head = src.split('</head>', 1)[0]
        segs = [(m.group(1), 'title') for m in re.finditer(r'<title[^>]*>(.*?)</title>', head, re.S)]
        segs += [(m.group(1), 'head meta') for m in re.finditer(
            r'<meta[^>]*?(?:name="description"|property="og:title")[^>]*?content="([^"]*)"', head)]
        for m in re.finditer(r'<h1[^>]*>.*?</h1>', src, re.S):
            segs.append((m.group(0), 'h1'))
            # 紧跟 h1 的那段引言也算整页的说法 —— 它是最显眼的一处，
            # 漏了它等于最容易被人看见的地方反而没查。分项用上面的求和规则处理。
            segs.append((src[m.end():m.end() + 500], 'h1 后的引言'))
        for seg, where in segs:
            for part in by_language(seg):
                for v in claims_in(strip_tags(part)):
                    claims[v].append(f'{p.relative_to(ROOT)} 的 {where}')

        path = f'demos/{skill}-design/diagrams.html'
        for doc, txt in docs.items():
            if doc.endswith('.md'):
                # 只认「以 - [ 开头的列表项」。README 的 skill 表格行和
                # 「Diagrams — N SVG templates」那种要点行里也带着图集链接，
                # 但它们说的是**模板目录**的数量,是另一个事实,混进来会互相报错。
                spots = [(l, i + 1) for i, l in enumerate(txt.split('\n'))
                         if path in l and re.match(r'\s*-\s*\[', l)]
            else:
                spots = [(m.group(0), txt[:m.start()].count('\n') + 1)
                         for m in re.finditer(r'<a\b[^>]*href="[^"]*' + re.escape(path)
                                              + r'"[^>]*>.*?</a>', txt, re.S)]
            for seg, line in spots:
                for part in by_language(seg):
                    for v in claims_in(strip_tags(part)):
                        claims[v].append(f'{doc}:{line}')

        if len(claims) > 1:
            top = max(len(v) for v in claims.values())
            leaders = [k for k, v in claims.items() if len(v) == top]
            if len(leaders) > 1:
                # 平局时不要判定哪个对 —— 这道检查只知道它们对不上,
                # 不知道真值是几（真值要数图,而数图本身有 hero 之类的坑）。
                fail.append(f'[不一致] {skill} 图集：说法有 '
                            + ' 和 '.join(f'{k}（{len(claims[k])} 处）' for k in sorted(leaders))
                            + '，对不上。数一下页面再统一')
            else:
                agreed = leaders[0]
                for v, wheres in sorted(claims.items()):
                    if v != agreed:
                        for w in wheres:
                            fail.append(f'[不一致] {skill} 图集：{top} 处说 {agreed}，但 {w} 说 {v}')
        said = sorted(claims)
        mark = ''
        if len(said) == 1 and said[0] != n:
            mark = f'   （页面 {n} 个 <figure> —— hero 或未编号的图会让两者合理地差开）'
        print(f'  {skill:11s} <figure> {n:3d} · 说法 {said or "没找到"}{mark}')

    if fail:
        print(f'\n{len(fail)} 条不过：')
        for x in fail:
            print('  ✗ ' + x)
        return 1
    print('\n每个图集的说法处处一致')
    return 0


if __name__ == '__main__':
    sys.exit(main())
