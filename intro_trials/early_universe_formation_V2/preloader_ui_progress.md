# Preloader & Seed UI – Progress Checklist

*(This file — **preloader_ui_progress.md** — is a living checklist that tracks the implementation status of step 1 in our plan: **Build preloader module & seed UI**. Update the check-boxes as subtasks are completed.)*

## Current Status Summary
The core preloader pipeline and white-overlay logic are complete and working.  
Still outstanding: deterministic RNG, seed control UI, and the debug helper.

## Task List
### 1 · Preloader Pipeline
- [x] Generate empty file stubs for preloader and seed UI modules (e.g., `preloader_module.js`, `seed_ui_panel.js`).
- [x] Create a consolidated **asset_manifest** listing all image filenames required for the animation.
- [x] Implement `load_and_decode_images()` that:
  - [x] Instantiates a new `Image()` for each entry in **asset_manifest**.
  - [x] Waits for `img.decode()` to complete.
  - [x] Converts each decoded image to `ImageBitmap` via `createImageBitmap()`.
  - [x] Stores resulting bitmaps in `preloaded_bitmaps` map.
- [x] Show the **white overlay** (`#whiteScreen`) while assets are loading.
- [x] Measure actual load time and enforce the `min(1 s, load_time)` rule before fading the overlay.
- [x] Add basic **error handling** & logging (console) for failed loads or decode errors.
- [x] Remove event listeners & clear references after preload to avoid memory leaks.

### 2 · Deterministic RNG
- [ ] Implement deterministic RNG setup:
  - [ ] Drop-in `sfc32` implementation.
  - [ ] Read seed from `localStorage.getItem("eu_seed")` or fall back to `Date.now()`.
  - [ ] Expose a single `rand()` function (seeded) on `window` for other modules to consume.

### 3 · Seed UI Panel
- [ ] Build **seed UI panel** (small fixed `<div>`):
  - [ ] Display the current seed value.
  - [ ] Include **Regenerate** button that assigns a new seed, stores it in `localStorage`, and reloads the page.
  - [ ] Basic styling (fixed position, low-contrast so it doesn’t distract).

### 4 · Debug / Dev helpers
- [ ] Write a smoke-test function (`window.debug_preloader()`) that prints a summary of loaded bitmaps to the console (count, dimensions, total VRAM estimate).

When *all* unchecked items above are complete, Step 1 (*Build preloader module & seed UI*) can be marked **✅ finished**.
