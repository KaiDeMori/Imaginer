// Mystery Image Module for Infinity Zoom II Engine
// Handles portal effect where mystery content appears through alien's transparent screen region

window.infinity_zoom_II.mystery_image = {
  // Calculate mystery image TRS - simplified version without global rotation
  calculate_mystery_TRS(alien_layer, region_rect, canvas_width, canvas_height) {
    // Calculate region center from opposite corners (clockwise rectangle)
    const region_center_pixels = {
      x: (region_rect.p0.x + region_rect.p2.x) / 2,
      y: (region_rect.p0.y + region_rect.p2.y) / 2,
    };

    // Calculate offset of region center from alien image center (in normalized coordinates)
    const alien_image_size = alien_layer.image.width;
    const alien_center_pixels = alien_image_size / 2;

    const region_offset_pixels = {
      x: region_center_pixels.x - alien_center_pixels,
      y: region_center_pixels.y - alien_center_pixels,
    };

    // Convert pixel offset to screen space offset (no rotation applied)
    const base_pixel_scale = alien_layer.trs.scale * Math.min(canvas_width, canvas_height);

    // Convert to square coordinate space for rotation (eliminates AR distortion)
    const square_offset = {
      x: ((region_offset_pixels.x / alien_image_size) * base_pixel_scale) / Math.min(canvas_width, canvas_height),
      y: (-(region_offset_pixels.y / alien_image_size) * base_pixel_scale) / Math.min(canvas_width, canvas_height), // Y-flip
    };

    // Convert alien center to square coordinates too
    const alien_center_square = {
      x: (alien_layer.trs.center_x * canvas_width) / Math.min(canvas_width, canvas_height) / 2,
      y: (alien_layer.trs.center_y * canvas_height) / Math.min(canvas_width, canvas_height) / 2,
    };

    // Mystery center in square coordinates
    let mystery_center_square = {
      x: alien_center_square.x + square_offset.x,
      y: alien_center_square.y + square_offset.y,
    };

    // Apply global rotation in square coordinate space
    const global_rotation_angle = alien_layer.trs.rotation;
    const cos_r = Math.cos(global_rotation_angle);
    const sin_r = Math.sin(global_rotation_angle);

    const rotated_center_square = {
      x: mystery_center_square.x * cos_r - mystery_center_square.y * sin_r,
      y: mystery_center_square.x * sin_r + mystery_center_square.y * cos_r,
    };

    // Convert back to TRS coordinate space
    const mystery_center_screen = {
      x: ((rotated_center_square.x * Math.min(canvas_width, canvas_height)) / canvas_width) * 2,
      y: ((rotated_center_square.y * Math.min(canvas_width, canvas_height)) / canvas_height) * 2,
    };

    // Calculate region's intrinsic orientation only (ignore alien rotation)
    const region_orientation = this.calculate_region_orientation(region_rect);

    // Calculate covering scale factor based on region dimensions
    const covering_factor = this.calculate_covering_scale_factor(region_rect, alien_image_size);
    const mystery_scale = alien_layer.trs.scale * covering_factor;

    return {
      center_x: mystery_center_screen.x,
      center_y: mystery_center_screen.y,
      scale: mystery_scale,
      rotation: region_orientation + alien_layer.trs.rotation, // Region tilt + global rotation (compound rotation!)
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

  // Calculate covering scale factor for mystery image to fill region
  calculate_covering_scale_factor(region_rect, alien_image_size) {
    // Calculate region dimensions in pixels
    const region_width = Math.abs(region_rect.p1.x - region_rect.p0.x);
    const region_height = Math.abs(region_rect.p3.y - region_rect.p0.y);

    // Normalize to alien image size (fraction of image)
    const region_width_fraction = region_width / alien_image_size;
    const region_height_fraction = region_height / alien_image_size;

    // Covering scale: take maximum to ensure mystery image fills entire region
    // (some mystery content may be cropped, but no empty spaces in region)
    return Math.max(region_width_fraction, region_height_fraction);
  },
};
