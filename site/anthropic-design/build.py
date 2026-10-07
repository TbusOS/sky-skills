#!/usr/bin/env python3
"""anthropic-design 介绍页的生成脚本 → demos/anthropic-design/index.html

页面上的数字全部现取,不手抄:
  · 配色对比度   按 WCAG 2.x 相对亮度公式算;每个色值先确认 SKILL.md 里真有
  · 规则行数     SKILL.md 每一笔提交的版本里 `grep -cE 'MUST|必须'` 的行数
  · 图例清单     读 skills/anthropic-design/templates/diagrams/*.svg,
                 分组按 references/diagram-craft.md 的 §15.x 标题
  · 示范页       读各页的 <title> 和行数
  · 触发词       从 SKILL.md 的 description 里切 TRIGGER / DO NOT TRIGGER
  · 检查结果     读 checks.json(--refresh-checks 现跑 check_objective.mjs 再写)

用法:
  python3 site/anthropic-design/build.py                   # 生成
  python3 site/anthropic-design/build.py --check           # 和现有页面逐字节比对,不写
  python3 site/anthropic-design/build.py --refresh-checks  # 现跑五项检查和自测,写 checks.json(几分钟)

--check 不过有两种原因:有人手改了 index.html,或者 SKILL.md / 图例目录有了新提交、
页面该重新生成了。两种都是重跑本脚本。
"""
import datetime, html, json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
SKILL = os.path.join(ROOT, 'skills', 'anthropic-design')
DEMO = os.path.join(ROOT, 'demos', 'anthropic-design')
OUT = os.path.join(DEMO, 'index.html')
TPL = os.path.join(HERE, 'index.html.tpl')
CHECKS = os.path.join(HERE, 'checks.json')
SKILL_MD_REL = 'skills/anthropic-design/SKILL.md'


def git(*args):
    return subprocess.run(['git', *args], cwd=ROOT, capture_output=True, text=True, check=True).stdout


# ── 配色 ────────────────────────────────────────────────────────────────
def lum(h):
    h = h.lstrip('#')
    def lin(c):
        c = int(h[c:c + 2], 16) / 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * lin(0) + 0.7152 * lin(2) + 0.0722 * lin(4)


def ratio(a, b):
    la, lb = lum(a), lum(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def mix(c, p, ink='#141413'):
    """color-mix(in srgb, c p, ink) —— SKILL.md 给语义色当字色时的混法"""
    c, k = c.lstrip('#'), ink.lstrip('#')
    return '#' + ''.join('%02x' % round(int(c[i:i + 2], 16) * p + int(k[i:i + 2], 16) * (1 - p)) for i in (0, 2, 4))


# id, 色值, 英文名, 中文名, 用途(bg 底色 / text 字色 / hue 语义色 / dark 深色框)
PALETTE = [
    ('cream',   '#faf9f5', 'Page',          '页面底',   'bg'),
    ('subtle',  '#f0ede3', 'Subtle band',   '次级段落底', 'bg'),
    ('card',    '#ffffff', 'Card',          '卡片',     'bg'),
    ('line',    '#e8e6dc', 'Rule',          '分隔线',   'bg'),
    ('ink',     '#141413', 'Ink',           '正文字',   'text'),
    ('ink2',    '#5e5d55', 'Secondary',     '次要字',   'text'),
    ('orange',  '#d97757', 'Orange',        '主色',     'hue'),
    ('orange2', '#c56544', 'Orange, darker', '深一档橙', 'hue'),
    ('orangek', '#a8502f', 'Orange for text', '小字用橙', 'text'),
    ('blue',    '#6a9bcc', 'Blue',          '蓝',       'hue'),
    ('olive',   '#788c5d', 'Olive',         '橄榄绿',   'hue'),
    ('gold',    '#c9913f', 'Gold',          '金',       'hue'),
    ('grey',    '#b0aea5', 'Grey',          '灰',       'hue'),
    ('danger',  '#a14238', 'Danger',        '危险',     'hue'),
    ('dark',    '#1c1b18', 'Dark box',      '深色框底', 'dark'),
    ('darkbar', '#2a2925', 'Title bar',     '标题条',   'dark'),
    ('darkink', '#ece9df', 'Dark-box text', '深色框字', 'dark'),
    ('dred',    '#ec9488', 'Error, light',  '浅色报错', 'dark'),
    ('dgold',   '#dcb062', 'Warning, light', '浅色警告', 'dark'),
    ('dgreen',  '#a9bf8f', 'Pass, light',   '浅色通过', 'dark'),
]


def palette():
    md = open(os.path.join(SKILL, 'SKILL.md'), encoding='utf-8').read().lower()
    for pid, hexv, *_ in PALETTE:
        assert hexv in md, f'{hexv}({pid})在 SKILL.md 里找不到 —— 配色表改了,这里要跟着改'
    hx = {p[0]: p[1] for p in PALETTE}
    cream, dark = hx['cream'], hx['dark']
    r = lambda a, b: round(ratio(a, b), 2)
    cr = {
        'orange_cream': r(hx['orange'], cream), 'orange2_cream': r(hx['orange2'], cream),
        'orangek_cream': r(hx['orangek'], cream), 'ink_orange': r(hx['ink'], hx['orange']),
        'white_orange': r('#ffffff', hx['orange']), 'ink_cream': r(hx['ink'], cream),
        'ink2_cream': r(hx['ink2'], cream),
        'danger_cream': r(hx['danger'], cream), 'danger_dark': r(hx['danger'], dark),
        'ink2_dark': r(hx['ink2'], dark), 'grey_cream': r(hx['grey'], cream),
        'dred_dark': r(hx['dred'], dark), 'dgold_dark': r(hx['dgold'], dark),
        'dgreen_dark': r(hx['dgreen'], dark), 'darkink_dark': r(hx['darkink'], dark),
    }
    for k in ('blue', 'olive', 'gold'):
        m = mix(hx[k], 0.62)
        cr[k + '_raw'] = r(hx[k], cream)
        cr[k + '_mix'] = r(m, cream)
        cr[k + '_mixhex'] = m
    # SKILL.md 正文里写死的几个数,和公式对一遍:对不上就是 SKILL.md 该改了
    body = open(os.path.join(SKILL, 'SKILL.md'), encoding='utf-8').read()
    for k in ('orange_cream', 'orange2_cream', 'orangek_cream', 'ink_orange', 'white_orange'):
        assert ('%.2f' % cr[k]).rstrip('0').rstrip('.') in body or ('%.2f' % cr[k]) in body, \
            f'SKILL.md 里没有 {k}={cr[k]:.2f}'
    return [{'id': p, 'hex': h, 'en': en, 'zh': zh, 'kind': kd} for p, h, en, zh, kd in PALETTE], cr


# ── SKILL.md 每一笔提交里「必须」有几行 ──────────────────────────────────
MUST = re.compile(r'MUST|必须')


def history():
    out = []
    for line in git('log', '--reverse', '--format=%h\t%ad\t%s', '--date=short', '--', SKILL_MD_REL).splitlines():
        h, d, s = line.split('\t', 2)
        text = git('show', f'{h}:{SKILL_MD_REL}')
        rows = text.splitlines()
        out.append({'h': h, 'd': d, 's': s, 'must': sum(1 for x in rows if MUST.search(x)), 'lines': len(rows)})
    assert out, 'git log 没拿到 SKILL.md 的提交'
    return out


def must_lines_now():
    rows = open(os.path.join(SKILL, 'SKILL.md'), encoding='utf-8').read().splitlines()
    return [(i + 1, x) for i, x in enumerate(rows) if MUST.search(x)]


# ── 图例库 ──────────────────────────────────────────────────────────────
# SKILL.md §3 那张「内容 → 图型」表。文字照 SKILL.md,模板名是 templates/diagrams/ 里的文件
CHOOSER = [
    ('A process of three or more steps, a boot chain, a data flow', '≥3 步流程 / 启动链 / 数据流', ['flow', 'sequence'], ''),
    ('Numbers to compare, statistics', '数字对比 / 统计', ['magnitude-ruler', 'scale-ladder'], ''),
    ('System structure, layers, dependencies', '系统结构 / 分层 / 依赖', ['architecture', 'hierarchy', 'isometric-stack'], ''),
    ('Change over time, versions, milestones', '时间演进 / 版本 / 里程碑', ['timeline'], ''),
    ('A product or a UI', '产品 / UI 描述', [], '§10'),
    ('Control flow of a function, a register bit field', '函数控制流 / 寄存器位域', ['function-flowchart', 'register-bitfield'], ''),
    ('SoC structure, signal timing, a build chain, scheduling', 'SoC 结构 / 信号时序 / 编译链 / 调度', ['soc-block', 'hw-timing-waveform', 'build-pipeline', 'sched-timeline'], ''),
    ('Tracking down a fault; arguing that a change here reaches there', '排查一个故障 / 论证「改这里会影响那里」', ['call-site-locator'], ''),
    ('A call chain over 30 deep, identifiers only', '30 层以上、纯标识符的调用链', [], '§18'),
    ('Several paths through several gates', '几条路 × 几道关卡', ['path-gates'], ''),
    ('Several kinds of problem × several checks: who catches what', '几种问题 × 几道检查,谁抓得到', ['coverage-dots'], ''),
    ('Why a reading is already stale when you take it', '一个读数为什么当场就旧', ['where-when-grid'], ''),
    ('One wildcard rule, two meanings', '同一条通配规则两种语义', ['segment-align'], ''),
    ('A directory tree two parties judge differently', '目录树上两方判法不同', ['verdict-tree'], ''),
    ('Where a batch of findings came from and where it went', '一批发现从哪来、分到哪去', ['count-flow'], ''),
    ('One kind of failure, a dozen cases, which way each falls', '同一类失败十几种情况各往哪倒', ['leaf-groups'], ''),
    ('A string of text processed step by step', '一串文本被一步步加工', ['text-steps'], ''),
    ('Where each step of a process can stop it', '流程每一步能在哪拦下', ['pipeline-exits'], ''),
    ('Several pages, each about one part of the same process', '几页讲同一个流程的不同一块', ['dim-spotlight'], ''),
]

# 没有 §15 小节号的模板:分「通用」和「显示通路」两组(后者是 §15.32 那一串讲一帧画面怎么上屏的图)
GENERAL = {'architecture', 'flow', 'sequence', 'timeline', 'hierarchy', 'state-machine', 'deployment', 'isometric-stack'}


def diagrams():
    d = os.path.join(SKILL, 'templates', 'diagrams')
    names = sorted(f[:-4] for f in os.listdir(d) if f.endswith('.svg'))
    craft = open(os.path.join(SKILL, 'references', 'diagram-craft.md'), encoding='utf-8').read()
    sec = {}
    for m in re.finditer(r'^### (15\.(\d+)) [^\n]*?[（(]([a-z0-9*-]+)[）)]', craft, re.M):
        sec[m.group(3).replace('algorithm-*', 'algorithm-ringbuffer')] = (m.group(1), int(m.group(2)))
    out = []
    for n in names:
        s = sec.get(n)
        if s and s[1] >= 50:
            g = 'judge'
        elif n in GENERAL:
            g = 'general'
        else:
            g = 'hw'
        out.append({'n': n, 'sec': s[0] if s else '', 'g': g})
    for _en, _zh, files, _recipe in CHOOSER:
        for f in files:
            assert f in names, f'选图表里的 {f}.svg 不在 templates/diagrams/'
    chooser = [{'en': en, 'zh': zh, 'files': files, 'recipe': recipe,
                'sec': [sec[f][0] for f in files if f in sec]} for en, zh, files, recipe in CHOOSER]
    return out, chooser


# ── 示范页 ──────────────────────────────────────────────────────────────
# 文件, 封面图案, 英文说明, 中文说明。FEATURE 里的两张跨两栏:10 张卡 + 2 = 12 格,三栏正好排满四行
FEATURE = {'explainer.html', 'diagrams.html'}
EXAMPLES = [
    ('explainer.html', 'layers', 'The reworked example: a mechanism animated in the first screen, an evidence module, three explainers you can click.',
     '改版范例:首屏动画演示机制、证据模块、三个能点的解释器。'),
    ('hardware.html', 'screen', 'Every hardware block one frame passes through on its way to a phone screen.',
     '一帧画面上屏要经过的每一块硬件。'),
    ('bringup.html', 'panel', 'What is inside a display module, and the power-up order you cannot change.',
     '显示模组里面有什么,和不能换的上电顺序。'),
    ('one-bit.html', 'bit', 'One memory bit: an abstraction ladder, a three-state triptych, ten decades on one axis.',
     '一个比特怎么存:逐级抽象、三种状态并排、十个数量级画在一根轴上。'),
    ('packaging.html', 'chip', 'From a board you can hold to a joint you cannot see: zoom chain, process steps, exploded view.',
     '从拿得动的板到看不见的焊点:放大链、工序图、爆炸图。'),
    ('pressure.html', 'queue', 'Two figures that argue: width with a unit, and the queue that bends at its knee.',
     '两张会下判断的图:有量纲的宽度,和到拐点就陡起来的排队曲线。'),
    ('reading.html', 'eye', 'How a dense figure gets read: three ways to show an inside, stepping, and what a figure must carry.',
     '一张密图怎么被读懂:三种看内部的画法、步进、一张图要自带什么。'),
    ('story.html', 'story', 'The old landing page: the sky-skills story told in this palette, as the other design voices tell it.',
     '旧版首页:用这套配色讲 sky-skills 的故事,和其他设计 skill 的演示页讲同一件事。'),
    ('diagrams.html', 'grid', 'The gallery: every diagram type in this palette, numbered by section.',
     '图集:这套配色下的每一种图型,按编号分节。'),
    ('index-v2.html', 'v2', 'Scenario showcase: dashboard, form, table and modal recipes.',
     '场景展示:仪表盘、表单、数据表、弹窗这些配方。'),
]


def examples():
    out = []
    for f, art, en, zh in EXAMPLES:
        p = os.path.join(DEMO, f)
        s = open(p, encoding='utf-8').read()
        t = re.search(r'<title>([^<]*)</title>', s)
        assert t, f'{f} 没有 <title>'
        title = re.sub(r'\s+[—-]\s+anthropic-design$', '', html.unescape(t.group(1)).strip())
        out.append({'f': f, 'art': art, 'title': title, 'feature': f in FEATURE,
                    'lines': s.count('\n'), 'en': en, 'zh': zh})
    return out


# ── 触发词 ──────────────────────────────────────────────────────────────
def triggers():
    md = open(os.path.join(SKILL, 'SKILL.md'), encoding='utf-8').read()
    desc = re.search(r'^description: "(.*)"$', md, re.M).group(1)
    yes = re.search(r'TRIGGER: (.*?)\. DO NOT TRIGGER', desc).group(1)
    no = re.search(r'DO NOT TRIGGER: (.*?)。?$', desc).group(1)
    phrases = [x.strip().strip("'") for x in yes.split(' / ')]
    routes = []
    for item in no.split('、'):
        m = re.match(r'(.*?)\((.*?)\)$', item.strip())
        routes.append({'what': (m.group(1) if m else item).strip(), 'to': m.group(2) if m else ''})
    assert len(phrases) >= 5 and routes, 'TRIGGER 切不出来,SKILL.md description 格式变了'
    return phrases, routes


# ── 检查结果 ────────────────────────────────────────────────────────────
CHECK_PAGES = ['explainer.html', 'hardware.html', 'bringup.html', 'one-bit.html', 'packaging.html',
               'pressure.html', 'reading.html', 'diagrams.html', 'story.html', 'index-v2.html']
OBJ = os.path.join(ROOT, 'skills', 'design-review', 'scripts', 'check_objective.mjs')


def refresh_checks():
    pages = []
    for f in CHECK_PAGES:
        r = subprocess.run(['node', OBJ, os.path.join('demos', 'anthropic-design', f)], cwd=ROOT,
                           capture_output=True, text=True, timeout=600)
        res = {}
        for line in r.stdout.splitlines():
            m = re.match(r'\s*(✅|❌|⚠️?)\s*(O[1-5])\s*(.*)', line)
            if m:
                res[m.group(2)] = {'st': {'✅': 'pass', '❌': 'fail'}.get(m.group(1), 'warn'), 'msg': m.group(3).strip()}
        summ = re.search(r'(\d+) 通过 / (\d+) 失败 / (\d+) 提醒', r.stdout)
        assert len(res) == 5 and summ, f'{f} 的检查输出解析不出五项:\n{r.stdout}\n{r.stderr}'
        pages.append({'f': f, 'rc': r.returncode, 'res': res, 'summary': summ.group(0)})
        print(f'  {f}: {summ.group(0)}')
    st = subprocess.run(['node', OBJ, '--self-test'], cwd=ROOT, capture_output=True, text=True, timeout=900)
    assert re.search(r'自测:\d+ 通过 / 0 失败', st.stdout), f'自测没全过:\n{st.stdout}'
    data = {'date': datetime.date.today().isoformat(),
            'cmd': 'node skills/design-review/scripts/check_objective.mjs demos/anthropic-design/<page>.html',
            'pages': pages, 'selftest': st.stdout.rstrip('\n')}
    with open(CHECKS, 'w', encoding='utf-8') as fh:
        json.dump(data, fh, ensure_ascii=False, indent=1)
        fh.write('\n')
    print(f'写了 {os.path.relpath(CHECKS, ROOT)}')


# ── 拼页面 ──────────────────────────────────────────────────────────────
def build():
    pal, cr = palette()
    hist = history()
    dg, chooser = diagrams()
    ex = examples()
    phrases, routes = triggers()
    checks = json.load(open(CHECKS, encoding='utf-8'))
    now = must_lines_now()
    peak = max(hist, key=lambda x: x['must'])
    rewrite = next(x for x in hist if x['s'].startswith('anthropic-design 改版'))
    before = hist[hist.index(rewrite) - 1]
    st_lines = checks['selftest'].splitlines()
    st_cases = [x for x in st_lines if re.match(r'\s*(通过|失败)\s', x)]
    st_bad = [x for x in st_cases if '★' in x]
    groups = {g: sum(1 for d in dg if d['g'] == g) for g in ('general', 'hw', 'judge')}
    page_pass = sum(1 for p in checks['pages'] for v in p['res'].values() if v['st'] == 'pass')

    # O3 那段实测(SKILL.md §4):布局多宽、窗口多宽、去掉 overflow-x:hidden 后滚了多少
    md = open(os.path.join(SKILL, 'SKILL.md'), encoding='utf-8').read()
    o3 = re.search(r'`scrollWidth` 是 (\d+)[(（]窗口 (\d+)[)）][\s\S]{0,200}?去掉那条再滚是 (\d+)', md)
    assert o3, 'SKILL.md §4 的 O3 实测那段找不到了'

    data = {'palette': pal, 'cr': cr, 'history': hist, 'diagrams': dg, 'chooser': chooser,
            'examples': ex, 'phrases': phrases, 'routes': routes, 'checks': checks,
            'mustNow': [{'n': n, 't': t} for n, t in now]}
    flat = {
        'N_DIAGRAMS': len(dg), 'N_GENERAL': groups['general'], 'N_HW': groups['hw'], 'N_JUDGE': groups['judge'],
        'N_COMMITS': len(hist), 'FIRST_DATE': hist[0]['d'], 'PEAK': peak['must'], 'PEAK_DATE': peak['d'],
        'BEFORE': before['must'], 'AFTER': rewrite['must'], 'REWRITE_H': rewrite['h'], 'REWRITE_D': rewrite['d'],
        'LINES_BEFORE': before['lines'], 'LINES_AFTER': rewrite['lines'], 'NOW_MUST': len(now),
        'CHECK_DATE': checks['date'], 'N_CHECK_PAGES': len(checks['pages']),
        'N_CHECK_CELLS': 5 * len(checks['pages']), 'N_CHECK_PASS': page_pass,
        'N_SELFTEST': len(st_cases), 'N_SELFTEST_BAD': len(st_bad), 'N_EXAMPLES': len(ex),
        'N_PALETTE': len(pal), 'N_REQ': sum(1 for _n, t in now if 'O5' in t), 'O3_SW': o3.group(1), 'O3_VW': o3.group(2), 'O3_SX': o3.group(3),
        # O4 示意:1200 宽的图塞进 390 屏上 358px 宽的栏,12 号字缩成多少
        'O4_PX': '%.1f' % (12 * 358 / 1200),
    }
    for k, v in cr.items():
        flat['CR_' + k.upper()] = ('%.2f' % v) if isinstance(v, float) else v
    s = open(TPL, encoding='utf-8').read()
    for k, v in flat.items():
        s = s.replace('{{%s}}' % k, str(v))
    left = re.findall(r'\{\{[A-Z0-9_]+\}\}', s)
    assert not left, f'模板里还有没填的占位: {sorted(set(left))}'
    blob = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c')
    assert s.count('__DATA__') == 1
    return s.replace('__DATA__', blob)


def main(argv):
    if '--refresh-checks' in argv:
        refresh_checks()
        return 0
    out = build()
    if '--check' in argv:
        cur = open(OUT, encoding='utf-8').read() if os.path.exists(OUT) else ''
        if cur == out:
            print('一致:index.html 就是本脚本现在生成的样子')
            return 0
        print('不一致:index.html 和现在生成的不同(手改过,或 SKILL.md / 图例目录有新提交)—— 重跑本脚本')
        return 1
    with open(OUT, 'w', encoding='utf-8') as fh:
        fh.write(out)
    print(f'写了 {os.path.relpath(OUT, ROOT)}({len(out.encode())} 字节)')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
