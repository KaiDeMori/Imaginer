// webgl_program_utils.js
// Utility functions for modular WebGL shader, program, and buffer setup.
// Designed for use in all WebGL-based modules (e.g., infinity zoom, region zoom, etc.)

function create_shader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const msg = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error("Shader compile error: " + msg);
  }
  return shader;
}

function create_program(gl, vs_source, fs_source) {
  const vs = create_shader(gl, gl.VERTEX_SHADER, vs_source);
  const fs = create_shader(gl, gl.FRAGMENT_SHADER, fs_source);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const msg = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error("Program link error: " + msg);
  }
  return program;
}

function create_buffer(gl, data, usage = gl.STATIC_DRAW) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, usage);
  return buffer;
}

function get_attrib_location(gl, program, name) {
  return gl.getAttribLocation(program, name);
}

function get_uniform_location(gl, program, name) {
  return gl.getUniformLocation(program, name);
}

function enable_vertex_attrib(
  gl,
  loc,
  size,
  type = gl.FLOAT,
  normalized = false,
  stride = 0,
  offset = 0
) {
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, size, type, normalized, stride, offset);
}

function set_blend_mode(gl, src = gl.SRC_ALPHA, dst = gl.ONE_MINUS_SRC_ALPHA) {
  gl.enable(gl.BLEND);
  gl.blendFunc(src, dst);
}

// Export as a global object for easy use in HTML and modules
window.webgl_program_utils = {
  create_shader,
  create_program,
  create_buffer,
  get_attrib_location,
  get_uniform_location,
  enable_vertex_attrib,
  set_blend_mode,
};
