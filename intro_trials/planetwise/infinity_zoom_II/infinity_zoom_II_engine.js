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
    console.log("Engine create called with:", { layer_data, image_path, canvas, feather_size });
    // TODO: Implement image loading and initialization
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
    console.log("Engine init called");
    this.canvas = canvas;

    // Store layers with basic structure
    this.layers = layer_data.map((layer, i) => ({
      image: images[i] || null,
      zoom: layer.zoom,
      alpha: 1.0,
      trs: { center_x: 0, center_y: 0, scale: 1.0, rotation: 0 },
      loaded: false,
    }));

    this.start_time = performance.now();
    this.animation_phase = "intro";
    this.global_rotation = window.infinity_zoom_II.config.start_rotation_angle;
    this._last_animate_time = this.start_time;

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

    //state machine here, i guess
  },

  // Render all visible layers
  render() {
    //tbd
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
