# DLPC Architecture

*Divisionist Layered Point Codec.* This document is the system architecture
description. Packet-level byte layouts live in
[`docs/dlpc-format.md`](./dlpc-format.md).

## 1. System Overview

DLPC is an **asymmetric, progressive image compression** architecture.

- **Encoder** uses high-compute optimization (analytical computer vision or ML)
  to turn a raster image into a sparse hierarchical point cloud.
- **Decoder** uses low-compute, parallelized GPU execution (WebGL/WebGPU, with a
  CPU fallback) to progressively render the image as byte streams arrive.

```
[Raster Input] ──> [Adaptive Encoder] ──> [Quantized Binary Stream] ──> [Network]
                                                                              │
[Screen Output] <── [GPU Shader Renderer] <── [Hierarchical Parser] <─────────┘
```

## 2. Layers & Progressivity

To maximize network efficiency the stream is split into distinct layer
definitions; decoders render Layer 0 for instant coverage, then blend refinement
layers as they arrive.

### Layer 0: The Structural Floor (Pure Voronoi)

Guarantees 100% canvas coverage with zero alpha or shape overhead — pure
nearest-neighbour Voronoi over a seed set.

- ~32–64 points (Experiment 1 tunes the budget).

### Layer 1+: Refinement Layers (Hybrid Voronoi or Geometric Splats)

Append detail either by adding global Voronoi seeds or by overlaying
alpha-blended geometric shapes (Gaussian splats / anisotropic ellipses),
targeting the areas that need sharpening the most.

- Exponential point scaling per pass (≈150–1024 points).

## 3. Decode Path

1. **Parse**: read/container header + Layer-0 floor, then each refinement layer.
2. **Render**: GPU nearest-neighbor / blended / anti-aliased cell shading
   prefers WebGPU, falls back to a CPU `ImageData` path, and consumes the feed,
   so encode / decode stay pixel-consistent.
3. **Embed**: the decoder is also distributed as a self-contained embeddable web
   component, [`<dlpc-player>`](../exp/dlpc-player/index.html), wrapping the same
   decode + render path so any page embeds a `.dlpc` with one `<script>` tag. It
   will gain the temporal (frame-paced) attributes in Phase 4.

The bit-level packing (coordinates, colors, deltas, shape/alpha) is specified in
[`docs/dlpc-format.md`](./dlpc-format.md).

## 4. Where the compute lives

Encode-time cost is deliberately high and unbounded (recipes to densify saliency +
CVT refinement + optional ML placement are the subject of Experiment 3).
Decode-time cost is deliberately low and bounded, parallel over pixels, decoupled
from the point count.

## 5. Temporal & Adaptive streaming

The structural layers above describe *spatial* detail, and they apply equally
to a still image and to one frame of a video: **video is simply a timed sequence
of image frames.** The per-frame spatial encode is unchanged — a keyframe is a
full image, and later frames are the same image primitive as a delta overlay. Only
the temporal scheduler differs, so this is one codec plus a frame-timing layer,
not two codecs. A second, orthogonal axis — the **temporal axis** — paces that
structure against real-time constraints, so the codec can serve moving /
interactive imagery at a locked frame rate. Here the meaning of a "layer" shifts:
a **layer becomes a temporal time-slice** (one frame of transmit work), while
Layer 0 / Layer 1+ remain the *structural* primitives the decoder builds.

A single frame is transmitted as two blocks:

- **Baseline block (mandatory).** The Layer-0 floor compressed to a tiny,
  high-priority chunk (~200–500 B). The decoder is required to parse and render
  this every frame. Even under severe congestion, the viewer gets a locked
  30/60 fps moving vector mosaic.
- **Opportunistic tail (interruptible).** A stream of micro-packets holding
  Layer-1+ detail (splats / sub-cells). The decoder reads this tail only until
  the frame-time budget is about to elapse; anything past the deadline is thrown
  away. At 60 fps (16.6 ms), most work must be done within ~14 ms and the buffer
  swapped.

### Budget loop

```
[New frame arrives] ──> Render Layer 0 baseline (mandatory)
                                │
               ┌────────────────┴────────────────┐
   [Budget remaining?]              [Frame budget expired!]
               │                                 │
               ▼                                 ▼
  Render tail (opportunistic        Drop pending bytes,
  detail enhancement)               swap buffers
                                    (graceful degradation)
```

The loop runs on **render frame-time (ms)** and **network packet-arrival rate
(kbps)**. Both encoder and decoder share the budget, so the complexity scale
moves with the device and the link.

### Enhance vs degrade

- **Degrade (slow link, dropped packet, GPU throttling/overheat):** the decoder
  detects the pressure for that frame, intentionally discards the rest of the
  tail, and forces an immediate buffer swap. Frame rate stays smooth; the image
  temporarily dials back to an abstract geometric style until resources free up —
  *just-in-time detail interruption*: cut losses, show what is built, refill for
  the next frame.
- **Enhance (high bandwidth, static scene):** when the baseline points barely
  change, Layer 0 renders almost instantly, leaving most of the slot open. The
  decoder opportunistically pulls thousands of extra splats from the queue,
  stacking fine detail until it hits the frame budget.

### Persistent Geometric Seeds (anti-flicker)

Recalculating seed positions per frame causes geometric "popping". Instead the
encoder keeps **persistent seeds**:

- **Frame 1 (keyframe):** transmit N base Voronoi points to establish the layout
  (this is today's Layer-0 floor + persistent seed ids).
- **Delta frames:** send only **velocity vectors** `(Δx, Δy)` for the existing
  seeds, so cell boundaries shift, bend, and warp to follow motion, rather than
  snapping to new positions. This removes temporal flicker and drops the footprint
  to a few bits per moving shape.

Encoder pre-emption rule (Phase 4): per-frame encode must be cut off at the
budget; the decoder floor must always fit in a single frame slot — so degradation
is realized purely by sending less, never by slowing the render.

The provisional byte layout for this axis lives in
[`docs/dlpc-format.md`](./dlpc-format.md).