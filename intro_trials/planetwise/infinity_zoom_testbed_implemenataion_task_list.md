
# Infinity Zoom Testbed Implementation Task List

**Important:** The animation must always create a visual effect of zooming in—each new image layer appears larger, filling the viewport as the animation progresses. The effect should be that the viewer is moving deeper into the image stack, not zooming out. This is a core requirement for all tasks below.

- [ ] Project Structure & Data
  - [x] Create a simple HTML file with a `<canvas>` filling the viewport
  - [x] Embed the layer data directly in the code as a JavaScript array
  - [x] Define a constant for the image folder path
- [ ] Data Parsing & Image Preloading
  - [x] Parse the embedded layer data into an array of `{zoom, image}` objects
  - [x] Preload all images before starting the animation
  - [x] Store images in an array matching the parsed layer order
- [ ] Canvas Setup & Resizing
  - [x] Set up the canvas to always match the window size
  - [x] Add an event listener to resize the canvas dynamically
- [ ] Animation State & Loop
  - [x] Track the current zoom progress and which layers are visible/in transition
  - [x] Use `requestAnimationFrame` for the animation loop
  - [x] When the innermost layer is reached, reset to loop
- [ ] Zoom & Layer Transition Logic
  - [x] For each frame, calculate the current zoom level
  - [x] Ensure the zoom logic causes each new image layer to appear larger as the animation progresses (zooming in only; images must not shrink)
  - [x] Determine which layers are visible (above minimal threshold)
  - [x] For each visible layer, compute its scale and draw it, centered and scaled to fill the viewport
  - [x] Draw layers in order: outermost to innermost
- [ ] Drawing Logic
  - [x] Draw each visible image layer, perfectly centered and scaled
  - [x] Ensure no borders/empty space (cover the viewport)
  - [x] Only draw layers that are visible or in transition
- [ ] Minimal Threshold & Looping
  - [x] Define a minimal size threshold for when a layer becomes visible
  - [x] When the last layer fills the view, restart the animation
