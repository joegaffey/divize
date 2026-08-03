/* ============================================================
 * divize – main.js  (Phase 1 orchestrator)
 * Loads a local image, extracts saliency maps, samples adaptive
 * points, runs optional CVT relaxation, and renders an async CPU
 * Voronoi preview so the UI never blocks.
 * ============================================================ */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);

  const els = {
    dropzone: $('dropzone'),
    fileInput: $('fileInput'),
    src: $('srcCanvas'),
    edge: $('edgeCanvas'),
    lap: $('lapCanvas'),
    size: $('sizeCanvas'),
    vor: $('vorCanvas'),
    wipeBase: $('wipeBase'),
    wipeHandle: $('wipeHandle'),
    wipe: $('wipe'),
    pointBudget: $('pointBudget'),
    pointBudgetOut: $('pointBudgetOut'),
    mode: $('mode'),
    iterations: $('iterations'),
    iterOut: $('iterOut'),
    showPointColor: $('showPointColor'),
    scale: $('scale'),
    scaleOut: $('scaleOut'),
    blend: $('blend'),
    blendOut: $('blendOut'),
    aa: $('aa'),
    statPoints: $('statPoints'),
    statCells: $('statCells'),
    statCover: $('statCover'),
    statMs: $('statMs'),
    statWire: $('statWire'),
    metricCheck: $('metricCheck'), deltaCheck: $('deltaCheck'),
    statPsnr: $('statPsnr'), statSsim: $('statSsim'),
    statDe: $('statDe'), statDeP99: $('statDeP99'), statDeSw: $('statDeSw'),
    delta: $('deltaCanvas'), deltaFig: $('deltaFig'),
    vorCaption: $('vorCaption'),
    backend: $('backend'),
    gpuStatus: $('gpuStatus'),
    progressive: $('progressive'),
    progOut: $('progOut'),
    work: $('workIndicator'),
    workText: $('workText'),
    workCancel: $('workCancel'),
    exportBtn: $('exportBtn'),
    controls: $('controls') || document.querySelector('.controls'),
  };

  const PREVIEW_MAX = 480;
  const recomputeDelayMs = 120;

  // WebGPU readiness (probed once on boot)
  let gpuReady = false;
  let gpuProbed = false;

  // effective backend given the selector + capability
  function activeBackend() {
    if (els.backend.value === 'cpu') return 'cpu';
    if (els.backend.value === 'webgpu') return gpuReady ? 'webgpu' : 'cpu';
    return gpuReady ? 'webgpu' : 'cpu';   // auto
  }

  // Coarse-drag preview: while a slider is being dragged we render a
  // downscaled Voronoi (cheap), and only do a full-res draw once released.
  let interacting = false;

  function setInteracting(on) {
    interacting = on;
  }

  const state = {
    gray: null,
    edgeMap: null,
    lapMap: null,
    field: null,
    w: 0, h: 0,
    buf: null,          // source ImageData at working res
    pts: [],
    colors: null,
    mean: [0, 0, 0],    // mean RGB of the source (backdrop for coverage)
    seedKey: null,
    seedPts: null,
    fieldMode: null,
    rawBytes: 0,        // encoded source file size (bytes) before decoding
    renderToken: 0,
    workToken: 0,
    cvtDown: false,
  };

  /* ---------------- helpers pulled from the engine files ---------------- */

  function fit(w, h, cap) {
    const s = Math.min(1, cap / Math.max(w, h));
    return { w: Math.max(1, Math.round(w * s)), h: Math.max(1, Math.round(h * s)) };
  }

  const gray = window.gray;
  const se = window.sampleEngine;
  const metric = window.metric;

  function sampleGray(rgba, w, h) {
    const g = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const o = i * 4;
      g[i] = (rgba[o] * 77 + rgba[o + 1] * 150 + rgba[o + 2] * 29) >> 8;
    }
    return g;
  }

  /* ---- image loading ------------------------------------------------ */

  els.fileInput.addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) loadFile(f);
  });
  els.dropzone.addEventListener('click', () => els.fileInput.click());
  els.dropzone.addEventListener('dragover', (e) => { e.preventDefault(); els.dropzone.classList.add('over'); });
  els.dropzone.addEventListener('dragleave', () => els.dropzone.classList.remove('over'));
  els.dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    els.dropzone.classList.remove('over');
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) loadFile(f);
  });

  function loadFile(file) {
    if (!/^image\//.test(file.type)) return;
    state.rawBytes = file.size;   // encoded source size to compare against
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); processImage(img); };
    img.onerror = () => { URL.revokeObjectURL(url); alert('Could not decode that image.'); };
    img.src = url;
  }

  async function processImage(img) {
    const { w, h } = fit(img.width, img.height, PREVIEW_MAX);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);
    const buf = ctx.getImageData(0, 0, w, h);

    state.w = w; state.h = h; state.buf = buf;
    els.wipe.style.aspectRatio = w + ' / ' + h;
    syncPreviewWidth();
    state.gray = sampleGray(buf.data, w, h);
    state.edgeMap = gray.normalize(gray.sobelMagnitude(state.gray, w, h));
    state.lapMap = gray.normalize(gray.laplacianVariance(state.gray, w, h));
    let sr = 0, sg = 0, sb = 0, n = w * h;
    for (let i = 0; i < n; i++) { sr += buf.data[i * 4]; sg += buf.data[i * 4 + 1]; sb += buf.data[i * 4 + 2]; }
    state.mean = [sr / n, sg / n, sb / n];

    els.src.width = w; els.src.height = h;
    els.src.getContext('2d').putImageData(buf, 0, 0);
    paintMap(els.edge, state.edgeMap, w, h, false);
    paintMap(els.lap, state.lapMap, w, h, true);

    els.dropzone.classList.add('done');
    await ensureGPU();
    refresh();
  }
    function paintMap(canvas, field, w, h, heat) {
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(w, h);
    const d = img.data;
    for (let i = 0; i < w * h; i++) {
      const v = Math.round(field[i] * 255);
      const o = i * 4;
      if (heat) {
        d[o] = Math.round(255 * heatR(field[i]));
        d[o + 1] = Math.round(255 * heatG(field[i]));
        d[o + 2] = Math.round(255 * heatB(field[i]));
      } else {
        d[o] = d[o + 1] = d[o + 2] = v;
      }
      d[o + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }
  // perceptually pleasing pseudo-colour ramp: black->cyan->magenta->amber
  function heatR(t) { return u(t) * (0.4 + clamp(t * 1.4, 0, 1) * 0.6); }
  function heatG(t) { return u(t) * (0.4 + Math.sin(Math.PI * t) * 0.6); }
  function heatB(t) { return u(t) * (1 - clamp((t - 0.6) * 2.5, 0, 1) * 0.7); }
  function u(t) { return t <= 0 ? 0 : Math.min(1, t); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ---- perceptual delta map (ΔE) ----------------------------------- */
  const DSTOPS = [
    [0.00, [20, 25, 40]],
    [0.25, [60, 130, 200]],
    [0.50, [90, 200, 180]],
    [0.75, [250, 200, 90]],
    [1.00, [230, 60, 40]],
  ];
  function deltaRGB(t) {
    t = Math.max(0, Math.min(1, t));
    let i = 0;
    while (i < DSTOPS.length - 2 && t > DSTOPS[i + 1][0]) i++;
    const [t0, c0] = DSTOPS[i], [t1, c1] = DSTOPS[i + 1];
    const f = t1 > t0 ? (t - t0) / (t1 - t0) : 0;
    return [
      c0[0] + (c1[0] - c0[0]) * f,
      c0[1] + (c1[1] - c0[1]) * f,
      c0[2] + (c1[2] - c0[2]) * f,
    ];
  }
  function paintDelta(canvas, map, top, w, h) {
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(w, h);
    const s = top > 0 ? 1 / top : 1;
    for (let i = 0; i < w * h; i++) {
      const c = deltaRGB(map[i] * s);
      img.data[i * 4] = c[0];
      img.data[i * 4 + 1] = c[1];
      img.data[i * 4 + 2] = c[2];
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }

  // Downsample the saliency field by a factor so the O(count x pixels) CVT
  // nearest-neighbour loop runs over far fewer pixels. The result is an
  // approximation, but it is what the preview already shows (which is also
  // downscaled), so it draws consistently and is many times faster.
  function downsampleField(field, w, h, factor) {
    const dw = Math.max(1, Math.ceil(w / factor));
    const dh = Math.max(1, Math.ceil(h / factor));
    const out = new Float32Array(dw * dh);
    const cnt = new Float32Array(dw * dh);
    for (let i = 0; i < w * h; i++) {
      const dx = (i % w) / factor | 0, dy = (i / w) / factor | 0;
      const idx = dx + dy * dw;
      if (idx < out.length) { out[idx] += field[i]; cnt[idx] += 1; }
    }
    for (let i = 0; i < out.length; i++) if (cnt[i] > 0) out[i] /= cnt[i];
    return { field: out, w: dw, h: dh, factor };
  }
  // compute a downsampling factor that caps CVT pixels near `targetPx`
  function cvtFactor(totalPx) {
    const target = 320 * 320;           // ~100k samples, tweakable
    return Math.max(1, Math.ceil(Math.sqrt(totalPx / target)));
  }

  /* ---- point field selection ------------------------------------------- */
  function computeField() {
    const mode = els.mode.value;
    if (state.fieldMode === mode && state.field !== null) return 0; // cached
    const e = state.edgeMap, l = state.lapMap;
    let f = null;
    if (mode === 'edge') f = e;
    else if (mode === 'lapvar') f = l;
    else if (mode === 'uniform') f = null;
    else {
      // combined: geometric-mean blend so both edges + texture survive
      const out = new Float32Array(e.length);
      for (let i = 0; i < e.length; i++) out[i] = Math.sqrt(e[i] * l[i]);
      f = out;
    }
    state.field = f;
    state.fieldMode = mode;
    els.size.hidden = f === null;
    if (f !== null) paintMap(els.size, f, state.w, state.h, true);
  }

  function uniformFill(w, h, n) { return se.uniformSample(w, h, n); }
  function ones(w, h) {
    const a = new Float32Array(w * h);
    a.fill(1);
    return a;
  }

  /* ---- render dispatch: WebGPU or CPU ----------------------------- */
  function drawCount() {
    const np = state.pts.length;
    return Math.max(1, Math.round(np * (+els.progressive.value / 100)));
  }

  // Wipe comparison: keep the source layer (wipeBase) the exact same backing
  // size as the reconstruction so pixels line up, and copy the current source
  // buffer into it. Called whenever the vor canvas is resized.
  function syncWipeBase(w, h) {
    const base = els.wipeBase;
    if (!base) return;
    if (base.width !== w || base.height !== h) { base.width = w; base.height = h; }
    const ctx = base.getContext('2d');
    const buf = state.buf;
    if (buf && (w !== state.w || h !== state.h)) {
      // canvas is downscaled/up from working res: redraw source scaled.
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(els.src, 0, 0, w, h);
    } else if (buf) {
      ctx.putImageData(buf, 0, 0);
    }
  }

  // While dragging a slider we render coarse; you get a stable result at
  // full res only when you release.
  const PREVIEW_SCALE = 3;
  // Keep the delta map figure the same width as the wipe, so it tracks the
  // Canvas-scale slider as well as the default full-width layout.
  function syncPreviewWidth() {
    if (!els.deltaFig) return;
    els.deltaFig.style.width = els.wipe.style.width || '';
  }
  function drawSize() {
    const w = state.w, h = state.h;
    if (!interacting) return { w, h };
    const dw = Math.max(1, Math.ceil(w / PREVIEW_SCALE));
    const dh = Math.max(1, Math.ceil(h / PREVIEW_SCALE));
    return { w: dw, h: dh };
  }

  function scheduleRender() {
    const { w, h } = drawSize();
    return new Promise((resolve) => {
      renderWaiters.push(resolve);
      if (gpuReady && activeBackend() === 'webgpu') gpuRender(w, h);
      else cpuRender(w, h);
    });
  }

  let renderWaiters = [];
  function resolveRenderWaiters() {
    const ws = renderWaiters;
    renderWaiters = [];
    for (const r of ws) r();
  }

  async function gpuRender(w, h) {
    const token = ++state.renderToken;
    const pts = state.pts, colors = state.colors;
    const np = pts.length;
    const count = Math.min(np, drawCount());

    if (state._vorW !== w) { els.vor.width = w; els.vor.height = h; state._vorW = w; }
    syncWipeBase(w, h);
    els.vor.classList.remove('novoronoi');
    els.vorCaption.textContent = np === 0
      ? 'Voronoi preview · awaiting image'
      : `WebGPU Voronoi · ${count}/${np} seeds drawn`;

    if (np === 0) { finalize({ w, h, np: 0 }); return; }

    // Bind the visible canvas — the boot probe ran on a throwaway canvas,
    // so we must redirect drawing to the real one. If it currently holds
    // a 2D context (or anything non-WebGPU), it can't be bound and the
    // device path must fall back to CPU.
    if (!window.divGPU?.isBoundTo(els.vor) && !window.divGPU.bind(els.vor)) {
      cpuRender(w, h);
      return;
    }

    window.divGPU.configure(w, h);
    // preserve progressive seed ORDER from the sampler so the early
    // "streaming" cut favours the highest-saliency seeds already.
    // scale maps a downscaled canvas pixel back to full-res seed space.
    const scale = state.w / w;
    const ok = await window.divGPU.render(pts, colors, w, h, count,
                                          els.showPointColor.checked ? 0 : 1, scale, +els.blend.value, els.aa.checked);
    if (ok) finalize({ w, h, np: count });
    else cpuRender(w, h);
  }

  /* ---- async CPU render (fallback + reference implementation) ------ */
  function cpuRender(w, h) {
    const token = ++state.renderToken;
    const pts = state.pts, colors = state.colors;
    const color = els.showPointColor.checked;
    const blend = +els.blend.value;
    const aa = els.aa.checked;
    const np = pts.length;
    const count = Math.max(1, Math.min(np, drawCount()));

    els.vor.width = w; els.vor.height = h;
    syncWipeBase(w, h);
    els.vor.classList.remove('novoronoi');
    const ctx = els.vor.getContext('2d');
    const img = ctx.createImageData(w, h);
    const d = img.data;
    els.vorCaption.textContent = np === 0 ? 'Voronoi preview · awaiting image'
      : `CPU Voronoi · ${count}/${np} seeds drawn`;

    if (np === 0) { d.fill(0); ctx.putImageData(img, 0, 0); finalize({ w, h, np }); return; }

    const sx = state.w / w;   // full-res px per canvas px (downscale factor)
    function sample(X, Y) {
      let best = 0, bd = Infinity, sec = 0, sb = Infinity;
      for (let k = 0; k < count; k++) {
        const dx = X - pts[k].x, dy = Y - pts[k].y;
        const dd = dx * dx + dy * dy;
        if (dd < bd) { sb = bd; sec = best; bd = dd; best = k; }
        else if (dd < sb) { sb = dd; sec = k; }
      }
      let rr = colors[best * 4], gg = colors[best * 4 + 1], bb = colors[best * 4 + 2];
      if (blend > 0 && sb < Infinity) {
        const wg = Math.min(1, Math.max(0, (2 * bd) / Math.max(bd + sb, 1e-6))) * blend;
        rr += (colors[sec * 4] - rr) * wg;
        gg += (colors[sec * 4 + 1] - gg) * wg;
        bb += (colors[sec * 4 + 2] - bb) * wg;
      }
      return [rr, gg, bb];
    }
    const perChunk = 8;
    const rowsPerChunk = Math.max(1, Math.ceil(h / perChunk));
    let row = 0;
    function chunk() {
      if (token !== state.renderToken) return;
      const end = Math.min(h, row + rowsPerChunk);
      for (let y = row; y < end; y++) {
        const Y = y * sx;
        for (let x = 0; x < w; x++) {
          const X = x * sx;
          let rr, gg, bb;
          if (aa) {
            const o = 0.25 * sx, s = X, t = Y;
            const a = sample(s - o, t - o), b = sample(s + o, t - o);
            const c = sample(s - o, t + o), d = sample(s + o, t + o);
            rr = (a[0] + b[0] + c[0] + d[0]) * 0.25;
            gg = (a[1] + b[1] + c[1] + d[1]) * 0.25;
            bb = (a[2] + b[2] + c[2] + d[2]) * 0.25;
          } else {
            [rr, gg, bb] = sample(X, Y);
          }
          const o = (y * w + x) * 4;
          d[o] = rr;
          d[o + 1] = gg;
          d[o + 2] = bb;
          d[o + 3] = color ? 255 : (rr + gg + bb) / 3;
        }
      }
      ctx.putImageData(img, 0, 0);
      row = end;
      if (row < h) requestAnimationFrame(chunk);
      else finalize({ w, h, np: count });
    }
    chunk();
  }

  // Synchronous full-res CPU render used for the SSIM/PSNR/ΔE measurement.
  // Mirrors the async CPU renderer's nearest-seed sampling so the measured
  // reconstruction is exactly what the preview shows.
  function renderCpuSync(w, h, count, coverageOut) {
    const pts = state.pts, colors = state.colors;
    const blend = +els.blend.value;
    const aa = els.aa.checked;
    const m = state.mean;
    const sx = state.w / w;
    function sample(X, Y) {
      let best = 0, bd = Infinity, sec = 0, sb = Infinity;
      for (let k = 0; k < count; k++) {
        const dx = X - pts[k].x, dy = Y - pts[k].y;
        const dd = dx * dx + dy * dy;
        if (dd < bd) { sb = bd; sec = best; bd = dd; best = k; }
        else if (dd < sb) { sb = dd; sec = k; }
      }
      let rr = colors[best * 4], gg = colors[best * 4 + 1], bb = colors[best * 4 + 2];
      if (blend > 0 && sb < Infinity) {
        const wg = Math.min(1, Math.max(0, (2 * bd) / Math.max(bd + sb, 1e-6))) * blend;
        rr += (colors[sec * 4] - rr) * wg;
        gg += (colors[sec * 4 + 1] - gg) * wg;
        bb += (colors[sec * 4 + 2] - bb) * wg;
      }
      return [rr, gg, bb];
    }
    let cov = 0;
    const img = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) {
      const Y = y * sx;
      for (let x = 0; x < w; x++) {
        const X = x * sx;
        let rr, gg, bb;
        if (aa) {
          const o = 0.25 * sx, s = X, t = Y;
          const a = sample(s - o, t - o), b = sample(s + o, t - o);
          const c = sample(s - o, t + o), d = sample(s + o, t + o);
          rr = (a[0] + b[0] + c[0] + d[0]) * 0.25;
          gg = (a[1] + b[1] + c[1] + d[1]) * 0.25;
          bb = (a[2] + b[2] + c[2] + d[2]) * 0.25;
        } else {
          [rr, gg, bb] = sample(X, Y);
        }
        const o = (y * w + x) * 4;
        img[o] = rr; img[o + 1] = gg; img[o + 2] = bb; img[o + 3] = 255;
        if (Math.abs(rr - m[0]) > 20 || Math.abs(gg - m[1]) > 20 || Math.abs(bb - m[2]) > 20) cov++;
      }
    }
    if (coverageOut) coverageOut.value = cov / (w * h);
    return img;
  }

  function finalize(m) {
    els.statPoints.textContent = m.np;
    els.statCells.textContent = m.np;
    els.statCover.textContent = (m.np * 100 / (m.w * m.h)).toFixed(2) + '%';
    els.statWire.textContent = wireSize(m.np, m.w * m.h);
    if ((els.metricCheck.checked || els.deltaCheck.checked) && m.w === state.w && m.h === state.h && state.buf) {
      const recon = renderCpuSync(m.w, m.h, Math.max(1, m.np));
      els.statPsnr.textContent = metric.psnr(recon, state.buf.data).toFixed(2) + ' dB';
      els.statSsim.textContent = metric.ssim(recon, state.buf.data, m.w, m.h).toFixed(3);
      const de = metric.ciede(recon, state.buf.data, m.w, m.h);
      els.statDe.textContent = de.mean.toFixed(2);
      els.statDeP99.textContent = de.p99.toFixed(2);
      els.statDeSw.textContent = state.field
        ? metric.weightedMean(de.map, state.field).toFixed(2)
        : '—';
      const showDelta = els.deltaCheck.checked;
      els.deltaFig.hidden = !showDelta;
      if (showDelta) paintDelta(els.delta, de.map, de.p99, m.w, m.h);
    } else {
      els.statPsnr.textContent = '—';
      els.statSsim.textContent = '—';
      els.statDe.textContent = '—';
      els.statDeP99.textContent = '—';
      els.statDeSw.textContent = '—';
      els.deltaFig.hidden = true;
    }
    resolveRenderWaiters();
  }

  // Rendered "before vs after" for transmitting a frame over the wire.
  //  Before: the raw source pixels (or the encoded file it came from)
  //  After : this codec's payload = one x,y (f32,2) + r,g,b (u8,3) per point
  function wireSize(np, totalPx) {
    const after = np * 11;               // 2*f32 coords + 3*u8 colour
    const before = Math.max(state.rawBytes, totalPx * 4);
    const ratio = after > 0 ? (after / before) : 0;
    return `${fmtSize(before)} → ${fmtSize(after)} · ${(ratio * 100).toFixed(2)}%`;
  }
  function fmtSize(b) {
    if (b >= 1048576) return (b / 1048576).toFixed(2) + ' MB';
    if (b >= 1024) return (b / 1024).toFixed(1) + ' KB';
    return b + ' B';
  }

  /* ---- WebGPU boot probe ------------------------------------------- */
  async function ensureGPU() {
    if (gpuProbed) return;
    gpuProbed = true;
    els.gpuStatus.dataset.ok = 'false';
    els.gpuStatus.textContent = !(navigator.gpu)
      ? 'WebGPU unsupported — CPU fallback'
      : 'initializing…';
    if (!navigator.gpu) { gpuReady = false; return; }
    // Probe on a throwaway canvas: creating a 'webgpu' context on the
    // visible canvas would block the 2D fallback renderer from ever
    // getting a context later (a canvas has only one context type).
    const ok = await window.initDivGPU(document.createElement('canvas'));
    gpuReady = ok;
    const why = ok ? '' : (window.divGPU?.initError ? ` — ${window.divGPU.initError}` : '');
    els.gpuStatus.dataset.ok = String(ok);
    els.gpuStatus.textContent = ok ? 'WebGPU ready' : `WebGPU init failed${why}`;
  }

  /* ---- wiring ------------------------------------------- */
  els.pointBudgetOut.textContent = els.pointBudget.value;
  els.iterOut.textContent = els.iterations.value;

  // --- Heavy controls: recompute the point field + CVT. -------------
  // While dragging, we recompute + render COARSE (see drawSize()) so the
  // preview stays interactive; on release we do a full-res draw.
  let recomputeLead = 0;
  const recompute = () => {
    clearTimeout(recomputeLead);
    recomputeLead = setTimeout(refresh, recomputeDelayMs);
  };
  const heavyDragEnd = () => { setInteracting(false); scheduleRenderWork(); };
  const bindHeavy = (el) => {
    el.addEventListener('pointerdown', () => setInteracting(true));
    el.addEventListener('pointerup', heavyDragEnd);
    el.addEventListener('pointercancel', heavyDragEnd);
  };
  bindHeavy(els.pointBudget);
  bindHeavy(els.iterations);

  els.pointBudget.addEventListener('input', () => {
    els.pointBudgetOut.textContent = els.pointBudget.value;
    recompute();
  });
  els.mode.addEventListener('change', recompute);
  els.iterations.addEventListener('input', () => {
    els.iterOut.textContent = els.iterations.value;
    recompute();
  });

  // --- Light controls (render only; points unchanged) ---------------
  // These never touch the sampling/CVT pipeline, so they're instant.
  els.showPointColor.addEventListener('change', scheduleRenderWork);
  els.backend.addEventListener('change', scheduleRenderWork);
  els.metricCheck.addEventListener('change', scheduleRenderWork);
  els.deltaCheck.addEventListener('change', scheduleRenderWork);
  els.progressive.addEventListener('input', () => {
    els.progOut.textContent = (+els.progressive.value) + '%';
    scheduleRenderWork();
  });

  async function scheduleRenderWork() {
    if (!state.gray) return;
    // The points/colors are unchanged; just re-render (progressive %
    // or color toggle). Brief spinner for feedback without recompute.
    showWork(true, 'rendering…');
    await new Promise((r) => requestAnimationFrame(r));
    await scheduleRender();
    showWork(false);
  }

  els.aa.addEventListener('change', () => { scheduleRender(); });

  els.blend.addEventListener('input', () => {
    els.blendOut.textContent = +els.blend.value;
    scheduleRender();
  });

  els.scale.addEventListener('input', () => {
    els.scaleOut.textContent = (+els.scale.value).toFixed(2);
    // The wipe container now holds both layers; scale THAT box to keep the
    // source vs reconstruction comparison at the size the user wants.
    els.wipe.style.width = (state.w * +els.scale.value) + 'px';
    syncPreviewWidth();
  });

  // --- source vs reconstruction wipe ----------------------------------
  // The handle sweeps a vertical divider. Which side shows which: base
  // (source) is the bottom layer revealed on the right; the clipped vor
  // (reconstruction) fills the left of the divider.
  function setWipe(pos) {
    const pct = Math.max(0, Math.min(1, pos));
    els.wipe.style.setProperty('--wipe', (pct * 100) + '%');
  }
  function wipeToClientX(clientX) {
    const r = els.wipe.getBoundingClientRect();
    return (clientX - r.left) / r.width;
  }
  els.wipeHandle.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    els.wipeHandle.setPointerCapture(e.pointerId);
    setWipe(wipeToClientX(e.clientX));
  });
  els.wipeHandle.addEventListener('pointermove', (e) => {
    if (els.wipeHandle.hasPointerCapture(e.pointerId)) setWipe(wipeToClientX(e.clientX));
  });
  els.wipe.addEventListener('pointerdown', (e) => {
    // any click on the box (vor layer is pointer-events:none) repositions
    setWipe(wipeToClientX(e.clientX));
  });
  setWipe(1);

  // Handle the point-count / saliency updates using a cancellable async
  // pipeline so long CVT relaxations don't freeze the UI with no feedback.
  // Single-flight guard for the heavy pipeline. GPU CVT passes can't be
  // cancelled mid-pass, so we must never overlap two heavy runs: rapid
  // slider drags would otherwise queue a pile of compute jobs and can
  // crash the GPU. Instead we remember the newest pending request and
  // run only that one after the in-flight run settles.
  let pipeBusy = false;
  let pipeRedo = false;

  function refresh() {
    if (!state.gray) return;        // no image yet
    if (pipeBusy) { pipeRedo = true; return; }   // coalesce: drop everything but the latest
    startRun();
  }

  function startRun() {
    state.workToken++;
    const token = state.workToken;
    showWork(true, 'sampling…');     // sampling is fast; labelled for clarity
    pipeBusy = true;
    runPipeline(token);
  }

  async function runPipeline(token) {
    const stillCurrent = () => state.workToken === token;
    try {
      await runPipelineInner(token, stillCurrent);
    } catch (e) {
      if (stillCurrent()) { console.error(e); }
    } finally {
      // If the user changed a heavy control while we were busy, run the
      // latest state once rather than dropping every queued update. Only the
      // current run owns the busy flag; a superseded run must not clear it
      // while a newer pipeline (via pipeRedo) is still working.
      if (stillCurrent()) {
        pipeBusy = false;
        if (pipeRedo) { pipeRedo = false; startRun(); }
        else showWork(false);
      }
    }
  }

  async function runPipelineInner(token, stillCurrent) {
      computeField();
      const n = +els.pointBudget.value;
      const w = state.w, h = state.h;
      const it = +els.iterations.value;
      const t0 = performance.now();
      let tSample = 0, tCvt = 0;

      // Cache raw seeds by (fieldMode, budget): sampling is only needed
      // when those change. Repeating-only changes go straight to CVT,
      // and CVT-only changes reuse the same seeds for a stable result.
      const seedKey = state.fieldMode + ':' + n + ':' + state.w + 'x' + state.h;
      let pts;
      if (state.seedKey === seedKey) {
        pts = state.seedPts;                 // reuse cached seeds
      } else {
        if (state.field === null) pts = uniformFill(w, h, n);
        else pts = se.samples(state.field, w, h, n);
        state.seedKey = seedKey;
        state.seedPts = pts;
        tSample = performance.now() - t0;
      }
      if (!stillCurrent()) return;

      if (it > 0) {
        const fieldFull = state.field !== null ? state.field : ones(w, h);
        // CVT is O(count x pixels): downsample the field so the expensive
        // loop runs over fewer samples, then scale results back to full-res.
        const fac = cvtFactor(w * h);
        const { field: fieldRun, w: cw, h: ch, factor: cf } = downsampleField(fieldFull, w, h, fac);
        const pointsDown = () => pts.map((p) => ({ x: p.x / cf, y: p.y / cf }));
        const scaleUp = (arr) => {
          const out = new Float32Array(arr.length);
          for (let k = 0; k < arr.length; k++) out[k] = arr[k] * cf;
          return out;
        };
        const gpuCvt = !state.cvtDown && gpuReady && window.divGPU?.cvt;
        if (gpuCvt) {
          // WebGPU compute: best performance. GPU CVT can't be cancelled
          // mid-pass, so we only check the token between iterations.
          showWork(true, 'CVT relax (GPU)…');
          let ran = false;
          try {
            const out = await window.divGPU.cvt.run(pointsDown(), fieldRun, cw, ch, it, {
              onProgress: (done, total) =>
                showWork(true, `CVT relax (GPU)… ${Math.round((done / total) * 100)}%`),
              isCancelled: () => !stillCurrent(),
            });
            if (out && stillCurrent()) {
              const up = scaleUp(out);
              pts = new Array(up.length / 2);
              for (let k = 0; k < pts.length; k++) pts[k] = { x: up[k * 2], y: up[k * 2 + 1] };
              ran = true;
            }
          } catch (e) {
            state.cvtDown = true;   // don't retry the GPU CVT every move
            console.warn('[divize] GPU CVT failed, disabling and falling back to CPU:', e);
          }
          if (!ran && stillCurrent()) {
            // Fall back to CPU relaxation so the run still completes.
            const out = await se.cvtRelaxAsync(pointsDown(), fieldRun, cw, ch, it, {
              onProgress: (done, total) =>
                showWork(true, `CVT relax (CPU)… ${Math.round((done / total) * 100)}%`),
              isCancelled: () => !stillCurrent(),
            });
            if (out === null || !stillCurrent()) return;
            const up = scaleUp(out.flatMap((p) => [p.x, p.y]));
            pts = new Array(up.length / 2);
            for (let k = 0; k < pts.length; k++) pts[k] = { x: up[k * 2], y: up[k * 2 + 1] };
          } else if (!stillCurrent()) return;
        } else {
          const out = await se.cvtRelaxAsync(pointsDown(), fieldRun, cw, ch, it, {
            onProgress: (done, total) =>
              showWork(true, `CVT relax (CPU)… ${Math.round((done / total) * 100)}%`),
            isCancelled: () => !stillCurrent(),
          });
          if (out === null || !stillCurrent()) return;   // abandoned
          const up = scaleUp(out.flatMap((p) => [p.x, p.y]));
          pts = new Array(up.length / 2);
          for (let k = 0; k < pts.length; k++) pts[k] = { x: up[k * 2], y: up[k * 2 + 1] };
        }
      }

      state.pts = pts;
      state.colors = se.pointColors(state.buf.data, w, h, pts);
      if (!stillCurrent()) return;
      tCvt = performance.now() - t0 - tSample;
      els.statMs.textContent =
        `s ${tSample.toFixed(0)} / c ${tCvt.toFixed(1)}ms`;
      if (stillCurrent()) showWork(true, 'rendering…');
      await scheduleRender();
  }

  function showWork(on, label, pct) {
    els.work.hidden = !on;
    els.controls.classList.toggle('busy', !!on);
    if (on && label != null) {
      els.workText.textContent = label + (pct != null ? ` · ${pct}%` : '');
    }
  }

  // Cancel the in-flight job: bump the token so any paused async CVT
  // sees the change and bails. Controls are re-enabled on next refresh.
  els.workCancel.addEventListener('click', () => {
    state.workToken++;
    showWork(false);
  });

  // Export current point field as a Layer-0 .dlpc binary blob.
  els.exportBtn.addEventListener('click', () => {
    if (!state.pts || !state.colors || state.pts.length === 0) return;
    const name = (els.fileInput.files && els.fileInput.files[0]?.name) || 'image';
    window.dlpcExport.download(state.w, state.h, state.pts, state.colors,
                               name.replace(/\.[a-z0-9]+$/i, '') + '.dlpc');
  });

  // Probe WebGPU on page load (not on first image) so the backend
  // selector and status line reflect real capability immediately.
  ensureGPU();

})();