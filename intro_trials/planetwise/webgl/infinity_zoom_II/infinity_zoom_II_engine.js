
// Infinity Zoom II Engine – main structure and method stubs

// NOTE: Use global log(msg) utility. Single parameter: the message to log.

// Only render layers above this pixel size (V2 documentation §2, §6; see also V1 engine)
const INFINITY_ZOOM_MINIMUM_RENDER_SIZE = 3;

// Feathering amount for all but first layer (fraction of edge, V2 documentation §7)
const INFINITY_ZOOM_FEATHER_VALUE = 0.08;

// Minimum feather in pixels for edge alpha ramp (V1 code snippet, see V1 engine)
const INFINITY_ZOOM_FEATHER_MIN_PX = 2;

// Global rotation speed: 1 full turn every 2 minutes (V2 documentation §4)
const INFINITY_ZOOM_ROTATION_SPEED = Math.PI / 60; // radians per second

// Exponential zoom rate (default from V1, see V1 documentation and engine)
const INFINITY_ZOOM_SPEED = 2;

// Main engine object
const infinity_zoom_engine = {
   // State
   gl: null,
   canvas: null,
   layers: [], // { image, zoom, texture, alpha, scale, ... }
   start_time: 0,
   animation_phase: 'intro', // 'intro', 'main_zoom', 'done'
   rotation: 0,
   rotation_speed: INFINITY_ZOOM_ROTATION_SPEED,
   zoom_speed: INFINITY_ZOOM_SPEED,
   // ...other state as needed

   // Initialize engine with preloaded images and canvas
   init(layer_data, images, canvas) {
      this.canvas = canvas;
      this.gl = canvas.getContext('webgl', { alpha: false });
      if (!this.gl) {
         this.log('WebGL not supported');
         return;
      }
      // Store layers with correct image and zoom
      this.layers = layer_data.map((layer, i) => ({
         image: images[i],
         zoom: layer.zoom,
         texture: null,
         alpha: 1.0,
         scale: 1.0,
         loaded: false
      }));
      this.start_time = performance.now();
      this.animation_phase = 'intro';
      this.rotation = 0;
      this.resize_canvas();

      // --- WebGL setup ---
      const gl = this.gl;
      // Vertex shader (now uses mat3 u_matrix for all transforms)
      const vsSource = `
         attribute vec2 a_position;
         attribute vec2 a_texcoord;
         varying vec2 v_texcoord;
         uniform mat3 u_matrix;
         void main() {
            vec3 pos = u_matrix * vec3(a_position, 1.0);
            gl_Position = vec4(pos.xy, 0, 1);
            v_texcoord = a_texcoord;
         }
      `;
      // Fragment shader
      const fsSource = `
         precision mediump float;
         varying vec2 v_texcoord;
         uniform sampler2D u_image;
         uniform float u_alpha;
         void main() {
            vec4 color = texture2D(u_image, v_texcoord);
            gl_FragColor = vec4(color.rgb, color.a * u_alpha);
         }
      `;
      function compileShader(type, source) {
         const shader = gl.createShader(type);
         gl.shaderSource(shader, source);
         gl.compileShader(shader);
         if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(shader));
         }
         return shader;
      }
      const vs = compileShader(gl.VERTEX_SHADER, vsSource);
      const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
      const program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
         throw new Error(gl.getProgramInfoLog(program));
      }
      this.program = program;

      // V1 quad buffer: single quad, 4 vertices, for TRIANGLE_STRIP
      const quadVerts = new Float32Array([
         -1, -1, 0, 0,
         1, -1, 1, 0,
         -1, 1, 0, 1,
         1, 1, 1, 1
      ]);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);
      this.buffer = buffer;
      this.a_position = gl.getAttribLocation(program, 'a_position');
      this.a_texcoord = gl.getAttribLocation(program, 'a_texcoord');
      this.u_matrix = gl.getUniformLocation(program, 'u_matrix');
      this.u_image = gl.getUniformLocation(program, 'u_image');
      this.u_alpha = gl.getUniformLocation(program, 'u_alpha');

      // Only upload first layer for now
      this.upload_texture(this.layers[0]);
      requestAnimationFrame(this.animate.bind(this));
   },

   // Main animation loop
   animate(now) {
      // Step 3.1b/3.1c: Animate planet zoom-in, then fade-in additional layers
      const elapsed = (now - this.start_time) / 1000;
      if (this.animation_phase === 'intro') {
         // Advance rotation in all phases
         this.rotation += this.rotation_speed * (1 / 60); // Approximate 60fps step
         const zoom_duration = 0.5;
         const fade_duration = 0.5;
         if (elapsed < zoom_duration) {
            // Exponential from 1px to scale 1
            const min_dim = Math.min(this.canvas.width, this.canvas.height);
            const t = elapsed / zoom_duration;
            const scale = Math.exp(Math.log(min_dim) * t) / min_dim;
            this.layers[0].scale = scale;
            requestAnimationFrame(this.animate.bind(this));
         } else if (elapsed < zoom_duration + fade_duration) {
            // Fade-in additional layers
            this.layers[0].scale = 1;
            const fade_t = (elapsed - zoom_duration) / fade_duration;
            // Preload and fade in all visible layers (except planet)
            for (let i = 1; i < this.layers.length; ++i) {
               if (!this.layers[i].texture) this.upload_texture(this.layers[i]);
               this.layers[i].scale = 1; // fixed scale during fade
               this.layers[i].alpha = Math.min(1, fade_t);
            }
            requestAnimationFrame(this.animate.bind(this));
         } else {
            // Hold state for next step
            for (let i = 1; i < this.layers.length; ++i) {
               this.layers[i].alpha = 1;
            }
            this.animation_phase = 'hold';
            this.hold_start_time = now;
            requestAnimationFrame(this.animate.bind(this));
         }
      } else if (this.animation_phase === 'hold') {
         // Step 3.1d: Hold for 0.5s, only rotation
         const hold_duration = 0.5;
         const elapsed_hold = (now - this.hold_start_time) / 1000;
         // Advance rotation
         this.rotation += this.rotation_speed * (1 / 60); // Approximate 60fps step
         if (elapsed_hold < hold_duration) {
            requestAnimationFrame(this.animate.bind(this));
         } else {
            // Proceed to next phase in later steps
         }
      }
      this.render();
   },

   // Render all visible layers
   render() {
      // WebGL rendering: draw all visible layers as textured quads, always square
      const gl = this.gl;
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(this.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.enableVertexAttribArray(this.a_position);
      gl.vertexAttribPointer(this.a_position, 2, gl.FLOAT, false, 16, 0);
      gl.enableVertexAttribArray(this.a_texcoord);
      gl.vertexAttribPointer(this.a_texcoord, 2, gl.FLOAT, false, 16, 8);

      for (let i = 0; i < this.layers.length; ++i) {
         const layer = this.layers[i];
         if (layer && layer.texture) {
            // Compose aspect, scale, then rotation (V1 order: aspect first, then scale, then rotation)
            const aspect = make_matrix(layer.image, this.canvas);
            const s = layer.scale;
            const scale_mat = [s, 0, 0, 0, s, 0, 0, 0, 1];
            const rot = make_rotation_matrix(this.rotation);
            // Compose: rot * scale * aspect
            let mat = mat3_mul(rot, mat3_mul(scale_mat, aspect));
            gl.uniformMatrix3fv(this.u_matrix, false, mat);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, layer.texture);
            gl.uniform1i(this.u_image, 0);
            gl.uniform1f(this.u_alpha, (typeof layer.alpha === 'number') ? layer.alpha : 1.0);
            // V1: use TRIANGLE_STRIP, 4 vertices
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
         }
      }
   },

   // Calculate which layers are visible at current scale
   get_visible_layers() {
      // ...return array of visible layers
   },

   // Upload a layer's image to GPU as a texture
   upload_texture(layer) {
      window.infinity_zoom_II_utils_render.upload_texture(this.gl, layer);
   },

   // Delete a layer's texture from GPU
   delete_texture(layer) {
      window.infinity_zoom_II_utils_render.delete_texture(this.gl, layer);
   },

   // Resize canvas and update viewport
   resize_canvas() {
      window.infinity_zoom_II_utils_render.resize_canvas_to_display_size(this.canvas, this.gl);
   },

   // Ensure canvas dimensions are correctly set
   resize_canvas_to_display_size(canvas, gl) {
      window.infinity_zoom_II_utils_render.resize_canvas_to_display_size(canvas, gl);
   },

   // Utility: check if a layer covers the viewport (with feather)
   layer_covers_viewport_with_feather(layer, scale) {
      // ...return true/false
   },

   // Utility: build rotation matrix for current angle
   make_rotation_matrix(angle) {
      // ...return 3x3 matrix as flat array
   }
};

// Export for HTML usage
window.infinity_zoom_II_engine = infinity_zoom_engine;

// Add a window resize event listener to dynamically adjust canvas size
window.addEventListener('resize', () => {
   if (window.infinity_zoom_II_engine && window.infinity_zoom_II_engine.canvas && window.infinity_zoom_II_engine.gl) {
      window.infinity_zoom_II_engine.resize_canvas_to_display_size(window.infinity_zoom_II_engine.canvas, window.infinity_zoom_II_engine.gl);
      // Debug log removed
   }
});
