<!DOCTYPE html>
<html lang="zh-CN" data-lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>graphite · 图例库 — {{count:all}} 张手绘图例 | sky-skills</title>
<meta name="description" content="graphite-design 图例库:{{count:all}} 张铅笔手绘图例,{{count:motion}} 张会动。角色、场景、电影画风、框图、流程图、代码讲解、数学算法、数据图、标注;每张都能下载 SVG、看源码。">
<script>try{var t=localStorage.getItem('graphite-theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}</script>
<link rel="stylesheet" href="../../skills/graphite-design/assets/fonts.css">
<link rel="stylesheet" href="../../skills/graphite-design/assets/graphite.css">
<link rel="stylesheet" href="pages.css">
</head>
<body class="g-page">
{{filters}}
<header class="top"><div class="wrap top-in">
  <a class="brand" href="index.html">graphite<span>石墨</span></a>
  <nav aria-label="graphite">
    <a href="index.html"><span class="lang-zh">介绍</span><span class="lang-en">About</span></a>
    <a href="index.html#taste"><span class="lang-zh">越用越懂你</span><span class="lang-en">Learns your taste</span></a>
    <a href="diagrams.html" aria-current="page"><span class="lang-zh">图例库</span><span class="lang-en">Figures</span></a>
    <a href="assets.html"><span class="lang-zh">素材</span><span class="lang-en">Assets</span></a>
    <a href="reel.html"><span class="lang-zh">短片样片</span><span class="lang-en">Sample reel</span></a>
    <a href="../../index.html"><span class="lang-zh">全部 skill</span><span class="lang-en">All skills</span></a>
  </nav>
  <div class="tools">
    <button type="button" data-lang-toggle="zh" aria-pressed="true">中文</button>
    <button type="button" data-lang-toggle="en" aria-pressed="false">EN</button>
    <button type="button" data-theme-toggle aria-pressed="false" aria-label="深色 / 浅色" data-label-zh="深色 / 浅色" data-label-en="Dark / light">☾</button>
  </div>
</div></header>
<main>
<section style="padding-bottom:10px"><div class="wrap">
  <span class="kicker"><span class="lang-zh">图例库</span><span class="lang-en">Figure gallery</span></span>
  <h1><span class="lang-zh">{{count:all}} 张手绘图例</span><span class="lang-en">{{count:all}} hand-drawn figures</span></h1>
  <p class="lede"><span class="lang-zh">{{count:motion}} 张会动,滚到哪张就画哪张;其余 {{count:static}} 张按「看它怎么画」也能一笔一笔重画。每张都是几十行代码,拿去改比照着画快:换字、换颜色、换数据。手机上图框可以左右拖,图里的字不会缩到看不清。</span><span class="lang-en">{{count:motion}} are animated and draw when you scroll to them; the other {{count:static}} redraw stroke by stroke on "Watch it drawn". Each is a few dozen lines of code: changing words, colours or data beats redrawing. On a phone, drag a figure sideways; its labels never shrink below readable.</span></p>
</div></section>
<div class="gal-bar"><div class="wrap"><nav class="gal-nav" aria-label="categories">
    {{gallery-nav}}
  </nav></div></div>
<div class="wrap">
{{gallery}}
</div>
</main>
<footer><div class="wrap">
  <p><span class="lang-zh">图例源码在 <code>skills/graphite-design/templates/src/</code>,单独的 SVG 在 <code>templates/figures/</code>(跟随系统深浅色)。重新生成:<code>node skills/graphite-design/scripts/build.mjs</code>。</span><span class="lang-en">Sources in <code>skills/graphite-design/templates/src/</code>, standalone SVGs in <code>templates/figures/</code> (they follow the system light/dark setting). Rebuild: <code>node skills/graphite-design/scripts/build.mjs</code>.</span></p>
</div></footer>
<script src="../../skills/graphite-design/assets/player.js"></script>
</body>
</html>
