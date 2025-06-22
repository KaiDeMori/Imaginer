
**Zoom Property Explanation:**
The `zoom` value for each layer specifies how much smaller (in percent) the current layer is compared to the previous one. For example, a zoom of `50` means the visible area of this layer is 50% the width and height of the previous layer. The absolute scale of any layer is the product of all previous layers' zoom values (as fractions). For example, if the zoom values for layers 2, 3, and 4 are 50, 50, and 25, then the scale for layer 4 is:
`scale_4 = 1.0 × (50/100) × (50/100) × (25/100) = 0.0625`
This means layer 4 is 6.25% the size of the original image.

# Infinity Zoom Testbed Implementation Roadmap

**Important:** The animation must always create a visual effect of zooming in—each new image layer appears larger, filling the viewport as the animation progresses. The effect should be that the viewer is moving deeper into the image stack, not zooming out. This is a core requirement for all implementation steps below.

## 1. Project Structure & Data
- Create a simple HTML file with a `<canvas>` filling the viewport.
- Embed the layer data (zoom factor, image name per line) directly in the code or HTML.
  **Note:** Specify zoom factors as whole-number percentages (e.g., use `50` for 50%, `25` for 25%). Do not use decimal fractions like `0.5` or `0.25`.
- Define a constant for the image folder path.

## 2. Data Parsing & Image Preloading
- Parse the embedded layer data into an array of `{zoom_factor, image}` objects.
  // Zoom factors must be whole-number percentages (e.g., 50, 25), not decimals (e.g., 0.5, 0.25)
- Preload all images before starting the animation.
- Store images in an array matching the parsed layer order.

## 3. Canvas Setup & Resizing
- Set up the canvas to always match the window size.
- Add an event listener to resize the canvas dynamically.

## 4. Animation State & Loop
- Track the current zoom progress and which layers are visible/in transition.
- Use `requestAnimationFrame` for the animation loop.
- When the innermost layer is reached, reset to loop.

### For each frame

- Calculate the current zoom level.
- Ensure the zoom logic causes each new image layer to appear larger as the animation progresses (zooming in only; images must not shrink).
- Determine which layers are visible (above minimal threshold).
- For each visible layer, compute its scale and draw it, centered and scaled to fill the viewport.
- Draw layers in order: outermost to innermost.



### Drawing logic

- Draw each visible image layer, perfectly centered and scaled.
- Each image is drawn preserving its original aspect ratio, preventing any stretching or distortion.
- The drawing logic ensures the image fills the viewport as much as possible without altering its aspect ratio (letterboxing may occur if the aspect ratios differ).
- Ensure no borders/empty space (cover the viewport) unless aspect ratio differences require letterboxing.
- Only draw layers that are visible or in transition.
- **Check:** If images appear to get smaller as the animation progresses, the zoom direction is incorrect and must be fixed to ensure zooming in.

## 7. Minimal Threshold & Looping
- Define a minimal size threshold for when a layer becomes visible.
- When the last layer fills the view, restart the animation.

## 8. (Optional) Future Enhancements
- Add transparency or edge blurring for smoother transitions.
- Support for zooming out or interactive controls.
