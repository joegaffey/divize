# DLPC Tasks

The "when and by-what". Roadmap broken into the phases and the concrete work
each entails. Motivations and measurable targets: [`requirements.md`](./requirements.md).

## Phase 1 — Prototyping

- [ ] Interactive JS/Canvas encoder: extract point layers from image variance
      (edge density + Laplacian variance saliency, importance sampling).
- [ ] CVT / Lloyd relaxation for seed relaxation.
- [ ] Baseline Layer-0 exporter + streaming decode proof-of-concept.

**Status:** largely in progress — see `exp/exp1-convergence` and `exp/dlpc-viewer`.

## Phase 2 — Benchmarking

- [ ] Fold Pure Voronoi (Pipeline A) and Hybrid floor + splat (Pipeline B) into a
      unified testbench.
- [x] Autonomous sweep harness (`harness/`): headless Node engine reproducing the
      browser metrics + LLM-guided batch selection (spec in "Autonomous experiment
      harness" below).
- [ ] Produce rate–distortion curves (file size vs PSNR) on the standard dataset.
- [ ] Measure decode time on mobile browsers; find the Layer-0 diminishing returns.

## Phase 3 — Production

- [ ] Finalize bit-packing schemas (coordinate / color quantization, entropy
      coding) for raw `.dlpc` output.
- [ ] Deploy a streaming network simulator.
- [x] Package the decoder as an embeddable `<dlpc-player>` web component
      (self-contained copy of decode/gpu, no shared lib) in `exp/dlpc-player`.

## Phase 4 — Temporal / Adaptive streaming

- [ ] Per-frame budget cut-off + **JIT reset** (encode is pre-emptible; decoder
      drops the tail, swaps the buffer on time, resets for the next frame).
- [ ] Mandatory **baseline block** + **interruptible tail** stream framing.
- [ ] **Persistent-seed velocity deltas** (keyframe lays seeds; delta frames
      carry `Δx, Δy`) — no geometric popping.
- [ ] **Enhance / degrade control policy** over render frame-time (ms) and
      bandwidth (kbps).
- [ ] Throttled network-simulator runs: lock a target fps under a bandwidth cap
      and measure quality in both regimes.

## Experiment work-packages

- **Exp 1 — Convergence & base density**: sweep Layer-0 allocations
  (16 / 32 / 64 / 128 / 256) on the Kodak suite; SSIM + mobile decode time.
  CVT sweep uses **metric-informed auto-stop** (see design.md) so iteration
  counts are measured, not guessed.
- **Exp 1-a — Floor primitive showdown**: compare pure Voronoi vs tiled
  triangle mesh (Delaunay over the same seeds; indexed; flat vs barycentric
  colours) vs center+transform α-triangle splats at equal byte budgets
  (16 / 32 / 64 / 128); SSIM/PSNR/ΔE + mobile decode time. Decides the Layer-0
  primitive (`docs/dlpc-format.md` §0x02/0x03).
- **Exp 1-b — Floor variants from one seed set**: the same seeds feed five
  Layer-0 floors for byte-fair comparison — pure Voronoi (`0x01`), Delaunay
  mesh (`0x02`), Voronoi-cell seed fans (`0x02`), one max-area triangle per
  cell (`0x02`), and cell-oriented α-triangles composited over the floor
  (`0x03`). Also pins down Delaunay degeneracy handling: adaptive seeds land
  on the integer pixel lattice and must be decollided (dedupe + jitter)
  before Bowyer–Watson triangulation.
- **Exp 2 — Architecture showdown**: A: Layer0(64)→+128→+512 seeds;
  B: Layer0(64) → +128 Gaussian splats → +512 anisotropic ellipses;
  C: Layer0 → split Voronoi cells into triangle fans (edge index + colour per
  refinement triangle, from the persistent centroid); drive R-D / PSNR curves.
- **Exp 3 — Optimization efficiency**: analytic (laplacian var + edges) vs
  iterative (CVT/LLoyd) vs ML (differentiable backprop); profile encode time
  (s) vs reconstruction fidelity.
- **Exp 4 — Temporal / Adaptive**: sustained frame rate under a throttled
  bandwidth + fixed frame-time cap; SSIM/PSNR in upgrade and degrade regimes;
  temporal-flicker/popping metric for persistent seeds; adaptation latency and
  recovery time.

## Autonomous experiment harness (harness/)

Experiments above are executed by a headless Node harness that runs the
self-contained exp libraries (same pure-JS saliency/sampling/geometry/metric
code paths the browser uses — identical numbers, no DOM) over an image dataset
and feeds compact result summaries back to an LLM that selects the next batch.
It is designed to run unattended until all useful experiments are complete.

- **Scope**: Exp 1-a and Exp 1-b (the built floor-comparison experiments) first.
- **Dataset**: Kodak suite (24 PNGs) in `harness/data/kodak/` (gitignored).
- **Compute**: `harness/lib/engine.js` mirrors the browser pipeline
  (`sampleGray` → saliency → `computeField` → sampling → CVT → floor build →
  `renderCpuSync` → metrics) so PSNR/SSIM/ΔE/ΔE99/ΔE·sal/coverage/byte-cost
  match the on-screen readouts exactly.
- **Grid**: deterministic base sweep (image × style × budget) as the coverage
  floor; the LLM may propose validated refinements (finer budgets at R-D
  knees, CVT iteration sweeps, sample modes, splat alpha, AA, blend).
- **Orchestration**: `harness/loop.js` runs batches, regenerates a compact
  `summary.md`, invokes `opencode run` to choose the next batch or declare
  completion, validates/clamps the proposal, and repeats.
- **Results**: append-only `harness/results/results.jsonl` (raw rows,
  gitignored); `harness/state/findings.md` (LLM decision trail, gitignored);
  a committed human-readable report + CSV per experiment in
  `docs/experiments/` generated once on completion. Each report row carries a
  deep-link into the experiment page (`/exp/exp1-…/?…&img=…`) pre-loading that
  exact run (config query params + source image via `img`), so any recorded
  result can be re-inspected in the browser.
- **Termination**: base grid fully covered **and** LLM declares R-D curves /
  style rankings stable **and** safety caps (max iterations, max runs,
  no-progress guard) not exceeded.
- **Deferred**: Playwright/WebGPU runs to add real browser decode/render
  timing (Phase 2 of the harness).