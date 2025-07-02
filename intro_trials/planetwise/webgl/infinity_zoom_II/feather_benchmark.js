// feather_benchmark.js
// Utility to benchmark GPU feathering performance for a set of images
// Usage: Call feather_benchmark(LAYERS_DATA, image_folder, feather_size)

function feather_benchmark(layer_data, image_folder = 'zoom_images', feather_size = 32) {
   const feathered_canvases = [];
   const timings = [];
   if (!window.infinity_zoom_preloader) {
      throw new Error('infinity_zoom_preloader not loaded');
   }
   window.infinity_zoom_preloader.preload_images(layer_data, image_folder);
   window.infinity_zoom_preloader.on_images_loaded(function (images) {
      const t0 = performance.now();
      for (let idx = 0; idx < layer_data.length; ++idx) {
         const t_img = performance.now();
         const feathered = window.create_feathered_image_webgl(images[idx], feather_size);
         const t_done = performance.now();
         feathered_canvases[idx] = feathered;
         timings[idx] = t_done - t_img;
      }
      const t1 = performance.now();
      const total = t1 - t0;
      const avg = timings.reduce((a, b) => a + b, 0) / timings.length;
      console.log('Feathered', feathered_canvases.length, 'images.');
      console.log('Total time:', total.toFixed(2), 'ms');
      console.log('Average per image:', avg.toFixed(2), 'ms');
      console.log('Timings:', timings.map(t => t.toFixed(2)));
   });
}

// Export for use in browser console or other scripts
window.feather_benchmark = feather_benchmark;
