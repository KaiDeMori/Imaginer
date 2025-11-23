
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
// Fade from white, then start asset animation
window.addEventListener('DOMContentLoaded', () => {
  const white_fade_overlay = document.getElementById('white_fade_overlay');
  const universe_seed = 1337; // You can change this to any integer for a different universe
  const asset_paths = window.asset_paths;
  if (!asset_paths) {
    console.error('asset_paths not found on window. Please export asset_paths from universe_assets_loader.js');
    return;
  }
  let total_images = 0;
  let loaded_images = 0;
  let assets_loaded = false;
  let min_white_time_passed = false;
  Object.values(asset_paths).forEach(arr => total_images += arr.length);

  function start_cinematic() {
    if (!assets_loaded || !min_white_time_passed) return;
    // Draw all images to DOM while still in pure white
    add_images_to_layer(
      '.galaxy_streams_layer',
      asset_paths['galaxy_streams'],
      universe_seed + 2 // offset for layer
    );
    add_images_to_layer(
      '.cosmic_fog_layer',
      asset_paths['cosmic_fog'],
      universe_seed + 1 // offset for layer
    );
    // Wait for browser to paint all images, then fade out white
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (white_fade_overlay) {
          white_fade_overlay.style.opacity = '0';
          setTimeout(() => {
            white_fade_overlay.style.display = 'none';
          }, 2700); // after fade-out
        }
        animate_camera_move_and_zoom();
        animate_galaxy_streams_parallax(universe_seed);
      }, 0); // allow one paint cycle
    });
  }

  // Start 1s minimum white hold
  setTimeout(() => {
    min_white_time_passed = true;
    start_cinematic();
  }, 1000);

  window.load_universe_assets(function on_asset_loaded({ category, src, img, error }) {
    loaded_images++;
    if (loaded_images === total_images) {
      assets_loaded = true;
      start_cinematic();
    }
  });
});

// Parallax effect for galaxy streams layer, using deterministic randomness for transform
function animate_galaxy_streams_parallax(seed) {
  const galaxy_layer = document.querySelector('.galaxy_streams_layer');
  if (!galaxy_layer) return;
  const rng = make_rng(seed + 100); // offset for parallax
  // Deterministic transform values
  const scale = 1.15 + rng() * 0.2; // 1.15 - 1.35
  const translate_x = -20 + rng() * -30; // -20 to -50 px
  const translate_y = -10 + rng() * -20; // -10 to -30 px
  galaxy_layer.style.transition = 'transform 7s linear';
  galaxy_layer.style.transform = 'scale(1) translate(0px, 0px)';
  setTimeout(() => {
    galaxy_layer.style.transform = `scale(${scale}) translate(${translate_x}px, ${translate_y}px)`;
  }, 200); // after camera starts
}

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
    // Compute style values using deterministic randomness
    const left = 45 + rng() * 10; // 45% - 55%
    const top = 45 + rng() * 10;  // 45% - 55%
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
  camera_viewport.style.transition = 'transform 5s linear';
  camera_viewport.style.transform = 'scale(1) translate(0px, 0px)';

  // Animate to target state (zoom in over 5 seconds)
  setTimeout(() => {
    // Example: zoom in 1.5x and pan slightly right/down
    camera_viewport.style.transform = 'scale(1.5) translate(-60px, -45px)';
  }, 100); // slight delay to ensure transition applies
}
