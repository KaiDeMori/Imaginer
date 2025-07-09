# Image Region Zoom Refactor Tasklist

- [ ] **image_region_zoom_utils.js**
  - Extract and copy all matrix math, interpolation, and helper functions from the original HTML script into this file.
  - Export functions for use in the main logic file.

- [ ] **image_region_zoom.js**
  - Copy the main animation, WebGL setup, and event logic from the HTML script into this file.
  - Import and use functions from `image_region_zoom_utils.js`.
  - Ensure all global variables and state are managed here.

- [ ] **image_region_zoom_TRIAL.html**
  - Create a new HTML file for testing, referencing `image_region_zoom.js` and `image_region_zoom_utils.js` as external scripts.
  - Set up the UI and canvas as in the original, but with no inline script.

- [ ] **Update references and test**
  - Make sure all logic works as before, but is now modular and maintainable.
  - Test the animation and region zoom functionality in the new HTML file.

---

**Important:**

- Do **not** modify the original static HTML file at all. Leave it unchanged.
- All refactor work must be done by creating new files in the `image_region_zoom/` folder.
- Do not move or remove code from the original file—only copy and adapt as needed for the new modular structure.
