 
const IMAGE_FOLDER = 'zoom_images';
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

function animation_loop() {
   ctx.clearRect(0, 0, canvas.width, canvas.height);
   if (images.length > 0 && images[0].complete) {
      const img = images[0];
      const viewport_w = canvas.width * 0.8;
      const viewport_h = canvas.height * 0.8;
      const img_aspect = img.width / img.height;
      const viewport_aspect = viewport_w / viewport_h;
      let draw_w, draw_h;
      if (img_aspect > viewport_aspect) {
         draw_w = viewport_w;
         draw_h = viewport_w / img_aspect;
      } else {
         draw_h = viewport_h;
         draw_w = viewport_h * img_aspect;
      }
      const x = (canvas.width - draw_w) / 2;
      const y = (canvas.height - draw_h) / 2;
      ctx.drawImage(img, x, y, draw_w, draw_h);
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
