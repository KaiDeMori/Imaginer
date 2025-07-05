

/*------------------------------------------------------------------------
   show_alien_display.js
   ------------------------------------------------------------------------
   Draw the ‘alien display rectangle’ (p0-p1-p2-p3) so it covers the entire
   canvas.  Uses origin + u_axis + v_axis mapping; totally GPU-side.

   Parameters:
      html_canvas   - The HTML canvas element to draw on.
      texture_img   - The image (HTMLImageElement or similar) to use as a texture.
      p0            - {x, y} object. The origin (top-left) corner of the display rectangle in image pixel coordinates.
      p1            - {x, y} object. The end of the top edge (u-axis) of the rectangle in image pixel coordinates.
      p2            - {x, y} object. The far corner (bottom-right) of the rectangle. Should be p0 + (p1-p0) + (p3-p0).
      p3            - {x, y} object. The end of the left edge (v-axis) of the rectangle in image pixel coordinates.

   Note:
      The rectangle is fully described by p0 (origin), the vector p1-p0 (u-axis, across the top),
      and the vector p3-p0 (v-axis, down the left). p2 is implied by p0 + (p1-p0) + (p3-p0),
      but is accepted for convenience and sanity-checking.
------------------------------------------------------------------------*/
function show_alien_display(html_canvas, texture_img,
   p0, p1, p2, p3) {
   // optional sanity check; comment out if you like to live dangerously
   check_parallelogram(p0, p1, p2, p3, texture_img.width, texture_img.height);

   const gl = html_canvas.getContext('webgl');
   if (!gl) throw Error('webgl_not_available');

   // full-screen quad (clip space)
   const quad_buffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, quad_buffer);
   gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW);

   // --------------------------------------------------------------------
   // shaders
   // --------------------------------------------------------------------
   const vs_src = `
    attribute vec2 a_pos;
    varying   vec2 v_uv_canvas;
    void main() {
      gl_Position  = vec4(a_pos, 0.0, 1.0);
      v_uv_canvas  = a_pos * 0.5 + 0.5;
    }`;

   const fs_src = `
    precision mediump float;
    uniform sampler2D u_tex;
    uniform vec2 u_origin, u_u_axis, u_v_axis;
    varying vec2 v_uv_canvas;
    void main() {
      vec2 uv = u_origin
              + u_u_axis * v_uv_canvas.x
              + u_v_axis * v_uv_canvas.y;
      gl_FragColor = texture2D(u_tex, uv);
    }`;

   const prog = create_program(gl, vs_src, fs_src);
   gl.useProgram(prog);

   // attribute ↔ buffer
   const loc_pos = gl.getAttribLocation(prog, 'a_pos');
   gl.enableVertexAttribArray(loc_pos);
   gl.vertexAttribPointer(loc_pos, 2, gl.FLOAT, false, 0, 0);

   // texture upload (LIN-CLAMP standard issue)
   const tex = gl.createTexture();
   gl.bindTexture(gl.TEXTURE_2D, tex);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
   gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
      gl.UNSIGNED_BYTE, texture_img);

   // convert pixel coords → uv
   const w = texture_img.width, h = texture_img.height;
   const to_uv = (pt) => [pt.x / w, pt.y / h];

   const origin_uv = to_uv(p0);
   const u_axis_uv = [(p1.x - p0.x) / w, (p1.y - p0.y) / h];
   const v_axis_uv = [(p3.x - p0.x) / w, (p3.y - p0.y) / h];

   gl.uniform2fv(gl.getUniformLocation(prog, 'u_origin'), origin_uv);
   gl.uniform2fv(gl.getUniformLocation(prog, 'u_u_axis'), u_axis_uv);
   gl.uniform2fv(gl.getUniformLocation(prog, 'u_v_axis'), v_axis_uv);
   gl.uniform1i(gl.getUniformLocation(prog, 'u_tex'), 0);

   // draw
   gl.viewport(0, 0, html_canvas.width, html_canvas.height);
   gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

/*------------------------------------------------------------------------
  check_parallelogram
  ------------------------------------------------------------------------
  Returns true if the four points are (within ε) a parallelogram.
  ε is scaled to 0.01 % of the diagonal—enough to flag typos, not photons.
------------------------------------------------------------------------*/
function check_parallelogram(p0, p1, p2, p3, w, h, rel_eps = 1e-4) {
   const vec = (a, b) => ({ x: b.x - a.x, y: b.y - a.y });
   const len = v => Math.hypot(v.x, v.y);

   const d_uv = Math.hypot(w, h);          // image diagonal length (pixels)
   const eps = d_uv * rel_eps;

   const u = vec(p0, p1);
   const v = vec(p0, p3);
   const u2 = vec(p3, p2);                 // should equal u
   const v2 = vec(p1, p2);                 // should equal v

   const dev_u = len({ x: u.x - u2.x, y: u.y - u2.y });
   const dev_v = len({ x: v.x - v2.x, y: v.y - v2.y });

   const ok = dev_u <= eps && dev_v <= eps;

   // cathartic console therapy
   console.log('parallelogram_check:',
      { ok, dev_u, dev_v, eps });

   return ok;
}

// Attach to window for browser global access
window.show_alien_display = show_alien_display;
window.check_parallelogram = check_parallelogram;

/* utility --------------------------------------------------------------*/
function create_program(gl, vs_src, fs_src) {
   const compile = (src, type) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
         throw Error(gl.getShaderInfoLog(s));
      return s;
   };
   const p = gl.createProgram();
   gl.attachShader(p, compile(vs_src, gl.VERTEX_SHADER));
   gl.attachShader(p, compile(fs_src, gl.FRAGMENT_SHADER));
   gl.linkProgram(p);
   if (!gl.getProgramParameter(p, gl.LINK_STATUS))
      throw Error(gl.getProgramInfoLog(p));
   return p;
}