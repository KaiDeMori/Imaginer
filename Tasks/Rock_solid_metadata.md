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

Each step is an H3 that names its state: waiting, in discussion, planned, or built. A step in discussion or later has four H4 sections: Decisions, Facts, Open items, Out of scope. Once its plan exists, the step links its plan file. A built step adds the H4 section Manual test. Gap numbers refer to the list "Gaps" in [misc/metadata_gap_analysis.md](../misc/metadata_gap_analysis.md).

The order follows the dependencies. Steps 1 to 3 need no browser test; only step 5 needs the results of step 4.

### 1. Unique export filenames (built)

Every Export gives the same image the same, unique filename, `<prompt>_<created>_<id>.<ext>`, so the ZIP export never drops an image. The filename part of gap 10. It came first because the ZIP export is the users' backup.

#### Decisions

- `build_image_filename` takes the record's `id` and appends it after the timestamp. Without an `id` the filename has no ID part; only the intro image and the dummy images have no record.
- The extension stays type-derived through `extension_for_type` until step 6 converts the existing gallery files. From then on every gallery file is a PNG and the rule's `.png` holds.
- Done by hand, without a workflow.

#### Facts

- The ID is the IndexedDB key `id` of the object store `images` (`storage/database_store.js`, `keyPath: "id"`, `autoIncrement: true`), so it is unique per record.
- The three callers are the ⬇️ handler in `Gallery._build_thumbnail_content`, the ZIP loop in `Config_dialog.wire_events`, and `Performance_warning.download_all`.

#### Open items

- None.

#### Out of scope

- Strip and Imaginer metadata at Export: step 3.

#### Manual test

- Config → Advanced: streaming preview off. Config → Generation: number of images 2. Generate, then Config → Files → Download All Images. The ZIP holds both images, named `<prompt>_<created>_<id>.png` with two different IDs.
- ⬇️ on a thumbnail downloads `<prompt>_<created>_<id>.png`. A second ⬇️ on the same thumbnail gives the same name.

### 2. One PNG chunk module (built)

One module for the chunk operations every path needs: strip with the chunk whitelist, pixels only, writing the iTXt form and the XMP form (XML-escaped, replacing existing forms), and reading the prompt. It replaces `png_iTXt/`, `png_XMP_via_iTXt/`, `strip_metadata_from_PNG/`, and `components/png_metadata_reader.js`. Gap 5 and the writing part of gap 10.

Plan: [Tasks/plans/One_PNG_chunk_module.plan.md](plans/One_PNG_chunk_module.plan.md).

#### Decisions

- The module is `PNG_chunks.js` in the repository root, next to the other root modules. Its functions work on `Uint8Array` and are free of browser globals, so Node can run them. XML escaping and entity decoding live in `XML_entities.js`, used by the chunk module and by the JPEG and WebP readers.
- Strip and pixels only are the same chunk whitelist: `IHDR`, `PLTE`, `tRNS`, `IDAT`, `IEND`, in their original order.
- Writing the prompt: existing iTXt chunks with the keyword `prompt_text` are always removed. A PNG carries one XMP packet, so writing the XMP form removes every iTXt chunk with the keyword `XML:com.adobe.xmp`; when the XMP form is not written, only such chunks whose packet has Imaginer's shape are removed, and a foreign XMP chunk stays, because it is external metadata. The requested forms are inserted before the first `IDAT`, the iTXt form first, then the XMP form. An empty prompt writes no form. The XMP packet escapes the prompt as XML text.
- Reading the prompt never fails on file content: bytes that are not a PNG, a truncated file, a malformed or corrupt chunk yield what was readable, or the empty string. The first iTXt chunk with the keyword `prompt_text` and a non-empty text wins, compressed or not; otherwise the `dc:description` of an iTXt chunk with the keyword `XML:com.adobe.xmp`, bounded by that element and with XML entities decoded; otherwise the empty string. Nothing is trimmed.
- Entity decoding is one pass and never throws; an invalid numeric entity stays as it is.
- `process_image_metadata.js` stays as a thin adapter over the module with its signature and call sites unchanged, so that every call site keeps working until step 3 and step 5 take them over. Its behaviour changes only where the rules demand it: the whitelist, replaced forms, escaping, and no forms without a prompt. Its failure semantics stay as today: a failed strip returns the original blob, a failed write returns the stripped bytes, both logged.
- The JPEG and WebP readers decode XML entities in the description, so gap 5 closes for all three formats. Their fields stay as the Intake rule "Prompt" in the terms states them.
- The untracked demo pages and the note in the three folders were moved to `archive/png_demos/` by the main model before the implementation, and their `.gitignore` lines removed; the folders then hold only tracked files and are deleted.
- The module, the adapter and the readers are specified by Node checks in `tools/check/`: `PNG_chunks_check.mjs`, `process_image_metadata_check.mjs` and `metadata_readers_check.mjs`, written by the main model before the plan review. The implementers run them as part of their gate; the main model wires them into the check at Verification.
- The plan was written by the main model and reviewed by three independent reviewers; their confirmed findings are in the plan. Two implementers built it; the main model deleted the old modules, removed their config patterns, and wired the Node checks into the check.

#### Facts

- `process_image_metadata` is called in `app.js` in `consume_image_stream`, in the edit request branch, and twice in the generation request branch, and in the ⬇️ handler in `components/gallery.js`. `window.process_image_metadata` is set in `app.js` and used nowhere else.
- `read_png_metadata` is imported only by `components/gallery.js`, in `read_image_prompt`, which also serves as the signature-based fallback for files without a MIME type. The gallery's drop listener calls `read_image_prompt` without a guard, and `read_png_metadata` never throws.
- `strip_metadata_from_PNG` keeps only `IHDR`, `IDAT` and `IEND`; `add_iTXt_chunk_to_png` inserts before the first `IDAT`; `embed_XMP_description` inserts after `IHDR` and does not escape the prompt; none of them removes an existing form. `process_image_metadata` today returns the stripped blob when only the embedding fails.
- `read_png_metadata` skips the iTXt compression flag and method without honouring them, and its XMP regular expression does not decode entities; the JPEG and WebP readers use the same expression.
- `tools/check/check_config.json` and `jsconfig.json` list the three folders that disappear; the main model removes those patterns at Verification.
- Node 22.16.0 is installed. Its ESM syntax detection loads the root `.js` modules from `.mjs` checks, which needs Node 22.7 or newer; no `package.json` is added. Node provides `Blob`, `CompressionStream`, `DecompressionStream`, `Response`, `TextEncoder` and `TextDecoder` as globals.

#### Open items

- None.

#### Out of scope

- One Export function and errors at Export: step 3.
- Intake, the conversion, and moving the prompt reading for JPEG and WebP into intake: step 5.
- Pixels only at the edit request: step 7.

#### Manual test

- Config → Advanced: strip on, both prompt options on. Generate an image whose prompt contains `&` and `<`. ⬇️ it, then drop the downloaded file into the gallery: 💬 shows the same prompt.
- Drop a palette PNG with transparency (an indexed-colour PNG) into the gallery, then ⬇️ it with strip on: the downloaded file shows the same image, transparency included.
- Config → Advanced: strip off, both prompt options off. ⬇️ a generated image, then drop the downloaded file into the gallery: the thumbnail has no 💬.
- Drop a JPEG or WebP whose XMP description contains `&amp;` into the gallery: 💬 shows `&`.

### 3. One Export function (built)

One Export function for Download and ZIP export: strip per the strip checkbox, fresh Imaginer metadata, and the filename from step 1. Needs steps 1 and 2 and comes before step 5. Gaps 9, 10 and 11.

Plan: [Tasks/plans/One_Export_function.plan.md](plans/One_Export_function.plan.md).

#### Decisions

- The module is `image_export.js` in the repository root. `export_image(record)` gives the file and the filename for one gallery record; `collect_ZIP_entries(records, on_progress)` gives the entries and the failures for the ZIP export; `export_gallery_as_ZIP(records, callbacks)` builds and downloads the archive; `trigger_download(blob, filename)` is the one place that hands a file to the browser, with the longest revoke delay the callers used.
- A gallery file that is not a PNG leaves as stored, with its own extension, until step 6 converts the existing gallery files. Strip cannot apply to it without the conversion.
- An error at Export reaches the user, and a file to which the rules cannot be applied does not leave, because it would carry what the config promised to remove. Download: an error dialog with the filename, the reason and the way out. ZIP export: the backup must not stop for one file, so the file is left out, and after the download one message lists every such file with the reason and the way out. The way out: with the strip checkbox off and both prompt checkboxes off, Export changes nothing and the file leaves as stored, unparsed.
- Download All Images inside the config dialog follows the saved settings; a changed checkbox counts after OK.
- The module's pure part is specified by the Node check `tools/check/image_export_check.mjs`, written by the main model before the plan review and extended after it. The ZIP assembly and the download are browser-only and stay thin; their dependencies are loaded with dynamic imports so that Node can load the module. Every processed PNG is held in memory until the archive is built; that is the cost of processing at Export.
- The progress dialog's error area keeps line breaks and scrolls, so a long list of left-out files stays readable.
- The plan was written by the main model and reviewed by three independent reviewers; their confirmed findings are in the plan. Two implementers built it; the main model wired the Node check into the check.

#### Facts

- The ⬇️ handler in `Gallery._build_thumbnail_content` processes only PNG blobs with `process_image_metadata` and builds its own anchor download; the two ZIP loops in `Config_dialog.wire_events` and `Performance_warning.download_all` write the gallery files byte for byte, apply no strip and no prompt form, and build the same archive name.
- `version_manager.js` imports `components/version_message_modal.js` at its top level, so a module that Node must load cannot import it statically.
- `filename_helper.js` and `components/image_validation.js` have no browser global at their top level; `filename_helper.js` reads `localStorage` only when a filename is built.
- `Download_progress_dialog` offers `show`, `set_status`, `update_progress`, `show_error` and `close`; `show_error` ends the dialog with a close button.

#### Open items

- None.

#### Out of scope

- Model output at intake: step 5.
- Converting the existing gallery files: step 6.
- Pixels only at the edit request: step 7.
- The UI wording of the ZIP export: step 8.

#### Manual test

- Config → Advanced: strip on, both prompt options on, OK. ⬇️ on a generated image, then drop the file into the gallery: 💬 shows the prompt, and the file is named `<prompt>_<created>_<id>.png`.
- ⬇️ on an imported JPEG: the file is named `<prompt>_<created>_<id>.jpg` and has the same size as the original.
- Config → Files → Download All Images with a gallery of several images: the ZIP holds every image, each named `<prompt>_<created>_<id>.<ext>`, and the dialog closes after the download.
- Import a file named `.png` that is a renamed JPEG, then ⬇️ on it: an error dialog names the file, the reason, and the way out; nothing downloads. Download All Images: the ZIP holds every other image, and the dialog lists the file with the reason and the hint, then closes on Close.
- Config → Advanced: strip off, both prompt options off, OK. ⬇️ on the renamed JPEG: it downloads as stored.

### 4. Browser tests for the conversion (planned)

Local browser tests settle the conversion of JPEG and WebP: decoding, orientation, encoding, and the timing. Gap 3. Only step 5 needs the results; the tests can run at any time.

#### Decisions

- The step runs by hand. The main model writes the test page, and the user runs it in Firefox and Chrome. The step skips the workflow: the page is a measuring instrument, not app code.
- The test page is `tools/browser_tests/conversion_tests.html`, with `conversion_tests.js` and `png_test_tools.js`.
- Round 1 tested: support of `ImageDecoder` and `CompressionStream`; exact decoding of PNG sources (RGBA with alpha, palette with `tRNS`, 16 bits per sample, animated) and JPEG and WebP against `<img>`; the round trip through the own PNG encoder, byte-exact and with only `IHDR`, `IDAT` and `IEND`; EXIF orientation for JPEG (1 to 8) and for WebP and PNG (1 and 6), against `<img>` and `createImageBitmap`; canvas PNG chunks, pixel exactness, and a mask; the timing at 12 MP, and at 48 MP on demand. The results are in [misc/metadata_research.md](../misc/metadata_research.md), section "Local browser test results".
- Round 2 tests the path for JPEG and WebP only: `createImageBitmap`, then `VideoFrame.copyTo` as RGBA, then the own PNG encoder. Against `<img>` in Firefox and Chromium, in a normal window and with Strict tracking protection; the EXIF orientations; a WebP with alpha; the timing at 12 MP.
- PNG sources are not decoded. The own PNG decoder in `png_test_tools.js` is removed in round 2, with the helpers only the PNG source cases used. One PNG case stays: the alpha pattern through `createImageBitmap` with `premultiplyAlpha: "none"`, because it measures whether the verification of a written PNG can be exact for semi-transparent pixels.
- Round 2 also measures whether `VideoFrame.copyTo` is free of canvas noise: the candidate decode against the same bitmap drawn on a canvas, and two candidate decodes against each other.
- The page for round 2 is written by the main model. The user runs it in Firefox (normal window and Strict tracking protection) and in Chromium, and pastes each result into `tools/browser_tests/results/<browser>_<mode>_round_2.md`, as in round 1. The main model then writes the summary into [misc/metadata_research.md](../misc/metadata_research.md).
- Not tested: fingerprinting overrides in `about:config`, `resistFingerprinting`, Safari, Brave.
- The results go into [misc/metadata_research.md](../misc/metadata_research.md).

#### Facts

- The candidate pipeline and the list of local browser tests are in [misc/metadata_research.md](../misc/metadata_research.md), sections "Canvas-free conversion" and "Local browser tests".
- Agents cannot use a browser: they start no server and no browser.
- Imaginer is developed and tested with Firefox (`README.md`, section Requirements).
- The pure helpers in `png_test_tools.js` passed 55 checks in Node 22: PNG structure and CRCs, the decompressed rows, APNG sequence numbers, the EXIF bytes, the embedding into JPEG, WebP and PNG, and the eight orientation transforms as a group.

#### Open items

- The results of round 2. Step 5 is designed for the candidate; its conversion function is the one part that changes if round 2 fails.

#### Out of scope

- Tests against OpenAI.
- Color spaces.

#### Manual test

- Serve the repository as the README describes, open `/tools/browser_tests/conversion_tests.html` in Firefox in a normal window, wait for "Done", choose the window mode, click Copy results, and paste the text into `tools/browser_tests/results/firefox_<version>_normal_window_round_2.md` under a heading line as in round 1.
- Repeat with Strict tracking protection in Firefox, and in a normal window in Chromium.
- Expected: every Support row ✓; every "own PNG round trip" row ✓; every "two candidate decodes are identical" row ✓; every Orientation row ✓; the Timing row ✓ with a total near the round 1 total. The "against <img>" rows are information; in Strict they may show small differences from the canvas readback of `<img>`.

### 5. Intake (planned)

The conversion of JPEG and WebP, strip for every import, and one intake function for both doors; model output stops writing Imaginer metadata. Needs steps 2 to 4. Gaps 1, 2, 3, 4, 6 and 8.

Plan: [Tasks/plans/Intake.plan.md](plans/Intake.plan.md).

#### Decisions

- Intake lives in `image_intake.js`: `intake_import(file)` for both import doors, `intake_model_output(blob)` and `accept_model_output(blob)` for model output. The conversion lives in `image_conversion.js`: `convert_to_PNG(blob)` on the candidate pipeline `createImageBitmap`, `VideoFrame.copyTo` as RGBA, `encode_PNG_RGBA`. The encoder joins `PNG_chunks.js`; it chooses a filter per row by the standard heuristic, because a photograph as an unfiltered PNG would be twice as large in the gallery, in the backup, and against the edit request's limit.
- The conversion uses the browser's default colour space conversion, so a tagged photo comes out as the browser displays it; colour spaces stay out of scope beyond that. The frame and the bitmap are closed before encoding, and every WebCodecs failure becomes a readable message.
- The input area refuses a converted image above the edit request's size limit, with the original name and the converted size; the gallery takes any size, because no request limit applies to it.
- The format of an import is decided by its bytes, not by its declared type: a PNG is stripped to its pixel chunks, everything else is converted. A renamed file is treated as what it is.
- The prompt of an import is read before the conversion, because the conversion drops every metadata; the fields follow the Intake rule "Prompt" in the terms.
- Every intake error reaches the user. Too many files at once are refused before any work, at both doors. Every other failure concerns only its file: one dialog after the batch lists the files that could not be imported, with the reason. A failing `save` is such a failure. A PNG the browser decodes but whose chunks are truncated is converted instead of refused, and a prompt reader that fails never fails an import.
- While files convert for the input area, the drop area says so and Generate does nothing, so no request leaves without the images.
- Model output: with the strip checkbox on, the PNG is stripped to its pixel chunks; off, it is stored as OpenAI returned it. No prompt form is written at intake any more; Export writes them. When strip fails on model output, the image is stored as returned and the user is told that it may carry OpenAI's metadata, because a paid generation is never thrown away; Export then treats it like any file to which the rules cannot be applied. The terms carry this as the Intake rule "Errors".
- The four places in `app.js` that receive model output share one function, `save_model_output`, which applies intake, saves the record and registers it with the gallery. `process_image_metadata.js` and its Node check go.
- A browser without `VideoFrame` cannot import JPEG and WebP; the message says so. No canvas fallback.
- Step 5 is designed for the candidate pipeline before the round 2 results are in. If round 2 fails, `convert_to_PNG` is the one function that changes.
- The plan was written by the main model and reviewed by three independent reviewers; their confirmed findings are in the plan. Implementers build it. The intake and conversion modules are specified by `tools/check/image_intake_check.mjs`, the encoder by `tools/check/PNG_encoder_check.mjs`; both are wired into the check at Verification, so the gate stays green until the code exists. The adapter's check leaves the gate before the implementation starts.

#### Facts

- Model output is handled four times in `app.js`: in `consume_image_stream`, in the edit request branch, and twice in the generation request branch (one image, several images); each calls `process_image_metadata`, saves the record and sets `gallery.records_by_id`.
- The gallery's drop listener validates count, type and readability for the whole batch, then imports file by file without a `try`; `read_image_prompt` in `components/gallery.js` reads the prompt by type with a signature fallback.
- The input area's external file branch in `Generation_panel.attach_events` hands the dropped files to `drop_area_manager.try_add_images`, which validates count, type, readability and masks and adds the entries atomically; the thumbnails show `entry.image.name`.
- `Generation_panel` passes `embed_options` to its `onGenerate` callback; `app.js` passes them to `process_image_metadata`.
- `validate_file_readable` decodes with `createImageBitmap`, which sniffs the content, so it accepts a renamed JPEG.
- `Error_modal.show` renders an object with `message` and `hint` fields as a table with those two rows, and keeps line breaks in the values.

#### Open items

- None.

#### Out of scope

- The intro image: step 8.
- The existing gallery files: step 6.
- Pixels only and neutral filenames at the edit request: step 7.

### 6. Existing gallery files (waiting)

Brings the existing gallery files in line with the rules, as its Discussion decides. Existing model output needs only its chunks cleaned; existing imports need conversion or strip. Needs step 5. Gap 13.

### 7. Edit request (waiting)

Pixels only for images and mask, neutral filenames, and no more `blob.name` on the gallery's own `Blob`. Needs steps 5 and 6. Gap 12.

Open items: the open point "Masks" in the terms.

### 8. Cleanup (waiting)

The unused files `components/image_converter.js` and `components/generation_panel.options.js`, the UI wording of the strip checkbox and of the ZIP export, and the intro image. Gap 7 and the open point "UI wording" in the terms.
