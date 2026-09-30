# Rock-solid metadata

The planning file of this task.

## Goal

Every path through Imaginer treats metadata according to agreed rules, and code, config, and documentation match those rules.

## Plan

Linked words are terms from [misc/metadata_terms.md](../misc/metadata_terms.md), which also holds the agreed rules.

Today, each path handles metadata its own way:
- [Download](../misc/metadata_terms.md) can break palette PNGs or write the prompt twice.
- [ZIP export](../misc/metadata_terms.md) can drop images that share a filename.
- The [edit request](../misc/metadata_terms.md) sends private data such as GPS location and original filenames to OpenAI.
- Parts of the documentation contradict the code.

Core idea: every [gallery file](../misc/metadata_terms.md) is a PNG. [Intake](../misc/metadata_terms.md) converts JPEG and WebP once, and a PNG keeps its pixels, so [Export](../misc/metadata_terms.md) and [edit request](../misc/metadata_terms.md) only remove or add PNG chunks.
Together, we compare the rules with today's code, one path at a time, in [misc/metadata_gap_analysis.md](../misc/metadata_gap_analysis.md); the differences become the steps.
Local browser tests settle the technical unknowns before code depends on them.
Open points are decided when a step needs them.

## Out of scope

- The gallery import button: a task of its own.
- Color spaces.
- Masks: they are not exported.

## Steps

Each step is an H3 that names its state: waiting, in discussion, planned, or built. A step in discussion or later has four H4 sections: Decisions, Facts, Open items, Out of scope. Once its plan exists, the step links its plan file. Gap numbers refer to the list "Gaps" in [misc/metadata_gap_analysis.md](../misc/metadata_gap_analysis.md).

The order follows the dependencies. Steps 1 to 3 need no browser test; only step 5 needs the results of step 4.

### 1. Unique export filenames (waiting)

Every Export gives the same image the same, unique filename, `<prompt>_<created>_<id>.png`, so the ZIP export never drops an image. The filename part of gap 10. It comes first because the ZIP export is the users' backup.

Open items: the extension for a gallery file that is not a PNG yet, until step 6 converts it.

### 2. One PNG chunk module (waiting)

One module for the chunk operations every path needs: strip with the chunk whitelist, pixels only, writing the iTXt form and the XMP form (XML-escaped, replacing existing forms), and reading the prompt. It replaces `process_image_metadata`, `png_iTXt/`, `png_XMP_via_iTXt/`, and `strip_metadata_from_PNG/`. Gap 5 and the writing part of gap 10.

Open items: the open point "Prompt source" in the terms.

### 3. One Export function (waiting)

One Export function for Download and ZIP export: strip per the strip checkbox, fresh Imaginer metadata, and the filename from step 1. Needs steps 1 and 2 and comes before step 5. Gaps 9, 10 and 11.

Open items: whether an error at Export reaches the user (gap 11).

### 4. Browser tests for the conversion (in discussion)

Local browser tests settle the conversion of JPEG and WebP: decoding, orientation, encoding, and the timing. Gap 3. Only step 5 needs the results; the tests can run at any time.

#### Decisions

- The step runs by hand. The main model writes the test page, and the user runs it in Firefox and Chrome. The step skips the workflow: the page is a measuring instrument, not app code.
- The test page is `tools/browser_tests/conversion_tests.html`, with `conversion_tests.js` and `png_test_tools.js`.
- Round 1 tested: support of `ImageDecoder` and `CompressionStream`; exact decoding of PNG sources (RGBA with alpha, palette with `tRNS`, 16 bits per sample, animated) and JPEG and WebP against `<img>`; the round trip through the own PNG encoder, byte-exact and with only `IHDR`, `IDAT` and `IEND`; EXIF orientation for JPEG (1 to 8) and for WebP and PNG (1 and 6), against `<img>` and `createImageBitmap`; canvas PNG chunks, pixel exactness, and a mask; the timing at 12 MP, and at 48 MP on demand. The results are in [misc/metadata_research.md](../misc/metadata_research.md), section "Local browser test results".
- Round 2 tests the path for JPEG and WebP only: `createImageBitmap`, then `VideoFrame.copyTo` as RGBA, then the own PNG encoder. Against `<img>` in Firefox and Chromium, in a normal window and with Strict tracking protection; the EXIF orientations; a WebP with alpha; the timing at 12 MP.
- PNG sources are not decoded. The own PNG decoder in `png_test_tools.js` is removed in round 2.
- Not tested: fingerprinting overrides in `about:config`, `resistFingerprinting`, Safari, Brave.
- The results go into [misc/metadata_research.md](../misc/metadata_research.md).

#### Facts

- The candidate pipeline and the list of local browser tests are in [misc/metadata_research.md](../misc/metadata_research.md), sections "Canvas-free conversion" and "Local browser tests".
- Agents cannot use a browser: they start no server and no browser.
- Imaginer is developed and tested with Firefox (`README.md`, section Requirements).
- The pure helpers in `png_test_tools.js` passed 55 checks in Node 22: PNG structure and CRCs, the decompressed rows, APNG sequence numbers, the EXIF bytes, the embedding into JPEG, WebP and PNG, and the eight orientation transforms as a group.

#### Open items

- None.

#### Out of scope

- Tests against OpenAI.
- Color spaces.

### 5. Intake (waiting)

The conversion of JPEG and WebP, strip for every import, and one intake function for both doors; model output stops writing Imaginer metadata. Needs steps 2 to 4. Gaps 1, 2, 3, 4, 6 and 8.

Open items: none.

### 6. Existing gallery files (waiting)

Brings the existing gallery files in line with the rules, as its Discussion decides. Existing model output needs only its chunks cleaned; existing imports need conversion or strip. Needs step 5. Gap 13.

### 7. Edit request (waiting)

Pixels only for images and mask, neutral filenames, and no more `blob.name` on the gallery's own `Blob`. Needs steps 5 and 6. Gap 12.

Open items: the open point "Masks" in the terms.

### 8. Cleanup (waiting)

The unused files `components/image_converter.js` and `components/generation_panel.options.js`, the UI wording of the strip checkbox and of the ZIP export, and the intro image. Gap 7 and the open point "UI wording" in the terms.
