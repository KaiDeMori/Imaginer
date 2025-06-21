# Alien Arrival Overview (Version 3)

## Infinity Zoom Concept
The "infinity zoom" concept involves creating a visual effect where layers progressively zoom into deeper details. For illustration, we use the following example:

### Example
#### Resolution and Image Specs
- **Size**: 1024×1024 pixels (before upscaling).
- **Upscaling Factor**: Typically set to 4× (e.g., 1024×1024 → 4096×4096).
- **Precision**: 8-bit non-linear integer.
- **Color Space**: RGB color.

#### Example Layers
1. **Planet Layer**: Represents the outermost view (e.g., a planet).
2. **Continent Layer**: Represents a zoomed-in view of a specific area on the planet.

### General Concept
The infinity zoom workflow can be applied to any set of layers, where each layer represents a progressively zoomed-in view. The steps remain similar, with adjustments based on the specific layers and creative goals.

### Naming Convention
This approach is often referred to as a "mask-based LOD swap" or "infinite zoom cut-out" in game development parlance. It highlights the use of alpha masks to progressively reveal higher-detail layers during the zoom effect.

### Mask Creation Workflow for High-Quality Images

To ensure pixel-perfect assets and maintain resolution fidelity during the infinity zoom effect, the following workflow is recommended:

1. **Canvas Preparation**: Expand the canvas to a common size without resampling to avoid quality loss.
2. **Upscaling**: Use nearest-neighbor scaling (integer factor) to upscale the image temporarily. This method preserves sharp edges and avoids interpolation artifacts.
3. **Mask Application**: Add alpha masks to create holes that progressively reveal higher-detail layers during the zoom effect.
4. **Exporting**: Downscale the image back to its original resolution and export the final PNGs to match the raw renders.

Automating repetitive steps with tools like ImageMagick or custom scripts can streamline the process and reduce errors. This approach, often referred to as "mask-based LOD swap" or "infinite zoom cut-out," ensures high-quality results while minimizing manual effort.