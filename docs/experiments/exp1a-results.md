# EXP1A results — DLPC

Generated 2026-08-03T21:16:26.936Z · libs @ `db85572` · images: 1

## Verdict

Overall (all modes pooled) — **tri-tiled** leads at the largest budget (mean ΔE 7.85)

Per mode (largest budget present) —

- **mode=`combined`** (24 cells): **tri-tiled** leads at n=2048 (ΔE 8.26, 34369 B) · voronoi 8.50 · tri-splat 8.77
- **mode=`uniform`** (24 cells): **tri-tiled** leads at n=2048 (ΔE 7.43, 34908 B) · voronoi 7.50 · tri-splat 8.44

**Sampling-mode finding** (LLM-guided): **uniform mode is consistently ≥
combined saliency** — uniform beats combined on 46/48 same-cell
comparisons (ΔE −0.2 to −2.6, zero byte cost). However this rests on a
thin probe: 48 cells on 6 images at budgets 64–1024 (no 2048), with
only 2–4 cells for voro-fan / cell-tris / tri-splat. The style ranking
under uniform is not yet settled — e.g. voronoi vs delaunay at n=1024 is
a 0.1 ΔE margin on 6 images. A full uniform-mode sweep is needed before
declaring a final recommended operating point.

## Fidelity per budget (means over images)

### PSNR (dB)

| style | n=16 | n=32 | n=64 | n=128 | n=256 | n=512 | n=1024 | n=2048 |
|---|---|---|---|---|---|---|---|---|
| voronoi | 17.00 dB | 17.14 dB | 17.48 dB | 17.96 dB | 18.35 dB | 18.74 dB | 19.28 dB | 19.75 dB |
| tri-tiled | 16.90 dB | 17.05 dB | 17.45 dB | 17.86 dB | 18.42 dB | 18.84 dB | 19.53 dB | 20.02 dB |
| tri-splat | 16.11 dB | 15.91 dB | 16.05 dB | 16.94 dB | 17.16 dB | 17.62 dB | 18.29 dB | 18.72 dB |

### SSIM

| style | n=16 | n=32 | n=64 | n=128 | n=256 | n=512 | n=1024 | n=2048 |
|---|---|---|---|---|---|---|---|---|
| voronoi | 0.2033 | 0.2007 | 0.2019 | 0.2050 | 0.2092 | 0.2147 | 0.2325 | 0.2712 |
| tri-tiled | 0.2036 | 0.2029 | 0.2050 | 0.2086 | 0.2149 | 0.2284 | 0.2493 | 0.2849 |
| tri-splat | 0.1933 | 0.1841 | 0.1796 | 0.1852 | 0.1816 | 0.1991 | 0.2242 | 0.2682 |

### Mean CIEDE2000 (ΔE)

| style | n=16 | n=32 | n=64 | n=128 | n=256 | n=512 | n=1024 | n=2048 |
|---|---|---|---|---|---|---|---|---|
| voronoi | 14.26 | 13.87 | 12.99 | 11.74 | 10.70 | 9.87 | 8.77 | 8.00 |
| tri-tiled | 14.55 | 14.12 | 13.11 | 12.23 | 10.87 | 10.02 | 8.65 | 7.85 |
| tri-splat | 14.80 | 14.93 | 14.20 | 12.28 | 11.53 | 10.57 | 9.30 | 8.60 |

### ΔE99

| style | n=16 | n=32 | n=64 | n=128 | n=256 | n=512 | n=1024 | n=2048 |
|---|---|---|---|---|---|---|---|---|
| voronoi | 32.28 | 33.56 | 33.71 | 37.25 | 36.64 | 36.40 | 35.01 | 34.55 |
| tri-tiled | 30.53 | 30.66 | 32.78 | 33.93 | 33.75 | 34.45 | 33.29 | 31.80 |
| tri-splat | 41.95 | 45.35 | 44.63 | 44.64 | 44.59 | 44.03 | 42.02 | 41.63 |

### ΔE·sal (saliency-weighted)

| style | n=16 | n=32 | n=64 | n=128 | n=256 | n=512 | n=1024 | n=2048 |
|---|---|---|---|---|---|---|---|---|
| voronoi | — | — | — | — | — | — | — | — |
| tri-tiled | — | — | — | — | — | — | — | — |
| tri-splat | — | — | — | — | — | — | — | — |

### Rendered coverage

| style | n=16 | n=32 | n=64 | n=128 | n=256 | n=512 | n=1024 | n=2048 |
|---|---|---|---|---|---|---|---|---|
| voronoi | 24.1% | 29.0% | 42.4% | 59.1% | 67.1% | 67.3% | 70.5% | 71.0% |
| tri-tiled | 3.6% | 19.2% | 26.3% | 42.1% | 54.9% | 59.8% | 65.3% | 68.7% |
| tri-splat | 44.2% | 53.0% | 64.6% | 68.2% | 70.8% | 72.6% | 73.9% | 74.3% |

### Payload bytes

| style | n=16 | n=32 | n=64 | n=128 | n=256 | n=512 | n=1024 | n=2048 |
|---|---|---|---|---|---|---|---|---|
| voronoi | 93 B | 173 B | 333 B | 653 B | 1293 B | 2566 B | 5108 B | 10166 B |
| tri-tiled | 364 B | 636 B | 1180 B | 2268 B | 4427 B | 8771 B | 17446 B | 34639 B |
| tri-splat | 141 B | 269 B | 525 B | 1037 B | 2049 B | 4109 B | 8173 B | 16277 B |

### Avg encode time (ms)

| style | n=16 | n=32 | n=64 | n=128 | n=256 | n=512 | n=1024 | n=2048 |
|---|---|---|---|---|---|---|---|---|
| voronoi | 1548.9 ms | 1584.7 ms | 1619.9 ms | 1583.8 ms | 1738.3 ms | 1951.3 ms | 2415.4 ms | 3371.0 ms |
| tri-tiled | 1541.5 ms | 1596.1 ms | 1638.8 ms | 1709.6 ms | 2195.2 ms | 2878.4 ms | 5537.7 ms | 10946.6 ms |
| tri-splat | 1589.7 ms | 1582.1 ms | 1682.5 ms | 1934.7 ms | 2967.3 ms | 3438.1 ms | 5142.0 ms | 7634.4 ms |

## Method notes

- **Floor colouring**: cells use the **cell-mean** colour (`cellMeanColors`)
  — the mean RGB of the source pixels inside each Voronoi cell — not the
  single seed pixel (`pointColors`). This is worth **+1.5–3.5 dB PSNR** on
  Kodak, but is an O(px·n) pass that roughly **doubles** render cost:
  +42 ms at n=64, +110 ms at n=256, +5.2 s at n=16,384 (480×320 work res).
  The interactive slider range (≤256 pts) stays ~1 s/cell; the extreme end
  of the slider is where the cost bites.
- **Sweep cost**: this batch ran **62 cells** (21 exp1a + 41 exp1b) in ~68 s
  (~1.1 s/cell CPU). The refinement batch consumed **1 `opencode run` LLM
  call** (the compact summary + findings).

## Reproduce a run in the browser

Every link below opens the experiment page with that exact run pre-loaded
(config via query string, source image via `img`). The Kodak suite is
committed to the repo, so the image resolves on GitHub Pages too.

| image | style | n | mode | PSNR | ΔE | bytes | open in browser |
|---|---|---|---|---|---|---|---|
| kodim01.png | tri-splat | 16 | uniform | 15.82 dB | 15.02 | 141 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-splat&budget=16&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-splat | 16 | combined | 16.41 dB | 14.57 | 141 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-splat&budget=16&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-splat | 32 | uniform | 16.19 dB | 14.52 | 269 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-splat&budget=32&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-splat | 32 | combined | 15.63 dB | 15.33 | 269 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-splat&budget=32&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-splat | 64 | uniform | 15.81 dB | 14.06 | 525 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-splat&budget=64&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-splat | 64 | combined | 16.29 dB | 14.35 | 525 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-splat&budget=64&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-splat | 128 | uniform | 16.84 dB | 12.14 | 1037 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-splat&budget=128&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-splat | 128 | combined | 17.05 dB | 12.42 | 1037 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-splat&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-splat | 256 | uniform | 17.09 dB | 11.11 | 2061 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-splat&budget=256&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-splat | 256 | combined | 17.22 dB | 11.95 | 2037 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-splat&budget=256&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-splat | 512 | uniform | 17.56 dB | 10.25 | 4109 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-splat&budget=512&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-splat | 512 | combined | 17.67 dB | 10.88 | 4109 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-splat&budget=512&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-splat | 1024 | uniform | 18.23 dB | 8.92 | 8205 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-splat&budget=1024&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-splat | 1024 | combined | 18.35 dB | 9.69 | 8141 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-splat&budget=1024&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-splat | 2048 | uniform | 18.50 dB | 8.44 | 16397 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-splat&budget=2048&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-splat | 2048 | combined | 18.93 dB | 8.77 | 16157 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-splat&budget=2048&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-tiled | 16 | uniform | 16.97 dB | 14.33 | 364 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-tiled&budget=16&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-tiled | 16 | combined | 16.83 dB | 14.78 | 364 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-tiled&budget=16&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-tiled | 32 | uniform | 17.13 dB | 13.95 | 636 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-tiled&budget=32&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-tiled | 32 | combined | 16.98 dB | 14.30 | 636 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-tiled&budget=32&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-tiled | 64 | uniform | 17.56 dB | 12.80 | 1180 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-tiled&budget=64&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-tiled | 64 | combined | 17.34 dB | 13.43 | 1180 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-tiled&budget=64&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-tiled | 128 | uniform | 18.07 dB | 11.63 | 2268 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-tiled&budget=128&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-tiled | 128 | combined | 17.65 dB | 12.82 | 2268 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-tiled&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-tiled | 256 | uniform | 18.64 dB | 10.29 | 4444 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-tiled&budget=256&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-tiled | 256 | combined | 18.20 dB | 11.46 | 4410 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-tiled&budget=256&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-tiled | 512 | uniform | 19.17 dB | 9.33 | 8796 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-tiled&budget=512&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-tiled | 512 | combined | 18.51 dB | 10.71 | 8745 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-tiled&budget=512&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-tiled | 1024 | uniform | 19.77 dB | 8.16 | 17500 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-tiled&budget=1024&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-tiled | 1024 | combined | 19.29 dB | 9.13 | 17392 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-tiled&budget=1024&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-tiled | 2048 | uniform | 20.25 dB | 7.43 | 34908 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-tiled&budget=2048&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-tiled | 2048 | combined | 19.80 dB | 8.26 | 34369 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-tiled&budget=2048&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 16 | uniform | 17.09 dB | 13.93 | 93 B | [open](../../exp/exp1-a-triangle-floor/?style=voronoi&budget=16&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 16 | combined | 16.91 dB | 14.59 | 93 B | [open](../../exp/exp1-a-triangle-floor/?style=voronoi&budget=16&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 32 | uniform | 17.20 dB | 13.71 | 173 B | [open](../../exp/exp1-a-triangle-floor/?style=voronoi&budget=32&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 32 | combined | 17.09 dB | 14.04 | 173 B | [open](../../exp/exp1-a-triangle-floor/?style=voronoi&budget=32&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 64 | uniform | 17.76 dB | 12.24 | 333 B | [open](../../exp/exp1-a-triangle-floor/?style=voronoi&budget=64&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 64 | combined | 17.20 dB | 13.73 | 333 B | [open](../../exp/exp1-a-triangle-floor/?style=voronoi&budget=64&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 128 | uniform | 18.14 dB | 11.29 | 653 B | [open](../../exp/exp1-a-triangle-floor/?style=voronoi&budget=128&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 128 | combined | 17.79 dB | 12.19 | 653 B | [open](../../exp/exp1-a-triangle-floor/?style=voronoi&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 256 | uniform | 18.65 dB | 9.90 | 1293 B | [open](../../exp/exp1-a-triangle-floor/?style=voronoi&budget=256&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 256 | combined | 18.06 dB | 11.49 | 1293 B | [open](../../exp/exp1-a-triangle-floor/?style=voronoi&budget=256&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 512 | uniform | 19.02 dB | 9.26 | 2573 B | [open](../../exp/exp1-a-triangle-floor/?style=voronoi&budget=512&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 512 | combined | 18.45 dB | 10.48 | 2558 B | [open](../../exp/exp1-a-triangle-floor/?style=voronoi&budget=512&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 1024 | uniform | 19.58 dB | 8.16 | 5133 B | [open](../../exp/exp1-a-triangle-floor/?style=voronoi&budget=1024&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 1024 | combined | 18.98 dB | 9.38 | 5083 B | [open](../../exp/exp1-a-triangle-floor/?style=voronoi&budget=1024&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 2048 | uniform | 20.08 dB | 7.50 | 10253 B | [open](../../exp/exp1-a-triangle-floor/?style=voronoi&budget=2048&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 2048 | combined | 19.42 dB | 8.50 | 10078 B | [open](../../exp/exp1-a-triangle-floor/?style=voronoi&budget=2048&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |

## CSV

```csv
style,budget,images,psnr,ssim,de,de99,deSal,cov,bytes,np,msTotal
voronoi,16,2,17.0015,0.20329999999999998,14.2605,32.281,,0.2405,93,16,1548.855
voronoi,32,2,17.1435,0.2007,13.873000000000001,33.56,,0.2903,173,32,1584.74
voronoi,64,2,17.48,0.20185,12.988,33.710499999999996,,0.4243,333,64,1619.935
voronoi,128,2,17.9645,0.20500000000000002,11.741,37.2525,,0.59075,653,128,1583.7800000000002
voronoi,256,2,18.3535,0.2092,10.695,36.641999999999996,,0.67115,1293,256,1738.315
voronoi,512,2,18.7365,0.21465,9.870999999999999,36.402,,0.67335,2565.5,510.5,1951.2849999999999
voronoi,1024,2,19.28,0.23249999999999998,8.767,35.006,,0.70505,5108,1019,2415.4
voronoi,2048,2,19.75,0.27125,7.9990000000000006,34.5485,,0.71045,10165.5,2030.5,3370.9700000000003
tri-tiled,16,2,16.9025,0.2036,14.554,30.534,,0.03585,364,38,1541.535
tri-tiled,32,2,17.0535,0.2029,14.121500000000001,30.662,,0.19235000000000002,636,70,1596.105
tri-tiled,64,2,17.451,0.20495000000000002,13.1145,32.778,,0.26295,1180,134,1638.7649999999999
tri-tiled,128,2,17.859,0.20855,12.23,33.926500000000004,,0.4206,2268,262,1709.625
tri-tiled,256,2,18.4195,0.2149,10.8735,33.7525,,0.5486,4427,516,2195.1949999999997
tri-tiled,512,2,18.841,0.2284,10.02,34.447500000000005,,0.5982000000000001,8770.5,1027,2878.435
tri-tiled,1024,2,19.5315,0.24930000000000002,8.6475,33.2945,,0.65295,17446,2047.5,5537.705
tri-tiled,2048,2,20.0225,0.28495,7.845000000000001,31.804,,0.68675,34638.5,4070,10946.595000000001
tri-splat,16,2,16.1145,0.1933,14.7975,41.951,,0.4421,141,16,1589.6550000000002
tri-splat,32,2,15.911,0.18414999999999998,14.9285,45.3475,,0.5299,269,32,1582.08
tri-splat,64,2,16.051000000000002,0.17959999999999998,14.2045,44.628,,0.6457999999999999,525,64,1682.505
tri-splat,128,2,16.944,0.1852,12.279,44.637,,0.6824,1037,128,1934.725
tri-splat,256,2,17.155,0.18159999999999998,11.531500000000001,44.586,,0.7083,2049,254.5,2967.255
tri-splat,512,2,17.616999999999997,0.19905,10.566500000000001,44.0255,,0.7262,4109,512,3438.0550000000003
tri-splat,1024,2,18.287,0.2242,9.3045,42.022999999999996,,0.7385999999999999,8173,1020,5141.99
tri-splat,2048,2,18.717,0.26825,8.604,41.6275,,0.7431,16277,2033,7634.39
```
