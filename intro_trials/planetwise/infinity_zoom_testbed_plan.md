# Infinity Zoom Animation Testbed Plan

## Overview
**Note:** This document outlines a testbed plan for the infinity zoom animation. The goal is to test the system's behavior under minimal complexity. As such, no error handling or additional features are included in this test app. The layer data (zoom factors and image names) is embedded directly in the HTML or code to ensure compatibility when running locally without a server. The image folder is now defined as a constant in the code (default:`zoom_images`), and only image names are listed in the data array for reduced repetition and easier maintenance.

**Important:** The animation must always create a visual effect of zooming in—each new image layer appears larger, filling the viewport as the animation progresses. The effect should be that the viewer is moving deeper into the image stack, not zooming out. This requirement is fundamental to the intended experience. See below for clarification.

The project involves creating an "infinity zoom" animation using a series of images. Each image represents a zoomed-in layer of the previous one, sharing the same center. The animation smoothly transitions between these layers by introducing each new layer at a tiny scale and growing it as the zoom progresses. Only the image layers that are currently visible or in transition are drawn at any moment, ensuring seamless and efficient rendering. For now, the animation only supports zooming in (not zooming out).

## Image Details
- All images are 2048x2048 pixels.
- Images can have arbitrary names (e.g., `planet.png`, `continent.png`, `alien.png`).
- The order of layers is determined by their order in the data array, not by image name numbering or padding.

## Zoom Factors
- Zoom factors vary between layers (mostly 50%, but some layers are 25% or 10%).
  **Note:** Specify zoom factors as whole-number percentages (e.g., use `50` for 50%, `25` for 25%). Do not use decimal fractions like `0.5` or `0.25`.
- The layer data array defines each layer and its zoom percentage.

### Example Layers Data Array Format
```
    // Zoom factors must be whole-number percentages (e.g., 50, 25), not decimals (e.g., 0.5, 0.25)
    const LAYERS_DATA = [
        { zoom: 25, image: 'Planet_totale.png' },
        { zoom: 25, image: 'Planet_close.png' },
        { zoom: 25, image: 'Continent.png' },
        { zoom: 25, image: 'Continent_Detail.png' },
    ];
```


## Animation Requirements
- The animation must always be full-screen, filling the entire browser viewport. The canvas should resize dynamically to match the window size, and the zoomed images should scale to fill the viewport as much as possible while preserving their original aspect ratio (no stretching or distortion). If the image and viewport aspect ratios differ, letterboxing may occur.
- The animation must visually zoom in: each new image layer should appear larger, giving the impression of moving deeper into the scene. At no point should the animation create a zooming out effect (where images get smaller and recede).
- Use `requestAnimationFrame` for smooth animation.
- No need to define the number of images in the code; it will be determined by the number of entries in the layer data array.
- For each frame, only draw the image layers that are currently visible or in transition (i.e., those whose scaled size is above a minimal threshold).
- For testing purposes, the animation repeats (loops) automatically after reaching the innermost layer, restarting the zoom-in sequence.


## Additional Considerations
- The animation should be simple and auto-looping.
- The zoom factors and image sequence can be easily adjusted by modifying the embedded layer data array.


## Rendering Method Decision (Experimental)

For this testbed, we will use a `<canvas>` element for rendering the animation. This approach is chosen because it allows all relevant image layers (those visible or in transition) to be drawn, scaled, and composited in a single context, ensuring perfect alignment and smooth, simultaneous zooming. Using canvas also makes it easier to experiment with future effects such as transparency, edge blurring, or custom compositing.

This is an experimental decision and may be revisited as we learn more from implementation and testing. If new requirements or discoveries suggest a different approach, we can adapt accordingly.

For now, only the necessary image layers are drawn (fully opaque and stacked in order as needed). Each image is rendered preserving its original aspect ratio, ensuring no stretching or distortion occurs. The drawing logic fits each image to the viewport as much as possible, centering it and allowing letterboxing if aspect ratios differ. Future enhancements may include transparency or edge blurring to improve the visual transition between layers.


## Animation Concept Clarification

**Zoom Direction Clarification:**

All visible layers are perfectly aligned and share the same center point. The effect is a seamless, continuous zoom in, where each new layer appears as soon as it is large enough to be seen, giving the illusion of infinite depth. **Zooming out (where images get smaller) is not supported and should not occur.**

**Tip:** To avoid confusion, always check that the animation logic causes images to grow larger as the animation progresses, not shrink. If the images appear to get smaller, the zoom direction is incorrect.


### Layer Visibility and Transition Logic

At any moment, only the image layers that are currently visible or in transition are drawn. The process works as follows (zooming in only):

- The animation starts by displaying the first (outermost) image layer, filling the view. This is always drawn as the current base layer.
- As the zoom progresses, the next (deeper) image layer is introduced at a very small scale (almost a pixel), perfectly aligned and centered.
- As you continue zooming in, the new layer grows in size. When it fills the view, it becomes the new base layer and is always drawn.
- Depending on the zoom factor between layers, it may be necessary to show more than two layers at once. If the next-next layer's scaled size exceeds a minimal threshold (e.g., a few pixels), it is also drawn, starting at a tiny scale.
- For each frame, the code checks which deeper layers (including the current base layer) are large enough to be visible (above a minimal threshold) and draws them in order, from outermost to innermost.
- This ensures that all relevant layers are drawn for smooth transitions, and no abrupt popping-in of new images occurs.

All visible layers are perfectly aligned and share the same center point. The effect is a seamless, continuous zoom, where each new layer appears as soon as it is large enough to be seen, giving the illusion of infinite depth. (Zooming out is not supported in this version.)