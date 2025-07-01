// Minimum size for a layer to be rendered in pixels
const INFINITY_ZOOM_MINIMUM_RENDER_SIZE = 3;

// Global zoom speed and rotation speed will be exposed on the engine object
// Defaults are set below

// -------------------

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

// Resize the canvas to match the display size, accounting for device pixel ratio
// canvas: HTMLCanvasElement, gl: WebGLRenderingContext
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

// Compile a shader from source code
// gl: WebGLRenderingContext, type: GLenum (gl.VERTEX_SHADER or gl
function compile_shader(gl, type, src) {
   const sh = gl.createShader(type);
   gl.shaderSource(sh, src);
   gl.compileShader(sh);
   if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(sh));
   }
   return sh;
}

// Create a program for rendering textured quads with feathering
// gl: WebGLRenderingContext
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

// Setup the vertex buffer for a textured quad with interleaved position and texcoord attributes
// gl: WebGLRenderingContext, prog: WebGLProgram
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

// Create a texture from an image, setting parameters for mipmapping and filtering
// gl: WebGLRenderingContext, image: HTMLImageElement
function create_texture_from_image(gl, image) {
   const tex = gl.createTexture();
   gl.bindTexture(gl.TEXTURE_2D, tex);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
   gl.generateMipmap(gl.TEXTURE_2D);
   return tex;
}

// Draw a textured quad with aspect-correct matrix and feathering
// gl: WebGLRenderingContext, prog: WebGLProgram, tex: WebGLTexture, mat: Float32Array (3x3 matrix)
// mat should be in column-major order for WebGL
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

// Create a 3x3 aspect-correct matrix for rendering an image on a canvas
// img: HTMLImageElement, canvas: HTMLCanvasElement
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

// Compose a 3x3 rotation matrix (clockwise, angle in radians)
// angle: number (radians)
// Returns a 3x3 matrix in column-major order
function make_rotation_matrix(angle) {
   const c = Math.cos(angle);
   const s = Math.sin(angle);
   return [c, s, 0, -s, c, 0, 0, 0, 1];
}

// Export a single entry point for the engine
// canvas: HTMLCanvasElement, layers: Array of layer objects, images: Array of HTMLImageElements
// layers: [{ zoom: number, ... }], images: [HTMLImageElement, ...
window.infinity_zoom_webgl_engine = {
   /**
    * Global zoom speed (scaling factor per second)
    * @type {number}
    */
   INFINITY_ZOOM_SPEED: 2,

   /**
    * Global rotation speed (radians per second, clockwise)
    * @type {number}
    * Default: Math.PI / 60 ( = 1 rotation per 2 minutes)
    */
   INFINITY_ZOOM_ROTATION_SPEED: Math.PI / 60,

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
      let paused = false;
      let rotation = 0;
      log('main loop started');
      // Space key toggles pause/resume
      window.addEventListener('keydown', function (e) {
         if (e.code === 'Space' || e.key === ' ') {
            if (paused) {
               // Unpausing: reset last_time to avoid animation jump
               paused = false;
               last_time = null;
               log('animation resumed');
            } else {
               paused = true;
               log('animation paused');
            }
            // Prevent scrolling
            e.preventDefault();
         }
      });
      // Track last rendered count for logging changes only
      animate.last_rendered_count = null;
      function animate(ts) {
         if (!running) return;
         if (paused) {
            requestAnimationFrame(animate);
            return;
         }
         if (!last_time) last_time = ts;
         const dt = (ts - last_time) / 1000;
         last_time = ts;

         // Exponential scale update for all active layers
         for (let i = 0; i < active_layers.length; i++) {
            active_layers[i].scale *= Math.exp(Math.log(window.infinity_zoom_webgl_engine.INFINITY_ZOOM_SPEED) * dt);
         }

         // Update global rotation (clockwise)
         rotation -= window.infinity_zoom_webgl_engine.INFINITY_ZOOM_ROTATION_SPEED * dt;

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
            // Compose rotation * scale * aspect matrix
            const base_mat = make_matrix(img, canvas);
            // Apply scale
            base_mat[0] *= layer.scale;
            base_mat[4] *= layer.scale;
            // Apply rotation (centered)
            const rot = make_rotation_matrix(rotation);
            // Matrix multiply: rot * base_mat (both 3x3)
            const mat = [
               rot[0] * base_mat[0] + rot[1] * base_mat[3],
               rot[0] * base_mat[1] + rot[1] * base_mat[4],
               rot[0] * base_mat[2] + rot[1] * base_mat[5],
               rot[3] * base_mat[0] + rot[4] * base_mat[3],
               rot[3] * base_mat[1] + rot[4] * base_mat[4],
               rot[3] * base_mat[2] + rot[4] * base_mat[5],
               rot[6] * base_mat[0] + rot[7] * base_mat[3] + base_mat[6],
               rot[6] * base_mat[1] + rot[7] * base_mat[4] + base_mat[7],
               rot[6] * base_mat[2] + rot[7] * base_mat[5] + base_mat[8]
            ];
            draw_textured_quad(gl, prog, layer.texture, mat);
         }
         // Log the number of rendered images only when it changes
         if (active_layers.length !== animate.last_rendered_count) {
            log('number of rendered images: ' + active_layers.length);
            animate.last_rendered_count = active_layers.length;
         }

         // End if only one layer left and it fills the viewport (including feather)
         if (active_layers.length === 1) {
            const layer = active_layers[0];
            const min_dim = Math.min(canvas.width, canvas.height);
            const feather_px = Math.max(2, Math.max(canvas.width, canvas.height) * 0.08);
            const draw_size = layer.scale * min_dim;
            if ((draw_size - 2 * feather_px) >= canvas.width && (draw_size - 2 * feather_px) >= canvas.height) {
               running = false;
               log('main loop finished, starting persistent redraw of final image');
               // Start persistent redraw loop for the final image
               function redraw_final_image() {
                  // Always resize canvas to display size
                  resize_canvas_to_display_size(canvas, gl);
                  gl.clearColor(0, 0, 0, 1);
                  gl.clear(gl.COLOR_BUFFER_BIT);
                  ensure_texture(0);
                  const img = images[layer.idx];
                  if (img && layer.texture) {
                     const base_mat = make_matrix(img, canvas);
                     base_mat[0] *= layer.scale;
                     base_mat[4] *= layer.scale;
                     // Restore rotation for final image
                     const rot_mat = make_rotation_matrix(rotation);
                     const mat = [
                        rot_mat[0] * base_mat[0] + rot_mat[1] * base_mat[3],
                        rot_mat[0] * base_mat[1] + rot_mat[1] * base_mat[4],
                        rot_mat[0] * base_mat[2] + rot_mat[1] * base_mat[5],
                        rot_mat[3] * base_mat[0] + rot_mat[4] * base_mat[3],
                        rot_mat[3] * base_mat[1] + rot_mat[4] * base_mat[4],
                        rot_mat[3] * base_mat[2] + rot_mat[4] * base_mat[5],
                        rot_mat[6] * base_mat[0] + rot_mat[7] * base_mat[3] + base_mat[6],
                        rot_mat[6] * base_mat[1] + rot_mat[7] * base_mat[4] + base_mat[7],
                        rot_mat[6] * base_mat[2] + rot_mat[7] * base_mat[5] + base_mat[8]
                     ];
                     draw_textured_quad(gl, prog, layer.texture, mat);
                  }
                  requestAnimationFrame(redraw_final_image);
               }
               requestAnimationFrame(redraw_final_image);
               return;
            }
         }
         requestAnimationFrame(animate);
      }
      requestAnimationFrame(animate);
   }
};


// Debug method: draw only the first image, scaled so the whole image (including feather) fits the viewport
// Call as: window.infinity_zoom_webgl_engine.start_debug(canvas, layers, images)
window.infinity_zoom_webgl_engine.start_debug = function (canvas, layers, images) {
   const gl = canvas.getContext('webgl2');
   resize_canvas_to_display_size(canvas, gl);
   const prog = create_textured_quad_program(gl);
   gl.useProgram(prog);
   setup_textured_quad_buffer(gl, prog);
   gl.disable(gl.BLEND); // No alpha, just solid image

   // Only draw the first image
   const img = images[0];
   if (!img) return;
   const tex = create_texture_from_image(gl, img);
   // Use only aspect correction, no extra scaling
   const mat = make_matrix(img, canvas);

   // Draw once
   gl.clearColor(0, 0, 0, 1);
   gl.clear(gl.COLOR_BUFFER_BIT);
   draw_textured_quad(gl, prog, tex, mat);
};