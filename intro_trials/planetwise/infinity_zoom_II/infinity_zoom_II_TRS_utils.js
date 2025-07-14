// TRS Utilities for Infinity Zoom II Engine

(window.infinity_zoom_II = window.infinity_zoom_II || {}).TRS_utils = {
  // Create a new TRS object
  create_TRS(center_x = 0, center_y = 0, scale = 1, rotation = 0) {
    return { center_x, center_y, scale, rotation };
  },

  // Linear interpolation between two TRS objects
  lerp_TRS(trs_start, trs_end, t) {
    return {
      center_x: this.lerp(trs_start.center_x, trs_end.center_x, t),
      center_y: this.lerp(trs_start.center_y, trs_end.center_y, t),
      scale: this.lerp(trs_start.scale, trs_end.scale, t),
      rotation: this.lerp_angle(trs_start.rotation, trs_end.rotation, t),
    };
  },

  // Linear interpolation for scalars
  lerp(a, b, t) {
    return a + (b - a) * t;
  },

  // Angle interpolation with proper wrap-around handling
  lerp_angle(start_angle, end_angle, t) {
    const TWO_PI = 2 * Math.PI;
    let diff = end_angle - start_angle;

    // Normalize difference to [-π, π] range for shortest path
    while (diff > Math.PI) diff -= TWO_PI;
    while (diff < -Math.PI) diff += TWO_PI;

    return start_angle + diff * t;
  },

  // Convert TRS to 4x4 transformation matrix for WebGL
  TRS_to_matrix(trs) {
    const { center_x, center_y, scale, rotation } = trs;
    const cos_r = Math.cos(rotation);
    const sin_r = Math.sin(rotation);

    // Combined translation, rotation, and scale matrix
    return [scale * cos_r, scale * sin_r, 0, 0, -scale * sin_r, scale * cos_r, 0, 0, 0, 0, 1, 0, center_x, center_y, 0, 1];
  },

  // Calculate fitting scale for square image in rectangular viewport
  calc_fitting_scale(viewport_width, viewport_height, image_size) {
    return Math.min(viewport_width, viewport_height) / image_size;
  },

  // Calculate covering scale for square image in rectangular viewport
  calc_covering_scale(viewport_width, viewport_height, image_size) {
    return Math.max(viewport_width, viewport_height) / image_size;
  },

  // Check if layer is large enough to be visible
  is_layer_visible(trs, image_size, minimum_render_size) {
    return trs.scale * image_size >= minimum_render_size;
  },

  // Apply exponential growth to scale component
  apply_exponential_growth(start_scale, zoom_speed, elapsed_time) {
    return start_scale * Math.exp(zoom_speed * elapsed_time);
  },

  // Calculate layer's scale relative to Layer 0 based on cascading zoom values
  calc_layer_relative_scale(layers, layer_index) {
    if (layer_index === 0) return 1.0;

    let relative_scale = 1.0;
    for (let i = 1; i <= layer_index; i++) {
      relative_scale *= layers[i].zoom / 100;
    }
    return relative_scale;
  },

  // Calculate all layer scales given Layer 0's current scale
  calc_all_layer_scales(layer_0_scale, layers) {
    return layers.map((_, index) => {
      const relative_scale = this.calc_layer_relative_scale(layers, index);
      return layer_0_scale * relative_scale;
    });
  },

  // Update all layer TRS objects with synchronized scaling and rotation
  update_all_layer_TRS(layers, layer_0_scale, global_rotation) {
    const all_scales = this.calc_all_layer_scales(layer_0_scale, layers);

    layers.forEach((layer, index) => {
      layer.trs.center_x = 0; // All layers centered
      layer.trs.center_y = 0;
      layer.trs.scale = all_scales[index];
      layer.trs.rotation = global_rotation;
    });
  },
};
