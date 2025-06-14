# Drag-and-Drop Mask Loss – Fix Task List

Tick each box when finished.

---

## 1  Always ship the UUID in gallery → prompt drag

- [ ] **gallery.js** – in the `dragstart` handler
  - add `uuid : rec.uuid` to the object stored in `window.imaginer_gallery_drag_store`.

## 2  Forward it into the drop-area manager

- [ ] **prompt_panel.js** – in the *internal gallery* drop branch
  1. Read `uuid` from the stored object:
     ```js
     const { blob, promptText, created, mask_blob, uuid } = …
     ```
  2. Pass it when calling `drop_area_manager.add_image`:
     ```js
     drop_area_manager.add_image(blob, mask_file, uuid);
     ```

## 3  Safety net: let drop_area fetch mask by uuid if mask_blob==null

*(code already exists in `drop_area.js` – no change needed once uuid is forwarded)*

## 4  Synchronise gallery’s in-memory copy when a mask is saved

- [ ] **viewer.js**
  - After `sessionStore.update(...)` succeeds, dispatch an event:
    ```js
    window.dispatchEvent(new CustomEvent('imaginer.mask-updated', {
      detail: { created, image_id: this.image_id, mask_blob, uuid }
    }));
    ```

- [ ] **gallery.js**
  - Add listener:
    ```js
    window.addEventListener('imaginer.mask-updated', e => {
      const { created, mask_blob, uuid } = e.detail;
      const rec = this.records_by_created[created];
      if (rec) {
        rec.mask_blob = mask_blob;
        rec.uuid      = uuid;
      }
    });
    ```
  - No re-render needed; the existing thumbnail object will now provide `mask_blob` on future drags.

## 5  (Opt.) visual feedback immediately after saving mask

- [ ] If desired, add a small UI refresh so that thumbnails get the red outline without reloading.  (Not required for functional fix.)

---

**Done when:** dragging an image that has just been masked shows the red border in the input area without reloading the page.