// Infinity Zoom Engine — Time-Δ Driven Variant
// Implements the animation loop and per-layer scaling as described in the spec.

const LAMBDA = 0.7; // 1/second, controls zoom speed

// Compute cumulative_zoom for each layer (product of zoom/100 up to that layer)
function compute_cumulative_zooms(layers_data) {
   let product = 1.0;
   for (let i = 0; i < layers_data.length; i++) {
      product *= (layers_data[i].zoom / 100);
      layers_data[i].cumulative_zoom = product;
   }
}

// Draw a single layer, centered and scaled to cover the canvas
function draw_layer(img, draw_scale) {
   if (!img) return;
   const w = img.width * draw_scale;
   const h = img.height * draw_scale;
   const x = (canvas.width - w) / 2;
   const y = (canvas.height - h) / 2;
   ctx.drawImage(img, x, y, w, h);
}

// Optionally filter visible layers (here: draw all)
function visible_layers(layers_data, S_outer) {
   // Could filter by minimum size, but for now, return all
   return layers_data;
}

// Main animation loop
let start_time = null;
function zoom_loop(now_ms) {
   if (!start_time) start_time = now_ms;
   const t = (now_ms - start_time) / 1000; // seconds
   const S_outer = Math.exp(-LAMBDA * t);

   ctx.clearRect(0, 0, canvas.width, canvas.height);

   // Draw each layer, outermost first
   for (let i = 0; i < LAYERS_DATA.length; i++) {
      const layer = LAYERS_DATA[i];
      const img = images[i];
      const draw_scale = S_outer / layer.cumulative_zoom;
      draw_layer(img, draw_scale);
   }

   // Looping logic: reset when deepest layer fills viewport
   const deepest = LAYERS_DATA[LAYERS_DATA.length - 1];
   const draw_scale_deepest = S_outer / deepest.cumulative_zoom;
   if (draw_scale_deepest >= 1) {
      start_time = now_ms;
   }

   requestAnimationFrame(zoom_loop);
}

// Entry point: call after images and canvas are ready
function start_infinity_zoom() {
   compute_cumulative_zooms(LAYERS_DATA);
   requestAnimationFrame(zoom_loop);
}

// Start after images are loaded
window.infinity_zoom_preloader.on_images_loaded(() => {
   setup_canvas();
   start_infinity_zoom();
});
