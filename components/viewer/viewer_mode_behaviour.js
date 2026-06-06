// viewer_mode_behaviour.js – Handles standard viewer mode events and UI
export class viewer_mode_behaviour {
    // Pointer movement (px) beyond which a click is treated as a pan drag, not a close.
    static CLICK_THRESHOLD_PX = 4;

    constructor(viewer) {
        this.viewer = viewer;
        // Drag state kept local so it can never leak into mask mode.
        this._pointer_down = false;
        this._is_panning = false;
        this._start_x = 0;
        this._start_y = 0;
        this._start_pan_X = 0;
        this._start_pan_Y = 0;
        this._moved = false;
    }
    activate() {
        // Set cursor and button state for viewer mode
        this.viewer.overlay.classList.add('viewer_overlay');
        this.viewer.mask_mode_button.classList.add('mask_mode_button');
        this.viewer.set_brush_cursor_visible(false);
        this._update_cursor();
        // Bind events (no wheel event here)
        this._bind_events();
    }
    deactivate() {
        this.viewer.canvas.style.cursor = '';
        this._unbind_events();
    }

    // Panning only makes sense once the image is zoomed past "fit".
    _can_pan() {
        return this.viewer.zoom_factor > this.viewer.constructor.MIN_ZOOM + this.viewer.constructor.EPS;
    }

    _update_cursor() {
        if (!this._can_pan()) {
            this.viewer.canvas.style.cursor = '';
        } else {
            this.viewer.canvas.style.cursor = this._is_panning ? 'grabbing' : 'grab';
        }
    }

    _bind_events() {
        this._on_mouse_down = (e) => {
            if (e.button !== 0) return; // left button only
            this._pointer_down = true;
            this._is_panning = true;
            this._moved = false;
            this._start_x = e.clientX;
            this._start_y = e.clientY;
            this._start_pan_X = this.viewer.pan_X;
            this._start_pan_Y = this.viewer.pan_Y;
            this._update_cursor();
        };
        this._on_mouse_move = (e) => {
            if (!this._is_panning) return;
            const dx = e.clientX - this._start_x;
            const dy = e.clientY - this._start_y;
            if (!this._moved &&
                Math.hypot(dx, dy) > viewer_mode_behaviour.CLICK_THRESHOLD_PX) {
                this._moved = true;
            }
            if (this._moved && this._can_pan()) {
                this.viewer.pan_X = this._start_pan_X + dx;
                this.viewer.pan_Y = this._start_pan_Y + dy;
                this.viewer.zoom_pan_manager.clamp_pan();
                this.viewer.redraw();
            }
        };
        this._on_mouse_up = (e) => {
            if (e.button !== 0) return;
            // Only react to an up that completes a down→up cycle on the canvas.
            if (!this._pointer_down) return;
            const was_drag = this._moved;
            this._pointer_down = false;
            this._is_panning = false;
            this._moved = false;
            this._update_cursor();
            // A genuine click (no meaningful drag) closes the viewer.
            if (!was_drag) this.viewer.close();
        };
        // Leaving the canvas cancels an in-progress pan WITHOUT closing.
        this._on_mouse_leave = () => {
            this._pointer_down = false;
            this._is_panning = false;
            this._moved = false;
            this._update_cursor();
        };
        // Suppress the legacy overlay click-to-close; we now decide on mouseup.
        this._on_overlay_click = (e) => {
            e.stopPropagation();
        };
        this._on_key_down = (e) => {
            if (e.key === 'Escape') this.viewer.close();
            if ((e.key === 'd' || e.key === 'D')) {
                // Only toggle debug if overlay is visible
                if (this.viewer.overlay.classList.contains('viewer_overlay_visible')) {
                    this.viewer.debug_manager.toggle_debug();
                }
            }
        };
        this._on_resize = () => { if (this.viewer.is_open()) this.viewer.redraw(); };
        this.viewer.canvas.addEventListener('mousedown', this._on_mouse_down);
        this.viewer.canvas.addEventListener('mousemove', this._on_mouse_move);
        this.viewer.canvas.addEventListener('mouseup', this._on_mouse_up);
        this.viewer.canvas.addEventListener('mouseleave', this._on_mouse_leave);
        this.viewer.overlay.addEventListener('click', this._on_overlay_click);
        document.addEventListener('keydown', this._on_key_down);
        window.addEventListener('resize', this._on_resize);
    }

    on_wheel(e) {
        // No special handling in viewer mode, let default zoom happen.
        // Refresh the cursor afterwards in case zoom crossed the pan threshold.
        requestAnimationFrame(() => this._update_cursor());
        return false;
    }
    _unbind_events() {
        this.viewer.canvas.removeEventListener('mousedown', this._on_mouse_down);
        this.viewer.canvas.removeEventListener('mousemove', this._on_mouse_move);
        this.viewer.canvas.removeEventListener('mouseup', this._on_mouse_up);
        this.viewer.canvas.removeEventListener('mouseleave', this._on_mouse_leave);
        this.viewer.overlay.removeEventListener('click', this._on_overlay_click);
        document.removeEventListener('keydown', this._on_key_down);
        window.removeEventListener('resize', this._on_resize);
    }
}
