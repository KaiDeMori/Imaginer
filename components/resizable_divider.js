// resizable_divider.js – ultra-simple draggable divider (copied from
// `draggable-divider.html` demo; trimmed to bare essentials).

export class Resizable_divider {
  constructor(dividerEl, galleryEl, promptEl) {
    this.divider = dividerEl;
    this.gallery = galleryEl;

    // ── Restore stored width ────────────────────────────────────────────────
    const stored = parseInt(localStorage.getItem('imaginer.dividerWidth'), 10);
    if (!isNaN(stored)) {
      this.set_gallery_width(stored);
    }

    // ── State ───────────────────────────────────────────────────────────────
    this.dragging = false;

    // ── Bind handlers ───────────────────────────────────────────────────────
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp   = this.onMouseUp.bind(this);
    this.onResize    = this.onResize.bind(this);

    // ── Events ──────────────────────────────────────────────────────────────
    this.divider.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup',   this.onMouseUp);
    window.addEventListener('resize',    this.onResize);
  }

  /* ---------------------------------------------------------------------- */
  /* Core logic (identical to demo)                                         */
  /* ---------------------------------------------------------------------- */
  set_gallery_width(px) {
    const min = 50;
    const max = this.gallery.parentElement.offsetWidth - min - this.divider.offsetWidth;
    const clamped = Math.max(min, Math.min(max, px));
    this.gallery.style.width = clamped + 'px';
  }

  onMouseDown(e) {
    this.dragging = true;
    document.body.style.cursor = 'col-resize';
    this.divider.classList.add('dragging');
    e.preventDefault();
  }

  onMouseMove(e) {
    if (!this.dragging) return;
    this.set_gallery_width(e.clientX);
  }

  onMouseUp() {
    if (!this.dragging) return;
    this.dragging = false;
    document.body.style.cursor = '';
    this.divider.classList.remove('dragging');

    // Persist current width
    localStorage.setItem('imaginer.dividerWidth', this.gallery.offsetWidth);
  }

  onResize() {
    // Keep current width within bounds after a window resize
    this.set_gallery_width(this.gallery.offsetWidth);
  }
}
