# One PNG chunk module

The specification of this step is the step "2. One PNG chunk module" in `Tasks/Rock_solid_metadata.md`, together with the terms and rules in `misc/metadata_terms.md`. This plan turns it into code changes. Three Node checks in `tools/check/` are the executable specification: `PNG_chunks_check.mjs`, `process_image_metadata_check.mjs` and `metadata_readers_check.mjs`.

## Design

### `XML_entities.js`

A new module in the repository root, free of browser globals. It exports:

```js
export function escape_XML(text) {}
export function decode_XML_entities(text) {}
```

- `escape_XML(text)`: replaces `&` first, then `<`, `>`, `"` and `'`, with `&amp;`, `&lt;`, `&gt;`, `&quot;` and `&apos;`. Every other character stays as it is.
- `decode_XML_entities(text)`: one pass over the text with the regular expression `/&(#x[0-9A-Fa-f]+|#[0-9]+|lt|gt|quot|apos|amp);/g` and a replacement function. Named entities become their character. A numeric entity becomes `String.fromCodePoint` of its value, except that a value of 0, a value above `0x10FFFF`, or a value in the surrogate range `0xD800` to `0xDFFF` leaves the entity unchanged. One pass means `&amp;lt;` becomes `&lt;` and `&#38;amp;` becomes `&amp;`. The function never throws.

### `PNG_chunks.js`

A new module in the repository root. It works on `Uint8Array` values and uses no browser global, so `node` can load it. Every function accepts a `Uint8Array` that may be a view with a non-zero `byteOffset`. It imports `escape_XML` and `decode_XML_entities` from `./XML_entities.js` and exports:

```js
export const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
export const PIXEL_CHUNK_TYPES = new Set(["IHDR", "PLTE", "tRNS", "IDAT", "IEND"]);
export const PROMPT_KEYWORD = "prompt_text";
export const XMP_KEYWORD = "XML:com.adobe.xmp";

/** @typedef {{ type: string, data: Uint8Array }} PNG_chunk */

export function crc32(bytes) {}
export function is_PNG(bytes) {}
export function read_PNG_chunks(bytes) {}
export function write_PNG_chunks(chunks) {}
export function strip_PNG(bytes) {}
export function build_XMP_packet(prompt_text) {}
export function is_XMP_form(packet_text) {}
export async function read_PNG_prompt(bytes) {}
export function write_PNG_prompt(bytes, prompt_text, forms) {}
```

- `crc32(bytes)`: the CRC-32 of PNG (polynomial `0xEDB88320`, initial value `0xFFFFFFFF`, final XOR), returned as an unsigned number. `crc32` of the four ASCII bytes `IEND` is `0xAE426082`.
- `is_PNG(bytes)`: true when `bytes` has at least eight bytes and the first eight equal `PNG_SIGNATURE`.
- `read_PNG_chunks(bytes)`: returns the chunks in file order as `PNG_chunk` objects, `data` being a copy of the chunk data without length, type and CRC. It throws `Error("Not a PNG file.")` when `is_PNG` is false. Walking from the byte after the signature, at every chunk position before `IEND` it throws `Error("Truncated PNG chunk.")` when fewer than 12 bytes remain, or when fewer than `length + 12` bytes remain, `length` being the chunk's length field. Reaching the end of the bytes without an `IEND` chunk throws the same error. It stops after the `IEND` chunk and ignores bytes behind it. It does not verify CRCs.
- `write_PNG_chunks(chunks)`: returns a new `Uint8Array` holding the signature followed by every chunk as length (big-endian, four bytes), type (four ASCII bytes), data, and the CRC-32 over type and data.
- `strip_PNG(bytes)`: returns `write_PNG_chunks` of the chunks of `bytes` whose type is in `PIXEL_CHUNK_TYPES`, in their original order. This is both *strip* and *pixels only* for a PNG.
- `build_XMP_packet(prompt_text)`: returns the XMP packet as a string in the shape below, with `escape_XML(prompt_text)` in place of `PROMPT`, without leading or trailing whitespace. The `begin` attribute holds the byte order mark U+FEFF, as today's `create_XMP_packet` writes it.

```xml
<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/">
      <dc:description>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">PROMPT</rdf:li>
        </rdf:Alt>
      </dc:description>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>
```

- `is_XMP_form(packet_text)`: true when the packet has Imaginer's shape. The shape test collapses every run of whitespace to one space, in `packet_text` and in the template, and then requires that `packet_text` starts with the template's head, which is the packet up to and including `<rdf:li xml:lang="x-default">`, and ends with the template's tail, which is the packet from `</rdf:li>` to the end. Packets written by the old `create_XMP_packet` differ from the template only in indentation, so they pass the test; a packet from another tool does not.
- `read_PNG_prompt(bytes)`: async, and it never rejects on file content. It returns `""` when `is_PNG` is false. It walks the chunks with the layout of `read_PNG_chunks`, but stops without an error at the first chunk that runs past the end or at the end of the bytes, and evaluates the chunks read so far, in file order. For every `iTXt` chunk it parses the layout: the keyword ends at the first NUL; then one byte compression flag and one byte compression method; the language tag ends at the next NUL; the translated keyword ends at the next NUL; everything after that NUL is the text. A chunk whose layout does not fit (a missing NUL, fewer bytes than the layout needs) is left out. When the compression flag is 1 and the method is 0, the text bytes are inflated with `DecompressionStream("deflate")`; when inflating fails, the chunk is left out. Any other flag or method leaves the chunk out. The text is decoded with `new TextDecoder("utf-8", { ignoreBOM: true })`, so a leading byte order mark survives. The first chunk with keyword `PROMPT_KEYWORD` and a non-empty text returns its text, untrimmed. Otherwise the first chunk with keyword `XMP_KEYWORD` whose text yields a description returns that description: the description is found in two steps, first the body of the element with `/<dc:description(?:\s[^>]*)?>([\s\S]*?)<\/dc:description>/`, then, inside that body only, the first `/<rdf:li(?:\s[^>]*)?>([\s\S]*?)<\/rdf:li>/`; the captured text is returned through `decode_XML_entities`, untrimmed. A self-closing `<dc:description/>` matches neither step, so an `rdf:li` of another property is never returned. Otherwise the empty string.
- `write_PNG_prompt(bytes, prompt_text, forms)`: `forms` is `{ iTXt_form: boolean, XMP_form: boolean }`. It reads the chunks with `read_PNG_chunks`, so it throws on a file that is not a PNG or is truncated. "The XMP form is written" means `XMP_form` is true and `prompt_text` is a non-empty string; "the iTXt form is written" means `iTXt_form` is true and `prompt_text` is a non-empty string. It removes every `iTXt` chunk whose keyword is `PROMPT_KEYWORD`. It removes every `iTXt` chunk whose keyword is `XMP_KEYWORD` when the XMP form is written, because a PNG carries one XMP packet; when the XMP form is not written, it removes only those `XMP_KEYWORD` chunks whose text is uncompressed and passes `is_XMP_form`, and keeps every other one, because they are external metadata. It then inserts the written forms before the first `IDAT` chunk, the iTXt form first, then the XMP form, and returns `write_PNG_chunks` of the result. It throws `Error("PNG has no IDAT chunk.")` when a form is to be inserted and no `IDAT` exists. With an empty `prompt_text`, or both forms false, no form is inserted.
  - The iTXt form: keyword `PROMPT_KEYWORD`, compression flag 0, method 0, empty language tag, empty translated keyword, the prompt as UTF-8.
  - The XMP form: keyword `XMP_KEYWORD`, compression flag 0, method 0, empty language tag, empty translated keyword, `build_XMP_packet(prompt_text)` as UTF-8.

The module receives one file comment at the top, verbatim: `// Chunk-level operations on PNG files: parse, serialize, strip, and the two prompt forms. The pixels are never decoded, so every operation is lossless.`

Internal helpers may exist (reading a big-endian uint32, the tolerant chunk walk, encoding and parsing an iTXt data block); their names follow `loose_snake_case`.

### `process_image_metadata.js`

Rewritten as a thin adapter over `PNG_chunks.js`. Its export keeps the name and the signature `process_image_metadata(blob, prompt_text, embed_options = {})` and returns a `Promise<Blob>`.

Behaviour:

1. `strip` is `localStorage.getItem("imaginer.strip_metadata") === "true"`.
2. `iTXt_form` is `embed_options.embed_itxt ?? localStorage.getItem("imaginer.add_prompt_to_image") === "true"`; `XMP_form` is `embed_options.embed_xmp ?? localStorage.getItem("imaginer.add_prompt_to_image_xmp") === "true"`.
3. The blob's bytes are read with `blob.arrayBuffer()`.
4. Stage one, when `strip` is true: `strip_PNG`. When it throws, the error is logged with `console.warn("Failed to strip PNG metadata:", error)` and the original blob is returned.
5. Stage two: `write_PNG_prompt(bytes, prompt_text, { iTXt_form, XMP_form })`. When it throws, the error is logged with `console.warn("Failed to write the prompt into the PNG:", error)` and the bytes as they are after stage one are returned as `new Blob([bytes], { type: "image/png" })`, so a stripped image stays stripped.
6. Otherwise the result of stage two is returned as `new Blob([bytes], { type: "image/png" })`.

Errors reaching the user is step 3 and step 5. The imports of the three old modules disappear. The JSDoc block above the function stays as it is.

### `components/gallery.js`

- The import of `read_png_metadata` from `./png_metadata_reader.js` is replaced by `import { is_PNG, read_PNG_prompt } from "../PNG_chunks.js";`.
- `read_image_prompt(file)`: for `type === "image/png"` it reads the bytes, `new Uint8Array(await file.arrayBuffer())`, and returns `read_PNG_prompt(bytes)`. For `image/jpeg` and `image/webp` it calls `read_jpeg_metadata(file)` and `read_webp_metadata(file)` as today, without reading the bytes itself. The signature-based fallback for any other type reads the bytes and returns `read_PNG_prompt(bytes)` when `is_PNG(bytes)`, otherwise `(await read_jpeg_metadata(file)) || (await read_webp_metadata(file))`.
- Nothing else in the file changes.

### `components/jpeg_metadata_reader.js` and `components/webp_metadata_reader.js`

- Each imports `decode_XML_entities` from `../XML_entities.js`.
- In `try_xmp_from_APP1` (JPEG) and in the `XMP ` chunk branch of `read_webp_metadata` (WebP), the captured description passes through `decode_XML_entities` before it is returned or stored. The regular expressions stay as they are. Nothing else changes.

### Removed files

- `png_iTXt/png_iTXt.js`, `png_XMP_via_iTXt/png-XMP-embedder.js`, `strip_metadata_from_PNG/strip_metadata_from_PNG.js`, `components/png_metadata_reader.js`, and the three folders, which hold nothing else: the main model moved their untracked demo pages and note to `archive/png_demos/` before this plan runs.
- `cache_manifest.json`: the lines `png_iTXt/png_iTXt.js`, `png_XMP_via_iTXt/png-XMP-embedder.js`, `strip_metadata_from_PNG/strip_metadata_from_PNG.js` and `components/png_metadata_reader.js` are removed; the lines `PNG_chunks.js` and `XML_entities.js` are added after `model_fetcher.js`, in that order.

### What does not change

- Every call site of `process_image_metadata` in `app.js`, and `window.process_image_metadata`.
- `tools/check/` and `jsconfig.json`: the main model removes the patterns of the deleted folders and wires the three Node checks into `check.sh` at Verification.
- `tools/browser_tests/png_test_tools.js`: the test page keeps its own helpers until step 4.
- `README.md`, `User_Manual/` and `misc/`: the main model writes the documentation after Verification.
- No `package.json` is added. Node 22.16 is installed, and its ESM syntax detection loads the root `.js` modules from the `.mjs` checks.

## Implementation steps

1. **The modules.** Create `XML_entities.js` and `PNG_chunks.js` as Design specifies and add their lines to `cache_manifest.json`. Gate: `bash tools/check/check.sh` prints `check passed`, and `node tools/check/PNG_chunks_check.mjs` prints `PNG_chunks check passed`. The check passes because the new modules are root files that import only each other, and the manifest lists them.
2. **The switch.** Rewrite `process_image_metadata.js`, change `components/gallery.js`, `components/jpeg_metadata_reader.js` and `components/webp_metadata_reader.js` as Design specifies, delete the four old modules with their folders, and remove their lines from `cache_manifest.json`. Gate: `bash tools/check/check.sh` prints `check passed`, `node tools/check/PNG_chunks_check.mjs` prints `PNG_chunks check passed`, `node tools/check/process_image_metadata_check.mjs` prints `process_image_metadata check passed`, and `node tools/check/metadata_readers_check.mjs` prints `metadata_readers check passed`. The check passes because no module imports the deleted files any more and the manifest lists no missing file.

## Documentation

- `README.md`
  - Project Structure
- `User_Manual/Imaginer_Technical_Manual.md`
  - Image Formats: the statement on embedded prompts being read on import, and the statement on prompt embedding and stripping
  - API Integration: the statement on `process_image_metadata`

The main model also updates the symbol names in `misc/metadata_gap_analysis.md` at Close; that file is not documentation.

## Asserted behaviours

Definitions: "forms" are the iTXt form and the XMP form as the terms define them; "a palette PNG" is a PNG with color type 3, a `PLTE` chunk and a `tRNS` chunk; "a foreign XMP chunk" is an `iTXt` chunk with the keyword `XML:com.adobe.xmp` whose packet fails `is_XMP_form`.

### `XML_entities.js` and `PNG_chunks.js`

Every item in `tools/check/PNG_chunks_check.mjs` passes. Among them:

- `strip_PNG` of a palette PNG with text chunks returns exactly `IHDR`, `PLTE`, `tRNS`, `IDAT`, `IEND`, and the `IDAT` data is byte-identical.
- `write_PNG_prompt` with both forms inserts two `iTXt` chunks directly before the first `IDAT`, the `prompt_text` one first.
- `write_PNG_prompt` applied twice leaves exactly one chunk per form.
- `write_PNG_prompt` with the prompt `a & b <c>` produces an XMP packet containing `a &amp; b &lt;c&gt;`, and `read_PNG_prompt` returns `a & b <c>` from it.
- `write_PNG_prompt` with an empty prompt, or with both forms false, leaves no form in the result, and keeps a foreign XMP chunk.
- `write_PNG_prompt` with the XMP form written replaces a foreign XMP chunk, so exactly one XMP chunk remains.
- `read_PNG_prompt` returns the text of a compressed `prompt_text` iTXt chunk, returns `""` for bytes that are not a PNG, returns the prompt found before a truncation, and returns `""` for a packet whose `dc:description` is self-closing although another property carries an `rdf:li`.
- `decode_XML_entities` decodes `&#38;amp;` to `&amp;` and leaves `&#x110000;` unchanged.

### `process_image_metadata.js`

Every item in `tools/check/process_image_metadata_check.mjs` passes. Among them:

- With `imaginer.strip_metadata` = `"true"`, a palette PNG keeps its `PLTE` and `tRNS` chunks.
- With `imaginer.strip_metadata` = `"false"` and both prompt options on, calling it twice on the same blob gives a PNG with exactly one chunk per form.
- With an empty prompt, the result carries no form; with strip on it carries exactly the five pixel chunk types.
- With strip off and both prompt options off, existing forms are removed and a foreign XMP chunk stays.
- A blob that is not a PNG comes back unchanged.
- When strip succeeds and writing the forms fails, the stripped bytes come back.

### `components/jpeg_metadata_reader.js` and `components/webp_metadata_reader.js`

Every item in `tools/check/metadata_readers_check.mjs` passes: a JPEG and a WebP whose XMP `dc:description` contains `&amp;` yield `&` in the prompt.

### `components/gallery.js`

- An import of a PNG whose `prompt_text` iTXt chunk is compressed shows the prompt in 💬.
- An import of a PNG whose XMP packet contains `&amp;` shows `&` in 💬.
- An import of a file named `.png` that is not a PNG imports with an empty prompt and does not stop the batch.

## Out of scope

- One Export function for Download and ZIP export, and whether an error at Export reaches the user: step 3.
- Intake, the conversion, and moving prompt reading for JPEG and WebP into intake: step 5.
- Pixels only at the edit request, including the mask: step 7.
- Removing `components/image_converter.js` and `components/generation_panel.options.js`: step 8.
