<!DOCTYPE html>
<html lang="zh-CN" data-lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>inkwash · 水墨 — 一笔一画,按场景画 | sky-skills</title>
<meta name="description" content="inkwash-design:给 AI 的中国水墨画风指引。宣纸、墨分五色、有提按的毛笔、留白、一方朱印;技术框图、界面、诗词、四季、武侠、电影、壁纸、发布会都能用。{{count:all}} 张图例({{count:motion}} 张会动),代码画与出图模型择优,越用越懂你。">
<script>try{var t=localStorage.getItem('inkwash-theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}</script>
<link rel="stylesheet" href="../../skills/inkwash-design/assets/fonts.css">
<link rel="stylesheet" href="../../skills/inkwash-design/assets/ink.css">
<link rel="stylesheet" href="pages.css">
</head>
<body class="ink-page">
{{filters}}
<header class="top"><div class="wrap top-in">
  <a class="brand ink-brush" href="index.html">inkwash<span>水墨</span></a>
  <nav aria-label="inkwash">
    <a href="index.html" aria-current="page"><span class="lang-zh">介绍</span><span class="lang-en">About</span></a>
    <a href="index.html#taste"><span class="lang-zh">越用越懂你</span><span class="lang-en">Learns your taste</span></a>
    <a href="diagrams.html"><span class="lang-zh">图例库</span><span class="lang-en">Figures</span></a>
    <a href="compare.html"><span class="lang-zh">择优</span><span class="lang-en">Code vs image</span></a>
    <a href="reel.html"><span class="lang-zh">短片</span><span class="lang-en">Reel</span></a>
    <a href="launch.html"><span class="lang-zh">发布会</span><span class="lang-en">Launch</span></a>
    <a href="../../index.html"><span class="lang-zh">全部 skill</span><span class="lang-en">All skills</span></a>
  </nav>
  <div class="tools">
    <button type="button" data-lang-toggle="zh" aria-pressed="true">中文</button>
    <button type="button" data-lang-toggle="en" aria-pressed="false">EN</button>
    <button type="button" data-theme-toggle aria-pressed="false" aria-label="深色 / 浅色" data-label-zh="深色 / 浅色" data-label-en="Dark / light">☾</button>
  </div>
</div></header>

<main>
<section class="hero"><div class="wrap wrap--wide hero-grid">
  <div class="hero-text">
    <span class="kicker"><span class="lang-zh">sky-skills · 第 12 个设计风格</span><span class="lang-en">sky-skills · design voice no. 12</span></span>
    <h1 class="ink-title"><span class="lang-zh">水墨</span><span class="lang-en">Ink wash</span></h1>
    <p class="lede"><span class="lang-zh">宣纸、墨、几样国画颜料,一笔一笔按笔顺画出来,空着的地方也是画。只定死五样,其余按场景定:技术框图、产品首屏、诗词、四季、武侠、电影、壁纸、发布会都能画。{{count:all}} 张图例,{{count:motion}} 张会动。</span><span class="lang-en">Rice paper, ink and a few Chinese pigments, painted stroke by stroke; the empty paper is part of the picture. Only five things are fixed, everything else follows the scene: architecture diagrams, product pages, poems, seasons, wuxia, film, wallpapers, launches. {{count:all}} figures, {{count:motion}} of them animated.</span></p>
    <div class="cta">
      <a class="ink-btn ink-btn--seal" href="diagrams.html"><span class="lang-zh">看 {{count:all}} 张图例</span><span class="lang-en">See {{count:all}} figures</span></a>
      <a class="ink-btn" href="#taste"><span class="lang-zh">它怎么懂你</span><span class="lang-en">How it learns you</span></a>
    </div>
  </div>
  <div>
    <div class="para" role="img" aria-label="平远山水,远景、中景、近景三层各自慢慢移动" data-label-zh="平远山水,远景、中景、近景三层各自慢慢移动" data-label-en="A level-distance landscape; far, middle and near layers drift at different speeds">
      <img class="l-far" src="media/pingyuan-far.webp" width="1600" height="900" alt="">
      <div class="mist"></div>
      <img class="l-mid" src="media/pingyuan-mid.webp" width="1600" height="900" alt="">
      <img class="l-near" src="media/pingyuan-near.webp" width="1600" height="900" alt="">
    </div>
    <p style="font-size:14px;margin-top:8px"><span class="lang-zh">出图模型分三次画远景、中景、近景,<code>scripts/layers.mjs</code> 抠成透明层,各层按不同速度移动,层间夹一道雾。</span><span class="lang-en">The image model painted far, middle and near separately; <code>scripts/layers.mjs</code> cut them into transparent layers that drift at different speeds with mist between.</span></p>
  </div>
</div></section>

<section id="five"><div class="wrap">
  <span class="kicker"><span class="lang-zh">定死的五样</span><span class="lang-en">The five fixed things</span></span>
  <h2><span class="lang-zh">五样都在,怎么画都是水墨</span><span class="lang-en">With all five, it is ink wash whatever you paint</span></h2>
  <p class="lede"><span class="lang-zh">黑白、彩色、技术图、壁纸都还是水墨;少一样就不是了。每一样都写了「没有它会怎样」。</span><span class="lang-en">Black and white or colour, diagram or wallpaper — still ink wash. Lose one and it is not. Each comes with what breaks without it.</span></p>
  <div class="five">
    <div class="ink-card"><b class="ink-brush"><span class="lang-zh">宣纸</span><span class="lang-en">Paper</span></b><span class="lang-zh">暖白带纤维;深色版是磁青纸配泥金,另画不反相。</span><span class="lang-en">Warm fibrous white; at night indigo paper with gold, repainted, never inverted.</span><small><span class="lang-zh">没有它:纯白像打印稿,反相像底片</span><span class="lang-en">Without it: print-out white, or a negative</span></small></div>
    <div class="ink-card"><b class="ink-brush"><span class="lang-zh">水墨</span><span class="lang-en">Ink &amp; water</span></b><span class="lang-zh">墨分五色,颜色透明、一层层叠,不平涂。</span><span class="lang-en">Five tones of ink; see-through colour in layers, never flat.</span><small><span class="lang-zh">没有它:平涂像剪纸,硬渐变像 PPT</span><span class="lang-en">Without it: paper cut-outs or slide gradients</span></small></div>
    <div class="ink-card"><b class="ink-brush"><span class="lang-zh">提按</span><span class="lang-en">Pressure</span></b><span class="lang-zh">起笔斜切,收笔出锋,墨少出飞白,落定晕开。</span><span class="lang-en">Slanted start, pointed exit, dry brush as ink runs out, a bleed once it lands.</span><small><span class="lang-zh">没有它:等宽线就成了图标</span><span class="lang-en">Without it: even lines, an icon</span></small></div>
    <div class="ink-card"><b class="ink-brush"><span class="lang-zh">留白</span><span class="lang-en">Empty paper</span></b><span class="lang-zh">水、天、雾不画;字写在留白里。</span><span class="lang-en">Water, sky and mist are left unpainted; words live there.</span><small><span class="lang-zh">没有它:画满了像油画</span><span class="lang-en">Without it: an oil painting</span></small></div>
    <div class="ink-card"><b class="ink-brush"><span class="lang-zh">印 · 字</span><span class="lang-en">Seal &amp; brush</span></b><span class="lang-zh">毛笔标题,至少一方朱印当句号。</span><span class="lang-en">Brush lettering, at least one red seal as the full stop.</span><small><span class="lang-zh">没有它:像没画完</span><span class="lang-en">Without it: unfinished</span></small></div>
  </div>
  <div class="duo">
    <figure>{{fig:ink-tones}}<figcaption><b>{{title:ink-tones}}</b> {{desc:ink-tones}}</figcaption></figure>
    <figure>{{fig:four-palettes}}<figcaption><b>{{title:four-palettes}}</b> {{desc:four-palettes}}</figcaption></figure>
  </div>
</div></section>

<section id="scene"><div class="wrap">
  <span class="kicker"><span class="lang-zh">先问场景,再动笔</span><span class="lang-en">Scene first, brush second</span></span>
  <h2><span class="lang-zh">同一支笔,五种场景五种画法</span><span class="lang-en">One brush, five scenes, five ways</span></h2>
  <p class="lede"><span class="lang-zh">动笔前问四件事:在哪看、读者要得到什么、动不动多长、有没有必须准确的字数线。答案落到下面一组,就知道留白多少、颜色怎么用、谁来画。</span><span class="lang-en">Ask four things first: where it is seen, what the reader should get, whether it moves and for how long, and whether any words, numbers or lines must be exact. The answer lands in one row below.</span></p>
  <div class="tbl-wrap"><table class="tbl">
    <thead><tr><th><span class="lang-zh">场景组</span><span class="lang-en">Scene</span></th><th><span class="lang-zh">优先</span><span class="lang-en">First</span></th><th><span class="lang-zh">留白</span><span class="lang-en">Empty</span></th><th><span class="lang-zh">设色</span><span class="lang-en">Colour</span></th><th><span class="lang-zh">谁画</span><span class="lang-en">Who paints</span></th></tr></thead>
    <tbody>
      <tr><td><span class="lang-zh">技术图</span><span class="lang-en">Diagrams</span></td><td><span class="lang-zh">读懂</span><span class="lang-en">understanding</span></td><td>20–35%</td><td><span class="lang-zh">纯墨或浅绛,一色一事</span><span class="lang-en">ink or light ochre, one colour per meaning</span></td><td><span class="lang-zh">代码</span><span class="lang-en">code</span></td></tr>
      <tr><td><span class="lang-zh">页面与界面</span><span class="lang-en">Pages &amp; UI</span></td><td><span class="lang-zh">读懂 + 好用</span><span class="lang-en">reading + use</span></td><td><span class="lang-zh">按版式</span><span class="lang-en">by layout</span></td><td><span class="lang-zh">水墨只做点缀</span><span class="lang-en">ink as an accent</span></td><td><span class="lang-zh">代码</span><span class="lang-en">code</span></td></tr>
      <tr><td><span class="lang-zh">发布会</span><span class="lang-en">Launch</span></td><td><span class="lang-zh">记住产品</span><span class="lang-en">remembering</span></td><td><span class="lang-zh">大</span><span class="lang-en">large</span></td><td><span class="lang-zh">磁青泥金,或大留白 + 一处重彩</span><span class="lang-en">indigo &amp; gold, or space + one strong colour</span></td><td><span class="lang-zh">叠用</span><span class="lang-en">both, layered</span></td></tr>
      <tr><td><span class="lang-zh">叙事画面</span><span class="lang-en">Story</span></td><td><span class="lang-zh">气氛</span><span class="lang-en">mood</span></td><td><span class="lang-zh">中到大</span><span class="lang-en">medium–large</span></td><td><span class="lang-zh">焦墨高对比,或彩墨</span><span class="lang-en">burnt-ink contrast or colour ink</span></td><td><span class="lang-zh">择优</span><span class="lang-en">best of two</span></td></tr>
      <tr><td><span class="lang-zh">静赏</span><span class="lang-en">Quiet</span></td><td><span class="lang-zh">气氛</span><span class="lang-en">mood</span></td><td>50–70%</td><td><span class="lang-zh">按季节</span><span class="lang-en">by season</span></td><td><span class="lang-zh">择优</span><span class="lang-en">best of two</span></td></tr>
    </tbody>
  </table></div>
  <div class="duo">
    <figure>{{fig:layered-arch}}<figcaption><b>{{title:layered-arch}}</b> {{desc:layered-arch}}</figcaption></figure>
    <figure>{{fig:poem-jiangxue}}<figcaption><b>{{title:poem-jiangxue}}</b> {{desc:poem-jiangxue}}</figcaption></figure>
  </div>
</div></section>

<section id="taste"><div class="wrap">
  <span class="kicker"><span class="lang-zh">越用越懂你</span><span class="lang-en">It learns your taste</span></span>
  <h2><span class="lang-zh">你挑一张、说一句,它就记住</span><span class="lang-en">Pick one, say a word, and it remembers</span></h2>
  <p class="lede"><span class="lang-zh">口味学习由公共的 <code>design-taste</code> 做,所有设计风格共用。它按场景分开记:技术图爱淡、壁纸爱浓互不干扰;你在铅笔画里说「字太小」,水墨这边也听见;给它一张喜欢的画,它量出留白和设色;每张按口味画的图右下角有一方小印,点开看它为什么这样画。</span><span class="lang-en">Taste learning is the shared <code>design-taste</code>, used by every design style. It keeps scenes apart (faint diagrams and heavy wallpapers do not fight), hears what you said about pencil drawings, measures space and colour from a picture you like, and puts a small seal on every drawing it adjusted — click it to see why.</span></p>
  <div class="duo">
    <figure>{{fig:taste-scenes}}<figcaption><b>{{title:taste-scenes}}</b> {{desc:taste-scenes}}</figcaption></figure>
    <figure>{{fig:taste-cross}}<figcaption><b>{{title:taste-cross}}</b> {{desc:taste-cross}}</figcaption></figure>
  </div>
  <h3 style="margin-top:40px"><span class="lang-zh">自己试一下:挑你喜欢的那张</span><span class="lang-en">Try it: pick the one you like</span></h3>
  <div class="scene-pick" role="group" aria-label="场景" data-label-zh="场景" data-label-en="Scene">
    <button type="button" data-scene="tech" aria-pressed="true"><span class="lang-zh">技术图</span><span class="lang-en">diagrams</span></button>
    <button type="button" data-scene="still" aria-pressed="false"><span class="lang-zh">静赏</span><span class="lang-en">quiet pictures</span></button>
    <button type="button" data-scene="launch" aria-pressed="false"><span class="lang-zh">发布会</span><span class="lang-en">launch</span></button>
  </div>
  <div class="lab">
    <div>
      <p class="q" id="lab-q"></p>
      <div class="ab"><button type="button" id="lab-a" aria-label="A"></button><button type="button" id="lab-b" aria-label="B"></button></div>
      <p style="margin-top:14px"><input id="lab-say" type="text" placeholder="说一句,比如:飞白太多了,字太小" aria-label="说一句你的感受" data-label-zh="说一句你的感受" data-label-en="Say how it feels"></p>
      <button type="button" class="ink-btn" id="lab-say-go"><span class="lang-zh">记下</span><span class="lang-en">Record</span></button>
      <span id="lab-heard" aria-live="polite" style="font-size:14px;margin-left:8px"></span>
    </div>
    <div>
      <h3><span class="lang-zh">这个场景现在的口味</span><span class="lang-en">Current taste for this scene</span></h3>
      <div class="knobs" id="lab-knobs"></div>
      <div id="lab-preview" style="margin-top:12px"></div>
      <div class="log" id="lab-log" aria-live="polite"></div>
      <p style="margin-top:10px"><button type="button" class="ink-btn" id="lab-export"><span class="lang-zh">导出记录</span><span class="lang-en">Export log</span></button> <button type="button" class="ink-btn" id="lab-reset"><span class="lang-zh">清空重来</span><span class="lang-en">Start over</span></button></p>
      <p style="font-size:13px"><span class="lang-zh">记录只存在你自己的浏览器里。导出的文件交给命令行:<code>node skills/design-taste/scripts/taste.mjs --style=inkwash import 文件</code>。</span><span class="lang-en">The log stays in your browser. Hand the export to <code>node skills/design-taste/scripts/taste.mjs --style=inkwash import file</code>.</span></p>
    </div>
  </div>
</div></section>

<section id="figures"><div class="wrap">
  <span class="kicker"><span class="lang-zh">图例</span><span class="lang-en">Figures</span></span>
  <h2><span class="lang-zh">{{count:all}} 张,每张几十行代码</span><span class="lang-en">{{count:all}} figures, a few dozen lines each</span></h2>
  <div class="duo">
    <figure>{{fig:liuhui-pi}}<figcaption><b>{{title:liuhui-pi}}</b> {{desc:liuhui-pi}}</figcaption></figure>
    <figure>{{fig:season-autumn}}<figcaption><b>{{title:season-autumn}}</b> {{desc:season-autumn}}</figcaption></figure>
    <figure>{{fig:web-hero}}<figcaption><b>{{title:web-hero}}</b> {{desc:web-hero}}</figcaption></figure>
    <figure>{{fig:bamboo-duel}}<figcaption><b>{{title:bamboo-duel}}</b> {{desc:bamboo-duel}}</figcaption></figure>
  </div>
  <p class="cta"><a class="ink-btn ink-btn--seal" href="diagrams.html"><span class="lang-zh">全部 {{count:all}} 张</span><span class="lang-en">All {{count:all}}</span></a> <a class="ink-btn" href="compare.html"><span class="lang-zh">代码版和位图择优</span><span class="lang-en">Code vs image model</span></a></p>
</div></section>

<section id="use"><div class="wrap">
  <span class="kicker"><span class="lang-zh">怎么用</span><span class="lang-en">How to use</span></span>
  <h2><span class="lang-zh">对 AI 说「用水墨风画……」</span><span class="lang-en">Tell the AI "paint it in ink wash…"</span></h2>
  <div class="ink-term"><span class="dim"># <span class="lang-zh">装好 sky-skills 后,在对话里直接说</span><span class="lang-en">with sky-skills installed, just say</span></span><br>用水墨风给我画一张微服务的分层架构图<br>用水墨风做一个产品发布会首屏<br><span class="dim"># <span class="lang-zh">画之前按你的口味取参数</span><span class="lang-en">taste-aware parameters before painting</span></span><br>node skills/design-taste/scripts/taste.mjs <span class="key">--style=inkwash --scene=tech</span> suggest</div>
</div></section>
</main>

<footer><div class="wrap">
  <p><span class="lang-zh">skill 在 <code>skills/inkwash-design/</code>;字体:马善政楷书、龙藏体、志莽行书(OFL 1.1),霞鹜文楷,Noto Serif SC。位图由出图模型 gpt-6-astra 生成,提示词记在 <code>references/image-prompts.md</code>。</span><span class="lang-en">The skill lives in <code>skills/inkwash-design/</code>. Fonts: Ma Shan Zheng, Long Cang, Zhi Mang Xing (OFL 1.1), LXGW WenKai, Noto Serif SC. Bitmaps by the gpt-6-astra image model; prompts in <code>references/image-prompts.md</code>.</span></p>
</div></footer>
<script src="../../skills/inkwash-design/assets/brush.js"></script>
<script src="../../skills/inkwash-design/assets/props.js"></script>
<script src="../../skills/design-taste/assets/shared.js"></script>
<script src="../../skills/design-taste/assets/taste-core.js"></script>
<script src="../../skills/design-taste/assets/provenance.js"></script>
<script src="../../skills/inkwash-design/assets/taste-profile.js"></script>
<script src="../../skills/inkwash-design/assets/player.js"></script>
<script>
(function () {
  'use strict';
  // the lab's two little paintings can only show brush knobs, so label size is not asked here
  var T = TasteCore.create(Object.assign({}, InkwashTasteProfile, { abSkip: InkwashTasteProfile.abSkip.concat(['labelSize']) })), KEY = 'inkwash-taste-log', ev = [], scene = 'tech', q = null;
  try { ev = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { ev = []; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(ev)); } catch (e) { /* private mode */ } }
  function lang() { return document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'zh'; }
  // a small painting drawn live with the given brush taste: hill, boat, a label
  function paint(taste, id) {
    var B = Brush.create({ seed: 5, id: id, taste: taste });
    B.at(0, 0.01, function () {
      Props.mountain(B, [[10, 170], [70, 90], [110, 60], [150, 100], [210, 170]], { tone: 'dan', ridge: 'nong', cun: 4 });
      Props.boat(B, 190, 150, 50);
      B.stroke([[20, 186], [120, 182], [230, 188]], { tone: 'nong', width: 9, press: 'zhong', load: 0.75 });
      B.text(240, 60, '水墨', { size: 26, font: 'brush', ink: 'jiao', vertical: true });
    });
    return '<svg viewBox="0 0 280 200" class="ifig" style="display:block"><defs>' + B.defs() + '</defs><rect class="paper" width="280" height="200"/>' +
      '<g class="ink" filter="url(#ink-rough)">' + B.art() + '</g>' + B.labels() + '</svg>';
  }
  function render() {
    var t = T.estimate(ev, null, { scene: scene }); q = T.ab(ev, null, { scene: scene });
    var base = T.apply(t).brush, a = Object.assign({}, base), b = Object.assign({}, base);
    var map = { inkDepth: 'depth', wet: 'wet', dry: 'dry', weight: 'weight' };
    if (map[q.knob]) { a[map[q.knob]] = q.values[0]; b[map[q.knob]] = q.values[1]; }
    document.getElementById('lab-a').innerHTML = paint(a, 'lab-a');
    document.getElementById('lab-b').innerHTML = paint(b, 'lab-b');
    document.getElementById('lab-q').textContent = lang() === 'en' ? 'Only "' + q.label.en + '" differs. Which do you prefer?' : '这一题只改「' + q.label.zh + '」:你更喜欢哪张?';
    var html = '';
    for (var k in T.KNOBS) {
      var K = T.KNOBS[k], v = t.knobs[k], pct = function (x) { return ((x - K.min) / (K.max - K.min) * 100).toFixed(1) + '%'; };
      html += '<div><span>' + (lang() === 'en' ? K.en : K.zh) + '</span><span class="bar"><s style="left:' + pct(K.def) + '"></s><i style="left:' + pct(v) + '"></i></span><span>' + v + '</span></div>';
    }
    document.getElementById('lab-knobs').innerHTML = html;
    var pv = document.getElementById('lab-preview');
    pv.innerHTML = paint(base, 'lab-p');
    TasteProvenance.mark(pv, T.explain(t), { lang: lang(), stamp: T.stampOf(t) });
    document.getElementById('lab-log').innerHTML = ev.slice(-8).reverse().map(function (e) { return e.ts.slice(11, 19) + '  ' + e.kind + '  ' + (e.scene || '-') + '  ' + (e.note || Object.keys(e.knobs || {}).join(',')); }).join('<br>');
  }
  function add(e) { e.ts = new Date().toISOString(); ev.push(T.annotate(e)); save(); render(); }
  document.getElementById('lab-a').addEventListener('click', function () { add(T.pick(q.knob, q.values[0], q.values[1], 'lab', { scene: scene })); });
  document.getElementById('lab-b').addEventListener('click', function () { add(T.pick(q.knob, q.values[1], q.values[0], 'lab', { scene: scene })); });
  document.getElementById('lab-say-go').addEventListener('click', function () {
    var inp = document.getElementById('lab-say'), e = T.say(inp.value, { scene: scene }), heard = document.getElementById('lab-heard');
    if (!Object.keys(e.dir).length && !Object.keys(e.cat).length) { heard.textContent = lang() === 'en' ? 'no words it knows' : '没听出要改什么'; return; }
    heard.textContent = (lang() === 'en' ? 'heard: ' : '听到:') + e.hits.join('、'); inp.value = ''; add(e);
  });
  document.querySelectorAll('[data-scene]').forEach(function (b) {
    b.addEventListener('click', function () {
      scene = b.getAttribute('data-scene');
      document.querySelectorAll('[data-scene]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      render();
    });
  });
  document.getElementById('lab-export').addEventListener('click', function () {
    var blob = new Blob([ev.map(function (e) { return JSON.stringify(e); }).join('\n') + '\n'], { type: 'application/x-ndjson' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'inkwash-taste.jsonl'; a.click();
  });
  document.getElementById('lab-reset').addEventListener('click', function () { ev = []; save(); render(); });
  document.querySelectorAll('[data-lang-toggle]').forEach(function (b) { b.addEventListener('click', function () { setTimeout(render, 0); }); });
  render();
})();
</script>
</body>
</html>
