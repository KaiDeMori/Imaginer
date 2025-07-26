// Region Zoom functionality for Infinity Zoom II Engine
// Orthographic Projection Approach - Clean Implementation

window.infinity_zoom_II.region_zoom = {
  utils: null, // Will be set to region_zoom_utils

  // State storage
  engine: null,
  start_time: null,
  start_params: null,
  target_params: null,
  animation_t: 0, // Raw animation progress [0,1]
  current_mystery_index: 0, // Current mystery image index

  // Region zoom shader program and buffers
  region_program: null,
  region_quad_buffer: null,

  final_layer: null,

  u_matrix_location: null,
  u_texture_location: null,

  penultimate_layer: null,
  penultimate_quad_buffer: null,
  mystery_image_current: null,
  mystery_quad_buffer_current: null,
  mystery_quad_buffers: null, // Array of all pre-created mystery quad buffers

  // Ease-in-out cubic interpolation function
  ease_in_out_cubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  },

  // Faster easing for translation - more aggressive at the start (quadratic)
  ease_in_out_quad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  },

  // Simple linear interpolation for debugging
  linear_lerp(t) {
    return Math.max(0, Math.min(1, t)); // Clamp t to [0,1] range
  },

  ease_in_sine(t) {
    return 1 - Math.cos((t * Math.PI) / 2);
  },

  ease_in_out_sine(t) {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  },

  ease_out_elastic(t) {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },

  ease_out_back(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;

    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },

  // Build transformation matrix in screen pixel coordinates
  build_screen_space_matrix(center_x, center_y, scale, rotation, screen_width, screen_height) {
    // Step 1: Translation to screen center
    const translate_to_center = this.utils.create_translation_matrix(screen_width * 0.5, screen_height * 0.5);

    // Step 2: Scale and rotation
    const scale_matrix = this.utils.create_scale_matrix(scale);
    const rotation_matrix = this.utils.create_rotation_matrix(rotation);

    // Step 3: Translation from image center
    const translate_from_center = this.utils.create_translation_matrix(-center_x, -center_y);

    // Step 4: Compose transformation (order matters!)
    let result = translate_to_center;
    result = this.utils.matrix_multiply_3x3(result, scale_matrix);
    result = this.utils.matrix_multiply_3x3(result, rotation_matrix);
    result = this.utils.matrix_multiply_3x3(result, translate_from_center);

    return result;
  },

  // Initialize region zoom (called once when state changes)
  init_region_zoom(engine, now) {
    this.utils = window.infinity_zoom_II.region_zoom_utils;
    this.engine = engine;
    this.start_time = now;
    this.animation_t = 0; // Reset animation progress
    this.current_mystery_index = 0; // Start with first mystery image

    // Get both final and penultimate layers
    this.final_layer = engine.layers[engine.layers.length - 1];
    this.penultimate_layer = engine.layers.length > 1 ? engine.layers[engine.layers.length - 2] : null;
    this.mystery_image_current = engine.alien_display_screen_current;
    const gl = engine.gl_context;

    // Create region zoom shader program and buffers
    this.region_program = this.utils.create_region_shader_program(gl);
    this.region_quad_buffer = this.utils.create_image_pixel_quad_buffer(gl, this.final_layer.image.width, this.final_layer.image.height);

    this.penultimate_quad_buffer = this.utils.create_image_pixel_quad_buffer(gl, this.penultimate_layer.image.width, this.penultimate_layer.image.height);

    // Pre-create ALL mystery quad buffers to avoid jitter during swapping
    this.mystery_quad_buffers = this.engine.alien_display_screens.map((mystery_screen) => {
      return this.utils.create_image_pixel_quad_buffer(gl, mystery_screen.image.width, mystery_screen.image.height);
    });

    this.mystery_quad_buffer_current = this.mystery_quad_buffers[0];

    // Get shader uniform locations
    this.u_matrix_location = gl.getUniformLocation(this.region_program, "u_matrix");
    this.u_texture_location = gl.getUniformLocation(this.region_program, "u_texture");

    // Calculate starting transformation parameters
    this.start_params = {
      center_x: this.final_layer.image.width * 0.5, // Image center
      center_y: this.final_layer.image.height * 0.5,
      scale: this.calculate_engine_final_scale(),
      rotation: engine.global_rotation || 0,
    };

    // Calculate target region parameters
    this.target_params = this.calculate_region_parameters();

    // Initialize mystery image module
    window.infinity_zoom_II.mystery_image_region_zoom.init_mystery_image(engine, this.target_params);

    log("Region zoom initialized - orthographic projection approach");
    log("Start params:", this.start_params);
    log("Target params:", this.target_params);
  },

  // === REGION PARAMETER CALCULATION ===

  // Calculate engine's final scale factor
  calculate_engine_final_scale() {
    // Convert from engine's TRS scale to screen pixel scale
    const canvas_width = this.engine.canvas.width;
    const canvas_height = this.engine.canvas.height;
    const image_width = this.final_layer.image.width;
    const image_height = this.final_layer.image.height;

    // Use covering scale (same as engine) - fills entire screen
    return Math.max(canvas_width / image_width, canvas_height / image_height);
  },

  // Calculate region rectangle parameters for targeting
  calculate_region_parameters() {
    const config = window.infinity_zoom_II.config.region_zoom;
    const { p0, p1, p2, p3 } = config.region_rect;

    // Region center in image pixel coordinates
    const center_x = (p0.x + p2.x) * 0.5;
    const center_y = (p0.y + p2.y) * 0.5;

    // Region dimensions (handle arbitrary quadrilateral)
    const edge1 = { x: p1.x - p0.x, y: p1.y - p0.y };
    const edge2 = { x: p3.x - p0.x, y: p3.y - p0.y };
    const region_width = Math.hypot(edge1.x, edge1.y);
    const region_height = Math.hypot(edge2.x, edge2.y);

    // Region rotation from first edge
    const rotation = Math.atan2(edge1.y, edge1.x);

    // Scale to fit region in screen (covering scale)
    const screen_width = this.engine.canvas.width;
    const screen_height = this.engine.canvas.height;
    const scale = Math.max(screen_width / region_width, screen_height / region_height);

    return { center_x, center_y, scale, rotation };
  },

  // === ANIMATION SYSTEM ===

  // Linear interpolation
  lerp(a, b, t) {
    return a + (b - a) * t;
  },

  // Logarithmic scale interpolation for perceptually linear zoom
  lerp_scale_log(start_scale, end_scale, t) {
    // Convert to log space, lerp, then convert back to linear space
    const log_start = Math.log(start_scale);
    const log_end = Math.log(end_scale);
    const log_result = this.lerp(log_start, log_end, t);
    return Math.exp(log_result);
  },

  // Angle interpolation with wrap-around
  lerp_angle(start_angle, end_angle, t) {
    const TWO_PI = 2 * Math.PI;
    let diff = end_angle - start_angle;

    // Normalize to shortest path
    while (diff > Math.PI) diff -= TWO_PI;
    while (diff < -Math.PI) diff += TWO_PI;

    return start_angle + diff * t;
  },

  // Update region zoom animation parameters
  update_region_zoom_animation(now) {
    const config = window.infinity_zoom_II.config.region_zoom;
    const elapsed = (now - this.start_time) / config.anim_duration;
    this.animation_t = Math.min(elapsed, 1.0); // Store raw animation progress

    // Check for mystery image swap at t >= 0.5
    this.check_mystery_image_swap();

    // Use different easing for different parameters
    const translation_eased_t = this.ease_out_back(this.animation_t);
    //const translation_eased_t = this.ease_out_elastic(this.animation_t);
    //const translation_eased_t = this.ease_in_out_sine(this.animation_t);
    const scale_rotation_eased_t = this.ease_in_sine(this.animation_t);

    // Interpolate transformation parameters with different easing
    const current_params = {
      center_x: this.lerp(this.start_params.center_x, this.target_params.center_x, translation_eased_t),
      center_y: this.lerp(this.start_params.center_y, this.target_params.center_y, translation_eased_t),
      scale: this.lerp_scale_log(this.start_params.scale, this.target_params.scale, scale_rotation_eased_t),
      rotation: this.lerp_angle(this.start_params.rotation, this.target_params.rotation, scale_rotation_eased_t),
    };

    return current_params;
  },

  // Check for mystery image swap at animation midpoint
  check_mystery_image_swap() {
    if (this.animation_t >= 0.5 && this.current_mystery_index === 0) {
      this.swap_mystery_image(1); // Swap to second mystery image
      log("🎭 MYSTERY IMAGE SWAPPED AT t=0.5! 🎭");
    }
  },

  // Swap to different mystery image
  swap_mystery_image(new_index) {
    this.current_mystery_index = new_index;
    this.mystery_image_current = this.engine.alien_display_screens[new_index];
    this.mystery_quad_buffer_current = this.mystery_quad_buffers[new_index]; // Use pre-created buffer!

    // Update mystery module reference
    window.infinity_zoom_II.mystery_image_region_zoom.display_image_layer_current = this.mystery_image_current;
    window.infinity_zoom_II.mystery_image_region_zoom.mystery_quad_buffer_current = this.mystery_quad_buffer_current;

    log("Mystery image swapped to index:", new_index);
  },

  // === ORTHOGRAPHIC RENDERING ===

  // Calculate penultimate layer transformation parameters
  calculate_penultimate_transform_params(final_params) {
    const scale_factor = 100 / this.final_layer.zoom;

    // Calculate the offset from image center for final layer
    const final_center_x = this.final_layer.image.width * 0.5;
    const final_center_y = this.final_layer.image.height * 0.5;
    const offset_x = final_params.center_x - final_center_x;
    const offset_y = final_params.center_y - final_center_y;

    // Scale down the offset for penultimate layer (since it will be scaled up)
    const penultimate_center_x = this.penultimate_layer.image.width * 0.5;
    const penultimate_center_y = this.penultimate_layer.image.height * 0.5;

    return {
      center_x: penultimate_center_x + offset_x / scale_factor, // Scaled-down offset
      center_y: penultimate_center_y + offset_y / scale_factor, // Scaled-down offset
      rotation: final_params.rotation, // Same rotation - rotates together
      scale: final_params.scale * scale_factor, // Bigger scale - 4x backdrop effect
    };
  },

  // Render a single layer using orthographic system
  render_single_layer(layer, quad_buffer, transformation_params) {
    const gl = this.engine.gl_context;

    // Use region zoom shader program
    gl.useProgram(this.region_program);

    // Build transformation matrix in screen pixel coordinates
    const transform_matrix = this.build_screen_space_matrix(
      transformation_params.center_x,
      transformation_params.center_y,
      transformation_params.scale,
      transformation_params.rotation,
      gl.canvas.width,
      gl.canvas.height
    );

    // Apply orthographic projection - THE KEY STEP!
    const orthographic = this.utils.create_orthographic_matrix(gl.canvas.width, gl.canvas.height);
    const final_matrix = this.utils.matrix_multiply_3x3(orthographic, transform_matrix);

    // Set up vertex attributes
    gl.bindBuffer(gl.ARRAY_BUFFER, quad_buffer);

    const position_location = gl.getAttribLocation(this.region_program, "a_position");
    const texcoord_location = gl.getAttribLocation(this.region_program, "a_texcoord");

    gl.enableVertexAttribArray(position_location);
    gl.enableVertexAttribArray(texcoord_location);

    // Position attribute (2 floats, stride 4 floats, offset 0)
    gl.vertexAttribPointer(position_location, 2, gl.FLOAT, false, 4 * 4, 0);
    // Texcoord attribute (2 floats, stride 4 floats, offset 2 floats)
    gl.vertexAttribPointer(texcoord_location, 2, gl.FLOAT, false, 4 * 4, 2 * 4);

    // Set uniforms
    gl.uniformMatrix3fv(this.u_matrix_location, false, final_matrix);

    // Bind texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, layer.texture);
    gl.uniform1i(this.u_texture_location, 0);

    // Draw quad using TRIANGLE_STRIP
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  },

  // Render region zoom frame using orthographic system
  render_region_zoom_frame(transformation_params) {
    const gl = this.engine.gl_context;

    // Clear canvas
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 1. Render penultimate layer FIRST (backdrop)
    const penultimate_params = this.calculate_penultimate_transform_params(transformation_params);
    this.render_single_layer(this.penultimate_layer, this.penultimate_quad_buffer, penultimate_params);

    // 2. Render mystery image SECOND (portal content)
    const mystery_params = window.infinity_zoom_II.mystery_image_region_zoom.calculate_mystery_image_transform_params(transformation_params);
    this.render_single_layer(this.mystery_image_current, this.mystery_quad_buffer_current, mystery_params);

    // 3. Render final layer THIRD (alien with transparent screen)
    this.render_single_layer(this.final_layer, this.region_quad_buffer, transformation_params);
  },

  // Update region zoom state (called every frame)
  update_region_zoom_state(now) {
    // Get current animation parameters
    const current_params = this.update_region_zoom_animation(now);

    // Render the current frame using orthographic system
    this.render_region_zoom_frame(current_params);

    // Check if animation is complete using stored animation_t
    if (this.animation_t >= 1.0) {
      log("Region zoom animation complete - transitioning to next phase");
      // Animation complete - engine will handle phase transition
      return true; // Signal completion
    }

    return false; // Animation continues
  },

  // Render the final zoomed frame (for holding state)
  render_final_frame() {
    // Use the final target parameters to render the zoomed region
    this.render_region_zoom_frame(this.target_params);
  },
};
