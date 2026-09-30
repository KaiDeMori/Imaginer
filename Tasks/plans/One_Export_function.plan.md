# One Export function

The specification of this step is the step "3. One Export function" in `Tasks/Rock_solid_metadata.md`, together with the terms and rules in `misc/metadata_terms.md`. This plan turns it into code changes. The Node check `tools/check/image_export_check.mjs` is the executable specification of the new module's pure part.

## Design

### `image_export.js`

A new module in the repository root. Its top level imports only modules that Node can load: `strip_PNG` and `write_PNG_prompt` from `./PNG_chunks.js`, `build_image_filename` from `./filename_helper.js`, and `extension_for_type` from `./components/image_validation.js`. Browser-only dependencies are loaded inside `export_gallery_as_ZIP` with dynamic imports. It exports:

```js
/** @typedef {{ blob: Blob, filename: string }} Export_entry */
/** @typedef {{ filename: string, message: string }} Export_failure */

export async function export_image(record) {}
export async function collect_ZIP_entries(records, on_progress) {}
export function describe_export_failures(failures) {}
export function trigger_download(blob, filename) {}
export async function export_gallery_as_ZIP(records, callbacks) {}
```

- `export_image(record)`: `record` is a gallery record with `image_blob`, `prompt_text`, `created` and `id`; `prompt_text` may be missing, which counts as the empty string. Returns an `Export_entry`. The filename is `build_image_filename(prompt_text, record.created, record.id, extension_for_type(record.image_blob.type))`. When `record.image_blob.type` is not `image/png`, the entry's `blob` is `record.image_blob` itself, unchanged, because a JPEG or WebP gallery file cannot be stripped without the conversion that step 6 brings. For a PNG: the bytes are read with `arrayBuffer()`; when `localStorage.getItem("imaginer.strip_metadata") === "true"`, `strip_PNG` runs; then `write_PNG_prompt(bytes, prompt_text, { iTXt_form, XMP_form })` runs with `iTXt_form` = `localStorage.getItem("imaginer.add_prompt_to_image") === "true"` and `XMP_form` = `localStorage.getItem("imaginer.add_prompt_to_image_xmp") === "true"`; the entry's `blob` is `new Blob([bytes], { type: "image/png" })`. Every error propagates to the caller; nothing is caught here.
- `collect_ZIP_entries(records, on_progress)`: takes the records whose `image_blob` is a `Blob`, in the given order, and calls `export_image` for each. When `export_image` rejects for a record, the entry holds `record.image_blob` as stored, with the same filename `export_image` would have given, and an `Export_failure` with that filename and the error's message (`error.message` for an `Error`, `String(error)` otherwise) is recorded. After each record, `on_progress(done, total)` is called with the count of records handled so far and the total count of exportable records; `on_progress` may be omitted. Returns `{ entries: Export_entry[], failures: Export_failure[] }`.
- `describe_export_failures(failures)`: returns a message for the user: the first line is `<count> image(s) could not be processed and were exported as stored:`, followed by one line per failure, `<filename>: <message>`. With an empty list it returns the empty string.
- `trigger_download(blob, filename)`: creates an object URL and an anchor with `download` set to `filename`, appends it to `document.body`, clicks it, and after 100 ms removes the anchor and revokes the URL, as the ⬇️ handler does today.
- `export_gallery_as_ZIP(records, callbacks)`: `callbacks` is `{ on_progress, on_status }`, both optional. It calls `collect_ZIP_entries(records, on_progress)`. When there is no entry it throws `Error("No images to download.")`. It then loads `versioned_url` with `await import("./version_manager.js")`, then `get_jszip` with `await import(versioned_url("./static_imports/jszip_loader.js"))`, and builds the archive: one `zip.file(entry.filename, entry.blob)` per entry. Before `generateAsync` it calls `on_status("Saving to disk...")`. The archive is a `Blob` from `zip.generateAsync({ type: "blob" })`, downloaded with `trigger_download` under the name `Imaginer_Export_<timestamp>.zip`, the timestamp being the ISO time with `-`, `:`, `T` and `.` removed and cut to 14 characters, as both callers build it today. Returns `{ failures }`.

The module receives one file comment at the top, verbatim: `// Export: gallery files leave Imaginer as files for the user. Download and ZIP export share this path, so both apply the same rules.`

The comment for the fallback in `collect_ZIP_entries`, verbatim, above the `catch` body: `// The ZIP export is the users' backup, so one file that cannot be processed must not stop it; the file goes in as stored and the failure is reported afterwards.`

### `components/gallery.js`

- The import of `process_image_metadata` is removed; `import { export_image, trigger_download } from "../image_export.js";` is added. `build_image_filename` and `extension_for_type` stay imported only if the file still uses them; after this step `build_image_filename` is no longer used in this file and its import is removed, while `extension_for_type` remains used by the import validation.
- The ⬇️ handler in `_build_thumbnail_content` becomes: it resolves the record as `this.records_by_id[record_id] ?? { id: null, image_blob: blob, prompt_text, created }`, calls `export_image(record)`, and on success calls `trigger_download(entry.blob, entry.filename)`. When `export_image` rejects, it calls `Error_modal.show(error)` and downloads nothing. The comment inside the handler about imported non-PNG images is removed with the code it described.
- Nothing else in the file changes.

### `components/config_dialog/config_dialog.js`

- The imports of `build_image_filename` and `extension_for_type` are removed; the other imports from `filename_helper.js` stay. `import { describe_export_failures, export_gallery_as_ZIP } from "../../image_export.js";` is added.
- The "Download All Images" click handler keeps the progress dialog and its statuses. Between `progress.set_status("Preparing download...")` and the end, it loads the records as today, then calls `export_gallery_as_ZIP(records, { on_progress: (done, total) => progress.update_progress(done, total), on_status: (status) => progress.set_status(status) })`. On success with no failure it closes the progress dialog as today. On success with failures it calls `progress.show_error(describe_export_failures(failures))`, so the user reads the list and closes the dialog. On an error it calls `progress.show_error(err.message || String(err))` as today. The dynamic imports of the JSZip loader in this handler go; the dynamic import of `Database_store` stays.

### `components/performance_warning/performance_warning.js`

- The imports of `build_image_filename` and `extension_for_type` are removed; `import { describe_export_failures, export_gallery_as_ZIP } from "../../image_export.js";` is added.
- `download_all` keeps its button handling and its `alert` on error. It loads the records as today, calls `export_gallery_as_ZIP(records, {})`, and when the result has failures shows `alert(describe_export_failures(failures))`. The dynamic import of the JSZip loader and the ZIP loop go.

### `cache_manifest.json`

The line `image_export.js` is added after `filename_helper.js`.

### What does not change

- `process_image_metadata.js` and its call sites in `app.js`: model output at intake is step 5.
- `filename_helper.js`, `PNG_chunks.js`, `XML_entities.js`.
- `static_imports/jszip_loader.js` and `version_manager.js`.
- `components/download_progress_dialog/`.
- `tools/check/`: the main model wires `image_export_check.mjs` into `check.sh` at Verification.
- `README.md` and `User_Manual/`: the main model writes the documentation after Verification.

## Implementation steps

1. **The module.** Create `image_export.js` as Design specifies and add its line to `cache_manifest.json`. Gate: `bash tools/check/check.sh` prints `check passed`, and `node tools/check/image_export_check.mjs` prints `image_export check passed`. The check passes because the module's static imports exist and the manifest lists it.
2. **The switch.** Change `components/gallery.js`, `components/config_dialog/config_dialog.js` and `components/performance_warning/performance_warning.js` as Design specifies. Gate: `bash tools/check/check.sh` prints `check passed`, and `node tools/check/image_export_check.mjs` prints `image_export check passed`. The check passes because every import the three files keep exists.

## Documentation

- `README.md`
  - Project Structure
- `User_Manual/Imaginer_User_Manual.md`
  - Thumbnail Actions
  - Download All Images
  - PNG Metadata Options
- `User_Manual/Imaginer_Technical_Manual.md`
  - Image Formats: the statement on prompt embedding on generation and download
  - The statement on download and ZIP export filenames
- `User_Manual/localStorage_keys_explained.md`
  - `imaginer.strip_metadata`

## Asserted behaviours

Definitions: "forms" are the iTXt form and the XMP form as the terms define them; "a palette PNG" is a PNG with color type 3, a `PLTE` chunk and a `tRNS` chunk; "a corrupt record" is a record whose `image_blob` has the type `image/png` but bytes that are not a PNG.

### `image_export.js`

Every item in `tools/check/image_export_check.mjs` passes. Among them:

- A PNG record with the strip option on and both prompt options on exports as `IHDR`, `PLTE`, `tRNS`, `iTXt`, `iTXt`, `IDAT`, `IEND`, named `<prompt>_<created>_<id>.png`.
- A PNG record with the strip option off and both prompt options off keeps its `tEXt` chunk and loses its stored forms.
- A JPEG record exports as the stored blob itself, named with the extension `jpg`.
- `export_image` of a corrupt record rejects with `Not a PNG file.`.
- `collect_ZIP_entries` over a good record, a corrupt record and a JPEG record returns three entries, one failure naming the corrupt record's filename, the corrupt entry holding the stored blob, and progress calls `(1, 3)`, `(2, 3)`, `(3, 3)`.
- Two records with the same prompt and timestamp and different IDs get different filenames.
- `describe_export_failures` names the count, each filename and each message; with no failure it returns the empty string.

### Download and ZIP export in the browser

- ⬇️ on a thumbnail downloads `<prompt>_<created>_<id>.png` with the forms per the prompt options and stripped per the strip option.
- ⬇️ on a corrupt record shows an error dialog and downloads nothing.
- Config → Files → Download All Images writes every gallery file into the ZIP with the same rules as ⬇️; a record that cannot be processed goes in as stored, and the progress dialog lists it after the download.
- The performance warning's Download All Images does the same and lists failures in an alert.

## Out of scope

- Model output at intake, and one intake function: step 5.
- Converting the existing JPEG and WebP gallery files so that strip applies to them at Export: step 6.
- Pixels only at the edit request: step 7.
- The UI wording of the ZIP export: step 8.
