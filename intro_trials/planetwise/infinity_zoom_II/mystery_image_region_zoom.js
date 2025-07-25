// Mystery Image Region Zoom Module for Infinity Zoom II Engine
// Handles mystery image rendering and animation during region zoom

window.infinity_zoom_II.mystery_image_region_zoom = {
  // State storage
  engine: null,
  mystery_layer: null,
  mystery_quad_buffer: null,

  // Animation parameters
  mystery_start_params: null,
  mystery_target_params: null,

  // WebGL resources (shared from region_zoom)
  region_program: null,
  u_matrix_location: null,
  u_texture_location: null,

  // Initialization and cleanup
  init(engine) {
    log("Mystery image region zoom system initializing...");
    this.engine = engine;

    // Get mystery image layer from engine
    this.mystery_layer = engine.alien_display_screen;

    // Validate mystery layer exists
    if (!this.mystery_layer || !this.mystery_layer.texture) {
      log("Warning: Mystery image layer not found or invalid");
      return false;
    }

    // Create WebGL resources
    this.init_webgl_resources();

    // Calculate transformation parameters
    this.calculate_mystery_animation_parameters();

    log("Mystery image region zoom system initialized successfully");
    return true;
  },

  cleanup() {
    // Clean up WebGL resources if needed
    this.mystery_quad_buffer = null;
    this.mystery_layer = null;
    this.engine = null;
  },

  // WebGL resource initialization
  init_webgl_resources() {
    const gl = this.engine.gl_context;

    // Create image pixel quad buffer for mystery image
    this.mystery_quad_buffer = this.create_image_pixel_quad_buffer(gl, this.mystery_layer.image.width, this.mystery_layer.image.height);

    // Get shared shader program and uniforms from region_zoom
    const region_zoom = window.infinity_zoom_II.region_zoom;
    this.region_program = region_zoom.region_program;
    this.u_matrix_location = region_zoom.u_matrix_location;
    this.u_texture_location = region_zoom.u_texture_location;
  },

  // Create quad in IMAGE PIXEL coordinates (copied from region_zoom)
  create_image_pixel_quad_buffer(gl, image_width, image_height) {
    const vertices = new Float32Array([
      0,
      0,
      0,
      1, // Bottom-left (pos + uv)
      image_width,
      0,
      1,
      1, // Bottom-right
      0,
      image_height,
      0,
      0, // Top-left
      image_width,
      image_height,
      1,
      0, // Top-right
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    return buffer;
  },

  // Calculate mystery image animation parameters
  calculate_mystery_animation_parameters() {
    // Get region configuration
    const config = window.infinity_zoom_II.config.region_zoom;
    const region_rect = config.region_rect;

    // Analyze region geometry
    const region_analysis = this.analyze_region_geometry(region_rect);

    // Calculate start parameters (mystery image positioned at region)
    this.mystery_start_params = this.calculate_initial_mystery_state(region_analysis);

    // Calculate target parameters (mystery image scaled to fill viewport)
    this.mystery_target_params = this.calculate_final_mystery_state(region_analysis);

    log("Mystery animation parameters calculated:", {
      start: this.mystery_start_params,
      target: this.mystery_target_params,
    });
  },

  // Analyze region geometry from 4-point definition
  analyze_region_geometry(region_rect) {
    const { p0, p1, p2, p3 } = region_rect;

    // Region center (midpoint of diagonal)
    const center_x = (p0.x + p2.x) * 0.5;
    const center_y = (p0.y + p2.y) * 0.5;

    // Region dimensions from edge vectors
    const edge1 = { x: p1.x - p0.x, y: p1.y - p0.y };
    const edge2 = { x: p3.x - p0.x, y: p3.y - p0.y };
    const width = Math.hypot(edge1.x, edge1.y);
    const height = Math.hypot(edge2.x, edge2.y);

    // Region orientation from first edge
    const rotation = Math.atan2(edge1.y, edge1.x);

    // Covering square (larger dimension becomes both width and height)
    const covering_square_size = Math.max(width, height);

    return {
      center_x,
      center_y,
      width,
      height,
      rotation,
      covering_square_size,
    };
  },

  // Calculate initial mystery image state (positioned at region)
  calculate_initial_mystery_state(region_analysis) {
    // Mystery image positioned at region center
    const center_x = region_analysis.center_x;
    const center_y = region_analysis.center_y;

    // Scale to cover the region using covering square
    const mystery_image_size = this.mystery_layer.image.width; // Assume square
    const covering_scale = region_analysis.covering_square_size / mystery_image_size;

    // Match region orientation
    const rotation = region_analysis.rotation;

    return {
      center_x,
      center_y,
      scale: covering_scale,
      rotation,
    };
  },

  // Calculate final mystery image state (scaled to fill viewport)
  calculate_final_mystery_state(region_analysis) {
    // Mystery image still positioned at region center
    const center_x = region_analysis.center_x;
    const center_y = region_analysis.center_y;

    // Scale to fill entire viewport
    const canvas_width = this.engine.canvas.width;
    const canvas_height = this.engine.canvas.height;
    const mystery_image_size = this.mystery_layer.image.width;

    // Use covering scale relative to viewport
    const viewport_covering_scale = Math.max(canvas_width, canvas_height) / mystery_image_size;

    // Same rotation as initial state
    const rotation = region_analysis.rotation;

    return {
      center_x,
      center_y,
      scale: viewport_covering_scale,
      rotation,
    };
  },

  // Update mystery image animation (called every frame)
  update_mystery_animation(animation_progress_t) {
    // Interpolate between start and target parameters using same timing as alien
    const current_mystery_params = {
      center_x: this.lerp(this.mystery_start_params.center_x, this.mystery_target_params.center_x, animation_progress_t),
      center_y: this.lerp(this.mystery_start_params.center_y, this.mystery_target_params.center_y, animation_progress_t),
      scale: this.lerp_scale_log(this.mystery_start_params.scale, this.mystery_target_params.scale, animation_progress_t),
      rotation: this.lerp_angle(this.mystery_start_params.rotation, this.mystery_target_params.rotation, animation_progress_t),
    };

    return current_mystery_params;
  },

  // Render mystery image with given transformation parameters
  render_mystery_image(transformation_params) {
    const gl = this.engine.gl_context;

    // Use region zoom shader program
    gl.useProgram(this.region_program);

    // Build transformation matrix in screen pixel coordinates (reuse region_zoom logic)
    const region_zoom = window.infinity_zoom_II.region_zoom;
    const transform_matrix = region_zoom.build_screen_space_matrix(
      transformation_params.center_x,
      transformation_params.center_y,
      transformation_params.scale,
      transformation_params.rotation,
      gl.canvas.width,
      gl.canvas.height
    );

    // Apply orthographic projection
    const orthographic = region_zoom.create_orthographic_matrix(gl.canvas.width, gl.canvas.height);
    const final_matrix = region_zoom.matrix_multiply_3x3(orthographic, transform_matrix);

    // Set up vertex attributes
    gl.bindBuffer(gl.ARRAY_BUFFER, this.mystery_quad_buffer);

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

    // Bind mystery image texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.mystery_layer.texture);
    gl.uniform1i(this.u_texture_location, 0);

    // Draw quad using TRIANGLE_STRIP
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  },

  // Utility functions (copied from region_zoom for consistency)

  // Linear interpolation
  lerp(a, b, t) {
    return a + (b - a) * t;
  },

  // Logarithmic scale interpolation for perceptually linear zoom
  lerp_scale_log(start_scale, end_scale, t) {
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
};
