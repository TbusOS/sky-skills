#!/usr/bin/env python3
"""check_page —— 「看懂就扔」页面的四项检查。

    check_page.py <index.html 或页面目录> [--no-render]
    check_page.py --self-test

P1 单文件      不引用外部文件:<script src> / <link href> / <img src>(data: 除外)/ CSS url() /
               @import / iframe / fetch / XMLHttpRequest / import()。
               出处数据块不扫 —— 那里是 log 原文,出现什么字符串都正常。
P2 出处        页面带出处列表、至少一条;文件类出处还在,sha256 和生成时一样
P3 能重建      同目录的 build.py 重跑一次,输出和 index.html 逐字节相同。
               手改过 index.html 里的数、或源文件后来变了,都过不了
P4 打开不报错  无头 Chromium 打开:没有 JS 报错、没有发出网络请求、控件全部画出来。
               找不到 playwright 时明说「跳过」,不算通过

退出码:0 = 没有失败(可能有跳过)· 1 = 有失败 · 2 = 用法错

环境变量:PLAYWRIGHT_NODE_PATH = 含 playwright 的 node_modules 目录(找不到时设它)
"""
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_RE = re.compile(r'<script type="application/json" id="page-data">(.*?)</script>', re.S)

EXTERNAL = [
    (r'<script\b[^>]*\bsrc\s*=', '<script src=…>'),
    (r'<link\b[^>]*\bhref\s*=', '<link href=…>'),
    (r'<(?:img|iframe|embed|object|video|audio|source|track)\b[^>]*\b(?:src|data)\s*=\s*["\']?(?!data:)',
     '<img/iframe/… src=…>(data: 除外)'),
    (r'<image\b[^>]*\bhref\s*=\s*["\']?(?!data:)', 'SVG <image href=…>'),
    (r'url\(\s*["\']?(?!data:|#)', 'CSS url(…)'),
    (r'@import\b', 'CSS @import'),
    (r'\bfetch\s*\(', 'fetch(…)'),
    (r'XMLHttpRequest', 'XMLHttpRequest'),
    (r'\bimport\s*\(', 'import(…)'),
    (r'new\s+(?:Worker|WebSocket|EventSource)\b', 'Worker / WebSocket / EventSource'),
]


def check_single_file(text):
    body = DATA_RE.sub('', text)
    hits = []
    for pat, name in EXTERNAL:
        m = re.search(pat, body, re.I)
        if m:
            line = body.count('\n', 0, m.start()) + 1
            hits.append('%s(去掉出处数据块后第 %d 行附近)' % (name, line))
    if hits:
        return 'FAIL', '引用了外部文件:' + ';'.join(hits)
    return 'PASS', '没有引用外部文件'


def load_data(text):
    m = DATA_RE.search(text)
    if not m:
        return None
    try:
        return json.loads(m.group(1))
    except ValueError:
        return None


def check_sources(text):
    d = load_data(text)
    if d is None:
        return 'FAIL', '没有出处数据块 —— 不是 page_kit 生成的页面,数据从哪来说不清'
    if 'id="sources"' not in text:
        return 'FAIL', '页面上没有出处列表(id="sources")'
    srcs = d.get('sources') or []
    if not srcs:
        return 'FAIL', '出处是空的:数据没经过 p.source() / p.command(),等于手抄'
    bad = []
    for i, s in enumerate(srcs, 1):
        if 'path' in s:
            if not os.path.exists(s['path']):
                bad.append('[%d] %s 不在了' % (i, s['path']))
                continue
            with open(s['path'], 'rb') as f:
                h = hashlib.sha256(f.read()).hexdigest()
            if h != s.get('sha256'):
                bad.append('[%d] %s 在页面生成后变了 → 重跑 build.py' % (i, s['path']))
    if bad:
        return 'FAIL', ';'.join(bad)
    return 'PASS', '%d 条出处,文件都在、内容没变' % len(srcs)


def check_rebuild(html_path, text):
    d = os.path.dirname(os.path.abspath(html_path))
    build = os.path.join(d, 'build.py')
    if not os.path.exists(build):
        return 'FAIL', '同目录没有 build.py:页面里的数据没法证明是从文件算出来的'
    fd, tmp = tempfile.mkstemp(suffix='.html')
    os.close(fd)
    try:
        env = dict(os.environ, PAGE_OUT=tmp)
        r = subprocess.run([sys.executable, build], cwd=d, env=env, timeout=600,
                           stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if r.returncode != 0:
            return 'FAIL', 'build.py 重跑失败:%s' % r.stderr.decode(errors='replace').strip()[-300:]
        with open(tmp, encoding='utf-8') as f:
            new = f.read()
    finally:
        os.unlink(tmp)
    if new == text:
        return 'PASS', '重跑 build.py 得到逐字节相同的页面'
    a, b = text.splitlines(), new.splitlines()
    for i, (x, y) in enumerate(zip(a, b), 1):
        if x != y:
            j = next((k for k in range(min(len(x), len(y))) if x[k] != y[k]), min(len(x), len(y)))
            return 'FAIL', ('重跑结果和现在的页面不同(第 %d 行第 %d 列起:现在 %r,重跑 %r)。'
                            '手改过 index.html,或源文件 / 命令输出变了'
                            % (i, j + 1, x[j:j + 40], y[j:j + 40]))
    return 'FAIL', '重跑结果和现在的页面行数不同(%d vs %d)' % (len(a), len(b))


def find_playwright():
    env = os.environ.get('PLAYWRIGHT_NODE_PATH')
    cands = [env] if env else []
    cands.append(None)    # node 默认解析路径
    # 本 skill 放在 sky-skills 仓里时,仓库根目录的 node_modules 里有一份
    repo = os.path.realpath(__file__)
    for _ in range(4):                       # scripts → explain-ladder → skills → 仓库根
        repo = os.path.dirname(repo)
    cands.append(os.path.join(repo, 'node_modules'))
    if not shutil.which('node'):
        return False, None
    for c in cands:
        e = dict(os.environ)
        if c:
            e['NODE_PATH'] = c
        r = subprocess.run(['node', '-e', "require.resolve('playwright')"], env=e,
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if r.returncode == 0:
            return True, c
    return False, None


def check_render(html_path):
    ok, np = find_playwright()
    if not ok:
        return 'SKIP', '找不到 node 或 playwright(设 PLAYWRIGHT_NODE_PATH),没有打开验证'
    e = dict(os.environ)
    if np:
        e['NODE_PATH'] = np
    r = subprocess.run(['node', os.path.join(HERE, 'render_check.cjs'), html_path], env=e,
                       stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=180)
    try:
        res = json.loads(r.stdout.decode().strip().splitlines()[-1])
    except (ValueError, IndexError):
        return 'FAIL', '打开检查没跑起来:%s' % r.stderr.decode(errors='replace')[-300:]
    if 'fatal' in res:
        return 'FAIL', '打开检查出错:%s' % res['fatal'][:300]
    bad = []
    if res['errors']:
        bad.append('JS 报错 %d 条:%s' % (len(res['errors']), res['errors'][0][:200]))
    if res['requests']:
        bad.append('发出了网络请求:%s' % ', '.join(res['requests'][:3]))
    if res['widgets'] != res['expected']:
        bad.append('控件画出 %d / %d 个' % (res['widgets'], res['expected']))
    if res['sources'] != res['expectedSources']:
        bad.append('出处列表画出 %d / %d 条' % (res['sources'], res['expectedSources']))
    if bad:
        return 'FAIL', ';'.join(bad)
    return 'PASS', '打开无报错、无网络请求,%d 个控件、%d 条出处都画出来了' % (
        res['widgets'], res['sources'])


def run_checks(target, render=True):
    p = os.path.join(target, 'index.html') if os.path.isdir(target) else target
    if not os.path.isfile(p):
        print('找不到页面:%s' % p)
        return 2
    with open(p, encoding='utf-8') as f:
        text = f.read()
    res = [('P1 单文件', check_single_file(text)),
           ('P2 出处', check_sources(text)),
           ('P3 能重建', check_rebuild(p, text)),
           ('P4 打开不报错', check_render(os.path.abspath(p)) if render
            else ('SKIP', '按 --no-render 跳过'))]
    mark = {'PASS': '✅', 'FAIL': '❌', 'SKIP': '⃠ '}
    for name, (st, msg) in res:
        print('  %s %s:%s' % (mark[st], name, msg))
    n = {k: sum(1 for _, (s, _) in res if s == k) for k in mark}
    print('%s:%d 通过 / %d 失败 / %d 跳过' % (os.path.basename(os.path.dirname(os.path.abspath(p))),
                                              n['PASS'], n['FAIL'], n['SKIP']))
    return 1 if n['FAIL'] else 0


# ── 自测 ─────────────────────────────────────────────────────────
BUILD = '''import sys
sys.path.insert(0, %(here)r)
from page_kit import Page
p = Page('自测页')
log = p.source(%(src)r)
rows = [[n, len(l)] for n, l in enumerate(log.splitlines(), 1)]
p.table('每行长度', ['行号', '长度'], rows, src=log.idx)
p.log_view('原文', log, src=log.idx)
p.data['n'] = len(rows)
p.html('<svg id="c" width="200" height="20"></svg>')
p.script("document.getElementById('c').setAttribute('data-n', PAGE_DATA.data.n);")
%(extra)s
p.write()
'''

LOG = ('[    0.000000] Booting Linux\n'
       '[    1.234567] probe ok\n'
       '</script><script>alert(1)</script>\n'
       '<script src="https://evil.example/x.js"></script> fetch("http://x") url(http://y)\n'
       '[    2.500000] done\n')


def self_test():
    ok_render, _ = find_playwright()
    tmp = tempfile.mkdtemp(prefix='explain-ladder-selftest-')
    passed = failed = 0

    def make(name, extra='', log=LOG):
        d = os.path.join(tmp, name)
        os.makedirs(d)
        src = os.path.join(d, 'uart.log')
        with open(src, 'w', encoding='utf-8') as f:
            f.write(log)
        with open(os.path.join(d, 'build.py'), 'w', encoding='utf-8') as f:
            f.write(BUILD % {'here': HERE, 'src': src, 'extra': extra})
        r = subprocess.run([sys.executable, 'build.py'], cwd=d, stdout=subprocess.PIPE,
                           stderr=subprocess.PIPE)
        assert r.returncode == 0, r.stderr.decode()
        return d

    def expect(desc, d, want_rc, want_fail=None, render=True):
        nonlocal passed, failed
        import io
        import contextlib
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            rc = run_checks(d, render=render)
        out = buf.getvalue()
        good = rc == want_rc and (want_fail is None or ('❌ ' + want_fail) in out)
        if good:
            passed += 1
            print('  通过  %s' % desc)
        else:
            failed += 1
            print('  失败  %s(期望 rc=%d%s,实际 rc=%d)\n%s' % (
                desc, want_rc, ',%s 失败' % want_fail if want_fail else '', rc, out))

    try:
        d = make('good')
        expect('正常页面:四项都过(含 </script> 和 alert 的 log 不截断、不执行)', d, 0)
        with open(os.path.join(d, 'index.html'), encoding='utf-8') as f:
            first = f.read()
        subprocess.run([sys.executable, 'build.py'], cwd=d, stdout=subprocess.DEVNULL)
        with open(os.path.join(d, 'index.html'), encoding='utf-8') as f:
            second = f.read()
        if first == second:
            passed += 1
            print('  通过  同一份输入生成两次,逐字节相同')
        else:
            failed += 1
            print('  失败  同一份输入生成两次结果不同 —— P3 会永远失败')

        d = make('hand-edited')
        f = os.path.join(d, 'index.html')
        with open(f, encoding='utf-8') as fh:
            s = fh.read()
        assert 'Booting Linux' in s
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(s.replace('Booting Linux', 'Booting LINUX', 1))
        expect('★ 手改 index.html 里的内容 → P3 失败', d, 1, 'P3 能重建', render=False)

        d = make('src-changed')
        with open(os.path.join(d, 'uart.log'), 'a', encoding='utf-8') as fh:
            fh.write('[    3.000000] new line\n')
        expect('★ 生成后源文件变了 → P2 失败', d, 1, 'P2 出处', render=False)

        d = make('no-build')
        os.unlink(os.path.join(d, 'build.py'))
        expect('★ 没有 build.py → P3 失败', d, 1, 'P3 能重建', render=False)

        d = make('cdn', extra="p.html('<script src=\"https://cdn.example/lib.js\"></script>')")
        expect('★ 引了 CDN 脚本 → P1 失败', d, 1, 'P1 单文件', render=False)

        d = make('fetch', extra="p.script(\"fetch('data.json')\")")
        expect('★ 脚本里 fetch 旁边的文件 → P1 失败', d, 1, 'P1 单文件', render=False)

        d = os.path.join(tmp, 'handwritten')
        os.makedirs(d)
        with open(os.path.join(d, 'index.html'), 'w', encoding='utf-8') as fh:
            fh.write('<!doctype html><title>x</title><p>启动耗时 1.23 s</p>')
        expect('★ 手写页面没有出处 → P2 失败', d, 1, 'P2 出处', render=False)

        if ok_render:
            d = make('js-error', extra="p.script('notDefinedFn();')")
            expect('★ 自定义脚本报错 → P4 失败(反向验证 P4 不是摆设)', d, 1, 'P4 打开不报错')
            d = make('cdn-render', extra="p.html('<img src=\"https://cdn.example/a.png\">')")
            expect('★ 引了外网图片 → P4 也抓到网络请求', d, 1, 'P4 打开不报错')
        else:
            print('  ⃠   找不到 playwright,P4 的两条反向用例没跑')
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    print('\n自测:%d 通过 / %d 失败' % (passed, failed))
    return 0 if failed == 0 else 1


def main(argv):
    if '--self-test' in argv:
        return self_test()
    args = [a for a in argv[1:] if not a.startswith('--')]
    if len(args) != 1:
        print(__doc__)
        return 2
    return run_checks(args[0], render='--no-render' not in argv)


if __name__ == '__main__':
    sys.exit(main(sys.argv))
