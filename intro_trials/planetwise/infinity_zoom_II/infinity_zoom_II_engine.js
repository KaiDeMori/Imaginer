// Infinity Zoom II Engine – main structure and method stubs

// NOTE: Use global log(msg) utility. Single parameter: the message to log.

// Minimum rendered layer size in pixels (V2 documentation §2, §6; see also V1 engine).
const INFINITY_ZOOM_MINIMUM_RENDER_SIZE = 3;

// Edge feathering for all but first layer (fraction of edge, V2 documentation §7).
const INFINITY_ZOOM_FEATHER_VALUE = 0.1;

// Minimum feather width for edge alpha ramp in pixels (V1 code snippet, see V1 engine).
const INFINITY_ZOOM_FEATHER_MIN_PX = 2;

// Initial rotation angle in radians.
const INFINITY_ZOOM_START_ROTATION_ANGLE = 0; //Math.PI * (1 / 2);

// Global rotation speed in radians per second. Positive values rotate clockwise.
const INFINITY_ZOOM_ROTATION_SPEED = 0.3; //Math.PI / 60;

// Absolute final rotation angle in radians after last layer covers viewport.
const INFINITY_ZOOM_FINAL_ROTATION_ANGLE = 0; //Math.PI;

// Exponential zoom rate (growth constant per second, default from V1; see V1 documentation and engine).
const INFINITY_ZOOM_SPEED = 3; //TRIALS originally: 1.2;

// Main engine object
const infinity_zoom_engine = {
  // State
  gl: null,
  canvas: null,
  layers: [], // { image, zoom, texture, alpha, scale, ... }
  start_time: 0,
  animation_phase: "intro", // 'intro', 'main_zoom', 'done'
  rotation: 0,
  rotation_speed: INFINITY_ZOOM_ROTATION_SPEED,
  zoom_speed: INFINITY_ZOOM_SPEED,
  // ...other state as needed

  // Initialize engine with preloaded images and canvas
  init(layer_data, images, canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl", { alpha: false });
    if (!this.gl) {
      log("WebGL not supported");
      return;
    }
    // Enable alpha blending for fade-in/fade-out
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    // Store layers with correct image and zoom
    this.layers = layer_data.map((layer, i) => ({
      image: images[i],
      zoom: layer.zoom,
      texture: null,
      alpha: 1.0,
      scale: 1.0,
      loaded: false,
    }));
    this.start_time = performance.now();
    this.animation_phase = "intro";
    this.rotation = INFINITY_ZOOM_START_ROTATION_ANGLE;
    window.infinity_zoom_II_utils_render.resize_canvas_to_display_size(this.canvas, this.gl);

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
    // Preload all layers to GPU (warm-up phase)
    this.preload_all_layers_to_gpu();
    // V1 quad buffer: single quad, 4 vertices, for TRIANGLE_STRIP
    const quadVerts = new Float32Array([-1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, 1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);
    this.buffer = buffer;
    this.a_position = gl.getAttribLocation(program, "a_position");
    this.a_texcoord = gl.getAttribLocation(program, "a_texcoord");
    this.u_matrix = gl.getUniformLocation(program, "u_matrix");
    this.u_image = gl.getUniformLocation(program, "u_image");
    this.u_alpha = gl.getUniformLocation(program, "u_alpha");

    requestAnimationFrame(this.animate.bind(this));
  },

  // Main animation loop
  animate(now) {
    // Step 3.1b/3.1c: Animate first layer zoom-in, then fade-in additional layers
    const elapsed = (now - this.start_time) / 1000;
    if (this.animation_phase === "intro") {
      // Advance rotation in all phases
      this.rotation += this.rotation_speed * (1 / 60); // Approximate 60fps step
      const zoom_duration = 0.1; //TRIALS orignally: 3.0;
      const fade_duration = 0; //TRIALS originally: 1.0;
      if (elapsed < zoom_duration) {
        // Exponential from 1px to scale 1 (first layer)
        const min_dim = Math.min(this.canvas.width, this.canvas.height);
        const t = elapsed / zoom_duration;
        const first_layer_scale = Math.exp(Math.log(min_dim) * t) / min_dim;
        this.layers[0].scale = first_layer_scale;
        for (let i = 1; i < this.layers.length; ++i) {
          const layer = this.layers[i];
          layer.scale = this.get_layer_scale(i, first_layer_scale);
          layer.alpha = 0;
        }
        // Dynamic resource management (intro phase: current_zoom=1)
        const viewport = { width: this.canvas.width, height: this.canvas.height };
        //this.update_layer_resource_states(viewport);
        requestAnimationFrame(this.animate.bind(this));
      } else if (elapsed < zoom_duration + fade_duration) {
        // Fade-in additional layers: keep correct relative scale (relative to first layer)
        this.layers[0].scale = 1;
        for (let i = 1; i < this.layers.length; ++i) {
          const layer = this.layers[i];
          layer.scale = this.get_layer_scale(i, 1);
        }
        const fade_t = (elapsed - zoom_duration) / fade_duration;
        const viewport = { width: this.canvas.width, height: this.canvas.height };
        //this.update_layer_resource_states(viewport);
        const visible_layers = this.determine_visible_layers(viewport);
        for (let i = 1; i < this.layers.length; ++i) {
          const layer = this.layers[i];
          if (visible_layers.includes(layer)) {
            layer.alpha = Math.min(1, fade_t);
          } else {
            layer.alpha = 0;
          }
        }
        requestAnimationFrame(this.animate.bind(this));
      } else {
        // Hold state for next step (first layer at scale 1)
        const min_dim = Math.min(this.canvas.width, this.canvas.height);
        this.layers[0].scale = 1;
        for (let i = 1; i < this.layers.length; ++i) {
          const layer = this.layers[i];
          layer.scale = this.get_layer_scale(i, 1);
          const draw_size = layer.scale * min_dim;
          if (draw_size >= INFINITY_ZOOM_MINIMUM_RENDER_SIZE) {
            layer.alpha = 1;
          } else {
            layer.alpha = 0;
          }
        }
        this.animation_phase = "hold";
        this.hold_start_time = now;
        requestAnimationFrame(this.animate.bind(this));
      }
    } else if (this.animation_phase === "hold") {
      // Step 3.1d: Hold, only rotation
      const hold_duration = 0; //TRIALS originally: 1.5;
      const elapsed_hold = (now - this.hold_start_time) / 1000;
      // Advance rotation
      this.rotation += this.rotation_speed * (1 / 60); // Approximate 60fps step
      if (elapsed_hold < hold_duration) {
        requestAnimationFrame(this.animate.bind(this));
      } else {
        // Transition to main zoom phase
        this.animation_phase = "main_zoom";
        this.main_zoom_start_time = now;
        this.first_layer_scale_at_main_zoom = 1;
        requestAnimationFrame(this.animate.bind(this));
      }
    } else if (this.animation_phase === "main_zoom") {
      // Main zoom phase: exponential zoom and rotation until last layer covers viewport
      const elapsed_main_zoom = (now - this.main_zoom_start_time) / 1000;
      // Advance rotation
      this.rotation += this.rotation_speed * (1 / 60); // Approximate 60fps step
      // Exponential zoom: s(t) = s0 * exp(k * t)
      const min_dim = Math.min(this.canvas.width, this.canvas.height);
      const k = this.zoom_speed;
      const s0 = this.first_layer_scale_at_main_zoom;
      const first_layer_scale = s0 * Math.exp(k * elapsed_main_zoom);
      this.layers[0].scale = first_layer_scale;
      for (let i = 1; i < this.layers.length; ++i) {
        const layer = this.layers[i];
        layer.scale = this.get_layer_scale(i, first_layer_scale);
        layer.alpha = 1;
      }

      //this.update_layer_resource_states(viewport);
      // Check if last layer covers the viewport (no bars, covers both width and height)
      const last_layer = this.layers[this.layers.length - 1];
      const last_layer_draw_size = last_layer.scale * min_dim;
      if (last_layer_draw_size >= Math.max(this.canvas.width, this.canvas.height)) {
        // Last layer now covers viewport: stop zoom, continue rotation to final angle
        this.last_layer_cover_time = now;
        this.rotation_at_cover = this.rotation;
        this.animation_phase = "final_rotation";
        log("Main zoom complete. Continuing rotation to final angle...");
        requestAnimationFrame(this.animate.bind(this));
      } else {
        requestAnimationFrame(this.animate.bind(this));
      }
    } else if (this.animation_phase === "final_rotation") {
      // Continue rotation until INFINITY_ZOOM_FINAL_ROTATION_ANGLE (absolute) is reached
      // const target_rotation = INFINITY_ZOOM_FINAL_ROTATION_ANGLE;
      // this.rotation += this.rotation_speed * (1 / 60); // Approximate 60fps step
      // if ((this.rotation_speed > 0 && this.rotation < target_rotation) || (this.rotation_speed < 0 && this.rotation > target_rotation)) {
      //    requestAnimationFrame(this.animate.bind(this));
      // } else {
      //    this.rotation = target_rotation;
      //    this.rotation_speed = 0;
      //    this.animation_phase = 'done';
      //    log('Final rotation complete. Animation done.');
      // }

      //for debug
      this.animation_phase = "done";
      requestAnimationFrame(this.animate.bind(this));
      //--
    } else if (this.animation_phase === "done") {
      // Expose final state in region-zoom-language (image coordinates of visible crop)
      // Compute the visible rectangle of the image as mapped to the canvas (cover, centered)
      // Use the helper to compute the visible rectangle in image coordinates
      const img = this.layers[0].image;
      const scale = this.layers[0].scale;
      const rect = this.compute_final_visible_rect(img, this.canvas, scale, this.rotation);
      this.final_visible_rect = rect;
      log("Animation done. Final state: final_visible_rect =", this.final_visible_rect);
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
        // Use utils for aspect, rotation, and matrix math
        const aspect = window.infinity_zoom_II_utils_math.make_matrix(layer.image, this.canvas);
        const s = layer.scale;
        const scale_mat = [s, 0, 0, 0, s, 0, 0, 0, 1];
        const rot = window.infinity_zoom_II_utils_math.make_rotation_matrix(this.rotation);
        // Compose: rot * scale * aspect
        let mat = window.infinity_zoom_II_utils_math.mat3_mul(rot, window.infinity_zoom_II_utils_math.mat3_mul(scale_mat, aspect));
        gl.uniformMatrix3fv(this.u_matrix, false, mat);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, layer.texture);
        gl.uniform1i(this.u_image, 0);
        gl.uniform1f(this.u_alpha, typeof layer.alpha === "number" ? layer.alpha : 1.0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    }
  },

  // Calculate which layers are visible at current scale
  get_visible_layers(min_dim) {
    // Returns array of visible layers whose scaled size is above the minimum render size
    return this.layers.filter((layer) => layer.scale * min_dim >= INFINITY_ZOOM_MINIMUM_RENDER_SIZE);
  },

  // Compute the scale for a given layer index and first layer scale (V1 logic, always refer to 'first layer' not 'planet')
  get_layer_scale(layer_index, first_layer_scale) {
    let scale = first_layer_scale;
    for (let i = 1; i <= layer_index; ++i) {
      scale *= this.layers[i].zoom / 100;
    }
    return scale;
  },

  // Pre-calculate and upload all layers that will be visible at the given first_layer_scale before the intro begins
  // canvas: the canvas element to determine min_dim
  // first_layer_scale: scale of the first layer (default 1)
  preload_intro_visible_layers(canvas, first_layer_scale = 1) {
    // Calculate min_dim (minimum of canvas width/height)
    const min_dim = Math.min(canvas.width, canvas.height);
    // For each layer, compute its scale at the given first_layer_scale
    for (let i = 0; i < this.layers.length; ++i) {
      const scale = this.get_layer_scale(i, first_layer_scale);
      const draw_size = scale * min_dim;
      if (draw_size >= INFINITY_ZOOM_MINIMUM_RENDER_SIZE) {
        // Upload texture if not already uploaded
        if (!this.layers[i].texture) {
          window.infinity_zoom_II_utils_render.upload_texture(this.gl, this.layers[i]);
        }
      }
    }
  },

  // Generalized: Determine which layers are visible given current zoom and viewport
  // For now, wraps get_visible_layers logic for backward compatibility
  // current_zoom: scale of the first layer (usually 1 during intro)
  // viewport: { width, height } (canvas size)
  determine_visible_layers(viewport) {
    const min_dim = Math.min(viewport.width, viewport.height);
    // For now, use the same logic as get_visible_layers
    return this.get_visible_layers(min_dim);
  },

  // Upload the specified layer's texture to the GPU if not already uploaded
  upload_layer_to_gpu(layer_index) {
    const layer = this.layers[layer_index];
    if (layer && !layer.texture) {
      window.infinity_zoom_II_utils_render.upload_texture(this.gl, layer);
    }
  },

  // Remove the specified layer's texture from the GPU if currently uploaded
  remove_layer_from_gpu(layer_index) {
    const layer = this.layers[layer_index];
    if (layer && layer.texture) {
      window.infinity_zoom_II_utils_render.delete_texture(this.gl, layer);
    }
  },

  // Orchestrate dynamic upload/removal of layers based on visibility
  // current_zoom: scale of the first layer
  // viewport: { width, height }
  update_layer_resource_states(viewport) {
    // Get the set of layers that should be visible (and thus uploaded)
    const visible_layers = this.determine_visible_layers(viewport);
    // Build a Set for fast lookup
    const visible_set = new Set(visible_layers);
    for (let i = 0; i < this.layers.length; ++i) {
      const layer = this.layers[i];
      const should_be_uploaded = visible_set.has(layer);
      const is_uploaded = window.infinity_zoom_II_utils_render.is_layer_uploaded(layer);
      if (should_be_uploaded && !is_uploaded) {
        this.upload_layer_to_gpu(i);
        log("Uploaded layer " + i);
      } else if (!should_be_uploaded && is_uploaded) {
        this.remove_layer_from_gpu(i);
        log("Removed layer " + i);
      }
    }
  },

  // Preload all layer images to the GPU (warm-up phase)
  preload_all_layers_to_gpu() {
    for (let i = 0; i < this.layers.length; ++i) {
      const layer = this.layers[i];
      if (!layer.texture) {
        window.infinity_zoom_II_utils_render.upload_texture(this.gl, layer);
      }
    }
    log("Preloaded all layers to GPU");
  },

  /**
   * Compute the visible rectangle of the image as mapped to the canvas, given scale and rotation.
   * Returns an object with p0, p1, p2, p3 in image coordinates that map to the canvas corners.
   * @param {HTMLImageElement} image - The image object (with .width, .height)
   * @param {HTMLCanvasElement} canvas - The canvas element (with .width, .height)
   * @param {number} scale - The current scale applied to the image
   * @param {number} rotation - The current rotation (in radians)
   * @returns {object} Rectangle in image coordinates
   */
  compute_final_visible_rect(image, canvas, scale, rotation) {
    // Compose the forward transform: aspect -> scale -> rotation
    const aspect = window.infinity_zoom_II_utils_math.make_matrix(image, canvas);
    const scale_mat = [scale, 0, 0, 0, scale, 0, 0, 0, 1];
    const rot_mat = window.infinity_zoom_II_utils_math.make_rotation_matrix(rotation);
    // Forward: rot * scale * aspect
    let forward = window.infinity_zoom_II_utils_math.mat3_mul(rot_mat, window.infinity_zoom_II_utils_math.mat3_mul(scale_mat, aspect));
    // Invert to get canvas->image mapping
    const inv = window.infinity_zoom_II_utils_math.mat3_invert(forward);
    if (!inv) return null;
    // Canvas corners in pixel coordinates
    const w = canvas.width,
      h = canvas.height;
    // Map: p0 = (0,0), p1 = (w,0), p2 = (w,h), p3 = (0,h)
    const p0 = window.infinity_zoom_II_utils_math.mat3_transform_point(inv, [0, 0]);
    const p1 = window.infinity_zoom_II_utils_math.mat3_transform_point(inv, [w, 0]);
    const p2 = window.infinity_zoom_II_utils_math.mat3_transform_point(inv, [w, h]);
    const p3 = window.infinity_zoom_II_utils_math.mat3_transform_point(inv, [0, h]);
    return { p0, p1, p2, p3 };
  },
};

// Export for HTML usage
window.infinity_zoom_II_engine = infinity_zoom_engine;

// Add a window resize event listener to dynamically adjust canvas size
window.addEventListener("resize", () => {
  if (window.infinity_zoom_II_engine && window.infinity_zoom_II_engine.canvas && window.infinity_zoom_II_engine.gl) {
    window.infinity_zoom_II_utils_render.resize_canvas_to_display_size(window.infinity_zoom_II_engine.canvas, window.infinity_zoom_II_engine.gl);
  }
});
