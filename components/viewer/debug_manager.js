export class debug_manager {
    constructor(viewer) {
        this.viewer = viewer;
        this.debug = false;
        this.debug_element = document.createElement('div');
        this.debug_element.classList.add('debug_element');
        this.viewer.overlay.appendChild(this.debug_element);
    }

    toggle_debug() {
        this.debug = !this.debug;
        this.viewer.overlay.classList.toggle('viewer_overlay_debug', this.debug);
        this.debug_element.classList.toggle('debug_element_visible', this.debug);
        this.debug_element.style.display = this.debug ? 'block' : 'none';
        this.viewer.redraw();
    }

    draw_debug(ctx, img_X, img_Y, draw_W, draw_H) {
        /* Border around drawn image */
        ctx.save();
        ctx.strokeStyle = 'rgba(255,0,0,0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(img_X, img_Y, draw_W, draw_H);
        ctx.restore();

        /* Stats text */
        const lines = [
            `bitmap     : ${this.viewer.bitmap.width}×${this.viewer.bitmap.height}`,
            `fit scale  : ${this.viewer.fit_scale.toFixed(3)}`,
            `zoom factor: ${this.viewer.zoom_factor.toFixed(3)}`,
            `scale      : ${(this.viewer.fit_scale * this.viewer.zoom_factor).toFixed(3)}`,
            `pan X/Y    : ${this.viewer.pan_X.toFixed(1)} | ${this.viewer.pan_Y.toFixed(1)}`
        ];
        this.debug_element.textContent = lines.join('\n');
        this.debug_element.style.display = this.debug ? 'block' : 'none';
    }
}
