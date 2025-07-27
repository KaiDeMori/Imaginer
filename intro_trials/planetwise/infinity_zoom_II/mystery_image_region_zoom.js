window.infinity_zoom_II.mystery_image_region_zoom = {
  utils: null, // Will be set to region_zoom_utils
  // Properties
  display_image_layer_current: null, // Will be set to engine.alien_display_screen_current
  mystery_quad_buffer_current: null,
  target_params: null,
  mystery_base_scale: null, // Calculated once during init
  region_base_rotation: null, // Region's intrinsic rotation relative to alien image

  // Initialization
  init_mystery_image(engine, target_params) {
    this.utils = window.infinity_zoom_II.region_zoom_utils;
    this.display_image_layer_current = window.infinity_zoom_II.mystery_image_main_zoom.alien_display_screen_current;
    this.target_params = target_params;

    // Use pre-loaded quad buffer instead of creating a new one
    this.mystery_quad_buffer_current = engine.region_zoom_resources.quad_buffers.mystery_images[0];

    // Calculate mystery base scale once during initialization
    this.mystery_base_scale = this.calculate_mystery_base_scale();

    // Calculate region's base rotation once during initialization
    this.region_base_rotation = this.calculate_region_base_rotation();

    log("Mystery image initialized with base scale:", this.mystery_base_scale);
    log("Mystery image initialized with region base rotation:", this.region_base_rotation);
  },

  // Calculate the base scale for mystery image to cover the display region
  calculate_mystery_base_scale() {
    const config = window.infinity_zoom_II.config.region_zoom;
    const { p0, p1, p2, p3 } = config.region_rect;

    // Calculate display region dimensions
    const edge1 = { x: p1.x - p0.x, y: p1.y - p0.y };
    const edge2 = { x: p3.x - p0.x, y: p3.y - p0.y };
    const region_width = Math.hypot(edge1.x, edge1.y);
    const region_height = Math.hypot(edge2.x, edge2.y);

    // Calculate covering square (larger dimension)
    const covering_square_size = Math.max(region_width, region_height);

    // Calculate mystery image scale to cover the covering square
    const mystery_image_size = Math.max(this.display_image_layer_current.image.width, this.display_image_layer_current.image.height);
    const mystery_base_scale = covering_square_size / mystery_image_size;

    return mystery_base_scale;
  },

  // Calculate the region's intrinsic rotation relative to alien image
  calculate_region_base_rotation() {
    const config = window.infinity_zoom_II.config.region_zoom;
    const { p0, p1, p2, p3 } = config.region_rect;

    // Calculate region rotation from first edge (same logic as in region_zoom.js)
    const edge1 = { x: p1.x - p0.x, y: p1.y - p0.y };
    const region_rotation = Math.atan2(edge1.y, edge1.x);

    return region_rotation;
  },

  // Calculate mystery image positioning (separate from scaling)
  calculate_mystery_positioning(final_params) {
    // The key insight: we need to position mystery image so that when both alien and mystery
    // are transformed, the mystery center aligns with where the region center appears on screen

    // Region center in alien image coordinates (fixed point)
    const region_center_x = this.target_params.center_x;
    const region_center_y = this.target_params.center_y;

    // Current alien transformation parameters
    const alien_current_center_x = final_params.center_x;
    const alien_current_center_y = final_params.center_y;
    const alien_scale = final_params.scale;

    // Calculate where the region center will appear in screen coordinates
    // This is the offset from alien center to region center, scaled by current alien scale
    const region_offset_x = (region_center_x - alien_current_center_x) * alien_scale;
    const region_offset_y = (region_center_y - alien_current_center_y) * alien_scale;

    // Mystery image center in its own coordinate space
    const mystery_center_x = this.display_image_layer_current.image.width * 0.5;
    const mystery_center_y = this.display_image_layer_current.image.height * 0.5;

    // Calculate mystery scale for this frame
    const mystery_scale = this.calculate_mystery_scale(final_params);

    // Rotate the offset vector by negative region rotation to compensate for mystery image rotation
    // This fixes the "one square off" issue when region is tilted
    const cos_angle = Math.cos(-this.region_base_rotation);
    const sin_angle = Math.sin(-this.region_base_rotation);
    const compensated_offset_x = region_offset_x * cos_angle - region_offset_y * sin_angle;
    const compensated_offset_y = region_offset_x * sin_angle + region_offset_y * cos_angle;

    // Position mystery image so that when scaled, its center aligns with region screen position
    // We need to "reverse" the scale effect to get the right starting position
    return {
      center_x: mystery_center_x - compensated_offset_x / mystery_scale,
      center_y: mystery_center_y - compensated_offset_y / mystery_scale,
    };
  },

  // Calculate mystery image scale (base scale * animation scale)
  calculate_mystery_scale(final_params) {
    // Recalculate base scale in case mystery image changed
    const current_base_scale = this.calculate_mystery_base_scale();

    // Mystery scales with the animation, but from its own base scale
    return current_base_scale * final_params.scale;
  },

  // Core calculation method - now uses separate positioning and scaling
  calculate_mystery_image_transform_params(final_params) {
    // Note: We need to calculate scale first since positioning depends on it

    // 1. Calculate scale (mystery-specific scale)
    const mystery_scale = this.calculate_mystery_scale(final_params);

    // 2. Calculate positioning (uses mystery_scale in calculation)
    const positioning_result = this.calculate_mystery_positioning(final_params);

    return {
      center_x: positioning_result.center_x,
      center_y: positioning_result.center_y,
      scale: mystery_scale, // Use mystery-specific scale
      rotation: final_params.rotation - this.region_base_rotation, // Alien rotation - region offset (flipped sign!)
    };
  },
};
