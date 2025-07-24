// Region Zoom functionality for Infinity Zoom II Engine
// Orthographic Projection Approach - Clean Implementation

// Add default configuration for region zoom
window.infinity_zoom_II.config.region_zoom = {
  anim_duration: 10000, // Animation duration in milliseconds
  region_rect: window.infinity_zoom_II.regions.original,
};

window.infinity_zoom_II.region_zoom = {
  // State storage
  engine: null,
  start_time: null,
  start_params: null,
  target_params: null,

  // Region zoom shader program and buffers
  region_program: null,
  region_quad_buffer: null,

  final_layer: null,

  u_matrix_location: null,
  u_texture_location: null,

  penultimate_layer: null,
  penultimate_quad_buffer: null,

  display_image_layer: null,
  display_image_quad_buffer: null,

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

  // === ORTHOGRAPHIC MATRIX SYSTEM (Phase 1) ===

  // 3x3 matrix multiplication (column-major) - DUPLICATED from MatrixStack
  matrix_multiply_3x3(a, b) {
    const result = new Float32Array(9);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        let sum = 0;
        for (let k = 0; k < 3; k++) {
          sum += a[i + k * 3] * b[k + j * 3];
        }
        result[i + j * 3] = sum;
      }
    }
    return result;
  },

  // Orthographic projection matrix for screen→clip conversion
  create_orthographic_matrix(screen_width, screen_height) {
    return new Float32Array([2 / screen_width, 0, 0, 0, -2 / screen_height, 0, -1, 1, 1]);
  },

  // Translation matrix (3x3)
  create_translation_matrix(tx, ty) {
    return new Float32Array([1, 0, 0, 0, 1, 0, tx, ty, 1]);
  },

  // Scale matrix (3x3)
  create_scale_matrix(scale) {
    return new Float32Array([scale, 0, 0, 0, scale, 0, 0, 0, 1]);
  },

  // Rotation matrix (3x3)
  create_rotation_matrix(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return new Float32Array([c, -s, 0, s, c, 0, 0, 0, 1]);
  },

  // Build transformation matrix in screen pixel coordinates
  build_screen_space_matrix(center_x, center_y, scale, rotation, screen_width, screen_height) {
    // Step 1: Translation to screen center
    const translate_to_center = this.create_translation_matrix(screen_width * 0.5, screen_height * 0.5);

    // Step 2: Scale and rotation
    const scale_matrix = this.create_scale_matrix(scale);
    const rotation_matrix = this.create_rotation_matrix(rotation);

    // Step 3: Translation from image center
    const translate_from_center = this.create_translation_matrix(-center_x, -center_y);

    // Step 4: Compose transformation (order matters!)
    let result = translate_to_center;
    result = this.matrix_multiply_3x3(result, scale_matrix);
    result = this.matrix_multiply_3x3(result, rotation_matrix);
    result = this.matrix_multiply_3x3(result, translate_from_center);

    return result;
  },

  // === REGION ZOOM SHADERS (Phase 1) ===

  // Region zoom vertex shader source (3x3 matrices!)
  get_region_vertex_shader_source() {
    return `
      attribute vec2 a_position;  // In image pixel coordinates
      attribute vec2 a_texcoord;
      uniform mat3 u_matrix;      // Screen space + orthographic combined (3x3!)
      varying vec2 v_texcoord;
      
      void main() {
        vec3 pos = u_matrix * vec3(a_position, 1.0);
        gl_Position = vec4(pos.xy, 0, 1);  // Convert 3D→4D for WebGL
        v_texcoord = a_texcoord;
      }
    `;
  },

  get_region_fragment_shader_source() {
    return `
      precision mediump float;
      varying vec2 v_texcoord;
      uniform sampler2D u_texture;
      
      void main() {
        gl_FragColor = texture2D(u_texture, v_texcoord);
      }
    `;
  },

  // Create region zoom shader program (uses engine's WebGL utilities)
  create_region_shader_program(gl) {
    const engine_utils = window.infinity_zoom_II.utils;
    return engine_utils.create_program(gl, this.get_region_vertex_shader_source(), this.get_region_fragment_shader_source());
  },

  // Create quad in IMAGE PIXEL coordinates (not clip space)
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

  // Initialize region zoom (called once when state changes)
  init_region_zoom(engine, now) {
    this.engine = engine;
    this.start_time = now;

    // Get both final and penultimate layers
    this.final_layer = engine.layers[engine.layers.length - 1];
    this.penultimate_layer = engine.layers[engine.layers.length - 2];
    this.display_image_layer = engine.alien_display_screen; //maybe re-use existing texture
    const gl = engine.gl_context;

    // Create region zoom shader program and buffers
    this.region_program = this.create_region_shader_program(gl);
    this.region_quad_buffer = this.create_image_pixel_quad_buffer(gl, this.final_layer.image.width, this.final_layer.image.height);

    this.penultimate_quad_buffer = this.create_image_pixel_quad_buffer(gl, this.penultimate_layer.image.width, this.penultimate_layer.image.height);
    this.display_image_quad_buffer = this.create_image_pixel_quad_buffer(gl, this.display_image_layer.image.width, this.display_image_layer.image.height);

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

    log("Region zoom initialized - orthographic projection approach");
    log("Start params:", this.start_params);
    log("Target params:", this.target_params);
  },

  // === REGION PARAMETER CALCULATION (Phase 3) ===

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

  // === ANIMATION SYSTEM (Phase 4) ===

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
    const t = Math.min(elapsed, 1.0);

    // Use different easing for different parameters
    const translation_eased_t = this.ease_out_back(t);
    //const translation_eased_t = this.ease_out_elastic(t);
    //const translation_eased_t = this.ease_in_out_sine(t);
    const scale_rotation_eased_t = this.ease_in_sine(t);

    // Interpolate transformation parameters with different easing
    const current_params = {
      center_x: this.lerp(this.start_params.center_x, this.target_params.center_x, translation_eased_t),
      center_y: this.lerp(this.start_params.center_y, this.target_params.center_y, translation_eased_t),
      scale: this.lerp_scale_log(this.start_params.scale, this.target_params.scale, scale_rotation_eased_t),
      rotation: this.lerp_angle(this.start_params.rotation, this.target_params.rotation, scale_rotation_eased_t),
    };

    return current_params;
  },

  // === ORTHOGRAPHIC RENDERING (Phase 2 & 4) ===

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

  // Calculate display image transformation parameters
  calculate_display_image_transform_params(current_params) {
    // Calculate region dimensions (steal from calculate_region_parameters)
    const config = window.infinity_zoom_II.config.region_zoom;
    const { p0, p1, p2, p3 } = config.region_rect;
    const edge1 = { x: p1.x - p0.x, y: p1.y - p0.y };
    const edge2 = { x: p3.x - p0.x, y: p3.y - p0.y };
    const region_width = Math.hypot(edge1.x, edge1.y);
    const region_height = Math.hypot(edge2.x, edge2.y);

    // Calculate covering scale for mystery image to fill the region
    const mystery_scale_factor = Math.max(region_width / this.display_image_layer.image.width, region_height / this.display_image_layer.image.height);

    return {
      center_x: this.target_params.center_x,
      center_y: this.target_params.center_y,
      scale: current_params.scale * mystery_scale_factor, // Scale relative to current zoom level
      rotation: current_params.rotation,
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
    const orthographic = this.create_orthographic_matrix(gl.canvas.width, gl.canvas.height);
    const final_matrix = this.matrix_multiply_3x3(orthographic, transform_matrix);

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

    // 2. Render display image (portal content)
    const display_params = this.calculate_display_image_transform_params(transformation_params);
    this.render_single_layer(this.display_image_layer, this.display_image_quad_buffer, display_params);

    // 3. Render final layer SECOND (on top)
    this.render_single_layer(this.final_layer, this.region_quad_buffer, transformation_params);
  },

  // Update region zoom state (called every frame)
  update_region_zoom_state(now) {
    // Get current animation parameters
    const current_params = this.update_region_zoom_animation(now);

    // Render the current frame using orthographic system
    this.render_region_zoom_frame(current_params);

    // Check if animation is complete
    const config = window.infinity_zoom_II.config.region_zoom;
    const elapsed = (now - this.start_time) / config.anim_duration;

    if (elapsed >= 1.0) {
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
