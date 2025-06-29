# Infinity Zoom – Project Documentation

This document prescribes the exact steps to implement an in-browser “infinity zoom” that creates the illusion of diving ever deeper into a planet-like scene.
The implementation uses only HTML, CSS and vanilla JavaScript that run directly in the browser. No build steps, servers or external libraries take part.

## Terminology
* **Layer** – one square bitmap in the zoom sequence. Layers share a common centre.
* **Viewport** – the browser window that displays the animation.
* **Canvas** – a single `<canvas>` element that fills the viewport and is the sole drawing surface.
* **Tempo / Overall Duration** – mutually exclusive options that govern how quickly the zoom advances (see “Duration Handling”).

## Source Data
* Layers are supplied as a pre-loaded array named `LAYERS_DATA`.
* Every entry contains a `zoom` property and an `image` filename.
* `zoom` expresses the start size of the layer *relative to the layer directly following it*. A value of `25` means *this image starts at twenty-five percent of the previous layer’s size*.

Example (already present on the hosting page):
```js
const LAYERS_DATA = [
   { zoom: 25, image: '60_alien_island.png' },
   { zoom: 25, image: '70_alien_forest.png' },
   { zoom: 25, image: '80_alien_village.png' },
   { zoom: 25, image: '90_alien_hut.png' }
];
```

## Visual Rules
* All layers are perfectly square once rendered.
* All layers share an identical centre; there is no lateral panning.
* A layer becomes the *current* (top-most) layer as soon as it completely fills the viewport. At that moment the layer immediately underneath it is removed from the draw stack and no longer rendered.

## Drawing Surface
* Exactly one `<canvas>` element is created and styled to cover the entire viewport.
* The 2D drawing context of that canvas is the only API used for rendering.

## Animation Pipeline
* `requestAnimationFrame` (rAF) drives every frame; there are no CSS keyframes, `setInterval` or `setTimeout` calls.
* For each rAF tick, the elapsed time since the previous frame is calculated.
* A *perceptually constant* zoom is achieved by updating every active layer with a **multiplicative** scale increment.
  The visible scale `s(t)` of a layer follows
  $$
  s(t) = s_0 \; e^{k t}
  $$
  where `s₀` is the initial scale and `k` is the growth constant in \(\text{s}^{-1}\).  
  Using the elapsed time \(\Delta t\) measured inside rAF, the per-frame update is
  $$
  s(t+\Delta t) = s(t) \; e^{k \Delta t}
  $$
  This exponential rule keeps the *percentage* increase per second constant, which the human eye perceives as a uniform zoom speed.
* Layers are drawn back-to-front so that the deepest currently active layer is rendered last (and therefore appears on top).
* When the current top layer reaches one-hundred percent of the viewport’s inner dimension, the underneath layer is discarded and the process continues with the new pair.
* The animation ends when the final layer has filled the viewport.

## Duration Handling
* Two exclusive configuration options exist. Only **one** is present in the final build.

  * *Overall duration* – the entire zoom from first to last layer completes in a fixed, known amount of time.  
    For every layer the required growth constant `k` is solved so that the scale reaches the viewport boundary exactly at the requested end time.

  * *Tempo* – a constant *growth ratio per second* value defines by how much (e.g. ×1.6) the visible diameter grows each second.  
    The multiplicative rule from the previous section is applied using the corresponding `k = \ln(\text{ratio})`.

* Regardless of which option is chosen, the update is computed exclusively with elapsed real time obtained inside the rAF callback, thereby ensuring frame-rate independence.

## Preloading Obligation
* All images referenced in `LAYERS_DATA` are fully pre-loaded before the first animation frame.  
  The preload mechanism exists outside the scope of this document but must guarantee that the bitmap data is available in memory by the time the JavaScript starts drawing.

## User Interaction
* The zoom runs automatically and cannot be interrupted. No mouse, pointer, keyboard or touch interaction is provided.

## External Dependencies
* None. The entire solution ships as static HTML, CSS and JavaScript executed directly by the browser.

## Out-of-Scope Items
* Error handling, edge conditions, degraded rendering paths and fallback imagery are deliberately left unaddressed.
