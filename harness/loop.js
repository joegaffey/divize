'use strict';
/* The unattended orchestrator. Each iteration:
 *   1. Load results, build the compact summary (summary.md/json).
 *   2. Ask `opencode run` to choose the next batch: either propose cells
 *      (from the remaining deterministic base grid and/or refinements) or
 *      declare DONE.
 *   3. Validate/clamp/dedupe the proposal, execute it, append rows.
 *   4. Re-summarise and check termination.
 * The deterministic base grid is the coverage floor: if the LLM declares DONE
 * while base-grid cells remain, the loop keeps filling them (the LLM already
 * had every chance to prioritise them). Stops when grid is covered AND the
 * LLM is satisfied AND no safety cap (maxIterations / maxRuns / no-progress)
 * is hit.
 *
 *   node cli.js loop [--chunk N] [--maxIterations N] [--maxRuns N] [--exp X]
 */

const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const store = require('./lib/store');
const grid = require('./grid');
const summarize = require('./lib/summarize');
const { runCell, STYLES } = require('./lib/engine');

const ROOT = path.join(__dirname, '..');
const STATE_DIR = path.join(__dirname, 'state');
const NEXT_BATCH_FILE = path.join(STATE_DIR, 'next_batch.json');
const FINDINGS_FILE = path.join(STATE_DIR, 'findings.md');
const DONE_FILE = path.join(STATE_DIR, 'DONE');
const KODAK_DIR = grid.KODAK_DIR;

const VALID_MODES = ['combined', 'edge', 'lapvar', 'uniform'];
const VALID_TRI = ['interp', 'flat'];
const MAX_BATCH = 25;
const BASE_CHUNK = 40; // how many grid cells we run per LLM round-trip while covering the floor

function log(...a) { console.log('[' + new Date().toISOString().slice(11, 19) + ']', ...a); }

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--chunk') a.chunk = +argv[++i];
    else if (argv[i] === '--maxIterations') a.maxIterations = +argv[++i];
    else if (argv[i] === '--maxRuns') a.maxRuns = +argv[++i];
    else if (argv[i] === '--exp') a.exp = argv[++i];
  }
  return a;
}

function clampCell(c) {
  if (!c || typeof c !== 'object') return null;
  const style = STYLES.includes(c.style) ? c.style : null;
  const mode = VALID_MODES.includes(c.mode) ? c.mode : 'combined';
  const triColor = VALID_TRI.includes(c.triColor) ? c.triColor : 'interp';
  if (!style) return null;
  const budget = Math.max(8, Math.min(16384, Math.round(+c.budget || 256)));
  const iters = Math.max(0, Math.min(200, Math.round(+c.iters || 0)));
  return {
    exp: c.exp === 'exp1a' ? 'exp1a' : 'exp1b',
    image: String(c.image || '').replace(/\.png$/, '') + '.png',
    style, mode, budget, iters,
    autoCvt: !!c.autoCvt, triColor,
    splatAlpha: Math.max(0.1, Math.min(1, +c.splatAlpha || 0.8)),
    aa: !!c.aa, blend: Math.max(0, Math.min(1, +c.blend || 0)),
    progressive: Math.max(1, Math.min(100, Math.round(+c.progressive || 100))),
  };
}

async function executeBatch(cells, doneKeys) {
  const rows = [];
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i];
    const key = grid.cellKey(c);
    if (doneKeys.has(key)) continue;
    const imgPath = path.join(KODAK_DIR, c.image);
    if (!fs.existsSync(imgPath)) { log('skip missing image', c.image); continue; }
    try {
      const t0 = Date.now();
      const row = await runCell(imgPath, c);
      row.configKey = key;
      store.appendRows([row]);
      rows.push(row);
      doneKeys.add(key);
      log(`+ ${c.exp} ${c.image} ${c.style} n=${c.budget} mode=${c.mode}  PSNR=${row.psnr} ΔE=${row.de} bytes=${row.bytes} (${Date.now() - t0}ms)`);
    } catch (e) {
      log('FAIL', c.exp, c.image, c.style, c.budget, '—', e.message);
    }
  }
  return rows;
}

function askOpenCode(remainingCount, summaryMdPath, findingsPath) {
  const prompt = [
    'You are the experiment-selection brain for the divize DLPC harness.',
    'Read harness/state/summary.md (compact results rollup) and',
    'harness/state/findings.md (your accumulated analysis).',
    `There are ${remainingCount} deterministic base-grid cells still unrun.`,
    '',
    'Choose ONE action:',
    '',
    'A) Propose the next batch. Write harness/state/next_batch.json:',
    '   {"decision":"batch","reason":"...",',
    '    "batch":[{"exp":"exp1b","style":"voro-fan","budget":96,"mode":"combined",',
    '              "iters":0,"autoCvt":false,"triColor":"interp","splatAlpha":0.8,',
    '              "aa":false,"blend":0,"progressive":100,"image":"kodim01.png"}]}',
    '   Up to 25 cells. Prefer still-unrun base-grid cells (exp1a styles',
    '   voronoi/tri-tiled/tri-splat and exp1b styles voronoi/delaunay/',
    '   voro-fan/cell-tris/tri-gauss, budgets 16..256, modes combined/edge/',
    '   lapvar/uniform, images kodim01..24) so the coverage floor closes.',
    '   You may also add refinements (finer budgets, CVT iters, splatAlpha,',
    '   aa, blend) to answer open R-D questions. Do not repeat already-run',
    '   (exp,image,style,budget,mode,...) combos.',
    '',
    'B) Declare completion: write {"decision":"done","reason":"..."} to',
    '   harness/state/next_batch.json. Only when R-D curves are stable and',
    '   the primitive ranking is robust.',
    '',
    'Append a short paragraph of analysis to harness/state/findings.md.',
    'Do NOT modify any source code. Reply with a one-line summary.',
  ].join('\n');
  const res = spawnSync('opencode', ['run', '--format', 'json', '--title', 'divize-harness-batch', prompt], {
    cwd: ROOT, encoding: 'utf8', timeout: 900000, maxBuffer: 64 * 1024 * 1024,
  });
  if (res.error) throw res.error;
  log('opencode run exit', res.status);
}

function readProposal() {
  if (!fs.existsSync(NEXT_BATCH_FILE)) return null;
  try { return JSON.parse(fs.readFileSync(NEXT_BATCH_FILE, 'utf8')); } catch { return null; }
}

function ensureFindings() {
  if (!fs.existsSync(FINDINGS_FILE)) fs.writeFileSync(FINDINGS_FILE, '# findings\n\n');
}

function markDone(reason) {
  fs.writeFileSync(DONE_FILE, JSON.stringify({ reason, at: new Date().toISOString() }, null, 2));
}

async function main(argv) {
  const a = parseArgs(argv);
  const maxIterations = a.maxIterations || 1000;
  const maxRuns = a.maxRuns || 5000;
  const expFilter = a.exp || null;
  fs.mkdirSync(STATE_DIR, { recursive: true });
  ensureFindings();

  let iterations = 0;
  let noProgressStreak = 0;

  while (iterations < maxIterations) {
    iterations++;
    const done = store.completedKeys(store.loadAll());
    const rowCount = store.loadAll().length;
    let remaining = grid.remainingBaseCells(done);
    if (expFilter) remaining = remaining.filter((c) => c.exp === expFilter);
    log(`iteration ${iterations}: ${rowCount} rows, ${remaining.length} base cells remaining`);

    // If base grid remains, run a deterministic chunk of it each round so the
    // coverage floor closes even if the LLM focuses on refinements.
    let cells = [];
    if (remaining.length) {
      cells = remaining.slice(0, BASE_CHUNK);
      log(`filling ${cells.length} base-grid cells (floor first); still asking LLM next round`);
    } else {
      log('base grid covered; consulting opencode for refinements…');
      summarize.writeSummary(store.loadAll());
      askOpenCode(0, summarize.SUMMARY_MD, FINDINGS_FILE);
      const prop = readProposal();
      fs.rmSync(NEXT_BATCH_FILE, { force: true });
      if (!prop) { log('no proposal returned; aborting'); break; }
      if (prop.decision === 'done') {
        log('LLM declared DONE:', (prop.reason || '').slice(0, 200));
        markDone(prop.reason || 'LLM DONE');
        break;
      }
      if (prop.decision !== 'batch' || !Array.isArray(prop.batch)) {
        log('malformed proposal:', JSON.stringify(prop).slice(0, 200));
        markDone('malformed proposal');
        break;
      }
      cells = prop.batch.map(clampCell).filter(Boolean)
        .filter((c) => !expFilter || c.exp === expFilter);
    }

    if (cells.length) {
      const before = store.loadAll().length;
      const newRows = await executeBatch(cells.slice(0, MAX_BATCH), done);
      noProgressStreak = newRows.length ? 0 : noProgressStreak + 1;
      log(`batch done: +${newRows.length} rows (${store.loadAll().length} total)`);
      summarize.writeSummary(store.loadAll());
      if (store.loadAll().length >= maxRuns) { log('maxRuns reached', maxRuns); break; }
      if (noProgressStreak >= 3 && store.completedKeys(store.loadAll()).size >= rowCount && !grid.remainingBaseCells(store.completedKeys(store.loadAll())).length) {
        log('no-progress guard: no new cells and grid covered; stopping');
        markDone('no-progress guard');
        break;
      }
      continue;
    }

    if (!grid.remainingBaseCells(store.completedKeys(store.loadAll())).length) {
      log('grid fully covered and no further proposal; stopping');
      markDone('grid covered, no proposal');
      break;
    }
  }

  log('loop finished after', iterations, 'iterations;', store.loadAll().length, 'rows total.');
}

module.exports = { main };
