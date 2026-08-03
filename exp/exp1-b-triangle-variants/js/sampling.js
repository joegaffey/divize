/* ============================================================
 * divize – sampling.js  (exp1-a · triangle floors)
 * Exp 1-a builds on the exp1 engine: adaptive point extraction
 * (importance CDF over a saliency field) plus CVT / Lloyd
 * relaxation, and adds the triangle-floor geometry:
 *   delaunay(pts)                 -> [{a,b,c}] indexed tris
 *   triangleMesh(pts, colors, ...) -> { verts, vertColors|triColors, tris }
 *   splatParams(pts, src, ...)    -> per-seed {x,y,size,angle,alpha,rgb}
 *
 * API (also carries all exp1 exports):
 *   samples (adaptive) / cvtRelax / cvtRelaxAsync / uniformSample / pointColors
 *   delaunay / triangleMesh / splatParams / nearestDist
 * ============================================================ */
(function (global) {
  'use strict';

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
    }
    return cur;
  }

  async function cvtRelaxAsync(pts, saliency, w, h, iters, opts = {}) {
    const chunk = opts.chunk || 4;
    const onProgress = opts.onProgress || null;
    const isCancelled = opts.isCancelled || null;
    const onStep = opts.onStep || null;
    if (!iters || iters <= 0) { const a = pts.slice(); a.iterations = 0; return a; }

    let cur = pts.slice();
    const nPts = cur.length;
    const sx = new Float64Array(nPts);
    const sy = new Float64Array(nPts);
    const sw = new Float64Array(nPts);

    for (let it = 0; it < iters; it++) {
      if (isCancelled && isCancelled()) return null;
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
      let dispSum = 0;
      for (let k = 0; k < nPts; k++) {
        dispSum += Math.hypot(next[k].x - cur[k].x, next[k].y - cur[k].y);
      }
      const meanDisp = dispSum / nPts;
      cur = next;
      if (onStep && onStep(it + 1, meanDisp, cur) === false) {
        iters = it + 1;
        break;
      }
      if (onProgress) onProgress(it + 1, iters);
      if ((it + 1) % chunk === 0) await sleep(0);
    }
    cur.iterations = iters;
    return cur;
  }

  function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

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

  // Cell-mean colouring: assign every source pixel to its nearest seed and
  // average the RGB inside each Voronoi cell. This beats sampling the single
  // seed pixel (pointColors) by ~1.5-2.5 dB PSNR, because a cell's colour is
  // its true mean rather than one noisy sample. Used for the floor colours.
  function cellMeanColors(src4, w, h, pts) {
    const n = pts.length;
    const sum = new Float64Array(n * 3);
    const cnt = new Int32Array(n);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let best = 0, bd = Infinity;
        for (let k = 0; k < n; k++) {
          const dx = x - pts[k].x, dy = y - pts[k].y;
          const dd = dx * dx + dy * dy;
          if (dd < bd) { bd = dd; best = k; }
        }
        const o = (y * w + x) * 4;
        const b3 = best * 3;
        sum[b3] += src4[o]; sum[b3 + 1] += src4[o + 1]; sum[b3 + 2] += src4[o + 2];
        cnt[best]++;
      }
    }
    const out = new Uint8ClampedArray(n * 4);
    for (let k = 0; k < n; k++) {
      const c = Math.max(1, cnt[k]);
      out[k * 4] = sum[k * 3] / c; out[k * 4 + 1] = sum[k * 3 + 1] / c;
      out[k * 4 + 2] = sum[k * 3 + 2] / c; out[k * 4 + 3] = 255;
    }
    return out;
  }

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------------- Delaunay triangulation (Bowyer–Watson) ---------------- */

  // In-circle test, orientation-agnostic (circumcentre distance).
  function inCircle(a, b, c, p) {
    const D = (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)) * 2;
    if (Math.abs(D) < 1e-12) return false;
    const a2 = a.x * a.x + a.y * a.y, b2 = b.x * b.x + b.y * b.y, c2 = c.x * c.x + c.y * c.y;
    const ux = (a2 * (b.y - c.y) + b2 * (c.y - a.y) + c2 * (a.y - b.y)) / D;
    const uy = (a2 * (c.x - b.x) + b2 * (a.x - c.x) + c2 * (b.x - a.x)) / D;
    const r2 = (ux - a.x) ** 2 + (uy - a.y) ** 2;
    const d2 = (ux - p.x) ** 2 + (uy - p.y) ** 2;
    return d2 <= r2 + 1e-9;
  }

  /**
   * Bowyer–Watson incremental Delaunay. Returns triangles as {a,b,c} vertex
   * indices into `pts` (references to the super-triangle are removed).
   * Degenerate / coincident inputs are tolerated (D≈0 skips the in-circle
   * test); the mesh is an experiment floor, not a production mesher.
   */
  function delaunay(pts) {
    const n = pts.length;
    if (n < 3) return [];
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
    }
    const dmax = Math.max(maxX - minX, maxY - minY, 1);
    const midX = (minX + maxX) / 2, midY = (minY + maxY) / 2;
    const sup = [
      { x: midX - 20 * dmax, y: midY - dmax },
      { x: midX, y: midY + 20 * dmax },
      { x: midX + 20 * dmax, y: midY - dmax },
    ];
    const points = pts.concat(sup);
    let tris = [{ a: n, b: n + 1, c: n + 2 }];

    for (let i = 0; i < n; i++) {
      const p = points[i];
      const bad = [];
      for (let t = 0; t < tris.length; t++) {
        const tr = tris[t];
        if (inCircle(points[tr.a], points[tr.b], points[tr.c], p)) bad.push(tr);
      }
      // cavity boundary: edges belonging to exactly one bad triangle
      const edgeCount = new Map();
      const addEdge = (u, v) => {
        const key = u < v ? u + '|' + v : v + '|' + u;
        edgeCount.set(key, (edgeCount.get(key) || 0) + 1);
      };
      for (let b = 0; b < bad.length; b++) {
        addEdge(bad[b].a, bad[b].b); addEdge(bad[b].b, bad[b].c); addEdge(bad[b].c, bad[b].a);
      }
      const boundary = [];
      edgeCount.forEach((c, key) => { if (c === 1) boundary.push(key.split('|').map(Number)); });
      tris = tris.filter((t) => !bad.includes(t));
      for (let e = 0; e < boundary.length; e++) {
        tris.push({ a: boundary[e][0], b: boundary[e][1], c: i });
      }
    }
    return tris.filter((t) => t.a < n && t.b < n && t.c < n);
  }

  /**
   * Build the triangle-floor geometry from the CVT seeds.
   *  - interp=true : per-vertex colours (barycentric shading); vertColors kept.
   *  - interp=false: per-triangle flat colours; triColors kept.
   * Triangles are ordered by descending mean vertex saliency so the
   * progressive "streaming" cut favours the most detailed triangles.
   */
  function triangleMesh(pts, colors, src4, w, h, saliency, interp, opts = {}) {
    // The Delaunay hull of interior seeds lies strictly inside the image, so
    // the mesh would leave border pixels uncovered. opts.frame closes the mesh
    // to the frame: 'corners' adds the 4 image corners, 'midpoints' also adds
    // edge midpoints so border triangles hug the frame. Frame vertices are
    // coloured from their nearest real seed (the Voronoi floor colour).
    const frame = opts.frame || 'none';
    const { pts: up, colors: uc } = dedupe(pts, colors);

    let vp = up, vc = uc, frameStart = up.length;
    if (frame !== 'none') {
      const fpts = [
        { x: 0, y: 0 }, { x: w - 1, y: 0 }, { x: w - 1, y: h - 1 }, { x: 0, y: h - 1 },
      ];
      if (frame === 'midpoints') {
        fpts.push(
          { x: (w - 1) / 2, y: 0 }, { x: w - 1, y: (h - 1) / 2 },
          { x: (w - 1) / 2, y: h - 1 }, { x: 0, y: (h - 1) / 2 },
        );
      }
      const fc = new Uint8ClampedArray(fpts.length * 4);
      for (let i = 0; i < fpts.length; i++) {
        let best = 0, bd = Infinity;
        for (let k = 0; k < up.length; k++) {
          const dx = fpts[i].x - up[k].x, dy = fpts[i].y - up[k].y;
          const dd = dx * dx + dy * dy;
          if (dd < bd) { bd = dd; best = k; }
        }
        fc[i * 4] = uc[best * 4]; fc[i * 4 + 1] = uc[best * 4 + 1];
        fc[i * 4 + 2] = uc[best * 4 + 2]; fc[i * 4 + 3] = 255;
      }
      vc = new Uint8ClampedArray((up.length + fpts.length) * 4);
      vc.set(uc, 0);
      vc.set(fc, up.length * 4);
      vp = up.concat(fpts);
      frameStart = up.length;
    }

    const tris = delaunay(vp);
    const sal = saliency || null;
    const rated = tris.map((t, i) => ({
      a: t.a, b: t.b, c: t.c, i,
      s: sal ? (sal[Math.round(vp[t.a].y) * w + Math.round(vp[t.a].x)] +
                sal[Math.round(vp[t.b].y) * w + Math.round(vp[t.b].x)] +
                sal[Math.round(vp[t.c].y) * w + Math.round(vp[t.c].x)]) / 3 : 0,
    }));
    rated.sort((x, y) => y.s - x.s);
    const ordered = rated.map((t) => ({ a: t.a, b: t.b, c: t.c }));

    let vertColors = null, triColors = null;
    if (interp) {
      vertColors = vc;
    } else {
      triColors = new Uint8ClampedArray(ordered.length * 4);
      for (let i = 0; i < ordered.length; i++) {
        const t = ordered[i];
        const cx = (vp[t.a].x + vp[t.b].x + vp[t.c].x) / 3;
        const cy = (vp[t.a].y + vp[t.b].y + vp[t.c].y) / 3;
        const o = (clamp(Math.round(cy), 0, h - 1) * w + clamp(Math.round(cx), 0, w - 1)) * 4;
        triColors[i * 4] = src4[o]; triColors[i * 4 + 1] = src4[o + 1];
        triColors[i * 4 + 2] = src4[o + 2]; triColors[i * 4 + 3] = 255;
      }
    }
    return { verts: vp, vertColors, triColors, tris: ordered, interp, frameStart };
  }

  // Collapse coincident seeds (importance sampling can duplicate cells) so the
  // Delaunay has no degenerate triangles; returns unique points + a colour
  // array aligned to the unique set.
  function dedupe(pts, colors) {
    const map = new Map();
    const up = [], uc = new Uint8ClampedArray(pts.length * 4);
    let n = 0;
    for (let i = 0; i < pts.length; i++) {
      const key = pts[i].x.toFixed(1) + ',' + pts[i].y.toFixed(1);
      let id = map.get(key);
      if (id === undefined) {
        id = n++;
        map.set(key, id);
        up.push(pts[i]);
        if (colors) {
          uc[id * 4] = colors[i * 4]; uc[id * 4 + 1] = colors[i * 4 + 1];
          uc[id * 4 + 2] = colors[i * 4 + 2]; uc[id * 4 + 3] = 255;
        }
      }
    }
    if (n === pts.length) return { pts, colors };
    return { pts: up, colors: n ? uc.slice(0, n * 4) : colors };
  }

  /* ---------------- α-triangle splat params ---------------- */

  // Approximate nearest-neighbour distance per seed via a spatial hash, so
  // splat size derives from the local cell scale in O(n) rather than O(n²).
  function nearestDist(pts, w, h) {
    const n = pts.length;
    const cell = Math.max(1, Math.sqrt((w * h) / Math.max(1, n)));
    const cols = Math.ceil(w / cell) + 1;
    const grid = new Map();
    for (let i = 0; i < n; i++) {
      const cx = (pts[i].x / cell) | 0, cy = (pts[i].y / cell) | 0;
      const key = cx + cy * cols;
      let list = grid.get(key);
      if (!list) { list = []; grid.set(key, list); }
      list.push(i);
    }
    const out = new Float64Array(n);
    const rings = 24;
    for (let i = 0; i < n; i++) {
      const px = pts[i].x, py = pts[i].y;
      const gx = (px / cell) | 0, gy = (py / cell) | 0;
      let best = Infinity;
      for (let r = 0; r <= rings; r++) {
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
            const list = grid.get((gx + dx) + (gy + dy) * cols);
            if (!list) continue;
            for (let j = 0; j < list.length; j++) {
              const k = list[j];
              if (k === i) continue;
              const ddx = pts[k].x - px, ddy = pts[k].y - py;
              const d = ddx * ddx + ddy * ddy;
              if (d < best) best = d;
            }
          }
        }
        if (best < Infinity) break;
      }
      out[i] = best < Infinity ? Math.sqrt(best) : Math.sqrt(w * w + h * h);
    }
    return out;
  }

  /**
   * Center+transform α-triangle splat descriptors: centre = seed, size from
   * the local cell scale (nearest-neighbour distance), rotation 0 (exp3 will
   * tune transforms), colour sampled at the seed, alpha uniform for now.
   */
  function splatParams(pts, src4, w, h, alpha) {
    const nd = nearestDist(pts, w, h);
    const out = new Array(pts.length);
    for (let i = 0; i < pts.length; i++) {
      const x = Math.max(0, Math.min(w - 1, Math.round(pts[i].x)));
      const y = Math.max(0, Math.min(h - 1, Math.round(pts[i].y)));
      const o = (y * w + x) * 4;
      out[i] = {
        x: pts[i].x, y: pts[i].y,
        size: nd[i] * 0.95,        // ~ tile the cell with slight overlap
        angle: 0,
        alpha,
        r: src4[o], g: src4[o + 1], b: src4[o + 2],
      };
    }
    return out;
  }

  global.sampleEngine = {
    samples,
    cvtRelax,
    cvtRelaxAsync,
    uniformSample,
    pointColors,
    cellMeanColors,
    delaunay,
    triangleMesh,
    splatParams,
  };
})(window);
