# Metadata terms

Work in progress for [Rock-solid metadata](../Tasks/Rock_solid_metadata.md).
Once stable, this file is the reference for metadata in Imaginer.

## Terms

### Metadata

- **Imaginer metadata**: all data that Imaginer writes into an exported file. Its content is the prompt, in two forms:
  - **iTXt form**: an iTXt chunk with the keyword `prompt_text`.
  - **XMP form**: an XMP packet with `dc:description`, in an iTXt chunk with the keyword `XML:com.adobe.xmp`.
- **External metadata**: all other metadata in a file. Examples: camera EXIF (GPS, device, time), data from other tools, OpenAI's data in model output (C2PA).

### Images

- **Model output**: an image returned by generation or edit.
- **Gallery file**: the image itself, as the gallery keeps it.
- **Gallery record**: the gallery file plus prompt, mask, timestamp and ID.
- **Input area**: the drop area at the bottom of the prompt panel. DOM reference: `input-image-drop-area`.

### Ways in and out

- **Intake**: the step every image passes when it enters Imaginer: Import to Gallery, model output, Import to input area.
- **Import to Gallery**: an external file is added to the gallery.
- **Import to input area**: an external file is added to the input area.
- **Gallery → input area**: a gallery file is dragged onto the input area. In-app; no intake.
- **Export**: images leave Imaginer as files for the user: Download, ZIP export.
- **Download**: one image via ⬇️ on a thumbnail.
- **ZIP export**: the whole gallery as one ZIP file.
- **Edit request**: the `/v1/images/edits` call that sends the input area's images, the optional mask and the prompt to OpenAI.

### Actions

- **Strip**: remove all external metadata. Purpose: privacy. Strip only concerns external metadata.
- **Pixels only**: reduce an image to its pixels. No external metadata, no Imaginer metadata, a neutral filename.

### Config

- **Metadata checkboxes**: the three checkboxes in Config → Advanced. All three default to on.
  - **Strip checkbox**: applies strip at intake and at Export. Label text: "Applies to all images (import and export)".
  - **Prompt checkboxes**: the iTXt checkbox and the XMP checkbox. Each writes its form at Export.

## Rules

### Axioms

- Rock-solid first.
- The config at intake decides what is stored.
- The config at Export decides what the exported file carries.
- OpenAI receives pixels, mask and prompt. Nothing else.
- The user is responsible for their config.

### Intake

- **External metadata**: strip checkbox on → removed. Off → kept.
- **Imaginer metadata**: the gallery file carries none.
- **Prompt**: goes into the gallery record. Model output: from the prompt panel. Import to Gallery: from the file's metadata, if present.
- **Pixels**: always upright (orientation applied to the pixels). Always an RGBA PNG.
- **Import to input area**: the same intake, in memory only. The file never becomes a gallery file; it can only be removed from the input area.
- What strip removes at intake is gone. That is privacy.

### Export

Applies to Download and ZIP export.

- **External metadata**: strip checkbox on → removed. Off → kept, as far as the gallery file still carries it.
- **Imaginer metadata**: exactly the forms whose prompt checkbox is on, written from the prompt in the gallery record. Both off → none.

### Edit request

- Images and mask are sent pixels only, unconditionally.
- Neutral filenames such as `image_1.png` and `mask.png`.

### Consequences

- Every gallery file is an upright RGBA PNG, so Export and edit request only remove or add PNG chunks: lossless, no decoding.
- The conversion runs once per image, at intake. It can be verified there, and an error reaches the user immediately.
- Gallery files carry no Imaginer metadata, so an Export cannot produce leftovers or duplicates.
- RGBA PNGs need no palette or transparency chunks, so strip may keep only `IHDR`, `IDAT` and `IEND`.

## Open points

- **Strip off**: keeping external metadata through the PNG conversion. EXIF moves into an `eXIf` chunk with the orientation reset; XMP moves into iTXt; an imported XMP packet must be merged with the XMP form. Best effort: if this cannot be done reliably, the feature is reduced to what is possible.
- **Detection**: with strip off, Imaginer metadata must be told apart from external metadata at intake. The XMP form uses a generic Adobe format.
- **C2PA** (strip off only): OpenAI's provenance data probably breaks on any change to the file. To verify.
- **Masks**: created in-app on a canvas. The browser may add a chunk (Firefox: `deBG`, per its source code, untested). Open: clean the mask when it is saved, or only at the edit request.
- **UI wording**: the ZIP export's UI label is "Download All Images". The strip checkbox's UI label is "Strip Server-Side metadata".
- **Color spaces**: out of scope for now.
