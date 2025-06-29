
const IMAGE_FOLDER = 'zoom_images';

const LAYERS_DATA = [
   { zoom: 25, image: '60_alien_island.png' },
   { zoom: 25, image: '70_alien_forest.png' },
   { zoom: 25, image: '80_alien_village.png' },
   { zoom: 25, image: '90_alien_hut.png' },
];


let images = [];
let images_loaded = false;
let image_load_callbacks = [];
let canvas, ctx;


function preload_images(layer_data) {
   if (images_loaded) return; // Prevent double loading
   let loaded = 0;
   const total = layer_data.length;
   images = new Array(total);
   if (total === 0) {
      images_loaded = true;
      image_load_callbacks.forEach(cb => cb(images));
      image_load_callbacks = [];
      return;
   }
   log(`Loading ${total} images...`);
   layer_data.forEach((layer, i) => {
      const img = new Image();
      img.onload = () => {
         images[i] = img;
         loaded++;
         log(`[${loaded}/${total}] → ${img.src}`);
         if (loaded === total) {
            images_loaded = true;
            log(`Loaded ${images.length} images!`);
            image_load_callbacks.forEach(cb => cb(images));
            image_load_callbacks = [];
         }
      };
      img.src = `${IMAGE_FOLDER}/${layer.image}`;
   });
}

function on_images_loaded(callback) {
   if (images_loaded) {
      callback(images);
   } else {
      image_load_callbacks.push(callback);
   }
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