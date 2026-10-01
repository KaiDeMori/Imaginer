# Gallery import button

## Goal

A 📂 button imports pictures into the gallery through the system's open dialog, and the gallery accepts any number and size of pictures, asking first when a batch is large.

## Plan

Drag and drop between apps is hard for some users; the system's open dialog is the familiar way in.

- The 📂 sits in the menu bar between 🗑️ and ⚙️, with the tooltip "Import". It opens the open dialog through a hidden `<input type="file" multiple>` that accepts PNG, JPEG and WebP.
- Drop and 📂 share one gallery import method: the drop path in `Gallery.enable_drag_and_drop` becomes that method.
- Limits exist only where something outside Imaginer demands them. The edit request keeps OpenAI's: `MAXIMUM_IMAGE_COUNT_PER_EDIT_REQUEST` (16, renamed from `MAX_IMAGE_COUNT`) and `MAXIMUM_BYTES_PER_EDIT_REQUEST_IMAGE` (50 MB, renamed from `MAX_IMAGE_BYTES`); the input area checks both. The gallery checks neither: `validate_image_file` keeps only the type check.
- Above `IMPORT_COUNT_CONFIRMATION_THRESHOLD` (100) pictures, both gallery doors ask before any work: "You picked <count> pictures. Should all of them go into the gallery?" with "Yes, all of them" and "Cancel", in a dialog built like `components/delete_confirm_modal.js`. An accidental large batch is hard to clean up.

## Steps

- [ ] The edit request's limits carry their new names; the input area checks both, the gallery neither.
- [ ] Drop and 📂 share one gallery import method, with the confirmation above `IMPORT_COUNT_CONFIRMATION_THRESHOLD`.
- [ ] The 📂 button sits in the menu bar and opens the system's open dialog.
- [ ] Node checks specify the limits and the threshold, and `tools/check/check.sh` runs them.
- [ ] README, User Manual and Technical Manual describe the button and the limits.
- [ ] The screenshots in `screenshots/` show the new menu bar.
