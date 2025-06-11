
// early_universe_formation.js

// --- Single source of deterministic randomness ---
function seeded_random(seed) {
  let t = seed += 0x132B79F5;
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
// --- Seed management and console utility ---
const SEED_STORAGE_KEY = 'early_universe_seed';

function get_current_seed() {
  let seed = parseInt(localStorage.getItem(SEED_STORAGE_KEY), 10);
  if (isNaN(seed)) {
    seed = 42;
    localStorage.setItem(SEED_STORAGE_KEY, seed);
  }
  return seed;
}

function set_current_seed(new_seed) {
  localStorage.setItem(SEED_STORAGE_KEY, new_seed);
}

// Call this in the browser console to change the seed and see the new value

function generate_random_seed() {
  // Use crypto if available for better randomness
  if (window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0];
  }
  // Fallback to Math.random
  return Math.floor(Math.random() * 0xFFFFFFFF);
}

function change_and_show_seed(new_seed) {
  if (typeof new_seed === 'undefined') {
    new_seed = generate_random_seed();
  }
  set_current_seed(new_seed);
  console.log('New seed set:', new_seed);
  return new_seed;
}

window.change_and_show_seed = change_and_show_seed;

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
  // Start camera movement/zoom immediately, before fade to black
  animate_camera_move_and_zoom();

  // Add multiple cosmic fog images using a generic function
  setTimeout(() => {
    add_images_to_layer(
      '.cosmic_fog_layer',
      [
        '../assets/ai_universe/cosmic_fog/big_01.png',
        '../assets/ai_universe/cosmic_fog/big_02.png',
        '../assets/ai_universe/cosmic_fog/big_03.png',
        '../assets/ai_universe/cosmic_fog/big_04.png'
      ],
      get_current_seed() // use seed from localStorage
    );
  }, 400); // before camera movement
});

// Generic function to add images to a layer with computed styles
function add_images_to_layer(layer_selector, image_list, rng_seed) {
  const layer = document.querySelector(layer_selector);
  if (!layer) return;
  const rng = make_rng(rng_seed);
  image_list.forEach((img_src, i) => {
    const img = document.createElement('img');
    img.src = img_src;
    img.alt = `Layer Image ${i+1}`;
    img.style.position = 'absolute';
    // Spread images out even more: 5% - 95%
    const left = 5 + rng() * 90; // 5% - 95%
    const top = 5 + rng() * 90;  // 5% - 95%
    const scale = 1.0 + rng() * 0.25; // 1.0 - 1.25
    const rotate = -20 + rng() * 40; // -20deg to +20deg
    const opacity = 0.6 + rng() * 0.3; // 0.6 - 0.9
    const width = 70 + rng() * 20; // 70vw - 90vw
    img.style.left = `${left}%`;
    img.style.top = `${top}%`;
    img.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${rotate}deg)`;
    img.style.opacity = opacity;
    img.style.pointerEvents = 'none';
    img.style.width = `${width}vw`;
    img.style.height = 'auto';
    layer.appendChild(img);
  });
}

// Camera movement/zoom logic
function animate_camera_move_and_zoom() {
  const camera_viewport = document.getElementById('camera_viewport');
  if (!camera_viewport) return;

  // Initial state
  camera_viewport.style.transition = 'transform 2s linear';
  camera_viewport.style.transform = 'scale(1) translate(0px, 0px)';

  // Animate to target state (zoom in over 2 seconds)
  setTimeout(() => {
    // Example: zoom in 1.5x and pan slightly right/down
    camera_viewport.style.transform = 'scale(1.5) translate(-60px, -45px)';
  }, 100); // slight delay to ensure transition applies
}
