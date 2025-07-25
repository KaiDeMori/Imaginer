window.infinity_zoom_II.mystery_image_region_zoom = {
  utils: null, // Will be set to region_zoom_utils
  // Properties
  display_image_layer: null, // Will be set to engine.alien_display_screen
  mystery_quad_buffer: null,
  target_params: null,

  // Initialization
  init_mystery_image(engine, target_params) {
    this.utils = window.infinity_zoom_II.region_zoom_utils;
    this.display_image_layer = engine.alien_display_screen;
    this.target_params = target_params;
    const gl = engine.gl_context;
    this.mystery_quad_buffer = this.utils.create_image_pixel_quad_buffer(gl, this.display_image_layer.image.width, this.display_image_layer.image.height);
  },

  // Core calculation method (moved from region_zoom.js)
  calculate_mystery_image_transform_params(final_params) {
    // Region center in alien image coordinates (where mystery should align)
    const region_center_x = this.target_params.center_x;
    const region_center_y = this.target_params.center_y;

    // Current alien transformation center
    const alien_current_center_x = final_params.center_x;
    const alien_current_center_y = final_params.center_y;

    // Mystery image center in its own coordinate space
    const mystery_center_x = this.display_image_layer.image.width * 0.5;
    const mystery_center_y = this.display_image_layer.image.height * 0.5;

    // Calculate offset: where alien center differs from region center
    const offset_x = alien_current_center_x - region_center_x;
    const offset_y = alien_current_center_y - region_center_y;

    // Apply offset to mystery center so it aligns with region when both use same transformation
    return {
      center_x: mystery_center_x + offset_x,
      center_y: mystery_center_y + offset_y,
      scale: final_params.scale,
      rotation: final_params.rotation,
    };
  },
};
