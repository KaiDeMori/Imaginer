// Compile a WebGL shader
function compile_shader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader));
  }
  return shader;
}

// Create a WebGL program from vertex and fragment shader sources
function create_program(gl, vs_source, fs_source) {
  const vs = compile_shader(gl, gl.VERTEX_SHADER, vs_source);
  const fs = compile_shader(gl, gl.FRAGMENT_SHADER, fs_source);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program));
  }
  return program;
}

// Create a quad buffer for TRIANGLE_STRIP rendering
function create_quad_buffer(gl) {
  const quad_verts = new Float32Array([-1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, 1, 1, 1, 1]);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, quad_verts, gl.STATIC_DRAW);
  return buffer;
}
// Upload a layer's image to GPU as a texture
function upload_texture(gl, layer) {
  // Flip Y only if not using feathering (raw images)
  // Use engine-level FLAG_Y_FLIP for global Y-flip logic
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  // Y-flip is controlled by window.infinity_zoom_II.FLAG_Y_FLIP for consistent orientation
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, window.infinity_zoom_II.FLAG_Y_FLIP);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, layer.image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.generateMipmap(gl.TEXTURE_2D);
  layer.texture = tex;
  layer.loaded = true;
}

// Delete a layer's texture from GPU
function delete_texture(gl, layer) {
  if (layer.texture) {
    gl.deleteTexture(layer.texture);
    layer.texture = null;
    layer.loaded = false;
  }
}

// Ensure canvas dimensions are correctly set and update viewport
function resize_canvas_to_display_size(canvas, gl) {
  const dpr = window.devicePixelRatio || 1;
  const width = Math.round(window.innerWidth * dpr);
  const height = Math.round(window.innerHeight * dpr);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  gl.viewport(0, 0, canvas.width, canvas.height);
}

// Returns true if the layer's texture is currently uploaded to the GPU
function is_layer_uploaded(layer) {
  return !!(layer && layer.texture);
}

// Attach to unified namespace
if (!window.infinity_zoom_II) window.infinity_zoom_II = {};
if (!window.infinity_zoom_II.utils) window.infinity_zoom_II.utils = {};
window.infinity_zoom_II.utils.render = {
  upload_texture,
  delete_texture,
  resize_canvas_to_display_size,
  is_layer_uploaded,
  compile_shader,
  create_program,
  create_quad_buffer,
};
