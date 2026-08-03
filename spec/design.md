# DLPC Design

*The "how".* This file is intentionally thin — the detailed descriptions and the
authoritative byte layouts live in the **docs** folder (spec points to docs; the
reverse never happens). Read these first:

- [`docs/architecture.md`](../docs/architecture.md) — system architecture:
  encoder/decoder overview, layering, decode path, where compute lives.
- [`docs/dlpc-format.md`](../docs/dlpc-format.md) — the authoritative .dlpc
  container + packet layout.

## At-a-glance decisions

- **Layer 0 — structural floor.** Default is pure Voronoi voting: guarantees
  100% coverage with zero alpha/shape overhead. A tiled triangle-mesh floor and
  an α-triangle splat variant are being compared against it at equal byte
  budgets (exp1-a); the winning primitive pins the Layer-0 type
  ([`docs/dlpc-format.md`](../docs/dlpc-format.md) §0x02/0x03).
- **Layer 1+ — refinement.** Adds global Voronoi seeds and/or alpha-blended
  splats/ellipses to sharpen selected regions, or splits Voronoi cells into
  triangle fans from the persistent centroid (exp2 pipeline C).

### Metric-informed relaxation (proposed)

CVT moves seeds but never their colours (colours are re-sampled from the source
each pass), so reconstruction error **plateaus at a floor set by the seed
budget, not zero** — and that plateau is the convergence signal:

- ΔE keeps dropping per iteration → placement is the binding constraint.
- ΔE plateaus → further relaxation is wasted compute; the ceiling is seed
  *count*, not placement.

Planned auto-stop (Exp 1 / Exp 3): run Lloyd to a hard cap while tracking mean
seed displacement per iteration (nearly free — the centroids are already
computed), stop when displacement < ~0.1 px, and confirm with a low-res ΔE
checkpoint every k iterations; stop on either signal and report "converged at
N iters". A target-driven variant instead iterates until ΔE < a quality
threshold. Metric details: [`requirements.md`](./requirements.md) §Measurement
methodology.

## Temporal decisions

The spatial axis above lives on a temporal axis for moving imagery. Per-frame
intent (details in [`docs/architecture.md`](../docs/architecture.md) §5):

- **Baseline + tail:** every frame is a mandatory, high-priority **baseline
  block** (Layer-0 floor, ~200–500 B) plus an **interruptible tail** of detail
  micro-packets read only until the frame-time budget closes.
- **Budget-driven controller:** a shared encoder/decoder loop over render
  frame-time (ms) + bandwidth (kbps) decides **enhance** vs **degrade**.
- **Persistent seeds:** a keyframe lays seeds; delta frames carry only velocity
  vectors `(Δx, Δy)` so cells warp smoothly with no popping.
- **JIT interruption:** on timeout or drop, discard the pending tail, swap the
  buffer on time, and reset for the next frame.

The exact primitives, budgets, and bit packing are the subject of the experiments
defined in [`requirements.md`](./requirements.md) and scheduled in
[`tasks.md`](./tasks.md).