# divize — Divisionist Layered Point Codec (DLPC)

Asymmetric, progressive image compression. Encode raster → sparse point cloud
(analytical / iterative / ML). Decode on GPU (WebGPU/WebGL with CPU fallback) as
byte streams arrive.

## Layout

```
├── spec/
│   ├── requirements.md           # goals, constraints, measurable targets
│   ├── design.md                # design intent; points to docs/ (below)
│   └── tasks.md                 # roadmap + experiment work-packages
├── docs/
│   ├── architecture.md          # system architecture description
│   └── dlpc-format.md           # authoritative .dlpc container / packet layout
├── exp/                        # index grid → open exp/index.html to browse
│   ├── index.html              # hub linking all experiments + tools
│   ├── css/hub.css
│   ├── exp1-convergence/       # CURRENT working sandbox (Experiment 1)
│   │   ├── index.html          # encoder sandbox (+ Export .dlpc button)
│   │   ├── css/style.css
│   │   └── js/{main,gpu,saliency,sampling,export}.js
│   ├── exp1-a-triangle-floor/  # floor showdown: Voronoi vs triangle mesh vs α-splat
│   │   ├── index.html          # encoder sandbox (3 floor styles + SSIM/PSNR, Export .dlpc)
│   │   ├── css/style.css
│   │   └── js/{main,gpu,saliency,sampling,metric,export}.js
│   ├── exp1-b-triangle-variants/ # triangle-floor variants from one seed set
│   │   ├── index.html          # encoder sandbox (5 styles + coverage%/SSIM/PSNR, Export .dlpc)
│   │   ├── css/style.css
│   │   └── js/{main,gpu,saliency,sampling,geometry,metric,export}.js
│   ├── dlpc-player/            # embeddable <dlpc-player> web-component renderer
│   │   ├── index.html          # standalone demo
│   │   ├── assets/sample.dlpc  # generated Layer-0 sample
│   │   └── js/{decode,gpu,player}.js
│   ├── dlpc-viewer/            # decode + render tool (uses <dlpc-player>)
│   │   ├── index.html
│   │   ├── css/style.css
│   │   └── js/viewer.js        # thin controller; render/DLP lives in dlpc-player
│   ├── exp2-showdown/          # scaffold · Voronoi vs Hybrid + R-D curves
│   └── exp3-effort/            # scaffold · analytic / iterative / ML placement
└── README.md
```

Each experiment is **self-contained** (own copy of the shared libs) so a change in
one never affects another and each is runnable in isolation.

## Working pipeline (exp1 → viewer)

1. **exp1-convergence** — load an image, tune points/CVT, hit **Export .dlpc**.
   Writes the current field as a Layer-0 `.dlpc` blob (see `docs/dlpc-format.md`, 5-byte packets).
2. **dlpc-viewer** — drop that `.dlpc` in: it renders through the `<dlpc-player>` web
   component from `exp/dlpc-player`, so decode + Voronoi render (WebGPU, CPU
   fallback), blend/AA, and progressive draw-count all run inside the element.
3. **dlpc-player** — the same renderer packaged as a drop-in custom element that
   any page can embed:

   ```html
   <script src="js/decode.js"></script>
   <script src="js/gpu.js"></script>
   <script src="js/player.js"></script>
   <dlpc-player src="sample.dlpc" points="60" blend="0.3" aa></dlpc-player>
   ```

   Attributes: `src`, `points` (0–100%), `blend` (0–1), `aa`, `backend`
   (`auto|webgpu|cpu`). Events: `dlpc:load`, `dlpc:error`.

## Running

### GitHub Pages
The repo is static and deploys straight to GH Pages. The root `index.html` is a
short project explainer that links to the experiments hub (`exp/`). Enable Pages
under **Settings → Pages → Deploy from branch → main / root**. Since WebGPU needs a
secure context, HTTPS (which GH Pages serves) is required — open it from the
Pages URL, not via `file://`.

### Local
Serve the repo over localhost (a secure context) with `npx serve`:

```bash
# Serve the whole repo — root explainer + experiments hub:
npx serve .
# → http://localhost:3000/        (explainer)
# → http://localhost:3000/exp/    (hub)

# Or serve a single experiment directly:
cd exp/exp1-convergence && npx serve .
# → http://localhost:3000   (encoder)
```
Open via the URL above; `serve` auto-finds `index.html`.

## Experiment status

| Exp | Name | State |
|-----|------|-------|
| 1 | Convergence & base-layer density | **Working**: analytic saliency, CVT, WebGPU/CPU Voronoi, wipe, wire-size stat, Layer-0 export |
| 1-a | Floor primitive showdown | **Built**: Voronoi vs tiled Delaunay mesh (0x02, flat/barycentric) vs α-triangle splat (0x03); WebGPU/CPU, SSIM/PSNR, per-style byte cost; player renders 0x02/0x03 |
| 1-b | Triangle-floor variants | **Built**: same-seed set → Voronoi, Delaunay, exact cell fans, one-triangle/cell, cell-oriented α-triangles; exact cells via half-plane clipping; coverage% + SSIM/PSNR |
| — | .dlpc viewer | **Working**: decode + render Layer 0 via `<dlpc-player>` (WebGPU/CPU fallback) |
| — | dlpc-player web component | **Working**: embeddable `<dlpc-player>` (decode/gpu/player), used by the viewer |
| 2 | Voronoi vs Hybrid showdown | Scaffold only (+ pipeline C: cell-split triangles, spec'd) |
| 3 | Optimization algorithm efficiency | Scaffold only (analytic + iterative paths present via exp1 libs) |
| 4 | Temporal / Adaptive streaming | **Planned (Phase 4)**: baseline+tail framing, persistent-seed velocity deltas, enhance/degrade control |