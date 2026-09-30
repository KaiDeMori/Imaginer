# Existing gallery files

The specification of this step is the step "6. Existing gallery files" in `Tasks/Rock_solid_metadata.md`, together with the terms and rules in `misc/metadata_terms.md`. This plan turns it into code changes. The Node check `tools/check/gallery_migration_check.mjs` is the executable specification of the migration module's pure part.

## Design

### `gallery_migration.js`

A new module in the repository root. Its top level imports only modules Node can load: `PIXEL_CHUNK_TYPES`, `is_PNG`, `read_PNG_chunks` and `strip_PNG` from `./PNG_chunks.js`, and `convert_to_PNG` from `./image_conversion.js`. It exports:

```js
/** @typedef {{ id: number, message: string }} Migration_failure */

export const GALLERY_FILES_MIGRATED_KEY = "imaginer.gallery_files_migrated";

export function migration_is_done() {}
export function mark_migration_done() {}
export async function needs_migration(blob) {}
export async function find_records_to_migrate(records) {}
export async function migrate_blob(blob, convert = convert_to_PNG) {}
export async function migrate_gallery(records, store, callbacks) {}
export function describe_migration_failures(failures) {}
```

- `migration_is_done()`: `localStorage.getItem(GALLERY_FILES_MIGRATED_KEY) === "1"`. `mark_migration_done()`: `localStorage.setItem(GALLERY_FILES_MIGRATED_KEY, "1")`.
- `needs_migration(blob)`: reads the bytes with `new Uint8Array(await blob.arrayBuffer())`. Returns true when `is_PNG(bytes)` is false, when `read_PNG_chunks(bytes)` throws, or when any chunk type is not in `PIXEL_CHUNK_TYPES`; otherwise false. A gallery file passes only when it is a PNG that carries nothing but its pixel chunks, which is what intake produces.
- `find_records_to_migrate(records)`: the records whose `image_blob` is a `Blob` and for which `needs_migration` is true, in the given order.
- `migrate_blob(blob, convert)`: the intake rules for an import applied to a stored file. When the bytes are a PNG, returns `new Blob([strip_PNG(bytes)], { type: "image/png" })`; when `strip_PNG` throws, returns `await convert(blob)` instead. When the bytes are not a PNG, returns `await convert(blob)`. Every metadata goes, because the file's origin cannot be told any more and an import is always cleaned; the prompt lives in the record.
- `migrate_gallery(records, store, callbacks)`: `store` offers `update(id, updates)` as `Database_store` does; `callbacks` is `{ on_progress, convert }`, both optional, `convert` defaulting to `convert_to_PNG`. For each record, in order and one at a time: `const image_blob = await migrate_blob(record.image_blob, convert)`; the result is verified in memory before it replaces anything: `read_PNG_chunks(new Uint8Array(await image_blob.arrayBuffer()))` must not throw and must contain an `IDAT` chunk, otherwise the record fails with `The converted file is not a valid PNG.`; then `await store.update(record.id, { image_blob })`, which replaces the file in one atomic write per record. A record that fails at any point stays as it is and is recorded as `{ id: record.id, message }` with the error's message; the loop continues. After each record, `on_progress(done, total)` is called. Returns `{ migrated, failures }`, `migrated` being the count of records written.
- `describe_migration_failures(failures)`: with an empty list returns the empty string; otherwise lines joined with `\n`: `<count> image(s) could not be converted and stay as they are:`, then one line `Image <id>: <message>` per failure, then `They can still be downloaded with Strip Server-Side metadata and both Embed prompt options turned off.`

The module receives one file comment at the top, verbatim: `// Migration: gallery files stored before intake existed are brought to what intake produces, once, one record at a time, each verified before it replaces the old file.`

### `components/migration_confirm_modal.js`

A new module, built like `components/delete_confirm_modal.js`: the same overlay, dialog, message and button styling, with the overlay id `imaginer-migration-confirm-modal-overlay`. It exports the class `Migration_confirm_modal` with `static show(count, total)` and `static close()`. `show` returns a `Promise` that resolves to `"convert"` or `"later"`.

- The message, in two paragraphs: `Imaginer now keeps every image as a clean PNG without metadata. ${count} of your ${total} images are still in their original form.` and `Converting them takes a moment per image and cannot be undone; the prompts stay. If you want a backup first, choose Later and use Config → Files → Download All Images.`
- Two buttons: `Later` with the grey style of `Disable delete mode`, and `Convert now` with the style of `Delete` but the background `#2d7ef7`. Escape and a click outside the dialog count as `Later`.

### `components/download_progress_dialog/download_progress_dialog.js`

- `init` also stores `this.title = this.overlay.querySelector(".download_progress_title")`.
- `show(title = "Downloading Gallery")` sets `this.title.textContent = title` before it shows the overlay. Every existing caller keeps its title.
- `close()` calls `this.on_close()` after removing the overlay when `this.on_close` is a function; the constructor sets `this.on_close = null`.

Nothing else in the folder changes.

### `app.js`

- `import { describe_migration_failures, find_records_to_migrate, mark_migration_done, migrate_gallery, migration_is_done } from "./gallery_migration.js";` is added.
- A function `offer_gallery_migration()` is added inside the `DOMContentLoaded` handler, after `save_model_output`. It returns at once when `migration_is_done()`. It loads `const records = await database_store.get_all({ reverse: false })` and `const candidates = await find_records_to_migrate(records)`. When there is no candidate, it calls `mark_migration_done()` and returns. Otherwise it loads `Migration_confirm_modal` with `await import(versioned_url("./components/migration_confirm_modal.js"))` and awaits `Migration_confirm_modal.show(candidates.length, records.length)`; on `"later"` it returns, so the next start asks again. On `"convert"` it loads `Download_progress_dialog` with `await import(versioned_url("./components/download_progress_dialog/download_progress_dialog.js"))`, creates it, awaits `init_promise`, calls `progress.show("Converting the gallery")`, and runs `const { failures } = await migrate_gallery(candidates, database_store, { on_progress: (done, total) => progress.update_progress(done, total) })`. It then calls `mark_migration_done()`. The page reloads afterwards, because the thumbnails and the download handlers hold the old blobs: with failures, `progress.on_close = () => location.reload()` and `progress.show_error(describe_migration_failures(failures))`; without failures, `progress.close()` and `location.reload()`.
- The comment above `offer_gallery_migration`, verbatim: `// The page reloads after the migration, because the thumbnails and the download handlers still hold the old blobs.`
- In the gallery's `on_loading_complete` callback, after the performance warning branch: when the warning opened, nothing else happens in this start; otherwise `await offer_gallery_migration()`. The migration is offered only after the thumbnails are on screen, so the user sees the gallery behind the dialog.

### `cache_manifest.json`

The lines `gallery_migration.js` after `filename_helper.js` and `components/migration_confirm_modal.js` after `components/menu_bar/menu_bar.js` are added.

### What does not change

- `image_intake.js`, `image_export.js`, `PNG_chunks.js`, `storage/database_store.js`: `update` already replaces a record's fields with one `put`.
- The `export_image` case for a JPEG or WebP gallery file stays, as the safety net for a file the migration could not convert.
- `tools/check/`: the main model wires `gallery_migration_check.mjs` into `check.sh` at Verification.
- `README.md`, `User_Manual/` and `misc/`: the main model writes the documentation after Verification.

## Implementation steps

1. **The module and the dialogs.** Create `gallery_migration.js` and `components/migration_confirm_modal.js`, change `components/download_progress_dialog/download_progress_dialog.js`, and add the two manifest lines, as Design specifies. Gate: `bash tools/check/check.sh` prints `check passed`, and `node tools/check/gallery_migration_check.mjs` prints `gallery_migration check passed`. The check passes because the new modules import only existing files and the manifest lists them.
2. **The offer at start.** Change `app.js` as Design specifies. Gate: `bash tools/check/check.sh` prints `check passed`, and `node tools/check/gallery_migration_check.mjs` prints `gallery_migration check passed`. The check passes because every import exists and the dynamic imports point at listed files.

## Documentation

- `README.md`
  - Project Structure
- `User_Manual/Imaginer_User_Manual.md`
  - Storage: a new subsection on converting older galleries, with the dialog, the backup advice, and files that could not be converted
  - Download All Images: the sentence on gallery files that are still JPEG or WebP
  - PNG Metadata Options: the sentence on gallery files that are still JPEG or WebP
- `User_Manual/Imaginer_Technical_Manual.md`
  - Image Formats: the migration, its flag, and what a failed record does
  - OpenAI Integration: the Export statement's sentence on gallery files that are still JPEG or WebP
- `User_Manual/Imaginer_FAQ.md`
  - Frequently Asked Questions: why Imaginer asks to convert the images
- `User_Manual/localStorage_keys_explained.md`
  - the new key `imaginer.gallery_files_migrated`

The main model also updates, at Close and not as documentation: `misc/metadata_terms.md` (the interim rule at Export becomes the safety-net rule for a file the migration could not convert), and `misc/metadata_gap_analysis.md` (the section Existing gallery files, the Export rows marked with `~`, and gap 13).

## Asserted behaviours

Definitions: "a clean PNG" is a PNG whose chunks are only `IHDR`, `PLTE`, `tRNS`, `IDAT` and `IEND`; "a converter stub" is a function that returns a known PNG blob without a browser; "a store stub" is an object whose `update(id, updates)` records its calls.

### `gallery_migration.js`

Every item in `tools/check/gallery_migration_check.mjs` passes. Among them:

- `needs_migration` is false for a clean PNG and true for a PNG with a `tEXt` chunk, a PNG with the prompt forms, a JPEG, and a truncated PNG.
- `find_records_to_migrate` keeps the order and skips records without a blob.
- `migrate_blob` strips a PNG without calling the converter, converts a JPEG, and converts a truncated PNG.
- `migrate_gallery` over a dirty PNG, a JPEG and a record whose conversion fails writes two records through the store, each a clean PNG, reports one failure with the record's id and message, and reports progress `(1, 3)`, `(2, 3)`, `(3, 3)`.
- `migrate_gallery` records a failure and writes nothing when the converter returns bytes that are not a PNG.
- `migration_is_done` reads the flag and `mark_migration_done` sets it.
- `describe_migration_failures` names the count, each image by id with its message, and ends with the way out.

### In the browser

- A gallery with only clean PNGs shows no dialog at start, and the flag is set afterwards.
- A gallery with older files shows the dialog once the thumbnails are visible; Later closes it and the next start asks again; Convert now shows the progress dialog with the title `Converting the gallery`, then the page reloads, and the images look as before.
- After the conversion, ⬇️ on a formerly imported JPEG downloads a `.png`, and with strip off and both prompt options off the file holds only the pixel chunks.
- When a file could not be converted, the progress dialog lists it by image number with the reason; Close reloads the page; the image is still in the gallery.
- With the performance warning open at start, the migration dialog does not appear in that start.

## Out of scope

- The intro image: step 8.
- The edit request: step 7.
- A release note about the conversion: the release, done with the user.
