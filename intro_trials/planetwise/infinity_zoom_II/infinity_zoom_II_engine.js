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

// Config module for Infinity Zoom II
if (!window.infinity_zoom_II) window.infinity_zoom_II = {};
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

// Exposed flag for triggering final reveal from console. ALWAYS FALSE UNTIL SET EXTERNALLY.
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
        const viewport = { width: this.canvas.width, height: this.canvas.height };
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
        requestAnimationFrame(this.animate.bind(this));
      }
    } else if (this.animation_phase === "main_zoom") {
      // Main zoom phase: exponential zoom and rotation until last layer covers viewport
      const elapsed_main_zoom = (now - this.main_zoom_start_time) / 1000;
      // Advance rotation
      this.rotation += this.rotation_speed * delta;
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

      // Check if last layer covers the viewport (no bars, covers both width and height)
      const last_layer = this.layers[this.layers.length - 1];
      const last_layer_draw_size = last_layer.scale * min_dim;
      if (last_layer_draw_size >= Math.max(this.canvas.width, this.canvas.height)) {
        // Last layer now covers viewport: stop zoom, continue rotation
        this.last_layer_cover_time = now;
        this.rotation_at_cover = this.rotation;
        this.animation_phase = "final_rotation";
        log("Main zoom complete. Continuing rotation.");
        requestAnimationFrame(this.animate.bind(this));
      } else {
        requestAnimationFrame(this.animate.bind(this));
      }
    } else if (this.animation_phase === "final_rotation") {
      // Keep rotating until FLAG_initiate_final_reveal is set from outside (e.g., browser console)
      this.rotation += this.rotation_speed * delta;
      if (!window.infinity_zoom_II.FLAG_initiate_final_reveal) {
        requestAnimationFrame(this.animate.bind(this));
      } else {
        // Start region zoom animation as the final phase
        this.animation_phase = "region_zoom";
        log("Final reveal triggered. Starting region zoom animation.");
        // Prepare region zoom parameters
        const region_zoom = window.infinity_zoom_II.texture_region_zoom;
        const region_config = window.infinity_zoom_II.config.region_zoom;
        // Use the last layer's image for the region zoom
        const last_layer = this.layers[this.layers.length - 1];
        // Log transition values for debugging
        console.log("[ENGINE → REGION ZOOM] Transitioning to region zoom with:", {
          theta: this.rotation,
        });
        // Start the region zoom animation, passing the existing texture and its size
        region_zoom.start_texture_region_zoom({
          gl: this.gl,
          canvas: this.canvas,
          texture: last_layer.texture,
          texture_side: last_layer.image.width,
          config: region_config,
          direction: "in",
          start_transform: { theta: this.rotation },
          on_complete: () => {
            this.animation_phase = "really_done";
            log("Region zoom animation complete.");
            requestAnimationFrame(this.animate.bind(this));
          },
        });
        // Do not call render here; region_zoom handles its own animation
      }
    } else if (this.animation_phase === "region_zoom") {
      // Region zoom animation is handled by the region_zoom module
      // Optionally, could call a static draw if needed
      // No-op: region_zoom handles animation and drawing
    } else if (this.animation_phase === "really_done") {
      log("Final state reached.");
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
        const scale_mat = [s, 0, 0, 0, s, 0, 0, 0, 1];
        const rot = window.infinity_zoom_II.utils.math.make_rotation_matrix(this.rotation);
        // Compose: rot * scale * aspect
        let mat = window.infinity_zoom_II.utils.math.mat3_mul(rot, window.infinity_zoom_II.utils.math.mat3_mul(scale_mat, aspect));
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
    return this.layers.filter((layer) => layer.scale * min_dim >= window.infinity_zoom_II.config.minimum_render_size);
  },

  // Compute the scale for a given layer index and first layer scale
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
      if (draw_size >= window.infinity_zoom_II.config.minimum_render_size) {
        // Upload texture if not already uploaded
        if (!this.layers[i].texture) {
          window.infinity_zoom_II.utils.render.upload_texture(this.gl, this.layers[i]);
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
      window.infinity_zoom_II.utils.render.upload_texture(this.gl, layer);
    }
  },

  // Remove the specified layer's texture from the GPU if currently uploaded
  remove_layer_from_gpu(layer_index) {
    const layer = this.layers[layer_index];
    if (layer && layer.texture) {
      window.infinity_zoom_II.utils.render.delete_texture(this.gl, layer);
    }
  },

  // Preload all layer images to the GPU (warm-up phase)
  preload_all_layers_to_gpu() {
    for (let i = 0; i < this.layers.length; ++i) {
      const layer = this.layers[i];
      if (!layer.texture) {
        window.infinity_zoom_II.utils.render.upload_texture(this.gl, layer);
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
    const aspect = window.infinity_zoom_II.utils.math.make_matrix(image, canvas);
    const scale_mat = [scale, 0, 0, 0, scale, 0, 0, 0, 1];
    const rot_mat = window.infinity_zoom_II.utils.math.make_rotation_matrix(rotation);
    // Forward: rot * scale * aspect
    let forward = window.infinity_zoom_II.utils.math.mat3_mul(rot_mat, window.infinity_zoom_II.utils.math.mat3_mul(scale_mat, aspect));
    // Invert to get canvas->image mapping
    const inv = window.infinity_zoom_II.utils.math.mat3_invert(forward);
    if (!inv) return null;
    // Canvas corners in pixel coordinates
    const w = canvas.width,
      h = canvas.height;
    // Map: p0 = (0,0), p1 = (w,0), p2 = (w,h), p3 = (0,h)
    const p0 = window.infinity_zoom_II.utils.math.mat3_transform_point(inv, [0, 0]);
    const p1 = window.infinity_zoom_II.utils.math.mat3_transform_point(inv, [w, 0]);
    const p2 = window.infinity_zoom_II.utils.math.mat3_transform_point(inv, [w, h]);
    const p3 = window.infinity_zoom_II.utils.math.mat3_transform_point(inv, [0, h]);
    return { p0, p1, p2, p3 };
  },
};

// Attach everything to a single root namespace
if (!window.infinity_zoom_II) window.infinity_zoom_II = {};
window.infinity_zoom_II.engine = engine;
// Attach utils if not already present (assumes utils are loaded elsewhere)
if (!window.infinity_zoom_II.utils) window.infinity_zoom_II.utils = {};

// Add a window resize event listener to dynamically adjust canvas size
window.addEventListener("resize", () => {
  if (window.infinity_zoom_II.engine && window.infinity_zoom_II.engine.canvas && window.infinity_zoom_II.engine.gl) {
    window.infinity_zoom_II.utils.render.resize_canvas_to_display_size(window.infinity_zoom_II.engine.canvas, window.infinity_zoom_II.engine.gl);
  }
});
