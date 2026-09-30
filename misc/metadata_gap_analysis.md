# Metadata gap analysis

Compares the rules in [metadata_terms.md](metadata_terms.md) with today's code, one path at a time, for [Rock-solid metadata](../Tasks/Rock_solid_metadata.md).
The main model read every row in the code by hand. Compared on 2026-09-30.

Legend: ✓ matches the rule, ~ matches partly, ✗ gap.

## Gallery door

### Model output

The four places in `app.js` that receive model output share `save_model_output`, which calls `accept_model_output` in `image_intake.js`.

| Rule | Today | Gap |
|---|---|---|
| **External metadata:** strip checkbox on → removed, off → kept | `accept_model_output` strips with `strip_PNG`, which keeps `IHDR`, `PLTE`, `tRNS`, `IDAT` and `IEND`. The strip checkbox is read when the image arrives. | ✓ |
| **Imaginer metadata:** the gallery file carries none | No form is written at intake; Export writes them from the record. | ✓ |
| **Prompt:** from the prompt panel | `prompt_input.value.trim()` at the Generate click (`Generation_panel.attach_events`) becomes `prompt_text` in the gallery record. | ✓ |
| **Pixels:** a PNG, upright as the browser displays it | The PNG as OpenAI returns it, stored unchanged. | ✓ |
| **Errors reach the user** | A failing strip keeps the image as returned and shows a dialog, per the Intake rule "Errors". | ✓ |

### Import to Gallery

The drop listener in `Gallery.enable_drag_and_drop` calls `intake_import` in `image_intake.js`.

| Rule | Today | Gap |
|---|---|---|
| **External metadata:** removed | A PNG is stripped to its pixel chunks; a JPEG or WebP is converted to a fresh PNG. | ✓ |
| **Imaginer metadata:** the gallery file carries none | Removed with the other chunks, after the prompt is read. | ✓ |
| **Prompt:** from the file's metadata, if present | `read_import_prompt`, by the bytes: PNG: iTXt `prompt_text`, otherwise XMP `dc:description`. JPEG and WebP: XMP `dc:description`, otherwise EXIF `UserComment`. As the Intake rule "Prompt" in the terms states. | ✓ |
| **Pixels:** a PNG, upright as the browser displays it | A PNG keeps its pixels; a JPEG or WebP is converted to the pixels the browser displays, orientation applied. The gallery file is a `Blob` without a filename. | ✓ |
| **Errors reach the user** | Too many files are refused first; every other failure, `save` included, is listed in one dialog after the batch, and the other files still import. | ✓ |

Prompt details: `read_PNG_prompt` in `PNG_chunks.js` inflates a compressed iTXt `prompt_text` chunk, and all three readers decode XML entities in the XMP description. Gap 5 is built in step 2.

### Also found

- `convert_image_to_png` in `components/image_converter.js` is unused and draws on a canvas. In current Firefox, its PNG would carry the `deBG` chunk (see [metadata_research.md](metadata_research.md)).
- The intro image: `expose_internals_for_intro().add_image` in `app.js` adds a thumbnail without a gallery record. It has ⬇️ and can be dragged onto the input area, so it skips intake.

## Input area door

The external-file branch of the drop listener in `Generation_panel.attach_events` calls `intake_import`, then `drop_area_manager.try_add_images`.

| Rule | Today | Gap |
|---|---|---|
| **External metadata:** removed | The same intake as the gallery door; the PNG is kept in memory. | ✓ |
| **Imaginer metadata:** none | Removed at intake. | ✓ |
| **Pixels:** a PNG, upright as the browser displays it | The PNG from intake, named after the original file with the extension `png`. | ✓ |
| **In memory only; can only be removed** | Only `drop_area_manager` holds the image. A click on its thumbnail removes it; no path leads into the gallery. | ✓ |
| **Errors reach the user** | The count is checked first; every other failure is listed in one dialog, and a converted PNG above the edit request's limit is refused with its size named. | ✓ |

For comparison, Gallery → input area (in-app, no intake), the internal branch of the same drop listener:

- The image is the gallery file itself. The listener sets `blob.name` on the gallery's own `Blob`, a filename built from the prompt; a gallery file stored before intake existed may still be a `File` with its original name.
- The mask becomes `new File([mask_blob], "mask.png", { type: "image/png" })`. `validate_mask_file` checks it, and a failing mask is dropped with a message.

## Export

### Download

The ⬇️ handler in `Gallery._build_thumbnail_content` calls `export_image` in `image_export.js`.

| Rule | Today | Gap |
|---|---|---|
| **External metadata:** strip checkbox on → removed, off → kept | PNG: `export_image` strips per the strip checkbox with the chunk whitelist ✓. JPEG and WebP: leave as stored, GPS included, until step 6 converts them. | ~ |
| **Imaginer metadata:** exactly the forms whose prompt checkbox is on | PNG: the forms are replaced per the prompt checkboxes; both off → none ✓. JPEG and WebP: never any, until step 6 converts them. | ~ |
| **No prompt → none** | An empty prompt writes no form. | ✓ |
| **Filename:** `<prompt>_<created>_<id>.png` | `export_filename` gives `<prompt>_<created>_<id>.<ext>`; the extension is `png` for every gallery file once step 6 has converted the rest. | ✓ |

### ZIP export

`Config_dialog` ("Download All Images") and `Performance_warning.download_all` both call `export_gallery_as_ZIP` in `image_export.js`, which applies `export_image` to every gallery file.

| Rule | Today | Gap |
|---|---|---|
| **External metadata:** strip checkbox on → removed, off → kept | Every PNG per the strip checkbox ✓. JPEG and WebP as stored until step 6. | ~ |
| **Imaginer metadata:** exactly the forms whose prompt checkbox is on | Per the prompt checkboxes, from the gallery record ✓. With strip off and both prompt checkboxes off a file leaves as stored, so model output stored before step 5 keeps its baked-in forms. | ~ |
| **Filename:** unique | Unique through the record ID. | ✓ |

### Writers of Imaginer metadata

- `write_PNG_prompt` in `PNG_chunks.js` replaces existing forms, inserts before the first `IDAT`, and XML-escapes the XMP packet. A foreign XMP chunk stays unless the XMP form replaces it.
- At Export, a file to which the rules cannot be applied does not leave: Download shows the reason, ZIP export leaves the file out and lists it (the Export rule "Errors"). At intake, every failure reaches the user, per the Intake rule "Errors".

## Edit request

The edit request branch of the `Generation_panel` callback in `app.js`.

| Rule | Today | Gap |
|---|---|---|
| **Images: pixels only** | `form_data.append("image[]", file, file.name)` sends the input area's images byte for byte. New imports are clean PNGs from intake; gallery files stored before intake existed may still carry metadata, and model output stored with strip off carries OpenAI's. | ~ |
| **Mask: pixels only** | The mask is the canvas PNG from `Viewer.close`, sent as stored. In current Firefox it probably carries the `deBG` chunk (untested). | ~ |
| **Neutral filenames** | New imports go out as the original name with the extension `png`, gallery images with a filename built from the prompt. The mask is named `mask.png`. | ✗ |
| **Content type** | Set by the browser for every `File` and `Blob` (`image/png`, `image/jpeg`, `image/webp`). | ✓ |

Consequences the conversion at intake removed for new imports; gallery files from before step 5 wait for step 6:

- A JPEG or WebP image goes out next to a PNG mask, although the image generation guide asks for the same format.
- A photo with an EXIF orientation goes out unrotated, while its mask was painted on the upright view. Whether OpenAI applies the EXIF orientation is unknown.

Also found: with a mini model selected, the input area is ignored without a message and a generation request goes out instead (not a metadata topic; an open thread in `Status.md`).

## Across all paths

### Existing gallery files

Every gallery file stored so far was created under the old behaviour: model output is a PNG with Imaginer metadata baked in, and imports are the original JPEG, WebP or PNG files with their external metadata. The rules assume that every gallery file is a PNG without Imaginer metadata. Until that holds, Export and the edit request would have to convert and clean up on their own, which is exactly what the rules move to intake. Open for the Discussion: convert the existing gallery files once, or handle them at Export and at the edit request.

### Order

- The conversion needs the local browser tests first.
- Export must write Imaginer metadata before intake stops writing it; otherwise ZIP exports lose their prompts.
- The edit request needs every image it sends to be a PNG before it can reduce it to pixels without loss. That needs the conversion at intake and a decision about existing gallery files.

### Gaps

1. Import to Gallery: apply intake (strip, conversion, removal of Imaginer metadata). Built in step 5.
2. Model output: stop writing Imaginer metadata at intake, after Export writes it. Built in step 5.
3. Conversion: built in step 5 on the candidate pipeline; the round 2 results of step 4 confirm it.
4. Intake errors reach the user: the `save` failure at Import to Gallery, and the strip and embedding failures at model output. Built in step 5.
5. Prompt reading: the compressed iTXt and the XML entities. Built in step 2.
6. One intake function for both doors, instead of the four copies in `app.js`, the drop listener in `components/gallery.js`, and the drop listener of the input area. Built in step 5.
7. Open: the intro image. Ignore it (session only), or route it through intake.
8. Input area door: apply the same intake in memory. Built in step 5.
9. One Export function for Download and ZIP export instead of three places. Built in step 3.
10. Export: strip per the strip checkbox for every gallery file; fresh Imaginer metadata without duplicates or leftovers; none without a prompt; the XMP form XML-escaped; the filename with the ID. Built in steps 1 to 3 for PNG gallery files; JPEG and WebP gallery files wait for step 6.
11. An error at Export reaches the user, and the file does not leave. Built in step 3.
12. Edit request: pixels only for images and mask, neutral filenames `image_1.png` and `mask.png`, and no more `blob.name` on the gallery's own `Blob`.
13. Open: existing gallery files.
