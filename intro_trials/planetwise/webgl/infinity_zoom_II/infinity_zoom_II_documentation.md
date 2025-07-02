
# Infinity Zoom II – Project Documentation

Version 2 ("Infinity Zoom II") refines the original Web-GL based *Infinity Zoom* demo.  The core zoom pipeline from V1 is retained; all changes are additive and focus on a cinematic **intro sequence**, better **rotation handling**, and stricter **visibility / resource** rules.  This document only describes the deltas and new constraints – whenever behaviour is *not* covered here, the original *Infinity Zoom* documentation continues to apply.

-----

## 1  Goals
1. A short, cinematic **intro** that starts from a single–pixel planet and settles on the familiar V1 "planet @ scale 1" state.
2. A **constant global rotation** that is already in motion before the planet appears and stops only when the final layer covers the viewport.
3. **Deterministic visibility & pre-loading** so that every layer needed during the intro is already resident in GPU memory before its first frame.
4. Small cleanup items that address issues discovered during the first project (naming, logging, minimum-size handling).

-----

## 2  Glossary (agreed vocabulary)
* **Layer** – an image (square bitmap) in the zoom stack.  Refer to them as *first, second, …* or by a conceptual name such as *planet*, *ocean*, *atoll*; never "top/bottom".
* **Scale = 1** – the layer is fully visible and touches the viewport **from the inside**.  Letter- or pillar-boxing is allowed, cropping is not.
* **Covering** – the layer is large enough that it extends beyond the viewport in **both** directions (thus no bars are possible).
* **LAYERED_ZOOM_MINIMUM_RENDER_SIZE** – absolute pixel threshold below which a layer is not rendered.  Same constant that already exists in the engine.

-----

## 3  High-Level Timeline
The animation is divided into two macro phases.

```
[ intro  ≈1.5 s ]          [   main zoom   ]
┌───────────────┬──────────┬─────────────────────────────────────────┐
|   micro step  | duration |                 notes                  |
├───────────────┼──────────┼─────────────────────────────────────────┤
| (a) Tiny planet          | 0 s           | rotation already running |
| (b) Quick planet zoom-in | ~0.5 s        | → scale 1                |
| (c) Fade-in further layers| 0.5 s        | all visible layers       |
| (d) Hold (still)         | 0.5 s        | layers static, rot. only |
├───────────────┴──────────┴─────────────────────────────────────────┤
| (e) Main zoom-in (V1)    |       until last layer covers viewport |
└────────────────────────────────────────────────────────────────────┘
```

### 3.1  Intro micro steps
(a) **Tiny planet**  – The scene starts completely black.  The first planet layer is rendered at *one physical screen pixel* – effectively invisible.  This image is present from the first frame but cannot be seen because of its size.

(b) **Quick planet zoom-in** – Over ≈0.5 s the planet exponentially zooms from one pixel until it reaches *scale 1* (i.e. fully inside the viewport).  Feathering is still **disabled** for the first layer.

(c) **Fade-in of additional layers** – Directly after the planet reaches scale 1 every other layer whose `draw_size` would exceed `LAYERED_ZOOM_MINIMUM_RENDER_SIZE` is smoothly faded in (alpha 0→1) over exactly 0.5 s.  Their *spatial* scale is fixed during this fade.

(d) **Hold** – All visible layers remain static for another 0.5 s.  Only the global rotation continues.

### 3.2  Main zoom (unchanged from V1)
From here the original algorithm kicks in:

• All active layers receive the multiplicative scale update `s(t) = s₀ · e^{k·t}`.

• When the *next* layer covers the viewport (including its feather distance) the previous one is discarded.

• The process ends once the final layer (*alien lying in the grass*) covers the viewport.  At that exact frame rotation velocity becomes 0 and the perpetual redraw loop begins (same as V1).

-----

## 4  Rotation Rules
1. A single global **rotation value** (clock-wise, radians) is applied to every layer every frame; layers are never rotated independently.
2. Rotation speed is constant:  $$\omega = \pi/60\;\text{rad·s}^{-1}$$  (one full 360° turn every two minutes).
3. Rotation **starts before** the planet appears and **stops** only when the last layer covers the viewport.

-----

## 5  Source Data & Constants (unchanged)
```
const LAYERS_DATA = [
  { zoom: 25, image: '10_planet.png'  },  // first (planet)
  …
  { zoom: 25, image: '90_alien.png'   }   // last  (alien)
];
```
* Format is identical to V1: every layer owns a `zoom` percentage relative to its predecessor and an image name.  All images are square and pre-loaded.
* **Axioms**
  * The planet is always `LAYERS_DATA[0]`.
  * The alien is always `LAYERS_DATA[LAYERS_DATA.length-1]`.

-----

## 6  Visibility & Resource Management
1. **Pre-calculation before first visible frame**
   • Assume the planet starts at *scale 1* – determine which subsequent layers would exceed `LAYERED_ZOOM_MINIMUM_RENDER_SIZE`.  Those layers **must already be uploaded to GPU** before the intro begins.
2. During the animation a layer is only drawn if its current on-screen size is ≥ `LAYERED_ZOOM_MINIMUM_RENDER_SIZE`.
3. Mip-mapping: `LINEAR_MIPMAP_LINEAR` for `TEXTURE_MIN_FILTER`, `LINEAR` for `TEXTURE_MAG_FILTER`.
4. When a layer becomes invisible (see rule 2) it can be deleted immediately.  Conversely, if a layer will become visible later it is (re-)uploaded shortly before that happens.

-----

## 7  Feathering
Exactly the same GPU-side calculation as in V1:
```
float edge_alpha = 1.0;
if (min_edge < u_feather) {
    edge_alpha = min_edge / u_feather;
}
```
* Feather amount `u_feather = 0.08` (8 %) for **every layer except the first**.
* The first layer is rendered with hard edges throughout the whole animation.

-----

## 8  Logging
A global helper `log(msg)` remains available.  Use it sparingly for **human-readable**, fully formatted messages only.
A global helper `log(msg)` remains available, defined in `infinity_zoom_debug.js`. Use it sparingly for **human-readable**, fully formatted messages only. To enable debug overlays or logging, ensure this file is referenced early in the HTML.

-----

## 9  Implementation Checklist (additive to V1)
- [ ] **Intro sequencing**
  - Render planet at 1 pixel.
  - Time-based zoom to scale 1 (≈0.5 s).
  - Fade-in & hold steps.
- [ ] **Rotation lifecycle**
  - Start immediately.
  - Stop precisely when final layer covers viewport.
- [ ] **Pre-loading logic** for intro-visible layers.
  - Image preloading is handled by re-using the V1 logic in `infinity_zoom_preloader.js`. This script should be referenced early in the HTML, before the canvas is initialized.
- [ ] **Fade-in shader support** (layer-specific alpha).
- [ ] **Unit tests / debug overlays** for minimum-size visibility decisions.

-----

## 10  Out of Scope
Exactly the same exclusions as V1 (no interaction, no error handling, no fallback rendering).  The only new rule is that the intro timing is *best-effort*; The total duration of the intro sequence is not important.

-----

## 11 Paths & Files

This file resides in
`intro_trials\planetwise\webgl\infinity_zoom_II\infinity_zoom_II_documentation.md`

All Infinity Zoom II files reside in:
`intro_trials\planetwise\webgl\infinity_zoom_II\`

Key files for initialization and debugging (copied from V1):
 * `infinity_zoom_preloader.js` – handles early image preloading (must be referenced before canvas initialization)
 * `infinity_zoom_debug.js` – provides the global `log(msg)` helper and debug overlays

The old project is in:
`intro_trials\planetwise\webgl\`

The old project includes the following files:
 * infinity_zoom_webgl_documentation.md
 * infinity_zoom_webgl_engine.js
 * infinity_zoom_webgl.html

The layer images are in:
`intro_trials\planetwise\zoom_images_planete`

-----

Happy zooming!  When in doubt, consult the original *Infinity Zoom* codebase – everything not explicitly changed above remains valid.