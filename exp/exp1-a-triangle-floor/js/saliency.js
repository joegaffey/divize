/* ============================================================
 * divize · saliency.js
 * Gray / Sobel edge density / Laplacian variance extraction.
 * All functions operate as plain JS on ImageData-like objects
 * (arrays of Uint8ClampedArray RGBA) so they are trivially
 * portable to a Web Worker or GPU later.
 * ============================================================ */
(function (global) {
  'use strict';

  const WGX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const WGY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  /** Grayscale RGBA into a Rec.601 luma plane. */
  function toGray(data, w, h) {
    const n = w * h;
    const g = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      const o = i * 4;
      // Rec.601 luma
      g[i] = (data[o] * 77 + data[o + 1] * 150 + data[o + 2] * 29) >> 8;
    }
    return g;
  }

  /** Approximate Sobel gradient magnitude = edge density field. */
  function sobelMagnitude(gray, w, h) {
    const n = w * h;
    const out = new Float32Array(n);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        let gx = 0, gy = 0;
        let k = 0;
        for (let j = -1; j <= 1; j++) {
          for (let i2 = -1; i2 <= 1; i2++, k++) {
            const v = gray[(y + j) * w + (x + i2)];
            gx += WGX[k] * v;
            gy += WGY[k] * v;
          }
        }
        out[i] = Math.sqrt(gx * gx + gy * gy);
      }
    }
    return out;
  }

  /**
   * Local Laplacian variance: for each pixel, compute the variance
   * of its 3x3 neighbourhood of the Laplacian-of-Gaussian response.
   * Highlights texture-bearing regions (detail variance), not just
   * hard single edges.
   */
  function laplacianVariance(gray, w, h) {
    const n = w * h;
    const lap = new Float32Array(n);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const v =
          gray[(y - 1) * w + x] + gray[(y + 1) * w + x] +
          gray[y * w + (x - 1)] + gray[y * w + (x + 1)] -
          4 * gray[i];
        lap[i] = v;
      }
    }
    const out = new Float32Array(n);
    const nb = [0, 1, -1, w, -w, 1 + w, 1 - w, -1 + w, -1 - w];
    const vals = new Float32Array(9);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        let sum = 0;
        for (let k = 0; k < 9; k++) {
          const v = lap[i + nb[k]];
          vals[k] = v;
          sum += v;
        }
        const mean = sum / 9;
        let varSum = 0;
        for (let k = 0; k < 9; k++) {
          const d = vals[k] - mean;
          varSum += d * d;
        }
        out[i] = varSum / 9;
      }
    }
    return out;
  }

  /**
   * Normalise a raw float field to [0,1], clamped by optional
   * percentiles to resist the fat-tail of edge statistics. Returns
   * a Float32Array with the normalised mapping + gain used.
   */
  function normalize(field, loPct = 0, hiPct = 99) {
    const n = field.length;
    const qhi = quantile(field, n, hiPct / 100);
    const qlo = quantile(field, n, loPct / 100);
    const range = Math.max(qhi - qlo, 1e-6);
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      out[i] = Math.min(1, Math.max(0, (field[i] - qlo) / range));
    }
    return out;
  }

  function quantile(arr, n, q) {
    if (n === 0) return 0;
    const sorted = new Float32Array(arr).sort();
    const idx = Math.min(n - 1, Math.max(0, Math.floor(q * (n - 1))));
    return sorted[idx];
  }

  global.gray = {
    toGray,
    sobelMagnitude,
    laplacianVariance,
    normalize,
  };
})(window);