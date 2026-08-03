/* ============================================================
 * divize – player.js (DLPC embeddable web-component renderer)
 *
 * Self-contained copy of the dlpc-viewer decoder + renderer,
 * packaged as a standard custom element so any page can embed a
 * Divisionist Layered Point Codec render with one <script>:
 *
 *   <script src="js/decode.js"></script>
 *   <script src="js/gpu.js"></script>
 *   <script src="js/player.js"></script>
 *   <dlpc-player src="sample.dlpc" points="60" blend="0.3" aa></dlpc-player>
 *
 * Attributes (all optional, reactive):
 *   src      URL of a .dlpc blob (fetched automatically on set)
 *   points   0-100 progressive draw % of Layer 0 (default 100)
 *   blend    0-1 cell-boundary blend weight (default 0)
 *   aa       present => 2x2 box supersampling anti-aliasing
 *   backend  "auto" | "webgpu" | "cpu" (default auto, WebGPU when ready)
 *
 * Methods:
 *   load(bytes)            parse a raw Uint8Array/ArrayBuffer/File
 *   render()               force a re-render from current attributes
 *
 * Events (dispatched on the element, bubbling):
 *   "dlpc:load"    detail: { doc, bytes } after a successful parse
 *   "dlpc:error"   detail: { message }
 *
 * No shared code or external deps — everything needed is local.
 * ============================================================ */
(function () {
  'use strict';

  const template = document.createElement('template');
  template.innerHTML = `
    <style>
      :host { display: inline-block; line-height: 0; }
      .dlpc-root { position: relative; display: block; width: 100%; }
      canvas {
        display: block;
        width: 100%; height: auto;
        aspect-ratio: 1 / 1;
        background: #000;
        image-rendering: auto;
      }
      .dlpc-drop {
        position: absolute; inset: 0;
        display: grid; place-items: center;
        color: #9aa0a6; font: 13px ui-monospace, monospace;
        background: #1c1c1f;
      }
      .dlpc-status {
        position: absolute; left: 6px; bottom: 6px;
        padding: 2px 6px;
        font: 11px ui-monospace, monospace; line-height: 1.4;
        color: #9aa0a6; background: rgba(0,0,0,.55); border-radius: 3px;
        pointer-events: none; white-space: pre;
      }
      .dlpc-drop.over { outline: 2px dashed #66f; }
      :host(.novoronoi) .dlpc-drop,
      :host(.loaded) .dlpc-drop { display: none; }
      :host(.novoronoi) canvas { background: repeating-conic-gradient(#1c1c1f 0% 25%, #222 0% 50%); }
    </style>
    <div class="dlpc-root">
      <canvas></canvas>
      <div class="dlpc-status"></div>
      <div class="dlpc-drop">Drop a .dlpc here</div>
    </div>
  `;

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  class DLPcPlayer extends HTMLElement {
    static get observedAttributes() {
      return ['src', 'points', 'blend', 'aa', 'backend'];
    }

    constructor() {
      super();
      this._doc = null;
      this._gen = 0;
      this._root = null;
      this._els = null;
      this._gpuReady = false;
      this._probeGPU();
    }

    connectedCallback() {
      if (this._rootReady) this._rereadAttrs();
      this.attachShadow({ mode: 'open' }).appendChild(template.content.cloneNode(true));
      const $ = (s) => this.shadowRoot.querySelector(s);
      this._els = {
        canvas: $('canvas'),
        status: $('.dlpc-status'),
        drop: $('.dlpc-drop'),
      };
      this._wireDrop(this._els.drop);
      this._rootReady = true;
      if (this.hasAttribute('src')) this._updateSrc();
      else if (this._doc) this.queueRender();
      this._rereadAttrs();
    }

    // ---- public API --------------------------------------------
    load(bytes) {
      try {
        const doc = window.dlpcDecode.parse(
          bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
        );
        this._doc = doc;
        this.classList.add('loaded');
        this.classList.remove('novoronoi');
        this.emit('dlpc:load', { doc });
      } catch (err) {
        this.classList.add('novoronoi');
        this._status('parse failed: ' + err.message);
        this.emit('dlpc:error', { message: err.message });
      }
      this.rerender();
    }

    // throttle-free fire of a re-render from current attributes
    rerender() { this.queueRender(); }

    // ---- attribute surface -------------------------------------
    attributeChangedCallback(name) {
      if (name === 'src') this._updateSrc();
      else if (this._rootReady) this.queueRender();
    }

    get points() { return clamp(this._numAttr('points', 100), 0, 100); }
    get blend()  { return clamp(this._numAttr('blend', 0), 0, 1); }
    get aa()     { return this.hasAttribute('aa'); }

    // ---- internals ----------------------------------------------
    _numAttr(name, dflt) {
      const v = Number(this.getAttribute(name));
      return Number.isFinite(v) ? v : dflt;
    }

    _rereadAttrs() { this.queueRender(); }

    _probeGPU() {
      if (this._probeDone || !(navigator && navigator.gpu)) { this._gpuReady = false; return; }
      this._probeDone = true;
      const probe = document.createElement('canvas');
      window.initDivGPU(probe).then((ok) => {
        this._gpuReady = ok;
        if (ok && this._doc) this.queueRender();
      }).catch(() => { this._gpuReady = false; });
    }

    _backendActive() {
      const b = this.getAttribute('backend') || 'auto';
      if (b === 'cpu') return 'cpu';
      if (b === 'webgpu') return this._gpuReady ? 'webgpu' : 'cpu';
      return this._gpuReady ? 'webgpu' : 'cpu'; // auto
    }

    _layer0() {
      const d = this._doc;
      return (d && d.layers && d.layers[0]) ||
        { pts: [], colors: new Uint8ClampedArray(0), count: 0 };
    }

    _drawCount(L) {
      return Math.max(1, Math.round(L.count * (this.points / 100)));
    }

    _typeName(type) {
      return type === 0x02 ? 'tris' : type === 0x03 ? 'splats' : 'seeds';
    }

    queueRender() {
      const g = ++this._gen;
      requestAnimationFrame(() => { if (g === this._gen) this._render(); });
    }

    _status(text) { this._els.status.textContent = text; }

    _updateSrc() {
      const src = this.getAttribute('src');
      if (!src) return;
      fetch(src).then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.arrayBuffer();
      }).then((buf) => this.load(buf))
        .catch((err) => { this.classList.add('novoronoi'); this._status('load failed: ' + err.message); });
    }

    _render() {
      const doc = this._doc, els = this._els;
      if (!doc) { els.canvas.width = 1; els.canvas.height = 1; return; }
      const L = this._layer0();
      const w = doc.width, h = doc.height, count = this._drawCount(L);
      const canvas = els.canvas;
      canvas.width = w; canvas.height = h;
      canvas.style.aspectRatio = w + ' / ' + h;
      this._status(`Layer 0 · ${count}/${L.count} ${this._typeName(L.type)} · ${w}×${h}`);

      if (this._backendActive() === 'webgpu' && window.divGPU &&
          (window.divGPU.isBoundTo(canvas) ? true : window.divGPU.bind(canvas))) {
        window.divGPU.configure(w, h);
        const colors = new Float32Array(L.colors.length);
        for (let i = 0; i < L.colors.length; i++) colors[i] = L.colors[i];
        const aa = this.aa ? 1 : 0;
        let p;
        if (L.type === 0x02) {
          p = window.divGPU.renderTri(L.verts, L.vertColors, L.tris, L.triColors,
            w, h, count, 1, L.interp, [0, 0, 0], aa);
        } else if (L.type === 0x03) {
          p = window.divGPU.renderSplat(L.splats, [], [], w, h, count, 1, [0, 0, 0], false, aa);
        } else {
          p = window.divGPU.render(L.pts, colors, w, h, count, 0, 1, this.blend, aa);
        }
        p.then((ok) => { if (!ok) this._cpuRender(L, w, h, count); })
          .catch(() => this._cpuRender(L, w, h, count));
      } else {
        this._cpuRender(L, w, h, count);
      }
    }

    // barycentric weights for the CPU triangle paths (returns null when outside)
    _bary(X, Y, ax, ay, bx, by, cx, cy) {
      const v0x = bx - ax, v0y = by - ay, v1x = cx - ax, v1y = cy - ay;
      const v2x = X - ax, v2y = Y - ay;
      const d00 = v0x * v0x + v0y * v0y, d01 = v0x * v1x + v0y * v1y, d11 = v1x * v1x + v1y * v1y;
      const d20 = v2x * v0x + v2y * v0y, d21 = v2x * v1x + v2y * v1y;
      const denom = d00 * d11 - d01 * d01;
      if (Math.abs(denom) < 1e-9) return null;
      const v = (d11 * d20 - d01 * d21) / denom;
      const w = (d00 * d21 - d01 * d20) / denom;
      const u = 1 - v - w;
      return (u >= 0 && v >= 0 && w >= 0) ? { u, v, w } : null;
    }

    // CPU fallback — per-pixel sampler per layer type (nearest-seed Voronoi
    // with optional blend/AA, barycentric tiled mesh, or α-composited splats).
    _cpuRender(L, w, h, count) {
      const ctx = this._els.canvas.getContext('2d');
      const img = ctx.createImageData(w, h), d = img.data;
      const aa = this.aa;
      let sample;
      if (L.type === 0x02) {
        const verts = L.verts, tris = L.tris, interp = L.interp;
        const triColors = L.triColors, vertColors = L.vertColors;
        sample = (X, Y) => {
          for (let k = 0; k < count; k++) {
            const t = tris[k], a = verts[t.a], b = verts[t.b], c = verts[t.c];
            const bw = this._bary(X, Y, a.x, a.y, b.x, b.y, c.x, c.y);
            if (bw) {
              if (interp) {
                const oa = t.a * 4, ob = t.b * 4, oc = t.c * 4;
                return [vertColors[oa] * bw.u + vertColors[ob] * bw.v + vertColors[oc] * bw.w,
                        vertColors[oa + 1] * bw.u + vertColors[ob + 1] * bw.v + vertColors[oc + 1] * bw.w,
                        vertColors[oa + 2] * bw.u + vertColors[ob + 2] * bw.v + vertColors[oc + 2] * bw.w];
              }
              const o = k * 4;
              return [triColors[o], triColors[o + 1], triColors[o + 2]];
            }
          }
          return [0, 0, 0];
        };
      } else if (L.type === 0x03) {
        const splats = L.splats;
        const AX = 0, AY = 1, BX = -0.8660254, BY = -0.5, CX = 0.8660254, CY = -0.5;
        sample = (X, Y) => {
          let rr = 0, gg = 0, bb = 0;
          for (let k = 0; k < count; k++) {
            const sp = splats[k];
            const cs = Math.cos(sp.angle), sn = Math.sin(sp.angle);
            const dx = X - sp.x, dy = Y - sp.y;
            const rx = (dx * cs + dy * sn) / Math.max(sp.size, 1e-6);
            const ry = (-dx * sn + dy * cs) / Math.max(sp.size, 1e-6);
            if (this._bary(rx, ry, AX, AY, BX, BY, CX, CY)) {
              const a = sp.alpha;
              rr = sp.r * a + rr * (1 - a);
              gg = sp.g * a + gg * (1 - a);
              bb = sp.b * a + bb * (1 - a);
            }
          }
          return [rr, gg, bb];
        };
      } else {
        const pts = L.pts, colors = L.colors, blend = this.blend;
        sample = (X, Y) => {
          let best = 0, bd = Infinity, sec = 0, sb = Infinity;
          for (let k = 0; k < count; k++) {
            const dx = X - pts[k].x, dy = Y - pts[k].y;
            const dd = dx * dx + dy * dy;
            if (dd < bd) { sb = bd; sec = best; bd = dd; best = k; }
            else if (dd < sb) { sb = dd; sec = k; }
          }
          let rr = colors[best * 4], gg = colors[best * 4 + 1], bb = colors[best * 4 + 2];
          if (blend > 0 && sb < Infinity) {
            const wg = Math.min(1, Math.max(0, (2 * bd) / Math.max(bd + sb, 1e-6))) * blend;
            rr += (colors[sec * 4] - rr) * wg;
            gg += (colors[sec * 4 + 1] - gg) * wg;
            bb += (colors[sec * 4 + 2] - bb) * wg;
          }
          return [rr, gg, bb];
        };
      }
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let rr, gg, bb;
        if (aa) {
          const a = sample(x - 0.25, y - 0.25), b = sample(x + 0.25, y - 0.25);
          const c = sample(x - 0.25, y + 0.25), dd = sample(x + 0.25, y + 0.25);
          rr = (a[0] + b[0] + c[0] + dd[0]) * 0.25;
          gg = (a[1] + b[1] + c[1] + dd[1]) * 0.25;
          bb = (a[2] + b[2] + c[2] + dd[2]) * 0.25;
        } else {
          [rr, gg, bb] = sample(x, y);
        }
        const o = (y * w + x) * 4;
        d[o] = rr; d[o + 1] = gg; d[o + 2] = bb; d[o + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    }

    _wireDrop(drop) {
      drop.addEventListener('dragover', (e) => { e.preventDefault(); });
      drop.addEventListener('dragleave', () => drop.classList.remove('over'));
      drop.addEventListener('dragover', () => drop.classList.add('over'));
      drop.addEventListener('drop', (e) => {
        e.preventDefault();
        drop.classList.remove('over');
        const f = e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) f.arrayBuffer().then((b) => this.load(b));
      });
    }

    _updateSrc() {
      const src = this.getAttribute('src');
      if (!src) return;
      fetch(src).then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.arrayBuffer();
      }).then((buf) => this.load(buf))
        .catch((err) => this.emit('dlpc:error', { message: err.message }));
    }

    emit(name, detail) {
      this.dispatchEvent(new CustomEvent(name, { detail }));
    }
  }

  customElements.define('dlpc-player', DLPcPlayer);
})();