# EXP1A results — DLPC

Generated 2026-08-03T19:11:16.585Z · libs @ `57c1bf8` · images: 3

## Verdict

**tri-tiled** leads at the largest budget (mean ΔE 14.99)

## Fidelity per budget (means over images)

### PSNR (dB)

| style | n=16 | n=32 | n=64 | n=128 |
|---|---|---|---|---|
| voronoi | 13.23 dB | 13.54 dB | 14.12 dB | 13.94 dB |
| tri-tiled | 14.38 dB | 14.65 dB | 15.41 dB | 15.14 dB |
| tri-splat | 15.10 dB | 14.30 dB | 14.51 dB | 13.68 dB |

### SSIM

| style | n=16 | n=32 | n=64 | n=128 |
|---|---|---|---|---|
| voronoi | 0.1741 | 0.1709 | 0.1653 | 0.2275 |
| tri-tiled | 0.1867 | 0.1941 | 0.1886 | 0.2429 |
| tri-splat | 0.1914 | 0.1777 | 0.1658 | 0.2226 |

### Mean CIEDE2000 (ΔE)

| style | n=16 | n=32 | n=64 | n=128 |
|---|---|---|---|---|
| voronoi | 20.43 | 19.02 | 17.49 | 16.43 |
| tri-tiled | 17.51 | 17.32 | 15.39 | 14.99 |
| tri-splat | 16.45 | 17.64 | 17.06 | 16.94 |

### ΔE99

| style | n=16 | n=32 | n=64 | n=128 |
|---|---|---|---|---|
| voronoi | 50.46 | 53.96 | 47.34 | 60.64 |
| tri-tiled | 46.90 | 45.83 | 48.00 | 50.51 |
| tri-splat | 46.23 | 52.16 | 45.89 | 61.84 |

### ΔE·sal (saliency-weighted)

| style | n=16 | n=32 | n=64 | n=128 |
|---|---|---|---|---|
| voronoi | 19.61 | 18.12 | 16.11 | 18.09 |
| tri-tiled | 15.09 | 16.89 | — | 16.05 |
| tri-splat | 14.80 | 16.64 | 16.13 | 18.75 |

### Rendered coverage

| style | n=16 | n=32 | n=64 | n=128 |
|---|---|---|---|---|
| voronoi | 73.4% | 85.0% | 63.3% | 80.7% |
| tri-tiled | 66.2% | 61.6% | 66.9% | 72.1% |
| tri-splat | 68.3% | 69.9% | 76.3% | 74.4% |

### Payload bytes

| style | n=16 | n=32 | n=64 | n=128 |
|---|---|---|---|---|
| voronoi | 93 B | 173 B | 333 B | 653 B |
| tri-tiled | 364 B | 636 B | 1180 B | 2266 B |
| tri-splat | 141 B | 269 B | 525 B | 1037 B |

### Avg encode time (ms)

| style | n=16 | n=32 | n=64 | n=128 |
|---|---|---|---|---|
| voronoi | 906.1 ms | 864.3 ms | 868.8 ms | 911.1 ms |
| tri-tiled | 900.1 ms | 915.1 ms | 1023.0 ms | 1113.4 ms |
| tri-splat | 925.0 ms | 1222.4 ms | 984.5 ms | 1118.5 ms |

## Reproduce a run in the browser

Every link below opens the experiment page with that exact run pre-loaded
(config via query string). The source image is not auto-loaded — drop or
browse to one (e.g. a Kodak PNG) to see the floor rendered.

| image | style | n | mode | PSNR | ΔE | bytes | open in browser |
|---|---|---|---|---|---|---|---|
| kodim01.png | tri-splat | 16 | combined | 15.10 dB | 16.45 | 141 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-splat&budget=16&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | tri-splat | 32 | combined | 13.68 dB | 18.79 | 269 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-splat&budget=32&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | tri-splat | 32 | combined | 14.92 dB | 16.48 | 269 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-splat&budget=32&mode=combined&iters=50&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | tri-splat | 64 | combined | 14.51 dB | 17.07 | 525 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-splat&budget=64&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | tri-splat | 64 | combined | 14.52 dB | 17.05 | 525 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-splat&budget=64&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.5&aa=0&blend=0&progressive=100) |
| kodim01.png | tri-splat | 128 | combined | 14.15 dB | 16.58 | 1037 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-splat&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | tri-tiled | 16 | combined | 14.38 dB | 17.51 | 364 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-tiled&budget=16&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | tri-tiled | 32 | combined | 14.65 dB | 17.32 | 636 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-tiled&budget=32&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | tri-tiled | 64 | combined | 15.28 dB | 15.68 | 1180 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-tiled&budget=64&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | tri-tiled | 64 | uniform | 15.54 dB | 15.09 | 1180 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-tiled&budget=64&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | tri-tiled | 128 | combined | 16.01 dB | 14.49 | 2268 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-tiled&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | voronoi | 16 | combined | 13.23 dB | 20.43 | 93 B | [open](../../exp/exp1-a-triangle-floor/?style=voronoi&budget=16&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | voronoi | 32 | combined | 13.54 dB | 19.02 | 173 B | [open](../../exp/exp1-a-triangle-floor/?style=voronoi&budget=32&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | voronoi | 64 | combined | 14.12 dB | 17.49 | 333 B | [open](../../exp/exp1-a-triangle-floor/?style=voronoi&budget=64&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | voronoi | 128 | combined | 14.36 dB | 16.40 | 653 B | [open](../../exp/exp1-a-triangle-floor/?style=voronoi&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim05.png | tri-splat | 128 | combined | 11.63 dB | 22.14 | 1037 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-splat&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim05.png | tri-tiled | 128 | combined | 13.54 dB | 18.26 | 2268 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-tiled&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim05.png | voronoi | 128 | combined | 11.79 dB | 21.41 | 653 B | [open](../../exp/exp1-a-triangle-floor/?style=voronoi&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim19.png | tri-splat | 128 | combined | 15.26 dB | 12.10 | 1037 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-splat&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim19.png | tri-tiled | 128 | combined | 15.87 dB | 12.21 | 2262 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-tiled&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim19.png | voronoi | 128 | combined | 15.68 dB | 11.47 | 653 B | [open](../../exp/exp1-a-triangle-floor/?style=voronoi&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |

## CSV

```csv
style,budget,images,psnr,ssim,de,de99,deSal,cov,bytes,np,msTotal
voronoi,16,1,13.235,0.1741,20.429,50.459,19.608,0.7336,93,16,906.14
voronoi,32,1,13.544,0.1709,19.019,53.962,18.119,0.8497,173,32,864.34
voronoi,64,1,14.116,0.1653,17.489,47.337,16.11,0.633,333,64,868.77
voronoi,128,3,13.941,0.2275,16.427666666666667,60.64000000000001,18.08666666666667,0.8071666666666667,653,128,911.1233333333333
tri-tiled,16,1,14.378,0.1867,17.509,46.898,15.092,0.6622,364,38,900.07
tri-tiled,32,1,14.652,0.1941,17.319,45.833,16.892,0.6164,636,70,915.07
tri-tiled,64,2,15.41,0.1886,15.3855,48.0025,,0.6692,1180,134,1022.99
tri-tiled,128,3,15.138666666666666,0.24286666666666665,14.985333333333335,50.507,16.045666666666666,0.7210000000000001,2266,261.6666666666667,1113.4
tri-splat,16,1,15.102,0.1914,16.454,46.227,14.798,0.6833,141,16,925.03
tri-splat,32,2,14.299,0.17765,17.637999999999998,52.158,16.643,0.69925,269,32,1222.425
tri-splat,64,2,14.5135,0.16585,17.055999999999997,45.885999999999996,16.128,0.76275,525,64,984.46
tri-splat,128,3,13.681,0.22263333333333332,16.939666666666664,61.83733333333333,18.746333333333332,0.7439333333333332,1037,128,1118.4933333333336
```
