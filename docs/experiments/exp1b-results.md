# EXP1B results — DLPC

Generated 2026-08-03T17:43:59.948Z · libs @ `11db5e4` · images: 3

## Verdict

**delaunay** leads at the largest budget (mean ΔE 14.59)

## Fidelity per budget (means over images)

### PSNR (dB)

| style | n=16 | n=32 | n=64 | n=128 | n=256 |
|---|------|---|---|---|---|---|
| voronoi | 13.23 dB | 13.54 dB | 14.12 dB | 13.94 dB | 14.68 dB |
| delaunay | 14.87 dB | 15.30 dB | 15.43 dB | 14.66 dB | 15.87 dB |
| voro-fan | 15.38 dB | 14.42 dB | 15.11 dB | 14.03 dB | 15.49 dB |
| cell-tris | 15.77 dB | 15.28 dB | 15.52 dB | 14.64 dB | 15.57 dB |
| tri-gauss | 14.29 dB | 14.76 dB | 14.34 dB | 14.28 dB | 14.29 dB |

### SSIM

| style | n=16 | n=32 | n=64 | n=128 | n=256 |
|---|------|---|---|---|---|---|
| voronoi | 0.1741 | 0.1709 | 0.1653 | 0.2275 | 0.1593 |
| delaunay | 0.1870 | 0.1907 | 0.1860 | 0.2346 | 0.1854 |
| voro-fan | 0.1941 | 0.1809 | 0.1835 | 0.2227 | 0.1690 |
| cell-tris | 0.1831 | 0.1733 | 0.1628 | 0.2021 | 0.1469 |
| tri-gauss | 0.1813 | 0.1788 | 0.1713 | 0.2189 | 0.1474 |

### Mean CIEDE2000 (ΔE)

| style | n=16 | n=32 | n=64 | n=128 | n=256 |
|---|------|---|---|---|---|---|
| voronoi | 20.43 | 19.02 | 17.49 | 16.43 | 15.46 |
| delaunay | 17.16 | 16.04 | 15.55 | 15.86 | 14.59 |
| voro-fan | 16.53 | 16.91 | 16.10 | 16.87 | 14.66 |
| cell-tris | 16.18 | 16.37 | 16.40 | 16.18 | 15.74 |
| tri-gauss | 18.28 | 17.48 | 16.77 | 16.26 | 16.76 |

### ΔE99

| style | n=16 | n=32 | n=64 | n=128 | n=256 |
|---|------|---|---|---|---|---|
| voronoi | 50.46 | 53.96 | 47.34 | 60.64 | 54.03 |
| delaunay | 46.24 | 45.44 | 43.92 | 49.43 | 46.94 |
| voro-fan | 42.76 | 52.41 | 48.95 | 56.45 | 47.21 |
| cell-tris | 39.92 | 45.32 | 45.34 | 49.22 | 44.60 |
| tri-gauss | 44.32 | 44.68 | 49.87 | 56.19 | 51.78 |

### ΔE·sal (saliency-weighted)

| style | n=16 | n=32 | n=64 | n=128 | n=256 |
|---|------|---|---|---|---|---|
| voronoi | 19.61 | 18.12 | 16.11 | 18.09 | 15.30 |
| delaunay | 15.54 | 14.66 | 14.02 | 15.98 | 13.86 |
| voro-fan | 15.03 | 15.67 | 15.39 | 17.15 | 14.71 |
| cell-tris | 15.07 | 15.24 | 15.22 | 17.47 | 14.81 |
| tri-gauss | 16.56 | 16.41 | 15.92 | 17.65 | 15.97 |

### Rendered coverage

| style | n=16 | n=32 | n=64 | n=128 | n=256 |
|---|------|---|---|---|---|---|
| voronoi | 73.4% | 85.0% | 63.3% | 80.7% | 79.3% |
| delaunay | 63.8% | 66.3% | 63.3% | 74.1% | 63.3% |
| voro-fan | 29.0% | 71.9% | 61.8% | 74.6% | 73.2% |
| cell-tris | 36.7% | 34.9% | 40.2% | 49.0% | 42.5% |
| tri-gauss | 56.4% | 71.5% | 77.3% | 77.1% | 71.3% |

### Payload bytes

| style | n=16 | n=32 | n=64 | n=128 | n=256 |
|---|------|---|---|---|---|---|
| voronoi | 93 B | 173 B | 333 B | 653 B | 1293 B |
| delaunay | 364 B | 636 B | 1180 B | 2262 B | 4438 B |
| voro-fan | 770 B | 1538 B | 3107 B | 6337 B | 12750 B |
| cell-tris | 432 B | 848 B | 1680 B | 3344 B | 6646 B |
| tri-gauss | 141 B | 269 B | 525 B | 1037 B | 2053 B |

### Avg encode time (ms)

| style | n=16 | n=32 | n=64 | n=128 | n=256 |
|---|------|---|---|---|---|---|
| voronoi | 860.0 ms | 885.4 ms | 879.8 ms | 913.7 ms | 936.7 ms |
| delaunay | 896.3 ms | 1219.5 ms | 1060.8 ms | 1106.5 ms | 1254.3 ms |
| voro-fan | 922.5 ms | 1303.1 ms | 1412.3 ms | 1521.5 ms | 2413.9 ms |
| cell-tris | 884.5 ms | 1215.3 ms | 955.9 ms | 1016.5 ms | 1185.9 ms |
| tri-gauss | 877.8 ms | 930.3 ms | 1035.1 ms | 1293.1 ms | 1629.2 ms |

## Reproduce a run in the browser

Every link below opens the experiment page with that exact run pre-loaded
(config via query string, image via `img` param). Serve the repo root so
the relative paths resolve, e.g. `python3 -m http.server` from the repo root,
then click any row.

| image | style | n | mode | PSNR | ΔE | bytes | open in browser |
|---|---|---|---|---|---|---|---|
| kodim01.png | cell-tris | 16 | combined | 15.77 dB | 16.18 | 432 B | [open](/exp/exp1-b-triangle-variants/?style=cell-tris&budget=16&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | cell-tris | 32 | combined | 14.69 dB | 16.99 | 848 B | [open](/exp/exp1-b-triangle-variants/?style=cell-tris&budget=32&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | cell-tris | 32 | combined | 15.88 dB | 15.74 | 848 B | [open](/exp/exp1-b-triangle-variants/?style=cell-tris&budget=32&mode=combined&iters=50&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | cell-tris | 64 | combined | 15.84 dB | 15.86 | 1680 B | [open](/exp/exp1-b-triangle-variants/?style=cell-tris&budget=64&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | cell-tris | 64 | edge | 15.20 dB | 16.95 | 1680 B | [open](/exp/exp1-b-triangle-variants/?style=cell-tris&budget=64&mode=edge&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | cell-tris | 128 | combined | 15.35 dB | 15.88 | 3344 B | [open](/exp/exp1-b-triangle-variants/?style=cell-tris&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | cell-tris | 256 | combined | 15.57 dB | 15.74 | 6646 B | [open](/exp/exp1-b-triangle-variants/?style=cell-tris&budget=256&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | delaunay | 16 | combined | 14.87 dB | 17.16 | 364 B | [open](/exp/exp1-b-triangle-variants/?style=delaunay&budget=16&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | delaunay | 32 | combined | 15.03 dB | 16.64 | 636 B | [open](/exp/exp1-b-triangle-variants/?style=delaunay&budget=32&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | delaunay | 32 | combined | 15.57 dB | 15.43 | 636 B | [open](/exp/exp1-b-triangle-variants/?style=delaunay&budget=32&mode=combined&iters=50&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | delaunay | 64 | combined | 15.03 dB | 15.67 | 1180 B | [open](/exp/exp1-b-triangle-variants/?style=delaunay&budget=64&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | delaunay | 64 | lapvar | 15.83 dB | 15.43 | 1180 B | [open](/exp/exp1-b-triangle-variants/?style=delaunay&budget=64&mode=lapvar&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | delaunay | 128 | combined | 15.14 dB | 15.79 | 2268 B | [open](/exp/exp1-b-triangle-variants/?style=delaunay&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | delaunay | 256 | combined | 15.87 dB | 14.59 | 4438 B | [open](/exp/exp1-b-triangle-variants/?style=delaunay&budget=256&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-gauss | 16 | combined | 14.29 dB | 18.28 | 141 B | [open](/exp/exp1-b-triangle-variants/?style=tri-gauss&budget=16&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-gauss | 32 | combined | 14.76 dB | 17.48 | 269 B | [open](/exp/exp1-b-triangle-variants/?style=tri-gauss&budget=32&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-gauss | 64 | combined | 14.34 dB | 16.77 | 525 B | [open](/exp/exp1-b-triangle-variants/?style=tri-gauss&budget=64&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-gauss | 128 | combined | 15.02 dB | 16.24 | 1037 B | [open](/exp/exp1-b-triangle-variants/?style=tri-gauss&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | tri-gauss | 256 | combined | 14.29 dB | 16.76 | 2053 B | [open](/exp/exp1-b-triangle-variants/?style=tri-gauss&budget=256&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voro-fan | 16 | combined | 15.38 dB | 16.53 | 770 B | [open](/exp/exp1-b-triangle-variants/?style=voro-fan&budget=16&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voro-fan | 32 | combined | 13.71 dB | 17.67 | 1538 B | [open](/exp/exp1-b-triangle-variants/?style=voro-fan&budget=32&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voro-fan | 32 | combined | 15.13 dB | 16.16 | 1538 B | [open](/exp/exp1-b-triangle-variants/?style=voro-fan&budget=32&mode=combined&iters=50&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voro-fan | 64 | combined | 14.34 dB | 16.98 | 3074 B | [open](/exp/exp1-b-triangle-variants/?style=voro-fan&budget=64&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voro-fan | 64 | edge | 15.88 dB | 15.23 | 3140 B | [open](/exp/exp1-b-triangle-variants/?style=voro-fan&budget=64&mode=edge&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voro-fan | 128 | combined | 15.07 dB | 15.73 | 6292 B | [open](/exp/exp1-b-triangle-variants/?style=voro-fan&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voro-fan | 256 | combined | 15.49 dB | 14.66 | 12750 B | [open](/exp/exp1-b-triangle-variants/?style=voro-fan&budget=256&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 16 | combined | 13.23 dB | 20.43 | 93 B | [open](/exp/exp1-b-triangle-variants/?style=voronoi&budget=16&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 32 | combined | 13.54 dB | 19.02 | 173 B | [open](/exp/exp1-b-triangle-variants/?style=voronoi&budget=32&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 64 | combined | 14.12 dB | 17.49 | 333 B | [open](/exp/exp1-b-triangle-variants/?style=voronoi&budget=64&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 128 | combined | 14.36 dB | 16.40 | 653 B | [open](/exp/exp1-b-triangle-variants/?style=voronoi&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim01.png | voronoi | 256 | combined | 14.68 dB | 15.46 | 1293 B | [open](/exp/exp1-b-triangle-variants/?style=voronoi&budget=256&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim01.png) |
| kodim05.png | cell-tris | 128 | combined | 13.33 dB | 18.65 | 3344 B | [open](/exp/exp1-b-triangle-variants/?style=cell-tris&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim05.png) |
| kodim05.png | delaunay | 128 | combined | 13.82 dB | 17.85 | 2268 B | [open](/exp/exp1-b-triangle-variants/?style=delaunay&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim05.png) |
| kodim05.png | tri-gauss | 128 | combined | 12.49 dB | 20.63 | 1037 B | [open](/exp/exp1-b-triangle-variants/?style=tri-gauss&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim05.png) |
| kodim05.png | voro-fan | 128 | combined | 12.17 dB | 21.11 | 6363 B | [open](/exp/exp1-b-triangle-variants/?style=voro-fan&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim05.png) |
| kodim05.png | voronoi | 128 | combined | 11.79 dB | 21.41 | 653 B | [open](/exp/exp1-b-triangle-variants/?style=voronoi&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim05.png) |
| kodim19.png | cell-tris | 128 | combined | 15.23 dB | 14.02 | 3344 B | [open](/exp/exp1-b-triangle-variants/?style=cell-tris&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim19.png) |
| kodim19.png | delaunay | 128 | combined | 15.03 dB | 13.95 | 2251 B | [open](/exp/exp1-b-triangle-variants/?style=delaunay&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim19.png) |
| kodim19.png | tri-gauss | 128 | combined | 15.34 dB | 11.91 | 1037 B | [open](/exp/exp1-b-triangle-variants/?style=tri-gauss&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim19.png) |
| kodim19.png | voro-fan | 128 | combined | 14.86 dB | 13.76 | 6357 B | [open](/exp/exp1-b-triangle-variants/?style=voro-fan&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim19.png) |
| kodim19.png | voronoi | 128 | combined | 15.68 dB | 11.47 | 653 B | [open](/exp/exp1-b-triangle-variants/?style=voronoi&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100&img=%2Fharness%2Fdata%2Fkodak%2Fkodim19.png) |

## CSV

```csv
style,budget,images,psnr,ssim,de,de99,deSal,cov,bytes,np,msTotal
voronoi,16,1,13.235,0.1741,20.429,50.459,19.608,0.7336,93,16,860
voronoi,32,1,13.544,0.1709,19.019,53.962,18.119,0.8497,173,32,885.44
voronoi,64,1,14.116,0.1653,17.489,47.337,16.11,0.633,333,64,879.81
voronoi,128,3,13.941,0.2275,16.427666666666667,60.64000000000001,18.08666666666667,0.8071666666666667,653,128,913.69
voronoi,256,1,14.677,0.1593,15.457,54.029,15.298,0.7926,1293,256,936.7
delaunay,16,1,14.866,0.187,17.155,46.242,15.545,0.6378,364,38,896.3
delaunay,32,2,15.2995,0.19074999999999998,16.037499999999998,45.436499999999995,14.6575,0.6625,636,70,1219.545
delaunay,64,2,15.432500000000001,0.186,15.5465,43.921,14.019,0.63335,1180,134,1060.8
delaunay,128,3,14.660333333333334,0.23456666666666667,15.862333333333332,49.434666666666665,15.982333333333335,0.7411333333333333,2262.3333333333335,261.3333333333333,1106.4966666666667
delaunay,256,1,15.874,0.1854,14.592,46.942,13.863,0.6328,4438,517,1254.32
voro-fan,16,1,15.378,0.1941,16.533,42.759,15.027,0.2905,770,84,922.48
voro-fan,32,2,14.418,0.1809,16.9145,52.405,15.666,0.71925,1538,172,1303.09
voro-fan,64,2,15.11,0.1835,16.1015,48.948499999999996,15.3875,0.61755,3107,353.5,1412.2649999999999
voro-fan,128,3,14.033000000000001,0.22266666666666668,16.865333333333336,56.449999999999996,17.146,0.7457333333333334,6337.333333333333,733,1521.5466666666664
voro-fan,256,1,15.49,0.169,14.665,47.214,14.706,0.7322,12750,1484,2413.92
cell-tris,16,1,15.77,0.1831,16.176,39.922,15.066,0.3672,432,16,884.5
cell-tris,32,2,15.280999999999999,0.17325000000000002,16.367,45.32,15.236,0.34865,848,32,1215.2649999999999
cell-tris,64,2,15.52,0.16285,16.402,45.345,15.218499999999999,0.40215,1680,64,955.94
cell-tris,128,3,14.639666666666665,0.20206666666666664,16.18166666666667,49.22133333333333,17.474,0.4895666666666667,3344,128,1016.5233333333332
cell-tris,256,1,15.57,0.1469,15.739,44.599,14.808,0.4255,6646,255,1185.91
tri-gauss,16,1,14.294,0.1813,18.28,44.321,16.559,0.5643,141,16,877.78
tri-gauss,32,1,14.764,0.1788,17.479,44.681,16.411,0.7153,269,32,930.28
tri-gauss,64,1,14.343,0.1713,16.765,49.867,15.923,0.7725,525,64,1035.12
tri-gauss,128,3,14.283000000000001,0.21886666666666668,16.26,56.19466666666667,17.649,0.7714333333333334,1037,128,1293.0800000000002
tri-gauss,256,1,14.295,0.1474,16.762,51.776,15.973,0.7125,2053,255,1629.18
```
