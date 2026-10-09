#!/usr/bin/env python3
"""生成仓库首页 index.html。

    python3 site/home/build_home.py          # 写 index.html
    python3 site/home/build_home.py --check  # 不写,只比对:重新生成的结果和现有 index.html 逐字节相同才退出 0

首页的数据从这三处来,不手抄:
  · 每个 skill 第一次进仓库的日期 —— git log --diff-filter=A -- skills/<名>/SKILL.md
  · 触发词 —— docs/INSTALL.html 的 skill 表
  · 七套自测的数字 —— site/home/suites.json(跑完 design-review 的七套自测后手动更新)
介绍文字、符号、相互关系写在下面的 S 表里。

加了新 skill:在 S 里补一行,再跑一次。S 和 skills/ 目录对不上时直接报错,
不会生成一张少一格的周期表。手改 index.html 的结果会被 --check 抓出来。

模板是同目录的 index.html.tpl(后缀不是 .html,免得被当成页面去检查)。
"""
import html, json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
GH = 'https://github.com/TbusOS/sky-skills/tree/main/skills/'


def install_rows():
    """docs/INSTALL.html 的 skill 表:名字 → 中英文触发词。"""
    s = open(os.path.join(ROOT, 'docs', 'INSTALL.html'), encoding='utf-8').read()
    rows = re.findall(r'<td class="skill-name">([^<]+)</td>\s*<td>(.*?)</td>\s*<td class="skill-trigger">(.*?)</td>', s, re.S)

    def side(x, lang):
        m = re.search(r'<span class="lang-%s">(.*?)</span>' % lang, x, re.S)
        return html.unescape(re.sub(r'<[^>]+>', '', m.group(1))).strip() if m else ''
    return {n.strip(): {'trig_en': side(t, 'en'), 'trig_zh': side(t, 'zh')} for n, _r, t in rows}


DESIGN = ['anthropic-design', 'apple-design', 'ember-design', 'sage-design', 'glass-design',
          'eclat-design', 'lectern-design', 'atelier-design', 'primer-design', 'relief-design', 'graphite-design']
DREL = ['design-review', 'design-planner', 'design-evolve']

S = {
 'linux-kernel-dev': ('sys', 'Lk', 'kernel', 'Kernel', '内核',
   'Writes, reviews and debugs kernel modules, drivers, Kconfig, device trees and patches. Answers are checked against real 6.1 / 7.0 source trees, a 7-axis critic scores them, and a safety failure vetoes the whole answer.',
   '写、审、调内核模块、驱动、Kconfig、设备树和补丁。回答要对着真实的 6.1 / 7.0 源码树核对,再由 7 个维度的评审打分,安全一项不过就整份否决。',
   [], [('docs/KERNEL-HARNESS.html', 'Architecture', '架构'), ('docs/KERNEL-CAPABILITIES.html', 'See it work', '看它干活')]),
 'wechat-video-publisher': ('sys', 'Wv', 'video', 'Video', '视频',
   'Narrated videos from HTML animations: edge-tts voice-over, frame-by-frame Playwright capture, ffmpeg subtitles, plus WeChat-ready inline-style articles.',
   '把 HTML 动画做成带配音的视频:edge-tts 配音、Playwright 逐帧录制、ffmpeg 烧字幕,另配公众号能用的内联样式文章。',
   ['explain-ladder'], []),
 'doc-to-markdown': ('sys', 'Dm', 'doc → md', 'Docs', '文档',
   'PDF and DOCX into clean Markdown: images extracted, tables converted, EMF / WMF handled, and a fallback for scanned PDFs.',
   'PDF、DOCX 转成干净的 Markdown:抽出图片、转好表格、处理 EMF / WMF,扫描版 PDF 也能转。',
   ['md-to-pdf'], []),
 'md-to-pdf': ('sys', 'Mp', 'md → pdf', 'Docs', '文档',
   'Markdown into PDF with full Chinese support, bookmarks built from headings, and page numbers.',
   'Markdown 渲成 PDF:完整中文支持、按标题生成书签、带页码。',
   ['doc-to-markdown'], []),
 'anthropic-design': ('des', 'An', 'anthropic', 'Voice', '风格',
   'The anthropic.com palette with a free layout: warm cream, orange, low-saturation semantic hues, ink text. 78 diagram templates and an 87-figure gallery; the check covers objective defects only.',
   '只定死 anthropic.com 的配色:暖米白、橙、低饱和语义色、墨色字,版式自由。78 张图例模板、87 图案例库;检查只查客观缺陷。',
   DREL + ['explain-ladder'], [('demos/anthropic-design/index.html', 'Skill page', '介绍页'), ('demos/anthropic-design/explainer.html', 'Reworked example', '改版示范页'), ('demos/anthropic-design/diagrams.html', 'Diagram gallery', '图例库'), ('demos/anthropic-design/story.html', 'Earlier flagship', '旧版 flagship')]),
 'apple-design': ('des', 'Ap', 'apple', 'Voice', '风格',
   'The apple.com palette and restraint: white and light-grey sections, one blue accent, hierarchy carried by grey and whitespace. 33 diagram templates.',
   'apple.com 的配色和克制:白 / 浅灰段落交替、只有一个蓝色强调、层级靠灰阶和留白。33 张图例模板。',
   DREL + ['explain-ladder'], [('demos/apple-design/explainer.html', 'Reworked example', '改版示范页'), ('demos/apple-design/diagrams.html', 'Diagram gallery', '图例库'), ('demos/apple-design/motion.html', 'Motion lab', '交互实验室')]),
 'ember-design': ('des', 'Em', 'ember', 'Voice', '风格',
   'Handcraft editorial warmth: cream, chocolate and one gold accent, with a Fraunces display serif. For artisan brands and literary journals.',
   '手作编辑风:奶油、巧克力、单一金色点睛,Fraunces 衬线标题。适合手作品牌和文学刊物。',
   DREL, [('demos/ember-design/index.html', 'Demo', 'Demo'), ('demos/ember-design/diagrams.html', 'Diagram gallery', '图例库')]),
 'sage-design': ('des', 'Sg', 'sage', 'Voice', '风格',
   'Quiet Nordic minimalism: rice-paper cream, sage green, deep indigo ink, Instrument Serif. For reading apps and botanical studios.',
   '安静的北欧极简:米纸白、鼠尾草绿、深靛蓝墨,Instrument Serif。适合阅读应用和植物工作室。',
   DREL, [('demos/sage-design/index.html', 'Demo', 'Demo'), ('demos/sage-design/diagrams.html', 'Diagram gallery', '图例库')]),
 'design-review': ('har', 'Dr', 'review', 'Judge', '裁判',
   'The independent evaluator for the eleven design skills. It reads only the rendered page: structural, rendered, accessibility and screenshot gates, an optional LLM critic, and a learning loop that turns each miss into a known-bug row and a new check.',
   '十一个设计 skill 的独立评审。只看渲染出来的页面:结构、渲染、无障碍、截图几道检查,外加可选的 LLM 评审;每次漏掉的问题都会变成一条 known-bug 和一项新检查。',
   DESIGN + ['design-planner', 'design-evolve'], [('docs/HARNESS-ROADMAP.html', 'Harness roadmap', 'Harness 路线图')]),
 'gated-dual-clone': ('har', 'Gd', 'dual-clone', 'Git', 'Git',
   'Bootstraps a two-repo git workflow for protected branches: a gateway repo that pushes and a satellite repo that builds — and physically cannot reach the remote.',
   '给受保护分支搭双仓库工作流:网关仓负责推送,卫星仓负责编译,而且物理上碰不到远端。',
   ['gated-dual-clone-audit'], [('demos/gated-dual-clone/index.html', 'Demo', 'Demo'), ('https://github.com/TbusOS/sky-skills/blob/main/docs/design-mr-gated-dual-repo.md', 'Design spec', '设计说明')]),
 'gated-dual-clone-audit': ('har', 'Ga', 'audit', 'Judge', '裁判',
   'The independent evaluator for gated-dual-clone. It imports nothing from the generator, reads the resulting topology, and re-verifies the safety gates in four tiers.',
   'gated-dual-clone 的独立评审。不引用生成方的任何代码,只读产出的仓库拓扑,分四层重新核对安全检查。',
   ['gated-dual-clone'], [('https://github.com/TbusOS/sky-skills/blob/main/skills/gated-dual-clone-audit/references/gate-catalog.md', 'Gate catalog', '检查清单')]),
 'doc-review-loop': ('har', 'Rl', 'doc loop', 'Review', '评审',
   'A writer agent drafts a decision document with evidence; a no-context reviewer challenges every claim and ranks the issues A / B / C. Up to three rounds.',
   '写作 agent 带证据起草决策文档,一个没有上下文的评审 agent 逐条质疑、按 A / B / C 分级,最多三轮。',
   [], []),
 'design-planner': ('har', 'Pl', 'planner', 'Plan', '规划',
   'Turns a one-line brief into a contract before any HTML is written: page type, section plan, hard quotas. Page types it has never seen are stamped LOW-CONFIDENCE.',
   '在写任何 HTML 之前,把一句话需求展开成一份合同:页面类型、分节计划、硬指标。没见过的页面类型标 LOW-CONFIDENCE。',
   DESIGN + ['design-review'], [('https://github.com/TbusOS/sky-skills/blob/main/skills/design-planner/SKILL.md', 'SKILL.md', 'SKILL.md')]),
 'glass-design': ('des', 'Gl', 'glass', 'Voice', '风格',
   'Liquid glass on a deep-navy aurora field: three tiers of frosted panels, cyan as the only foreground accent, and a water-drop cursor checked against physics.',
   '深藏青极光上的液态玻璃:三层毛玻璃面板、前景强调只用 cyan,还有一颗按物理核对过的水珠光标。',
   DREL + ['explain-ladder'], [('demos/glass-design/explainer.html', 'Reworked example', '改版示范页'), ('demos/glass-design/diagrams.html', 'Diagram gallery', '图例库'), ('demos/glass-design/index.html', 'Earlier flagship', '旧版 flagship')]),
 'design-evolve': ('har', 'Ev', 'evolve', 'Evolve', '进化',
   'Improves the generator skills themselves: mutate one rule, regenerate, score against the frozen evaluator, and keep the change only if it beats the baseline with no canonical page regressing.',
   '改进生成器自己:改一条规则、重新生成、用冻结的评审打分;只有超过基线、而且没有范例页退步,才保留。',
   DESIGN + ['design-review'], [('https://github.com/TbusOS/sky-skills/blob/main/skills/design-evolve/SKILL.md', 'SKILL.md', 'SKILL.md')]),
 'skills-sync': ('har', 'Sy', 'sync', 'Upkeep', '维护',
   'Checks whether the skills remote is ahead, lists what changed, and updates only after you confirm: git pull --ff-only plus symlinks for any new skill.',
   '检查远端有没有更新、列出改了什么,你确认后才更新:git pull --ff-only,并给新 skill 补软链接。',
   ['*'], [('docs/INSTALL.html#stay-updated', 'Auto-updater', '自动更新')]),
 'eclat-design': ('des', 'Ec', 'eclat', 'Voice', '风格',
   'A product-launch keynote: a matte near-black stage, bone-white type, a cool spotlight, one flare accent and full-screen “one more thing” moments.',
   '产品发布会 keynote:近黑哑光舞台、骨白文字、一道冷色聚光、一个亮色点睛,还有整屏的「one more thing」时刻。',
   DREL, [('demos/eclat-design/index.html', 'Demo', 'Demo'), ('demos/eclat-design/diagrams.html', 'Lookbook', 'Lookbook')]),
 'lectern-design': ('des', 'Le', 'lectern', 'Voice', '风格',
   'A boardroom review deck: paper white, serif headings, low-saturation navy charts, KPI cards and a decisions-and-actions table.',
   '会议室评审 deck:纸白底、衬线标题、低饱和藏青图表、KPI 卡和决议 / 行动表。',
   DREL, [('demos/lectern-design/index.html', 'Demo', 'Demo'), ('demos/lectern-design/diagrams.html', 'Board pack', 'Board pack')]),
 'tech-pdf-reader': ('sys', 'Tp', 'pdf', 'PDF', 'PDF',
   'Reads technical PDFs whose answer sits in a timing diagram or a pin table. It tells “the tool failed” from “the file is damaged”, and an unreadable page is reported as unreadable.',
   '读技术 PDF,答案常在时序图和引脚表里。分清「工具不行」和「文件坏了」;读不到就写读不到,不按常理补全。',
   ['datasheet-reading'], []),
 'atelier-design': ('des', 'At', 'atelier', 'Voice', '风格',
   'Product UI rather than a page: one frosted app shell on a peach-and-rose wallpaper, gradient orb icons, and JavaScript that really routes, sorts and switches.',
   '画的是应用界面而不是网页:桃色玫瑰壁纸上一整块磨砂外壳、渐变圆球图标,侧栏真能路由、表格真能排序、开关真能切。',
   DREL, [('demos/atelier-design/index.html', 'Demo', 'Demo'), ('demos/atelier-design/diagrams.html', 'Figure gallery', '图例库'), ('skills/atelier-design/references/canonical/dashboard.html', 'Live console', '可点的控制台')]),
 'datasheet-reading': ('sys', 'Ds', 'datasheet', 'PDF', 'PDF',
   'Confirms one fact from an engineering PDF — a register bit, a timing minimum, whether a part is fitted — and quotes page and table number. “Could not extract” is never reported as “not in the document”.',
   '从工程 PDF 里确认一个事实:某个寄存器位、某个时序最小值、这颗料贴没贴,并给出页号和表号。「没提取出来」绝不写成「文档里没有」。',
   ['tech-pdf-reader'], []),
 'primer-design': ('des', 'Pr', 'primer', 'Voice', '风格',
   'Picture-book explainers for a reader who knows nothing yet: thick-outline drawings, one everyday analogy per idea, and jargon traded for plain words.',
   '写给完全外行的图解读本:厚描边插画、每个概念一个日常比喻,术语一出现就换成大白话。',
   DREL + ['explain-ladder'], [('demos/primer-design/index.html', 'Demo', 'Demo'), ('demos/primer-design/diagrams.html', 'Picture gallery', '插画集'), ('demos/primer-design/tech/index.html', 'Technical set', '技术图解集')]),
 'hardware-3d': ('sys', 'H3', '3D', '3D', '3D',
   'Photoreal hardware explainers in one HTML file with hand-written WebGL2: accumulated samples give real soft shadows, and data moves through the die tick by tick.',
   '单个 HTML、手写 WebGL2 的写实硬件讲解页:累积采样出真的软阴影,数据按时钟一拍一拍在芯片里走。',
   [], [('demos/hardware-3d/index.html', 'Demo', 'Demo')]),
 'relief-design': ('des', 'Re', 'relief', 'Voice', '风格',
   'Technical diagrams in neumorphism, where depth is the legend: raised is a thing that exists, sunken is a place you cannot reach. Seven skins.',
   '用新拟态画技术框图,深度本身就是图例:凸起是存在的东西,凹陷是够不到的地方。七套皮肤。',
   DREL + ['explain-ladder'], [('demos/relief-design/index.html', 'Demo', 'Demo'), ('skills/relief-design/references/canonical/hardware.html', 'Hardware set', '硬件图'), ('skills/relief-design/references/canonical/debug.html', 'Debugging set', '调试图')]),
 'graphite-design': ('des', 'Gr', 'graphite', 'Voice', '风格',
   'Graphite pencil on warm paper, a few coloured pencils, hand lettering, drawn stroke by stroke in story order. 27 figures (22 animated) from code; scenes and film stills from an image model; frame-exact video export, and a taste log that learns what you pick.',
   '暖纸上的石墨铅笔线、几支彩铅、手写批注,按讲故事的顺序一笔一笔画出来。27 张代码画的图例(22 张会动),场景和电影画面交给出图模型;能逐帧导出视频,还会记住你挑了哪张、慢慢调成你的口味。',
   DREL + ['explain-ladder', 'wechat-video-publisher'], [('demos/graphite-design/index.html', 'Skill page', '介绍页'), ('demos/graphite-design/diagrams.html', 'Figure gallery', '图例库'), ('demos/graphite-design/reel.html', 'Sample reel', '短片样片'), ('demos/graphite-design/assets.html', 'Assets', '素材')]),
 'explain-ladder': ('sys', 'El', 'ladder', 'Explain', '讲解',
   'Pick the form before you write: text < diagram < page < video. STE writing with an on / off switch, ASCII diagrams, throwaway pages rebuilt byte for byte, and video only after a yes.',
   '先选形式再动笔:文字 < 图 < 网页 < 视频。STE 写法带开关、ASCII 图、能逐字节重建的看懂就扔页,视频要点头才做。',
   ['wechat-video-publisher', 'anthropic-design', 'apple-design', 'glass-design', 'relief-design', 'primer-design'],
   [('demos/explain-ladder/index.html', 'Demo', 'Demo')]),
}


def build():
    skills_dir = sorted(d for d in os.listdir(os.path.join(ROOT, 'skills'))
                        if os.path.isfile(os.path.join(ROOT, 'skills', d, 'SKILL.md')))
    if set(skills_dir) != set(S):
        sys.exit('S 表和 skills/ 目录对不上:目录里多 %s,S 里多 %s。新 skill 要在 build_home.py 的 S 里补一行。'
                 % (sorted(set(skills_dir) - set(S)), sorted(set(S) - set(skills_dir))))
    inst = install_rows()
    lost = sorted(set(S) - set(inst))
    if lost:
        sys.exit('docs/INSTALL.html 的 skill 表里没有:%s' % lost)

    dates = {}
    for name in S:
        out = subprocess.run(['git', 'log', '--diff-filter=A', '--format=%ad', '--date=short', '--',
                              'skills/%s/SKILL.md' % name], cwd=ROOT, capture_output=True, text=True).stdout.split()
        if not out:
            sys.exit('git 里找不到 skills/%s/SKILL.md 的加入记录(浅克隆?)' % name)
        dates[name] = out[-1]
    order = sorted(S, key=lambda n: (dates[n], n))

    # 关系对称化:A 说跟 B 有关,B 也要能看到 A;'*' 表示和所有 skill 都有关
    rel = {n: set(S[n][7]) for n in S}
    for n in S:
        if '*' in rel[n]:
            rel[n] = set(S) - {n}
        for m in list(rel[n]):
            rel[m].add(n)

    def clean(x):   # 安装页里「见 § 05」这类指向安装页自己的话,放到首页上没有上下文
        return re.sub(r'\s*(?:—|——)\s*(?:see|见)\s*§\s*\d+', '', x)

    data = []
    for i, n in enumerate(order, 1):
        fam, sym, short, _ken, _kzh, en, zh, _r, links = S[n]
        data.append({'n': i, 'id': n, 'fam': fam, 'sym': sym, 'short': short, 'date': dates[n],
                     'en': en, 'zh': zh, 'trig_en': clean(inst[n]['trig_en']), 'trig_zh': clean(inst[n]['trig_zh']),
                     'rel': sorted(rel[n], key=order.index),
                     'links': [{'href': h, 'en': a, 'zh': b} for h, a, b in links]
                              + [{'href': GH + n, 'en': 'Source', 'zh': '源码'}]})

    suites = json.load(open(os.path.join(HERE, 'suites.json'), encoding='utf-8'))
    tpl = open(os.path.join(HERE, 'index.html.tpl'), encoding='utf-8').read()
    blob = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c')
    for key, val in (('__SKILLS_JSON__', blob), ('__SUITES__', json.dumps(suites['rows'])),
                     ('__SUITES_DATE__', suites['date'])):
        if key not in tpl:
            sys.exit('模板里没有占位符 %s' % key)
        tpl = tpl.replace(key, val)
    return tpl


def main(argv):
    out = build()
    target = os.path.join(ROOT, 'index.html')
    if '--check' in argv:
        cur = open(target, encoding='utf-8').read() if os.path.exists(target) else ''
        if cur == out:
            print('index.html 和重新生成的结果逐字节相同')
            return 0
        print('index.html 和重新生成的结果不同:改了模板 / S 表 / suites.json 后没重跑,'
              '或者有人手改了 index.html。跑 python3 site/home/build_home.py')
        return 1
    open(target, 'w', encoding='utf-8').write(out)
    print('写好 index.html(%d 字节)' % len(out))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
