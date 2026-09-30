# Metadata gap analysis

Compares the rules in [metadata_terms.md](metadata_terms.md) with today's code, one path at a time, for [Rock-solid metadata](../Tasks/Rock_solid_metadata.md).
The main model read every row in the code by hand. Compared on 2026-09-30.

Legend: ✓ matches the rule, ~ matches partly, ✗ gap.

## Gallery door

### Model output

The same code exists four times in `app.js`: in `consume_image_stream`, in the edit request branch, and twice in the generation request branch.

| Rule | Today | Gap |
|---|---|---|
| **External metadata:** strip checkbox on → removed, off → kept | `process_image_metadata` strips with `strip_metadata_from_PNG`, which keeps only `IHDR`, `IDAT` and `IEND`. The strip checkbox is read when the image arrives. | ✓ |
| **Imaginer metadata:** the gallery file carries none | `process_image_metadata` writes the iTXt form and the XMP form into the gallery file, following the prompt checkboxes as they were at the Generate click. | ✗ |
| **Prompt:** from the prompt panel | `prompt_input.value.trim()` at the Generate click (`Generation_panel.attach_events`) becomes `prompt_text` in the gallery record. | ✓ |
| **Pixels:** upright RGBA PNG | The PNG as OpenAI returns it. Upright by nature. RGBA is neither guaranteed nor verified. | ~ |
| **Errors reach the user** | Failures of strip and embedding are only logged (`console.warn` in `process_image_metadata`); the image is stored anyway. | ✗ |

### Import to Gallery

The drop listener in `Gallery.enable_drag_and_drop`.

| Rule | Today | Gap |
|---|---|---|
| **External metadata:** strip checkbox on → removed, off → kept | The dropped file is stored byte for byte (`image_blob: file`). The strip checkbox is ignored. | ✗ |
| **Imaginer metadata:** the gallery file carries none | Kept, if the file carries any, for example a re-imported Download. | ✗ |
| **Prompt:** from the file's metadata, if present | `read_image_prompt`: PNG: iTXt `prompt_text`, otherwise XMP `dc:description`. JPEG and WebP: XMP `dc:description`, otherwise EXIF `UserComment`. See the prompt details below and the open point "Prompt source" in the terms. | ~ |
| **Pixels:** upright RGBA PNG | Stored as dropped: JPEG and WebP stay JPEG and WebP, the orientation is not applied to the pixels, and palette, 16-bit and animated PNGs stay as they are. The stored `File` keeps its original filename (per the platform's structured clone; not tested). | ✗ |
| **Errors reach the user** | Validation errors reach the user (`Error_modal`). A failing `database_store.save` is not caught, so the rest of the batch is dropped without a message (read from the code; not observed). | ✗ |

Prompt details, in `read_png_metadata` (`components/png_metadata_reader.js`):

- A compressed iTXt `prompt_text` is read as garbage, because the compression flag is skipped.
- XML entities in XMP are not decoded: `&amp;` stays `&amp;`. The JPEG and WebP readers use the same regular expression.

### Also found

- `convert_image_to_png` in `components/image_converter.js` is unused and draws on a canvas. In current Firefox, its PNG would carry the `deBG` chunk (see [metadata_research.md](metadata_research.md)).
- The intro image: `expose_internals_for_intro().add_image` in `app.js` adds a thumbnail without a gallery record. It has ⬇️ and can be dragged onto the input area, so it skips intake.

### Gaps

1. Import to Gallery: apply intake (strip, conversion, removal of Imaginer metadata).
2. Model output: stop writing Imaginer metadata at intake.
   - Order: the ZIP export writes no Imaginer metadata today. If intake stops embedding before Export writes Imaginer metadata, ZIP exports lose their prompts.
3. Conversion: needs the local browser tests first.
4. Intake errors reach the user: the `save` failure at Import to Gallery, and the strip and embedding failures at model output.
5. Prompt reading: the compressed iTXt and the XML entities.
6. One intake function instead of five places: the four copies in `app.js` and the drop listener in `components/gallery.js`.
7. Open: the intro image. Ignore it (session only), or route it through intake.

## Input area door

Not compared yet.

## Export

Not compared yet.

## Edit request

Not compared yet.
