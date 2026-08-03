'use strict';
/* Minimal worker_threads pool that runs a batch of cell configs concurrently.
 * Rows resolve in completion order (not submission order) — fine, because the
 * JSONL store dedupes by configKey and each row is self-contained. */

const { Worker } = require('worker_threads');
const path = require('path');

class CellPool {
  constructor(size) {
    this.size = Math.max(1, Math.min(size || 1, require('os').cpus().length));
    this.workers = [];
    this.idle = [];
    this.queue = [];
    this.pending = new Map();
    this.nextId = 1;
    for (let i = 0; i < this.size; i++) {
      const w = new Worker(path.join(__dirname, 'cell-worker.js'));
      w.on('message', (msg) => this._onMessage(w, msg));
      w.on('error', (e) => this._onWorkerError(w, e));
      this.idle.push(w);
      this.workers.push(w);
    }
  }

  run(config, imagePath) {
    const id = this.nextId++;
    return new Promise((resolve) => {
      this.queue.push({ id, config, imagePath, resolve });
      this._dispatch();
    });
  }

  _dispatch() {
    while (this.idle.length && this.queue.length) {
      const worker = this.idle.pop();
      const job = this.queue.shift();
      this.pending.set(job.id, job);
      worker.postMessage({ id: job.id, imagePath: job.imagePath, config: job.config });
    }
  }

  _onMessage(worker, msg) {
    const job = this.pending.get(msg.id);
    if (job) {
      this.pending.delete(msg.id);
      this.idle.push(worker);
      job.resolve(msg.ok ? { ok: true, row: msg.row } : { ok: false, error: msg.error });
    }
    this._dispatch();
  }

  _onWorkerError(worker, e) {
    // Fail all jobs stuck on this worker.
    for (const [id, job] of this.pending) {
      if (this.workers.indexOf(worker) !== -1) {
        this.pending.delete(id);
        job.resolve({ ok: false, error: 'worker error: ' + e.message });
      }
    }
    this.idle = this.idle.filter((w) => w !== worker);
    this.workers = this.workers.filter((w) => w !== worker);
  }

  async drain() {
    while (this.queue.length || this.pending.size) {
      await new Promise((r) => setTimeout(r, 20));
    }
  }

  close() {
    for (const w of this.workers) w.terminate();
  }
}

module.exports = { CellPool };
