// gallery_dnd_status.js
// Plan and checklist for enabling drag-and-drop of gallery thumbnails into the prompt panel

/*
Goal: Allow users to drag a thumbnail from the gallery and drop it into the prompt panel's drop area, so it behaves like an external image drop (adds the image to prompt_panel.dropped_images and updates the thumbnails).

---

## Implementation Plan & Task Checklist

1. Make gallery thumbnails draggable
   - [x] Set `draggable="true"` on each thumbnail image or its container.
   - [x] Add `dragstart` event to the thumbnail to set the drag data.
   - [x] Use `event.dataTransfer.setData` to set a custom type (e.g., `application/x-imaginer-blob`).
   - [x] Optionally use `event.dataTransfer.setDragImage` for better visuals.

2. Transfer image data
   - [x] Use a global variable or singleton to temporarily store the dragged blob, and set a unique ID in the drag data.
   - [ ] (Alternative) Convert the blob to a DataURL and set it as drag data (less ideal for large images).

3. Handle drop in prompt panel
   - [x] In the drop handler, check if the drag data includes the custom type.
   - [x] If so, retrieve the blob from the global store and add it to `dropped_images`.
   - [x] Call `_update_input_image_thumbnails()` to refresh the UI.

4. Fallback/Compatibility
   - [x] Ensure that external file drops still work as before.

5. Visual feedback
   - [ ] Show appropriate drag-over effects when dragging from the gallery.

---

## Notes
- Use loose_snake_case for all new variable, method, and file names.
- Retain normal uppercasing for abbreviations and standard conventions.
- Prefer full English words over abbreviations unless standard.

*/
