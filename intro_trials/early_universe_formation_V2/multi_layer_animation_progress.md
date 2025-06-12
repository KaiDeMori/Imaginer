# Multi-Layer Animation Upgrade – Progress Checklist

*(This file tracks **Step 3** of our roadmap: “Upgrade the placeholder fog animation into the full multi-layer zoom-through sequence”.  Tick the boxes as subtasks are completed.)*

Last updated: **2024-06-XX**

---

## Task List

### 1 · Data Model & Config
- [x] Define `LayerConfig` array (one entry per visual layer).
- [x] Implement deterministic shuffling of file lists per layer via `rand()`.
- [x] Expose final, frozen `layers_config` from a new `layers_model.js`.

### 2 · Timeline Engine
- [x] Create `Timeline` helper that maps global `progress` (0 – 1) into per-layer opacity, scale and z-position.
- [x] Integrate cubic-in-out easing for smoother transitions.
- [x] Unit-test the mapping with synthetic timestamps.

### 3 · Sprite Instance Management
- [x] Generate N sprite instances per layer (deterministic).
- [x] Pre-compute per-sprite random offsets (angle, initial z-jitter).
- [x] Re-use `ImageBitmap` references across instances to save VRAM.

### 4 · Rendering Pipeline
- [x] Sort visible instances by pseudo-Z every frame.
- [x] Blit all sprites with correct alpha & scale.
- [x] Cull fully transparent or out-of-frustum sprites.

### 5 · Camera & Parallax Maths
- [x] Implement camera `z` curve that matches storyboard timings.
- [x] Map pseudo-Z to 2-D scale: `scale = camZ / (camZ - layerZ)`.
- [x] Add subtle XY drift using per-sprite angle (except planet).

### 6 · Final Planet Reveal **(re-scoped)**
- [x] Introduce dedicated `planet` layer that fades in quickly.
- [x] Planet starts small and remains centred while scaling up.
- [ ] To make sure there is no flicker, planet starts sub-pixel size and also gets quickly faded in (transparency).
- [ ] Stop master loop once planet fills viewport.
- [ ] Animation of the final planet is controlled by constants. NOT by rng.

### 7 · Performance Guard-Rails
- [x] Log average FPS and warn if it drops below 55.
- [ ] Cap max simultaneous draw calls / add warning.
- [ ] Provide `window.toggle_layer_vis(name)` dev helper.

### 8 · Debug / Dev Tooling
- [x] Seed panel & DevTools globals (`toggle_anim`, etc.).
- [ ] Frame freeze/step shortcuts.
- [ ] Bounding-box overlay for collision/overlap debugging.

### 9 · Clean-up & Polish
- [ ] Remove console spam behind `LOG_VERBOSE` flag.
- [ ] Refresh diagrams in `Early_Universe_Formation_Planning_V2.md`.

---

## Done-when Checklist
- [x] The scene plays through all five layers deterministically with a single seed.
- [ ] No dropped-frame warnings on reference hardware.
- [x] Seed regeneration creates a visibly different but reproducible fly-through.
- [ ] Planet stays centred, non-rotating, fades in quickly and scales from ≈ 1 px to full screen, after which the animation loop stops.
- [ ] Codebase passes CI linting and unit tests.

© 2024 Early Universe Team – multi-layer animation upgrade