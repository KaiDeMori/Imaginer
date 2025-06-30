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
* `zoom` expresses the start size of the layer *relative to the layer directly following it*. A value of `25` means *this image starts at twenty-five percent of the previous layer’s size*.
* Images are preloaded in JavaScript and uploaded to the GPU as textures only when needed.

Example:
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
* All layers share an identical center; there is no lateral panning.
* Each layer is rendered as a textured quad covering the viewport, scaled according to the zoom animation.
* Feathered borders are computed in the fragment shader for smooth, artifact-free blending.
* Layers are drawn back-to-front (deepest first, topmost last) with alpha blending enabled.
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
* Layers are drawn back-to-front so that the deepest currently active layer is rendered first and the topmost last.
* When the current top layer reaches one-hundred percent of the viewport’s inner dimension, the underneath layer is discarded and the process continues with the new pair.
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

- [ ] 1. WebGL Setup
    - Initialize WebGL2 context
    - Set up viewport and handle resizing
- [ ] 2. Shaders & Geometry
    - Vertex shader for full-viewport quad
    - Fragment shader for feathered alpha
    - Quad geometry buffer
- [ ] 3. Texture Management
    - Create textures for each image
    - Upload images as textures
- [ ] 4. Animation State
    - Track active layers, scale, and state
    - Track zoom level and elapsed time
- [ ] 5. Animation Loop
    - Use requestAnimationFrame
    - Update scales, handle layer transitions
    - Draw all active layers, back-to-front
- [ ] 6. Drawing Logic
    - Set up transforms, bind textures, set uniforms
    - Draw quad for each layer
- [ ] 7. End Condition
    - Stop animation when only one layer remains and fills viewport
- [ ] 8. (Optional) Texture Cleanup
    - Delete textures for inactive layers (for large stacks)
