/*--------------------------------------------------------------------
   image_region_zoom.js
   --------------------------------------------------------------------
   General-purpose WebGL region zoom/warp helper. All WebGL setup
   happens once in create_image_region_zoom(…), then every animation
   frame you simply call zoomer.draw(t) with a 0‒1 parameter.

   This function animates a zoom-in effect by default:
      - At t=0, the full image/canvas is shown (fromRect)
      - At t=1, only the target rectangle (toRect) is shown
      - Interpolates smoothly between the two for t in [0,1]

   Signature
      const zoomer = create_image_region_zoom(canvas, gl, img, fromRect, toRect);

         canvas   – <canvas> element that already lives in the DOM.
         gl       – WebGLRenderingContext.
         img      – <img> (fully loaded) that will become the texture.
         fromRect – { p0:{x,y}, p1:{x,y}, p3:{x,y} }  keyframe at t = 0 (start rectangle, e.g. full image/canvas).
         toRect   – { p0:{x,y}, p1:{x,y}, p3:{x,y} }  keyframe at t = 1 (end rectangle, e.g. zoom target).

      zoomer.draw(t)  – render with interpolation factor t ∈ [0,1].
--------------------------------------------------------------------*/

function create_image_region_zoom(canvas, gl, img, fromRect, toRect) {
   // ---------------------------------------------------------------
   // 0.  Acquire GL context if caller passed null
   // ---------------------------------------------------------------
   gl = gl || canvas.getContext('webgl');
   if (!gl) throw Error('webgl_not_available');

   // ---------------------------------------------------------------
   // 1.  Full-screen quad + shader program
   // ---------------------------------------------------------------
   const vs_src =
      'attribute vec2 a_pos;\n' +
      'varying vec2 v_uv;\n' +
      'void main(){\n' +
      '  gl_Position = vec4(a_pos,0.0,1.0);\n' +
      '  v_uv = a_pos*0.5+0.5;\n' +
      '}';

   const fs_src =
      'precision mediump float;\n' +
      'uniform sampler2D u_tex;\n' +
      'uniform vec2 u_o, u_u, u_v;\n' +
      'varying vec2 v_uv;\n' +
      'void main(){\n' +
      '  vec2 uv = u_o + u_u * v_uv.x + u_v * v_uv.y;\n' +
      '  gl_FragColor = texture2D(u_tex, uv);\n' +
      '}';

   const prog = create_program(gl, vs_src, fs_src);
   gl.useProgram(prog);

   const quad = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, quad);
   gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
   );
   const loc_pos = gl.getAttribLocation(prog, 'a_pos');
   gl.enableVertexAttribArray(loc_pos);
   gl.vertexAttribPointer(loc_pos, 2, gl.FLOAT, false, 0, 0);

   // ---------------------------------------------------------------
   // 2.  Upload texture (LIN / CLAMP)
   // ---------------------------------------------------------------
   const tex = gl.createTexture();
   gl.bindTexture(gl.TEXTURE_2D, tex);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
   gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
   gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      img
   );

   // ---------------------------------------------------------------
   // 3.  Pre-compute the two keyframe rectangles (origin + axes)
   // ---------------------------------------------------------------
   function rect_to_axes(rect) {
      const { p0, p1, p3 } = rect; // {x,y}
      const w = img.width, h = img.height;
      const o = [p0.x / w, p0.y / h];
      const u = [(p1.x - p0.x) / w, (p1.y - p0.y) / h];
      const v = [(p3.x - p0.x) / w, (p3.y - p0.y) / h];
      const u_len = Math.hypot(u[0], u[1]);
      const v_len = Math.hypot(v[0], v[1]);
      const fmt = arr => arr.map(x => x.toFixed(4)).join(',');
      const msg = `[RegionZoom] rect_to_axes: o=(${fmt(o)}), u=(${fmt(u)}), v=(${fmt(v)}), |u|=${u_len.toFixed(4)}, |v|=${v_len.toFixed(4)}, aspect=${(u_len / v_len).toFixed(4)}`;
      console.log(msg);
      return { o, u, v };
   }

   const r0 = rect_to_axes(toRect || fromRect); // end rectangle (t=1)
   const r1 = rect_to_axes(fromRect);           // start rectangle (t=0)

   const loc_o = gl.getUniformLocation(prog, 'u_o');
   const loc_u = gl.getUniformLocation(prog, 'u_u');
   const loc_v = gl.getUniformLocation(prog, 'u_v');

   function lerp(a, b, t) {
      return a + (b - a) * t;
   }
   function mix2(v0, v1, t) {
      return [lerp(v0[0], v1[0], t), lerp(v0[1], v1[1], t)];
   }

   // ---------------------------------------------------------------
   // 4.  Public API – draw(t)
   // ---------------------------------------------------------------
   function draw(t) {
      // t=0: full image/canvas, t=1: target rectangle (zoom-in)
      const o = mix2(r1.o, r0.o, t);
      const u = mix2(r1.u, r0.u, t);
      const v = mix2(r1.v, r0.v, t);

      gl.useProgram(prog);
      gl.uniform2fv(loc_o, o);
      gl.uniform2fv(loc_u, u);
      gl.uniform2fv(loc_v, v);

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
   }

   return { draw };
}

/*------------------------------------------------------------------
  Helper: compile + link a tiny shader program
------------------------------------------------------------------*/
function create_program(gl, vs_src, fs_src) {
   function compile(src, type) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
         throw Error(gl.getShaderInfoLog(s));
      return s;
   }
   const p = gl.createProgram();
   gl.attachShader(p, compile(vs_src, gl.VERTEX_SHADER));
   gl.attachShader(p, compile(fs_src, gl.FRAGMENT_SHADER));
   gl.linkProgram(p);
   if (!gl.getProgramParameter(p, gl.LINK_STATUS))
      throw Error(gl.getProgramInfoLog(p));
   return p;
}

// Expose to global namespace for quick demos
window.create_image_region_zoom = create_image_region_zoom;