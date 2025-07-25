window.infinity_zoom_II.mystery_image_region_zoom = {
  utils: null, // Will be set to region_zoom_utils
  // Properties
  display_image_layer: null, // Will be set to engine.alien_display_screen
  mystery_quad_buffer: null,
  target_params: null,
  mystery_base_scale: null, // Calculated once during init

  // Initialization
  init_mystery_image(engine, target_params) {
    this.utils = window.infinity_zoom_II.region_zoom_utils;
    this.display_image_layer = engine.alien_display_screen;
    this.target_params = target_params;
    const gl = engine.gl_context;
    this.mystery_quad_buffer = this.utils.create_image_pixel_quad_buffer(gl, this.display_image_layer.image.width, this.display_image_layer.image.height);

    // Calculate mystery base scale once during initialization
    this.mystery_base_scale = this.calculate_mystery_base_scale();

    log("Mystery image initialized with base scale:", this.mystery_base_scale);
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
    const mystery_image_size = Math.max(this.display_image_layer.image.width, this.display_image_layer.image.height);
    const mystery_base_scale = covering_square_size / mystery_image_size;

    return mystery_base_scale;
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
    const mystery_center_x = this.display_image_layer.image.width * 0.5;
    const mystery_center_y = this.display_image_layer.image.height * 0.5;

    // Calculate mystery scale for this frame
    const mystery_scale = this.calculate_mystery_scale(final_params);

    // Position mystery image so that when scaled, its center aligns with region screen position
    // We need to "reverse" the scale effect to get the right starting position
    return {
      center_x: mystery_center_x + region_offset_x / mystery_scale,
      center_y: mystery_center_y + region_offset_y / mystery_scale,
    };
  },

  // Calculate mystery image scale (base scale * animation scale)
  calculate_mystery_scale(final_params) {
    // Mystery scales with the animation, but from its own base scale
    return this.mystery_base_scale * final_params.scale;
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
      rotation: final_params.rotation, // Same rotation as alien
    };
  },
};
