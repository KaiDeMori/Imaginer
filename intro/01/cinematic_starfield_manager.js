// CinematicStarfieldManager encapsulates all starfield logic for dynamic control
class CinematicStarfieldManager {
  constructor() {
    this.starfield_canvas = null;
    this.starfield_context = null;
    this.starfield_width = null;
    this.starfield_height = null;

    this.SWITCH_TO_STATIC_THRESHOLD = 20000; // Switch to static stars behavior at this count

    this.starfield_snapshot = null; // Will hold the final snapshot image

    this.star_count = 0;
    this.stars = [];
    this.star_colors = ["#fff", "#aaf", "#ffa", "#aff", "#faf", "#ffd700"];

    this.zoom_speed = 0.0002;
    this.animation_frame_id = null;
    this.is_running = false;

    // Staggered update system for static stars performance optimization
    this.stagger_update_interval = 1;
    this.stagger_frame_offset = 0;
    this.stagger_enabled = false;
    this.stagger_system_disabled = true; // Flag to disable staggering entirely
    this.clear_canvas = true;
    this.static_phase = false;

    // State-based sequence tracking for O(1) performance
    this.current_step_index = 0;
    this.current_step_start_time = 0; // When current step began (absolute sequence time)
    this.current_step_end_time = 0; // When current step ends (absolute sequence time)
    this.sequence_completed = false; // Flag for when we reach a duration-0 final step

    this._init_stars();
  }

  initialize_canvas() {
    this.starfield_canvas = document.getElementById("starfield_canvas");
    this.starfield_context = this.starfield_canvas.getContext("2d", { willReadFrequently: false, alpha: false });
    this.starfield_width = window.innerWidth;
    this.starfield_height = window.innerHeight;
    this.starfield_canvas.width = this.starfield_width;
    this.starfield_canvas.height = this.starfield_height;
    window.addEventListener("resize", () => this._on_resize());
  }

  _create_star() {
    const now = performance.now();
    const lifetime = this._random_between(2200, 5200); // ms
    const is_static = this.static_phase;

    return {
      x: this._random_between(0, this.starfield_width),
      y: this._random_between(0, this.starfield_height),
      z: this._random_between(0.2, 1),
      radius: this._random_between(0.5, 1.8),
      twinkle_phase: this._random_between(0, Math.PI * 2),
      twinkle_speed: this._calculate_twinkle_speed(is_static),
      twinkle_amplitude: this._random_between(0.2, 0.4),
      color: this._random_star_color(),
      born_time: now,
      lifetime: lifetime,
      fade_duration: 600,
      fading_out: false,
      fading_in: true,
      fade_progress: 0,
      fade_start_time: now,
      is_static: is_static, // Mark stars beyond 20k as static
      has_reached_peak: false,
    };
  }

  _calculate_twinkle_speed(is_static) {
    return is_static ? 0.1 : this._random_between(0.002, 0.008);
  }

  _draw_star_optimized(star, time) {
    let alpha = 1;
    const now = time;

    // Skip fade lifecycle for static stars (performance optimization)
    if (!star.is_static) {
      if (star.fading_out) {
        star.fade_progress = (now - star.fade_start_time) / star.fade_duration;
        alpha = 1 - Math.min(star.fade_progress, 1);
        if (star.fade_progress >= 1) {
          const new_star = this._create_star();
          Object.assign(star, new_star);
          star.fading_out = false;
          star.fading_in = true;
          star.fade_start_time = now;
          star.fade_progress = 0;
          alpha = 0;
        }
      } else if (star.fading_in) {
        star.fade_progress = (now - star.fade_start_time) / star.fade_duration;
        alpha = Math.min(star.fade_progress, 1);
        if (star.fade_progress >= 1) {
          star.fading_in = false;
          star.fade_progress = 0;
        }
      }
    }

    const twinkle = 0.7 + star.twinkle_amplitude * Math.sin((time / 1000) * star.twinkle_speed * 1000 + star.twinkle_phase);

    const final_alpha = twinkle * star.z * alpha;

    // Peak detection for diminishing stars (only for 20k+ stars)
    if (star.is_static && this.star_count >= this.SWITCH_TO_STATIC_THRESHOLD && !star.has_reached_peak) {
      const star_max_twinkle = 0.7 + star.twinkle_amplitude;
      if (twinkle >= star_max_twinkle * 0.98) {
        star.has_reached_peak = true;
      }
    }

    this.starfield_context.globalAlpha = final_alpha;

    // Draw main star
    this.starfield_context.beginPath();
    this.starfield_context.arc(star.x, star.y, star.radius * star.z, 0, Math.PI * 2);
    this.starfield_context.fill();

    // Add subtle glow only for brighter stars to maintain visual quality
    if (final_alpha > 0.6 && star.z > 0.7) {
      this.starfield_context.globalAlpha = final_alpha * 0.3;
      this.starfield_context.beginPath();
      this.starfield_context.arc(star.x, star.y, star.radius * star.z * 2, 0, Math.PI * 2);
      this.starfield_context.fill();
    }
  }

  _animate_starfield = (time) => {
    // No canvas clearing after 20k stars - let static stars accumulate for performance
    if (this.clear_canvas) this.starfield_context.clearRect(0, 0, this.starfield_width, this.starfield_height);

    const now = time / 1000;
    const sequence_time = now - (this._cinematic_sequence_start_time || (this._cinematic_sequence_start_time = now));

    // Get current step using O(1) state-based tracking
    const { step_index, step, local_elapsed } = this._get_current_sequence_step(sequence_time);

    // Interpolate star_count and zoom_speed if needed
    let star_count = step.star_count;
    let zoom_speed = step.zoom_speed;

    if (step.duration > 0 && star_count.from !== star_count.to) {
      const progress = Math.min(local_elapsed / step.duration, 1);
      star_count = Math.round(star_count.from + (star_count.to - star_count.from) * progress);
    } else {
      star_count = star_count.from;
    }
    if (step.duration > 0 && zoom_speed.from !== zoom_speed.to) {
      const progress = Math.min(local_elapsed / step.duration, 1);
      zoom_speed = zoom_speed.from + (zoom_speed.to - zoom_speed.from) * progress;
    } else {
      zoom_speed = zoom_speed.from;
    }
    // Dynamically update stars array to match cinematic star_count
    if (this.star_count !== star_count) {
      if (this.stars.length < star_count) {
        for (let i = this.stars.length; i < star_count; i++) {
          this.stars.push(this._create_star());
        }
      } else if (this.stars.length > star_count) {
        this.stars.length = star_count;
      }
      this.star_count = star_count;

      // Convert all stars to static behavior once we reach 20k+ stars
      if (!this.static_phase && star_count >= this.SWITCH_TO_STATIC_THRESHOLD) {
        this.static_phase = true;

        // Disable canvas clearing for accumulation effect
        this.clear_canvas = false;

        // Enable staggered updates for performance (only if not disabled)
        if (!this.stagger_enabled && !this.stagger_system_disabled) {
          this.stagger_enabled = true;
        }

        for (let i = 0; i < this.stars.length; i++) {
          const star = this.stars[i];
          if (!star.is_static) {
            star.is_static = true;
            star.twinkle_speed = this._calculate_twinkle_speed(true);
            star.fading_out = false;
            star.fading_in = false;
          }
        }
      }
    }
    this.zoom_speed = zoom_speed;
    this._debug_log_sequence_on_step_change(step_index, step, sequence_time, star_count, zoom_speed);

    // Performance optimization: group stars by color to reduce context state changes
    const stars_by_color = {};
    // Update star positions and group by color
    for (let i = 0; i < this.stars.length; i++) {
      let star = this.stars[i];

      // Skip peaked stars (diminishing stars optimization)
      if (star.has_reached_peak) {
        continue;
      }

      // For static stars with staggered updates, only update position if it's their turn this frame
      const should_update_position =
        !star.is_static || !this.stagger_enabled || this.stagger_system_disabled || i % this.stagger_update_interval === this.stagger_frame_offset;

      if (should_update_position) {
        // Skip lifecycle management for static stars (beyond 20k) to improve performance
        if (!star.is_static) {
          if (!star.fading_out && !star.fading_in && time - star.born_time > star.lifetime) {
            star.fading_out = true;
            star.fade_start_time = time;
            star.fade_progress = 0;
          }
        }

        star.x += (star.x - this.starfield_width / 2) * this.zoom_speed * star.z;
        star.y += (star.y - this.starfield_height / 2) * this.zoom_speed * star.z;

        // If star goes out of bounds, respawn it as a new star
        if (star.x < 0 || star.x > this.starfield_width || star.y < 0 || star.y > this.starfield_height) {
          this.stars[i] = this._create_star();
          star = this.stars[i];
        }
      }

      // Group stars by color for batch rendering
      if (!stars_by_color[star.color]) {
        stars_by_color[star.color] = [];
      }
      stars_by_color[star.color].push(star);
    }

    // Batch render stars by color to minimize context state changes
    for (const color in stars_by_color) {
      this.starfield_context.fillStyle = color;
      for (const star of stars_by_color[color]) {
        this._draw_star_optimized(star, time);
      }
    }

    // Advance stagger frame offset for next frame (cycles 0, 1, 2, 0, 1, 2...)
    if (this.stagger_enabled && !this.stagger_system_disabled) {
      this.stagger_frame_offset = (this.stagger_frame_offset + 1) % this.stagger_update_interval;
    }

    if (this.is_running) {
      this.animation_frame_id = requestAnimationFrame(this._animate_starfield);
    }
  };

  _on_resize() {
    this.starfield_width = window.innerWidth;
    this.starfield_height = window.innerHeight;
    this.starfield_canvas.width = this.starfield_width;
    this.starfield_canvas.height = this.starfield_height;
  }

  _initialize_sequence_state() {
    this.current_step_index = 0;
    this.current_step_start_time = 0;
    this.current_step_end_time = active_cinematic_starfield_timing_sequence[0].duration;
    this.sequence_completed = false;
  }

  _get_current_sequence_step(sequence_time) {
    // Check if we need to advance to next step
    if (
      !this.sequence_completed &&
      sequence_time >= this.current_step_end_time &&
      this.current_step_index < active_cinematic_starfield_timing_sequence.length - 1
    ) {
      // Advance to next step
      this.current_step_index++;
      this.current_step_start_time = this.current_step_end_time;

      const next_step = active_cinematic_starfield_timing_sequence[this.current_step_index];
      if (next_step.duration === 0) {
        // Final step with "forever" duration
        this.sequence_completed = true;
        this.current_step_end_time = Infinity;
      } else {
        this.current_step_end_time = this.current_step_start_time + next_step.duration;
      }
    }

    return {
      step_index: this.current_step_index,
      step: active_cinematic_starfield_timing_sequence[this.current_step_index],
      local_elapsed: sequence_time - this.current_step_start_time,
    };
  }

  // Debug: log sequence timing and values only when step changes or every second
  _debug_log_sequence_on_step_change(step_index, step, elapsed, star_count, zoom_speed) {
    if (this._last_debug_step_index !== step_index) {
      this._last_debug_step_index = step_index;
      console.log(
        `[Cinematic Sequence] Step ${step_index}: start=${step.start_time}s, duration=${step.duration}s | elapsed=${elapsed.toFixed(
          2
        )}s | star_count=${star_count} | zoom_speed=${zoom_speed}`
      );
    }
  }

  start_cinematic_sequence() {
    if (!this.is_running) {
      this._initialize_sequence_state();
      this.is_running = true;
      this.animation_frame_id = requestAnimationFrame(this._animate_starfield);
    }
  }

  stop_cinematic_sequence() {
    if (this.is_running) {
      this.is_running = false;
      if (this.animation_frame_id) {
        cancelAnimationFrame(this.animation_frame_id);
        this.animation_frame_id = null;
      }
    }
  }

  reset_cinematic_sequence() {
    this.stop_cinematic_sequence();
    this._initialize_sequence_state();
    this._init_stars();
  }

  _init_stars() {
    this.stars = [];
    for (let i = 0; i < this.star_count; i++) {
      this.stars.push(this._create_star());
    }
  }

  _random_between(min, max) {
    return Math.random() * (max - min) + min;
  }

  _random_star_color() {
    return this.star_colors[Math.floor(Math.random() * this.star_colors.length)];
  }
}
