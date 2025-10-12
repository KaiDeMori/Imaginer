// viewer.js – Full-window canvas viewer with mouse-wheel zoom
//             • Mouse-centric zoom
//             • Auto-recenter when zooming back to “fit”
//             • Press “D” to toggle debug overlay

import { viewer_behaviour } from "./viewer_behaviour.js";
import { Brush_cursor } from "./brush_cursor.js";
import { mask_manager } from "./mask_manager.js";
import { zoom_pan_manager } from "./zoom_pan_manager.js";
import { debug_manager } from "./debug_manager.js";

export class Viewer {
  /* ------------------------------------------------------------------
       Tunables
    ------------------------------------------------------------------ */
  static WHEEL_SENSITIVITY = 0.0015; // lower = slower zoom
  static MIN_ZOOM = 1; // 1 × fitScale  (= "show whole image")
  static MAX_ZOOM = 8; // cap
  static DEBUG_FONT = "12px monospace";
  static EPS = 1e-3; // floating-point tolerance

  /* ------------------------------------------------------------------
       Construction
    ------------------------------------------------------------------ */
  constructor() {
    /* Overlay node ------------------------------------------------ */
    this.overlay = document.createElement("div");
    this.overlay.id = "imaginer-viewer";
    this.overlay.classList.add("viewer_overlay");
    document.body.appendChild(this.overlay);

    // Mask mode and remove mask buttons will be positioned directly via CSS

    this.mask_mode = false;
    // Mask data and offscreen cache
    this.mask_data = null; // Uint8ClampedArray for alpha mask
    this.mask_cache_canvas = null; // Offscreen canvas for mask overlay
    this.mask_cache_dirty = true;
    this.mask_manager = new mask_manager(this);

    this.mask_mode_button = document.createElement("button");
    this.mask_mode_button.textContent = "Mask Mode";
    this.mask_mode_button.classList.add("mask_mode_button");
    this.mask_mode_button.addEventListener("click", (e) => {
      // Prevent overlay click event from firing (which would close viewer)
      e.stopPropagation();
      this.toggle_mask_mode();
    });

    this.remove_mask_button = document.createElement("button");
    this.remove_mask_button.textContent = "Remove Mask";
    this.remove_mask_button.classList.add("remove_mask_button");
    // Start hidden, will be shown in mask mode
    this.remove_mask_button.style.display = "none";
    this.remove_mask_button.addEventListener("click", (e) => {
      e.stopPropagation();
      this.remove_all_masks();
    });

    // Append buttons directly to overlay (positioned via CSS)
    this.overlay.appendChild(this.mask_mode_button);
    this.overlay.appendChild(this.remove_mask_button);

    // Dynamically manage mask mode button visibility
    this.update_mask_mode_button_visibility();

    /* Canvas ------------------------------------------------------- */
    this.canvas = document.createElement("canvas");
    this.canvas.classList.add("viewer_canvas");
    this.overlay.appendChild(this.canvas);

    // Brush cursor (now handled by Brush_cursor)
    this.brush_cursor = new Brush_cursor();

    /* Debug HUD ---------------------------------------------------- */
    this.debug = false;
    this.debug_element = document.createElement("div");
    this.debug_element.classList.add("debug_element");
    this.overlay.appendChild(this.debug_element);

    /* Events delegated to viewer_behaviour */
    this.behaviour = new viewer_behaviour(this);

    /* State -------------------------------------------------------- */
    this.bitmap = null; // current ImageBitmap
    this.zoom_factor = 1;
    this.fit_scale = 1;
    this.pan_X = 0;
    this.pan_Y = 0;

    // Remove mode state
    this.is_painting = false;
    this.is_shift = false;
    this.last_paint_ix = null;
    this.last_paint_iy = null;

    // Performance optimization state
    this.raf_requested = false;
    this.pending_paint = null;

    this.zoom_pan_manager = new zoom_pan_manager(this);

    // Replace reset_transforms, compute_fit_scale, and on_wheel with zoom_pan_manager calls
    this.reset_transforms = this.zoom_pan_manager.reset_transforms.bind(this.zoom_pan_manager);
    this.compute_fit_scale = this.zoom_pan_manager.compute_fit_scale.bind(this.zoom_pan_manager);
    this.on_wheel = this.zoom_pan_manager.on_wheel.bind(this.zoom_pan_manager);

    this.debug_manager = new debug_manager(this);

    // Replace toggle_debug and drawDebug with debug_manager calls
    this.drawDebug = this.debug_manager.draw_debug.bind(this.debug_manager);

    // Helper: update Remove Masks button visibility
    this._update_remove_mask_button_visibility = () => {
      // Show only if mask mode is active and mask_data has any nonzero value
      if (this.mask_mode && this.mask_data && this.mask_data.some((v) => v)) {
        this.remove_mask_button.style.display = "inline-block";
      } else {
        this.remove_mask_button.style.display = "none";
      }
    };
  }

  /**
   * Show or hide the mask mode button based on the latest config.
   */
  update_mask_mode_button_visibility() {
    const show_mask_mode = localStorage.getItem("imaginer.show_mask_mode_button") === "true";
    // Show/hide buttons directly
    if (show_mask_mode) {
      this.mask_mode_button.style.display = "block";
      this.remove_mask_button.style.display = "block";
    } else {
      this.mask_mode_button.style.display = "none";
      this.remove_mask_button.style.display = "none";
    }
  }

  /* ==================================================================
       PUBLIC
    ================================================================== */
  /**
   * Open an image in the viewer, loading its mask if present.
   * @param {Blob} blob - The image blob to display
   * @param {Object} [opts] - Optional: { image_id }
   */
  async open(blob, opts = {}) {
    // Always update mask mode button visibility before showing viewer
    this.update_mask_mode_button_visibility();

    // Store image_id for later mask save
    this.image_id = opts.image_id || null;
    // Strict check for valid Blob
    if (!(blob instanceof Blob) || blob.size === 0) {
      // Show dialog to user
      const do_cleanup = window.confirm(
        "This image cannot be opened because it was saved in an old or invalid format.\n" +
          "Would you like to clean up all old/bad images? (This will delete all saved images.)"
      );
      if (do_cleanup && window.sessionStore) {
        await window.sessionStore.clear();
        if (window.location) window.location.reload();
      }
      return;
    }

    if (this.bitmap?.close) this.bitmap.close();
    this.bitmap = await createImageBitmap(blob);

    this.reset_transforms();
    this.overlay.classList.toggle("viewer_overlay_visible", true);

    // Load mask from session_store if image_id is provided
    this.mask_data = null;
    this.mask_cache_canvas = null;
    this.mask_cache_dirty = true;
    if (opts.image_id && window.sessionStore) {
      try {
        const rec = await window.sessionStore.get(opts.image_id);
        if (rec && rec.mask_blob && typeof rec.mask_blob === "object" && rec.mask_blob instanceof Blob && rec.mask_blob.size > 0) {
          // Load mask_blob as ImageData and convert to mask_data
          try {
            const mask_bitmap = await createImageBitmap(rec.mask_blob);
            const mask_canvas = document.createElement("canvas");
            mask_canvas.width = mask_bitmap.width;
            mask_canvas.height = mask_bitmap.height;
            const ctx = mask_canvas.getContext("2d");
            ctx.drawImage(mask_bitmap, 0, 0);
            const img_data = ctx.getImageData(0, 0, mask_bitmap.width, mask_bitmap.height);
            this.mask_data = new Uint8ClampedArray(mask_bitmap.width * mask_bitmap.height);
            for (let i = 0; i < this.mask_data.length; ++i) {
              // If alpha = 0 (editable), treat as masked (user painted it red)
              this.mask_data[i] = img_data.data[i * 4 + 3] === 0 ? 1 : 0;
            }
            // Normalize: ensure all values are 0 or 1
            for (let i = 0; i < this.mask_data.length; ++i) {
              this.mask_data[i] = this.mask_data[i] ? 1 : 0;
            }
            this.mask_cache_canvas = mask_canvas;
            this.mask_cache_dirty = true;
          } catch (err) {
            // If mask loading fails, just init empty mask
            this.mask_manager.init_mask();
          }
        } else {
          this.mask_manager.init_mask();
        }
      } catch (e) {
        this.mask_manager.init_mask();
      }
    } else {
      this.mask_manager.init_mask();
    }
    this.redraw();
    this._update_remove_mask_button_visibility();
  }

  /**
   * Close the viewer and persist the mask (if present) to session_store.
   * Requires that the image_id is set on this.image_id.
   */
  async close() {
    if (!this.is_open()) return;

    // Save mask if present, non-empty, and image_id is set
    if (this.mask_data && this.bitmap && this.image_id && window.sessionStore) {
      // Check if mask is empty (all zero)
      let is_empty = true;
      for (let i = 0; i < this.mask_data.length; ++i) {
        if (this.mask_data[i]) {
          is_empty = false;
          break;
        }
      }
      // Get the record to update uuid if needed
      let rec = await window.sessionStore.get(this.image_id);
      let uuid = rec && rec.uuid ? rec.uuid : window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now();
      if (!is_empty) {
        // Convert mask_data to PNG blob
        const mask_canvas = document.createElement("canvas");
        mask_canvas.width = this.bitmap.width;
        mask_canvas.height = this.bitmap.height;
        const ctx = mask_canvas.getContext("2d");
        const img_data = ctx.createImageData(this.bitmap.width, this.bitmap.height);
        for (let i = 0; i < this.mask_data.length; ++i) {
          // Use white for protected (masked) pixels, black for editable
          const is_masked = this.mask_data[i];
          img_data.data[i * 4 + 0] = is_masked ? 255 : 0; // R
          img_data.data[i * 4 + 1] = is_masked ? 255 : 0; // G
          img_data.data[i * 4 + 2] = is_masked ? 255 : 0; // B
          img_data.data[i * 4 + 3] = is_masked ? 0 : 255; // Alpha: masked areas = editable (0), unmasked = protected (255)
        }
        ctx.putImageData(img_data, 0, 0);
        // Export as PNG blob
        const mask_blob = await new Promise((res) => mask_canvas.toBlob(res, "image/png"));
        await window.sessionStore.update(this.image_id, { mask_blob, uuid });
        // Dispatch event to notify gallery of mask update
        window.dispatchEvent(
          new CustomEvent("imaginer.mask-updated", {
            detail: {
              created: rec && rec.created,
              image_id: this.image_id,
              mask_blob,
              uuid,
            },
          })
        );
        // Attach uuid in memory to bitmap (for DnD, etc.)
        if (this.bitmap) this.bitmap.imaginer_uuid = uuid;
      } else {
        // Remove mask_blob if mask is empty
        console.debug("[Imaginer] Mask REMOVED (empty) for image_id:", this.image_id);
        await window.sessionStore.update(this.image_id, { mask_blob: null });
        // Dispatch event to notify gallery of mask removal
        window.dispatchEvent(
          new CustomEvent("imaginer.mask-updated", {
            detail: {
              created: rec && rec.created,
              image_id: this.image_id,
              mask_blob: null,
              uuid,
            },
          })
        );
      }
    }

    this.overlay.classList.toggle("viewer_overlay_visible", false);
    this.bitmap?.close?.();
    this.bitmap = null;
    this.mask_data = null;
    this.image_id = null;
  }

  /* ==================================================================
       INTERNAL
    ================================================================== */
  is_open() {
    return this.overlay.style.display !== "none";
  }

  /**
   * Remove all mask data from the current image (clear mask)
   */
  remove_all_masks() {
    if (this.mask_manager && typeof this.mask_manager.init_mask === "function") {
      this.mask_manager.init_mask();
      this.mask_cache_dirty = true;
      this.redraw();
      this._update_remove_mask_button_visibility();
    }
  }

  /* ---------------- Remove Mode ------------------------------- */
  toggle_mask_mode() {
    this.mask_mode = !this.mask_mode;
    this.behaviour.set_mode(this.mask_mode ? "mask" : "viewer");
    this._update_remove_mask_button_visibility();
  }

  on_mouse_down(e) {
    if (!this.mask_mode || e.button !== 0) return;
    this.is_painting = true;
    this.is_shift = e.shiftKey;
    const { ix, iy } = this.get_image_coords_from_event(e);
    this.last_paint_ix = ix;
    this.last_paint_iy = iy;
    this.paint_at_event(e);
  }

  on_mouse_move(e) {
    if (this.mask_mode) {
      this.update_brush_cursor(e);
      if (this.is_painting) {
        const { ix, iy } = this.get_image_coords_from_event(e);
        this.paint_line_to(ix, iy, this.is_shift);
        this.last_paint_ix = ix;
        this.last_paint_iy = iy;
        this.redraw();
        this._update_remove_mask_button_visibility();
      }
    }
  }

  _process_paint() {
    this.raf_requested = false;

    // Process any pending paint operation
    if (this.pending_paint) {
      const { ix, iy, is_shift } = this.pending_paint;
      this.paint_line_to(ix, iy, is_shift);
      this.redraw();
      this.pending_paint = null;
    }
  }

  on_mouse_up(e) {
    if (!this.mask_mode) return;
    this.is_painting = false;
    this.last_paint_ix = null;
    this.last_paint_iy = null;
  }

  update_brush_cursor(e) {
    // Map mouse to screen coordinates
    const screen_x = e.clientX;
    const screen_y = e.clientY;
    this.brush_cursor.set_position(screen_x, screen_y);
    this.brush_cursor.update_size();
  }

  set_brush_cursor_visible(visible) {
    this.brush_cursor.set_visible(visible);
  }

  set_brush_radius_px(px) {
    this.brush_cursor.set_radius_px(px);
  }

  get_brush_radius_img() {
    // Returns the brush radius in image coordinates
    // fit_scale and zoom_factor must be defined
    const scale = (this.fit_scale || 1) * (this.zoom_factor || 1);
    return this.brush_cursor.get_radius_px() / scale;
  }

  paint_at_event(e) {
    if (!this.bitmap) return;
    const { ix, iy } = this.get_image_coords_from_event(e);
    this.mask_manager.paint_mask(ix, iy, this.is_shift);
    this.last_paint_ix = ix;
    this.last_paint_iy = iy;
    this.redraw();
    this._update_remove_mask_button_visibility();
  }

  get_image_coords_from_event(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const scale = this.fit_scale * this.zoom_factor;
    const draw_W = this.bitmap.width * scale;
    const draw_H = this.bitmap.height * scale;
    const img_X = (window.innerWidth - draw_W) / 2 + this.pan_X;
    const img_Y = (window.innerHeight - draw_H) / 2 + this.pan_Y;
    const ix = Math.round((mx - img_X) / scale);
    const iy = Math.round((my - img_Y) / scale);
    return { ix, iy };
  }

  paint_line_to(ix, iy, erase) {
    if (this.last_paint_ix === null || this.last_paint_iy === null) {
      this.mask_manager.paint_mask(ix, iy, erase);
      return;
    }
    const dx = ix - this.last_paint_ix;
    const dy = iy - this.last_paint_iy;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    for (let i = 1; i <= steps; ++i) {
      const x = Math.round(this.last_paint_ix + (dx * i) / steps);
      const y = Math.round(this.last_paint_iy + (dy * i) / steps);
      this.mask_manager.paint_mask(x, y, erase);
    }
  }

  /* ---------------- Drawing Helpers -------------------------------- */
  compute_fit_scale() {
    if (!this.bitmap) {
      this.fit_scale = 1;
      return;
    }
    const maxW = window.innerWidth * 0.9; // 10 % margin
    const maxH = window.innerHeight * 0.9;
    this.fit_scale = Math.min(maxW / this.bitmap.width, maxH / this.bitmap.height, 1);
  }

  redraw() {
    if (!this.bitmap) return;

    // Canvas size = viewport size
    const view_W = window.innerWidth;
    const view_H = window.innerHeight;
    this.canvas.width = view_W;
    this.canvas.height = view_H;

    // Compute final draw rectangle
    const scale = this.fit_scale * this.zoom_factor;
    const draw_W = this.bitmap.width * scale;
    const draw_H = this.bitmap.height * scale;
    const img_X = (view_W - draw_W) / 2 + this.pan_X;
    const img_Y = (view_H - draw_H) / 2 + this.pan_Y;

    const ctx = this.canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.clearRect(0, 0, view_W, view_H);
    ctx.drawImage(this.bitmap, img_X, img_Y, draw_W, draw_H);

    // Draw mask overlay if present
    if (this.mask_data && this.mask_cache_canvas) {
      if (this.mask_cache_dirty) {
        // Update offscreen mask cache
        const mask_ctx = this.mask_cache_canvas.getContext("2d");
        const mask_img = mask_ctx.createImageData(this.bitmap.width, this.bitmap.height);
        for (let i = 0; i < this.mask_data.length; ++i) {
          if (this.mask_data[i]) {
            mask_img.data[i * 4 + 0] = 255;
            mask_img.data[i * 4 + 1] = 0;
            mask_img.data[i * 4 + 2] = 0;
            mask_img.data[i * 4 + 3] = 100;
          } else {
            mask_img.data[i * 4 + 3] = 0;
          }
        }
        mask_ctx.clearRect(0, 0, this.bitmap.width, this.bitmap.height);
        mask_ctx.putImageData(mask_img, 0, 0);
        this.mask_cache_dirty = false;
      }
      ctx.save();
      ctx.globalAlpha = 1.0;
      ctx.drawImage(this.mask_cache_canvas, img_X, img_Y, draw_W, draw_H);
      ctx.restore();
    }

    if (this.debug_manager && this.debug_manager.debug) {
      this.debug_manager.draw_debug(ctx, img_X, img_Y, draw_W, draw_H);
    }
  }

  clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }
}
