'use strict';
/* Generates the committed human-readable results report + CSV for an
 * experiment into docs/experiments/ (spec: Markdown + CSV, on completion).
 *
 *   node cli.js report [--exp exp1b] [--out docs/experiments/exp1b-results.md]
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const store = require('./store');
const { buildSummary } = require('./summarize');

const DOCS_DIR = path.join(__dirname, '..', '..', 'docs', 'experiments');

function gitHead() {
  try { return execSync('git rev-parse --short HEAD', { cwd: path.join(__dirname, '..', '..') }).toString().trim(); }
  catch { return 'unknown'; }
}
function fmt(v, d = 2) { return v == null || Number.isNaN(v) ? '—' : v.toFixed(d); }

function styleVerdict(exp, r) {
  const byStyle = Object.entries(r[exp] || {}).map(([style, byB]) => {
    const budgets = Object.keys(byB).sort((a, b) => +a - +b);
    const last = byB[budgets[budgets.length - 1]];
    return { style, budgets, best: byB[budgets[budgets.length - 1]] };
  });
  if (!byStyle.length) return 'No data.';
  byStyle.sort((a, b) => (a.best.de ?? Infinity) - (b.best.de ?? Infinity));
  const winner = byStyle[0];
  return `**${winner.style}** leads at the largest budget (mean ΔE ${fmt(winner.best.de)})`;
}

function mdTableFor(exp, r, metric) {
  const styles = Object.keys(r[exp] || {});
  if (!styles.length) return '*no rows yet*\n';
  const budgets = [...new Set(styles.flatMap((s) => Object.keys(r[exp][s])))].sort((a, b) => +a - +b);
  const head = '| style | ' + budgets.map((b) => `n=${b}`).join(' | ') + ' |';
  const sep = '|' + Array(budgets.length + 1).fill('---').join('|') + '|';
  const lines = [head, sep];
  for (const s of styles) {
    const cells = budgets.map((b) => {
      const q = r[exp][s][b];
      if (!q) return '—';
      switch (metric) {
        case 'psnr': return fmt(q.psnr) + ' dB';
        case 'ssim': return fmt(q.ssim, 4);
        case 'de': return fmt(q.de);
        case 'de99': return fmt(q.de99);
        case 'deSal': return fmt(q.deSal);
        case 'cov': return fmt(q.cov * 100, 1) + '%';
        case 'bytes': return fmt(q.bytes, 0) + ' B';
        case 'np': return fmt(q.np, 1);
        case 'ms': return fmt(q.msTotal, 1) + ' ms';
        default: return '—';
      }
    });
    lines.push(`| ${s} | ${cells.join(' | ')} |`);
  }
  return lines.join('\n');
}

/* Experiment page + image path for a run row. Links are relative to the
 * report's own directory (docs/experiments/), so `../../exp/...` resolves to
 * the repo-root `exp/...` both when served from the repo root locally and
 * when GitHub Pages serves the repo at a subpath (https://gh.io/divize/).
 * The `img` value is a local path (repo layout) — the experiment pages fall
 * back to the public r0k.us Kodak mirror if the local fetch 404s (the raw
 * images are gitignored and not published to Pages). */
function pageDir(exp) {
  return exp === 'exp1a' ? '../../exp/exp1-a-triangle-floor/' : '../../exp/exp1-b-triangle-variants/';
}
function runLink(row) {
  const q = [
    'style=' + encodeURIComponent(row.style),
    'budget=' + row.budget,
    'mode=' + encodeURIComponent(row.mode || 'combined'),
    'iters=' + (row.iters || 0),
    'autoCvt=' + (row.autoCvt ? 1 : 0),
    'triColor=' + encodeURIComponent(row.triColor || 'interp'),
    'splatAlpha=' + (row.splatAlpha != null ? row.splatAlpha : 0.8),
    'aa=' + (row.aa ? 1 : 0),
    'blend=' + (row.blend || 0),
    'progressive=' + (row.progressive || 100),
    'img=' + encodeURIComponent('../../harness/data/kodak/' + row.image),
  ];
  return `${pageDir(row.exp)}?${q.join('&')}`;
}

/* Per-run reproducible table: every recorded run gets a clickable link that
 * opens the experiment page pre-loaded with that exact config + image. */
function runsTable(rows) {
  if (!rows.length) return '*no runs yet*\n';
  const sorted = [...rows].sort((a, b) =>
    (a.image === b.image ? (a.style === b.style ? a.budget - b.budget : a.style < b.style ? -1 : 1) : a.image < b.image ? -1 : 1));
  const lines = [
    '| image | style | n | mode | PSNR | ΔE | bytes | open in browser |',
    '|---|---|---|---|---|---|---|---|',
  ];
  for (const r of sorted) {
    lines.push(`| ${r.image} | ${r.style} | ${r.budget} | ${r.mode || 'combined'} | ${fmt(r.psnr)} dB | ${fmt(r.de)} | ${fmt(r.bytes, 0)} B | [open](${runLink(r)}) |`);
  }
  return lines.join('\n');
}

function csvFor(exp, r) {
  const styles = Object.keys(r[exp] || {});
  const budgets = [...new Set(styles.flatMap((s) => Object.keys(r[exp][s])))].sort((a, b) => +a - +b);
  const cols = ['style', 'budget', 'images', 'psnr', 'ssim', 'de', 'de99', 'deSal', 'cov', 'bytes', 'np', 'msTotal'];
  const lines = [cols.join(',')];
  for (const s of styles) {
    for (const b of budgets) {
      const q = r[exp][s][b];
      if (!q) continue;
      lines.push([s, b, q.count, q.psnr, q.ssim, q.de, q.de99, q.deSal, q.cov, q.bytes, q.np, q.msTotal]
        .map((v) => (v === null || Number.isNaN(v) ? '' : v)).join(','));
    }
  }
  return lines.join('\n');
}

function buildReport(exp, rows) {
  const filtered = rows.filter((r) => r.exp === exp);
  const { md } = buildSummary(filtered);
  const r = require('./summarize').rollup(filtered);
  const numImages = new Set(filtered.map((x) => x.image)).size;
  return {
    md: [
      `# ${exp.toUpperCase()} results — DLPC`,
      '',
      `Generated ${new Date().toISOString()} · libs @ \`${gitHead()}\` · images: ${numImages}`,
      '',
      '## Verdict',
      '',
      styleVerdict(exp, r),
      '',
      '## Fidelity per budget (means over images)',
      '',
      '### PSNR (dB)',
      '', mdTableFor(exp, r, 'psnr'),
      '', '### SSIM',
      '', mdTableFor(exp, r, 'ssim'),
      '', '### Mean CIEDE2000 (ΔE)',
      '', mdTableFor(exp, r, 'de'),
      '', '### ΔE99',
      '', mdTableFor(exp, r, 'de99'),
      '', '### ΔE·sal (saliency-weighted)',
      '', mdTableFor(exp, r, 'deSal'),
      '', '### Rendered coverage',
      '', mdTableFor(exp, r, 'cov'),
      '', '### Payload bytes',
      '', mdTableFor(exp, r, 'bytes'),
      '', '### Avg encode time (ms)',
      '', mdTableFor(exp, r, 'ms'),
      '',
      '## Reproduce a run in the browser',
      '',
      'Every link below opens the experiment page with that exact run pre-loaded',
      '(config via query string, image via `img` param). Serve the repo root so',
      'the relative paths resolve, e.g. `python3 -m http.server` from the repo root,',
      'then click any row.',
      '',
      runsTable(filtered),
      '',
      '## CSV',
      '',
      '```csv',
      csvFor(exp, r),
      '```',
      '',
    ].join('\n'),
    csv: csvFor(exp, r),
  };
}

function main(args) {
  const a = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--exp') a.exp = args[++i];
    if (args[i] === '--out') a.out = args[++i];
  }
  const exp = a.exp || 'exp1b';
  const rows = store.loadAll();
  const { md, csv } = buildReport(exp, rows);
  fs.mkdirSync(DOCS_DIR, { recursive: true });
  const name = exp.replace(/^exp/, 'exp') + '-results';
  const mdPath = a.out || path.join(DOCS_DIR, `${exp}-results.md`);
  const csvPath = a.out ? a.out.replace(/\.md$/, '.csv') : path.join(DOCS_DIR, `${exp}-results.csv`);
  fs.writeFileSync(mdPath, md);
  fs.writeFileSync(csvPath, csv + '\n');
  console.log('wrote', mdPath);
  console.log('wrote', csvPath);
}

module.exports = { main, buildReport, csvFor, mdTableFor };
