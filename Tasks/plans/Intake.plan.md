# Intake

The specification of this step is the step "5. Intake" in `Tasks/Rock_solid_metadata.md`, together with the terms and rules in `misc/metadata_terms.md`. This plan turns it into code changes. Two Node checks are the executable specification: `tools/check/PNG_encoder_check.mjs` for the PNG encoder and `tools/check/image_intake_check.mjs` for the intake and conversion modules.

## Design

### `PNG_chunks.js`

One function is added:

```js
export async function encode_PNG_RGBA({ width, height, rgba }) {}
```

- `rgba` is a `Uint8Array` of `width * height * 4` bytes, four samples per pixel in the order red, green, blue, alpha, rows from top to bottom. It throws `Error("Wrong RGBA length.")` when the length does not match.
- The result is a `Uint8Array`: the signature, `IHDR` with the width, the height, bit depth 8, color type 6, compression method 0, filter method 0 and interlace method 0, one `IDAT` chunk, and `IEND`.
- The image data is one filtered row per image row, each prefixed with its filter type byte, compressed with `CompressionStream("deflate")`, which produces the ZLIB format PNG requires. The filter of each row is chosen per row among the five PNG filter types (None 0, Sub 1, Up 2, Average 3, Paeth 4), with four bytes per pixel and the previous row as the "up" row (zeros for the first row), by the standard heuristic: for each candidate, sum the absolute values of the filtered bytes read as signed bytes, and take the candidate with the smallest sum; on a tie the lowest filter type wins. Filtering roughly halves the size of a photograph, which matters for the gallery database, the ZIP backup, and the edit request limit.
- The chunks are written with `write_PNG_chunks`, so the result parses with `read_PNG_chunks` and passes `strip_PNG` unchanged.

Internal helpers for the five filters and the choice follow `loose_snake_case`. Nothing else in the module changes.

### `image_conversion.js`

A new module in the repository root. It imports `encode_PNG_RGBA` from `./PNG_chunks.js`. It exports:

```js
export const CONVERSION_UNSUPPORTED_MESSAGE = "This browser cannot convert JPEG and WebP images. Imaginer needs a current Firefox or Chrome, served over https or from localhost.";

export function can_convert_images() {}
export async function convert_to_PNG(blob) {}
```

- `can_convert_images()`: true when `createImageBitmap` and `VideoFrame` are functions in the global scope. `VideoFrame` exists only in secure contexts, which the message names.
- `convert_to_PNG(blob)`: returns a `Promise<Blob>` of type `image/png` with the pixels the browser displays for `blob`, upright, without any metadata. When `can_convert_images()` is false it throws `Error(CONVERSION_UNSUPPORTED_MESSAGE)`. Otherwise, in order:
  1. `const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image", premultiplyAlpha: "none" })`. The colour space conversion stays at the browser's default, so a tagged JPEG comes out as the browser displays it; `premultiplyAlpha: "none"` keeps semi-transparent WebP pixels as exact as the decoder allows.
  2. The pixels are read through a `VideoFrame`: `const frame = new VideoFrame(bitmap, { timestamp: 0, alpha: "keep" })`; the width and height are `frame.visibleRect.width` and `frame.visibleRect.height` when `visibleRect` is set, otherwise `bitmap.width` and `bitmap.height`; `const buffer = new Uint8Array(frame.allocationSize({ format: "RGBA" }))`; `const layouts = await frame.copyTo(buffer, { format: "RGBA" })`; `const { offset, stride } = layouts[0]`. When `layouts` is empty, `stride < width * 4`, or `offset + stride * height > buffer.length`, it throws `Error("The image could not be converted: unexpected pixel layout.")`. When `stride === width * 4`, `rgba` is `buffer.subarray(offset, offset + width * height * 4)`; otherwise the rows are copied into a new `rgba` array of `width * height * 4` bytes.
  3. The frame and the bitmap are closed as soon as the pixels are copied, before encoding, so the encoder does not hold them in memory. They are also closed on every error path.
  4. `return new Blob([await encode_PNG_RGBA({ width, height, rgba })], { type: "image/png" })`.
  Errors from steps 2 to 4 are rethrown as `Error("The image could not be converted: " + reason)`, where `reason` is the original error's message, except that a `RangeError` (an allocation that failed) becomes `Error("The image is too large to convert.")`. Errors from `createImageBitmap` propagate as they are, because `validate_file_readable` has already turned the common ones into messages.

The module receives one file comment at the top, verbatim: `// Conversion: a JPEG or WebP becomes a PNG with the pixels the browser displays, read through a VideoFrame so that no canvas, and no canvas noise, is on the way.`

### `image_intake.js`

A new module in the repository root. Its top level imports only modules Node can load: `is_PNG`, `read_PNG_prompt` and `strip_PNG` from `./PNG_chunks.js`; `convert_to_PNG` from `./image_conversion.js`; `read_jpeg_metadata` from `./components/jpeg_metadata_reader.js`; `read_webp_metadata` from `./components/webp_metadata_reader.js`; `validate_file_readable` and `validate_image_file` from `./components/image_validation.js`. It exports:

```js
/** @typedef {{ image_blob: Blob, prompt_text: string }} Intake_result */
/** @typedef {{ name: string, message: string }} Intake_failure */

export async function read_import_prompt(file, bytes) {}
export async function intake_import(file, convert = convert_to_PNG) {}
export async function intake_model_output(blob) {}
export async function accept_model_output(blob) {}
export function describe_import_failures(failures) {}
```

- `read_import_prompt(file, bytes)`: `bytes` are the file's bytes. When `is_PNG(bytes)`, returns `read_PNG_prompt(bytes)`. Otherwise returns `(await read_jpeg_metadata(file)) || (await read_webp_metadata(file))`; each reader call is wrapped so that a thrown error counts as the empty string, because a prompt is a side benefit and never fails an import. The format is decided by the bytes, not by `file.type`, so a renamed file is read as what it is.
- `intake_import(file, convert)`: the *Import to Gallery* and *Import to input area* door. `file` is a `File` or a `Blob`. Steps, in order:
  1. `validate_image_file(file)`; when invalid, throws `Error` with its `error` text.
  2. `validate_file_readable(file)`; when invalid, throws `Error` with its `error` text.
  3. `const bytes = new Uint8Array(await file.arrayBuffer())`, then `const prompt_text = await read_import_prompt(file, bytes)`. The prompt is read before the conversion, because the conversion drops every metadata.
  4. When `is_PNG(bytes)`: `image_blob` is `new Blob([strip_PNG(bytes)], { type: "image/png" })`, which applies *strip* and removes *Imaginer metadata* in one pass. When `strip_PNG` throws (a PNG the browser decodes but whose chunks are truncated), `image_blob` is `await convert(file)` instead, which re-encodes what the browser displays. Otherwise `image_blob` is `await convert(file)`, a fresh PNG without metadata. Any image the browser decodes is converted, whatever its real format; the declared type was checked in step 1.
  5. Returns `{ image_blob, prompt_text }`.

  The `convert` parameter defaults to `convert_to_PNG` and exists so that the Node check can pass a converter that needs no browser.
- `intake_model_output(blob)`: the *model output* door. `const bytes = new Uint8Array(await blob.arrayBuffer())`. When `localStorage.getItem("imaginer.strip_metadata") === "true"`, returns `new Blob([strip_PNG(bytes)], { type: "image/png" })`; otherwise returns `blob` itself. No form is written: the gallery file carries no *Imaginer metadata*; Export writes the forms. Errors propagate.
- `accept_model_output(blob)`: returns `{ image_blob, failure }`: `image_blob` is the result of `intake_model_output(blob)` and `failure` is `null`; when `intake_model_output` throws, `image_blob` is `blob` itself and `failure` is the error's message. A paid generation is never thrown away; the caller tells the user.
- `describe_import_failures(failures)`: returns `{ message, details }` for `Error_modal.show`: `message` is `<count> file(s) could not be imported.`; `details` is one line per failure joined with `\n`: the failure's `message` as it is when it starts with the quoted name `"<name>"`, which the validators' texts do, otherwise `<name>: <message>`.

The module receives one file comment at the top, verbatim: `// Intake: every image that enters Imaginer passes here once, so every gallery file and every input area image is a PNG without metadata, and the prompt is kept in the record.`

### `components/gallery.js`

- The imports of `is_PNG` and `read_PNG_prompt` from `../PNG_chunks.js`, of `read_jpeg_metadata` and of `read_webp_metadata` are removed; the local function `read_image_prompt` is removed. `import { describe_import_failures, intake_import } from "../image_intake.js";` is added. The `image_validation.js` import keeps `validate_image_count` and `with_batch_hint`, and drops `validate_file_readable` and `validate_image_file`, which `intake_import` now runs.
- The drop listener in `enable_drag_and_drop` keeps the count check with its message, before any file work. The two validation loops are removed. The import loop becomes: for each file, in a `try`: `const { image_blob, prompt_text } = await intake_import(file)`, `const created = Math.floor(Date.now() / 1000)`, the record `{ created, image_blob, prompt_imgs: [] }` with `prompt_text` set when it is not empty, `id = await window.database_store.save(record)` when the store exists, `this.records_by_id[id] = { id, ...record }`, and `this.create_or_update_thumbnail(null, image_blob, prompt_text, created, id)`. In the `catch`, the failure `{ name: file.name, message: error.message || String(error) }` is collected and the loop continues with the next file. After the loop, when failures were collected, `Error_modal.show(describe_import_failures(failures))` runs once. A failing file therefore never stops the others, a failing `save` reaches the user, and the thumbnails appear one by one while a batch converts.
- The comment above the loop, verbatim: `// Each file stands on its own: one that cannot be imported is reported after the batch, and the others still land in the gallery.`
- Nothing else in the file changes.

### `components/generation_panel.js`

- `import { describe_import_failures, intake_import } from "../image_intake.js";` and `import { MAX_IMAGE_BYTES } from "./image_validation.js";` are added.
- The constructor sets `this.importing_count = 0`.
- In the Generate click handler, `this.onGenerate(prompt_text, { embed_itxt: ..., embed_xmp: ... })` becomes `this.onGenerate(prompt_text)`. The prompt options are read at Export, not at the Generate click. The handler returns without doing anything while `this.importing_count > 0`, so a click, or Ctrl+Enter which clicks the button, cannot send a request without the images that are still converting.
- The external file branch of the drop listener (`// --- Fallback: external file drop ---`) keeps `const files = Array.from(event.dataTransfer.files)` where it is, before any `await`, because the transfer's file list is empty afterwards. The work runs inside the existing `Promise.all(...).then(...)` callback, which becomes `async`, after `with_batch_hint` is imported there. In order:
  1. `const count_check = validate_image_count(drop_area_manager.get_images().length, files.length)`; when invalid, `Error_modal.show(with_batch_hint(count_check.error, files.length > 1))` and return. `validate_image_count` joins the dynamic import of `image_validation.js` in that branch. Too many files are rejected at once, before any conversion.
  2. `this.importing_count += 1`, the placeholder span `#input-image-drop-placeholder` shows `Converting…`, and both are undone in a `finally` at the end: the count goes back down and the placeholder text returns to `Drop image(s) for editing`, then `this._update_input_image_thumbnails()` runs.
  3. For each file, in a `try`: `const { image_blob } = await intake_import(file)`; when `image_blob.size > MAX_IMAGE_BYTES`, the failure `{ name: file.name, message: `"${file.name}" is ${(image_blob.size / 1048576).toFixed(1)}MB as a PNG, which exceeds the ${MAX_IMAGE_BYTES / 1048576}MB limit for editing.` }` is collected and the file is skipped, because the edit request has that limit; otherwise the entry `{ image: new File([image_blob], png_name(file.name), { type: "image/png" }), mask: null, uuid: null }` is collected. In the `catch`, `{ name: file.name, message: error.message || String(error) }` is collected. `png_name(name)` is a local function that replaces the extension of `name` with `.png` (`name.replace(/\.[^.]*$/, "") + ".png"`), so the input area's tooltip shows the file under its stored form.
  4. When entries exist, `const result = await drop_area_manager.try_add_images(entries)`; when `!result.ok`, the failure `{ name: "", message: result.error }` joins the list. On success `this.dropped_images = drop_area_manager.get_images().map((entry) => entry.image)`.
  5. When failures were collected, `Error_modal.show(describe_import_failures(failures))` runs once, at the end. One drop shows at most one dialog.
- `_update_input_input_thumbnails` is not renamed; `_update_input_image_thumbnails` stays as it is, and the placeholder text it shows or hides is the one the drop handler sets.
- Nothing else in the file changes. `drop_area_manager.js` does not change: it validates the entries it receives, which are now PNG files under the size limit.

### `app.js`

- The import of `process_image_metadata` is replaced by `import { accept_model_output } from "./image_intake.js";`. The line `window.process_image_metadata = process_image_metadata;` is removed.
- A function `save_model_output(blob, prompt_text, created)` is added inside the `DOMContentLoaded` handler, before `consume_image_stream`. It calls `const { image_blob, failure } = await accept_model_output(blob)`; when `failure` is not `null`, it calls `Error_modal.show({ message: "The image was saved as OpenAI returned it, because its metadata could not be removed. It may still carry OpenAI's metadata.", hint: failure })`. It then saves the record `{ created, image_blob, prompt_text, prompt_imgs: [] }` with `database_store.save`, sets `gallery.records_by_id[record_id]` to `{ id: record_id, created, image_blob, prompt_text, prompt_imgs: [] }`, and returns `{ record_id, image_blob }`.
- The comment above `save_model_output`, verbatim: `// The four places that receive model output share this path, so the intake rules and the record shape live once.`
- `consume_image_stream` loses its `embed_options` parameter. In its `completed` branch, the block from `blob = await process_image_metadata(...)` to `gallery.records_by_id[record_id] = {...}` becomes `const created = Math.floor(Date.now() / 1000); const { record_id, image_blob } = await save_model_output(blob, prompt_text, created);` followed by `gallery.update_placeholder(placeholder, image_blob, false, prompt_text, created, record_id);`.
- The `Generation_panel` callback loses its `embed_options` parameter; the two `consume_image_stream` calls no longer pass `embed_options`.
- In the edit request branch, the loop over `data.data` replaces the block from `blob = await process_image_metadata(...)` to `gallery.records_by_id[record_id] = {...}` with `const { record_id, image_blob } = await save_model_output(blob, prompt_text, created);` and uses `image_blob` in the two gallery calls that follow.
- In the generation request branch, the single-image block and the multi-image loop change the same way; the `console.debug("[App] Saved with ID =", ...)` line stays, after the save.
- Nothing else in the file changes.

### `tools/browser_tests/conversion_tests.js`

- `bitmap_of` uses the same `createImageBitmap` options as `convert_to_PNG`: `{ imageOrientation: "from-image", premultiplyAlpha: "none" }`, so round 2 measures the pipeline the app runs. Nothing else in the test page changes.

### Removed files

- `process_image_metadata.js`: nothing imports it after this step. Its line in `cache_manifest.json` is removed.
- `cache_manifest.json` gains the lines `image_conversion.js` and `image_intake.js` after `image_export.js`, in that order.

### What does not change

- `image_export.js`, `XML_entities.js`, `filename_helper.js`, `components/image_validation.js`, `components/drop_area_manager.js`, `storage/database_store.js`.
- The intro image (`expose_internals_for_intro().add_image`): step 8.
- The existing gallery files: step 6.
- The edit request's filenames and pixels only: step 7.
- `tools/check/`: the main model removes `process_image_metadata_check.mjs` and takes it out of `check.sh` before implementation step 1 starts, so that step 2 may delete the adapter; it wires `PNG_encoder_check.mjs` and `image_intake_check.mjs` into `check.sh` at Verification.
- `README.md`, `User_Manual/` and `misc/`: the main model writes the documentation after Verification.

## Implementation steps

1. **The modules.** Add `encode_PNG_RGBA` to `PNG_chunks.js`, create `image_conversion.js` and `image_intake.js` as Design specifies, and add their lines to `cache_manifest.json`. Gate: `bash tools/check/check.sh` prints `check passed`, `node tools/check/PNG_encoder_check.mjs` prints `PNG_encoder check passed`, and `node tools/check/image_intake_check.mjs` prints `image_intake check passed`. The check passes because the new modules import only existing files and the manifest lists them.
2. **The doors.** Change `components/gallery.js`, `components/generation_panel.js`, `app.js` and `tools/browser_tests/conversion_tests.js` as Design specifies, delete `process_image_metadata.js`, and remove its line from `cache_manifest.json`. Gate: `bash tools/check/check.sh` prints `check passed`, `node tools/check/PNG_encoder_check.mjs` prints `PNG_encoder check passed`, and `node tools/check/image_intake_check.mjs` prints `image_intake check passed`. The check passes because no module imports the deleted file any more and the manifest lists no missing file.

## Documentation

- `README.md`
  - Features: the bullet Import
  - Project Structure
- `User_Manual/Imaginer_User_Manual.md`
  - Importing Images: conversion to PNG, metadata removal, an animated PNG keeps its first image, a PNG's orientation stored as metadata is dropped, the count is checked first and every other failure affects only its file
  - Image Editing: the paragraph on dragging image files from the computer, the same batch rule, the converting state and the size limit for editing
  - PNG Metadata Options: all three bullets, because generated images no longer carry the prompt and imports are always cleaned
  - Download All Images: the sentence on imported JPEG and WebP files
- `User_Manual/Imaginer_Technical_Manual.md`
  - Image Formats: what the gallery stores, the conversion pipeline, the intake rules, the batch rule, and the statement on prompt embedding
  - OpenAI Integration: the statement on `process_image_metadata`, and the Export statement's sentence on imported JPEG and WebP files
- `User_Manual/Imaginer_FAQ.md`
  - Browser Issues: the bullet on a dropped batch with one invalid file
- `User_Manual/localStorage_keys_explained.md`
  - `imaginer.strip_metadata`, `imaginer.add_prompt_to_image`, `imaginer.add_prompt_to_image_xmp`

The main model also updates, at Close and not as documentation: `misc/metadata_terms.md` (the Intake rules gain the error rule), and `misc/metadata_gap_analysis.md` (the sections Gallery door and Input area door, the comparison paragraph under Input area door, the Edit request table's rows on external metadata and filenames with its two consequence bullets, the "Writers of Imaginer metadata" bullet on intake, the "Also found" paragraph, and gaps 1, 2, 3, 4, 6, 8 and 12).

## Asserted behaviours

Definitions: "forms" are the iTXt form and the XMP form as the terms define them; "a palette PNG" is a PNG with color type 3, a `PLTE` chunk and a `tRNS` chunk; "a converter stub" is a function that returns a known PNG blob without a browser.

### `PNG_chunks.js`

Every item in `tools/check/PNG_encoder_check.mjs` passes. Among them: `encode_PNG_RGBA` gives the chunks `IHDR`, `IDAT`, `IEND`; the `IHDR` holds the width, the height, bit depth 8, color type 6 and zeros; the inflated image data is one filter byte in 0 to 4 plus `width * 4` bytes per row, and unfiltering it reproduces the source rows exactly; a smooth 64 by 64 gradient compresses to less than half its raw size; a wrong length throws `Wrong RGBA length.`.

### `image_conversion.js` and `image_intake.js`

Every item in `tools/check/image_intake_check.mjs` passes. Among them:

- Under Node, `can_convert_images()` is false and `convert_to_PNG` rejects with `CONVERSION_UNSUPPORTED_MESSAGE`.
- `intake_import` of a palette PNG with a `tEXt` chunk and both forms returns a PNG with exactly `IHDR`, `PLTE`, `tRNS`, `IDAT`, `IEND` and the prompt from the forms.
- `intake_import` of a PNG without a prompt returns the empty prompt.
- `intake_import` of a JPEG with an XMP description returns the converter stub's PNG and the decoded description; the converter received the file.
- `intake_import` of a file typed `image/png` whose bytes are a JPEG uses the converter, not the PNG path.
- `intake_import` of a PNG whose `IEND` is cut off uses the converter and keeps the prompt read before.
- `intake_import` of a JPEG whose bytes make the JPEG reader throw returns the empty prompt and the converter's PNG.
- `intake_import` of a file of type `image/gif` rejects with the message of `validate_image_file`.
- `intake_model_output` with the strip option on returns exactly the five pixel chunk types and no form; with the strip option off it returns the blob itself.
- `accept_model_output` with the strip option on and bytes that are not a PNG returns the blob itself and the failure `Not a PNG file.`; with a PNG it returns the stripped PNG and no failure.
- `describe_import_failures` names the count, keeps a validator's message that starts with the quoted name, and prefixes every other message with the name.

### In the browser

- Dropping a JPEG into the gallery gives a thumbnail; ⬇️ on it downloads `<prompt>_<created>_<id>.png`, and the file opens as an upright image with the colours of the original.
- Dropping a JPEG with an EXIF orientation of 6 into the gallery shows it upright, as Firefox shows the original.
- Dropping a PNG that carries a prompt into the gallery shows 💬 with that prompt, and the stored file carries no text chunk: ⬇️ with strip off and both prompt options off gives a file whose chunks are only the pixel chunks.
- Dropping three files of which one is not an image gives two thumbnails and one dialog naming the third file with the reason.
- Dropping seventeen files into the gallery, or into the input area, gives one dialog about the count and no thumbnail.
- Dropping a JPEG into the input area shows `Converting…` in the drop area until the thumbnail appears; a click on Generate during that time does nothing; the thumbnail's tooltip ends in `.png`; an edit request with it succeeds.
- Dropping a JPEG of 40 megapixels into the input area gives a dialog that names the file, its size as a PNG and the limit for editing, and no thumbnail; the same file drops into the gallery.
- Generating in the streaming mode, in the non-streaming mode with one image, with several images, and through an edit request stores images without text chunks when the strip option is on; with the strip option off, ⬇️ with strip off and both prompt options off gives a file whose bytes equal the stored blob's.

## Out of scope

- The intro image: step 8.
- The existing gallery files stored before this step: step 6.
- The edit request's filenames and the mask: step 7.
- A canvas fallback for browsers without `VideoFrame`: not planned; such a browser cannot import JPEG and WebP, and the message says so.
- Colour spaces: the browser's default conversion is used and no colour chunk is written.
