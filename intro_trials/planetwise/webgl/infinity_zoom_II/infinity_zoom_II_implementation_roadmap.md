
# Infinity Zoom II – Implementation Roadmap

This roadmap breaks down the implementation of Infinity Zoom II into testable milestones, referencing the original project where relevant. Each step includes checkboxes for tracking progress and is designed to maximize testability and incremental validation.

Note: The `log(msg)` debug utility is already imported from V1 (`infinity_zoom_debug.js`).

-----

## 1. Project Setup & Baseline
- [x] **Create and curate V1 code snippets file** (`infinity_zoom_v1_snippets.md`)
  - Collect minimal, well-understood code fragments for each concept to be ported
  - Reference: `intro_trials/planetwise/webgl/infinity_zoom_webgl_engine.js`, `infinity_zoom_webgl_documentation.md`
- [x] **Set up new project structure** in `intro_trials/planetwise/webgl/infinity_zoom_II/`
- [x] **Prepare layer images**
  - Reference: `intro_trials/planetwise/zoom_images_planete/`
- [x] **Import and reference image preloader** (`infinity_zoom_preloader.js`) before canvas initialization
  - Handles early image preloading in the HTML, distinct from GPU preloading

-----


## 2. Engine Architecture Planning
- [x] **Outline main modules and responsibilities**
  - Define the core engine structure
- [x] **Draft method stubs and signatures**
  - List and comment key methods for initialization, rendering, animation, and resource management

-----


## 3. Cinematic Intro Sequence
- [x] **Render black screen and single-pixel planet**
  - Reference: V2 documentation (`infinity_zoom_II_documentation.md`) §3.1a
- [x] **Test: Planet is invisible at 1px**
- [x] **Implement exponential zoom-in to scale 1 (0.5s)**
  - Reference: V2 documentation (`infinity_zoom_II_documentation.md`) §3.1b
- [x] **Test: Planet reaches scale 1 in 0.5s**
- [ ] **Fade-in additional layers (0.5s, fixed scale)**
  - Reference: V2 documentation (`infinity_zoom_II_documentation.md`) §3.1c
- [ ] **Test: All visible layers fade in smoothly**
- [ ] **Hold state (0.5s, only rotation)**
  - Reference: V2 documentation (`infinity_zoom_II_documentation.md`) §3.1d
- [ ] **Test: Layers static, rotation continues**

-----

## 4. Rotation Lifecycle
- [x] **Implement global rotation (ω = π/60 rad/s)**
  - Reference: V2 documentation (`infinity_zoom_II_documentation.md`) §4
- [x] **Test: Rotation starts before planet appears**
- [ ] **Test: Rotation stops when last layer covers viewport**

-----

## 5. Visibility & Resource Management
- [ ] **Pre-calculate intro-visible layers**
  - Reference: `infinity_zoom_II_documentation.md` (section 6.1)
- [ ] **Pre-load required textures to GPU**
- [ ] **Test: All intro layers are loaded before animation**
- [ ] **Implement dynamic upload/removal of layers**
  - Reference: `infinity_zoom_II_documentation.md` (section 6.4)
- [ ] **Test: Layers are uploaded/removed as needed**

-----

## 6. Shader & Rendering Enhancements
- [ ] **Implement fade-in alpha in shader**
  - Reference: `infinity_zoom_II_documentation.md` (section 7)
- [ ] **Test: Layer-specific alpha works as expected**
- [ ] **Implement feathering (u_feather = 0.08) for all but first layer**
  - Reference: `infinity_zoom_webgl_engine.js` (search for feathering logic)
- [ ] **Test: Feathering is correct for all layers**

-----

## 7. Main Zoom Sequence (V1 logic)
- [ ] **Integrate V1 main zoom logic**
  - Reference: `infinity_zoom_webgl_engine.js` (main animation loop)
- [ ] **Test: Main zoom proceeds after intro**
- [ ] **Test: Layers are discarded when covered**
- [ ] **Test: Animation ends with perpetual redraw, rotation stopped**

-----

## 8. Debug & Test Overlays
- [ ] **Implement overlays for visibility/debug**
- [ ] **Unit test: Minimum-size decisions are visible and correct**

-----

## 9. Documentation & Cleanup
- [ ] **Update documentation for new/changed logic**
- [ ] **Remove obsolete code and comments**
- [ ] **Final test: Full sequence runs as specified**

-----

## References
- V1 Documentation: `intro_trials/planetwise/webgl/infinity_zoom_webgl_documentation.md`
- V1 Engine: `intro_trials/planetwise/webgl/infinity_zoom_webgl_engine.js`
- V1 HTML: `intro_trials/planetwise/webgl/infinity_zoom_webgl.html`
- V2 Documentation: `intro_trials/planetwise/webgl/infinity_zoom_II/infinity_zoom_II_documentation.md`

-----

**Legend:**
- Each checkbox is a testable milestone.
- References to old project files are given for code and logic reuse.
- This roadmap is designed for incremental, test-driven development.
