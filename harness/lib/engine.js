'use strict';
/* Headless mirror of exp1-b's encoder pipeline (see exp/exp1-b-triangle-variants/js/main.js).
 * Loads an image, extracts saliency, samples seeds, optionally CVT-relaxes, builds the
 * active floor, and renders a full-res CPU reconstruction — then measures PSNR/SSIM/
 * CIEDE2000/ΔE99/ΔE·sal, rendered coverage, and the encoded payload byte count.
 *
 * The browser computes exactly these numbers from renderCpuSync() + metric.* on the same
 * libs; this engine reproduces them without a DOM, so sweep rows match the on-screen
 * readouts (subject only to RNG: a seeded PRNG is used for reproducibility).
 *
 * runCell(imagePath, config) -> result row object (serialisable). */

const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const { loadLibs } = require('./load');

const libs = loadLibs();
const { gray, sampleEngine: se, geometry: geo, metric } = libs;

const PREVIEW_MAX = 480;   // must match exp1-b main.js
const PREVIEW_SCALE = 2;   // coarse render divisor while interacting (unused here)

const STYLES = ['voronoi', 'delaunay', 'voro-fan', 'cell-tris', 'tri-gauss', 'tri-tiled', 'tri-splat'];
const EXP_STYLES = {
  exp1a: ['voronoi', 'tri-tiled', 'tri-splat'],
  exp1b: ['voronoi', 'delaunay', 'voro-fan', 'cell-tris', 'tri-gauss'],
};
const MODES = ['combined', 'edge', 'lapvar', 'uniform'];
const MESH_STYLES = { delaunay: 1, 'voro-fan': 1, 'cell-tris': 1, 'tri-tiled': 1 };
const SPLAT_STYLES = { 'tri-gauss': 1, 'tri-splat': 1 };

/* Deterministic PRNG so the same cell always yields the same seeds. */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fit = (w, h, cap) => {
  const s = Math.min(1, cap / Math.max(w, h));
  return { w: Math.max(1, Math.round(w * s)), h: Math.max(1, Math.round(h * s)) };
};

function sampleGray(rgba, w, h) {
  const g = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    g[i] = (rgba[o] * 77 + rgba[o + 1] * 150 + rgba[o + 2] * 29) >> 8;
  }
  return g;
}
function ones(w, h) { const a = new Float32Array(w * h); a.fill(1); return a; }

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
function lowResDe(ptsFull, colors, srcLow, cw, ch, W, H) {
  const recon = new Uint8ClampedArray(cw * ch * 4);
  const sx = W / cw, sy = H / ch;
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

function computeField(mode, edgeMap, lapMap) {
  if (mode === 'edge') return edgeMap;
  if (mode === 'lapvar') return lapMap;
  if (mode === 'uniform') return null;
  const out = new Float32Array(edgeMap.length);
  for (let i = 0; i < edgeMap.length; i++) out[i] = Math.sqrt(edgeMap[i] * lapMap[i]);
  return out;
}

/* Barycentric test shared by the triangle floor paths (mirrors main.js). */
function baryWeights(X, Y, ax, ay, bx, by, cx, cy) {
  const v0x = bx - ax, v0y = by - ay, v1x = cx - ax, v1y = cy - ay;
  const v2x = X - ax, v2y = Y - ay;
  const d00 = v0x * v0x + v0y * v0y, d01 = v0x * v1x + v0y * v1y, d11 = v1x * v1x + v1y * v1y;
  const d20 = v2x * v0x + v2y * v0y, d21 = v2x * v1x + v2y * v1y;
  const denom = d00 * d11 - d01 * d01;
  if (Math.abs(denom) < 1e-9) return null;
  const v = (d11 * d20 - d01 * d21) / denom;
  const wgt = (d00 * d21 - d01 * d20) / denom;
  const u = 1 - v - wgt;
  return (u >= -1e-9 && v >= -1e-9 && wgt >= -1e-9) ? { u, v, w: wgt } : null;
}

function decodePng(pngPath) {
  const buf = fs.readFileSync(pngPath);
  const png = PNG.sync.read(buf);
  return { data: new Uint8ClampedArray(png.data), w: png.width, h: png.height };
}

/* Full-res CPU reconstruction + coverage, mirroring renderCpuSync(). */
function renderSync(st, style, count, w, h) {
  const sx = st.w / w;
  const m = st.mean;
  const aa = !!st.aa;
  let cov = 0;
  const img = new Uint8ClampedArray(w * h * 4);
  const sample = makeSampler(st, style, count, sx);

  for (let y = 0; y < h; y++) {
    const Y = y * sx;
    for (let x = 0; x < w; x++) {
      const X = x * sx;
      let rr, gg, bb;
      if (aa) {
        const o = 0.25 * sx;
        const a = sample(X - o, Y - o), b = sample(X + o, Y - o);
        const c = sample(X - o, Y + o), d = sample(X + o, Y + o);
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
  return { img, cov };
}

/* Per-style per-pixel sampler, mirroring makeSampler(). */
function makeSampler(st, style, count, sx) {
  if (style === 'voronoi') {
    const pts = st.pts, colors = st.colors, blend = st.blend;
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
  if (MESH_STYLES[style] && st.mesh) {
    const verts = st.mesh.verts, tris = st.mesh.tris, interp = st.mesh.interp;
    const triColors = st.mesh.triColors, vertColors = st.mesh.vertColors;
    const bk = st.mean;
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
  if (SPLAT_STYLES[style] && st.splats) {
    const splats = st.splats, pts = st.pts, colors = st.colors;
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

/* Encoded payload byte count for the active style (mirrors payloadBytes()). */
function payloadBytes(style, st) {
  if (MESH_STYLES[style] && st.mesh) {
    const interp = st.mesh.interp;
    return 16 + st.mesh.verts.length * (interp ? 5 : 2) + st.mesh.tris.length * (interp ? 6 : 9);
  }
  if (SPLAT_STYLES[style] && st.splats) return 13 + st.splats.length * 8;
  return 13 + st.pts.length * 5;
}

const DEFAULTS = {
  exp: 'exp1-b', style: 'voronoi', budget: 256, mode: 'combined',
  iters: 0, autoCvt: false, triColor: 'interp', splatAlpha: 0.8,
  aa: false, blend: 0, progressive: 100,
};

function normalizeConfig(cfg) {
  const c = { ...DEFAULTS, ...cfg };
  const exp = c.exp === 'exp1a' ? 'exp1a' : 'exp1b';
  c.exp = exp;
  if (!EXP_STYLES[exp].includes(c.style)) throw new Error(`style ${c.style} invalid for ${exp}`);
  if (!MODES.includes(c.mode)) throw new Error('unknown mode: ' + c.mode);
  c.budget = Math.max(8, Math.min(16384, Math.round(+c.budget)));
  c.iters = Math.max(0, Math.min(200, Math.round(+c.iters)));
  c.progressive = Math.max(1, Math.min(100, Math.round(+c.progressive)));
  c.autoCvt = !!c.autoCvt;
  c.aa = !!c.aa;
  c.blend = clamp(+c.blend, 0, 1);
  c.splatAlpha = clamp(+c.splatAlpha, 0.1, 1);
  return c;
}

async function runCell(imagePath, cfg) {
  const c = normalizeConfig(cfg);
  const tAll = process.hrtime.bigint();
  const t0 = process.hrtime.bigint();
  const { data, w, h } = decodePng(imagePath);
  const { w: fw, h: fh } = fit(w, h, PREVIEW_MAX);
  const buf = { data, w, h };
  const srcData = new Uint8ClampedArray(fw * fh * 4);
  const sy = h / fh, sx = w / fw;
  for (let dy = 0; dy < fh; dy++) {
    const y0 = Math.floor(dy * sy), y1 = Math.max(y0 + 1, Math.floor((dy + 1) * sy));
    for (let dx = 0; dx < fw; dx++) {
      const x0 = Math.floor(dx * sx), x1 = Math.max(x0 + 1, Math.floor((dx + 1) * sx));
      let r = 0, g = 0, b = 0, n = 0;
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          const o = (yy * w + xx) * 4;
          r += data[o]; g += data[o + 1]; b += data[o + 2]; n++;
        }
      }
      const o = (dy * fw + dx) * 4;
      srcData[o] = n ? r / n : 0; srcData[o + 1] = n ? g / n : 0; srcData[o + 2] = n ? b / n : 0;
      srcData[o + 3] = 255;
    }
  }

  // This matches the browser's PREVIEW_MAX cap; the harness always measures
  // at full working resolution (no interactive coarse pass).
  const st = {
    w: fw, h: fh, buf: srcData, style: c.style, blend: c.blend, aa: c.aa,
    pts: [], colors: null, mesh: null, splats: null,
    mean: [0, 0, 0], rawBytes: fs.statSync(imagePath).size,
  };
  {
    let sr = 0, sg = 0, sb = 0, n = fw * fh;
    for (let i = 0; i < n; i++) { sr += srcData[i * 4]; sg += srcData[i * 4 + 1]; sb += srcData[i * 4 + 2]; }
    st.mean = [sr / n, sg / n, sb / n];
  }
  const g = sampleGray(srcData, fw, fh);
  const edgeMap = gray.normalize(gray.sobelMagnitude(g, fw, fh));
  const lapMap = gray.normalize(gray.laplacianVariance(g, fw, fh));

  const tField = process.hrtime.bigint();
  const field = computeField(c.mode, edgeMap, lapMap);

  const tSample = process.hrtime.bigint();
  const rng = mulberry32(hashString(imagePath + '|' + c.style + '|' + c.budget + '|' + c.mode));
  let pts;
  if (field === null) pts = se.uniformSample(fw, fh, c.budget);
  else pts = se.samples(field, fw, fh, c.budget, rng);
  pts = geo.decollide(pts, fw, fh, rng);

  // CVT relaxation (CPU path only, matching the metric-informed auto-stop).
  let usedIters = 0;
  const cap = c.autoCvt ? Math.max(c.iters, 40) : c.iters;
  if (cap > 0) {
    const fieldFull = field !== null ? field : ones(fw, fh);
    const fac = cvtFactor(fw * fh);
    const { field: fieldRun, w: cw, h: ch, factor: cf } = downsampleField(fieldFull, fw, fh, fac);
    const srcLow = c.autoCvt ? downsampleRgb(srcData, fw, fh, cw, ch) : null;
    const pointsDown = () => pts.map((p) => ({ x: p.x / cf, y: p.y / cf }));
    const scaleUp = (arr) => {
      const out = new Float32Array(arr.length);
      for (let k = 0; k < arr.length; k++) out[k] = arr[k] * cf;
      return out;
    };
    const cvtOpts = { chunk: c.autoCvt ? 2 : 4, isCancelled: () => false };
    if (c.autoCvt) {
      const dispThresh = 0.1 / cf;
      const checkEvery = 5;
      const deThresh = 0.05;
      let lastDe = null, streak = 0, lastCheck = 0;
      cvtOpts.onStep = (itNum, meanDisp, curDown) => {
        usedIters = itNum;
        if (meanDisp < dispThresh) return false;
        if (itNum - lastCheck >= checkEvery) {
          lastCheck = itNum;
          const up = scaleUp(curDown.flatMap((p) => [p.x, p.y]));
          const full = new Array(up.length / 2);
          for (let k = 0; k < full.length; k++) full[k] = { x: up[k * 2], y: up[k * 2 + 1] };
          const colorsLow = se.pointColors(srcData, fw, fh, full);
          const deLow = lowResDe(full, colorsLow, srcLow, cw, ch, fw, fh);
          const improve = lastDe === null ? Infinity : lastDe - deLow;
          lastDe = deLow;
          streak = improve < deThresh ? streak + 1 : 0;
          if (streak >= 2) return false;
        }
        return true;
      };
    }
    const out = await se.cvtRelaxAsync(pointsDown(), fieldRun, cw, ch, cap, cvtOpts);
    if (out === null) throw new Error('CVT cancelled');
    if (out.iterations != null) usedIters = out.iterations;
    const up = scaleUp(out.flatMap((p) => [p.x, p.y]));
    pts = new Array(up.length / 2);
    for (let k = 0; k < pts.length; k++) pts[k] = { x: up[k * 2], y: up[k * 2 + 1] };
    pts = geo.decollide(pts, fw, fh, Math.random, 0);
  }
  const tCvtEnd = process.hrtime.bigint();

  st.pts = pts;
  st.colors = se.cellMeanColors(srcData, fw, fh, pts);

  // Floor geometry per style.
  const tGeom = process.hrtime.bigint();
  const interp = c.triColor === 'interp';
  const fieldGeom = field !== null ? field : ones(fw, fh);
  if (c.style === 'delaunay' || c.style === 'tri-tiled') {
    st.mesh = se.triangleMesh(pts, st.colors, srcData, fw, fh, fieldGeom, interp, { frame: 'midpoints' });
  } else if (c.style === 'voro-fan' || c.style === 'cell-tris') {
    const cells = geo.voronoiCells(pts, fw, fh);
    const raw = c.style === 'voro-fan' ? geo.fanMesh(pts, cells) : geo.oneTrianglePerCell(pts, cells);
    st.mesh = geo.meshColors(raw.verts, raw.tris, pts, st.colors, srcData, fw, fh, fieldGeom, interp);
  } else if (c.style === 'tri-gauss') {
    const cells = geo.voronoiCells(pts, fw, fh);
    const splats = geo.triGauss(pts, cells, c.splatAlpha);
    for (let i = 0; i < splats.length; i++) {
      const o = cells[i].k * 4;
      splats[i].r = st.colors[o]; splats[i].g = st.colors[o + 1]; splats[i].b = st.colors[o + 2];
    }
    st.splats = splats;
  } else if (c.style === 'tri-splat') {
    st.splats = se.splatParams(pts, srcData, fw, fh, c.splatAlpha);
  }
  const tGeomEnd = process.hrtime.bigint();

  // Metrics at full working resolution.
  const np = MESH_STYLES[c.style] ? (st.mesh ? st.mesh.tris.length : 0)
    : SPLAT_STYLES[c.style] ? (st.splats ? st.splats.length : 0)
      : st.pts.length;
  const count = Math.max(1, Math.round(np * (c.progressive / 100)));
  const tRender = process.hrtime.bigint();
  const { img, cov } = renderSync(st, c.style, count, fw, fh);
  const tRenderEnd = process.hrtime.bigint();

  const psnr = metric.psnr(img, srcData);
  const ssim = metric.ssim(img, srcData, fw, fh);
  const de = metric.ciede(img, srcData, fw, fh);
  const deSal = field !== null ? metric.weightedMean(de.map, field) : null;

  const ms = (a, b) => Number((Number(b - a) / 1e6).toFixed(2));
  return {
    image: c.image || path.basename(imagePath),
    exp: c.exp, style: c.style, budget: c.budget, mode: c.mode,
    iters: c.autoCvt ? usedIters : c.iters, autoCvt: c.autoCvt,
    triColor: c.triColor, splatAlpha: c.splatAlpha, aa: c.aa, blend: c.blend,
    progressive: c.progressive,
    np, count,
    psnr: +psnr.toFixed(3), ssim: +ssim.toFixed(4),
    de: +de.mean.toFixed(3), de99: +de.p99.toFixed(3),
    deSal: deSal === null ? null : +deSal.toFixed(3),
    cov: +(cov / (fw * fh)).toFixed(4),
    bytes: payloadBytes(c.style, st),
    msField: ms(tField, tSample), msSample: ms(tSample, tCvtEnd),
    msGeom: ms(tGeom, tGeomEnd), msRender: ms(tRender, tRenderEnd),
    msTotal: ms(tAll, process.hrtime.bigint()),
    w: fw, h: fh,
  };
}

function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

module.exports = { runCell, normalizeConfig, STYLES, MODES, payloadBytes, decodePng };
