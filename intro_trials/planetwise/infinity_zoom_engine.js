// Infinity Zoom Animation Engine

// Growth ratio per second
const INFINITY_ZOOM_GROWTH_RATIO = 1.2;

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

function init_zoom_layers(layers_data, images, max_size) {
   // Each layer gets its own scale, starting at 100% for the bottom layer
   zoom_layers = layers_data.map((layer, i) => {
      const image_obj = images[i];
      // Pre-render feathered image for this layer
      const feather_px = Math.max(2, max_size * 0.08); // 8% or at least 2px
      const feathered_image = create_feathered_image_fixed(image_obj, max_size, feather_px);
      return {
         ...layer,
         image_obj,
         feathered_image,
         scale: null // will be set below
      };
   });
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

// Create a feathered version of an image at a given size
function create_feathered_image_fixed(image, size, feather_px) {
   const off_canvas = document.createElement('canvas');
   off_canvas.width = off_canvas.height = size;
   const off_ctx = off_canvas.getContext('2d');
   // Draw image at integer position (no 0.5px shift)
   off_ctx.drawImage(image, 0, 0, size, size);
   // Create mask
   const mask_canvas = document.createElement('canvas');
   mask_canvas.width = mask_canvas.height = size;
   const mask_ctx = mask_canvas.getContext('2d');
   // Solid center
   mask_ctx.fillStyle = 'rgba(0,0,0,1)';
   mask_ctx.fillRect(feather_px, feather_px, size - 2 * feather_px, size - 2 * feather_px);
   // Feathered edges (left, right, top, bottom)
   let grad;
   // Left
   grad = mask_ctx.createLinearGradient(0, 0, feather_px, 0);
   grad.addColorStop(0, 'rgba(0,0,0,0)');
   grad.addColorStop(1, 'rgba(0,0,0,1)');
   mask_ctx.fillStyle = grad;
   mask_ctx.fillRect(0, feather_px, feather_px, size - 2 * feather_px);
   // Right
   grad = mask_ctx.createLinearGradient(size - feather_px, 0, size, 0);
   grad.addColorStop(0, 'rgba(0,0,0,1)');
   grad.addColorStop(1, 'rgba(0,0,0,0)');
   mask_ctx.fillStyle = grad;
   mask_ctx.fillRect(size - feather_px, feather_px, feather_px, size - 2 * feather_px);
   // Top
   grad = mask_ctx.createLinearGradient(0, 0, 0, feather_px);
   grad.addColorStop(0, 'rgba(0,0,0,0)');
   grad.addColorStop(1, 'rgba(0,0,0,1)');
   mask_ctx.fillStyle = grad;
   mask_ctx.fillRect(feather_px, 0, size - 2 * feather_px, feather_px);
   // Bottom
   grad = mask_ctx.createLinearGradient(0, size - feather_px, 0, size);
   grad.addColorStop(0, 'rgba(0,0,0,1)');
   grad.addColorStop(1, 'rgba(0,0,0,0)');
   mask_ctx.fillStyle = grad;
   mask_ctx.fillRect(feather_px, size - feather_px, size - 2 * feather_px, feather_px);
   // Apply mask to offscreen image
   off_ctx.globalCompositeOperation = 'destination-in';
   off_ctx.drawImage(mask_canvas, 0, 0, size, size);
   off_ctx.globalCompositeOperation = 'source-over';
   return off_canvas;
}

function draw_zoom_layers() {
   if (!zoom_canvas || !zoom_ctx) return;
   // Clear canvas
   zoom_ctx.clearRect(0, 0, zoom_canvas.width, zoom_canvas.height);
   // Draw from back (island, largest) to front (hut, smallest)
   const drawn_images = [];
   for (let i = 0; i < zoom_active_layers.length; i++) {
      const layer = zoom_active_layers[i];
      if (!layer.image_obj || !layer.feathered_image) continue;
      // Calculate size to draw
      const min_dim = Math.min(zoom_canvas.width, zoom_canvas.height);
      const draw_size = min_dim * layer.scale;
      // Skip if the layer is too small to render
      if (draw_size < INFINITY_ZOOM_MINIMUM_RENDER_SIZE) continue;
      drawn_images.push(layer.image);
      const x = (zoom_canvas.width - draw_size) / 2;
      const y = (zoom_canvas.height - draw_size) / 2;
      // Use pre-rendered feathered image for this layer, scale to draw_size
      zoom_ctx.drawImage(layer.feathered_image, x, y, draw_size, draw_size);
   }
}

function update_zoom_layers(dt) {
   // Exponential scaling for all active layers
   for (let i = 0; i < zoom_active_layers.length; i++) {
      zoom_active_layers[i].scale *= Math.exp(INFINITY_ZOOM_GROWTH_CONSTANT * dt);
      // Only act if this is not the bottom-most layer and more than one layer remains
      if (zoom_active_layers.length > 1 && i > 0 && layer_covers_viewport_with_feather(zoom_active_layers[i])) {
         const child_name = zoom_active_layers[i].image || `Layer ${i}`;
         const parent_name = zoom_active_layers[i - 1].image || `Layer ${i - 1}`;
         log(`'${child_name}' now covers the viewport (including feather). Parent '${parent_name}' removed.`);
         zoom_active_layers.splice(i - 1, 1);
         i--; // Adjust index after removal
         continue; // Skip re-evaluating the current layer
      }
   }
   // Remove the topmost (currently visible, smallest) layer if it fills the viewport,
   // but never remove the last remaining layer
   while (zoom_active_layers.length > 2) {
      const top = zoom_active_layers[zoom_active_layers.length - 1];
      if (layer_covers_viewport(top)) {
         zoom_active_layers.pop();
         log('Top layer removed. Layers left: ' + zoom_active_layers.length);
      } else {
         break;
      }
   }
}

// Check if a layer completely covers the viewport, including its feathered border
function layer_covers_viewport_with_feather(layer) {
   const min_dim = Math.min(zoom_canvas.width, zoom_canvas.height);
   const draw_size = layer.scale * min_dim;
   // Use the same feather_px logic as in pre-rendering
   const feather_px = Math.max(2, Math.max(zoom_canvas.width, zoom_canvas.height) * 0.08);
   // The image covers the viewport if the solid part (excluding feather) covers the viewport
   // But for removal, we want the feathered edge to be outside the viewport, so:
   return (draw_size - 2 * feather_px) >= zoom_canvas.width && (draw_size - 2 * feather_px) >= zoom_canvas.height;
}

function zoom_animation_frame(ts) {
   if (!zoom_animation_running) return;
   if (zoom_last_timestamp === null) zoom_last_timestamp = ts;
   const dt = (ts - zoom_last_timestamp) / 1000; // seconds
   zoom_last_timestamp = ts;
   update_zoom_layers(dt);
   draw_zoom_layers();
   // End if only one layer left and it fills the viewport (including feathered border)
   if (zoom_active_layers.length === 1) {
      const top = zoom_active_layers[0];
      if (layer_covers_viewport_with_feather(top)) {
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
   const max_size = Math.max(canvas.width, canvas.height);
   init_zoom_layers(layers_data, images, max_size);

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
