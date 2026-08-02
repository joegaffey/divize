# DLPC Design

*The "how".* This file is intentionally thin — the detailed descriptions and the
authoritative byte layouts live in the **docs** folder (spec points to docs; the
reverse never happens). Read these first:

- [`docs/architecture.md`](../docs/architecture.md) — system architecture:
  encoder/decoder overview, layering, decode path, where compute lives.
- [`docs/dlpc-format.md`](../docs/dlpc-format.md) — the authoritative .dlpc
  container + packet layout.

## At-a-glance decisions

- **Layer 0 — structural floor.** Pure Voronoi voting. Guarantees 100% coverage
  with zero alpha/shape overhead; the terrain the viewer sees first.
- **Layer 1+ — refinement.** Adds global Voronoi seeds and/or alpha-blended
  splats/ellipses to sharpen selected regions.

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