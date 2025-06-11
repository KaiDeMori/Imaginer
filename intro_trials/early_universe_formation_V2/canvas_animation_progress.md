# Canvas Animation Prototype – Progress Checklist

*(This file — **canvas_animation_progress.md** — is a living checklist that tracks the implementation status of **Step 2** in our overall roadmap: **Implement the Canvas animation prototype**.  Update the check-boxes as subtasks are completed.)*

## Current Status Summary
✅  Wire-up & Bootstrapping completed.  
✅  Placeholder cosmic-fog animation validated.  
✅  Hi-DPI scaling validation integrated & manually verified.  
✅  Average FPS sampling & console reporting integrated.

---

## Task List

### 1 · Wire-up & Bootstrapping
- [x] Import `UniverseAnimator` into `early_universe_formation_V2.js`.
- [x] Pass the resolved `bitmaps_map` from the pre-loader into a new `UniverseAnimator` instance.
- [x] Call `animator.start()` after the white overlay fades.
- [x] Expose `window.universe_animator` for DevTools inspection.

### 2 · Placeholder Animation Validation
- [x] Validate that the deterministic cosmic-fog sprite appears and animates (zoom-in / zoom-out cycle).
- [x] Confirm hi-DPI scaling behaviour on window resize.
- [x] Confirm a steady ≥ 60 fps on desktop test hardware; log an average FPS sample to the console.

### 3 · Deterministic Asset Selection
- [ ] Replace the current “first matching fog sprite” heuristic with a **seeded random pick** using `rand()` so that each seed yields a repeatable fog texture choice.
- [ ] Document the selection logic inline for future layers.

### 4 · Debug / Dev Helpers
- [ ] Add `window.toggle_anim()` helper to pause / resume the rAF loop.
- [ ] Add a keyboard shortcut (e.g. `Space`) to toggle pause during development (disabled in production build).
- [ ] Update `debug_preloader()` so that it also reports whether the animator is currently running.

### 5 · Clean-up & Polish
- [ ] Remove any console noise or temporary test code.
- [ ] Run ESLint / Prettier pass.
- [ ] Manual smoke-test on Windows + macOS (Chrome & Firefox).

---