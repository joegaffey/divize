'use strict';
/* Worker-thread entry: runs a single cell and posts the result row back to the
 * main thread. Spawned by lib/pool.js to parallelise slow cells (high budgets,
 * mesh/splat geometry) that otherwise serialize the loop. */

const { parentPort } = require('worker_threads');
const path = require('path');
const { runCell } = require('./engine');
const { cellKey } = require('../grid');

parentPort.on('message', async (msg) => {
  try {
    const row = await runCell(msg.imagePath, msg.config);
    row.configKey = cellKey(msg.config);
    parentPort.postMessage({ id: msg.id, ok: true, row });
  } catch (e) {
    parentPort.postMessage({ id: msg.id, ok: false, error: e.message });
  }
});
