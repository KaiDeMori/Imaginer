# Feature: Mask Handling for Image Edit Requests

## Status Checklist

- [x] Only the mask of the first image in the drop area is used for the API request
- [ ] Red outline is shown on the first image if a mask is present and will be used
- [x] Adding more images with masks does not overwrite the first mask
- [x] Removing or reordering images updates which mask is used and the outline
- [ ] Mask is included as the `mask` parameter in the API call if present
- [ ] Visual indicator (outline) updates as the drop area changes
- [x] Prevent accidental overwriting of the mask
- [x] File kept up to date as implementation evolves

## Summary
This document captures the current findings and requirements for supporting mask uploads in the OpenAI image edit endpoint integration.

---

## 1. API Mask Parameter
- The OpenAI image edit endpoint (`/v1/images/edits`) accepts a single `mask` parameter.
- The `mask` must be a PNG file, same dimensions as the main image, and less than 4MB.
- Only one mask can be sent per request, even if multiple images are provided.

## 2. UI/UX Implications
- When users drop multiple images, only the mask associated with the **first image** in the drop area should be used for the request.
- If the first image has a mask, visually indicate this (e.g., show a red outline around the thumbnail).
- If additional images with masks are added, do **not** overwrite or change the mask used for the request; always use the mask from the first image.
- The logic must ensure that the mask selection is stable: reordering or removing images may change which mask is used, so the UI should update the outline accordingly.

## 3. Implementation Notes
- On preparing the request, check if the first dropped image has an associated mask. If so, include it as the `mask` parameter in the API call.
- Do not allow the mask to be replaced by subsequent images with masks unless the first image is removed.
- The UI should:
  - Show a red outline on the first image if a mask is present and will be used.
  - Remove the outline if the first image is removed or has no mask.
- The logic for managing dropped images and their masks must:
  - Prevent accidental overwriting of the mask.
  - Update the visual indicator as the drop area changes.

## 4. Open Questions
- Should the user be notified if a dropped image with a mask is ignored (because it is not the first image)?
- Should there be an explicit way to select which image's mask is used, or is the "first image only" rule sufficient?

---

## References
- See `Create image edit.md` for API details.
- See `prompt_panel.js` for drop area and image management logic.
- See `viewer.js` and `mask_manager.js` for mask creation and storage.
- See `feature_mask_status.md` (this file) for ongoing status and updates. Please keep this file updated as the implementation evolves.
