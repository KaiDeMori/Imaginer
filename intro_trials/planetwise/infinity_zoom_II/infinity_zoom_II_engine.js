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
  zoom_speed: 1, //TRIALS originally: 1.2;
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

    // Animate first layer zoom-in, then fade-in additional layers
    // Frame-rate-independent delta time
    const delta = (now - this._last_animate_time) / 1000;
    this._last_animate_time = now;
    const elapsed = (now - this.start_time) / 1000;
    if (this.animation_phase === "intro") {
      // 1st Layer (planet) exponential zoom from tiny to fitting size
      this.rotation += this.rotation_speed * delta;
      const zoom_duration = 1.5; // Duration of zoom-in phase in seconds

      if (elapsed < zoom_duration) {
        // Exponential growth from 1px to scale 1
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
      } else {
        // Transition to fade-in phase
        this.animation_phase = "intro_visible_layers_fade_in";
        this.fade_in_start_time = now;
        requestAnimationFrame(this.animate.bind(this));
      }
    } else if (this.animation_phase === "intro_visible_layers_fade_in") {
      // Additional layers fade in with correct relative scaling
      this.rotation += this.rotation_speed * delta;
      const fade_duration = 1;
      const elapsed_fade = (now - this.fade_in_start_time) / 1000;

      if (elapsed_fade < fade_duration) {
        // Planet at scale 1, others scaled relative to it
        this.layers[0].scale = 1; // Planet will get fitting compensation in render

        for (let i = 1; i < this.layers.length; ++i) {
          const layer = this.layers[i];
          // Calculate scale using cumulative zoom factors from planet
          layer.scale = this.get_layer_scale(i, 1);
        }
        const fade_t = elapsed_fade / fade_duration;

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
        // Transition to hold phase
        this.animation_phase = "hold";
        this.hold_start_time = now;
        requestAnimationFrame(this.animate.bind(this));
      }
    } else if (this.animation_phase === "hold") {
      // Hold all scales, only rotation continues
      const hold_duration = 0.5;
      const elapsed_hold = (now - this.hold_start_time) / 1000;
      this.rotation += this.rotation_speed * delta;

      if (elapsed_hold < hold_duration) {
        // Ensure all visible layers are properly set up for hold phase
        const min_dim = Math.min(this.canvas.width, this.canvas.height);
        this.layers[0].scale = 1; // Planet will get fitting compensation in render

        for (let i = 1; i < this.layers.length; ++i) {
          const layer = this.layers[i];
          // Calculate scale using cumulative zoom factors from planet
          layer.scale = this.get_layer_scale(i, 1);
          const draw_size = layer.scale * min_dim;
          if (draw_size >= window.infinity_zoom_II.config.minimum_render_size) {
            layer.alpha = 1;
          } else {
            layer.alpha = 0;
          }
        }
        requestAnimationFrame(this.animate.bind(this));
      } else {
        // Transition to main zoom phase
        this.animation_phase = "main_zoom";
        this.main_zoom_start_time = now;
        // Start main zoom from planet scale 1.0 with fitting compensation applied in render
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

      // Check if final layer reaches covering scale
      const final_layer_index = this.layers.length - 1;
      const final_layer_scale = this.get_layer_scale(final_layer_index, first_layer_scale);
      const final_layer = this.layers[final_layer_index];
      const covering_ratio = this.calculate_covering_ratio(final_layer);

      if (final_layer_scale >= covering_ratio) {
        // Final layer reaches covering behavior: stop zoom, start rotation
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
        // SINGLE MATRIX APPROACH: Always use fitting matrix
        const aspect_matrix = window.infinity_zoom_II.utils.math.make_fitting_matrix(layer.image, this.canvas);

        // CRITICAL FIX: For final layer in final_rotation, use covering scale, not animation scale
        let render_scale;
        if (i === this.layers.length - 1 && this.animation_phase === "final_rotation") {
          // Final layer covering: use covering ratio instead of accumulated animation scale
          render_scale = this.calculate_covering_ratio(layer);
        } else {
          // All other cases: use animation scale
          render_scale = layer.scale;
        }

        const scale_mat = [render_scale, 0, 0, 0, render_scale, 0, 0, 0, 1];
        const rot_mat = window.infinity_zoom_II.utils.math.make_rotation_matrix(this.rotation);

        // Transform pipeline: Rotation × Scale × FittingMatrix
        const final_matrix = window.infinity_zoom_II.utils.math.mat3_mul(rot_mat, window.infinity_zoom_II.utils.math.mat3_mul(scale_mat, aspect_matrix));

        gl.uniformMatrix3fv(this.u_matrix, false, final_matrix);
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

  // Calculate covering ratio for a layer (from our trial)
  calculate_covering_ratio(layer) {
    const img_aspect = layer.image.width / layer.image.height;
    const canvas_aspect = this.canvas.width / this.canvas.height;
    return canvas_aspect > img_aspect ? canvas_aspect / img_aspect : img_aspect / canvas_aspect;
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
