"use strict";
/*
Layers Model – Early Universe Formation V2
-----------------------------------------
Builds and exports the deterministic `layers_config` array that describes every
visual layer used in the final multi-stage zoom-through animation.

Responsibilities (matches *Task 1 · Data Model & Config* in
`multi_layer_animation_progress.md`):
  1. Derive, for each logical layer, the list of asset URLs from the canonical
     `asset_manifest` (imported from `preloader_module.js`).
  2. Shuffle the file list *deterministically* using the seeded `rand()` helper
     so that a given seed always yields the exact same per-layer order while
     different seeds create variety.
  3. Freeze every nested structure so that accidental run-time mutations can be
     caught early during development.
  4. Export a single frozen constant – `layers_config` – which other modules
     (timeline engine, renderer, debug helpers) can import.

No side-effects beyond defining the constant.
*/

// ---------------------------------------------------------------------------
// Imports --------------------------------------------------------------------
// ---------------------------------------------------------------------------
import { rand } from "./deterministic_rng.js";
import { asset_manifest } from "./preloader_module.js";

// ---------------------------------------------------------------------------
// Helper – deterministic shuffle --------------------------------------------
// ---------------------------------------------------------------------------
/**
 * Returns a *new* array shuffled using the Fisher-Yates algorithm driven by the
 * global deterministic `rand()` PRNG. The input array is left untouched.
 *
 * @template T
 * @param {readonly T[]} src – the source array (will *not* be mutated)
 * @returns {T[]} – new, shuffled array
 */
function shuffle_deterministically(src) {
  const a = src.slice(); // shallow copy
  for (let i = a.length - 1; i > 0; i--) {
    // `rand()` ∈ [0,1) so multiplying by (i+1) is safe.
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------------------
// Constants ------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Logical layer → manifest path signature pairs. This table allows us to
// maintain the mapping in one single, obvious location.
const LAYERS_DECL = [
  { name: "cosmic_fog", path_sub: "/cosmic_fog/" },
  { name: "galaxy_streams", path_sub: "/galaxy_streams/" },
  { name: "nebulae", path_sub: "/nebulae/" },
  { name: "star_clusters", path_sub: "/star_clusters/" },
  { name: "alien_planet", path_sub: "/alien_planet/" },
];

/**
 * @typedef {Object} LayerConfig
 * @property {string}   name   – logical identifier (e.g. "nebulae")
 * @property {string[]} files  – *deterministically shuffled* list of asset URLs
 */

/** @type {LayerConfig[]} */
const layers_config = LAYERS_DECL.map(({ name, path_sub }) => {
  const urls = asset_manifest.filter((u) => u.includes(path_sub));

  if (urls.length === 0) {
    console.warn(`[layers_model] Layer '${name}' has no matching assets – check asset_manifest & paths.`);
  }

  return Object.freeze({
    name,
    files: Object.freeze(shuffle_deterministically(urls)),
  });
});

Object.freeze(layers_config);

// Dev-time diagnostic --------------------------------------------------------
if (typeof window !== "undefined") {
  window.layers_config = layers_config;
}

export { layers_config };
