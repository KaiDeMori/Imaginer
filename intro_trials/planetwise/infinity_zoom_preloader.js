// Image preloader module for infinity zoom
let images = [];
let images_loaded = false;
let image_load_callbacks = [];

function preload_images(layer_data, image_folder = 'zoom_images') {
   if (images_loaded) {
      log('[preload_images] Images already loaded, skipping.');
      return; // Prevent double loading
   }
   let loaded = 0;
   const total = layer_data.length;
   images = new Array(total);
   if (total === 0) {
      images_loaded = true;
      log('[preload_images] No images to load.');
      image_load_callbacks.forEach(cb => cb(images));
      image_load_callbacks = [];
      return;
   }
   log(`[preload_images] Loading ${total} images...`);
   layer_data.forEach((layer, i) => {
      const img = new Image();
      img.onload = () => {
         images[i] = img;
         loaded++;
         log(`[preload_images] [${loaded}/${total}] loaded: ${img.src} (${img.width}x${img.height})`);
         if (loaded === total) {
            images_loaded = true;
            log(`[preload_images] All ${images.length} images loaded!`);
            image_load_callbacks.forEach(cb => cb(images));
            image_load_callbacks = [];
         }
      };
      img.onerror = (e) => {
         log(`[preload_images] ERROR loading image: ${img.src}`);
      };
      img.src = `${image_folder}/${layer.image}`;
      log(`[preload_images] Started loading: ${img.src}`);
   });
}

function on_images_loaded(callback) {
   if (images_loaded) {
      log('[on_images_loaded] Images already loaded, invoking callback immediately.');
      callback(images);
   } else {
      log('[on_images_loaded] Images not yet loaded, queuing callback.');
      image_load_callbacks.push(callback);
   }
}

// Export for use in other scripts
window.infinity_zoom_preloader = {
   preload_images,
   on_images_loaded
};