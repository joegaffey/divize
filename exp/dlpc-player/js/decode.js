/* ============================================================
 * divize – decode.js (DLPC viewer)
 * Parses a `.dlpc` binary container (spec/dlpc-format.md) into a
 * structured object:
 *   { version, width, height, layers: [{ type, count, ... }] }
 * Layer types:
 *   0x01 pure Voronoi floor (5-byte packets)
 *   0x02 tiled triangle mesh (indexed vertices + triangles)
 *   0x03 α-triangle splat floor (8-byte packets)
 * ============================================================ */
(function (global) {
  'use strict';

  const MAGIC = [0x44, 0x4c, 0x47, 0x43]; // "DLPC"
  const LAYER_VORONOI = 0x01;
  const LAYER_MESH = 0x02;
  const LAYER_SPLAT = 0x03;

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
      } else if (type === LAYER_MESH) {
        if (p + 3 > u.length) throw new Error('truncated mesh sub-header');
        const V = u[p] | (u[p + 1] << 8);
        const flags = u[p + 2];
        const interp = (flags & 1) === 1;
        p += 3;
        const vertSize = interp ? 5 : 2;
        if (p + V * vertSize + count * (interp ? 6 : 9) > u.length) throw new Error('truncated mesh payload');
        const verts = new Array(V);
        let vertColors = null;
        if (interp) {
          vertColors = new Uint8ClampedArray(V * 4);
          for (let i = 0; i < V; i++) {
            verts[i] = {
              x: ((u[p] + 0.5) / 256) * width,
              y: ((u[p + 1] + 0.5) / 256) * height,
            };
            vertColors[i * 4] = u[p + 2]; vertColors[i * 4 + 1] = u[p + 3];
            vertColors[i * 4 + 2] = u[p + 4]; vertColors[i * 4 + 3] = 255;
            p += 5;
          }
        } else {
          for (let i = 0; i < V; i++) {
            verts[i] = {
              x: ((u[p] + 0.5) / 256) * width,
              y: ((u[p + 1] + 0.5) / 256) * height,
            };
            p += 2;
          }
        }
        const tris = new Array(count);
        let triColors = null;
        if (interp) {
          for (let k = 0; k < count; k++) {
            tris[k] = { a: u[p] | (u[p + 1] << 8), b: u[p + 2] | (u[p + 3] << 8), c: u[p + 4] | (u[p + 5] << 8) };
            p += 6;
          }
        } else {
          triColors = new Uint8ClampedArray(count * 4);
          for (let k = 0; k < count; k++) {
            tris[k] = { a: u[p] | (u[p + 1] << 8), b: u[p + 2] | (u[p + 3] << 8), c: u[p + 4] | (u[p + 5] << 8) };
            triColors[k * 4] = u[p + 6]; triColors[k * 4 + 1] = u[p + 7]; triColors[k * 4 + 2] = u[p + 8]; triColors[k * 4 + 3] = 255;
            p += 9;
          }
        }
        layers.push({ type, count, verts, tris, vertColors, triColors, interp });
      } else if (type === LAYER_SPLAT) {
        if (p + count * 8 > u.length) throw new Error('truncated splat payload');
        const m = Math.min(width, height);
        const splats = new Array(count);
        for (let i = 0; i < count; i++) {
          splats[i] = {
            x: ((u[p] + 0.5) / 256) * width,
            y: ((u[p + 1] + 0.5) / 256) * height,
            size: (u[p + 2] / 255) * m,
            angle: (u[p + 3] / 255) * Math.PI,
            alpha: u[p + 4] / 255,
            r: u[p + 5], g: u[p + 6], b: u[p + 7],
          };
          p += 8;
        }
        layers.push({ type, count, splats });
      } else {
        throw new Error('unsupported layer type 0x' + type.toString(16));
      }
    }
    return { version: u[4], width, height, layers };
  }

  global.dlpcDecode = { parse };
})(window);
