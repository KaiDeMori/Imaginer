"use strict";
/*
Canvas Animation Engine – Early Universe Formation V2 – Multi-Layer Edition
*/

// ---------------------------------------------------------------------------
// Imports --------------------------------------------------------------------
// ---------------------------------------------------------------------------
import { generate_sprite_instances } from "./sprite_instance_manager.js";
import { get_layer_states } from "./timeline_engine.js";

// ---------------------------------------------------------------------------
// Constants ------------------------------------------------------------------
// ---------------------------------------------------------------------------
const TOTAL_DURATION_MS = 25_000; //was 25_000;

// Camera Z curve ---------------------------------
const CAM_Z_START = -1; // at t = 0 (closest to layers)
const CAM_Z_END = -20; // at t = 1 (camera has moved "forward" by 19 units)

// --- Timeline-based termination --------------------------------------------
// Wait for full timeline completion to preserve music synchronization

// Simple helpers -------------------------------------------------------------
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function clamp(x, lo = 0, hi = 1) {
  return x < lo ? lo : x > hi ? hi : x;
}

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
    this.ctx = /** @type {CanvasRenderingContext2D} */ (this.canvas.getContext("2d"));
    if (!this.ctx) throw new Error("2D context unavailable");

    // -----------------------------------------------------------------------
    // Sprite instances -------------------------------------------------------
    // -----------------------------------------------------------------------
    this.sprite_instances = generate_sprite_instances(bitmaps_map);
    console.log(`[UniverseAnimator] Generated ${this.sprite_instances.length} sprite instances.`);

    // Animation state --------------------------------------------------------
    this._start_time = /** @type {number | null} */ (null);
    this._last_ts = /** @type {number | null} */ (null); // for per-frame dt
    this._paused_time_accum = 0; // keeps total paused duration so progress doesn’t jump

    // FPS sampling -----------------------------------------------------------
    this._fps_sample_window_ms = 2_000; // 2-second rolling window
    this._fps_frames_accum = 0;
    this._fps_window_start_ts = /** @type {number | null} */ (null);

    // Hi-DPI / resize bookkeeping -------------------------------------------
    this._validation_logged = false;
    this._hi_dpi_validation_id = 0;
    this._dpr = window.devicePixelRatio || 1;
    this._dpr_mql = /** @type {MediaQueryList | null} */ (null);

    // rAF control ------------------------------------------------------------
    this._running = false;
    this._raf_id = /** @type {number | null} */ (null);

    // Timeline-based termination flag ---------------------------------------
    this._animation_complete = false;

    // Bindings ---------------------------------------------------------------
    this._update = this._update.bind(this);
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
    this._last_ts = null; // reset dt clock
    console.log("[UniverseAnimator] Animation paused.");
  }

  resume() {
    if (this._running) return;
    this._running = true;

    if (this._pause_start_ts !== undefined) {
      this._paused_time_accum += performance.now() - this._pause_start_ts;
      this._pause_start_ts = undefined;
    }

    this._last_ts = null; // restart dt measurement
    this._raf_id = requestAnimationFrame(this._update);
    console.log("[UniverseAnimator] Animation resumed.");
  }

  toggle() {
    return this._running ? (this.pause(), false) : (this.resume(), true);
  }
  is_running() {
    return this._running;
  }

  // -------------------------------------------------------------------------
  // Hi-DPI helpers ----------------------------------------------
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
      mql.addEventListener("change", this._on_resize);
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
    const w = window.innerWidth;
    const h = window.innerHeight;

    if (dpr === this._dpr && w === this.canvas.width / this._dpr && h === this.canvas.height / this._dpr) return;

    this._dpr = dpr;

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + "px";
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
    // dt / timing ------------------------------------------------------------
    // -----------------------------------------------------------------------
    const dt_sec = this._last_ts === null ? 0 : (ts - this._last_ts) / 1000;
    this._last_ts = ts;

    if (this._start_time === null) this._start_time = ts;
    const elapsed_total = ts - this._start_time - this._paused_time_accum;
    let global_progress = elapsed_total / TOTAL_DURATION_MS;
    if (global_progress > 1) global_progress = 1; // clamp – hold on last frame

    // Current camera Z position (Task 5) ------------------------------------
    const cam_z = lerp(CAM_Z_START, CAM_Z_END, global_progress);

    // Check if animation should terminate ------------------------------------
    if (!this._animation_complete && global_progress >= 1.0) {
      this._animation_complete = true;

      // Clear to black
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      console.log(`[UniverseAnimator] Animation complete - transitioning to Phase 4`);

      // Ensure cursor stays hidden during transition
      document.body.classList.add("hide_cursor");

      // Clean up Phase 3 UI elements
      const seed_ui_panel = document.getElementById("seedUIPanel");
      if (seed_ui_panel) {
        seed_ui_panel.remove();
        console.log(`[UniverseAnimator] Seed UI panel cleaned up`);
      } // Stop our animation but keep canvas for transition
      this._running = false;
      if (this._raf_id !== null) {
        cancelAnimationFrame(this._raf_id);
        this._raf_id = null;
      }

      // Trigger Phase 4 transition with our canvas
      window.transition_to_phase_4(this.canvas);
      return;
    }

    // -----------------------------------------------------------------------
    // Advance physics --------------------------------------------------
    // -----------------------------------------------------------------------
    if (dt_sec > 0) {
      for (const sp of this.sprite_instances) {
        sp.x += Math.cos(sp.angle) * sp.v_r * dt_sec;
        sp.y += Math.sin(sp.angle) * sp.v_r * dt_sec;
      }
    }

    // -----------------------------------------------------------------------
    // FPS sampling ----------------------------------------------
    // -----------------------------------------------------------------------
    if (this._fps_window_start_ts === null) {
      this._fps_window_start_ts = ts;
      this._fps_frames_accum = 0;
    }
    this._fps_frames_accum++;
    const fps_window_elapsed = ts - this._fps_window_start_ts;
    if (fps_window_elapsed >= this._fps_sample_window_ms) {
      const fps = this._fps_frames_accum / (fps_window_elapsed / 1000);
      const fps_msg = `[UniverseAnimator] Average FPS (last ${(fps_window_elapsed / 1000).toFixed(1)} s): ${fps.toFixed(1)}`;
      if (fps < 55) console.warn(fps_msg);
      else console.log(fps_msg);
      this._fps_window_start_ts = ts;
      this._fps_frames_accum = 0;
    }

    // -----------------------------------------------------------------------
    // Compute per-layer state ------------------------------------------------
    // -----------------------------------------------------------------------
    const layer_states_arr = get_layer_states(global_progress);
    /** @type {Record<string, typeof layer_states_arr[number]>} */
    const layer_states = {};
    for (const ls of layer_states_arr) layer_states[ls.name] = ls;

    // -----------------------------------------------------------------------
    // Build draw list --------------------------------------------------------
    // -----------------------------------------------------------------------
    /** @type<Array<{ bmp: ImageBitmap, alpha: number, center_x: number, center_y: number, draw_w: number, draw_h: number, z: number, rotation: number }>> */
    const drawables = [];

    const cx = this.canvas.width / (2 * this._dpr);
    const cy = this.canvas.height / (2 * this._dpr);

    const elapsed_sec = elapsed_total / 1000; // for rotation only

    for (const sp of this.sprite_instances) {
      const ls = layer_states[sp.layer];
      if (!ls) continue; // layer disabled?
      if (ls.opacity <= 0.001) continue; // cull fully transparent

      const final_z = ls.z + sp.z_jitter;

      // Cull sprites that are behind the camera (z <= cam_z)
      if (final_z <= cam_z) continue;

      // --- scale computation ----------------------------------------------
      let scale = cam_z / (cam_z - final_z); // perspective incl. moving cam

      // --- Screen position -------------------------------------------------
      const center_x = cx + sp.x * scale;
      const center_y = cy + sp.y * scale;

      const draw_w = sp.bitmap.width * scale;
      const draw_h = sp.bitmap.height * scale;

      const rotation = sp.base_rotation + sp.rot_speed * elapsed_sec;

      drawables.push({
        bmp: sp.bitmap,
        alpha: ls.opacity,
        center_x,
        center_y,
        draw_w,
        draw_h,
        z: final_z,
        rotation,
      });
    }

    // -----------------------------------------------------------------------
    // Sort & render ----------------------------------------------------------
    // -----------------------------------------------------------------------
    drawables.sort((a, b) => b.z - a.z); // far (big positive) → near (negative)

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const d of drawables) {
      this.ctx.globalAlpha = d.alpha;
      if (Math.abs(d.rotation) > 0.0001) {
        // Rotated draw – save/restore to avoid matrix accumulation.
        this.ctx.save();
        this.ctx.translate(d.center_x, d.center_y);
        this.ctx.rotate(d.rotation);
        this.ctx.drawImage(d.bmp, -d.draw_w / 2, -d.draw_h / 2, d.draw_w, d.draw_h);
        this.ctx.restore();
      } else {
        // Non-rotated draw (slightly faster path).
        const draw_x = d.center_x - d.draw_w / 2;
        const draw_y = d.center_y - d.draw_h / 2;
        this.ctx.drawImage(d.bmp, draw_x, draw_y, d.draw_w, d.draw_h);
      }
    }
    this.ctx.globalAlpha = 1; // reset

    // -----------------------------------------------------------------------
    // One-time validation log ------------------------------------------------
    // -----------------------------------------------------------------------
    if (!this._validation_logged) {
      console.log(
        `[UniverseAnimator] Validation ✔︎  Physics refactor active. Progress=${global_progress.toFixed(2)} camZ=${cam_z.toFixed(1)} Sprites=${
          drawables.length
        }. DPR ${this._dpr}`
      );
      this._validation_logged = true;
    }

    // -----------------------------------------------------------------------
    // Schedule next frame ----------------------------------------------------
    // -----------------------------------------------------------------------
    if (this._running) {
      this._raf_id = requestAnimationFrame(this._update);
    }
  }
}
