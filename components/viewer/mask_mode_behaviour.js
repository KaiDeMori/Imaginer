// mask_mode_behaviour.js – Handles mask mode events and UI
export class mask_mode_behaviour {
  constructor(viewer) {
    this.viewer = viewer;
  }
  activate() {
    // Set cursor and button state for mask mode
    this.viewer.overlay.classList.add("viewer_overlay");
    this.viewer.mask_mode_button.classList.add("mask_mode_button");
    this.viewer.mask_mode_button.classList.add("mask_mode_button_active"); // Added class to make the button red in mask mode
    this.viewer.set_brush_cursor_visible(true);
    // Hide default cursor, only show brush cursor
    this.viewer.canvas.style.cursor = "none";
    // Bind events (no wheel event here)
    this._bind_events();
  }
  deactivate() {
    this.viewer.mask_mode_button.classList.remove("mask_mode_button_active"); // Removed class to reset the button color when deactivating mask mode
    // Restore default cursor
    this.viewer.canvas.style.cursor = "";
    this._unbind_events();
  }
  _bind_events() {
    this._on_mouse_down = (e) => {
      // Prevent context menu on right-click
      if (e.button === 2) e.preventDefault();
      this.viewer.on_mouse_down(e);
    };
    this._on_mouse_move = (e) => {
      // Prevent context menu on right-click drag
      if (e.buttons === 2) e.preventDefault();
      this.viewer.on_mouse_move(e);
    };
    this._on_mouse_up = (e) => {
      // Prevent context menu on right mouse up
      if (e.button === 2) e.preventDefault();
      this.viewer.on_mouse_up(e);
    };
    this._on_overlay_click = (_e) => {
      /* do nothing, block close */
    };
    this._on_key_down = (e) => {
      if (e.key === "Escape") this.viewer.close();
      if ((e.key === "d" || e.key === "D") && e.ctrlKey) this.viewer.toggle_debug();
    };
    this._on_resize = () => {
      if (this.viewer.is_open()) this.viewer.redraw();
    };
    this.viewer.canvas.addEventListener("mousedown", this._on_mouse_down);
    this.viewer.canvas.addEventListener("mousemove", this._on_mouse_move);
    this.viewer.canvas.addEventListener("mouseup", this._on_mouse_up);
    this.viewer.canvas.addEventListener("mouseleave", this._on_mouse_up);
    // Prevent context menu globally for canvas in mask mode
    this._on_contextmenu = (e) => e.preventDefault();
    this.viewer.canvas.addEventListener("contextmenu", this._on_contextmenu);
    this.viewer.overlay.addEventListener("click", this._on_overlay_click);
    document.addEventListener("keydown", this._on_key_down);
    window.addEventListener("resize", this._on_resize);
  }

  on_wheel(e) {
    if (e.ctrlKey) {
      e.preventDefault();
      e.stopPropagation();
      // Adjust brush cursor pixel size with wheel, clamp between 5 and 100
      const delta = e.deltaY < 0 ? 2 : -2;
      this.viewer.set_brush_radius_px(this.viewer.brush_cursor.get_radius_px() + delta);
      // Cursor will update on next mouse move
      return true; // handled
    }
    return false; // not handled, let default zoom happen
  }

  _unbind_events() {
    this.viewer.canvas.removeEventListener("mousedown", this._on_mouse_down);
    this.viewer.canvas.removeEventListener("mousemove", this._on_mouse_move);
    this.viewer.canvas.removeEventListener("mouseup", this._on_mouse_up);
    this.viewer.canvas.removeEventListener("mouseleave", this._on_mouse_up);
    this.viewer.canvas.removeEventListener("contextmenu", this._on_contextmenu);
    this.viewer.overlay.removeEventListener("click", this._on_overlay_click);
    // No wheel event to unbind
    document.removeEventListener("keydown", this._on_key_down);
    window.removeEventListener("resize", this._on_resize);
  }
}
