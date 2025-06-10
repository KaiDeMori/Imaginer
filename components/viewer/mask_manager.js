export class mask_manager {
    constructor(viewer) {
        this.viewer = viewer;
    }

    init_mask() {
        if (!this.viewer.bitmap) return;
        this.viewer.mask_data = new Uint8ClampedArray(this.viewer.bitmap.width * this.viewer.bitmap.height);
        this.viewer.mask_data.fill(0); // 0 = not masked, 1 = masked
        // Create offscreen canvas for mask overlay
        this.viewer.mask_cache_canvas = document.createElement('canvas');
        this.viewer.mask_cache_canvas.width = this.viewer.bitmap.width;
        this.viewer.mask_cache_canvas.height = this.viewer.bitmap.height;
        this.viewer.mask_cache_dirty = true;
    }

    paint_mask(ix, iy, erase) {
        if (!this.viewer.mask_data) return;

        const r = Math.ceil(this.viewer.get_brush_radius_img());
        const r_squared = this.viewer.get_brush_radius_img() * this.viewer.get_brush_radius_img();
        let changed = false;

        // Calculate bounds with clipping to improve performance
        const minX = Math.max(0, ix - r);
        const maxX = Math.min(this.viewer.bitmap.width - 1, ix + r);
        const minY = Math.max(0, iy - r);
        const maxY = Math.min(this.viewer.bitmap.height - 1, iy + r);

        // Pre-calculate bitmap width for faster access
        const width = this.viewer.bitmap.width;
        const setValue = erase ? 0 : 1;

        // Direct pixel manipulation with improved bounds
        for (let y = minY; y <= maxY; y++) {
            const dy = y - iy;
            const dy_squared = dy * dy;

            // Row offset optimization
            const rowOffset = y * width;

            for (let x = minX; x <= maxX; x++) {
                const dx = x - ix;

                // Check if point is inside circle using distance formula
                if (dx*dx + dy_squared <= r_squared) {
                    const idx = rowOffset + x;

                    // Only update if the value is actually changing
                    if (this.viewer.mask_data[idx] !== setValue) {
                        this.viewer.mask_data[idx] = setValue;
                        changed = true;
                    }
                }
            }
        }

        if (changed) this.viewer.mask_cache_dirty = true;
    }

    paint_line_to(ix, iy, erase) {
        if (this.viewer.last_paint_ix === null || this.viewer.last_paint_iy === null) {
            this.paint_mask(ix, iy, erase);
            return;
        }
        const dx = ix - this.viewer.last_paint_ix;
        const dy = iy - this.viewer.last_paint_iy;
        const steps = Math.max(Math.abs(dx), Math.abs(dy));
        for (let i = 1; i <= steps; ++i) {
            const x = Math.round(this.viewer.last_paint_ix + (dx * i) / steps);
            const y = Math.round(this.viewer.last_paint_iy + (dy * i) / steps);
            this.paint_mask(x, y, erase);
        }
    }
}
