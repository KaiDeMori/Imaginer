// viewer_mode_behaviour.js – Handles standard viewer mode events and UI
export class viewer_mode_behaviour {
    constructor(viewer) {
        this.viewer = viewer;
    }
    activate() {
        // Set cursor and button state for viewer mode
        this.viewer.overlay.classList.add('viewer_overlay');
        this.viewer.remove_mode_button.classList.add('remove_mode_button');
        this.viewer.set_brush_cursor_visible(false);
        // Bind events (no wheel event here)
        this._bind_events();
    }
    deactivate() {
        this._unbind_events();
    }
    _bind_events() {
        this._on_overlay_click = (e) => {
            this.viewer.close();
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
        this.viewer.overlay.addEventListener('click', this._on_overlay_click);
        document.addEventListener('keydown', this._on_key_down);
        window.addEventListener('resize', this._on_resize);
    }

    on_wheel(e) {
        // No special handling in viewer mode, let default zoom happen
        return false;
    }
    _unbind_events() {
        this.viewer.overlay.removeEventListener('click', this._on_overlay_click);
        document.removeEventListener('keydown', this._on_key_down);
        window.removeEventListener('resize', this._on_resize);
    }
}
