# Infinity Zoom Animation Project Plan

## Overview
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

This plan outlines the structure and requirements for the infinity zoom animation project, ensuring flexibility and ease of maintenance.