"use strict";
/*
Sprite Instance Manager – Early Universe Formation V2
----------------------------------------------------
Creates the **deterministic, per-layer sprite instance list** that will be
consumed by the renderer (UniverseAnimator).

Update 2024-06-XX
––––––––––––––––––
The rotation of the *planet* sprite must now be fully controllable and no
longer seeded via the global RNG.  Two explicit constants have therefore been
introduced:
  • PLANET_BASE_ROTATION_RAD   – starting angle (rad)
  • PLANET_ROT_SPEED_RAD_S     – angular velocity (rad/s)
These can be tweaked at build-time without affecting the deterministic random
sequence that governs all other sprite properties.

Fulfils *Task 3 · Sprite Instance Management* of
`multi_layer_animation_progress.md`.
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

// Jitter ranges --------------------------------------------------------------
const MAX_Z_JITTER = 0.8;             // pseudo-Z units (sym. around 0)
const TWO_PI       = Math.PI * 2;

// Planet specific ------------------------------------------------------------
// NOTE: These values are *not* generated via rand() so they stay fully under
// developer control and are independent of the deterministic RNG sequence.
const PLANET_BASE_ROTATION_RAD = 0;     // tweak as desired (rad)
const PLANET_ROT_SPEED_RAD_S   = 0.02;  // ≈ 1.1° per second

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
 * @property {number}       rot_speed     – rotation speed in rad/s  (for planet)
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

      instances.push(Object.freeze({
        id,
        layer: layer_name,
        img_url,
        bitmap: bmp,
        angle: rand() * TWO_PI,
        z_jitter: (rand() * 2 - 1) * MAX_Z_JITTER,
        base_rotation: is_planet ? PLANET_BASE_ROTATION_RAD : rand() * TWO_PI,
        rot_speed:     is_planet ? PLANET_ROT_SPEED_RAD_S   : 0,
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

export { generate_sprite_instances, PLANET_BASE_ROTATION_RAD, PLANET_ROT_SPEED_RAD_S };
