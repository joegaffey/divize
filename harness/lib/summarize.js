'use strict';
/* Turns the raw results JSONL into a compact LLM-facing summary. The summary is
 * deliberately small (a few KB) — it's what opencode run reads each iteration.
 * Emits summary.json (machine rollups) + summary.md (human/LLM). */

const path = require('path');
const fs = require('fs');
const store = require('./store');

const STATE_DIR = path.join(__dirname, '..', 'state');
const SUMMARY_MD = path.join(STATE_DIR, 'summary.md');
const SUMMARY_JSON = path.join(STATE_DIR, 'summary.json');

function mean(xs) { if (!xs.length) return null; return xs.reduce((a, b) => a + b, 0) / xs.length; }

/* Roll up rows -> { exp: { style: { budget: { mean* over images } } } } */
function rollup(rows) {
  const groups = {};
  for (const r of rows) {
    const k = [r.exp, r.style, r.budget].join('|');
    (groups[k] = groups[k] || []).push(r);
  }
  const out = {};
  for (const [k, rs] of Object.entries(groups)) {
    const [exp, style, budget] = k.split('|');
    const q = {
      count: rs.length,
      images: rs.length,
      psnr: mean(rs.map((r) => r.psnr)),
      ssim: mean(rs.map((r) => r.ssim)),
      de: mean(rs.map((r) => r.de)),
      de99: mean(rs.map((r) => r.de99)),
      deSal: mean(rs.map((r) => r.deSal === null ? NaN : r.deSal)),
      cov: mean(rs.map((r) => r.cov)),
      bytes: mean(rs.map((r) => r.bytes)),
      np: mean(rs.map((r) => r.np)),
      msTotal: mean(rs.map((r) => r.msTotal)),
    };
    (out[exp] = out[exp] || {})[style] = out[exp][style] || {};
    out[exp][style][budget] = q;
  }
  return out;
}

function fmt(v, d = 2) { return v == null || Number.isNaN(v) ? '—' : v.toFixed(d); }

function mdTable(exp, r) {
  const styles = Object.keys(r[exp] || {});
  if (!styles.length) return '*no rows yet*\n';
  const budgets = [...new Set(styles.flatMap((s) => Object.keys(r[exp][s])))].sort((a, b) => +a - +b);
  const lines = ['| style | ' + budgets.map((b) => `n=${b}`).join(' | ') + ' |',
                 '|' + Array(budgets.length + 1).fill('---').join('|') + '|'];
  for (const s of styles) {
    const cells = budgets.map((b) => {
      const q = r[exp][s][b];
      return q ? `${fmt(q.psnr)}dB/${fmt(q.de)}ΔE` : '—';
    });
    lines.push(`| ${s} | ${cells.join(' | ')} |`);
  }
  return lines.join('\n');
}

function mdBytes(exp, r) {
  const styles = Object.keys(r[exp] || {});
  if (!styles.length) return '*no rows yet*\n';
  const budgets = [...new Set(styles.flatMap((s) => Object.keys(r[exp][s])))].sort((a, b) => +a - +b);
  const lines = ['| style | ' + budgets.map((b) => `n=${b}`).join(' | ') + ' |',
                 '|' + Array(budgets.length + 1).fill('---').join('|') + '|'];
  for (const s of styles) {
    const cells = budgets.map((b) => {
      const q = r[exp][s][b];
      return q ? `${fmt(q.bytes, 0)}B` : '—';
    });
    lines.push(`| ${s} | ${cells.join(' | ')} |`);
  }
  return lines.join('\n');
}

/* Best style per budget by mean ΔE (primary fidelity metric). */
function rankings(r) {
  const out = [];
  for (const exp of Object.keys(r)) {
    const budgets = [...new Set(Object.values(r[exp]).flatMap((s) => Object.keys(s)))].sort((a, b) => +a - +b);
    for (const b of budgets) {
      const ranked = Object.entries(r[exp]).map(([style, byB]) => ({ style, q: byB[b] }))
        .filter((x) => x.q && x.q.count);
      ranked.sort((x, y) => (x.q.de ?? Infinity) - (y.q.de ?? Infinity));
      if (ranked.length) {
        out.push(`- **${exp} n=${b}**: ` + ranked.map((x, i) => `${i + 1}. ${x.style} (ΔE ${fmt(x.q.de)}, PSNR ${fmt(x.q.psnr)}, ${fmt(x.q.bytes, 0)}B)`).join(' · '));
      }
    }
  }
  return out.length ? out.join('\n') : '*no rankings yet*';
}

function buildSummary(rows, opts = {}) {
  const r = rollup(rows);
  const expCount = {};
  for (const row of rows) expCount[row.exp] = (expCount[row.exp] || 0) + 1;
  const totalBytes = rows.reduce((a, b) => a + b.bytes, 0);
  const latest = rows.slice(-Math.min(12, rows.length));

  const md = [
    '# divize harness summary',
    '',
    `- rows: **${rows.length}** (exp1a: ${expCount.exp1a || 0}, exp1b: ${expCount.exp1b || 0})`,
    `- mean payload: ${fmt(totalBytes / Math.max(1, rows.length), 0)} B/run`,
    '',
    '## Rankings (best mean ΔE per budget)',
    '',
    rankings(r),
    '',
    '## R-D tables — PSNR dB / mean ΔE',
    '',
    '### exp1a',
    '',
    mdTable('exp1a', r),
    '',
    '### exp1b',
    '',
    mdTable('exp1b', r),
    '',
    '## Payload bytes (mean over images)',
    '',
    '### exp1b',
    '',
    mdBytes('exp1b', r),
    '',
    '## Latest runs',
    '',
    latest.map((x) => `- ${x.exp} ${x.image} ${x.style} n=${x.budget} PSNR=${fmt(x.psnr)} ΔE=${fmt(x.de)} ${fmt(x.bytes, 0)}B`).join('\n'),
    '',
  ].join('\n');

  const json = {
    generatedAt: new Date().toISOString(),
    rowCount: rows.length,
    rollup: r,
    rankings,
    latest: latest.map((x) => ({ exp: x.exp, image: x.image, style: x.style, budget: x.budget, psnr: x.psnr, de: x.de, bytes: x.bytes })),
  };
  return { md, json };
}

function writeSummary(rows, opts) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  const { md, json } = buildSummary(rows, opts);
  fs.writeFileSync(SUMMARY_MD, md);
  fs.writeFileSync(SUMMARY_JSON, JSON.stringify(json, null, 2));
  return { md, json };
}

module.exports = { buildSummary, writeSummary, rollup, SUMMARY_MD, SUMMARY_JSON };
