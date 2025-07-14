// Infinity Zoom II Engine - Skeleton

(window.infinity_zoom_II = {
  assert_all_namespaces: function () {
    if (!window.infinity_zoom_II) window.infinity_zoom_II = {};
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
  // Exponential zoom rate (growth constant per second).
  zoom_speed: 1,

  // Animation phase durations (in seconds)
  intro_planet_zoom_duration: 1, // How long planet takes to grow from tiny to fitting
  visible_layers_fade_duration: 1.0, // How long additional layers take to fade in
  pre_main_zoom_hold_duration: 1, // How long to hold before starting main zoom
};

// Exposed flag for triggering final reveal from  ALWAYS FALSE UNTIL SET EXTERNALLY.
window.infinity_zoom_II.FLAG_initiate_final_reveal = false;

// Main engine object (will be attached to window.infinity_zoom_II)
const engine = {
  /**
   * Create and initialize the engine.
   * @param {Array} layer_data - Array of layer objects.
   * @param {string} image_path - Path to image folder.
   * @param {HTMLCanvasElement} canvas - The canvas element.
   * @param {number} [feather_size] - Feather size (optional).
   */
  create(layer_data, image_path, canvas, feather_size) {
    log("Engine create called with:", { layer_data, image_path, canvas, feather_size });

    // Store canvas reference
    this.canvas = canvas;

    // Start image preloading
    window.infinity_zoom_II.preloader.preload_images(layer_data, image_path);

    // When images are loaded, initialize the engine
    window.infinity_zoom_II.preloader.on_images_loaded((loaded_images) => {
      log("All images loaded, initializing engine");
      this.init(layer_data, loaded_images, canvas);
    });
  },

  gl_context: null,
  canvas: null,
  layers: [],
  start_time: 0,
  animation_phase: "intro",
  global_rotation: 0,
  rotation_speed: window.infinity_zoom_II.config.rotation_speed,
  zoom_speed: window.infinity_zoom_II.config.zoom_speed,
  first_visible_layer_index: 0,

  // Initialize engine with preloaded images and canvas
  init(layer_data, images, canvas) {
    log("Engine init called");
    this.canvas = canvas;

    // Set canvas size to match display size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    // Initialize WebGL
    const utils = window.infinity_zoom_II.utils;
    this.gl_context = utils.init_webgl(canvas);

    // Create shader program
    this.program = utils.create_program(this.gl_context, utils.get_vertex_shader_source(), utils.get_fragment_shader_source());

    // Create quad buffer for rendering
    this.quad_buffer = utils.create_quad_buffer(this.gl_context);

    // Store layers with basic structure and create textures
    this.layers = layer_data.map((layer, i) => {
      // Calculate initial relative scale for each layer
      const relative_scale = utils.calc_layer_relative_scale(layer_data, i);
      const initial_scale = relative_scale * (1.0 / Math.min(canvas.width, canvas.height)); // Start tiny

      return {
        image: images[i],
        zoom: layer.zoom,
        alpha: 1.0,
        trs: utils.create_TRS(0, 0, initial_scale, 0),
        texture: utils.create_texture(this.gl_context, images[i]),
        loaded: true,
      };
    });

    this.start_time = performance.now();
    this.animation_phase = "intro";
    this.global_rotation = window.infinity_zoom_II.config.start_rotation_angle;
    this._last_animate_time = this.start_time;

    log("Engine initialized with " + this.layers.length + " layers");

    // Start animation loop
    requestAnimationFrame(this.animate.bind(this));
  },

  // Main animation loop
  animate(now) {
    // Track animation phase changes for debugging
    if (this._last_animation_phase !== this.animation_phase) {
      log("Animation phase changed to: " + this.animation_phase);
      this._last_animation_phase = this.animation_phase;
    }

    // Calculate elapsed time since start
    const elapsed_seconds = (now - this.start_time) / 1000;

    // Update global rotation
    this.global_rotation = window.infinity_zoom_II.config.start_rotation_angle + window.infinity_zoom_II.config.rotation_speed * elapsed_seconds;

    // State machine
    if (this.animation_phase === "intro") {
      this.update_intro_state(elapsed_seconds);
    } else if (this.animation_phase === "intro_visible_layers_fade_in") {
      this.update_intro_visible_layers_fade_in_state(elapsed_seconds);
    } else if (this.animation_phase === "hold") {
      this.update_hold_state(elapsed_seconds);
    }

    // Render the scene
    this.render();

    // Continue animation loop
    requestAnimationFrame(this.animate.bind(this));
  },

  // State: "intro" - Layer 0 grows from tiny to fitting size
  update_intro_state(elapsed_seconds) {
    const utils = window.infinity_zoom_II.utils;
    const config = window.infinity_zoom_II.config;

    // Use pure viewport-relative scales - no image size dependencies
    const tiny_start_scale = 1.0 / Math.min(this.canvas.width, this.canvas.height); // 1px as viewport ratio
    const fitting_scale = 1.0; // Fitting is always 1.0

    // Exponential growth over intro duration
    const growth_progress = Math.min(elapsed_seconds / config.intro_planet_zoom_duration, 1.0);
    const raw_scale = utils.apply_exponential_growth(
      tiny_start_scale,
      Math.log(fitting_scale / tiny_start_scale) / config.intro_planet_zoom_duration,
      elapsed_seconds
    );
    const current_scale = Math.min(raw_scale, fitting_scale); // Cap at fitting scale

    // Update all layer TRS (Layer 0 gets current_scale, others get relative scales)
    utils.update_all_layer_TRS(this.layers, current_scale, this.global_rotation);

    // Set layer visibility: only Layer 0 visible, others invisible
    this.layers.forEach((layer, index) => {
      layer.alpha = index === 0 ? 1.0 : 0.0;
    });

    // Check transition condition: Layer 0 reaches fitting scale
    if (growth_progress >= 1.0) {
      this.animation_phase = "intro_visible_layers_fade_in";
      this.fade_start_time = performance.now(); // Track fade timing
    }
  },

  // State: "intro_visible_layers_fade_in" - Fade in layers that are big enough to be visible
  update_intro_visible_layers_fade_in_state(elapsed_seconds) {
    const utils = window.infinity_zoom_II.utils;
    const config = window.infinity_zoom_II.config;

    // Keep Layer 0 at fitting size (no further scaling)
    const fitting_scale = 1.0;

    // Update all layer TRS (Layer 0 stays at fitting, others get relative scales)
    utils.update_all_layer_TRS(this.layers, fitting_scale, this.global_rotation);

    // Determine visible layers once when entering this state
    if (!this.visibility_determined) {
      this.determine_visible_layers();
      this.visibility_determined = true;
    }

    // Calculate fade progress since fade started
    const fade_elapsed = (performance.now() - this.fade_start_time) / 1000;
    const fade_progress = Math.min(fade_elapsed / config.visible_layers_fade_duration, 1.0);

    // Set layer visibility using pre-calculated flags (no per-frame visibility checks)
    this.layers.forEach((layer, index) => {
      if (index === 0) {
        // Layer 0 stays fully visible
        layer.alpha = 1.0;
      } else if (layer.should_fade_in) {
        // Fade in from 0 to 1 over the fade duration
        layer.alpha = fade_progress;
      } else {
        // Too small to be visible
        layer.alpha = 0.0;
      }
    });

    // Check transition condition: fade completed
    if (fade_progress >= 1.0) {
      this.animation_phase = "hold";
      this.hold_start_time = performance.now(); // Track hold timing
      this.visibility_determined = false; // Reset for next time
    }
  },

  // State: "hold" - All visible layers hold their sizes, only rotation continues
  update_hold_state(elapsed_seconds) {
    const utils = window.infinity_zoom_II.utils;
    const config = window.infinity_zoom_II.config;

    // Keep Layer 0 at fitting size
    const fitting_scale = 1.0;

    // Update all layer TRS (maintain current scales and relationships)
    utils.update_all_layer_TRS(this.layers, fitting_scale, this.global_rotation);

    // Maintain current visibility (no alpha changes)
    // Layers that faded in stay visible, others stay invisible

    // Calculate hold duration
    const hold_elapsed = (performance.now() - this.hold_start_time) / 1000;

    // Check transition condition: hold duration completed
    if (hold_elapsed >= config.pre_main_zoom_hold_duration) {
      this.animation_phase = "main_zoom";
      this.main_zoom_start_time = performance.now(); // Track main zoom timing
    }
  },

  // Determine which layers should fade in (called once when entering fade state)
  determine_visible_layers() {
    const utils = window.infinity_zoom_II.utils;
    const config = window.infinity_zoom_II.config;

    // Layer 0 is always visible, doesn't need to fade
    this.layers[0].should_fade_in = false;

    // Find the first layer that's too small to be visible (early termination)
    let first_invisible_index = this.layers.length; // Assume all are visible initially

    for (let i = 1; i < this.layers.length; i++) {
      const is_visible = utils.is_layer_visible(this.layers[i].trs, this.canvas.width, this.canvas.height, config.minimum_render_size);

      if (!is_visible) {
        first_invisible_index = i;
        break; // Early termination - all subsequent layers are smaller
      }
    }

    // Set fade flags based on cutoff point
    for (let i = 1; i < first_invisible_index; i++) {
      this.layers[i].should_fade_in = true;
    }
    for (let i = first_invisible_index; i < this.layers.length; i++) {
      this.layers[i].should_fade_in = false;
    }
  },

  // Render all visible layers
  render() {
    const gl = this.gl_context;
    const utils = window.infinity_zoom_II.utils;

    // Clear the screen
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Render each layer
    this.layers.forEach((layer) => {
      if (layer.alpha > 0) {
        utils.render_layer(gl, this.program, this.quad_buffer, layer, this.canvas.width, this.canvas.height);
      }
    });
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
 *   zoom    – The zoom for this layer. A number in percent. For example, 25 would mean this layer is 25% the size of the previous layer.
 *   texture – The WebGL texture object associated with the image (used for GPU rendering).
 *   alpha   – The opacity value for rendering this layer (number, 0.0–1.0).
 *
 * Example:
 *   {
 *     image:   <HTMLImageElement>,
 *     zoom:    95,
 *     texture: <WebGLTexture>,
 *     alpha:   1.0,
 *   }
 */
