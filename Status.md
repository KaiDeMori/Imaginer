# Status — the hand-over baton

> How to use and update this file: see `HandOver_Protocol.md`.

## Where we are right now

- Active task: [Rock-solid metadata](Tasks/Rock_solid_metadata.md) 🤘. It is a planning file per [Workflows_and_reviews.md](Workflows_and_reviews.md) with seven steps; step 1 is in discussion.
- Terms and rules: [misc/metadata_terms.md](misc/metadata_terms.md). Fresh; the wording may still change.
- Web research: [misc/metadata_research.md](misc/metadata_research.md).
- Gap analysis: [misc/metadata_gap_analysis.md](misc/metadata_gap_analysis.md). All four paths are compared.
- Step 1, round 1 is done: the test page `tools/browser_tests/conversion_tests.html` ran in Firefox 144 (normal window and Strict) and Chromium 148. Raw results are in `tools/browser_tests/results/`, the summary is in `misc/metadata_research.md`, section "Local browser test results". In short: `ImageDecoder` alone is no cross-browser pipeline, semi-transparent pixels do not survive the browser's decoders, and masks keep their alpha.
- The check `bash tools/check/check.sh` passes on today's code. It is the gate for workflow steps.
- A collection of drafts is present in `Tasks/Draft_Collection.md`.

## Next step

- Step 1, round 2: discuss with the user which candidates to test, before building anything. Candidates: an own PNG decoder (exact alpha) and `createImageBitmap` → `VideoFrame` → `copyTo` (matches the display in both browsers).

## Open threads (not blocking)

- `tools/browser_tests/png_test_tools.js` contains an untested own PNG decoder (`decode_png`, `read_tiff_orientation`, `read_png_exif_orientation`) from the interrupted round 2. The Discussion decides whether it stays.
- The test page reads the frame count before the decoder's track is ready (Chromium shows 0); fix it in round 2.
- Gallery import button (📂, tooltip "Import", after 🗑️): parked on the user's list, probably its own session.
- With a mini model selected, images in the input area are ignored without a word.
- `components/image_converter.js` and `components/generation_panel.options.js` are unreachable. Both touch metadata, so the task decides about them.
- `tsc` reports about 180 type errors in the app code, all noise. The check ignores them; cleaning them up would be a task of its own.
