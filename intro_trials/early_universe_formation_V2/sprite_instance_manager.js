"use strict";
/*
Sprite Instance Manager – Early Universe Formation V2
----------------------------------------------------
Creates the **deterministic, per-layer sprite instance list** that will be
consumed by the future renderer (UniverseAnimator upgrade).

Ful-fils *Task 3 · Sprite Instance Management* of
`multi_layer_animation_progress.md`:
  • Generate N sprite instances per layer (configurable, deterministic).
  • Pre-compute per-sprite random offsets (polar angle for XY drift,
    initial Z jitter) – again driven by the global seeded `rand()` helper.
  • Re-use shared `ImageBitmap` references so that multiple sprites that use
    the same PNG do *not* create duplicate VRAM copies.

The module has **zero side-effects** until `generate_sprite_instances()` is
called.  It does *not* start any rendering loops.
*/

// ---------------------------------------------------------------------------
// Imports --------------------------------------------------------------------
// ---------------------------------------------------------------------------
import { rand } from "./deterministic_rng.js";
import { layers_config } from "./layers_model.js";

// ---------------------------------------------------------------------------
// Constants ------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Number of sprite instances we want per layer.  These numbers will likely be
// fine-tuned visually later.  They *must* remain deterministic for a given
// seed, hence we keep them in a constant map.
const SPRITE_COUNT_PER_LAYER = Object.freeze({
  cosmic_fog:     6,
  galaxy_streams: 8,
  nebulae:        10,
  star_clusters:  6,
  planet:         1,  // single hero sprite
});

// Jitter ranges --------------------------------------------------------------
const MAX_Z_JITTER  = 0.8;     // pseudo-Z units (symmetrical around 0)
const MAX_XY_ANGLE  = Math.PI * 2; // full circle for drift direction

// ---------------------------------------------------------------------------
// Types (JSDoc) --------------------------------------------------------------
// ---------------------------------------------------------------------------
/**
 * @typedef {Object} SpriteInstance
 * @property {string}       id        – unique but deterministic ID (e.g. "nebulae#3")
 * @property {string}       layer     – logical layer name (matches layers_config)
 * @property {string}       img_url   – asset URL used for this sprite
 * @property {ImageBitmap}  bitmap    – reference from `bitmaps_map`
 * @property {number}       angle     – polar direction in radians (0 … 2π)
 * @property {number}       z_jitter  – small additive offset applied to the layer's base Z
 */

// ---------------------------------------------------------------------------
// Helper – deterministic cycle through image list ---------------------------
// ---------------------------------------------------------------------------
function _pick_bitmap_for_index(files, index) {
  // Instead of a pure modulus we scramble selection a bit so that consecutive
  // indices don’t always map to the same handful of textures when the sprite
  // count is >> files.length. Still 100 % deterministic.
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
        continue; // skip sprite but continue loop to keep determinism for subsequent ones
      }

      const id = `${layer_name}#${i}`;

      instances.push(Object.freeze({
        id,
        layer: layer_name,
        img_url,
        bitmap: bmp,
        angle: rand() * MAX_XY_ANGLE,          // 0 … 2π
        z_jitter: (rand() * 2 - 1) * MAX_Z_JITTER, // -max … +max
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

export { generate_sprite_instances };
