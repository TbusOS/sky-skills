#!/usr/bin/env python3
"""page_kit —— 「看懂就扔」网页的生成库 + 小工具。

build.py 里这样用(templates/build_template.py 是完整骨架):

    import os, sys
    sys.path.insert(0, '<explain-ladder/scripts 的路径>')   # page_kit.py new 生成时已填好
    from page_kit import Page

    p = Page('启动 log 时间线')
    log = p.source('/path/uart.log')          # 读文件,自动记出处(路径 + sha256 + 行数)
    rows = [...]                              # 从 log 里算出来,不手抄
    p.table('阶段耗时', ['阶段', '行号', '耗时 ms'], rows, src=log.idx)
    p.log_view('原始 log', log, src=log.idx)
    p.write()                                 # 写到 build.py 同目录的 index.html

为什么数据必须经过 p.source() / p.command():
    页面越好看,里面的数越像真的。手抄进 HTML 的数抄错了,页面上看不出来。
    经过这两个入口的数据都记了出处,check_page.py 还会重跑 build.py,
    逐字节比对 —— 手改过 index.html 的页面过不了。

命令行:
    page_kit.py new <主题>     在 $THROWAWAY_ROOT(默认 ~/throwaway-pages)下建 YYYYMMDD-<主题>/build.py
    page_kit.py where <文件>   打印 Linux 路径和 Windows 共享路径
    page_kit.py list           列出已有页面和放了几天(只列,不删)

环境变量:
    THROWAWAY_ROOT       页面根目录,默认 ~/throwaway-pages
    THROWAWAY_SMB_ROOT   家目录在 Windows 上的共享路径,如 \\\\192.0.2.10\\alice;
                         不设就按「本机第一个 IP + 用户名」推,并注明是推的
    PAGE_OUT             check_page.py 重建时用:把页面写到这里,且不打印路径
"""
import datetime
import hashlib
import html
import json
import os
import re
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))


class SourceText(str):
    """读进来的源文本。用法和 str 一样,多一个 .idx(在出处列表里的编号)。"""
    idx = None


class Page:
    def __init__(self, title):
        self.title = title
        self.sources = []
        self.items = []      # 按调用顺序:{'type': 'html'} 或控件
        self.data = {}       # 自定义脚本用的数据,页面里是 PAGE_DATA.data
        self.scripts = []
        self.styles = []

    # ── 数据入口:只有这两个,出处自动记 ────────────────────────────
    def source(self, path, encoding='utf-8'):
        path = os.path.abspath(os.path.expanduser(path))
        with open(path, 'rb') as f:
            raw = f.read()
        text = raw.decode(encoding, errors='replace')
        s = SourceText(text)
        s.idx = self._add_source({
            'path': path,
            'sha256': hashlib.sha256(raw).hexdigest(),
            'bytes': len(raw),
            'lines': len(text.splitlines()),
        })
        return s

    def command(self, cmd, cwd=None):
        cwd = os.path.abspath(os.path.expanduser(cwd or os.getcwd()))
        raw = subprocess.run(cmd, shell=True, cwd=cwd, stdout=subprocess.PIPE,
                             check=True).stdout
        s = SourceText(raw.decode('utf-8', errors='replace'))
        s.idx = self._add_source({
            'cmd': cmd,
            'cwd': cwd,
            'sha256': hashlib.sha256(raw).hexdigest(),
            'bytes': len(raw),
        })
        return s

    def _add_source(self, entry):
        self.sources.append(entry)
        return len(self.sources) - 1

    # ── 页面内容 ───────────────────────────────────────────────────
    def html(self, fragment):
        """自由写的 HTML 片段(说明文字、手写 SVG 等)。"""
        self.items.append({'type': 'html', 'html': fragment})

    def table(self, title, columns, rows, src=None, note=''):
        """可过滤、可点表头排序的表格。rows 是二维列表。"""
        self.items.append({'type': 'table', 'title': title, 'columns': list(columns),
                           'rows': [list(r) for r in rows], 'src': src, 'note': note})

    def log_view(self, title, text, src=None, note=''):
        """带原始行号的 log 视图,可按子串或 /正则/ 过滤。"""
        self.items.append({'type': 'log', 'title': title, 'lines': text.splitlines(),
                           'src': src, 'note': note})

    def script(self, js):
        """自定义脚本,在控件渲染完之后执行,可读 PAGE_DATA。"""
        self.scripts.append(js)

    def style(self, css):
        self.styles.append(css)

    # ── 输出 ─────────────────────────────────────────────────────
    def render(self):
        widgets, body = [], []
        for it in self.items:
            if it['type'] == 'html':
                body.append(it['html'])
            else:
                wid = 'w%d' % len(widgets)
                w = dict(it, id=wid)
                widgets.append(w)
                body.append('<section class="widget" id="%s"></section>' % wid)
        payload = {'title': self.title, 'sources': self.sources,
                   'widgets': widgets, 'data': self.data}
        # 整段 JSON 里的 < 全转成 <:log 里出现 </script> 也截不断这个块
        blob = json.dumps(payload, ensure_ascii=False, sort_keys=True,
                          separators=(',', ':')).replace('<', '\\u003c')
        with open(os.path.join(HERE, 'page_base.css'), encoding='utf-8') as f:
            css = f.read()
        with open(os.path.join(HERE, 'page_base.js'), encoding='utf-8') as f:
            js = f.read()
        extra_js = '\n'.join('(function(){\n%s\n})();' % s for s in self.scripts)
        return ''.join([
            '<!doctype html>\n<html lang="zh-CN">\n<head>\n<meta charset="utf-8">\n',
            '<meta name="viewport" content="width=device-width, initial-scale=1">\n',
            '<meta name="generator" content="throwaway-page/page_kit">\n',
            '<title>%s</title>\n' % html.escape(self.title),
            '<style>\n%s\n%s\n</style>\n</head>\n<body>\n' % (css, '\n'.join(self.styles)),
            '<header><h1>%s</h1><span class="tag">看懂就扔 · 数据见页尾出处</span></header>\n'
            % html.escape(self.title),
            '<main>\n%s\n</main>\n' % '\n'.join(body),
            '<footer id="sources"><h2>出处</h2><ol></ol></footer>\n',
            '<script type="application/json" id="page-data">%s</script>\n' % blob,
            '<script>\n%s\n</script>\n' % js,
            '<script>\n%s\n</script>\n' % extra_js if extra_js else '',
            '</body>\n</html>\n',
        ])

    def write(self, path=None):
        forced = os.environ.get('PAGE_OUT')
        out = forced or path or os.path.join(
            os.path.dirname(os.path.abspath(sys.argv[0])), 'index.html')
        with open(out, 'w', encoding='utf-8') as f:
            f.write(self.render())
        if not forced:
            print_where(out)
        return out


# ── 路径与小工具 ──────────────────────────────────────────────────
def throwaway_root():
    return os.path.abspath(os.path.expanduser(
        os.environ.get('THROWAWAY_ROOT', '~/throwaway-pages')))


def smb_root():
    """返回 (Windows 上家目录的共享路径, 是否是推出来的)。推不出返回 (None, True)。"""
    env = os.environ.get('THROWAWAY_SMB_ROOT')
    if env:
        return env.rstrip('\\'), False
    try:
        ip = subprocess.run(['hostname', '-I'], stdout=subprocess.PIPE,
                            stderr=subprocess.DEVNULL).stdout.decode().split()[0]
    except Exception:
        return None, True
    import getpass
    return '\\\\%s\\%s' % (ip, getpass.getuser()), True


def print_where(path):
    path = os.path.abspath(path)
    print('Linux:   %s' % path)
    home = os.path.expanduser('~')
    root, guessed = smb_root()
    if root and (path + '/').startswith(home + '/'):
        rel = os.path.relpath(path, home).replace('/', '\\')
        print('Windows: %s\\%s   (粘到 Chrome 地址栏)' % (root, rel))
        if guessed:
            print('         ↑ 按「本机 IP + 用户名」推的;打不开就设 THROWAWAY_SMB_ROOT')
    else:
        print('Windows: (文件不在家目录下,或推不出共享路径)')


def cmd_new(topic):
    if not re.match(r'^[\w一-鿿.-]+$', topic):
        sys.exit('主题只用字母、数字、汉字、点、横线、下划线:%r' % topic)
    d = os.path.join(throwaway_root(),
                     '%s-%s' % (datetime.date.today().strftime('%Y%m%d'), topic))
    if os.path.exists(d):
        sys.exit('已存在:%s' % d)
    os.makedirs(d)
    tpl = os.path.join(os.path.dirname(HERE), 'templates', 'build_template.py')
    with open(tpl, encoding='utf-8') as f:
        s = f.read().replace('<主题>', topic).replace('__KIT_DIR__', HERE)
    with open(os.path.join(d, 'build.py'), 'w', encoding='utf-8') as f:
        f.write(s)
    print('建好:%s/build.py' % d)
    print('改完跑:python3 %s/build.py' % d)


def cmd_list():
    root = throwaway_root()
    if not os.path.isdir(root):
        print('还没有页面:%s 不存在' % root)
        return
    today = datetime.date.today()
    names = sorted(os.listdir(root))
    for n in names:
        d = os.path.join(root, n)
        if not os.path.isdir(d):
            continue
        m = re.match(r'^(\d{8})-', n)
        age = '?'
        if m:
            try:
                age = (today - datetime.datetime.strptime(m.group(1), '%Y%m%d').date()).days
            except ValueError:
                pass
        has = '有页面' if os.path.exists(os.path.join(d, 'index.html')) else '没生成'
        print('%4s 天  %s  %s' % (age, has, n))
    print('共 %d 个,在 %s。不再需要的自己删,本工具不删。' % (len(names), root))


def main(argv):
    if len(argv) >= 3 and argv[1] == 'new':
        cmd_new(argv[2])
    elif len(argv) >= 3 and argv[1] == 'where':
        print_where(argv[2])
    elif len(argv) >= 2 and argv[1] == 'list':
        cmd_list()
    else:
        print(__doc__)
        return 2
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
