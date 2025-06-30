// Minimal WebGL2 colored quad rendering for incremental test-driven development
// Step 2: Vertex and fragment shader for a solid color quad


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

function compile_shader(gl, type, src) {
   const sh = gl.createShader(type);
   gl.shaderSource(sh, src);
   gl.compileShader(sh);
   if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(sh));
   }
   return sh;
}


function create_textured_quad_program(gl) {
   const vert_src = `#version 300 es\nprecision mediump float;\nin vec2 a_position;\nin vec2 a_texcoord;\nout vec2 v_texcoord;\nvoid main() {\n  v_texcoord = a_texcoord;\n  gl_Position = vec4(a_position, 0, 1);\n}`;
   const frag_src = `#version 300 es\nprecision mediump float;\nin vec2 v_texcoord;\nuniform sampler2D u_image;\nout vec4 outColor;\nvoid main() {\n  outColor = texture(u_image, v_texcoord);\n}`;
   const vs = compile_shader(gl, gl.VERTEX_SHADER, vert_src);
   const fs = compile_shader(gl, gl.FRAGMENT_SHADER, frag_src);
   const prog = gl.createProgram();
   gl.attachShader(prog, vs);
   gl.attachShader(prog, fs);
   gl.linkProgram(prog);
   if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(prog));
   }
   return prog;
}

function setup_textured_quad_buffer(gl, prog) {
   // Interleaved position (x, y) and texcoord (u, v)
   const quad = new Float32Array([
      -1, -1, 0, 0,
      1, -1, 1, 0,
      -1, 1, 0, 1,
      1, 1, 1, 1
   ]);
   const buf = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, buf);
   gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
   const a_position = gl.getAttribLocation(prog, 'a_position');
   const a_texcoord = gl.getAttribLocation(prog, 'a_texcoord');
   gl.enableVertexAttribArray(a_position);
   gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 16, 0);
   gl.enableVertexAttribArray(a_texcoord);
   gl.vertexAttribPointer(a_texcoord, 2, gl.FLOAT, false, 16, 8);
}

function create_texture_from_image(gl, image) {
   const tex = gl.createTexture();
   gl.bindTexture(gl.TEXTURE_2D, tex);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
   return tex;
}

function draw_textured_quad(gl, prog, tex) {
   gl.clearColor(0, 0, 0, 1);
   gl.clear(gl.COLOR_BUFFER_BIT);
   gl.useProgram(prog);
   gl.activeTexture(gl.TEXTURE0);
   gl.bindTexture(gl.TEXTURE_2D, tex);
   const u_image = gl.getUniformLocation(prog, 'u_image');
   gl.uniform1i(u_image, 0);
   gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}


// Export a single entry point for the engine
window.infinity_zoom_webgl_engine = {
   start_infinity_zoom_webgl: function (canvas, layers, images) {
      const gl = canvas.getContext('webgl2');
      resize_canvas_to_display_size(canvas, gl);
      window.addEventListener('resize', () => resize_canvas_to_display_size(canvas, gl));
      // For now, just show the first image as a texture
      const prog = create_textured_quad_program(gl);
      gl.useProgram(prog);
      setup_textured_quad_buffer(gl, prog);
      const tex = create_texture_from_image(gl, images[0]);
      draw_textured_quad(gl, prog, tex);
   }
};
