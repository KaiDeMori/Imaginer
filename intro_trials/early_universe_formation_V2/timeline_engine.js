"use strict";
/*
Timeline Engine – Early Universe Formation V2
--------------------------------------------
Maps a **global progress value** (0 → 1) to per-layer animation state:
  • opacity   (0 → 1 → 0 according to fade-in/out windows)
  • pseudo-Z  (linear interpolation layerZStart → layerZEnd)
  • scale     (derived from pseudo-Z using a simple perspective formula)

This file fulfils **Task 2 · Timeline Engine** of `multi_layer_animation_progress.md`:
  ✓ Create helper that maps global progress to per-layer state.
  ✓ Integrate cubic-in-out easing for smoother opacity ramps.
  ✓ Provide a minimal built-in "unit-test" that prints a sample table for
    synthetic timestamps (development builds only).

The engine is intentionally *render-backend-agnostic* – it performs no drawing
and has zero dependencies on Canvas.  Consumers (e.g. `UniverseAnimator`) just
call `get_layer_states(progress)` once per frame.
*/

// ---------------------------------------------------------------------------
// Imports --------------------------------------------------------------------
// ---------------------------------------------------------------------------
import { layers_config } from "./layers_model.js";

// ---------------------------------------------------------------------------
// Constants – per-layer timing & Z mapping -----------------------------------
// ---------------------------------------------------------------------------
/*
The values below are based on the storyboard laid out in
`Early_Universe_Formation_Planning_V2.md` (section “Timeline Proposal”).  They
may be tweaked later when visual fine-tuning starts.

All times use the *normalised* master progress (0 → 1).  Using relative numbers
instead of absolute seconds means the engine works irrespective of the final
chosen total duration (e.g. 25 s).
*/
const LAYER_TIMELINE = Object.freeze([
  //  name,           fadeIn, fadeOut, zStart, zEnd
  ["cosmic_fog",     0.04,   0.24,    10,     -5],
  ["galaxy_streams", 0.16,   0.40,    8,      -4],
  ["nebulae",        0.32,   0.56,    6,      -3],
  ["star_clusters",  0.48,   0.80,    4,      -2],
  ["planet",         0.72,   1.00,    2,       0], // planet never fades out
]);

// Quick sanity guard – ensure every logical layer in `layers_config` appears
// exactly once in the timeline table.
{
  const names_from_cfg = new Set(layers_config.map(l => l.name));
  const names_from_tbl = new Set(LAYER_TIMELINE.map(t => t[0]));
  names_from_cfg.forEach(n => {
    if (!names_from_tbl.has(n)) {
      console.warn(`[timeline_engine] Layer '${n}' missing in LAYER_TIMELINE – it will be ignored until added.`);
    }
  });
}

// ---------------------------------------------------------------------------
// Maths helpers --------------------------------------------------------------
// ---------------------------------------------------------------------------
/** Cubic ease-in-out – returns eased value for t ∈ [0, 1]. */
function ease_cubic_in_out(t) {
  return t < 0.5
    ? 4 * t * t * t               // in
    : 1 - Math.pow(-2 * t + 2, 3) / 2; // out
}

/** Linear interpolation helper. */
function lerp(a, b, t) { return a + (b - a) * t; }

/** Clamp helper. */
function clamp(x, lo = 0, hi = 1) { return x < lo ? lo : (x > hi ? hi : x); }

// ---------------------------------------------------------------------------
// Public API -----------------------------------------------------------------
// ---------------------------------------------------------------------------
/**
 * Computes the animation state for every known layer.
 *
 * @param {number} global_progress – normalised master progress (0 → 1)
 * @returns {Array<{ name: string, opacity: number, z: number, scale: number }>}  –
 *          one entry per layer declared in `LAYER_TIMELINE`, order preserved.
 */
function get_layer_states(global_progress) {
  const p = clamp(global_progress, 0, 1);
  /** @type {ReturnType<typeof get_layer_states>} */
  const states = [];

  for (const [name, p_in, p_out, z_start, z_end] of LAYER_TIMELINE) {
    let opacity = 0;
    let local_t = 0; // 0→1 inside the active window

    if (p >= p_in && p <= p_out) {
      const window_len = p_out - p_in;
      local_t = (p - p_in) / window_len;

      // Fade-in/out: first & last 10 % of the window.
      const FADE_PORTION = 0.10;
      if (local_t < FADE_PORTION) {
        // Fade-in
        opacity = ease_cubic_in_out(local_t / FADE_PORTION);
      } else if (local_t > 1 - FADE_PORTION) {
        // Fade-out (planet layer ignores fade-out so opacity stays at 1)
        const planet_layer = name === "planet";
        opacity = planet_layer
          ? 1
          : ease_cubic_in_out((1 - local_t) / FADE_PORTION);
      } else {
        opacity = 1;
      }
    } else if (p > p_out && name === "planet") {
      // Planet stays fully opaque after its fade-in window.
      opacity = 1;
      local_t = 1;
    }

    // Pseudo-Z – interpolate regardless of opacity so that sorting works.
    const z = lerp(z_start, z_end, clamp(local_t, 0, 1));

    // Scale – very simple perspective mapping for now.
    const cam_z = -1; // camera moves forward; sign convention arbitrary here.
    const scale = cam_z / (cam_z - z);

    states.push({ name, opacity, z, scale });
  }

  return states;
}

// ---------------------------------------------------------------------------
// Dev-time mini test ---------------------------------------------------------
// ---------------------------------------------------------------------------
if (typeof window !== "undefined" && window.location?.hash?.includes("dev")) {
  console.groupCollapsed("[timeline_engine] sample table");
  for (let p = 0; p <= 1.0001; p += 0.10) {
    const row = get_layer_states(p).map(s => `${s.name.substring(0,3)} op=${s.opacity.toFixed(2)}`);
    console.log(`p=${p.toFixed(2)} →`, row.join(" | "));
  }
  console.groupEnd();
}

// ---------------------------------------------------------------------------
// Module exports -------------------------------------------------------------
// ---------------------------------------------------------------------------
export { get_layer_states, ease_cubic_in_out };
