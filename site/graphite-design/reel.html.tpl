<!DOCTYPE html>
<html lang="zh-CN" data-lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>graphite · 短片样片 — 33 秒,位图当舞台,代码画会动的部分 | sky-skills</title>
<meta name="description" content="graphite-design 短片样片:四个镜头加片尾共 33 秒。出图模型画的画面加镜头运动,代码画的图在上面一笔一笔画出来;同一条时间线,能拖、能逐帧导出成 MP4。">
<script>try{var t=localStorage.getItem('graphite-theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}if(/[?&]export=1/.test(location.search))document.documentElement.classList.add('export')</script>
<link rel="stylesheet" href="../../skills/graphite-design/assets/fonts.css">
<link rel="stylesheet" href="../../skills/graphite-design/assets/graphite.css">
<link rel="stylesheet" href="pages.css">
<style>
/* the film always uses the light paper look; the page around it follows the theme */
.stage { --g-paper: #f6efe2; --g-card: #fbf7ee; --g-line: #39332c; --g-ink: #1e1a15; --g-ink-2: #574e43; }
.stage .shot.paper { background: #f6efe2; }
.cam { position: absolute; inset: 0; transform-origin: 50% 50%; will-change: transform; }
.export body > *:not(main) { display: none; }
.export main > *:not(#film) { display: none; }
.export #film { padding: 0; }
.export #film .wrap > *:not(.stage) { display: none; }
.export .stage { position: fixed; inset: 0; border-radius: 0; z-index: 100; }
</style>
</head>
<body class="g-page">
{{filters}}
<header class="top"><div class="wrap top-in">
  <a class="brand" href="index.html">graphite<span>石墨</span></a>
  <nav aria-label="graphite">
    <a href="index.html"><span class="lang-zh">介绍</span><span class="lang-en">About</span></a>
    <a href="diagrams.html"><span class="lang-zh">图例库</span><span class="lang-en">Figures</span></a>
    <a href="assets.html"><span class="lang-zh">素材</span><span class="lang-en">Assets</span></a>
    <a href="reel.html" aria-current="page"><span class="lang-zh">短片样片</span><span class="lang-en">Sample reel</span></a>
    <a href="../../index.html"><span class="lang-zh">全部 skill</span><span class="lang-en">All skills</span></a>
  </nav>
  <div class="tools">
    <button type="button" data-lang-toggle="zh" aria-pressed="true">中文</button>
    <button type="button" data-lang-toggle="en" aria-pressed="false">EN</button>
    <button type="button" data-theme-toggle aria-pressed="false" aria-label="深色 / 浅色" data-label-zh="深色 / 浅色" data-label-en="Dark / light">☾</button>
  </div>
</div></header>
<main>
<section id="film" style="padding-top:30px"><div class="wrap">
  <span class="kicker"><span class="lang-zh">短片样片 · 33 秒</span><span class="lang-en">Sample reel · 33 seconds</span></span>
  <h1><span class="lang-zh">位图当舞台,代码画会动的部分</span><span class="lang-en">Bitmaps are the stage; code draws what moves</span></h1>
  <p class="lede"><span class="lang-zh">四个镜头加片尾。画面是出图模型画的,镜头推拉、圈红灯、代码讲解和片尾手写字是代码画的。整段挂在一条时间线上:拖进度条看任何一秒,导出视频时逐帧取同样的画面。</span><span class="lang-en">Four shots and an end card. The image model drew the scenes; the camera moves, the ring around the red light, the code explainer and the hand-lettered title are code. All of it hangs on one timeline: drag to any second, and a video export takes the same pictures frame by frame.</span></p>
  <div class="stage" id="stage" role="img" aria-label="短片:白板前的机器人、夜里巡检机房、一个一个检查箱子、黄昏屋顶" data-label-zh="短片:白板前的机器人、夜里巡检机房、一个一个检查箱子、黄昏屋顶" data-label-en="Reel: the robot at the whiteboard, a night round in the server room, checking boxes one by one, a rooftop at dusk">
    <div class="shot" id="s1"><div class="cam"><img src="media/hero.webp" width="1672" height="941" alt=""><div class="over" style="left:41.9%;top:25%;width:39.5%">{{fig:hero-board|shrink}}</div></div></div>
    <div class="shot letterbox" id="s2"><div class="cam" style="transform-origin:69.5% 40.6%"><img src="media/cinema-server.webp" width="1916" height="821" alt=""><div class="over" style="left:59.5%;top:29.2%;width:20%">{{fig:reel-ring|shrink}}</div></div></div>
    <div class="shot paper" id="s3">{{fig:code-for-loop|shrink}}</div>
    <div class="shot letterbox" id="s4"><div class="cam"><img src="media/cinema-roof.webp" width="1916" height="821" alt=""></div></div>
    <div class="shot" id="s5"><div class="endcard"><div style="width:min(70%,640px)">{{fig:reel-title|shrink}}</div></div></div>
    <div class="reel-sub" id="sub" aria-live="off"></div>
  </div>
  <div class="reel-ctl">
    <button type="button" class="g-btn g-btn--small" id="play" aria-pressed="false"><span class="lang-zh">▶ 播放</span><span class="lang-en">▶ Play</span></button>
    <input type="range" id="scrub" min="0" max="33" step="0.04" value="0" aria-label="时间" data-label-zh="时间" data-label-en="time">
    <output id="clock">0.0 / 33.0 s</output>
  </div>
  <p class="cap"><span class="lang-zh">做成视频:<code>node skills/graphite-design/scripts/export.mjs video "demos/graphite-design/reel.html?export=1" reel.mp4 --size=1280x720 --fps=30</code>。下面就是这条命令导出的成片。</span><span class="lang-en">To video: <code>node skills/graphite-design/scripts/export.mjs video "demos/graphite-design/reel.html?export=1" reel.mp4 --size=1280x720 --fps=30</code>. Below is what that command produced.</span></p>
  <video src="media/reel.mp4" controls preload="none" poster="media/reel-poster.webp" width="1280" height="720"></video>
</div></section>

<section class="band"><div class="wrap">
  <h2><span class="lang-zh">怎么搭的</span><span class="lang-en">How it is built</span></h2>
  <ol class="rules">
    <li><b><span class="lang-zh">一个函数决定每一秒。</span><span class="lang-en">One function decides every second.</span></b> <span class="lang-zh"><code>render(t)</code> 算出每个镜头的透明度、镜头缩放和平移,再把镜头里的图拨到它自己的时间(镜头开始后过了多久)。播放、拖动、导出都只调它。</span><span class="lang-en"><code>render(t)</code> works out each shot's opacity, zoom and pan, then sets the figures inside to their own time (seconds since the shot began). Play, scrub and export all just call it.</span></li>
    <li><b><span class="lang-zh">镜头运动只用缩放和平移。</span><span class="lang-en">Camera moves are zoom and pan.</span></b> <span class="lang-zh">第二镜朝红灯推近 12%,第四镜往左平移;叠在画面上的圈和画面在同一个容器里,一起被推近。</span><span class="lang-en">Shot two pushes 12% towards the red light; shot four pans left. The ring sits in the same box as the picture, so it moves with the camera.</span></li>
    <li><b><span class="lang-zh">字幕不跟镜头走。</span><span class="lang-en">Subtitles stay put.</span></b> <span class="lang-zh">字幕条在所有镜头上面一层,镜头怎么推,字都在同一个位置。</span><span class="lang-en">The subtitle bar sits above every shot; however the camera moves, the words stay in place.</span></li>
    <li><b><span class="lang-zh">代码讲解那一镜快放了 1.25 倍。</span><span class="lang-en">The code shot runs at 1.25×.</span></b> <span class="lang-zh">图例本身 13 秒,镜头只有 10.5 秒:把时间乘 1.25 拨进去就行,不用改图。</span><span class="lang-en">The figure is 13 s long and the shot 10.5 s: multiply the time by 1.25 when setting it; the figure itself is untouched.</span></li>
  </ol>
</div></section>
</main>
<footer><div class="wrap"><p><span class="lang-zh">画面:gpt-6-astra(Codex CLI);代码图:graphite-design 图例 <code>code-for-loop</code>;手写字:霞鹜文楷。</span><span class="lang-en">Pictures: gpt-6-astra (Codex CLI); code figure: graphite-design <code>code-for-loop</code>; lettering: LXGW WenKai.</span></p></div></footer>
<script src="../../skills/graphite-design/assets/player.js"></script>
<script>
(function () {
  'use strict';
  var D = 33, FADE = 0.6;
  // [start, end, element, figure inside, time inside = f(t), camera(t) -> transform]
  function q(id) { return document.getElementById(id); }
  var ease = function (x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
  var shots = [
    { el: q('s1'), a: 0, b: 7, fig: 'hero-board', local: function (t) { return t - 0.4; }, cam: function (p) { return 'scale(' + (1 + 0.06 * p) + ')'; } },
    { el: q('s2'), a: 7, b: 13.5, fig: 'reel-ring', local: function (t) { return t - 10; }, cam: function (p) { return 'scale(' + (1 + 0.12 * ease(p)) + ')'; } },
    { el: q('s3'), a: 13.5, b: 24, fig: 'code-for-loop', local: function (t) { return (t - 13.5) * 1.25; }, cam: null },
    { el: q('s4'), a: 24, b: 30, fig: null, local: null, cam: function (p) { return 'scale(1.1) translateX(' + (3.5 - 7 * p).toFixed(3) + '%)'; } },
    { el: q('s5'), a: 30, b: 33.01, fig: 'reel-title', local: function (t) { return t - 30.3; }, cam: null }
  ];
  var subs = [
    [0.6, 6.6, '白板前,小机器人拿起了笔。', 'At the whiteboard, the little robot picks up a pen.'],
    [7.3, 10.2, '半夜,它去机房巡检。', 'Midnight. It walks the server room.'],
    [10.2, 13.3, '有一台机柜亮着红灯。', 'One rack shows a red light.'],
    [13.9, 23.6, '它一个一个查过去,左边亮着的那行代码,就是它此刻在做的事。', 'It checks them one by one; the lit line of code is what it is doing right now.'],
    [24.4, 29.7, '天亮之前,活干完了。', 'Before dawn, the work is done.']
  ];
  function figOf(id, el) { return el.querySelector('svg[data-fig="' + id + '"]'); }
  function render(t) {
    t = Math.max(0, Math.min(D, t));
    shots.forEach(function (s) {
      var op = Math.min(ease((t - s.a) / FADE + 1), ease((s.b - t) / FADE + 1));
      s.el.style.opacity = String(Math.max(0, Math.min(1, op)));
      var cam = s.el.querySelector('.cam');
      if (cam && s.cam) cam.style.transform = s.cam((t - s.a) / (s.b - s.a));
      if (s.fig) { var svg = figOf(s.fig, s.el); if (svg) Graphite.seek(svg, Math.max(0, s.local(t))); }
    });
    var en = document.documentElement.getAttribute('data-lang') === 'en', line = '';
    subs.forEach(function (x) { if (t >= x[0] && t < x[1]) line = en ? x[3] : x[2]; });
    q('sub').textContent = line;
    q('sub').style.opacity = line ? '1' : '0';
    q('scrub').value = String(t);
    q('clock').textContent = t.toFixed(1) + ' / ' + D.toFixed(1) + ' s';
    cur = t;
  }
  var cur = 0, raf = 0, t0 = 0;
  function stop() { cancelAnimationFrame(raf); raf = 0; q('play').setAttribute('aria-pressed', 'false'); }
  function play() {
    if (cur >= D) cur = 0;
    t0 = performance.now() - cur * 1000; q('play').setAttribute('aria-pressed', 'true');
    (function step(now) { render((now - t0) / 1000); raf = cur < D ? requestAnimationFrame(step) : 0; if (!raf) stop(); })(performance.now());
  }
  q('play').addEventListener('click', function () { if (raf) stop(); else play(); });
  q('scrub').addEventListener('input', function () { stop(); render(+q('scrub').value); });
  document.querySelectorAll('[data-lang-toggle]').forEach(function (b) { b.addEventListener('click', function () { setTimeout(function () { render(cur); }, 0); }); });
  window.graphite = { duration: D, seek: render };
  var m = /[?&]t=([\d.]+)/.exec(location.search);
  render(m ? +m[1] : 0);
})();
</script>
</body>
</html>
