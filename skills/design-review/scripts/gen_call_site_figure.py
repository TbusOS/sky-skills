#!/usr/bin/env python3
"""调用链定位图从一段源文本生成 —— 原文从真实文件里读，不靠人抄。

为什么要有它：这张图的全部价值是「读者能自己去核」—— 每一层有 file:line，
决定结局的那几行贴的是原文。可手画的时候，**贴进去的那行到底在不在那个
行号上，没有任何东西查**。手抄一样会抄错（这个仓记过：算错的码点是另一个
合法汉字，四道检查全绿）。而且 anthropic / apple 两家是手算坐标的 SVG，
换一条链就得重算每个 x、每个 textLength —— 别人拿去画自己的故障几乎不可能。

所以反过来：写图的人只写一段缩进文本（格式见 references/callsites/README.md），
**原文由这里按行号去文件里读出来**，同一份源渲染成 relief / anthropic / apple
三种风格。和结构体布局图由 pahole 生成是同一个路子。

它核对的东西（任何一条不过就不出图）:
  · 每一层的 file:line 那一行里，确实出现了这一层的函数名
  · 「给不出行号」的那一层写了为什么（破折号不算）
  · 引用的行存在，标出来的词（mark / share）真的在那几行里
  · 失败回传（^）指向的那一层在链上、在焦点的上方
  · 耦合（couple）两头都有 —— 只有一头的耦合不是耦合
  · 层数不超过 7（再深读者会数不清自己在第几层，该拆成两张）

用法:
  python3 gen_call_site_figure.py                 # 重新生成仓里登记的全部图，写回
  python3 gen_call_site_figure.py --check         # 只核对不写：源对不上、页面过期都算失败
  python3 gen_call_site_figure.py SPEC --style=relief|anthropic|apple
                                                  # 渲染任意一份源，打印到标准输出
  python3 gen_call_site_figure.py --self-test     # 探针：内置的坏源必须全部被拦下
退出码 0 = 全部通过
"""
from __future__ import annotations

import html
import pathlib
import re
import sys
import tempfile
import textwrap
from dataclasses import dataclass, field

ROOT = pathlib.Path(__file__).resolve().parents[3]
SPECS = ROOT / 'skills/design-review/references/callsites'

# 仓里登记的图：(源, 风格, 写到哪, 方式)。方式 file = 整个文件就是这张图；
# block = 写在页面里 <!-- gen:callsite 源 风格 --> … <!-- /gen:callsite --> 之间。
TARGETS = [
    ('touch-gesture', 'relief', 'skills/relief-design/references/canonical/code.html', 'block'),
    ('build-manifest', 'anthropic', 'skills/anthropic-design/templates/diagrams/call-site-locator.svg', 'file'),
    ('build-manifest', 'anthropic', 'demos/anthropic-design/diagrams.html', 'block'),
    ('build-manifest', 'apple', 'skills/apple-design/templates/diagrams/call-site-locator.svg', 'file'),
    ('build-manifest', 'apple', 'demos/apple-design/diagrams.html', 'block'),
]

MAX_DEPTH = 6          # 0..6 = 7 层
SEP = re.compile(r'\s{2,}')


# ═══════════════════════════ 模型 ═══════════════════════════

@dataclass
class Quote:
    path: str
    a: int
    b: int
    marks: list
    share: str | None
    lines: list = field(default_factory=list)       # 显示用（展开 tab、去掉公共缩进）


@dataclass
class Level:
    depth: int
    name: str
    path: str | None
    line: int | None
    noline: tuple | None           # (en, zh) —— 为什么给不出行号
    flags: set
    note: tuple | None
    src: int                       # 源文件里的行号，报错用
    quote: Quote | None = None
    why: tuple | None = None
    parent: int | None = None
    unreached: bool = False        # 祖先被删掉了，所以这一层也不会跑


@dataclass
class Ret:
    target: str
    value: str | None
    text: tuple
    src: int
    t: int | None = None           # 目标在 levels 里的下标


@dataclass
class Chain:
    heading: tuple
    levels: list = field(default_factory=list)
    ret: Ret | None = None

    def focus(self):
        f = [i for i, l in enumerate(self.levels) if 'focus' in l.flags]
        return f[0] if f else None

    def subtree_end(self, i):
        d = self.levels[i].depth
        j = i
        while j + 1 < len(self.levels) and self.levels[j + 1].depth > d:
            j += 1
        return j


@dataclass
class Figure:
    id: str = ''
    title: tuple = ('', '')
    subtitle: tuple = ('', '')
    couple: str | None = None
    couple_note: tuple | None = None
    foot: tuple | None = None
    chains: list = field(default_factory=list)
    root: pathlib.Path | None = None


def bi(s):
    """「英文 | 中文」→ (en, zh)。只认两边带空格的竖线 —— 代码里的 || 不会被切开。"""
    s = s.strip()
    if ' | ' in s:
        en, zh = s.split(' | ', 1)
        return en.strip(), zh.strip()
    return s, s


# ═══════════════════════════ 解析 ═══════════════════════════

HEAD = re.compile(r'^(id|title|subtitle|couple|couple\.note|foot|chain):\s*(.*)$')


def parse(text, where='<spec>'):
    fig, errs = Figure(), []
    chain, last = None, None

    def err(n, msg):
        errs.append(f'{where}:{n}: {msg}')

    for n, raw in enumerate(text.split('\n'), 1):
        if not raw.strip() or raw.lstrip().startswith('#'):
            continue
        if '\t' in raw[:len(raw) - len(raw.lstrip())]:
            err(n, '缩进里有 tab —— 一律用空格，每级两个')
            continue
        m = HEAD.match(raw)
        if m and not raw.startswith(' '):
            k, v = m.group(1), m.group(2)
            if k == 'chain':
                chain = Chain(heading=bi(v))
                fig.chains.append(chain)
                last = None
            elif k == 'id':
                fig.id = v.strip()
            elif k == 'title':
                fig.title = bi(v)
            elif k == 'subtitle':
                fig.subtitle = bi(v)
            elif k == 'couple':
                fig.couple = v.strip()
            elif k == 'couple.note':
                fig.couple_note = bi(v)
            elif k == 'foot':
                fig.foot = bi(v)
            continue
        if chain is None:
            err(n, '在第一个 chain: 之前出现了内容')
            continue
        indent = len(raw) - len(raw.lstrip(' '))
        body = raw.strip()

        if body.startswith('>'):
            if last is None:
                err(n, '原文行（>）前面没有层')
                continue
            parts = SEP.split(body[1:].strip())
            loc = re.match(r'^(.+?):(\d+)(?:-(\d+))?$', parts[0])
            if not loc:
                err(n, f'原文行的出处要写成 file:行 或 file:起-止，这里是「{parts[0]}」')
                continue
            a = int(loc.group(2))
            b = int(loc.group(3) or a)
            marks, share = [], None
            for p in parts[1:]:
                if p.startswith('mark='):
                    marks += [t for t in p[5:].split(';') if t]
                elif p.startswith('share='):
                    share = p[6:]
                else:
                    err(n, f'原文行里不认识的字段「{p}」（只认 mark= / share=）')
            if b < a:
                err(n, f'行号范围倒过来了：{a}-{b}')
            last.quote = Quote(loc.group(1), a, b, marks, share)
            continue

        if body.startswith('!'):
            if last is None:
                err(n, '说明行（!）前面没有层')
                continue
            last.why = bi(body[1:])
            continue

        if body.startswith('^'):
            left, sep, txt = body[1:].partition(' : ')
            if not sep:
                err(n, '回传行要写成「^ 目标层 [= 返回值] : 说明」')
                continue
            target, _, value = left.partition(' = ')
            chain.ret = Ret(target.strip(), value.strip() or None, bi(txt), n)
            continue

        if indent % 2:
            err(n, f'缩进 {indent} 个空格不是偶数 —— 每级两个')
            continue
        depth = indent // 2
        prev = chain.levels[-1].depth if chain.levels else -1
        if depth > prev + 1:
            err(n, f'从第 {prev} 层直接跳到了第 {depth} 层 —— 中间缺一层')
            continue
        parts = SEP.split(body)
        if len(parts) < 2:
            err(n, f'「{parts[0]}」这一层没有出处 —— 每一层都要有 file:行，'
                   '给不出就写「- 为什么给不出」')
            continue
        name, loc = parts[0], parts[1]
        path = line = noline = None
        if loc.startswith('- ') or loc == '-':
            noline = bi(loc[1:])
        else:
            m2 = re.match(r'^(.+?):(\d+)$', loc)
            if not m2:
                err(n, f'出处要写成 file:行，这里是「{loc}」')
                continue
            path, line = m2.group(1), int(m2.group(2))
        flags, note = set(), None
        rest = parts[2:]
        for i, p in enumerate(rest):
            if p.startswith('-- '):
                note = bi('  '.join(rest[i:])[3:])
                break
            for f in p.split():
                if f in ('@removed', '@focus', '@skip'):
                    flags.add(f[1:])
                else:
                    err(n, f'不认识的标记「{f}」（只认 @removed / @focus / @skip）')
        lv = Level(depth, name, path, line, noline, flags, note, n)
        for j in range(len(chain.levels) - 1, -1, -1):
            if chain.levels[j].depth == depth - 1:
                lv.parent = j
                break
        chain.levels.append(lv)
        last = lv
    return fig, errs


# ═══════════════════════════ 核对 ═══════════════════════════

def fn_core(name):
    """`tp_fw_init()` → `tp_fw_init`；`CI job "verify"` 原样。"""
    return re.sub(r'\(.*$', '', name).strip()


def verify(fig, where='<spec>'):
    """源和真实文件对不对得上。返回错误列表 —— 空就是全过。"""
    errs = []
    cache = {}

    def lines_of(path, n):
        f = fig.root / path
        if path not in cache:
            if not f.is_file():
                errs.append(f'{where}:{n}: 找不到文件 {path}（相对 {fig.root}）')
                cache[path] = None
            else:
                cache[path] = f.read_text(encoding='utf-8').split('\n')
        return cache[path]

    if not fig.chains:
        errs.append(f'{where}: 一条 chain 都没有')
    shares = 0
    for ch in fig.chains:
        if not ch.levels:
            errs.append(f'{where}: 「{ch.heading[0]}」这条链是空的')
            continue
        if ch.levels[0].depth != 0:
            errs.append(f'{where}:{ch.levels[0].src}: 链的第一层必须从最左边开始')
        for lv in ch.levels:
            if lv.depth > MAX_DEPTH:
                errs.append(f'{where}:{lv.src}: 第 {lv.depth + 1} 层 —— 超过 {MAX_DEPTH + 1} 层'
                            '读者会数不清自己在第几层，拆成两张')
            if lv.noline is not None:
                if len(re.sub(r'[\s—–\-·.]', '', lv.noline[0])) < 6:
                    errs.append(f'{where}:{lv.src}: 「{lv.name}」给不出行号，但没写为什么'
                                f'（只写了「{lv.noline[0]}」）')
            else:
                ls = lines_of(lv.path, lv.src)
                if ls is not None:
                    if not 1 <= lv.line <= len(ls):
                        errs.append(f'{where}:{lv.src}: {lv.path}:{lv.line} 超出文件范围'
                                    f'（一共 {len(ls)} 行）')
                    elif fn_core(lv.name) not in ls[lv.line - 1]:
                        errs.append(f'{where}:{lv.src}: {lv.path}:{lv.line} 这一行里没有「{fn_core(lv.name)}」'
                                    f' —— 那一行是：{ls[lv.line - 1].strip()!r}')
            q = lv.quote
            if q:
                ls = lines_of(q.path, lv.src)
                if ls is not None:
                    if not (1 <= q.a <= q.b <= len(ls)):
                        errs.append(f'{where}:{lv.src}: 原文 {q.path}:{q.a}-{q.b} 超出文件范围'
                                    f'（一共 {len(ls)} 行）')
                    else:
                        raw = '\n'.join(x.expandtabs(8) for x in ls[q.a - 1:q.b])
                        q.lines = textwrap.dedent(raw).split('\n')
                        body = '\n'.join(q.lines)
                        for t in q.marks + ([q.share] if q.share else []):
                            if not token_spans(q.lines, t):
                                errs.append(f'{where}:{lv.src}: 标出来的「{t}」不在 {q.path}:{q.a}-{q.b} 里'
                                            '（按整词找 —— 长词里的一截不算）')
                        spans = [s for t in q.marks + ([q.share] if q.share else [])
                                 for s in token_spans(q.lines, t)]
                        spans.sort()
                        for (l1, i1, j1, _), (l2, i2, j2, _) in zip(spans, spans[1:]):
                            if l1 == l2 and i2 < j1:
                                errs.append(f'{where}:{lv.src}: mark 和 share 标的字重叠了')
                if q.share:
                    shares += 1
                    if not fig.couple:
                        errs.append(f'{where}:{lv.src}: 写了 share= 却没有 couple: —— 耦合叫什么？')
        # 祖先被删掉的，这一次也不会跑
        for i, lv in enumerate(ch.levels):
            p = lv.parent
            while p is not None:
                if 'removed' in ch.levels[p].flags:
                    lv.unreached = True
                    break
                p = ch.levels[p].parent
        foci = [i for i, lv in enumerate(ch.levels) if 'focus' in lv.flags]
        if len(foci) > 1:
            errs.append(f'{where}: 「{ch.heading[0]}」有 {len(foci)} 个 @focus —— 一条链只有一处是「你要找的那一行」')
        if ch.ret:
            f = ch.focus()
            if f is None:
                errs.append(f'{where}:{ch.ret.src}: 回传（^）要从 @focus 那一层出发，这条链没有 @focus')
            else:
                cand = [i for i in range(f) if ch.levels[i].name == ch.ret.target
                        and ch.levels[i].depth < ch.levels[f].depth]
                if not cand:
                    errs.append(f'{where}:{ch.ret.src}: 回传的目标「{ch.ret.target}」不在焦点上方的链里')
                else:
                    ch.ret.t = cand[-1]
    if fig.couple and shares < 2:
        errs.append(f'{where}: couple: {fig.couple} 只有 {shares} 头 —— 耦合要两头都标（两处 share=）')
    return errs


_W = re.compile(r'[A-Za-z0-9_]')


def find_all(ln, tok):
    """一行里 tok 出现的每一处，**按标识符边界**算。
    探针抓出来的：共享词写 `ret`，按子串找会连 `return` 的前三个字母一起圈上。
    词的两端如果是字母数字下划线，外面紧挨着的那个字符就不能也是 ——
    `*manifest*.txt` 这种以符号开头的词，那一端不受限制。"""
    out, start = [], 0
    while True:
        i = ln.find(tok, start)
        if i < 0:
            return out
        j = i + len(tok)
        left_ok = not (_W.match(tok[0]) and i > 0 and _W.match(ln[i - 1]))
        right_ok = not (_W.match(tok[-1]) and j < len(ln) and _W.match(ln[j]))
        if left_ok and right_ok:
            out.append((i, j))
        start = i + 1


def token_spans(lines, tok):
    """→ [(第几行, 起, 止, tok)]，每一处都标。"""
    return [(k, i, j, tok) for k, ln in enumerate(lines) for i, j in find_all(ln, tok)]


def rel(p):
    try:
        return str(pathlib.Path(p).resolve().relative_to(ROOT))
    except ValueError:
        return str(p)


def load(spec_path):
    p = pathlib.Path(spec_path)
    fig, errs = parse(p.read_text(encoding='utf-8'), rel(p))
    fig.root = p.resolve().parent
    if not errs:
        errs = verify(fig, rel(p))
    return fig, errs


def esc(s):
    return html.escape(s, quote=False)


def attr(s):
    return html.escape(s, quote=True)


def short_paths(fig):
    """第一次出现写全路径，之后只写文件名 —— 同一个文件的长路径重复五遍，
    读者要在一列里找的是行号，不是反复读同一串目录。"""
    seen, out = set(), {}
    for ch in fig.chains:
        for lv in ch.levels:
            for key, path in ((('lv', id(lv)), lv.path), (('q', id(lv)), lv.quote.path if lv.quote else None)):
                if path is None:
                    continue
                out[key] = path if path not in seen else pathlib.PurePosixPath(path).name
                seen.add(path)
    return out


# ═══════════════════════════ 行的顺序 ═══════════════════════════
# 三个渲染器共用：层 → 它的原文 → 它的孩子 …… 焦点那棵子树走完之后，插一行「回传」。
# 回传行画在它真正落回的那一层的缩进上（anthropic §18 的约定：横线长度没有意义，
# 落点的缩进才有意义）—— 读者看缩进就知道失败停在了谁手里。

def rows(ch):
    f = ch.focus()
    end = ch.subtree_end(f) if (f is not None and ch.ret and ch.ret.t is not None) else None
    for i, lv in enumerate(ch.levels):
        yield ('level', i, lv)
        if lv.quote:
            yield ('quote', i, lv)
        if end is not None and i == end:
            yield ('ret', f, ch.ret)


def marked(line, q, wrap):
    """把一行原文切成 [(文字, 种类)]，种类 None / 'mark' / 'share'。"""
    spans = []
    for kind, toks in (('mark', q.marks), ('share', [q.share] if q.share else [])):
        for t in toks:
            spans += [(i, j, kind) for i, j in find_all(line, t)]
    spans.sort()
    out, pos = [], 0
    for i, j, kind in spans:
        if i < pos:
            continue
        if i > pos:
            out.append((line[pos:i], None))
        out.append((line[i:j], kind))
        pos = j
    if pos < len(line):
        out.append((line[pos:], None))
    return ''.join(wrap(t, k) for t, k in out) if wrap else out


# ═══════════════════════════ relief ═══════════════════════════

def span2(pair):
    en, zh = pair
    return f'<span class="lang-en">{esc(en)}</span><span class="lang-zh">{esc(zh)}</span>'


def render_relief(fig):
    """图板里面那一段（sitehead + site）。图板本身和图名 relief-bt 留在页面里手写。"""
    sp = short_paths(fig)
    out = []

    def rwrap(t, k):
        if k == 'mark':
            return f'<em>{esc(t)}</em>'
        if k == 'share':
            return f'<u>{esc(t)}</u>'
        return esc(t)

    for ch in fig.chains:
        out.append(f'<div class="relief-sitehead">{span2(ch.heading)}</div>')
        out.append('<div class="relief-site">')
        for kind, i, obj in rows(ch):
            if kind == 'level':
                lv = obj
                if 'focus' in lv.flags:
                    cls = 'relief-sitefn relief-hot'
                elif 'removed' in lv.flags:
                    cls = 'relief-sitefn relief-removed'
                elif 'skip' in lv.flags or lv.unreached:
                    cls = 'relief-sitefn relief-skip'
                else:
                    cls = 'relief-sitefn relief-raised relief-thin'
                inner = f'<b>{esc(lv.name)}</b>'
                if 'removed' in lv.flags:
                    inner += ('<span class="relief-sitecut"><span class="lang-en">removed</span>'
                              '<span class="lang-zh">删掉了</span></span>')
                if lv.quote and lv.quote.share and fig.couple:
                    inner += f'<span class="relief-sitepin">{esc(fig.couple)}</span>'
                if lv.note:
                    inner += f'<i>{span2(lv.note)}</i>'
                if lv.noline:
                    at = f'<span class="relief-siteat relief-noline">{span2(lv.noline)}</span>'
                else:
                    at = f'<span class="relief-siteat">{esc(sp[("lv", id(lv))])}:{lv.line}</span>'
                out.append(f'  <div class="relief-siterow" style="--d:{lv.depth}">'
                           f'<span class="{cls}">{inner}</span>{at}</div>')
            elif kind == 'quote':
                lv, q = obj, obj.quote
                loc = f'{sp[("q", id(lv))]}:{q.a}' + (f'-{q.b}' if q.b != q.a else '')
                code = '\n'.join(marked(ln, q, rwrap) for ln in q.lines)
                why = (f'<span class="relief-sitewhy">{span2(("← " + lv.why[0], "← " + lv.why[1]))}</span>'
                       if lv.why else '')
                out.append(f'  <div class="relief-sitesrc" style="--d:{lv.depth}">'
                           f'<span class="relief-sitequote"><span class="relief-siteat">{esc(loc)}</span>'
                           f'<code class="relief-sitecode">{code}</code></span>{why}</div>')
            else:
                r, f = obj, i
                t = ch.levels[r.t].depth
                fd = ch.levels[f].depth
                val = f'<b>{esc(r.value)}</b>' if r.value else ''
                out.append(f'  <div class="relief-siteret" style="--d:{t + 1};--span:{fd - t}">'
                           f'<span class="relief-siteretbar"></span>{val}<i>{span2(r.text)}</i></div>')
        out.append('</div>')
    return '\n'.join(out)


# ═══════════════════════════ SVG 共用 ═══════════════════════════

def wrap_words(s, width):
    """按字符数折行，不切单词。"""
    return textwrap.wrap(s, width=max(12, int(width)), break_long_words=False) or ['']


def aria(fig):
    """给读屏的人一段完整的话。**不是图名** —— 图名说不出哪一行、为什么。"""
    parts = [f'{fig.title[0]}.']
    for ch in fig.chains:
        seg = [f'{ch.heading[0]}:']
        for lv in ch.levels:
            where = (f'at {lv.path} line {lv.line}' if lv.path
                     else f'with no line number, because {lv.noline[0]}')
            state = (' — this call was removed' if 'removed' in lv.flags else
                     ' — not reached' if ('skip' in lv.flags or lv.unreached) else
                     ' — the level this figure is about' if 'focus' in lv.flags else '')
            seg.append(f'{"calls " if lv.depth else ""}{lv.name} {where}{state};')
            if lv.quote:
                q = lv.quote
                seg.append(f'the quoted source at {q.path} lines {q.a} to {q.b} reads: '
                           + ' / '.join(x.strip() for x in q.lines) + ';')
                if lv.why:
                    seg.append(f'{lv.why[0]};')
        if ch.ret:
            seg.append(f'the result travels back up to {ch.ret.target}'
                       + (f' as {ch.ret.value}' if ch.ret.value else '') + f': {ch.ret.text[0]}.')
        parts.append(' '.join(seg))
    if fig.couple:
        parts.append(f'The two chains are coupled only through {fig.couple}, marked in both.')
    if fig.foot:
        parts.append(fig.foot[0])
    return ' '.join(parts)


class Svg:
    def __init__(self):
        self.parts = []

    def add(self, s):
        self.parts.append(s)

    def text(self, x, y, s, size, fill, weight=None, anchor=None, italic=False, family=None,
             length=None, spacing=None, preserve=False):
        a = [f'x="{x:g}"', f'y="{y:g}"', f'font-size="{size:g}"']
        if weight:
            a.append(f'font-weight="{weight}"')
        if spacing:
            a.append(f'letter-spacing="{spacing}"')
        if anchor:
            a.append(f'text-anchor="{anchor}"')
        if italic:
            a.append('font-style="italic"')
        if length:
            a.append(f'textLength="{length:g}" lengthAdjust="spacing"')
        if preserve:
            a.append('xml:space="preserve"')
        a.append(f'fill="{fill}"')
        if family:
            a.append(f'font-family="{family}"')
        body = s if s.startswith('<tspan') or '<tspan' in s else esc(s)
        self.add(f'  <text {" ".join(a)}>{body}</text>')


# ═══════════════════════════ anthropic ═══════════════════════════

A_SANS = "Poppins, 'Noto Sans SC', 'Helvetica Neue', Arial, sans-serif"
A_MONO = "SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace"
# 每条链一个 hue（§1 色彩语义表）：金 = 暂存 / 次要，橄榄绿 = 分析，蓝 = 数据
A_HUES = [('#c9913f', '#f0e4d8', '#e0cdb4', '#8a5a2a'),
          ('#788c5d', '#e5e9dd', '#d3dcc6', '#5d7045'),
          ('#6a9bcc', '#e2ecf5', '#c9d9ea', '#4a7bab')]


def render_anthropic(fig):
    """上下叠的分组 · 出处右对齐成一列 + 目录页那种引导点线 ·
    原文放深色卡、卡顶是文件名 · 解释紧挨在原文右边 · 耦合线绕到分组外。"""
    sp = short_paths(fig)
    M, STEP, CH, GAP, WHY = 32, 24, 46, 8, 42
    GUT = 44 if fig.couple else 0
    MS = 7.2                                      # 12px 等宽的字符步进
    gx = M

    def card_w(lv):
        note = lv.note[0] if lv.note else ''
        if 'removed' in lv.flags:
            note = 'removed · ' + note if note else 'removed'
        return max(200, 24 + len(lv.name) * 7.8 + 16, 14 + len(note) * 6.9 + 16)

    def quote_w(q):
        return max(240, max(len(ln) for ln in q.lines) * MS + 28)

    # 出处列的位置由内容决定，不钉在画布右边。第一版钉在 1200 宽的右边缘，
    # 卡片在左、出处在右，引导点线拉了一千多像素 —— 点线本来是为了防串行，
    # 长到那个地步它自己就成了要读的东西。
    XR = 0
    for ch in fig.chains:
        for kind, i, obj in rows(ch):
            if kind == 'level':
                lv = obj
                x = gx + 20 + lv.depth * STEP
                if lv.noline:
                    XR = max(XR, x + card_w(lv) + 36 + len(lv.noline[0]) * 6.6)
                else:
                    XR = max(XR, x + card_w(lv) + 90 + len(f'{sp[("lv", id(lv))]}:{lv.line}') * 6.9)
            elif kind == 'quote':
                lv, q = obj, obj.quote
                qx = gx + 20 + (lv.depth + 1) * STEP
                why = (min(len(lv.why[0]), WHY) * 6.6 + 34) if lv.why else 0
                chip = (len(fig.couple) * 6.9 + 44) if (q.share and fig.couple) else 0
                XR = max(XR, qx + quote_w(q) + why + chip + 10)
            else:
                r, f = obj, i
                fx = gx + 20 + (ch.levels[f].depth + 1) * STEP
                XR = max(XR, fx + 20 + (len(r.value or '') + len(r.text[0])) * 6.6)
    # 副标题放在标题下面一行，不跟标题挤一行 —— 挤一行时是那行字决定了画布宽度，
    # 出处列被它推到最右，引导点线又长回去了
    W = max(960, XR + 20 + GUT + M, len(fig.title[0]) * 8.4 + 2 * M, len(fig.subtitle[0]) * 6.6 + 2 * M)
    XR = W - M - GUT - 20                         # 出处列的右边缘
    gr = XR + 20
    body, chips = Svg(), []
    y = 70 if fig.subtitle[0] else 54
    for ci, ch in enumerate(fig.chains):
        hue, tint, tstroke, hdark = A_HUES[ci % len(A_HUES)]
        g = Svg()
        gy = y
        cy = gy + 44
        card = {}                                 # 层下标 → (x, y, w)
        for kind, i, obj in rows(ch):
            if kind == 'level':
                lv = obj
                x = gx + 20 + lv.depth * STEP
                note = lv.note[0] if lv.note else ''
                if 'removed' in lv.flags:
                    note = 'removed · ' + note if note else 'removed'
                w = card_w(lv)
                card[i] = (x, cy, w)
                ny = cy + 20 if note else cy + 28      # 没有副说明时名字居中，别贴在顶上
                if lv.parent is not None:
                    px, py, _ = card[lv.parent]
                    g.add(f'  <path d="M{px + 12:g},{py + CH:g} V{cy + 15:g} Q{px + 12:g},{cy + 23:g} '
                          f'{px + 20:g},{cy + 23:g} H{x:g}" fill="none" stroke="#a8a496" stroke-width="1.2"/>')
                focus, removed = 'focus' in lv.flags, 'removed' in lv.flags
                dim = 'skip' in lv.flags or lv.unreached
                if focus:
                    g.add(f'  <rect x="{x:g}" y="{cy:g}" width="{w:g}" height="{CH}" rx="9" fill="#f7e4dc" '
                          f'stroke="#d97757" stroke-width="1.5" filter="url(#cslCard)"/>')
                elif removed:
                    g.add(f'  <rect x="{x:g}" y="{cy:g}" width="{w:g}" height="{CH}" rx="9" fill="#faf9f5" '
                          f'stroke="#a8a496" stroke-width="1.2" stroke-dasharray="4 3"/>')
                elif dim:
                    g.add(f'  <rect x="{x:g}" y="{cy:g}" width="{w:g}" height="{CH}" rx="9" fill="#ffffff" '
                          f'stroke="#e3e0d4"/>')
                else:
                    g.add(f'  <rect x="{x:g}" y="{cy:g}" width="{w:g}" height="{CH}" rx="9" fill="#ffffff" '
                          f'stroke="#d8d4c8" filter="url(#cslCard)"/>')
                dot = '#d97757' if focus else ('#c9c5b6' if (dim or removed) else hue)
                g.add(f'  <circle cx="{x + 14:g}" cy="{ny - 4:g}" r="3.5" fill="{dot}"/>')
                ink = '#8c8a7d' if (dim or removed) else '#141413'
                nw = len(lv.name) * 7.8
                g.text(x + 24, ny, lv.name, 13, ink, weight=600, family=A_MONO, length=nw)
                if removed:
                    g.add(f'  <line x1="{x + 22:g}" y1="{ny - 4.5:g}" x2="{x + 26 + nw:g}" y2="{ny - 4.5:g}" '
                          f'stroke="#c2613f" stroke-width="1.6"/>')
                if note:
                    g.text(x + 14, cy + 36, note, 11.5,
                           '#c2613f' if (focus or removed) else '#6b6a5f')
                if lv.noline:
                    tw = len(lv.noline[0]) * 6.6 + 12
                    if XR - tw < x + w + 16:
                        raise SystemExit(f'✗ 「{lv.name}」给不出行号的理由太长，和卡片撞了 —— 写短一点')
                    g.text(XR, cy + 27, f'[{lv.noline[0]}]', 11.5, '#8c8a7d', anchor='end', italic=True)
                else:
                    s = f'{sp[("lv", id(lv))]}:{lv.line}'
                    fw = len(s) * 6.9
                    x1, x2 = x + w + 10, XR - fw - 10
                    if x2 - x1 > 16:
                        g.add(f'  <path d="M{x1:g},{cy + 23:g} H{x2:g}" stroke="#c9c5b6" stroke-width="1" '
                              f'stroke-dasharray="1.5 5"/>')
                    g.text(XR, cy + 27, s, 11.5, '#4a7bab', anchor='end', family=A_MONO, length=fw)
                cy += CH + GAP
            elif kind == 'quote':
                lv, q = obj, obj.quote
                lx = card[i][0]
                qx, qy = lx + STEP, cy
                n = len(q.lines)
                qw = max(240, max(len(ln) for ln in q.lines) * MS + 28)
                qh = 22 + 8 + n * 20 + 8
                g.add(f'  <rect x="{qx:g}" y="{qy:g}" width="{qw:g}" height="{qh:g}" rx="8" fill="#1f1e1b"/>')
                g.add(f'  <rect x="{qx:g}" y="{qy:g}" width="{qw:g}" height="22" rx="8" fill="#2b2924"/>')
                g.add(f'  <rect x="{qx:g}" y="{qy + 12:g}" width="{qw:g}" height="10" fill="#2b2924"/>')
                loc = f'{sp[("q", id(lv))]}:{q.a}' + (f'-{q.b}' if q.b != q.a else '')
                g.text(qx + 12, qy + 15, loc, 11.5, '#a8a496', family=A_MONO, length=len(loc) * 6.9)
                for k, ln in enumerate(q.lines):
                    by = qy + 44 + k * 20
                    pos = 0
                    for piece, kind2 in marked(ln, q, None):
                        if kind2:
                            rx = qx + 14 + pos * MS - 1.5
                            rw = len(piece) * MS + 3
                            if kind2 == 'mark':
                                g.add(f'  <rect x="{rx:g}" y="{by - 13:g}" width="{rw:g}" height="18" rx="3" '
                                      f'fill="#d97757" opacity="0.32"/>')
                            else:
                                g.add(f'  <rect x="{rx:g}" y="{by - 13:g}" width="{rw:g}" height="18" rx="3" '
                                      f'fill="none" stroke="#d97757" stroke-width="1.2"/>')
                        pos += len(piece)
                    if ln:
                        g.text(qx + 14, by, ln, 12, '#e8e6dd', family=A_MONO, length=len(ln) * MS, preserve=True)
                chip_w = (len(fig.couple) * 6.9 + 28) if (q.share and fig.couple) else 0
                if chip_w:
                    chips.append((XR, qy + 13))
                    g.add(f'  <rect x="{XR - chip_w:g}" y="{qy:g}" width="{chip_w:g}" height="26" rx="13" '
                          f'fill="#f7e4dc" stroke="#d97757" stroke-width="1.2"/>')
                    g.text(XR - chip_w / 2, qy + 17, fig.couple, 11.5, '#c2613f', weight=600,
                           anchor='middle', family=A_MONO)
                used = qh
                if lv.why:
                    wx = qx + qw + 18
                    avail = XR - (chip_w + 16 if chip_w else 0) - wx
                    if avail >= 180:
                        for k, t in enumerate(wrap_words(lv.why[0], min(WHY, avail / 6.6))):
                            g.text(wx, qy + 44 + k * 18, ('← ' if k == 0 else '   ') + t, 11.5, '#6b6a5f')
                    else:
                        wl = wrap_words(lv.why[0], (XR - qx) / 6.6)
                        for k, t in enumerate(wl):
                            g.text(qx, qy + qh + 18 + k * 18, ('↑ ' if k == 0 else '   ') + t, 11.5, '#6b6a5f')
                        used += 8 + len(wl) * 18
                cy += used + GAP
            else:
                r, f = obj, i
                land = ch.levels[r.t].depth + 1
                fx = gx + 20 + (ch.levels[f].depth + 1) * STEP
                lx = gx + 20 + land * STEP
                g.add(f'  <path d="M{fx:g},{cy + 11:g} H{lx + 8:g}" fill="none" stroke="#a8a496" '
                      f'stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#cslArrG)"/>')
                val = (f'<tspan font-family="{A_MONO}" font-weight="600" fill="#c2613f">{esc(r.value)}</tspan>'
                       f'<tspan dx="8">{esc(r.text[0])}</tspan>') if r.value else esc(r.text[0])
                g.text(fx + 10, cy + 15, val, 11.5, '#6b6a5f')
                cy += 26 + GAP
        gh = cy - gy + 10
        body.add(f'  <rect x="{gx}" y="{gy}" width="{gr - gx}" height="{gh:g}" rx="12" fill="{tint}" stroke="{tstroke}"/>')
        body.add(f'  <rect x="{gx}" y="{gy}" width="4" height="{gh:g}" rx="2" fill="{hue}"/>')
        body.add(f'  <circle cx="{gx + 22}" cy="{gy + 22}" r="4" fill="{hue}"/>')
        body.text(gx + 34, gy + 26, ch.heading[0].upper(), 11.5, hdark, weight=700, spacing='0.9')
        body.parts += g.parts
        y = gy + gh + 24
    if len(chips) >= 2:
        (ax, ay), (bx, by) = chips[0], chips[1]
        gx2 = XR + 22
        body.add(f'  <path d="M{ax:g},{ay:g} H{gx2 - 8:g} Q{gx2:g},{ay:g} {gx2:g},{ay + 8:g} V{by - 8:g} '
                 f'Q{gx2:g},{by:g} {gx2 - 8:g},{by:g} H{bx + 3:g}" fill="none" stroke="#d97757" '
                 f'stroke-width="1.5" stroke-dasharray="6 4" marker-end="url(#cslArrO)"/>')
    H = y + (26 if fig.foot else 0)
    if fig.foot:
        body.text(M, y + 4, fig.foot[0], 11.5, '#8c8a7d', italic=True)
    head = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H:g}" role="img" '
        f'aria-label="{attr(aria(fig))}" font-family="{A_SANS}">',
        '  <!-- generated by skills/design-review/scripts/gen_call_site_figure.py'
        f' from references/callsites/{fig.id}/figure.chain — edit the source, not this file -->',
        '  <defs>',
        '    <pattern id="cslDots" width="24" height="24" patternUnits="userSpaceOnUse">',
        '      <circle cx="12" cy="12" r="1" fill="#141413" opacity="0.05"/>',
        '    </pattern>',
        '    <filter id="cslCard" x="-20%" y="-20%" width="140%" height="140%">',
        '      <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#141413" flood-opacity="0.06"/>',
        '    </filter>',
        '    <marker id="cslArrO" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">',
        '      <path d="M0,0.5 L7.5,4 L0,7.5 Z" fill="#d97757"/>',
        '    </marker>',
        '    <marker id="cslArrG" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">',
        '      <path d="M0,0.5 L7.5,4 L0,7.5 Z" fill="#a8a496"/>',
        '    </marker>',
        '  </defs>',
        f'  <rect width="{W}" height="{H:g}" rx="16" fill="#faf9f5" stroke="#eceadf"/>',
        f'  <rect width="{W}" height="{H:g}" rx="16" fill="url(#cslDots)"/>',
    ]
    top = Svg()
    top.text(M, 34, fig.title[0], 12, '#6b6a5f', weight=600, spacing='1.2')
    if fig.subtitle[0]:
        top.text(M, 52, fig.subtitle[0], 11.5, '#8c8a7d', italic=True)
    return '\n'.join(head + top.parts + body.parts + ['</svg>'])


# ═══════════════════════════ apple ═══════════════════════════

P_SANS = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', 'Helvetica Neue', Arial, sans-serif"
P_MONO = "'SF Mono', ui-monospace, Menlo, Monaco, monospace"


def render_apple(fig):
    """两条链并排（放得下的话）· 灰阶五档 · **蓝只给耦合**（两枚标签、它们之间那条线、
    原文里那个共享的词）· 「你要找的那一行」靠深色卡里的明度 · 不画引导点线。
    放不下就上下叠 —— 宁可叠也不把字缩小。"""
    sp = short_paths(fig)
    W, M, STEP, CH, GAP, PAD = 1120, 32, 24, 60, 12, 28
    MS = 7.5                                       # 12.5px 等宽的字符步进
    chip_w = (len(fig.couple) * MS + 34) if fig.couple else 0

    def note_of(lv):
        n = lv.note[0] if lv.note else ''
        if 'removed' in lv.flags:
            n = 'removed · ' + n if n else 'removed'
        return n

    # 长的副说明和「给不出行号」的理由折成两行，不让它们把卡片和出处列撑宽 ——
    # 第一版就是被一句 50 个字符的副说明撑出 385px 的卡，两条链并排差 87px 放不下，
    # 整张图退回上下叠、高到 1112，渲染出来超过一屏。
    NOTE_MAX, NOLINE_MAX = 260, 170

    def note_lines(lv):
        n = note_of(lv)
        return wrap_words(n, NOTE_MAX / 6.9)[:2] if n else []

    def noline_lines(lv):
        return wrap_words(lv.noline[0], NOLINE_MAX / 6.9)[:2]

    def card_w(lv):
        nl = note_lines(lv)
        return max(220, len(lv.name) * 8.1 + 40, max((len(t) for t in nl), default=0) * 6.9 + 40)

    def card_h(lv):
        return CH + 20 * max(0, len(note_lines(lv)) - 1)

    def quote_w(q):
        return max(260, max(len(ln) for ln in q.lines) * MS + 32)

    def need(ch):
        right = max(lv.depth * STEP + card_w(lv) for lv in ch.levels)
        file_x = PAD + right + 20
        fw = max((max(len(t) for t in noline_lines(lv)) * 6.9 if lv.noline
                  else len(f'{sp[("lv", id(lv))]}:{lv.line}') * MS)
                 for lv in ch.levels)
        n = file_x + fw + 24
        for lv in ch.levels:
            if lv.quote:
                n = max(n, PAD + (lv.depth + 1) * STEP + quote_w(lv.quote) + 24)
        if ch.ret:
            f = ch.focus()
            n = max(n, PAD + (ch.levels[f].depth + 1) * STEP + 30
                    + (len(ch.ret.value or '') + len(ch.ret.text[0])) * 6.9 + 24)
        return n, file_x

    needs = [need(ch) for ch in fig.chains]
    side = len(fig.chains) == 2 and sum(n for n, _ in needs) + 16 <= W - 2 * M
    if side:
        extra = (W - 2 * M - 16 - sum(n for n, _ in needs)) / 2
        geo = [(M, needs[0][0] + extra), (M + needs[0][0] + extra + 16, needs[1][0] + extra)]
    else:
        geo = [(M, W - 2 * M)] * len(fig.chains)

    top_y = 74 if fig.subtitle[0] else 56
    drawn, chips = [], []
    y = top_y
    for ci, ch in enumerate(fig.chains):
        gx, gw = geo[ci]
        gy = top_y if side else y
        file_x = gx + needs[ci][1]
        g = Svg()
        cy = gy + 48
        cardx = {}
        for kind, i, obj in rows(ch):
            if kind == 'level':
                lv = obj
                x = gx + PAD + lv.depth * STEP
                w = card_w(lv)
                cardx[i] = x
                focus, removed = 'focus' in lv.flags, 'removed' in lv.flags
                dim = 'skip' in lv.flags or lv.unreached
                h = card_h(lv)
                if removed:
                    g.add(f'  <rect x="{x:g}" y="{cy:g}" width="{w:g}" height="{h}" rx="14" fill="none" '
                          f'stroke="#aeaeb2" stroke-width="1.2" stroke-dasharray="4 3"/>')
                elif dim:
                    g.add(f'  <rect x="{x:g}" y="{cy:g}" width="{w:g}" height="{h}" rx="14" fill="#ffffff"/>')
                else:
                    g.add(f'  <rect x="{x:g}" y="{cy:g}" width="{w:g}" height="{h}" rx="14" fill="#ffffff" '
                          f'filter="url(#cslCard)"/>')
                note = note_of(lv)
                ny = cy + 26 if note else cy + 35
                nw = len(lv.name) * 8.1
                g.text(x + 20, ny, lv.name, 13.5, '#86868b' if (dim or removed) else '#1d1d1f',
                       weight=600, family=P_MONO, length=nw)
                if removed:
                    g.add(f'  <line x1="{x + 18:g}" y1="{ny - 4.5:g}" x2="{x + 22 + nw:g}" y2="{ny - 4.5:g}" '
                          f'stroke="#86868b" stroke-width="1.4"/>')
                for k, t in enumerate(note_lines(lv)):
                    g.text(x + 20, cy + 46 + k * 20, t, 12.5, '#1d1d1f' if focus else '#86868b')
                if lv.noline:
                    for k, t in enumerate(noline_lines(lv)):
                        g.text(file_x, cy + 34 + k * 18, t, 12.5, '#aeaeb2')
                else:
                    loc = f'{sp[("lv", id(lv))]}:{lv.line}'
                    g.text(file_x, cy + 34, loc, 12.5, '#6e6e73', family=P_MONO, length=len(loc) * MS)
                cy += h + GAP
            elif kind == 'quote':
                lv, q = obj, obj.quote
                qx, qy = cardx[i] + STEP, cy
                n = len(q.lines)
                qw = quote_w(q)
                qh = 24 + 10 + n * 22 + 8
                g.add(f'  <rect x="{qx:g}" y="{qy:g}" width="{qw:g}" height="{qh:g}" rx="10" fill="#1d1d1f"/>')
                g.add(f'  <rect x="{qx:g}" y="{qy:g}" width="{qw:g}" height="24" rx="10" fill="#2c2c2e"/>')
                g.add(f'  <rect x="{qx:g}" y="{qy + 12:g}" width="{qw:g}" height="12" fill="#2c2c2e"/>')
                loc = f'{sp[("q", id(lv))]}:{q.a}' + (f'-{q.b}' if q.b != q.a else '')
                g.text(qx + 14, qy + 16.5, loc, 12.5, '#aeaeb2', family=P_MONO, length=len(loc) * MS)
                for k, ln in enumerate(q.lines):
                    by = qy + 48 + k * 22
                    pos, spans = 0, []
                    for piece, kind2 in marked(ln, q, None):
                        if kind2 == 'share':
                            g.add(f'  <rect x="{qx + 16 + pos * MS - 1.5:g}" y="{by - 14:g}" '
                                  f'width="{len(piece) * MS + 3:g}" height="19" rx="3" fill="#0071e3" opacity="0.26"/>')
                        # 明度台阶代替色相：普通 #86868b，决定结局的字和共享的词 #ffffff
                        fill = '#ffffff' if kind2 else '#86868b'
                        wt = ' font-weight="600"' if kind2 == 'mark' else ''
                        spans.append(f'<tspan fill="{fill}"{wt}>{esc(piece)}</tspan>')
                        pos += len(piece)
                    if ln:
                        g.text(qx + 16, by, ''.join(spans), 12.5, '#86868b', family=P_MONO,
                               length=len(ln) * MS, preserve=True)
                used = qh
                if lv.quote.share and fig.couple and not side:
                    chips.append(('right', gx + gw - 24, qy + 16))
                    g.add(f'  <rect x="{gx + gw - 24 - chip_w:g}" y="{qy:g}" width="{chip_w:g}" height="32" rx="10" '
                          f'fill="#eaf3fe" stroke="#0071e3" stroke-width="1.5"/>')
                    g.text(gx + gw - 24 - chip_w / 2, qy + 21, fig.couple, 12.5, '#1d1d1f', weight=600,
                           anchor='middle', family=P_MONO)
                if lv.why:
                    lines = wrap_words(lv.why[0], (gx + gw - 24 - qx) / 6.9)
                    for k, t in enumerate(lines):
                        g.text(qx, qy + qh + 22 + k * 20, ('↑ ' if k == 0 else '   ') + t, 12.5, '#86868b')
                    used += 12 + len(lines) * 20
                cy += used + GAP
            else:
                r, f = obj, i
                land = ch.levels[r.t].depth + 1
                fx = gx + PAD + (ch.levels[f].depth + 1) * STEP
                lx = gx + PAD + land * STEP
                g.add(f'  <path d="M{fx:g},{cy + 12:g} H{lx + 8:g}" fill="none" stroke="#aeaeb2" '
                      f'stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#cslArrG)"/>')
                val = (f'<tspan font-family="{P_MONO}" font-weight="600" fill="#1d1d1f">{esc(r.value)}</tspan>'
                       f'<tspan dx="8">{esc(r.text[0])}</tspan>') if r.value else esc(r.text[0])
                g.text(fx + 12, cy + 16.5, val, 12.5, '#86868b')
                cy += 28 + GAP
        drawn.append([gx, gy, gw, cy, g, ch])
        if not side:
            y = cy + 20 + 24
    if side and fig.couple:
        chip_y = max(d[3] for d in drawn) + 8
        for d in drawn:
            gx = d[0]
            d[4].add(f'  <rect x="{gx + PAD:g}" y="{chip_y:g}" width="{chip_w:g}" height="32" rx="10" '
                     f'fill="#eaf3fe" stroke="#0071e3" stroke-width="1.5"/>')
            d[4].text(gx + PAD + chip_w / 2, chip_y + 21, fig.couple, 12.5, '#1d1d1f', weight=600,
                      anchor='middle', family=P_MONO)
            d[3] = chip_y + 32 + 8
        a, b = drawn[0], drawn[1]
        x1, x2, ly = a[0] + PAD + chip_w, b[0] + PAD, chip_y + 16
        line = (f'  <path d="M{x1 + 2:g},{ly:g} H{x2 - 3:g}" fill="none" stroke="#0071e3" stroke-width="1.5" '
                f'marker-end="url(#cslBlue)"/>')
        if fig.couple_note:
            note = Svg()
            note.text(x1 + 16, ly - 10, fig.couple_note[0], 12.5, '#86868b')
            line += '\n' + '\n'.join(note.parts)
    body = Svg()
    bottom = 0
    for gx, gy, gw, cy, g, ch in drawn:
        gh = (max(d[3] for d in drawn) if side else cy) - gy + 20
        body.add(f'  <rect x="{gx:g}" y="{gy:g}" width="{gw:g}" height="{gh:g}" rx="18" fill="#f5f5f7"/>')
        body.text(gx + PAD, gy + 32, ch.heading[0], 12.5, '#86868b', weight=500)
        body.parts += g.parts
        bottom = max(bottom, gy + gh)
    if side and fig.couple:
        body.add(line)
    elif len(chips) >= 2:
        (_, ax, ay), (_, bx, by) = chips[0], chips[1]
        gx2 = ax + 22
        body.add(f'  <path d="M{ax:g},{ay:g} H{gx2 - 8:g} Q{gx2:g},{ay:g} {gx2:g},{ay + 8:g} V{by - 8:g} '
                 f'Q{gx2:g},{by:g} {gx2 - 8:g},{by:g} H{bx + 3:g}" fill="none" stroke="#0071e3" '
                 f'stroke-width="1.5" marker-end="url(#cslBlue)"/>')
    y = bottom + 30
    H = y + (22 if fig.foot else 0)
    if fig.foot:
        body.text(M, y + 4, fig.foot[0], 12.5, '#86868b')
    head = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H:g}" role="img" '
        f'aria-label="{attr(aria(fig))}" font-family="{P_SANS}">',
        '  <!-- generated by skills/design-review/scripts/gen_call_site_figure.py'
        f' from references/callsites/{fig.id}/figure.chain — edit the source, not this file -->',
        '  <defs>',
        '    <marker id="cslBlue" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">',
        '      <path d="M0,0.5 L7.5,4 L0,7.5 Z" fill="#0071e3"/>',
        '    </marker>',
        '    <marker id="cslArrG" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">',
        '      <path d="M0,0.5 L7.5,4 L0,7.5 Z" fill="#aeaeb2"/>',
        '    </marker>',
        '    <filter id="cslCard" x="-20%" y="-20%" width="140%" height="140%">',
        '      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="0.08"/>',
        '    </filter>',
        '  </defs>',
        f'  <rect width="{W}" height="{H:g}" fill="#ffffff"/>',
    ]
    top = Svg()
    top.text(M, 34, fig.title[0], 12.5, '#86868b', weight=600, spacing='1.2')
    if fig.subtitle[0]:
        top.text(M, 54, fig.subtitle[0], 12.5, '#aeaeb2')
    return '\n'.join(head + top.parts + body.parts + ['</svg>'])


# ═══════════════════════════ 写回 / 核对 ═══════════════════════════

RENDER = {'relief': render_relief, 'anthropic': render_anthropic, 'apple': render_apple}


def output_for(fig, style, dest, mode):
    out = RENDER[style](fig)
    if mode == 'file':
        return '<?xml version="1.0" encoding="UTF-8"?>\n' + out + '\n'
    if style != 'relief':
        # 图集页里的 SVG 套一层横向滚动。不套的话手机上整张图等比缩到 290px 宽，
        # 最小的字实测只剩 2.8px（anthropic）/ 3.2px（apple）—— 缩小不是适配，是看不见。
        return f'<div class="gal-scroll gal-scroll--{style}">\n{out}\n</div>'
    return out


def block_re(fid, style):
    return re.compile(r'(<!-- gen:callsite ' + re.escape(fid) + ' ' + style + r' -->\n)(.*?)(\n[ \t]*<!-- /gen:callsite -->)',
                      re.S)


def run_targets(check):
    figs, bad = {}, []
    for fid in sorted({t[0] for t in TARGETS}):
        fig, errs = load(SPECS / fid / 'figure.chain')
        if errs:
            bad += errs
        else:
            figs[fid] = fig
    if bad:
        print('源和真实文件对不上，一张图都没生成：')
        for e in bad:
            print('  ✗ ' + e)
        return 1
    stale, wrote = [], []
    for fid, style, dest, mode in TARGETS:
        p = ROOT / dest
        new = output_for(figs[fid], style, dest, mode)
        cur = p.read_text(encoding='utf-8') if p.exists() else None
        if mode == 'file':
            if cur != new:
                stale.append(dest)
                if not check:
                    p.write_text(new, encoding='utf-8')
                    wrote.append(dest)
            continue
        if cur is None:
            bad.append(f'{dest}: 文件不存在')
            continue
        m = block_re(fid, style).search(cur)
        if not m:
            bad.append(f'{dest}: 找不到 <!-- gen:callsite {fid} {style} --> 块')
            continue
        if m.group(2) != new:
            stale.append(dest)
            if not check:
                p.write_text(cur[:m.end(1)] + new + cur[m.start(3):], encoding='utf-8')
                wrote.append(dest)
    for fid, fig in figs.items():
        n = sum(len(ch.levels) for ch in fig.chains)
        q = sum(1 for ch in fig.chains for lv in ch.levels if lv.quote)
        print(f'  {fid}: {len(fig.chains)} 条链 · {n} 层（每层的行号都核过）· {q} 段原文从文件里读出')
    if bad:
        print('\n'.join('  ✗ ' + b for b in bad))
        return 1
    if check:
        if stale:
            print('\n页面上的图和源对不上 —— 跑 gen_call_site_figure.py 重新生成：')
            for d in stale:
                print('  ✗ ' + d)
            return 1
        print(f'{len(TARGETS)} 处图都和源一致')
        return 0
    print(f'写回 {len(wrote)} 处：' + ('、'.join(wrote) if wrote else '（都已经是最新的）'))
    return 0


def run_one(spec, style):
    fig, errs = load(spec)
    if errs:
        for e in errs:
            print('✗ ' + e, file=sys.stderr)
        return 1
    out = RENDER[style](fig)
    if style == 'relief':
        # 单独渲染时连图板一起给，贴进页面就能用
        out = (f'<div class="relief-board relief-raised"><div class="relief-bt">{span2(fig.title)}'
               + (f'<em>{span2(fig.subtitle)}</em>' if fig.subtitle[0] else '') + '</div>\n'
               + out + '\n</div>')
    print(out)
    return 0


# ═══════════════════════════ 探针 ═══════════════════════════
# 每一种坏法都得被拦下。拦不下，就说明这道核对放行了它本该拦的东西 ——
# 而这张图坏掉的方式恰恰全都不报错：行号过期、原文抄错、理由空着，图看着都正常。

SELFTEST_SRC = """int helper(void)
{
	return 0;
}

int caller(void)
{
	int ret;

	ret = helper();
	if (ret < 0)
		return -EINVAL;
	return 0;
}
"""

GOOD = """id: probe
title: PROBE | 探针
couple: ret
chain: A | 甲
caller()          x.c:6
  helper()        x.c:10    @focus
    > x.c:10-12    mark=return -EINVAL    share=ret
  ^ caller() = -EINVAL : the caller sees an error | 调用方拿到错误
chain: B | 乙
runtime           - dispatched at runtime · no call site | 运行时分派 · 没有调用点
  caller()        x.c:6
    > x.c:10    share=ret
"""

PROBES = [
    ('函数名不在那一行', GOOD.replace('helper()        x.c:10', 'helper()        x.c:12'), '这一行里没有「helper」'),
    ('行号超出文件', GOOD.replace('caller()          x.c:6', 'caller()          x.c:99'), '超出文件范围'),
    ('文件不存在', GOOD.replace('caller()          x.c:6', 'caller()          y.c:6'), '找不到文件 y.c'),
    ('给不出行号却没写为什么', GOOD.replace('- dispatched at runtime · no call site | 运行时分派 · 没有调用点', '- —'), '没写为什么'),
    ('标出来的词不在原文里', GOOD.replace('mark=return -EINVAL', 'mark=return -ENOMEM'), '「return -ENOMEM」不在'),
    ('共享的词不在原文里', GOOD.replace('> x.c:10    share=ret', '> x.c:10    share=nope'), '「nope」不在'),
    ('耦合只有一头', GOOD.replace('> x.c:10    share=ret', '> x.c:10'), '只有 1 头'),
    ('回传没有焦点', GOOD.replace('@focus', ''), '没有 @focus'),
    ('回传目标不在焦点上方', GOOD.replace('^ caller() =', '^ helper() ='), '不在焦点上方'),
    ('共享词只在长词里出现', GOOD.replace('> x.c:10    share=ret', '> x.c:12    share=ret'), '「ret」不在'),
    ('层级跳了一级', GOOD.replace('  helper()        x.c:10', '    helper()        x.c:10'), '中间缺一层'),
    ('层数太深', 'chain: D\n' + ''.join('  ' * k + f'caller()    x.c:6\n' for k in range(8)), '拆成两张'),
    ('两个焦点', GOOD.replace('caller()          x.c:6', 'caller()          x.c:6    @focus'), '个 @focus'),
    ('不认识的标记', GOOD.replace('@focus', '@focussed'), '不认识的标记'),
    ('这一层没有出处', GOOD.replace('caller()          x.c:6\n  helper()', 'caller()\n  helper()'), '没有出处'),
]


def self_test():
    d = ROOT / '.scratch' / 'callsite-probe'
    d.mkdir(parents=True, exist_ok=True)
    (d / 'x.c').write_text(SELFTEST_SRC, encoding='utf-8')
    fails = []

    def errs_of(text):
        (d / 'figure.chain').write_text(text, encoding='utf-8')
        _, errs = load(d / 'figure.chain')
        return errs

    base = errs_of(GOOD)
    if base:
        fails.append('好的源被拦下了（误报）：' + ' / '.join(base))
    for label, text, want in PROBES:
        errs = errs_of(text)
        if not any(want in e for e in errs):
            fails.append(f'{label}：没被拦下（期望报「{want}」，实际 {errs or "零条"}）')
    # 页面过期要被 --check 发现：把块里的一个数字改掉，比对必须不相等
    fig, _ = load(d / 'figure.chain') if not errs_of(GOOD) else (None, None)
    if fig:
        for style in RENDER:
            out = RENDER[style](fig)
            tampered = out.replace('x.c:6', 'x.c:7', 1)
            if tampered == out:
                fails.append(f'{style}：探针没打中 —— 渲染结果里找不到 x.c:6')
            # 渲染两次必须逐字节相同，否则 --check 会随机报过期
            if RENDER[style](fig) != out:
                fails.append(f'{style}：同一份源渲染两次结果不一样 —— --check 会乱报')
    for f in d.iterdir():
        f.unlink()
    print(f'探针：{len(PROBES)} 种坏法 + 1 份好的源 + 三种风格各自的「渲染两次一致」')
    if fails:
        print(f'\n{len(fails)} 条不过：')
        for f in fails:
            print('  ✗ ' + f)
        return 1
    print('全部拦下，好的源放行')
    return 0


def main(argv):
    if '--self-test' in argv:
        return self_test()
    style = next((a.split('=', 1)[1] for a in argv if a.startswith('--style=')), None)
    specs = [a for a in argv if not a.startswith('--')]
    if specs:
        if style not in RENDER:
            print('用法：gen_call_site_figure.py SPEC --style=relief|anthropic|apple', file=sys.stderr)
            return 2
        return run_one(specs[0], style)
    return run_targets(check='--check' in argv)


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
