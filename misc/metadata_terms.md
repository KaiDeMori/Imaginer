# Metadata terms

Work in progress for [Rock-solid metadata](../Tasks/Rock_solid_metadata.md).
Once stable, this file is the reference for metadata in Imaginer.

## Terms

### Metadata

- **Imaginer metadata**: all data that Imaginer writes into an exported file. Its content is the prompt from the gallery record, in two forms:
  - **iTXt form**: an iTXt chunk with the keyword `prompt_text`.
  - **XMP form**: an XMP packet with `dc:description`, in an iTXt chunk with the keyword `XML:com.adobe.xmp`. Imaginer writes the packet in one fixed shape; a chunk with that keyword whose packet has another shape is external metadata.
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
- **Generation request**: the text-to-image call `/v1/images/generations`. It sends the prompt from the prompt panel to OpenAI.
- **Edit request**: the `/v1/images/edits` call that sends the input area's images, the optional mask and the prompt from the prompt panel to OpenAI.

### Actions

- **Conversion**: turning a JPEG or WebP image into a PNG, upright as the browser displays it.
- **Strip**: remove all external metadata. Purpose: privacy. Strip only concerns external metadata. On a PNG, strip keeps exactly the chunks `IHDR`, `PLTE`, `tRNS`, `IDAT` and `IEND`.
- **Pixels only**: reduce an image to its pixels. No external metadata, no Imaginer metadata, a neutral filename.

### Config

- **Metadata checkboxes**: the three checkboxes in Config → Advanced. All three default to on.
  - **Strip checkbox**: applies strip to model output at intake, and to every gallery file at Export. UI label: "Strip Server-Side metadata".
  - **Prompt checkboxes**: the iTXt checkbox and the XMP checkbox. Each writes its form at Export.

## Rules

### Axioms

- Rock-solid first.
- The config at intake decides what the gallery file carries.
- The config at Export decides what the exported file carries.
- Images and masks reach OpenAI as pixels only.
- The user is responsible for their config.

### Intake

- **External metadata**: Import to Gallery and Import to input area: removed. Model output: strip checkbox on → removed, off → kept.
- **Imaginer metadata**: the gallery file carries none.
- **Prompt**: goes into the gallery record. Model output: from the prompt panel. Import to Gallery: from the file's metadata, if present. PNG: the iTXt form, otherwise the XMP form. JPEG and WebP: XMP `dc:description`, otherwise EXIF `UserComment`, because other image tools write their prompts there; in photos, `dc:description` is usually a caption, which then serves as the prompt.
- **Pixels**: always a PNG, upright as the browser displays it. JPEG and WebP get conversion; a PNG keeps its pixels.
- **Input area door**: the same rules, in memory only. The image never becomes a gallery file; it can only be removed from the input area. A converted image larger than the edit request's limit is refused at this door, with the size named.
- **Errors**: a file to which the rules cannot be applied is not imported, and the user is told why; too many files at once are refused before any work, every other failure concerns only its file. Model output is the exception: a paid generation is never thrown away, so when strip fails the image is stored as OpenAI returned it and the user is told that it may carry OpenAI's metadata. Export then treats it like any file to which the rules cannot be applied.
- What strip removes at intake is gone. That is privacy.

### Export

Applies to Download and ZIP export.

- **External metadata**: strip checkbox on → removed. Off → kept, as far as the gallery file still carries it.
- **Imaginer metadata**: exactly the forms whose prompt checkbox is on, written from the prompt in the gallery record. Both off → none. No prompt → none.
- **Filename**: `<prompt>_<created>_<id>.png`, from the gallery record: the prompt (sanitized and shortened), the timestamp, and the ID. The same image gets the same, unique filename in every Export.
- **XMP chunks**: a PNG carries one XMP packet, so writing the XMP form replaces every XMP chunk. When the XMP form is not written and strip is off, an external XMP chunk stays.
- **Errors**: a gallery file to which the rules cannot be applied does not leave. Download shows the reason; ZIP export leaves the file out and lists it with the reason after the download. With the strip checkbox off and both prompt checkboxes off, Export changes nothing, so a PNG leaves as stored, unparsed.
- **Gallery files that are not a PNG**: a gallery file that is still a JPEG or WebP, because the one-time migration was postponed or failed for it, leaves only with the strip checkbox and both prompt checkboxes off, as stored and with its own extension; with any of them on, it does not leave, per the rule "Errors".

### Edit request

- Images and mask are sent pixels only, unconditionally.
- Neutral filenames such as `image_1.png` and `mask.png`.

### Consequences

- Every image that passed intake is a PNG, so Export and edit request only remove or add PNG chunks: lossless, no decoding.
- The conversion runs once per image, at intake. It can be verified there, and an error reaches the user immediately.
- Conversion passes the browser's decoder. Opaque and fully transparent pixels come out exact; semi-transparent pixels of a WebP may shift in color. A PNG never passes a decoder, so its transparency stays exact.
- An import carries no external metadata into Imaginer, whatever the config says.
- Gallery files carry no Imaginer metadata, so an Export cannot produce leftovers or duplicates.
- The strip whitelist carries the pixels of every PNG layout. With strip on, an animated PNG becomes its default image, and a PNG whose orientation comes from an `eXIf` chunk loses it.
- With the strip checkbox off, model output keeps OpenAI's provenance data (C2PA). An Export that writes a prompt form changes the file and probably invalidates it. Not verified; the user is responsible for their config.
- Gallery files stored before intake existed are brought to what intake produces once, by a migration the user confirms: a file that is not a PNG is converted; a PNG loses the Imaginer forms, and every other chunk when the strip checkbox is on at that time.

## Open points

- **Masks**: created in-app on a canvas. The browser may add a chunk (Firefox 151+: `deBG`, per its source code; Firefox 144 adds none, measured). Open: clean the mask when it is saved, or only at the edit request.
- **UI wording**: the ZIP export's UI label is "Download All Images". The strip checkbox's UI label "Strip Server-Side metadata" matches its rule; whether "Server-Side" is clear enough is open.
- **Color spaces**: out of scope for now.
