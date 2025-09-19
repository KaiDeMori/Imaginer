// JS for The Great Everywhere Shake cinematic step
// Explosion and shake logic will be added here

// JS for The Great Everywhere Shake cinematic step
// Explosion and shake logic

// === Cinematic Explosion & Shake Timing Constants ===
// You can tweak these to control the feel of the effect
const EXPLOSION_MIN_RATE = 0.1; // Minimum explosions per frame at start
const EXPLOSION_MAX_RATE = 10; // Maximum explosions per frame at peak
const EXPLOSION_RAMP_CONSTANT = 0.1; // How quickly the rate ramps up (0 = slow, 1 = instant)
const EXPLOSION_INITIAL_LIMIT = 3; // Max explosions for first EXPLOSION_INITIAL_LIMIT_DURATION milliseconds
const EXPLOSION_INITIAL_LIMIT_DURATION = 400; // ms for initial limit
const EXPLOSION_RANDOM_CHANCE = 0.9; // Chance to spawn each explosion per frame
const MAX_EXPLOSIONS = 10; // Reduced for less final explosion density

// === Spark Parameters (for explosion sparks) ===
// Adjust these to control the look and behavior of sparks
const SPARK_MIN_COUNT = 3; // Minimum number of sparks per explosion
const SPARK_MAX_COUNT = 6; // Maximum number of sparks per explosion
const SPARK_MIN_SPEED = 1.5; // Minimum speed of sparks
const SPARK_MAX_SPEED = 4.0; // Maximum speed of sparks
const SPARK_MIN_RADIUS = 2; // Minimum radius of a spark
// SPARK_MAX_RADIUS will be dynamic, ramping from 2 to SPARK_MAX_RADIUS_END
const SPARK_MAX_RADIUS_START = 2;
const SPARK_MAX_RADIUS_END = 60;
let spark_max_radius = SPARK_MAX_RADIUS_START;

function initialize_shake() {
  // Prevents animation from continuing after phase transition begins
  let animation_stopped = false;

  // Create and inject the text element
  const everything_fade_text = document.createElement("div");
  everything_fade_text.id = "everything_fade_text";
  everything_fade_text.style.display = "none";
  everything_fade_text.innerHTML = '<span class="everything_bloom_text">Everything!</span>';
  document.body.appendChild(everything_fade_text);

  const explosion_canvas = document.getElementById("cinematic_canvas");
  const ctx = explosion_canvas.getContext("2d");
  explosion_canvas.width = window.innerWidth;
  explosion_canvas.height = window.innerHeight;

  // Reactivate everything_fade_text after 8 seconds
  setTimeout(function () {
    everything_fade_text.style.display = "flex";
    everything_fade_text.style.opacity = "1";
  }, 8000);

  // Starfield background
  const starfield_snapshot = window.cinematic_starfield_manager.starfield_snapshot;
  start_zoom_and_explosion_animation();

  // Explosion model
  function create_explosion() {
    const cx = Math.random() * explosion_canvas.width;
    const cy = Math.random() * explosion_canvas.height;
    const max_radius = 40 + Math.random() * 60; // px
    const color_palette = ["#ffec00", "#ff0080", "#00ffe7", "#ff5e00", "#00ff6a", "#a800ff", "#fff", "#00bfff", "#ff00c8"];
    const color = color_palette[Math.floor(Math.random() * color_palette.length)];
    const duration = 500 + Math.random() * 400; // ms
    const start_time = performance.now();
    // Optionally, add sparks
    const spark_count = SPARK_MIN_COUNT + Math.floor(Math.random() * (SPARK_MAX_COUNT - SPARK_MIN_COUNT + 1));
    const sparks = [];
    for (let i = 0; i < spark_count; ++i) {
      const angle = Math.random() * 2 * Math.PI;
      const speed = SPARK_MIN_SPEED + Math.random() * (SPARK_MAX_SPEED - SPARK_MIN_SPEED);
      // Use dynamic spark_max_radius
      sparks.push({
        angle,
        speed,
        radius: SPARK_MIN_RADIUS + Math.random() * (spark_max_radius - SPARK_MIN_RADIUS),
        color: color_palette[Math.floor(Math.random() * color_palette.length)],
      });
    }
    return { cx, cy, max_radius, color, duration, start_time, sparks };
  }

  let explosions = [];
  // === Explosion Model Parameters ===
  // explosion_spawn_rate will be dynamic, ramping up towards the end

  function draw_scaled_and_shaken(scale, shake_x, shake_y) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, explosion_canvas.width, explosion_canvas.height);
    // Center zoom and shake
    const cx = explosion_canvas.width / 2;
    const cy = explosion_canvas.height / 2;
    ctx.translate(cx + shake_x, cy + shake_y);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);
    ctx.drawImage(starfield_snapshot, 0, 0, explosion_canvas.width, explosion_canvas.height);
    ctx.restore();
  }

  function draw_explosions(now) {
    for (let i = 0; i < explosions.length; ++i) {
      const exp = explosions[i];
      const t = (now - exp.start_time) / exp.duration;
      if (t > 1) continue;
      // Animate radius and opacity
      const radius = exp.max_radius * (0.2 + 0.8 * t);
      const opacity = 1 - t;
      // Draw main burst (radial gradient)
      const grad = ctx.createRadialGradient(exp.cx, exp.cy, 0, exp.cx, exp.cy, radius);
      grad.addColorStop(0, exp.color);
      // Use rgba for alpha stops to avoid invalid hex codes
      // Convert hex color to rgb
      function hex_to_rgb(hex) {
        let c = hex.replace("#", "");
        if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
        const num = parseInt(c, 16);
        return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
      }
      const [r, g, b] = hex_to_rgb(exp.color);
      grad.addColorStop(0.5, `rgba(${r},${g},${b},0.8)`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.save();
      ctx.globalAlpha = opacity * 0.85;
      ctx.globalCompositeOperation = "lighter";
      ctx.beginPath();
      ctx.arc(exp.cx, exp.cy, radius, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.filter = "blur(1.5px)";
      ctx.fill();
      ctx.filter = "none";
      // Draw sparks
      for (let s = 0; s < exp.sparks.length; ++s) {
        const spark = exp.sparks[s];
        // Animate spark position and radius
        const spark_dist = radius * (0.7 + 0.3 * Math.random());
        const spark_x = exp.cx + Math.cos(spark.angle) * spark_dist;
        const spark_y = exp.cy + Math.sin(spark.angle) * spark_dist;
        // Grow spark radius over time
        const spark_radius = spark.radius * (0.7 + 3.5 * t); // Grow much faster
        ctx.save();
        ctx.beginPath();
        ctx.arc(spark_x, spark_y, spark_radius, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fillStyle = spark.color;
        ctx.globalAlpha = opacity * 0.7;
        ctx.shadowColor = spark.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  // === Whiteout effect ===
  let whiteout_progress = 0; // 0 = no whiteout, 1 = fully white
  let whiteout_start_time = null;
  const WHITEOUT_DURATION = 1000; // ms
  let whiteout_complete = false; // Track if whiteout is fully done

  // Call this to trigger the whiteout effect
  function trigger_whiteout() {
    if (whiteout_start_time === null) {
      whiteout_start_time = performance.now();
    }
  }

  // Trigger whiteout after "Everything!" is visible for a moment
  setTimeout(function () {
    trigger_whiteout();
  }, 12000); // 8s for fade-in + 4s visible, tweak as needed

  function draw_whiteout(now) {
    if (whiteout_complete) {
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.filter = "none";
      ctx.clearRect(0, 0, explosion_canvas.width, explosion_canvas.height);
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, explosion_canvas.width, explosion_canvas.height);
      ctx.restore();
      // Remove all effects from the text overlay after a 2 second delay
      setTimeout(function () {
        const everything_fade_text = document.getElementById("everything_fade_text");
        // Guard against DOM cleanup happening before setTimeout fires
        if (!everything_fade_text) return;
        everything_fade_text.style.opacity = "0";
        everything_fade_text.style.filter = "none";
        everything_fade_text.style.textShadow = "none";
        everything_fade_text.style.display = "none";
        const text_span = everything_fade_text.querySelector(".everything_bloom_text");
        text_span.style.filter = "none";
        text_span.style.textShadow = "none";
      }, 2000);
      return;
    }
    if (whiteout_start_time !== null) {
      whiteout_progress = Math.min(1, (now - whiteout_start_time) / WHITEOUT_DURATION);
      if (whiteout_progress >= 1) {
        whiteout_complete = true;
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
        ctx.filter = "none";
        ctx.clearRect(0, 0, explosion_canvas.width, explosion_canvas.height);
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, explosion_canvas.width, explosion_canvas.height);
        ctx.restore();
        // Remove all effects from the text overlay after a 2 second delay
        setTimeout(function () {
          const everything_fade_text = document.getElementById("everything_fade_text");
          everything_fade_text.style.opacity = "0";
          everything_fade_text.style.filter = "none";
          everything_fade_text.style.textShadow = "none";
          everything_fade_text.style.display = "none";
          const text_span = everything_fade_text.querySelector(".everything_bloom_text");
          text_span.style.filter = "none";
          text_span.style.textShadow = "none";
        }, 2000);
        // Trigger phase 2 transition after text cleanup completes
        setTimeout(() => {
          // Log current audio time for phase 2 standalone testing
          const audio = document.getElementById("cinematic_audio");
          console.info(
            `[Phase Transition] Audio time at transition: ${audio.currentTime.toFixed(2)}s - Use ?t=${Math.round(audio.currentTime)} for standalone phase 2`
          );
          window.transition_to_phase_2();
        }, 2000);
      } else if (whiteout_progress > 0) {
        ctx.save();
        ctx.globalAlpha = whiteout_progress;
        ctx.globalCompositeOperation = "source-over";
        ctx.filter = "none";
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, explosion_canvas.width, explosion_canvas.height);
        ctx.globalAlpha = 1;
        ctx.restore();
      }
    }
  }

  function start_zoom_and_explosion_animation() {
    const zoom_duration_ms = 12000;
    const zoom_amplitude = 0.08;
    const zoom_base = 1.0;
    const shake_amplitude_px = 12;
    const start_time = performance.now();

    let whiteout_frame_drawn = false;
    let glow_reduction_started = false;
    let glow_reduction_start_time = null;
    const GLOW_REDUCTION_DURATION = 1200; // ms

    // Animate the reduction of the text glow (no font size change)
    function reduce_text_glow(now) {
      const everything_fade_text = document.getElementById("everything_fade_text");
      const text_span = everything_fade_text.querySelector(".everything_bloom_text");
      if (!glow_reduction_start_time) glow_reduction_start_time = now;
      const elapsed = now - glow_reduction_start_time;
      const progress = Math.min(1, elapsed / GLOW_REDUCTION_DURATION);

      // Interpolate shadow/blur from original to minimal
      function lerp(a, b, t) {
        return a + (b - a) * t;
      }
      const shadow_vals = [8, 16, 32, 64, 128, 16, 32, 4, 2];
      const min_vals = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      const colors = ["#fff", "#f0f", "#f0f", "#f0f", "#f0f", "#000", "#fff2", "#fff", "#fff"];
      let shadow_str = "";
      for (let i = 0; i < shadow_vals.length; ++i) {
        const px = lerp(shadow_vals[i], min_vals[i], progress);
        shadow_str += `0 0 ${px}px ${colors[i]}`;
        if (i < shadow_vals.length - 1) shadow_str += ", ";
      }
      // Also reduce filter blur and brightness
      const blur = lerp(0.2, 0, progress);
      const brightness = lerp(1.3, 1, progress);
      const saturate = lerp(1.8, 1, progress);
      text_span.style.textShadow = shadow_str;
      text_span.style.filter = `brightness(${brightness}) saturate(${saturate}) blur(${blur}px)`;

      // Remove all effects and hide text exactly at the end of the bloom reduction
      if (progress === 1) {
        everything_fade_text.style.opacity = "0";
        everything_fade_text.style.filter = "none";
        everything_fade_text.style.textShadow = "none";
        everything_fade_text.style.display = "none";
        text_span.style.filter = "none";
        text_span.style.textShadow = "none";
        // Cursor restoration handled by final sequence completion
      }
    }

    function animate(now) {
      // Stop immediately if transition has begun to avoid performance drain
      if (animation_stopped) return;

      const elapsed = now - start_time;
      let t = Math.min(elapsed / zoom_duration_ms, 1);
      let do_animate = false;

      // Only do animation calculations if whiteout is not yet complete
      if (!whiteout_complete) {
        if (elapsed < zoom_duration_ms) {
          // Normal animation phase
          const scale = zoom_base + zoom_amplitude * Math.sin(Math.PI * t);
          // Custom shake timing: no shake for first 7 seconds, then ramp to peak at 12 seconds
          let shake_fade = 0;
          if (elapsed > 7000) {
            const shake_t = (elapsed - 7000) / (zoom_duration_ms - 7000); // 0 to 1 over last 5 seconds
            shake_fade = shake_t; // Linear ramp from 0 to 1
          }
          const shake_x = shake_fade * shake_amplitude_px * (2 * Math.random() - 1);
          const shake_y = shake_fade * shake_amplitude_px * (2 * Math.random() - 1);
          draw_scaled_and_shaken(scale, shake_x, shake_y); // --- Explosion spawn rate ramps up as t approaches 1 ---
          // Interpolate spawn rate from min to max, quartic ramp
          const ramp = EXPLOSION_RAMP_CONSTANT + (1 - EXPLOSION_RAMP_CONSTANT) * Math.pow(t, 4);
          const explosion_spawn_rate = EXPLOSION_MIN_RATE + (EXPLOSION_MAX_RATE - EXPLOSION_MIN_RATE) * ramp;

          // For the first N ms, cap the total number of explosions
          // Dynamically ramp up spark_max_radius from SPARK_MAX_RADIUS_START to SPARK_MAX_RADIUS_END as t goes from 0 to 1
          spark_max_radius = SPARK_MAX_RADIUS_START + (SPARK_MAX_RADIUS_END - SPARK_MAX_RADIUS_START) * t;
          if (elapsed < EXPLOSION_INITIAL_LIMIT_DURATION) {
            while (explosions.length < EXPLOSION_INITIAL_LIMIT) {
              explosions.push(create_explosion());
            }
          } else {
            for (let i = 0; i < Math.floor(explosion_spawn_rate); ++i) {
              if (explosions.length < MAX_EXPLOSIONS && Math.random() < EXPLOSION_RANDOM_CHANCE) {
                explosions.push(create_explosion());
              }
            }
          }
          // Remove finished explosions
          const now_time = performance.now();
          explosions = explosions.filter((exp) => now_time - exp.start_time < exp.duration);
          // Draw explosions AFTER background so they appear on top
          draw_explosions(now_time);
          do_animate = true;
        } else {
          // After main animation, keep drawing static background with maximum shake
          const shake_x = shake_amplitude_px * (2 * Math.random() - 1);
          const shake_y = shake_amplitude_px * (2 * Math.random() - 1);
          draw_scaled_and_shaken(zoom_base, shake_x, shake_y);
          // Draw explosions AFTER background so they appear on top
          draw_explosions(performance.now());
        }
      }

      // Draw whiteout overlay if triggered
      draw_whiteout(now);

      // Continue animating until whiteout is fully complete and at least one frame of full white is drawn
      if (whiteout_complete && !whiteout_frame_drawn) {
        whiteout_frame_drawn = true;
        requestAnimationFrame(animate);
        return;
      }

      // After whiteout is fully complete and frame drawn, start reducing the text glow
      if (whiteout_complete && whiteout_frame_drawn) {
        if (!glow_reduction_started) {
          glow_reduction_started = true;
          glow_reduction_start_time = null;
        }
        reduce_text_glow(now);
        // Continue animating until glow is fully reduced
        if (!glow_reduction_start_time || now - glow_reduction_start_time < GLOW_REDUCTION_DURATION) {
          requestAnimationFrame(animate);
        }
        return;
      }

      if (do_animate || !whiteout_complete || !whiteout_frame_drawn) {
        requestAnimationFrame(animate);
      }
    }
    requestAnimationFrame(animate);
  }

  // Allow external stopping to prevent resource waste during transitions
  window.stop_shake_animation = function () {
    animation_stopped = true;
  };
}

// Make the function globally accessible
window.initialize_shake = initialize_shake;
