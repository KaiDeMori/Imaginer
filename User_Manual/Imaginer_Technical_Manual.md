# Technical Information

## Architecture Overview
- Imaginer runs entirely in the browser. There is no server-side storage.
- Image generation uses OpenAI's `/v1/images/generations` and `/v1/images/edits` endpoints. Model lists come from `/v1/models`.
- The conversation panel is a local mock; it does not call the Responses API.

## Data Storage
- Images, prompts, masks, creation timestamps, and UUIDs are stored in IndexedDB (`imaginer-db`, `images` object store). Masks save when you close the viewer if you loaded the image from the gallery.
- Settings (prompt text, orientation/size, advanced size mode and saved custom sizes, quality, background, input fidelity, hidden moderation level, n, maximum parallel jobs, streaming preview count, metadata options, filename prompt length, mask button visibility, model selection, and visibility of older models) live in `localStorage`. See `localStorage_keys_explained.md` for the full list.
- `imaginer.background` is written by two controls. The menu bar dropdown writes on every change; the config dialog writes on **Save**. The menu bar re-reads the key on `imaginer.config_changed`, and `Config_dialog.open` re-reads it on every open, so both controls show the stored value. A stored value outside `auto`, `transparent` and `opaque` is replaced with `auto` by the menu bar.
- The API key is XOR-obfuscated and base64-encoded in `localStorage`. The debug function (`window.tabula_rasa()`) clears all local data.
- A performance warning appears if gallery loading takes more than about 15 seconds and offers quick download or clear options.

## Image Formats
- Every gallery file is a PNG. AI-generated images arrive as PNG; imported JPEG and WebP files are converted at import.
- Imports pass one intake (`image_intake.js`) at both drop targets: the prompt is read from the file's metadata first, then a PNG is stripped to its pixel chunks (`IHDR`, `PLTE`, `tRNS`, `IDAT`, `IEND`), and any other image is converted (`image_conversion.js`): `createImageBitmap` with the EXIF orientation applied, the pixels read through `VideoFrame.copyTo` as RGBA without a canvas, and encoded with the own PNG encoder (`encode_PNG_RGBA` in `PNG_chunks.js`, one filter per row). The format is decided by the bytes, so a renamed file is treated as what it is. A browser without `VideoFrame` cannot import JPEG and WebP; the message says so.
- Model output is stripped to its pixel chunks when the strip option is on, and stored as returned when it is off; no prompt form is written into gallery files. When stripping fails, the image is stored as returned and the user is told.
- Both drop targets share the same import limits, enforced by `components/image_validation.js`:
  - Accepted formats: PNG, WEBP, JPEG.
  - Maximum file size: 50 MB.
  - Maximum count: 16 files per drop.
  - A batch that exceeds the count of 16 is rejected in full, before any work. Every other failure concerns only its file: the others are imported, and one dialog lists the failures afterwards. In the edit drop area, a converted PNG above 50 MB is refused as well, because the edit request has that limit.
- The intake verifies the file is actually readable before converting it, via `validate_file_readable()` (`components/image_validation.js`), which decodes the file with `createImageBitmap()`. This catches files whose type and size pass validation but whose content the browser cannot read — most notably a known Linux/Chromium drag-and-drop bug where a dropped file's bytes become inaccessible after the drop. The failure message depends on the DOM exception name:
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

## OpenAI Integration
- Imaginer accepts two API key formats from OpenAI:
   - Legacy keys starting with `sk-` and exactly 51 characters in total.
   - Project keys starting with `sk-proj-` and at least 108 characters (8-character prefix plus 100 or more characters).
- Default model fallback is `gpt-image-2.5-flare`. The recommended models are `gpt-image-2.5-flare` and `gpt-image-2.5-sunburst` (`RECOMMENDED_MODEL_IDS` in `model_fetcher.js`); every other model ID counts as an older model.
- The dropdown shows the cached or refreshed `gpt-image-*` models filtered by `filter_models_for_dropdown`: only the recommended models unless `imaginer.show_older_models` is `"true"`, then the full list including dated snapshots.
- `get_selected_model` replaces a stored selection that the dropdown does not show with the default model and stores it. The rule applies at every read, so it covers startup, model refresh, and disabling **Show older models** in the config dialog.
- When no input images are dropped, Imaginer sends `/v1/images/generations` requests. When images are dropped and a non-mini model is selected, it sends `/v1/images/edits` with the first image's mask attached if one exists.
- Generations send `model`, `prompt`, `n`, `size`, and optional `quality`/`background`/`moderation` values.
- Edits send the dropped images, `prompt`, `n`, `size`, optional `quality`/`background`/`moderation`, the first image's `mask` if present, and `input_fidelity` (the user's Low/High choice) — but only for the `gpt-image-1` and `gpt-image-1.5` models. `gpt-image-2` and the `gpt-image-2.5` models always process image inputs at high fidelity, so the parameter is omitted for them.
- Streaming previews (`stream: true` with `partial_images`) are requested on both endpoints when the streaming preview is enabled. Generations consume `image_generation.partial_image` and `image_generation.completed` events, edits consume `image_edit.partial_image` and `image_edit.completed` events (`consume_image_stream` in `app.js`). A streamed edit sends one request per requested image with `n` set to 1, so each placeholder receives its own preview sequence.
- Quality values: all GPT image models accept `low`, `medium`, `high` and `auto`. The `gpt-image-2.5` models additionally accept `xhigh` and `max`. `clamp_quality_for_model` in `model_fetcher.js` replaces `xhigh` and `max` with `high` at request time when the selected model ID does not start with `gpt-image-2.5`. The stored `imaginer.quality` value is not changed.
- Background values are not clamped per model. `background: transparent` is supported by `gpt-image-1` and by both `gpt-image-2.5` models, and Imaginer never sends `output_format`, so the API default PNG preserves the transparency.
- Generation results and edit results pass through the same intake (`accept_model_output` in `image_intake.js`): the strip option removes OpenAI's metadata; no prompt is embedded at this point.
- Moderation errors (`code: "moderation_blocked"`) may carry a `moderation_details` object with `moderation_stage` (`input`, `output`, `unknown`) and a `categories` list. The moderation dialog shows the stage and the categories when they are present.
- Selecting a `*-mini` model disables editing: dropped images are ignored and the request falls back to a plain generation.
- Model refresh and API key tests both call `/v1/models` and cache image model IDs in `localStorage`. The API key test succeeds when at least one returned model ID starts with `gpt-image-`.
- Download and ZIP export filenames are built locally as `<prompt>_<created>_<id>.<ext>`: a sanitized prompt prefix, the image creation timestamp, and the record's IndexedDB ID, which keeps every name unique within a ZIP. The prefix length comes from `imaginer.filename_prompt_chars`, defaults to 110, and is clamped to 1-230.
- Download and ZIP export share one Export path (`export_image` in `image_export.js`): strip per the strip option, the prompt forms per the prompt options, both from the saved settings and the gallery record. A PNG that cannot be processed does not leave: ⬇️ shows an error dialog, and the ZIP export leaves the file out and lists it after the download. With the strip option off and both prompt options off, a file leaves as stored and unparsed. Gallery files that are still JPEG or WebP, imported before the conversion existed, leave as stored.


# Appendices

## Keyboard Reference
- `Ctrl` + `Enter` / `Cmd` + `Enter`: Generate from the prompt box.
- `←` / `→`: Flip to the previous/next gallery image while the viewer is open (viewer mode only).
- `Escape`: Close the viewer (saving the current mask if one was painted).
- `D`: Toggle debug overlay (viewer mode).
- `Ctrl` + `D`: Toggle debug overlay (mask mode).
- `Ctrl` + mouse wheel: Adjust brush size (mask mode).

## Version History
- Version info is stored in `version.json`.
- Release notes appear as modals on updates and are shown once per version.
- Update-time and manual cache refresh use `cache_manifest.json` plus `fetch(..., { cache: "reload" })` for core JS, JSON, HTML, CSS, and selected documentation files.

## The Intro Sequence
- First launch shows a cinematic intro after API key entry (requires WebGL).
- The preload screen offers audio test, fullscreen, and font selection.
- Controls: `1`–`5` switch fonts, `+`/`-` adjust font scale, Arrow Up/Down control volume.
- Settings are saved and carry into the cinematic.
- Completing or skipping the intro bypasses it on future launches.

