# Infinity Zoom Animation Testbed — **Time–Δ Driven Variant**

## Overview
The project delivers an **infinite-zoom-in** effect on a single HTML page with a `<canvas>` that always fills the viewport.  *Zoom speed is driven directly from real time*: for every frame the current scale is obtained from a continuous mathematical function of elapsed time.

Benefits of the time-based model:

*   Frame-rate independence: 60 fps and 120 fps show the same perceived speed.
*   Exact seeking, pausing and resuming: the visual state at any timestamp `t` is deterministic.
*   Eliminates floating-point drift from repeated multiplications.

-----

## Image & Data Details
Unchanged — see the original spec.  All images are centred, equal resolution (e.g. 2048 × 2048 px) and ordered exclusively by the `LAYERS_DATA` array.

-----

## Zoom Factors Refresher
Zoom factors (`zoom`) are still whole-number percentages that express how much smaller each successive layer is than the one above it.

Example (layers 2–4 get smaller):

$$
\begin{aligned}
\text{scale}_2 &= 1.0 \times \frac{50}{100} = 0.5\\
\text{scale}_3 &= 0.5 \times \frac{50}{100} = 0.25\\
\text{scale}_4 &= 0.25 \times \frac{25}{100} = 0.0625
\end{aligned}
$$

-----

## Time-to-Scale Mapping
### Exponential Decay Function
We model the outermost layer’s **absolute scale** as an exponential decay of the form

$$
S_\text{outer}(t) = e^{-\lambda t}
$$

*   `λ` (lambda) is a positive rate constant in s⁻¹.
*   `t` is the elapsed time in **seconds** since the loop started.
*   At `t = 0`, `S = 1.0` (original size).  As `t` grows, `S` approaches 0.

`λ` is exposed as a constant so designers can tune subjective speed:

```js
const LAMBDA = 0.7;      // smaller = slower zoom, unit: 1/second
```

### Per-Layer Drawing Scale
Pre-compute for each layer *once*:

```js
layer.cumulativeZoom =   // product of (zoom / 100) from layer 0 .. n
```

At render time the scale that layer `n` should appear with is

$$
\text{drawScale}_n(t) = \frac{S_\text{outer}(t)}{\text{cumulativeZoom}_n}
$$

If `drawScale_n ≥ 1` the layer is currently filling (or overfilling) the viewport.

-----

## Looping Logic
Let `deepestLayer` be `LAYERS_DATA.length – 1`.
The sequence restarts whenever the deepest layer is **visually full-size**:

```js
if (drawScale_deepest >= 1) {
  startTime = now;              // Reset the clock → S_outer(t) = 1 again
}
```

Because every scale is calculated from `(now − startTime)` the whole stack re-initialises automatically — no mutable accumulator required.

-----

## Implementation Roadmap (Time-Δ Edition)

### Single HTML File
DOM structure is unchanged; only the JS varies:

```html
<canvas id="zoomCanvas"></canvas>
<script>
  const IMAGE_FOLDER = 'zoom_images/';
  const LAYERS_DATA = [ { zoom: 25, image: 'Planet_totale.png' }, … ];
  const LAMBDA = 0.7;  // 1/second
</script>
```

### Image Preloading
Exactly as in the original spec.

### Canvas Resizing
Unchanged — full-viewport canvas with a `resize` listener.

### Animation Engine (Time Driven)

```js
let startTime = performance.now();
function loop(nowMs) {
  const t = (nowMs - startTime) / 1000;     // seconds
  const S_outer = Math.exp(-LAMBDA * t);    // exponential decay

  ctx.clearRect(0, 0, cvs.width, cvs.height);

  for (const layer of visibleLayers(S_outer)) {
    const drawScale = S_outer / layer.cumulativeZoom;
    drawLayer(layer.img, drawScale);
  }

  // Loop test → deepest layer full size?
  const deepest = layers[layers.length - 1];
  if (S_outer / deepest.cumulativeZoom >= 1) {
    startTime = nowMs;    // restart
  }

  requestAnimationFrame(loop);
}
```

**Note:** `visibleLayers(S_outer)` is any helper that filters layers whose drawn width ≥ `MIN_VISIBLE_PX`.

### Drawing a Layer — Unchanged
Compute the cover-fit draw width/height and blit with `ctx.drawImage`.

-----

## Optional Enhancements
*   Vary `λ` over time for slow-in / fast-out effects.
*   Make `λ` a BPM-linked function to sync with music.
*   Allow user scrubbing by mapping mouse wheel → synthetic `startTime` shift.

-----

## Quick Checklist (Time-Based)
✔ Scale function uses real time → FPS-independent.  
✔ Every layer uses `drawScale_n(t)` formula.  
✔ Loop resets `startTime`, not a numeric scale.  
✔ Canvas always matches viewport.


