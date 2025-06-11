
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

// --- Universe asset loading moved to universe_assets_loader.js --- 
// Fade from white, then start asset animation
window.addEventListener('DOMContentLoaded', () => {
  const white_fade_overlay = document.getElementById('white_fade_overlay');
  if (white_fade_overlay) {
    setTimeout(() => {
      white_fade_overlay.style.opacity = '0';
    }, 100); // slight delay for effect
    setTimeout(() => {
      white_fade_overlay.style.display = 'none';
    }, 2700); // after fade-out
  }
  if (typeof window.load_and_animate_universe_assets === 'function') {
    setTimeout(() => {
      window.load_and_animate_universe_assets(make_rng);
    }, 700); // start universe animation after fade begins
  }
});
