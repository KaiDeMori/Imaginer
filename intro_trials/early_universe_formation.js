
// early_universe_formation.js

// --- Single source of deterministic randomness ---
function seeded_random(seed) {
  let t = seed += 0x6D2B79F5;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

// Returns a function that produces deterministic random numbers
function make_rng(seed) {
  let offset = 0;
  return function() {
    return seeded_random(seed + (offset++));
  };
}

// --- General scaffolding for layer-by-layer universe formation ---

// All further logic will be implemented layer by layer, using the single RNG source above.

// Example usage for next steps:
// const rng = make_rng(42);
// let value = rng();

// (Universe formation layers to be implemented below, one at a time)
