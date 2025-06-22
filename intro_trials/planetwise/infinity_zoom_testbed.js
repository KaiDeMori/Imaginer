// infinity_zoom_testbed.js
// Basic skeleton for Infinity Zoom animation

// --- Config ---
const IMAGE_FOLDER = 'zoom_images'; // Folder containing zoom images
const LAYERS_DATA = [
   { zoom: 25, image: '60_alien_island.png' },
   { zoom: 25, image: '70_alien_forest.png' },
   { zoom: 25, image: '80_alien_village.png' },
   { zoom: 25, image: '90_alien_hut.png' },
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

// Preload images first, then setup canvas and start animation
window.onload = function () {
   preload_images(LAYERS_DATA, function (loaded_images) {
      images = loaded_images;
      log_loaded_images(images);
      setup_canvas();
      animation_loop();
   });
};
