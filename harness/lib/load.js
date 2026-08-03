'use strict';
/* Loads the self-contained exp1-b experiment libs into the Node global scope
 * by shimming `window`. These are the exact files the browser runs, so metric
 * code paths (saliency, sampling, geometry, CIEDE2000, SSIM) are identical.
 * Only exp1-b's copies are loaded: they are a superset that also carries every
 * exp1-a export (sampleEngine.delaunay/triangleMesh/splatParams + metric). */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const LIB_DIR = path.join(__dirname, '..', '..', 'exp', 'exp1-b-triangle-variants', 'js');
const ORDER = ['saliency.js', 'sampling.js', 'geometry.js', 'metric.js', 'export.js'];

function loadLibs() {
  if (global.__divizeLibsLoaded) return global.__divizeLibs;
  const sandbox = { window: globalThis, console, setTimeout, clearTimeout };
  sandbox.global = sandbox.window;
  vm.createContext(sandbox);
  for (const f of ORDER) {
    const src = fs.readFileSync(path.join(LIB_DIR, f), 'utf8');
    vm.runInContext(src, sandbox, { filename: f });
  }
  global.__divizeLibs = {
    gray: sandbox.window.gray,
    sampleEngine: sandbox.window.sampleEngine,
    geometry: sandbox.window.geometry,
    metric: sandbox.window.metric,
    dlpcExport: sandbox.window.dlpcExport,
  };
  global.__divizeLibsLoaded = true;
  return global.__divizeLibs;
}

module.exports = { loadLibs };
