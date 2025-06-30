// Check if a layer (image) completely covers the viewport, including its feathered border
// img: HTMLImageElement, canvas: HTMLCanvasElement, scale: number, feather_percent: number, feather_min_px: number
function layer_covers_viewport_with_feather(img, canvas, scale, feather_percent = 0.08, feather_min_px = 2) {
   // Compute the draw size (image is always square and aspect-corrected)
   const min_dim = Math.min(canvas.width, canvas.height);
   const draw_size = scale * min_dim;
   // Feather in pixels (same as in 2D engine)
   const feather_px = Math.max(feather_min_px, Math.max(canvas.width, canvas.height) * feather_percent);
   // The solid (non-feathered) part must cover the viewport
   return (draw_size - 2 * feather_px) >= canvas.width && (draw_size - 2 * feather_px) >= canvas.height;
}
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
   // Vertex shader with u_matrix for aspect-correct rendering
   const vert_src = `#version 300 es\nprecision mediump float;\nin vec2 a_position;\nin vec2 a_texcoord;\nuniform mat3 u_matrix;\nout vec2 v_texcoord;\nvoid main() {\n  vec3 pos = u_matrix * vec3(a_position, 1.0);\n  v_texcoord = a_texcoord;\n  gl_Position = vec4(pos.xy, 0, 1);\n}`;
   // Feathering fragment shader: alpha ramps at edges (8% default, can be uniform)
   const frag_src = `#version 300 es\nprecision mediump float;\nin vec2 v_texcoord;\nuniform sampler2D u_image;\nuniform float u_feather;\nout vec4 outColor;\nvoid main() {\n  float min_edge = min(min(v_texcoord.x, 1.0 - v_texcoord.x), min(v_texcoord.y, 1.0 - v_texcoord.y));\n  float feather = u_feather;\n  float edge_alpha = 1.0;\n  if (min_edge < feather) {\n    edge_alpha = min_edge / feather;\n  }\n  vec4 color = texture(u_image, v_texcoord);\n  outColor = vec4(color.rgb, color.a * edge_alpha);\n}`;
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

function draw_textured_quad(gl, prog, tex, mat) {
   gl.useProgram(prog);
   gl.activeTexture(gl.TEXTURE0);
   gl.bindTexture(gl.TEXTURE_2D, tex);
   const u_image = gl.getUniformLocation(prog, 'u_image');
   gl.uniform1i(u_image, 0);
   // Set aspect-correct matrix
   const u_matrix = gl.getUniformLocation(prog, 'u_matrix');
   gl.uniformMatrix3fv(u_matrix, false, mat);
   gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function make_matrix(img, canvas) {
   // Compute aspect-correct scale: ensures image is always square and centered
   const img_aspect = img.width / img.height;
   const canvas_aspect = canvas.width / canvas.height;
   let sx = 1, sy = 1;
   if (img_aspect > canvas_aspect) {
      sy = canvas_aspect / img_aspect;
   } else {
      sx = img_aspect / canvas_aspect;
   }
   return [sx, 0, 0, 0, sy, 0, 0, 0, 1];
}

// Minimum size for a layer to be rendered in pixels
const INFINITY_ZOOM_MINIMUM_RENDER_SIZE = 3;

// Export a single entry point for the engine
window.infinity_zoom_webgl_engine = {
   start_infinity_zoom_webgl: function (canvas, layers, images) {
      const gl = canvas.getContext('webgl2');
      resize_canvas_to_display_size(canvas, gl);
      window.addEventListener('resize', () => resize_canvas_to_display_size(canvas, gl));
      const prog = create_textured_quad_program(gl);
      gl.useProgram(prog);
      setup_textured_quad_buffer(gl, prog);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      const u_feather = gl.getUniformLocation(prog, 'u_feather');
      gl.uniform1f(u_feather, 0.08);

      // --- Layer state ---
      // Each active layer: { idx, scale, texture }
      let active_layers = [];
      // Precompute initial scales for all layers
      let scale = 1.0;
      for (let i = 0; i < layers.length; i++) {
         active_layers.push({
            idx: i,
            scale: scale,
            texture: null
         });
         if (i < layers.length - 1) {
            scale *= layers[i + 1].zoom / 100;
         }
      }

      // Texture management: create textures as needed
      function ensure_texture(layer_idx) {
         const layer = active_layers[layer_idx];
         if (!layer.texture && images[layer.idx]) {
            layer.texture = create_texture_from_image(gl, images[layer.idx]);
         }
      }
      function delete_texture(layer) {
         if (layer.texture) {
            gl.deleteTexture(layer.texture);
            layer.texture = null;
         }
      }

      // Animation loop
      let last_time = null;
      let running = true;
      function animate(ts) {
         if (!running) return;
         if (!last_time) last_time = ts;
         const dt = (ts - last_time) / 1000;
         last_time = ts;

         // Exponential scale update for all active layers
         for (let i = 0; i < active_layers.length; i++) {
            active_layers[i].scale *= Math.exp(Math.log(1.2) * dt);
         }

         // Remove previous layer if next covers viewport (including feather)
         while (active_layers.length > 1) {
            const next = active_layers[1];
            const min_dim = Math.min(canvas.width, canvas.height);
            const feather_px = Math.max(2, Math.max(canvas.width, canvas.height) * 0.08);
            const draw_size = next.scale * min_dim;
            if ((draw_size - 2 * feather_px) >= canvas.width && (draw_size - 2 * feather_px) >= canvas.height) {
               // Remove previous (background) layer
               delete_texture(active_layers[0]);
               active_layers.shift();
            } else {
               break;
            }
         }

         // Clear
         gl.clearColor(0, 0, 0, 1);
         gl.clear(gl.COLOR_BUFFER_BIT);

         // Draw all active layers, back-to-front
         for (let i = 0; i < active_layers.length; i++) {
            const layer = active_layers[i];
            ensure_texture(i);
            const img = images[layer.idx];
            if (!img || !layer.texture) continue;
            const min_dim = Math.min(canvas.width, canvas.height);
            const draw_size = layer.scale * min_dim;
            if (draw_size < INFINITY_ZOOM_MINIMUM_RENDER_SIZE) continue;
            const mat = make_matrix(img, canvas).slice();
            mat[0] *= layer.scale;
            mat[4] *= layer.scale;
            draw_textured_quad(gl, prog, layer.texture, mat);
         }

         // End if only one layer left and it fills the viewport (including feather)
         if (active_layers.length === 1) {
            const layer = active_layers[0];
            const min_dim = Math.min(canvas.width, canvas.height);
            const feather_px = Math.max(2, Math.max(canvas.width, canvas.height) * 0.08);
            const draw_size = layer.scale * min_dim;
            if ((draw_size - 2 * feather_px) >= canvas.width && (draw_size - 2 * feather_px) >= canvas.height) {
               running = false;
               return;
            }
         }
         requestAnimationFrame(animate);
      }
      requestAnimationFrame(animate);
   }
};
