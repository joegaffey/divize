/* ============================================================
 * divize – export.js  (Exp 1 → Phase 3 bit-packing)
 * Packs the current point field + colours into a Layer-0-only
 * `.dlpc` binary blob (see spec/dlpc-format.md) and downloads it.
 *
 * API:
 *   dlpcExport.encode(w, h, pts, colors) -> Uint8Array
 *   dlpcExport.download(w, h, pts, colors, name?)
 * ============================================================ */
(function (global) {
  'use strict';

  const MAGIC = [0x44, 0x4c, 0x47, 0x43];   // "DLPC"

  function encodeLayer0(w, h, pts, colors) {
    const count = pts.length;
    const header = new Uint8Array(13);
    header.set(MAGIC, 0);
    header[4] = 0x00;                       // version
    header[5] = w & 0xff; header[6] = (w >> 8) & 0xff;
    header[7] = h & 0xff; header[8] = (h >> 8) & 0xff;
    header[9] = 1;                          // layer count
    header[10] = 0x01;                      // layer 0 type: Pure Voronoi
    header[11] = count & 0xff; header[12] = (count >> 8) & 0xff;

    const lay = new Uint8Array(count * 5);
    for (let i = 0; i < count; i++) {
      const x = Math.max(0, Math.min(255, Math.round((pts[i].x / Math.max(1, w)) * 255)));
      const y = Math.max(0, Math.min(255, Math.round((pts[i].y / Math.max(1, h)) * 255)));
      const o = i * 5;
      lay[o] = x;
      lay[o + 1] = y;
      lay[o + 2] = colors[i * 4 + 0];
      lay[o + 3] = colors[i * 4 + 1];
      lay[o + 4] = colors[i * 4 + 2];
    }

    const out = new Uint8Array(header.length + lay.length);
    out.set(header, 0);
    out.set(lay, header.length);
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
    encode: encodeLayer0,
    download: (w, h, pts, colors, name) =>
      download(encodeLayer0(w, h, pts, colors), name || 'image.dlpc'),
  };
})(window);