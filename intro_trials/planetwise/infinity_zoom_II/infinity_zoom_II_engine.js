// Y-FLIP PIPELINE FACT:
//
// When uploading images to WebGL and copying results to a 2D canvas, there is a difference in coordinate systems:
// - The browser and 2D canvas use a top-left origin (0,0 is top-left).
// - WebGL's default rendering uses a bottom-left origin (0,0 is bottom-left).
//
// If you upload an image to WebGL with gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false) and sample with v_texcoord,
// the image appears upright in WebGL's coordinate system. However, when you copy the WebGL canvas to a 2D canvas
// (e.g., ctx2d.drawImage(webgl_canvas, ...)), the result appears vertically flipped compared to the original image.
//
// This is because the WebGL output is bottom-left origin, but 2D canvas expects top-left origin.
//
// This was confirmed with a minimal test: the feathered canvas is flipped unless a Y-flip is applied in the WebGL pipeline.
//
// Infinity Zoom II Engine – main structure and method stubs

(window.infinity_zoom_II = {
  assert_all_namespaces: function () {
    if (!window.infinity_zoom_II) window.infinity_zoom_II = {};
    if (!window.infinity_zoom_II.utils) window.infinity_zoom_II.utils = {};
    if (!window.infinity_zoom_II.utils.region_zoom) window.infinity_zoom_II.utils.region_zoom = {};
    if (!window.infinity_zoom_II.config) window.infinity_zoom_II.config = {};
  },
}).assert_all_namespaces();

// Config module for Infinity Zoom II
window.infinity_zoom_II.config = {
  // Minimum rendered layer size in pixels
  minimum_render_size: 3,
  // Edge feathering for all but first layer (fraction of edge).
  feather_value: 0.1,
  // Minimum feather width for edge alpha ramp in pixels.
  feather_min_px: 2,
  // Initial rotation angle in radians.
  start_rotation_angle: 0,
  // Global rotation speed in radians per second. Positive values rotate clockwise.
  rotation_speed: 0,
  // Exponential zoom rate (growth constant per second, default from V1).
  zoom_speed: 3, //TRIALS originally: 1.2;
  // Controls whether dynamic feathering is active (set externally before engine loads)
};

// Exposed flag for triggering final reveal from  ALWAYS FALSE UNTIL SET EXTERNALLY.
window.infinity_zoom_II.FLAG_initiate_final_reveal = false;

// Main engine object (will be attached to window.infinity_zoom_II)
const engine = {
  /**
   * Create and initialize the engine, handling feathered or non-feathered image loading.
   * If feather_size is provided (not undefined), feathering is used; otherwise, the image loading is non-feathered.
   * @param {Array} layer_data - Array of layer objects.
   * @param {string} image_path - Path to image folder.
   * @param {HTMLCanvasElement} canvas - The canvas element.
   * @param {number} [feather_size] - Feather size (optional). If provided, feathering is used.
   */
  create(layer_data, image_path, canvas, feather_size) {
    if (typeof feather_size !== "undefined") {
      window.infinity_zoom_II.feather_preloader.preload_and_feather_images(layer_data, image_path, feather_size);
      window.infinity_zoom_II.feather_preloader.on_feathered_images_ready((feathered_images) => {
        this.init(layer_data, feathered_images, canvas);
      });
    } else {
      window.infinity_zoom_II.preloader.preload_images(layer_data, image_path);
      window.infinity_zoom_II.preloader.on_images_loaded((images) => {
        this.init(layer_data, images, canvas);
      });
    }
  },
  // State
  gl: null,
  canvas: null,
  layers: [],
  start_time: 0,
  animation_phase: "intro",
  rotation: 0,
  rotation_speed: window.infinity_zoom_II.config.rotation_speed,
  zoom_speed: window.infinity_zoom_II.config.zoom_speed,

  // Tracks the highest index of a layer that has covered the viewport so far
  covering_layer_index: -1,

  // Internal: Initialize engine with preloaded images and canvas. Do not call directly; use create().
  init(layer_data, images, canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl", { alpha: false });
    // Attach resize event handler after engine is initialized
    window.addEventListener("resize", () => {
      window.infinity_zoom_II.utils.render.resize_canvas_to_display_size(this.canvas, this.gl);
    });
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
    this.rotation = window.infinity_zoom_II.config.start_rotation_angle;
    // Initialize last animate time for frame delta
    this._last_animate_time = this.start_time;
    window.infinity_zoom_II.utils.render.resize_canvas_to_display_size(this.canvas, this.gl);

    // --- WebGL setup ---
    const gl = this.gl;
    // Vertex and fragment shader sources
    const vs_source = `
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

    // Fragment shader source
    const fs_source = `
      precision mediump float;
      varying vec2 v_texcoord;
      uniform sampler2D u_image;
      uniform float u_alpha;
      void main() {
        vec4 color = texture2D(u_image, v_texcoord);
        gl_FragColor = vec4(color.rgb, color.a * u_alpha);
      }
    `;
    // Use utils for shader/program/buffer setup
    const program = window.infinity_zoom_II.utils.render.create_program(gl, vs_source, fs_source);
    this.program = program;
    this.preload_all_layers_to_gpu();
    this.buffer = window.infinity_zoom_II.utils.render.create_quad_buffer(gl);
    this.a_position = gl.getAttribLocation(program, "a_position");
    this.a_texcoord = gl.getAttribLocation(program, "a_texcoord");
    this.u_matrix = gl.getUniformLocation(program, "u_matrix");
    this.u_image = gl.getUniformLocation(program, "u_image");
    this.u_alpha = gl.getUniformLocation(program, "u_alpha");

    requestAnimationFrame(this.animate.bind(this));
  },

  // Main animation loop
  animate(now) {
    // Track animation phase changes for debugging
    if (this._last_animation_phase !== this.animation_phase) {
      log("Animation phase changed to: " + this.animation_phase);
      this._last_animation_phase = this.animation_phase;
    }
    // Step 3.1b/3.1c: Animate first layer zoom-in, then fade-in additional layers
    // Frame-rate-independent delta time
    const delta = (now - this._last_animate_time) / 1000;
    this._last_animate_time = now;
    const elapsed = (now - this.start_time) / 1000;
    if (this.animation_phase === "intro") {
      // Advance rotation in all phases
      this.rotation += this.rotation_speed * delta;
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
        requestAnimationFrame(this.animate.bind(this));
      } else if (elapsed < zoom_duration + fade_duration) {
        // Fade-in additional layers: keep correct relative scale (relative to first layer)
        this.layers[0].scale = 1;
        for (let i = 1; i < this.layers.length; ++i) {
          const layer = this.layers[i];
          layer.scale = this.get_layer_scale(i, 1);
        }
        const fade_t = (elapsed - zoom_duration) / fade_duration;

        // Returns array of visible layers whose scaled size is above the minimum render size
        const min_dim = Math.min(this.canvas.width, this.canvas.height);
        const visible_layers = this.layers.filter((layer) => layer.scale * min_dim >= window.infinity_zoom_II.config.minimum_render_size);

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
          if (draw_size >= window.infinity_zoom_II.config.minimum_render_size) {
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
      this.rotation += this.rotation_speed * delta;
      if (elapsed_hold < hold_duration) {
        requestAnimationFrame(this.animate.bind(this));
      } else {
        // Transition to main zoom phase
        this.animation_phase = "main_zoom";
        this.main_zoom_start_time = now;
        this.first_layer_scale_at_main_zoom = 1;
        this._debug_logged_approaching = false; // Reset debug flag
        requestAnimationFrame(this.animate.bind(this));
      }
    } else if (this.animation_phase === "main_zoom") {
      // Main zoom phase: exponential zoom and rotation until last layer covers viewport
      const elapsed_main_zoom = (now - this.main_zoom_start_time) / 1000;
      // Advance rotation
      this.rotation += this.rotation_speed * delta;

      // Exponential zoom: s(t) = s0 * exp(k * t)
      const k = this.zoom_speed;
      const s0 = this.first_layer_scale_at_main_zoom;
      const first_layer_scale = s0 * Math.exp(k * elapsed_main_zoom);

      // Check if the final layer WOULD cover the viewport with this new scale
      // before actually applying it to prevent over-zooming
      const final_layer_index = this.layers.length - 1;
      const final_layer_scale = this.get_layer_scale(final_layer_index, first_layer_scale);

      // For square images in any viewport, calculate the minimum scale needed to cover
      // Use the actual canvas buffer dimensions to ensure perfect consistency
      const display_canvas = { width: this.canvas.width, height: this.canvas.height };

      // DEBUG: Disabled scale calculation logging - we only care about final render state
      // log_canvas_usage("scale_calculation", "this.canvas", this.canvas);
      // log_canvas_comparison("SCALE_CALC", this.canvas);

      const aspect_matrix = window.infinity_zoom_II.utils.math.make_matrix(this.layers[final_layer_index].image, display_canvas);
      const sx = aspect_matrix[0];
      const sy = aspect_matrix[4];

      // Calculate the composed transformation matrix for this scale
      const scale_mat = [final_layer_scale, 0, 0, 0, final_layer_scale, 0, 0, 0, 1];
      const composed_mat = window.infinity_zoom_II.utils.math.mat3_mul(scale_mat, aspect_matrix);

      // Check if the quad corners (±1,±1) transform to fill at least the viewport bounds (±1,±1)
      // The quad corner (1,1) should transform to at least (1,1) in clip space for full coverage
      const corner_x = composed_mat[0] * 1 + composed_mat[3] * 1 + composed_mat[6]; // Transform (1,1)
      const corner_y = composed_mat[1] * 1 + composed_mat[4] * 1 + composed_mat[7];

      // For full coverage, both corners should reach or exceed ±1
      const covers_viewport = Math.abs(corner_x) >= 1.0 && Math.abs(corner_y) >= 1.0;

      // Add small tolerance for floating-point precision (equivalent to ~1 pixel at display size)
      const tolerance = 1.0 / Math.max(display_canvas.width, display_canvas.height);

      if (covers_viewport && Math.abs(corner_x) >= 1.0 + tolerance && Math.abs(corner_y) >= 1.0 + tolerance) {
        // Final layer would cover viewport: stop zoom at current scale, continue rotation
        this.last_layer_cover_time = now;
        this.rotation_at_cover = this.rotation;
        this.animation_phase = "final_rotation";

        requestAnimationFrame(this.animate.bind(this));
      } else {
        // Apply the new scale and continue zooming
        this.layers[0].scale = first_layer_scale;
        for (let i = 1; i < this.layers.length; ++i) {
          const layer = this.layers[i];
          layer.scale = this.get_layer_scale(i, first_layer_scale);
          layer.alpha = 1;
        }

        // Update covering layer index for logging purposes
        this.update_covering_layer_index();
        requestAnimationFrame(this.animate.bind(this));
      }
    } else if (this.animation_phase === "final_rotation") {
      // Keep rotating until FLAG_initiate_final_reveal is set from outside (e.g., browser
      this.rotation += this.rotation_speed * delta;
      if (!window.infinity_zoom_II.FLAG_initiate_final_reveal) {
        requestAnimationFrame(this.animate.bind(this));
      } else {
        log("rotation: " + this.rotation);
        // Start region zoom animation as the final phase
        this.animation_phase = "region_zoom";
        log("Final reveal triggered. Starting region zoom animation.");
        // Use the last and penultimate layers for region zoom
        const last_index = this.layers.length - 1;
        const penultimate_index = this.layers.length - 2;
        const final_layer = this.layers[last_index];
        log("Final layer scale: " + final_layer.scale);
        const previous_layer = this.layers[penultimate_index];
        // prettier-ignore
        window.infinity_zoom_II.texture_region_zoom.start_texture_region_zoom(
         this.gl,
         this.canvas,
         final_layer,
         previous_layer,
         this.rotation,
         () => {
          this.animation_phase = "really_done";
          log("Region zoom animation complete.");
          requestAnimationFrame(this.animate.bind(this));
        });
        // Do not call render here; region_zoom handles its own animation
      }
    } else if (this.animation_phase === "region_zoom") {
      // Region zoom animation is handled by the region_zoom module
      // Optionally, could call a static draw if needed
      // No-op: region_zoom handles animation and drawing
    } else if (this.animation_phase === "really_done") {
      // Reset debug flags to allow final state logging
      if (!window._final_debug_reset) {
        window._matrix_debug_logged = false;
        window._canvas_comparison_logged = false;
        window._matrix_comparison_logged = false;
        window._canvas_usage_logged = false;
        window._final_debug_reset = true;
      }
      log("Final state reached - ENGINE should show final matrix in render loop");
    }
    // Only call render if not in region_zoom phase (region_zoom handles its own drawing)
    if (this.animation_phase !== "region_zoom") {
      this.render();
    }
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
        const aspect = window.infinity_zoom_II.utils.math.make_matrix(layer.image, this.canvas);
        const s = layer.scale;

        // CRITICAL FIX: For covering behavior, only apply aspect correction, not animated scale
        // The aspect matrix should always use scale=1.0 for proper covering
        const covering_scale = 1.0; // Always use 1.0 for aspect correction
        const scale_mat = [covering_scale, 0, 0, 0, covering_scale, 0, 0, 0, 1];
        const rot = window.infinity_zoom_II.utils.math.make_rotation_matrix(this.rotation);

        // Compose: rot * scale * aspect
        let mat = window.infinity_zoom_II.utils.math.mat3_mul(rot, window.infinity_zoom_II.utils.math.mat3_mul(scale_mat, aspect));

        // DEBUG: Manual trigger - press SPACE to log current matrix when you see borders
        if (i === 0) {
          window._current_engine_matrix = mat;
          window._current_engine_canvas = this.canvas;
          window._current_engine_phase = this.animation_phase;
        }

        gl.uniformMatrix3fv(this.u_matrix, false, mat);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, layer.texture);
        gl.uniform1i(this.u_image, 0);
        gl.uniform1f(this.u_alpha, typeof layer.alpha === "number" ? layer.alpha : 1.0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    }
  },

  // Compute the scale for a given layer index and first layer scale
  get_layer_scale(layer_index, first_layer_scale) {
    let scale = first_layer_scale;
    for (let i = 1; i <= layer_index; ++i) {
      scale *= this.layers[i].zoom / 100;
    }
    return scale;
  },

  // Preload all layer images to the GPU (warm-up phase)
  preload_all_layers_to_gpu() {
    if (this.FLAG_images_loaded_to_GPU) {
      throw new Error("preload_all_layers_to_gpu was already called");
    }
    this.FLAG_images_loaded_to_GPU = true;
    for (let i = 0; i < this.layers.length; ++i) {
      const layer = this.layers[i];
      if (!layer.texture) {
        window.infinity_zoom_II.utils.render.upload_texture(this.gl, layer);
      }
    }
    log("Preloaded all layers to GPU");
  },

  // Updates the covering_layer_index, only increasing as we zoom in
  update_covering_layer_index() {
    const min_dim = Math.min(this.canvas.width, this.canvas.height);
    const max_dim = Math.max(this.canvas.width, this.canvas.height);
    // Start from the last known covering index + 1
    for (let i = this.covering_layer_index + 1; i < this.layers.length; ++i) {
      const layer = this.layers[i];
      const draw_size = layer.scale * min_dim;
      if (draw_size >= max_dim) {
        // Found a new covering layer
        this.covering_layer_index = i;
        log("New covering layer index: " + this.covering_layer_index);
      }
    }
  },
};

window.infinity_zoom_II.engine = engine;

/**
 * LAYER OBJECT STRUCTURE (Infinity Zoom II Engine)
 *
 * Each element in the 'layers' array represents a single image layer in the zoom stack.
 *
 * Properties:
 *   image   – The image data for the layer (e.g., HTMLImageElement or similar).
 *   zoom    – The zoom factor for this layer (number, typically percentage or scale multiplier).
 *   texture – The WebGL texture object associated with the image (used for GPU rendering).
 *   alpha   – The opacity value for rendering this layer (number, 0.0–1.0).
 *   scale   – The current scale factor applied to this layer for rendering (number).
 *   loaded  – Boolean indicating if the image/texture is loaded and ready for rendering.
 *
 * This structure allows the engine and region zoom modules to:
 *   - Access both the image and its GPU texture for rendering.
 *   - Track per-layer rendering state (opacity, scale, loaded status).
 *   - Pass multiple layers (e.g., last and penultimate) to region zoom for seamless feathered transitions.
 *
 * Example:
 *   {
 *     image:   <HTMLImageElement>,
 *     zoom:    95,
 *     texture: <WebGLTexture>,
 *     alpha:   1.0,
 *     scale:   0.5,
 *     loaded:  true
 *   }
 */

// Add keyboard listener for manual debug trigger
document.addEventListener("keydown", function (e) {
  if (e.code === "Space" && window._current_engine_matrix) {
    e.preventDefault();
    const mat = window._current_engine_matrix;
    const canvas = window._current_engine_canvas;
    const phase = window._current_engine_phase;
    log(
      "MANUAL ENGINE DEBUG",
      "Phase: " + phase + " Matrix: [" + mat[0].toFixed(6) + ", " + mat[4].toFixed(6) + "] Canvas: " + canvas.width + "x" + canvas.height
    );
  }
});
