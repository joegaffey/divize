# DLPC Requirements

*Divisionist Layered Point Codec — the "what" and "why".* Scope, goals,
constraints, and the measurable targets that tell us the codec is working.

## Purpose

DLPC is an asymmetric, progressive **image and video** compression architecture: a
high-compute encoder turns raster(s) into a sparse point cloud, and a low-compute
GPU decoder renders it progressively as bytes arrive. Video is treated as a timed
sequence of image frames (one codec + a frame-timing layer, not two).

## Goals

- **Asymmetric workload** — spend compute at encode time; keep the decoder small,
  parallel, and browser-friendly (WebGPU/WebGL, CPU fallback).
- **Progressive** — the first bytes must give a recognizable image; later layers
  sharpen only where detail is needed.
- **Frugal packets** — Layer 0 guarantees full-coverage tone-floor with zero alpha
  or shape overhead.
- **Adaptive frame-paced streaming** — for moving/interactive imagery, each frame
  is bounded by a **frame-time budget**: when budget/bandwidth allow, send diff
  data and **opportunistically enhance** detail for the next frame; when they
  don't, **gracefully degrade** (drop refinement, still hold the frame rate).
- **Temporal coherence** — **persistent geometric seeds** with velocity-driven
  deltas so cells warp smoothly between frames; no geometric "popping".

## Constraints

- Decoder must run on constrained devices (mobile GPU), so decode-time cost must
  be low, bounded, and decoupled from point count.
- Encode-time cost is unbounded by design (see milestones for the specific ranges).
- Per-frame encode must be **pre-emptible at the budget**; a decode floor must
  always fit in a single frame slot, so degradation is realized by sending less
  rather than by slowing the render.
- Decoder must apply **JIT detail interruption**: on timeout or drop, discard the
  pending tail, swap buffers on time, and reset for the next frame.

## Measurable acceptance targets

Success is a rate–distortion curve and a semantic-recognition threshold, not
subjective quality. These are the measurable "magic numbers" to pin down:

1. **Minimum Layer-0 point count** for semantic scene recognition (Exp 1).
2. **Fidelity per kilobyte** as refinement bandwidth scales (Exp 2).
3. **Encoding speed vs reconstruction fidelity** for analytic vs iterative vs ML
   placement (Exp 3).
4. **Sustained frame rate under constraint** (Exp 4) — given a throttled
   bandwidth and a fixed frame-time cap, reach a target fps; report SSIM/PSNR in
   both the upgrade and degrade regimes; measure temporal-flicker/popping for the
   persistent-seed model; and measure adaptation latency / recovery time.

Each acceptance target maps to a work-package in [`tasks.md`](./tasks.md) — which
carries the dataset, metrics, and execution plan — while the system that delivers
them is described in [`design.md`](./design.md).