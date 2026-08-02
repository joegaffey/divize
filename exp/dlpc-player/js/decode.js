/* ============================================================
 * divize – decode.js (DLPC viewer)
 * Parses a `.dlpc` binary container (spec/dlpc-format.md) into a
 * structured object:
 *   { version, width, height, layers: [{ type, pts, colors }] }
 * Layer 0 packets are 5 bytes; higher layers are reserved for now.
 * ============================================================ */
(function (global) {
  'use strict';

  const MAGIC = [0x44, 0x4c, 0x47, 0x43]; // "DLPC"
  const LAYER_VORONOI = 0x01;

  function parse(bytes) {
    const u = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    if (u.length < 10) throw new Error('too small to be a .dlpc file');
    for (let i = 0; i < 4; i++) {
      if (u[i] !== MAGIC[i]) throw new Error('not a .dlpc file (bad magic)');
    }
    const width = u[5] | (u[6] << 8);
    const height = u[7] | (u[8] << 8);
    const layerCount = u[9];
    const layers = [];
    let p = 10;

    for (let L = 0; L < layerCount; L++) {
      if (p + 3 > u.length) throw new Error('truncated layer header');
      const type = u[p];
      const count = u[p + 1] | (u[p + 2] << 8);
      p += 3;
      if (type === LAYER_VORONOI) {
        if (p + count * 5 > u.length) throw new Error('truncated layer-0 payload');
        const pts = new Array(count);
        const colors = new Uint8ClampedArray(count * 4);
        for (let i = 0; i < count; i++) {
          const bx = u[p], by = u[p + 1], r = u[p + 2], g = u[p + 3], b = u[p + 4];
          p += 5;
          pts[i] = {
            x: ((bx + 0.5) / 256) * width,
            y: ((by + 0.5) / 256) * height,
          };
          colors[i * 4] = r; colors[i * 4 + 1] = g; colors[i * 4 + 2] = b; colors[i * 4 + 3] = 255;
        }
        layers.push({ type, count, pts, colors });
      } else {
        // Unknown layer: conservatively skip by a fixed 8-byte stride
        // (Layer 1+ primitive packets); unsupported for now.
        throw new Error('unsupported layer type 0x' + type.toString(16));
      }
    }
    return { version: u[4], width, height, layers };
  }

  global.dlpcDecode = { parse };
})(window);