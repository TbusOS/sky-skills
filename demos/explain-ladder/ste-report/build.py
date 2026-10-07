#!/usr/bin/env python3
"""sky-skills 25 份 SKILL.md 的 STE 体检 —— explain-ladder 第 3 级「看懂就扔」的样例页。

生成:python3 build.py
检查:python3 ../../../skills/explain-ladder/scripts/check_page.py .

数据从固定提交 a49d13c 取:git archive 出 skills/ 的快照,用同一提交里的 check_ste.py 去查。
提交不变,输出就不变,所以这页以后也能逐字节重建。
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', '..', '..', 'skills', 'explain-ladder', 'scripts'))
from page_kit import Page  # noqa: E402

COMMIT = 'a49d13c'
p = Page('sky-skills 25 份 SKILL.md 的 STE 体检(%s)' % COMMIT, relative=True)

out = p.command(
    'rm -rf .snap && mkdir .snap && git -C ../../.. archive %s skills | tar -x -C .snap'
    ' && (cd .snap && python3 skills/explain-ladder/scripts/check_ste.py skills/*/SKILL.md; true);'
    ' rm -rf .snap' % COMMIT, cwd=HERE)
names = p.command("git -C ../../.. ls-tree -r --name-only %s skills | grep '/SKILL.md$'" % COMMIT, cwd=HERE)

# 命令中途失败时输出是空的,页面照样能生成 —— 这里先核对,不对就停
last = out.strip().splitlines()[-1] if out.strip() else ''
m = re.match(r'^共 (\d+) 处$', last)
if not m:
    sys.exit('检查输出最后一行不是「共 N 处」,命令可能没跑完:%r' % last)
total = int(m.group(1))

skills = [n.split('/')[1] for n in names.split()]
found = []
for line in out.splitlines():
    r = re.match(r'^skills/([^/]+)/SKILL\.md:(\d+)\s+(S\d)\s+(.*)$', line)
    if r:
        found.append([r.group(1), int(r.group(2)), r.group(3), r.group(4)])
if len(found) != total:
    sys.exit('解析出 %d 处,输出说 %d 处:解析规则没覆盖全部格式' % (len(found), total))

codes = sorted({f[2] for f in found})
per = {s: {c: 0 for c in codes} for s in skills}
for s, _, c, _ in found:
    per[s][c] += 1
rows = sorted(([s] + [per[s][c] for c in codes] + [sum(per[s].values())] for s in skills),
              key=lambda r: (-r[-1], r[0]))
clean = [r[0] for r in rows if r[-1] == 0]
passive = [r[0] for r in rows if 'S3' in codes and r[1 + codes.index('S3')] > 0]

NAME = {'S1': '长句', 'S2': '虚动词', 'S3': '英文被动', 'S4': '一步两事', 'S5': '图太宽'}
p.html('<p>这页回答一个问题:<b>sky-skills 自己的 %d 份 SKILL.md,按 STE 打八折的标准看,问题集中在哪?</b></p>'
       '<p>一共 %d 处:%s。%d 个 skill 一处都没有:%s。'
       '英文被动只出现在 %d 个 skill 里:%s。</p>'
       % (len(skills), total,
          '、'.join('%s %d 处' % (NAME.get(c, c), sum(per[s][c] for s in skills)) for c in codes),
          len(clean), '、'.join(clean), len(passive), '、'.join(passive)))

p.data['bars'] = [[r[0]] + r[1:-1] for r in rows]
p.data['codes'] = [NAME.get(c, c) for c in codes]
p.html('<h2>每个 skill 报了几处</h2><div class="bars-pan"><svg id="bars" role="img" aria-label="每个 skill 的发现数"></svg></div>')
# 手机上不缩图(缩了字只剩 5px),图框里左右拖
p.style('.bars-pan{overflow-x:auto} #bars{width:100%;min-width:640px;max-width:760px;display:block}'
        ' #bars text{font:12px var(--mono,monospace);fill:currentColor}')
p.script(r'''
var rows = PAGE_DATA.data.bars, names = PAGE_DATA.data.codes;
var colors = ['#d97757', '#6a9bcc', '#788c5d', '#c9913f', '#b0aea5'];
var W = 760, L = 190, H = 18, G = 6, max = 1;
rows.forEach(function (r) { var t = 0; for (var i = 1; i < r.length; i++) t += r[i]; if (t > max) max = t; });
var svg = document.getElementById('bars'), ns = 'http://www.w3.org/2000/svg';
svg.setAttribute('viewBox', '0 0 ' + W + ' ' + (rows.length * (H + G) + 30));
function add(tag, attrs, text) { var e = document.createElementNS(ns, tag);
  for (var k in attrs) e.setAttribute(k, attrs[k]); if (text != null) e.textContent = text; svg.appendChild(e); return e; }
rows.forEach(function (r, i) {
  var y = i * (H + G), x = L, t = 0;
  add('text', {x: L - 8, y: y + 13, 'text-anchor': 'end'}, r[0]);
  for (var j = 1; j < r.length; j++) {
    var w = r[j] / max * (W - L - 40);
    if (w > 0) add('rect', {x: x, y: y, width: w, height: H, rx: 3, fill: colors[j - 1]});
    x += w; t += r[j];
  }
  add('text', {x: x + 6, y: y + 13}, t);
});
names.forEach(function (n, j) {
  var y = rows.length * (H + G) + 14;
  add('rect', {x: L + j * 110, y: y - 10, width: 12, height: 12, rx: 2, fill: colors[j]});
  add('text', {x: L + j * 110 + 18, y: y}, n);
});
''')

p.table('每个 skill 的发现数', ['skill'] + ['%s %s' % (c, NAME.get(c, '')) for c in codes] + ['合计'],
        rows, src=out.idx)
p.table('全部 %d 处(过滤框支持 /正则/,如 /^S3/)' % total, ['skill', '行号', '编号', '说明'],
        found, src=out.idx)
p.log_view('check_ste.py 原始输出', out, src=out.idx)
p.write()
