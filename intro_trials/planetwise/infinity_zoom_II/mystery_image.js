// Mystery Image Module for Infinity Zoom II Engine
// Handles portal effect where mystery content appears through alien's transparent screen region

window.infinity_zoom_II.mystery_image = {
  // Calculate mystery image TRS synchronized with alien layer
  calculate_mystery_TRS(alien_layer, region_rect, canvas_width, canvas_height) {
    // Calculate region center from opposite corners (clockwise rectangle)
    const region_center_pixels = {
      x: (region_rect.p0.x + region_rect.p2.x) / 2,
      y: (region_rect.p0.y + region_rect.p2.y) / 2,
    };

    // Transform region center from alien image pixel space to screen TRS space
    const mystery_center_screen = this.transform_region_center_to_screen(region_center_pixels, alien_layer, canvas_width, canvas_height);

    // Calculate region's intrinsic orientation (independent of alien rotation)
    const region_orientation = this.calculate_region_orientation(region_rect);

    // Compound rotation: region tilt + alien global rotation
    const mystery_rotation = region_orientation + alien_layer.trs.rotation;

    // Calculate covering scale to fill screen region completely
    const region_dimensions = this.get_region_dimensions(region_rect);
    const covering_scale = this.calculate_covering_scale(region_dimensions.width, region_dimensions.height, canvas_width, canvas_height);

    // Apply covering scale relative to alien layer's current scale
    const mystery_scale = alien_layer.trs.scale * covering_scale;

    return {
      center_x: mystery_center_screen.x,
      center_y: mystery_center_screen.y,
      scale: mystery_scale,
      rotation: mystery_rotation,
    };
  },

  // Calculate region's intrinsic orientation from rectangle edge vectors
  calculate_region_orientation(region_rect) {
    // Use vector from p0 to p1 (top edge of clockwise rectangle)
    const dx = region_rect.p1.x - region_rect.p0.x;
    const dy = region_rect.p1.y - region_rect.p0.y;

    // Y-flip for image coordinate system (Y=0 at top)
    return Math.atan2(-dy, dx);
  },

  // Transform region center from image pixel coordinates to screen TRS coordinates
  transform_region_center_to_screen(region_center_pixels, alien_layer, canvas_width, canvas_height) {
    const alien_image_size = alien_layer.image.width;

    // Convert from image pixels to normalized image coordinates (-1 to +1)
    const region_center_normalized = {
      x: (region_center_pixels.x / alien_image_size) * 2 - 1,
      y: -((region_center_pixels.y / alien_image_size) * 2 - 1), // Y-flip for WebGL
    };

    // Apply alien's TRS transformation to get screen position
    const cos_r = Math.cos(alien_layer.trs.rotation);
    const sin_r = Math.sin(alien_layer.trs.rotation);

    // Scale the normalized coordinates by alien layer's scale
    const base_pixel_scale = alien_layer.trs.scale * Math.min(canvas_width, canvas_height);
    const scaled_x = (region_center_normalized.x * base_pixel_scale) / canvas_width;
    const scaled_y = (region_center_normalized.y * base_pixel_scale) / canvas_height;

    // Apply rotation
    const rotated_x = scaled_x * cos_r - scaled_y * sin_r;
    const rotated_y = scaled_x * sin_r + scaled_y * cos_r;

    // Apply translation (alien center)
    const final_x = rotated_x + alien_layer.trs.center_x;
    const final_y = rotated_y + alien_layer.trs.center_y;

    return { x: final_x, y: final_y };
  },

  // Calculate region width and height from clockwise rectangle points
  get_region_dimensions(region_rect) {
    // For clockwise rectangle: width from p0 to p1, height from p0 to p3
    const width = Math.abs(region_rect.p1.x - region_rect.p0.x);
    const height = Math.abs(region_rect.p3.y - region_rect.p0.y);

    return { width, height };
  },

  // Calculate covering scale to fill screen region without gaps
  calculate_covering_scale(region_width, region_height, screen_width, screen_height) {
    // For square images in square regions, covering scale should be 1.0
    // The mystery image just needs to fill the region, not the entire screen
    return 1.0;
  },
};
