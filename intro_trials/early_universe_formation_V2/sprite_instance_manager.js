"use strict";
/*
Sprite Instance Manager – Early Universe Formation V2
----------------------------------------------------
Creates the **deterministic, per-layer sprite instance list** that will be
consumed by the renderer (UniverseAnimator).

CHANGE LOG – “Space-flight” Update
––––––––––––––––––––––––––––––––––
• All **non-planet** sprites now travel **away from the viewport centre**.
  Their `angle` is therefore no longer an arbitrary random value but the polar
  angle of the vector that points from the centre towards their deterministic
  off-centre spawn location.  This guarantees every sprite drifts further out
  into space, reinforcing the tunnel / fly-through effect.
• Fallback:  If a sprite happens to spawn exactly (or *very* close) on the
  centre, we fall back to a random angle so we don’t end up with `NaN` caused
  by `atan2(0, 0)`.
• The planet logic remains unchanged – it stays centred and its rotation is
  still driven by the dedicated constants.

NOTE (Universe Fix – Phase 1 · Data Tables)
-----------------------------------------
Added `SPAWN_RADIUS` and `RADIAL_SPEED` per-layer constant tables as the first
step of the *Full coordinate-system refactor* outlined in `universe_fix.md`.
They are *place-holder* values for now and will be hooked up in a subsequent
commit where the world-space properties (`x`, `y`, `v_r`, …) are introduced.

UPDATE (Universe Fix – Phase 2 · World-space Props)
--------------------------------------------------
Extended each `SpriteInstance` with *deterministic* **world-space initial
properties** so the upcoming frame loop refactor can move to true physics soon.
The new immutable props are:
  • `x`, `y`, `z`   – position in world units (WU).
  • `v_r`           – radial speed in world units s⁻¹ (layer-specific).
This completes Task 2 of section E in `universe_fix.md`.
*/

// ---------------------------------------------------------------------------
// Imports --------------------------------------------------------------------
// ---------------------------------------------------------------------------
import { rand } from "./deterministic_rng.js";
import { layers_config } from "./layers_model.js";

// ---------------------------------------------------------------------------
// Constants ------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Number of sprite instances we want per layer.
const SPRITE_COUNT_PER_LAYER = Object.freeze({
  cosmic_fog:     6,
  galaxy_streams: 8,
  nebulae:        10,
  star_clusters:  6,
  planet:         1, // single hero sprite
});

// ---------------------------------------------------------------------------
// NEW – World-space spawn & physics tables (Phase 1) -------------------------
// ---------------------------------------------------------------------------
// The values are expressed in *world units* where 1 WU ≈ 1 CSS px at Z = 0.
// They will be tuned visually later – for now we use a simple linear ladder
// so that inner layers spawn closer to the centre and move slightly faster.

// Radius of the annulus on which sprites initially spawn (world-space).
const SPAWN_RADIUS = Object.freeze({
  cosmic_fog:     1.0, // furthest out – should feel enveloping
  galaxy_streams: 0.8,
  nebulae:        0.6,
  star_clusters:  0.4,
  planet:         0.0, // planet stays dead-centre
});

// Constant radial speed (world-units s⁻¹) – tuned coarsely for now.
const RADIAL_SPEED = Object.freeze({
  cosmic_fog:     0.12,
  galaxy_streams: 0.18,
  nebulae:        0.25,
  star_clusters:  0.30,
  planet:         0.00, // planet does not drift
});

// Jitter ranges --------------------------------------------------------------
const MAX_Z_JITTER        = 0.8;   // pseudo-Z units (sym. around 0)
const TWO_PI              = Math.PI * 2;
const SPAWN_OFFSET_RANGE  = 0.4;   // ±40 % of viewport shortest side (norm.)

// Planet specific ------------------------------------------------------------
// NOTE: These values are *not* generated via rand() so they stay fully under
// developer control and are independent of the deterministic RNG sequence.
const PLANET_BASE_ROTATION_RAD = 0;     // tweak as desired (rad)
const PLANET_ROT_SPEED_RAD_S   = 0.02;  // ≈ 1.1° per second

// Non-planet rotation dynamics ----------------------------------------------
const NON_PLANET_MAX_ROT_SPEED_RAD_S = 0.06; // ≈ 3.4° s⁻¹ – tweak as desired

// ---------------------------------------------------------------------------
// Types (JSDoc) --------------------------------------------------------------
// ---------------------------------------------------------------------------
/**
 * @typedef {Object} SpriteInstance
 * @property {string}       id            – unique deterministic ID (e.g. "nebulae#3")
 * @property {string}       layer         – logical layer name
 * @property {string}       img_url       – asset URL
 * @property {ImageBitmap}  bitmap        – reference from `bitmaps_map`
 * @property {number}       angle         – polar drift direction in radians (0 … 2π)
 * @property {number}       z_jitter      – additive Z offset around layer base Z
 * @property {number}       base_rotation – initial rotation in radians (for planet)
 * @property {number}       rot_speed     – rotation speed in rad/s  (planet or general sprite)
 * @property {number}       spawn_offset_x – normalised X offset (−0.4…+0.4, planet=0) – DEPRECATED
 * @property {number}       spawn_offset_y – normalised Y offset (−0.4…+0.4, planet=0) – DEPRECATED
 *
 * // New world-space props (Phase 2)
 * @property {number}       x             – initial world-space X (WU)
 * @property {number}       y             – initial world-space Y (WU)
 * @property {number}       z             – initial world-space Z (WU). Will stay fixed.
 * @property {number}       v_r           – constant radial speed (WU s⁻¹)
 */

// ---------------------------------------------------------------------------
// Helper – deterministic cycle through image list ---------------------------
// ---------------------------------------------------------------------------
function _pick_bitmap_for_index(files, index) {
  // Scramble selection slightly – still deterministic.
  const offset = Math.floor(rand() * files.length);
  const idx    = (index + offset) % files.length;
  return files[idx];
}

// ---------------------------------------------------------------------------
// Public – factory -----------------------------------------------------------
// ---------------------------------------------------------------------------
/**
 * Builds the *frozen* array of sprite instances for all layers.
 *
 * @param {Map<string, ImageBitmap>} bitmaps_map – resolved `ImageBitmap`s from pre-loader.
 * @returns {Readonly<SpriteInstance[]>}
 */
function generate_sprite_instances(bitmaps_map) {
  /** @type {SpriteInstance[]} */
  const instances = [];

  for (const layer_cfg of layers_config) {
    const layer_name  = layer_cfg.name;
    const files       = layer_cfg.files;
    const desired_cnt = SPRITE_COUNT_PER_LAYER[layer_name] ?? 0;

    for (let i = 0; i < desired_cnt; i++) {
      const img_url = _pick_bitmap_for_index(files, i);
      const bmp     = bitmaps_map.get(img_url);

      if (!bmp) {
        console.warn(`[sprite_instance_manager] Missing ImageBitmap for URL '${img_url}' – sprite skipped.`);
        continue; // skip sprite but keep determinism
      }

      const id = `${layer_name}#${i}`;
      const is_planet = layer_name === "planet";

      // ---------------------------------------------------------------
      // Spawn offsets (deterministic) – legacy path (will be removed) --
      // ---------------------------------------------------------------
      const spawn_offset_x = is_planet ? 0 : (rand() * 2 - 1) * SPAWN_OFFSET_RANGE;
      const spawn_offset_y = is_planet ? 0 : (rand() * 2 - 1) * SPAWN_OFFSET_RANGE;

      // ---------------------------------------------------------------
      // Drift angle – points **away** from the centre -----------------
      // ---------------------------------------------------------------
      let angle;
      if (is_planet) {
        angle = rand() * TWO_PI; // planet stays centred; direction irrelevant
      } else {
        // Compute radial angle from origin → spawn point.
        if (Math.abs(spawn_offset_x) < 1e-6 && Math.abs(spawn_offset_y) < 1e-6) {
          // Extremely unlikely but guard against 0/0.
          angle = rand() * TWO_PI;
        } else {
          angle = Math.atan2(spawn_offset_y, spawn_offset_x);
        }
      }

      // ---------------------------------------------------------------------
      // NEW – World-space properties ----------------------------------------
      // ---------------------------------------------------------------------
      const r_spawn = SPAWN_RADIUS[layer_name] ?? 0; // world-space radius
      const v_r     = RADIAL_SPEED[layer_name] ?? 0; // constant outward speed

      const x = Math.cos(angle) * r_spawn;
      const y = Math.sin(angle) * r_spawn;
      const z = 0; // All layers lie on the same Z plane for now; camera moves.

      instances.push(Object.freeze({
        // Identity & visuals -------------------------------------------------
        id,
        layer: layer_name,
        img_url,
        bitmap: bmp,

        // Legacy (to be removed in Phase 3) ---------------------------------
        spawn_offset_x,
        spawn_offset_y,

        // Orientation / jitter ---------------------------------------------
        angle,
        z_jitter: (rand() * 2 - 1) * MAX_Z_JITTER,
        base_rotation: is_planet ? PLANET_BASE_ROTATION_RAD : rand() * TWO_PI,
        rot_speed:     is_planet ? PLANET_ROT_SPEED_RAD_S   : (rand() * 2 - 1) * NON_PLANET_MAX_ROT_SPEED_RAD_S,

        // New world-space props ---------------------------------------------
        x,
        y,
        z,
        v_r,
      }));
    }
  }

  return Object.freeze(instances);
}

// ---------------------------------------------------------------------------
// Dev-time diagnostic --------------------------------------------------------
// ---------------------------------------------------------------------------
if (typeof window !== "undefined") {
  window.generate_sprite_instances = generate_sprite_instances;
}

export {
  generate_sprite_instances,
  PLANET_BASE_ROTATION_RAD,
  PLANET_ROT_SPEED_RAD_S,
  NON_PLANET_MAX_ROT_SPEED_RAD_S,
  // Export the new tables so they can be consumed by the upcoming refactor.
  SPAWN_RADIUS,
  RADIAL_SPEED,
};
