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

## Input area door

The external-file branch of the drop listener in `Generation_panel.attach_events`, and `drop_area_manager.try_add_images`.

| Rule | Today | Gap |
|---|---|---|
| **External metadata:** strip checkbox on → removed, off → kept | The dropped `File` is kept in memory byte for byte. The strip checkbox is ignored. | ✗ |
| **Imaginer metadata:** none | Kept, if the file carries any. | ✗ |
| **Pixels:** upright RGBA PNG | Kept as dropped: JPEG and WebP stay JPEG and WebP, and the orientation is not applied to the pixels. | ✗ |
| **In memory only; can only be removed** | Only `drop_area_manager` holds the image. A click on its thumbnail removes it; no path leads into the gallery. | ✓ |
| **Errors reach the user** | Count, type, size and readability are checked for the whole batch; a failure reaches the user through `Error_modal`. | ✓ |

For comparison, Gallery → input area (in-app, no intake), the internal branch of the same drop listener:

- The image is the gallery file itself. For model output, the listener sets `blob.name` on the gallery's own `Blob`, a filename built from the prompt; an imported `File` keeps its original name.
- The mask becomes `new File([mask_blob], "mask.png", { type: "image/png" })`. `validate_mask_file` checks it, and a failing mask is dropped with a message.

## Export

### Download

The ⬇️ handler in `Gallery._build_thumbnail_content`.

| Rule | Today | Gap |
|---|---|---|
| **External metadata:** strip checkbox on → removed, off → kept | PNG: `process_image_metadata` strips per the current strip checkbox, but `strip_metadata_from_PNG` also removes `PLTE` and `tRNS`, which breaks palette PNGs and loses transparency. JPEG and WebP: the bytes leave unchanged, GPS included, whatever the strip checkbox says. | ✗ |
| **Imaginer metadata:** exactly the forms whose prompt checkbox is on | PNG with strip on: the old forms are removed and fresh ones written ✓. PNG with strip off: the fresh forms are added next to the old ones, so the file carries them twice. Both prompt checkboxes off with strip off: the old forms leave anyway. JPEG and WebP: never any. | ✗ |
| **No prompt → none** | `prompt_text \|\| ""` writes empty forms. | ✗ |
| **Filename:** `<prompt>_<created>_<id>.png` | `build_image_filename` gives `<prompt>_<created>.<ext>`, without the ID. | ✗ |

### ZIP export

The same loop twice: in `Config_dialog` ("Download All Images") and in `Performance_warning.download_all`.

| Rule | Today | Gap |
|---|---|---|
| **External metadata:** strip checkbox on → removed, off → kept | The gallery files leave byte for byte. The strip checkbox is ignored. | ✗ |
| **Imaginer metadata:** exactly the forms whose prompt checkbox is on | None is written. Model output carries the forms baked in at the Generate click; imports carry whatever they brought. | ✗ |
| **Filename:** unique | No ID. Equal names occur for several images of one non-streaming generation (one `created` for all), for imports without a prompt in the same second (all `image_<created>`), and for the same prompt in the same second. JSZip 3.10.1 then keeps only the last entry, so images are missing from the ZIP without a message (tested with the vendored copy). | ✗ |

### Writers of Imaginer metadata

- `add_iTXt_chunk_to_png` inserts before the first `IDAT`, and `embed_XMP_description` after `IHDR`. Neither looks for an existing form.
- `create_XMP_packet` inserts the prompt without XML escaping. A prompt with `&` or `<` produces an invalid XMP packet.
- Failures are only logged (`console.warn` in `process_image_metadata`); the Download continues without Imaginer metadata and without a message. The rules do not say yet whether an error at Export reaches the user.

## Edit request

The edit request branch of the `Generation_panel` callback in `app.js`.

| Rule | Today | Gap |
|---|---|---|
| **Images: pixels only** | `form_data.append("image[]", file, file.name)` sends every image byte for byte: external metadata such as GPS for imports, Imaginer metadata for model output. | ✗ |
| **Mask: pixels only** | The mask is the canvas PNG from `Viewer.close`, sent as stored. In current Firefox it probably carries the `deBG` chunk (untested). | ~ |
| **Neutral filenames** | Imports go out with their original filename, model output with a filename built from the prompt. The mask is named `mask.png`. | ✗ |
| **Content type** | Set by the browser for every `File` and `Blob` (`image/png`, `image/jpeg`, `image/webp`). | ✓ |

Consequences that the conversion at intake removes:

- A JPEG or WebP image goes out next to a PNG mask, although the image generation guide asks for the same format.
- A photo with an EXIF orientation goes out unrotated, while its mask was painted on the upright view. Whether OpenAI applies the EXIF orientation is unknown.

Also found: with a mini model selected, the input area is ignored without a message and a generation request goes out instead (not a metadata topic; an open thread in `Status.md`).

## Across all paths

### Existing gallery files

Every gallery file stored so far was created under the old behaviour: model output is a PNG with Imaginer metadata baked in, and imports are the original JPEG, WebP or PNG files with their external metadata. The rules assume that every gallery file is an upright RGBA PNG without Imaginer metadata. Until that holds, Export and the edit request would have to convert and clean up on their own, which is exactly what the rules move to intake. Open for the Discussion: convert the existing gallery files once, or handle them at Export and at the edit request.

### Order

- The conversion needs the local browser tests first.
- Export must write Imaginer metadata before intake stops writing it; otherwise ZIP exports lose their prompts.
- The edit request needs every image it sends to be a PNG before it can reduce it to pixels without loss. That needs the conversion at intake and a decision about existing gallery files.

### Gaps

1. Import to Gallery: apply intake (strip, conversion, removal of Imaginer metadata).
2. Model output: stop writing Imaginer metadata at intake, after Export writes it.
3. Conversion: needs the local browser tests first.
4. Intake errors reach the user: the `save` failure at Import to Gallery, and the strip and embedding failures at model output.
5. Prompt reading: the compressed iTXt and the XML entities.
6. One intake function for both doors, instead of the four copies in `app.js`, the drop listener in `components/gallery.js`, and the drop listener of the input area.
7. Open: the intro image. Ignore it (session only), or route it through intake.
8. Input area door: apply the same intake in memory.
9. One Export function for Download and ZIP export instead of three places.
10. Export: strip per the strip checkbox for every gallery file; fresh Imaginer metadata without duplicates or leftovers; none without a prompt; the XMP form XML-escaped; the filename with the ID.
11. Open: whether an error at Export reaches the user.
12. Edit request: pixels only for images and mask, neutral filenames `image_1.png` and `mask.png`, and no more `blob.name` on the gallery's own `Blob`.
13. Open: existing gallery files.
