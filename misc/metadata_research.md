# Metadata research

Web research for [Rock-solid metadata](../Tasks/Rock_solid_metadata.md), done on 2026-09-30.
A verifier checked every claim below against its source.
Terms are defined in [metadata_terms.md](metadata_terms.md).

## Legend

- **Documented**: official documentation, a specification, or browser source code.
- **Community**: forum posts, issue trackers, blogs.
- **Unknown**: searched, nothing reliable found.
- **Inference**: our conclusion, not a statement of the source.

## OpenAI: input images

- **Documented**: "The model doesn't process original file names or metadata."
  - Source: the vision guide, section Limitations: https://developers.openai.com/api/docs/guides/images-vision
  - Inference: this also applies to the edit request. The edit documentation says nothing either way.
- **Documented**: "The model may misinterpret rotated or upside-down text and images." Same page.
- **Documented**: edit request limits (https://developers.openai.com/api/reference/cli/resources/images/methods/edit/index.md):
  - Images: `png`, `webp` or `jpg`, each less than 50 MB, up to 16 images.
  - Mask: a valid PNG, less than 4 MB, with the same dimensions as the image.
  - No requirement for filenames.
- **Documented**: the image generation guide says "The image to edit and mask must be of the same format and size" and "The mask image must also contain an alpha channel" (https://developers.openai.com/api/docs/guides/image-generation).
  - This contradicts the reference, which accepts `jpg` and `webp` images with a PNG mask.
  - Inference: sending everything as PNG satisfies both.
- **Documented**: abuse monitoring logs "may contain certain customer content, such as prompts and responses, as well as metadata derived from that customer content", kept for up to 30 days. This covers `/v1/images` (https://developers.openai.com/api/docs/guides/your-data).
  - Unknown: whether file metadata or filenames end up in those logs.
- **Documented**: the C2PA provenance check is a separate call, `POST /v1/content_provenance_checks` (https://developers.openai.com/api/docs/guides/content-provenance). Nothing says that the edit request uses it.
- **Documented** (search snippet only; the page returned 403): API output carries C2PA metadata and SynthID watermarks. Source: help.openai.com, article 8912793.
- **Community**: a request part with the content type `application/octet-stream` is rejected: "Supported file formats are 'image/jpeg', 'image/png', and 'image/webp'." (https://community.openai.com/t/unsupported-mimetype-application-octet-stream-while-generating-images-with-openai-images-edit/1363591)
  - Inference: neutral filenames work if the content type is set, for example `new File([blob], "image_1.png", { type: "image/png" })`.
- **Community**: masks act as soft guidance, not as hard boundaries (https://community.openai.com/t/help-with-images-edit-mask-not-constraining-edit-to-specific-area/1351283).
- **Unknown**: whether OpenAI applies the EXIF orientation or the ICC profile of an input image.
- **Unknown**: any advantage of sending original files with metadata. None found.

## Browsers: canvas readback

The Firefox findings come from reading its source code. A live test is still pending.

| Browser and mode | Effect | Default |
|---|---|---|
| Firefox 151+, Standard, normal windows | Pixels exact. PNG encoding adds a private 16-byte chunk `deBG` after `IDAT`; its value changes per session and site. | on |
| Firefox 145+, private windows and Strict | Same as above. | on |
| Firefox 115–144, private windows and Strict | Classic noise: 20–255 changes of ±1 or ±2 on R, G, B. Alpha untouched. | on |
| Firefox with fingerprinting overrides | Classic noise, as above. | off |
| Firefox with `resistFingerprinting` (Tor Browser, LibreWolf) | Placeholder data (white or a repeating pattern) until the user grants permission. | off |
| Safari, private windows | Noise of ±1 to ±3 on R, G, B **and alpha**. Pixels with alpha 0 stay untouched. | on |
| Safari 26+, normal windows | Only for known fingerprinting scripts. Whether every canvas is affected: unknown. | on |
| Brave, Standard shields | Up to 512 flips of the lowest bit on R, G, B. Alpha untouched. No exemption for uniform canvases. | on |
| Chrome and Edge, stable | Nothing. Noise for Incognito is "In development"; a readback block exists behind a flag. | off |

Sources:
- Firefox: bugs [1816189](https://bugzilla.mozilla.org/show_bug.cgi?id=1816189), [1993304](https://bugzilla.mozilla.org/show_bug.cgi?id=1993304), [1980264](https://bugzilla.mozilla.org/show_bug.cgi?id=1980264), [2021606](https://bugzilla.mozilla.org/show_bug.cgi?id=2021606), [2032123](https://bugzilla.mozilla.org/show_bug.cgi?id=2032123); source files `dom/canvas/CanvasUtils.cpp` (`ImageExtractionResult`), `nsPNGEncoder` (`MaybeAddCustomMetadata`), `nsRFPService.cpp`.
- Safari: https://webkit.org/blog/15697/private-browsing-2-0/, https://webkit.org/blog/17333/, source file `CanvasNoiseInjection.cpp`.
- Brave: https://brave.com/privacy-updates/4-fingerprinting-defenses-2.0/
- Chrome: https://chromestatus.com/feature/5589949602332672

Affected APIs:
- **Documented**: the Firefox `deBG` chunk affects PNG encoding only (`toBlob`, `toDataURL`, `convertToBlob`). It does not affect `getImageData` or JPEG and WebP encoding.
- **Documented**: classic noise, Brave and Safari affect `getImageData`, `toBlob`, `toDataURL` and `convertToBlob`.
- **Documented**: no noise call sites exist for `createImageBitmap` or `VideoFrame.copyTo` in the Firefox source.

Detection:
- **Documented**: no browser API reports altered readback.
- **Community**: Mastodon draws a small non-uniform pattern and compares the readback (https://github.com/mastodon/mastodon/commit/d8d43a427a549cf063de3f6b3c22a08a06f53ffa). A uniform pattern does not work, because Firefox exempts uniform canvases.
- **Inference**: the robust approach is to verify the result instead of detecting the browser mode: decode the produced PNG without canvas and compare its pixels with the source.

Canvas is lossy anyway:
- **Documented**: semi-transparent pixels can change their color values in a canvas round trip, because of premultiplied alpha (https://html.spec.whatwg.org/multipage/canvas.html).

Masks:
- **Documented**: the edit area of a mask is its fully transparent pixels.
- **Inference**: every mechanism above leaves pixels with alpha 0 untouched, except the `resistFingerprinting` placeholder. In current Firefox, a canvas-made mask very likely carries a `deBG` chunk.

## Browsers: orientation

- **Documented**: browsers apply the EXIF orientation of JPEG images by default.
  - `createImageBitmap`: `imageOrientation` defaults to `from-image` (https://developer.mozilla.org/en-US/docs/Web/API/Window/createImageBitmap).
  - `drawImage`: Chromium since 2020 (https://lists.w3.org/Archives/Public/public-css-archive/2020Jan/0244.html), Firefox 77+ ([bug 1616169](https://bugzilla.mozilla.org/show_bug.cgi?id=1616169)).
  - CSS `image-orientation`: initial value `from-image` (https://developer.mozilla.org/en-US/docs/Web/CSS/image-orientation).
- **Documented**: Firefox 141+ applies the orientation of PNG `eXIf` chunks ([bug 1682759](https://bugzilla.mozilla.org/show_bug.cgi?id=1682759)).
- **Documented**: `ImageDecoder` applies the EXIF orientation of JPEG images (Web Platform Tests).
- **Community** (an outdated blog): no browser applies the orientation of WebP images (https://zpl.fi/exif-orientation-in-different-formats/). Treat it as not applied until tested.

## Canvas-free conversion

- **Documented** (browser support data):
  - `ImageDecoder`: Firefox 133+, Chrome 94+. Safari: preview only.
  - `VideoFrame.copyTo` with `format: "RGBA"`: Firefox 130+, Chrome 127+. Safari: not supported.
  - `CompressionStream("deflate")`: Firefox 113+, Chrome 80+, Safari 16.4+.
- **Documented**: `"deflate"` produces the ZLIB format (RFC 1950), which PNG `IDAT` data requires. `"deflate-raw"` does not.
- **Documented** (libraries):
  - `@jsquash/jpeg`, `@jsquash/webp`, `@jsquash/png`: WASM decoders, Apache-2.0.
  - `UPNG.js`: PNG encoder, MIT, needs `pako`.
  - `fast-png`: PNG encoder, MIT, needs `fflate` and `iobuffer`.
  - `exifr`: EXIF reader, MIT, last release in 2021.
- **Inference** (recommended pipeline): `ImageDecoder` → `VideoFrame.copyTo` as RGBA → own rotation if needed → own PNG encoder with `CompressionStream("deflate")` → verify by decoding the result and comparing. Canvas only as a fallback, verified the same way.
- **Community**: byte-level metadata removal for JPEG and WebP is possible without decoding.
  - Inference: it has pitfalls: the orientation tag, extended XMP, gain maps and trailing data, RIFF padding. It does not fit the rule "always an RGBA PNG".

## Color spaces (out of scope)

- **Documented**: Chrome manages canvas colors in sRGB since version 94 (https://developer.chrome.com/blog/new-in-chrome-94).
- **Unknown**: Firefox canvas color handling.
- **Documented**: the default `colorSpaceConversion` of `createImageBitmap` is implementation-specific.

## Local browser tests

Browser only. No calls to OpenAI.

1. **`deBG` and exact pixels**: in Firefox (normal, private, Strict), encode a known pattern with `toBlob("image/png")`. List the chunks. Decode the PNG without canvas and compare the pixels. Repeat after a browser restart: the `deBG` value should change, the pixels should not.
2. **`getImageData`**: compare it with the known pattern in each Firefox mode. Then set `privacy.fingerprintingProtection.overrides` to `-EfficientCanvasRandomization,+CanvasRandomization` and repeat, to see the classic noise.
3. **`resistFingerprinting`**: call `toBlob` on page load and after a click. Look for placeholder data and a permission prompt.
4. **Mask edges**: with the classic noise active, encode a mask with alpha values 1–10 at its edges. Check that alpha stays exact, and how much RGB drifts.
5. **Orientation**: decode JPEG images with orientations 1–8 and a WebP image with EXIF orientation 6 via `ImageDecoder`, in Firefox and Chromium. Compare dimensions and corner colors.
6. **Supported types**: `ImageDecoder.isTypeSupported()` for `image/jpeg`, `image/webp` and `image/png`, in Firefox and Chromium.
7. **Canvas PNG chunks**: list every chunk of a `toBlob` PNG from Firefox and from Chromium.
8. **Safari**: compare `getImageData` of an opaque pattern and a half-transparent shape in normal and private windows. Any alpha change means every canvas is affected.
9. **Brave**: the same comparison, with Shields at default and with fingerprinting protection off.
10. **Own PNG encoder**: encode known RGBA data with `CompressionStream("deflate")`, decode it with `ImageDecoder` in Firefox and Chromium, and confirm a byte-exact round trip, including alpha 0 and 1.

## Later: tests against OpenAI

Deferred: no calls to OpenAI for now.

1. **Orientation**: send an unrotated JPEG with EXIF orientation 6 in an edit request. Check whether the output is upright or sideways. Also send a mask sized to the rotated dimensions and check for a dimension error.
2. **Filenames and content type**: send `image_1.png` and `mask.png` with the content type `image/png` (expect success), the same bytes without a content type (expect the mimetype error), and a wrong extension with the correct content type.
