// All animation logic is delegated to infinity_zoom_animator.js
// This file only handles image loading, canvas setup, and drawing using the animator's state/scale functions.
 
const IMAGE_FOLDER = 'zoom_images';

// Each layer's "zoom" value specifies how much smaller (in percent) this layer is compared to the previous one.
// The absolute scale for a layer is the product of all previous zooms (as fractions).
// For example, if zooms are [50, 50, 25], then the scale for the third layer is 1.0 * 0.5 * 0.5 * 0.25 = 0.0625.
const LAYERS_DATA = [
   { zoom: 25, image: '60_alien_island.png' },
   { zoom: 25, image: '70_alien_forest.png' },
   { zoom: 25, image: '80_alien_village.png' },
   { zoom: 25, image: '90_alien_hut.png' },
];

let images = [];
let canvas, ctx;

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


function draw_layer(image, scale) {
    // Center and scale image to fill viewport, preserving aspect ratio
    const iw = image.width;
    const ih = image.height;
    const vw = canvas.width;
    const vh = canvas.height;
    const aspect_img = iw / ih;
    const aspect_view = vw / vh;
    let draw_w, draw_h;
    if (aspect_img > aspect_view) {
        draw_w = vw * scale;
        draw_h = draw_w / aspect_img;
    } else {
        draw_h = vh * scale;
        draw_w = draw_h * aspect_img;
    }
    ctx.save();
    ctx.translate(vw / 2, vh / 2);
    ctx.drawImage(image, -draw_w / 2, -draw_h / 2, draw_w, draw_h);
    ctx.restore();
}

function animation_loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const elapsed_time = track_animation_time();
    const visible_layers = get_visible_layers(elapsed_time, LAYERS_DATA);
    for (const i of visible_layers) {
        const scale = get_layer_scale(i, elapsed_time, LAYERS_DATA);
        draw_layer(images[i], scale);
    }
    requestAnimationFrame(animation_loop);
}

window.onload = function () {
   preload_images(LAYERS_DATA, function (loaded_images) {
      images = loaded_images;
      log_loaded_images(images);
      log_animation_loop_started();
      setup_canvas();
      animation_loop();
   });
};
