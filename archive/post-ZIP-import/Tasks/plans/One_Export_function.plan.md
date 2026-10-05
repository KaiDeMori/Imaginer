# One Export function

The specification of this step is the step "3. One Export function" in `Tasks/Rock_solid_metadata.md`, together with the terms and rules in `misc/metadata_terms.md`. This plan turns it into code changes. The Node check `tools/check/image_export_check.mjs` is the executable specification of the new module's pure part.

## Design

### `image_export.js`

A new module in the repository root. Its top level imports only modules that Node can load: `strip_PNG` and `write_PNG_prompt` from `./PNG_chunks.js`, `build_image_filename` from `./filename_helper.js`, and `extension_for_type` from `./components/image_validation.js`. Browser-only dependencies are loaded inside `export_gallery_as_ZIP` with dynamic imports. It exports:

```js
/** @typedef {{ blob: Blob, filename: string }} Export_entry */
/** @typedef {{ filename: string, message: string }} Export_failure */

export const EXPORT_AS_STORED_HINT = "To export it as stored, turn off Strip Server-Side metadata and both Embed prompt options in Config → Advanced.";

export function export_filename(record) {}
export async function export_image(record) {}
export async function collect_ZIP_entries(records, on_progress) {}
export function describe_export_failures(failures) {}
export function trigger_download(blob, filename) {}
export async function export_gallery_as_ZIP(records, callbacks) {}
```

- A record is a gallery record with `image_blob`, `prompt_text`, `created` and `id`; `prompt_text` may be missing, which counts as the empty string; `id` may be `null`.
- `export_filename(record)`: `build_image_filename(prompt_text, record.created, record.id, extension_for_type(record.image_blob.type))`. `extension_for_type` gives `jpg` and `webp` for those two types and `png` for every other type.
- `export_image(record)`: returns an `Export_entry` whose `filename` is `export_filename(record)`. The settings are `strip` = `localStorage.getItem("imaginer.strip_metadata") === "true"`, `iTXt_form` = `localStorage.getItem("imaginer.add_prompt_to_image") === "true"`, `XMP_form` = `localStorage.getItem("imaginer.add_prompt_to_image_xmp") === "true"`. Three cases:
  1. `record.image_blob.type` is `image/jpeg` or `image/webp`: the entry's `blob` is `record.image_blob` itself, unchanged, because such a gallery file cannot be stripped without the conversion that step 6 brings.
  2. `strip`, `iTXt_form` and `XMP_form` are all false: the entry's `blob` is `record.image_blob` itself, unchanged and unparsed. Export then changes nothing, so a file that cannot be parsed still leaves.
  3. Otherwise the file is treated as a PNG: `const bytes = new Uint8Array(await record.image_blob.arrayBuffer())`; when `strip` is true, `strip_PNG` runs; then `write_PNG_prompt(bytes, prompt_text, { iTXt_form, XMP_form })` runs; the entry's `blob` is `new Blob([bytes], { type: "image/png" })`. Every error propagates to the caller; nothing is caught here. Bytes that are not a PNG therefore fail with `Not a PNG file.`, whatever the blob's type says.
- `collect_ZIP_entries(records, on_progress)`: takes the records whose `image_blob` is a `Blob`, in the given order, and calls `export_image` for each. A record whose `export_image` rejects gets no entry; instead an `Export_failure` with `export_filename(record)` and the error's message (`error.message` for an `Error`, `String(error)` otherwise) is recorded. After each record, `on_progress(done, total)` is called with the count of records handled so far and the total count of records with a `Blob`; `on_progress` may be omitted. Returns `{ entries: Export_entry[], failures: Export_failure[] }`.
- `describe_export_failures(failures)`: with an empty list it returns the empty string. Otherwise it returns lines joined with `\n`: first `<count> image(s) could not be exported and stay in the gallery:`, then one line `<filename>: <message>` per failure, then `EXPORT_AS_STORED_HINT`.
- `trigger_download(blob, filename)`: creates an object URL and an anchor with `download` set to `filename`, appends it to `document.body`, clicks it, and after 1000 ms removes the anchor and revokes the URL. The delay is the longest the three callers use today, so a large archive is not cut off.
- `export_gallery_as_ZIP(records, callbacks)`: `callbacks` is `{ on_progress, on_status }`, both optional. It calls `on_status("Processing images...")`, then `collect_ZIP_entries(records, on_progress)`. When there is no entry and no failure it throws `Error("No images to download.")`; when there is no entry but there are failures it throws `Error(describe_export_failures(failures))`. It then loads `versioned_url` with `await import("./version_manager.js")`, then `get_jszip` with `await import(versioned_url("./static_imports/jszip_loader.js"))`, and builds the archive: one `zip.file(entry.filename, entry.blob)` per entry. It calls `on_status("Saving to disk...")`, generates the archive with `zip.generateAsync({ type: "blob" })`, and downloads it with `trigger_download` under the name `Imaginer_Export_<timestamp>.zip`, the timestamp being the ISO time with `-`, `:`, `T` and `.` removed and cut to 14 characters, as both callers build it today. Returns `{ failures }`.
- Known cost: every processed PNG is held in memory as a new `Blob` until the archive is built, where the old loops handed the stored blobs to the archive. Processing at Export needs the bytes, and the archive holds every entry until it is generated anyway.

The module receives one file comment at the top, verbatim: `// Export: gallery files leave Imaginer as files for the user. Download and ZIP export share this path, so both apply the same rules.`

The comment for the second case of `export_image`, verbatim, above its condition: `// Without strip and without a prompt form, Export changes nothing, so the file leaves as stored and is not even parsed.`

The comment for the `catch` in `collect_ZIP_entries`, verbatim, above the `catch` body: `// A file that cannot be processed would leave with what the config promised to remove, so it stays in the gallery and is listed instead.`

### `components/gallery.js`

- The imports of `process_image_metadata` and `build_image_filename` are removed, and `extension_for_type` is removed from the `image_validation.js` import, which keeps `validate_file_readable`, `validate_image_count`, `validate_image_file` and `with_batch_hint`. `import { EXPORT_AS_STORED_HINT, describe_export_failures, export_filename, export_image, trigger_download } from "../image_export.js";` is added; names that the handler below does not use are left out of that import.
- The ⬇️ handler in `_build_thumbnail_content` becomes: it builds the record from the values it closes over, `{ id: record_id, image_blob: blob, prompt_text, created }`, calls `export_image(record)`, and on success calls `trigger_download(entry.blob, entry.filename)`. When `export_image` rejects, it calls `Error_modal.show({ message: `${export_filename(record)}: ${error.message || String(error)}`, hint: EXPORT_AS_STORED_HINT })` and downloads nothing. The comment inside the handler about imported non-PNG images is removed with the code it described.
- Nothing else in the file changes.

### `components/config_dialog/config_dialog.js`

- The imports of `build_image_filename` and `extension_for_type` are removed; the other imports from `filename_helper.js` stay. `import { describe_export_failures, export_gallery_as_ZIP } from "../../image_export.js";` is added.
- The "Download All Images" click handler keeps the progress dialog. After `progress.show()` and `progress.set_status("Preparing download...")` it loads the records as today, then calls `export_gallery_as_ZIP(records, { on_progress: (done, total) => progress.update_progress(done, total), on_status: (status) => progress.set_status(status) })`. When the result has no failure it calls `progress.close()`. When it has failures it calls `progress.show_error(describe_export_failures(failures))`, so the user reads the list and closes the dialog. On an error it calls `progress.show_error(err.message || String(err))` as today. The dynamic import of the JSZip loader, the loop, the archive naming and the anchor code go; the dynamic import of `Database_store` stays.

### `components/performance_warning/performance_warning.js`

- The imports of `build_image_filename` and `extension_for_type` are removed; `import { describe_export_failures, export_gallery_as_ZIP } from "../../image_export.js";` is added.
- `download_all` keeps its button handling, its `try`, `catch` with `alert("Download failed: " + ...)`, and `finally`. It loads the records as today, calls `const { failures } = await export_gallery_as_ZIP(records, {})`, and when `failures.length > 0` shows `alert(describe_export_failures(failures))`. The dynamic import of the JSZip loader, the loop, the archive naming and the anchor code go.

### `components/download_progress_dialog/download_progress_dialog.css`

`.error_message` gets `white-space: pre-wrap;`, `text-align: left;` in place of `text-align: center;`, `max-height: 40vh;` and `overflow: auto;`, so a list of failures keeps its lines and scrolls instead of pushing the close button off the screen. Nothing else in the folder changes.

### `cache_manifest.json`

The line `image_export.js` is added after `filename_helper.js`.

### What does not change

- `process_image_metadata.js` and its call sites in `app.js`: model output at intake is step 5.
- `filename_helper.js`, `PNG_chunks.js`, `XML_entities.js`, `components/image_validation.js`.
- `static_imports/jszip_loader.js` and `version_manager.js`.
- `components/download_progress_dialog/download_progress_dialog.js` and `.html`.
- `tools/check/`: the main model wires `image_export_check.mjs` into `check.sh` at Verification.
- `README.md`, `User_Manual/` and `misc/`: the main model writes the documentation after Verification.

## Implementation steps

1. **The module.** Create `image_export.js` as Design specifies and add its line to `cache_manifest.json`. Gate: `bash tools/check/check.sh` prints `check passed`, and `node tools/check/image_export_check.mjs` prints `image_export check passed`. The check passes because the module's static imports exist and the manifest lists it.
2. **The switch.** Change `components/gallery.js`, `components/config_dialog/config_dialog.js`, `components/performance_warning/performance_warning.js` and `components/download_progress_dialog/download_progress_dialog.css` as Design specifies. Gate: `bash tools/check/check.sh` prints `check passed`, and `node tools/check/image_export_check.mjs` prints `image_export check passed`. The check passes because every import the three files keep exists.

## Documentation

- `README.md`
  - Features: the bullets Export and Prompt embedding
  - Project Structure
- `User_Manual/Imaginer_User_Manual.md`
  - Thumbnail Actions: what ⬇️ applies, and the error dialog
  - Download All Images: the same rules as ⬇️, files that are left out and listed, the saved settings, and imported JPEG and WebP files leaving as stored
  - PNG Metadata Options: that the strip option and the prompt options act at every download and export of a PNG, and the exception for imported JPEG and WebP files until they are converted
- `User_Manual/Imaginer_Technical_Manual.md`
  - Image Formats: the statement on prompt embedding on generation and download
  - OpenAI Integration: a statement on the shared Export path and its error behaviour
- `User_Manual/localStorage_keys_explained.md`
  - `imaginer.strip_metadata`, `imaginer.add_prompt_to_image`, `imaginer.add_prompt_to_image_xmp`

The main model also updates, at Close and not as documentation: `misc/metadata_terms.md` (the Export rules gain the error rule and the interim rule for non-PNG gallery files) and `misc/metadata_gap_analysis.md` (the Download and ZIP export sections, the "Writers of Imaginer metadata" section, gaps 9 and 11 closed, gap 10 reduced to the non-PNG part that step 6 closes).

## Asserted behaviours

Definitions: "forms" are the iTXt form and the XMP form as the terms define them; "a palette PNG" is a PNG with color type 3, a `PLTE` chunk and a `tRNS` chunk; "a corrupt record" is a record whose `image_blob` has the type `image/png` but bytes that are not a PNG.

### `image_export.js`

Every item in `tools/check/image_export_check.mjs` passes. Among them:

- A PNG record with the strip option on and both prompt options on exports as `IHDR`, `PLTE`, `tRNS`, `iTXt`, `iTXt`, `IDAT`, `IEND`, named `<prompt>_<created>_<id>.png`.
- With the strip option on and both prompt options off, a palette PNG with text chunks exports as exactly the five pixel chunk types.
- With only the iTXt option on, exactly one `prompt_text` chunk and no XMP chunk is written; with only the XMP option on, the reverse.
- With the strip option off and both prompt options off, the stored blob itself is returned, unparsed.
- A JPEG record and a WebP record export as the stored blob itself, named with the extensions `jpg` and `webp`.
- `export_image` of a corrupt record rejects with `Not a PNG file.` when any option is on.
- A PNG record whose blob has an empty type is processed and named `.png`.
- `collect_ZIP_entries` over a good record, a corrupt record, a JPEG record and a record without a blob returns two entries in order, one failure naming the corrupt record's filename and `Not a PNG file.`, and progress calls `(1, 3)`, `(2, 3)`, `(3, 3)`.
- Two records with the same prompt and timestamp and different IDs get different filenames.
- `describe_export_failures` names the count, each filename with its message, and ends with `EXPORT_AS_STORED_HINT`; with no failure it returns the empty string.

### Download and ZIP export in the browser

- ⬇️ on a thumbnail downloads `<prompt>_<created>_<id>.png` with the forms per the prompt options and stripped per the strip option.
- ⬇️ on an imported JPEG downloads `<prompt>_<created>_<id>.jpg`, byte for byte as stored.
- ⬇️ on a corrupt record shows an error dialog with the filename, the reason and the hint, and downloads nothing.
- Config → Files → Download All Images writes every gallery file into the ZIP with the same rules as ⬇️; a record that cannot be processed is left out, and the progress dialog lists it with the reason and the hint after the download, one line per file, scrolling when the list is long.
- The performance warning's Download All Images does the same and lists the left-out files in an alert.
- Download All Images uses the saved settings; a changed checkbox counts only after OK.

## Out of scope

- Model output at intake, and one intake function: step 5.
- Converting the existing JPEG and WebP gallery files so that strip applies to them at Export: step 6.
- Pixels only at the edit request: step 7.
- The UI wording of the ZIP export: step 8.
