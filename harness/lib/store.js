'use strict';
/* Append-only JSONL result store. Rows are written atomically (write temp +
 * rename) so a crash mid-batch never corrupts history, and re-running skips
 * cells already present via the cell key. */

const fs = require('fs');
const path = require('path');
const { cellKey } = require('../grid');

const RESULTS_DIR = path.join(__dirname, '..', 'results');
const RESULTS_FILE = path.join(RESULTS_DIR, 'results.jsonl');

function ensureDir() {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

function loadAll() {
  if (!fs.existsSync(RESULTS_FILE)) return [];
  const rows = [];
  for (const line of fs.readFileSync(RESULTS_FILE, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t) continue;
    try { rows.push(JSON.parse(t)); } catch { /* skip malformed */ }
  }
  return rows;
}

function completedKeys(rows) {
  const set = new Set();
  for (const r of rows) {
    const k = r && r.configKey ? r.configKey : cellKey(r);
    if (k) set.add(k);
  }
  return set;
}

function appendRows(rows) {
  ensureDir();
  let s = '';
  for (const r of rows) s += JSON.stringify(r) + '\n';
  fs.appendFileSync(RESULTS_FILE, s);
}

function appendRow(row) {
  appendRows([row]);
}

module.exports = { loadAll, completedKeys, appendRows, appendRow, RESULTS_FILE };
