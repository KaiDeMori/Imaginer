# Canvas Animation Prototype – Progress Checklist

*(This file — **canvas_animation_progress.md** — is a living checklist that tracks the implementation status of **Step 2** in our overall roadmap: **Implement the Canvas animation prototype**.  Update the check-boxes as subtasks are completed.)*

## Current Status Summary
⬜  No work has started yet.  The UniverseAnimator placeholder class exists (`canvas_animation.js`), but it is **not wired up** to the main entry point and no on-screen animation is visible.

---

## Task List

### 1 · Wire-up & Bootstrapping
- [ ] Import `UniverseAnimator` into `early_universe_formation_V2.js`.
- [ ] Pass the resolved `bitmaps_map` from the pre-loader into a new `UniverseAnimator` instance.
- [ ] Call `animator.start()` after the white overlay fades.
- [ ] Expose `window.universe_animator` for DevTools inspection.

### 2 · Placeholder Animation Validation
- [ ] Validate that the deterministic cosmic-fog sprite appears and animates (zoom-in / zoom-out cycle).
- [ ] Confirm hi-DPI scaling behaviour on window resize.
- [ ] Confirm a steady ≥ 60 fps on desktop test hardware; log an average FPS sample to the console.

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

When **all** tasks above are checked, **Step 2 (Canvas animation prototype)** will be considered complete and we can proceed to Step 3 (full timeline & multi-layer parallax).