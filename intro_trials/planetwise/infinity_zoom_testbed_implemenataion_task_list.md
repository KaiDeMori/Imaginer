
# Infinity Zoom Testbed Implementation Task List

**Important:** The animation must always create a visual effect of zooming in—each new image layer appears larger, filling the viewport as the animation progresses. The effect should be that the viewer is moving deeper into the image stack, not zooming out. This is a core requirement for all tasks below.

- [ ] Project Structure & Data
  - [ ] Create a simple HTML file with a `<canvas>` filling the viewport
  - [ ] Embed the layer data directly in the code as a JavaScript array
  - [ ] Define a constant for the image folder path
- [ ] Data Parsing & Image Preloading
  - [ ] Parse the embedded layer data into an array of `{zoom, image}` objects
  - [ ] Preload all images before starting the animation
  - [ ] Store images in an array matching the parsed layer order
- [ ] Canvas Setup & Resizing
  - [ ] Set up the canvas to always match the window size
  - [ ] Add an event listener to resize the canvas dynamically
- [ ] Animation State & Loop
  - [ ] Track the current zoom progress and which layers are visible/in transition
  - [ ] Use `requestAnimationFrame` for the animation loop
  - [ ] When the innermost layer is reached, reset to loop
- [ ] Zoom & Layer Transition Logic
  - [ ] For each frame, calculate the current zoom level
  - [ ] Ensure the zoom logic causes each new image layer to appear larger as the animation progresses (zooming in only; images must not shrink)
  - [ ] Determine which layers are visible (above minimal threshold)
  - [ ] For each visible layer, compute its scale and draw it, centered and scaled to fill the viewport
  - [ ] Draw layers in order: outermost to innermost
- [ ] Drawing Logic
  - [ ] Draw each visible image layer, perfectly centered and scaled
  - [ ] Ensure no borders/empty space (cover the viewport)
  - [ ] Only draw layers that are visible or in transition
- [ ] Minimal Threshold & Looping
  - [ ] Define a minimal size threshold for when a layer becomes visible
  - [ ] When the last layer fills the view, restart the animation
