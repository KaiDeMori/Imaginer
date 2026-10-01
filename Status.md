# Status — the hand-over baton

> How to use and update this file: see `HandOver_Protocol.md`.

## Where we are right now

- [Rock-solid metadata](Tasks/Rock_solid_metadata.md) 🤘 is built: every code step (1, 2, 3, 5, 6, 7 and 8), and the user's manual tests pass. Step 7's mask test is recorded in the planning file: the mask reaches OpenAI intact, and the models follow it unreliably.
- Terms and rules: [misc/metadata_terms.md](misc/metadata_terms.md), the reference for metadata in Imaginer; every decision of the task is in the planning file's steps.
- Web research: [misc/metadata_research.md](misc/metadata_research.md). Gap analysis: [misc/metadata_gap_analysis.md](misc/metadata_gap_analysis.md).
- Browser tests (step 4): round 1 ran in Firefox 144 (normal window and Strict) and Chromium 148. Raw results are in `tools/browser_tests/results/`, the summary is in `misc/metadata_research.md`, section "Local browser test results". The round 2 page waits for the user's runs.
- The check `bash tools/check/check.sh` passes on today's code. It is the gate for every code step and runs the Node specifications in `tools/check/`.
- Releases: 1.13 is complete in git, its version message included, and is never uploaded, by the user's decision. The next release is 1.14: everything new since 1.12, plus the gallery import button.
- Drafts: `Tasks/Draft_Collection.md`.

## Next step

- The gallery import button (📂, tooltip "Import", after 🗑️): a task of its own, planned together with the user. It ships with 1.14.

## Open threads (not blocking)

- Before the release of 1.14:
  - Round 2 of the browser tests (step 4, section Manual test): the user runs the page in Firefox (normal window and Strict) and in Chromium, and the lead agent writes the summary into `misc/metadata_research.md`. Its results may still change `convert_to_PNG`.
  - `version.json` and the 1.14 version message, written together. The message covers everything new since 1.12: the note on the one-time conversion that step 6 calls for, and that Mask Mode now sends its mask (the released 1.12 never sends it). The About dialog lists every history entry; decide whether the history keeps 1.13.
- The User Manual's Mask Mode section says "Only masked areas will be modified." A note on the models' unreliable mask adherence waits for more data.
- Leftovers of unknown purpose in `assets/`: `assets/old/` and the gitignored `assets/conversion_stuff/`.
- With a mini model selected, images in the input area are ignored without a word.
- `tsc` reports about 180 type errors in the app code, all noise. The check ignores them; cleaning them up would be a task of its own.
