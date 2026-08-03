'use strict';
/* Per-run archive. On completion (or on demand) copies the run's durable
 * artifacts into harness/archive/<run>/ and writes a README recording the
 * git HEAD and the code/methodology changes since the previous archived run,
 * so every sweep has a self-contained, committed record. */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const store = require('./store');
const grid = require('../grid');
const { buildReport } = require('./report');

const ARCHIVE_DIR = path.join(__dirname, '..', 'archive');

function gitHead() {
  try { return execSync('git rev-parse --short HEAD', { cwd: path.join(__dirname, '..', '..') }).toString().trim(); }
  catch { return 'unknown'; }
}

/* HEAD recorded in a previous archive's README (git log base for the diff). */
function headFromArchive(dirName) {
  const f = path.join(ARCHIVE_DIR, dirName, 'README.md');
  if (!fs.existsSync(f)) return null;
  const m = fs.readFileSync(f, 'utf8').match(/git HEAD:\s*`([^`]+)`/);
  return m ? m[1] : null;
}

function gitLogSince(prevHead) {
  if (!prevHead) return 'n/a — first archived run (no prior HEAD to diff against).';
  try {
    return execSync(`git log --oneline ${prevHead}..HEAD`, { cwd: path.join(__dirname, '..', '..'), encoding: 'utf8' })
      .trim() || 'no commits since previous run.';
  } catch { return 'could not compute diff (previous HEAD not in history).'; }
}

/* Most recent archive dir by name, if any. */
function lastArchive() {
  if (!fs.existsSync(ARCHIVE_DIR)) return null;
  const dirs = fs.readdirSync(ARCHIVE_DIR).filter((d) => /^\d{4}-\d{2}-\d{2}/.test(d)).sort();
  return dirs.length ? dirs[dirs.length - 1] : null;
}

function runName(now = new Date()) {
  return now.toISOString().slice(0, 19).replace(/[:T]/g, '-');
}

/* Methodology snapshot that can change between runs. */
function methodology() {
  return {
    exp1a: { styles: grid.BASE.exp1a.styles, budgets: grid.BASE.exp1a.budgets, modes: grid.BASE.exp1a.modes },
    exp1b: { styles: grid.BASE.exp1b.styles, budgets: grid.BASE.exp1b.budgets, modes: grid.BASE.exp1b.modes },
    primaryMode: grid.PRIMARY_MODE,
    engine: {
      previewMax: 480,
      cellMeanColors: true,
    },
    gridCells: grid.baseCells().length,
  };
}

function buildReadme(name, head, prevHead, rows) {
  const imgCount = new Set(rows.map((r) => r.image)).size;
  const byMode = {};
  for (const r of rows) byMode[r.mode || 'combined'] = (byMode[r.mode || 'combined'] || 0) + 1;
  return [
    `# Run archive ${name}`,
    '',
    `- rows: **${rows.length}** (${imgCount} images) · mode split: ${JSON.stringify(byMode)}`,
    `- git HEAD: \`${head}\` · archive created ${new Date().toISOString()}`,
    '',
    '## Changes since the previous run',
    '',
    '```',
    gitLogSince(prevHead),
    '```',
    '',
    '## Methodology (this run)',
    '',
    '```json',
    JSON.stringify(methodology(), null, 2),
    '```',
    '',
    '## Contents',
    '',
    '- `results.jsonl` — raw rows (gitignored in-place; archived here for permanence)',
    '- `exp1a-results.md` / `exp1a-results.csv` — exp 1-a report',
    '- `exp1b-results.md` / `exp1b-results.csv` — exp 1-b report',
    '- `findings.md` — LLM decision trail (if present at archive time)',
    '- `summary.md` — compact LLM summary (if present at archive time)',
    '',
  ].join('\n');
}

/* Write one run's archive. Returns the archive dir name. */
function archiveRun() {
  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  const name = runName();
  const prev = lastArchive();          // BEFORE creating the new dir
  const prevHead = prev ? headFromArchive(prev) : null;
  const dir = path.join(ARCHIVE_DIR, name);
  fs.mkdirSync(dir, { recursive: true });

  const head = gitHead();

  const rows = store.loadAll();
  // durable copy of the raw store
  fs.copyFileSync(store.RESULTS_FILE, path.join(dir, 'results.jsonl'));

  for (const exp of ['exp1a', 'exp1b']) {
    const { md, csv } = buildReport(exp, rows);
    fs.writeFileSync(path.join(dir, `${exp}-results.md`), md);
    fs.writeFileSync(path.join(dir, `${exp}-results.csv`), csv + '\n');
  }

  // LLM trail + summary, if present
  for (const f of ['findings.md', 'summary.md']) {
    const src = path.join(__dirname, '..', 'state', f);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(dir, f));
  }

  fs.writeFileSync(path.join(dir, 'README.md'), buildReadme(name, head, prevHead, rows));
  return name;
}

module.exports = { archiveRun, runName, lastArchive, ARCHIVE_DIR };
