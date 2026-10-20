#!/usr/bin/env python3
"""check_explain.py — 查一份内核原理讲义是不是「先全貌,后细节」。

只查结构:七层的小标题在不在、顺序对不对、第一张图是不是在细节之前、
主线里出处多不多、演变线有没有写代价、有没有夸读者的话。讲得对不对、
讲没讲清,脚本查不了(见 SKILL.md §5)。

用法:
  check_explain.py <文件.md|.html> [...]
  printf '%s' "<草稿>" | check_explain.py --stdin
  check_explain.py --strict <文件>     # WARN 也算失败
  check_explain.py --self-test

退出码:0 过 · 1 有 FAIL(--strict 时 WARN 也算)· 2 用法错
故意保留的反例:Markdown 行里写 explain-ok,HTML 元素加 data-explain-ok,该行 / 该元素跳过 E8、E9。
"""
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

# ---------- 七层的小标题关键词:标题里最早出现的那个关键词决定它属于哪层 ----------
LAYERS = {
    "oneline": ("一句话", r"一句话|本质|矛盾"),
    "map": ("全貌图", r"全貌|全局|总图|全景|地图|总览|整体框架"),
    "main": ("主路径", r"主路径|主流程|走一遍"),
    "branch": ("岔路", r"岔路|分叉|分支"),
    "evo": ("演变线", r"演变|演进|来龙去脉|怎么变成|为什么变成"),
    "detail": ("细节", r"细节|出处|附录|查证"),
    "oral": ("口述版", r"口述|面试时|面试怎么说|30 ?秒|讲给别人"),
}
REQUIRED = ["map", "main", "evo"]            # E1
RECOMMENDED = ["oneline", "branch", "detail", "oral"]  # E2

FILE_LINE = re.compile(
    r"(?:[\w./-]+\.(?:c|h|S|s|cc|cpp|py|rs|dts|dtsi|ld|lds|mk)|Kconfig|Makefile)[:：]\d+")
COMMIT = re.compile(r"\b[0-9a-f]{12,40}\b")
BOX = re.compile(r"[─│┌┐└┘├┤┬┴┼═║╔╗╚╝▶◀▼▲►◄]|──>|-->|\+--")
FLATTER = ["直觉非常敏锐", "你的敏锐", "神来之笔", "一针见血", "教科书级", "太精彩了",
           "太棒了", "思维非常敏捷", "超越了绝大多数", "醍醐灌顶", "恍然大悟", "堪称"]
HYPE = ["灭顶之灾", "死个痛快", "降维打击", "活腻了", "海枯石烂", "无懈可击",
        "彻底闭环", "逻辑闭环", "灾难正式降临"]
PREVIEW = re.compile(r"^(下面|接下来|本节|让我们|我们来看|我们先来|首先我们)")
MAX_MAIN_REFS = 3

# ---------- 把 md / html 统一成一串块:(kind, text, line, exempt) ----------
# kind: h<level> / fig / code / text


def blocks_from_md(src):
    out, lines, i = [], src.splitlines(), 0
    while i < len(lines):
        ln = lines[i]
        m = re.match(r"^(#{1,6})\s+(.*)", ln)
        if ln.lstrip().startswith("```"):
            j = i + 1
            while j < len(lines) and not lines[j].lstrip().startswith("```"):
                j += 1
            body = "\n".join(lines[i + 1:j])
            out.append(("fig" if BOX.search(body) else "code", body, i + 1, False))
            i = j + 1
            continue
        if m:
            out.append(("h%d" % len(m.group(1)), m.group(2).strip(), i + 1, False))
        elif re.search(r"!\[[^\]]*\]\([^)]+\)", ln):
            out.append(("fig", ln, i + 1, False))
        elif ln.strip():
            out.append(("text", ln.strip(), i + 1, "explain-ok" in ln))
        i += 1
    return out


class _HTML(HTMLParser):
    SKIP = {"script", "style", "title", "head"}
    FIG = {"svg", "img", "canvas", "figure"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out, self.stack, self.buf = [], [], []
        self.heading, self.pre, self.fig_depth, self.skip, self.exempt = None, None, 0, 0, 0

    def _flush(self):
        t = re.sub(r"\s+", " ", "".join(self.buf)).strip()
        if t:
            self.out.append(("text", t, self.getpos()[0], self.exempt > 0))
        self.buf = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in self.SKIP:
            self.skip += 1
            return
        if "data-explain-ok" in a:
            self.exempt += 1
            self.stack.append(("exempt", tag))
        if self.fig_depth:
            if tag == self.fig_tag:
                self.fig_depth += 1
            return
        if tag in self.FIG:
            self._flush()
            # figure 里套 svg / img 只算一张
            self.out.append(("fig", tag, self.getpos()[0], False))
            if tag in ("svg", "figure"):
                self.fig_depth = 1
                self.fig_tag = tag
            return
        if re.fullmatch(r"h[1-6]", tag):
            self._flush()
            self.heading = (tag, [])
        elif tag == "pre":
            self._flush()
            self.pre = []
        elif tag in ("p", "li", "div", "td", "th", "tr", "section", "br", "table", "blockquote"):
            self._flush()

    def handle_endtag(self, tag):
        if tag in self.SKIP:
            self.skip = max(0, self.skip - 1)
            return
        if self.stack and self.stack[-1] == ("exempt", tag):
            self._flush()          # 先把这个元素里的字按豁免记下,再退出豁免
            self.stack.pop()
            self.exempt -= 1
        if self.fig_depth:
            if tag == self.fig_tag:
                self.fig_depth -= 1
            return
        if self.heading and tag == self.heading[0]:
            text = re.sub(r"\s+", " ", "".join(self.heading[1])).strip()
            self.out.append(("h" + tag[1], text, self.getpos()[0], False))
            self.heading = None
        elif tag == "pre" and self.pre is not None:
            body = "".join(self.pre)
            self.out.append(("fig" if BOX.search(body) else "code", body, self.getpos()[0], False))
            self.pre = None
        elif tag in ("p", "li", "div", "td", "th", "tr", "section", "table", "blockquote"):
            self._flush()

    def handle_data(self, data):
        if self.skip or self.fig_depth:
            return
        if self.heading is not None:
            self.heading[1].append(data)
        elif self.pre is not None:
            self.pre.append(data)
        else:
            self.buf.append(data)


def blocks_from_html(src):
    p = _HTML()
    p.feed(src)
    p._flush()
    return p.out


def layer_of(heading):
    best = None
    for key, (_, pat) in LAYERS.items():
        m = re.search(pat, heading)
        if m and (best is None or m.start() < best[1]):
            best = (key, m.start())
    return best[0] if best else None


def assign_layers(blocks):
    """给每个块标上它所在的层。只有一个 h1 时,h1 当文档标题,不参与分层。"""
    h1s = [b for b in blocks if b[0] == "h1"]
    skip_h1 = len(h1s) <= 1
    cur, cur_level, tagged, first_h = None, 99, [], {}
    for idx, b in enumerate(blocks):
        kind = b[0]
        if kind.startswith("h") and not (skip_h1 and kind == "h1"):
            level = int(kind[1])
            lay = layer_of(b[1])
            if lay:
                cur, cur_level = lay, level
                first_h.setdefault(lay, idx)
            elif level <= cur_level:
                cur, cur_level = None, 99
        tagged.append((b, cur))
    return tagged, first_h


def check(src, is_html):
    blocks = blocks_from_html(src) if is_html else blocks_from_md(src)
    tagged, first_h = assign_layers(blocks)
    res = []  # (level, id, msg)

    miss = [LAYERS[k][0] for k in REQUIRED if k not in first_h]
    if miss:
        res.append(("FAIL", "E1", "缺这几层的小标题:" + "、".join(miss)))
    miss = [LAYERS[k][0] for k in RECOMMENDED if k not in first_h]
    if miss:
        res.append(("WARN", "E2", "缺这几层的小标题:" + "、".join(miss)))

    order = [k for k in ("map", "main", "evo", "detail") if k in first_h]
    pos = [first_h[k] for k in order]
    if pos != sorted(pos):
        names = "、".join(LAYERS[k][0] for k in sorted(order, key=lambda k: first_h[k]))
        res.append(("WARN", "E3", "层的顺序是 %s;应为 全貌图 → 主路径 → 演变线 → 细节" % names))

    first_fig = next((i for i, (b, _) in enumerate(tagged) if b[0] == "fig"), None)
    first_detail = next((i for i, (b, _) in enumerate(tagged)
                         if b[0] == "code" or (b[0] == "text" and FILE_LINE.search(b[1]))), None)
    if first_fig is None:
        res.append(("FAIL", "E4", "一张图都没有(ASCII 框图 / svg / img / figure)"))
    elif first_detail is not None and first_detail < first_fig:
        b = tagged[first_detail][0]
        what = "代码块" if b[0] == "code" else "file:line「%s」" % FILE_LINE.search(b[1]).group(0)
        res.append(("FAIL", "E4", "第 %d 行的%s出现在第一张图之前:先给全貌图,再给细节" % (b[2], what)))

    main_refs = []
    for b, lay in tagged:
        if lay == "detail":
            continue
        if b[0] == "text" or b[0].startswith("h"):
            main_refs += [(b[2], m.group(0)) for m in FILE_LINE.finditer(b[1])]
    if len(main_refs) > MAX_MAIN_REFS:
        sample = "、".join(r for _, r in main_refs[:4])
        res.append(("WARN", "E5", "细节一节之外有 %d 处 file:line(上限 %d),如 %s;挪到细节一节"
                    % (len(main_refs), MAX_MAIN_REFS, sample)))

    if "evo" in first_h:
        evo_text = "\n".join(b[1] for b, lay in tagged if lay == "evo" and b[0] != "fig")
        n_cost = evo_text.count("代价")
        if n_cost < 2:
            res.append(("WARN", "E6", "演变线里「代价」只出现 %d 次:每一环都要写代价" % n_cost))
        if "推断" not in evo_text and not COMMIT.search(evo_text):
            res.append(("WARN", "E7", "演变线里没有 [推断] 标注,也没有提交号:设计意图要么有一手出处,要么标推断"))

    hits = []
    for b, _ in tagged:
        if b[0] in ("text",) and not b[3] or b[0].startswith("h"):
            for w in FLATTER + HYPE:
                if w in b[1]:
                    hits.append("第 %d 行「%s」" % (b[2], w))
    if hits:
        res.append(("FAIL", "E8", "夸读者 / 夸张修辞:" + ";".join(hits[:6])))

    prev_lay, prev_heading = None, False
    for b, lay in tagged:
        if b[0].startswith("h"):
            prev_heading = layer_of(b[1]) is not None
            continue
        if prev_heading and b[0] == "text":
            if not b[3] and PREVIEW.match(b[1]):
                res.append(("WARN", "E9", "第 %d 行小标题下第一句是预告「%s…」:第一句直接给答案"
                            % (b[2], b[1][:12])))
        prev_heading = False
    return res


def run_one(name, src, strict):
    is_html = name.lower().endswith((".html", ".htm")) or src.lstrip()[:15].lower().startswith(("<!doctype", "<html"))
    res = check(src, is_html)
    bad = [r for r in res if r[0] == "FAIL" or (strict and r[0] == "WARN")]
    for lvl, rid, msg in res:
        print("%s %s %s: %s" % (lvl, rid, name, msg))
    if not res:
        print("OK   %s" % name)
    return 1 if bad else 0


# ---------- 自测:一份好样本,加一组「故意写坏、必须报」的变体 ----------
GOOD = """# 示例:内存

## ① 一句话:要解决的矛盾
程序要独占的连续内存,物理内存有限、零碎、共用。

## ② 全貌图
```
 ┌──────┐  页表  ┌──────┐
 │ 软件 │ ─────▶ │ 硬件 │
 └──────┘        └──────┘
```

## ③ 主路径
H1 CPU 发出虚拟地址。H2 查 TLB。

## ④ 岔路
| 步 | 条件 | 去哪 |
|---|---|---|
| H2 | 没命中 | 读页表 |

## ⑤ 演变线
平铺页表太大,于是多级页表,代价是要读 4 次内存。[推断]
于是加 TLB,代价是改了页表要刷。

## ⑥ 细节和出处
- 4 级页表 arch/arm64/Kconfig:387
- 缺页分流 arch/arm64/mm/fault.c:742
- 匿名页 mm/memory.c:4735
- 写表项 mm/memory.c:4835

## ⑦ 口述版
申请是软件记账,访问是硬件翻译。
"""

GOOD_HTML = """<!doctype html><html><head><title>t</title><style>.a{}</style></head><body>
<h1>示例</h1>
<h2>一句话</h2><p>矛盾在这。</p>
<h2>全貌图</h2><figure><svg><text>软件</text><text>硬件</text></svg></figure>
<h2>主路径</h2><p>H1 发地址。</p>
<h2>岔路</h2><table><tr><td>H2</td><td>没命中</td></tr></table>
<h2>演变线</h2><p>多级页表,代价是读 4 次。TLB,代价是要刷。[推断]</p>
<h2>细节和出处</h2><p>arch/arm64/Kconfig:387 mm/memory.c:4735 mm/memory.c:4835 fault.c:742</p>
<h2>口述版</h2><p>两半。</p>
<p data-explain-ok>反例:堪称神来之笔</p>
</body></html>"""


def _sub(s, old, new):
    assert old in s, old
    return s.replace(old, new)


SELF_CASES = [
    # (名字, 文本, 是否 html, 必须出现的规则, 不许出现的规则)
    ("好样本 md", GOOD, False, set(), {"E1", "E2", "E3", "E4", "E5", "E6", "E7", "E8", "E9"}),
    ("好样本 html(含 data-explain-ok 反例)", GOOD_HTML, True, set(),
     {"E1", "E2", "E3", "E4", "E5", "E6", "E7", "E8", "E9"}),
    ("没有全貌图小标题", _sub(GOOD, "## ② 全貌图", "## ② 结构"), False, {"E1"}, set()),
    ("全貌只在正文提一句,不算小标题", _sub(GOOD, "## ② 全貌图", "## ② 结构\n先看全貌图"), False, {"E1"}, set()),
    ("问答记录式:第 1 轮、第 2 轮",
     "# 答疑\n## 第 1 轮 buddy 和 slab\n见 mm/slub.c:1870\n## 第 2 轮 页表\n```\n┌─┐\n```\n", False,
     {"E1", "E4"}, set()),
    ("演变线放在主路径前面",
     _sub(_sub(GOOD, "## ③ 主路径", "## ③ 演变线 X"), "## ⑤ 演变线", "## ⑤ 主路径 Y"), False, {"E3"}, set()),
    ("file:line 出现在第一张图之前",
     _sub(GOOD, "程序要独占", "见 mm/memory.c:4735。程序要独占"), False, {"E4"}, set()),
    ("代码块出现在第一张图之前",
     _sub(GOOD, "## ② 全貌图", "```\nint x = 0;\n```\n## ② 全貌图"), False, {"E4"}, set()),
    ("一张图都没有",
     _sub(GOOD, " ┌──────┐  页表  ┌──────┐\n │ 软件 │ ─────▶ │ 硬件 │\n └──────┘        └──────┘", "软件 写 硬件"),
     False, {"E4"}, set()),
    ("主线里堆 file:line",
     _sub(GOOD, "H1 CPU 发出虚拟地址。", "H1 a.c:1 b.c:2 c.c:3 d.c:4 发出虚拟地址。"), False, {"E5"}, set()),
    ("演变线不写代价、不标推断",
     _sub(_sub(GOOD, "代价是要读 4 次内存。[推断]", "很好。"), "代价是改了页表要刷。", "更好。"),
     False, {"E6", "E7"}, set()),
    ("夸读者", _sub(GOOD, "申请是软件记账", "你的直觉非常敏锐!申请是软件记账"), False, {"E8"}, set()),
    ("夸张修辞", _sub(GOOD, "代价是改了页表要刷。", "代价是灭顶之灾。"), False, {"E8"}, set()),
    ("explain-ok 豁免的反例行", _sub(GOOD, "申请是软件记账", "申请是软件记账\n反例:堪称神来之笔 explain-ok"),
     False, set(), {"E8"}),
    ("小标题下第一句是预告", _sub(GOOD, "H1 CPU 发出虚拟地址", "下面我们来看主路径。H1 CPU"), False, {"E9"}, set()),
    ("html:代码在图之前",
     _sub(GOOD_HTML, "<h2>全貌图</h2>", "<pre>int x;</pre><h2>全貌图</h2>"), True, {"E4"}, set()),
    ("html:svg 里的字不算正文,不触发 E8",
     _sub(GOOD_HTML, "<text>软件</text>", "<text>堪称</text>"), True, set(), {"E8"}),
]


def self_test():
    ok = 0
    for name, src, is_html, must, mustnot in SELF_CASES:
        got = {rid for _, rid, _ in check(src, is_html)}
        good = must <= got and not (mustnot & got)
        ok += good
        print("%s  %-40s 报了 %s" % ("通过" if good else "失败", name, sorted(got) or "无"))
    total = len(SELF_CASES)
    print("自测 %d/%d 通过" % (ok, total))
    return 0 if ok == total else 1


def main(argv):
    strict = "--strict" in argv
    args = [a for a in argv if a != "--strict"]
    if args == ["--self-test"]:
        return self_test()
    if args == ["--stdin"]:
        return run_one("<stdin>", sys.stdin.read(), strict)
    if not args or any(a.startswith("--") for a in args):
        print(__doc__)
        return 2
    rc = 0
    for a in args:
        p = Path(a)
        if not p.is_file():
            print("找不到文件:%s" % a)
            return 2
        rc |= run_one(a, p.read_text(encoding="utf-8"), strict)
    return rc


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
