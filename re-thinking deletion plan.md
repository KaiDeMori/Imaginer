# Re-Thinking Deletion – Plan

## Problems with the current implementation

### 1. Timestamps used as unique keys everywhere

`records_by_created`, `_thumbnail_containers`, and `selected_for_deletion` all use the `created` timestamp as the key. If two images share the same timestamp (very easy when importing multiple images via drag-and-drop in the same second), only one gets tracked. This causes:
- Some images not being selectable at all
- Wrong counts in the confirm dialog
- Images surviving deletion because they were never referenced

### 2. Delete mode state is split and inconsistent

The delete-mode toggle event handler:
1. Removes `delete-mode` from the grid CSS **first**
2. Then checks if selections exist and calls `_confirm_and_delete_selected()`
3. If the user cancels, `_clear_selection()` removes highlight classes – but the mode class is already gone

This means there is a window where images are highlighted but the grid is no longer styled for delete mode – an invalid state.

### 3. Async `Promise.all` for concurrent IndexedDB deletions

Each deletion opens its own transaction. If one fails, the others may have already completed, leaving partial state:
- Some thumbnails removed from DOM, others not
- `records_by_created` partially cleaned
- Database partially cleaned
- No rollback or retry

### 4. `_clear_selection()` relies on stale lookup

`_clear_selection()` iterates `selected_for_deletion` and looks up containers via `_thumbnail_containers[created]`. If the container was already deleted from the map (e.g., during a partial deletion), the highlight is never removed.

### 5. `_delete_image` (single image) is unused dead code

The method `_delete_image(created, container)` is never called anywhere – deletion only goes through `_delete_selected_images`. Dead code adds confusion.

---

## New approach

### Core principle: use `id` as the ONLY identifier for deletion

Every record in IndexedDB has a unique auto-increment `id`. This is the only value that is guaranteed to be unique. All selection and deletion logic must use `id`, never `created`.

`created` is ONLY used for **display sort order** in the gallery grid. Nothing else.

### State model

There are exactly two states:

| State | Grid CSS | Thumbnails clickable for | Trash button |
|-------|----------|--------------------------|--------------|
| **Normal** | (none) | Viewing in viewer | Dim |
| **Delete mode** | `delete-mode` | Toggling selection | Red/active |

**Invariants that must always hold:**
- If `delete_mode === false` → no thumbnail has `selected-for-deletion` class, `selected_for_deletion` set is empty
- If `delete_mode === true` → grid has `delete-mode` class
- The count shown in the confirm dialog === `selected_for_deletion.size` === number of DOM elements with `selected-for-deletion` class

### Data structures (changed)

| Old | New | Why |
|-----|-----|-----|
| `records_by_created` (keyed by `created`) | `records_by_id` (keyed by `id`) | `id` is unique, `created` is not |
| `_thumbnail_containers` (keyed by `created`) | `_thumbnail_containers` (keyed by `id`) | Same reason |
| `selected_for_deletion` (`Set<created>`) | `selected_for_deletion` (`Set<id>`) | Same reason |

Each thumbnail DOM element gets a `data-record-id` attribute storing the record `id`.

### Deletion flow (new)

```
1. User clicks trash icon → enter delete mode
   - Set delete_mode = true
   - Add "delete-mode" class to grid
   - Clear selected_for_deletion (empty set)
   
2. User clicks thumbnails to toggle selection
   - Toggle id in selected_for_deletion set
   - Toggle "selected-for-deletion" class on the container
   
3. User clicks trash icon again → trigger deletion
   - If selected_for_deletion is empty → just exit delete mode, clear everything
   - If selections exist → show confirm(`Delete N image(s)?`)
     - User cancels → stay in delete mode, keep selections (user can re-decide)
     - User confirms → execute deletion, then exit delete mode

4. Execute deletion (synchronous-style, sequential):
   - Snapshot the set: ids_to_delete = [...selected_for_deletion]
   - For each id in ids_to_delete (sequentially, awaited one by one):
     a. await database_store.delete(id)
     b. Remove DOM container
     c. Remove from records_by_id
     d. Remove from _thumbnail_containers
     e. Remove from selected_for_deletion
   - After all done: exit delete mode (clear set, remove grid class, reset button)
   - Update empty state
```

### Key design decisions

1. **No `Promise.all`** – deletions happen one by one. Each step fully completes before the next. This prevents partial state and is simpler to reason about. Performance is irrelevant: deleting a handful of IndexedDB records sequentially takes milliseconds.

2. **Cancel keeps you in delete mode** – If the user clicks the trash icon and a confirm appears, cancelling keeps the selections and stays in delete mode. The user can change their selection or click trash again. This avoids the "highlight without delete mode" invalid state.

3. **No overlay needed** – Sequential deletion of a few records is instant. No spinner/overlay required.

4. **`_delete_image` removed** – All deletion goes through one path: `_delete_selected_images()`. No dead code.

5. **`created` never used in deletion** – `created` only determines sort order when rendering thumbnails. The deletion pipeline only ever references `id`.

6. **Menu bar button reset** – After deletion completes (or when exiting delete mode with no selections), the menu bar trash button must be reset to its inactive visual state. This is done by dispatching an event or by the gallery directly resetting the button state via a callback.

### Menu bar integration

The menu bar trash button toggles delete mode on/off. The gallery listens for the event. When deletion completes, the gallery dispatches `imaginer.delete_mode_toggled` with `active: false` to reset the button, OR the gallery stores a reference/callback to reset the button.

Simpler: the gallery dispatches a **new** event `imaginer.delete_mode_exited` that the menu bar listens for to reset the button visual. This decouples the two.

### Thumbnail keying

Each container gets `data-record-id` set to the record's `id`. All lookups (click handling, selection, deletion) use this attribute or the `_thumbnail_containers[id]` map.

### What about imported images?

Imported images (drag-and-drop) call `database_store.save()` which returns the generated `id`. This `id` is immediately used to key the thumbnail. No timestamp collision possible.

### Migration from `records_by_created` to `records_by_id`

Since `records_by_created` is only an in-memory structure (rebuilt every page load from IndexedDB), the migration is just changing the key from `rec.created` to `rec.id` in `loadImages()`. No data migration needed.

We keep a reference from the record itself to its `created` value (it's a field on the record object), so we can still sort the grid by `created`.

---

## Summary of changes

### gallery.js
- Rename `records_by_created` → `records_by_id`
- Rekey `_thumbnail_containers` by `id` instead of `created`
- Rekey `selected_for_deletion` by `id` instead of `created`
- Add `data-record-id` attribute to each thumbnail container
- Rewrite click handler to use `id` from `data-record-id`
- Rewrite `_delete_selected_images()` to be sequential (for-of with await)
- Remove `_delete_image()` (dead code)
- Remove overlay methods (`_show_deletion_overlay`, `_remove_deletion_overlay`)
- Change delete-mode-toggle handler: cancel keeps selections, only confirm triggers deletion
- Dispatch `imaginer.delete_mode_exited` event when leaving delete mode
- Update mask event handler to look up record by `image_id` (already in the event detail) instead of `created`
- Update DnD handler to look up record by `id`
- Update all other references from `created`-keyed lookups to `id`-keyed lookups

### app.js
- Change all `gallery.records_by_created[created] = ...` to `gallery.records_by_id[record_id] = ...`
- This is critical: `app.js` stores records after generation using `created` as key. With multiple images generated simultaneously, they share the same `created` value, overwriting each other. Using `record_id` fixes this.

### menu_bar.js
- Listen for `imaginer.delete_mode_exited` to reset button visual state

### database_store.js
- No changes needed (already uses `id` as primary key)
