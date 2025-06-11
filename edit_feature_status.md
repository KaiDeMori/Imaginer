# Edit Feature Status

## Current Plan

### Drag-and-Drop Input Image Area
1. **File Size and Format Validation:**
   - Enforce API's file size limit (4MB) and format (PNG) during the drop.
   - Warn the user if the file is invalid.

2. **Multiple Images:**
   - Allow multiple images to be dropped.

3. **Storage:**
   - Store the dropped image(s) in memory for now.

4. **Error Handling:**
   - Use the existing `error_modal` dialog to display errors (e.g., invalid file type, size too large).

5. **Styling:**
   - Keep styling minimal for now.

## Progress
- [x] Implement drag-and-drop functionality.
- [x] Validate file size and format.
- [x] Store dropped images in memory.
- [x] Attach images to the API request.
- [x] Display thumbnails of dropped images.
- [x] Handle errors using `error_modal`.
- [x] Allow replacing images by dropping new ones.
- [ ] Test the feature end-to-end.
