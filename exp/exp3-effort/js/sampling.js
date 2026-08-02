/* ============================================================
 * divize – sampling.js
 * Adaptive point extraction (importance CDF over a saliency
 * field) plus Centroidal Voronoi Tessellation (Lloyd) relaxation
 * weighted by the local saliency density.
 *
 * API:
 *   adaptiveSample(saliency, sampler, n)  -> [{x,y}]
 *   lloydRelax(points, saliency, w, h, iters) -> [{x,y}]
 *   assignedColor(points, srcData, w, h)  -> [r,g,b,...]
 * ============================================================ */
(function (global) {
  'use strict';

  /**
   * Draw `n` points according to the 2D probability density given
   * by the normalised `saliency` field via the standard CDF /
   * cumulative-sum inverse method. Guarantees exactly n points,
   * denser in high-saliency regions.
   */
  function samples(saliency, w, h, n, rng = Math.random) {
    const nPix = w * h;
    const cdf = new Float32Array(nPix);
    let total = 0;
    for (let i = 0; i < nPix; i++) {
      total += saliency[i];
      cdf[i] = total;
    }
    if (total <= 0) total = 1;

    const pts = new Array(n);
    for (let k = 0; k < n; k++) {
      const t = cdf[nPix - 1] * rng();
      // binary search in CDF
      let lo = 0, hi = nPix - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (cdf[mid] < t) lo = mid + 1;
        else hi = mid;
      }
      const y = (lo / w) | 0;
      const x = lo - y * w;
      pts[k] = { x, y };
    }
    return pts;
  }

  /**
   * Lloyd k-means relaxation. Cell mean is computed as the centre of
   * mass of all pixels assigned to each seed, weighted by saliency, so
   * seeds migrate towards detail. `iters=0` returns points unchanged.
   */
  function cvtRelax(pts, saliency, w, h, iters) {
    if (!iters || iters <= 0) return pts.slice();
    let cur = pts.slice();
    const nPts = cur.length;
    const sx = new Float64Array(nPts);
    const sy = new Float64Array(nPts);
    const sw = new Float64Array(nPts);

    for (let it = 0; it < iters; it++) {
      sx.fill(0); sy.fill(0); sw.fill(0);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          // nearest seed
          let best = 0, bd = Infinity;
          for (let k = 0; k < nPts; k++) {
            const dx = x - cur[k].x, dy = y - cur[k].y;
            const d = dx * dx + dy * dy;
            if (d < bd) { bd = d; best = k; }
          }
          const wgt = saliency[y * w + x] + 1e-3;
          sx[best] += x * wgt;
          sy[best] += y * wgt;
          sw[best] += wgt;
        }
      }
      const next = new Array(nPts);
      for (let k = 0; k < nPts; k++) {
        if (sw[k] > 0) {
          next[k] = { x: sx[k] / sw[k], y: sy[k] / sw[k] };
        } else {
          next[k] = { x: cur[k].x, y: cur[k].y };
        }
      }
      cur = next;
    }
    return cur;
  }

  /**
   * Asynchronous, chunked CVT relaxation. Runs the same Lloyd update as
   * `cvtRelax` but yields to the event loop every `chunkIter` iterations
   * so the UI stays responsive and progress can be reported. Cancellable
   * via the `isCancelled` predicate.
   *
   * @returns {Promise<Array>} the relaxed points.
   */
  async function cvtRelaxAsync(pts, saliency, w, h, iters, opts = {}) {
    const chunk = opts.chunk || 4;
    const onProgress = opts.onProgress || null;
    const isCancelled = opts.isCancelled || null;
    if (!iters || iters <= 0) return pts.slice();

    let cur = pts.slice();
    const nPts = cur.length;
    const sx = new Float64Array(nPts);
    const sy = new Float64Array(nPts);
    const sw = new Float64Array(nPts);

    for (let it = 0; it < iters; it++) {
      if (isCancelled && isCancelled()) return null;   // abandoned
      sx.fill(0); sy.fill(0); sw.fill(0);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let best = 0, bd = Infinity;
          for (let k = 0; k < nPts; k++) {
            const dx = x - cur[k].x, dy = y - cur[k].y;
            const d = dx * dx + dy * dy;
            if (d < bd) { bd = d; best = k; }
          }
          const wgt = saliency[y * w + x] + 1e-3;
          sx[best] += x * wgt;
          sy[best] += y * wgt;
          sw[best] += wgt;
        }
      }
      const next = new Array(nPts);
      for (let k = 0; k < nPts; k++) {
        if (sw[k] > 0) next[k] = { x: sx[k] / sw[k], y: sy[k] / sw[k] };
        else next[k] = { x: cur[k].x, y: cur[k].y };
      }
      cur = next;
      if (onProgress) onProgress(it + 1, iters);
      if ((it + 1) % chunk === 0) await sleep(0);     // let the UI breathe
    }
    return cur;
  }

  function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

  /**
   * Uniform sample on the grid cell lattice (used for the uniform
   * mode in Experiment 1 baseline).
   */
  function uniformSample(w, h, n) {
    const pts = [];
    const cols = Math.ceil(Math.sqrt((w / h) * n));
    const rows = Math.ceil(n / cols);
    for (let r = 0; r < rows && pts.length < n; r++) {
      for (let c = 0; c < cols && pts.length < n; c++) {
        pts.push({ x: Math.min(w - 1, ((c + 0.5) / cols) * w),
                   y: Math.min(h - 1, ((r + 0.5) / rows) * h) });
      }
    }
    return pts;
  }

  /** Map every point to the source RGBA pixel at the closest grid
   *  position (bilinear not needed at preview scale). */
  function pointColors(src4, w, h, pts) {
    const out = new Uint8ClampedArray(pts.length * 4);
    for (let k = 0; k < pts.length; k++) {
      const x = Math.max(0, Math.min(w - 1, Math.round(pts[k].x)));
      const y = Math.max(0, Math.min(h - 1, Math.round(pts[k].y)));
      const o = (y * w + x) * 4;
      out[k * 4] = src4[o];
      out[k * 4 + 1] = src4[o + 1];
      out[k * 4 + 2] = src4[o + 2];
      out[k * 4 + 3] = 255;
    }
    return out;
  }

global.sampleEngine = {
    samples,
    cvtRelax,
    cvtRelaxAsync,
    uniformSample,
    pointColors,
  };
})(window);