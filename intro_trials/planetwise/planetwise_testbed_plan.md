# Infinity Zoom Animation Testbed Plan

## Overview
**Note:** This document outlines a testbed plan for the infinity zoom animation. The goal is to test the system's behavior under minimal complexity. As such, no error handling or additional features are included in this plan. The `layers.txt` data has been embedded directly into the HTML file to ensure compatibility when running locally without a server. The image folder is now defined as a constant in the code, and only image filenames are listed in the data array for reduced repetition and easier maintenance.

The project involves creating an "infinity zoom" animation using a series of images. Each image represents a zoomed-in layer of the previous one, sharing the same center. The animation smoothly transitions between these layers by introducing each new layer at a tiny scale and growing it as the zoom progresses. Only the image layers that are currently visible or in transition are drawn at any moment, ensuring seamless and efficient rendering. For now, the animation only supports zooming in (not zooming out).

## Image Details
- All images are 2048x2048 pixels.
- Images can have arbitrary filenames (e.g., `planet.png`, `continent.png`, `alien.png`).
- The order of layers is determined by their order in the data array or in `layers.txt`, not by filename numbering or padding.

## Zoom Factors
- Zoom factors vary between layers (mostly 50%, but some layers are 25% or 10%).
- A text file (`layers.txt`) will define each layer and its zoom percentage.

### Example `layers.txt` Format
```
50,01_planet.png
50,02_planet.png
25,03_planet.png
50,04_planet.png
50,05_continent.png
10,06_city.png
50,07_street.png
50,08_garden.png
50,09_alien.png
```

## Animation Requirements
- Use `requestAnimationFrame` for smooth animation.
- No need to define the number of images in the code; it will be determined by the number of lines in `layers.txt`.
- For each frame, only draw the image layers that are currently visible or in transition (i.e., those whose scaled size is above a minimal threshold).


## Additional Considerations
- The animation should be simple and auto-looping.
- The zoom factors and image sequence can be easily adjusted by modifying `layers.txt`.


## Rendering Method Decision (Experimental)

For this testbed, we will use a `<canvas>` element for rendering the animation. This approach is chosen because it allows all relevant image layers (those visible or in transition) to be drawn, scaled, and composited in a single context, ensuring perfect alignment and smooth, simultaneous zooming. Using canvas also makes it easier to experiment with future effects such as transparency, edge blurring, or custom compositing.

This is an experimental decision and may be revisited as we learn more from implementation and testing. If new requirements or discoveries suggest a different approach, we can adapt accordingly.

For now, only the necessary image layers are drawn (fully opaque and stacked in order as needed). Future enhancements may include transparency or edge blurring to improve the visual transition between layers.


## Animation Concept Clarification


### Layer Visibility and Transition Logic

At any moment, only the image layers that are currently visible or in transition are drawn. The process works as follows (zooming in only):

- The animation starts by displaying the first (outermost) image layer, filling the view. This is always drawn as the current base layer.
- As the zoom progresses, the next (deeper) image layer is introduced at a very small scale (almost a pixel), perfectly aligned and centered.
- As you continue zooming in, the new layer grows in size. When it fills the view, it becomes the new base layer and is always drawn.
- Depending on the zoom factor between layers, it may be necessary to show more than two layers at once. If the next-next layer's scaled size exceeds a minimal threshold (e.g., a few pixels), it is also drawn, starting at a tiny scale.
- For each frame, the code checks which deeper layers (including the current base layer) are large enough to be visible (above a minimal threshold) and draws them in order, from outermost to innermost.
- This ensures that all relevant layers are drawn for smooth transitions, and no abrupt popping-in of new images occurs.

All visible layers are perfectly aligned and share the same center point. The effect is a seamless, continuous zoom, where each new layer appears as soon as it is large enough to be seen, giving the illusion of infinite depth. (Zooming out is not supported in this version.)