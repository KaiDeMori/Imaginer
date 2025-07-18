// Region Zoom functionality for Infinity Zoom II Engine

// Add default configuration for region zoom
window.infinity_zoom_II.config.region_zoom = {
  anim_duration: 4000, // Animation duration in milliseconds
  region_rect: {
    p0: { x: 0, y: 0 }, // origin (top-left)
    p1: { x: 99, y: 0 }, // end of top edge (u-axis)
    p2: { x: 99, y: 99 }, // far corner (bottom-right)
    p3: { x: 0, y: 99 }, // end of left edge (v-axis)
  },
};

window.infinity_zoom_II.region_zoom = {
  // State storage
  engine: null,
  start_time: null,
  start_matrix: null,
  target_matrix: null,

  // Calculate the center point of a region defined by 4 corner points
  calc_region_center(p0, p1, p2, p3) {
    return {
      x: (p0.x + p2.x) / 2,
      y: (p0.y + p2.y) / 2,
    };
  },

  // Calculate region dimensions from 4 corner points
  calc_region_dimensions(p0, p1, p2, p3) {
    const width = Math.sqrt((p1.x - p0.x) ** 2 + (p1.y - p0.y) ** 2);
    const height = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    return { width, height };
  },

  // Calculate region rotation from top edge (p0 to p1)
  calc_region_rotation(p0, p1) {
    return Math.atan2(p1.y - p0.y, p1.x - p0.x);
  },

  // Ease-in-out cubic interpolation function
  ease_in_out_cubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  },

  // Initialize region zoom (called once when state changes)
  init_region_zoom(engine, now) {
    this.engine = engine;
    this.start_time = now;

    const config = window.infinity_zoom_II.config.region_zoom;

    // TODO: Calculate start and target matrices directly
    // TODO: Remove TRS dependency completely

    log("Region zoom initialized - direct matrix approach");
  },

  // Update region zoom state (called every frame)
  update_region_zoom_state(now) {
    const config = window.infinity_zoom_II.config.region_zoom;
    const elapsed_ms = now - this.start_time;
    const raw_progress = elapsed_ms / config.anim_duration;
    const clamped_progress = Math.min(raw_progress, 1.0);
    const eased_progress = this.ease_in_out_cubic(clamped_progress);

    // TODO: Interpolate matrices directly
    // TODO: Apply matrices to layers without TRS conversion

    log("Region zoom progress: " + (eased_progress * 100).toFixed(1) + "%");
  },
};
