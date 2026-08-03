# DLPC Binary Container Format (v0.1)

A little-endian, layer-based streaming format for the Divisionist Layered
Point Codec. Decoders render progressively: apply Layer 0 to guarantee
coverage, then blend subsequent layers as they arrive.

All integers are little-endian. Prefix the file with the 5-byte magic
`DLPC 00` (ASCII `DLPC` + format version byte).

## Layout (v0.1, Layer 0 only)

| Offset | Size | Field | Notes |
|--------|------|-------|-------|
| 0  | 4 | magic | `"DLPC"` (0x44 0x4C 0x47 0x43) |
| 4  | 1 | version | `0x00` |
| 5  | 2 | width  | u16 image width (working res) |
| 7  | 2 | height | u16 image height |
| 9  | 1 | layer count | number of layer blocks that follow = 1 |
| 10 | 1 | layer 0 type | `0x01` Voronoi floor · `0x02` tiled mesh · `0x03` α-triangle splat |
| 11 | 2 | layer 0 primitive count | u16 N (seeds, or triangles for 0x02/0x03) |
| 13 | — | layer 0 payload | varies by type (see below) |

### Layer 0 packet — Pure Voronoi floor (5 bytes)

| Byte | Field | Notes |
|------|-------|-------|
| 0 | x | u8 `0..255` → `x_px = (x+0.5)/256 * W` |
| 1 | y | u8 `0..255` → `y_px = (y+0.5)/256 * H` |
| 2 | r | u8 colour |
| 3 | g | u8 |
| 4 | b | u8 |

Guarantees 100% coverage with zero alpha/shape overhead (see
[`docs/architecture.md`](./architecture.md), Layer 0).

### Layer 0 packet — Tiled triangle mesh floor (type `0x02`, experimental)

An indexed triangle mesh over the same seed centres, Delaunay-triangulated so it
shares the Layer-0 guarantee: 100% coverage with no alpha. Vertices are shared
across triangles, so they are stored once and referenced by index — a
3-vertex-per-packet layout would pay the duplicate-coordinate cost.

Because the Delaunay hull of interior seeds lies strictly inside the image, the
encoder closes the mesh to the frame with **frame vertices**: the 4 image
corners plus edge midpoints, coloured from their nearest real seed (the Voronoi
floor colour). These appear in V like any other vertex; they add a small fixed
overhead but are what makes the primitive tiling exact.

The generic layer header carries `count = T` (triangle count); the mesh adds a
sub-header:

| Offset | Size | Field | Notes |
|--------|------|-------|-------|
| 0  | 2 | vertex count | u16 V |
| 2  | 1 | flags | bit0 = 1 per-vertex colour (barycentric), 0 per-triangle flat colour |
| 3  | 2V | vertex positions | V × `{x u8, y u8}` (flat) |
| 3  | 5V | vertex records | V × `{x u8, y u8, r u8, g u8, b u8}` (barycentric) |
| — | 9T | triangle records (flat) | T × `{a u16, b u16, c u16, r u8, g u8, b u8}` |
| — | 6T | triangle records (barycentric) | T × 3 × `u16` vertex indices |

So flat mode costs `3 + 2V + 9T` bytes; barycentric costs `3 + 5V + 6T`. (No
colour is wasted on vertices in flat mode, and no per-triangle colour is sent
when vertex colours already carry it.)

Coordinates use the same mapping as the Voronoi floor: `0..255` →
`x_px = (x+0.5)/256 * W`. With per-vertex colours the fragment colour is the
barycentric blend of the triangle's three vertex colours; flat mode emits the
recorded colour directly.

### Layer 0 packet — Alpha triangle splat floor (type `0x03`, experimental)

Non-tiling, center-anchored triangles with a per-primitive transform + alpha.
Gaps are expected; the decoder fills the backdrop (mean colour, or the Voronoi
floor) beneath them, so this variant trades the coverage guarantee for
expressive overlap and shading.

| Byte | Field | Notes |
|------|-------|-------|
| 0 | x | u8 centre → `(x+0.5)/256 * W` |
| 1 | y | u8 |
| 2 | size | u8 → `size_px = (size/255) * min(W,H)` |
| 3 | angle | u8 → `value/255 * π` |
| 4 | alpha | u8 → `0..255` |
| 5 | r | u8 colour |
| 6 | g | u8 |
| 7 | b | u8 |

Decode renders splats back-to-front in stream order with `src-over`
compositing over the backdrop.

## Reserved — Layer 1+ (8-byte packets, v0.1 +extensions)

| Offset | Size | Field | Notes |
|--------|------|-------|-------|
| 0 | 2 | Δx | s16 offset from parent cell centre |
| 2 | 2 | Δy | s16 |
| 4 | 2 | scale x, scale y | each 1 byte, log-compressed |
| 6 | 1 | angle | u8 → `angle = value/255 * π` |
| 7 | 1 | alpha+shape | 4 bits opacity, 4 bits shape/identity |
| 8 | 3 | Δr, Δg, Δb | signed deltas vs parent colour |
| 11 | — | shape params | per-shape payload |

Spec §32 layout; final packing deferred to a later experiment.

## Temporal / Adaptive streaming extension (provisional, v0.2)

The single-frame container above is the *spatial* side. A temporal extension
paces the same structure against a real-time budget for moving imagery. The byte
tables here are **provisional** — block types, ordering, and sizes are to be
pinned down in the temporal effort described in
[`docs/architecture.md`](./architecture.md) — and all rely on the definition
of "layer as a time-slice".

### Frame model

Every transmitted frame has two regions:

- **Baseline block (mandatory):** the Layer-0 floor compressed small
  (~200–500 B), plus the persistent seed ids. The decoder must parse and render
  this each frame, guaranteeing a locked 30/60 fps abstract mosaic.
- **Opportunistic tail (interruptible):** micro-packets of Layer-1+ detail
  (splats / sub-cells). Read only until the frame-time budget closes; anything
  past the deadline is discarded (JIT detail interruption).

### Frame kinds

- **Keyframe** (e.g. frame 1): establishes seed *positions* (reuse the Layer-0
  5-byte floor) and assigns each a persistent `seed id`.
- **Delta frame:** does **not** re-send positions. It sends per-seed **velocity
  vectors** only, so cells warp/bend smoothly with no popping.

### Provisional delta-frame layout

| Offset | Size | Field | Notes |
|--------|------|-------|-------|
| 0 | 1 | kind + flags | bits: 0=keyframe/1=delta; tail present; seed-rebuild |
| 1 | 2 | baseline length | u16 bytes of mandatory block |
| 3 | 2 | delta-frame seed count | u16 M |
| 5 | 3M | persistent-seed deltas | M × 3 bytes, see below |
| 5+3M | — | optional tail | interruptible detail micro-packets |

### Persistent-seed delta packet (3 bytes, provisional)

| Byte | Field | Notes |
|------|-------|-------|
| 0 | seed id (or index) | which persistent seed this moves |
| 1 | Δx | signed quantized velocity (`-127..127`) |
| 2 | Δy | signed quantized velocity |

Optionally a `born/die` bit reserved in flags for seeds entering/leaving the
scene. Byte counts are a starting estimate; the encoder may drop the frame to
coarse-only when the budget is tight (degrade) or pour more splats into the tail
when there is headroom (enhance).

### Decoder contract

Once the frame-time budget elapses (or a packet drops), the decoder discards the
rest of the pending tail, swaps buffers to show the geometry built so far, and
resets its state for the next incoming frame. This keeps frame rate smooth while
the picture briefly dials back to an abstract geometric style.