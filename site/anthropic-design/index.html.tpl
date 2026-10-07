<!doctype html>
<!-- 由 site/anthropic-design/build.py 生成,别手改;改模板 site/anthropic-design/index.html.tpl 后重跑 -->
<html lang="en" data-lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>anthropic-design — only the colour is fixed</title>
<meta name="description" content="A Claude Code skill for explainer pages and long editorial reads: the anthropic palette is fixed, layout, type and motion are left to the content. A palette lab with computed contrast, a diagram library you pick from by content, and five checks for defects, none for taste.">
<meta name="theme-color" content="#faf9f5">
<link rel="stylesheet" href="../../skills/anthropic-design/assets/fonts.css">
<link rel="stylesheet" href="../../skills/anthropic-design/assets/fonts-cjk.css">
<script>(function(){var h=document.documentElement,l='en';h.classList.add('js');try{var s=localStorage.getItem('sky-lang');l=(s==='zh'||s==='en')?s:((navigator.language||'').toLowerCase().indexOf('zh')===0?'zh':'en');}catch(e){}h.setAttribute('data-lang',l);h.lang=l==='zh'?'zh-CN':'en';})();</script>
<style>
/* ── tokens: the fixed table from SKILL.md §1, nothing else is fixed ── */
:root {
  color-scheme: light;
  --paper: #faf9f5; --paper-2: #f0ede3; --card: #ffffff; --line: #e8e6dc; --line-2: #d9d6cb;
  --ink: #141413; --mute: #5e5d55;
  --orange: #d97757; --orange-2: #c56544; --orange-ink: #a8502f;
  --blue: #6a9bcc; --olive: #788c5d; --gold: #c9913f; --grey: #b0aea5; --danger: #a14238;
  --blue-ink: color-mix(in srgb, var(--blue) 62%, var(--ink));
  --olive-ink: color-mix(in srgb, var(--olive) 62%, var(--ink));
  --gold-ink: color-mix(in srgb, var(--gold) 62%, var(--ink));
  --danger-ink: var(--danger);
  --dark: #1c1b18; --dark-bar: #2a2925; --dark-ink: #ece9df; --dark-mute: #b4b0a3;
  --d-red: #ec9488; --d-gold: #dcb062; --d-green: #a9bf8f;
  --serif: "Lora", "Noto Serif SC", Georgia, "Songti SC", serif;
  --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Poppins", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
  --mono: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, "Noto Sans SC", monospace;
  --wrap: 1200px; --gutter: clamp(16px, 4vw, 40px);
  --ease: cubic-bezier(.65, 0, .2, 1);
}
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--paper); color: var(--ink); font: 17px/1.7 var(--sans); -webkit-font-smoothing: antialiased; }
html[data-lang="en"] .lang-zh { display: none !important; }
html[data-lang="zh"] .lang-en { display: none !important; }
img, svg { max-width: 100%; }
a { color: var(--orange-ink); text-underline-offset: 3px; text-decoration-thickness: 1px; }
a:hover { text-decoration-thickness: 2px; }
code, kbd { font-family: var(--mono); font-size: .86em; background: var(--paper-2); border: 1px solid var(--line); border-radius: 5px; padding: .05em .35em; }
:focus-visible { outline: 2px solid var(--orange-ink); outline-offset: 3px; border-radius: 4px; }
.wrap { max-width: var(--wrap); margin: 0 auto; padding: 0 var(--gutter); }
.mono { font-family: var(--mono); }
h1, h2, h3 { font-family: var(--serif); font-weight: 500; letter-spacing: -.012em; line-height: 1.15; margin: 0; }
html[data-lang="zh"] h1, html[data-lang="zh"] h2, html[data-lang="zh"] h3 { letter-spacing: 0; line-height: 1.3; }
h2 { font-size: clamp(30px, 4.2vw, 48px); max-width: 20ch; }
html[data-lang="zh"] h2 { max-width: 18em; }
h3 { font-size: 22px; }
p { margin: 0; }

/* ── the printer's colour bar: the fixed table, as a strip ── */
.strip { display: flex; height: 10px; }
.strip i { flex: 1; }
.strip.thin { height: 4px; }

/* ── header ── */
.top { position: sticky; top: 0; z-index: 20; background: color-mix(in srgb, var(--paper) 92%, transparent); backdrop-filter: saturate(1.2) blur(8px); border-bottom: 1px solid var(--line); }
.top-in { display: flex; align-items: center; gap: 18px; height: 56px; }
.crumb { font-family: var(--mono); font-size: 13px; color: var(--mute); text-decoration: none; }
.crumb:hover { color: var(--ink); }
.here { font-family: var(--mono); font-size: 13px; font-weight: 500; }
.sep { color: var(--line-2); }
.nav { display: flex; gap: 2px; margin-left: auto; }
.nav a { font-size: 14px; color: var(--mute); text-decoration: none; padding: 6px 10px; border-radius: 999px; }
.nav a:hover { background: var(--paper-2); color: var(--ink); }
.lang { font: 500 13px var(--mono); border: 1px solid var(--line-2); background: var(--card); color: var(--ink); border-radius: 999px; padding: 6px 12px; cursor: pointer; }
.lang:hover { border-color: var(--ink); }
@media (max-width: 980px) { .nav { display: none; } .lang { margin-left: auto; } }

/* ── section frame ── */
.sec { padding: clamp(72px, 9vw, 128px) 0; position: relative; }
.sec.band { background: var(--paper-2); }
.sec-head { display: grid; grid-template-columns: minmax(0, 1fr); gap: 18px; margin-bottom: clamp(36px, 5vw, 56px); }
.kicker { display: inline-flex; align-items: center; gap: 10px; font: 500 12.5px/1 var(--mono); letter-spacing: .1em; text-transform: uppercase; color: var(--mute); }
.kicker i { width: 14px; height: 14px; border-radius: 3px; background: var(--k, var(--orange)); display: inline-block; }
html[data-lang="zh"] .kicker { letter-spacing: .06em; }
.lede { font-size: 19px; line-height: 1.7; color: var(--mute); max-width: 64ch; }
html[data-lang="zh"] .lede { max-width: 40em; }
.lede strong { color: var(--ink); font-weight: 600; }
.note { font-size: 14px; color: var(--mute); }
.illus { font: italic 13.5px/1.5 var(--serif); color: var(--mute); }

/* reveal: only the script turns it on, and only when motion is allowed */
html.rv-on .rv { opacity: 0; transform: translateY(18px); transition: opacity .8s var(--ease), transform .8s var(--ease); }
html.rv-on .rv.in { opacity: 1; transform: none; }

/* ── 00 hero ── */
.hero { position: relative; padding: clamp(48px, 7vw, 96px) 0 clamp(64px, 8vw, 112px); overflow: hidden; }
.hero-grid { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: clamp(24px, 4vw, 64px); align-items: center; }
.hero h1 { font-size: clamp(46px, 7.4vw, 92px); line-height: 1.02; letter-spacing: -.025em; margin: 22px 0 26px; }
html[data-lang="zh"] .hero h1 { line-height: 1.18; letter-spacing: 0; font-size: clamp(40px, 6.2vw, 72px); }
.hero h1 em { font-style: italic; color: var(--orange-2); }
html[data-lang="zh"] .hero h1 em { font-style: normal; }
.hero .lede { font-size: 19.5px; color: var(--ink); opacity: .86; }
.cta { display: flex; flex-wrap: wrap; gap: 12px; margin: 32px 0 14px; }
.btn { display: inline-flex; align-items: center; gap: 8px; font: 600 16px/1 var(--sans); padding: 15px 22px; border-radius: 999px; text-decoration: none; background: var(--orange); color: var(--ink); border: 1.5px solid var(--orange); transition: transform .2s, box-shadow .2s; }
.btn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px -8px rgba(168, 80, 47, .55); text-decoration: none; }
.btn.ghost { background: transparent; border-color: var(--ink); }
.btn-note { font-size: 13.5px; color: var(--mute); max-width: 46ch; }
.btn-note b { font-family: var(--mono); font-weight: 500; color: var(--ink); }
.crop { position: absolute; width: 22px; height: 22px; border-color: var(--line-2); border-style: solid; border-width: 0; pointer-events: none; }
.crop.tl { top: 18px; left: 18px; border-top-width: 1px; border-left-width: 1px; }
.crop.tr { top: 18px; right: 18px; border-top-width: 1px; border-right-width: 1px; }
.crop.bl { bottom: 18px; left: 18px; border-bottom-width: 1px; border-left-width: 1px; }
.crop.br { bottom: 18px; right: 18px; border-bottom-width: 1px; border-right-width: 1px; }
.reg { position: absolute; right: 52px; top: 50px; width: 26px; height: 26px; border: 1px solid var(--line-2); border-radius: 50%; pointer-events: none; }
.reg::before, .reg::after { content: ""; position: absolute; background: var(--line-2); }
.reg::before { left: 50%; top: -6px; bottom: -6px; width: 1px; }
.reg::after { top: 50%; left: -6px; right: -6px; height: 1px; }

/* the fan deck */
.fan-fig { margin: 0; display: grid; justify-items: center; gap: 18px; }
.fan { position: relative; width: 100%; max-width: 560px; height: 344px; --cw: 104px; --ch: 236px; --s: 7.2deg; --b: 78px; }
.chip { position: absolute; left: calc(50% - var(--cw) / 2); bottom: var(--b); width: var(--cw); height: var(--ch); padding: 0; border: 1px solid rgba(20, 20, 19, .14); border-radius: 10px; background: linear-gradient(180deg, rgba(255, 255, 255, .10), rgba(0, 0, 0, .05)), var(--c); cursor: pointer; transform-origin: 50% 200%; transform: rotate(calc(var(--k) * var(--s))); transition: transform 1s var(--ease) calc(var(--i) * 45ms), box-shadow .25s; box-shadow: 0 1px 0 rgba(20, 20, 19, .04), 0 16px 30px -20px rgba(20, 20, 19, .5); font: inherit; color: var(--ink); }
.fan.shut .chip { transform: rotate(0deg); }
.chip:hover, .chip:focus-visible, .chip.on { transform: rotate(calc(var(--k) * var(--s))) translateY(-20px); box-shadow: 0 26px 40px -20px rgba(20, 20, 19, .55); z-index: 5; }
.chip-tag { position: absolute; top: 9px; left: 7px; background: rgba(255, 255, 255, .94); border: 1px solid rgba(20, 20, 19, .1); border-radius: 4px; padding: 2px 3px; font: 500 10px/1.2 var(--mono); letter-spacing: -.02em; color: var(--ink); }
.fan-cap { min-height: 74px; max-width: 470px; text-align: center; font-size: 15px; color: var(--mute); }
.fan-cap b { color: var(--ink); font-weight: 600; }
.fan-cap .mono { color: var(--ink); }
@media (max-width: 1180px) { .fan { --cw: 92px; --ch: 212px; --s: 7.6deg; --b: 70px; height: 312px; } }
@media (max-width: 900px) { .hero-grid { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 520px) { .fan { --cw: 62px; --ch: 150px; --s: 5.2deg; --b: 46px; height: 226px; } .chip-tag { display: none; } }

/* ── 01 fixed / free ── */
.free-grid { display: grid; grid-template-columns: minmax(0, .8fr) minmax(0, 1.2fr); gap: clamp(28px, 4vw, 64px); align-items: start; }
.ff { border-top: 2px solid var(--ink); padding: 16px 0 22px; }
.ff + .ff { margin-top: 10px; }
.ff h3 { font-size: 26px; display: flex; align-items: baseline; gap: 12px; margin-bottom: 12px; }
.ff h3 small { font: 500 12px var(--mono); color: var(--mute); letter-spacing: .08em; text-transform: uppercase; }
.ff ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.ff li { display: grid; grid-template-columns: 18px minmax(0, 1fr); gap: 10px; font-size: 16px; line-height: 1.55; }
.ff li::before { content: ""; width: 12px; height: 12px; margin-top: 6px; border-radius: 3px; background: var(--dot, var(--olive)); }
.ff.fixed li::before { --dot: var(--orange); }
.ff .strip { border-radius: 4px; overflow: hidden; margin: 6px 0 4px; height: 18px; }
.stage-fig { margin: 0; }
.stage { position: relative; aspect-ratio: 16 / 10; background-color: var(--card); background-image: radial-gradient(var(--line) 1px, transparent 1.2px); background-size: 18px 18px; border: 1px solid var(--line-2); border-radius: 16px; overflow: hidden; box-shadow: 0 30px 60px -40px rgba(20, 20, 19, .45); }
.blk { position: absolute; transition: left .8s var(--ease), top .8s var(--ease), width .8s var(--ease), height .8s var(--ease), opacity .5s; border-radius: 6px; }
.b-nav { border-bottom: 1px solid var(--line-2); border-radius: 0; background: linear-gradient(var(--ink), var(--ink)) no-repeat 0 50% / 14px 14px, linear-gradient(var(--line-2), var(--line-2)) no-repeat 100% 50% / 22% 5px; }
.b-title { background: linear-gradient(var(--ink), var(--ink)) no-repeat 0 8% / 92% 34%, linear-gradient(var(--ink), var(--ink)) no-repeat 0 82% / 58% 34%; border-radius: 3px; }
.b-text { background: repeating-linear-gradient(to bottom, #cfccc1 0 4px, transparent 4px 13px); }
.b-quote { border-left: 4px solid var(--orange); border-radius: 0; background: repeating-linear-gradient(to bottom, #b9b6ab 0 5px, transparent 5px 15px) 14px 6px / calc(100% - 14px) calc(100% - 6px) no-repeat; }
.b-fig { display: flex; align-items: center; justify-content: space-between; padding: 0 6%; background: linear-gradient(var(--line-2), var(--line-2)) no-repeat 50% 50% / 80% 2px; border: 1px dashed var(--line-2); }
.b-fig i { width: 22%; height: 46%; border-radius: 6px; border: 2px solid; background: var(--card); }
.b-fig i:nth-child(1) { border-color: var(--blue); } .b-fig i:nth-child(2) { border-color: var(--olive); } .b-fig i:nth-child(3) { border-color: var(--gold); }
.b-chart { display: flex; align-items: flex-end; gap: 6%; padding: 4% 4% 0; border-bottom: 2px solid var(--ink); border-radius: 0; }
.b-chart i { flex: 1; border-radius: 3px 3px 0 0; }
.b-btn { background: var(--orange); border-radius: 999px; }
.b-btn::after { content: ""; position: absolute; left: 24%; right: 24%; top: 44%; height: 12%; background: var(--ink); border-radius: 3px; }
.phone-frame { position: absolute; left: 33%; top: 2%; width: 34%; height: 96%; border: 2px solid var(--ink); border-radius: 22px; opacity: 0; transition: opacity .6s; pointer-events: none; }
.stage[data-l="phone"] .phone-frame { opacity: 1; }
.tabs { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0 10px; }
.tab { font: 500 14px var(--sans); padding: 8px 14px; border-radius: 999px; border: 1px solid var(--line-2); background: var(--card); color: var(--ink); cursor: pointer; }
.tab[aria-pressed="true"] { background: var(--ink); color: var(--paper); border-color: var(--ink); }
@media (max-width: 900px) { .free-grid { grid-template-columns: minmax(0, 1fr); } .stage { aspect-ratio: 4 / 3; } }

/* ── 02 palette lab ── */
.lab { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr); gap: clamp(20px, 3vw, 40px); background: var(--card); border: 1px solid var(--line); border-radius: 18px; padding: clamp(18px, 3vw, 32px); }
.lab-label { font: 500 12px var(--mono); letter-spacing: .08em; text-transform: uppercase; color: var(--mute); margin: 0 0 10px; display: flex; justify-content: space-between; }
.lab-label + .sw-row { margin-bottom: 22px; }
.sw-row { display: flex; flex-wrap: wrap; gap: 7px; }
.sw { display: inline-flex; align-items: center; gap: 7px; padding: 5px 10px 5px 5px; border-radius: 999px; border: 1px solid var(--line-2); background: var(--paper); font: 13px var(--sans); color: var(--ink); cursor: pointer; }
.sw i { width: 20px; height: 20px; border-radius: 50%; background: var(--c); box-shadow: inset 0 0 0 1px rgba(20, 20, 19, .15); }
.sw[aria-pressed="true"] { border-color: var(--ink); box-shadow: inset 0 0 0 1px var(--ink); background: var(--card); }
.range { width: 100%; accent-color: var(--orange-ink); }
.chk { display: inline-flex; gap: 8px; align-items: center; font-size: 15px; margin-top: 12px; cursor: pointer; }
.chk input { accent-color: var(--orange-ink); width: 17px; height: 17px; }
.lab-out { display: grid; gap: 16px; align-content: start; }
.spec { border-radius: 14px; overflow: hidden; border: 1px solid var(--line); }
.spec svg { display: block; width: 100%; height: 170px; }
.readout { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 4px 20px; align-items: end; }
.ratio { font: 500 clamp(54px, 7vw, 76px)/1 var(--serif); letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
.ratio small { font-size: .38em; color: var(--mute); letter-spacing: 0; margin-left: 4px; }
.need { font-size: 15px; color: var(--mute); line-height: 1.5; padding-bottom: 6px; }
.need b { color: var(--ink); font-weight: 600; }
.stamp { grid-column: 1 / -1; justify-self: start; font: 600 13px var(--mono); letter-spacing: .08em; text-transform: uppercase; padding: 6px 12px; border-radius: 6px; border: 1.5px solid; transform: rotate(-2deg); }
.stamp.pass { color: var(--olive-ink); border-color: var(--olive); background: #eef1e8; }
.stamp.fail { color: var(--danger); border-color: var(--danger); background: #f8ebe8; }
.stamp.pop { animation: pop .35s var(--ease); }
@keyframes pop { from { transform: rotate(-2deg) scale(1.25); } to { transform: rotate(-2deg) scale(1); } }
.ruler-fig { margin: 28px 0 0; }
.ruler { position: relative; height: 172px; margin: 0 14px; }
.ruler .zone { position: absolute; top: 34px; height: 30px; }
.ruler .z-f { background: #f3dfda; } .ruler .z-l { background: #f4e9d2; } .ruler .z-p { background: #e4e9dc; }
.ruler .axis { position: absolute; left: 0; right: 0; top: 64px; height: 1px; background: var(--ink); }
.ruler .tick { position: absolute; top: 64px; width: 1px; height: 8px; background: var(--ink); }
.ruler .tl { position: absolute; top: 74px; transform: translateX(-50%); font: 12px var(--mono); color: var(--mute); }
.ruler .zl { position: absolute; top: 8px; font: 12px var(--mono); color: var(--mute); transform: translateX(-50%); white-space: nowrap; }
.ruler .dot { position: absolute; top: 49px; width: 16px; height: 16px; margin-left: -8px; border-radius: 50%; background: var(--c); box-shadow: 0 0 0 2px var(--card), 0 0 0 3px rgba(20, 20, 19, .25); transition: left .7s var(--ease), transform .3s; cursor: pointer; border: 0; padding: 0; }
.ruler .dot.cur { transform: scale(1.45); box-shadow: 0 0 0 2px var(--card), 0 0 0 4px var(--ink); z-index: 3; }
.ruler .dl { position: absolute; transform: translateX(-50%); font: 11.5px var(--mono); color: var(--ink); white-space: nowrap; transition: left .7s var(--ease), top .4s; }
.ruler .dl::before { content: ""; position: absolute; left: 50%; bottom: 100%; width: 1px; height: var(--stem, 8px); background: var(--line-2); }
.ruler .dl.cur { font-weight: 700; }
.finds { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-top: 36px; }
.find { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 20px; display: grid; gap: 12px; align-content: start; }
.find h3 { font-size: 20px; }
.find p { font-size: 15px; line-height: 1.6; color: var(--mute); }
.find p b { color: var(--ink); font-family: var(--mono); font-weight: 500; font-size: 14px; }
.find svg { display: block; width: 100%; height: auto; }
.find .load { justify-self: start; font: 500 13px var(--sans); padding: 7px 12px; border-radius: 999px; border: 1px solid var(--ink); background: transparent; color: var(--ink); cursor: pointer; }
.find .load:hover { background: var(--ink); color: var(--paper); }
@media (max-width: 1080px) { .finds { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 860px) { .lab { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 640px) { .finds { grid-template-columns: minmax(0, 1fr); } }

/* ── 03 history ── */
.rules-grid { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, .9fr); gap: clamp(28px, 4vw, 56px); align-items: start; }
.chart-fig { margin: 0; position: relative; }
.pan { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.pan > svg { min-width: var(--pan-w, 0); width: 100%; display: block; }
.hist-svg text { font-family: var(--mono); }
.tip { position: absolute; pointer-events: none; background: var(--dark); color: var(--dark-ink); font-size: 13px; line-height: 1.45; padding: 9px 12px; border-radius: 8px; max-width: 280px; opacity: 0; transition: opacity .15s; z-index: 4; }
.tip b { font-family: var(--mono); font-weight: 500; color: var(--d-gold); }
.tip.on { opacity: 1; }
.chart-fig figcaption { margin-top: 12px; }
.stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-top: 18px; }
.stats div { border-top: 2px solid var(--ink); padding-top: 10px; display: grid; gap: 4px; }
.stats b { font: 500 clamp(40px, 5vw, 60px)/1 var(--serif); letter-spacing: -.02em; }
.stats div:last-child b { color: var(--olive-ink); }
.stats span { font-size: 14px; line-height: 1.45; color: var(--mute); }
.tickets { list-style: none; margin: 14px 0 26px; padding: 0; display: grid; gap: 8px; }
.tickets li { position: relative; background: var(--card); border: 1px solid var(--line); border-left: 4px solid var(--gold); border-radius: 8px; padding: 9px 14px; font-size: 15px; line-height: 1.5; }
.tickets li::after { content: ""; position: absolute; left: 12px; right: 12px; top: 50%; height: 1.5px; background: var(--danger); transform-origin: left; transform: scaleX(1); transition: transform .5s var(--ease) calc(var(--i) * 110ms); }
html.rv-on .tickets:not(.in) li::after { transform: scaleX(0); }
.left-lines { display: grid; gap: 10px; margin-top: 12px; }
.ll { display: grid; grid-template-columns: 54px minmax(0, 1fr); gap: 4px 12px; background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px; }
.ll .n { font: 500 13px var(--mono); color: var(--mute); }
.ll .t { font-size: 14px; line-height: 1.5; overflow-wrap: anywhere; }
.ll .tag { grid-column: 2; justify-self: start; font: 500 11.5px var(--mono); padding: 2px 8px; border-radius: 999px; background: var(--paper-2); color: var(--mute); }
.ll.req { border-color: var(--olive); }
.ll.req .tag { background: #e4e9dc; color: var(--olive-ink); }
@media (max-width: 900px) { .rules-grid { grid-template-columns: minmax(0, 1fr); } }

/* ── 04 three ways ── */
.pagemap { display: flex; gap: 6px; margin: 0 0 22px; }
.pagemap span { flex: 1; height: 34px; border-radius: 6px; background: var(--card); border: 1px solid var(--line); display: grid; place-items: center; font: 500 11.5px var(--mono); color: var(--mute); transition: background .3s, color .3s, border-color .3s; }
.pagemap span.lit { background: var(--ink); color: var(--paper); border-color: var(--ink); }
.ways { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
.way { background: var(--card); border: 1px solid var(--line); border-radius: 18px; padding: 22px; display: grid; gap: 14px; align-content: start; transition: border-color .25s, transform .25s; }
.way:hover, .way:focus-within { border-color: var(--ink); transform: translateY(-2px); }
.way .num { font: 500 13px var(--mono); color: var(--mute); }
.way h3 { font-size: 23px; }
.way p { font-size: 15.5px; line-height: 1.6; color: var(--mute); }
.way .where { display: flex; flex-wrap: wrap; gap: 6px; font-size: 14px; }
.way .where a { font-family: var(--mono); font-size: 13px; padding: 3px 9px; border: 1px solid var(--line-2); border-radius: 999px; text-decoration: none; color: var(--ink); }
.way .where a:hover { border-color: var(--ink); }
.way .where em { font-style: normal; font-size: 12px; color: var(--mute); width: 100%; font-family: var(--mono); letter-spacing: .06em; text-transform: uppercase; }
.mini { height: 110px; border-radius: 12px; background: var(--paper-2); position: relative; overflow: hidden; }
.m1 i { position: absolute; width: 26%; height: 30%; border-radius: 6px; border: 2px solid; background: var(--card); }
.m1 i:nth-child(1) { border-color: var(--blue); left: 8%; top: 18%; animation: m1a 5s var(--ease) infinite; }
.m1 i:nth-child(2) { border-color: var(--olive); left: 37%; top: 52%; animation: m1b 5s var(--ease) infinite; }
.m1 i:nth-child(3) { border-color: var(--gold); left: 66%; top: 18%; animation: m1c 5s var(--ease) infinite; }
@keyframes m1a { 0%, 30% { left: 8%; top: 18%; } 45%, 75% { left: 66%; top: 52%; } 90%, 100% { left: 8%; top: 18%; } }
@keyframes m1b { 0%, 30% { left: 37%; top: 52%; } 45%, 75% { left: 8%; top: 18%; } 90%, 100% { left: 37%; top: 52%; } }
@keyframes m1c { 0%, 30% { left: 66%; top: 18%; } 45%, 75% { left: 37%; top: 52%; } 90%, 100% { left: 66%; top: 18%; } }
.m2 { background: var(--dark); padding: 14px 16px; font: 12.5px/1.75 var(--mono); color: var(--dark-ink); }
.m2 div { opacity: 0; animation: m2 4.8s steps(1) infinite; }
.m2 div:nth-child(2) { animation-delay: .6s; } .m2 div:nth-child(3) { animation-delay: 1.2s; } .m2 div:nth-child(4) { animation-delay: 1.8s; }
.m2 .ok { color: var(--d-green); } .m2 .dim { color: var(--dark-mute); }
@keyframes m2 { 0% { opacity: 0; } 8%, 88% { opacity: 1; } 100% { opacity: 0; } }
.m3 { display: flex; align-items: center; justify-content: center; gap: 14px; }
.m3 .c { width: 30px; height: 30px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgba(20, 20, 19, .2); }
.m3 .c:nth-child(1) { background: var(--orange); } .m3 .c:nth-child(2) { background: var(--orange-2); } .m3 .c:nth-child(3) { background: var(--orange-ink); }
.m3 .ring { position: absolute; width: 40px; height: 40px; border-radius: 50%; border: 2px solid var(--ink); left: calc(50% - 64px); top: calc(50% - 20px); animation: m3 4.5s var(--ease) infinite; }
@keyframes m3 { 0%, 25% { transform: translateX(0); } 33%, 58% { transform: translateX(44px); } 66%, 92% { transform: translateX(88px); } 100% { transform: translateX(0); } }
.motion { margin-top: 30px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; padding-top: 22px; border-top: 1px solid var(--line-2); }
.motion div { font-size: 15px; line-height: 1.55; color: var(--mute); }
.motion b { display: block; color: var(--ink); font-weight: 600; margin-bottom: 4px; }
@media (max-width: 900px) { .ways { grid-template-columns: minmax(0, 1fr); } .motion { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 520px) { .motion { grid-template-columns: minmax(0, 1fr); } .pagemap span { font-size: 0; } }

/* ── 05 diagram library ── */
.pick { display: grid; grid-template-columns: minmax(0, .82fr) minmax(0, 1.18fr); gap: 24px; align-items: start; }
.pick-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; counter-reset: pk; }
.pick-list button { width: 100%; text-align: left; display: grid; grid-template-columns: 30px minmax(0, 1fr) auto; gap: 10px; align-items: baseline; padding: 9px 12px; border-radius: 10px; border: 1px solid transparent; background: transparent; font: 15px/1.45 var(--sans); color: var(--ink); cursor: pointer; }
.pick-list button:hover { background: var(--card); border-color: var(--line); }
.pick-list button[aria-pressed="true"] { background: var(--card); border-color: var(--ink); }
.pick-list .pn { font: 500 12px var(--mono); color: var(--mute); }
.pick-list .pc { font: 500 11.5px var(--mono); color: var(--blue-ink); white-space: nowrap; }
.pick-view { margin: 0; position: sticky; top: 76px; }
.pv-frame { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 16px; min-height: 340px; display: grid; place-items: center; }
.pv-frame img { width: 100%; max-height: 480px; object-fit: contain; display: block; }
.pv-recipe { text-align: center; max-width: 34ch; color: var(--mute); }
.pv-recipe b { display: block; font: 500 40px var(--serif); color: var(--ink); margin-bottom: 8px; }
.pv-cap { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 12px; font-size: 14px; color: var(--mute); }
.pv-cap button { font: 500 13px var(--mono); padding: 4px 10px; border-radius: 999px; border: 1px solid var(--line-2); background: var(--card); color: var(--ink); cursor: pointer; }
.pv-cap button[aria-pressed="true"] { background: var(--ink); color: var(--paper); border-color: var(--ink); }
.sheet { margin-top: 48px; display: grid; gap: 30px; }
.sheet h3 { font-size: 20px; display: flex; gap: 10px; align-items: baseline; flex-wrap: wrap; }
.sheet h3 small { font: 500 12.5px var(--mono); color: var(--mute); }
.tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(124px, 1fr)); gap: 10px; margin-top: 12px; }
.tile { border: 1px solid var(--line); border-radius: 10px; background: var(--card); padding: 8px; cursor: pointer; display: grid; gap: 6px; text-align: left; font: inherit; color: var(--ink); transition: opacity .3s, border-color .2s, transform .2s; }
.tile:hover { border-color: var(--ink); transform: translateY(-2px); }
.tile img { width: 100%; aspect-ratio: 4 / 3; object-fit: contain; background: var(--paper); border-radius: 6px; display: block; }
.tile span { font: 11.5px/1.3 var(--mono); overflow-wrap: anywhere; }
.sheet.filtering .tile:not(.hit) img { opacity: .2; }
.sheet.filtering .tile:not(.hit) span { color: var(--mute); }
.tile img { transition: opacity .3s; }
.tile.hit { border-color: var(--blue); box-shadow: inset 0 0 0 1px var(--blue); }
.more-btn { display: none; margin-top: 12px; font: 500 14px var(--sans); padding: 8px 16px; border-radius: 999px; border: 1px solid var(--ink); background: var(--card); color: var(--ink); cursor: pointer; }
.grp.cut-d .tile:nth-child(n+17) { display: none; }
.grp.cut-d .more-btn { display: inline-flex; }
@media (max-width: 640px) { .grp.cut-m .tile:nth-child(n+7) { display: none; } .grp.cut-m .more-btn { display: inline-flex; } }
.grp.open .tile, .sheet.filtering .tile.hit { display: grid !important; }
.grp.open .more-btn { display: none !important; }
.tile.cur { border-color: var(--ink); box-shadow: inset 0 0 0 1px var(--ink); }
.more { margin-top: 26px; display: flex; flex-wrap: wrap; gap: 8px 22px; font-size: 15px; }
@media (max-width: 900px) { .pick { grid-template-columns: minmax(0, 1fr); } .pick-view { position: static; } .pick-list { max-height: 330px; overflow-y: auto; border: 1px solid var(--line); border-radius: 12px; padding: 4px; background: var(--paper); } .pv-frame { min-height: 220px; } }

/* ── 06 checks ── */
.lenses { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }
.lens { text-align: left; background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 14px; display: grid; gap: 10px; align-content: start; cursor: pointer; font: inherit; color: var(--ink); transition: border-color .2s, transform .2s; }
.lens:hover { transform: translateY(-2px); border-color: var(--line-2); }
.lens[aria-pressed="true"] { border-color: var(--ink); box-shadow: inset 0 0 0 1px var(--ink); }
.lens .code { font: 600 13px var(--mono); color: var(--danger); }
.lens h3 { font-size: 18.5px; }
.lens svg { display: block; width: 100%; height: auto; border-radius: 10px; }
.lens .fw { font-size: 13.5px; line-height: 1.5; color: var(--mute); }
.lens-detail { margin-top: 16px; background: var(--card); border: 1px solid var(--ink); border-radius: 16px; padding: clamp(18px, 3vw, 28px); display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: 8px 24px; }
.lens-detail .big { font: 500 64px/1 var(--serif); color: var(--danger); grid-row: span 2; }
.lens-detail h3 { font-size: 24px; }
.lens-detail p { font-size: 16.5px; line-height: 1.7; color: var(--ink); opacity: .9; max-width: 70ch; }
.notcheck { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 22px 0 0; font-size: 15px; color: var(--mute); }
.notcheck span { font: 500 13px var(--mono); padding: 4px 11px; border-radius: 999px; border: 1px dashed var(--line-2); color: var(--mute); }
.evid { display: grid; grid-template-columns: minmax(0, .95fr) minmax(0, 1.05fr); gap: 20px; margin-top: 40px; align-items: start; }
.matrix-wrap { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 18px; }
.matrix { width: 100%; border-collapse: collapse; font-size: 14px; }
.matrix th { font: 500 12px var(--mono); color: var(--mute); text-align: center; padding: 6px 4px; border-bottom: 1px solid var(--line); }
.matrix th:first-child, .matrix td:first-child { text-align: left; }
.matrix td { padding: 7px 4px; border-bottom: 1px solid var(--line); text-align: center; }
.matrix td a { font-family: var(--mono); font-size: 13px; }
.mk { display: inline-block; width: 14px; height: 14px; border-radius: 50%; vertical-align: middle; }
.mk.pass { background: var(--olive); } .mk.fail { background: var(--danger); } .mk.warn { background: var(--gold); }
html.rv-on .matrix-wrap:not(.in) .mk { transform: scale(0); }
.mk { transition: transform .35s var(--ease) calc(var(--d, 0) * 18ms); }
.term { background: var(--dark); color: var(--dark-ink); border-radius: 14px; overflow: hidden; border: 1px solid #000; }
.term-bar { background: var(--dark-bar); display: flex; align-items: center; gap: 7px; padding: 10px 14px; font: 12.5px var(--mono); color: var(--dark-mute); }
.term-bar i { width: 11px; height: 11px; border-radius: 50%; background: #4a4842; }
.term-bar span { margin-left: 8px; overflow-wrap: anywhere; }
.term pre { margin: 0; padding: 16px 18px 18px; font: 13px/1.75 var(--mono); white-space: pre-wrap; overflow-wrap: anywhere; }
.term .ok { color: var(--d-green); } .term .bad { color: var(--d-gold); } .term .dim { color: var(--dark-mute); } .term .hl { color: var(--dark-ink); font-weight: 600; }
.term .prompt { color: var(--d-red); }
.legend { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 12px; font-size: 13px; color: var(--mute); align-items: center; }
@media (max-width: 1080px) { .lenses { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 900px) { .evid { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 640px) { .lenses { grid-template-columns: minmax(0, 1fr); } .lens-detail { grid-template-columns: minmax(0, 1fr); } .lens-detail .big { font-size: 44px; grid-row: auto; } }
/* vignettes */
.v-in { opacity: 0; animation: vin 4.8s steps(1) infinite; }
.v-in.d1 { animation-delay: .5s; } .v-in.d2 { animation-delay: 1.1s; } .v-in.d3 { animation-delay: 1.8s; }
@keyframes vin { 0% { opacity: 0; } 6%, 90% { opacity: 1; } 100% { opacity: 0; } }
.v-fade { animation: vfade 4.4s var(--ease) infinite alternate; }
@keyframes vfade { 0%, 20% { fill: #141413; } 80%, 100% { fill: #c9c6bb; } }
.v-slide { animation: vslide 3.6s var(--ease) infinite; }
@keyframes vslide { 0%, 35% { transform: translateX(0); } 55%, 80% { transform: translateX(-34px); } 100% { transform: translateX(0); } }
.v-shrink { transform-box: fill-box; transform-origin: left center; animation: vshrink 4.2s var(--ease) infinite; }
@keyframes vshrink { 0%, 25% { transform: scale(1); } 55%, 85% { transform: scale(.32); } 100% { transform: scale(1); } }
.v-ghost { animation: vghost 4s var(--ease) infinite; }
@keyframes vghost { 0%, 30% { opacity: 1; } 55%, 85% { opacity: .12; } 100% { opacity: 1; } }

/* ── 07 examples ── */
.exs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
.ex { display: grid; grid-template-rows: auto 1fr; background: var(--card); border: 1px solid var(--line); border-radius: 18px; overflow: hidden; text-decoration: none; color: var(--ink); transition: transform .25s, border-color .25s, box-shadow .25s; }
.ex:hover { transform: translateY(-3px); border-color: var(--ink); box-shadow: 0 22px 40px -30px rgba(20, 20, 19, .6); text-decoration: none; }
.ex-art { aspect-ratio: 16 / 9; background: var(--paper-2); border-bottom: 1px solid var(--line); }
.ex-art svg { width: 100%; height: 100%; display: block; }
.ex-body { padding: 18px 20px 20px; display: grid; gap: 8px; align-content: start; }
.ex-body .f { font: 500 12.5px var(--mono); color: var(--orange-ink); }
.ex-body h3 { font-size: 19px; line-height: 1.3; }
.ex-body p { font-size: 14.5px; line-height: 1.6; color: var(--mute); }
.ex.feature { grid-column: span 2; grid-template-columns: 1.1fr 1fr; grid-template-rows: none; }
.ex.feature .ex-art { aspect-ratio: auto; border-bottom: 0; border-right: 1px solid var(--line); min-height: 240px; }
.ex.feature h3 { font-size: 24px; }
@media (max-width: 980px) { .exs { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 640px) { .exs { grid-template-columns: minmax(0, 1fr); } .ex.feature { grid-column: auto; grid-template-columns: minmax(0, 1fr); } .ex.feature .ex-art { border-right: 0; border-bottom: 1px solid var(--line); min-height: 0; aspect-ratio: 16 / 9; } }

/* ── 08 use ── */
.route { display: grid; grid-template-columns: minmax(0, 1.2fr) 70px minmax(0, .8fr); gap: 0 10px; align-items: center; }
.phr { display: flex; flex-wrap: wrap; gap: 8px; }
.phr span { font: 14px var(--sans); padding: 7px 13px; border-radius: 999px; background: var(--card); border: 1px solid var(--line-2); }
.arrow { height: 2px; background: var(--ink); position: relative; }
.arrow::after { content: ""; position: absolute; right: -1px; top: -5px; border: 6px solid transparent; border-left: 9px solid var(--ink); border-right: 0; }
.dest { background: var(--ink); color: var(--paper); border-radius: 18px; padding: 24px; }
.dest .mono { font-size: 13px; color: var(--d-gold); }
.dest h3 { font-size: 28px; margin: 6px 0 8px; }
.dest p { font-size: 15px; color: var(--dark-ink); opacity: .9; line-height: 1.6; }
.else { margin-top: 30px; display: grid; gap: 8px; }
.else h3 { font-size: 20px; margin-bottom: 6px; }
.er { display: grid; grid-template-columns: minmax(0, 1fr) 40px minmax(0, 1fr); align-items: center; gap: 10px; background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 10px 14px; font-size: 15px; }
.er .to { font-family: var(--mono); font-size: 14px; }
.er .ar { height: 1px; background: var(--line-2); position: relative; }
.er .ar::after { content: ""; position: absolute; right: 0; top: -4px; border: 4px solid transparent; border-left: 7px solid var(--line-2); border-right: 0; }
.install { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 20px; margin-top: 44px; align-items: start; }
.copy { margin-left: auto; font: 500 12px var(--mono); padding: 4px 10px; border-radius: 6px; border: 1px solid #4a4842; background: transparent; color: var(--dark-ink); cursor: pointer; }
.second { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 22px; display: grid; gap: 10px; }
.second h3 { font-size: 21px; }
.second p { font-size: 15.5px; line-height: 1.65; color: var(--mute); }
@media (max-width: 900px) { .route { grid-template-columns: minmax(0, 1fr); gap: 14px; } .arrow { width: 2px; height: 34px; margin-left: 24px; } .arrow::after { right: -5px; top: auto; bottom: -1px; border: 6px solid transparent; border-top: 9px solid var(--ink); border-bottom: 0; } .install { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 560px) { .er { grid-template-columns: minmax(0, 1fr); gap: 4px; } .er .ar { display: none; } }

/* ── footer ── */
.foot { background: var(--dark); color: var(--dark-ink); padding: 64px 0 48px; }
.foot h2 { font-size: 30px; color: var(--dark-ink); max-width: none; }
.src { list-style: none; margin: 22px 0 0; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 28px; }
.src li { font-size: 14.5px; line-height: 1.6; color: var(--dark-mute); padding-left: 16px; border-left: 2px solid #3a3833; }
.src b { color: var(--dark-ink); font-weight: 600; }
.src code { background: #2a2925; border-color: #3a3833; color: var(--dark-ink); overflow-wrap: anywhere; }
.foot a { color: var(--d-gold); }
.foot-links { display: flex; flex-wrap: wrap; gap: 10px 22px; margin-top: 36px; padding-top: 22px; border-top: 1px solid #3a3833; font-size: 14.5px; }
@media (max-width: 760px) { .src { grid-template-columns: minmax(0, 1fr); } }

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation: none !important; transition: none !important; }
  .v-in { opacity: 1; }
  .m2 div { opacity: 1; }
}
</style>
</head>
<body>
<!-- facts-ignore: the next line embeds git commit subjects for the history chart; their counts describe the repo on those dates -->
<script type="application/json" id="page-data">__DATA__</script>

<div class="strip" id="strip-top" aria-hidden="true"></div>
<header class="top">
  <div class="wrap top-in">
    <a class="crumb" href="../../index.html">sky-skills</a><span class="sep">/</span><span class="here">anthropic-design</span>
    <nav class="nav" aria-label="Sections">
      <a href="#free"><span class="lang-en">Fixed</span><span class="lang-zh">定死什么</span></a>
      <a href="#palette"><span class="lang-en">Palette</span><span class="lang-zh">配色</span></a>
      <a href="#rules"><span class="lang-en">History</span><span class="lang-zh">改版</span></a>
      <a href="#ways"><span class="lang-en">Three ways</span><span class="lang-zh">三种做法</span></a>
      <a href="#diagrams"><span class="lang-en">Diagrams</span><span class="lang-zh">图例库</span></a>
      <a href="#checks"><span class="lang-en">Checks</span><span class="lang-zh">检查</span></a>
      <a href="#examples"><span class="lang-en">Examples</span><span class="lang-zh">范例</span></a>
      <a href="#use"><span class="lang-en">Use</span><span class="lang-zh">怎么用</span></a>
    </nav>
    <button class="lang" id="lang-btn" type="button"><span class="lang-en">中文</span><span class="lang-zh">EN</span></button>
  </div>
</header>

<main>
<!-- ── 00 hero ── -->
<section class="hero" id="top">
  <span class="crop tl"></span><span class="crop tr"></span><span class="crop bl"></span><span class="crop br"></span><span class="reg"></span>
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <p class="kicker"><i style="--k:var(--orange)"></i><span class="lang-en">A design skill in sky-skills · reworked {{REWRITE_D}}</span><span class="lang-zh">sky-skills 的设计 skill · {{REWRITE_D}} 改版</span></p>
      <h1><span class="lang-en">Only the <em>colour</em><br>is fixed.</span><span class="lang-zh">只定死<em>配色</em>,<br>其余按内容来。</span></h1>
      <p class="lede">
        <span class="lang-en">anthropic-design is a Claude Code skill for explainer pages, technical introductions and long editorial reads. It pins one thing: a warm cream, ink, one orange and four quiet hues. Layout, typefaces, motion and components are left to the model and the content. The only goal is a reader who understands.</span>
        <span class="lang-zh">anthropic-design 是一个 Claude Code skill,做讲解页、技术介绍页和编辑式长文。它只定死一样东西:暖米白底、墨色字、一种橙、四种低饱和的语义色。版式、字体、动画、组件,由模型按内容决定。目标只有一个:读者看完能懂。</span>
      </p>
      <div class="cta">
        <a class="btn" href="#palette"><span class="lang-en">Try the palette</span><span class="lang-zh">试试配色</span></a>
        <a class="btn ghost" href="explainer.html"><span class="lang-en">See an example page</span><span class="lang-zh">看范例页</span></a>
      </div>
      <p class="btn-note">
        <span class="lang-en">The orange button carries ink, not white: <b>{{CR_INK_ORANGE}} : 1</b> against <b>{{CR_WHITE_ORANGE}} : 1</b>. <a href="#find-btn">Why</a></span>
        <span class="lang-zh">橙色按钮上用墨色字,不用白字:<b>{{CR_INK_ORANGE}} : 1</b> 对 <b>{{CR_WHITE_ORANGE}} : 1</b>。<a href="#find-btn">为什么</a></span>
      </p>
    </div>
    <figure class="fan-fig">
      <div class="fan" id="fan" role="group" aria-label="Palette chips"></div>
      <figcaption class="fan-cap" id="fan-cap" aria-live="polite">
        <span class="lang-en">{{N_PALETTE}} values, one table (SKILL.md §1). Point at a chip for its job and its contrast.</span>
        <span class="lang-zh">{{N_PALETTE}} 个色值,一张表(SKILL.md §1)。指一张色卡,看它的用途和对比度。</span>
      </figcaption>
    </figure>
  </div>
</section>

<!-- ── 01 fixed / free ── -->
<section class="sec band" id="free">
  <div class="wrap">
    <header class="sec-head rv">
      <p class="kicker"><i style="--k:var(--orange)"></i>01 · <span class="lang-en">What is fixed</span><span class="lang-zh">定死什么</span></p>
      <h2><span class="lang-en">One table is fixed. The page is yours.</span><span class="lang-zh">定死的只有一张色表,页面怎么排由你定。</span></h2>
      <p class="lede">
        <span class="lang-en">Before {{REWRITE_D}} the skill also fixed density quotas, class names and a scoring target, and every page drifted toward the ten reference pages. Now the colour is the identity, and the arrangement follows the content.</span>
        <span class="lang-zh">{{REWRITE_D}} 之前,这个 skill 还规定了图密度配额、类名、评分靶子,结果每一页都往 10 个参考页的样子靠。现在身份只靠配色,怎么排跟着内容走。</span>
      </p>
    </header>
    <div class="free-grid">
      <div class="rv">
        <div class="ff fixed">
          <h3><span class="lang-en">Fixed</span><span class="lang-zh">定死</span> <small>SKILL.md §1</small></h3>
          <div class="strip" id="strip-ff" aria-hidden="true"></div>
          <ul>
            <li><span class="lang-en">The colours: {{N_PALETTE}} values for page, text, accent, meaning, danger and the dark box.</span><span class="lang-zh">配色:页面底、字、主色、语义色、危险色、深色框,共 {{N_PALETTE}} 个色值。</span></li>
            <li><span class="lang-en">Text colours that pass WCAG AA, with the numbers worked out (next section).</span><span class="lang-zh">字色要过 WCAG AA,数字都算好了(下一节)。</span></li>
          </ul>
        </div>
        <div class="ff free">
          <h3><span class="lang-en">Free</span><span class="lang-zh">自由</span> <small><span class="lang-en">model + content</span><span class="lang-zh">模型 + 内容</span></small></h3>
          <ul>
            <li><span class="lang-en">Layout: editorial, report, deck, explainer, phone, or something new.</span><span class="lang-zh">版式:长文、报告、幻灯片、讲解页、手机,或者新的排法。</span></li>
            <li><span class="lang-en">Typefaces. Poppins + Lora in <code>assets/fonts.css</code> are there if you want them.</span><span class="lang-zh">字体。<code>assets/fonts.css</code> 里的 Poppins + Lora 想用就用。</span></li>
            <li><span class="lang-en">Motion, as long as it shows a step of the mechanism.</span><span class="lang-zh">动画,只要演示的是机制里的一步。</span></li>
            <li><span class="lang-en">Components and class names; <code>anth-*</code> in <code>assets/anthropic.css</code> is optional.</span><span class="lang-zh">组件和类名;<code>assets/anthropic.css</code> 里的 <code>anth-*</code> 可用可不用。</span></li>
          </ul>
        </div>
      </div>
      <figure class="stage-fig rv">
        <div class="stage" id="stage" data-l="editorial" role="img" aria-label="Seven blocks of a page, rearranged into different layouts with the same colours">
          <div class="phone-frame"></div>
          <div class="blk b-nav" data-b="nav"></div>
          <div class="blk b-title" data-b="title"></div>
          <div class="blk b-text" data-b="text"></div>
          <div class="blk b-quote" data-b="quote"></div>
          <div class="blk b-fig" data-b="fig"><i></i><i></i><i></i></div>
          <div class="blk b-chart" data-b="chart"><i style="height:45%;background:var(--gold)"></i><i style="height:70%;background:var(--gold)"></i><i style="height:58%;background:var(--olive)"></i><i style="height:92%;background:var(--orange)"></i><i style="height:38%;background:var(--blue)"></i></div>
          <div class="blk b-btn" data-b="btn"></div>
        </div>
        <div class="tabs" id="stage-tabs" role="group" aria-label="Layouts"></div>
        <figcaption class="illus"><span class="lang-en">Illustration, not a template: the same seven blocks in the same colours; only the arrangement changes.</span><span class="lang-zh">示意图,不是模板:同样七块、同样的颜色,只有排法在变。</span></figcaption>
      </figure>
    </div>
  </div>
</section>

<!-- ── 02 palette lab ── -->
<section class="sec" id="palette">
  <div class="wrap">
    <header class="sec-head rv">
      <p class="kicker"><i style="--k:var(--orange-ink)"></i>02 · <span class="lang-en">Palette</span><span class="lang-zh">配色</span></p>
      <h2><span class="lang-en">Pick a pair. The ratio is computed, not quoted.</span><span class="lang-zh">挑一对颜色。对比度是算出来的,不是抄来的。</span></h2>
      <p class="lede">
        <span class="lang-en">WCAG AA asks for <strong>4.5 : 1</strong> on body text and <strong>3 : 1</strong> on large text (24px, or 18.66px bold). Every number in this section is computed in your browser from the relative-luminance formula, the same one the skill used on {{REWRITE_D}}.</span>
        <span class="lang-zh">WCAG AA 要求正文 <strong>4.5 : 1</strong>,大字(24px,或粗体 18.66px)<strong>3 : 1</strong>。这一节的每个数都由你的浏览器按相对亮度公式现算,和 skill 在 {{REWRITE_D}} 用的是同一个公式。</span>
      </p>
    </header>
    <div class="lab rv" id="lab">
      <div class="lab-ctl">
        <p class="lab-label"><span class="lang-en">Text colour</span><span class="lang-zh">字色</span></p>
        <div class="sw-row" id="lab-fg" role="group" aria-label="Text colour"></div>
        <p class="lab-label"><span class="lang-en">Background</span><span class="lang-zh">底色</span></p>
        <div class="sw-row" id="lab-bg" role="group" aria-label="Background"></div>
        <label class="lab-label" for="lab-size"><span><span class="lang-en">Size</span><span class="lang-zh">字号</span></span><output id="lab-size-out">16px</output></label>
        <input class="range" type="range" id="lab-size" min="12" max="48" step="1" value="16">
        <label class="chk"><input type="checkbox" id="lab-bold"><span class="lang-en">Bold</span><span class="lang-zh">粗体</span></label>
      </div>
      <div class="lab-out">
        <div class="spec"><svg id="spec-svg" role="img" aria-label="Specimen of the chosen colour pair"></svg></div>
        <div class="readout">
          <div class="ratio"><span id="r-num">0.00</span><small>: 1</small></div>
          <div class="need" id="r-need"></div>
          <div class="stamp" id="r-stamp"></div>
        </div>
      </div>
    </div>
    <figure class="ruler-fig rv">
      <div class="ruler" id="ruler"></div>
      <figcaption class="note"><span class="lang-en">Every text colour on the chosen background, on a log scale from 1 to 21. Click a dot to load it.</span><span class="lang-zh">所有字色在当前底色上的位置,对数刻度 1 到 21。点圆点就装进上面的试验台。</span></figcaption>
    </figure>
    <div class="finds">
      <article class="find rv" id="find-orange">
        <h3><span class="lang-en">Orange is not a text colour</span><span class="lang-zh">主色橙不当字色</span></h3>
        <svg viewBox="0 0 300 96" role="img" aria-label="Three oranges on cream with their contrast ratios">
          <rect width="300" height="96" rx="10" fill="#faf9f5"/>
          <text x="22" y="48" font-family="Lora, serif" font-size="30" fill="#d97757">Aa</text>
          <text x="118" y="48" font-family="Lora, serif" font-size="30" fill="#c56544">Aa</text>
          <text x="214" y="48" font-family="Lora, serif" font-size="30" fill="#a8502f">Aa</text>
          <text x="22" y="78" font-family="JetBrains Mono, monospace" font-size="13" fill="#141413">{{CR_ORANGE_CREAM}}</text>
          <text x="118" y="78" font-family="JetBrains Mono, monospace" font-size="13" fill="#141413">{{CR_ORANGE2_CREAM}}</text>
          <text x="214" y="78" font-family="JetBrains Mono, monospace" font-size="13" fill="#141413">{{CR_ORANGEK_CREAM}}</text>
        </svg>
        <p><span class="lang-en"><b>#d97757</b> is {{CR_ORANGE_CREAM}} on cream, under even the 3 : 1 bar for large text: use it for fills, lines and buttons. Large text can take <b>#c56544</b> ({{CR_ORANGE2_CREAM}}); small text takes <b>#a8502f</b> ({{CR_ORANGEK_CREAM}}).</span><span class="lang-zh"><b>#d97757</b> 在米白底上 {{CR_ORANGE_CREAM}},连大字的 3 : 1 都不到:只用作色块、线条、按钮底。大字可以用 <b>#c56544</b>({{CR_ORANGE2_CREAM}}),小字用 <b>#a8502f</b>({{CR_ORANGEK_CREAM}})。</span></p>
        <button class="load" type="button" data-fg="orange" data-bg="cream" data-size="28" data-bold="0"><span class="lang-en">Load in the lab</span><span class="lang-zh">装进试验台</span></button>
      </article>
      <article class="find rv" id="find-btn">
        <h3><span class="lang-en">Ink on the button, not white</span><span class="lang-zh">按钮上用墨色字,不用白字</span></h3>
        <svg viewBox="0 0 300 96" role="img" aria-label="Two orange buttons, white text and ink text">
          <rect width="300" height="96" rx="10" fill="#faf9f5"/>
          <rect x="14" y="16" width="128" height="40" rx="20" fill="#d97757"/>
          <text x="78" y="41" text-anchor="middle" font-family="sans-serif" font-size="15" font-weight="600" fill="#ffffff">Start</text>
          <rect x="158" y="16" width="128" height="40" rx="20" fill="#d97757"/>
          <text x="222" y="41" text-anchor="middle" font-family="sans-serif" font-size="15" font-weight="600" fill="#141413">Start</text>
          <text x="78" y="80" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="13" fill="#141413">{{CR_WHITE_ORANGE}}</text>
          <text x="222" y="80" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="13" fill="#141413">{{CR_INK_ORANGE}}</text>
        </svg>
        <p><span class="lang-en">The old rule required white text on orange buttons. White is <b>{{CR_WHITE_ORANGE}}</b>, enough only for large bold labels; ink is <b>{{CR_INK_ORANGE}}</b>. The rule was changed to fit the numbers.</span><span class="lang-zh">旧规则要求橙色按钮一律白字。白字只有 <b>{{CR_WHITE_ORANGE}}</b>,只够大号粗体;墨色字 <b>{{CR_INK_ORANGE}}</b>。规则按这组数改了。</span></p>
        <button class="load" type="button" data-fg="white" data-bg="orange" data-size="16" data-bold="1"><span class="lang-en">Load in the lab</span><span class="lang-zh">装进试验台</span></button>
      </article>
      <article class="find rv" id="find-hue">
        <h3><span class="lang-en">Hues as lines; mixed with ink as text</span><span class="lang-zh">语义色画线用原色,当字色先混墨色</span></h3>
        <svg viewBox="0 0 300 96" role="img" aria-label="Blue, olive and gold: raw and mixed with ink">
          <rect width="300" height="96" rx="10" fill="#faf9f5"/>
          <rect x="18" y="18" width="78" height="10" rx="5" fill="#6a9bcc"/><rect x="18" y="34" width="78" height="10" rx="5" fill="{{CR_BLUE_MIXHEX}}"/>
          <rect x="111" y="18" width="78" height="10" rx="5" fill="#788c5d"/><rect x="111" y="34" width="78" height="10" rx="5" fill="{{CR_OLIVE_MIXHEX}}"/>
          <rect x="204" y="18" width="78" height="10" rx="5" fill="#c9913f"/><rect x="204" y="34" width="78" height="10" rx="5" fill="{{CR_GOLD_MIXHEX}}"/>
          <text x="57" y="74" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="13" fill="#141413">{{CR_BLUE_RAW}}→{{CR_BLUE_MIX}}</text>
          <text x="150" y="74" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="13" fill="#141413">{{CR_OLIVE_RAW}}→{{CR_OLIVE_MIX}}</text>
          <text x="243" y="74" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="13" fill="#141413">{{CR_GOLD_RAW}}→{{CR_GOLD_MIX}}</text>
        </svg>
        <p><span class="lang-en">Blue, olive and gold sit under 3.5 on cream. As text, mix 62% with ink: <code>color-mix(in srgb, hue 62%, #141413)</code>. As fills and lines, use them as they are.</span><span class="lang-zh">蓝、橄榄绿、金在米白底上都不到 3.5。当字色时和墨色混一下:<code>color-mix(in srgb, 语义色 62%, #141413)</code>;当色块、线条用原色。</span></p>
        <button class="load" type="button" data-fg="blueT" data-bg="cream" data-size="16" data-bold="0"><span class="lang-en">Load in the lab</span><span class="lang-zh">装进试验台</span></button>
      </article>
      <article class="find rv" id="find-dark">
        <h3><span class="lang-en">The dark box gets its own set</span><span class="lang-zh">深色框里另配一组浅色</span></h3>
        <svg viewBox="0 0 300 96" role="img" aria-label="Dark box with the light error, warning and pass colours">
          <rect width="300" height="96" rx="10" fill="#1c1b18"/>
          <text x="18" y="34" font-family="JetBrains Mono, monospace" font-size="13" fill="#a14238">✗ {{CR_DANGER_DARK}}</text>
          <text x="18" y="62" font-family="JetBrains Mono, monospace" font-size="13" fill="#ec9488">✗ {{CR_DRED_DARK}}</text>
          <text x="118" y="62" font-family="JetBrains Mono, monospace" font-size="13" fill="#dcb062">! {{CR_DGOLD_DARK}}</text>
          <text x="210" y="62" font-family="JetBrains Mono, monospace" font-size="13" fill="#a9bf8f">✓ {{CR_DGREEN_DARK}}</text>
          <text class="lang-en" x="118" y="34" font-family="JetBrains Mono, monospace" font-size="12" fill="#b4b0a3">cream-page red</text><text class="lang-zh" x="118" y="34" font-family="Noto Sans SC, sans-serif" font-size="12" fill="#b4b0a3">米白底用的红</text>
          <text x="18" y="84" font-family="JetBrains Mono, monospace" font-size="12" fill="#b4b0a3">#ec9488 · #dcb062 · #a9bf8f</text>
        </svg>
        <p><span class="lang-en">The danger red that reads <b>{{CR_DANGER_CREAM}}</b> on cream falls to <b>{{CR_DANGER_DARK}}</b> on <code>#1c1b18</code>. Inside terminals and code boxes, errors, warnings and passes switch to a lighter set.</span><span class="lang-zh">危险红在米白底上 <b>{{CR_DANGER_CREAM}}</b>,放进 <code>#1c1b18</code> 只剩 <b>{{CR_DANGER_DARK}}</b>。终端、代码框里的报错 / 警告 / 通过,换成另一组浅色。</span></p>
        <button class="load" type="button" data-fg="danger" data-bg="dark" data-size="14" data-bold="0"><span class="lang-en">Load in the lab</span><span class="lang-zh">装进试验台</span></button>
      </article>
    </div>
  </div>
</section>

<!-- ── 03 history ── -->
<section class="sec band" id="rules">
  <div class="wrap">
    <header class="sec-head rv">
      <p class="kicker"><i style="--k:var(--gold)"></i>03 · <span class="lang-en">History</span><span class="lang-zh">改版</span></p>
      <h2><span class="lang-en">{{BEFORE}} lines of MUST. Then one, and a check holds it.</span><span class="lang-zh">{{BEFORE}} 行「必须」,改到一行,还有检查盯着。</span></h2>
      <p class="lede">
        <span class="lang-en">{{N_COMMITS}} commits have touched SKILL.md since {{FIRST_DATE}}. The lines containing MUST or 必须 climbed to {{PEAK}} by {{PEAK_DATE}}. The rewrite on {{REWRITE_D}} (<code>{{REWRITE_H}}</code>) took them from {{BEFORE}} to {{AFTER}}, and the file from {{LINES_BEFORE}} lines to {{LINES_AFTER}}.</span>
        <span class="lang-zh">从 {{FIRST_DATE}} 起,SKILL.md 一共改过 {{N_COMMITS}} 次。含 MUST 或「必须」的行,到 {{PEAK_DATE}} 涨到 {{PEAK}} 行。{{REWRITE_D}} 那次改版(<code>{{REWRITE_H}}</code>)把它从 {{BEFORE}} 行降到 {{AFTER}} 行,整个文件从 {{LINES_BEFORE}} 行减到 {{LINES_AFTER}} 行。</span>
      </p>
    </header>
    <div class="rules-grid">
      <figure class="chart-fig rv" id="hist-fig">
        <div class="pan" style="--pan-w:680px"><svg class="hist-svg" id="hist" viewBox="0 0 1000 400" role="img" aria-label="Lines containing MUST in SKILL.md, per commit"></svg></div>
        <div class="tip" id="hist-tip"></div>
        <div class="stats">
          <div><b>{{N_COMMITS}}</b><span><span class="lang-en">commits to SKILL.md since {{FIRST_DATE}}</span><span class="lang-zh">次提交,{{FIRST_DATE}} 起</span></span></div>
          <div><b>{{PEAK}}</b><span><span class="lang-en">lines of MUST at the peak, {{PEAK_DATE}}</span><span class="lang-zh">行「必须」,{{PEAK_DATE}} 最多时</span></span></div>
          <div><b>{{N_REQ}}</b><span><span class="lang-en">left that is a rule, and check O5 tests it</span><span class="lang-zh">行还是规则,检查 O5 查它</span></span></div>
        </div>
        <figcaption class="note"><span class="lang-en">Each dot is one commit. Counted with</span><span class="lang-zh">每个点是一次提交。数法:</span> <code>git show &lt;commit&gt;:SKILL.md | grep -cE 'MUST|必须'</code>. <span class="lang-en">Grey steps: total lines (right axis). Hover or tap a dot.</span><span class="lang-zh">灰色台阶:总行数(右轴)。指一个点看那次提交。</span></figcaption>
      </figure>
      <div class="rv">
        <h3><span class="lang-en">What the {{BEFORE}} lines asked for</span><span class="lang-zh">那 {{BEFORE}} 行要求过什么</span></h3>
        <ol class="tickets" id="tickets">
          <li style="--i:0"><span class="lang-en">A quota of figures per page</span><span class="lang-zh">每页的图密度配额</span></li>
          <li style="--i:1"><span class="lang-en">Run <code>dr-cli --plan</code> before writing</span><span class="lang-zh">动笔前先跑 <code>dr-cli --plan</code></span></li>
          <li style="--i:2"><span class="lang-en">Embed a self-diff before delivery</span><span class="lang-zh">交付前嵌 self-diff</span></li>
          <li style="--i:3"><span class="lang-en">A critic score of 75 to pass</span><span class="lang-zh">critic 打到 75 分才算过</span></li>
          <li style="--i:4"><span class="lang-en">The reference pages as the scoring target</span><span class="lang-zh">拿参考页当评分标准</span></li>
          <li style="--i:5"><span class="lang-en"><code>anth-*</code> class names everywhere</span><span class="lang-zh">一律用 <code>anth-*</code> 类名</span></li>
        </ol>
        <h3><span class="lang-en">What the {{AFTER}} lines say now</span><span class="lang-zh">现在那 {{AFTER}} 行说的是什么</span></h3>
        <div class="left-lines" id="left-lines"></div>
      </div>
    </div>
  </div>
</section>

<!-- ── 04 three ways ── -->
<section class="sec" id="ways">
  <div class="wrap">
    <header class="sec-head rv">
      <p class="kicker"><i style="--k:var(--olive)"></i>04 · <span class="lang-en">Making it understood</span><span class="lang-zh">让人看懂</span></p>
      <h2><span class="lang-en">Three ways to make a page understood. This page uses all three.</span><span class="lang-zh">让人看懂的三种做法。这一页三种都用了。</span></h2>
      <p class="lede"><span class="lang-en">They are cases, not rules. Point at one to see where it sits on this page.</span><span class="lang-zh">它们是案例,不是规则。指一张卡片,看它用在这一页的哪里。</span></p>
    </header>
    <div class="pagemap rv" id="pagemap" aria-hidden="true">
      <span data-s="top">00</span><span data-s="free">01</span><span data-s="palette">02</span><span data-s="rules">03</span><span data-s="ways">04</span><span data-s="diagrams">05</span><span data-s="checks">06</span><span data-s="examples">07</span><span data-s="use">08</span>
    </div>
    <div class="ways">
      <article class="way rv" data-on="top free">
        <div class="mini m1" aria-hidden="true"><i></i><i></i><i></i></div>
        <p class="num">i</p>
        <h3><span class="lang-en">Animate the mechanism first</span><span class="lang-zh">首屏用动画演示机制</span></h3>
        <p><span class="lang-en">The first thing a reader sees is how the thing moves, not an abstract illustration.</span><span class="lang-zh">读者第一眼看到的是这个东西怎么动,不是一张抽象插画。</span></p>
        <div class="where"><em><span class="lang-en">here</span><span class="lang-zh">本页</span></em><a href="#top">00 fan</a><a href="#free">01 stage</a></div>
        <div class="where"><em><span class="lang-en">example</span><span class="lang-zh">范例</span></em><a href="explainer.html">explainer.html</a></div>
      </article>
      <article class="way rv" data-on="rules checks">
        <div class="mini m2" aria-hidden="true"><div><span class="dim">$</span> check_objective.mjs</div><div class="ok">✓ O1 · O2 · O3</div><div class="ok">✓ O4 · O5</div><div class="dim">5 / 0 / 0</div></div>
        <p class="num">ii</p>
        <h3><span class="lang-en">Bring the evidence</span><span class="lang-zh">证据模块</span></h3>
        <p><span class="lang-en">The better a page looks, the more readily it is believed. Evidence lets the reader check for themselves.</span><span class="lang-zh">页面越好看,内容越容易被当真。证据让读者能自己核对。</span></p>
        <div class="where"><em><span class="lang-en">here</span><span class="lang-zh">本页</span></em><a href="#rules">03 git counts</a><a href="#evidence">06 results</a></div>
        <div class="where"><em><span class="lang-en">example</span><span class="lang-zh">范例</span></em><a href="explainer.html#evidence">explainer.html#evidence</a></div>
      </article>
      <article class="way rv" data-on="palette diagrams">
        <div class="mini m3" aria-hidden="true"><span class="c"></span><span class="c"></span><span class="c"></span><span class="ring"></span></div>
        <p class="num">iii</p>
        <h3><span class="lang-en">Let the reader click</span><span class="lang-zh">读者能点选的解释器</span></h3>
        <p><span class="lang-en">One click of your own is faster than three paragraphs.</span><span class="lang-zh">自己点一下,比读三段文字快。</span></p>
        <div class="where"><em><span class="lang-en">here</span><span class="lang-zh">本页</span></em><a href="#palette">02 lab</a><a href="#diagrams">05 chooser</a><a href="#checks">06 lenses</a></div>
        <div class="where"><em><span class="lang-en">example</span><span class="lang-zh">范例</span></em><a href="explainer.html#layers">#layers</a><a href="explainer.html#flow">#flow</a></div>
      </article>
    </div>
    <div class="motion rv">
      <div><b><span class="lang-en">Label illustrations</span><span class="lang-zh">示意图要注明</span></b><span class="lang-en">A drawn curve says "illustration, not measured data".</span><span class="lang-zh">画出来的曲线下面写明「示意,不是实测」。</span></div>
      <div><b><span class="lang-en">Motion shows a step</span><span class="lang-zh">动画演示一步机制</span></b><span class="lang-en">Movement that only decorates can usually go.</span><span class="lang-zh">只是装饰的动效,能删就删。</span></div>
      <div><b><span class="lang-en">Complete without motion</span><span class="lang-zh">关掉动画也完整</span></b><span class="lang-en">With reduced motion on, nothing may be missing. Check O5 tests it.</span><span class="lang-zh">打开「减少动态效果」,内容不能少。检查 O5 查这个。</span></div>
      <div><b><span class="lang-en">Relations get a figure first</span><span class="lang-zh">讲关系先给图</span></b><span class="lang-en">Who calls whom, what feeds what: draw it, then write.</span><span class="lang-zh">谁调用谁、数据从哪到哪:先画图,再写字。</span></div>
    </div>
  </div>
</section>

<!-- ── 05 diagram library ── -->
<section class="sec band" id="diagrams">
  <div class="wrap">
    <header class="sec-head rv">
      <p class="kicker"><i style="--k:var(--blue)"></i>05 · <span class="lang-en">Diagram library</span><span class="lang-zh">图例库</span></p>
      <h2><span class="lang-en">{{N_DIAGRAMS}} drawings to copy. Pick by what you are explaining.</span><span class="lang-zh">{{N_DIAGRAMS}} 张现成的图。按你要讲的内容挑。</span></h2>
      <p class="lede"><span class="lang-en">Start from the content, not the shape. The list is the table in SKILL.md §3; each row lights the templates that fit. Change the structure, mix them, or invent one.</span><span class="lang-zh">先看内容,再定图型。左边是 SKILL.md §3 那张表;点一行,下面亮起合适的模板。结构可以改,可以混搭,也可以自创。</span></p>
    </header>
    <div class="pick rv">
      <ol class="pick-list" id="pick-list"></ol>
      <figure class="pick-view" id="pick-view">
        <div class="pv-frame" id="pv-frame"></div>
        <figcaption class="pv-cap" id="pv-cap"></figcaption>
      </figure>
    </div>
    <div class="sheet" id="sheet"></div>
    <p class="more">
      <a href="diagrams.html"><span class="lang-en">Open the gallery page</span><span class="lang-zh">打开图集页</span></a>
      <a href="hardware.html"><span class="lang-en">Hardware figures</span><span class="lang-zh">硬件类图</span></a>
      <a href="https://github.com/TbusOS/sky-skills/blob/main/skills/anthropic-design/references/diagram-craft.md">diagram-craft.md</a>
      <a href="https://github.com/TbusOS/sky-skills/tree/main/skills/anthropic-design/templates/diagrams">templates/diagrams/</a>
    </p>
  </div>
</section>

<!-- ── 06 checks ── -->
<section class="sec" id="checks">
  <div class="wrap">
    <header class="sec-head rv">
      <p class="kicker"><i style="--k:var(--danger)"></i>06 · <span class="lang-en">Checks</span><span class="lang-zh">检查</span></p>
      <h2><span class="lang-en">Five checks for defects. None for taste.</span><span class="lang-zh">五项检查只查缺陷,不查品味。</span></h2>
      <p class="lede"><span class="lang-en"><code>check_objective.mjs</code> looks only for things that are wrong on any page. Pick a lens to see what it does and why it decides the way it does.</span><span class="lang-zh"><code>check_objective.mjs</code> 只查放在哪一页都算错的东西。点一项,看它查什么、为什么这么判。</span></p>
    </header>
    <div class="lenses rv" id="lenses">
      <button class="lens" type="button" data-o="O1" aria-pressed="true">
        <span class="code">O1</span>
        <h3><span class="lang-en">JS errors</span><span class="lang-zh">JS 报错</span></h3>
        <svg viewBox="0 0 240 124" aria-hidden="true">
          <rect width="240" height="124" rx="10" fill="#1c1b18"/>
          <text x="16" y="32" font-family="JetBrains Mono, monospace" font-size="13" fill="#a9bf8f" class="v-in">✓ load</text>
          <text x="16" y="56" font-family="JetBrains Mono, monospace" font-size="13" fill="#a9bf8f" class="v-in d1">✓ scroll to end</text>
          <text x="16" y="80" font-family="JetBrains Mono, monospace" font-size="13" fill="#ec9488" class="v-in d2">TypeError: x is</text>
          <text x="16" y="98" font-family="JetBrains Mono, monospace" font-size="13" fill="#ec9488" class="v-in d2">  undefined</text>
          <text x="200" y="104" font-family="JetBrains Mono, monospace" font-size="20" fill="#ec9488" class="v-in d3">✗</text>
        </svg>
        <span class="fw"><span class="lang-en">Any pageerror or console.error while loading and scrolling.</span><span class="lang-zh">加载、滚到底,出现 pageerror 或 console.error。</span></span>
      </button>
      <button class="lens" type="button" data-o="O2" aria-pressed="false">
        <span class="code">O2</span>
        <h3><span class="lang-en">Text contrast</span><span class="lang-zh">文字对比度</span></h3>
        <svg viewBox="0 0 240 124" aria-hidden="true">
          <rect width="240" height="124" rx="10" fill="#faf9f5" stroke="#e8e6dc"/>
          <text x="18" y="78" font-family="Lora, serif" font-size="54" class="v-fade" fill="#141413">Aa</text>
          <text x="128" y="50" font-family="JetBrains Mono, monospace" font-size="13" fill="#141413">ink {{CR_INK_CREAM}}</text>
          <text x="128" y="74" font-family="JetBrains Mono, monospace" font-size="13" fill="#6b312a">grey {{CR_GREY_CREAM}}</text>
          <line x1="128" y1="90" x2="222" y2="90" stroke="#141413" stroke-dasharray="3 3"/>
          <text x="128" y="108" font-family="JetBrains Mono, monospace" font-size="12" fill="#5e5d55">AA 4.5</text>
        </svg>
        <span class="fw"><span class="lang-en">axe-core colour-contrast, after scrolling and waiting for fades to finish.</span><span class="lang-zh">滚到底、等浮现动画播完,再跑 axe-core 的 color-contrast。</span></span>
      </button>
      <button class="lens" type="button" data-o="O3" aria-pressed="false">
        <span class="code">O3</span>
        <h3><span class="lang-en">Sideways scroll</span><span class="lang-zh">横向滚动</span></h3>
        <svg viewBox="0 0 240 124" aria-hidden="true">
          <rect width="240" height="124" rx="10" fill="#f0ede3"/>
          <g class="v-slide">
            <rect x="70" y="10" width="72" height="104" rx="12" fill="#ffffff" stroke="#141413" stroke-width="2"/>
            <rect x="80" y="26" width="52" height="6" rx="3" fill="#141413"/>
            <rect x="80" y="40" width="44" height="4" rx="2" fill="#b0aea5"/>
            <rect x="80" y="62" width="128" height="22" rx="4" fill="#d97757"/>
            <rect x="80" y="94" width="40" height="4" rx="2" fill="#b0aea5"/>
          </g>
          <text x="10" y="116" font-family="JetBrains Mono, monospace" font-size="12" fill="#6b312a">page moved ✗</text>
        </svg>
        <span class="fw"><span class="lang-en">A real sideways wheel at 1280 and 390; only a page that moves fails.</span><span class="lang-zh">1280 / 390 两个宽度下真的横滚一次,页面动了才失败。</span></span>
      </button>
      <button class="lens" type="button" data-o="O4" aria-pressed="false">
        <span class="code">O4</span>
        <h3><span class="lang-en">Figure text on a phone</span><span class="lang-zh">手机上图里的字</span></h3>
        <svg viewBox="0 0 240 124" aria-hidden="true">
          <rect width="240" height="124" rx="10" fill="#faf9f5" stroke="#e8e6dc"/>
          <g class="v-shrink">
            <rect x="14" y="22" width="56" height="30" rx="5" fill="#ffffff" stroke="#6a9bcc" stroke-width="2"/>
            <rect x="84" y="22" width="56" height="30" rx="5" fill="#ffffff" stroke="#788c5d" stroke-width="2"/>
            <rect x="154" y="22" width="56" height="30" rx="5" fill="#ffffff" stroke="#c9913f" stroke-width="2"/>
            <line x1="70" y1="37" x2="84" y2="37" stroke="#141413" stroke-width="2"/><line x1="140" y1="37" x2="154" y2="37" stroke="#141413" stroke-width="2"/>
          </g>
          <text x="14" y="84" font-family="JetBrains Mono, monospace" font-size="13" fill="#141413">12px → {{O4_PX}}px</text>
          <text x="14" y="106" font-family="JetBrains Mono, monospace" font-size="12" fill="#5e5d55">min 9px · pan box</text>
        </svg>
        <span class="fw"><span class="lang-en">SVG text drawn under 9px at 390 wide. Pictures marked data-allow-shrink are skipped.</span><span class="lang-zh">390 宽下 SVG 文字实际不到 9px。标了 data-allow-shrink 的图片类不查。</span></span>
      </button>
      <button class="lens" type="button" data-o="O5" aria-pressed="false">
        <span class="code">O5</span>
        <h3><span class="lang-en">Complete without motion</span><span class="lang-zh">关掉动画也完整</span></h3>
        <svg viewBox="0 0 240 124" aria-hidden="true">
          <rect width="240" height="124" rx="10" fill="#faf9f5" stroke="#e8e6dc"/>
          <rect x="16" y="18" width="150" height="10" rx="3" fill="#141413"/>
          <g class="v-ghost"><rect x="16" y="40" width="200" height="6" rx="3" fill="#b0aea5"/><rect x="16" y="54" width="176" height="6" rx="3" fill="#b0aea5"/><rect x="16" y="68" width="190" height="6" rx="3" fill="#b0aea5"/></g>
          <text x="16" y="104" font-family="JetBrains Mono, monospace" font-size="12" fill="#5e5d55">reduce motion · opacity 0</text>
        </svg>
        <span class="fw"><span class="lang-en">With reduced motion and no scrolling, no heading, paragraph or list item may be invisible.</span><span class="lang-zh">「减少动态效果」下不滚动,标题、段落、列表项不能有看不见的。</span></span>
      </button>
    </div>
    <div class="lens-detail rv" id="lens-detail" aria-live="polite"></div>
    <p class="notcheck rv"><span class="lang-en">Not checked, left to the model and to people:</span><span class="lang-zh">不查,交给模型和人:</span>
      <span><span class="lang-en">layout</span><span class="lang-zh">版式</span></span><span><span class="lang-en">typefaces</span><span class="lang-zh">字体</span></span><span><span class="lang-en">colour proportions</span><span class="lang-zh">配色比例</span></span><span><span class="lang-en">component names</span><span class="lang-zh">组件写法</span></span>
    </p>
    <div class="evid" id="evidence">
      <div class="matrix-wrap rv">
        <h3><span class="lang-en">{{N_CHECK_PAGES}} pages in this palette, run on {{CHECK_DATE}}</span><span class="lang-zh">这套配色的 {{N_CHECK_PAGES}} 张页面,{{CHECK_DATE}} 跑的结果</span></h3>
        <p class="note" style="margin:6px 0 12px"><span class="lang-en">{{N_CHECK_PASS}} of {{N_CHECK_CELLS}} cells pass. These pages were written or reworked to pass, so this table alone proves little; the self-test on the right shows the checker can fail.</span><span class="lang-zh">{{N_CHECK_CELLS}} 格里 {{N_CHECK_PASS}} 格通过。这些页面本来就是按能过的标准写或改的,单看这张表说明不了多少;右边的自测说明这道检查真的会报错。</span></p>
        <table class="matrix" id="matrix"></table>
        <div class="legend"><span><i class="mk pass"></i> <span class="lang-en">pass</span><span class="lang-zh">通过</span></span><span><i class="mk warn"></i> <span class="lang-en">warning</span><span class="lang-zh">提醒</span></span><span><i class="mk fail"></i> <span class="lang-en">fail</span><span class="lang-zh">失败</span></span></div>
      </div>
      <div class="rv">
        <div class="term">
          <div class="term-bar"><i></i><i></i><i></i><span>check_objective.mjs --self-test</span></div>
          <pre id="selftest"></pre>
        </div>
        <p class="note" style="margin-top:12px"><span class="lang-en">Tool output, unedited (the tool reports in Chinese). {{N_SELFTEST}} self-test pages; the {{N_SELFTEST_BAD}} marked ★ are broken on purpose and must be reported.</span><span class="lang-zh">工具原样输出。{{N_SELFTEST}} 张自测页,标 ★ 的 {{N_SELFTEST_BAD}} 张是故意做坏的,必须报出来。</span></p>
      </div>
    </div>
  </div>
</section>

<!-- ── 07 examples ── -->
<section class="sec band" id="examples">
  <div class="wrap">
    <header class="sec-head rv">
      <p class="kicker"><i style="--k:var(--orange)"></i>07 · <span class="lang-en">Examples</span><span class="lang-zh">范例</span></p>
      <h2><span class="lang-en">Pages made with it.</span><span class="lang-zh">用它做的页面。</span></h2>
      <p class="lede"><span class="lang-en">Open one and look for the three ways. Each card is drawn from what its page is about.</span><span class="lang-zh">打开一页,找找那三种做法。每张卡片的图,画的是那一页讲的东西。</span></p>
    </header>
    <div class="exs" id="exs"></div>
  </div>
</section>

<!-- ── 08 use ── -->
<section class="sec" id="use">
  <div class="wrap">
    <header class="sec-head rv">
      <p class="kicker"><i style="--k:var(--ink)"></i>08 · <span class="lang-en">Using it</span><span class="lang-zh">怎么用</span></p>
      <h2><span class="lang-en">Say what you want to explain. It loads when the words match.</span><span class="lang-zh">说你要讲什么。话里有这些词,它就会加载。</span></h2>
      <p class="lede"><span class="lang-en">Claude Code reads the description of every installed skill. These phrases come from SKILL.md; the requests underneath go to other skills.</span><span class="lang-zh">Claude Code 会读每个已装 skill 的描述。下面这些词取自 SKILL.md;再下面那几类请求会交给别的 skill。</span></p>
    </header>
    <div class="route rv">
      <div class="phr" id="phr"></div>
      <div class="arrow" aria-hidden="true"></div>
      <div class="dest">
        <span class="mono">SKILL.md · TRIGGER</span>
        <h3>anthropic-design</h3>
        <p><span class="lang-en">Loads the palette, the three ways, the diagram library and the five checks.</span><span class="lang-zh">加载配色、三种做法、图例库和五项检查。</span></p>
      </div>
    </div>
    <div class="else rv" id="else">
      <h3><span class="lang-en">Goes elsewhere</span><span class="lang-zh">交给别的 skill</span></h3>
    </div>
    <div class="install">
      <div class="rv">
        <div class="term">
          <div class="term-bar"><i></i><i></i><i></i><span><span class="lang-en">install</span><span class="lang-zh">安装</span></span><button class="copy" type="button" id="copy-btn"><span class="lang-en">copy</span><span class="lang-zh">复制</span></button></div>
<pre id="install-cmd"><span class="prompt">$</span> git clone https://github.com/TbusOS/sky-skills.git
<span class="prompt">$</span> cd sky-skills
<span class="prompt">$</span> cp -r skills/anthropic-design skills/design-review ~/.claude/skills/
<span class="dim"># then, in Claude Code:</span>
<span class="prompt">&gt;</span> <span class="lang-en">explain how a TCP handshake works, as an anthropic-style page</span><span class="lang-zh">用 anthropic 风格做一页讲 TCP 三次握手的讲解页</span>
<span class="dim"># before you deliver it:</span>
<span class="prompt">$</span> node ~/.claude/skills/design-review/scripts/check_objective.mjs page.html</pre>
        </div>
        <p class="note" style="margin-top:12px"><span class="lang-en">design-review comes along because the five checks live in it.</span><span class="lang-zh">design-review 一起装:五项检查的脚本在它里面。</span></p>
      </div>
      <div class="second rv">
        <h3><span class="lang-en">Want a second opinion on style?</span><span class="lang-zh">想要风格上的第二意见?</span></h3>
        <p><span class="lang-en">design-review's four checks, its critic score and <code>dr-cli --audit</code> still work. They are not a gate: the critic aims at the reference pages, and departing from them is not a fault in this skill.</span><span class="lang-zh">design-review 的四道检查、critic 评分、<code>dr-cli --audit</code> 都还能用,但不是交付门槛:critic 拿参考页当靶子,偏离参考页的版式在这个 skill 里不算问题。</span></p>
        <p><span class="lang-en">The <code>references/</code> folder (tokens, typography, components, motion, data display, writing) and the nine page templates are cases to copy from, not rules.</span><span class="lang-zh"><code>references/</code> 下的配色、字体、组件、动画、数据展示、文案几篇,和九个页面模板,都是可以抄的案例,不是规则。</span></p>
        <p><a href="https://github.com/TbusOS/sky-skills/blob/main/skills/anthropic-design/SKILL.md"><span class="lang-en">Read SKILL.md</span><span class="lang-zh">读 SKILL.md</span></a></p>
      </div>
    </div>
  </div>
</section>
</main>

<footer class="foot">
  <div class="wrap">
    <h2><span class="lang-en">Where the numbers on this page come from</span><span class="lang-zh">这一页的数从哪来</span></h2>
    <ul class="src">
      <li><b><span class="lang-en">Contrast ratios</span><span class="lang-zh">对比度</span></b> — <span class="lang-en">computed in your browser with the WCAG 2.x relative-luminance formula; the figures in the text are computed by the build script with the same formula and checked against SKILL.md.</span><span class="lang-zh">浏览器按 WCAG 2.x 相对亮度公式现算;正文里的数由生成脚本用同一公式算出,并和 SKILL.md 对过。</span></li>
      <li><b><span class="lang-en">Rule history</span><span class="lang-zh">规则行数</span></b> — <code>git show &lt;commit&gt;:skills/anthropic-design/SKILL.md | grep -cE 'MUST|必须'</code>, <span class="lang-en">for each of the {{N_COMMITS}} commits.</span><span class="lang-zh">{{N_COMMITS}} 次提交逐个数。</span></li>
      <li><b><span class="lang-en">Diagram templates</span><span class="lang-zh">图例模板</span></b> — <code>skills/anthropic-design/templates/diagrams/*.svg</code>; <span class="lang-en">groups from the §15 headings of diagram-craft.md.</span><span class="lang-zh">分组按 diagram-craft.md 的 §15 小节标题。</span></li>
      <li><b><span class="lang-en">Check results</span><span class="lang-zh">检查结果</span></b> — <code>check_objective.mjs</code> <span class="lang-en">on {{CHECK_DATE}}, stored in</span><span class="lang-zh">{{CHECK_DATE}} 跑的,存在</span> <code>site/anthropic-design/checks.json</code>.</li>
      <li><b><span class="lang-en">This page</span><span class="lang-zh">这一页</span></b> — <span class="lang-en">generated by</span><span class="lang-zh">由</span> <code>site/anthropic-design/build.py</code><span class="lang-zh"> 生成</span>; <code>--check</code> <span class="lang-en">compares it byte for byte.</span><span class="lang-zh">逐字节比对。</span></li>
      <li><b><span class="lang-en">Illustrations</span><span class="lang-zh">示意图</span></b> — <span class="lang-en">the fan, the stage, the small loops and the example covers are drawn, not measured.</span><span class="lang-zh">色卡扇、排版台、小动画和范例封面是画的,不是测量结果。</span></li>
    </ul>
    <div class="foot-links">
      <a href="../../index.html">sky-skills</a>
      <a href="explainer.html"><span class="lang-en">Example page</span><span class="lang-zh">范例页</span></a>
      <a href="story.html"><span class="lang-en">The old landing page</span><span class="lang-zh">旧版首页</span></a>
      <a href="https://github.com/TbusOS/sky-skills/tree/main/skills/anthropic-design">GitHub</a>
    </div>
  </div>
</footer>
<div class="strip thin" id="strip-bot" aria-hidden="true"></div>

<script>
(function () {
  'use strict';
  var root = document.documentElement;
  var D = JSON.parse(document.getElementById('page-data').textContent);
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function safe(name, fn) { try { fn(); } catch (e) { console.error('[' + name + ']', e); } }
  function $(id) { return document.getElementById(id); }
  function bi(en, zh) { return '<span class="lang-en">' + en + '</span><span class="lang-zh">' + zh + '</span>'; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function lang() { return root.getAttribute('data-lang') === 'zh' ? 'zh' : 'en'; }

  // ── WCAG 2.x relative luminance ──
  function rgb(h) { h = h.replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  function lum(h) { var c = rgb(h).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
  function cr(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function mix(c, p, k) { var a = rgb(c), b = rgb(k || '#141413'); return '#' + a.map(function (v, i) { return ('0' + Math.round(v * p + b[i] * (1 - p)).toString(16)).slice(-2); }).join(''); }
  var P = {}; D.palette.forEach(function (p) { P[p.id] = p; });

  safe('lang', function () {
    $('lang-btn').addEventListener('click', function () {
      var l = lang() === 'zh' ? 'en' : 'zh';
      root.setAttribute('data-lang', l); root.lang = l === 'zh' ? 'zh-CN' : 'en';
      try { localStorage.setItem('sky-lang', l); } catch (e) {}
      document.dispatchEvent(new Event('langchange'));
    });
  });

  safe('strips', function () {
    var order = ['cream', 'subtle', 'card', 'line', 'ink', 'ink2', 'orange', 'orange2', 'orangek', 'blue', 'olive', 'gold', 'grey', 'danger', 'dark', 'darkbar', 'darkink', 'dred', 'dgold', 'dgreen'];
    var html = order.filter(function (k) { return P[k]; }).map(function (k) { return '<i style="background:' + P[k].hex + '"></i>'; }).join('');
    ['strip-top', 'strip-ff', 'strip-bot'].forEach(function (id) { var el = $(id); if (el) el.innerHTML = html; });
  });

  // ── 00 the fan deck ──
  safe('fan', function () {
    var ids = ['cream', 'subtle', 'ink', 'ink2', 'orange', 'orangek', 'blue', 'olive', 'gold', 'danger', 'dark'];
    var fan = $('fan'), cap = $('fan-cap'), n = ids.length, cream = P.cream.hex;
    var tips = {
      cream: ['Page background. Ink on it: ', '页面底。墨色字在上面:'],
      subtle: ['Secondary bands. Ink on it: ', '次级段落底。墨色字在上面:'],
      ink: ['Body text. On cream: ', '正文字。在米白底上:'],
      ink2: ['Secondary text. On cream: ', '次要字。在米白底上:'],
      orange: ['Accent: buttons, fills, the main path. As text on cream it is only ', '主色:按钮底、重点、主路径。在米白底上当字只有 '],
      orangek: ['Orange for small text. On cream: ', '小字用的橙。在米白底上:'],
      blue: ['Meaning, as lines and fills. Raw on cream: ', '语义色,画线和色块用原色。在米白底上:'],
      olive: ['Meaning, as lines and fills. Raw on cream: ', '语义色,画线和色块用原色。在米白底上:'],
      gold: ['Meaning, as lines and fills. Raw on cream: ', '语义色,画线和色块用原色。在米白底上:'],
      danger: ['Danger. On cream: ', '危险。在米白底上:'],
      dark: ['Terminals and code boxes. Its own text: ', '终端和代码框的底。框内字色:']
    };
    fan.innerHTML = ids.map(function (k, i) {
      var p = P[k], a = i - (n - 1) / 2;
      return '<button type="button" class="chip" data-k="' + k + '" aria-label="' + p.hex + ' ' + p.en + '" style="--k:' + a + ';--c:' + p.hex + ';--i:' + i + '"><span class="chip-tag">' + p.hex + '</span></button>';
    }).join('');
    function show(k) {
      var p = P[k], r;
      if (k === 'cream' || k === 'subtle') r = cr(P.ink.hex, p.hex);
      else if (k === 'dark') r = cr(P.darkink.hex, p.hex);
      else r = cr(p.hex, cream);
      var t = tips[k];
      var verdict = r >= 4.5 ? bi('passes AA for any size.', '任何字号都过 AA。') : r >= 3 ? bi('large text only.', '只够大字。') : bi('below even the large-text bar: fills and lines only.', '连大字门槛都不到:只用作色块和线条。');
      cap.innerHTML = '<b><span class="mono">' + p.hex + '</span> · ' + bi(p.en, p.zh) + '</b><br>' + bi(t[0], t[1]) + '<span class="mono">' + r.toFixed(2) + ' : 1</span> — ' + verdict;
      Array.prototype.forEach.call(fan.querySelectorAll('.chip'), function (c) { c.classList.toggle('on', c.getAttribute('data-k') === k); });
    }
    fan.addEventListener('mouseover', function (e) { var c = e.target.closest('.chip'); if (c) show(c.getAttribute('data-k')); });
    fan.addEventListener('focusin', function (e) { var c = e.target.closest('.chip'); if (c) show(c.getAttribute('data-k')); });
    fan.addEventListener('click', function (e) { var c = e.target.closest('.chip'); if (c) show(c.getAttribute('data-k')); });
    if (!reduce) {
      fan.classList.add('shut');
      requestAnimationFrame(function () { setTimeout(function () { fan.classList.remove('shut'); }, 180); });
    }
  });

  // ── 01 the stage: same blocks, five arrangements ──
  safe('stage', function () {
    var L = {
      editorial: { nav: [4, 4, 92, 7, 1], title: [12, 17, 58, 15, 1], text: [12, 38, 44, 42, 1], quote: [62, 38, 26, 17, 1], fig: [62, 60, 26, 22, 1], chart: [12, 85, 26, 9, 1], btn: [62, 86, 15, 8, 1] },
      report:    { nav: [4, 4, 92, 7, 1], title: [4, 16, 38, 9, 1], chart: [4, 30, 56, 46, 1], fig: [64, 16, 32, 34, 1], text: [64, 55, 32, 30, 1], quote: [4, 81, 56, 12, 1], btn: [80, 89, 16, 7, 1] },
      deck:      { nav: [4, 4, 92, 7, 0], title: [16, 12, 68, 14, 1], fig: [20, 32, 60, 44, 1], text: [28, 81, 30, 6, 0], quote: [30, 40, 0, 0, 0], chart: [70, 81, 16, 10, 0], btn: [42, 83, 16, 9, 1] },
      explainer: { nav: [4, 4, 92, 7, 1], title: [6, 18, 42, 15, 1], text: [6, 38, 38, 22, 1], btn: [6, 65, 16, 8, 1], fig: [52, 16, 42, 50, 1], chart: [6, 80, 42, 12, 1], quote: [52, 74, 42, 16, 1] },
      phone:     { nav: [36, 5, 28, 6, 1], title: [38, 14, 24, 9, 1], text: [38, 27, 24, 18, 1], fig: [38, 49, 24, 17, 1], chart: [38, 70, 24, 11, 1], btn: [38, 85, 13, 6, 1], quote: [38, 85, 0, 0, 0] }
    };
    var names = { editorial: ['Editorial', '长文'], report: ['Report', '报告'], deck: ['Deck', '幻灯片'], explainer: ['Explainer', '讲解页'], phone: ['Phone', '手机'] };
    var stage = $('stage'), tabs = $('stage-tabs'), keys = Object.keys(L), cur = 0, timer = null;
    tabs.innerHTML = keys.map(function (k, i) { return '<button class="tab" type="button" data-l="' + k + '" aria-pressed="' + (i === 0) + '">' + bi(names[k][0], names[k][1]) + '</button>'; }).join('');
    function apply(k) {
      stage.setAttribute('data-l', k);
      Array.prototype.forEach.call(stage.querySelectorAll('.blk'), function (b) {
        var r = L[k][b.getAttribute('data-b')];
        b.style.left = r[0] + '%'; b.style.top = r[1] + '%'; b.style.width = r[2] + '%'; b.style.height = r[3] + '%'; b.style.opacity = r[4];
      });
      Array.prototype.forEach.call(tabs.children, function (t) { t.setAttribute('aria-pressed', String(t.getAttribute('data-l') === k)); });
    }
    apply(keys[0]);
    tabs.addEventListener('click', function (e) {
      var t = e.target.closest('.tab'); if (!t) return;
      if (timer) { clearInterval(timer); timer = null; }
      cur = keys.indexOf(t.getAttribute('data-l')); apply(keys[cur]);
    });
    if (!reduce && 'IntersectionObserver' in window) {
      var started = false;
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting && !started) { started = true; timer = setInterval(function () { cur = (cur + 1) % keys.length; apply(keys[cur]); }, 3200); }
        });
      }, { threshold: 0.4 }).observe(stage);
    }
  });

  // ── 02 the palette lab ──
  var lab = { fg: 'orange', bg: 'cream', size: 16, bold: false };
  var FG = [
    ['ink', P.ink.hex, 'Ink', '墨色'], ['ink2', P.ink2.hex, 'Secondary', '次要字'],
    ['orange', P.orange.hex, 'Orange', '主色橙'], ['orange2', P.orange2.hex, 'Darker orange', '深一档橙'], ['orangek', P.orangek.hex, 'Orange for text', '小字用橙'],
    ['blue', P.blue.hex, 'Blue', '蓝'], ['blueT', mix(P.blue.hex, 0.62), 'Blue → text', '蓝(字色)'],
    ['olive', P.olive.hex, 'Olive', '橄榄绿'], ['oliveT', mix(P.olive.hex, 0.62), 'Olive → text', '绿(字色)'],
    ['gold', P.gold.hex, 'Gold', '金'], ['goldT', mix(P.gold.hex, 0.62), 'Gold → text', '金(字色)'],
    ['grey', P.grey.hex, 'Grey', '灰'], ['danger', P.danger.hex, 'Danger', '危险'], ['white', '#ffffff', 'White', '白'],
    ['darkink', P.darkink.hex, 'Dark-box text', '深色框字'], ['dred', P.dred.hex, 'Error, light', '浅色报错'], ['dgold', P.dgold.hex, 'Warning, light', '浅色警告'], ['dgreen', P.dgreen.hex, 'Pass, light', '浅色通过']
  ];
  var BG = [['cream', P.cream.hex, 'Page', '页面底'], ['subtle', P.subtle.hex, 'Subtle band', '次级段落底'], ['card', P.card.hex, 'Card', '卡片'], ['orange', P.orange.hex, 'Orange button', '橙色按钮'], ['dark', P.dark.hex, 'Dark box', '深色框'], ['darkbar', P.darkbar.hex, 'Title bar', '标题条']];
  function hexOf(list, id) { for (var i = 0; i < list.length; i++) if (list[i][0] === id) return list[i][1]; return '#000000'; }
  function nameOf(list, id) { for (var i = 0; i < list.length; i++) if (list[i][0] === id) return list[i]; return null; }
  var renderLab = function () {};
  safe('lab', function () {
    function chips(list, el, key) {
      el.innerHTML = list.map(function (x) { return '<button type="button" class="sw" data-id="' + x[0] + '" aria-pressed="false"><i style="--c:' + x[1] + '"></i>' + bi(x[2], x[3]) + '</button>'; }).join('');
      el.addEventListener('click', function (e) { var b = e.target.closest('.sw'); if (!b) return; lab[key] = b.getAttribute('data-id'); renderLab(true); });
    }
    chips(FG, $('lab-fg'), 'fg'); chips(BG, $('lab-bg'), 'bg');
    $('lab-size').addEventListener('input', function () { lab.size = +this.value; renderLab(false); });
    $('lab-bold').addEventListener('change', function () { lab.bold = this.checked; renderLab(true); });
    var svg = $('spec-svg'), lastPass = null;
    renderLab = function (pop) {
      var fg = hexOf(FG, lab.fg), bg = hexOf(BG, lab.bg), r = cr(fg, bg);
      var large = lab.size >= 24 || (lab.bold && lab.size >= 18.66), need = large ? 3 : 4.5, pass = r >= need;
      var lab2 = cr('#141413', bg) > cr('#ffffff', bg) ? '#141413' : '#ffffff';
      svg.innerHTML = '<rect width="100%" height="100%" fill="' + bg + '"/>' +
        '<text x="24" y="' + (88 + Math.min(lab.size, 48) * 0.35) + '" fill="' + fg + '" font-family="Lora, Noto Serif SC, serif" font-size="' + lab.size + '" font-weight="' + (lab.bold ? 700 : 400) + '">Aa 看得清 Read</text>' +
        '<text x="24" y="30" fill="' + lab2 + '" font-family="JetBrains Mono, monospace" font-size="12">' + fg + ' on ' + bg + ' · ' + lab.size + 'px' + (lab.bold ? ' bold' : '') + '</text>';
      $('r-num').textContent = r.toFixed(2);
      $('lab-size-out').textContent = lab.size + 'px';
      $('lab-size').value = lab.size; $('lab-bold').checked = lab.bold;
      $('r-need').innerHTML = large
        ? bi('Large text: needs <b>3 : 1</b>.', '大字:要 <b>3 : 1</b>。')
        : bi('Normal text: needs <b>4.5 : 1</b>. Large starts at 24px, or 18.66px bold.', '正文:要 <b>4.5 : 1</b>。大字从 24px 起,粗体从 18.66px 起。');
      var st = $('r-stamp');
      st.className = 'stamp ' + (pass ? 'pass' : 'fail');
      st.innerHTML = pass ? bi('passes AA', '过 AA') : bi('fails AA', '不过 AA');
      if (pop && lastPass !== null && !reduce) { st.classList.remove('pop'); void st.offsetWidth; st.classList.add('pop'); }
      lastPass = pass;
      [['lab-fg', lab.fg], ['lab-bg', lab.bg]].forEach(function (x) { Array.prototype.forEach.call($(x[0]).children, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-id') === x[1])); }); });
      drawRuler();
    };
    Array.prototype.forEach.call(document.querySelectorAll('.find .load'), function (b) {
      b.addEventListener('click', function () {
        lab.fg = b.getAttribute('data-fg'); lab.bg = b.getAttribute('data-bg'); lab.size = +b.getAttribute('data-size'); lab.bold = b.getAttribute('data-bold') === '1';
        renderLab(true); $('lab').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      });
    });
  });

  // the ruler: every text colour on the current background, log scale 1..21
  var drawRuler = function () {};
  safe('ruler', function () {
    var el = $('ruler');
    function x(r) { return Math.log(r) / Math.log(21) * 100; }
    var dots = {};
    el.innerHTML = '<div class="zone z-f" style="left:0;width:' + x(3) + '%"></div><div class="zone z-l" style="left:' + x(3) + '%;width:' + (x(4.5) - x(3)) + '%"></div><div class="zone z-p" style="left:' + x(4.5) + '%;right:0"></div>' +
      '<span class="zl" style="left:' + (x(3) / 2) + '%">' + bi('fails', '不过') + '</span><span class="zl" style="left:' + ((x(3) + x(4.5)) / 2) + '%">' + bi('large', '大字') + '</span><span class="zl" style="left:' + ((x(4.5) + 100) / 2) + '%">' + bi('any size', '任何字号') + '</span>' +
      '<div class="axis"></div>' + [1, 2, 3, 4.5, 7, 10, 21].map(function (t) { return '<div class="tick" style="left:' + x(t) + '%"></div><span class="tl" style="left:' + x(t) + '%">' + t + '</span>'; }).join('');
    FG.forEach(function (f) {
      var d = document.createElement('button'); d.type = 'button'; d.className = 'dot'; d.style.setProperty('--c', f[1]); d.setAttribute('aria-label', f[2] + ' ' + f[1]);
      d.addEventListener('click', function () { lab.fg = f[0]; renderLab(true); });
      var l = document.createElement('span'); l.className = 'dl'; l.textContent = f[1];
      el.appendChild(d); el.appendChild(l); dots[f[0]] = [d, l];
    });
    drawRuler = function () {
      var bg = hexOf(BG, lab.bg), w = el.clientWidth || 600, rows = [], items = FG.map(function (f) { return { id: f[0], r: cr(f[1], bg) }; });
      items.sort(function (a, b) { return a.r - b.r; });
      items.forEach(function (it) {
        var px = x(it.r) / 100 * w, row = 0;
        while (rows[row] !== undefined && px - rows[row] < 66) row++;
        rows[row] = px;
        var d = dots[it.id][0], l = dots[it.id][1];
        d.style.left = x(it.r) + '%'; l.style.left = x(it.r) + '%';
        l.style.top = (96 + row * 17) + 'px'; l.style.setProperty('--stem', (6 + row * 17) + 'px');
        var on = it.id === lab.fg; d.classList.toggle('cur', on); l.classList.toggle('cur', on);
        d.title = it.r.toFixed(2);
      });
      el.style.height = (110 + rows.length * 17) + 'px';
    };
    window.addEventListener('resize', function () { drawRuler(); });
  });
  safe('lab-init', function () { renderLab(false); });

  // ── 03 history chart ──
  safe('hist', function () {
    var H = D.history, svg = $('hist'), tip = $('hist-tip'), n = H.length, NS = 'http://www.w3.org/2000/svg';
    var X0 = 80, X1 = 900, Y0 = 330, mustTop = 16, linesTop = 250;
    function X(i) { return X0 + i * (X1 - X0) / (n - 1); }
    function YM(m) { return Y0 - m * (250 / mustTop); }
    function YL(l) { return Y0 - l * (250 / linesTop); }
    var s = '';
    [0, 5, 10, 15].forEach(function (t) { s += '<line x1="' + X0 + '" x2="' + X1 + '" y1="' + YM(t) + '" y2="' + YM(t) + '" stroke="#e8e6dc"/><text x="' + (X0 - 14) + '" y="' + (YM(t) + 5) + '" text-anchor="end" font-size="15" fill="#5e5d55">' + t + '</text>'; });
    [0, 100, 200].forEach(function (t) { s += '<text x="' + (X1 + 14) + '" y="' + (YL(t) + 5) + '" font-size="15" fill="#5e5d55">' + t + '</text>'; });
    var area = 'M' + X(0) + ' ' + Y0;
    H.forEach(function (h, i) { area += ' L' + X(i) + ' ' + YL(h.lines); if (i < n - 1) area += ' L' + X(i + 1) + ' ' + YL(h.lines); });
    area += ' L' + X(n - 1) + ' ' + Y0 + ' Z';
    s += '<path d="' + area + '" fill="#e8e6dc" opacity=".75"/>';
    var line = 'M' + X(0) + ' ' + YM(H[0].must);
    H.forEach(function (h, i) { if (i > 0) line += ' H' + X(i) + ' V' + YM(h.must); });
    s += '<path id="hist-line" d="' + line + '" fill="none" stroke="#a8502f" stroke-width="3.5" stroke-linejoin="round"/>';
    H.forEach(function (h, i) { s += '<circle cx="' + X(i) + '" cy="' + YM(h.must) + '" r="5.5" fill="#faf9f5" stroke="#a8502f" stroke-width="2.5"/>'; });
    var pk = 0; H.forEach(function (h, i) { if (h.must > H[pk].must) pk = i; });
    var rw = -1; H.forEach(function (h, i) { if (rw < 0 && i > 0 && h.must < H[i - 1].must - 5) rw = i; });
    s += '<text x="' + X(pk) + '" y="' + (YM(H[pk].must) - 18) + '" text-anchor="middle" font-size="16" font-weight="600" fill="#141413">' + H[pk].must + ' · ' + H[pk].d + '</text>';
    if (rw > 0) {
      s += '<line x1="' + X(rw) + '" x2="' + X(rw) + '" y1="62" y2="' + Y0 + '" stroke="#141413" stroke-dasharray="4 4"/>';
      s += '<text x="' + (X(rw) - 10) + '" y="78" text-anchor="end" font-size="16" font-weight="600" fill="#141413">' + H[rw].d + ' ' + H[rw - 1].must + ' → ' + H[rw].must + '</text>';
    }
    s += '<text x="' + X(0) + '" y="' + (Y0 + 30) + '" font-size="15" fill="#5e5d55">' + H[0].d + '</text>';
    s += '<text x="' + X(n - 1) + '" y="' + (Y0 + 30) + '" text-anchor="end" font-size="15" fill="#5e5d55">' + H[n - 1].d + '</text>';
    s += '<text x="' + X0 + '" y="' + (Y0 + 58) + '" font-size="15" fill="#a8502f">● MUST / 必须</text><rect x="' + (X0 + 200) + '" y="' + (Y0 + 46) + '" width="14" height="14" fill="#e8e6dc" stroke="#d9d6cb"/><text x="' + (X0 + 222) + '" y="' + (Y0 + 58) + '" font-size="15" fill="#5e5d55">lines / 总行数</text>';
    H.forEach(function (h, i) { s += '<rect class="hz" data-i="' + i + '" x="' + (X(i) - (X1 - X0) / (n - 1) / 2) + '" y="40" width="' + ((X1 - X0) / (n - 1)) + '" height="' + (Y0 - 30) + '" fill="transparent"/>'; });
    svg.innerHTML = s;
    function show(i, ev) {
      var h = H[i], box = $('hist-fig').getBoundingClientRect(), sb = svg.getBoundingClientRect();
      tip.innerHTML = '<b>' + esc(h.h) + '</b> · ' + esc(h.d) + '<br>' + esc(h.s) + '<br>' + bi('MUST / 必须 lines: ', 'MUST / 必须 行数:') + h.must + ' · ' + bi('total ', '总行数 ') + h.lines;
      var px = sb.left - box.left + X(i) / 1000 * sb.width, py = sb.top - box.top + YM(h.must) / 400 * sb.height;
      tip.style.left = Math.max(0, Math.min(box.width - 280, px - 140)) + 'px';
      tip.style.top = Math.max(0, py - 110) + 'px';
      tip.classList.add('on');
    }
    svg.addEventListener('mouseover', function (e) { var r = e.target.closest('.hz'); if (r) show(+r.getAttribute('data-i'), e); });
    svg.addEventListener('click', function (e) { var r = e.target.closest('.hz'); if (r) show(+r.getAttribute('data-i'), e); });
    svg.addEventListener('mouseleave', function () { tip.classList.remove('on'); });
    if (!reduce && 'IntersectionObserver' in window) {
      var p = $('hist-line'), len = p.getTotalLength();
      p.style.strokeDasharray = len; p.style.strokeDashoffset = len;
      new IntersectionObserver(function (es, ob) {
        es.forEach(function (e) { if (e.isIntersecting) { p.style.transition = 'stroke-dashoffset 2.2s cubic-bezier(.65,0,.2,1)'; p.style.strokeDashoffset = 0; ob.disconnect(); } });
      }, { threshold: 0.3 }).observe(svg);
    }
  });

  safe('left-lines', function () {
    $('left-lines').innerHTML = D.mustNow.map(function (m) {
      var req = /O5/.test(m.t), old = /原来有|当经验看/.test(m.t);
      var tag = req ? bi('a requirement, and check O5 tests it', '真的要求,检查 O5 查它') : old ? bi('describes the old rules', '在讲旧规则') : bi('other', '其他');
      return '<div class="ll' + (req ? ' req' : '') + '"><span class="n">:' + m.n + '</span><span class="t">' + esc(m.t.replace(/\*\*/g, '').replace(/`/g, '')) + '</span><span class="tag">' + tag + '</span></div>';
    }).join('');
  });

  // ── 04 page map lights up ──
  safe('pagemap', function () {
    var spans = $('pagemap').children;
    function light(on) { Array.prototype.forEach.call(spans, function (s) { s.classList.toggle('lit', on.indexOf(s.getAttribute('data-s')) >= 0); }); }
    Array.prototype.forEach.call(document.querySelectorAll('.way'), function (w) {
      var on = w.getAttribute('data-on').split(' ');
      w.addEventListener('mouseenter', function () { light(on); });
      w.addEventListener('focusin', function () { light(on); });
      w.addEventListener('mouseleave', function () { light([]); });
    });
  });

  // ── 05 diagram chooser + contact sheet ──
  safe('pick', function () {
    var base = '../../skills/anthropic-design/templates/diagrams/';
    var list = $('pick-list'), frame = $('pv-frame'), cap = $('pv-cap'), sheet = $('sheet');
    var G = [['general', 'Everyday shapes', '通用图型', 'flow, structure, time, state'], ['hw', 'Kernel, embedded and display hardware', '内核 / 嵌入式 / 显示硬件', 'diagram-craft §15.1–15.49 and the display-path series'], ['judge', 'Locating and judging', '定位与判断', 'diagram-craft §15.50–15.60']];
    var gzh = { general: '流程、结构、时间、状态', hw: 'diagram-craft §15.1–15.49 和显示通路那一组', judge: 'diagram-craft §15.50–15.60' };
    sheet.innerHTML = G.map(function (g) {
      var items = D.diagrams.filter(function (d) { return d.g === g[0]; });
      var cut = (items.length > 6 ? ' cut-m' : '') + (items.length > 16 ? ' cut-d' : '');
      return '<div class="grp' + cut + '"><h3>' + bi(g[1], g[2]) + ' <small>' + items.length + ' · ' + bi(g[3], gzh[g[0]]) + '</small></h3><div class="tiles">' + items.map(function (d) {
        return '<button type="button" class="tile" data-n="' + d.n + '"><img loading="lazy" decoding="async" src="' + base + d.n + '.svg" alt="' + d.n + '"><span>' + d.n + (d.sec ? ' · §' + d.sec : '') + '</span></button>';
      }).join('') + '</div>' + (cut ? '<button type="button" class="more-btn">' + bi('Show all ' + items.length, '显示全部 ' + items.length + ' 张') + '</button>' : '') + '</div>';
    }).join('');
    var SEC = {}; D.diagrams.forEach(function (d) { SEC[d.n] = d.sec; });
    function preview(name, files) {
      frame.innerHTML = '<img src="' + base + name + '.svg" alt="' + name + ' template">';
      cap.innerHTML = (files && files.length > 1 ? files : [name]).map(function (f) {
        return '<button type="button" data-f="' + f + '" aria-pressed="' + (f === name) + '">' + f + '.svg</button>';
      }).join('') + (SEC[name] ? '<span>diagram-craft §' + SEC[name] + '</span>' : '');
      Array.prototype.forEach.call(sheet.querySelectorAll('.tile'), function (t) { t.classList.toggle('cur', t.getAttribute('data-n') === name); });
    }
    var curFiles = null;
    function choose(i) {
      var c = D.chooser[i];
      Array.prototype.forEach.call(list.querySelectorAll('button'), function (b, j) { b.setAttribute('aria-pressed', String(j === i)); });
      sheet.classList.toggle('filtering', c.files.length > 0);
      Array.prototype.forEach.call(sheet.querySelectorAll('.tile'), function (t) { t.classList.toggle('hit', c.files.indexOf(t.getAttribute('data-n')) >= 0); });
      curFiles = c.files;
      if (c.files.length) preview(c.files[0], c.files);
      else {
        var what = c.recipe === '§18' ? bi('An ASCII tree: the one place the skill allows ASCII.', 'ASCII 树:这个 skill 唯一允许用 ASCII 的地方。') : bi('A window mock: draw the product inside a window frame.', '窗口示意:把产品画进一个窗口框里。');
        frame.innerHTML = '<div class="pv-recipe"><b>' + c.recipe + '</b>' + bi('No template file for this one. The recipe is in diagram-craft ' + c.recipe + '. ', '这一类没有模板文件,画法在 diagram-craft ' + c.recipe + '。') + what + '</div>';
        cap.innerHTML = '';
        Array.prototype.forEach.call(sheet.querySelectorAll('.tile'), function (t) { t.classList.remove('cur'); });
      }
    }
    list.innerHTML = D.chooser.map(function (c, i) {
      var tag = c.files.length ? c.files.length + ' svg' : c.recipe;
      return '<li><button type="button" aria-pressed="false" data-i="' + i + '"><span class="pn">' + (i + 1 < 10 ? '0' : '') + (i + 1) + '</span><span>' + bi(esc(c.en), esc(c.zh)) + '</span><span class="pc">' + tag + '</span></button></li>';
    }).join('');
    list.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) choose(+b.getAttribute('data-i')); });
    cap.addEventListener('click', function (e) { var b = e.target.closest('button[data-f]'); if (b) preview(b.getAttribute('data-f'), curFiles); });
    sheet.addEventListener('click', function (e) {
      var mb = e.target.closest('.more-btn'); if (mb) { mb.parentNode.classList.add('open'); return; }
      var t = e.target.closest('.tile'); if (!t) return;
      curFiles = null; preview(t.getAttribute('data-n'), null);
      if (window.innerWidth < 900) $('pick-view').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    });
    preview('call-site-locator', null);
  });

  // ── 06 lenses ──
  safe('lenses', function () {
    var T = {
      O1: ['JS errors', 'JS 报错',
        'Load the page and scroll from top to bottom; any pageerror or console.error fails. A broken script rarely breaks the look: a chart that never draws, a tab that never switches, and the page still seems finished. O1 listens instead of looking.',
        '加载页面并从头滚到尾,出现 pageerror 或 console.error 就失败。脚本坏了,页面往往看着还是好的:图没画出来、标签切不动,页面照样像做完了。O1 不靠看,靠听报错。'],
      O2: ['Text contrast', '文字对比度',
        'Scroll to the end, wait for fade-in animations to finish, then run axe-core\'s color-contrast rule at WCAG AA. Without the wait, text is measured halfway through its fade. axe-core does not measure text inside SVG, so figures need their own care: the numbers in section 02.',
        '滚到底、等浮现动画播完,再跑 axe-core 的 color-contrast(WCAG AA)。不等的话,字是在淡入到一半时被量的。axe-core 不量 SVG 里的字,图里的字色要自己照第 02 节的数挑。'],
      O3: ['Sideways scroll', '横向滚动',
        'At 1280 and 390 wide, scroll sideways once with a real mouse wheel; the page fails only if it moves. Measured on 2026-10-07: a layout {{O3_SW}}px wide in a {{O3_VW}}px window, yet scrollX stayed 0 because body had overflow-x: hidden. Without that line the same wheel moved the page {{O3_SX}}px. A wide layout is a warning; a page that slides is a defect. Touch dragging on a real phone is not simulated.',
        '1280 / 390 两个宽度下用鼠标真的横滚一次,页面动了才失败。2026-10-07 实测:窗口 {{O3_VW}} 宽,布局 {{O3_SW}} 宽,可 body 上有 overflow-x: hidden,scrollX 一直是 0;去掉那条再滚,页面动了 {{O3_SX}}px。布局超宽只算提醒,页面滑得动才是缺陷。手机上的触摸拖动模拟不了,真机才算数。'],
      O4: ['Figure text on a phone', '手机上图里的字',
        'At 390 wide, any SVG text that renders under 9px fails. A figure drawn 1200 units wide and squeezed into a 358px column turns 12-unit labels into {{O4_PX}}px. The skill\'s answer is a pan box: give the figure a minimum width so its smallest text stays at 9px, and let it drag sideways inside its frame. Pictures whose text needs no reading are marked data-allow-shrink and skipped.',
        '390 宽下,SVG 文字实际渲染不到 9px 就失败。一张按 1200 宽画的图塞进 358px 宽的栏,12 号字会缩成 {{O4_PX}}px。skill 给的办法是拖动框:给图一个最小宽度,让最小的字刚好 9px,图在框里左右拖。字不需要读的图片类标 data-allow-shrink,不查。'],
      O5: ['Complete without motion', '关掉动画也完整',
        'With prefers-reduced-motion: reduce and no scrolling, no h1–h3, p or li may be invisible. Scroll reveals usually start at opacity 0 and wait for a scroll that never comes for someone who turned motion off. This page adds its reveal class only from script, and only when motion is allowed.',
        '「减少动态效果」打开、不滚动时,h1–h3、p、li 不能有看不见的。滚动浮现通常从透明开始,等一次滚动;关掉动画的读者那里,这次滚动永远不来。这一页的浮现类只由脚本加,而且只在允许动画时才加。']
    };
    var det = $('lens-detail'), lenses = $('lenses'), narrow = window.matchMedia('(max-width: 640px)'), cur = 'O1';
    function place() {
      var b = lenses.querySelector('[data-o="' + cur + '"]');
      if (narrow.matches) b.after(det); else if (det.parentNode === lenses) lenses.after(det);
    }
    if (narrow.addEventListener) narrow.addEventListener('change', place);
    function show(o) {
      var t = T[o]; cur = o; place();
      det.innerHTML = '<div class="big">' + o + '</div><h3>' + bi(t[0], t[1]) + '</h3><p>' + bi(t[2], t[3]) + '</p>';
      Array.prototype.forEach.call(lenses.children, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-o') === o)); });
    }
    lenses.addEventListener('click', function (e) { var b = e.target.closest('.lens'); if (b) show(b.getAttribute('data-o')); });
    show('O1');
  });

  safe('evidence', function () {
    var C = D.checks, os = ['O1', 'O2', 'O3', 'O4', 'O5'], k = 0;
    $('matrix').innerHTML = '<thead><tr><th>' + bi('page', '页面') + '</th>' + os.map(function (o) { return '<th>' + o + '</th>'; }).join('') + '</tr></thead><tbody>' +
      C.pages.map(function (p) {
        return '<tr><td><a href="' + p.f + '">' + p.f + '</a></td>' + os.map(function (o) {
          var r = p.res[o]; k++;
          return '<td><i class="mk ' + r.st + '" style="--d:' + k + '" title="' + esc(r.msg) + '"></i></td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody>';
    $('selftest').innerHTML = '<span class="prompt">$</span> node check_objective.mjs --self-test\n' + C.selftest.split('\n').map(function (l) {
      var e = esc(l);
      if (/★/.test(l)) return '<span class="bad">' + e + '</span>';
      if (/自测:/.test(l)) return '<span class="hl">' + e + '</span>';
      if (/^\s*通过/.test(l)) return '<span class="ok">' + e + '</span>';
      return '<span class="dim">' + e + '</span>';
    }).join('\n');
  });

  // ── 07 examples ──
  safe('examples', function () {
    var ART = {
      layers: '<rect x="40" y="40" width="240" height="22" rx="4" fill="#6a9bcc"/><rect x="40" y="68" width="240" height="22" rx="4" fill="#788c5d"/><rect x="40" y="96" width="240" height="22" rx="4" fill="#c9913f"/><rect x="40" y="124" width="240" height="22" rx="4" fill="#d97757"/><circle cx="110" cy="22" r="7" fill="#141413"/><circle cx="170" cy="14" r="7" fill="#141413"/><circle cx="300" cy="150" r="7" fill="#a14238"/><path d="M290 150 l20 0 M300 140 l0 20" stroke="#faf9f5" stroke-width="2" transform="rotate(45 300 150)"/>',
      screen: '<rect x="44" y="70" width="70" height="44" rx="6" fill="#ffffff" stroke="#141413" stroke-width="2"/><rect x="58" y="82" width="42" height="20" rx="3" fill="#6a9bcc"/><rect x="214" y="22" width="66" height="128" rx="12" fill="#ffffff" stroke="#141413" stroke-width="2"/><rect x="222" y="36" width="50" height="96" rx="3" fill="#f0ede3"/><path d="M114 92 C150 92 160 60 214 60" fill="none" stroke="#d97757" stroke-width="3"/><path d="M114 92 C150 92 165 120 214 118" fill="none" stroke="#788c5d" stroke-width="3" stroke-dasharray="6 5"/><circle cx="160" cy="76" r="5" fill="#d97757"/>',
      panel: '<g transform="translate(70 30)"><rect x="0" y="0" width="150" height="16" rx="3" fill="#6a9bcc" opacity=".9"/><rect x="0" y="22" width="150" height="16" rx="3" fill="#788c5d" opacity=".9"/><rect x="0" y="44" width="150" height="16" rx="3" fill="#c9913f" opacity=".9"/><rect x="0" y="66" width="150" height="16" rx="3" fill="#b0aea5"/><path d="M150 74 C190 74 190 120 230 120" fill="none" stroke="#141413" stroke-width="8"/><path d="M150 74 C190 74 190 120 230 120" fill="none" stroke="#d97757" stroke-width="3" stroke-dasharray="2 4"/></g>',
      bit: '<g transform="translate(70 26)" fill="none" stroke="#141413" stroke-width="2.5"><path d="M30 20 V100 M150 20 V100 M30 60 H70 M110 60 H150"/><circle cx="90" cy="60" r="20" fill="#ffffff"/><circle cx="90" cy="60" r="8" fill="#d97757" stroke="none"/><rect x="20" y="10" width="20" height="20" rx="4" fill="#6a9bcc" stroke="none"/><rect x="140" y="10" width="20" height="20" rx="4" fill="#788c5d" stroke="none"/><rect x="20" y="90" width="20" height="20" rx="4" fill="#c9913f" stroke="none"/><rect x="140" y="90" width="20" height="20" rx="4" fill="#c9913f" stroke="none"/></g>',
      chip: '<rect x="40" y="128" width="240" height="14" rx="3" fill="#788c5d"/><rect x="90" y="100" width="140" height="16" rx="3" fill="#c9913f"/><rect x="120" y="70" width="80" height="18" rx="3" fill="#6a9bcc"/><rect x="138" y="36" width="44" height="22" rx="3" fill="#d97757"/><g fill="#141413"><circle cx="100" cy="122" r="3"/><circle cx="130" cy="122" r="3"/><circle cx="160" cy="122" r="3"/><circle cx="190" cy="122" r="3"/><circle cx="220" cy="122" r="3"/></g><path d="M160 58 V68 M160 88 V98" stroke="#141413" stroke-width="2" stroke-dasharray="3 3"/>',
      queue: '<path d="M40 140 H290 M40 140 V20" stroke="#141413" stroke-width="2"/><path d="M40 132 C140 128 200 120 230 96 C250 78 262 50 270 24" fill="none" stroke="#a8502f" stroke-width="3.5"/><line x1="232" y1="20" x2="232" y2="140" stroke="#141413" stroke-dasharray="4 4"/><g fill="#6a9bcc"><rect x="60" y="112" width="18" height="28"/><rect x="84" y="104" width="18" height="36"/><rect x="108" y="118" width="18" height="22"/></g>',
      eye: '<g fill="none" stroke="#e8e6dc" stroke-width="1.5"><path d="M40 40 H280 M40 80 H280 M40 120 H280 M100 20 V150 M160 20 V150 M220 20 V150"/></g><circle cx="168" cy="82" r="40" fill="#ffffff" stroke="#141413" stroke-width="3"/><rect x="146" y="68" width="18" height="12" rx="2" fill="#6a9bcc"/><rect x="170" y="86" width="20" height="12" rx="2" fill="#d97757"/><path d="M196 110 L232 146" stroke="#141413" stroke-width="7" stroke-linecap="round"/>',
      grid: '<g><rect x="40" y="22" width="70" height="54" rx="5" fill="#ffffff" stroke="#6a9bcc" stroke-width="2"/><rect x="125" y="22" width="70" height="54" rx="5" fill="#ffffff" stroke="#788c5d" stroke-width="2"/><rect x="210" y="22" width="70" height="54" rx="5" fill="#ffffff" stroke="#c9913f" stroke-width="2"/><rect x="40" y="90" width="70" height="54" rx="5" fill="#ffffff" stroke="#d97757" stroke-width="2"/><rect x="125" y="90" width="70" height="54" rx="5" fill="#ffffff" stroke="#b0aea5" stroke-width="2"/><rect x="210" y="90" width="70" height="54" rx="5" fill="#ffffff" stroke="#141413" stroke-width="2"/><path d="M52 60 H98 M137 40 V64 M222 64 L268 34 M52 120 h20 v14 h20 M137 130 h46 M222 104 h46 v30" stroke="#141413" stroke-width="2" fill="none"/></g>',
      story: '<g transform="translate(160 150)"><rect x="-40" y="-120" width="80" height="104" rx="6" fill="#ffffff" stroke="#e8e6dc" transform="rotate(-24)"/><rect x="-40" y="-120" width="80" height="104" rx="6" fill="#f0ede3" stroke="#d9d6cb" transform="rotate(-12)"/><rect x="-40" y="-120" width="80" height="104" rx="6" fill="#1c1b18" transform="rotate(12)"/><rect x="-40" y="-120" width="80" height="104" rx="6" fill="#ffffff" stroke="#141413" stroke-width="2" transform="rotate(0)"/><rect x="-28" y="-104" width="40" height="8" rx="2" fill="#141413"/><rect x="-28" y="-88" width="56" height="4" rx="2" fill="#b0aea5"/><rect x="-28" y="-40" width="34" height="12" rx="6" fill="#d97757"/></g>',
      v2: '<rect x="40" y="22" width="240" height="124" rx="8" fill="#ffffff" stroke="#d9d6cb"/><rect x="40" y="22" width="240" height="18" rx="8" fill="#f0ede3"/><g fill="#c9913f"><rect x="58" y="96" width="16" height="34"/><rect x="80" y="80" width="16" height="50"/><rect x="102" y="66" width="16" height="64"/><rect x="124" y="88" width="16" height="42"/></g><g fill="#e8e6dc"><rect x="160" y="58" width="104" height="10" rx="2"/><rect x="160" y="76" width="104" height="10" rx="2"/><rect x="160" y="94" width="104" height="10" rx="2"/></g><rect x="160" y="114" width="52" height="16" rx="8" fill="#d97757"/>'
    };
    $('exs').innerHTML = D.examples.map(function (e, i) {
      return '<a class="ex' + (e.feature ? ' feature' : '') + '" href="' + e.f + '"><div class="ex-art"><svg viewBox="0 0 320 170" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' + (ART[e.art] || '') + '</svg></div>' +
        '<div class="ex-body"><span class="f">' + e.f + ' · ' + e.lines + ' ' + bi('lines', '行') + '</span><h3>' + esc(e.title) + '</h3><p>' + bi(esc(e.en), esc(e.zh)) + '</p></div></a>';
    }).join('');
  });

  // ── 08 routing ──
  safe('route', function () {
    $('phr').innerHTML = D.phrases.map(function (p) { return '<span>' + esc(p) + '</span>'; }).join('');
    var gl = { 'apple 风格': 'Apple style', '零基础图解': 'Explainers for complete beginners', '深色玻璃展示': 'A dark glass showcase', '只给自己看一次的数据页': 'A data page you read once and throw away', '高饱和霓虹': 'High-saturation neon' };
    var link = { 'apple-design': '../apple-design/index.html', 'primer-design': '../primer-design/index.html', 'glass-design': '../glass-design/index.html' };
    $('else').innerHTML += D.routes.map(function (r) {
      var to = r.to || '';
      var key = to.split(' ')[0];
      var target = key === 'explain-ladder' ? '<a href="../explain-ladder/index.html">' + esc(to) + '</a>' : link[key] ? '<a href="' + link[key] + '">' + esc(to) + '</a>' : bi('no skill here', '这里没有对应的 skill');
      return '<div class="er"><span>' + bi(esc(gl[r.what] || r.what), esc(r.what)) + '</span><span class="ar" aria-hidden="true"></span><span class="to">' + target + '</span></div>';
    }).join('');
  });

  safe('copy', function () {
    $('copy-btn').addEventListener('click', function () {
      var t = 'git clone https://github.com/TbusOS/sky-skills.git\ncd sky-skills\ncp -r skills/anthropic-design skills/design-review ~/.claude/skills/';
      var b = this;
      function done() { b.innerHTML = bi('copied', '已复制'); setTimeout(function () { b.innerHTML = bi('copy', '复制'); }, 1600); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, function () {}); else done();
    });
  });

  // ── reveal: on only when motion is allowed; content never depends on it ──
  safe('reveal', function () {
    if (reduce || !('IntersectionObserver' in window)) return;
    var els = document.querySelectorAll('.rv, .tickets, .matrix-wrap');
    root.classList.add('rv-on');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    Array.prototype.forEach.call(els, function (el) { io.observe(el); });
  });
})();
</script>
</body>
</html>
