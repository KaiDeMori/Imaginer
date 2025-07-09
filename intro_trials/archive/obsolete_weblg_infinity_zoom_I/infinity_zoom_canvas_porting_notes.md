# Infinity Zoom Canvas Engine – Porting Notes for WebGL

## Core Animation Logic
- The first layer is displayed fully visible, centered, and maximized within the viewport, with no cropping. This may result in black bars (letterboxing or pillarboxing) depending on the viewport aspect ratio. The first layer is held static in this position for one second before the zoom animation begins.
- The zoom animation starts after this one-second pause, using an exponential scale for each layer: `scale *= exp(k * dt)` where `k = ln(growth_ratio)`.
- Layers are drawn back-to-front (first layer first, last layer last) for correct alpha blending.
- When the next layer in order has scaled up so that its visible area covers the entire viewport in both width and height (i.e., its size reaches at least the larger of the viewport's width or height), the previous layer is removed; animation continues with the new pair.
- Animation is frame-rate independent (uses real elapsed time).

## Layer Data & Preloading
- `LAYERS_DATA` defines the zoom factor and image filename for each layer.
- All images are preloaded before animation starts.
- Each layer except the first is pre-rendered with feathered edges (in canvas version, via offscreen canvas and gradients). The first layer is always rendered with hard edges (no feathering).

## Feathering
- Feathering is an alpha ramp at the image edges, implemented in canvas with gradients and in WebGL with a fragment shader. Feathering is applied only to layers after the first; the first layer is always rendered with hard edges (no feathering).
- Feather width is a percentage of image size (e.g., 8%).


## Drawing Pipeline
- On start: Draw the first layer fully visible, centered, and maximized within the viewport (no cropping, possibly black bars). Hold this static view for one second.
- After one second: Begin the zoom animation from this initial scale.
- Each frame after zoom starts:
  1. Update all active layer scales.
  2. When the current top layer above has scaled up so that its visible area covers the entire viewport in both width and height (i.e., its size reaches at least the larger of the viewport's width or height), the layer directly beneath it (the previous background) is removed from the stack, leaving the top layer as the new background.
  3. Draw all active layers, first layer first.
- Each layer is drawn as a centered square, scaled to its current size. The first layer is always drawn with hard edges (no feathering); subsequent layers use feathered edges.
- No panning or user interaction; zoom is automatic.

**Minimum Render Size:**
Layers are only drawn if their computed draw size is at least the value of `INFINITY_ZOOM_MINIMUM_RENDER_SIZE` (e.g., 3px). If a layer would be smaller than this threshold, it is skipped for that frame and will be drawn once it has grown large enough to be visible. This avoids unnecessary rendering of sub-pixel or visually insignificant images and ensures only relevant layers are drawn at any given time. The same constant should be reused in both the canvas and WebGL implementations for consistency.

## Texture Management (Canvas vs WebGL)
- Canvas: pre-renders feathered images to offscreen canvases.
- WebGL: will use fragment shader for feathering; only a few textures need to be resident at a time.

## Key Parameters
- `INFINITY_ZOOM_GROWTH_RATIO` (e.g., 1.2 per second)
- `FEATHER_PERCENT` (e.g., 0.08)
- Minimum render size for layers (to avoid drawing tiny images)

## Porting Considerations
- Exponential zoom math and layer sequencing logic can be ported directly.
- Feathering should be implemented in the fragment shader (already present in current WebGL code).
- Texture upload/removal logic should be added for memory efficiency (optional for small stacks).
- Animation loop and layer removal logic should match the canvas version for seamless effect.

## Out of Scope
- No user interaction, error handling, or fallback paths.

---
These notes summarize the canvas engine's logic and highlight the key points to preserve or adapt in the WebGL port.
