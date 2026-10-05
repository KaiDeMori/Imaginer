# Existing gallery files

The specification of this step is the step "6. Existing gallery files" in `Tasks/Rock_solid_metadata.md`, together with the terms and rules in `misc/metadata_terms.md`. This plan turns it into code changes. The Node check `tools/check/gallery_migration_check.mjs` is the executable specification of the migration module's pure part, and `tools/check/image_export_check.mjs` covers the changed Export rule for a gallery file that is not a PNG.

## Design

### `gallery_migration.js`

A new module in the repository root. Its top level imports only modules Node can load: `PIXEL_CHUNK_TYPES`, `PROMPT_KEYWORD`, `XMP_KEYWORD`, `is_PNG`, `read_PNG_chunks`, `strip_PNG` and `write_PNG_prompt` from `./PNG_chunks.js`; `convert_to_PNG` from `./image_conversion.js`; `EXPORT_AS_STORED_HINT` and `export_filename` from `./image_export.js`. It exports:

```js
/** @typedef {{ id: number, filename: string, message: string }} Migration_failure */
/** @typedef {{ strip: boolean, convert?: (blob: Blob) => Promise<Blob>, verify?: (blob: Blob) => Promise<{ width: number, height: number }>, on_progress?: (done: number, total: number) => void }} Migration_options */

export const GALLERY_FILES_MIGRATED_KEY = "imaginer.gallery_files_migrated";
export const INVALID_RESULT_MESSAGE = "The converted file is not a valid PNG.";

export function migration_is_done() {}
export function mark_migration_done() {}
export function strip_option_is_on() {}
export async function needs_migration(blob, strip) {}
export async function find_records_to_migrate(records, strip) {}
export async function migrate_blob(blob, strip, convert = convert_to_PNG) {}
export function check_PNG_structure(bytes) {}
export async function migrate_gallery(records, store, options) {}
export function describe_migration_failures(failures) {}
```

- `migration_is_done()`: `localStorage.getItem(GALLERY_FILES_MIGRATED_KEY) === "1"`. `mark_migration_done()`: `localStorage.setItem(GALLERY_FILES_MIGRATED_KEY, "1")`. `strip_option_is_on()`: `localStorage.getItem("imaginer.strip_metadata") === "true"`.
- The rules the migration applies are the intake rules, with the strip checkbox read at migration time, as intake reads it for model output: a file that is not a PNG is converted, which cleans it, because such a file can only be an import and an import is always cleaned; a PNG loses the two prompt forms (`iTXt` chunks with the keyword `PROMPT_KEYWORD` or `XMP_KEYWORD`), because a gallery file carries no *Imaginer metadata*; with `strip` true, a PNG loses every chunk outside `PIXEL_CHUNK_TYPES` as well.
- `needs_migration(blob, strip)`: returns true when `blob.type !== "image/png"`; otherwise reads the bytes with `new Uint8Array(await blob.arrayBuffer())` and returns true when `is_PNG(bytes)` is false, when `read_PNG_chunks(bytes)` throws, when bytes remain after the `IEND` chunk, when an `iTXt` chunk carries one of the two prompt keywords (parsed with the keyword up to the first NUL), or when `strip` is true and a chunk type is not in `PIXEL_CHUNK_TYPES`; otherwise false. A rejected `arrayBuffer()` propagates; the caller decides.
- `find_records_to_migrate(records, strip)`: the records whose `image_blob` is a `Blob` and for which `needs_migration` is true, in the given order, one record at a time and never several in parallel. A record whose `needs_migration` rejects (an unreadable blob) is left out, because converting cannot help it, and is logged with `console.warn("Gallery file could not be read:", record.id, error)`.
- `migrate_blob(blob, strip, convert)`: the bytes are read once. When they are a PNG: with `strip` true, `strip_PNG(bytes)`; otherwise `write_PNG_prompt(bytes, "", { iTXt_form: false, XMP_form: false })`, which removes the prompt forms and keeps every other chunk; the result becomes `new Blob([result], { type: "image/png" })`, so a PNG stored under a wrong type gets the right type. When that throws (a PNG the browser decodes but whose chunks are truncated), or when the bytes are not a PNG, returns `await convert(blob)`.
- `check_PNG_structure(bytes)`: returns `{ width, height }` from the `IHDR` when the bytes parse with `read_PNG_chunks`, the first chunk is `IHDR` with 13 data bytes, at least one `IDAT` exists, and the last chunk is `IEND`; otherwise throws `Error(INVALID_RESULT_MESSAGE)`.
- `migrate_gallery(records, store, options)`: `store` offers `update(id, updates)` as `Database_store` does; `options` is a `Migration_options`; `convert` defaults to `convert_to_PNG`, `verify` and `on_progress` default to nothing. For each record, in order and one at a time: `const image_blob = await migrate_blob(record.image_blob, strip, convert)`; `const structure = check_PNG_structure(new Uint8Array(await image_blob.arrayBuffer()))`; when `verify` is given, `const decoded = await verify(image_blob)`, and a decode error or a `width` or `height` that differs from `structure` fails the record with `INVALID_RESULT_MESSAGE`; then `await store.update(record.id, { image_blob })`, and only that field, so the prompt, the mask, the UUID and the timestamp stay untouched. A record that fails at any of these points stays as it is and is recorded as `{ id: record.id, filename: export_filename(record), message }`, `message` being `error.message`, or `error.name` when the message is empty, or `String(error)`; the loop continues. After each record, `on_progress(done, total)` is called inside its own try that ignores errors, so a broken dialog never stops the run. Returns `{ migrated, failures }`, `migrated` being the count of records written.
- `describe_migration_failures(failures)`: with an empty list returns the empty string; otherwise lines joined with `\n`: `<count> image(s) could not be converted and stay as they are:`, then one line `<filename>: <message>` per failure, then `EXPORT_AS_STORED_HINT`.

The module receives one file comment at the top, verbatim: `// Migration: gallery files stored before intake existed are brought to what intake produces, once, one record at a time, each verified before it replaces the old file.`

### `storage/database_store.js`

`update(id, updates)` resolves when the transaction has committed and rejects when it aborts: the promise resolves in `tx.oncomplete`, and `tx.onabort` and `tx.onerror` reject with `tx.error`, in addition to the existing rejections of `get_req.onerror` and `put_req.onerror`; `put_req.onsuccess` no longer resolves. A quota failure surfaces at commit, and the migration must see it. Nothing else in the file changes.

### `image_export.js`

`export_image(record)` reorders its cases: first, when `strip`, `iTXt_form` and `XMP_form` are all false, the stored blob leaves unchanged and unparsed, whatever its type; second, when `record.image_blob.type` is `image/jpeg` or `image/webp`, it throws `Error("The file is not a PNG and cannot be processed.")`, because such a gallery file cannot be stripped and the Export rule "Errors" applies; third, the PNG path as today. The comment above the second case, verbatim: `// A gallery file that is still a JPEG or WebP can only leave as stored, which the all-off case above allows; with any option on, the config could not be applied.` `export_filename` does not change. `tools/check/image_export_check.mjs` is the main model's and already asserts the new behaviour.

### `components/migration_confirm_modal.js`

A new module, built like `components/delete_confirm_modal.js`: the same overlay, dialog, text and button styling, with the overlay id `imaginer-migration-confirm-modal-overlay`. It exports the class `Migration_confirm_modal` with `static show(count, total, strip)` and `static close()`. `show` returns a `Promise` that resolves to `"convert"` or `"later"`. The dialog moves keyboard focus onto its overlay, as the delete confirmation does.

- The text, as paragraphs with a bottom margin of 12px each and 20px for the last:
  1. `Imaginer now keeps every image as a clean PNG.` followed by `1 of your ${total} images is still in its original form.` for one image and `${count} of your ${total} images are still in their original form.` otherwise.
  2. When `strip` is true: `Converting them removes all metadata from these files, such as a camera's location or OpenAI's provenance data, and the prompt copies Imaginer wrote into them; the prompts stay in the gallery.` When `strip` is false: `Converting them removes the prompt copies Imaginer wrote into these files; the prompts stay in the gallery. Other metadata stays, because Strip Server-Side metadata is off.`
  3. `An animated PNG keeps only its first image, orientation stored as metadata is dropped, and JPEG and WebP images take more storage as PNG. This cannot be undone.`
  4. `For an exact copy of the originals first, choose Later, turn off Strip Server-Side metadata and both Embed prompt options in Config → Advanced, and use Config → Files → Download All Images. Later asks again at the next start.`
- Two buttons: `Later` with the grey style of `Disable delete mode`, and `Convert now` with the style of `Delete` but the background `#2d7ef7`. Escape and a click outside the dialog count as `Later`.

### `components/download_progress_dialog/download_progress_dialog.js`

- `init` also stores `this.title = this.overlay.querySelector(".download_progress_title")` and gives the overlay `tabIndex = -1`.
- `show(title = "Downloading Gallery", status = "Preparing download...")` sets `this.title.textContent = title` and uses `status` for the status text, then focuses the overlay. Every existing caller keeps its texts.
- `update_progress(current, total, status = "Processing images...")` uses `status` for the status text.
- `close()` calls `this.on_close()` after removing the overlay when `this.on_close` is a function; the constructor sets `this.on_close = null`.

Nothing else in the folder changes.

### `components/performance_warning/performance_warning.js`

- The constructor sets `this.on_close = null`; `close()` calls `this.on_close()` after hiding the overlay when it is a function. Nothing else changes.

### `app.js`

- `import { describe_migration_failures, find_records_to_migrate, mark_migration_done, migrate_gallery, migration_is_done, strip_option_is_on } from "./gallery_migration.js";` and `import { can_convert_images } from "./image_conversion.js";` are added.
- A variable `let migration_running = false;` is added next to `activeGenerations`. The `Generation_panel` callback returns at once while `migration_running` is true, after `generation_panel.set_generate_button_enabled(false)`, so no request leaves while the gallery is rewritten.
- A function `offer_gallery_migration()` is added inside the `DOMContentLoaded` handler, after `save_model_output`. Its whole body runs in a `try`; an error before the progress dialog exists is shown with `Error_modal.show(error)`, an error afterwards with `progress.show_error(error.message || String(error))`, and in both cases the flag stays unset. In order:
  1. Returns at once when `migration_is_done()` or when `activeGenerations > 0`.
  2. `const strip = strip_option_is_on()`; `const records = Object.values(gallery.records_by_id)`, the records the gallery already loaded, so the database is not read again; `const candidates = await find_records_to_migrate(records, strip)`.
  3. When there is no candidate, `mark_migration_done()` and return.
  4. When a candidate's `image_blob.type` is not `image/png` and `can_convert_images()` is false, return without a dialog and without the flag: this browser cannot convert, another one can.
  5. `const { Migration_confirm_modal } = await import(versioned_url("./components/migration_confirm_modal.js"))`; `const action = await Migration_confirm_modal.show(candidates.length, records.length, strip)`; on `"later"` return, so the next start asks again.
  6. `migration_running = true` and `generation_panel.set_generate_button_enabled(false)`; `const { Download_progress_dialog } = await import(versioned_url("./components/download_progress_dialog/download_progress_dialog.js"))`; create it, await `init_promise`, `progress.show("Converting the gallery", "Converting images...")`, `progress.update_progress(0, candidates.length, "Converting images...")`.
  7. `const verify = async (blob) => { const bitmap = await createImageBitmap(blob); try { return { width: bitmap.width, height: bitmap.height }; } finally { bitmap.close(); } }`.
  8. `const { failures } = await migrate_gallery(candidates, database_store, { strip, verify, on_progress: (done, total) => progress.update_progress(done, total, "Converting images...") })`.
  9. When `failures.length === 0`: `mark_migration_done()`, `progress.close()`, `location.reload()`. Otherwise the flag stays unset, so the next start offers the remaining files again: `progress.on_close = () => location.reload()` and `progress.show_error(describe_migration_failures(failures))`.
  The page reloads in both cases, because the thumbnails and the download handlers hold the old blobs; the reload is safe, because nothing is generating.
- The comment above `offer_gallery_migration`, verbatim: `// The page reloads after the migration, because the thumbnails and the download handlers still hold the old blobs.`
- In the gallery's `on_loading_complete` callback: when the performance warning opens, `warning.on_close = () => offer_gallery_migration()`, so the largest galleries get the offer after the warning; otherwise `await offer_gallery_migration()`. The migration is offered only after the thumbnails are on screen.

### `cache_manifest.json`

The lines `gallery_migration.js` after `filename_helper.js` and `components/migration_confirm_modal.js` after `components/menu_bar/menu_bar.js` are added.

### What does not change

- `image_intake.js`, `PNG_chunks.js`, `XML_entities.js`.
- `tools/check/`: the main model wires `gallery_migration_check.mjs` into `check.sh` at Verification; `image_export_check.mjs` is already wired and already asserts the new Export case.
- `README.md`, `User_Manual/` and `misc/`: the main model writes the documentation after Verification.

## Implementation steps

1. **The module, the store, the Export rule and the dialogs.** Create `gallery_migration.js` and `components/migration_confirm_modal.js`; change `storage/database_store.js`, `image_export.js`, `components/download_progress_dialog/download_progress_dialog.js` and `components/performance_warning/performance_warning.js`; add the two manifest lines, as Design specifies. Gate: `bash tools/check/check.sh` prints `check passed` (it runs `image_export_check.mjs`, which asserts the new Export case), and `node tools/check/gallery_migration_check.mjs` prints `gallery_migration check passed`. The check passes because the new modules import only existing files and the manifest lists them.
2. **The offer at start.** Change `app.js` as Design specifies. Gate: `bash tools/check/check.sh` prints `check passed`, and `node tools/check/gallery_migration_check.mjs` prints `gallery_migration check passed`. The check passes because every import exists and the dynamic imports point at listed files.

## Documentation

- `README.md`
  - Project Structure
- `User_Manual/Imaginer_User_Manual.md`
  - Storage: a new subsection on converting older galleries: the dialog, what is removed, the backup advice, files that could not be converted, and Later
  - Download All Images: the sentence on gallery files that are still JPEG or WebP
  - PNG Metadata Options: the sentence on gallery files that are still JPEG or WebP, and that the one-time conversion follows the strip option
- `User_Manual/Imaginer_Technical_Manual.md`
  - Image Formats: the migration, its rules, its flag, the verification, and what a failed record does
  - Data Storage: the performance warning bullet, and the localStorage bullet
  - OpenAI Integration: the Export statement's sentence on gallery files that are still JPEG or WebP
- `User_Manual/Imaginer_FAQ.md`
  - Frequently Asked Questions: why Imaginer asks to convert the images, and how to back up the originals exactly
- `User_Manual/localStorage_keys_explained.md`
  - a new section for the key `imaginer.gallery_files_migrated`, and the description of `imaginer.strip_metadata`

The main model also updates, at Close and not as documentation: `misc/metadata_terms.md` (the Export rule "Interim" becomes the rule for a gallery file that is not a PNG, a Consequence records the one-time migration and its C2PA effect), `misc/metadata_gap_analysis.md` (the sections Existing gallery files, Order, Download, ZIP export, Edit request with its Consequences paragraph, the Import to Gallery bullet on a stored `File`, and gaps 10 and 13), and the "until step 6" statements in `Tasks/Rock_solid_metadata.md` steps 1 and 3.

## Asserted behaviours

Definitions: "a clean PNG" is a PNG whose chunks are only `IHDR`, `PLTE`, `tRNS`, `IDAT` and `IEND`; "the forms" are the two prompt forms; "a converter stub" is a function that returns a known PNG blob without a browser; "a store stub" is an object whose `update(id, updates)` records its calls; "a verify stub" is a function that returns given dimensions or throws.

### `gallery_migration.js`

Every item in `tools/check/gallery_migration_check.mjs` passes. Among them:

- With `strip` true, `needs_migration` is false for a clean PNG and true for a PNG with a `tEXt` chunk, a PNG with the forms, a JPEG, a truncated PNG, a clean PNG typed `image/jpeg`, and a clean PNG with bytes after `IEND`.
- With `strip` false, `needs_migration` is false for a PNG with a `tEXt` chunk and true for a PNG with the forms.
- `find_records_to_migrate` keeps the order, skips records without a blob, and leaves out a record whose blob cannot be read.
- `migrate_blob` with `strip` true strips a PNG without calling the converter; with `strip` false removes the forms and keeps a `tEXt` chunk; converts a JPEG; converts a truncated PNG; returns a blob typed `image/png` for PNG bytes typed `image/jpeg`.
- `check_PNG_structure` returns the header's dimensions for a clean PNG and throws `INVALID_RESULT_MESSAGE` for bytes that are not a PNG, a PNG without `IDAT`, and a PNG whose last chunk is not `IEND`.
- `migrate_gallery` over a dirty PNG, a JPEG and a record whose conversion fails writes two records through the store, each a clean PNG and only the field `image_blob`, reports one failure with the record's id, filename and message, and reports progress `(1, 3)`, `(2, 3)`, `(3, 3)`.
- `migrate_gallery` records a failure and writes nothing when the converter returns bytes that are not a PNG, when the verify stub throws, when the verify stub returns other dimensions than the header, and when the store rejects; a throwing `on_progress` does not stop the run.
- `migration_is_done` reads the flag, `mark_migration_done` sets it, `strip_option_is_on` reads the strip option.
- `describe_migration_failures` names the count, each file by its export filename with its message, and ends with `EXPORT_AS_STORED_HINT`.

### `image_export.js`

Every item in `tools/check/image_export_check.mjs` passes. Among them: a JPEG record and a WebP record export as the stored blob with the extensions `jpg` and `webp` only when the strip option and both prompt options are off; with any of them on, `export_image` rejects with `The file is not a PNG and cannot be processed.`, and `collect_ZIP_entries` lists such a record as a failure.

### In the browser

- A gallery with only clean PNGs shows no dialog at start, and the flag is set afterwards.
- A gallery with older files shows the dialog once the thumbnails are visible, with the count of files and, with the strip option on, the sentence on removed metadata; Later, Escape and a click outside close it and the next start asks again; Convert now shows the progress dialog titled `Converting the gallery` with the status `Converting images...` and a counter from `0 / n`, then the page reloads; every converted image has the same pixel size as before.
- After the conversion, ⬇️ on a formerly imported JPEG downloads a `.png`, and with strip off and both prompt options off the file holds only the pixel chunks.
- When a file could not be converted, the progress dialog lists it by its download filename with the reason and the hint; Close reloads the page; the image is still in the gallery; the next start offers it again.
- With the performance warning open at start, the migration dialog appears after the warning is closed.
- A click on Generate during the conversion does nothing.
- ⬇️ on a JPEG gallery file with the strip option on shows the error dialog with the hint; with the strip option and both prompt options off it downloads the file as stored.

## Out of scope

- The intro image: step 8.
- The edit request: step 7. Step 7 must treat a gallery file that is not a PNG explicitly, because Later and a failed conversion leave such files.
- A stop button for the migration: closing the page is safe, because every record is verified and written alone, and the next start offers the rest.
- A release note about the conversion: the release, done with the user.
