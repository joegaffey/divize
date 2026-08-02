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
- **Exp 2 — Architecture showdown**: A: Layer0(64)→+128→+512 seeds;
  B: Layer0(64) → +128 Gaussian splats → +512 anisotropic ellipses; drive R-D /
  PSNR curves.
- **Exp 3 — Optimization efficiency**: analytic (laplacian var + edges) vs
  iterative (CVT/LLoyd) vs ML (differentiable backprop); profile encode time
  (s) vs reconstruction fidelity.
- **Exp 4 — Temporal / Adaptive**: sustained frame rate under a throttled
  bandwidth + fixed frame-time cap; SSIM/PSNR in upgrade and degrade regimes;
  temporal-flicker/popping metric for persistent seeds; adaptation latency and
  recovery time.