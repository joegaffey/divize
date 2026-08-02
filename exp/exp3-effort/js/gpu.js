/* ============================================================
 * divize – gpu.js  (Phase 2 · WebGPU renderer)
 *
 * Renders the Voronoi diagram on the GPU via a fullscreen
 * fragment shader (WGSL). Per output pixel it runs the SAME
 * nearest-seed search as the CPU fallback (in main.js), but in
 * parallel. Progressive "streaming" is reproduced by drawing
 * only the first `count` seeds of the upload buffer.
 *
 * Exposes:
 *   window.initDivGPU(canvas) -> Promise<bool>
 *   window.divGPU             -> GPU instance (after init windows true)
 *     render(pts, colors, w, h, count, mode) -> Promise<bool>
 *     configure(w, h)
 *     destroy()
 * ============================================================ */
(function (global) {
  'use strict';

  const WGSL = /* wgsl */`
struct Params {
  size            : vec2f,
  drawCount       : u32,
  mode            : u32,
  scale           : f32,
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

@fragment
fn fs_main(@builtin(position) p : vec4f) -> @location(0) vec4f {
  // Output pixels are in downscaled-canvas coords; map back to full-res
  // seed space so progressive %/scaled draws line up with the source.
  let px = vec2f(p.x, p.y) * params.scale;
  var best : u32 = 0u;
  var bd = 1.0e30f;
  for (var k : u32 = 0u; k < params.drawCount; k = k + 1u) {
    let d = seeds[k].xy - px;
    let dist = dot(d, d);
    if (dist < bd) { bd = dist; best = k; }
  }
  var c = colors[best];
  if (params.mode == 1u) {
    let lum = dot(vec3f(0.2126, 0.7152, 0.0722), c.rgb);
    c = vec4f(vec3f(lum), 1.0);
  }
  return c;
}
`;

  class GPUVoronoi {
    constructor() {
      this.device = null;
      this.ctx = null;
      this.pipeline = null;
      this.seedBuf = null;
      this.colorBuf = null;
      this.paramBuf = null;
      this.bindGroup = null;
      this.bindGroupCount = 0;
      this.capacity = 0;
      this.format = null;
      this.initError = null;
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
      // surface WGSL compilation diagnostics (async) to help debugging
      const info = module.getCompilationInfo();
      if (info && info.then) {
        info.then((ci) => {
          const errs = ci.messages
            .filter((m) => m.type === 'error' || m.type === 'warning')
            .map((m) => `[${m.type}] ${m.message}`);
          if (errs.length) this.initError = errs.slice(0, 5).join(' | ');
        }).catch(() => {});
      }
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

    /**
     * (Re)target a canvas. The GPU address space/probe must run on its
     * own throwaway canvas at boot; actual drawing needs a WebGPU
     * context on the *visible* canvas. A canvas only supports one
     * context type, so if it already has a 2D context this fails and
     * the caller must fall back to CPU.
     */
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
      const bytes = n * 16;                    // array<vec4f> per seed
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
      if (!this.paramBuf) {
        this.paramBuf = this.device.createBuffer({
          size: 64,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
      }
      this.capacity = n;
      this.bindGroup = null;
    }

    async render(pts, colors, w, h, count, mode, scale = 1) {
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
      pass.setPipeline(this.pipeline);
      pass.setBindGroup(0, this.bindGroup);
      pass.draw(3);
      pass.end();
      this.device.queue.submit([enc.finish()]);
      return true;
    }

    destroy() {
      [this.seedBuf, this.colorBuf, this.paramBuf].forEach((b) => { try { b?.destroy(); } catch (e) {} });
      try { this.device?.destroy(); } catch (e) {}
      this.device = null; this.ctx = null; this.bindGroup = null;
    }
  }

  global.divGPU = null;
  global.initDivGPU = async (canvas) => {
    const g = new GPUVoronoi();
    const ok = await g.init(canvas);
    if (ok) global.divGPU = g;
    else global.divGPU = g;         // keep instance to read .initError
    return ok;
  };

  /* ============================================================
   * GPUCVT — Lloyd relaxation as a WGSL compute pipeline.
   *
   * Reuses the existing device from GPUVoronoi (so it only exists
   * after a successful WebGPU boot). For each Lloyd iteration it
   * runs three tiny compute passes:
   *   reset   : zero the per-seed accumulators
   *   assign  : one thread per pixel -> nearest seed, accumulates
   *             {x*w, y*w, w} via u32-bitcast CAS atomics
   *   finalize: per seed -> new centroid (sum/w)
   * WGSL has no core f32 atomics yet, so add is done with an
   * atomicCompareExchangeWeak loop on the u32 bit pattern.
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

// WGSL has no core f32 atomics. CVT accumulation strategy depends on the
// seed budget:
//   * count <= DIRECT_CAP  -> a workgroup folds each pixel into a shared
//     array indexed DIRECTLY by seed index (no scanning, no device-memory
//     CAS contention). The workgroup publishes one device-add per seed.
//   * count >  DIRECT_CAP  -> per-pixel device add (the original path). At
//     high seed counts contention is negligible, so this stays fastest.
// This splits the difference: low budgets (where a handful of seeds were
// being hammered by every pixel) get the shared fast path; high budgets
// keep the simple round-trip.
const TILE          = 256u;            // threads per workgroup for assign
const DIRECT_CAP    = 128u;            // max seeds handled in shared mem

var<workgroup> sh_seed_sx : array<atomic<u32>, DIRECT_CAP>;
var<workgroup> sh_seed_sy : array<atomic<u32>, DIRECT_CAP>;
var<workgroup> sh_seed_sw : array<atomic<u32>, DIRECT_CAP>;

// Float-aware CAS add on a workgroup (shared-memory) atomic.
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
  // zero the shared accumulators (workgroup private scratch)
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
      // direct-indexed shared accumulation: seed index == slot index
      accAddW(&sh_seed_sx[best], xw);
      accAddW(&sh_seed_sy[best], yw);
      accAddW(&sh_seed_sw[best], wgt);
    } else {
      // high seed count: not enough shared memory to index by seed, fall
      // back to a per-pixel device add
      accAdd(&acc[best * 3u + 0u], xw);
      accAdd(&acc[best * 3u + 1u], yw);
      accAdd(&acc[best * 3u + 2u], wgt);
    }
  }
  workgroupBarrier();

  // fold shared accumulation into the device accumulators
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
      // surface any WGSL validation errors so a silent GPU fail isn't
      // hidden behind the CPU fallback
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

      // One explicit pipeline layout shared by all three passes AND the
      // bind group. Using 'auto' would give each entry point a layout
      // containing only the bindings that pass touches (e.g. reset_all
      // only uses 2,3), which wouldn't accept our 4-entry bind group.
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

      // Reads go through this separate buffer (MAP_READ may only be
      // combined with COPY_DST — never STORAGE).
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

    /**
     * Run `iters` Lloyd passes on the GPU, returning Float32Array of
     * {x,y} pairs (actually flat x0,y0,x1,y1,...). Returns null on
     * failure, or when `isCancelled` becomes truthy between whole iters.
     */
    async run(pts, saliency, w, h, iters, { onProgress, isCancelled } = {}) {
      if (!this.device || !iters || iters <= 0) return null;
      const count = pts.length;
      const total = w * h;
      this._ensure(total, count);

      // upload inputs
      const seedData = new Float32Array(count * 2);
      for (let i = 0; i < count; i++) { seedData[i * 2] = pts[i].x; seedData[i * 2 + 1] = pts[i].y; }
      this.device.queue.writeBuffer(this.seedBuf, 0, seedData);
      this.device.queue.writeBuffer(this.salBuf, 0, saliency);
      const param = new Uint32Array(64 / 4);
      param[0] = w; param[1] = h; param[2] = total; param[3] = count;
      this.device.queue.writeBuffer(this.paramBuf, 0, param);

      const grid = (n, per) => Math.max(1, Math.ceil(n / per));
      const ASSIGN_WG = 256; // must match TILE in the assign shader

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

      // copy out + read
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