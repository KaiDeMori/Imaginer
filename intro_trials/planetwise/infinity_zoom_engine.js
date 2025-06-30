// Infinity Zoom Animation Engine

// Growth ratio per second
const INFINITY_ZOOM_GROWTH_RATIO = 2;

// Growth constant for exponential scaling
const INFINITY_ZOOM_GROWTH_CONSTANT = Math.log(INFINITY_ZOOM_GROWTH_RATIO);

// Minimum size for a layer to be rendered in pixels
const INFINITY_ZOOM_MINIMUM_RENDER_SIZE = 3;


let zoom_layers = [];
let zoom_active_layers = [];
let zoom_animation_running = false;
let zoom_last_timestamp = null;
let zoom_canvas = null;
let zoom_ctx = null;

function init_zoom_layers(layers_data, images) {
   // Each layer gets its own scale, starting at 100% for the bottom layer
   zoom_layers = layers_data.map((layer, i) => ({
      ...layer,
      image_obj: images[i],
      // Initial scale: 1 for the bottom layer, then multiplied by zoom for each above
      scale: null // will be set below
   }));
   // Set initial scales: first entry (island) is 1, each next is cumulative product of previous zooms
   let scale = 1;
   for (let i = 0; i < zoom_layers.length; i++) {
      zoom_layers[i].scale = scale;
      if (i < zoom_layers.length - 1) {
         scale *= zoom_layers[i].zoom / 100;
      }
   }
   // Start with all layers active
   zoom_active_layers = zoom_layers.slice();
}

function draw_zoom_layers() {
   if (!zoom_canvas || !zoom_ctx) return;
   // Clear canvas
   zoom_ctx.clearRect(0, 0, zoom_canvas.width, zoom_canvas.height);
   // Draw from back (island, largest) to front (hut, smallest)
   const drawn_images = [];
   for (let i = 0; i < zoom_active_layers.length; i++) {
      const layer = zoom_active_layers[i];
      if (!layer.image_obj) continue;
      // Calculate size to draw
      const min_dim = Math.min(zoom_canvas.width, zoom_canvas.height);
      const draw_size = min_dim * layer.scale;
      // Skip if the layer is too small to render
      if (draw_size < INFINITY_ZOOM_MINIMUM_RENDER_SIZE) continue;
      drawn_images.push(layer.image);
      const x = (zoom_canvas.width - draw_size) / 2;
      const y = (zoom_canvas.height - draw_size) / 2;
      zoom_ctx.drawImage(layer.image_obj, x, y, draw_size, draw_size);
   }
}

function update_zoom_layers(dt) {
   // Exponential scaling for all active layers
   for (let i = 0; i < zoom_active_layers.length; i++) {
      zoom_active_layers[i].scale *= Math.exp(INFINITY_ZOOM_GROWTH_CONSTANT * dt);
      // Only act if this is not the bottom-most layer and more than one layer remains
      if (zoom_active_layers.length > 1 && i > 0 && layer_covers_viewport(zoom_active_layers[i])) {
         const child_name = zoom_active_layers[i].image || `Layer ${i}`;
         const parent_name = zoom_active_layers[i - 1].image || `Layer ${i - 1}`;
         log(`'${child_name}' now covers the viewport. Parent '${parent_name}' removed.`);
         zoom_active_layers.splice(i - 1, 1);
         i--; // Adjust index after removal
         continue; // Skip re-evaluating the current layer
      }
   }
   // Remove the topmost (currently visible, smallest) layer if it fills the viewport
   while (zoom_active_layers.length > 1) {
      const top = zoom_active_layers[zoom_active_layers.length - 1];
      if (layer_covers_viewport(top)) {
         zoom_active_layers.pop();
         log('Top layer removed. Layers left: ' + zoom_active_layers.length);
      } else {
         break;
      }
   }
}

function zoom_animation_frame(ts) {
   if (!zoom_animation_running) return;
   if (zoom_last_timestamp === null) zoom_last_timestamp = ts;
   const dt = (ts - zoom_last_timestamp) / 1000; // seconds
   zoom_last_timestamp = ts;
   update_zoom_layers(dt);
   draw_zoom_layers();
   // End if only one layer left and it fills the viewport
   if (zoom_active_layers.length === 1) {
      const top = zoom_active_layers[0];
      const min_dim = Math.min(zoom_canvas.width, zoom_canvas.height);
      if (top.scale * min_dim >= min_dim) {
         log('Animation complete.');
         zoom_animation_running = false;
         return;
      }
   }
   requestAnimationFrame(zoom_animation_frame);
}

function start_infinity_zoom(canvas, ctx, layers_data, images) {
   zoom_canvas = canvas;
   zoom_ctx = ctx;
   init_zoom_layers(layers_data, images);
   zoom_animation_running = true;
   zoom_last_timestamp = null;
   log('Animation started.');
   requestAnimationFrame(zoom_animation_frame);
}

// Check if a layer completely covers the viewport
function layer_covers_viewport(layer) {
   const draw_size = layer.scale * Math.min(zoom_canvas.width, zoom_canvas.height);
   return draw_size >= zoom_canvas.width && draw_size >= zoom_canvas.height;
}

// Export for use in other scripts
window.infinity_zoom_engine = {
   start_infinity_zoom
};
