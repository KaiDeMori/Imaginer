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
*/

export class UniverseAnimator {
  /**
   * @param {HTMLCanvasElement} canvas_el   – target canvas (will be sized to window)
   * @param {Map<string, ImageBitmap>} bitmaps_map – resolved map from the pre-loader
   */
  constructor(canvas_el, bitmaps_map) {
    this.canvas = canvas_el;
    this.ctx    = this.canvas.getContext("2d");
    if (!this.ctx) throw new Error("2D context unavailable");

    this.bitmaps_map = bitmaps_map;

    // ---------------------------------------------------------------------
    // Pick a deterministic *cosmic fog* bitmap for the placeholder.
    // We use the first asset that matches the folder path.
    // ---------------------------------------------------------------------
    const fog_entry = [...bitmaps_map.entries()].find(([url]) => url.includes("/cosmic_fog/"));
    if (!fog_entry) {
      console.warn("[UniverseAnimator] No cosmic_fog bitmap found – placeholder will be blank.");
      this.fog_bitmap      = null;
      this.fog_bitmap_url  = null;
    } else {
      this.fog_bitmap_url  = fog_entry[0];
      this.fog_bitmap      = fog_entry[1];
    }

    // Animation state ------------------------------------------------------
    this._start_time = null; // timestamp set on first frame

    // FPS sampling ---------------------------------------------------------
    this._fps_sample_window_ms = 2_000;   // 2-second rolling window
    this._fps_frames_accum     = 0;       // frames collected inside window
    this._fps_window_start_ts  = null;    // window start timestamp

    // Validation flag ------------------------------------------------------
    this._validation_logged = false;

    // Bindings --------------------------------------------------------------
    this._update    = this._update.bind(this);
    this._on_resize = this._on_resize.bind(this);

    // Resize once and add listener.
    this._on_resize();
    window.addEventListener("resize", this._on_resize);
  }

  // -----------------------------------------------------------------------
  // Public ----------------------------------------------------------------
  // -----------------------------------------------------------------------
  start() {
    requestAnimationFrame(this._update);
  }

  // -----------------------------------------------------------------------
  // Private ---------------------------------------------------------------
  // -----------------------------------------------------------------------
  _on_resize() {
    const dpr = window.devicePixelRatio || 1;
    const w   = window.innerWidth;
    const h   = window.innerHeight;

    this.canvas.width  = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width  = w + "px";
    this.canvas.style.height = h + "px";

    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);

    console.log(`[UniverseAnimator] Canvas resized – ${w}×${h} @ DPR ${dpr}`);
  }

  _update(ts) {
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
      const cx  = this.canvas.width  / (2 * (window.devicePixelRatio || 1));
      const cy  = this.canvas.height / (2 * (window.devicePixelRatio || 1));
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
        console.log(`[UniverseAnimator] Validation ✔︎  Cosmic fog sprite selected → '${this.fog_bitmap_url}'. Animation & rendering active.`);
      } else {
        console.warn("[UniverseAnimator] Validation ⚠︎  No cosmic fog sprite could be validated. Check asset paths.");
      }
      this._validation_logged = true;
    }

    requestAnimationFrame(this._update);
  }
}
