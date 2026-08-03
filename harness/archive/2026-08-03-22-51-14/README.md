# Run archive 2026-08-03-22-51-14

- rows: **3164** (24 images) · mode split: {"uniform":1628,"combined":1536}
- git HEAD: `6c667ba` · archive created 2026-08-03T22:51:14.090Z

## Changes since the previous run

```
n/a — first archived run (no prior HEAD to diff against).
```

## Methodology (this run)

```json
{
  "exp1a": {
    "styles": [
      "voronoi",
      "tri-tiled",
      "tri-splat"
    ],
    "budgets": [
      16,
      32,
      64,
      128,
      256,
      512,
      1024,
      2048
    ],
    "modes": [
      "uniform",
      "combined"
    ]
  },
  "exp1b": {
    "styles": [
      "voronoi",
      "delaunay",
      "voro-fan",
      "cell-tris",
      "tri-gauss"
    ],
    "budgets": [
      16,
      32,
      64,
      128,
      256,
      512,
      1024,
      2048
    ],
    "modes": [
      "uniform",
      "combined"
    ]
  },
  "primaryMode": "uniform",
  "engine": {
    "previewMax": 480,
    "cellMeanColors": true
  },
  "gridCells": 3072
}
```

## Contents

- `results.jsonl` — raw rows (gitignored in-place; archived here for permanence)
- `exp1a-results.md` / `exp1a-results.csv` — exp 1-a report
- `exp1b-results.md` / `exp1b-results.csv` — exp 1-b report
- `findings.md` — LLM decision trail (if present at archive time)
- `summary.md` — compact LLM summary (if present at archive time)
