# Gallery import button

## Goal

The 📂 button imports images into the gallery through the system's open dialog; the gallery sets no count or size limit and asks first when a batch is large.

## Plan

Drag and drop between apps is hard for some users; the system's open dialog is the familiar way in.

- The 📂 button sits in the menu bar between 🗑️ and ⚙️, with the tooltip "Import". It opens the system's open dialog through a hidden `<input type="file" multiple>` that accepts PNG, JPEG, WebP and ZIP files.
- Drop and the 📂 button share one gallery import method, `Gallery.import_files`.
- Limits exist only where something outside Imaginer demands them. The edit request keeps OpenAI's: `MAXIMUM_IMAGE_COUNT_PER_EDIT_REQUEST` (16) and `MAXIMUM_BYTES_PER_EDIT_REQUEST_IMAGE` (50 MB); the input area checks both. The gallery checks neither: `validate_image_file` keeps only the type check.
- Above `IMPORT_COUNT_CONFIRMATION_THRESHOLD` (100) images, drop and the 📂 button ask before any work: "You picked <count> pictures. Should all of them go into the gallery?" with "Yes, all of them" and "Cancel", in a dialog built like `components/delete_confirm_modal.js`. An accidental large batch is hard to clean up.

## Steps

- [x] Constants renamed; the input area checks both limits, the gallery neither.
- [x] One gallery import method, with the confirmation.
- [x] The 📂 button in the menu bar.
- [x] Node checks for the limits and the threshold, run by `tools/check/check.sh`.
- [x] README, User Manual and Technical Manual updated.
- [x] Screenshots in `screenshots/` retaken.
