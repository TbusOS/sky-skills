#!/usr/bin/env python3
"""<主题> —— 看懂就扔的页面。

生成:python3 build.py
检查:python3 __KIT_DIR__/check_page.py .

规矩只有两条:
  1. 数据只从 p.source(文件) / p.command(命令) 读进来再算,不手抄数字进页面
  2. 不引用外部文件(CDN、图片、另一个 json 都不行),全部在这一个 index.html 里
"""
import os
import re
import sys

sys.path.insert(0, '__KIT_DIR__')   # page_kit.py new 填的;手动拷这个文件时改成 explain-ladder/scripts 的路径
from page_kit import Page  # noqa: E402

SRC = '/path/to/uart.log'    # ← 换成真实文件

p = Page('<主题>')
log = p.source(SRC)

# 下面是例子:抓带内核时间戳的行。按这页要回答的问题改。
rows = []
for n, line in enumerate(log.splitlines(), 1):
    m = re.match(r'\[\s*(\d+\.\d+)\]\s*(.*)', line)
    if m:
        rows.append([n, float(m.group(1)), m.group(2)[:200]])

p.html('<p>这页回答一个问题:……(写一句)</p>')
p.table('带时间戳的行', ['行号', '时间 s', '内容'], rows, src=log.idx)
p.log_view('原始 log', log, src=log.idx)

# 要画图就自己写 SVG / JS:数据放进 p.data,脚本里用 PAGE_DATA.data 读
# p.data['points'] = [[r[1], r[0]] for r in rows]
# p.html('<svg id="chart" width="900" height="240"></svg>')
# p.script("var pts = PAGE_DATA.data.points; /* 画到 #chart */")

p.write()
