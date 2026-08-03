'use strict';
/* Base sweep specification + cell enumerator. The deterministic grid is the
 * coverage floor the loop must fill; the LLM proposes refinements beyond it.
 * A "cell" is the full config object for one run. */

const path = require('path');
const fs = require('fs');

const KODAK_DIR = path.join(__dirname, 'data', 'kodak');
const STYLES_1A = ['voronoi', 'tri-tiled', 'tri-splat'];
const STYLES_1B = ['voronoi', 'delaunay', 'voro-fan', 'cell-tris', 'tri-gauss'];

/* Base grid defaults — tuned to the spec work-packages (equal byte budgets,
 * no CVT for the floor-comparison baseline). Budgets span the blocky floor
 * (16) through recognizable reconstructions (1024–2048) so the R-D curve
 * covers usable quality. Modes sweep both operating points: `uniform` (the
 * empirically better sampler, default/primary) and `combined` saliency, so
 * the mode question is settled deterministically rather than by thin probes. */
const BASE = {
  exp1a: {
    styles: STYLES_1A,
    budgets: [16, 32, 64, 128, 256, 512, 1024, 2048],
    modes: ['uniform', 'combined'],
  },
  exp1b: {
    styles: STYLES_1B,
    budgets: [16, 32, 64, 128, 256, 512, 1024, 2048],
    modes: ['uniform', 'combined'],
  },
};

/* The primary operating mode. Mode-aware termination requires this mode's
 * base grid to be covered before the LLM can declare DONE. */
const PRIMARY_MODE = 'uniform';

const DEFAULT_PARAMS = {
  mode: PRIMARY_MODE, iters: 0, autoCvt: false,
  triColor: 'interp', splatAlpha: 0.8, aa: false, blend: 0, progressive: 100,
};

function kodakImages() {
  if (!fs.existsSync(KODAK_DIR)) return [];
  let files = fs.readdirSync(KODAK_DIR)
    .filter((f) => /^kodim\d+\.png$/.test(f))
    .sort();
  if (process.env.HARNESS_IMAGES) {
    const want = new Set(process.env.HARNESS_IMAGES.split(',').map((s) => s.trim()).filter(Boolean));
    files = files.filter((f) => want.has(f) || want.has(f.replace(/\.png$/, '')));
  }
  return files;
}

/* Expand the deterministic base grid into a list of cell configs. Ordering:
 * per experiment, per image, per mode (primary first), then style × budget —
 * so an image's uniform cells complete before its combined cells, letting a
 * partial run still close the primary mode's coverage floor. */
function baseCells() {
  const imgs = kodakImages();
  const out = [];
  for (const [exp, spec] of Object.entries(BASE)) {
    for (const img of imgs) {
      for (const mode of spec.modes) {
        for (const style of spec.styles) {
          for (const budget of spec.budgets) {
            out.push({ exp, image: img, style, budget, ...DEFAULT_PARAMS, mode });
          }
        }
      }
    }
  }
  return out;
}

/* Cell identity key — stable ordering so dedupe across runs is exact. */
function cellKey(c) {
  return [c.exp, c.image, c.style, c.budget, c.mode, c.iters, c.autoCvt ? 1 : 0,
    c.triColor, c.splatAlpha, c.aa ? 1 : 0, c.blend, c.progressive].join('|');
}

/* Given the set of already-completed cells (from results), return the list of
 * base-grid cells still unrun, preserving grid order. Optionally restrict to
 * a single sampling mode (used for mode-aware termination). */
function remainingBaseCells(completedKeys, mode) {
  return baseCells().filter((c) => (!mode || c.mode === mode) && !completedKeys.has(cellKey(c)));
}

module.exports = { baseCells, cellKey, remainingBaseCells, kodakImages, DEFAULT_PARAMS, PRIMARY_MODE, BASE, KODAK_DIR };
