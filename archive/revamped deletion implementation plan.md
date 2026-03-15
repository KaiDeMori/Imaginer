# Revamped Deletion Implementation Plan

## Current Behaviour

1. User clicks trash can → button turns red, `delete_mode` flag set in gallery.
2. User clicks any image → `confirm()` dialog fires immediately for that single image.
3. Confirmed → image deleted from IndexedDB and DOM. Cancelled → nothing happens.
4. No batch selection, no loading feedback, no clear way to exit delete mode.

## Target Behaviour

1. User clicks trash can → "delete mode" enabled (button turns red).
2. User clicks images → thumbnail gets a **red border** ("selected for deletion"), no dialog yet.
   Clicking again on a selected image deselects it.
3. User clicks trash can again → confirmation dialog listing the count of selected images.
   - **Confirm** → show loading overlay, delete all selected images in parallel, remove overlay.
   - **Cancel** → clear selection, exit delete mode (button already went back to normal).
4. Re-entering delete mode clears any stale prior selection.

## Files Changed

| File | Change scope |
|------|-------------|
| `components/gallery.js` | All core changes |
| `components/menu_bar/menu_bar.js` | No changes needed – existing toggle logic already fits |

---

## gallery.js – Detailed Changes

### 1. Constructor additions
- Add `this.selected_for_deletion = new Set()` (keyed by `created` timestamp).
- Update the `imaginer.delete_mode_toggled` listener:
  - `active: true` → enter delete mode, **clear any stale selection** (clear set, remove CSS class from all thumbs).
  - `active: false` → if selection is non-empty → `_confirm_and_delete_selected()`; if empty → just exit (nothing to do). Regardless, clear selection and `delete-mode` class.
- Replace the CSS injected in the constructor:
  - Change `cursor: not-allowed` → `cursor: pointer` (users need to click to select).
  - Add `.gallery-thumb.selected-for-deletion` → red `outline` (e.g. `3px solid #ff5252`).
  - Keep hover opacity dimming.

### 2. `_build_thumbnail_content` – image click handler
- In delete mode, instead of `confirm()` + delete: toggle `.selected-for-deletion` on the closest `.gallery-thumb` container and add/remove `created` from `this.selected_for_deletion`.
- Non-delete-mode path is unchanged.

### 3. New method `_confirm_and_delete_selected()`
- Build a `confirm()` message: `"Delete X image(s)? This cannot be undone."`.
- If the user cancels → `_clear_selection()` and return.
- If confirmed → call `_delete_selected_images()`.

### 4. New method `_delete_selected_images()`
- `_show_deletion_overlay(count)` → renders a full-screen semi-transparent overlay with a "Deleting N images…" message (blocks all pointer events).
- `await Promise.all(...)` deletes each selected record:
  - `window.database_store.delete(rec.id)`
  - `delete this.records_by_created[created]`
  - `delete this._thumbnail_containers[created]`
  - `container.remove()`
- `_remove_deletion_overlay()`
- `_clear_selection()`
- `this.update_empty_state()`

### 5. Helper `_clear_selection()`
- Removes `.selected-for-deletion` from all thumbnails.
- Clears `this.selected_for_deletion`.

### 6. Overlay helpers `_show_deletion_overlay` / `_remove_deletion_overlay`
- Simple `div` injected into `document.body` with high `z-index`, covers full viewport, shows spinner emoji + count text.
- Stored as `this._deletion_overlay`.

---

## Edge cases / notes

- If the user somehow has no images selected and clicks confirm anyway, `_confirm_and_delete_selected` is never called (guarded by `selected_for_deletion.size > 0` check).
- Overlay uses `pointer-events: all` to block interactions while active.
- The `_delete_image` method used by the old flow is no longer called from anywhere after this change but can stay (it's not harmful).
