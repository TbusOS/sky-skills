<!DOCTYPE html>
<html lang="zh-CN" data-lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>inkwash · 择优 — 代码画与出图模型各画一版 | sky-skills</title>
<meta name="description" content="inkwash-design 择优录取:同一题目,代码画一版会动的、出图模型出一版位图,并排比较,写明选哪个、为什么。">
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
    <a href="compare.html" aria-current="page"><span class="lang-zh">择优</span><span class="lang-en">Code vs image</span></a>
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
<section><div class="wrap">
  <span class="kicker"><span class="lang-zh">谁来画:择优录取</span><span class="lang-en">Who paints: best of two</span></span>
  <h1><span class="lang-zh">同一题,两边各画一版</span><span class="lang-en">Same subject, two painters</span></h1>
  <p class="lede"><span class="lang-zh">字、数、连线要准的图一律代码画。艺术类画面让代码和出图模型各画一版,按四条选:五样都在没有、场景目标达到没有、动起来好不好看、能不能换主题和语言。结果:位图赢在质感,代码赢在要逐字写出的诗、要准的片名、会动的钟声和刀光 —— 所以多数题最好是叠用,位图打底,代码写字、盖印、加动画。红框是选中的那一版。</span><span class="lang-en">Anything with exact words, numbers or lines is code. For pictures, code and the image model each paint one, judged on four things: all five fixed elements present, the scene’s goal met, how it moves, whether it can switch theme and language. The bitmaps win on texture; code wins on poems written character by character, exact titles and moving bells and blades — so most subjects are best layered: bitmap underneath, code writes, stamps and animates. The red frame marks the pick.</span></p>
  <div class="cmp">
    <h3 class="ink-brush">{{title:poem-jiangxue}}</h3>
    <div class="side"><span><span class="lang-zh">出图模型 gpt-6-astra</span><span class="lang-en">Image model gpt-6-astra</span></span><img class="pick" src="media/jiangxue.webp" width="1536" height="864" loading="lazy" alt="出图模型画的同一题" data-label-zh="出图模型画的同一题" data-label-en="The image model’s version"></div>
    <div class="side"><span><span class="lang-zh">代码画,会动</span><span class="lang-en">Code, animated</span></span><div class="pick">{{fig:poem-jiangxue}}</div></div>
    <p class="why"><b><span class="lang-zh">选:叠用</span><span class="lang-en">Pick: layered</span></b> <span class="lang-zh">位图的雪山、寒江质感代码画不出;可诗要一字一字写出来、雪要一直落,这只有代码能做。做法:位图打底,代码只写诗、盖印、落雪。</span><span class="lang-en">The bitmap has snow and cold water code cannot paint; but the poem must be written character by character and the snow keep falling, which only code does. So: bitmap underneath, code writes the poem, stamps the seal, drops the snow.</span></p>
  </div>
  <div class="cmp">
    <h3 class="ink-brush">{{title:poem-fengqiao}}</h3>
    <div class="side"><span><span class="lang-zh">出图模型 gpt-6-astra</span><span class="lang-en">Image model gpt-6-astra</span></span><img class="pick" src="media/fengqiao-night.webp" width="1672" height="941" loading="lazy" alt="出图模型画的同一题" data-label-zh="出图模型画的同一题" data-label-en="The image model’s version"></div>
    <div class="side"><span><span class="lang-zh">代码画,会动</span><span class="lang-en">Code, animated</span></span><div class="">{{fig:poem-fengqiao}}</div></div>
    <p class="why"><b><span class="lang-zh">选:位图</span><span class="lang-en">Pick: image</span></b> <span class="lang-zh">位图的石桥倒影和灯火层次丰富得多;代码版的强项(钟声一圈圈荡开)可以叠在它上面。静态用位图,要动时叠代码的钟声。</span><span class="lang-en">The bitmap’s bridge, reflections and lanterns are far richer; the code version’s strength — the bell ringing out in circles — can sit on top of it.</span></p>
  </div>
  <div class="cmp">
    <h3 class="ink-brush">{{title:season-spring}}</h3>
    <div class="side"><span><span class="lang-zh">出图模型 gpt-6-astra</span><span class="lang-en">Image model gpt-6-astra</span></span><img class="pick" src="media/spring-peach.webp" width="1536" height="864" loading="lazy" alt="出图模型画的同一题" data-label-zh="出图模型画的同一题" data-label-en="The image model’s version"></div>
    <div class="side"><span><span class="lang-zh">代码画,会动</span><span class="lang-en">Code, animated</span></span><div class="">{{fig:season-spring}}</div></div>
    <p class="why"><b><span class="lang-zh">选:位图</span><span class="lang-en">Pick: image</span></b> <span class="lang-zh">没骨桃花的颜色过渡、燕子的姿态,位图明显更好;这一题不需要逐笔动,选位图。</span><span class="lang-en">The boneless peach blossom’s colour and the swallows are clearly better as a bitmap; nothing here needs to be painted stroke by stroke.</span></p>
  </div>
  <div class="cmp">
    <h3 class="ink-brush">{{title:season-autumn}}</h3>
    <div class="side"><span><span class="lang-zh">出图模型 gpt-6-astra</span><span class="lang-en">Image model gpt-6-astra</span></span><img class="pick" src="media/autumn-maple.webp" width="1672" height="941" loading="lazy" alt="出图模型画的同一题" data-label-zh="出图模型画的同一题" data-label-en="The image model’s version"></div>
    <div class="side"><span><span class="lang-zh">代码画,会动</span><span class="lang-en">Code, animated</span></span><div class="">{{fig:season-autumn}}</div></div>
    <p class="why"><b><span class="lang-zh">选:位图</span><span class="lang-en">Pick: image</span></b> <span class="lang-zh">浅绛的山石、枫叶层次位图更好;代码版的雁阵会飞,适合做动图版本。</span><span class="lang-en">The bitmap’s ochre hills and maples have more depth; the code version’s flying geese suit an animated version.</span></p>
  </div>
  <div class="cmp">
    <h3 class="ink-brush">{{title:bamboo-duel}}</h3>
    <div class="side"><span><span class="lang-zh">出图模型 gpt-6-astra</span><span class="lang-en">Image model gpt-6-astra</span></span><img class="pick" src="media/bamboo-duel.webp" width="1536" height="864" loading="lazy" alt="出图模型画的同一题" data-label-zh="出图模型画的同一题" data-label-en="The image model’s version"></div>
    <div class="side"><span><span class="lang-zh">代码画,会动</span><span class="lang-en">Code, animated</span></span><div class="">{{fig:bamboo-duel}}</div></div>
    <p class="why"><b><span class="lang-zh">选:位图</span><span class="lang-en">Pick: image</span></b> <span class="lang-zh">泼墨竹林和人物动态,位图完胜;代码版的「一剑」飞白适合做短视频开场的那一下。</span><span class="lang-en">Splashed bamboo and figures in motion: the bitmap wins; the code version’s single dry-brush cut works as the opening beat of a short video.</span></p>
  </div>
  <div class="cmp">
    <h3 class="ink-brush">{{title:wall-desktop}}</h3>
    <div class="side"><span><span class="lang-zh">出图模型 gpt-6-astra</span><span class="lang-en">Image model gpt-6-astra</span></span><img class="pick" src="media/wall-desktop.webp" width="1536" height="960" loading="lazy" alt="出图模型画的同一题" data-label-zh="出图模型画的同一题" data-label-en="The image model’s version"></div>
    <div class="side"><span><span class="lang-zh">代码画,会动</span><span class="lang-en">Code, animated</span></span><div class="">{{fig:wall-desktop}}</div></div>
    <p class="why"><b><span class="lang-zh">选:位图</span><span class="lang-en">Pick: image</span></b> <span class="lang-zh">青绿山水的颜色厚度只有位图有;左上留白也符合要求。做动态壁纸时叠代码的雾。</span><span class="lang-en">Only the bitmap has the depth of blue-green colour, and the upper left stays empty as required; for a moving wallpaper add the code mist.</span></p>
  </div>
  <div class="cmp">
    <h3 class="ink-brush">{{title:launch-splash}}</h3>
    <div class="side"><span><span class="lang-zh">出图模型 gpt-6-astra</span><span class="lang-en">Image model gpt-6-astra</span></span><img class="pick" src="media/launch-splash.webp" width="1536" height="864" loading="lazy" alt="出图模型画的同一题" data-label-zh="出图模型画的同一题" data-label-en="The image model’s version"></div>
    <div class="side"><span><span class="lang-zh">代码画,会动</span><span class="lang-en">Code, animated</span></span><div class="pick">{{fig:launch-splash}}</div></div>
    <p class="why"><b><span class="lang-zh">选:叠用</span><span class="lang-en">Pick: layered</span></b> <span class="lang-zh">泥金泼墨的飞溅质感用位图;产品名必须一字不错、要一笔写出,用代码。</span><span class="lang-en">Use the bitmap for the gold splash texture; the product name must be exactly right and written in one go, so code.</span></p>
  </div>
  <div class="cmp">
    <h3 class="ink-brush">{{title:drama-cover}}</h3>
    <div class="side"><span><span class="lang-zh">出图模型 gpt-6-astra</span><span class="lang-en">Image model gpt-6-astra</span></span><img class="pick" src="media/drama-cover.webp" width="864" height="1536" loading="lazy" alt="出图模型画的同一题" data-label-zh="出图模型画的同一题" data-label-en="The image model’s version"></div>
    <div class="side"><span><span class="lang-zh">代码画,会动</span><span class="lang-en">Code, animated</span></span><div class="pick">{{fig:drama-cover}}</div></div>
    <p class="why"><b><span class="lang-zh">选:叠用</span><span class="lang-en">Pick: layered</span></b> <span class="lang-zh">人物和雨用位图;片名、安全区、按钮位置必须准,用代码叠在上面。</span><span class="lang-en">The figure and rain from the bitmap; the title, safe areas and button zones must be exact, so code on top.</span></p>
  </div>
</div></section>
</main>
<footer><div class="wrap">
  <p><span class="lang-zh">位图 2026-10-11 由 <code>codex exec -m gpt-6-astra</code> 生成,每题只出了一次;提示词原文和落选理由在 <code>skills/inkwash-design/references/image-prompts.md</code>。</span><span class="lang-en">Bitmaps generated 2026-10-11 with <code>codex exec -m gpt-6-astra</code>, one attempt per subject; prompts and reasons in <code>skills/inkwash-design/references/image-prompts.md</code>.</span></p>
</div></footer>
<script src="../../skills/inkwash-design/assets/player.js"></script>
</body>
</html>
