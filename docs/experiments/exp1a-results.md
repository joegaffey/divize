# EXP1A results — DLPC

Generated 2026-08-03T19:19:34.368Z · libs @ `ad54ed7` · images: 3

## Verdict

**voronoi** leads at the largest budget (mean ΔE 11.52)

## Fidelity per budget (means over images)

### PSNR (dB)

| style | n=16 | n=32 | n=64 | n=128 |
|---|---|---|---|---|
| voronoi | 16.91 dB | 17.09 dB | 17.20 dB | 17.42 dB |
| tri-tiled | 16.83 dB | 16.98 dB | 17.45 dB | 17.29 dB |
| tri-splat | 16.41 dB | 15.88 dB | 16.57 dB | 16.11 dB |

### SSIM

| style | n=16 | n=32 | n=64 | n=128 |
|---|---|---|---|---|
| voronoi | 0.1997 | 0.1969 | 0.1966 | 0.2627 |
| tri-tiled | 0.2028 | 0.2017 | 0.2050 | 0.2730 |
| tri-splat | 0.1910 | 0.1829 | 0.1831 | 0.2484 |

### Mean CIEDE2000 (ΔE)

| style | n=16 | n=32 | n=64 | n=128 |
|---|---|---|---|---|
| voronoi | 14.59 | 14.04 | 13.73 | 11.52 |
| tri-tiled | 14.78 | 14.30 | 13.11 | 11.83 |
| tri-splat | 14.57 | 14.91 | 14.05 | 12.71 |

### ΔE99

| style | n=16 | n=32 | n=64 | n=128 |
|---|---|---|---|---|
| voronoi | 31.16 | 33.37 | 32.64 | 39.05 |
| tri-tiled | 29.79 | 30.20 | 32.78 | 38.47 |
| tri-splat | 38.40 | 45.19 | 37.65 | 48.61 |

### ΔE·sal (saliency-weighted)

| style | n=16 | n=32 | n=64 | n=128 |
|---|---|---|---|---|
| voronoi | 13.78 | 13.54 | 13.54 | 14.16 |
| tri-tiled | 13.84 | 13.63 | — | 14.22 |
| tri-splat | 13.64 | 14.35 | 13.70 | 15.58 |

### Rendered coverage

| style | n=16 | n=32 | n=64 | n=128 |
|---|---|---|---|---|
| voronoi | 13.1% | 22.6% | 37.7% | 60.9% |
| tri-tiled | 1.0% | 15.3% | 26.3% | 51.0% |
| tri-splat | 34.9% | 51.5% | 56.1% | 64.0% |

### Payload bytes

| style | n=16 | n=32 | n=64 | n=128 |
|---|---|---|---|---|
| voronoi | 93 B | 173 B | 333 B | 653 B |
| tri-tiled | 364 B | 636 B | 1180 B | 2266 B |
| tri-splat | 141 B | 269 B | 525 B | 1037 B |

### Avg encode time (ms)

| style | n=16 | n=32 | n=64 | n=128 |
|---|---|---|---|---|
| voronoi | 900.6 ms | 846.4 ms | 857.4 ms | 893.2 ms |
| tri-tiled | 841.1 ms | 880.4 ms | 1029.5 ms | 1089.6 ms |
| tri-splat | 863.8 ms | 1222.7 ms | 994.8 ms | 1112.9 ms |

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
| kodim01.png | tri-splat | 16 | combined | 16.41 dB | 14.57 | 141 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-splat&budget=16&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | tri-splat | 32 | combined | 15.63 dB | 15.33 | 269 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-splat&budget=32&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | tri-splat | 32 | combined | 16.12 dB | 14.50 | 269 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-splat&budget=32&mode=combined&iters=50&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | tri-splat | 64 | combined | 16.29 dB | 14.35 | 525 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-splat&budget=64&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | tri-splat | 64 | combined | 16.85 dB | 13.76 | 525 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-splat&budget=64&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.5&aa=0&blend=0&progressive=100) |
| kodim01.png | tri-splat | 128 | combined | 17.05 dB | 12.42 | 1037 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-splat&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | tri-tiled | 16 | combined | 16.83 dB | 14.78 | 364 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-tiled&budget=16&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | tri-tiled | 32 | combined | 16.98 dB | 14.30 | 636 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-tiled&budget=32&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | tri-tiled | 64 | combined | 17.34 dB | 13.43 | 1180 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-tiled&budget=64&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | tri-tiled | 64 | uniform | 17.56 dB | 12.80 | 1180 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-tiled&budget=64&mode=uniform&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | tri-tiled | 128 | combined | 17.65 dB | 12.82 | 2268 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-tiled&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | voronoi | 16 | combined | 16.91 dB | 14.59 | 93 B | [open](../../exp/exp1-a-triangle-floor/?style=voronoi&budget=16&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | voronoi | 32 | combined | 17.09 dB | 14.04 | 173 B | [open](../../exp/exp1-a-triangle-floor/?style=voronoi&budget=32&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | voronoi | 64 | combined | 17.20 dB | 13.73 | 333 B | [open](../../exp/exp1-a-triangle-floor/?style=voronoi&budget=64&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim01.png | voronoi | 128 | combined | 17.79 dB | 12.19 | 653 B | [open](../../exp/exp1-a-triangle-floor/?style=voronoi&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim05.png | tri-splat | 128 | combined | 14.81 dB | 15.23 | 1037 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-splat&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim05.png | tri-tiled | 128 | combined | 15.75 dB | 13.99 | 2268 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-tiled&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim05.png | voronoi | 128 | combined | 15.80 dB | 14.11 | 653 B | [open](../../exp/exp1-a-triangle-floor/?style=voronoi&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim19.png | tri-splat | 128 | combined | 16.46 dB | 10.48 | 1037 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-splat&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim19.png | tri-tiled | 128 | combined | 18.47 dB | 8.67 | 2262 B | [open](../../exp/exp1-a-triangle-floor/?style=tri-tiled&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |
| kodim19.png | voronoi | 128 | combined | 18.66 dB | 8.26 | 653 B | [open](../../exp/exp1-a-triangle-floor/?style=voronoi&budget=128&mode=combined&iters=0&autoCvt=0&triColor=interp&splatAlpha=0.8&aa=0&blend=0&progressive=100) |

## CSV

```csv
style,budget,images,psnr,ssim,de,de99,deSal,cov,bytes,np,msTotal
voronoi,16,1,16.91,0.1997,14.587,31.162,13.777,0.1305,93,16,900.6
voronoi,32,1,17.086,0.1969,14.035,33.371,13.543,0.2256,173,32,846.4
voronoi,64,1,17.203,0.1966,13.734,32.644,13.536,0.3768,333,64,857.4
voronoi,128,3,17.417333333333335,0.2627,11.519666666666666,39.04566666666667,14.162666666666667,0.6092333333333334,653,128,893.1666666666666
tri-tiled,16,1,16.831,0.2028,14.781,29.794,13.844,0.0102,364,38,841.1
tri-tiled,32,1,16.981,0.2017,14.297,30.197,13.628,0.1529,636,70,880.4
tri-tiled,64,2,17.451,0.20495000000000002,13.1145,32.778,,0.26295,1180,134,1029.45
tri-tiled,128,3,17.291666666666668,0.27296666666666664,11.827666666666666,38.47466666666667,14.223666666666666,0.5101,2266,261.6666666666667,1089.6
tri-splat,16,1,16.407,0.191,14.573,38.4,13.643,0.3486,141,16,863.8
tri-splat,32,2,15.876,0.18285,14.9145,45.1905,14.352,0.5152,269,32,1222.65
tri-splat,64,2,16.567500000000003,0.18309999999999998,14.0515,37.653000000000006,13.6975,0.5607500000000001,525,64,994.8
tri-splat,128,3,16.108999999999998,0.2484333333333333,12.713333333333333,48.61233333333333,15.575000000000001,0.6401666666666667,1037,128,1112.8999999999999
```
