# EXP1B results — DLPC

Generated 2026-08-03T19:19:34.416Z · libs @ `ad54ed7` · images: 3

## Verdict

**voronoi** leads at the largest budget (mean ΔE 11.49)

## Fidelity per budget (means over images)

### PSNR (dB)

| style | n=16 | n=32 | n=64 | n=128 | n=256 |
|---|---|---|---|---|---|
| voronoi | 16.91 dB | 17.09 dB | 17.20 dB | 17.42 dB | 18.06 dB |
| delaunay | 16.88 dB | 17.13 dB | 17.28 dB | 17.37 dB | 18.15 dB |
| voro-fan | 16.74 dB | 17.05 dB | 17.32 dB | 17.14 dB | 17.93 dB |
| cell-tris | 16.64 dB | 16.70 dB | 16.73 dB | 16.19 dB | 17.13 dB |
| tri-gauss | 16.93 dB | 16.96 dB | 17.16 dB | 17.09 dB | 17.79 dB |

### SSIM

| style | n=16 | n=32 | n=64 | n=128 | n=256 |
|---|---|---|---|---|---|
| voronoi | 0.1997 | 0.1969 | 0.1966 | 0.2627 | 0.2030 |
| delaunay | 0.2034 | 0.2039 | 0.2039 | 0.2724 | 0.2131 |
| voro-fan | 0.2023 | 0.2031 | 0.2044 | 0.2683 | 0.2045 |
| cell-tris | 0.1958 | 0.1941 | 0.1860 | 0.2266 | 0.1689 |
| tri-gauss | 0.2019 | 0.1988 | 0.1944 | 0.2553 | 0.1954 |

### Mean CIEDE2000 (ΔE)

| style | n=16 | n=32 | n=64 | n=128 | n=256 |
|---|---|---|---|---|---|
| voronoi | 14.59 | 14.04 | 13.73 | 11.52 | 11.49 |
| delaunay | 14.73 | 14.04 | 13.66 | 11.72 | 11.52 |
| voro-fan | 14.89 | 14.03 | 13.46 | 12.00 | 11.83 |
| cell-tris | 14.93 | 14.90 | 14.65 | 13.86 | 13.59 |
| tri-gauss | 14.48 | 14.44 | 13.87 | 12.05 | 12.30 |

### ΔE99

| style | n=16 | n=32 | n=64 | n=128 | n=256 |
|---|---|---|---|---|---|
| voronoi | 31.16 | 33.37 | 32.64 | 39.05 | 37.93 |
| delaunay | 29.64 | 30.72 | 31.65 | 37.39 | 34.45 |
| voro-fan | 30.06 | 32.48 | 35.49 | 39.26 | 34.91 |
| cell-tris | 32.72 | 31.57 | 32.55 | 39.77 | 33.87 |
| tri-gauss | 30.71 | 34.20 | 32.84 | 38.37 | 34.85 |

### ΔE·sal (saliency-weighted)

| style | n=16 | n=32 | n=64 | n=128 | n=256 |
|---|---|---|---|---|---|
| voronoi | 13.78 | 13.54 | 13.54 | 14.16 | 12.55 |
| delaunay | 13.61 | 13.45 | 13.46 | 14.19 | 12.16 |
| voro-fan | 13.84 | 13.38 | 13.43 | 14.51 | 12.48 |
| cell-tris | 13.88 | 13.90 | 13.70 | 15.82 | 13.37 |
| tri-gauss | 13.66 | 13.95 | 13.54 | 14.55 | 12.93 |

### Rendered coverage

| style | n=16 | n=32 | n=64 | n=128 | n=256 |
|---|---|---|---|---|---|
| voronoi | 13.1% | 22.6% | 37.7% | 60.9% | 63.9% |
| delaunay | 5.3% | 17.2% | 26.6% | 51.7% | 50.1% |
| voro-fan | 6.4% | 23.3% | 34.9% | 52.5% | 51.8% |
| cell-tris | 5.6% | 8.3% | 19.7% | 33.7% | 31.1% |
| tri-gauss | 6.9% | 33.4% | 34.8% | 57.0% | 52.5% |

### Payload bytes

| style | n=16 | n=32 | n=64 | n=128 | n=256 |
|---|---|---|---|---|---|
| voronoi | 93 B | 173 B | 333 B | 653 B | 1293 B |
| delaunay | 364 B | 636 B | 1180 B | 2262 B | 4438 B |
| voro-fan | 770 B | 1538 B | 3107 B | 6337 B | 12750 B |
| cell-tris | 432 B | 848 B | 1680 B | 3344 B | 6646 B |
| tri-gauss | 141 B | 269 B | 525 B | 1037 B | 2053 B |

### Avg encode time (ms)

| style | n=16 | n=32 | n=64 | n=128 | n=256 |
|---|---|---|---|---|---|
| voronoi | 839.5 ms | 837.4 ms | 843.8 ms | 891.6 ms | 942.1 ms |
| delaunay | 860.7 ms | 1234.5 ms | 1084.4 ms | 1094.0 ms | 1321.3 ms |
| voro-fan | 898.5 ms | 1276.7 ms | 1448.7 ms | 1526.7 ms | 2312.9 ms |
| cell-tris | 866.8 ms | 1180.8 ms | 1004.0 ms | 1021.8 ms | 1227.8 ms |
| tri-gauss | 925.6 ms | 947.7 ms | 1062.0 ms | 1266.1 ms | 1701.3 ms |

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
(config via query string). The source image is not auto-loaded — drop or
browse to one (e.g. a Kodak PNG) to see the floor rendered.

| image | style | n | mode | PSNR | ΔE | bytes | open in browser |
|---|---|---|---|---|---|---|---|
| kodim01.png | cell-tris | 16 | combined | 16.64 dB | 14.93 | 432 B | [open](../../exp/exp1-b-triangle-variants/?style=cell-tris&budget=16&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | cell-tris | 32 | combined | 16.68 dB | 14.98 | 848 B | [open](../../exp/exp1-b-triangle-variants/?style=cell-tris&budget=32&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | cell-tris | 32 | combined | 16.72 dB | 14.82 | 848 B | [open](../../exp/exp1-b-triangle-variants/?style=cell-tris&budget=32&mode=combined&iters=50&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | cell-tris | 64 | combined | 16.69 dB | 14.78 | 1680 B | [open](../../exp/exp1-b-triangle-variants/?style=cell-tris&budget=64&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | cell-tris | 64 | edge | 16.77 dB | 14.53 | 1680 B | [open](../../exp/exp1-b-triangle-variants/?style=cell-tris&budget=64&mode=edge&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | cell-tris | 128 | combined | 16.91 dB | 14.20 | 3344 B | [open](../../exp/exp1-b-triangle-variants/?style=cell-tris&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | cell-tris | 256 | combined | 17.13 dB | 13.59 | 6646 B | [open](../../exp/exp1-b-triangle-variants/?style=cell-tris&budget=256&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | delaunay | 16 | combined | 16.88 dB | 14.73 | 364 B | [open](../../exp/exp1-b-triangle-variants/?style=delaunay&budget=16&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | delaunay | 32 | combined | 17.13 dB | 13.96 | 636 B | [open](../../exp/exp1-b-triangle-variants/?style=delaunay&budget=32&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | delaunay | 32 | combined | 17.13 dB | 14.12 | 636 B | [open](../../exp/exp1-b-triangle-variants/?style=delaunay&budget=32&mode=combined&iters=50&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | delaunay | 64 | combined | 17.30 dB | 13.58 | 1180 B | [open](../../exp/exp1-b-triangle-variants/?style=delaunay&budget=64&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | delaunay | 64 | lapvar | 17.26 dB | 13.74 | 1180 B | [open](../../exp/exp1-b-triangle-variants/?style=delaunay&budget=64&mode=lapvar&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | delaunay | 128 | combined | 17.67 dB | 12.70 | 2268 B | [open](../../exp/exp1-b-triangle-variants/?style=delaunay&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | delaunay | 256 | combined | 18.15 dB | 11.52 | 4438 B | [open](../../exp/exp1-b-triangle-variants/?style=delaunay&budget=256&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | tri-gauss | 16 | combined | 16.93 dB | 14.48 | 141 B | [open](../../exp/exp1-b-triangle-variants/?style=tri-gauss&budget=16&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | tri-gauss | 32 | combined | 16.96 dB | 14.44 | 269 B | [open](../../exp/exp1-b-triangle-variants/?style=tri-gauss&budget=32&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | tri-gauss | 64 | combined | 17.16 dB | 13.87 | 525 B | [open](../../exp/exp1-b-triangle-variants/?style=tri-gauss&budget=64&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | tri-gauss | 128 | combined | 17.53 dB | 12.85 | 1037 B | [open](../../exp/exp1-b-triangle-variants/?style=tri-gauss&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | tri-gauss | 256 | combined | 17.79 dB | 12.30 | 2053 B | [open](../../exp/exp1-b-triangle-variants/?style=tri-gauss&budget=256&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | voro-fan | 16 | combined | 16.74 dB | 14.89 | 770 B | [open](../../exp/exp1-b-triangle-variants/?style=voro-fan&budget=16&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | voro-fan | 32 | combined | 17.15 dB | 13.70 | 1538 B | [open](../../exp/exp1-b-triangle-variants/?style=voro-fan&budget=32&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | voro-fan | 32 | combined | 16.96 dB | 14.37 | 1538 B | [open](../../exp/exp1-b-triangle-variants/?style=voro-fan&budget=32&mode=combined&iters=50&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | voro-fan | 64 | combined | 17.30 dB | 13.49 | 3074 B | [open](../../exp/exp1-b-triangle-variants/?style=voro-fan&budget=64&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | voro-fan | 64 | edge | 17.34 dB | 13.44 | 3140 B | [open](../../exp/exp1-b-triangle-variants/?style=voro-fan&budget=64&mode=edge&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | voro-fan | 128 | combined | 17.56 dB | 12.81 | 6292 B | [open](../../exp/exp1-b-triangle-variants/?style=voro-fan&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | voro-fan | 256 | combined | 17.93 dB | 11.83 | 12750 B | [open](../../exp/exp1-b-triangle-variants/?style=voro-fan&budget=256&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | voronoi | 16 | combined | 16.91 dB | 14.59 | 93 B | [open](../../exp/exp1-b-triangle-variants/?style=voronoi&budget=16&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | voronoi | 32 | combined | 17.09 dB | 14.04 | 173 B | [open](../../exp/exp1-b-triangle-variants/?style=voronoi&budget=32&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | voronoi | 64 | combined | 17.20 dB | 13.73 | 333 B | [open](../../exp/exp1-b-triangle-variants/?style=voronoi&budget=64&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | voronoi | 128 | combined | 17.79 dB | 12.19 | 653 B | [open](../../exp/exp1-b-triangle-variants/?style=voronoi&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | voronoi | 256 | combined | 18.06 dB | 11.49 | 1293 B | [open](../../exp/exp1-b-triangle-variants/?style=voronoi&budget=256&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim05.png | cell-tris | 128 | combined | 15.06 dB | 15.72 | 3344 B | [open](../../exp/exp1-b-triangle-variants/?style=cell-tris&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim05.png | delaunay | 128 | combined | 15.77 dB | 14.07 | 2268 B | [open](../../exp/exp1-b-triangle-variants/?style=delaunay&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim05.png | tri-gauss | 128 | combined | 15.65 dB | 14.39 | 1037 B | [open](../../exp/exp1-b-triangle-variants/?style=tri-gauss&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim05.png | voro-fan | 128 | combined | 15.59 dB | 14.56 | 6363 B | [open](../../exp/exp1-b-triangle-variants/?style=voro-fan&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim05.png | voronoi | 128 | combined | 15.80 dB | 14.11 | 653 B | [open](../../exp/exp1-b-triangle-variants/?style=voronoi&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim19.png | cell-tris | 128 | combined | 16.61 dB | 11.64 | 3344 B | [open](../../exp/exp1-b-triangle-variants/?style=cell-tris&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim19.png | delaunay | 128 | combined | 18.67 dB | 8.38 | 2251 B | [open](../../exp/exp1-b-triangle-variants/?style=delaunay&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim19.png | tri-gauss | 128 | combined | 18.09 dB | 8.90 | 1037 B | [open](../../exp/exp1-b-triangle-variants/?style=tri-gauss&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim19.png | voro-fan | 128 | combined | 18.26 dB | 8.64 | 6357 B | [open](../../exp/exp1-b-triangle-variants/?style=voro-fan&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim19.png | voronoi | 128 | combined | 18.66 dB | 8.26 | 653 B | [open](../../exp/exp1-b-triangle-variants/?style=voronoi&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |

## CSV

```csv
style,budget,images,psnr,ssim,de,de99,deSal,cov,bytes,np,msTotal
voronoi,16,1,16.91,0.1997,14.587,31.162,13.777,0.1305,93,16,839.5
voronoi,32,1,17.086,0.1969,14.035,33.371,13.543,0.2256,173,32,837.4
voronoi,64,1,17.203,0.1966,13.734,32.644,13.536,0.3768,333,64,843.8
voronoi,128,3,17.417333333333335,0.2627,11.519666666666666,39.04566666666667,14.162666666666667,0.6092333333333334,653,128,891.6
voronoi,256,1,18.061,0.203,11.488,37.926,12.546,0.6391,1293,256,942.1
delaunay,16,1,16.875,0.2034,14.726,29.642,13.605,0.0532,364,38,860.7
delaunay,32,2,17.131999999999998,0.2039,14.0405,30.7235,13.452,0.1724,636,70,1234.5
delaunay,64,2,17.2795,0.20395,13.6585,31.653,13.457,0.26605,1180,134,1084.4
delaunay,128,3,17.367,0.27236666666666665,11.717999999999998,37.392,14.191333333333333,0.5174666666666666,2262.3333333333335,261.3333333333333,1094
delaunay,256,1,18.152,0.2131,11.515,34.45,12.16,0.501,4438,517,1321.3
voro-fan,16,1,16.738,0.2023,14.889,30.06,13.842,0.0644,770,84,898.5
voro-fan,32,2,17.055,0.20315,14.032499999999999,32.485,13.375499999999999,0.23299999999999998,1538,172,1276.7
voro-fan,64,2,17.319000000000003,0.20435,13.465,35.4945,13.433499999999999,0.349,3107,353.5,1448.7
voro-fan,128,3,17.13733333333333,0.2682666666666667,12.004333333333335,39.260999999999996,14.508666666666668,0.5252333333333333,6337.333333333333,733,1526.6666666666667
voro-fan,256,1,17.932,0.2045,11.831,34.912,12.479,0.5182,12750,1484,2312.9
cell-tris,16,1,16.64,0.1958,14.926,32.716,13.882,0.0563,432,16,866.8
cell-tris,32,2,16.698999999999998,0.19415,14.901,31.5745,13.904,0.0832,848,32,1180.8
cell-tris,64,2,16.729,0.18595,14.652000000000001,32.551,13.702,0.1972,1680,64,1004.05
cell-tris,128,3,16.19333333333333,0.22656666666666667,13.856333333333334,39.766333333333336,15.815666666666667,0.3367,3344,128,1021.8333333333334
cell-tris,256,1,17.134,0.1689,13.59,33.867,13.367,0.3112,6646,255,1227.8
tri-gauss,16,1,16.929,0.2019,14.479,30.715,13.661,0.0688,141,16,925.6
tri-gauss,32,1,16.956,0.1988,14.436,34.204,13.951,0.3336,269,32,947.7
tri-gauss,64,1,17.164,0.1944,13.873,32.842,13.538,0.3479,525,64,1062
tri-gauss,128,3,17.09,0.25533333333333336,12.047666666666666,38.365,14.545333333333332,0.5703333333333332,1037,128,1266.1333333333334
tri-gauss,256,1,17.787,0.1954,12.303,34.85,12.93,0.5252,2053,255,1701.3
```
