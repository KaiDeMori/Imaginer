// infinity_zoom_testbed.js
// Implements the Infinity Zoom Animation Testbed

const IMAGE_FOLDER = 'zoom_images'; // Folder containing zoom images

// Layer data: array of { zoom: percent, image: string }
const LAYER_DATA = [
  { zoom: 50, image: 'planet.png' },
  { zoom: 50, image: 'continent.png' },
  { zoom: 25, image: 'alien.png' },
  { zoom: 10, image: 'detail.png' }
];

const canvas = document.getElementById('zoom_canvas');
const ctx = canvas.getContext('2d');

let images = [];
let loaded_count = 0;
let animation_running = false;

function resize_canvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize_canvas);
resize_canvas();

function preload_images(callback) {
  images = [];
  loaded_count = 0;
  for (let i = 0; i < LAYER_DATA.length; i++) {
    const img = new Image();
    img.src = IMAGE_FOLDER + '/' + LAYER_DATA[i].image;
    img.onload = () => {
      loaded_count++;
      if (loaded_count === LAYER_DATA.length) {
        callback();
      }
    };
    images.push(img);
  }
}

// Animation state
let zoom_progress = 0; // 0=start, increases to LAYER_DATA.length
const ZOOM_SPEED = 0.008; // Adjust for animation speed
const MIN_VISIBLE_SCALE = 0.01; // Minimal threshold for visibility

function draw_frame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Calculate cumulative zooms
  let total_zoom = 1;
  for (let i = 0; i < LAYER_DATA.length; i++) {
    total_zoom *= LAYER_DATA[i].zoom / 100;
  }

  // Determine current zoom factor
  let progress = zoom_progress;
  let current_zoom = 1;
  for (let i = 0; i < Math.floor(progress); i++) {
    current_zoom *= LAYER_DATA[i].zoom / 100;
  }
  let frac = progress - Math.floor(progress);
  if (Math.floor(progress) < LAYER_DATA.length) {
    let next_zoom = LAYER_DATA[Math.floor(progress)].zoom / 100;
    current_zoom *= Math.pow(next_zoom, frac);
  }

  // Draw layers from outermost to innermost
  let draw_zoom = 1;
  for (let i = 0; i < LAYER_DATA.length; i++) {
    let layer_zoom = 1;
    for (let j = 0; j < i; j++) {
      layer_zoom *= LAYER_DATA[j].zoom / 100;
    }
    let layer_frac = Math.max(0, Math.min(1, progress - i));
    if (layer_frac < 1) {
      let next_zoom = LAYER_DATA[i].zoom / 100;
      layer_zoom *= Math.pow(next_zoom, layer_frac);
    } else {
      layer_zoom *= LAYER_DATA[i].zoom / 100;
    }
    if (layer_zoom < MIN_VISIBLE_SCALE) continue;
    draw_layer(images[i], layer_zoom);
  }
}

function draw_layer(img, scale) {
  if (!img.complete) return;
  const w = canvas.width;
  const h = canvas.height;
  const img_w = img.width * scale;
  const img_h = img.height * scale;
  // Center and cover viewport
  const x = (w - img_w) / 2;
  const y = (h - img_h) / 2;
  ctx.drawImage(img, x, y, img_w, img_h);
}

function animate() {
  if (!animation_running) return;
  draw_frame();
  zoom_progress += ZOOM_SPEED;
  if (zoom_progress >= LAYER_DATA.length) {
    zoom_progress = 0;
  }
  requestAnimationFrame(animate);
}

preload_images(() => {
  animation_running = true;
  zoom_progress = 0;
  animate();
});
