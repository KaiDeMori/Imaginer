// Mystery Image Module for Infinity Zoom II Engine
// Handles portal effect where mystery content appears through alien's transparent screen region

window.infinity_zoom_II.mystery_image_main_zoom = {
  // WebGL context
  gl_context: null,

  // Mystery image data
  alien_display_screens: null, // Array of {image, texture, loaded} objects
  alien_display_screen_current: null, // Currently active mystery image

  // Main zoom swap system
  main_zoom_swap_config: {
    enabled: true,
    main_zoom_start_progress: 0.8, // When to start swapping (80% through zoom)
  },
  current_image_index: 0, // Current image index in the array
  last_calculated_index: -1, // Prevent duplicate swaps

  // Performance caching
  cached_region_rect: null, // Cached region rectangle
  cached_region_orientation: null, // Cached region orientation angle

  init(engine) {
    this.gl_context = engine.gl_context;
    this.alien_display_screens = engine.main_zoom_mystery_images;
    this.alien_display_screen_current = this.alien_display_screens[0];
  },

  // Calculate mystery image TRS - simplified version without global rotation
  calculate_mystery_TRS(alien_layer, region_rect, canvas_width, canvas_height) {
    // Calculate region center from opposite corners (clockwise rectangle)
    const region_center_pixels = {
      x: (region_rect.p0.x + region_rect.p2.x) / 2,
      y: (region_rect.p0.y + region_rect.p2.y) / 2,
    };

    // Calculate offset of region center from alien image center (in normalized coordinates)
    const alien_image_size = alien_layer.image.width;
    const alien_center_pixels = alien_image_size / 2;

    const region_offset_pixels = {
      x: region_center_pixels.x - alien_center_pixels,
      y: region_center_pixels.y - alien_center_pixels,
    };

    // Convert pixel offset to screen space offset (no rotation applied)
    const base_pixel_scale = alien_layer.trs.scale * Math.min(canvas_width, canvas_height);

    // Convert to square coordinate space for rotation (eliminates AR distortion)
    const square_offset = {
      x: ((region_offset_pixels.x / alien_image_size) * base_pixel_scale) / Math.min(canvas_width, canvas_height),
      y: (-(region_offset_pixels.y / alien_image_size) * base_pixel_scale) / Math.min(canvas_width, canvas_height), // Y-flip
    };

    // Convert alien center to square coordinates too
    const alien_center_square = {
      x: (alien_layer.trs.center_x * canvas_width) / Math.min(canvas_width, canvas_height) / 2,
      y: (alien_layer.trs.center_y * canvas_height) / Math.min(canvas_width, canvas_height) / 2,
    };

    // Mystery center in square coordinates
    let mystery_center_square = {
      x: alien_center_square.x + square_offset.x,
      y: alien_center_square.y + square_offset.y,
    };

    // Apply global rotation in square coordinate space
    const global_rotation_angle = alien_layer.trs.rotation;
    const cos_r = Math.cos(global_rotation_angle);
    const sin_r = Math.sin(global_rotation_angle);

    const rotated_center_square = {
      x: mystery_center_square.x * cos_r - mystery_center_square.y * sin_r,
      y: mystery_center_square.x * sin_r + mystery_center_square.y * cos_r,
    };

    // Convert back to TRS coordinate space
    const mystery_center_screen = {
      x: ((rotated_center_square.x * Math.min(canvas_width, canvas_height)) / canvas_width) * 2,
      y: ((rotated_center_square.y * Math.min(canvas_width, canvas_height)) / canvas_height) * 2,
    };

    // Calculate region's intrinsic orientation only (ignore alien rotation)
    const region_orientation = this.calculate_region_orientation(region_rect);

    // Calculate region dimensions for covering scale
    const region_width = Math.sqrt((region_rect.p1.x - region_rect.p0.x) ** 2 + (region_rect.p1.y - region_rect.p0.y) ** 2);
    const region_height = Math.sqrt((region_rect.p2.x - region_rect.p1.x) ** 2 + (region_rect.p2.y - region_rect.p1.y) ** 2);

    // Use covering square size (longer side)
    const covering_square_size = Math.max(region_width, region_height);
    const region_scale_ratio = covering_square_size / alien_image_size;
    const mystery_scale = alien_layer.trs.scale * region_scale_ratio;

    return {
      center_x: mystery_center_screen.x,
      center_y: mystery_center_screen.y,
      scale: mystery_scale,
      rotation: region_orientation + alien_layer.trs.rotation, // Region tilt + global rotation (compound rotation!)
    };
  },

  // Calculate region's intrinsic orientation from rectangle edge vectors
  calculate_region_orientation(region_rect) {
    // Use vector from p0 to p1 (top edge of clockwise rectangle)
    const dx = region_rect.p1.x - region_rect.p0.x;
    const dy = region_rect.p1.y - region_rect.p0.y;

    // Y-flip for image coordinate system (Y=0 at top)
    return Math.atan2(-dy, dx);
  },

  // Render mystery image with proper positioning and alpha
  render_mystery_image(gl, program, quad_buffer, alien_layer, canvas) {
    // Calculate mystery image TRS synchronized with alien layer
    const region_rect = window.infinity_zoom_II.config.region_zoom.region_rect;
    const mystery_trs = this.calculate_mystery_TRS(alien_layer, region_rect, canvas.width, canvas.height);

    // Create temporary mystery layer object for rendering
    const mystery_layer = {
      texture: this.alien_display_screen_current.texture,
      trs: mystery_trs,
      alpha: alien_layer.alpha, // Same alpha as alien layer
    };

    // Render mystery image first (background)
    window.infinity_zoom_II.utils.render_layer(gl, program, quad_buffer, mystery_layer, canvas);
  },

  // Cycle to next mystery image in the sequence
  cycle_to_next_image() {
    const current_index = this.alien_display_screens.indexOf(this.alien_display_screen_current);
    const next_index = (current_index + 1) % this.alien_display_screens.length;
    this.alien_display_screen_current = this.alien_display_screens[next_index];
  },

  // Set specific mystery image by index
  set_image_by_index(index) {
    if (index >= 0 && index < this.alien_display_screens.length) {
      this.alien_display_screen_current = this.alien_display_screens[index];
    }
  },

  // Calculate zoom progress for in-flight swapping
  calculate_zoom_progress(engine) {
    if (engine.animation_phase !== "main_zoom" && engine.animation_phase !== "final_rotation") {
      return 0; // Not in main zoom, no swapping
    }

    // Calculate progress based on final layer scale
    const final_layer_index = engine.layers.length - 1;
    const final_layer = engine.layers[final_layer_index];
    const covering_scale = window.infinity_zoom_II.utils.calc_covering_scale(engine.canvas.width, engine.canvas.height, 1);

    // Progress from fitting (1.0) to covering scale
    const progress = Math.min((final_layer.trs.scale - 1.0) / (covering_scale - 1.0), 1.0);
    return Math.max(0, progress); // Clamp to [0, 1]
  },

  // Main zoom in-flight swapping - elegant approach
  update_main_zoom_swapping(engine) {
    if (!this.main_zoom_swap_config.enabled) {
      return; // Swapping disabled
    }

    const zoom_progress = this.calculate_zoom_progress(engine);
    const start_progress = this.main_zoom_swap_config.main_zoom_start_progress;

    let target_image_index;

    if (zoom_progress < start_progress) {
      // Before start progress: always show first image
      target_image_index = 0;
    } else {
      // After start progress: calculate which image slot we're in
      const remaining_progress = 1.0 - start_progress; // e.g., 0.2
      const slot_size = remaining_progress / this.alien_display_screens.length; // e.g., 0.05
      const relative_progress = zoom_progress - start_progress; // How far past start_progress
      target_image_index = Math.min(
        Math.floor(relative_progress / slot_size),
        this.alien_display_screens.length - 1 // Clamp to last image
      );
    }

    // Only swap if the target index has changed
    if (target_image_index !== this.last_calculated_index) {
      this.set_image_by_index(target_image_index);
      this.current_image_index = target_image_index;
      this.last_calculated_index = target_image_index;

      log(`🎭 Mystery image swapped to index ${target_image_index} at progress ${zoom_progress.toFixed(3)} (${(zoom_progress * 100).toFixed(1)}%)`);
    }
  },

  // Reset swap system (call when starting new zoom sequence)
  reset_swap_system() {
    this.current_image_index = 0;
    this.last_calculated_index = -1;
    this.set_image_by_index(0); // Reset to first image

    log("Mystery image swap system reset");
  },
};
