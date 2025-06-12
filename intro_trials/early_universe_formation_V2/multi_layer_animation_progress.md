# Multi-Layer Animation Upgrade – Progress Checklist

*(This file tracks Step 3 in our roadmap: “Upgrade the placeholder fog animation into the full multi-layer zoom-through sequence”.  Update the check-boxes as subtasks are completed.)*

## Current Status Summary
✅  Single-layer fog animation is running at stable 60 fps on desktop test machines.  
⏳  All other layers (galaxy streams, nebulae, star clusters, planet) are still pending.

---

## Task List

### 1 · Data Model & Config
- [ ] Define `LayerConfig` array (one entry per visual layer).
- [ ] Implement deterministic shuffling of file lists per layer via `rand()`.
- [ ] Expose final, frozen `layers_config` from a new `layers_model.js`.

### 2 · Timeline Engine
- [ ] Create `Timeline` helper that maps global `progress` (0–1) into per-layer opacity, scale and z-position.
- [ ] Integrate cubic-in-out easing for smoother transitions.
- [ ] Unit-test the mapping with synthetic timestamps.

### 3 · Sprite Instance Management
- [ ] Generate N sprite instances per layer (N configurable, deterministic).
- [ ] Pre-compute per-sprite random offsets (angle, initial z-jitter).
- [ ] Reuse `ImageBitmap` references across instances to save VRAM.

### 4 · Rendering Pipeline
- [ ] Sort visible instances by pseudo-Z every frame.
- [ ] Blit all sprites with correct alpha & scale.
- [ ] Cull fully transparent or out-of-frustum sprites.

### 5 · Camera & Parallax Maths
- [ ] Implement camera `z` curve that matches storyboard timings.
- [ ] Map pseudo-Z to 2-D scale: `scale = camZ / (camZ - layerZ)`.
- [ ] Add subtle XY drift using per-sprite angle.

### 6 · Final Planet Reveal
- [ ] Introduce dedicated `planet` layer that fades in after star clusters.
- [ ] Keep planet locked to screen centre; continue slow rotation (optional).
- [ ] Hold on planet for 2 s before stopping the loop (or start idle drift).

### 7 · Performance Guard-Rails
- [ ] Cap max simultaneous `ImageBitmap` draw calls per frame.
- [ ] Benchmark on low-spec GPU; log warning if average FPS < 55.
- [ ] Provide `window.toggle_layer_vis(name)` dev helper.

### 8 · Debug / Dev Tooling
- [ ] Extend `debug_preloader()` to print per-layer sprite counts.
- [ ] Add “show bounding boxes” toggle for collision / overlap checks.
- [ ] Keyboard shortcuts:
  - [ ] `F` ⇒ freeze current frame
  - [ ] `.` / `,` ⇒ step ±1 frame when frozen

### 9 · Clean-up & Polish
- [ ] Remove all console spam behind `LOG_VERBOSE` flag.
- [ ] Run ESLint + Prettier on new modules.
- [ ] Update documentation diagrams in `Early_Universe_Formation_Planning_V2.md`.

---

## Done-when Checklist
- [ ] The scene plays through all five layers deterministically with a single seed.
- [ ] No dropped-frame warnings on reference hardware.
- [ ] Seed regeneration creates a visibly different but reproducible fly-through.
- [ ] Codebase passes CI linting and unit tests.

© 2024 Early Universe Team – multi-layer animation upgrade