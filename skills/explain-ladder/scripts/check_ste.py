#!/usr/bin/env python3
"""check_ste —— 按 ASD-STE100「打八折」写的文字,能让机器查的那几条。

    check_ste.py <文件或目录>... [--howto] [--zh-max N] [--en-max N] [--cols N]
    printf '%s' "<草稿>" | check_ste.py --stdin [--howto]
    check_ste.py --self-test

查五样(都只是报出来让人改,不改文件):
  S1 句长      中文一句超过 --zh-max 个字(默认 50,加 --howto 时 30);
               英文一句超过 --en-max 个词(默认 25,加 --howto 时 20 —— STE 原文的两个数)。
               中文句里一串英文 / 数字 / 路径按一个字算,不然一个文件路径就能把句子撑爆。
               标题和表格行不算句子,不查。
  S2 虚动词    中文「进行 / 作出 / 予以 … + 动词」,如「进行验签」→「验签」
  S3 被动      英文 be 动词 + 过去分词。STE 要写出「谁做」;描述性的句子偶尔用被动可以,自己判断
  S4 一步两事  加 --howto 时:编号步骤里用分号连了两件事。末尾的分号不算(中文列举习惯)
  S5 图太宽    带框线字符(─ │ ┌ 等)或 +--+ 的行、代码块里带箭头的行,显示宽度超过 --cols 列(默认 80)。
               汉字和全角符号按两列算 —— 按字符数数会少一半,终端里照样折行

跳过:``` 代码块(S5 除外)、行内代码、网址、Markdown 链接、「」里的示例、带 ste-ok / bw-ok 的行;
HTML 里带 data-ste-ok 属性的元素(故意放的反例用它标)。

STE 的另外几条(一句只说一件事、同一个东西只用一个名字、条件写在动作前面)要靠人判断,
机器查不准,本脚本不查。

退出码:0 = 没有发现 · 1 = 有发现 · 2 = 用法错 / 文件不存在
"""
import argparse
import html.parser
import os
import re
import sys
import tempfile
import unicodedata

EXTS = ('.md', '.markdown', '.txt', '.html', '.htm')

# S2 的正则结构参考 lemonhall/asd-ste100-skill-zh(MIT)的 NOMINALIZATION_RE,动词表按技术文档补了领域词
WEAK_VERB = re.compile(
    r"(进行|作出|做出|加以|予以|给予|开展)(一[下个次些])?[^,，。;；、:：\s|「」]{0,6}?"
    r"(分析|检查|处理|优化|验证|评估|讨论|说明|调整|改造|升级|计算|统计|测试|梳理|比对|排查|确认|审核|"
    r"维护|修复|部署|设计|规划|调研|尝试|编译|烧录|烧写|调试|修改|配置|适配|移植|签名|验签|校验|"
    r"评审|回归|重启|备份|还原|合并|提交|同步|下载|更新|替换|初始化|格式化|加密|解密|打包|归档|"
    r"对比|区分|判断|定位|追踪|记录|解释|拆分|清理|分类)")

IRREGULAR = ('built|done|made|set|put|sent|taken|given|written|known|shown|seen|found|held|kept|'
             'left|read|run|split|cut|hidden|chosen|driven|thrown|broken|brought|bought|caught|'
             'taught|told|got|gotten|lost|paid|sold|spent|begun|drawn|frozen|stolen|torn|worn|'
             'bound|fed|led|met|dealt|meant|shut|spread|stuck|struck|hung|laid|lit|overwritten|'
             'rewritten|rebuilt|reset|unset')
NOT_PARTICIPLE = {'red', 'need', 'speed', 'feed', 'seed', 'shed', 'bed', 'hundred', 'naked', 'wicked'}
PASSIVE = re.compile(r"\b(am|is|are|was|were|be|been|being)\s+"
                     r"(?:(?:not|also|then|always|never|only|already|now)\s+)?"
                     r"([a-z]+ed|%s)\b" % IRREGULAR, re.I)

STEP_ITEM = re.compile(r"^\s*\d{1,3}[.)、]\s+")
MASK = re.compile(r"`[^`\n]*`|https?://\S+|\[[^\]]*\]\([^)]*\)|「[^」\n]*」")
CJK = re.compile(r"[㐀-鿿豈-﫿]")
# 分号不断句:STE 里用分号把两件事连成一句本身就是毛病,连起来的整句一起算长度
ZH_SPLIT = re.compile(r"(?<=[。!?\uff01\uff1f])")
EN_SPLIT = re.compile(r"(?<=[.!?;])\s+(?=[A-Z\"'(`])")
ASCII_RUN = re.compile(r"[A-Za-z0-9_][\w./:+#-]*")
# 框线字符(U+2500–257F)算图;箭头在正文里也常用,只在代码块里才算图
BOX = re.compile(r"[\u2500-\u257f]|\+-{2,}")
ARROW = re.compile(r"[→←↑↓▶◀►◄]|-{2,}>")
SKIP_LINE = re.compile(r"ste-ok|bw-ok")


def display_width(s):
    w = 0
    for ch in s:
        if unicodedata.combining(ch):
            continue
        w += 2 if unicodedata.east_asian_width(ch) in ('W', 'F') else 1
    return w


def sentence_units(s):
    """返回 (语言, 长度)。有汉字按中文算:汉字一个算一,一串英文 / 数字 / 路径算一。"""
    if CJK.search(s):
        rest = ASCII_RUN.sub('', s)
        return 'zh', len(CJK.findall(rest)) + len(ASCII_RUN.findall(s))
    return 'en', len(re.findall(r"[A-Za-z0-9][\w'’-]*", s))


class _Text(html.parser.HTMLParser):
    BLOCK = {'p', 'li', 'td', 'th', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'dd', 'dt',
             'figcaption', 'blockquote', 'div', 'section', 'br', 'tr'}
    SKIP = {'script', 'style', 'pre', 'code', 'svg', 'textarea'}

    def __init__(self):
        super().__init__()
        self.out, self.skip = [''], 0
        self.ok_tag, self.ok_n = None, 0     # data-ste-ok 元素:整个元素不查

    def handle_starttag(self, tag, attrs):
        if self.ok_tag:
            self.ok_n += tag == self.ok_tag
        elif any(k == 'data-ste-ok' for k, _ in attrs):
            self.ok_tag, self.ok_n = tag, 1
        if tag in self.SKIP:
            self.skip += 1
        if tag in self.BLOCK:
            self.out.append('')

    def handle_endtag(self, tag):
        if self.ok_tag and tag == self.ok_tag:
            self.ok_n -= 1
            if self.ok_n == 0:
                self.ok_tag = None
        if tag in self.SKIP and self.skip:
            self.skip -= 1
        if tag in self.BLOCK:
            self.out.append('')

    def handle_data(self, data):
        if not self.skip and not self.ok_tag:
            self.out[-1] += re.sub(r'\s+', ' ', data)


def read_lines(path):
    text = open(path, encoding='utf-8', errors='replace').read()
    if path.endswith(('.html', '.htm')):
        t = _Text()
        t.feed(text)
        return [l.strip() for l in t.out]
    return text.splitlines()


def check_lines(lines, shown, a):
    """返回 [(文件, 行号, 编号, 说明)]。"""
    zh_max = a.zh_max or (30 if a.howto else 50)
    en_max = a.en_max or (20 if a.howto else 25)
    out = []
    fence = False
    para, para_start = [], 0

    def flush():
        nonlocal para
        if not para:
            return
        text = ' '.join(x for _, x in para)
        line_of = para[0][0]
        for zh_part in ZH_SPLIT.split(text):
            for sent in (EN_SPLIT.split(zh_part) if not CJK.search(zh_part) else [zh_part]):
                sent = sent.strip()
                if not sent:
                    continue
                lang, n = sentence_units(sent)
                lim = zh_max if lang == 'zh' else en_max
                if n > lim:
                    snip = sent if len(sent) <= 40 else sent[:24] + '…' + sent[-12:]
                    unit = '字' if lang == 'zh' else '词'
                    out.append((shown, line_of, 'S1', '句子 %d %s,超过 %d:「%s」' % (n, unit, lim, snip)))
        para = []

    front = len(lines) > 1 and lines[0].strip() == '---'   # 开头的 YAML 头不查
    for n, raw in enumerate(lines, 1):
        st = raw.strip()
        if front:
            front = not (n > 1 and st == '---')
            continue
        if st.startswith(('```', '~~~')):
            flush()
            fence = not fence
            continue
        if SKIP_LINE.search(raw):
            flush()
            continue
        diagram = BOX.search(raw) or (fence and ARROW.search(raw))
        if diagram and display_width(raw.rstrip()) > a.cols:
            out.append((shown, n, 'S5', '图这一行显示宽 %d 列,超过 %d(汉字算两列)'
                        % (display_width(raw.rstrip()), a.cols)))
        if fence:
            continue
        line = MASK.sub(lambda m: ' ' * len(m.group(0)), raw)
        for m in WEAK_VERB.finditer(line):
            out.append((shown, n, 'S2', '虚动词「%s」:直接写动词「%s」' % (m.group(0), m.group(3))))
        for m in PASSIVE.finditer(line):
            if m.group(2).lower() not in NOT_PARTICIPLE:
                out.append((shown, n, 'S3', '被动「%s」:写出谁做(描述句偶尔用被动可以)' % m.group(0)))
        if a.howto and STEP_ITEM.match(line):
            body = line.rstrip().rstrip(';；').rstrip()
            if ';' in body or '；' in body:
                out.append((shown, n, 'S4', '这一步用分号连了两件事:拆成两步'))
        # S1 按段落拼句:标题、表格行、空行结束一段;列表项自成一段
        if not st or st.startswith(('#', '|')) or diagram:
            flush()
            continue
        if re.match(r'^\s*([-*+]|\d{1,3}[.)、])\s+', raw):
            flush()
            line = re.sub(r'^\s*([-*+]|\d{1,3}[.)、])\s+', '', line)
        para.append((n, line.strip()))
    flush()
    return out


def collect(paths):
    files = []
    for p in paths:
        if os.path.isdir(p):
            for root, dirs, fs in os.walk(p):
                dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'node_modules']
                files += [os.path.join(root, f) for f in sorted(fs) if f.endswith(EXTS)]
        elif os.path.isfile(p):
            files.append(p)
        else:
            raise FileNotFoundError(p)
    return files


def report(found):
    for f, n, code, msg in found:
        print('%s:%d  %s  %s' % (f, n, code, msg))
    print('共 %d 处' % len(found) if found else '没有发现')
    return 1 if found else 0


def parse(argv):
    ap = argparse.ArgumentParser(add_help=True, usage=__doc__)
    ap.add_argument('paths', nargs='*')
    ap.add_argument('--stdin', action='store_true')
    ap.add_argument('--howto', action='store_true')
    ap.add_argument('--zh-max', type=int, default=0)
    ap.add_argument('--en-max', type=int, default=0)
    ap.add_argument('--cols', type=int, default=80)
    ap.add_argument('--self-test', action='store_true')
    return ap.parse_args(argv)


# ── 自测:每条检查都有「故意写坏,必须报」和「写对了,不能报」 ──────────────
CASES = [
    # (说明, 文本, 参数, 期望的编号列表)
    ('S1 中文长句(65 字)必须报',
     '这个模块在启动的时候会先去读取配置文件里面的设备地址然后再根据设备地址去初始化总线最后还要检查一遍设备有没有正常响应才会继续往下走。',
     [], ['S1']),
    ('S1 拆成三句(各 ≤25 字)不报',
     '模块启动时先读配置文件里的设备地址。然后按这个地址初始化总线。最后检查设备有没有响应。',
     [], []),
    ('S1 分号连起来的两个分句算一句(反向验证:按分号断句就不报)',
     '模块启动时先读配置文件里的设备地址,再按这个地址初始化总线\uff1b最后还要检查一遍设备有没有正常响应,通过了才继续往下走。',
     [], ['S1']),
    ('S1 句里的路径按一个字算:短句带长路径不报',
     '改 drivers/input/touchscreen/vendor_ts_core_driver_main.c 的第 120 行。',
     [], []),
    ('S1 英文 40 词的一句必须报',
     'The touch controller sits at the same I2C address as the one on the original panel, yet both '
     'panels must keep a complete and independent device tree node, and the original node and driver '
     'must stay untouched by this change.',
     [], ['S1']),
    ('S1 一行里两句英文(20 词、19 词)不报(反向验证:不分句就会报)',
     'The first sentence has exactly twenty words in it so that the checker can count them one by one '
     'here. The second sentence also has exactly twenty words in it so the checker must split at the '
     'period here.',
     [], []),
    ('S1 --howto 时英文 23 词的步骤要报(默认 25 不报)',
     '1. Connect the serial cable to the debug port on the left side of the board and then open the '
     'terminal at 115200 baud.',
     ['--howto'], ['S1']),
    ('S2 虚动词必须报 2 处',
     '需要对日志进行分析。\n上板后对签名作出验证。',
     [], ['S2', 'S2']),
    ('S2 进行中 / 「」示例 / 行内代码 / ste-ok 都不报',
     '编译正在进行中。\n反例「进行编译」写在引号里。\n行内代码 `进行验证` 不算。\n这一行故意写进行分析。 ste-ok',
     [], []),
    ('S3 英文被动必须报',
     'The device is released by the caller.',
     [], ['S3']),
    ('S3 主动语态、形容词 red / need 不报',
     'The caller releases the device. The LED is red. We need a reset.',
     [], []),
    ('S4 --howto 一步两事必须报,末尾分号不报',
     '1. 读末尾 28 字节;校验签名长度。\n2. 打开串口;\n3. 重启板子。',
     ['--howto'], ['S4']),
    ('S4 全角分号同样要报,末尾全角分号不报',
     '1. 读末尾 28 字节\uff1b校验签名长度。\n2. 打开串口\uff1b',
     ['--howto'], ['S4']),
    ('S4 不加 --howto 不查分号',
     '1. 读末尾 28 字节;校验签名长度。',
     [], []),
    ('S5 45 个汉字的框图行 = 90 列必须报(反向验证:按字符数数只有 45,会放过)',
     '```\n┌' + '启动' * 22 + '┐\n```',
     [], ['S5']),
    ('S5 正文里带箭头的长句不算图(反向验证:箭头也算图时会报)',
     '改动前 → 改动后:' + '这一段是正文里的普通说明文字' * 4 + '。',
     [], ['S1']),
    ('开头的 YAML 头不查(description 常常是一长串)',
     '---\ndescription: "' + '很长的说明' * 20 + '"\n---\n正文短句。',
     [], []),
    ('S5 78 列的英文框图行不报,代码块里的长句不按 S1 报',
     '```\n┌' + '─' * 76 + '┐\nthis line is a very long code comment that would be far too long for a sentence if it were prose text in the document body\n```',
     [], []),
]


def self_test():
    passed = failed = 0
    for desc, text, extra, want in CASES:
        a = parse(['--stdin'] + extra)
        got = [c for _, _, c, _ in check_lines(text.splitlines(), '<样例>', a)]
        if sorted(got) == sorted(want):
            passed += 1
            print('  通过  %s' % desc)
        else:
            failed += 1
            print('  失败  %s:期望 %s,实际 %s' % (desc, want, got))
    # 文件入口和 HTML 抽字也走一遍
    with tempfile.TemporaryDirectory() as td:
        p = os.path.join(td, 'a.html')
        with open(p, 'w', encoding='utf-8') as f:
            f.write('<p>需要对日志进行分析。</p><pre>进行分析</pre><script>var s="进行分析";</script>'
                    '<div data-ste-ok><p>反例:进行分析。</p><p>再一个:作出验证。</p></div><p>结尾。</p>')
        got = [c for _, _, c, _ in check_lines(read_lines(p), p, parse(['x']))]
        if got == ['S2']:
            passed += 1
            print('  通过  HTML:<p> 里的报,<pre> / <script> / data-ste-ok 元素里的不报')
        else:
            failed += 1
            print('  失败  HTML 抽字:期望 [S2],实际 %s' % got)
    print('\n自测:%d 通过 / %d 失败' % (passed, failed))
    return 0 if failed == 0 else 1


def main(argv):
    a = parse(argv)
    if a.self_test:
        return self_test()
    if a.stdin:
        return report(check_lines(sys.stdin.read().splitlines(), '<stdin>', a))
    if not a.paths:
        print(__doc__)
        return 2
    try:
        files = collect(a.paths)
    except FileNotFoundError as e:
        print('不存在:%s' % e)
        return 2
    if not files:
        print('没找到 %s 文件' % ' / '.join(EXTS))
        return 2
    found = []
    for f in files:
        found += check_lines(read_lines(f), f, a)
    return report(found)


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
