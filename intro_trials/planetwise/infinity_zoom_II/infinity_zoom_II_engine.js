// Infinity Zoom II Engine - Skeleton

// Constants
const FITTING_SCALE = 1.0; // Scale when image fits viewport perfectly

// Exposed flag for triggering final reveal from  ALWAYS FALSE UNTIL SET EXTERNALLY.
window.infinity_zoom_II.FLAG_initiate_final_reveal = false;

// Main engine object (will be attached to window.infinity_zoom_II)
const engine = {
  /**
   * Create and initialize the engine.
   * @param {Object} config - Configuration object containing layer data and image paths.
   * @param {HTMLCanvasElement} canvas - The canvas element.
   */
  create(canvas) {
    log("Engine create called.");

    // Cache config object to reduce property access
    const config = window.infinity_zoom_II.config;

    // Store important configuration values locally
    this.canvas = canvas;
    this.rotation_speed = config.rotation_speed;
    this.target_zoom_speed = config.target_zoom_speed;
    this.zoom_speed_ramp_duration = config.zoom_speed_ramp_duration;
    this.start_rotation_angle = config.start_rotation_angle;
    this.intro_planet_zoom_duration = config.intro_planet_zoom_duration;
    this.visible_layers_fade_duration = config.visible_layers_fade_duration;
    this.pre_main_zoom_hold_duration = config.pre_main_zoom_hold_duration;
    this.minimum_render_size = config.minimum_render_size;

    // Pre-calculate ramp integration factor for smooth zoom start
    this.ramp_integration_factor = this.target_zoom_speed / (2 * this.zoom_speed_ramp_duration);

    window.infinity_zoom_II.preloader.load_all_images((processed_images) => {
      log("All images loaded and processed, initializing engine");
      this.init(processed_images);
    });
  },

  gl_context: null,
  canvas: null,
  layers: [],
  start_time: 0,
  animation_phase: "intro",
  global_rotation: 0,
  utils: null,
  first_visible_layer_index: 0,
  deepest_visible_layer_index: 0,
  paused: false,

  // Initialize engine with preloaded images and canvas
  init(images) {
    log("Engine init called");

    const layer_data = window.infinity_zoom_II.config.LAYERS_DATA;
    const canvas = this.canvas;

    // Set canvas buffer size to match exact viewport dimensions
    this.resize_canvas();

    // Add resize handler to keep canvas and viewport synchronized
    window.addEventListener("resize", () => {
      this.resize_canvas();
    });

    // Cache utils reference once
    this.utils = window.infinity_zoom_II.utils;

    // Initialize WebGL
    this.gl_context = this.utils.init_webgl(canvas);

    // Create shader program
    this.program = this.utils.create_program(this.gl_context, this.utils.get_vertex_shader_source(), this.utils.get_fragment_shader_source());

    // Cache WebGL uniform and attribute locations for performance
    this.shader_locations = {
      position: this.gl_context.getAttribLocation(this.program, "a_position"),
      texcoord: this.gl_context.getAttribLocation(this.program, "a_texcoord"),
      transform: this.gl_context.getUniformLocation(this.program, "u_transform"),
      alpha: this.gl_context.getUniformLocation(this.program, "u_alpha"),
      texture: this.gl_context.getUniformLocation(this.program, "u_texture"),
    };

    // Create quad buffer for rendering
    this.quad_buffer = this.utils.create_quad_buffer(this.gl_context);

    // Store layers with basic structure and create textures
    this.layers = layer_data.map((layer, i) => {
      // Calculate initial relative scale for each layer
      const relative_scale = this.utils.calc_layer_relative_scale(layer_data, i);
      const initial_scale = relative_scale * (1.0 / Math.min(canvas.width, canvas.height)); // Start tiny

      return {
        image: images[i],
        zoom: layer.zoom,
        alpha: i === 0 ? 1.0 : 0.0, // Only the first layer starts visible
        trs: this.utils.create_TRS(0, 0, initial_scale, 0),
        texture: this.utils.create_texture(this.gl_context, images[i]),
        loaded: true,
      };
    });

    // Cache canvas dimensions and derived values for performance
    this.update_cached_canvas_values();

    // Cache final layer index for performance
    this.final_layer_index = this.layers.length - 1;

    // Pre-calculate layer relative scales for performance (eliminates nested loops per frame)
    this.layer_relative_scales = this.layers.map((_, index) => {
      return this.utils.calc_layer_relative_scale(this.layers, index);
    });

    // Pre-calculate intro growth rate (expensive Math.log operation)
    const tiny_start_scale = 1.0 / this.min_canvas_dimension;
    this.intro_growth_rate = Math.log(FITTING_SCALE / tiny_start_scale) / this.intro_planet_zoom_duration;

    this.start_time = performance.now();
    this.animation_phase = "intro";
    this.global_rotation = this.start_rotation_angle;
    this._last_animate_time = this.start_time;

    // Centralized GPU resource pre-loading
    this.preload_all_gpu_resources();

    // Initialize mystery image modules with pre-loaded resources
    window.infinity_zoom_II.mystery_image_main_zoom.init(this);

    // Reset mystery image swap system for new main zoom sequence
    window.infinity_zoom_II.mystery_image_main_zoom.reset_swap_system();

    log("Engine initialized with " + this.layers.length + " layers");

    // Start animation loop
    requestAnimationFrame(this.animate.bind(this));
  },

  // Centralized GPU resource pre-loading to avoid stuttering
  preload_all_gpu_resources() {
    const gl = this.gl_context;

    // 1. Pre-load main zoom mystery image textures and data
    this.main_zoom_mystery_images = window.infinity_zoom_II.MAIN_DISPLAY_IMAGES.map((mystery_image, i) => {
      return {
        image: mystery_image,
        texture: window.infinity_zoom_II.utils.create_texture(gl, mystery_image),
        loaded: true,
      };
    });

    // 2. Pre-load region zoom mystery image textures and data
    this.region_zoom_mystery_images = window.infinity_zoom_II.REGION_DISPLAY_IMAGES.map((mystery_image, i) => {
      return {
        image: mystery_image,
        texture: window.infinity_zoom_II.utils.create_texture(gl, mystery_image),
        loaded: true,
      };
    });

    // 3. Pre-create region zoom shader program and all resources
    const region_program = window.infinity_zoom_II.region_zoom_utils.create_region_shader_program(gl);

    this.region_zoom_resources = {
      program: region_program,
      quad_buffers: {
        // Main layer quad buffers (created on-demand as layers become visible)
        layers: new Map(),
        // Mystery image quad buffers (all pre-created to avoid jitter)
        mystery_images: this.region_zoom_mystery_images.map((mystery_data) =>
          window.infinity_zoom_II.region_zoom_utils.create_image_pixel_quad_buffer(gl, mystery_data.image.width, mystery_data.image.height)
        ),
      },
      uniform_locations: {
        matrix: gl.getUniformLocation(region_program, "u_matrix"),
        texture: gl.getUniformLocation(region_program, "u_texture"),
      },
    };
  },

  // Set canvas buffer size to exactly match viewport
  resize_canvas() {
    const canvas = this.canvas;

    // Use window viewport dimensions for exact pixel matching
    const viewport_width = window.innerWidth;
    const viewport_height = window.innerHeight;

    // Set canvas buffer dimensions to match viewport exactly
    canvas.width = viewport_width;
    canvas.height = viewport_height;

    // Update WebGL viewport if context exists
    if (this.gl_context) {
      this.gl_context.viewport(0, 0, viewport_width, viewport_height);
    }

    // Update cached canvas values for performance
    this.update_cached_canvas_values();

    log(`Canvas resized to: ${viewport_width}x${viewport_height}`);
  },

  // Update cached canvas values (called on resize and init)
  update_cached_canvas_values() {
    this.canvas_width = this.canvas.width;
    this.canvas_height = this.canvas.height;
    this.min_canvas_dimension = Math.min(this.canvas_width, this.canvas_height);
  },

  // Main animation loop
  animate(now) {
    // Check if paused - if so, stop the animation loop
    if (this.paused) {
      return;
    }

    // Track animation phase changes for debugging
    if (this._last_animation_phase !== this.animation_phase) {
      log("Animation phase changed to: " + this.animation_phase);
      this._last_animation_phase = this.animation_phase;
    }

    // Calculate elapsed time since start
    const elapsed_seconds = (now - this.start_time) / 1000;

    // Update global rotation (simple)
    this.global_rotation = this.start_rotation_angle + this.rotation_speed * elapsed_seconds;

    // Update global rotation using frame-to-frame delta time for perfect continuity
    //  const old_rotation = this.global_rotation;
    //  const frame_delta_time = (now - this._last_animate_time) / 1000;
    //  this.global_rotation += this.rotation_speed * frame_delta_time;
    //  const delta_rotation = this.global_rotation - old_rotation;
    //  this._last_animate_time = now;
    //  log(`Global rotation updated: ${this.global_rotation.toFixed(3)} (delta: ${delta_rotation.toFixed(4)})`);

    // State machine (pass `now` to all state functions)
    if (this.animation_phase === "intro") {
      this.update_intro_state(now);
    } else if (this.animation_phase === "intro_visible_layers_fade_in") {
      this.update_intro_visible_layers_fade_in_state(now);
    } else if (this.animation_phase === "hold") {
      this.update_hold_state(now);
    } else if (this.animation_phase === "main_zoom") {
      this.update_main_zoom_state(now);
    } else if (this.animation_phase === "final_rotation") {
      this.update_final_rotation_state(now);
    } else if (this.animation_phase === "region_zoom") {
      // Use separate region zoom renderer - NO TRS system involvement
      const region_complete = window.infinity_zoom_II.region_zoom.update_region_zoom_state(now);
      if (region_complete) {
        this.animation_phase = "region_zoom_hold";
        log("Region zoom complete - holding final zoomed frame");
      }
    } else if (this.animation_phase === "region_zoom_hold") {
      // Hold the final zoomed region frame
      window.infinity_zoom_II.region_zoom.render_final_frame();
    } else if (this.animation_phase === "FIN") {
      //noop
    }

    // Update occlusion culling optimization (skip during region zoom)
    if (this.animation_phase !== "region_zoom" && this.animation_phase !== "region_zoom_hold") {
      this.update_first_visible_layer_index();
    }

    // Render the scene (skip during region zoom - it handles its own rendering)
    if (this.animation_phase !== "region_zoom" && this.animation_phase !== "region_zoom_hold") {
      this.render();
    }

    // Continue animation loop only if not paused
    if (!this.paused) {
      requestAnimationFrame(this.animate.bind(this));
    }
  },

  // State: "intro" - the first layer grows from tiny to fitting size
  update_intro_state(now) {
    const elapsed_seconds = (now - this.start_time) / 1000;
    // Use cached canvas dimensions and pre-calculated growth rate
    const tiny_start_scale = 1.0 / this.min_canvas_dimension;

    // Exponential growth over intro duration using cached growth rate
    const growth_progress = Math.min(elapsed_seconds / this.intro_planet_zoom_duration, 1.0);
    const raw_scale = this.utils.apply_exponential_growth(tiny_start_scale, this.intro_growth_rate, elapsed_seconds);
    const current_scale = Math.min(raw_scale, FITTING_SCALE); // Cap at fitting scale

    // Update all layer TRS (the first layer gets current_scale, others get relative scales)
    this.utils.update_all_layer_TRS(this.layers, current_scale, this.global_rotation, this.layer_relative_scales);

    // Check transition condition: the first layer reaches fitting scale
    if (growth_progress >= 1.0) {
      this.animation_phase = "intro_visible_layers_fade_in";
      this.fade_start_time = now; // Track fade timing
    }
  },

  // State: "intro_visible_layers_fade_in" - Fade in layers that are big enough to be visible
  update_intro_visible_layers_fade_in_state(now) {
    // Keep the first layer at fitting size (no further scaling)
    // Update all layer TRS (the first layer stays at fitting, others get relative scales)
    this.utils.update_all_layer_TRS(this.layers, FITTING_SCALE, this.global_rotation, this.layer_relative_scales);

    // Calculate fade progress since fade started
    const fade_elapsed = (now - this.fade_start_time) / 1000;
    const fade_progress = Math.min(fade_elapsed / this.visible_layers_fade_duration, 1.0);

    // Update layer visibility and alphas using unified system
    this.update_layer_visibility(now);
    this.update_layer_alphas(now);

    // Check transition condition: fade completed
    if (fade_progress >= 1.0) {
      this.animation_phase = "hold";
      this.hold_start_time = now; // Track hold timing
    }
  },

  // State: "hold" - All visible layers hold their sizes, only rotation continues
  update_hold_state(now) {
    // Keep the first layer at fitting size
    // Update all layer TRS (maintain current scales and relationships)
    this.utils.update_all_layer_TRS(this.layers, FITTING_SCALE, this.global_rotation, this.layer_relative_scales);

    // Update layer visibility and alphas using unified system
    this.update_layer_visibility(now);
    this.update_layer_alphas(now);

    // Calculate hold duration
    const hold_elapsed = (now - this.hold_start_time) / 1000;

    // Check transition condition: hold duration completed
    if (hold_elapsed >= this.pre_main_zoom_hold_duration) {
      this.animation_phase = "main_zoom";
      this.main_zoom_start_time = now; // Track main zoom timing
    }
  },

  // State: "main_zoom" - All layers scale together until Final Layer reaches covering
  update_main_zoom_state(now) {
    // Calculate time since main zoom started
    const main_zoom_elapsed = (now - this.main_zoom_start_time) / 1000;

    // Calculate covering scale for stop condition using cached values
    const covering_scale = this.utils.calc_covering_scale(this.canvas_width, this.canvas_height, 1);

    // Calculate integrated zoom amount for smooth ramping using pre-calculated factor
    let integrated_zoom_amount;
    if (main_zoom_elapsed < this.zoom_speed_ramp_duration) {
      // During ramp: use pre-calculated integration factor
      integrated_zoom_amount = this.ramp_integration_factor * (main_zoom_elapsed * main_zoom_elapsed);
    } else {
      // After ramp: ramp integral + constant speed integral
      // Ramp contribution: target_zoom_speed * ramp_duration / 2
      // Constant contribution: target_zoom_speed * (elapsed - ramp_duration)
      const ramp_contribution = (this.target_zoom_speed * this.zoom_speed_ramp_duration) / 2;
      const constant_contribution = this.target_zoom_speed * (main_zoom_elapsed - this.zoom_speed_ramp_duration);
      integrated_zoom_amount = ramp_contribution + constant_contribution;
    }

    // Apply exponential growth to all layers simultaneously
    const exponential_growth_factor = Math.exp(integrated_zoom_amount);
    let current_base_scale = FITTING_SCALE * exponential_growth_factor;

    // Clamp to prevent overshoot: if final layer would exceed covering, stop exactly at covering
    const final_layer_relative_scale = this.utils.calc_layer_relative_scale(this.layers, this.final_layer_index);
    const final_layer_target_scale = current_base_scale * final_layer_relative_scale;

    if (final_layer_target_scale > covering_scale) {
      // Calculate exact base scale that makes final layer hit covering scale perfectly
      current_base_scale = covering_scale / final_layer_relative_scale;
      this.animation_phase = "final_rotation";
      this.final_rotation_start_time = now;
    }

    // Update all layer TRS with synchronized scaling
    this.utils.update_all_layer_TRS(this.layers, current_base_scale, this.global_rotation, this.layer_relative_scales);

    // Update layer visibility and alphas using unified system
    this.update_layer_visibility(now);
    this.update_layer_alphas(now);

    // Update mystery image swapping during main zoom
    window.infinity_zoom_II.mystery_image_main_zoom.update_main_zoom_swapping(this);
  },

  // State: "final_rotation" - All layers stop scaling, only rotation continues
  update_final_rotation_state(now) {
    // Maintain current scale relationships (no further scaling) using cached values
    const covering_scale = this.utils.calc_covering_scale(this.canvas_width, this.canvas_height, 1);
    const final_layer_relative_scale = this.utils.calc_layer_relative_scale(this.layers, this.final_layer_index);
    const current_base_scale = covering_scale / final_layer_relative_scale;

    // Update all layer TRS (maintain covering scale, continue rotation)
    this.utils.update_all_layer_TRS(this.layers, current_base_scale, this.global_rotation, this.layer_relative_scales);

    // Update layer visibility and alphas (maintain current state)
    this.update_layer_visibility(now);
    this.update_layer_alphas(now);

    // Continue mystery image swapping during final rotation
    window.infinity_zoom_II.mystery_image_main_zoom.update_main_zoom_swapping(this);

    // Check exit condition: external flag set
    if (window.infinity_zoom_II.FLAG_initiate_final_reveal) {
      log("FLAG_initiate_final_reveal set");
      this.animation_phase = "region_zoom";
      window.infinity_zoom_II.region_zoom.init_region_zoom(this, now);
    }
  },

  // Update layer visibility frontier (O(1) check per frame)
  update_layer_visibility(now) {
    const next_candidate_index = this.deepest_visible_layer_index + 1;

    if (next_candidate_index < this.layers.length) {
      const next_layer = this.layers[next_candidate_index];
      if (this.utils.is_layer_visible(next_layer.trs, this.canvas_width, this.canvas_height, this.minimum_render_size)) {
        this.deepest_visible_layer_index = next_candidate_index;

        // Only fade during intro_visible_layers_fade_in state, pop in immediately during other states
        if (this.animation_phase === "intro_visible_layers_fade_in") {
          next_layer.fade_start_time = now;
        }

        log(`layers[${next_candidate_index}] added`);
      }
    }
  },

  // Update occlusion culling optimization (O(1) check per frame)
  update_first_visible_layer_index() {
    const check_index = this.first_visible_layer_index + 2;

    if (check_index < this.layers.length) {
      const covering_layer = this.layers[check_index];
      const covering_scale = this.utils.calc_covering_scale(this.canvas_width, this.canvas_height, 1);

      if (covering_layer.trs.scale >= covering_scale) {
        const old_index = this.first_visible_layer_index;
        this.first_visible_layer_index++;

        log(`layers[${old_index}] removed`);
      }
    }
  },

  // Update layer alphas based on visibility and fade state
  update_layer_alphas(now) {
    // Set alpha for visible layers (starting from first_visible_layer_index)
    for (let i = this.first_visible_layer_index; i <= this.deepest_visible_layer_index; i++) {
      if (i === 0) {
        this.layers[i].alpha = 1.0;
      } else if (this.layers[i].fade_start_time) {
        const fade_elapsed = (now - this.layers[i].fade_start_time) / 1000;
        const fade_progress = Math.min(fade_elapsed / this.visible_layers_fade_duration, 1.0);
        this.layers[i].alpha = fade_progress;

        if (fade_progress >= 1.0) {
          delete this.layers[i].fade_start_time;
        }
      } else {
        this.layers[i].alpha = 1.0;
      }
    }

    // Set alpha for invisible layers (both before first_visible and after deepest_visible)
    for (let i = 0; i < this.first_visible_layer_index; i++) {
      this.layers[i].alpha = 0.0;
    }
    for (let i = this.deepest_visible_layer_index + 1; i < this.layers.length; i++) {
      this.layers[i].alpha = 0.0;
    }
  },

  // Render all visible layers
  render() {
    const gl = this.gl_context;

    // Clear the screen
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Standard rendering for all states (optimized with occlusion culling)
    for (let i = this.first_visible_layer_index; i <= this.deepest_visible_layer_index; i++) {
      const layer = this.layers[i];
      if (layer.alpha > 0) {
        // Render mystery image before final alien layer
        if (i === this.layers.length - 1) {
          window.infinity_zoom_II.mystery_image_main_zoom.render_mystery_image(gl, this.program, this.quad_buffer, layer, this.canvas, this.shader_locations);
        }
        this.utils.render_layer(gl, this.program, this.quad_buffer, layer, this.canvas, this.shader_locations);
      }
    }
  },

  // Pause the animation (stops the animation loop)
  pause() {
    this.paused = true;
    log("Animation paused");
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
