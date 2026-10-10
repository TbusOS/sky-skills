<!DOCTYPE html>
<html lang="zh-CN" data-lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>inkwash · 短片 — 一笔一画 | sky-skills</title>
<meta name="description" content="inkwash-design 样片「一笔一画」:同一支笔依次画出墨分五色、四种设色、一张技术框图、割圆术、一首诗和一个书法数字;所有画面走同一个时钟,可以拖进度,也能逐帧导出成视频。">
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
    <a href="index.html"><span class="lang-zh">介绍</span><span class="lang-en">About</span></a>
    <a href="index.html#taste"><span class="lang-zh">越用越懂你</span><span class="lang-en">Learns your taste</span></a>
    <a href="diagrams.html"><span class="lang-zh">图例库</span><span class="lang-en">Figures</span></a>
    <a href="compare.html"><span class="lang-zh">择优</span><span class="lang-en">Code vs image</span></a>
    <a href="reel.html" aria-current="page"><span class="lang-zh">短片</span><span class="lang-en">Reel</span></a>
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
<section><div class="wrap">
  <span class="kicker"><span class="lang-zh">短片样片</span><span class="lang-en">Sample reel</span></span>
  <h1><span class="lang-zh">一笔一画</span><span class="lang-en">Stroke by stroke</span></h1>
  <p class="lede"><span class="lang-zh">同一支笔依次画出:墨分五色、同一座山的四种设色、一张技术框图、刘徽割圆术、《江雪》、一个书法数字。所有画面走同一个时钟,拖进度条看任意一刻;<code>scripts/export.mjs</code> 用同一个时钟逐帧截图编成视频。</span><span class="lang-en">One brush paints, in turn: five ink tones, one mountain in four colourings, an architecture diagram, Liu Hui’s circle, "River Snow" and a brush numeral. Everything runs on one clock; scrub to any moment. <code>scripts/export.mjs</code> uses the same clock to export a video frame by frame.</span></p>
  <div class="stage" data-no-autoplay><div class="shot" data-shot="ink-tones" hidden>{{fig:ink-tones}}</div><div class="shot" data-shot="four-palettes" hidden>{{fig:four-palettes}}</div><div class="shot" data-shot="layered-arch" hidden>{{fig:layered-arch}}</div><div class="shot" data-shot="liuhui-pi" hidden>{{fig:liuhui-pi}}</div><div class="shot" data-shot="poem-jiangxue" hidden>{{fig:poem-jiangxue}}</div><div class="shot" data-shot="launch-number" hidden>{{fig:launch-number}}</div></div>
  <div class="scrub">
    <button type="button" class="ink-btn" id="reel-play" aria-pressed="false"><span class="lang-zh">▶ 播放</span><span class="lang-en">▶ Play</span></button>
    <input type="range" id="reel-t" min="0" step="0.05" value="0" aria-label="时间" data-label-zh="时间" data-label-en="Time">
    <output id="reel-out">0.0 s</output>
  </div>
</div></section>
</main>
<script src="../../skills/inkwash-design/assets/player.js"></script>
<script>
(function () {
  'use strict';
  // one clock for the whole reel: global t -> which shot, and that shot's own time
  var shots = [].slice.call(document.querySelectorAll('.shot')), GAP = 1.2, plan = [], total = 0;
  shots.forEach(function (el) { var svg = el.querySelector('svg'), d = Inkwash.duration(svg) + GAP; plan.push({ el: el, svg: svg, t0: total, d: d }); total += d; });
  total = Math.round(total * 100) / 100;
  function seek(t) {
    t = Math.max(0, Math.min(total, t));
    var cur = plan[plan.length - 1];
    for (var i = 0; i < plan.length; i++) if (t < plan[i].t0 + plan[i].d) { cur = plan[i]; break; }
    plan.forEach(function (p) { p.el.hidden = p !== cur; });
    Inkwash.seek(cur.svg, t - cur.t0);
    out.textContent = t.toFixed(1) + ' / ' + total.toFixed(1) + ' s';
    range.value = String(t);
  }
  var range = document.getElementById('reel-t'), out = document.getElementById('reel-out'), btn = document.getElementById('reel-play'), raf = 0;
  range.max = String(total);
  range.addEventListener('input', function () { seek(+range.value); });
  btn.addEventListener('click', function () {
    if (raf) { cancelAnimationFrame(raf); raf = 0; btn.setAttribute('aria-pressed', 'false'); return; }
    var start = performance.now() - (+range.value >= total ? 0 : +range.value) * 1000;
    btn.setAttribute('aria-pressed', 'true');
    (function step(now) { var t = (now - start) / 1000; seek(t); raf = t < total ? requestAnimationFrame(step) : 0; if (!raf) btn.setAttribute('aria-pressed', 'false'); })(performance.now());
  });
  // the export contract (scripts/export.mjs): duration in seconds, seek(t) paints that moment
  window.inkwash = { duration: total, seek: seek };
  seek(total);
})();
</script>
</body>
</html>
