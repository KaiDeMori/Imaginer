# Status — the hand-over baton

> How to use and update this file: see `HandOver_Protocol.md`.

## Where we are right now

- [Rock-solid metadata](Tasks/Rock_solid_metadata.md) 🤘 is built: all nine steps. The user's manual tests pass. Step 7's mask test is recorded in the planning file: the mask reaches OpenAI intact, and the models follow it unreliably.
- Step 9, "Orientation in Chromium", came out of round 2 of the browser tests: Chromium's `VideoFrame` carries the EXIF orientation in `rotation` and `flip`, and `read_RGBA` now applies both. The lost colour precision of semi-transparent pixels in Chromium is accepted.
- Browser tests (step 4) are done. Round 2 passed in Firefox 144 (Standard and Strict tracking protection) and, after step 9, in Chromium 148. Raw results are in `tools/browser_tests/results/`, the summary is in `misc/metadata_research.md`, section "Local browser test results".
- [Gallery import button](Tasks/Gallery_import_button.md) is implemented and reviewed: drop and the 📂 button share `Gallery.import_files`; the gallery sets no count or size limit and asks first above 100 images. The edit request keeps OpenAI's limits under names that say whose they are (`MAXIMUM_IMAGE_COUNT_PER_EDIT_REQUEST`, `MAXIMUM_BYTES_PER_EDIT_REQUEST_IMAGE`, `MAXIMUM_BYTES_PER_EDIT_REQUEST_MASK`). All its steps are done.
- Terms and rules: [misc/metadata_terms.md](misc/metadata_terms.md), the reference for metadata in Imaginer; every decision of the task is in the planning file's steps.
- Web research: [misc/metadata_research.md](misc/metadata_research.md). Gap analysis: [misc/metadata_gap_analysis.md](misc/metadata_gap_analysis.md).
- The check `bash tools/check/check.sh` passes on today's code. It is the gate for every code step and runs the Node specifications in `tools/check/`.
- Releases: 1.13 is complete in git, its version message included, and is never uploaded, by the user's decision. 1.14 is complete: `version.json`, the version message and the cache manifest. It covers everything new since 1.12, plus the gallery import button.
- Drafts: `Tasks/Draft_Collection.md`.

## Next step

- The [ZIP import](Tasks/ZIP_import.md): its first open box.

## Open threads (not blocking)

- 1.14 waits for the user's upload.
