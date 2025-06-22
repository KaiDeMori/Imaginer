
// Handles time-based zoom state and animation logic for the infinity zoom testbed.
// All logic is browser-compatible and uses loose_snake_case naming.

/**
 * Tracks the total elapsed time since animation start or last reset.
 * Returns the current elapsed time in milliseconds.
 */
function track_animation_time() {
    // Use a closure to store the start time across calls.
    if (!track_animation_time._start_time) {
        track_animation_time._start_time = performance.now();
    }
    return performance.now() - track_animation_time._start_time;
}

/**
 * Resets the animation timer to start from zero again.
 */
function reset_animation_time() {
    track_animation_time._start_time = performance.now();
}

/**
 * Determines the current zoom state based on elapsed time and zoom factors.
 * Returns an object with visible layer indices and their current scales.
 */
function get_current_zoom_state(elapsed_time, layers_data) {
    // Improved: interpolate scale between previous and current layer's zoom values.
    // Each layer transition takes the same amount of time (e.g., 2000ms per layer)
    const LAYER_DURATION = 2000; // ms per layer (adjust as needed)
    const num_layers = layers_data.length;
    const total_duration = LAYER_DURATION * num_layers;
    // Loop animation
    const t = elapsed_time % total_duration;
    const current_layer = Math.floor(t / LAYER_DURATION);
    const prev_layer = (current_layer - 1 + num_layers) % num_layers;
    const layer_progress = (t % LAYER_DURATION) / LAYER_DURATION;
    // Get zoom values for previous and current layer
    const prev_zoom = layers_data[prev_layer].zoom / 100;
    const curr_zoom = layers_data[current_layer].zoom / 100;
    // Interpolate scale from prev_zoom to curr_zoom
    const scale = prev_zoom + (curr_zoom - prev_zoom) * layer_progress;
    return {
        visible_layers: [current_layer],
        scales: [scale]
    };
}

/**
 * Calculates the absolute scale for a given layer.
 * The scale is the product of all previous layers' zoom values (as fractions).
 * For example, for layer n: scale = 1.0 * (zoom_2/100) * (zoom_3/100) * ... * (zoom_n/100)
 * This ensures each layer is drawn at the correct size relative to the original image.
 * Ensures each new layer grows larger as time progresses.
 */
function get_layer_scale(layer_index, elapsed_time, layers_data) {
    // Each layer transition takes the same amount of time as in get_current_zoom_state
    const LAYER_DURATION = 2000; // ms per layer (should match get_current_zoom_state)
    const num_layers = layers_data.length;
    const total_duration = LAYER_DURATION * num_layers;
    // Loop animation
    const t = elapsed_time % total_duration;
    // For the given layer, find its transition window
    const layer_start_time = layer_index * LAYER_DURATION;
    const layer_end_time = ((layer_index + 1) % num_layers) * LAYER_DURATION;
    // Determine if we are in this layer's transition window
    let scale;
    if (t >= layer_start_time && t < layer_start_time + LAYER_DURATION) {
        // In this layer's transition
        const prev_layer = (layer_index - 1 + num_layers) % num_layers;
        const progress = (t - layer_start_time) / LAYER_DURATION;
        const prev_zoom = layers_data[prev_layer].zoom / 100;
        const curr_zoom = layers_data[layer_index].zoom / 100;
        scale = prev_zoom + (curr_zoom - prev_zoom) * progress;
    } else if (t >= layer_end_time) {
        // After this layer's transition, fully zoomed in
        scale = layers_data[layer_index].zoom / 100;
    } else {
        // Before this layer's transition, not visible
        scale = 0;
    }
    return scale;
}

/**
 * Determines which layers are currently visible (scaled size above threshold).
 * Returns an array of layer indices to be drawn.
 */
function get_visible_layers(elapsed_time, layers_data) {
    // Minimal threshold for visibility (e.g., 0.01 = 1% of original size)
    const MIN_VISIBLE_SCALE = 0.01;
    const visible = [];
    for (let i = 0; i < layers_data.length; i++) {
        const scale = get_layer_scale(i, elapsed_time, layers_data);
        if (scale > MIN_VISIBLE_SCALE) {
            visible.push(i);
        }
    }
    return visible;
}

/**
 * Draws a single image layer, centered and scaled to fill the viewport.
 */
function draw_layer(ctx, image, scale, canvas_width, canvas_height) {
    // Draw the image centered and scaled, preserving aspect ratio.
    // Fill the viewport as much as possible, allow letterboxing if needed.
}

/**
 * Loops through visible layers and draws each using the correct scale.
 */
function draw_layers(ctx, images, visible_layers, elapsed_time, layers_data, canvas_width, canvas_height) {
    // For each visible layer, compute its scale and draw it using draw_layer.
    // Draw from outermost to innermost.
}

/**
 * Main animation loop using requestAnimationFrame.
 * Calls time tracking, zoom state, and drawing functions each frame.
 */
function animation_loop() {
    // Use requestAnimationFrame to loop.
    // Track elapsed time, determine zoom state, and draw visible layers each frame.
    // Reset animation when innermost layer is fully zoomed in.
}
