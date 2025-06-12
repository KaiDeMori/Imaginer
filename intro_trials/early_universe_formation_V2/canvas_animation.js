"use strict";
/*
Canvas Animation Engine – Early Universe Formation V2
----------------------------------------------------
Renders a **very first** placeholder animation so that we can
validate the rendering pipeline end-to-end:
  • Handles hi-DPI resize aware canvas sizing.
  • Runs a rAF loop.
  • Picks one of the pre-loaded *cosmic fog* sprites and animates
    it with a deterministic zoom-in / fade-out cycle.
  • No timeline yet – the goal is just to confirm that ImageBitmaps
    blit correctly and that the frame loop is stable.

Updated for deterministic_progress.md – Task 2 (Refactor fog-sprite selection):
  • Candidate list now derives from the **alphabetically sorted**
    `asset_manifest` instead of Map insertion order so that the index
    chosen by `rand()` is fully deterministic irrespective of loading
    timings.
  • Log strings adapted; obsolete helper variables removed.

Added in the previous revision (Task 4 · Debug / Dev Helpers):
  • Support for pause / resume / toggle of the rAF loop so that the
    animation can be inspected frame-by-frame from DevTools.
  • Public helpers: `pause()`, `resume()`, `toggle()`, and `is_running()`.
*/

// ---------------------------------------------------------------------------
// Imports --------------------------------------------------------------------
// ---------------------------------------------------------------------------
import { rand } from "./deterministic_rng.js";
import { asset_manifest } from "./preloader_module.js"; // (Task 1 · deterministic_progress.md)

// Note: UniverseAnimator is exported at the bottom so that other modules can
//       import it as a classical ES module.
export class UniverseAnimator {
  /**
   * @param {HTMLCanvasElement} canvas_el   – target canvas (will be sized to window)
   * @param {Map<string, ImageBitmap>} bitmaps_map – resolved map from the pre-loader
   */
  constructor(canvas_el, bitmaps_map) {
    this.canvas = canvas_el;
    this.ctx    = /** @type {CanvasRenderingContext2D} */ (this.canvas.getContext("2d"));
    if (!this.ctx) throw new Error("2D context unavailable");

    this.bitmaps_map = bitmaps_map;

    // ---------------------------------------------------------------------
    // Deterministic *cosmic fog* bitmap selection (Task 2) ------------------
    // ---------------------------------------------------------------------
    // Candidate list is derived from `asset_manifest`, which is already
    // alphabetically sorted and therefore deterministic. We simply filter
    // for the cosmic-fog paths *once*, then pick a single URL using the
    // seeded PRNG. The bitmap itself is looked up in `bitmaps_map`.
    const fog_urls = asset_manifest.filter(url => url.includes("/cosmic_fog/"));

    if (fog_urls.length === 0) {
      console.warn("[UniverseAnimator] No cosmic_fog entries found in asset_manifest – animation will render blank.");
      this.fog_bitmap      = null;
      this.fog_bitmap_url  = null;
    } else {
      // Task 4 · Regression tests – log raw RNG value so testers can verify
      // that the second PRNG call remains deterministic across reloads.
      const rng_val = rand();
      const idx = Math.floor(rng_val * fog_urls.length);
      console.log(`[UniverseAnimator] RNG value for fog selection: ${rng_val}`);

      const selected_url = fog_urls[idx];
      const bmp = bitmaps_map.get(selected_url) || null;

      if (!bmp) {
        console.warn(`[UniverseAnimator] Fog URL '${selected_url}' not found in preloaded_bitmaps – check preloader consistency.`);
      }

      this.fog_bitmap_url = selected_url;
      this.fog_bitmap     = bmp;

      console.log(`[UniverseAnimator] Deterministic fog selection → idx ${idx} / ${fog_urls.length}, url '${selected_url}'.`);
    }

    // Animation state ------------------------------------------------------
    this._start_time = /** @type {number | null} */ (null); // timestamp set on first frame

    // FPS sampling ---------------------------------------------------------
    this._fps_sample_window_ms = 2_000;   // 2-second rolling window
    this._fps_frames_accum     = 0;       // frames collected inside window
    this._fps_window_start_ts  = /** @type {number | null} */ (null);    // window start timestamp

    // Validation flags -----------------------------------------------------
    this._validation_logged     = false;  // first-frame validation
    this._hi_dpi_validation_id  = 0;      // increments on every resize so we can pair log lines

    // Current devicePixelRatio (kept for quick checks) ---------------------
    this._dpr = window.devicePixelRatio || 1;
    // Media-query list that tracks DPR changes (re-created in _register_dpr_listener)
    this._dpr_mql = /** @type {MediaQueryList | null} */ (null);

    // ---------------------------------------------------------------------
    // rAF control (Task 4) --------------------------------------------------
    // ---------------------------------------------------------------------
    this._running = false;      // Whether the animation loop is currently active
    this._raf_id  = /** @type {number | null} */ (null); // handle returned by requestAnimationFrame

    // Bindings -------------------------------------------------------------
    this._update    = this._update.bind(this);
    this._on_resize = this._on_resize.bind(this);

    // Resize once and add listener.
    this._on_resize();
    window.addEventListener("resize", this._on_resize);
    this._register_dpr_listener();

    // Diagnostic: verify import works (will be removed once Step 2 lands).
    console.debug(`[UniverseAnimator] asset_manifest imported with ${asset_manifest.length} entries (diagnostic only).`);
  }
  
  // -----------------------------------------------------------------------
  // Public ----------------------------------------------------------------
  // -----------------------------------------------------------------------
  /** Begin / resume the animation loop. */
  start() {
    if (this._running) return; // already running

    this._running = true;
    this._raf_id = requestAnimationFrame(this._update);
  }

  /** Pause the rAF loop (no-op if already paused). */
  pause() {
    if (!this._running) return;
    this._running = false;
    if (this._raf_id !== null) {
      cancelAnimationFrame(this._raf_id);
      this._raf_id = null;
    }
    console.log("[UniverseAnimator] Animation paused.");
  }

  /** Resume the rAF loop if it is currently paused. */
  resume() {
    if (this._running) return;
    console.log("[UniverseAnimator] Animation resumed.");
    this.start();
  }

  /** Toggle between paused ↔ running state. Returns the *new* state. */
  toggle() {
    if (this._running) {
      this.pause();
    } else {
      this.resume();
    }
    return this._running;
  }

  /** Query helper – true if animation is actively running. */
  is_running() { return this._running; }

  // -----------------------------------------------------------------------
  // Private ---------------------------------------------------------------
  // -----------------------------------------------------------------------
  /**
   * Sets up (or re-sets) a MediaQueryList listener so that we can react when
   * the browser's `devicePixelRatio` changes without an actual resize event
   * (e.g. the window is dragged between monitors with different scaling).
   * We fall back to listening for the generic `resize` event when `matchMedia`
   * is unavailable.
   */
  _register_dpr_listener() {
    // Clean up any previous listener first.
    if (this._dpr_mql) {
      const mql = this._dpr_mql;
      if (typeof mql.removeEventListener === "function") {
        mql.removeEventListener("change", this._on_resize);
      } else if (typeof mql.removeListener === "function") {
        // Safari ≤ 14
        mql.removeListener(this._on_resize);
      }
    }

    const query = `(resolution: ${this._dpr}dppx)`;
    try {
      this._dpr_mql = window.matchMedia(query);
      const mql = this._dpr_mql;
      if (typeof mql.addEventListener === "function") {
        mql.addEventListener("change", this._on_resize);
      } else if (typeof mql.addListener === "function") {
        // Safari ≤ 14
        mql.addListener(this._on_resize);
      }
    } catch (err) {
      // `matchMedia` might throw in very old browsers – not a concern for our
      // desktop-only target, but we guard anyway.
      console.warn("[UniverseAnimator] matchMedia unavailable → relying solely on window.resize for DPR changes.");
      this._dpr_mql = null;
    }
  }

  /**
   * Validates that the canvas' backing-store size and the applied context
   * transform are consistent with the current DPR. Emits a succinct console
   * message; used by manual testers to verify hi-DPI correctness after every
   * resize / monitor switch.
   *
   * @param {number} dpr – devicePixelRatio we just applied
   * @param {number} css_w – latest CSS pixel width (window.innerWidth)
   * @param {number} css_h – latest CSS pixel height (window.innerHeight)
   */
  _validate_hi_dpi(dpr, css_w, css_h) {
    let ok = true;

    // 1) Backing-store dimensions
    if (this.canvas.width !== Math.round(css_w * dpr) || this.canvas.height !== Math.round(css_h * dpr)) {
      ok = false;
    }

    // 2) Context transform (scale should equal DPR if getTransform available)
    if (ok && typeof this.ctx.getTransform === "function") {
      const m = this.ctx.getTransform();
      if (Math.abs(m.a - dpr) > 0.01 || Math.abs(m.d - dpr) > 0.01) {
        ok = false;
      }
    }

    const id = ++this._hi_dpi_validation_id; // increment for clarity in logs
    if (ok) {
      console.log(`[UniverseAnimator] [Hi-DPI ✔︎ #${id}] DPR ${dpr}, canvas ${this.canvas.width}×${this.canvas.height} backing store correct.`);
    } else {
      console.warn(`[UniverseAnimator] [Hi-DPI ⚠︎ #${id}] Detected mismatch. DPR ${dpr}, canvas ${this.canvas.width}×${this.canvas.height} backing store, expected ${Math.round(css_w * dpr)}×${Math.round(css_h * dpr)}.`);
    }
  }

  _on_resize() {
    const dpr = window.devicePixelRatio || 1;
    const w   = window.innerWidth;
    const h   = window.innerHeight;

    // Bail early if neither DPR nor size changed (avoids redundant work).
    if (dpr === this._dpr && w === (this.canvas.width / this._dpr) && h === (this.canvas.height / this._dpr)) {
      return;
    }

    this._dpr = dpr;

    this.canvas.width  = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width  = w + "px";
    this.canvas.style.height = h + "px";

    // Reset any existing transform *before* applying the new DPR scale.
    if (typeof this.ctx.resetTransform === "function") {
      this.ctx.resetTransform();
    } else {
      // Fallback for very old browsers (not expected in our target audience).
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    this.ctx.scale(dpr, dpr);

    console.log(`[UniverseAnimator] Canvas resized – CSS ${w}×${h}, internal ${this.canvas.width}×${this.canvas.height} @ DPR ${dpr}`);

    // Quick hi-DPI self-test to satisfy Task 2.
    this._validate_hi_dpi(dpr, w, h);

    // Re-initialise the DPR change listener to track future changes.
    this._register_dpr_listener();
  }

  _update(ts) {
    if (!this._running) return; // Safety: should never happen, but guards against edge-cases.

    // ---------------------------------------------------------------------
    // FPS sampling & reporting --------------------------------------------
    // ---------------------------------------------------------------------
    if (this._fps_window_start_ts === null) {
      this._fps_window_start_ts = ts;
      this._fps_frames_accum    = 0;
    }
    this._fps_frames_accum++;

    const fps_window_elapsed = ts - this._fps_window_start_ts;
    if (fps_window_elapsed >= this._fps_sample_window_ms) {
      const fps = this._fps_frames_accum / (fps_window_elapsed / 1000);
      const fps_msg = `[UniverseAnimator] Average FPS (last ${(fps_window_elapsed/1000).toFixed(1)} s): ${fps.toFixed(1)}`;
      if (fps < 55) {
        console.warn(fps_msg);
      } else {
        console.log(fps_msg);
      }
      this._fps_window_start_ts = ts;
      this._fps_frames_accum    = 0;
    }

    // ---------------------------------------------------------------------
    // Animation logic ------------------------------------------------------
    // ---------------------------------------------------------------------
    if (this._start_time === null) this._start_time = ts;
    const elapsed   = (ts - this._start_time) / 1000; // seconds since start

    // Temporarily: 10-second looping cycle ---------------------------------
    const cycle     = 10;
    const t_cycle   = elapsed % cycle;          // 0 … 10
    const progress  = t_cycle / cycle;          // 0 … 1

    // Scale from 1 → 3 and back every cycle (yo-yo)
    const scale = progress < 0.5
      ? 1 + (progress / 0.5) * 2              // 1 → 3 over first half
      : 3 - ((progress - 0.5) / 0.5) * 2;     // 3 → 1 over second half

    // Alpha fade (optional) – keep full opacity for now.
    const alpha = 1;

    // Clear canvas ---------------------------------------------------------
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.fog_bitmap) {
      const bmp = this.fog_bitmap;
      const cx  = this.canvas.width  / (2 * this._dpr);
      const cy  = this.canvas.height / (2 * this._dpr);
      const draw_w = bmp.width  * scale;
      const draw_h = bmp.height * scale;

      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.ctx.translate(cx, cy);
      this.ctx.drawImage(bmp, -draw_w / 2, -draw_h / 2, draw_w, draw_h);
      this.ctx.restore();
    }

    // ---------------------------------------------------------------------
    // One-off validation log (runs after first rendered frame) ------------
    // ---------------------------------------------------------------------
    if (!this._validation_logged) {
      if (this.fog_bitmap) {
        console.log(`[UniverseAnimator] Validation ✔︎  Cosmic fog sprite selected → '${this.fog_bitmap_url}'. Animation & rendering active. DPR ${this._dpr}`);
      } else {
        console.warn("[UniverseAnimator] Validation ⚠︎  No cosmic fog sprite could be validated. Check asset paths.");
      }
      this._validation_logged = true;
    }

    // Schedule next frame --------------------------------------------------
    this._raf_id = requestAnimationFrame(this._update);
  }
}