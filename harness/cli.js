'use strict';
/* divize harness CLI.
 *
 *   node cli.js run-one <image> [--style s] [--budget n] [--mode m] [--iters n]
 *                          [--autoCvt] [--triColor interp|flat] [--splatAlpha a]
 *                          [--aa] [--blend b] [--progressive p] [--json]
 *   node cli.js batch   [--limit n] [--exp exp1a|exp1b] [--style s] [--json]
 *   node cli.js verify  [--image k] [--style s] [--budget n]   (golden checks)
 *   node cli.js report  [--exp exp1b]                            (docs/experiments)
 *   node cli.js loop    (autonomous LLM-guided loop)
 */

const path = require('path');
const fs = require('fs');
const { runCell, normalizeConfig, STYLES } = require('./lib/engine');
const store = require('./lib/store');
const grid = require('./grid');
const { cellKey } = grid;

const KODAK_DIR = grid.KODAK_DIR;

function parseArgs(argv) {
  const cfg = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const v = argv[i + 1];
      if (v !== undefined && !v.startsWith('--')) { cfg[k] = v; i++; }
      else cfg[k] = true;
    } else cfg._.push(a);
  }
  return cfg;
}

function resolveImage(name) {
  if (!name) throw new Error('run-one needs an image name (e.g. kodim01.png)');
  if (!/\.png$/.test(name)) name += '.png';
  const p = path.join(KODAK_DIR, name);
  if (!fs.existsSync(p)) throw new Error('image not found: ' + p);
  return p;
}

async function cmdRunOne(args) {
  const a = parseArgs(args);
  const image = resolveImage(a._[0]);
  const cfg = normalizeConfig({
    exp: a.exp || 'exp1b',
    style: a.style || 'voronoi',
    budget: a.budget != null ? +a.budget : 256,
    mode: a.mode || 'combined',
    iters: a.iters != null ? +a.iters : 0,
    autoCvt: !!a.autoCvt,
    triColor: a.triColor || 'interp',
    splatAlpha: a.splatAlpha != null ? +a.splatAlpha : 0.8,
    aa: !!a.aa, blend: a.blend != null ? +a.blend : 0,
    progressive: a.progressive != null ? +a.progressive : 100,
  });
  const row = await runCell(image, { ...cfg, image: path.basename(image) });
  row.configKey = cellKey({ ...cfg, image: path.basename(image) });
  if (a.json) { console.log(JSON.stringify(row, null, 2)); return; }
  console.log([
    row.image, row.style, 'n=' + row.budget, row.mode,
    'PSNR=' + row.psnr, 'SSIM=' + row.ssim, 'ΔE=' + row.de,
    'ΔE99=' + row.de99, 'ΔE·sal=' + row.deSal, 'cov=' + row.cov,
    'bytes=' + row.bytes, 'np=' + row.np, 't=' + row.msTotal + 'ms',
  ].join('  '));
}

async function cmdBatch(args) {
  const a = parseArgs(args);
  const limit = a.limit != null ? +a.limit : Infinity;
  const done = store.completedKeys(store.loadAll());
  let cells = grid.remainingBaseCells(done);
  if (a.exp) cells = cells.filter((c) => c.exp === a.exp);
  if (a.style) cells = cells.filter((c) => c.style === a.style);
  console.log(`batch: ${cells.length} base-grid cells remaining; running up to ${limit}`);
  const batch = cells.slice(0, limit);
  const rows = [];
  for (let i = 0; i < batch.length; i++) {
    const c = batch[i];
    const image = path.join(KODAK_DIR, c.image);
    try {
      const row = await runCell(image, c);
      row.image = c.image;
      row.configKey = cellKey(c);
      rows.push(row);
      store.appendRows([row]);
      console.log(`  [${i + 1}/${batch.length}] ${c.exp} ${c.image} ${c.style} n=${c.budget}  PSNR=${row.psnr} ΔE=${row.de} bytes=${row.bytes} (${row.msTotal}ms)`);
    } catch (e) {
      console.error(`  [${i + 1}/${batch.length}] FAIL ${c.exp} ${c.image} ${c.style} n=${c.budget}: ${e.message}`);
    }
  }
  console.log(`batch done: ${rows.length} new rows appended (${store.loadAll().length} total).`);
}

async function cmdVerify(args) {
  const a = parseArgs(args);
  const image = resolveImage(a.image || 'kodim01');
  const style = a.style || 'voronoi';
  const budget = a.budget != null ? +a.budget : 64;
  const cfg = { image: path.basename(image), style, budget, mode: 'combined' };
  const row = await runCell(image, cfg);
  console.log('golden cell:', cfg);
  console.log(JSON.stringify({
    psnr: row.psnr, ssim: row.ssim, de: row.de, de99: row.de99,
    deSal: row.deSal, cov: row.cov, bytes: row.bytes, np: row.np,
  }, null, 2));
  const golden = path.join(__dirname, 'golden', `golden-${path.basename(image)}-${style}-${budget}.json`);
  fs.mkdirSync(path.dirname(golden), { recursive: true });
  const want = JSON.stringify({ psnr: row.psnr, ssim: row.ssim, de: row.de, de99: row.de99,
    deSal: row.deSal, cov: row.cov, bytes: row.bytes, np: row.np }, null, 2);
  if (fs.existsSync(golden)) {
    const got = fs.readFileSync(golden, 'utf8').trim();
    if (got === want) console.log('PASS: matches golden ' + path.basename(golden));
    else { console.error('FAIL: differs from golden ' + path.basename(golden)); process.exitCode = 1; }
  } else {
    fs.writeFileSync(golden, want + '\n');
    console.log('wrote golden ' + path.basename(golden));
  }
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  switch (cmd) {
    case 'run-one': return cmdRunOne(rest);
    case 'batch': return cmdBatch(rest);
    case 'verify': return cmdVerify(rest);
    case 'report': return require('./lib/report').main(rest);
    case 'loop': return require('./loop').main(rest);
    default:
      console.log(require('fs').readFileSync(__filename, 'utf8').match(/ \*   (node cli[^\n]*)/g).map((s) => s.trim()).join('\n'));
  }
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
