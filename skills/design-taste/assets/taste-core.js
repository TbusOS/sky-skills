/* design-taste · taste-core.js — learns how one person likes their drawings, for
 * every design style at once.
 *
 * The engine knows no style. A style hands it a parameter table (its
 * assets/taste-profile.js: knobs, defaults, ranges, words, which knobs are shared)
 * and gets back an object with the same interface graphite's taste.js always had:
 * estimate / ab / pick / say / apply / parse, plus explain and annotate.
 *
 * Every reaction is one event in a log — a pick between two variants, a sentence
 * ("too busy"), a kept or deleted figure, a reviewer's note, a reference image.
 * The current taste is recomputed from the whole log every time, so it can always
 * be explained: explain() lists, per knob, which events moved it and by how much.
 *
 * How a value is estimated (per numeric knob):
 *   - start at the house default with the weight of 2 events (a prior: one stray
 *     click must not throw the style around)
 *   - walk the events in time order; each one is an observation x with weight w,
 *     and the estimate becomes the weighted mean   m <- (m·W + x·w) / (W + w)
 *       pick    x = the winner's value             w = 1
 *       keep    x = the kept figure's value        w = 0.5
 *       drop    x = mirrored away from m           w = 0.5
 *       say     x = m ± 2 steps (from the lexicon) w = 1
 *       review  x = m ± 2 steps                    w = 0.3   (a critic is not the reader)
 *       ref     x = measured from a reference      w = 0.5   (like keeping one figure)
 *   - older events count less: weight × 0.5^(age / 90 days). Taste drifts.
 *   - accumulated weight is capped at 8, so a long-time reader can still change.
 *   - constraints (min / max) are applied last. They come from objective checks
 *     ("labels under 9 px on a phone") and are not preferences: they never decay.
 * Why a weighted mean: with ten or twenty events a year, anything with more
 * parameters would fit noise, and a mean is the one estimator a reader can check
 * by hand. (This part is graphite's algorithm unchanged, 2026-10-10.)
 *
 * Two steps, so one scene does not drag the others along (design: docs/superpowers/specs/2026-10-10-inkwash-design-design.md §10.3):
 *   1. style taste — all of this style's events, as above
 *   2. scene taste — start from the step-1 value with weight 2, walk only the
 *      events recorded in that scene group ("tech diagram", "wallpaper" …)
 *   With one or two events in a scene the result stays close to the style taste;
 *   only many events pull a scene away. Without a scene only step 1 runs, and with
 *   a single style step 1 is exactly graphite's old estimate.
 *
 * Events from other styles (same design, §10.5) count in step 1 at half weight,
 * and only through the five shared knobs (shared.js). They carry, written when the
 * event was made: `shared` = how far each shared knob sat from that style's
 * default, as a share of its range; `sdir` = directions from shared words only;
 * `scat` = shared categories. annotate() fills these in for old events.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./shared.js'));
  else root.TasteCore = factory(root.TasteShared);
})(this, function (Shared) {
  'use strict';

  var WEIGHT = { pick: 1, keep: 0.5, drop: 0.5, say: 1, review: 0.3, ref: 0.5 };
  // WMAX caps how much accumulated evidence can anchor a value: every new event
  // still moves the estimate at least w / (WMAX + w) of the way.
  var PRIOR = 2, WMAX = 8, HALF_LIFE_DAYS = 90, STREAK_CAP = 2;
  // A sentence said about another style's drawing weighs half: "labels too small"
  // said here is stronger evidence than the same words said about a pencil sketch.
  var FOREIGN = 0.5;

  function age(ts, now) { return Math.max(0, (now - Date.parse(ts)) / 864e5); }
  function decay(ts, now) { return Math.pow(0.5, age(ts, now) / HALF_LIFE_DAYS); }
  function byTime(a, b) { return Date.parse(a.ts) - Date.parse(b.ts); }

  function matchWords(lexicon, text) {
    var dir = {}, cat = {}, hits = [], t = String(text || '').toLowerCase();
    lexicon.forEach(function (L) {
      var m = t.match(new RegExp(L.re, 'i'));
      if (!m) return;
      hits.push(m[0]);
      for (var k in L.dir || {}) dir[k] = (dir[k] || 0) + L.dir[k];
      for (var c in L.cat || {}) cat[c] = L.cat[c];
    });
    for (var k2 in dir) dir[k2] = Math.max(-1, Math.min(1, dir[k2]));
    return { dir: dir, cat: cat, hits: hits };
  }

  function create(profile) {
    var KNOBS = profile.KNOBS, CATS = profile.CATS || {}, LEXICON = profile.LEXICON || [];
    var STYLE = profile.style, SHARED = profile.shared || {}, AB_SKIP = profile.abSkip || [];
    var toShared = {};                                   // own knob / cat name -> shared name
    for (var sn in SHARED) toShared[SHARED[sn]] = sn;

    function clamp(v, k) { var K = KNOBS[k]; v = Math.max(K.min, Math.min(K.max, v)); return K.int ? Math.round(v) : Math.round(v * 1000) / 1000; }
    function isOwn(e) { return e.style == null || e.style === STYLE; }

    // Free words -> directions on this style's knobs. Same rule graphite always had.
    function parse(text) { return matchWords(LEXICON, text); }

    // Fill in the shared part of an event made by this style (pure: returns a copy).
    // Other styles read only this part.
    function annotate(e) {
      var out = Object.assign({}, e);
      if (out.style == null) out.style = STYLE;
      var sh = {}, any = false;
      for (var k in e.knobs || {}) {
        var name = toShared[k];
        if (!name || !KNOBS[k]) continue;
        var K = KNOBS[k];
        sh[name] = Math.round((e.knobs[k] - K.def) / (K.max - K.min) * 1000) / 1000; any = true;
      }
      if (any) out.shared = sh;
      if ((e.kind === 'say' || e.kind === 'review') && e.note && !e.sdir) {
        var p = matchWords(Shared.LEXICON, e.note);
        if (Object.keys(p.dir).length) out.sdir = p.dir;
        if (Object.keys(p.cat).length) out.scat = p.cat;
      }
      if (e.cat && !out.scat) {
        var sc = {}, anyc = false;
        for (var c in e.cat) if (toShared[c]) { sc[toShared[c]] = e.cat[c]; anyc = true; }
        if (anyc) out.scat = sc;
      }
      return out;
    }

    // One pass over events. start: null = house defaults; else { m: {knob: value}, cat: {name: value} }.
    function walk(events, now, start, tag) {
      var est = {}, trace = {}, min = {}, max = {}, cats = {};
      for (var k in KNOBS) { est[k] = { m: start ? start.m[k] : KNOBS[k].def, W: PRIOR }; trace[k] = []; }
      for (var c in CATS) { cats[c] = {}; cats[c][start ? start.cat[c] : CATS[c].def] = 0.5; }
      events.forEach(function (e, idx) {
        var own = isOwn(e);
        if (e.kind === 'constraint') {
          if (!own) return;                              // an objective floor belongs to its style
          for (var kk in e.min || {}) min[kk] = Math.max(min[kk] == null ? -Infinity : min[kk], e.min[kk]);
          for (var kx in e.max || {}) max[kx] = Math.min(max[kx] == null ? Infinity : max[kx], e.max[kx]);
          return;
        }
        var w = (e.w != null ? e.w : (WEIGHT[e.kind] || 0.5)) * decay(e.ts, now);
        if (!own) w *= FOREIGN;
        function obs(k, x) {
          if (!KNOBS[k]) return;
          var s = est[k], before = s.m;
          x = Math.max(KNOBS[k].min, Math.min(KNOBS[k].max, x));
          s.m = (s.m * s.W + x * w) / (s.W + w); s.W = Math.min(WMAX, s.W + w);
          s.E = (s.E || 0) + w;
          var row = { i: idx, kind: e.kind, ts: e.ts, note: e.note || '', x: Math.round(x * 1000) / 1000, w: Math.round(w * 100) / 100, from: Math.round(before * 1000) / 1000, to: Math.round(s.m * 1000) / 1000 };
          if (!own) row.style = e.style;
          if (tag) row.scene = tag;
          trace[k].push(row);
        }
        if (own) {
          var kv = e.knobs || {};
          for (var k1 in kv) {
            if (e.kind === 'drop') obs(k1, est[k1] ? est[k1].m - (kv[k1] - est[k1].m) : kv[k1]);
            else obs(k1, kv[k1]);
          }
          var dv = e.dir || {};
          for (var k2 in dv) if (KNOBS[k2]) obs(k2, est[k2].m + dv[k2] * KNOBS[k2].step * 2);
          var cv = e.cat || {};
          for (var c2 in cv) if (CATS[c2]) cats[c2][cv[c2]] = (cats[c2][cv[c2]] || 0) + w;
          return;
        }
        // another style: only the shared knobs, converted through ranges
        var sv = e.shared || {};
        for (var n1 in sv) {
          var k3 = SHARED[n1], K3 = KNOBS[k3];
          if (!K3) continue;
          var x3 = K3.def + sv[n1] * (K3.max - K3.min);
          obs(k3, e.kind === 'drop' ? est[k3].m - (x3 - est[k3].m) : x3);
        }
        var sd = e.sdir || {};
        for (var n2 in sd) { var k4 = SHARED[n2]; if (KNOBS[k4]) obs(k4, est[k4].m + sd[n2] * KNOBS[k4].step * 2); }
        var scv = e.scat || {};
        for (var n3 in scv) { var c4 = SHARED[n3]; if (CATS[c4]) cats[c4][scv[n3]] = (cats[c4][scv[n3]] || 0) + w; }
      });
      return { est: est, trace: trace, min: min, max: max, cats: cats };
    }

    function finish(r, extraEvidence) {
      var out = { knobs: {}, cats: {}, evidence: {}, trace: r.trace, constraints: { min: r.min, max: r.max }, raw: {} };
      for (var k in r.est) {
        var v = r.est[k].m;
        out.raw[k] = v;
        if (r.min[k] != null) v = Math.max(v, r.min[k]);
        if (r.max[k] != null) v = Math.min(v, r.max[k]);
        out.knobs[k] = clamp(v, k);
        out.evidence[k] = Math.round(((r.est[k].E || 0) + ((extraEvidence || {})[k] || 0)) * 100) / 100;
      }
      for (var c in r.cats) {
        var best = CATS[c].def, bw = -1;
        for (var v2 in r.cats[c]) if (r.cats[c][v2] > bw) { bw = r.cats[c][v2]; best = v2; }
        out.cats[c] = best;
      }
      return out;
    }

    // The current taste. opts.scene: a scene group name; only events recorded in it
    // move step 2. now: ms (defaults to Date.now()).
    function estimate(events, now, opts) {
      now = now || Date.now(); opts = opts || {};
      var sorted = events.slice().sort(byTime);
      var base = finish(walk(sorted, now, null, null));
      if (!opts.scene) return base;
      var inScene = sorted.filter(function (e) { return e.scene === opts.scene && isOwn(e) && e.kind !== 'constraint'; });
      var step2 = walk(inScene, now, { m: base.raw, cat: base.cats }, opts.scene);
      step2.min = base.constraints.min; step2.max = base.constraints.max;
      var out = finish(step2, base.evidence);
      out.style = base;                                  // step 1, for explain()
      var tr = {};
      for (var k in base.trace) tr[k] = base.trace[k].concat(step2.trace[k]);
      out.trace = tr;
      out.scene = opts.scene;
      return out;
    }

    // Next question: which single knob to test, and the two values to show.
    function ab(events, now, opts) {
      opts = opts || {};
      var t = estimate(events, now, opts), best = null;
      // tested: how often each knob was asked; streak: how many answers in a row pointed
      // the same way. A streak means the reader is still far from the current value, so
      // that knob keeps priority until the answers start to alternate around it. The
      // bonus stops growing after STREAK_CAP answers (graphite, 2026-10-10: uncapped,
      // a knob near its floor took 18 of 24 questions).
      var tested = {}, last = {}, streak = {};
      events.forEach(function (e) {
        if (e.kind !== 'pick' || !isOwn(e)) return;
        if (opts.scene && e.scene !== opts.scene) return;
        for (var k in e.knobs || {}) {
          tested[k] = (tested[k] || 0) + 1;
          var d = e.other && e.other[k] != null ? (e.knobs[k] > e.other[k] ? 1 : -1) : 0;
          streak[k] = d && d === last[k] ? (streak[k] || 0) + 1 : 0; last[k] = d;
        }
      });
      for (var k in KNOBS) {
        if (AB_SKIP.indexOf(k) >= 0) continue;           // knobs a still pair of drawings cannot show
        var K = KNOBS[k], u = K.step / (K.max - K.min) / Math.sqrt(1 + t.evidence[k]) / (1 + (tested[k] || 0) * 0.2) * Math.pow(1.8, Math.min(streak[k] || 0, STREAK_CAP));
        if (!best || u > best.u) best = { k: k, u: u };
      }
      var K2 = KNOBS[best.k], cur = t.knobs[best.k], d = K2.step * 2;
      var lo = clamp(cur - d, best.k), hi = clamp(cur + d, best.k);
      if (lo === cur) hi = clamp(cur + 2 * d, best.k);   // at the floor: compare current with more
      if (hi === cur) lo = clamp(cur - 2 * d, best.k);   // at the ceiling: compare current with less
      if (lo === cur && hi !== cur) lo = cur;
      var a = Object.assign({}, t.knobs), b = Object.assign({}, t.knobs);
      a[best.k] = lo; b[best.k] = hi;
      return { knob: best.k, label: { zh: K2.zh, en: K2.en }, a: a, b: b, values: [lo, hi], current: cur };
    }

    // Event constructors (ts filled in by the caller's clock). ctx: { scene } optional.
    function stamp(e, ctx) {
      if (ctx && ctx.scene) e.scene = ctx.scene;
      return e;
    }
    function pick(knob, winnerValue, loserValue, note, ctx) {
      var e = { kind: 'pick', knobs: {}, note: note || '' };
      e.knobs[knob] = winnerValue; e.other = {}; e.other[knob] = loserValue;
      return stamp(e, ctx);
    }
    function say(text, ctx) { var p = parse(text); return stamp({ kind: 'say', dir: p.dir, cat: p.cat, note: text, hits: p.hits }, ctx); }

    // Which knobs moved away from the house value, and the events that moved them.
    // The same list feeds the command line and the little seal on a drawing.
    function explain(t, limit) {
      var rows = [];
      for (var k in KNOBS) {
        if (t.knobs[k] === KNOBS[k].def) continue;
        var tr = t.trace[k] || [];
        rows.push({ knob: k, zh: KNOBS[k].zh, en: KNOBS[k].en, value: t.knobs[k], def: KNOBS[k].def,
          why: tr.slice(-(limit || 5)), count: tr.length,
          floor: t.constraints.min[k], ceil: t.constraints.max[k] });
      }
      for (var c in CATS) if (t.cats[c] !== CATS[c].def) rows.push({ cat: c, zh: CATS[c].zh, en: CATS[c].en, value: t.cats[c], def: CATS[c].def, why: [], count: 0 });
      return rows;
    }

    // What a drawing records about the taste it was drawn with (data-taste on the SVG root).
    function stampOf(t) {
      var moved = {};
      for (var k in KNOBS) if (t.knobs[k] !== KNOBS[k].def) moved[k] = t.knobs[k];
      return JSON.stringify({ style: STYLE, scene: t.scene || null, knobs: moved });
    }

    function apply(t) { return profile.apply ? profile.apply(t) : { knobs: t.knobs, prefer: t.cats }; }

    return { style: STYLE, KNOBS: KNOBS, CATS: CATS, LEXICON: LEXICON, SHARED: SHARED, SCENES: profile.SCENES || [],
      WEIGHT: WEIGHT, PRIOR: PRIOR, WMAX: WMAX, HALF_LIFE_DAYS: HALF_LIFE_DAYS, FOREIGN: FOREIGN,
      parse: parse, estimate: estimate, ab: ab, pick: pick, say: say, apply: apply,
      explain: explain, annotate: annotate, stampOf: stampOf, profile: profile };
  }

  return { create: create, Shared: Shared, WEIGHT: WEIGHT, PRIOR: PRIOR, WMAX: WMAX, HALF_LIFE_DAYS: HALF_LIFE_DAYS, FOREIGN: FOREIGN };
});
