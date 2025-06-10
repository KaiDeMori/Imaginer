// viewer_behaviour.js – Mouse and keyboard event logic for Viewer
import { viewer_mode_behaviour } from './viewer_mode_behaviour.js';
import { remove_mode_behaviour } from './remove_mode_behaviour.js';

export class viewer_behaviour {

    constructor(viewer) {
        this.viewer = viewer;
        this.current_mode = null;
        this.current_handler = null;
        // Bind a single wheel event and delegate
        this._on_wheel = (e) => {
            if (this.current_handler && typeof this.current_handler.on_wheel === 'function') {
                const handled = this.current_handler.on_wheel(e);
                if (handled) return;
            }
            // Default: zoom
            this.viewer.on_wheel(e);
        };
        this.viewer.overlay.addEventListener('wheel', this._on_wheel, { passive: false });
        this.set_mode('viewer');
    }

    set_mode(mode) {
        if (this.current_handler) {
            this.current_handler.deactivate();
        }
        if (mode === 'remove') {
            this.current_handler = new remove_mode_behaviour(this.viewer);
        } else {
            this.current_handler = new viewer_mode_behaviour(this.viewer);
        }
        this.current_mode = mode;
        this.current_handler.activate();
    }

    destroy() {
        // Unbind the always-on wheel event
        this.viewer.overlay.removeEventListener('wheel', this._on_wheel, { passive: false });
        if (this.current_handler) {
            this.current_handler.deactivate();
        }
    }
}
