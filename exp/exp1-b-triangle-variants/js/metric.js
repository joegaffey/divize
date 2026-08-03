/* ============================================================
 * divize – metric.js (exp1-a)
 * Objective fidelity vs the source raster for the floor showdown:
 *   metric.psnr(a, b)  -> dB  (RGBA Uint8ClampedArray buffers, equal size)
 *   metric.ssim(a, b, w, h) -> 0..1 (luma, 8x8 windows, uniform weights)
 * SSIM is a simplified/sliding-window approximation, adequate for
 * comparing primitives at equal budgets (not a production metric).
 * ============================================================ */
(function (global) {
  'use strict';

  function luma(d, o) {
    return (d[o] * 77 + d[o + 1] * 150 + d[o + 2] * 29) >> 8;
  }

  function psnr(a, b) {
    const n = a.length / 4;
    let mse = 0;
    for (let i = 0; i < n; i++) {
      const o = i * 4;
      const dr = a[o] - b[o], dg = a[o + 1] - b[o + 1], db = a[o + 2] - b[o + 2];
      mse += dr * dr + dg * dg + db * db;
    }
    mse /= n * 3;
    if (mse === 0) return Infinity;
    return 10 * Math.log10((255 * 255) / mse);
  }

  const C1 = 6.5025;    // (0.01*255)^2
  const C2 = 58.5225;   // (0.03*255)^2

  function ssim(a, b, w, h) {
    const n = w * h;
    const l1 = new Float32Array(n), l2 = new Float32Array(n);
    for (let i = 0; i < n; i++) { l1[i] = luma(a, i * 4); l2[i] = luma(b, i * 4); }
    let acc = 0, cnt = 0;
    for (let y0 = 0; y0 + 8 <= h; y0 += 4) {
      for (let x0 = 0; x0 + 8 <= w; x0 += 4) {
        let m1 = 0, m2 = 0;
        for (let y = y0; y < y0 + 8; y++) {
          for (let x = x0; x < x0 + 8; x++) {
            const i = y * w + x; m1 += l1[i]; m2 += l2[i];
          }
        }
        m1 /= 64; m2 /= 64;
        let v1 = 0, v2 = 0, cv = 0;
        for (let y = y0; y < y0 + 8; y++) {
          for (let x = x0; x < x0 + 8; x++) {
            const i = y * w + x;
            const d1 = l1[i] - m1, d2 = l2[i] - m2;
            v1 += d1 * d1; v2 += d2 * d2; cv += d1 * d2;
          }
        }
        v1 /= 63; v2 /= 63; cv /= 63;
        const num = (2 * m1 * m2 + C1) * (2 * cv + C2);
        const den = (m1 * m1 + m2 * m2 + C1) * (v1 + v2 + C2);
        acc += num / den; cnt++;
      }
    }
    return cnt ? acc / cnt : 1;
  }

  /* ---- perceptual delta (CIEDE2000) -------------------------------- */
  // sRGB (0..255) -> CIELAB under D65. Reflects perceived colour better
  // than RGB MSE (which over-weights dark tones).
  function srgbToLab(r, g, b) {
    let rl = r / 255, gl = g / 255, bl = b / 255;
    rl = rl > 0.04045 ? Math.pow((rl + 0.055) / 1.055, 2.4) : rl / 12.92;
    gl = gl > 0.04045 ? Math.pow((gl + 0.055) / 1.055, 2.4) : gl / 12.92;
    bl = bl > 0.04045 ? Math.pow((bl + 0.055) / 1.055, 2.4) : bl / 12.92;
    const X = (0.4124 * rl + 0.3576 * gl + 0.1805 * bl) * 100;
    const Y = (0.2126 * rl + 0.7152 * gl + 0.0722 * bl) * 100;
    const Z = (0.0193 * rl + 0.1192 * gl + 0.9505 * bl) * 100;
    const Xn = 95.047, Yn = 100, Zn = 108.883;
    const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    const fx = f(X / Xn), fy = f(Y / Yn), fz = f(Z / Zn);
    return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
  }

  // CIEDE2000 colour difference between two Lab triples (scalar args to
  // avoid per-pixel array allocation in the hot loop).
  function ciede2000(L1, a1, b1, L2, a2, b2) {
    const C1 = Math.sqrt(a1 * a1 + b1 * b1);
    const C2 = Math.sqrt(a2 * a2 + b2 * b2);
    const Cbar = (C1 + C2) / 2;
    const G = 0.5 * (1 - Math.sqrt(Math.pow(Cbar, 7) / (Math.pow(Cbar, 7) + Math.pow(25, 7))));
    const a1p = (1 + G) * a1, a2p = (1 + G) * a2;
    const C1p = Math.sqrt(a1p * a1p + b1 * b1);
    const C2p = Math.sqrt(a2p * a2p + b2 * b2);
    let h1p = Math.atan2(b1, a1p) * 180 / Math.PI; if (h1p < 0) h1p += 360;
    let h2p = Math.atan2(b2, a2p) * 180 / Math.PI; if (h2p < 0) h2p += 360;
    const dLp = L2 - L1;
    const dCp = C2p - C1p;
    let dhp = 0;
    if (C1p * C2p !== 0) {
      dhp = h2p - h1p;
      if (dhp > 180) dhp -= 360;
      else if (dhp < -180) dhp += 360;
    }
    const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(dhp * Math.PI / 360);
    const Lbp = (L1 + L2) / 2;
    const Cbp = (C1p + C2p) / 2;
    let hbp = h1p + h2p;
    if (C1p * C2p !== 0) {
      if (Math.abs(h1p - h2p) <= 180) hbp = (h1p + h2p) / 2;
      else if (h1p + h2p < 360) hbp = (h1p + h2p + 360) / 2;
      else hbp = (h1p + h2p - 360) / 2;
    }
    const dT = hbp * Math.PI / 180;
    const T = 1 - 0.17 * Math.cos((hbp - 30) * Math.PI / 180)
                + 0.24 * Math.cos(2 * dT)
                + 0.32 * Math.cos((3 * hbp + 6) * Math.PI / 180)
                - 0.20 * Math.cos((4 * hbp - 63) * Math.PI / 180);
    const dTheta = 30 * Math.exp(-Math.pow((hbp - 275) / 25, 2));
    const RC = 2 * Math.sqrt(Math.pow(Cbp, 7) / (Math.pow(Cbp, 7) + Math.pow(25, 7)));
    const SL = 1 + 0.015 * Math.pow(Lbp - 50, 2) / Math.sqrt(20 + Math.pow(Lbp - 50, 2));
    const SC = 1 + 0.045 * Cbp;
    const SH = 1 + 0.015 * Cbp * T;
    const RT = -Math.sin(2 * dTheta * Math.PI / 180) * RC;
    const dL = dLp / SL, dC = dCp / SC, dH = dHp / SH;
    return Math.sqrt(dL * dL + dC * dC + dH * dH + RT * dC * dH);
  }

  // Per-pixel CIEDE2000 delta between two RGBA buffers (equal size).
  // Returns the raw map plus mean and 99th-percentile error.
  function ciede(a, b, w, h) {
    const n = w * h;
    const labA = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const o = i * 4;
      const L = srgbToLab(a[o], a[o + 1], a[o + 2]);
      labA[i * 3] = L[0]; labA[i * 3 + 1] = L[1]; labA[i * 3 + 2] = L[2];
    }
    const map = new Float32Array(n);
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const o = i * 4;
      const L = srgbToLab(b[o], b[o + 1], b[o + 2]);
      const de = ciede2000(labA[i * 3], labA[i * 3 + 1], labA[i * 3 + 2],
        L[0], L[1], L[2]);
      map[i] = de;
      sum += de;
    }
    const sorted = Float32Array.from(map).sort();
    const p99 = sorted[Math.max(0, Math.floor(n * 0.99) - 1)];
    return { map, mean: sum / n, p99 };
  }

  // Mean of a per-pixel error map weighted by a 0..1 saliency field, so
  // the result answers "how much error lands where the encoder looks".
  function weightedMean(map, weight) {
    let s = 0, ws = 0;
    for (let i = 0; i < map.length; i++) { s += map[i] * weight[i]; ws += weight[i]; }
    return ws > 0 ? s / ws : 0;
  }

  global.metric = { psnr, ssim, ciede, weightedMean };
})(window);
