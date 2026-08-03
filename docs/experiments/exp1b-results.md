# EXP1B results — DLPC

Generated 2026-08-03T21:16:26.987Z · libs @ `db85572` · images: 1

## Verdict

Overall (all modes pooled) — **delaunay** leads at the largest budget (mean ΔE 7.81)

Per mode (largest budget present) —

- **mode=`combined`** (40 cells): **delaunay** leads at n=2048 (ΔE 8.19, 34324 B) · voronoi 8.50 · voro-fan 8.57 · tri-gauss 9.29 · cell-tris 11.73
- **mode=`uniform`** (40 cells): **delaunay** leads at n=2048 (ΔE 7.43, 34908 B) · voronoi 7.50 · tri-gauss 7.65 · voro-fan 7.94 · cell-tris 11.94

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
| delaunay | 16.93 dB | 17.16 dB | 17.44 dB | 17.86 dB | 18.39 dB | 18.90 dB | 19.51 dB | 20.03 dB |
| voro-fan | 16.84 dB | 17.09 dB | 17.30 dB | 17.71 dB | 18.11 dB | 18.56 dB | 19.08 dB | 19.66 dB |
| cell-tris | 16.62 dB | 16.69 dB | 16.74 dB | 16.89 dB | 17.09 dB | 17.31 dB | 17.51 dB | 17.75 dB |
| tri-gauss | 16.83 dB | 17.06 dB | 17.36 dB | 17.75 dB | 18.16 dB | 18.52 dB | 19.07 dB | 19.42 dB |

### SSIM

| style | n=16 | n=32 | n=64 | n=128 | n=256 | n=512 | n=1024 | n=2048 |
|---|---|---|---|---|---|---|---|---|
| voronoi | 0.2033 | 0.2007 | 0.2019 | 0.2050 | 0.2092 | 0.2147 | 0.2325 | 0.2712 |
| delaunay | 0.2039 | 0.2043 | 0.2057 | 0.2076 | 0.2141 | 0.2240 | 0.2477 | 0.2841 |
| voro-fan | 0.2027 | 0.2028 | 0.2027 | 0.2035 | 0.2056 | 0.2132 | 0.2313 | 0.2599 |
| cell-tris | 0.1968 | 0.1946 | 0.1896 | 0.1752 | 0.1650 | 0.1551 | 0.1421 | 0.1391 |
| tri-gauss | 0.2016 | 0.2003 | 0.1964 | 0.1977 | 0.2009 | 0.2000 | 0.2208 | 0.2492 |

### Mean CIEDE2000 (ΔE)

| style | n=16 | n=32 | n=64 | n=128 | n=256 | n=512 | n=1024 | n=2048 |
|---|---|---|---|---|---|---|---|---|
| voronoi | 14.26 | 13.87 | 12.99 | 11.74 | 10.70 | 9.87 | 8.77 | 8.00 |
| delaunay | 14.49 | 13.85 | 13.17 | 12.18 | 10.92 | 9.92 | 8.71 | 7.81 |
| voro-fan | 14.43 | 13.89 | 13.47 | 12.35 | 11.31 | 10.33 | 9.24 | 8.26 |
| cell-tris | 15.07 | 14.90 | 14.74 | 14.24 | 13.65 | 13.06 | 12.49 | 11.84 |
| tri-gauss | 14.75 | 14.15 | 13.26 | 12.26 | 11.20 | 10.34 | 9.20 | 8.47 |

### ΔE99

| style | n=16 | n=32 | n=64 | n=128 | n=256 | n=512 | n=1024 | n=2048 |
|---|---|---|---|---|---|---|---|---|
| voronoi | 32.28 | 33.56 | 33.71 | 37.25 | 36.64 | 36.40 | 35.01 | 34.55 |
| delaunay | 30.49 | 31.08 | 32.63 | 33.73 | 33.64 | 33.57 | 33.26 | 31.78 |
| voro-fan | 31.46 | 33.68 | 35.54 | 34.91 | 35.78 | 36.10 | 35.73 | 33.04 |
| cell-tris | 31.80 | 30.86 | 32.00 | 33.59 | 34.14 | 33.80 | 33.15 | 31.60 |
| tri-gauss | 31.85 | 33.65 | 33.41 | 35.89 | 35.02 | 35.91 | 36.33 | 36.09 |

### ΔE·sal (saliency-weighted)

| style | n=16 | n=32 | n=64 | n=128 | n=256 | n=512 | n=1024 | n=2048 |
|---|---|---|---|---|---|---|---|---|
| voronoi | — | — | — | — | — | — | — | — |
| delaunay | — | — | — | — | — | — | — | — |
| voro-fan | — | — | — | — | — | — | — | — |
| cell-tris | — | — | — | — | — | — | — | — |
| tri-gauss | — | — | — | — | — | — | — | — |

### Rendered coverage

| style | n=16 | n=32 | n=64 | n=128 | n=256 | n=512 | n=1024 | n=2048 |
|---|---|---|---|---|---|---|---|---|
| voronoi | 24.1% | 29.0% | 42.4% | 59.1% | 67.1% | 67.3% | 70.5% | 71.0% |
| delaunay | 6.8% | 20.4% | 29.6% | 46.4% | 53.5% | 59.7% | 65.4% | 67.7% |
| voro-fan | 16.7% | 27.8% | 31.9% | 48.4% | 56.8% | 61.0% | 66.8% | 68.9% |
| cell-tris | 4.1% | 11.4% | 17.5% | 25.5% | 29.9% | 34.2% | 36.5% | 38.1% |
| tri-gauss | 15.9% | 34.7% | 38.0% | 53.3% | 60.9% | 66.0% | 68.2% | 71.4% |

### Payload bytes

| style | n=16 | n=32 | n=64 | n=128 | n=256 | n=512 | n=1024 | n=2048 |
|---|---|---|---|---|---|---|---|---|
| voronoi | 93 B | 173 B | 333 B | 653 B | 1293 B | 2566 B | 5108 B | 10166 B |
| delaunay | 364 B | 636 B | 1180 B | 2268 B | 4441 B | 8785 B | 17398 B | 34616 B |
| voro-fan | 756 B | 1533 B | 3074 B | 6266 B | 12650 B | 25447 B | 51052 B | 102208 B |
| cell-tris | 432 B | 848 B | 1680 B | 3344 B | 6659 B | 13315 B | 26588 B | 52822 B |
| tri-gauss | 141 B | 269 B | 525 B | 1037 B | 2057 B | 4093 B | 8181 B | 16305 B |

### Avg encode time (ms)

| style | n=16 | n=32 | n=64 | n=128 | n=256 | n=512 | n=1024 | n=2048 |
|---|---|---|---|---|---|---|---|---|
| voronoi | 1511.4 ms | 1363.1 ms | 1542.5 ms | 1532.7 ms | 1735.8 ms | 1886.9 ms | 2835.5 ms | 3323.2 ms |
| delaunay | 1543.0 ms | 1504.0 ms | 1610.6 ms | 1692.1 ms | 2129.8 ms | 2867.7 ms | 4819.5 ms | 9522.3 ms |
| voro-fan | 1487.2 ms | 1619.3 ms | 1902.0 ms | 2509.3 ms | 3510.0 ms | 7108.7 ms | 13406.1 ms | 23563.7 ms |
| cell-tris | 1523.7 ms | 1506.2 ms | 1555.1 ms | 1846.8 ms | 2075.5 ms | 2776.3 ms | 4295.7 ms | 8238.1 ms |
| tri-gauss | 1520.1 ms | 1526.7 ms | 1758.0 ms | 2114.7 ms | 2659.1 ms | 3927.3 ms | 7007.3 ms | 13578.4 ms |

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
| kodim01.png | cell-tris | 16 | uniform | 16.59 dB | 15.22 | 432 B | [open](../../exp/exp1-b-triangle-variants/?style=cell-tris&budget=16&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | cell-tris | 16 | combined | 16.64 dB | 14.93 | 432 B | [open](../../exp/exp1-b-triangle-variants/?style=cell-tris&budget=16&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | cell-tris | 32 | uniform | 16.71 dB | 14.82 | 848 B | [open](../../exp/exp1-b-triangle-variants/?style=cell-tris&budget=32&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | cell-tris | 32 | combined | 16.68 dB | 14.98 | 848 B | [open](../../exp/exp1-b-triangle-variants/?style=cell-tris&budget=32&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | cell-tris | 64 | uniform | 16.80 dB | 14.71 | 1680 B | [open](../../exp/exp1-b-triangle-variants/?style=cell-tris&budget=64&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | cell-tris | 64 | combined | 16.69 dB | 14.78 | 1680 B | [open](../../exp/exp1-b-triangle-variants/?style=cell-tris&budget=64&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | cell-tris | 128 | uniform | 16.87 dB | 14.28 | 3344 B | [open](../../exp/exp1-b-triangle-variants/?style=cell-tris&budget=128&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | cell-tris | 128 | combined | 16.91 dB | 14.20 | 3344 B | [open](../../exp/exp1-b-triangle-variants/?style=cell-tris&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | cell-tris | 256 | uniform | 17.05 dB | 13.71 | 6672 B | [open](../../exp/exp1-b-triangle-variants/?style=cell-tris&budget=256&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | cell-tris | 256 | combined | 17.13 dB | 13.59 | 6646 B | [open](../../exp/exp1-b-triangle-variants/?style=cell-tris&budget=256&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | cell-tris | 512 | uniform | 17.29 dB | 13.05 | 13328 B | [open](../../exp/exp1-b-triangle-variants/?style=cell-tris&budget=512&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | cell-tris | 512 | combined | 17.33 dB | 13.07 | 13302 B | [open](../../exp/exp1-b-triangle-variants/?style=cell-tris&budget=512&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | cell-tris | 1024 | uniform | 17.49 dB | 12.47 | 26640 B | [open](../../exp/exp1-b-triangle-variants/?style=cell-tris&budget=1024&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | cell-tris | 1024 | combined | 17.53 dB | 12.51 | 26536 B | [open](../../exp/exp1-b-triangle-variants/?style=cell-tris&budget=1024&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | cell-tris | 2048 | uniform | 17.68 dB | 11.94 | 53264 B | [open](../../exp/exp1-b-triangle-variants/?style=cell-tris&budget=2048&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | cell-tris | 2048 | combined | 17.82 dB | 11.73 | 52380 B | [open](../../exp/exp1-b-triangle-variants/?style=cell-tris&budget=2048&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | delaunay | 16 | uniform | 16.98 dB | 14.26 | 364 B | [open](../../exp/exp1-b-triangle-variants/?style=delaunay&budget=16&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | delaunay | 16 | combined | 16.88 dB | 14.73 | 364 B | [open](../../exp/exp1-b-triangle-variants/?style=delaunay&budget=16&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | delaunay | 32 | uniform | 17.20 dB | 13.74 | 636 B | [open](../../exp/exp1-b-triangle-variants/?style=delaunay&budget=32&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | delaunay | 32 | combined | 17.13 dB | 13.96 | 636 B | [open](../../exp/exp1-b-triangle-variants/?style=delaunay&budget=32&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | delaunay | 64 | uniform | 17.57 dB | 12.76 | 1180 B | [open](../../exp/exp1-b-triangle-variants/?style=delaunay&budget=64&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | delaunay | 64 | combined | 17.30 dB | 13.58 | 1180 B | [open](../../exp/exp1-b-triangle-variants/?style=delaunay&budget=64&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | delaunay | 128 | uniform | 18.06 dB | 11.66 | 2268 B | [open](../../exp/exp1-b-triangle-variants/?style=delaunay&budget=128&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | delaunay | 128 | combined | 17.67 dB | 12.70 | 2268 B | [open](../../exp/exp1-b-triangle-variants/?style=delaunay&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | delaunay | 256 | uniform | 18.64 dB | 10.32 | 4444 B | [open](../../exp/exp1-b-triangle-variants/?style=delaunay&budget=256&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | delaunay | 256 | combined | 18.15 dB | 11.52 | 4438 B | [open](../../exp/exp1-b-triangle-variants/?style=delaunay&budget=256&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | delaunay | 512 | uniform | 19.14 dB | 9.37 | 8796 B | [open](../../exp/exp1-b-triangle-variants/?style=delaunay&budget=512&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | delaunay | 512 | combined | 18.65 dB | 10.47 | 8773 B | [open](../../exp/exp1-b-triangle-variants/?style=delaunay&budget=512&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | delaunay | 1024 | uniform | 19.78 dB | 8.16 | 17500 B | [open](../../exp/exp1-b-triangle-variants/?style=delaunay&budget=1024&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | delaunay | 1024 | combined | 19.23 dB | 9.26 | 17295 B | [open](../../exp/exp1-b-triangle-variants/?style=delaunay&budget=1024&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | delaunay | 2048 | uniform | 20.25 dB | 7.43 | 34908 B | [open](../../exp/exp1-b-triangle-variants/?style=delaunay&budget=2048&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | delaunay | 2048 | combined | 19.82 dB | 8.19 | 34324 B | [open](../../exp/exp1-b-triangle-variants/?style=delaunay&budget=2048&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-gauss | 16 | uniform | 16.73 dB | 15.03 | 141 B | [open](../../exp/exp1-b-triangle-variants/?style=tri-gauss&budget=16&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-gauss | 16 | combined | 16.93 dB | 14.48 | 141 B | [open](../../exp/exp1-b-triangle-variants/?style=tri-gauss&budget=16&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-gauss | 32 | uniform | 17.16 dB | 13.87 | 269 B | [open](../../exp/exp1-b-triangle-variants/?style=tri-gauss&budget=32&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-gauss | 32 | combined | 16.96 dB | 14.44 | 269 B | [open](../../exp/exp1-b-triangle-variants/?style=tri-gauss&budget=32&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-gauss | 64 | uniform | 17.56 dB | 12.64 | 525 B | [open](../../exp/exp1-b-triangle-variants/?style=tri-gauss&budget=64&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-gauss | 64 | combined | 17.16 dB | 13.87 | 525 B | [open](../../exp/exp1-b-triangle-variants/?style=tri-gauss&budget=64&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-gauss | 128 | uniform | 17.97 dB | 11.67 | 1037 B | [open](../../exp/exp1-b-triangle-variants/?style=tri-gauss&budget=128&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-gauss | 128 | combined | 17.53 dB | 12.85 | 1037 B | [open](../../exp/exp1-b-triangle-variants/?style=tri-gauss&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-gauss | 256 | uniform | 18.54 dB | 10.11 | 2061 B | [open](../../exp/exp1-b-triangle-variants/?style=tri-gauss&budget=256&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-gauss | 256 | combined | 17.79 dB | 12.30 | 2053 B | [open](../../exp/exp1-b-triangle-variants/?style=tri-gauss&budget=256&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-gauss | 512 | uniform | 18.89 dB | 9.46 | 4109 B | [open](../../exp/exp1-b-triangle-variants/?style=tri-gauss&budget=512&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-gauss | 512 | combined | 18.16 dB | 11.21 | 4077 B | [open](../../exp/exp1-b-triangle-variants/?style=tri-gauss&budget=512&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-gauss | 1024 | uniform | 19.52 dB | 8.27 | 8205 B | [open](../../exp/exp1-b-triangle-variants/?style=tri-gauss&budget=1024&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-gauss | 1024 | combined | 18.61 dB | 10.14 | 8157 B | [open](../../exp/exp1-b-triangle-variants/?style=tri-gauss&budget=1024&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-gauss | 2048 | uniform | 19.95 dB | 7.65 | 16397 B | [open](../../exp/exp1-b-triangle-variants/?style=tri-gauss&budget=2048&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-gauss | 2048 | combined | 18.89 dB | 9.29 | 16213 B | [open](../../exp/exp1-b-triangle-variants/?style=tri-gauss&budget=2048&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voro-fan | 16 | uniform | 16.93 dB | 13.98 | 742 B | [open](../../exp/exp1-b-triangle-variants/?style=voro-fan&budget=16&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voro-fan | 16 | combined | 16.74 dB | 14.89 | 770 B | [open](../../exp/exp1-b-triangle-variants/?style=voro-fan&budget=16&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voro-fan | 32 | uniform | 17.04 dB | 14.08 | 1527 B | [open](../../exp/exp1-b-triangle-variants/?style=voro-fan&budget=32&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voro-fan | 32 | combined | 17.15 dB | 13.70 | 1538 B | [open](../../exp/exp1-b-triangle-variants/?style=voro-fan&budget=32&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voro-fan | 64 | uniform | 17.30 dB | 13.44 | 3074 B | [open](../../exp/exp1-b-triangle-variants/?style=voro-fan&budget=64&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voro-fan | 64 | combined | 17.30 dB | 13.49 | 3074 B | [open](../../exp/exp1-b-triangle-variants/?style=voro-fan&budget=64&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voro-fan | 128 | uniform | 17.86 dB | 11.90 | 6239 B | [open](../../exp/exp1-b-triangle-variants/?style=voro-fan&budget=128&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voro-fan | 128 | combined | 17.56 dB | 12.81 | 6292 B | [open](../../exp/exp1-b-triangle-variants/?style=voro-fan&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voro-fan | 256 | uniform | 18.29 dB | 10.79 | 12550 B | [open](../../exp/exp1-b-triangle-variants/?style=voro-fan&budget=256&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voro-fan | 256 | combined | 17.93 dB | 11.83 | 12750 B | [open](../../exp/exp1-b-triangle-variants/?style=voro-fan&budget=256&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voro-fan | 512 | uniform | 18.70 dB | 9.99 | 25267 B | [open](../../exp/exp1-b-triangle-variants/?style=voro-fan&budget=512&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voro-fan | 512 | combined | 18.41 dB | 10.67 | 25627 B | [open](../../exp/exp1-b-triangle-variants/?style=voro-fan&budget=512&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voro-fan | 1024 | uniform | 19.31 dB | 8.73 | 50866 B | [open](../../exp/exp1-b-triangle-variants/?style=voro-fan&budget=1024&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voro-fan | 1024 | combined | 18.84 dB | 9.75 | 51238 B | [open](../../exp/exp1-b-triangle-variants/?style=voro-fan&budget=1024&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voro-fan | 2048 | uniform | 19.82 dB | 7.94 | 102186 B | [open](../../exp/exp1-b-triangle-variants/?style=voro-fan&budget=2048&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voro-fan | 2048 | combined | 19.49 dB | 8.57 | 102229 B | [open](../../exp/exp1-b-triangle-variants/?style=voro-fan&budget=2048&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 16 | uniform | 17.09 dB | 13.93 | 93 B | [open](../../exp/exp1-b-triangle-variants/?style=voronoi&budget=16&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 16 | combined | 16.91 dB | 14.59 | 93 B | [open](../../exp/exp1-b-triangle-variants/?style=voronoi&budget=16&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 32 | uniform | 17.20 dB | 13.71 | 173 B | [open](../../exp/exp1-b-triangle-variants/?style=voronoi&budget=32&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 32 | combined | 17.09 dB | 14.04 | 173 B | [open](../../exp/exp1-b-triangle-variants/?style=voronoi&budget=32&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 64 | uniform | 17.76 dB | 12.24 | 333 B | [open](../../exp/exp1-b-triangle-variants/?style=voronoi&budget=64&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 64 | combined | 17.20 dB | 13.73 | 333 B | [open](../../exp/exp1-b-triangle-variants/?style=voronoi&budget=64&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 128 | uniform | 18.14 dB | 11.29 | 653 B | [open](../../exp/exp1-b-triangle-variants/?style=voronoi&budget=128&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 128 | combined | 17.79 dB | 12.19 | 653 B | [open](../../exp/exp1-b-triangle-variants/?style=voronoi&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 256 | uniform | 18.65 dB | 9.90 | 1293 B | [open](../../exp/exp1-b-triangle-variants/?style=voronoi&budget=256&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 256 | combined | 18.06 dB | 11.49 | 1293 B | [open](../../exp/exp1-b-triangle-variants/?style=voronoi&budget=256&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 512 | uniform | 19.02 dB | 9.26 | 2573 B | [open](../../exp/exp1-b-triangle-variants/?style=voronoi&budget=512&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 512 | combined | 18.45 dB | 10.48 | 2558 B | [open](../../exp/exp1-b-triangle-variants/?style=voronoi&budget=512&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 1024 | uniform | 19.58 dB | 8.16 | 5133 B | [open](../../exp/exp1-b-triangle-variants/?style=voronoi&budget=1024&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 1024 | combined | 18.98 dB | 9.38 | 5083 B | [open](../../exp/exp1-b-triangle-variants/?style=voronoi&budget=1024&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 2048 | uniform | 20.08 dB | 7.50 | 10253 B | [open](../../exp/exp1-b-triangle-variants/?style=voronoi&budget=2048&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 2048 | combined | 19.42 dB | 8.50 | 10078 B | [open](../../exp/exp1-b-triangle-variants/?style=voronoi&budget=2048&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=..%2F..%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |

## CSV

```csv
style,budget,images,psnr,ssim,de,de99,deSal,cov,bytes,np,msTotal
voronoi,16,2,17.0015,0.20329999999999998,14.2605,32.281,,0.2405,93,16,1511.4499999999998
voronoi,32,2,17.1435,0.2007,13.873000000000001,33.56,,0.2903,173,32,1363.06
voronoi,64,2,17.48,0.20185,12.988,33.710499999999996,,0.4243,333,64,1542.48
voronoi,128,2,17.9645,0.20500000000000002,11.741,37.2525,,0.59075,653,128,1532.7
voronoi,256,2,18.3535,0.2092,10.695,36.641999999999996,,0.67115,1293,256,1735.815
voronoi,512,2,18.7365,0.21465,9.870999999999999,36.402,,0.67335,2565.5,510.5,1886.87
voronoi,1024,2,19.28,0.23249999999999998,8.767,35.006,,0.70505,5108,1019,2835.495
voronoi,2048,2,19.75,0.27125,7.9990000000000006,34.5485,,0.71045,10165.5,2030.5,3323.16
delaunay,16,2,16.928,0.20395,14.4905,30.494500000000002,,0.06839999999999999,364,38,1542.98
delaunay,32,2,17.1645,0.20434999999999998,13.8525,31.082500000000003,,0.20445,636,70,1503.955
delaunay,64,2,17.436500000000002,0.20575,13.1715,32.6345,,0.29564999999999997,1180,134,1610.58
delaunay,128,2,17.863,0.20755,12.178,33.7325,,0.46365,2268,262,1692.1100000000001
delaunay,256,2,18.393500000000003,0.2141,10.9195,33.6375,,0.53545,4441,517.5,2129.8
delaunay,512,2,18.897,0.22405,9.9215,33.5655,,0.5967,8784.5,1028.5,2867.6549999999997
delaunay,1024,2,19.506,0.24765,8.707,33.259,,0.65395,17397.5,2041.5,4819.545
delaunay,2048,2,20.034,0.28405,7.808,31.778,,0.6767,34616,4067.5,9522.310000000001
voro-fan,16,2,16.8365,0.20274999999999999,14.433499999999999,31.4625,,0.1674,756,82.5,1487.22
voro-fan,32,2,17.094,0.20279999999999998,13.886,33.679500000000004,,0.27775,1532.5,171.5,1619.28
voro-fan,64,2,17.3015,0.2027,13.467500000000001,35.539,,0.3188,3074,350.5,1902
voro-fan,128,2,17.712,0.20345000000000002,12.353,34.909,,0.4842,6265.5,724.5,2509.3
voro-fan,256,2,18.1085,0.20555,11.309000000000001,35.7785,,0.56845,12650,1479,3510.04
voro-fan,512,2,18.5595,0.21325,10.327,36.0985,,0.61015,25447,2986,7108.73
voro-fan,1024,2,19.076999999999998,0.2313,9.2385,35.7265,,0.6682,51052,6006,13406.074999999999
voro-fan,2048,2,19.657,0.2599,8.2555,33.038,,0.68865,102207.5,12046.5,23563.68
cell-tris,16,2,16.616,0.1968,15.071,31.8,,0.04095,432,16,1523.6999999999998
cell-tris,32,2,16.6925,0.19455,14.8995,30.857,,0.1143,848,32,1506.165
cell-tris,64,2,16.743499999999997,0.1896,14.743500000000001,32,,0.17525000000000002,1680,64,1555.1100000000001
cell-tris,128,2,16.8875,0.17515,14.238,33.5895,,0.2551,3344,128,1846.845
cell-tris,256,2,17.09,0.16499999999999998,13.6475,34.14149999999999,,0.29905,6659,255.5,2075.48
cell-tris,512,2,17.307499999999997,0.15510000000000002,13.061,33.799,,0.34225,13315,511.5,2776.315
cell-tris,1024,2,17.508499999999998,0.14205,12.4915,33.149,,0.3651,26588,1022,4295.67
cell-tris,2048,2,17.749,0.13915,11.835999999999999,31.6045,,0.38105,52822,2031,8238.07
tri-gauss,16,2,16.829,0.2016,14.753499999999999,31.850499999999997,,0.15935,141,16,1520.075
tri-gauss,32,2,17.0565,0.2003,14.153500000000001,33.653,,0.3468,269,32,1526.705
tri-gauss,64,2,17.363,0.1964,13.256,33.411500000000004,,0.3805,525,64,1757.96
tri-gauss,128,2,17.749499999999998,0.19774999999999998,12.256499999999999,35.89,,0.5331,1037,128,2114.68
tri-gauss,256,2,18.1635,0.20095,11.204,35.021,,0.60875,2057,255.5,2659.115
tri-gauss,512,2,18.524,0.19995000000000002,10.337,35.9105,,0.6595500000000001,4093,510,3927.2799999999997
tri-gauss,1024,2,19.066499999999998,0.22075,9.203,36.327,,0.68235,8181,1021,7007.285
tri-gauss,2048,2,19.421,0.24919999999999998,8.4715,36.094,,0.7141,16305,2036.5,13578.425
```
