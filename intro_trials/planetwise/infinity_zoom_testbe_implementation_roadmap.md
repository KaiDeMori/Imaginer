# Infinity Zoom Testbed Implementation Roadmap

## 1. Project Structure & Data
- Create a simple HTML file with a `<canvas>` filling the viewport.
- Embed the layer data (zoom factor, image filename per line) directly in the code or HTML.
- Define a constant for the image folder path.

## 2. Data Parsing & Image Preloading
- Parse the embedded layer data into an array of `{zoom_factor, filename}` objects.
- Preload all images before starting the animation.
- Store images in an array matching the parsed layer order.

## 3. Canvas Setup & Resizing
- Set up the canvas to always match the window size.
- Add an event listener to resize the canvas dynamically.

## 4. Animation State & Loop
- Track the current zoom progress and which layers are visible/in transition.
- Use `requestAnimationFrame` for the animation loop.
- When the innermost layer is reached, reset to loop.

## 5. Zoom & Layer Transition Logic
- For each frame:
  - Calculate the current zoom level.
  - Determine which layers are visible (above minimal threshold).
  - For each visible layer, compute its scale and draw it, centered and scaled to fill the viewport.
  - Draw layers in order: outermost to innermost.

## 6. Drawing Logic
- Draw each visible image layer, perfectly centered and scaled.
- Ensure no borders/empty space (cover the viewport).
- Only draw layers that are visible or in transition.

## 7. Minimal Threshold & Looping
- Define a minimal size threshold for when a layer becomes visible.
- When the last layer fills the view, restart the animation.

## 8. (Optional) Future Enhancements
- Add transparency or edge blurring for smoother transitions.
- Support for zooming out or interactive controls.
