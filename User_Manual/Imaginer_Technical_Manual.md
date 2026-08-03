# Technical Information

## Architecture Overview
- Imaginer runs entirely in the browser. There is no server-side storage.
- Image generation uses OpenAI's `/v1/images/generations` and `/v1/images/edits` endpoints. Model lists come from `/v1/models`.
- The conversation panel is a local mock; it does not call the Responses API.

## Data Storage
- Images, prompts, masks, creation timestamps, and UUIDs are stored in IndexedDB (`imaginer-db`, `images` object store). Masks save when you close the viewer if you loaded the image from the gallery.
- Settings (prompt text, orientation/size, advanced size mode and saved custom sizes, quality, background, input fidelity, hidden moderation level, n, maximum parallel jobs, streaming preview count, metadata options, filename prompt length, mask button visibility, and model selection) live in `localStorage`. See `localStorage_keys_explained.md` for the full list.
- The API key is XOR-obfuscated and base64-encoded in `localStorage`. The debug function (`window.tabula_rasa()`) clears all local data.
- A performance warning appears if gallery loading takes more than about 15 seconds and offers quick download or clear options.

## Image Formats
- AI-generated images are always PNG.
- Imported images (gallery drop, or the Prompt Panel's edit drop area) keep their native format — no conversion.
- Both drop targets share the same import limits, enforced by `components/image_validation.js`:
  - Accepted formats: PNG, WEBP, JPEG.
  - Maximum file size: 50 MB.
  - Maximum count: 16 files per drop.
  - A dropped batch containing one unsupported format, one oversized file, or exceeding the count of 16 is rejected in full — nothing from that batch is imported.
- The edit drop area's mask (from an image dragged out of the gallery) has separate limits, also enforced by `components/image_validation.js`:
  - Format: PNG.
  - Maximum file size: 4 MB.
  - Dimensions: must match its image's pixel dimensions exactly.
  - A mask failing any of these is discarded and an error is shown; the image itself is still added. This can only happen from a corrupted `mask_blob` record — masks are always generated at exactly their source image's dimensions (see `components/viewer/viewer.js` `close()`).
- Embedded prompts are read from PNG (iTXt/XMP), JPEG (XMP/EXIF), and WebP (XMP/EXIF) on import.
- Optional prompt embedding on generation and download writes iTXt (`prompt_text`) and/or an XMP block into the PNG; if the strip option is on, server-side metadata is removed first. Mask PNGs store editable areas with transparent alpha.

## OpenAI Integration
- Imaginer accepts two API key formats from OpenAI:
   - Legacy keys starting with `sk-` and exactly 51 characters in total.
   - Project keys starting with `sk-proj-` and at least 108 characters (8-character prefix plus 100 or more characters).
- Default model fallback is `gpt-image-2`; the dropdown shows cached or refreshed `gpt-image-*` models.
- When no input images are dropped, Imaginer sends `/v1/images/generations` requests. When images are dropped and a non-mini model is selected, it sends `/v1/images/edits` with the first image's mask attached if one exists.
- Generations send `model`, `prompt`, `n`, `size`, and optional `quality`/`background`/`moderation` values. Streaming previews (`stream: true` with `partial_images`) are requested on generations only, never on edits.
- Edits send the dropped images, `prompt`, `n`, `size`, optional `quality`/`background`/`moderation`, the first image's `mask` if present, and `input_fidelity` (the user's Low/High choice) — but only for the `gpt-image-1` and `gpt-image-1.5` models.
- Selecting a `*-mini` model disables editing: dropped images are ignored and the request falls back to a plain generation.
- Model refresh and API key tests both call `/v1/models` and cache image model IDs in `localStorage`.
- Downloaded PNG filenames are built locally from a sanitized prompt prefix plus the image creation timestamp. The prefix length comes from `imaginer.filename_prompt_chars`, defaults to 110, and is clamped to 1-230.


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
- Update-time and manual cache refresh use `cache_manifest.json` plus `fetch(..., { cache: "reload" })` for core JS, JSON, HTML, and selected documentation files.

## The Intro Sequence
- First launch shows a cinematic intro after API key entry (requires WebGL).
- The preload screen offers audio test, fullscreen, and font selection.
- Controls: `1`–`5` switch fonts, `+`/`-` adjust font scale, Arrow Up/Down control volume.
- Settings are saved and carry into the cinematic.
- Completing or skipping the intro bypasses it on future launches.

