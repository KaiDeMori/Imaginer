export class zoom_pan_manager {
    constructor(viewer) {
        this.viewer = viewer;
    }

    reset_transforms() {
        this.viewer.zoom_factor = 1;
        this.viewer.pan_X = 0;
        this.viewer.pan_Y = 0;
        this.compute_fit_scale();
    }

    compute_fit_scale() {
        if (!this.viewer.bitmap) {
            this.viewer.fit_scale = 1;
            return;
        }
        const maxW = window.innerWidth * 0.9; // 10% margin
        const maxH = window.innerHeight * 0.9;
        this.viewer.fit_scale = Math.min(
            maxW / this.viewer.bitmap.width,
            maxH / this.viewer.bitmap.height,
            1
        );
    }

    on_wheel(e) {
        if (!this.viewer.bitmap) return;
        e.preventDefault(); // block page scroll

        /* Mouse position relative to canvas ‑- used for mouse-centric zoom */
        const rect = this.viewer.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const old_scale = this.viewer.fit_scale * this.viewer.zoom_factor;

        /* Update zoom factor (exponential for smoothness) */
        const factor = Math.exp(-e.deltaY * this.viewer.constructor.WHEEL_SENSITIVITY);
        this.viewer.zoom_factor = this.clamp(
            this.viewer.zoom_factor * factor,
            this.viewer.constructor.MIN_ZOOM,
            this.viewer.constructor.MAX_ZOOM
        );

        /* Re-calculate pan so the pixel under the mouse stays fixed */
        const new_scale = this.viewer.fit_scale * this.viewer.zoom_factor;

        const view_W = window.innerWidth;
        const view_H = window.innerHeight;

        /* Center of image BEFORE zoom */
        const draw_W_old = this.viewer.bitmap.width * old_scale;
        const draw_H_old = this.viewer.bitmap.height * old_scale;
        const img_X_old = (view_W - draw_W_old) / 2 + this.viewer.pan_X;
        const img_Y_old = (view_H - draw_H_old) / 2 + this.viewer.pan_Y;

        const img_coord_X = (mx - img_X_old) / old_scale;
        const img_coord_Y = (my - img_Y_old) / old_scale;

        /* Center of image after zoom w/ zero pan */
        const draw_W_new = this.viewer.bitmap.width * new_scale;
        const draw_H_new = this.viewer.bitmap.height * new_scale;
        const img_X_new_center = (view_W - draw_W_new) / 2;
        const img_Y_new_center = (view_H - draw_H_new) / 2;

        /* Pan that keeps cursor-mapped pixel stationary */
        this.viewer.pan_X = mx - img_X_new_center - img_coord_X * new_scale;
        this.viewer.pan_Y = my - img_Y_new_center - img_coord_Y * new_scale;

        /* If we're at minimum zoom, force perfect centering */
        if (Math.abs(this.viewer.zoom_factor - this.viewer.constructor.MIN_ZOOM) < this.viewer.constructor.EPS) {
            this.viewer.zoom_factor = this.viewer.constructor.MIN_ZOOM; // snap exactly
            this.viewer.pan_X = 0;
            this.viewer.pan_Y = 0;
        }

        this.viewer.redraw();
    }

    clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }
}
