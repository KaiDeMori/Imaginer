# Asset Loading Optimization Plan

## Objective
Refactor the asset loading pipeline for Phase 03 ("Early Universe Formation") to significantly reduce memory usage and prevent browser crashes. The goal is to load **only** the specific assets required for the animation (defined by sprite counts per layer) rather than the entire asset library, while maintaining **deterministic randomness** across sessions.

## Current Architecture Analysis
1.  **`preloader_module.js`**: Generates a full `asset_manifest` of all available files and loads *everything* immediately upon invocation.
2.  **`layers_model.js`**: Imports the full manifest, groups files by layer, and shuffles them deterministically.
3.  **`sprite_instance_manager.js`**: Defines `SPRITE_COUNT_PER_LAYER` locally and consumes the shuffled lists to create sprite instances.
4.  **`early_universe_formation_V2.js`**: Orchestrates the loading and initialization.

**Problem**: The preloader loads all files before the application decides which ones it actually needs.

## Proposed Architecture

To fix this, we will invert the control flow for loading. We will determine *what* to load based on the configuration *before* triggering the network requests.

### 1. Centralized Configuration
We will move the `SPRITE_COUNT_PER_LAYER` configuration into `LAYER_TIMELINE` within `timeline_engine.js`.
*   **Why?** This consolidates the "definition" of a layer (timing, position, and now *density/count*) in one place.
*   **Benefit**: `sprite_instance_manager.js` and the loading logic can both reference the same source of truth.

### 2. Selective Loading Logic
We will modify the entry point (`early_universe_formation_V2.js`) to calculate the subset of required assets.
*   It will read the shuffled `layers_config` (from `layers_model.js`).
*   It will read the counts from `LAYER_TIMELINE`.
*   It will extract the top $N$ URLs for each layer.
*   It will pass this specific list to the preloader.

### 3. Preloader Update
We will update `preloader_module.js` to accept an optional list of URLs to load. If provided, it only loads those; otherwise, it falls back to the full manifest (or we can make it mandatory).

## Step-by-Step Implementation Plan

### Step 1: Update `timeline_engine.js`
*   Add a `sprite_count` property to each object in the `LAYER_TIMELINE` array.
*   Migrate the values from `sprite_instance_manager.js`:
    *   `cosmic_fog`: 5
    *   `galaxy_streams`: 4
    *   `nebulae`: 6
    *   `star_clusters`: 3

### Step 2: Update `preloader_module.js`
*   Modify `load_and_decode_images(onProgress, target_urls)` signature.
*   If `target_urls` is provided (Array or Set), filter `asset_manifest` or use `target_urls` directly to drive the loading process.
*   Ensure the returned `Map` only contains the loaded bitmaps.

### Step 3: Update `sprite_instance_manager.js`
*   Remove the local `SPRITE_COUNT_PER_LAYER` constant.
*   Import `LAYER_TIMELINE` from `timeline_engine.js`.
*   Update `generate_sprite_instances` to read the count from `LAYER_TIMELINE` for each layer.

### Step 4: Update `early_universe_formation_V2.js` (Orchestration)
*   Import `layers_config` from `layers_model.js`.
*   Import `LAYER_TIMELINE` from `timeline_engine.js`.
*   Implement a helper logic (or inline) to collect the required URLs:
    ```javascript
    const required_urls = new Set();
    for (const layer_def of LAYER_TIMELINE) {
        const config = layers_config.find(l => l.name === layer_def.name);
        // Take the first N files, or all if count > available
        const count = layer_def.sprite_count;
        const files_to_load = config.files.slice(0, count); 
        files_to_load.forEach(url => required_urls.add(url));
    }
    ```
*   Pass `Array.from(required_urls)` to `load_and_decode_images`.

## Verification
*   **Determinism**: Since `layers_config` is already deterministically shuffled, taking the "first N" items is a deterministic operation.
*   **Memory**: Only the requested number of images will be created as `ImageBitmap`s.
*   **Fallback**: If `sprite_count` exceeds available files, `slice` handles it gracefully, and the `Set` ensures uniqueness.
