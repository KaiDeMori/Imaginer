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
    const screen_offset = {
      x: (((region_offset_pixels.x / alien_image_size) * base_pixel_scale) / canvas_width) * 2,
      y: ((-(region_offset_pixels.y / alien_image_size) * base_pixel_scale) / canvas_height) * 2, // Y-flip
    };

    // Mystery center = alien center + region offset
    const mystery_center_screen = {
      x: alien_layer.trs.center_x + screen_offset.x,
      y: alien_layer.trs.center_y + screen_offset.y,
    };

    // Calculate region's intrinsic orientation only (ignore alien rotation)
    const region_orientation = this.calculate_region_orientation(region_rect);

    // Use alien layer's scale directly
    const mystery_scale = alien_layer.trs.scale;

    return {
      center_x: mystery_center_screen.x,
      center_y: mystery_center_screen.y,
      scale: mystery_scale,
      rotation: region_orientation, // Only region tilt, no global rotation
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
};
