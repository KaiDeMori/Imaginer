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
  start_TRS: null,
  target_TRS: null,

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

  // Calculate covering scale for region to fill viewport
  calc_region_covering_scale(region_width, region_height, viewport_width, viewport_height) {
    const scale_by_width = viewport_width / region_width;
    const scale_by_height = viewport_height / region_height;
    return Math.max(scale_by_width, scale_by_height);
  },

  // Transform a point through current TRS transformation
  transform_point_through_TRS(point, trs, viewport_width, viewport_height) {
    const { center_x, center_y, scale, rotation } = trs;

    // Apply TRS transformation to convert from image coordinates to screen coordinates
    const cos_r = Math.cos(rotation);
    const sin_r = Math.sin(rotation);

    // First, normalize image coordinates to [-1, 1] range (assuming square image)
    // For a 2048x2048 image: point (1024, 1024) becomes (0, 0)
    const image_size = 2048; // Assuming 2048x2048 images
    const norm_x = (point.x - image_size / 2) / (image_size / 2);
    const norm_y = (point.y - image_size / 2) / (image_size / 2);

    // Apply rotation
    const rotated_x = norm_x * cos_r - norm_y * sin_r;
    const rotated_y = norm_x * sin_r + norm_y * cos_r;

    // Apply scale - convert to pixel size
    const pixel_scale = scale * Math.min(viewport_width, viewport_height);
    const scaled_x = rotated_x * pixel_scale;
    const scaled_y = rotated_y * pixel_scale;

    // Apply translation - convert center from viewport-relative to screen coordinates
    const screen_center_x = center_x * (viewport_width / 2) + viewport_width / 2;
    const screen_center_y = -center_y * (viewport_height / 2) + viewport_height / 2;

    const screen_x = scaled_x + screen_center_x;
    const screen_y = scaled_y + screen_center_y;

    return { x: screen_x, y: screen_y };
  },

  // Calculate target TRS for region zoom from region rectangle and current TRS
  calc_region_target_TRS(region_rect, current_trs, viewport_width, viewport_height) {
    const { p0, p1, p2, p3 } = region_rect;

    // Transform region corner points through current TRS
    const transformed_p0 = this.transform_point_through_TRS(p0, current_trs, viewport_width, viewport_height);
    const transformed_p1 = this.transform_point_through_TRS(p1, current_trs, viewport_width, viewport_height);
    const transformed_p2 = this.transform_point_through_TRS(p2, current_trs, viewport_width, viewport_height);
    const transformed_p3 = this.transform_point_through_TRS(p3, current_trs, viewport_width, viewport_height);

    // Calculate region properties from transformed coordinates
    const region_center = this.calc_region_center(transformed_p0, transformed_p1, transformed_p2, transformed_p3);
    const region_dimensions = this.calc_region_dimensions(transformed_p0, transformed_p1, transformed_p2, transformed_p3);
    const region_rotation = this.calc_region_rotation(transformed_p0, transformed_p1);

    // DEBUG: Log region dimensions
    log("Region dimensions: " + region_dimensions.width.toFixed(2) + " x " + region_dimensions.height.toFixed(2));

    // Calculate covering scale for region to fill viewport
    const covering_scale_factor = this.calc_region_covering_scale(region_dimensions.width, region_dimensions.height, viewport_width, viewport_height);

    // DEBUG: Log scale calculation
    log("Covering scale factor: " + covering_scale_factor.toFixed(2));

    // Convert screen region center to viewport-relative coordinates
    // We want to bring the region center TO the viewport center, so we need the negative offset
    const screen_offset_x = region_center.x - viewport_width / 2;
    const screen_offset_y = region_center.y - viewport_height / 2;

    const target_center_x = -(screen_offset_x / (viewport_width / 2));
    const target_center_y = screen_offset_y / (viewport_height / 2);

    // DEBUG: Log center calculation
    log("Screen offset: " + screen_offset_x.toFixed(2) + ", " + screen_offset_y.toFixed(2));
    log("Target center (viewport-rel): " + target_center_x.toFixed(2) + ", " + target_center_y.toFixed(2));

    // Calculate target scale: current scale multiplied by covering factor
    const target_scale = current_trs.scale * covering_scale_factor;

    // Target rotation: counter-rotate to align region edges with viewport edges
    const target_rotation = region_rotation;

    // DEBUG: Log rotation calculation
    log("Region rotation (rad): " + region_rotation.toFixed(2) + " Target rotation: " + target_rotation.toFixed(2));

    const final_target_TRS = window.infinity_zoom_II.utils.create_TRS(
      target_center_x, // Now correctly calculated to center the region
      target_center_y, // Now correctly calculated to center the region
      target_scale,
      target_rotation
    );

    // DEBUG: Log final target TRS
    log(
      "Final target TRS - center: " +
        target_center_x.toFixed(2) +
        ", " +
        target_center_y.toFixed(2) +
        " scale: " +
        target_scale.toFixed(2) +
        " rotation: " +
        target_rotation.toFixed(2)
    );

    return final_target_TRS;
  },

  // Ease-in-out cubic interpolation function
  ease_in_out_cubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  },

  // Initialize region zoom (called once when state changes)
  init_region_zoom(engine, now) {
    // Store engine reference and timing
    this.engine = engine;
    this.start_time = now;

    // Get configuration
    const config = window.infinity_zoom_II.config.region_zoom;
    if (!config || !config.region_rect) {
      console.error("Region zoom configuration missing");
      return;
    }

    // Store start and target TRS states
    const final_layer_index = engine.layers.length - 1;
    this.start_TRS = { ...engine.layers[final_layer_index].trs };
    this.target_TRS = this.calc_region_target_TRS(config.region_rect, this.start_TRS, engine.canvas.width, engine.canvas.height);

    // DEBUG: Log start and target TRS
    log(
      "Start TRS - center: " +
        this.start_TRS.center_x.toFixed(2) +
        ", " +
        this.start_TRS.center_y.toFixed(2) +
        " scale: " +
        this.start_TRS.scale.toFixed(2) +
        " rotation: " +
        this.start_TRS.rotation.toFixed(2)
    );
  },

  // Update region zoom state (called every frame)
  update_region_zoom_state(now) {
    // Calculate interpolation progress
    const config = window.infinity_zoom_II.config.region_zoom;
    const elapsed_ms = now - this.start_time;
    const raw_progress = elapsed_ms / config.anim_duration;
    const clamped_progress = Math.min(raw_progress, 1.0);
    const eased_progress = this.ease_in_out_cubic(clamped_progress);

    // Interpolate TRS
    // TEMPORARY: Skip interpolation and jump directly to target
    const current_TRS = this.target_TRS;

    // DEBUG: Log that we're using target directly
    log("� JUMPING to target TRS: " + current_TRS.center_x.toFixed(2) + "," + current_TRS.center_y.toFixed(2) + " scale:" + current_TRS.scale.toFixed(1));

    // Apply identical TRS to both penultimate and final layers
    const final_layer_index = this.engine.layers.length - 1;
    const penultimate_layer_index = final_layer_index - 1;

    if (penultimate_layer_index >= 0) {
      this.engine.layers[penultimate_layer_index].trs = { ...current_TRS };
      this.engine.layers[penultimate_layer_index].alpha = 1.0;
    }

    this.engine.layers[final_layer_index].trs = { ...current_TRS };
    this.engine.layers[final_layer_index].alpha = 1.0;

    // Set all other layers to invisible
    for (let i = 0; i < penultimate_layer_index; i++) {
      this.engine.layers[i].alpha = 0.0;
    }
  },
};
