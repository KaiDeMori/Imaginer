# Infinity Zoom Canvas Engine – Porting Notes for WebGL

## Core Animation Logic
- Uses an exponential scale for each layer: `scale *= exp(k * dt)` where `k = ln(growth_ratio)`.
- Layers are drawn back-to-front (deepest first, topmost last) for correct alpha blending.
- When the top layer fills the viewport, it is removed; animation continues with the next pair.
- Animation is frame-rate independent (uses real elapsed time).

## Layer Data & Preloading
- `LAYERS_DATA` defines the zoom factor and image filename for each layer.
- All images are preloaded before animation starts.
- Each layer is pre-rendered with feathered edges (in canvas version, via offscreen canvas and gradients).

## Feathering
- Feathering is an alpha ramp at the image edges, implemented in canvas with gradients and in WebGL with a fragment shader.
- Feather width is a percentage of image size (e.g., 8%).

## Drawing Pipeline
- Each frame:
  1. Update all active layer scales.
  2. When the current top layer fills the viewport, the layer directly beneath it (the previous background) is removed from the stack, leaving the top layer as the new background.
  3. Draw all active layers, largest (deepest) first.
- Each layer is drawn as a centered square, scaled to its current size.
- No panning or user interaction; zoom is automatic.

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
