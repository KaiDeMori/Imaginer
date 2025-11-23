// Early Universe Formation V2 – main entry point
// Handles: 1) invoking the image pre-loader, 2) guaranteeing the white
// overlay stays up for at least 1 s, 3) kicking off the (future) animation
// once assets are ready.

import { load_and_decode_images } from "./preloader_module.js";
import { rand, eu_seed } from "./deterministic_rng.js";
import { UniverseAnimator } from "./canvas_animation.js";
import { layers_config } from "./layers_model.js";
import { LAYER_TIMELINE } from "./timeline_engine.js";
import "./seed_ui_panel.js"; // renders the seed information UI

// for standalone testing
window.AUDIO_VOLUME_KEY = "imaginer_audio_volume";
if (localStorage.getItem(window.AUDIO_VOLUME_KEY) === null) {
  localStorage.setItem(window.AUDIO_VOLUME_KEY, "1.0");
}

// Log the deterministic seed for debugging / reproducibility.
console.log(`[EUF] Using deterministic seed: ${eu_seed}`);

// ---------------------------------------------------------------------------
// Initialization function for dynamic loading ------------------------------
// ---------------------------------------------------------------------------

export async function initialize_early_universe_v2(canvas_element, white_screen_element = null) {
  console.log("[EUF] Dynamic initialization started");

  // Use provided elements instead of DOM queries
  const canvas_el = canvas_element;

  // We'll keep a reference around so it can be exposed for DevTools.
  let universe_animator = null;

  const preload_start_time = performance.now();

  // Calculate required URLs based on sprite counts
  const required_urls = new Set();
  for (const layer_def of LAYER_TIMELINE) {
    const config = layers_config.find((l) => l.name === layer_def.name);
    if (config) {
      const count = layer_def.sprite_count || 0;
      // layers_config.files is already deterministically shuffled
      const files_to_load = config.files.slice(0, count);
      files_to_load.forEach((url) => required_urls.add(url));
    }
  }

  const bitmaps_map = await load_and_decode_images(null, required_urls);
  const load_time_ms = performance.now() - preload_start_time;

  console.log(`[EUF] Preload complete in ${load_time_ms.toFixed(0)} ms – starting immediately (no white hold needed)`);

  // Fade out white screen only if provided (for standalone testing)
  if (white_screen_element) {
    _fade_out_white_overlay(white_screen_element);
  }
  _on_ready(bitmaps_map, canvas_el);

  function _on_ready(bitmaps_map, canvas_el) {
    console.log(`[EUF] All systems go. ${bitmaps_map.size} ImageBitmaps ready for use.`);
    console.log(`[EUF] rand() test -> ${rand()}`);

    universe_animator = new UniverseAnimator(canvas_el, bitmaps_map);
    universe_animator.start();

    // Expose for DevTools
    if (typeof window !== "undefined") {
      window.universe_animator = universe_animator;
      window.toggle_anim = function () {
        if (window.universe_animator) {
          const running = window.universe_animator.toggle();
          console.log(`[EUF] toggle_anim() → animation ${running ? "running" : "paused"}.`);
        } else {
          console.warn("[EUF] toggle_anim() called before animator is ready.");
        }
      };

      const _on_keydown_toggle = (ev) => {
        if (ev.code !== "Space" || ev.altKey || ev.ctrlKey || ev.metaKey || ev.shiftKey) return;
        const tgt = ev.target;
        if (tgt && (tgt.tagName === "INPUT" || tgt.tagName === "TEXTAREA" || tgt.isContentEditable)) {
          return;
        }
        ev.preventDefault();
        window.toggle_anim();
      };
      window.addEventListener("keydown", _on_keydown_toggle);
    }
  }
}

// ---------------------------------------------------------------------------
// Legacy standalone initialization (for testing phase 3 independently) ----
// ---------------------------------------------------------------------------

// Check for URL parameters for testing - use "t" parameter to detect standalone mode
const url_params = new URLSearchParams(window.location.search);
const is_standalone_mode = url_params.has("t");

if (is_standalone_mode) {
  console.log("[EUF] Standalone mode detected via URL parameter 't'");

  const white_screen_el = document.getElementById("whiteScreen");
  const canvas_el = document.getElementById("cinematic_canvas");

  if (!white_screen_el || !canvas_el) {
    console.error("[EUF] Standalone mode requires whiteScreen and cinematic_canvas elements");
  } else {
    const start_time = parseFloat(url_params.get("t")) || 0;

    let universe_animator = null;
    const preload_start_time = performance.now();

    // Calculate required URLs based on sprite counts
    const required_urls = new Set();
    for (const layer_def of LAYER_TIMELINE) {
      const config = layers_config.find((l) => l.name === layer_def.name);
      if (config) {
        const count = layer_def.sprite_count || 0;
        const files_to_load = config.files.slice(0, count);
        files_to_load.forEach((url) => required_urls.add(url));
      }
    }

    load_and_decode_images(null, required_urls)
      .then((bitmaps_map) => {
        const load_time_ms = performance.now() - preload_start_time;
        const min_hold_ms = 1_000; // 1 second minimum white hold
        const remaining_ms = Math.max(0, min_hold_ms - load_time_ms);

        console.log(`[EUF] Preload complete in ${load_time_ms.toFixed(0)} ms – holding white overlay for ${remaining_ms} ms to meet minimum.`);

        setTimeout(() => {
          // Apply saved volume and start audio at specified time
          console.log("[EUF] Starting audio at time", start_time);
          const audio = document.getElementById("cinematic_audio");
          if (audio) {
            const saved_audio_volume = parseFloat(localStorage.getItem(window.AUDIO_VOLUME_KEY));
            audio.volume = saved_audio_volume;
            console.log(`[EUF] Applied saved audio volume: ${saved_audio_volume}`);

            if (start_time > 0) {
              audio.currentTime = start_time;
            }
            audio.play().catch((err) => console.warn("[EUF] Audio play failed:", err));
          }

          _fade_out_white_overlay(white_screen_el);
          _on_ready_standalone(bitmaps_map, canvas_el);
        }, remaining_ms);
      })
      .catch((err) => {
        console.error("[EUF] Preloader encountered an error:", err);
        alert("Failed to load required assets. Please reload the page.");
      });

    function _on_ready_standalone(bitmaps_map, canvas_el) {
      console.log(`[EUF] Standalone ready: ${bitmaps_map.size} ImageBitmaps loaded`);
      console.log(`[EUF] rand() test -> ${rand()}`);

      universe_animator = new UniverseAnimator(canvas_el, bitmaps_map);
      universe_animator.start();

      // Expose for DevTools
      window.universe_animator = universe_animator;
      window.toggle_anim = function () {
        if (window.universe_animator) {
          const running = window.universe_animator.toggle();
          console.log(`[EUF] toggle_anim() → animation ${running ? "running" : "paused"}.`);
        } else {
          console.warn("[EUF] toggle_anim() called before animator is ready.");
        }
      };

      const _on_keydown_toggle = (ev) => {
        if (ev.code !== "Space" || ev.altKey || ev.ctrlKey || ev.metaKey || ev.shiftKey) return;
        const tgt = ev.target;
        if (tgt && (tgt.tagName === "INPUT" || tgt.tagName === "TEXTAREA" || tgt.isContentEditable)) {
          return;
        }
        ev.preventDefault();
        window.toggle_anim();
      };
      window.addEventListener("keydown", _on_keydown_toggle);
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers -------------------------------------------------------------------
// ---------------------------------------------------------------------------

function _fade_out_white_overlay(white_screen_element) {
  // The CSS file defines a 1 s opacity transition on #whiteScreen. We set the
  // final opacity to 0 → CSS handles the fade-out.
  white_screen_element.style.opacity = "0";

  // After the transition, remove the node from the DOM to keep the render tree
  // clean.
  white_screen_element.addEventListener("transitionend", () => white_screen_element.remove(), { once: true });
}

/**
 * Called once both the pre-loader and the white-screen hold are done.
 * This now spins up the Canvas animator so that we can see a visible result.
 *
 * @param {Map<string, ImageBitmap>} bitmaps_map – resolved map from pre-loader
 */
function _on_ready(bitmaps_map) {
  console.log(`[EUF] All systems go. ${bitmaps_map.size} ImageBitmaps ready for use.`);
  console.log(`[EUF] rand() test -> ${rand()}`); // quick smoke test to prove deterministic RNG works

  // -------------------------------------------------------------------------
  // Instantiate and start the UniverseAnimator.
  // -------------------------------------------------------------------------
  universe_animator = new UniverseAnimator(canvas_el, bitmaps_map);
  universe_animator.start();

  // Expose for DevTools so we can inspect state & call helper methods.
  if (typeof window !== "undefined") {
    window.universe_animator = universe_animator;

    // ---------------------------------------------------------------
    // Debug helper: window.toggle_anim() ----------------------------
    // ---------------------------------------------------------------
    window.toggle_anim = function () {
      if (window.universe_animator) {
        const running = window.universe_animator.toggle();
        console.log(`[EUF] toggle_anim() → animation ${running ? "running" : "paused"}.`);
      } else {
        console.warn("[EUF] toggle_anim() called before animator is ready.");
      }
    };

    // ---------------------------------------------------------------
    // Keyboard shortcut: press SPACE to toggle pause/resume ---------
    // ---------------------------------------------------------------
    const _on_keydown_toggle = (ev) => {
      // Ignore if any modifier key is pressed or if focus is on an editable element.
      if (ev.code !== "Space" || ev.altKey || ev.ctrlKey || ev.metaKey || ev.shiftKey) return;
      const tgt = ev.target;
      if (tgt && (tgt.tagName === "INPUT" || tgt.tagName === "TEXTAREA" || tgt.isContentEditable)) {
        return; // don't hijack typing.
      }
      ev.preventDefault();
      window.toggle_anim();
    };
    window.addEventListener("keydown", _on_keydown_toggle);
  }
}
