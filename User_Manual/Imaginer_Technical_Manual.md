# Technical Information

## Architecture Overview
- Imaginer runs entirely in the browser. There is no server-side storage.
- Image generation uses OpenAI's `/v1/images/generations` and `/v1/images/edits` endpoints. Model lists come from `/v1/models`.
- The conversation panel is a local mock; it does not call the Responses API.

## Data Storage
- Images, prompts, masks, creation timestamps, and UUIDs are stored in IndexedDB (`imaginer-db`, `images` object store). Masks save when you close the viewer if you loaded the image from the gallery.
- Settings (prompt text, orientation/size, advanced size mode and saved custom sizes, quality, background, input fidelity, hidden moderation level, n, maximum parallel jobs, streaming preview count, metadata options, filename prompt length, mask button visibility, model selection, visibility of older models, and the flag of the one-time gallery conversion) live in `localStorage`. See `localStorage_keys_explained.md` for the full list.
- `imaginer.background` is written by two controls. The menu bar dropdown writes on every change; the config dialog writes on **Save**. The menu bar re-reads the key on `imaginer.config_changed`, and `Config_dialog.open` re-reads it on every open, so both controls show the stored value. A stored value outside `auto`, `transparent` and `opaque` is replaced with `auto` by the menu bar.
- The API key is XOR-obfuscated and base64-encoded in `localStorage`. The debug function (`window.tabula_rasa()`) clears all local data.
- A performance warning appears if gallery loading takes more than about 15 seconds and offers quick download or clear options. The conversion of older galleries is offered after that warning is closed.

## Image Formats
- Every gallery file is a PNG. AI-generated images arrive as PNG; imported JPEG and WebP files are converted at import.
- Imports pass one intake (`image_intake.js`), for the gallery, whose drop and 📂 button share `Gallery.import_files`, and for the edit drop area: the prompt is read from the file's metadata first, then a PNG is stripped to its pixel chunks (`IHDR`, `PLTE`, `tRNS`, `IDAT`, `IEND`), and any other image is converted (`image_conversion.js`): `createImageBitmap` with the EXIF orientation applied, the pixels read through `VideoFrame.copyTo` as RGBA without a canvas, then turned by the frame's `rotation` and `flip`, which is where Chromium keeps the orientation, and encoded with the own PNG encoder (`encode_PNG_RGBA` in `PNG_chunks.js`, one filter per row). The format is decided by the bytes, so a renamed file is treated as what it is. A browser without `VideoFrame` cannot import JPEG and WebP; the message says so.
- A ZIP file at the gallery, by drop or 📂, is a ZIP import (`ZIP_import.js`). A file counts as a ZIP file by the extension `.zip` in any letter case or by a ZIP type, because the type of a chosen file depends on the system. JSZip opens it; entries whose names end in `.png`, `.jpg`, `.jpeg` or `.webp` in any letter case are pictures, folders are skipped, and every other file is counted for the dialog. Each picture becomes a `File` named by its base name and typed by its extension, and passes `intake_import` like a loose file, in the ZIP file's order. The edit drop area refuses ZIP files with a hint to the gallery.
- The ZIP import reads the timestamp of each picture from the filename Export wrote, `<prompt>_<created>_<id>.<ext>`, or `<prompt>_<created>.<ext>` from Imaginer 1.12. The reading with the ID is tried first, because a prompt may end in digits, and a reading counts only when its timestamp lies between 2025-01-01 and the time of the import; otherwise the picture gets the time of the import, and such pictures keep the ZIP file's order, because equal timestamps sort by ID. Thumbnails are inserted by timestamp, newest first, so a restored picture lands where a reload puts it. The question above `IMPORT_COUNT_CONFIRMATION_THRESHOLD` is asked once per ZIP file, with its picture count. One dialog follows the whole import: a picture that could not be imported is listed as one Imaginer could not understand, and a reason follows only when it is a fact, such as a conversion this browser cannot do, an entry JSZip could not read, or a save that failed. The diagnosis intake makes for an unreadable loose file is a guess, so intake marks that error with the name `Unreadable_image_error`, and the ZIP import leaves it out. A file that is not a ZIP file is reported as one that could not be read as a ZIP file, without JSZip's wording.
- Model output is stripped to its pixel chunks when the strip option is on, and stored as returned when it is off; no prompt form is written into gallery files. When stripping fails, the image is stored as returned and the user is told.
- Gallery files stored before the intake existed are converted once, on the user's confirmation (`gallery_migration.js`): a file that is not a PNG is converted, a PNG loses the prompt forms, and with the strip option on every other chunk. Each result is checked for its structure, decoded with `createImageBitmap`, and compared with its header before one committed write replaces the old file. The flag `imaginer.gallery_files_migrated` is set only when every file was converted or none needed it; otherwise the next start offers the remaining files again. A browser without `VideoFrame` is not offered a conversion that needs it, and Generate is blocked while the conversion runs.
- Limits exist only where something outside Imaginer demands them; `components/image_validation.js` holds them:
  - Accepted formats, for the gallery and the edit drop area: PNG, WEBP, JPEG. The gallery also takes ZIP files.
  - The gallery sets no count or size limit. Above `IMPORT_COUNT_CONFIRMATION_THRESHOLD` (100) images, its drop and its 📂 button ask before any work (`components/import_confirm_modal.js`); for a ZIP file, the question counts the pictures in it and is asked once per ZIP file.
  - The edit drop area holds OpenAI's limits for the edit request: `MAXIMUM_IMAGE_COUNT_PER_EDIT_REQUEST` (16 images) and `MAXIMUM_BYTES_PER_EDIT_REQUEST_IMAGE` (50 MB per image). A batch that would exceed 16 images is rejected in full, before any work. Every image is checked against 50 MB when it is added: a file from the computer after its conversion, a gallery thumbnail on its stored size. So a gallery image above 50 MB, which the gallery accepts, is refused at the drop. A gallery file that is still a JPEG or WebP is converted for the request and meets the same limit again at Generate.
  - Every other failure concerns only its file: the others are imported, and one dialog lists the failures afterwards.
- The intake verifies the file is actually readable before converting it, via `validate_file_readable()` (`components/image_validation.js`), which decodes the file with `createImageBitmap()`. This catches files whose type passes validation but whose content the browser cannot read — most notably a known Linux/Chromium drag-and-drop bug where a dropped file's bytes become inaccessible after the drop. The failure message depends on the DOM exception name:
  - `NotFoundError`: the file's bytes are gone (the Linux/Chromium drag-and-drop bug) — the message suggests trying Firefox.
  - `NotReadableError`: the file is locked by another program, or unreadable due to permissions.
  - `EncodingError`: the bytes were read, but the content is not a valid image (corrupt or mislabeled file).
  - Any other error: a generic "could not be imported" message.
- The edit drop area's mask (from an image dragged out of the gallery) has separate limits, also enforced by `components/image_validation.js`:
  - Format: PNG.
  - Maximum file size: 4 MB.
  - Dimensions: must match its image's pixel dimensions exactly.
  - A mask failing any of these is discarded and an error is shown; the image itself is still added. This can only happen from a corrupted `mask_blob` record — masks are always generated at exactly their source image's dimensions (see `components/viewer/viewer.js` `close()`).
- Embedded prompts are read from PNG (iTXt/XMP), JPEG (XMP/EXIF), and WebP (XMP/EXIF) on import. A compressed iTXt `prompt_text` chunk is inflated, and XML entities in an XMP description are decoded. A damaged file imports with an empty prompt instead of failing.
- Optional prompt embedding on download and ZIP export writes the prompt as an iTXt chunk (`prompt_text`) and/or an XMP packet (`dc:description`) into the PNG, replacing any earlier copy of either form, so a file never carries the prompt twice; the XMP packet is XML-escaped, and an empty prompt writes nothing. If the strip option is on, every chunk except `IHDR`, `PLTE`, `tRNS`, `IDAT` and `IEND` is removed first, so palette PNGs keep their palette and transparency. Both are chunk operations in `PNG_chunks.js` that never decode the pixels. Mask PNGs store editable areas with transparent alpha.
- The edit request reduces every image and the mask to their pixel chunks when it is built, and converts a gallery file that is not a PNG in memory for it; the parts are named `image_1.png`, `image_2.png` and so on, and `mask.png`. The prompt panel keeps one snapshot of its entries, image, mask and label, which the request reads at the click.

## OpenAI Integration
- Imaginer accepts two API key formats from OpenAI:
   - Legacy keys starting with `sk-` and exactly 51 characters in total.
   - Project keys starting with `sk-proj-` and at least 108 characters (8-character prefix plus 100 or more characters).
- Default model fallback is `gpt-image-2.5-flare`. The recommended models are `gpt-image-2.5-flare` and `gpt-image-2.5-sunburst` (`RECOMMENDED_MODEL_IDS` in `model_fetcher.js`); every other model ID counts as an older model.
- The dropdown shows the cached or refreshed `gpt-image-*` models filtered by `filter_models_for_dropdown`: only the recommended models unless `imaginer.show_older_models` is `"true"`, then the full list including dated snapshots.
- `get_selected_model` replaces a stored selection that the dropdown does not show with the default model and stores it. The rule applies at every read, so it covers startup, model refresh, and disabling **Show older models** in the config dialog.
- When no input images are dropped, Imaginer sends `/v1/images/generations` requests. When images are dropped and a non-mini model is selected, it sends `/v1/images/edits` with the first image's mask attached if one exists.
- Generations send `model`, `prompt`, `n`, `size`, and optional `quality`/`background`/`moderation` values.
- Edits send the dropped images as bare pixels, each reduced to a clean PNG (`pixels_only_PNG` in `image_conversion.js`; a gallery file that is still a JPEG or WebP is converted in memory for the request) and named `image_1.png`, `image_2.png` and so on in the input area's order, plus `prompt`, `n`, `size`, optional `quality`/`background`/`moderation`, the first image's mask reduced the same way and named `mask.png` if present, and `input_fidelity` (the user's Low/High choice) — but only for the `gpt-image-1` and `gpt-image-1.5` models. `gpt-image-2` and the `gpt-image-2.5` models always process image inputs at high fidelity, so the parameter is omitted for them.
- Streaming previews (`stream: true` with `partial_images`) are requested on both endpoints when the streaming preview is enabled. Generations consume `image_generation.partial_image` and `image_generation.completed` events, edits consume `image_edit.partial_image` and `image_edit.completed` events (`consume_image_stream` in `app.js`). A streamed edit sends one request per requested image with `n` set to 1, so each placeholder receives its own preview sequence.
- Quality values: all GPT image models accept `low`, `medium`, `high` and `auto`. The `gpt-image-2.5` models additionally accept `xhigh` and `max`. `clamp_quality_for_model` in `model_fetcher.js` replaces `xhigh` and `max` with `high` at request time when the selected model ID does not start with `gpt-image-2.5`. The stored `imaginer.quality` value is not changed.
- Background values are not clamped per model. `background: transparent` is supported by `gpt-image-1` and by both `gpt-image-2.5` models, and Imaginer never sends `output_format`, so the API default PNG preserves the transparency.
- Generation results and edit results pass through the same intake (`accept_model_output` in `image_intake.js`): the strip option removes OpenAI's metadata; no prompt is embedded at this point.
- Moderation errors (`code: "moderation_blocked"`) may carry a `moderation_details` object with `moderation_stage` (`input`, `output`, `unknown`) and a `categories` list. The moderation dialog shows the stage and the categories when they are present.
- Selecting a `*-mini` model disables editing: dropped images are ignored and the request falls back to a plain generation.
- Model refresh and API key tests both call `/v1/models` and cache image model IDs in `localStorage`. The API key test succeeds when at least one returned model ID starts with `gpt-image-`.
- Download and ZIP export filenames are built locally as `<prompt>_<created>_<id>.<ext>`: a sanitized prompt prefix, the image creation timestamp, and the record's IndexedDB ID, which keeps every name unique within a ZIP. The prefix length comes from `imaginer.filename_prompt_chars`, defaults to 110, and is clamped to 1-230. The ZIP import reads the timestamp back from this name.
- Download and ZIP export share one Export path (`export_image` in `image_export.js`): strip per the strip option, the prompt forms per the prompt options, both from the saved settings and the gallery record. A PNG that cannot be processed does not leave: ⬇️ shows an error dialog, and the ZIP export leaves the file out and lists it after the download. With the strip option off and both prompt options off, a file leaves as stored and unparsed. A gallery file that is still a JPEG or WebP, because the conversion of older galleries was postponed or failed for it, leaves only with the strip option and both prompt options off, as stored; otherwise it is refused like any file that cannot be processed.


# Appendices

## Keyboard Reference
- `Ctrl` + `Enter` / `Cmd` + `Enter`: Generate from the prompt box.
- `←` / `→`: Flip to the previous/next gallery image while the viewer is open (viewer mode only).
- `Escape`: Close the viewer (saving the current mask if one was painted).
- `D`: Toggle debug overlay (viewer mode).
- `Ctrl` + `D`: Toggle debug overlay (mask mode).
- `Ctrl` + mouse wheel: Adjust brush size (mask mode).

## Surfboard
- On `localhost` and `127.0.0.1`, `surfboard.js` adds `window.imaginer_surfboard`, so a script can use Imaginer without a mouse:
  - `list_records()`: every gallery picture, newest first, with its ID, creation time, the start of its prompt, and whether it has a mask.
  - `add_to_input_area(record_id)`: puts a gallery picture into the edit drop area along the path of a real gallery drag, mask included, and resolves with the number of images in the drop area.
  - `set_prompt(text)`: sets the prompt as typing would, so it is saved.
  - `show_surfer_bar(message)`: shows the surfer bar, a blue bar at the top of the page with the message and a 🛑 button, so the person watching sees what the script is doing. A click on 🛑 turns it red, and it keeps the stop message until the ride is finished.
  - `finish_surfer_bar(message)`: turns the surfer bar green with the message and clears the stop request.
  - `is_stop_requested()`: whether someone pressed 🛑 since the last finished ride. A script checks it before every step.
- No surfboard function sends a request to OpenAI. A request goes out only through Generate, by its button or Ctrl+Enter, the same way a user sends it.
- Importing needs no surfboard function: the 📂 button's file input, `#import-file-input`, takes files directly.

## Version History
- Version info is stored in `version.json`.
- Release notes appear as modals on updates and are shown once per version.
- Update-time and manual cache refresh use `cache_manifest.json` plus `fetch(..., { cache: "reload" })` for core JS, JSON, HTML, CSS, and selected documentation files.
- `versioned_url` in `version_manager.js` adds `?v=<version>` to a relative URL, so a module loaded through it is fetched fresh after an update. An ES module is keyed by its full URL, so a module imported statically in one place and through `versioned_url` in another runs as two instances with separate state. State that two places share comes from one instance, like the prompt panel's snapshot that the edit request reads.

## The Intro Sequence
- First launch shows a cinematic intro after API key entry (requires WebGL).
- The preload screen offers audio test, fullscreen, and font selection.
- Controls: `1`–`5` switch fonts, `+`/`-` adjust font scale, Arrow Up/Down control volume.
- Settings are saved and carry into the cinematic.
- Completing or skipping the intro bypasses it on future launches.

