/* Kodak test-suite selector. Populates #kodakSelect with the 24 committed
 * Kodak images (relative to this script's containing page at exp/<exp>/), and
 * on selection loads the image via the page's loadFromUrl (the same path the
 * report deep-links use). Requires a global `loadFromUrl(url)` that feeds an
 * Image through processImage, matching the app's existing pipeline. */
(function () {
  'use strict';

  var BASE = '../../harness/data/kodak/';
  var NAMES = [];
  for (var i = 1; i <= 24; i++) NAMES.push('kodim' + String(i).padStart(2, '0') + '.png');

  var sel = document.getElementById('kodakSelect');
  if (!sel || typeof loadFromUrl !== 'function') return;

  NAMES.forEach(function (name) {
    var o = document.createElement('option');
    o.value = name;
    o.textContent = name.replace('.png', '');
    sel.appendChild(o);
  });

  sel.addEventListener('change', function () {
    var name = sel.value;
    if (!name) return;
    loadFromUrl(BASE + name).catch(function (e) {
      console.error('[kodak-select]', e);
    });
  });
})();
