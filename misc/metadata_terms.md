# Metadata terms

Work in progress for [Rock-solid metadata](../Tasks/Rock_solid_metadata.md).
Once stable, this file is the reference for metadata in Imaginer.

## Terms

### Metadata

- **Imaginer metadata**: all data that Imaginer writes into an exported file. Its content is the prompt from the gallery record, in two forms:
  - **iTXt form**: an iTXt chunk with the keyword `prompt_text`.
  - **XMP form**: an XMP packet with `dc:description`, in an iTXt chunk with the keyword `XML:com.adobe.xmp`.
- **External metadata**: all other metadata in a file. Examples: camera EXIF (GPS, device, time), data from other tools, OpenAI's data in model output (C2PA).

### Images

- **Model output**: an image returned by OpenAI, for a generation or an edit request.
- **Gallery file**: the image itself, as the gallery keeps it.
- **Gallery record**: the gallery file plus prompt, mask, timestamp, ID and UUID.
- **Input area**: the drop area at the bottom of the prompt panel. DOM reference: `input-image-drop-area`.

### Ways in and out

- **Intake**: the step every image passes when it enters Imaginer. It has two one-way doors:
  - **Gallery door**: Import to Gallery, model output. The image becomes a gallery file.
  - **Input area door**: Import to input area. The image stays in memory only.
- **Import to Gallery**: a local file is added to the gallery.
- **Import to input area**: a local file is added to the input area.
- **Gallery → input area**: a gallery file is dragged onto the input area. In-app; no intake.
- **Export**: images leave Imaginer as files for the user: Download, ZIP export.
- **Download**: one image via ⬇️ on a thumbnail.
- **ZIP export**: the whole gallery as one ZIP file.
- **Edit request**: the `/v1/images/edits` call that sends the input area's images, the optional mask and the prompt from the prompt panel to OpenAI.

### Actions

- **Conversion**: turning an image into an upright RGBA PNG.
- **Strip**: remove all external metadata. Purpose: privacy. Strip only concerns external metadata.
- **Pixels only**: reduce an image to its pixels. No external metadata, no Imaginer metadata, a neutral filename.

### Config

- **Metadata checkboxes**: the three checkboxes in Config → Advanced. All three default to on.
  - **Strip checkbox**: applies strip at intake and at Export. Planned label text: "Applies to all images (import and export)".
  - **Prompt checkboxes**: the iTXt checkbox and the XMP checkbox. Each writes its form at Export.

## Rules

### Axioms

- Rock-solid first.
- The config at intake decides what the gallery file carries.
- The config at Export decides what the exported file carries.
- Images and masks reach OpenAI as pixels only.
- The user is responsible for their config.

### Intake

- **External metadata**: strip checkbox on → removed. Off → kept.
- **Imaginer metadata**: the gallery file carries none.
- **Prompt**: goes into the gallery record. Model output: from the prompt panel. Import to Gallery: from the file's metadata, if present.
- **Pixels**: always upright (orientation applied to the pixels). Always an RGBA PNG.
- **Input area door**: the same rules, in memory only. The image never becomes a gallery file; it can only be removed from the input area.
- What strip removes at intake is gone. That is privacy.

### Export

Applies to Download and ZIP export.

- **External metadata**: strip checkbox on → removed. Off → kept, as far as the gallery file still carries it.
- **Imaginer metadata**: exactly the forms whose prompt checkbox is on, written from the prompt in the gallery record. Both off → none. No prompt → none.

### Edit request

- Images and mask are sent pixels only, unconditionally.
- Neutral filenames such as `image_1.png` and `mask.png`.

### Consequences

- Every image that passed intake is an upright RGBA PNG, so Export and edit request only remove or add PNG chunks: lossless, no decoding.
- The conversion runs once per image, at intake. It can be verified there, and an error reaches the user immediately.
- Gallery files carry no Imaginer metadata, so an Export cannot produce leftovers or duplicates.
- RGBA PNGs need no palette or transparency chunks, so strip can keep only `IHDR`, `IDAT` and `IEND`.

## Open points

- **Strip off**: keeping external metadata through the conversion. EXIF moves into an `eXIf` chunk with the orientation reset; XMP moves into iTXt; an imported XMP packet must be merged with the XMP form. Best effort: if this cannot be done reliably, the feature is reduced to what is possible.
- **Conversion edge cases**: 16-bit PNGs become 8-bit; animated PNG and WebP files become still images. Today both are stored unchanged.
- **Detection**: with strip off, Imaginer metadata must be told apart from external metadata at intake. The XMP form uses a generic Adobe format.
- **Prompt source**: at Import to Gallery, the prompt is read from the file's metadata. For JPEG and WebP, the readers take XMP `dc:description`, then EXIF `UserComment` ([jpeg_metadata_reader.js](../components/jpeg_metadata_reader.js), [webp_metadata_reader.js](../components/webp_metadata_reader.js)). These are external metadata; in photos, `dc:description` is usually a caption. With strip on, that text survives as the prompt and, with a prompt checkbox on, leaves at Export as Imaginer metadata. To decide: which fields may be read as the prompt.
- **C2PA** (strip off only): OpenAI's provenance data probably breaks on any change to the file. To verify.
- **Masks**: created in-app on a canvas. The browser may add a chunk (Firefox: `deBG`, per its source code, untested). Open: clean the mask when it is saved, or only at the edit request.
- **UI wording**: the ZIP export's UI label is "Download All Images". The strip checkbox's current UI label is "Strip Server-Side metadata". Its planned label text names import and export, but not model output, which also passes intake.
- **Color spaces**: out of scope for now.
