/* ============================================================
 * divize – export.js  (exp1-a · floor-payload packing)
 * Packs the current field as a Layer-0 `.dlpc` blob for any of the
 * three floor primitives (docs/dlpc-format.md):
 *   0x01 pure Voronoi     5-byte packets
 *   0x02 tiled mesh       indexed: vertices (+ colours) + index triples
 *   0x03 α-triangle splat 8-byte packets
 * API:
 *   dlpcExport.encodeLayer0(w,h,pts,colors) -> Uint8Array
 *   dlpcExport.encodeMesh(w,h,verts,vertColors,tris,triColors,interp)
 *   dlpcExport.encodeSplat(w,h,splats)
 *   dlpcExport.download(...)
 * ============================================================ */
(function (global) {
  'use strict';

  const MAGIC = [0x44, 0x4c, 0x47, 0x43];   // "DLPC"
  const LAYER_VORONOI = 0x01;
  const LAYER_MESH = 0x02;
  const LAYER_SPLAT = 0x03;

  const q = (v, scale) => Math.max(0, Math.min(255, Math.round((v / Math.max(1, scale)) * 255)));

  function header(w, h, type, count) {
    const head = new Uint8Array(13);
    head.set(MAGIC, 0);
    head[4] = 0x00;
    head[5] = w & 0xff; head[6] = (w >> 8) & 0xff;
    head[7] = h & 0xff; head[8] = (h >> 8) & 0xff;
    head[9] = 1;
    head[10] = type;
    head[11] = count & 0xff; head[12] = (count >> 8) & 0xff;
    return head;
  }

  function encodeLayer0(w, h, pts, colors) {
    const count = pts.length;
    const lay = new Uint8Array(count * 5);
    for (let i = 0; i < count; i++) {
      const o = i * 5;
      lay[o] = q(pts[i].x, w);
      lay[o + 1] = q(pts[i].y, h);
      lay[o + 2] = colors[i * 4];
      lay[o + 3] = colors[i * 4 + 1];
      lay[o + 4] = colors[i * 4 + 2];
    }
    const out = new Uint8Array(13 + lay.length);
    out.set(header(w, h, LAYER_VORONOI, count), 0);
    out.set(lay, 13);
    return out;
  }

  /**
   * 0x02 indexed triangle mesh. Vertices may carry per-vertex colour
   * (interp=true, barycentric) or share a per-triangle flat colour.
   */
  function encodeMesh(w, h, verts, vertColors, tris, triColors, interp) {
    const V = verts.length, T = tris.length;
    const vertSize = interp ? 5 : 2;
    const triSize = interp ? 6 : 9;
    const sub = new Uint8Array(3);
    sub[0] = V & 0xff; sub[1] = (V >> 8) & 0xff;
    sub[2] = interp ? 1 : 0;

    const payload = new Uint8Array(3 + V * vertSize + T * triSize);
    payload.set(sub, 0);
    let p = 3;
    for (let i = 0; i < V; i++) {
      payload[p++] = q(verts[i].x, w);
      payload[p++] = q(verts[i].y, h);
      if (interp) {
        payload[p++] = vertColors[i * 4];
        payload[p++] = vertColors[i * 4 + 1];
        payload[p++] = vertColors[i * 4 + 2];
      }
    }
    for (let k = 0; k < T; k++) {
      const t = tris[k];
      payload[p++] = t.a & 0xff; payload[p++] = (t.a >> 8) & 0xff;
      payload[p++] = t.b & 0xff; payload[p++] = (t.b >> 8) & 0xff;
      payload[p++] = t.c & 0xff; payload[p++] = (t.c >> 8) & 0xff;
      if (!interp) {
        payload[p++] = triColors[k * 4];
        payload[p++] = triColors[k * 4 + 1];
        payload[p++] = triColors[k * 4 + 2];
      }
    }
    const out = new Uint8Array(13 + payload.length);
    out.set(header(w, h, LAYER_MESH, T), 0);
    out.set(payload, 13);
    return out;
  }

  /**
   * 0x03 α-triangle splat. 8-byte packets: centre, log-scaled size, angle,
   * alpha, rgb. size_px = (size/255)*min(W,H); angle = value/255*π.
   */
  function encodeSplat(w, h, splats) {
    const count = splats.length;
    const m = Math.min(w, h);
    const lay = new Uint8Array(count * 8);
    for (let i = 0; i < count; i++) {
      const sp = splats[i];
      const o = i * 8;
      lay[o] = q(sp.x, w);
      lay[o + 1] = q(sp.y, h);
      lay[o + 2] = Math.max(0, Math.min(255, Math.round((sp.size / Math.max(1, m)) * 255)));
      lay[o + 3] = Math.max(0, Math.min(255, Math.round((sp.angle / Math.PI) * 255)));
      lay[o + 4] = Math.max(0, Math.min(255, Math.round(sp.alpha * 255)));
      lay[o + 5] = sp.r;
      lay[o + 6] = sp.g;
      lay[o + 7] = sp.b;
    }
    const out = new Uint8Array(13 + lay.length);
    out.set(header(w, h, LAYER_SPLAT, count), 0);
    out.set(lay, 13);
    return out;
  }

  function download(data, filename) {
    const url = URL.createObjectURL(new Blob([data], { type: 'application/octet-stream' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 10);
  }

  global.dlpcExport = {
    encodeLayer0,
    encodeMesh,
    encodeSplat,
    download,
  };
})(window);
