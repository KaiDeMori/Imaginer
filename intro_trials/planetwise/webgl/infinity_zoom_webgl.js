// Infinity Zoom – WebGL Engine (initial integration with preloader)

// Example LAYERS_DATA (should match your actual data)
const LAYERS_DATA = [
   { zoom: 25, image: '60_alien_island.png' },
   { zoom: 25, image: '70_alien_forest.png' },
   { zoom: 25, image: '80_alien_village.png' },
   { zoom: 25, image: '90_alien_hut.png' },
   { zoom: 25, image: '100_alien_closeup.png' },
];

window.addEventListener('DOMContentLoaded', () => {
   const canvas = document.getElementById('zoom-canvas');
   // Start preloading images as early as possible
   window.infinity_zoom_preloader.preload_images(LAYERS_DATA, '../zoom_images');
   window.infinity_zoom_preloader.on_images_loaded((images) => {
      // At this point, images[] is ready and matches LAYERS_DATA order
      log('[WebGL] All images loaded, starting engine...');
      //TBD
   });
});
