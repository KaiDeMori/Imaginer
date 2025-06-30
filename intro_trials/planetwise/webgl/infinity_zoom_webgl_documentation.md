# Infinity Zoom – WebGL Project Documentation

This document prescribes the steps to implement an in-browser “infinity zoom” effect using WebGL for high-performance, artifact-free rendering. The implementation uses only HTML, CSS, and vanilla JavaScript with WebGL APIs. No build steps, servers, or external libraries are required.

## Terminology
* **Layer** – one square bitmap in the zoom sequence, uploaded as a WebGL texture. Layers share a common center.
* **Viewport** – the browser window that displays the animation.
* **WebGL Canvas** – a single `<canvas>` element with a WebGL2 context that fills the viewport and is the sole drawing surface.
* **Quad** – a rectangle (two triangles) covering the viewport, used to render each layer as a textured surface.
* **Texture** – a GPU-resident image used for rendering a layer.
* **Feathering** – a smooth alpha blend at the edges of each layer, computed in the fragment shader.

## Source Data
* Layers are supplied as a pre-loaded array named `LAYERS_DATA`.
* Every entry contains a `zoom` property and an `image` filename.
* All images are currently 2048×2048 pixels and always perfectly square. (The code supports arbitrary resolutions, but all images must be square for correct results.)
* `zoom` expresses the start size of the defining layer *relative to the previous layer*. A value of `25` means *this image starts at twenty-five percent of the previous layer’s size*.
* The `zoom` value of the first layer is unused.
* Images are preloaded in JavaScript and uploaded to the GPU as textures only when needed.

Example:

```js
const LAYERS_DATA = [
   { zoom: 25, image: '60_alien_island.png' },
   { zoom: 25, image: '70_alien_forest.png' },
   { zoom: 25, image: '80_alien_village.png' },
   { zoom: 25, image: '90_alien_hut.png' }
];
// Example removal: '60_alien_island.png' is removed from rendering when '70_alien_forest.png' has scaled up so that its visible area covers the entire viewport in both width and height (i.e., its size reaches at least the larger of the viewport's width or height).
```

## Visual Rules
* All layers are perfectly square once rendered.
* All layers share an identical center; there is no lateral panning.
* Each layer is rendered as a textured quad covering the viewport, scaled according to the zoom animation.
* Feathered borders are computed in the fragment shader for smooth, artifact-free blending.
* Layers are drawn back-to-front (first layer first, last layer last) with alpha blending enabled.
* Only the currently visible layers (typically 2–5) are uploaded as textures and rendered; others are not present in GPU memory.

## Drawing Surface
* Exactly one `<canvas>` element is created and styled to cover the entire viewport.
* The WebGL2 context is used for all rendering.
* Each layer is rendered as a full-viewport quad (two triangles) with the layer’s texture.

## Animation Pipeline
* `requestAnimationFrame` (rAF) drives every frame; there are no CSS keyframes, `setInterval`, or `setTimeout` calls.
* For each rAF tick, the elapsed time since the previous frame is calculated.
* A *perceptually constant* zoom is achieved by updating every active layer with a **multiplicative** scale increment:
  $$
  s(t) = s_0 \; e^{k t}
  $$
  where `s₀` is the initial scale and `k` is the growth constant in \(\text{s}^{-1}\).
* Layers are drawn back-to-front so that the first currently active layer is rendered first and the last layer last.
* The first layer is drawn so that the entire image—including its feathered border—is fully visible inside the viewport, maximized as much as possible but not cropped. This may result in black bars on the left and right (letterboxing) or top and bottom, depending on the viewport aspect ratio. No part of the image is outside the viewport at the start.
* For all subsequent layers, when the next layer in order has scaled up so that its visible area covers the entire viewport in both width and height (i.e., its size reaches at least the larger of the viewport’s width or height), the previous layer is discarded and the process continues with the new pair. This ensures the entire viewport is covered, with no gaps or letterboxing, before removing the previous layer.
* The animation ends when the final layer has filled the viewport.

## Feathering Implementation
* Feathered borders are implemented in the fragment shader.
* The shader computes the minimum distance from the current pixel to the edge of the quad and applies a smooth alpha ramp (feather) over a configurable percentage of the image size.
* This approach ensures seamless, artifact-free feathering, including at the corners.

Example fragment shader pseudocode:
```glsl
float feather = 0.08; // 8% feather
float min_edge = min(min(v_texcoord.x, 1.0 - v_texcoord.x), min(v_texcoord.y, 1.0 - v_texcoord.y));
float alpha = 1.0;
if (min_edge < feather) {
    alpha = min_edge / feather;
}
vec4 color = texture(u_image, v_texcoord);
gl_FragColor = vec4(color.rgb, color.a * alpha);
```

## Speed Handling
* *Tempo* – a constant *growth ratio per second* value defines by how much (e.g. ×1.6) the visible diameter grows each second.
* The multiplicative rule is applied using the corresponding `k = ln(ratio)`.
* The update is computed exclusively with elapsed real time obtained inside the rAF callback, ensuring frame-rate independence.

## Texture Management
* Only the currently visible layers (typically 2–5) are uploaded as textures to the GPU.
* When a layer is no longer visible, its texture is deleted from GPU memory.
* Images are preloaded in JavaScript and uploaded to the GPU as needed.
* This approach minimizes GPU memory usage and ensures smooth performance on modern hardware.

## Preloading Obligation
* All images referenced in `LAYERS_DATA` are fully pre-loaded in JavaScript before the first animation frame.
* Textures are created and uploaded to the GPU only when a layer becomes active.

## User Interaction
* The zoom runs automatically and cannot be interrupted. No mouse, pointer, keyboard, or touch interaction is provided.

## External Dependencies
* None. The entire solution ships as static HTML, CSS, and JavaScript executed directly by the browser.

## Out-of-Scope Items
* Error handling, edge conditions, degraded rendering paths, and fallback imagery are deliberately left unaddressed.

---

## Implementation Checklist (WebGL Engine)

- [x] 1. WebGL Setup
    - Initialize WebGL2 context
    - Set up viewport and handle resizing

- [ ] 2. Minimal Shaders & Geometry
    - Vertex and fragment shader for a solid color quad
    - Quad geometry buffer
    - Test: See a colored quad on the canvas

- [ ] 3. Texture Display (Single Image)
    - Load and display a single image as a texture
    - Test: See the first image layer rendered, no animation

- [ ] 4. Feathering Shader
    - Add feathering logic to the fragment shader
    - Test: See the image with feathered edges

- [ ] 5. Layer Stack (Static)
    - Add logic for multiple layers, rendered statically
    - Test: See all layers stacked, correct order and feathering

- [ ] 6. Animation Loop (Zoom)
    - Implement exponential zoom for the top layer
    - Test: See the top layer zoom in smoothly

- [ ] 7. Layer Transition Logic
    - Remove background layer when top layer fills viewport
    - Test: See transition from one layer to the next

- [ ] 8. Texture Cleanup
    - Remove textures for layers no longer visible

- [ ] 9. Final Polish
    - Refactor, optimize, and ensure all requirements are met
