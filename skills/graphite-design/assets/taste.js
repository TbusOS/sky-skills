/* graphite-design · taste.js — learns how one person likes their pencil drawings.
 *
 * Since 2026-10-11 this is a thin wrapper: the learning rule is the shared engine in
 * skills/design-taste/assets/taste-core.js (how a value is estimated, how the next
 * question is chosen, and why — see that file's header), and graphite's knobs,
 * defaults and words are in ./taste-profile.js. The interface is unchanged:
 * Taste.estimate / ab / pick / say / apply / parse / KNOBS / CATS / LEXICON / WEIGHT …
 * so scripts/taste.mjs, templates/src/90-taste.mjs and the taste lab on the showcase
 * page keep working, and for graphite's own events the numbers are the same as before.
 *
 * In a page, load in this order:
 *   skills/design-taste/assets/shared.js
 *   skills/design-taste/assets/taste-core.js
 *   skills/graphite-design/assets/taste-profile.js
 *   skills/graphite-design/assets/taste.js        -> window.Taste
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../../design-taste/assets/taste-core.js'), require('./taste-profile.js'));
  } else {
    root.Taste = factory(root.TasteCore, root.GraphiteTasteProfile);
  }
})(this, function (Core, profile) {
  'use strict';
  return Core.create(profile);
});
