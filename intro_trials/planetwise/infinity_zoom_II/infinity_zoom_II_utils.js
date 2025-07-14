// Utilities for Infinity Zoom II Engine

window.infinity_zoom_II.utils = {
  // Create a new TRS object
  create_TRS(center_x = 0, center_y = 0, scale = 1, rotation = 0) {
    return { center_x, center_y, scale, rotation };
  },

  // Linear interpolation between two TRS objects
  lerp_TRS(trs_start, trs_end, t) {
    return {
      center_x: this.lerp(trs_start.center_x, trs_end.center_x, t),
      center_y: this.lerp(trs_start.center_y, trs_end.center_y, t),
      scale: this.lerp(trs_start.scale, trs_end.scale, t),
      rotation: this.lerp_angle(trs_start.rotation, trs_end.rotation, t),
    };
  },

  // Linear interpolation for scalars
  lerp(a, b, t) {
    return a + (b - a) * t;
  },

  // Angle interpolation with proper wrap-around handling
  lerp_angle(start_angle, end_angle, t) {
    const TWO_PI = 2 * Math.PI;
    let diff = end_angle - start_angle;

    // Normalize difference to [-π, π] range for shortest path
    while (diff > Math.PI) diff -= TWO_PI;
    while (diff < -Math.PI) diff += TWO_PI;

    return start_angle + diff * t;
  },

  // Convert TRS to 4x4 transformation matrix for WebGL
  TRS_to_matrix(trs) {
    const { center_x, center_y, scale, rotation } = trs;
    const cos_r = Math.cos(rotation);
    const sin_r = Math.sin(rotation);

    // Combined translation, rotation, and scale matrix
    return [scale * cos_r, scale * sin_r, 0, 0, -scale * sin_r, scale * cos_r, 0, 0, 0, 0, 1, 0, center_x, center_y, 0, 1];
  },

  // Calculate fitting scale for square image in rectangular viewport
  calc_fitting_scale(viewport_width, viewport_height, image_size) {
    return Math.min(viewport_width, viewport_height) / image_size;
  },

  // Calculate covering scale for square image in rectangular viewport
  calc_covering_scale(viewport_width, viewport_height, image_size) {
    return Math.max(viewport_width, viewport_height) / image_size;
  },

  // Check if layer is large enough to be visible
  is_layer_visible(trs, image_size, minimum_render_size) {
    return trs.scale * image_size >= minimum_render_size;
  },

  // Apply exponential growth to scale component
  apply_exponential_growth(start_scale, zoom_speed, elapsed_time) {
    return start_scale * Math.exp(zoom_speed * elapsed_time);
  },

  // Calculate layer's scale relative to Layer 0 based on cascading zoom values
  calc_layer_relative_scale(layers, layer_index) {
    if (layer_index === 0) return 1.0;

    let relative_scale = 1.0;
    for (let i = 1; i <= layer_index; i++) {
      relative_scale *= layers[i].zoom / 100;
    }
    return relative_scale;
  },

  // Calculate all layer scales given Layer 0's current scale
  calc_all_layer_scales(layer_0_scale, layers) {
    return layers.map((_, index) => {
      const relative_scale = this.calc_layer_relative_scale(layers, index);
      return layer_0_scale * relative_scale;
    });
  },

  // Update all layer TRS objects with synchronized scaling and rotation
  update_all_layer_TRS(layers, layer_0_scale, global_rotation) {
    const all_scales = this.calc_all_layer_scales(layer_0_scale, layers);

    layers.forEach((layer, index) => {
      layer.trs.center_x = 0; // All layers centered
      layer.trs.center_y = 0;
      layer.trs.scale = all_scales[index];
      layer.trs.rotation = global_rotation;
    });
  },

  // WebGL functions
  // Initialize WebGL context and shaders
  init_webgl(canvas) {
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
      throw new Error("WebGL not supported");
    }

    // Set viewport to match canvas size
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Enable blending for alpha
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    return gl;
  },

  // Create and compile shader
  create_shader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error("Shader compile error: " + error);
    }

    return shader;
  },

  // Create shader program
  create_program(gl, vertex_source, fragment_source) {
    const vertex_shader = this.create_shader(gl, gl.VERTEX_SHADER, vertex_source);
    const fragment_shader = this.create_shader(gl, gl.FRAGMENT_SHADER, fragment_source);

    const program = gl.createProgram();
    gl.attachShader(program, vertex_shader);
    gl.attachShader(program, fragment_shader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const error = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error("Program link error: " + error);
    }

    return program;
  },

  // Create texture from image
  create_texture(gl, image) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    // Set texture parameters for square images
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return texture;
  },

  // Create quad geometry buffer
  create_quad_buffer(gl) {
    const vertices = new Float32Array([
      -1,
      -1,
      0,
      0, // Bottom-left
      1,
      -1,
      1,
      0, // Bottom-right
      -1,
      1,
      0,
      1, // Top-left
      1,
      1,
      1,
      1, // Top-right
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    return buffer;
  },

  // Basic vertex shader source
  get_vertex_shader_source() {
    return `
      attribute vec2 a_position;
      attribute vec2 a_texcoord;
      uniform mat4 u_transform;
      varying vec2 v_texcoord;

      void main() {
        gl_Position = u_transform * vec4(a_position, 0.0, 1.0);
        v_texcoord = a_texcoord;
      }
    `;
  },

  // Basic fragment shader source
  get_fragment_shader_source() {
    return `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform float u_alpha;
      varying vec2 v_texcoord;

      void main() {
        vec4 color = texture2D(u_texture, v_texcoord);
        gl_FragColor = vec4(color.rgb, color.a * u_alpha);
      }
    `;
  },

  // Render a single layer
  render_layer(gl, program, quad_buffer, layer, viewport_width, viewport_height) {
    if (!layer.texture || layer.alpha <= 0) return;

    gl.useProgram(program);

    // Bind quad geometry
    gl.bindBuffer(gl.ARRAY_BUFFER, quad_buffer);

    const position_location = gl.getAttribLocation(program, "a_position");
    const texcoord_location = gl.getAttribLocation(program, "a_texcoord");

    gl.enableVertexAttribArray(position_location);
    gl.enableVertexAttribArray(texcoord_location);

    gl.vertexAttribPointer(position_location, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(texcoord_location, 2, gl.FLOAT, false, 16, 8);

    // Set uniforms
    const transform_matrix = window.infinity_zoom_II.TRS_utils.TRS_to_matrix(layer.trs);
    const transform_location = gl.getUniformLocation(program, "u_transform");
    gl.uniformMatrix4fv(transform_location, false, transform_matrix);

    const alpha_location = gl.getUniformLocation(program, "u_alpha");
    gl.uniform1f(alpha_location, layer.alpha);

    // Bind texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, layer.texture);
    const texture_location = gl.getUniformLocation(program, "u_texture");
    gl.uniform1i(texture_location, 0);

    // Draw quad
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  },
};
