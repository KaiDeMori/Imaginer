
// Handles time-based zoom state and animation logic for the infinity zoom testbed.
// All logic is browser-compatible and uses loose_snake_case naming.
// Logging is handled via the generic log(msg) function.

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
    // Determine which transition is currently active
    const current_transition = Math.floor(t / LAYER_DURATION);
    const transition_progress = (t % LAYER_DURATION) / LAYER_DURATION;

    // Calculate the cumulative product of zooms up to (but not including) this layer
    function get_cumulative_zoom(up_to_index) {
        let product = 1.0;
        for (let i = 0; i < up_to_index; i++) {
            product *= layers_data[i].zoom / 100;
        }
        return product;
    }

    // If this layer is the one currently being zoomed into, interpolate its scale
    if (layer_index === current_transition) {
        // Previous cumulative zoom (up to previous layer)
        const prev_cumulative = get_cumulative_zoom(layer_index);
        // This layer's cumulative zoom (includes this layer)
        const curr_cumulative = get_cumulative_zoom(layer_index + 1);
        // Interpolate between previous and current cumulative zoom
        return prev_cumulative + (curr_cumulative - prev_cumulative) * transition_progress;
    } else if (layer_index < current_transition) {
        // This layer is fully zoomed in (use its cumulative zoom)
        return get_cumulative_zoom(layer_index + 1);
    } else {
        // This layer is not yet visible
        return 0;
    }
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
    // Compute the scaled image size
    const scaled_width = image.width * scale;
    const scaled_height = image.height * scale;

    // Compute the fitting factor to fill the viewport as much as possible
    const fit_factor = Math.min(
        canvas_width / scaled_width,
        canvas_height / scaled_height
    );

    const draw_width = scaled_width * fit_factor;
    const draw_height = scaled_height * fit_factor;

    // Center the image
    const x = (canvas_width - draw_width) / 2;
    const y = (canvas_height - draw_height) / 2;

    ctx.drawImage(image, x, y, draw_width, draw_height);
}

/**
 * Loops through visible layers and draws each using the correct scale.
 */
function draw_layers(ctx, images, visible_layers, elapsed_time, layers_data, canvas_width, canvas_height) {
    // Draw each visible layer in order (outermost to innermost)
    for (let i = 0; i < visible_layers.length; i++) {
        const layer_index = visible_layers[i];
        const image = images[layer_index];
        const scale = get_layer_scale(layer_index, elapsed_time, layers_data);
        if (image) {
            draw_layer(ctx, image, scale, canvas_width, canvas_height);
        }
    }
}

/**
 * Main animation loop using requestAnimationFrame.
 * Calls time tracking, zoom state, and drawing functions each frame.
 */
function animation_loop() {
    // Assumes canvas, ctx, images, and LAYERS_DATA are available in the outer scope
    if (!canvas || !ctx || !images || !LAYERS_DATA) {
        requestAnimationFrame(animation_loop);
        return;
    }

    // Get current canvas size
    const canvas_width = canvas.width;
    const canvas_height = canvas.height;

    // Track elapsed time
    const elapsed_time = track_animation_time();

    // Determine which layers are visible
    const visible_layers = get_visible_layers(elapsed_time, LAYERS_DATA);

    // Clear the canvas
    ctx.clearRect(0, 0, canvas_width, canvas_height);

    // Draw all visible layers
    draw_layers(ctx, images, visible_layers, elapsed_time, LAYERS_DATA, canvas_width, canvas_height);

    // Loop
    requestAnimationFrame(animation_loop);
}