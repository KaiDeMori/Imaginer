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
  // name, p_in, p_out, z_start, z_end, base_opacity, fade_easing, distance_fade_end_z, (optional) distance_fade_start_z
  {
    name: "cosmic_fog",
    p_in: 0.04,
    p_out: 0.24,
    z_start: 10,
    z_end: -5,
    base_opacity: .9,
    fade_easing: "cubic_in_out",
    distance_fade_start_z: 10, // start fading immediately
    distance_fade_end_z: -3 // invisible 2 WU in front of camera
  },
  {
    name: "galaxy_streams",
    p_in: 0.16,
    p_out: 0.40,
    z_start: 50,
    z_end: 16 + (-93.75 * 0.24),
    base_opacity: 1,
    fade_easing: "linear",
    distance_fade_end_z: 0,
    distance_fade_start_z: 16 + (-93.75 * 0.24)
  },
  {
    name: "nebulae",
    p_in: 0.32,
    p_out: 0.56,
    z_start: 240,
    z_end: 12 + (-117.19 * 0.24),
    base_opacity: 0.7,
    fade_easing: "linear",
    distance_fade_end_z: -40,
    distance_fade_start_z: 12 + (-117.19 * 0.24)
  },
  {
    name: "star_clusters",
    p_in: 0.52,
    p_out: 0.80,
    z_start: 100,
    z_end: 8 + (-146.49 * 0.32),
    base_opacity: 1,
    fade_easing: "linear",
    distance_fade_end_z: -40,
    distance_fade_start_z: 8 + (-146.49 * 0.32)
  },
  {
    name: "planet",
    p_in: 0.75, // delayed appearance
    p_out: 0.83, // keep same duration
    z_start: 4,
    z_end: 4 + (-183.11 * 0.08),
    base_opacity: 1,
    fade_easing: "linear",
    distance_fade_end_z: -20
  }
]);

// Maximum layer Z-start (furthest positive Z) – useful for helper formulas
// so we don't rely on the magic literal `10` elsewhere.
const MAX_Z_POS = Math.max(...LAYER_TIMELINE.map(t => t.z_start));

// Quick sanity guard – ensure every logical layer in `layers_config` appears
// exactly once in the timeline table.
{
  const names_from_cfg = new Set(layers_config.map(l => l.name));
  const names_from_tbl = new Set(LAYER_TIMELINE.map(t => t.name));
  names_from_cfg.forEach(n => {
    if (!names_from_tbl.has(n)) {
      console.warn(`[timeline_engine] Layer '${n}' missing in LAYER_TIMELINE – it will be ignored until added.`);
    }
  });
}

// ---------------------------------------------------------------------------
// Maths helpers --------------------------------------------------------------
// ---------------------------------------------------------------------------

/** Linear ease – returns eased value for t ∈ [0, 1]. */
function linear_ease(t) {
  return t;
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
function cubic_in_out_ease(t) {
  // Cubic ease-in-out: t ∈ [0,1]
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const EASING_FUNCTIONS = {
  linear: linear_ease,
  cubic_in_out: cubic_in_out_ease
};

function get_layer_states(global_progress) {
  const p = clamp(global_progress, 0, 1);
  /** @type {ReturnType<typeof get_layer_states>} */
  const states = [];

  for (const layer of LAYER_TIMELINE) {
    // Provide defaults for backward compatibility
    const {
      name,
      p_in,
      p_out,
      z_start,
      z_end,
      base_opacity = 0.9,
      fade_easing = "linear",
      distance_fade_end_z = -20,
      distance_fade_start_z = null
    } = layer;

    let opacity = 0;
    let local_t = 0; // 0→1 inside the active window

    if (p >= p_in && p <= p_out) {
      const window_len = p_out - p_in;
      local_t = (p - p_in) / window_len;

      // Fade-in/out: first & last 10 % of the window.
      const FADE_PORTION = 0.10;
      let fade = 1;
      const easing_fn = EASING_FUNCTIONS[fade_easing] || linear_ease;
      if (local_t < FADE_PORTION) {
        // Fade-in: ramp up to full opacity
        fade = easing_fn(local_t / FADE_PORTION);
      } else {
        // After fade-in, fully opaque until distance-based fade applies
        fade = 1;
      }

      // Pseudo-Z – interpolate regardless of opacity so that sorting works.
      const z = lerp(z_start, z_end, clamp(local_t, 0, 1));

      // Distance-based fade only applies after fade-in
      let distance_factor = 1;
      if (local_t >= FADE_PORTION) {
        if (distance_fade_start_z !== null) {
          // Fade starts at distance_fade_start_z, ends at distance_fade_end_z
          if (z <= distance_fade_end_z) {
            distance_factor = 0;
          } else if (z >= distance_fade_start_z) {
            distance_factor = 1;
          } else {
            distance_factor = (z - distance_fade_end_z) / (distance_fade_start_z - distance_fade_end_z);
          }
        } else {
          // Default: fade from z_start to distance_fade_end_z
          distance_factor = clamp((z - distance_fade_end_z) / (z_start - distance_fade_end_z), 0, 1);
        }
      }
      opacity = base_opacity * fade * distance_factor;
      if (name === "planet" && fade === 1) {
        // Planet stays fully opaque after fade-in
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
export { get_layer_states, linear_ease, MAX_Z_POS };
