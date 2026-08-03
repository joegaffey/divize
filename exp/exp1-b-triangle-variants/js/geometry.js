/* ============================================================
 * divize – geometry.js (exp1-b · triangle-floor variants)
 * Exact Voronoi-cell construction from the Delaunay dual, plus
 * three triangle-floor derivations over those cells:
 *   voronoiCells(pts, w, h)                 -> [{k, poly}]
 *   fanMesh(pts, cells)                     -> { verts, tris }  (cell → seed fan)
 *   oneTrianglePerCell(pts, cells)          -> { verts, tris }  (max-area triangle)
 *   triGauss(pts, cells, alpha)             -> splat params (orientation from cell ellipse)
 *   meshColors(verts, tris, pts, colors, src4, w, h, field, interp)
 *                                            -> { vertColors, triColors, tris } (ordered)
 * Cells are exact half-plane intersections of the seed's Voronoi
 * region clipped to the image box, so fan/one-triangle meshes tile
 * the full frame with no frame vertices needed.
 * ============================================================ */
(function (global) {
  'use strict';

  function voronoiCells(pts, w, h) {
    const n = pts.length;
    const tris = global.sampleEngine.delaunay(pts);
    const adj = Array.from({ length: n }, () => new Set());
    for (const t of tris) {
      adj[t.a].add(t.b); adj[t.b].add(t.a);
      adj[t.a].add(t.c); adj[t.c].add(t.a);
      adj[t.b].add(t.c); adj[t.c].add(t.b);
    }
    const box = [[0, 0], [w - 1, 0], [w - 1, h - 1], [0, h - 1]];
    const cells = [];
    for (let k = 0; k < n; k++) {
      let poly = box.map((p) => p.slice());
      const kx = pts[k].x, ky = pts[k].y;
      for (const m of adj[k]) {
        const mx = pts[m].x, my = pts[m].y;
        // half-plane |p-k| <= |p-m|:  (m-k)·p <= (|m|²-|k|²)/2
        const A = mx - kx, B = my - ky;
        const C = (kx * kx + ky * ky - mx * mx - my * my) * 0.5;
        poly = clipHalf(poly, A, B, C);
        if (poly.length < 3) break;
      }
      cells.push({ k, poly });
    }
    return cells;
  }

  // Sutherland–Hodgman clip to A·x + B·y + C <= 0
  function clipHalf(poly, A, B, C) {
    const f = (p) => A * p[0] + B * p[1] + C;
    const inside = (v) => f(v) <= 1e-9;
    const out = [];
    const N = poly.length;
    for (let i = 0; i < N; i++) {
      const cur = poly[i], nxt = poly[(i + 1) % N];
      const inCur = inside(cur), inNxt = inside(nxt);
      if (inCur) out.push(cur);
      if (inCur !== inNxt) {
        const fc = f(cur), fn = f(nxt);
        const t = fc / (fc - fn);
        out.push([cur[0] + t * (nxt[0] - cur[0]), cur[1] + t * (nxt[1] - cur[1])]);
      }
    }
    return out;
  }

  function polyArea(poly) {
    let a = 0;
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length];
      a += p[0] * q[1] - q[0] * p[1];
    }
    return Math.abs(a) / 2;
  }

  // Triangle fan per cell: seed + every polygon edge (seed, c_i, c_{i+1}), which
  // exactly tiles the convex cell. Shared corners are de-duplicated across cells
  // to keep the vertex count near n + 2n.
  function fanMesh(pts, cells) {
    const key = (x, y) => x.toFixed(1) + ',' + y.toFixed(1);
    const map = new Map();
    const verts = pts.map((p) => ({ x: p.x, y: p.y }));
    const tris = [];
    const vid = (x, y) => {
      const k = key(x, y);
      let id = map.get(k);
      if (id === undefined) { id = verts.length; map.set(k, id); verts.push({ x, y }); }
      return id;
    };
    for (const cell of cells) {
      const k = cell.k, poly = cell.poly;
      const nP = poly.length;
      let first = -1, prev = -1;
      for (let i = 0; i < nP; i++) {
        const id = vid(poly[i][0], poly[i][1]);
        if (i === 0) first = id;
        if (prev !== -1) tris.push({ a: k, b: prev, c: id });
        prev = id;
      }
      tris.push({ a: k, b: prev, c: first });
    }
    return { verts, tris };
  }

  // One max-area inscribed triangle per cell: the best 3 polygon corners. For a
  // convex cell the maximum-area inscribed triangle has all three vertices on the
  // polygon, so a brute-force over corner triples is exact and cheap (cells have
  // few corners). This is a cheap per-cell approximation with visible gaps.
  function oneTrianglePerCell(pts, cells) {
    const verts = pts.map((p) => ({ x: p.x, y: p.y }));
    const tris = [];
    for (const cell of cells) {
      const k = cell.k, poly = cell.poly;
      const m = poly.length;
      let best = null, bestArea = -1;
      for (let i = 0; i < m; i++) {
        for (let j = i + 1; j < m; j++) {
          for (let l = j + 1; l < m; l++) {
            const a = poly[i], b = poly[j], c = poly[l];
            const area = Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]));
            if (area > bestArea) { bestArea = area; best = [a, b, c]; }
          }
        }
      }
      if (best) {
        const i0 = verts.length;
        verts.push({ x: best[0][0], y: best[0][1] },
                   { x: best[1][0], y: best[1][1] },
                   { x: best[2][0], y: best[2][1] });
        tris.push({ a: i0, b: i0 + 1, c: i0 + 2 });
      }
    }
    return { verts, tris };
  }

  // Anisotropic "triangular Gaussian" splat: each triangle is oriented along the
  // cell's principal covariance axis, sized to the cell's long radius. Packed as
  // 0x03 splats so the decoder composites them over the Voronoi floor.
  function triGauss(pts, cells, alpha) {
    const out = [];
    for (const cell of cells) {
      const k = cell.k, poly = cell.poly;
      let cx = 0, cy = 0;
      for (const p of poly) { cx += p[0]; cy += p[1]; }
      cx /= poly.length; cy /= poly.length;
      let sxx = 0, syy = 0, sxy = 0;
      for (const p of poly) {
        const dx = p[0] - cx, dy = p[1] - cy;
        sxx += dx * dx; syy += dy * dy; sxy += dx * dy;
      }
      sxx /= poly.length; syy /= poly.length; sxy /= poly.length;
      const theta = 0.5 * Math.atan2(2 * sxy, sxx - syy);
      const d = Math.sqrt(Math.max(0, (sxx - syy) * (sxx - syy) + 4 * sxy * sxy));
      const e1 = 0.5 * (sxx + syy + d);      // principal variance
      const r1 = 2 * Math.sqrt(Math.max(e1, 1e-6)); // long radius
      const s = pts[k];
      out.push({ x: s.x, y: s.y, size: r1 * 0.92, angle: theta, alpha });
    }
    return out;
  }

  // Colour + saliency-order a generic triangle mesh for the render/encode path.
  // interp → per-vertex colour (nearest seed); flat → per-triangle centroid sample.
  function meshColors(verts, tris, pts, colors, src4, w, h, field, interp) {
    const V = verts.length, T = tris.length;
    let vertColors = null, triColors = null;
    if (interp) {
      vertColors = new Uint8ClampedArray(V * 4);
      for (let i = 0; i < V; i++) {
        let best = 0, bd = Infinity;
        for (let k = 0; k < pts.length; k++) {
          const dx = verts[i].x - pts[k].x, dy = verts[i].y - pts[k].y;
          const dd = dx * dx + dy * dy;
          if (dd < bd) { bd = dd; best = k; }
        }
        const o = best * 4;
        vertColors[i * 4] = colors[o]; vertColors[i * 4 + 1] = colors[o + 1];
        vertColors[i * 4 + 2] = colors[o + 2]; vertColors[i * 4 + 3] = 255;
      }
    } else {
      triColors = new Uint8ClampedArray(T * 4);
      for (let i = 0; i < T; i++) {
        const t = tris[i];
        const cx = (verts[t.a].x + verts[t.b].x + verts[t.c].x) / 3;
        const cy = (verts[t.a].y + verts[t.b].y + verts[t.c].y) / 3;
        const o = (clamp(Math.round(cy), 0, h - 1) * w + clamp(Math.round(cx), 0, w - 1)) * 4;
        triColors[i * 4] = src4[o]; triColors[i * 4 + 1] = src4[o + 1];
        triColors[i * 4 + 2] = src4[o + 2]; triColors[i * 4 + 3] = 255;
      }
    }
    const sal = field || null;
    const rated = tris.map((t, i) => {
      let s = 0;
      if (sal) {
        s = (sal[clamp(Math.round(verts[t.a].y), 0, h - 1) * w + clamp(Math.round(verts[t.a].x), 0, w - 1)] +
             sal[clamp(Math.round(verts[t.b].y), 0, h - 1) * w + clamp(Math.round(verts[t.b].x), 0, w - 1)] +
             sal[clamp(Math.round(verts[t.c].y), 0, h - 1) * w + clamp(Math.round(verts[t.c].x), 0, w - 1)]) / 3;
      }
      return { t, i, s };
    });
    rated.sort((x, y) => y.s - x.s);
    return {
      verts, vertColors, triColors,
      tris: rated.map((r) => r.t), interp,
    };
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // The adaptive sampler emits points on the integer pixel lattice, so many
  // seeds share rows/columns or exact coordinates — a degenerate input that
  // breaks the Delaunay (overlapping triangles, orphaned points). Collapse
  // exact duplicates and apply a tiny deterministic jitter to force general
  // position before any triangulation.
  function decollide(pts, w, h, rng = Math.random, jitter = 0.25) {
    const map = new Map();
    const out = [];
    for (const p of pts) {
      const key = Math.round(p.x) + ',' + Math.round(p.y);
      if (map.has(key)) continue;
      map.set(key, 1);
      out.push(p);
    }
    if (jitter <= 0) return out;
    return out.map((p) => ({
      x: clamp(p.x + (rng() - 0.5) * 2 * jitter, 0, w - 1),
      y: clamp(p.y + (rng() - 0.5) * 2 * jitter, 0, h - 1),
    }));
  }

  global.geometry = {
    voronoiCells, fanMesh, oneTrianglePerCell, triGauss, meshColors, polyArea,
    decollide,
  };
})(window);
