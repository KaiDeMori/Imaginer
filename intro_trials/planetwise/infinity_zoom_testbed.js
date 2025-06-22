// infinity_zoom_testbed.js
// Basic skeleton for Infinity Zoom animation

// --- Config ---
const IMAGE_FOLDER = 'zoom_images'; // Folder containing zoom images
const LAYER_DATA = [
  // Example: { zoom_factor: 50, image: 'planet.png' },
  // Add your layers here
];

// --- Globals ---
let images = [];
let canvas, ctx;

// --- Preload Images ---
function preload_images(layer_data, callback) {
  let loaded = 0;
  const total = layer_data.length;
  const result = [];
  if (total === 0) callback([]);
  layer_data.forEach((layer, i) => {
    const img = new Image();
    img.onload = () => {
      result[i] = img;
      loaded++;
      if (loaded === total) callback(result);
    };
    img.src = `${IMAGE_FOLDER}/${layer.image}`;
  });
}

// --- Canvas Setup ---
function resize_canvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function setup_canvas() {
  canvas = document.getElementById('zoom_canvas');
  ctx = canvas.getContext('2d');
  resize_canvas();
  window.addEventListener('resize', resize_canvas);
}

// --- Animation Loop ---
function animation_loop() {
  // TODO: Implement zoom logic and drawing
  requestAnimationFrame(animation_loop);
}

// --- Init ---
window.onload = function() {
  setup_canvas();
  preload_images(LAYER_DATA, function(loaded_images) {
    images = loaded_images;
    animation_loop();
  });
};
