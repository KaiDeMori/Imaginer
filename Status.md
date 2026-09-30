# Status — the hand-over baton

> How to use and update this file: see `HandOver_Protocol.md`.

## Where we are right now

- Active task: [Rock-solid metadata](Tasks/Rock_solid_metadata.md) 🤘. Its planning file has eight steps in dependency order. Every code step is built (1, 2, 3, 5, 6, 7 and 8); their manual tests are in the planning file and wait for the user. Step 4's round 2 page waits for the user's runs.
- Terms and rules: [misc/metadata_terms.md](misc/metadata_terms.md), the reference for metadata in Imaginer; every decision of the task is in the planning file's steps.
- Web research: [misc/metadata_research.md](misc/metadata_research.md).
- Gap analysis: [misc/metadata_gap_analysis.md](misc/metadata_gap_analysis.md). All four paths are compared; its rule column follows today's terms.
- Browser tests (step 4), round 1 is done: the test page `tools/browser_tests/conversion_tests.html` ran in Firefox 144 (normal window and Strict) and Chromium 148. Raw results are in `tools/browser_tests/results/`, the summary is in `misc/metadata_research.md`, section "Local browser test results". The round 2 page is written for the JPEG and WebP path (`createImageBitmap`, `VideoFrame.copyTo`, own encoder) and waits for the user's runs; only step 5 needs its results.
- The check `bash tools/check/check.sh` passes on today's code. It is the gate for every code step, and it runs the Node specifications in `tools/check/` (`PNG_chunks_check.mjs`, `PNG_encoder_check.mjs`, `metadata_readers_check.mjs`, `image_export_check.mjs`, `image_intake_check.mjs`, `gallery_migration_check.mjs`, `drop_area_manager_check.mjs`).
- A collection of drafts is present in `Tasks/Draft_Collection.md`.

## Next step

- The user's turn: run the manual tests of steps 1 to 8 in the planning file, run the round 2 test page (step 4, section Manual test) in Firefox and Chromium and paste the results into `tools/browser_tests/results/`, then the main model writes the round 2 summary into `misc/metadata_research.md`. After that, the release, done together: `version.json` and a version message that names the one-time conversion.

## Open threads (not blocking)

- Gallery import button (📂, tooltip "Import", after 🗑️): parked on the user's list, probably its own session.
- With a mini model selected, images in the input area are ignored without a word.
- `tsc` reports about 180 type errors in the app code, all noise. The check ignores them; cleaning them up would be a task of its own.
