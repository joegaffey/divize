# divize harness — headless experiment sweeps + LLM-guided selection

Runs the DLPC floor-comparison experiments (exp1-a, exp1-b) headlessly in Node
and lets an LLM pick which experiments to run next, unattended until all useful
experiments are complete.

## How it works

The experiment pages compute PSNR/SSIM/ΔE/ΔE99/ΔE·sal, coverage, and byte cost
from **pure-JS** code (`saliency.js`, `sampling.js`, `geometry.js`, `metric.js`,
`export.js`) that has no DOM dependencies — only the render/wipe/export UI is
browser-bound. This harness loads those exact files through a `window` shim and
re-runs the same pipeline in Node, so the numbers match the browser's on-screen
readouts (subject only to RNG: a seeded PRNG keeps runs reproducible). Floor
colours are **cell-mean**: each Voronoi cell is filled with the mean colour of
its source pixels (`sampleEngine.cellMeanColors`) rather than a single seed
pixel, worth ~1.5–3.5 dB PSNR over `pointColors` on Kodak.

```
engine.js  runCell(image, config) -> one result row        (mirrors main.js)
grid.js    deterministic base sweep (coverage floor)
store.js   append-only results.jsonl (resumable)
summarize.js  compact summary.md/json fed to the LLM each iteration
loop.js    orchestrator: batch -> opencode run -> validate -> repeat
report.js  committed docs/experiments/*.md + .csv (on completion)
archive.js per-run snapshot: jsonl + reports + findings + README (git diff since last)
```

## Setup

```bash
cd harness
npm install                 # pngjs (only dependency)
npm run fetch-kodak         # 24 Kodak PNGs into data/kodak/
```

## Commands

```bash
node cli.js run-one kodim01 --style voronoi --budget 64     # single run
node cli.js verify --image kodim01 --style voronoi --budget 64   # golden check
node cli.js batch --limit 20                                # fill base grid
node cli.js loop [--maxIterations N] [--maxRuns N]          # autonomous loop
node cli.js report --exp exp1b                              # committed report
```

`cli.js loop` is the unattended orchestrator:
1. Runs the remaining deterministic base-grid cells in chunks (the coverage
   floor; no LLM cost while closing it).
2. Once covered, invokes `opencode run` with the compact `state/summary.md`
   + `state/findings.md`, asking it to write `state/next_batch.json` — either a
   validated list of refinement cells or `{"decision":"done"}`.
3. Clamps/dedupes the proposal, executes it, re-summarises, repeats.
4. Stops when the grid is covered AND the LLM declares completion AND no
   safety cap (maxIterations / maxRuns / no-progress) is hit.

The LLM never runs commands — it only writes a schema-validated config list.

On completion the loop automatically archives the run to
`harness/archive/<timestamp>/` (committed): a copy of `results.jsonl`, the
exp1-a/exp1-b reports + CSVs, the LLM findings/summary, and a `README.md`
recording the git HEAD and the commit diff since the previous archived run —
so every sweep keeps a self-contained record even though the live store is
gitignored and gets cleared before the next run.

## Config space

- **exp1a**: styles `voronoi`, `tri-tiled`, `tri-splat`; base budgets
  16–2048 (16, 32, 64, 128, 256, 512, 1024, 2048).
- **exp1b**: styles `voronoi`, `delaunay`, `voro-fan`, `cell-tris`, `tri-gauss`;
  base budgets 16–2048.
- **Base modes**: the grid sweeps `uniform` (primary/default) **and** `combined`
  saliency, so the mode question is settled deterministically. The loop refuses
  to declare DONE until the `uniform` grid is fully covered (mode-aware
  termination).
- Refinements may vary: mode (`combined|edge|lapvar|uniform`), CVT iters
  (0–200), `autoCvt`, `triColor`, `splatAlpha`, `aa`, `blend`, `progressive`.
- `cli.js loop --workers N` runs cells in parallel worker threads (default:
  number of CPU cores) — worthwhile for the slow high-budget cells.

## Files

- `results/results.jsonl` — raw rows (gitignored)
- `state/summary.{md,json}`, `state/findings.md`, `state/next_batch.json`, `state/DONE` — loop state (gitignored)
- `golden/` — golden metric checks (gitignored)
- `docs/experiments/exp1*-results.{md,csv}` — committed reports (on completion)

## Reproducing a run in the browser

Each row of the report links to the experiment page with that exact run
pre-loaded: config is passed as query params (`style`, `budget`, `mode`,
`iters`, `autoCvt`, `triColor`, `splatAlpha`, `aa`, `blend`, `progressive`)
and the source image is fetched via `img`. Serve the repo root with a
Node-based static server (the pages rely on clean directory URLs) and click
any `[open]` link:

```bash
npx serve .       # from the repo root
```

The experiment pages (`exp/exp1-a-triangle-floor/`, `exp/exp1-b-triangle-variants/`)
parse these params on load; `img` is relative to the web root.
