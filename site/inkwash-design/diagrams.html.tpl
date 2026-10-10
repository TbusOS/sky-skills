<!DOCTYPE html>
<html lang="zh-CN" data-lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>inkwash · 图例库 — {{count:all}} 张水墨图例 | sky-skills</title>
<meta name="description" content="inkwash-design 图例库:{{count:all}} 张水墨图例,{{count:motion}} 张会动。笔墨基础、物件、诗词、四季、山水、武侠、影视、壁纸、技术框图、代码、数学、界面、发布会、数据图、越用越懂你;每张都能下载 SVG、看源码。">
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
    <a href="diagrams.html" aria-current="page"><span class="lang-zh">图例库</span><span class="lang-en">Figures</span></a>
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
<section style="padding-bottom:10px"><div class="wrap">
  <span class="kicker"><span class="lang-zh">图例库</span><span class="lang-en">Figure gallery</span></span>
  <h1><span class="lang-zh">{{count:all}} 张水墨图例</span><span class="lang-en">{{count:all}} ink-wash figures</span></h1>
  <p class="lede"><span class="lang-zh">{{count:motion}} 张会动,滚到哪张就画哪张,一支笔一笔一笔画;分 {{count:cats}} 类。每张都是几十行代码:换字、换颜色、换数据比照着画快。手机上图框可以左右拖,图里的字不会缩到看不清。图例是例子,不是模板。</span><span class="lang-en">{{count:motion}} are animated and paint themselves when you scroll to them, one stroke at a time; {{count:cats}} categories. Each is a few dozen lines of code. On a phone drag a figure sideways; labels never shrink below readable. Figures are examples, not templates.</span></p>
</div></section>
<div class="gal-bar"><div class="wrap"><nav class="gal-nav" aria-label="categories">
    {{gallery-nav}}
  </nav></div></div>
<div class="wrap">
{{gallery}}
</div>
</main>
<footer><div class="wrap">
  <p><span class="lang-zh">源码在 <code>skills/inkwash-design/templates/src/</code>,单独的 SVG 在 <code>templates/figures/</code>(跟随系统深浅色)。重新生成:<code>node skills/inkwash-design/scripts/build.mjs</code>。</span><span class="lang-en">Sources in <code>skills/inkwash-design/templates/src/</code>, standalone SVGs in <code>templates/figures/</code>. Rebuild: <code>node skills/inkwash-design/scripts/build.mjs</code>.</span></p>
</div></footer>
<script src="../../skills/inkwash-design/assets/player.js"></script>
</body>
</html>
