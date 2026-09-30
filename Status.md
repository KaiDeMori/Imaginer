# Status — the hand-over baton

> How to use and update this file: see `HandOver_Protocol.md`.

## Where we are right now

- Active task: [Rock-solid metadata](Tasks/Rock_solid_metadata.md) 🤘. Its planning file has eight steps in dependency order. Steps 1 and 2 are built; their manual tests are in the planning file and wait for the user.
- On 2026-09-30, three decisions were written into the terms, the gap analysis, and the planning file: every gallery file is a PNG and only JPEG and WebP are converted; imports always get strip; the chunk module and Export come before the browser tests, with the unique filename first.
- Terms and rules: [misc/metadata_terms.md](misc/metadata_terms.md). The wording may still change.
- Web research: [misc/metadata_research.md](misc/metadata_research.md).
- Gap analysis: [misc/metadata_gap_analysis.md](misc/metadata_gap_analysis.md). All four paths are compared; its rule column follows today's terms.
- Browser tests (step 4), round 1 is done: the test page `tools/browser_tests/conversion_tests.html` ran in Firefox 144 (normal window and Strict) and Chromium 148. Raw results are in `tools/browser_tests/results/`, the summary is in `misc/metadata_research.md`, section "Local browser test results". Round 2 is decided: the JPEG and WebP path only. It can run at any time; only step 5 needs it.
- The check `bash tools/check/check.sh` passes on today's code. It is the gate for every code step, and it runs the Node specifications in `tools/check/` (`PNG_chunks_check.mjs`, `process_image_metadata_check.mjs`, `metadata_readers_check.mjs`).
- A collection of drafts is present in `Tasks/Draft_Collection.md`.

## Next step

- Step 3, One Export function: the main model writes its Decisions into the planning file and the plan, then a review workflow, then an implementation workflow.

## Open threads (not blocking)

- `tools/browser_tests/png_test_tools.js` contains an untested own PNG decoder (`decode_png`, `read_tiff_orientation`, `read_png_exif_orientation`). It is removed in round 2 of the browser tests.
- The test page reads the frame count before the decoder's track is ready (Chromium shows 0); fix or drop it in round 2.
- Gallery import button (📂, tooltip "Import", after 🗑️): parked on the user's list, probably its own session.
- With a mini model selected, images in the input area are ignored without a word.
- `components/image_converter.js` and `components/generation_panel.options.js` are unreachable. Both touch metadata, so the task decides about them.
- `tsc` reports about 180 type errors in the app code, all noise. The check ignores them; cleaning them up would be a task of its own.
