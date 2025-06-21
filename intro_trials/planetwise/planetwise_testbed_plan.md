# Infinity Zoom Animation Testbed Plan

## Overview
**Note:** This document outlines a testbed plan for the infinity zoom animation. The goal is to test the system's behavior under minimal complexity. As such, no error handling or additional features are included in this plan. The `layers.txt` data has been embedded directly into the HTML file to ensure compatibility when running locally without a server. The image folder is now defined as a constant in the code, and only image filenames are listed in the data array for reduced repetition and easier maintenance.

The project involves creating an "infinity zoom" animation using a series of images. Each image represents a zoomed-in layer of the previous one, sharing the same center. The animation will smoothly transition between these layers, zooming in and then zooming back out in a continuous loop.

## Image Details
- All images are 2048x2048 pixels.
- Images are named sequentially (e.g., `01_planet.png`, `02_planet.png`, ..., `09_alien.png`).
- The initial number in the filename indicates the layer order.

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
- Loop the animation back and forth continuously.
- No need to define the number of images in the code; it will be determined by the number of lines in `layers.txt`.


## Additional Considerations
- The animation should be simple and auto-looping.
- The zoom factors and image sequence can be easily adjusted by modifying `layers.txt`.


## Rendering Method Decision (Experimental)

For this testbed, we will use a `<canvas>` element for rendering the animation. This approach is chosen because it allows all image layers to be drawn, scaled, and composited in a single context, ensuring perfect alignment and smooth, simultaneous zooming. Using canvas also makes it easier to experiment with future effects such as transparency, edge blurring, or custom compositing.

This is an experimental decision and may be revisited as we learn more from implementation and testing. If new requirements or discoveries suggest a different approach, we can adapt accordingly.

For now, all images are fully opaque and stacked in order. (Future enhancements may include transparency or edge blurring to improve the visual transition between layers.)


## Animation Concept Clarification

The animation starts by displaying the first (outermost) image layer. As the zoom progresses, the next image layer is already present beneath the first, and both layers are zoomed in simultaneously at the same rate. This cascading process continues: each subsequent layer is revealed and zoomed in together with all previous layers, until the innermost (final) layer is reached.

At every moment, all visible layers are perfectly aligned and share the same center point. The effect is a seamless, continuous zoom, where each new layer appears as you reach its scale threshold, giving the illusion of infinite depth.