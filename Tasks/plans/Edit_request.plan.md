# Edit request

The specification of this step is the step "7. Edit request" in `Tasks/Rock_solid_metadata.md`, together with the terms and rules in `misc/metadata_terms.md`. This plan turns it into code changes. Two Node checks are the executable specification: `tools/check/image_intake_check.mjs` for `pixels_only_PNG`, and `tools/check/drop_area_manager_check.mjs` for the entry label and the named validation messages.

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

Three functions gain an optional name, because the input area holds gallery images as `Blob`s without a name and shows them under a label:

- `validate_image_file(file, name = file.name)`: its two messages use `name`.
- `validate_file_readable(file, name = file.name)`: its four messages use `name`.
- `validate_mask_file(mask_file, image_file, image_name = image_file.name)`: all four messages that name the image (not a PNG, over the size limit, dimensions do not match, could not be read) use `image_name`.

Every existing caller keeps its behaviour through the defaults. Nothing else changes.

### `components/drop_area_manager.js`

- An entry is `{ image: Blob, mask: File | null, uuid?: string | null, label: string }`; `label` is the name the input area shows for the image, because a gallery image is a `Blob` without a name. The JSDoc types of `dropped_images`, `try_add_images`, `add_image` and `get_images` say so.
- `try_add_images(entries)` passes `entry.label` as the name to `validate_image_file`, `validate_file_readable` and `validate_mask_file`, and passes `entry.label` on to `add_image`.
- `add_image(image_file, mask_file = null, uuid = null, label = "")` stores `label` in the entry.
- Nothing else changes.

### `components/generation_panel.js`

- The constructor sets `this.dropped_entries = []` next to `this.dropped_images = []`. `dropped_images` stays as it is; `dropped_entries` is what `app.js` reads, so that the request has the image, the mask and the label of every entry from one snapshot.
- Wherever `this.dropped_images = drop_area_manager.get_images().map((entry) => entry.image)` is assigned (the thumbnail click handler in `_update_input_image_thumbnails`, the internal gallery branch, and the external file branch), the line `this.dropped_entries = drop_area_manager.get_images().slice();` follows it.
- `_update_input_image_thumbnails`: `img.title = entry.label + "\nClick to remove"`.
- The internal gallery branch of the drop listener: the block that sets `blob.name` on a `Blob`, with its comment, is removed; the `image_validation.js` module is no longer imported in that branch, so its `Promise.all` loads only `drop_area_manager.js` and `error_modal.js`. The entry becomes `{ image: blob, mask: mask_file, uuid, label: `${sanitize_prompt_for_filename(promptText, "gallery_image")}.png` }`.
- The external file branch: `const label = png_name(file.name)` is computed once per file and used for both the `File`'s name and the entry's `label`.
- Nothing else changes.

### `app.js`

- The static import `import drop_area_manager from "./components/drop_area_manager.js";` is removed: the panel loads that module through `versioned_url`, which yields a second module instance, so the singleton `app.js` imported never held the input area's entries. `import { MAX_IMAGE_BYTES } from "./components/image_validation.js";` is added, and `pixels_only_PNG` joins the existing import from `./image_conversion.js` in one statement.
- In the `Generation_panel` callback, `const dropped_images = generation_panel.dropped_images || [];` becomes `const dropped_entries = generation_panel.dropped_entries || [];` followed by `const dropped_images = dropped_entries.map((entry) => entry.image);`, so the following lines keep working. The mask is taken from the same snapshot, before any `await`: `const active_mask = dropped_entries.length > 0 ? dropped_entries[0].mask : null;` replaces `const active_mask = drop_area_manager.get_active_mask();`, and it is declared where `dropped_images` is declared.
- In the edit request branch, the line `try {` moves up to just before `const form_data = new FormData();`; every other line stays where it is, so the whole construction of the form data runs inside the `try`, and a failure while reducing an image reaches the user through the existing `catch`, which shows the error and turns the placeholders red, while the existing `finally` restores the generation counter and the button. `debug_mask` moves with the block, because it sits inside that range.
- The images: the loop `for (const file of dropped_images)` with `form_data.append("image[]", file, file.name)` becomes a loop over `dropped_entries` with an index. For each entry: `const pixels = await pixels_only_PNG(entry.image)`; when `pixels.size > MAX_IMAGE_BYTES`, it throws `Error(`"${entry.label}" is ${(pixels.size / 1048576).toFixed(1)}MB as a PNG, which exceeds the ${MAX_IMAGE_BYTES / 1048576}MB limit for editing.`)`, the same wording the input area door uses; otherwise `form_data.append("image[]", pixels, `image_${index + 1}.png`)`, counting from one.
- The mask: `form_data.append("mask", active_mask, active_mask.name || "mask.png")` becomes `form_data.append("mask", await pixels_only_PNG(active_mask), "mask.png")`.
- The comment above the image loop, verbatim: `// Images and mask reach OpenAI as pixels only, under neutral names, whatever they are in the gallery.`
- Nothing else changes. The streaming path builds the form data once and sends it per image as today.

### What does not change

- `components/viewer/`: the mask is stored as the canvas produced it and cleaned only at the edit request, because a mask never leaves the app in any other way.
- `image_intake.js`, `image_export.js`, `gallery_migration.js`, `PNG_chunks.js`.
- `tools/check/`: the main model extended `image_intake_check.mjs` before the implementation and wires `drop_area_manager_check.mjs` into `check.sh` at Verification.
- `README.md`, `User_Manual/` and `misc/`: the main model writes the documentation after Verification.

## Implementation steps

1. **Pixels only and the names.** Change `image_conversion.js`, `components/image_validation.js` and `components/drop_area_manager.js` as Design specifies. Gate: `bash tools/check/check.sh` prints `check passed` (it runs `image_intake_check.mjs`, which asserts `pixels_only_PNG`), and `node tools/check/drop_area_manager_check.mjs` prints `drop_area_manager check passed`. The check passes because every import exists.
2. **The request.** Change `components/generation_panel.js` and `app.js` as Design specifies. Gate: `bash tools/check/check.sh` prints `check passed`, and `node tools/check/drop_area_manager_check.mjs` prints `drop_area_manager check passed`. The check passes because every import exists and no file loads a removed symbol.

## Documentation

- `README.md`
  - Data and Privacy
- `User_Manual/Imaginer_User_Manual.md`
  - Image Editing: what reaches OpenAI, and the size limit for a gallery image converted for the request
  - Mask Mode: the mask reaches OpenAI as pixels only
  - Converting Older Galleries: an image that could not be converted can still be edited
  - PNG Metadata Options: the edit request sends pixels only whatever the strip option says
- `User_Manual/Imaginer_Technical_Manual.md`
  - OpenAI Integration: the statement on what edits send
  - Image Formats: a new statement on the request reducing images and mask to their pixel chunks and converting a gallery file that is not a PNG, and the sentence on the 50 MB limit in the edit drop area

The main model also updates, at Close and not as documentation: `misc/metadata_terms.md` (the Edit request rules gain the bullet on a gallery file that is not a PNG; the open point "Masks" closes; the two Consequences on "no decoding" and "once per image" are qualified for a gallery file the migration has not converted), `misc/metadata_gap_analysis.md` (the section Edit request and gap 12; the Order bullet that says such a file must be refused; the comparison paragraph under Input area door that describes `blob.name`), and `Status.md` (the next step's wording).

## Asserted behaviours

Definitions: "a clean PNG" is a PNG whose chunks are only `IHDR`, `PLTE`, `tRNS`, `IDAT` and `IEND`; "a converter stub" is a function that returns a known PNG blob without a browser.

### `image_conversion.js`

Every item in `tools/check/image_intake_check.mjs` passes. Among them: `pixels_only_PNG` of a PNG with a `tEXt` chunk and the forms returns a clean PNG without calling the converter; of a truncated PNG and of a JPEG returns the converter stub's PNG.

### `components/drop_area_manager.js` and `components/image_validation.js`

Every item in `tools/check/drop_area_manager_check.mjs` passes. Among them: an entry keeps its label; a nameless blob of an unsupported type is refused with a message that carries the label and not `undefined`; a nameless blob the browser cannot decode is refused with a message that carries the label; a discarded mask, whether of the wrong type or unreadable, is reported with the entry's label; `validate_image_file` and `validate_mask_file` name the image by the given name and fall back to the file's name.

### In the browser

- With the strip option and both prompt options off, put a gallery PNG that still carries a `tEXt` chunk into the input area and edit. The request body, saved from the browser's network tools, holds the part `image_1.png` with only the chunks `IHDR`, `PLTE` or not, `tRNS` or not, `IDAT` and `IEND`. The same with the strip option on gives the same part.
- An edit with two images and a mask on the first: the parts are `image_1.png`, `image_2.png` and `mask.png`, in the order of the input area; the mask part holds only pixel chunks; the browser console logs `Sending image edit request WITH mask`.
- An import into the input area and a gallery image: the tooltips show the file's name ending in `.png` and the prompt-based name, and the gallery `Blob` in the console has no `name` property.
- A gallery file that is still a JPEG, seeded for the test by choosing Later at the conversion dialog with an older gallery, dragged into the input area and edited: the edit succeeds and the gallery file stays a JPEG.
- A gallery JPEG whose PNG exceeds the limit: Generate shows the dialog with its label and the converted size, the placeholders turn red, and Generate is enabled again.
- A mask that does not match its image, seeded through the console by replacing a record's `mask_blob` with a smaller PNG: dragging that image into the input area shows the message that names the image by the same name as the tooltip, and the image is added without the mask.

## Out of scope

- The intro image and the unused files: step 8.
- Whether OpenAI applies an EXIF orientation: no longer relevant, because every image leaves upright.
