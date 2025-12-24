# Technical Information

## Architecture Overview
- Imaginer runs entirely in the browser. There is no server-side storage.
- Image generation uses OpenAI's `/v1/images/generations` and `/v1/images/edits` endpoints. Model lists come from `/v1/models`.
- The conversation panel is a local mock; it does not call the Responses API.

## Data Storage
- Images, prompts, masks, creation timestamps, and UUIDs are stored in IndexedDB (`imaginer-db`, `images` object store). Masks save when you close the viewer if you loaded the image from the gallery.
- Settings (prompt text, orientation, quality, background, n, maximum parallel jobs, metadata options, mask button visibility, model selection) live in `localStorage`.
- The API key is XOR-obfuscated and base64-encoded in `localStorage`. The debug function (`window.tabula_rasa()`) clears all local data.
- A performance warning appears if gallery loading takes more than about 15 seconds and offers quick download or clear options.

## Image Formats
- All stored images are PNG. JPEG imports are converted to PNG on drop.
- Optional prompt embedding uses iTXt (`prompt_text`) and XMP blocks. Mask PNGs store editable areas with transparent alpha.

## OpenAI Integration
- Imaginer accepts two API key formats from OpenAI:
   - Legacy keys starting with `sk-` and exactly 51 characters in total.
   - Project keys starting with `sk-proj-` and at least 108 characters (8-character prefix plus 100 or more characters).
- Default model fallback is `gpt-image-1.5`; the dropdown shows cached or refreshed `gpt-image-*` models.
- When no input images are dropped, Imaginer sends `/v1/images/generations` requests. When images are dropped and the model supports editing, it sends `/v1/images/edits` with the first mask attached if one exists.
- Generations send `model`, `prompt`, `n`, `size`, and optional `quality`/`background` values. Edits send dropped images, prompt, `n`, `size`, optional `quality`/`background`, and `input_fidelity=high` for `gpt-image-1`.
- Model refresh and API key tests both call `/v1/models` and cache image model IDs in `localStorage`.


# Appendices

## Keyboard Reference
- `Escape`: Close viewer or exit mask mode.
- `D`: Toggle debug overlay (viewer).
- `Ctrl` + `D`: Toggle debug overlay (mask mode).
- `Ctrl` + mouse wheel: Adjust brush size.

## Version History
- Version info is stored in `version.json`.
- Release notes appear as modals on updates and are shown once per version.

## The Intro Sequence
- First launch shows a cinematic intro after API key entry (requires WebGL).
- The preload screen offers audio test, fullscreen, and font selection.
- Controls: `1`–`5` switch fonts, `+`/`-` adjust font scale, Arrow Up/Down control volume.
- Settings are saved and carry into the cinematic.
- Completing or skipping the intro bypasses it on future launches.

