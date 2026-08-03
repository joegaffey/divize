/* ============================================================
 * divize – gpu.js  (exp1-a · WebGPU renderer)
 *
 * Three render paths over a fullscreen WGSL fragment shader:
 *   0. Voronoi (exp1)  – nearest-seed voting, per-pixel.
 *   1. Tiled triangle mesh – barycentric in-triangle test over the first
 *      `count` triangles (Delaunay floor, progressive by triangle).
 *   2. α-triangle splat – center+transform equilateral triangles, src-over
 *      composited in stream order over a backdrop (mean colour or the
 *      Voronoi floor beneath).
 * All paths share the O(K)-per-pixel loop shape and the progressive
 * draw-count semantics; the CPU fallback mirrors them in main.js.
 *
 * Exposes:
 *   window.initDivGPU(canvas) -> Promise<bool>
 *   window.divGPU             -> GPU instance
 *     render(...)                Voronoi (unchanged)
 *     renderTri(verts, vertColors, tris, triColors, w,h,count,scale,interp,backdrop,aa)
 *     renderSplat(splats, seeds, seedColors, w,h,count,scale,backdrop,voronoiBackdrop,aa)
 *     configure(w,h) / bind(canvas) / destroy()
 *     cvt.run(...)               GPU CVT (unchanged)
 * ============================================================ */
(function (global) {
  'use strict';

  const WGSL = /* wgsl */`
struct Params {
  size            : vec2f,
  drawCount       : u32,
  mode            : u32,
  scale           : f32,
  blend           : f32,
  aa              : u32,
};

@group(0) @binding(0) var<storage, read> seeds  : array<vec4f>;
@group(0) @binding(1) var<storage, read> colors : array<vec4f>;
@group(0) @binding(2) var<uniform>        params : Params;

@vertex
fn vs_main(@builtin(vertex_index) vi : u32) -> @builtin(position) vec4f {
  let pts = array<vec2f, 3>(
    vec2f(-1.0, -1.0),
    vec2f( 3.0, -1.0),
    vec2f(-1.0,  3.0),
  );
  return vec4f(pts[vi], 0.0, 1.0);
}

fn cellColor(s : vec2f) -> vec4f {
  var best : u32 = 0u;
  var bd = 1.0e30f;
  var second : u32 = 0u;
  var sd = 1.0e30f;
  for (var k : u32 = 0u; k < params.drawCount; k = k + 1u) {
    let dd = dot(seeds[k].xy - s, seeds[k].xy - s);
    if (dd < bd) { sd = bd; second = best; bd = dd; best = k; }
    else if (dd < sd) { sd = dd; second = k; }
  }
  var c = colors[best];
  if (params.blend > 0.0) {
    let w = clamp((2.0 * bd) / max(bd + sd, 1e-6), 0.0, 1.0);
    c = mix(c, colors[second], w * params.blend);
  }
  return c;
}

@fragment
fn fs_main(@builtin(position) p : vec4f) -> @location(0) vec4f {
  let base = vec2f(p.x, p.y) * params.scale;
  var c : vec4f;
  if (params.aa > 0u) {
    c = (cellColor(base + vec2f(-0.25, -0.25) * params.scale) + cellColor(base + vec2f( 0.25, -0.25) * params.scale)
         + cellColor(base + vec2f(-0.25,  0.25) * params.scale) + cellColor(base + vec2f( 0.25,  0.25) * params.scale))
        * 0.25;
  } else {
    c = cellColor(base);
  }
  if (params.mode == 1u) {
    let lum = dot(vec3f(0.2126, 0.7152, 0.0722), c.rgb);
    c = vec4f(vec3f(lum), 1.0);
  }
  return c;
}
`;

  /* ---- triangle floor path (tiled mesh + α-splat) ---- */
  const TRI_WGSL = /* wgsl */`
struct TriParams {
  size      : vec2f,
  drawCount : u32,
  vcount    : u32,
  mode      : u32,
  scale     : f32,
  aa        : u32,
  flags     : u32,
  backdrop  : vec4f,
};

@group(0) @binding(0) var<storage, read> verts   : array<vec4f>;
@group(0) @binding(1) var<storage, read> tris    : array<u32>;
@group(0) @binding(2) var<storage, read> tcols   : array<vec4f>;
@group(0) @binding(3) var<storage, read> splats  : array<vec4f>;
@group(0) @binding(4) var<storage, read> scols   : array<vec4f>;
@group(0) @binding(5) var<uniform>        params  : TriParams;
@group(0) @binding(6) var<storage, read> vseeds  : array<vec4f>;
@group(0) @binding(7) var<storage, read> vcolors : array<vec4f>;

@vertex
fn vs_tri(@builtin(vertex_index) vi : u32) -> @builtin(position) vec4f {
  let pts = array<vec2f, 3>(
    vec2f(-1.0, -1.0),
    vec2f( 3.0, -1.0),
    vec2f(-1.0,  3.0),
  );
  return vec4f(pts[vi], 0.0, 1.0);
}

fn bary(s : vec2f, a : vec2f, b : vec2f, c : vec2f) -> vec3f {
  let v0 = b - a;
  let v1 = c - a;
  let v2 = s - a;
  let d00 = dot(v0, v0);
  let d01 = dot(v0, v1);
  let d11 = dot(v1, v1);
  let d20 = dot(v2, v0);
  let d21 = dot(v2, v1);
  let denom = d00 * d11 - d01 * d01;
  if (abs(denom) < 1e-9) { return vec3f(-1.0, -1.0, -1.0); }
  let v = (d11 * d20 - d01 * d21) / denom;
  let w = (d00 * d21 - d01 * d20) / denom;
  return vec3f(1.0 - v - w, v, w);
}

fn inside(bb : vec3f) -> bool {
  return bb.x >= 0.0 && bb.y >= 0.0 && bb.z >= 0.0;
}

fn cellColorV(s : vec2f) -> vec4f {
  var best = 0u;
  var bd = 1.0e30f;
  for (var k : u32 = 0u; k < params.vcount; k = k + 1u) {
    let d = vseeds[k].xy - s;
    let dist = dot(d, d);
    if (dist < bd) { bd = dist; best = k; }
  }
  return vcolors[best];
}

fn triColorAt(s : vec2f) -> vec4f {
  for (var k : u32 = 0u; k < params.drawCount; k = k + 1u) {
    let ia = tris[k * 3u + 0u];
    let ib = tris[k * 3u + 1u];
    let ic = tris[k * 3u + 2u];
    let bb = bary(s, verts[ia].xy, verts[ib].xy, verts[ic].xy);
    if (inside(bb)) {
      if ((params.flags & 1u) == 1u) {
        return tcols[ia] * bb.x + tcols[ib] * bb.y + tcols[ic] * bb.z;
      }
      return tcols[k];
    }
  }
  return params.backdrop;
}

fn splatColorAt(s : vec2f, acc : vec4f) -> vec4f {
  var c = acc;
  for (var k : u32 = 0u; k < params.drawCount; k = k + 1u) {
    let sp = splats[k];
    let dx = s.x - sp.x;
    let dy = s.y - sp.y;
    let cs = cos(sp.w);
    let sn = sin(sp.w);
    let rx = (dx * cs + dy * sn) / max(sp.z, 1e-6);
    let ry = (-dx * sn + dy * cs) / max(sp.z, 1e-6);
    let A = vec2f(0.0, 1.0);
    let B = vec2f(-0.8660254, -0.5);
    let C = vec2f(0.8660254, -0.5);
    if (inside(bary(vec2f(rx, ry), A, B, C))) {
      let sc = scols[k];
      c = vec4f(sc.rgb * sc.a + c.rgb * (1.0 - sc.a), 1.0);
    }
  }
  return c;
}

@fragment
fn fs_tri(@builtin(position) p : vec4f) -> @location(0) vec4f {
  let base = vec2f(p.x, p.y) * params.scale;
  let tiled = params.mode == 0u;
  if (params.aa > 0u) {
    let o = 0.25 * params.scale;
    if (tiled) {
      return (triColorAt(base + vec2f(-o, -o)) + triColorAt(base + vec2f(o, -o))
            + triColorAt(base + vec2f(-o, o)) + triColorAt(base + vec2f(o, o))) * 0.25;
    }
    var bk = params.backdrop;
    if ((params.flags & 2u) == 2u) { bk = cellColorV(base); }
    return (splatColorAt(base + vec2f(-o, -o), bk) + splatColorAt(base + vec2f(o, -o), bk)
          + splatColorAt(base + vec2f(-o, o), bk) + splatColorAt(base + vec2f(o, o), bk)) * 0.25;
  }
  if (tiled) { return triColorAt(base); }
  var bk = params.backdrop;
  if ((params.flags & 2u) == 2u) { bk = cellColorV(base); }
  return splatColorAt(base, bk);
}
`;

  class GPUVoronoi {
    constructor() {
      this.device = null;
      this.ctx = null;
      this.pipeline = null;
      this.triPipeline = null;
      this.triFail = false;
      this.seedBuf = null;
      this.colorBuf = null;
      this.paramBuf = null;
      this.bindGroup = null;
      this.triBindGroup = null;
      this.bindGroupCount = 0;
      this.capacity = 0;
      this.format = null;
      this.initError = null;
      this.triVerts = null; this.triIdx = null; this.triCols = null;
      this.triSplats = null; this.triScols = null;
      this.triVseeds = null; this.triVcolors = null;
      this._triCap = null;
    }

    isSupported() {
      return typeof navigator !== 'undefined' && !!navigator.gpu;
    }

    async init(canvas) {
      this.initError = null;
      if (!this.isSupported() || !canvas) {
        this.initError = this.isSupported() ? 'missing canvas' : 'navigator.gpu unavailable';
        return false;
      }
      let adapter;
      try { adapter = await navigator.gpu.requestAdapter(); }
      catch (e) { this.initError = 'requestAdapter threw: ' + e; console.warn('[divize]', e); return false; }
      if (!adapter) { this.initError = 'requestAdapter returned no adapter'; return false; }
      try { this.device = await adapter.requestDevice(); }
      catch (e) { this.initError = 'requestDevice threw: ' + e; console.warn('[divize]', e); return false; }
      if (!this.device) { this.initError = 'requestDevice returned null'; return false; }
      this.device.lost.then((info) => console.warn('[divize] device lost:', info));
      this.cvt = new GPUCVT(this.device);

      this.ctx = canvas.getContext('webgpu');
      if (!this.ctx) {
        this.initError = 'canvas has no WebGPU context (width=0? or blocked?)';
        try { this.device.destroy(); } catch (e) {}
        this.device = null;
        return false;
      }

      this.format = navigator.gpu.getPreferredCanvasFormat();
      this.paramBuf = this.device.createBuffer({
        size: 64,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });

      const module = this.device.createShaderModule({ code: WGSL });
      try {
        this.pipeline = this.device.createRenderPipeline({
          layout: 'auto',
          vertex:   { module, entryPoint: 'vs_main' },
          fragment: { module, entryPoint: 'fs_main',
                      targets: [{ format: this.format }] },
          primitive: { topology: 'triangle-list' },
        });
      } catch (e) {
        this.initError = 'createRenderPipeline threw: ' + e;
        console.warn('[divize]', e);
        try { this.device.destroy(); } catch (e0) {}
        this.device = null; this.ctx = null;
        return false;
      }

      const triModule = this.device.createShaderModule({ code: TRI_WGSL });
      try {
        this.triPipeline = this.device.createRenderPipeline({
          layout: 'auto',
          vertex:   { module: triModule, entryPoint: 'vs_tri' },
          fragment: { module: triModule, entryPoint: 'fs_tri',
                      targets: [{ format: this.format }] },
          primitive: { topology: 'triangle-list' },
        });
      } catch (e) {
        this.triFail = true;
        this.initError = 'tri pipeline threw: ' + e;
        console.warn('[divize] tri pipeline failed:', e);
      }

      const surf = (m, tag) => {
        const info = m.getCompilationInfo();
        if (info && info.then) {
          info.then((ci) => {
            const errs = ci.messages
              .filter((x) => x.type === 'error' || x.type === 'warning')
              .map((x) => `[${x.type}] ${x.message}`);
            if (errs.length) {
              const msg = errs.slice(0, 5).join(' | ');
              this.initError = msg;
              console.warn('[divize] ' + tag + ' shader diagnostics:', this.initError);
            }
          }).catch(() => {});
        }
      };
      surf(module, 'voronoi');
      surf(triModule, 'triangle');
      return true;
    }

    configure(w, h) {
      if (!this.ctx) return;
      this.ctx.configure({
        device: this.device,
        format: this.format,
        alphaMode: 'opaque',
      });
    }

    bind(canvas) {
      if (!this.device || !canvas) return false;
      const ctx = canvas.getContext('webgpu');
      if (!ctx) return false;
      this.ctx = ctx;
      return true;
    }

    isBoundTo(canvas) {
      return !!this.ctx && !!canvas &&
        canvas.getContext('webgpu') === this.ctx;
    }

    initCanvas(canvas) {
      return this.bind(canvas);
    }

    _ensure(n) {
      const bytes = n * 16;
      if (this.seedBuf && this.capacity === n) return;
      this.seedBuf?.destroy(); this.colorBuf?.destroy();
      this.seedBuf = this.device.createBuffer({
        size: bytes,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });
      this.colorBuf = this.device.createBuffer({
        size: bytes,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });
      this.capacity = n;
      this.bindGroup = null;
    }

    async render(pts, colors, w, h, count, mode, scale = 1, blend = 0, aa = 0) {
      if (!this.device || !count) return false;
      this._ensure(count);

      const seeds = new Float32Array(count * 4);
      const cols = new Float32Array(count * 4);
      for (let i = 0; i < count; i++) {
        seeds[i * 4] = pts[i].x;
        seeds[i * 4 + 1] = pts[i].y;
        const o = i * 4;
        cols[i * 4] = colors[o] / 255;
        cols[i * 4 + 1] = colors[o + 1] / 255;
        cols[i * 4 + 2] = colors[o + 2] / 255;
        cols[i * 4 + 3] = 1;
      }

      const param = new ArrayBuffer(64);
      new Float32Array(param)[0] = w;
      new Float32Array(param)[1] = h;
      const pu = new Uint32Array(param);
      pu[2] = count; pu[3] = mode;
      new Float32Array(param)[4] = scale;
      new Float32Array(param)[5] = blend;
      new Uint32Array(param)[6] = aa ? 1 : 0;

      this.device.queue.writeBuffer(this.seedBuf, 0, seeds);
      this.device.queue.writeBuffer(this.colorBuf, 0, cols);
      this.device.queue.writeBuffer(this.paramBuf, 0, param);

      if (!this.bindGroup) {
        this.bindGroup = this.device.createBindGroup({
          layout: this.pipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: { buffer: this.seedBuf } },
            { binding: 1, resource: { buffer: this.colorBuf } },
            { binding: 2, resource: { buffer: this.paramBuf } },
          ],
        });
      }
      this._draw(this.pipeline, this.bindGroup);
      return true;
    }

    /* ---------------- triangle paths ---------------- */

    _ensureTri({ verts, tris, splats, seeds }) {
      const c = this._triCap;
      if (c && verts <= c.verts && tris <= c.tris && splats <= c.splats && seeds <= c.seeds) return;
      this._triCap = { verts, tris, splats, seeds };
      const d = this.device;
      const mk = (size) => d.createBuffer({
        size, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });
      [this.triVerts, this.triIdx, this.triCols, this.triSplats, this.triScols, this.triVseeds, this.triVcolors]
        .forEach((b) => { try { b?.destroy(); } catch (e) {} });
      this.triVerts   = mk(Math.max(16, verts * 16));
      this.triIdx     = mk(Math.max(16, tris * 12));
      this.triCols    = mk(Math.max(16, Math.max(verts, tris) * 16));
      this.triSplats  = mk(Math.max(16, splats * 16));
      this.triScols   = mk(Math.max(16, splats * 16));
      this.triVseeds  = mk(Math.max(16, seeds * 16));
      this.triVcolors = mk(Math.max(16, seeds * 16));
      this.triBindGroup = null;
    }

    _ensureTriBindGroup() {
      if (this.triBindGroup) return;
      this.triBindGroup = this.device.createBindGroup({
        layout: this.triPipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: this.triVerts } },
          { binding: 1, resource: { buffer: this.triIdx } },
          { binding: 2, resource: { buffer: this.triCols } },
          { binding: 3, resource: { buffer: this.triSplats } },
          { binding: 4, resource: { buffer: this.triScols } },
          { binding: 5, resource: { buffer: this.paramBuf } },
          { binding: 6, resource: { buffer: this.triVseeds } },
          { binding: 7, resource: { buffer: this.triVcolors } },
        ],
      });
    }

    _triParams(w, h, drawCount, vcount, mode, scale, aa, flags, backdrop) {
      const param = new ArrayBuffer(64);
      const f32 = new Float32Array(param);
      const u32 = new Uint32Array(param);
      f32[0] = w; f32[1] = h;
      u32[2] = drawCount; u32[3] = vcount; u32[4] = mode;
      f32[5] = scale;
      u32[6] = aa ? 1 : 0; u32[7] = flags;
      f32[8] = backdrop[0]; f32[9] = backdrop[1]; f32[10] = backdrop[2]; f32[11] = 1;
      return param;
    }

    async renderTri(verts, vertColors, tris, triColors, w, h, count, scale, interp, backdrop, aa) {
      if (!this.device || this.triFail) return false;
      const T = Math.min(count, tris.length);
      const V = verts.length;
      if (T === 0 || V === 0) return false;
      this._ensureTri({ verts: V, tris: T, splats: 1, seeds: 1 });

      const vb = new Float32Array(V * 4);
      for (let i = 0; i < V; i++) { vb[i * 4] = verts[i].x; vb[i * 4 + 1] = verts[i].y; }
      this.device.queue.writeBuffer(this.triVerts, 0, vb);

      const ib = new Uint32Array(T * 3);
      for (let k = 0; k < T; k++) {
        ib[k * 3] = tris[k].a; ib[k * 3 + 1] = tris[k].b; ib[k * 3 + 2] = tris[k].c;
      }
      this.device.queue.writeBuffer(this.triIdx, 0, ib);

      const src = interp ? vertColors : triColors;
      const ccount = interp ? V : T;
      const cb = new Float32Array(Math.max(1, ccount) * 4);
      for (let i = 0; i < ccount; i++) {
        cb[i * 4] = src[i * 4] / 255; cb[i * 4 + 1] = src[i * 4 + 1] / 255;
        cb[i * 4 + 2] = src[i * 4 + 2] / 255; cb[i * 4 + 3] = 1;
      }
      this.device.queue.writeBuffer(this.triCols, 0, cb);

      const param = this._triParams(w, h, T, 0, 0, scale, aa, interp ? 1 : 0, backdrop);
      this.device.queue.writeBuffer(this.paramBuf, 0, param);
      this._ensureTriBindGroup();
      this._draw(this.triPipeline, this.triBindGroup);
      return true;
    }

    async renderSplat(splats, seeds, seedColors, w, h, count, scale, backdrop, voronoiBackdrop, aa) {
      if (!this.device || this.triFail) return false;
      const S = Math.min(count, splats.length);
      if (S === 0) return false;
      const K = voronoiBackdrop ? seeds.length : 0;
      this._ensureTri({ verts: 1, tris: 1, splats: S, seeds: K });

      const sb = new Float32Array(S * 4);
      const cb = new Float32Array(S * 4);
      for (let i = 0; i < S; i++) {
        const sp = splats[i];
        sb[i * 4] = sp.x; sb[i * 4 + 1] = sp.y; sb[i * 4 + 2] = sp.size; sb[i * 4 + 3] = sp.angle;
        cb[i * 4] = sp.r / 255; cb[i * 4 + 1] = sp.g / 255; cb[i * 4 + 2] = sp.b / 255; cb[i * 4 + 3] = sp.alpha;
      }
      this.device.queue.writeBuffer(this.triSplats, 0, sb);
      this.device.queue.writeBuffer(this.triScols, 0, cb);

      if (K > 0) {
        const kb = new Float32Array(K * 4);
        const kc = new Float32Array(K * 4);
        for (let i = 0; i < K; i++) {
          kb[i * 4] = seeds[i].x; kb[i * 4 + 1] = seeds[i].y;
          kc[i * 4] = seedColors[i * 4] / 255; kc[i * 4 + 1] = seedColors[i * 4 + 1] / 255;
          kc[i * 4 + 2] = seedColors[i * 4 + 2] / 255; kc[i * 4 + 3] = 1;
        }
        this.device.queue.writeBuffer(this.triVseeds, 0, kb);
        this.device.queue.writeBuffer(this.triVcolors, 0, kc);
      }

      const param = this._triParams(w, h, S, K, 1, scale, aa, voronoiBackdrop ? 2 : 0, backdrop);
      this.device.queue.writeBuffer(this.paramBuf, 0, param);
      this._ensureTriBindGroup();
      this._draw(this.triPipeline, this.triBindGroup);
      return true;
    }

    _draw(pipeline, bindGroup) {
      const texture = this.ctx.getCurrentTexture();
      const view = texture.createView();
      const enc = this.device.createCommandEncoder();
      const pass = enc.beginRenderPass({
        colorAttachments: [{
          view,
          loadOp: 'clear',
          storeOp: 'store',
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
        }],
      });
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroup);
      pass.draw(3);
      pass.end();
      this.device.queue.submit([enc.finish()]);
    }

    destroy() {
      [this.seedBuf, this.colorBuf, this.paramBuf, this.triVerts, this.triIdx,
       this.triCols, this.triSplats, this.triScols, this.triVseeds, this.triVcolors]
        .forEach((b) => { try { b?.destroy(); } catch (e) {} });
      try { this.device?.destroy(); } catch (e) {}
      this.device = null; this.ctx = null; this.bindGroup = null; this.triBindGroup = null;
    }
  }

  global.divGPU = null;
  global.initDivGPU = async (canvas) => {
    const g = new GPUVoronoi();
    const ok = await g.init(canvas);
    global.divGPU = g;         // keep instance to read .initError
    return ok;
  };

  /* ============================================================
   * GPUCVT — Lloyd relaxation as a WGSL compute pipeline.
   * (unchanged from exp1; reuses the shared device)
   * ============================================================ */
  const CVT_WGSL = /* wgsl */`
struct Params {
  w           : u32,
  h           : u32,
  total       : u32,
  count       : u32,
};

@group(0) @binding(0) var<storage, read_write> seeds : array<vec2f>;
@group(0) @binding(1) var<storage, read>       sal   : array<f32>;
@group(0) @binding(2) var<storage, read_write> acc   : array<atomic<u32>>;
@group(0) @binding(3) var<uniform>             params: Params;

fn accAdd(ptr : ptr<storage, atomic<u32>, read_write>, v : f32) {
  loop {
    let old = atomicLoad(ptr);
    let nv  = bitcast<f32>(old) + v;
    let res = atomicCompareExchangeWeak(ptr, old, bitcast<u32>(nv));
    if (res.exchanged) { break; }
  }
}

fn nearest(px : vec2f) -> u32 {
  var best = 0u;
  var bd   = 1e30f;
  for (var k = 0u; k < params.count; k = k + 1u) {
    let d = seeds[k] - px;
    let dist = dot(d, d);
    if (dist < bd) { bd = dist; best = k; }
  }
  return best;
}

@compute @workgroup_size(64)
fn reset_all(@builtin(global_invocation_id) gid : vec3u) {
  let k = gid.x;
  if (k >= params.count) { return; }
  atomicStore(&acc[k * 3u + 0u], 0u);
  atomicStore(&acc[k * 3u + 1u], 0u);
  atomicStore(&acc[k * 3u + 2u], 0u);
}

const TILE          = 256u;
const DIRECT_CAP    = 128u;

var<workgroup> sh_seed_sx : array<atomic<u32>, DIRECT_CAP>;
var<workgroup> sh_seed_sy : array<atomic<u32>, DIRECT_CAP>;
var<workgroup> sh_seed_sw : array<atomic<u32>, DIRECT_CAP>;

fn accAddW(ptr : ptr<workgroup, atomic<u32>>, v : f32) {
  loop {
    let old  = atomicLoad(ptr);
    let nv   = bitcast<f32>(old) + v;
    let res  = atomicCompareExchangeWeak(ptr, old, bitcast<u32>(nv));
    if (res.exchanged) { break; }
  }
}

@compute @workgroup_size(TILE)
fn assign_all(@builtin(global_invocation_id) gid : vec3u,
              @builtin(local_invocation_id) lid : vec3u) {
  for (var i = lid.x; i < DIRECT_CAP; i += TILE) {
    atomicStore(&sh_seed_sx[i], 0u);
    atomicStore(&sh_seed_sy[i], 0u);
    atomicStore(&sh_seed_sw[i], 0u);
  }
  workgroupBarrier();

  let direct = params.count <= DIRECT_CAP;
  let px = gid.x;
  if (px < params.total) {
    let y   = px / params.w;
    let x   = px - y * params.w;
    let wgt = sal[px] + 1e-3f;
    let xw  = f32(x) * wgt;
    let yw  = f32(y) * wgt;
    let best = nearest(vec2f(f32(x), f32(y)));

    if (direct) {
      accAddW(&sh_seed_sx[best], xw);
      accAddW(&sh_seed_sy[best], yw);
      accAddW(&sh_seed_sw[best], wgt);
    } else {
      accAdd(&acc[best * 3u + 0u], xw);
      accAdd(&acc[best * 3u + 1u], yw);
      accAdd(&acc[best * 3u + 2u], wgt);
    }
  }
  workgroupBarrier();

  if (direct) {
    let hi = params.count;
    for (var i = lid.x; i < DIRECT_CAP; i += TILE) {
      if (i >= hi) { break; }
      let sx = bitcast<f32>(atomicLoad(&sh_seed_sx[i]));
      let sy = bitcast<f32>(atomicLoad(&sh_seed_sy[i]));
      let sw = bitcast<f32>(atomicLoad(&sh_seed_sw[i]));
      if (sw != 0.0) {
        accAdd(&acc[i * 3u + 0u], sx);
        accAdd(&acc[i * 3u + 1u], sy);
        accAdd(&acc[i * 3u + 2u], sw);
      }
    }
  }
}

@compute @workgroup_size(64)
fn finalize_seeds(@builtin(global_invocation_id) gid : vec3u) {
  let k = gid.x;
  if (k >= params.count) { return; }
  let sw = bitcast<f32>(atomicLoad(&acc[k * 3u + 2u]));
  if (sw <= 0.0) { return; }
  let sx = bitcast<f32>(atomicLoad(&acc[k * 3u + 0u]));
  let sy = bitcast<f32>(atomicLoad(&acc[k * 3u + 1u]));
  seeds[k] = vec2f(sx / sw, sy / sw);
}
`;

  const WORKGROUP = 64;

  class GPUCVT {
    constructor(device) {
      this.device = device;
      this.compileError = null;
      this.module = device.createShaderModule({ code: CVT_WGSL });
      this.module.getCompilationInfo().then((ci) => {
        const errs = ci.messages
          .filter((m) => m.type === 'error' || m.type === 'warning')
          .map((m) => `[${m.type}] ${m.message}`);
        if (errs.length) {
          this.compileError = errs.slice(0, 5).join(' | ');
          console.warn('[divize] CVT shader diagnostics:', this.compileError);
        }
      }).catch(() => {});
      this.resetPipe = null; this.assignPipe = null; this.finishPipe = null;
      this.bindGroup = null;
      this.resStage = null; this.pipelineLayout = null;
      this.seedBuf = null; this.salBuf = null; this.accBuf = null; this.paramBuf = null;
      this._total = 0; this._count = 0;
      this.mapRead = null; this.mapValue = null;
    }

    _ensure(total, count) {
      if (this._total === total && this._count === count && this.seedBuf) return;
      this._total = total; this._count = count;
      const d = this.device;
      this.seedBuf?.destroy(); this.salBuf?.destroy(); this.accBuf?.destroy(); this.paramBuf?.destroy();
      this.mapRead?.destroy();
      this.bindGroup = null;

      if (!this.resStage) {
        this.resStage = d.createBindGroupLayout({
          entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
            { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
            { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
          ],
        });
        this.pipelineLayout = d.createPipelineLayout({ bindGroupLayouts: [this.resStage] });
      }
      if (!this.resetPipe) {
        const mk = (entry) => d.createComputePipeline({
          layout: this.pipelineLayout,
          compute: { module: this.module, entryPoint: entry },
        });
        this.resetPipe = mk('reset_all');
        this.assignPipe = mk('assign_all');
        this.finishPipe = mk('finalize_seeds');
      }

      this.seedBuf = d.createBuffer({ size: count * 8, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC });
      this.salBuf  = d.createBuffer({ size: total * 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
      this.accBuf  = d.createBuffer({ size: count * 3 * 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
      this.paramBuf = d.createBuffer({ size: 64, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });

      this.mapRead = d.createBuffer({ size: count * 8, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
      this.mapValue = null;

      this.bindGroup = d.createBindGroup({
        layout: this.resStage,
        entries: [
          { binding: 0, resource: { buffer: this.seedBuf } },
          { binding: 1, resource: { buffer: this.salBuf } },
          { binding: 2, resource: { buffer: this.accBuf } },
          { binding: 3, resource: { buffer: this.paramBuf } },
        ],
      });
    }

    async run(pts, saliency, w, h, iters, { onProgress, isCancelled } = {}) {
      if (!this.device || !iters || iters <= 0) return null;
      const count = pts.length;
      const total = w * h;
      this._ensure(total, count);

      const seedData = new Float32Array(count * 2);
      for (let i = 0; i < count; i++) { seedData[i * 2] = pts[i].x; seedData[i * 2 + 1] = pts[i].y; }
      this.device.queue.writeBuffer(this.seedBuf, 0, seedData);
      this.device.queue.writeBuffer(this.salBuf, 0, saliency);
      const param = new Uint32Array(64 / 4);
      param[0] = w; param[1] = h; param[2] = total; param[3] = count;
      this.device.queue.writeBuffer(this.paramBuf, 0, param);

      const grid = (n, per) => Math.max(1, Math.ceil(n / per));
      const ASSIGN_WG = 256;

      for (let it = 0; it < iters; it++) {
        if (isCancelled && isCancelled()) return null;
        const enc = this.device.createCommandEncoder();
        let pass = enc.beginComputePass();
        pass.setPipeline(this.resetPipe);
        pass.setBindGroup(0, this.bindGroup);
        pass.dispatchWorkgroups(grid(count, WORKGROUP));
        pass.end();
        pass = enc.beginComputePass();
        pass.setPipeline(this.assignPipe);
        pass.setBindGroup(0, this.bindGroup);
        pass.dispatchWorkgroups(grid(total, ASSIGN_WG));
        pass.end();
        pass = enc.beginComputePass();
        pass.setPipeline(this.finishPipe);
        pass.setBindGroup(0, this.bindGroup);
        pass.dispatchWorkgroups(grid(count, WORKGROUP));
        pass.end();
        this.device.queue.submit([enc.finish()]);
        if (onProgress) onProgress(it + 1, iters);
      }

      const enc = this.device.createCommandEncoder();
      enc.copyBufferToBuffer(this.seedBuf, 0, this.mapRead, 0, count * 8);
      this.device.queue.submit([enc.finish()]);
      await this.mapRead.mapAsync(GPUMapMode.READ);
      this.mapValue = new Float32Array(this.mapRead.getMappedRange().slice(0));
      this.mapRead.unmap();
      return this.mapValue;
    }

    destroy() {
      [this.seedBuf, this.salBuf, this.accBuf, this.paramBuf, this.mapRead]
        .forEach((b) => { try { b?.destroy(); } catch (e) {} });
      this.seedBuf = this.salBuf = this.accBuf = this.paramBuf = this.mapRead = null;
    }
  }

})(window);
