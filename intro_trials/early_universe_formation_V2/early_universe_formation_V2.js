// Early Universe Formation V2 – main entry point
// Handles: 1) invoking the image pre-loader, 2) guaranteeing the white
// overlay stays up for at least 1 s, 3) kicking off the (future) animation
// once assets are ready.

import { load_and_decode_images } from "./preloader_module.js";
import { rand, eu_seed } from "./deterministic_rng.js";
import { UniverseAnimator } from "./canvas_animation.js"; // NEW: animation engine
import "./seed_ui_panel.js"; // renders the seed information UI

// Log the deterministic seed for debugging / reproducibility.
console.log(`[EUF] Using deterministic seed: ${eu_seed}`);

// ---------------------------------------------------------------------------
// DOM references ------------------------------------------------------------
// ---------------------------------------------------------------------------

const white_screen_el = /** @type {HTMLDivElement} */ (document.getElementById("whiteScreen"));
const canvas_el       = /** @type {HTMLCanvasElement} */ (document.getElementById("universeCanvas"));

// Guard against missing markup (should never happen in production).
if (!white_screen_el) {
  console.error("[EUF] #whiteScreen element not found – aborting.");
  throw new Error("Critical DOM element missing: #whiteScreen");
}
if (!canvas_el) {
  console.error("[EUF] #universeCanvas element not found – aborting.");
  throw new Error("Critical DOM element missing: #universeCanvas");
}

// We'll keep a reference around so it can be exposed for DevTools.
/** @type {UniverseAnimator | null} */
let universe_animator = null;

// ---------------------------------------------------------------------------
// 1. Kick off pre-loading ----------------------------------------------------
// ---------------------------------------------------------------------------

const preload_start_time = performance.now();

load_and_decode_images()
  .then((bitmaps_map) => {
    const load_time_ms   = performance.now() - preload_start_time;
    const min_hold_ms    = 1_000; // 1 second minimum white hold
    const remaining_ms   = Math.max(0, min_hold_ms - load_time_ms);

    console.log(`[EUF] Preload complete in ${load_time_ms.toFixed(0)} ms – holding white overlay for ${remaining_ms} ms to meet minimum.`);

    // Keep the overlay up for the remaining duration (if any), then fade.
    setTimeout(() => {
      _fade_out_white_overlay();
      // When the fade is done (handled inside helper), we'll continue.
      _on_ready(bitmaps_map);
    }, remaining_ms);
  })
  .catch((err) => {
    console.error("[EUF] 🚨 Preloader encountered an error:", err);
    // In a production setting you might show a user-facing error UI here.
    alert("Failed to load required assets. Please reload the page.");
  });

// ---------------------------------------------------------------------------
// Helpers -------------------------------------------------------------------
// ---------------------------------------------------------------------------

function _fade_out_white_overlay() {
  // The CSS file defines a 1 s opacity transition on #whiteScreen. We set the
  // final opacity to 0 → CSS handles the fade-out.
  white_screen_el.style.opacity = "0";

  // After the transition, remove the node from the DOM to keep the render tree
  // clean.
  white_screen_el.addEventListener(
    "transitionend",
    () => white_screen_el.remove(),
    { once: true }
  );
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
    window.toggle_anim = function() {
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
