# Optimizing Asset Loading Plan

## Objective
Ensure a seamless, instant transition to Phase 03 by guaranteeing that all required assets are pre-loaded into memory during the pre-intro phase. Eliminate redundant network requests (even to browser cache) and image decoding when Phase 03 starts. Implement strict validation so that any loading failures prevent the experience from starting.

## Analysis

### 1. Redundant Loading in Phase 03
**File:** `intro/03/preloader_module.js`
**Current State:** The `load_and_decode_images` function iterates through the requested URLs and initiates a new `Image()` load and decode sequence for every single one, regardless of whether the asset is already stored in the `preloaded_bitmaps` Map.
**Impact:** When Phase 03 starts, the browser re-verifies the assets (causing "get" requests, likely 304s or memory cache hits) and the CPU re-decodes the images. This introduces latency and risks stuttering during the critical music transition.

### 2. Error Handling in Pre-Intro
**File:** `intro/00/pre_intro_ui.js`
**Current State:** The `start_asset_loading` function triggers `window.asset_loader.start_loading(on_assets_loaded)`. Since `start_loading` is an async function, it returns a Promise. However, this Promise is currently ignored.
**Impact:** If an asset fails to load (network error, 404), the Promise rejects. The exception is unhandled, `on_assets_loaded` is never called, and the UI remains stuck on "Loading..." indefinitely without feedback.

## Proposed Solution

### Step 1: Implement Memory Cache Check
**Target:** `intro/03/preloader_module.js`
Modify `load_and_decode_images` to check the in-memory cache first.
*   **Logic:**
    1.  Iterate through the list of `target_urls`.
    2.  Check `preloaded_bitmaps.has(url)`.
    3.  **If present:** Return `Promise.resolve(bitmap)` immediately. This bypasses the network stack and decode pipeline entirely.
    4.  **If missing:** Proceed with the existing loading logic (fetch + decode). This ensures standalone testing still works.

### Step 2: Implement Strict Error Handling in UI
**Target:** `intro/00/pre_intro_ui.js`
Update `start_asset_loading` to handle the Promise returned by the loader.
*   **Logic:**
    ```javascript
    window.asset_loader.start_loading(on_assets_loaded)
      .catch((error) => {
        console.error("Critical Asset Loading Failure:", error);
        // Update UI to reflect failure
        const start_button = document.getElementById("start_button");
        start_button.textContent = "Load Failed";
        start_button.classList.add("error");
        alert(`Critical Error: Failed to load required assets.\n\n${error.message}\n\nPlease reload the page.`);
      });
    ```

### Step 3: Verify Pre-Intro Loader
**Target:** `intro/00/asset_loader.js`
(Already updated in previous step)
Ensure it correctly propagates errors. The current implementation uses `Promise.all`, which fails fast if any single asset fails. This is the desired "strict" behavior.

## Expected Outcome
1.  **Pre-Intro:** User sees "Loading...". If all assets load, "Start" becomes enabled. If any asset fails, the UI indicates failure.
2.  **Phase 03 Transition:** When `early_universe_formation_V2.js` calls `load_and_decode_images`, it receives the pre-loaded bitmaps instantly (0ms). No network requests appear in the Network tab.
