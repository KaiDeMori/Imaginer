# Preloader & Seed UI – Progress Checklist

*(This file — **preloader_ui_progress.md** — is a living checklist that tracks the implementation status of step 1 in our plan: **Build preloader module & seed UI**. Update the check-boxes as subtasks are completed.)*

## Task List

- [ ] Create a consolidated **asset_manifest** listing all image filenames required for the animation.
- [ ] Implement `load_and_decode_images()` that:
  - [ ] Instantiates a new `Image()` for each entry in **asset_manifest**.
  - [ ] Waits for `img.decode()` to complete.
  - [ ] Converts each decoded image to `ImageBitmap` via `createImageBitmap()`.
  - [ ] Stores resulting bitmaps in `preloaded_bitmaps` map.
- [ ] Show the **white overlay** (`#whiteScreen`) while assets are loading.
- [ ] Measure actual load time and enforce `min(1 s, load_time)` rule before fading overlay.
- [ ] Implement deterministic RNG setup:
  - [ ] Read seed from `localStorage.getItem("eu_seed")` or fall back to `Date.now()`.
  - [ ] Initialise `sfc32` with parsed seed ints.
- [ ] Build **seed UI panel** (small fixed `<div>`):
  - [ ] Display current seed value.
  - [ ] Include **Regenerate** button that assigns a new seed, stores it in `localStorage`, and reloads the page.
- [ ] Add basic **error handling** & logging (console) for failed loads or decode errors.
- [ ] Write a smoke-test function (`window.debug_preloader()`) that prints a summary of loaded bitmaps to the console.
- [ ] Remove event listeners & clear references after preload to avoid memory leaks.
