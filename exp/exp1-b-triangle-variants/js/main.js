/* ============================================================
 * divize – main.js  (exp1-b · triangle-floor variants)
 * Loads an image, extracts saliency, samples adaptive seeds, and
 * renders one of five Layer-0 floor primitives from the SAME seed
 * set, so byte budgets and quality are comparable across styles:
 *   voronoi   pure nearest-seed floor (baseline, 0x01)
 *   delaunay  tiled Delaunay mesh over the seeds (0x02, frame-closed)
 *   voro-fan  exact Voronoi cells, each triangulated as a seed fan (0x02)
 *   cell-tris one max-area triangle per Voronoi cell (0x02, gappy)
 *   tri-gauss cell-oriented α-triangles over the Voronoi floor (0x03)
 * Includes SSIM/PSNR vs the source, rendered-coverage %, and a
 * per-style byte-cost readout.
 * ============================================================ */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);

  const els = {
    dropzone: $('dropzone'), fileInput: $('fileInput'),
    src: $('srcCanvas'), edge: $('edgeCanvas'), lap: $('lapCanvas'), size: $('sizeCanvas'),
    vor: $('vorCanvas'), wipeBase: $('wipeBase'), wipeHandle: $('wipeHandle'), wipe: $('wipe'),
    pointBudget: $('pointBudget'), pointBudgetOut: $('pointBudgetOut'),
    mode: $('mode'), iterations: $('iterations'), iterOut: $('iterOut'),
    autoCvt: $('autoCvt'),
    showPointColor: $('showPointColor'), scale: $('scale'), scaleOut: $('scaleOut'),
    blend: $('blend'), blendOut: $('blendOut'), aa: $('aa'),
    floorStyle: $('floorStyle'), triColor: $('triColor'), splatAlpha: $('splatAlpha'),
    splatAlphaOut: $('splatAlphaOut'),
    metricCheck: $('metricCheck'), deltaCheck: $('deltaCheck'),
    statPoints: $('statPoints'), statCells: $('statCells'), statCover: $('statCover'),
    statMs: $('statMs'), statWire: $('statWire'),
    statPsnr: $('statPsnr'), statSsim: $('statSsim'),
    statDe: $('statDe'), statDeP99: $('statDeP99'), statDeSw: $('statDeSw'),
    delta: $('deltaCanvas'), deltaFig: $('deltaFig'),
    vorCaption: $('vorCaption'), backend: $('backend'), gpuStatus: $('gpuStatus'),
    progressive: $('progressive'), progOut: $('progOut'),
    work: $('workIndicator'), workText: $('workText'), workCancel: $('workCancel'),
    exportBtn: $('exportBtn'), controls: $('controls') || document.querySelector('.controls'),
  };

  const PREVIEW_MAX = 480;
  const recomputeDelayMs = 120;

  const STYLE_LABEL = {
    voronoi: 'voro', delaunay: 'delaunay',
    'voro-fan': 'voro-fan', 'cell-tris': 'cell-tris', 'tri-gauss': 'tri-gauss',
  };

  const MESH_STYLES = { delaunay: 1, 'voro-fan': 1, 'cell-tris': 1 };

  let gpuReady = false;
  let gpuProbed = false;

  function activeBackend() {
    if (els.backend.value === 'cpu') return 'cpu';
    return gpuReady ? 'webgpu' : 'cpu';   // auto / webgpu → fallback
  }
  function activeStyle() { return els.floorStyle.value; }
  function isMesh() { return !!MESH_STYLES[activeStyle()]; }
  function isSplat() { return activeStyle() === 'tri-gauss'; }

  let interacting = false;
  function setInteracting(on) { interacting = on; }

  const state = {
    gray: null, edgeMap: null, lapMap: null, field: null,
    w: 0, h: 0, buf: null, pts: [], colors: null,
    mesh: null, splats: null, mean: [0, 0, 0],
    seedKey: null, seedPts: null, fieldMode: null,
    rawBytes: 0, renderToken: 0, workToken: 0, cvtDown: false,
  };

  function fit(w, h, cap) {
    const s = Math.min(1, cap / Math.max(w, h));
    return { w: Math.max(1, Math.round(w * s)), h: Math.max(1, Math.round(h * s)) };
  }

  const gray = window.gray;
  const se = window.sampleEngine;
  const geo = window.geometry;
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
    state.rawBytes = file.size;
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
    const sctx = els.src.getContext('2d');
    sctx.putImageData(buf, 0, 0);
    computeField();
    syncWipeBase(w, h);
    setWipe(1);
    startRun();
  }

  /* ---- saliency / field --------------------------------------------- */

  function heatR(t) { return clamp(t * 2.2 - 0.2, 0, 1); }
  function heatG(t) { return clamp(2.2 * Math.min(t, 1 - t), 0, 1); }
  function heatB(t) { return u(t) * (1 - clamp((t - 0.6) * 2.5, 0, 1) * 0.7); }
  function u(t) { return t <= 0 ? 0 : Math.min(1, t); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

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
  function cvtFactor(totalPx) {
    const target = 320 * 320;
    return Math.max(1, Math.ceil(Math.sqrt(totalPx / target)));
  }

  /* ---- metric-informed CVT auto-stop -------------------------------- */
  // Low-res source (box-averaged to the CVT grid) for ΔE checkpoints.
  function downsampleRgb(src, w, h, dw, dh) {
    const out = new Uint8ClampedArray(dw * dh * 4);
    const sy = h / dh, sx = w / dw;
    for (let dy = 0; dy < dh; dy++) {
      const y0 = Math.floor(dy * sy), y1 = Math.max(y0 + 1, Math.floor((dy + 1) * sy));
      for (let dx = 0; dx < dw; dx++) {
        const x0 = Math.floor(dx * sx), x1 = Math.max(x0 + 1, Math.floor((dx + 1) * sx));
        let r = 0, g = 0, b = 0, n = 0;
        for (let yy = y0; yy < y1; yy++) {
          for (let xx = x0; xx < x1; xx++) {
            const o = (yy * w + xx) * 4;
            r += src[o]; g += src[o + 1]; b += src[o + 2]; n++;
          }
        }
        const o = (dy * dw + dx) * 4;
        out[o] = n ? r / n : 0; out[o + 1] = n ? g / n : 0; out[o + 2] = n ? b / n : 0;
        out[o + 3] = 255;
      }
    }
    return out;
  }
  // Mean CIEDE2000 of a low-res nearest-seed reconstruction vs the low-res
  // source, on the same grid the CVT loop runs over.
  function lowResDe(ptsFull, srcLow, cw, ch) {
    const colors = se.pointColors(state.buf.data, state.w, state.h, ptsFull);
    const recon = new Uint8ClampedArray(cw * ch * 4);
    const sx = state.w / cw, sy = state.h / ch;
    for (let gy = 0; gy < ch; gy++) {
      const Y = (gy + 0.5) * sy;
      for (let gx = 0; gx < cw; gx++) {
        const X = (gx + 0.5) * sx;
        let best = 0, bd = Infinity;
        for (let k = 0; k < ptsFull.length; k++) {
          const dx = X - ptsFull[k].x, dy = Y - ptsFull[k].y;
          const d = dx * dx + dy * dy;
          if (d < bd) { bd = d; best = k; }
        }
        const o = (gy * cw + gx) * 4;
        recon[o] = colors[best * 4]; recon[o + 1] = colors[best * 4 + 1];
        recon[o + 2] = colors[best * 4 + 2]; recon[o + 3] = 255;
      }
    }
    return metric.ciede(recon, srcLow, cw, ch).mean;
  }

  function computeField() {
    const mode = els.mode.value;
    if (state.fieldMode === mode && state.field !== null) return 0;
    const e = state.edgeMap, l = state.lapMap;
    let f = null;
    if (mode === 'edge') f = e;
    else if (mode === 'lapvar') f = l;
    else if (mode === 'uniform') f = null;
    else {
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

  function paintMap(canvas, field, w, h) {
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(w, h);
    for (let i = 0; i < w * h; i++) {
      const v = field[i];
      img.data[i * 4] = heatR(v) * 255;
      img.data[i * 4 + 1] = heatG(v) * 255;
      img.data[i * 4 + 2] = heatB(v) * 255;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }

  /* ---- perceptual delta map (ΔE) ----------------------------------- */
  // Cool (none) → cyan (at JND) → green → yellow → red (worst), with the
  // ramp normalised to the 99th-percentile error so ~1% of pixels clip.
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
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
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

  /* ---- primitives count for the active style ------------------------ */
  function primitiveCount() {
    const s = activeStyle();
    if (isMesh()) return state.mesh ? state.mesh.tris.length : 0;
    if (isSplat()) return state.splats ? state.splats.length : 0;
    return state.pts.length;
  }
  function drawCount() {
    return Math.max(1, Math.round(primitiveCount() * (+els.progressive.value / 100)));
  }

  function meanBackdropRGB() { return state.mean; }
  function meanBackdropFloat() {
    const m = state.mean;
    return [m[0] / 255, m[1] / 255, m[2] / 255];
  }

  /* ---- wipe / before-after ------------------------------------------ */

  function syncWipeBase(w, h) {
    const base = els.wipeBase;
    if (!base) return;
    if (base.width !== w || base.height !== h) { base.width = w; base.height = h; }
    const ctx = base.getContext('2d');
    const buf = state.buf;
    if (buf && (w !== state.w || h !== state.h)) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(els.src, 0, 0, w, h);
    } else if (buf) {
      ctx.putImageData(buf, 0, 0);
    }
  }

  const PREVIEW_SCALE = 2;
  // Keep the delta map figure the same width as the wipe, so it tracks the
  // Canvas-scale slider as well as the default full-width layout.
  function syncPreviewWidth() {
    if (!els.deltaFig) return;
    els.deltaFig.style.width = els.wipe.style.width || '';
  }
  function drawSize() {
    const w = state.w, h = state.h;
    if (!interacting) return { w, h };
    return { w: Math.max(1, Math.ceil(w / PREVIEW_SCALE)), h: Math.max(1, Math.ceil(h / PREVIEW_SCALE)) };
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
    const np = primitiveCount();
    const count = Math.min(np, drawCount());

    if (state._vorW !== w) { els.vor.width = w; els.vor.height = h; state._vorW = w; }
    syncWipeBase(w, h);
    els.vor.classList.remove('novoronoi');
    els.vorCaption.textContent = np === 0
      ? 'awaiting image'
      : caption('WebGPU', activeStyle(), count, np);

    if (np === 0) { finalize({ w, h, np: 0 }); return; }

    if (!window.divGPU?.isBoundTo(els.vor) && !window.divGPU.bind(els.vor)) {
      cpuRender(w, h);
      return;
    }
    window.divGPU.configure(w, h);
    const scale = state.w / w;
    const aa = els.aa.checked ? 1 : 0;
    const s = activeStyle();
    let ok = false;
    try {
      if (s === 'voronoi') {
        ok = await window.divGPU.render(state.pts, state.colors, w, h, count,
          els.showPointColor.checked ? 0 : 1, scale, +els.blend.value, aa);
      } else if (isMesh() && state.mesh) {
        const m = state.mesh;
        ok = await window.divGPU.renderTri(m.verts, m.vertColors, m.tris, m.triColors,
          w, h, count, scale, m.interp, meanBackdropFloat(), aa);
      } else if (isSplat() && state.splats) {
        // tri-gauss always composites over the Voronoi floor (no gaps show)
        ok = await window.divGPU.renderSplat(state.splats, state.pts, state.colors,
          w, h, count, scale, [0, 0, 0], true, aa);
      }
    } catch (e) {
      console.warn('[exp1-b] GPU render failed, falling back to CPU:', e);
      ok = false;
    }
    if (ok) finalize({ w, h, np: count });
    else cpuRender(w, h);
  }

  /* ---- barycentric helpers (shared by CPU triangle paths) ------- */
  function baryWeights(X, Y, ax, ay, bx, by, cx, cy) {
    const v0x = bx - ax, v0y = by - ay, v1x = cx - ax, v1y = cy - ay;
    const v2x = X - ax, v2y = Y - ay;
    const d00 = v0x * v0x + v0y * v0y, d01 = v0x * v1x + v0y * v1y, d11 = v1x * v1x + v1y * v1y;
    const d20 = v2x * v0x + v2y * v0y, d21 = v2x * v1x + v2y * v1y;
    const denom = d00 * d11 - d01 * d01;
    if (Math.abs(denom) < 1e-9) return null;
    const v = (d11 * d20 - d01 * d21) / denom;
    const w = (d00 * d21 - d01 * d20) / denom;
    const u = 1 - v - w;
    return (u >= -1e-9 && v >= -1e-9 && w >= -1e-9) ? { u, v, w } : null;
  }

  /* ---- per-pixel sampler for the active floor style (CPU reference) --- */
  function makeSampler(s, count) {
    if (s === 'voronoi') {
      const pts = state.pts, colors = state.colors, blend = +els.blend.value;
      return (X, Y) => {
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
      };
    }
    if (isMesh() && state.mesh) {
      const m = state.mesh, verts = m.verts, tris = m.tris;
      const interp = m.interp, triColors = m.triColors, vertColors = m.vertColors;
      const bk = meanBackdropRGB();
      return (X, Y) => {
        for (let k = 0; k < count; k++) {
          const t = tris[k];
          const a = verts[t.a], b = verts[t.b], c = verts[t.c];
          const bw = baryWeights(X, Y, a.x, a.y, b.x, b.y, c.x, c.y);
          if (bw) {
            if (interp) {
              const oa = t.a * 4, ob = t.b * 4, oc = t.c * 4;
              return [vertColors[oa] * bw.u + vertColors[ob] * bw.v + vertColors[oc] * bw.w,
                      vertColors[oa + 1] * bw.u + vertColors[ob + 1] * bw.v + vertColors[oc + 1] * bw.w,
                      vertColors[oa + 2] * bw.u + vertColors[ob + 2] * bw.v + vertColors[oc + 2] * bw.w];
            }
            const o = k * 4;
            return [triColors[o], triColors[o + 1], triColors[o + 2]];
          }
        }
        return bk;
      };
    }
    if (isSplat() && state.splats) {
      const splats = state.splats;
      const pts = state.pts, colors = state.colors;
      const AX = 0, AY = 1, BX = -0.8660254, BY = -0.5, CX = 0.8660254, CY = -0.5;
      return (X, Y) => {
        let best = 0, bd = Infinity;
        for (let k = 0; k < pts.length; k++) {
          const dx = X - pts[k].x, dy = Y - pts[k].y;
          const dd = dx * dx + dy * dy;
          if (dd < bd) { bd = dd; best = k; }
        }
        let rr = colors[best * 4], gg = colors[best * 4 + 1], bb = colors[best * 4 + 2];
        for (let k = 0; k < count; k++) {
          const sp = splats[k];
          const cs = Math.cos(sp.angle), sn = Math.sin(sp.angle);
          const dx = X - sp.x, dy = Y - sp.y;
          const rx = (dx * cs + dy * sn) / Math.max(sp.size, 1e-6);
          const ry = (-dx * sn + dy * cs) / Math.max(sp.size, 1e-6);
          const bw = baryWeights(rx, ry, AX, AY, BX, BY, CX, CY);
          if (bw) {
            const a = sp.alpha;
            rr = sp.r * a + rr * (1 - a);
            gg = sp.g * a + gg * (1 - a);
            bb = sp.b * a + bb * (1 - a);
          }
        }
        return [rr, gg, bb];
      };
    }
    return () => [0, 0, 0];
  }

  // Synchronous full-res CPU render used for the SSIM/PSNR measurement.
  // Also counts rendered coverage (pixels differing from the mean backdrop).
  function renderCpuSync(w, h, count, coverageOut) {
    const sx = state.w / w;
    const sample = makeSampler(activeStyle(), count);
    const aa = els.aa.checked;
    const m = state.mean;
    let cov = 0;
    const img = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) {
      const Y = y * sx;
      for (let x = 0; x < w; x++) {
        const X = x * sx;
        let rr, gg, bb;
        if (aa) {
          const o = 0.25 * sx;
          const a = sample(X - o, Y - o), b = sample(X + o, Y - o);
          const c = sample(X - o, Y + o), dd = sample(X + o, Y + o);
          rr = (a[0] + b[0] + c[0] + dd[0]) * 0.25;
          gg = (a[1] + b[1] + c[1] + dd[1]) * 0.25;
          bb = (a[2] + b[2] + c[2] + dd[2]) * 0.25;
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

  /* ---- async CPU render (fallback + reference implementation) --- */
  function cpuRender(w, h) {
    const token = ++state.renderToken;
    const np = primitiveCount();
    const count = Math.max(1, Math.min(np, drawCount()));

    els.vor.width = w; els.vor.height = h;
    syncWipeBase(w, h);
    els.vor.classList.remove('novoronoi');
    const ctx = els.vor.getContext('2d');
    const img = ctx.createImageData(w, h);
    const d = img.data;
    els.vorCaption.textContent = np === 0
      ? 'awaiting image'
      : caption('CPU', activeStyle(), count, np);

    if (np === 0) { d.fill(0); ctx.putImageData(img, 0, 0); finalize({ w, h, np }); return; }

    const sx = state.w / w;
    const s = activeStyle();
    const aa = els.aa.checked;
    const sample = makeSampler(s, count);

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
            const o = 0.25 * sx;
            const a = sample(X - o, Y - o), b = sample(X + o, Y - o);
            const c = sample(X - o, Y + o), dd = sample(X + o, Y + o);
            rr = (a[0] + b[0] + c[0] + dd[0]) * 0.25;
            gg = (a[1] + b[1] + c[1] + dd[1]) * 0.25;
            bb = (a[2] + b[2] + c[2] + dd[2]) * 0.25;
          } else {
            [rr, gg, bb] = sample(X, Y);
          }
          const o = (y * w + x) * 4;
          d[o] = rr; d[o + 1] = gg; d[o + 2] = bb;
          d[o + 3] = els.showPointColor.checked ? 255 : (rr + gg + bb) / 3;
        }
      }
      ctx.putImageData(img, 0, 0);
      row = end;
      if (row < h) requestAnimationFrame(chunk);
      else finalize({ w, h, np: count });
    }
    chunk();
  }

  function caption(backend, style, count, np) {
    return `${backend} ${STYLE_LABEL[style]} · ${count}/${np} drawn`;
  }

  function finalize(m) {
    els.statPoints.textContent = state.pts.length;
    els.statCells.textContent = m.np;
    if (m.np === 0) {
      els.statCover.textContent = '—';
      els.statPsnr.textContent = '—';
      els.statSsim.textContent = '—';
      els.statDe.textContent = '—';
      els.statDeP99.textContent = '—';
      els.statDeSw.textContent = '—';
    } else {
      const cov = { value: 0 };
      if ((els.metricCheck.checked || els.deltaCheck.checked) && m.w === state.w && m.h === state.h && state.buf) {
        const recon = renderCpuSync(m.w, m.h, Math.max(1, m.np), cov);
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
        cov.value = 0;
        els.statPsnr.textContent = '—';
        els.statSsim.textContent = '—';
        els.statDe.textContent = '—';
        els.statDeP99.textContent = '—';
        els.statDeSw.textContent = '—';
        els.deltaFig.hidden = true;
      }
      els.statCover.textContent = cov.value === 0 ? '—' : (cov.value * 100).toFixed(1) + '%';
    }
    els.statWire.textContent = wireSize();
    resolveRenderWaiters();
  }

  function payloadBytes() {
    const s = activeStyle();
    const m = state.mesh;
    if (isMesh() && m) {
      const interp = m.interp;
      return 16 + m.verts.length * (interp ? 5 : 2) + m.tris.length * (interp ? 6 : 9);
    }
    if (isSplat() && state.splats) return 13 + state.splats.length * 8;
    return 13 + state.pts.length * 5;
  }

  function wireSize() {
    const after = payloadBytes();
    const before = Math.max(state.rawBytes, state.w * state.h * 4);
    const ratio = after > 0 ? (after / before) : 0;
    return `${fmtSize(before)} → ${fmtSize(after)} · ${(ratio * 100).toFixed(2)}%`;
  }
  function fmtSize(b) {
    if (b >= 1048576) return (b / 1048576).toFixed(2) + ' MB';
    if (b >= 1024) return (b / 1024).toFixed(1) + ' KB';
    return b + ' B';
  }

  async function ensureGPU() {
    if (gpuProbed) return;
    gpuProbed = true;
    els.gpuStatus.dataset.ok = 'false';
    els.gpuStatus.textContent = !(navigator.gpu)
      ? 'WebGPU unsupported — CPU fallback'
      : 'initializing…';
    if (!navigator.gpu) { gpuReady = false; return; }
    const ok = await window.initDivGPU(document.createElement('canvas'));
    gpuReady = ok;
    const why = ok ? '' : (window.divGPU?.initError ? ` — ${window.divGPU.initError}` : '');
    els.gpuStatus.dataset.ok = String(ok);
    els.gpuStatus.textContent = ok ? 'WebGPU ready' : `WebGPU init failed${why}`;
  }

  /* ---- wiring ------------------------------------------- */
  els.pointBudgetOut.textContent = els.pointBudget.value;
  els.iterOut.textContent = els.iterations.value;
  els.splatAlphaOut.textContent = els.splatAlpha.value;

  let recomputeLead = 0;
  const recompute = () => {
    clearTimeout(recomputeLead);
    showWork(true, 'updating…');
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
  els.autoCvt.addEventListener('change', recompute);
  els.floorStyle.addEventListener('change', recompute);
  els.triColor.addEventListener('change', recompute);
  els.splatAlpha.addEventListener('input', () => {
    els.splatAlphaOut.textContent = els.splatAlpha.value;
    recompute();
  });
  els.metricCheck.addEventListener('change', scheduleRenderWork);
  els.deltaCheck.addEventListener('change', scheduleRenderWork);

  els.showPointColor.addEventListener('change', scheduleRenderWork);
  els.backend.addEventListener('change', scheduleRenderWork);
  els.progressive.addEventListener('input', () => {
    els.progOut.textContent = (+els.progressive.value) + '%';
    scheduleRenderWork();
  });

  async function scheduleRenderWork() {
    if (!state.gray) return;
    showWork(true, 'rendering…');
    await new Promise((r) => requestAnimationFrame(r));
    await scheduleRender();
    showWork(false);
  }

  els.aa.addEventListener('change', scheduleRenderWork);

  els.blend.addEventListener('input', () => {
    els.blendOut.textContent = +els.blend.value;
    scheduleRenderWork();
  });
  els.scale.addEventListener('input', () => {
    els.scaleOut.textContent = (+els.scale.value).toFixed(2);
    els.wipe.style.width = (state.w * +els.scale.value) + 'px';
    syncPreviewWidth();
  });

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
  els.wipe.addEventListener('pointerdown', (e) => setWipe(wipeToClientX(e.clientX)));
  setWipe(1);

  let pipeBusy = false;
  let pipeRedo = false;

  function refresh() {
    if (!state.gray) { showWork(false); return; }
    if (pipeBusy) { pipeRedo = true; return; }
    startRun();
  }

  function startRun() {
    state.workToken++;
    const token = state.workToken;
    showWork(true, 'sampling…');
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
      // Only the current run owns the busy flag; a superseded run must not
      // clear it while a newer pipeline (via pipeRedo) is still working.
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
    const autoCvt = els.autoCvt.checked;
    // Auto mode: the slider is the hard cap; convergence decides the real
    // count. Displacement threshold in full-res px, scaled to the CVT grid.
    const cap = autoCvt ? Math.max(it, 40) : it;
    const t0 = performance.now();
    let tSample = 0, tCvt = 0;

    const seedKey = state.fieldMode + ':' + n + ':' + state.w + 'x' + state.h;
    let pts;
    if (state.seedKey === seedKey) {
      pts = state.seedPts;
    } else {
      if (state.field === null) pts = uniformFill(w, h, n);
      else pts = se.samples(state.field, w, h, n);
      pts = geo.decollide(pts, w, h);
      state.seedKey = seedKey;
      state.seedPts = pts;
      tSample = performance.now() - t0;
    }
    if (!stillCurrent()) return;

    if (cap > 0) {
      const fieldFull = state.field !== null ? state.field : ones(w, h);
      const fac = cvtFactor(w * h);
      const { field: fieldRun, w: cw, h: ch, factor: cf } = downsampleField(fieldFull, w, h, fac);
      const srcLow = autoCvt ? downsampleRgb(state.buf.data, w, h, cw, ch) : null;
      const pointsDown = () => pts.map((p) => ({ x: p.x / cf, y: p.y / cf }));
      const scaleUp = (arr) => {
        const out = new Float32Array(arr.length);
        for (let k = 0; k < arr.length; k++) out[k] = arr[k] * cf;
        return out;
      };
      const gpuCvt = !autoCvt && !state.cvtDown && gpuReady && window.divGPU?.cvt;
      // Metric-informed auto-stop options (CPU only — the GPU kernel can't
      // report per-iteration displacement). The slider is the hard cap.
      let usedIters = cap, deLow = null;
      const cvtOpts = {
        chunk: autoCvt ? 2 : 4,
        onProgress: (done, total) =>
          showWork(true, (autoCvt ? 'CVT relax (auto)…' : 'CVT relax (CPU)…') +
            ` ${Math.round((done / total) * 100)}%`),
        isCancelled: () => !stillCurrent(),
      };
      if (autoCvt) {
        const dispThresh = 0.1 / cf;    // ~0.1px full-res, on the CVT grid
        const checkEvery = 5;           // ΔE checkpoint period
        const deThresh = 0.05;          // min mean-ΔE improvement to continue
        let lastDe = null, streak = 0, lastCheck = 0;
        cvtOpts.onStep = (itNum, meanDisp, curDown) => {
          usedIters = itNum;
          if (meanDisp < dispThresh) return false;       // geometric convergence
          if (itNum - lastCheck >= checkEvery) {
            lastCheck = itNum;
            const up = scaleUp(curDown.flatMap((p) => [p.x, p.y]));
            const full = new Array(up.length / 2);
            for (let k = 0; k < full.length; k++) full[k] = { x: up[k * 2], y: up[k * 2 + 1] };
            deLow = lowResDe(full, srcLow, cw, ch);
            const improve = lastDe === null ? Infinity : lastDe - deLow;
            lastDe = deLow;
            streak = improve < deThresh ? streak + 1 : 0;
            if (streak >= 2) return false;                // diminishing returns
          }
          return true;
        };
      }
      let out = null;
      if (gpuCvt) {
        showWork(true, 'CVT relax (GPU)…');
        try {
          out = await window.divGPU.cvt.run(pointsDown(), fieldRun, cw, ch, cap, {
            onProgress: (done, total) =>
              showWork(true, `CVT relax (GPU)… ${Math.round((done / total) * 100)}%`),
            isCancelled: () => !stillCurrent(),
          });
        } catch (e) {
          state.cvtDown = true;
          console.warn('[exp1-b] GPU CVT failed, disabling:', e);
        }
      }
      if (out === null && stillCurrent()) {
        out = await se.cvtRelaxAsync(pointsDown(), fieldRun, cw, ch, cap, cvtOpts);
      }
      if (out === null || !stillCurrent()) return;
      if (out.iterations != null) usedIters = out.iterations;
      const up = out instanceof Float32Array
        ? scaleUp(out)
        : scaleUp(out.flatMap((p) => [p.x, p.y]));
      pts = new Array(up.length / 2);
      for (let k = 0; k < pts.length; k++) pts[k] = { x: up[k * 2], y: up[k * 2 + 1] };
      // collapse any exact duplicates the relaxation produced
      pts = geo.decollide(pts, w, h, Math.random, 0);
      if (autoCvt) {
        els.iterOut.textContent = `${usedIters}/${cap} auto` +
          (deLow !== null ? ` · ΔE≈${deLow.toFixed(1)}` : '');
      }
    }

    state.pts = pts;
    state.colors = se.pointColors(state.buf.data, w, h, pts);
    if (!stillCurrent()) return;

    // floor geometry
    const s = activeStyle();
    const interp = els.triColor.value === 'interp';
    const field = state.field !== null ? state.field : ones(w, h);
    if (s === 'delaunay') {
      showWork(true, 'triangulating…');
      state.mesh = se.triangleMesh(pts, state.colors, state.buf.data, w, h, field, interp,
        { frame: 'midpoints' });
      showWork(false);
    } else if (s === 'voro-fan' || s === 'cell-tris') {
      showWork(true, 'building cells…');
      const cells = geo.voronoiCells(pts, w, h);
      const raw = s === 'voro-fan' ? geo.fanMesh(pts, cells) : geo.oneTrianglePerCell(pts, cells);
      state.mesh = geo.meshColors(raw.verts, raw.tris, pts, state.colors, state.buf.data, w, h, field, interp);
      showWork(false);
    } else if (s === 'tri-gauss') {
      showWork(true, 'cell ellipse…');
      const cells = geo.voronoiCells(pts, w, h);
      const splats = geo.triGauss(pts, cells, +els.splatAlpha.value);
      for (let i = 0; i < splats.length; i++) {
        const o = cells[i].k * 4;
        splats[i].r = state.colors[o];
        splats[i].g = state.colors[o + 1];
        splats[i].b = state.colors[o + 2];
      }
      state.splats = splats;
      showWork(false);
    }

    tCvt = performance.now() - t0 - tSample;
    els.statMs.textContent = `s ${tSample.toFixed(0)} / g ${tCvt.toFixed(1)}ms`;
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

  els.workCancel.addEventListener('click', () => {
    state.workToken++;
    showWork(false);
  });

  // Export the current field as the active Layer-0 subtype.
  els.exportBtn.addEventListener('click', () => {
    const name = (els.fileInput.files && els.fileInput.files[0]?.name) || 'image';
    const base = name.replace(/\.[a-z0-9]+$/i, '');
    const s = activeStyle();
    let data = null;
    if (s === 'voronoi' && state.pts.length) {
      data = window.dlpcExport.encodeLayer0(state.w, state.h, state.pts, state.colors);
    } else if (isMesh() && state.mesh) {
      const m = state.mesh;
      data = window.dlpcExport.encodeMesh(state.w, state.h, m.verts, m.vertColors, m.tris, m.triColors, m.interp);
    } else if (isSplat() && state.splats) {
      data = window.dlpcExport.encodeSplat(state.w, state.h, state.splats);
    }
    if (data) window.dlpcExport.download(data, base + (s === 'voronoi' ? '' : '-' + s) + '.dlpc');
  });

  ensureGPU();

  // ---- URL config (?style&budget&mode&iters&autoCvt&triColor&splatAlpha&
  // ----       &aa&blend&progressive&img) — lets the harness report deep-link
  // ----       any recorded run straight into the browser for inspection.
  function urlConfig() {
    const p = new URLSearchParams(location.search);
    const set = (el, v) => { if (el && v !== null && v !== '') el.value = v; };
    const setChk = (el, v) => { if (el) el.checked = v === '1' || v === 'true'; };
    set(els.pointBudget, p.get('budget'));
    set(els.mode, p.get('mode'));
    set(els.iterations, p.get('iters'));
    setChk(els.autoCvt, p.get('autoCvt'));
    set(els.floorStyle, p.get('style'));
    set(els.triColor, p.get('triColor'));
    set(els.splatAlpha, p.get('splatAlpha'));
    setChk(els.aa, p.get('aa'));
    set(els.blend, p.get('blend'));
    set(els.progressive, p.get('progressive'));
    if (els.pointBudgetOut) els.pointBudgetOut.textContent = els.pointBudget.value;
    if (els.iterOut) els.iterOut.textContent = els.iterations.value;
    if (els.splatAlphaOut) els.splatAlphaOut.textContent = els.splatAlpha.value;
    if (els.progOut) els.progOut.textContent = (+els.progressive.value) + '%';
    if (els.blendOut) els.blendOut.textContent = els.blend.value;
    return p;
  }

  async function loadFromUrl(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + url);
    const blob = await res.blob();
    const name = url.split('/').pop() || 'image.png';
    loadFile(new File([blob], name, { type: blob.type || 'image/png' }));
  }

  const cfg = urlConfig();
  const imgUrl = cfg.get('img');
  if (imgUrl) {
    loadFromUrl(imgUrl).catch((e) => console.error('[exp1-b] loadFromUrl:', e));
  }
})();
