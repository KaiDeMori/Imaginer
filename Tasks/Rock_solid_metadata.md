# Rock-solid metadata

The planning file of this task, as [Workflows_and_reviews.md](../Workflows_and_reviews.md) defines it.

## Goal

Every path through Imaginer treats metadata according to agreed rules, and code, config, and documentation match those rules.

## Plan

Linked words are terms from [misc/metadata_terms.md](../misc/metadata_terms.md), which also holds the agreed rules.

Today, each path handles metadata its own way:
- [Download](../misc/metadata_terms.md) can break palette PNGs or write the prompt twice.
- The [edit request](../misc/metadata_terms.md) sends private data such as GPS location and original filenames to OpenAI.
- Parts of the documentation contradict the code.

Core idea: [intake](../misc/metadata_terms.md) converts every image once into an upright RGBA PNG, so [Export](../misc/metadata_terms.md) and [edit request](../misc/metadata_terms.md) only remove or add PNG chunks.
Together, we compare the rules with today's code, one path at a time, in [misc/metadata_gap_analysis.md](../misc/metadata_gap_analysis.md); the differences become the steps.
Local browser tests settle the technical unknowns before code depends on them.
Open points are decided when a step needs them.

## Out of scope

- The gallery import button: a task of its own.
- Color spaces.
- Masks: they are not exported.

## Steps

Each step is an H3 that names its state: waiting, in discussion, planned, or built. A step in discussion or later has four H4 sections: Decisions, Facts, Open items, Out of scope. Once its plan exists, the step links its plan file. Gap numbers refer to the list "Gaps" in [misc/metadata_gap_analysis.md](../misc/metadata_gap_analysis.md).

### 1. Browser tests for the conversion (planned)

Local browser tests decide the conversion pipeline: decoding, orientation, encoding, and the `deBG` chunk. Gap 3.

#### Decisions

- The step runs by hand. The main model writes one test page, and the user runs it in Firefox and Chrome. The step skips the workflow: the page is a measuring instrument, not app code.
- The test page is `tools/browser_tests/conversion_tests.html`, with `conversion_tests.js` and `png_test_tools.js`.
- It tests: support of `ImageDecoder` and `CompressionStream`; exact decoding of PNG sources (RGBA with alpha, palette with `tRNS`, 16 bits per sample, animated) and JPEG and WebP against `<img>`; the round trip through the own PNG encoder, byte-exact and with only `IHDR`, `IDAT` and `IEND`; EXIF orientation for JPEG (1 to 8) and for WebP and PNG (1 and 6), against `<img>` and `createImageBitmap`; canvas PNG chunks, pixel exactness, and a mask; the timing at 12 MP, and at 48 MP on demand.
- Not tested: fingerprinting overrides in `about:config`, `resistFingerprinting`, Safari, Brave.
- The results go into [misc/metadata_research.md](../misc/metadata_research.md).

#### Facts

- The candidate pipeline and the list of local browser tests are in [misc/metadata_research.md](../misc/metadata_research.md), sections "Canvas-free conversion" and "Local browser tests".
- Agents cannot use a browser: the workflow forbids them to start a server or a browser.
- Imaginer is developed and tested with Firefox (`README.md`, section Requirements).
- The pure helpers in `png_test_tools.js` passed 55 checks in Node 22: PNG structure and CRCs, the decompressed rows, APNG sequence numbers, the EXIF bytes, the embedding into JPEG, WebP and PNG, and the eight orientation transforms as a group.

#### Open items

None.

#### Out of scope

- Tests against OpenAI.
- Color spaces.

### 2. One PNG chunk module (waiting)

One module for the chunk operations every path needs: strip, pixels only, writing the iTXt form and the XMP form (XML-escaped, replacing existing forms), and reading the prompt. It replaces `process_image_metadata`, `png_iTXt/`, `png_XMP_via_iTXt/`, and `strip_metadata_from_PNG/`. Gap 5 and the writing part of gap 10.

Open items: the open points "Prompt source" and "Detection" in the terms.

### 3. One Export function (waiting)

One Export function for Download and ZIP export: strip per the strip checkbox, fresh Imaginer metadata, and the filename with the ID. Needs step 2 and comes before step 4. Gaps 9, 10 and 11.

Open items: whether an error at Export reaches the user (gap 11).

### 4. Intake (waiting)

The conversion and one intake function for both doors; model output stops writing Imaginer metadata. Needs steps 1 to 3. Gaps 1, 2, 3, 4, 6 and 8.

Open items: the open points "Strip off", "Conversion edge cases" and "C2PA" in the terms.

### 5. Existing gallery files (waiting)

Brings the existing gallery files in line with the rules, as its Discussion decides. Needs step 4. Gap 13.

### 6. Edit request (waiting)

Pixels only for images and mask, neutral filenames, and no more `blob.name` on the gallery's own `Blob`. Needs steps 4 and 5. Gap 12.

Open items: the open point "Masks" in the terms.

### 7. Cleanup (waiting)

The unused files `components/image_converter.js` and `components/generation_panel.options.js`, the UI wording of the strip checkbox and of the ZIP export, and the intro image. Gap 7 and the open point "UI wording" in the terms.
