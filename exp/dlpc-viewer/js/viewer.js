/* ============================================================
 * divize – viewer.js (DLPC viewer controller)
 *
 * Thin harness that DOGFOODS the <dlpc-player> web component
 * from exp/dlpc-player: all rendering, decoding and backend
 * selection live inside the element. This file only wires the
 * page chrome (drop target, sliders, select, stats) onto the
 * element's reactive attributes and events.
 *
 * The renderer is intentionally NOT rebuilt here — it is the
 * exact component shipped in exp/dlpc-player.
 * ============================================================ */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);

  const els = {
    player: $('player'),
    dropzone: $('dropzone'),
    fileInput: $('fileInput'),
    caption: $('caption'),
    meta: $('meta'),
    progressive: $('progressive'),
    progOut: $('progOut'),
    blend: $('blend'),
    blendOut: $('blendOut'),
    aa: $('aa'),
    scale: $('lay'),
    scaleOut: $('scaleOut'),
    backend: $('backend'),
    statPoints: $('statPoints'),
    statBytes: $('statBytes'),
  };

  let doc = null;    // last parsed .dlpc (from dlpc:load)
  let baseW = null;  // player display width (px) at scale 1

  function setAttr(name, value) { els.player.setAttribute(name, value); }

  function refreshMeta() {
    if (!doc) { els.meta.textContent = '— no file loaded —'; return; }
    const L = (doc.layers && doc.layers[0]) || { count: 0 };
    els.meta.textContent =
      `${doc.width}×${doc.height} · Layer 0: ${L.count} pts · v${doc.version} · rendered by <dlpc-player>`;
  }

  // ---- file load ------------------------------------------------------
  els.fileInput.addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) loadFile(f);
  });
  els.dropzone.addEventListener('click', () => els.fileInput.click());
  els.dropzone.addEventListener('dragover', (e) => { e.preventDefault(); });
  els.dropzone.addEventListener('dragleave', () => els.dropzone.classList.remove('over'));
  els.dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    els.dropzone.classList.remove('over');
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) loadFile(f);
  });

  function loadFile(file) {
    file.arrayBuffer().then((buf) => {
      els.dropzone.classList.add('done');
      els.statBytes.textContent = file.size + ' B';
      els.player.load(buf);   // element parses, renders, collapses drop overlay
    });
  }

  // ---- player events (forward the element's own signals) --------------
  els.player.addEventListener('dlpc:load', (e) => {
    doc = e.detail.doc;
    const L = (doc.layers && doc.layers[0]) || { count: 0 };
    els.statPoints.textContent = L.count;
    els.caption.textContent = `Layer 0 via <dlpc-player> · ${doc.width}×${doc.height}`;
    els.player.classList.add('visible');
    els.player.style.width = '';              // reset to CSS 100% baseline
    els.scale.value = 1; els.scaleOut.textContent = '1.00';
    baseW = els.player.parentElement.clientWidth;   // preview width, stable across scale
    refreshMeta();
  });
  els.player.addEventListener('dlpc:error', (e) => {
    els.meta.textContent = 'parse failed: ' + e.detail.message;
    els.caption.textContent = 'awaiting a .dlpc file';
  });

  // ---- controls -> element attributes ----------------------------------
  els.progressive.addEventListener('input', () => {
    els.progOut.textContent = els.progressive.value + '%';
    setAttr('points', els.progressive.value);
  });
  els.blend.addEventListener('input', () => {
    els.blendOut.textContent = els.blend.value;
    setAttr('blend', els.blend.value);
  });
  els.aa.addEventListener('change', () => {
    if (els.aa.checked) els.player.setAttribute('aa', '');
    else els.player.removeAttribute('aa');
  });
  els.backend.addEventListener('change', () => setAttr('backend', els.backend.value));

  // ---- display scale: drive the host element's width so the player's
  //      canvas (width:100%) scales without re-decoding ---------------------------
  els.scale.addEventListener('input', () => {
    const s = +els.scale.value;
    els.scaleOut.textContent = s.toFixed(2);
    if (doc && baseW) els.player.style.width = Math.max(60, Math.round(baseW * s)) + 'px';
  });
})();