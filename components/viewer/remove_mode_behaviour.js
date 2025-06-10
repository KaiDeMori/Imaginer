// remove_mode_behaviour.js – Handles remove mode events and UI
export class remove_mode_behaviour {
    constructor(viewer) {
        this.viewer = viewer;
    }
    activate() {
        // Set cursor and button state for remove mode
        this.viewer.overlay.classList.add('viewer_overlay');
        this.viewer.remove_mode_button.classList.add('remove_mode_button');
        this.viewer.remove_mode_button.classList.add('remove_mode_button_active'); // Added class to make the button red in remove mode
        this.viewer.set_brush_cursor_visible(true);
        // Bind events (no wheel event here)
        this._bind_events();
    }
    deactivate() {
        this.viewer.remove_mode_button.classList.remove('remove_mode_button_active'); // Removed class to reset the button color when deactivating remove mode
        this._unbind_events();
    }
    _bind_events() {
        this._on_mouse_down = (e) => this.viewer.on_mouse_down(e);
        this._on_mouse_move = (e) => this.viewer.on_mouse_move(e);
        this._on_mouse_up = (e) => this.viewer.on_mouse_up(e);
        this._on_overlay_click = (_e) => { /* do nothing, block close */ };
        this._on_key_down = (e) => {
            if (e.key === 'Escape') this.viewer.close();
            if ((e.key === 'd' || e.key === 'D') && e.ctrlKey) this.viewer.toggle_debug();
        };
        this._on_resize = () => { if (this.viewer.is_open()) this.viewer.redraw(); };
        this.viewer.canvas.addEventListener('mousedown', this._on_mouse_down);
        this.viewer.canvas.addEventListener('mousemove', this._on_mouse_move);
        this.viewer.canvas.addEventListener('mouseup', this._on_mouse_up);
        this.viewer.canvas.addEventListener('mouseleave', this._on_mouse_up);
        this.viewer.overlay.addEventListener('click', this._on_overlay_click);
        document.addEventListener('keydown', this._on_key_down);
        window.addEventListener('resize', this._on_resize);
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
        this.viewer.canvas.removeEventListener('mousedown', this._on_mouse_down);
        this.viewer.canvas.removeEventListener('mousemove', this._on_mouse_move);
        this.viewer.canvas.removeEventListener('mouseup', this._on_mouse_up);
        this.viewer.canvas.removeEventListener('mouseleave', this._on_mouse_up);
        this.viewer.overlay.removeEventListener('click', this._on_overlay_click);
        // No wheel event to unbind
        document.removeEventListener('keydown', this._on_key_down);
        window.removeEventListener('resize', this._on_resize);
    }
}
