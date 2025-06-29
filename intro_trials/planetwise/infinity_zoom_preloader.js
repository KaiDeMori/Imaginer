
// Image preloader module for infinity zoom
let images = [];
let images_loaded = false;
let image_load_callbacks = [];

function preload_images(layer_data, image_folder = 'zoom_images') {
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
   if (typeof log === 'function') log(`Loading ${total} images...`);
   layer_data.forEach((layer, i) => {
      const img = new Image();
      img.onload = () => {
         images[i] = img;
         loaded++;
         if (typeof log === 'function') log(`[${loaded}/${total}] → ${img.src}`);
         if (loaded === total) {
            images_loaded = true;
            if (typeof log === 'function') log(`Loaded ${images.length} images!`);
            image_load_callbacks.forEach(cb => cb(images));
            image_load_callbacks = [];
         }
      };
      img.src = `${image_folder}/${layer.image}`;
   });
}

function on_images_loaded(callback) {
   if (images_loaded) {
      callback(images);
   } else {
      image_load_callbacks.push(callback);
   }
}

// Export for use in other scripts
window.infinity_zoom_preloader = {
   preload_images,
   on_images_loaded
};
