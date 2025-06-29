# Infinity Zoom Animation Testbed  
**Consolidated Specification (Overview + Task List + Roadmap)**  

---

## 1. Overview
The goal is to create an **infinite-zoom** animation that continuously zooms *into* a stack of perfectly aligned images.  
Only the *zoom-in* effect is supported—images must never appear to shrink or give the illusion of zooming out.  
The implementation is kept deliberately simple: everything runs in a single HTML page with an auto-sized `<canvas>`, and all data (zoom factors & image names) is embedded directly in the code so it works from a local file system.

---

## 2. Image & Data Details
* All images share the same center and have identical resolution (2048 × 2048 px in the test set).  
* Images may have arbitrary filenames; order is defined solely by the data array.  
* Place images inside a dedicated folder—configurable through a constant, defaulting to `zoom_images/`.

### 2.1 Zoom Factors
Zoom factors are expressed as **whole-number percentages** (e.g., `50`, `25`, `10`).  
Decimals such as `0.5` or `0.25` are **not** allowed.

---

## 3. Zoom Property Explanation
For each layer `n` the `zoom` value indicates how much **smaller** that layer is relative to the previous one.

If layers 2, 3, 4 have zoom values `50`, `50`, `25`, their absolute scales are:

$$
\text{scale}_2 = 1.0 \times \frac{50}{100} = 0.5 \\
\text{scale}_3 = 0.5 \times \frac{50}{100} = 0.25 \\
\text{scale}_4 = 0.25 \times \frac{25}{100} = 0.0625
$$

So layer 4 displays at **6.25 %** of the original outermost image.

---

## 4. Example Layer Data Array
```js
// Zoom factors must be whole-number percentages
const LAYERS_DATA = [
  { zoom: 25, image: 'Planet_totale.png' },
  { zoom: 25, image: 'Planet_close.png' },
  { zoom: 25, image: 'Continent.png' },
  { zoom: 25, image: 'Continent_Detail.png' },
];
```

---

## 5. Animation Requirements
1. **Fullscreen Canvas**  
   The `<canvas>` must always fill the browser viewport and resize with the window.

2. **Zoom-In Only**  
   Each new layer begins nearly invisible at the center and grows until it fills the view.  
   If any frame looks like layers are shrinking, the logic is wrong.

3. **Aspect-Ratio Preservation**  
   Never stretch images. Scale to *cover* the viewport while preserving aspect ratio (letterbox OK).

4. **Smooth Rendering**  
   Use `requestAnimationFrame`. Draw only layers that are visible or in transition.

5. **Looping**  
   When the deepest layer fills the screen, restart the sequence seamlessly.

---

## 6. Implementation Roadmap & Task List

### 6.1 Project Structure & Data  
- [ ] Single HTML file containing:
  - `<canvas id="zoomCanvas"></canvas>`
  - Inline `<script>` with constants:
    - `const IMAGE_FOLDER = 'zoom_images/';`
    - `const LAYERS_DATA = [...]` (see § 4)  

### 6.2 Data Parsing & Image Preloading  
- [ ] Convert `LAYERS_DATA` into an array of `{ zoom, image, imgElement }`.  
- [ ] Preload every `imgElement`; start animation only when all `onload` events fire.

### 6.3 Canvas Setup & Resizing  
- [ ] Match canvas size to `window.innerWidth/innerHeight`.  
- [ ] Add `resize` listener to update canvas dimensions and re-render.

### 6.4 Animation Engine  
- [ ] Maintain `globalScale` (cumulative zoom progress, e.g., starts at `1.0` and decreases).  
- [ ] `requestAnimationFrame(loop)` drives each frame.  
- [ ] On each tick:
  1. Increment `globalScale` by a smooth factor (e.g., multiply by `0.985`).  
  2. Determine which layers’ absolute scale × canvas size exceeds a minimal pixel threshold (e.g., ≥ 2 px).  
  3. Reset `globalScale` when innermost layer’s scale ≥ 1 (fills view).

### 6.5 Drawing Logic  
For every visible layer (outer → inner):  
1. Compute layer scale = `globalScale / cumulativeZoomProduct`.  
2. Pick the larger of width-fit and height-fit factors to ensure *cover*.  
3. `ctx.drawImage(img, offsetX, offsetY, drawW, drawH)`; center via negative offsets.

### 6.6 Minimal Threshold & Looping  
- [ ] Constant `MIN_VISIBLE_PX = 2`.  
- [ ] When deepest layer’s scale ≥ 1, reset `globalScale` to `1` and start over.

---

## 7. Optional Future Enhancements
* Alpha cross-fade between layers.  
* Edge-blur vignette for smoother transitions.  
* Bidirectional (in/out) zoom or user-controlled zoom speed.  
* Modularize into ES modules and add automated tests.

---

## 8. Quick Checklist for “Zoom-In” Sanity
✔ Images grow each frame (never shrink).  
✔ Current frame shows at least one fully opaque “base” layer.  
✔ No empty borders unless letter-boxing for aspect-ratio.  
✔ Canvas always matches viewport.  

---  
**End of Specification**