// Infinity Zoom – WebGL core (skeleton)
// This is a starting point for the WebGL infinity zoom experiment.

// Placeholder for LAYERS_DATA (replace with your own images)
const LAYERS_DATA = [
   { zoom: 25, image: '60_alien_island.png' },
   { zoom: 25, image: '70_alien_forest.png' },
   { zoom: 25, image: '80_alien_village.png' },
   { zoom: 25, image: '90_alien_hut.png' }
];

// Main entry point
window.addEventListener('DOMContentLoaded', () => {
   const canvas = document.getElementById('zoom-canvas');
   const gl = canvas.getContext('webgl2');
   if (!gl) {
      alert('WebGL2 not supported.');
      return;
   }
   // TODO: Implement resize, image preloading, texture upload, shader setup, animation loop, etc.
   // This is just a skeleton for now.
   resizeCanvasToDisplaySize(canvas);
   window.addEventListener('resize', () => resizeCanvasToDisplaySize(canvas));
});

function resizeCanvasToDisplaySize(canvas) {
   const dpr = window.devicePixelRatio || 1;
   const width = Math.round(window.innerWidth * dpr);
   const height = Math.round(window.innerHeight * dpr);
   if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
   }
}
