// brush_cursor.js – Handles the brush cursor overlay for Viewer (absolute pixel size)

export class Brush_cursor {
    constructor() {
        this.radius_px = 20; // default radius in px
        this.cursor_el = document.createElement('div');
        this.cursor_el.classList.add('brush_cursor');
        document.body.appendChild(this.cursor_el);
    }

    set_visible(visible) {
        this.cursor_el.classList.toggle('brush_cursor_visible', visible);
    }

    set_position(screen_x, screen_y) {
        this.cursor_el.style.setProperty('--cursor-left', `${screen_x}px`);
        this.cursor_el.style.setProperty('--cursor-top', `${screen_y}px`);
    }

    set_radius_px(px) {
        this.radius_px = Math.max(5, Math.min(100, px));
        this.update_size();
    }

    update_size() {
        const px = this.radius_px;
        this.cursor_el.style.setProperty('--cursor-width', `${px * 2}px`);
        this.cursor_el.style.setProperty('--cursor-height', `${px * 2}px`);
    }

    get_radius_px() {
        return this.radius_px;
    }
}
