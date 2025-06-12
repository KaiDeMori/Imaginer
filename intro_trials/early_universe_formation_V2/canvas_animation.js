"use strict";
/*
Canvas Animation Engine – Early Universe Formation V2 – Multi-Layer Edition
---------------------------------------------------------------------------
This revision fulfils *Task 4 · Rendering Pipeline* of
`multi_layer_animation_progress.md`.

Key upgrades compared with the previous placeholder build:
  • Integrates the new timeline / layer model modules so the renderer
    now drives *all* visual layers (cosmic fog → planet).
  • Generates a deterministic sprite instance list via
    `generate_sprite_instances()`.
  • Each animation frame:
        – Converts the master `elapsed` time → `global_progress` (0 → 1).
        – Queries `get_layer_states(global_progress)` for per-layer
          opacity, pseudo-Z and scale.
        – Computes per-sprite final Z (layerZ + jitter) & scale, applies a
          small XY drift based on the sprite’s angle and Z.
        – Sorts visible sprites by Z (far → near) and blits them with the
          correct globalAlpha.
        – Culls fully transparent sprites to save draw calls.
  • Once the master progress reaches 1, the scene *holds* on the final
    planet frame.  The rAF loop keeps running so DevTools can still be
    used for frame stepping / inspection.

Other features (hi-DPI handling, pause/resume helpers, FPS sampling, etc.)
are retained from the original implementation.
*/

// ---------------------------------------------------------------------------
// Imports --------------------------------------------------------------------
// ---------------------------------------------------------------------------
import { rand } from "./deterministic_rng.js"; // only used for any future drift tweaks
import { generate_sprite_instances } from "./sprite_instance_manager.js";
import { get_layer_states } from "./timeline_engine.js";

// ---------------------------------------------------------------------------
// Constants ------------------------------------------------------------------
// ---------------------------------------------------------------------------
const TOTAL_DURATION_MS = 25_000; // matches planning document (section 5)
const CAM_Z             = -1;     // camera pseudo-Z used in perspective formula

// How much XY drift we apply per positive Z unit (very subtle by default).
const XY_DRIFT_PER_Z = 10; // pixels at DPR 1

// ---------------------------------------------------------------------------
// UniverseAnimator -----------------------------------------------------------
// ---------------------------------------------------------------------------
export class UniverseAnimator {
  /**
   * @param {HTMLCanvasElement} canvas_el   – target canvas (will be sized to window)
   * @param {Map<string, ImageBitmap>} bitmaps_map – resolved map from the pre-loader
   */
  constructor(canvas_el, bitmaps_map) {
    this.canvas = canvas_el;
    this.ctx    = /** @type {CanvasRenderingContext2D} */ (this.canvas.getContext("2d"));
    if (!this.ctx) throw new Error("2D context unavailable");

    // -----------------------------------------------------------------------
    // Sprite instances -------------------------------------------------------
    // -----------------------------------------------------------------------
    this.sprite_instances = generate_sprite_instances(bitmaps_map);
    console.log(`[UniverseAnimator] Generated ${this.sprite_instances.length} sprite instances.`);

    // Animation state --------------------------------------------------------
    this._start_time = /** @type {number | null} */ (null);
    this._paused_time_accum = 0; // keeps total paused duration so progress doesn’t jump

    // FPS sampling -----------------------------------------------------------
    this._fps_sample_window_ms = 2_000;   // 2-second rolling window
    this._fps_frames_accum     = 0;
    this._fps_window_start_ts  = /** @type {number | null} */ (null);

    // Hi-DPI / resize bookkeeping -------------------------------------------
    this._validation_logged     = false;
    this._hi_dpi_validation_id  = 0;
    this._dpr = window.devicePixelRatio || 1;
    this._dpr_mql = /** @type {MediaQueryList | null} */ (null);

    // rAF control ------------------------------------------------------------
    this._running = false;
    this._raf_id  = /** @type {number | null} */ (null);

    // Bindings ---------------------------------------------------------------
    this._update    = this._update.bind(this);
    this._on_resize = this._on_resize.bind(this);

    // Resize once and add listener.
    this._on_resize();
    window.addEventListener("resize", this._on_resize);
    this._register_dpr_listener();
  }

  // -------------------------------------------------------------------------
  // Public helpers -----------------------------------------------------------
  // -------------------------------------------------------------------------
  start() {
    if (this._running) return;
    this._running = true;
    this._raf_id = requestAnimationFrame(this._update);
  }

  pause() {
    if (!this._running) return;
    this._running = false;
    if (this._raf_id !== null) cancelAnimationFrame(this._raf_id);
    this._raf_id = null;

    // Track paused duration so progress can be compensated when resumed.
    this._pause_start_ts = performance.now();
    console.log("[UniverseAnimator] Animation paused.");
  }

  resume() {
    if (this._running) return;
    this._running = true;

    if (this._pause_start_ts !== undefined) {
      this._paused_time_accum += performance.now() - this._pause_start_ts;
      this._pause_start_ts = undefined;
    }

    this._raf_id = requestAnimationFrame(this._update);
    console.log("[UniverseAnimator] Animation resumed.");
  }

  toggle() { return this._running ? (this.pause(), false) : (this.resume(), true); }
  is_running() { return this._running; }

  // -------------------------------------------------------------------------
  // Hi-DPI helpers (unchanged) ----------------------------------------------
  // -------------------------------------------------------------------------
  _register_dpr_listener() {
    if (this._dpr_mql) {
      const mql = this._dpr_mql;
      if (typeof mql.removeEventListener === "function") mql.removeEventListener("change", this._on_resize);
      else if (typeof mql.removeListener === "function") mql.removeListener(this._on_resize);
    }

    const query = `(resolution: ${this._dpr}dppx)`;
    try {
      this._dpr_mql = window.matchMedia(query);
      const mql = this._dpr_mql;
      if (typeof mql.addEventListener === "function") mql.addEventListener("change", this._on_resize);
      else if (typeof mql.addListener === "function") mql.addListener(this._on_resize);
    } catch (_) {
      this._dpr_mql = null;
    }
  }

  _validate_hi_dpi(dpr, css_w, css_h) {
    let ok = true;
    if (this.canvas.width !== Math.round(css_w * dpr) || this.canvas.height !== Math.round(css_h * dpr)) ok = false;

    if (ok && typeof this.ctx.getTransform === "function") {
      const m = this.ctx.getTransform();
      if (Math.abs(m.a - dpr) > 0.01 || Math.abs(m.d - dpr) > 0.01) ok = false;
    }

    const id = ++this._hi_dpi_validation_id;
    if (ok) console.log(`[UniverseAnimator] [Hi-DPI ✔︎ #${id}] DPR ${dpr}, canvas ${this.canvas.width}×${this.canvas.height}`);
    else console.warn(`[UniverseAnimator] [Hi-DPI ⚠︎ #${id}] DPR ${dpr} mismatch.`);
  }

  _on_resize() {
    const dpr = window.devicePixelRatio || 1;
    const w   = window.innerWidth;
    const h   = window.innerHeight;

    if (dpr === this._dpr && w === (this.canvas.width / this._dpr) && h === (this.canvas.height / this._dpr)) return;

    this._dpr = dpr;

    this.canvas.width  = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width  = w + "px";
    this.canvas.style.height = h + "px";

    if (typeof this.ctx.resetTransform === "function") this.ctx.resetTransform();
    else this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);

    this._validate_hi_dpi(dpr, w, h);
    this._register_dpr_listener();
  }

  // -------------------------------------------------------------------------
  // Core frame loop ----------------------------------------------------------
  // -------------------------------------------------------------------------
  _update(ts) {
    if (!this._running) return;

    // -----------------------------------------------------------------------
    // Establish timing / progress -------------------------------------------
    // -----------------------------------------------------------------------
    if (this._start_time === null) this._start_time = ts;
    const elapsed = ts - this._start_time - this._paused_time_accum;
    let global_progress = elapsed / TOTAL_DURATION_MS;
    if (global_progress > 1) global_progress = 1; // clamp – hold on last frame

    // -----------------------------------------------------------------------
    // FPS sampling (unchanged) ----------------------------------------------
    // -----------------------------------------------------------------------
    if (this._fps_window_start_ts === null) {
      this._fps_window_start_ts = ts;
      this._fps_frames_accum    = 0;
    }
    this._fps_frames_accum++;
    const fps_window_elapsed = ts - this._fps_window_start_ts;
    if (fps_window_elapsed >= this._fps_sample_window_ms) {
      const fps = this._fps_frames_accum / (fps_window_elapsed / 1000);
      const fps_msg = `[UniverseAnimator] Average FPS (last ${(fps_window_elapsed/1000).toFixed(1)} s): ${fps.toFixed(1)}`;
      if (fps < 55) console.warn(fps_msg); else console.log(fps_msg);
      this._fps_window_start_ts = ts;
      this._fps_frames_accum    = 0;
    }

    // -----------------------------------------------------------------------
    // Compute per-layer state ------------------------------------------------
    // -----------------------------------------------------------------------
    const layer_states_arr = get_layer_states(global_progress);
    /** @type {Record<string, typeof layer_states_arr[number]>} */
    const layer_states = {};
    for (const ls of layer_states_arr) layer_states[ls.name] = ls;

    // -----------------------------------------------------------------------
    // Build draw list (cull transparent) ------------------------------------
    // -----------------------------------------------------------------------
    /** @type<Array<{ bmp: ImageBitmap, alpha: number, draw_x: number, draw_y: number, draw_w: number, draw_h: number, z: number }>> */
    const drawables = [];

    const cx = this.canvas.width  / (2 * this._dpr);
    const cy = this.canvas.height / (2 * this._dpr);

    for (const sp of this.sprite_instances) {
      const ls = layer_states[sp.layer];
      if (!ls) continue; // layer disabled?
      if (ls.opacity <= 0.001) continue; // cull fully transparent

      const final_z = ls.z + sp.z_jitter;
      const scale   = CAM_Z / (CAM_Z - final_z); // simple perspective

      const drift_r = final_z * XY_DRIFT_PER_Z; // farther layers drift more
      const dx = Math.cos(sp.angle) * drift_r;
      const dy = Math.sin(sp.angle) * drift_r;

      const draw_w = sp.bitmap.width  * scale;
      const draw_h = sp.bitmap.height * scale;

      drawables.push({
        bmp: sp.bitmap,
        alpha: ls.opacity,
        draw_x: cx + dx - draw_w / 2,
        draw_y: cy + dy - draw_h / 2,
        draw_w,
        draw_h,
        z: final_z,
      });
    }

    // -----------------------------------------------------------------------
    // Sort & render ----------------------------------------------------------
    // -----------------------------------------------------------------------
    drawables.sort((a, b) => b.z - a.z); // far (big positive) → near (negative)

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const d of drawables) {
      this.ctx.globalAlpha = d.alpha;
      this.ctx.drawImage(d.bmp, d.draw_x, d.draw_y, d.draw_w, d.draw_h);
    }
    this.ctx.globalAlpha = 1; // reset

    // -----------------------------------------------------------------------
    // One-time validation log ------------------------------------------------
    // -----------------------------------------------------------------------
    if (!this._validation_logged) {
      console.log(`[UniverseAnimator] Validation ✔︎  Multi-layer renderer active. Progress=${global_progress.toFixed(2)}. Sprites=${drawables.length}. DPR ${this._dpr}`);
      this._validation_logged = true;
    }

    // -----------------------------------------------------------------------
    // Schedule next frame ----------------------------------------------------
    // -----------------------------------------------------------------------
    this._raf_id = requestAnimationFrame(this._update);
  }
}
