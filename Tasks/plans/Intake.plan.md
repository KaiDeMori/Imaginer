# Intake

The specification of this step is the step "5. Intake" in `Tasks/Rock_solid_metadata.md`, together with the terms and rules in `misc/metadata_terms.md`. This plan turns it into code changes. Two Node checks are the executable specification: `tools/check/PNG_chunks_check.mjs` for the PNG encoder and `tools/check/image_intake_check.mjs` for the intake module.

## Design

### `PNG_chunks.js`

One function is added:

```js
export async function encode_PNG_RGBA({ width, height, rgba }) {}
```

- `rgba` is a `Uint8Array` of `width * height * 4` bytes, four samples per pixel in the order red, green, blue, alpha, rows from top to bottom. It throws `Error("Wrong RGBA length.")` when the length does not match.
- The result is a `Uint8Array`: the signature, `IHDR` with the width, the height, bit depth 8, color type 6, compression method 0, filter method 0 and interlace method 0, one `IDAT` chunk, and `IEND`. The image data is every row prefixed with the filter type byte 0, compressed with `CompressionStream("deflate")`, which produces the ZLIB format PNG requires. Unfiltered rows keep the encoder trivially exact; the file size is not a goal.
- The chunks are written with `write_PNG_chunks`, so the result parses with `read_PNG_chunks` and passes `strip_PNG` unchanged.

Nothing else in the module changes.

### `image_conversion.js`

A new module in the repository root. It imports `encode_PNG_RGBA` from `./PNG_chunks.js`. It exports:

```js
export function can_convert_images() {}
export async function convert_to_PNG(blob) {}
```

- `can_convert_images()`: true when `createImageBitmap` and `VideoFrame` are functions in the global scope.
- `convert_to_PNG(blob)`: returns a `Promise<Blob>` of type `image/png` with the pixels the browser displays for `blob`, upright, without any metadata. When `can_convert_images()` is false it throws `Error("This browser cannot convert JPEG and WebP images.")`. Otherwise: `const bitmap = await createImageBitmap(blob, { premultiplyAlpha: "none", colorSpaceConversion: "none" })`, which applies the EXIF orientation of a JPEG as the display does; then `const frame = new VideoFrame(bitmap, { timestamp: 0, alpha: "keep" })`; the width and height are `frame.visibleRect.width` and `frame.visibleRect.height` when `visibleRect` is set, otherwise `bitmap.width` and `bitmap.height`; `const buffer = new Uint8Array(frame.allocationSize({ format: "RGBA" }))`; `const layouts = await frame.copyTo(buffer, { format: "RGBA" })`; the rows are copied out of `buffer` with the `offset` and `stride` of `layouts[0]` into an `rgba` array of `width * height * 4` bytes; the result is `new Blob([await encode_PNG_RGBA({ width, height, rgba })], { type: "image/png" })`. The frame and the bitmap are closed in `finally` blocks. Every other error propagates.

The module receives one file comment at the top, verbatim: `// Conversion: a JPEG or WebP becomes a PNG with the pixels the browser displays, read through a VideoFrame so that no canvas, and no canvas noise, is on the way.`

### `image_intake.js`

A new module in the repository root. Its top level imports only modules Node can load: `is_PNG`, `read_PNG_prompt` and `strip_PNG` from `./PNG_chunks.js`; `convert_to_PNG` from `./image_conversion.js`; `read_jpeg_metadata` from `./components/jpeg_metadata_reader.js`; `read_webp_metadata` from `./components/webp_metadata_reader.js`; `validate_file_readable` and `validate_image_file` from `./components/image_validation.js`. It exports:

```js
/** @typedef {{ image_blob: Blob, prompt_text: string }} Intake_result */
/** @typedef {{ name: string, message: string }} Intake_failure */

export async function read_import_prompt(file, bytes) {}
export async function intake_import(file, convert = convert_to_PNG) {}
export async function intake_model_output(blob) {}
export function describe_import_failures(failures) {}
```

- `read_import_prompt(file, bytes)`: `bytes` are the file's bytes. When `is_PNG(bytes)`, returns `read_PNG_prompt(bytes)`. Otherwise returns `(await read_jpeg_metadata(file)) || (await read_webp_metadata(file))`; each reader returns the empty string for a file that is not its format. The format is decided by the bytes, not by `file.type`, so a renamed file is read as what it is.
- `intake_import(file, convert)`: the *Import to Gallery* and *Import to input area* door. `file` is a `File` or a `Blob`. Steps, in order:
  1. `validate_image_file(file)`; when invalid, throws `Error` with its `error` text.
  2. `validate_file_readable(file)`; when invalid, throws `Error` with its `error` text.
  3. `const bytes = new Uint8Array(await file.arrayBuffer())`, then `const prompt_text = await read_import_prompt(file, bytes)`. The prompt is read before the conversion, because the conversion drops every metadata.
  4. When `is_PNG(bytes)`: `image_blob` is `new Blob([strip_PNG(bytes)], { type: "image/png" })`, which applies *strip* and removes *Imaginer metadata* in one pass. Otherwise `image_blob` is `await convert(file)`, a fresh PNG without metadata.
  5. Returns `{ image_blob, prompt_text }`.

  The `convert` parameter defaults to `convert_to_PNG` and exists so that the Node check can pass a converter that needs no browser.
- `intake_model_output(blob)`: the *model output* door. `const bytes = new Uint8Array(await blob.arrayBuffer())`. When `localStorage.getItem("imaginer.strip_metadata") === "true"`, returns `new Blob([strip_PNG(bytes)], { type: "image/png" })`; otherwise returns `blob` itself. No form is written: the gallery file carries no *Imaginer metadata*; Export writes the forms. Errors propagate.
- `describe_import_failures(failures)`: returns `{ message, details }` for `Error_modal.show`: `message` is `<count> file(s) could not be imported.`; `details` is one line per failure, `<name>: <message>`, joined with `\n`.

The module receives one file comment at the top, verbatim: `// Intake: every image that enters Imaginer passes here once, so every gallery file and every input area image is a PNG without metadata, and the prompt is kept in the record.`

### `components/gallery.js`

- The imports of `is_PNG` and `read_PNG_prompt` from `../PNG_chunks.js`, of `read_jpeg_metadata` and of `read_webp_metadata` are removed; the local function `read_image_prompt` is removed. `import { describe_import_failures, intake_import } from "../image_intake.js";` is added. The `image_validation.js` import keeps `validate_image_count` and `with_batch_hint`, and drops `validate_file_readable` and `validate_image_file`, which `intake_import` now runs.
- The drop listener in `enable_drag_and_drop` keeps the count check with its message. The two validation loops are removed. The import loop becomes: for each file, in a `try`: `const { image_blob, prompt_text } = await intake_import(file)`, `const created = Math.floor(Date.now() / 1000)`, the record `{ created, image_blob, prompt_imgs: [] }` with `prompt_text` set when it is not empty, `id = await window.database_store.save(record)` when the store exists, `this.records_by_id[id] = { id, ...record }`, and `this.create_or_update_thumbnail(null, image_blob, prompt_text, created, id)`. In the `catch`, the failure `{ name: file.name, message: error.message || String(error) }` is collected and the loop continues with the next file. After the loop, when failures were collected, `Error_modal.show(describe_import_failures(failures))` runs once. A failing file therefore never stops the others, and a failing `save` reaches the user.
- The comment above the loop, verbatim: `// Each file stands on its own: one that cannot be imported is reported after the batch, and the others still land in the gallery.`
- Nothing else in the file changes.

### `components/generation_panel.js`

- `import { describe_import_failures, intake_import } from "../image_intake.js";` is added.
- In the Generate click handler, `this.onGenerate(prompt_text, { embed_itxt: ..., embed_xmp: ... })` becomes `this.onGenerate(prompt_text)`. The prompt options are read at Export, not at the Generate click.
- The external file branch of the drop listener (`// --- Fallback: external file drop ---`) becomes async work: for each file, in a `try`, `const { image_blob } = await intake_import(file)` and the entry `{ image: new File([image_blob], png_name(file.name), { type: "image/png" }), mask: null, uuid: null }`; in the `catch` the failure `{ name: file.name, message }` is collected. `png_name(name)` is a local function that replaces the extension of `name` with `.png` (`name.replace(/\.[^.]*$/, "") + ".png"`), so the input area's tooltip shows the file under its stored form. When failures were collected, `Error_modal.show(describe_import_failures(failures))` runs once. When at least one entry exists, `drop_area_manager.try_add_images(entries)` runs as today, with its error shown through `Error_modal.show(with_batch_hint(result.error, files.length > 1))`, and the thumbnails update as today. The dynamic imports in that branch stay as they are; `intake_import` is imported statically at the top, like `sanitize_prompt_for_filename`.
- Nothing else in the file changes. `drop_area_manager.js` does not change: it validates the entries it receives, which are now PNG files.

### `app.js`

- The import of `process_image_metadata` is replaced by `import { intake_model_output } from "./image_intake.js";`. The line `window.process_image_metadata = process_image_metadata;` is removed.
- A function `save_model_output(blob, prompt_text, created)` is added inside the `DOMContentLoaded` handler, before `consume_image_stream`. It applies `intake_model_output(blob)` in a `try`; in the `catch` it calls `Error_modal.show({ message: "The image was saved as OpenAI returned it, because its metadata could not be processed.", hint: error.message || String(error) })` and keeps `blob` as the image, so a paid generation is never lost. It then saves the record `{ created, image_blob, prompt_text, prompt_imgs: [] }` with `database_store.save`, sets `gallery.records_by_id[record_id]` to `{ id: record_id, created, image_blob, prompt_text, prompt_imgs: [] }`, and returns `{ record_id, image_blob }`.
- The comment above `save_model_output`, verbatim: `// The four places that receive model output share this path, so the intake rules and the record shape live once.`
- `consume_image_stream` loses its `embed_options` parameter. In its `completed` branch, the block from `blob = await process_image_metadata(...)` to `gallery.records_by_id[record_id] = {...}` becomes `const created = Math.floor(Date.now() / 1000); const { record_id, image_blob } = await save_model_output(blob, prompt_text, created);` followed by `gallery.update_placeholder(placeholder, image_blob, false, prompt_text, created, record_id);`.
- The `Generation_panel` callback loses its `embed_options` parameter; the two `consume_image_stream` calls no longer pass `embed_options`.
- In the edit request branch, the loop over `data.data` replaces the block from `blob = await process_image_metadata(...)` to `gallery.records_by_id[record_id] = {...}` with `const { record_id, image_blob } = await save_model_output(blob, prompt_text, created);` and uses `image_blob` in the two gallery calls that follow.
- In the generation request branch, the single-image block and the multi-image loop change the same way; the `console.debug("[App] Saved with ID =", ...)` line stays, after the save.
- Nothing else in the file changes.

### Removed files

- `process_image_metadata.js`: nothing imports it after this step. Its line in `cache_manifest.json` is removed.
- `cache_manifest.json` gains the lines `image_conversion.js` and `image_intake.js` after `image_export.js`, in that order.

### What does not change

- `image_export.js`, `XML_entities.js`, `filename_helper.js`, `components/image_validation.js`, `components/drop_area_manager.js`, `storage/database_store.js`.
- The intro image (`expose_internals_for_intro().add_image`): step 8.
- The existing gallery files: step 6.
- The edit request's filenames and pixels only: step 7.
- `tools/check/`: the main model removes `process_image_metadata_check.mjs` and wires `image_intake_check.mjs` into `check.sh`.
- `README.md`, `User_Manual/` and `misc/`: the main model writes the documentation after Verification.

## Implementation steps

1. **The modules.** Add `encode_PNG_RGBA` to `PNG_chunks.js`, create `image_conversion.js` and `image_intake.js` as Design specifies, and add their lines to `cache_manifest.json`. Gate: `bash tools/check/check.sh` prints `check passed`, `node tools/check/PNG_chunks_check.mjs` prints `PNG_chunks check passed`, and `node tools/check/image_intake_check.mjs` prints `image_intake check passed`. The check passes because the new modules import only existing files and the manifest lists them.
2. **The doors.** Change `components/gallery.js`, `components/generation_panel.js` and `app.js` as Design specifies, delete `process_image_metadata.js`, and remove its line from `cache_manifest.json`. Gate: `bash tools/check/check.sh` prints `check passed`, `node tools/check/PNG_chunks_check.mjs` prints `PNG_chunks check passed`, and `node tools/check/image_intake_check.mjs` prints `image_intake check passed`. The check passes because no module imports the deleted file any more and the manifest lists no missing file.

## Documentation

- `README.md`
  - Features: the bullets Import and Prompt embedding
  - Project Structure
- `User_Manual/Imaginer_User_Manual.md`
  - Importing Images: conversion to PNG, metadata removal, one report per batch instead of all-or-nothing
  - Using Images for Editing, or the Image Editing section: dropped files become PNGs
  - PNG Metadata Options: the strip option concerns generated images at save time and downloads; imports are always cleaned
  - Reading metadata from imported images
- `User_Manual/Imaginer_Technical_Manual.md`
  - Image Formats: what the gallery stores, the conversion, and the intake rules
  - OpenAI Integration: the statement on `process_image_metadata`
- `User_Manual/Imaginer_FAQ.md`
  - Any answer that mentions importing or the stored format

The main model also updates, at Close and not as documentation: `misc/metadata_gap_analysis.md` (the Gallery door and Input area door sections; gaps 1, 2, 3, 4, 6 and 8) and `misc/metadata_terms.md` if a wording needs it.

## Asserted behaviours

Definitions: "forms" are the iTXt form and the XMP form as the terms define them; "a palette PNG" is a PNG with color type 3, a `PLTE` chunk and a `tRNS` chunk; "a converter stub" is a function that returns a known PNG blob without a browser.

### `PNG_chunks.js`

Every item in `tools/check/PNG_chunks_check.mjs` passes. Among them: `encode_PNG_RGBA` of a 3 by 2 pattern gives the chunks `IHDR`, `IDAT`, `IEND`, an `IHDR` with width 3, height 2, bit depth 8, color type 6 and zeros, and an `IDAT` that inflates to two rows, each a filter byte 0 followed by the row's twelve samples; a wrong length throws `Wrong RGBA length.`.

### `image_intake.js`

Every item in `tools/check/image_intake_check.mjs` passes. Among them:

- `intake_import` of a palette PNG with a `tEXt` chunk and both forms returns a PNG with exactly `IHDR`, `PLTE`, `tRNS`, `IDAT`, `IEND` and the prompt from the forms.
- `intake_import` of a PNG without a prompt returns the empty prompt.
- `intake_import` of a JPEG with an XMP description returns the converter stub's PNG and the decoded description; the converter received the file.
- `intake_import` of a file typed `image/png` whose bytes are a JPEG uses the converter, not the PNG path.
- `intake_import` of a file of type `image/gif` rejects with the message of `validate_image_file`.
- `intake_model_output` with the strip option on returns exactly the five pixel chunk types and no form; with the strip option off it returns the blob itself.
- `describe_import_failures` names the count and each file with its message.

### In the browser

- Dropping a JPEG into the gallery gives a thumbnail; ⬇️ on it downloads `<prompt>_<created>_<id>.png`, and the file opens as an upright image.
- Dropping a JPEG with an EXIF orientation of 6 into the gallery shows it upright, as Firefox shows the original.
- Dropping a PNG that carries a prompt into the gallery shows 💬 with that prompt, and the stored file carries no text chunk: ⬇️ with strip off and both prompt options off gives a file whose chunks are only the pixel chunks.
- Dropping three files of which one is not an image gives two thumbnails and one dialog naming the third file with the reason.
- Dropping a JPEG into the input area gives a thumbnail whose tooltip ends in `.png`; an edit request with it succeeds.
- Generating with the strip option on stores an image without text chunks; with the strip option off, the stored image keeps what OpenAI sent.

## Out of scope

- The intro image: step 8.
- The existing gallery files stored before this step: step 6.
- The edit request's filenames and the mask: step 7.
- A canvas fallback for browsers without `VideoFrame`: not planned; such a browser cannot import JPEG and WebP, and the message says so.
