// Region Zoom functionality for Infinity Zoom II Engine
// Orthographic Projection Approach - Working Implementation

const region_zoom = {
  // === STATE ===
  is_active: false,
  animation_progress: 0, // 0 to 1
  duration: 2000, // Animation duration in ms
  start_time: 0,

  // Region zoom parameters
  target_center_x: 0,
  target_center_y: 0,
  target_scale: 2,
  target_rotation: 0,

  // Orthographic rendering system
  gl: null,
  program: null,
  buffer: null,
  uniforms: {},
  attributes: {},

  // === INITIALIZATION ===
  init(gl) {
    this.gl = gl;
    this.create_orthographic_renderer();
  },

  create_orthographic_renderer() {
    const gl = this.gl;
    const utils = infinity_zoom_II_utils;

    // Create shader program
    const vertexShader = utils.create_shader(gl, gl.VERTEX_SHADER, utils.get_region_vertex_shader_source());
    const fragmentShader = utils.create_shader(gl, gl.FRAGMENT_SHADER, utils.get_region_fragment_shader_source());
    this.program = utils.create_program(gl, vertexShader, fragmentShader);

    // Get attribute/uniform locations
    this.attributes = {
      position: gl.getAttribLocation(this.program, "a_position"),
      texcoord: gl.getAttribLocation(this.program, "a_texcoord"),
    };

    this.uniforms = {
      matrix: gl.getUniformLocation(this.program, "u_matrix"),
      texture: gl.getUniformLocation(this.program, "u_texture"),
      alpha: gl.getUniformLocation(this.program, "u_alpha"),
    };

    // Create geometry buffer (image pixel coordinates)
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

    // Note: Will be updated with actual image dimensions during animation
    const quad_data = utils.create_image_pixel_quad(1024, 1024); // Placeholder
    gl.bufferData(gl.ARRAY_BUFFER, quad_data, gl.STATIC_DRAW);
  },

  // === REGION ZOOM CONTROL ===
  start_region_zoom(center_x, center_y, scale = 2, rotation = 0) {
    this.target_center_x = center_x;
    this.target_center_y = center_y;
    this.target_scale = scale;
    this.target_rotation = rotation;

    this.is_active = true;
    this.animation_progress = 0;
    this.start_time = Date.now();
  },

  stop_region_zoom() {
    this.is_active = false;
    this.animation_progress = 0;
  },

  // === ANIMATION UPDATE ===
  update() {
    if (!this.is_active) return;

    const current_time = Date.now();
    const elapsed = current_time - this.start_time;

    // Update progress
    this.animation_progress = Math.min(elapsed / this.duration, 1);

    // Apply easing
    const eased_progress = this.ease_in_out_cubic(this.animation_progress);

    // Animation complete?
    if (this.animation_progress >= 1) {
      this.is_active = false;
    }

    return eased_progress;
  },

  // === RENDERING ===
  render(texture, canvas_width, canvas_height, image_width, image_height) {
    if (!this.is_active) return;

    const gl = this.gl;
    const utils = infinity_zoom_II_utils;

    // Update geometry with actual image dimensions
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    const quad_data = utils.create_image_pixel_quad(image_width, image_height);
    gl.bufferData(gl.ARRAY_BUFFER, quad_data, gl.STATIC_DRAW);

    // Calculate current animation state
    const progress = this.ease_in_out_cubic(this.animation_progress);

    // Build transformation matrix in screen pixel coordinates
    const screen_matrix = utils.build_screen_space_matrix(
      this.target_center_x,
      this.target_center_y,
      1 + (this.target_scale - 1) * progress, // Animate scale
      this.target_rotation * progress, // Animate rotation
      canvas_width,
      canvas_height
    );

    // Convert to clip space
    const ortho_matrix = utils.create_orthographic_matrix(canvas_width, canvas_height);
    const final_matrix = utils.matrix_multiply_3x3(ortho_matrix, screen_matrix);

    // Render with orthographic system
    gl.useProgram(this.program);

    // Set uniforms
    gl.uniformMatrix3fv(this.uniforms.matrix, false, final_matrix);
    gl.uniform1i(this.uniforms.texture, 0);
    gl.uniform1f(this.uniforms.alpha, progress); // Fade in as animation progresses

    // Set attributes
    const stride = 4 * Float32Array.BYTES_PER_ELEMENT;

    gl.enableVertexAttribArray(this.attributes.position);
    gl.vertexAttribPointer(this.attributes.position, 2, gl.FLOAT, false, stride, 0);

    gl.enableVertexAttribArray(this.attributes.texcoord);
    gl.vertexAttribPointer(this.attributes.texcoord, 2, gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);

    // Bind texture and draw
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  },

  // === EASING FUNCTION ===
  ease_in_out_cubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  },
};

// Make region_zoom globally accessible
window.region_zoom = region_zoom;
