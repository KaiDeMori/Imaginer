window.infinity_zoom_II.region_zoom_utils = {
  // === ORTHOGRAPHIC MATRIX SYSTEM ===

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

  // === WebGL UTILS ===
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

  // === REGION ZOOM SHADERS ===

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

  // Create region zoom shader program
  create_region_shader_program(gl) {
    const engine_utils = window.infinity_zoom_II.utils;
    return engine_utils.create_program(gl, this.get_region_vertex_shader_source(), this.get_region_fragment_shader_source());
  },
};
