#!/usr/bin/env python3
"""逐皮肤核对文字对比度。

为什么不能只靠 axe：axe 算不了渐变背景。强调块 / 深色块上的白字压在
linear-gradient 上，axe 要么跳过要么猜一个值，两种都不会报错 ——
也就是说那一类最容易出事的组合，恰恰是它看不见的。
这里把渐变取两端的中点当底色算，宁可算严一点。

用法: python3 check_skin_contrast.py <neu.css>
退出码 0 = 全过
"""
import re, sys

def lin(c):
    c /= 255
    return ((c + .055) / 1.055) ** 2.4 if c > .04045 else c / 12.92

def L(hexcolor):
    h = hexcolor.lstrip('#')
    if len(h) == 3: h = ''.join(c * 2 for c in h)
    r, g, b = (int(h[i:i+2], 16) for i in (0, 2, 4))
    return .2126 * lin(r) + .7152 * lin(g) + .0722 * lin(b)

def ratio(a, b):
    la, lb = L(a), L(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + .05) / (lo + .05)

def mix(a, b):
    """渐变两端的中点。真实底色沿块变化，取中点是个折中；
    真正严格该取对文字最不利的那一端 —— 所以两端也各算一遍。"""
    ah, bh = a.lstrip('#'), b.lstrip('#')
    return '#' + ''.join('%02x' % ((int(ah[i:i+2],16) + int(bh[i:i+2],16)) // 2) for i in (0,2,4))

css = open(sys.argv[1], encoding='utf-8').read()

# 默认皮肤在 :root，其余在 [data-theme="x"]
skins = {'warm(默认)': dict(re.findall(r'--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,6})', css.split('[data-theme')[0]))}
for name, body in re.findall(r'\[data-theme="([a-z]+)"\]\s*\{([^}]*)\}', css):
    if name in skins: continue
    base = dict(skins['warm(默认)'])
    base.update(dict(re.findall(r'--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,6})', body)))
    skins[name] = base

# (文字角色, 底色角色, 最小要求, 说明)。4.5 是正文，3.0 是 ≥18.66px 粗体的大字门槛
CHECKS = [
    ('ink',     'surf', 4.5, '正文'),
    ('muted',   'surf', 4.5, '说明文字'),
    ('navy-d',  'surf', 4.5, '节点 / 模块名'),
    ('navy',    'surf', 4.5, '强调文字 · 连线'),
    ('warn',    'surf', 4.5, '警示文字'),
]
GRADS = [('on-hot',  'hot-a',  'hot-b',  4.5, '强调块上的字'),
         ('on-deep', 'deep-a', 'deep-b', 4.5, '深色块上的字')]

bad = 0
for skin, v in skins.items():
    rows = []
    for fg, bg, need, what in CHECKS:
        if fg not in v or bg not in v: continue
        r = ratio(v[fg], v[bg])
        rows.append((r >= need, f'{what:<14} {v[fg]} on {v[bg]}  {r:5.2f}:1  需 {need}'))
    for fgrole, ga, gb, need, what in GRADS:
        if ga not in v or gb not in v or fgrole not in v: continue
        fg = v[fgrole]
        # 两端和中点都算，取最差
        worst = min(ratio(fg, v[ga]), ratio(fg, v[gb]), ratio(fg, mix(v[ga], v[gb])))
        rows.append((worst >= need, f'{what:<14} {fg} on {v[ga]}→{v[gb]}  {worst:5.2f}:1  需 {need}'))
    fails = [t for ok, t in rows if not ok]
    mark = '✗' if fails else '✓'
    print(f'{mark} {skin}')
    for ok, t in rows:
        print(f'    {"  " if ok else "✗ "}{t}')
    bad += len(fails)

print()
print(f'不合格 {bad} 项' if bad else '全部皮肤通过')
sys.exit(1 if bad else 0)
