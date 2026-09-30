# Edit request

The specification of this step is the step "7. Edit request" in `Tasks/Rock_solid_metadata.md`, together with the terms and rules in `misc/metadata_terms.md`. This plan turns it into code changes. Two Node checks are the executable specification: `tools/check/image_intake_check.mjs` for `pixels_only_PNG`, and `tools/check/drop_area_manager_check.mjs` for the entry label.

## Design

### `image_conversion.js`

The import from `./PNG_chunks.js` becomes `import { encode_PNG_RGBA, is_PNG, strip_PNG } from "./PNG_chunks.js";`. One function is added:

```js
export async function pixels_only_PNG(blob, convert = convert_to_PNG) {}
```

- `pixels_only_PNG(blob, convert)`: *pixels only* for any image. `const bytes = new Uint8Array(await blob.arrayBuffer())`. When `is_PNG(bytes)`, returns `new Blob([strip_PNG(bytes)], { type: "image/png" })`; when `strip_PNG` throws (a PNG whose chunks are truncated), returns `await convert(blob)` instead. When the bytes are not a PNG, returns `await convert(blob)`, a clean PNG by construction. Errors from `convert` propagate. The `convert` parameter exists so that the Node check can pass a converter that needs no browser.
- The comment above it, verbatim: `// Pixels only: a PNG keeps its pixel chunks and nothing else; anything else is converted, which yields a clean PNG by construction.`

Nothing else in the module changes.

### `components/image_validation.js`

`validate_mask_file(mask_file, image_file, image_name = image_file.name)`: the three messages that name the image use `image_name` instead of `image_file.name`. Nothing else changes.

### `components/drop_area_manager.js`

- An entry is `{ image: Blob, mask: File | null, uuid?: string | null, label: string }`; `label` is the name the input area shows for the image, because a gallery image is a `Blob` without a name. The JSDoc types of `dropped_images`, `try_add_images`, `add_image` and `get_images` say so.
- `try_add_images(entries)` passes `entry.label` as the third argument of `validate_mask_file`, and passes `entry.label` on to `add_image`.
- `add_image(image_file, mask_file = null, uuid = null, label = "")` stores `label` in the entry.
- Nothing else changes.

### `components/generation_panel.js`

- `_update_input_image_thumbnails`: `img.title = entry.label + "\nClick to remove"`.
- The internal gallery branch of the drop listener: the block that sets `blob.name` on a `Blob`, with its comment, is removed; the `image_validation.js` module is no longer imported in that branch, so its `Promise.all` loads only `drop_area_manager.js` and `error_modal.js`. The entry becomes `{ image: blob, mask: mask_file, uuid, label: `${sanitize_prompt_for_filename(promptText, "gallery_image")}.png` }`.
- The external file branch: the entry gains `label: png_name(file.name)`, the same name the `File` receives.
- Nothing else changes.

### `app.js`

- `import { pixels_only_PNG } from "./image_conversion.js";` joins the existing import of `can_convert_images` from that module, as one import statement.
- In the edit request branch, the construction of the form data, from `const form_data = new FormData();` down to the mask handling with its `console.debug` lines, moves inside the existing `try`, before `if (enable_streaming)`, so that a failure while reducing an image reaches the user through the `catch` and the placeholders and the counter are restored by the `finally`. The `debug_mask` function stays where it is.
- The images: `for (const file of dropped_images)` with `form_data.append("image[]", file, file.name)` becomes a loop with an index that appends `await pixels_only_PNG(file)` as `image_${index + 1}.png`, counting from one.
- The mask: `form_data.append("mask", active_mask, active_mask.name || "mask.png")` becomes `form_data.append("mask", await pixels_only_PNG(active_mask), "mask.png")`.
- The comment above the image loop, verbatim: `// Images and mask reach OpenAI as pixels only, under neutral names, whatever they are in the gallery.`
- Nothing else changes. The streaming path builds the form data once and sends it per image as today.

### What does not change

- `components/viewer/`: the mask is stored as the canvas produced it and cleaned only at the edit request, because a mask never leaves the app in any other way.
- `image_intake.js`, `image_export.js`, `gallery_migration.js`, `PNG_chunks.js`.
- `tools/check/`: the main model extends `image_intake_check.mjs` before the implementation and wires `drop_area_manager_check.mjs` into `check.sh` at Verification.
- `README.md`, `User_Manual/` and `misc/`: the main model writes the documentation after Verification.

## Implementation steps

1. **Pixels only and the label.** Change `image_conversion.js`, `components/image_validation.js` and `components/drop_area_manager.js` as Design specifies. Gate: `bash tools/check/check.sh` prints `check passed` (it runs `image_intake_check.mjs`, which asserts `pixels_only_PNG`), and `node tools/check/drop_area_manager_check.mjs` prints `drop_area_manager check passed`. The check passes because every import exists.
2. **The request.** Change `components/generation_panel.js` and `app.js` as Design specifies. Gate: `bash tools/check/check.sh` prints `check passed`, and `node tools/check/drop_area_manager_check.mjs` prints `drop_area_manager check passed`. The check passes because every import exists and no file loads a removed symbol.

## Documentation

- `README.md`
  - Data and Privacy
- `User_Manual/Imaginer_User_Manual.md`
  - Image Editing: what reaches OpenAI
  - Mask Mode: the mask reaches OpenAI as pixels only
- `User_Manual/Imaginer_Technical_Manual.md`
  - OpenAI Integration: the statement on what edits send
  - Image Formats: the statement on mask PNGs

The main model also updates, at Close and not as documentation: `misc/metadata_terms.md` (the open point "Masks" closes: the mask is cleaned at the edit request only), and `misc/metadata_gap_analysis.md` (the section Edit request and gap 12).

## Asserted behaviours

Definitions: "a clean PNG" is a PNG whose chunks are only `IHDR`, `PLTE`, `tRNS`, `IDAT` and `IEND`; "a converter stub" is a function that returns a known PNG blob without a browser.

### `image_conversion.js`

Every item in `tools/check/image_intake_check.mjs` passes. Among them: `pixels_only_PNG` of a PNG with a `tEXt` chunk and the forms returns a clean PNG without calling the converter; of a truncated PNG and of a JPEG returns the converter stub's PNG.

### `components/drop_area_manager.js` and `components/image_validation.js`

Every item in `tools/check/drop_area_manager_check.mjs` passes. Among them: an entry keeps its label; a discarded mask is reported with the entry's label; `validate_mask_file` names the image by the given name and falls back to the file's name.

### In the browser

- An edit with an imported JPEG and a gallery image with a mask succeeds; the request's parts, seen in the browser's network tools, are named `image_1.png`, `image_2.png` and `mask.png`, and each is a PNG.
- A gallery file that is still a JPEG, dragged into the input area, edits successfully.
- The input area's tooltip shows the file's name ending in `.png` for an import and the prompt-based name for a gallery image.
- A mask that does not match its image is discarded with a message that names the image by that same name.

## Out of scope

- The intro image and the unused files: step 8.
- Whether OpenAI applies an EXIF orientation: no longer relevant, because every image leaves upright.
