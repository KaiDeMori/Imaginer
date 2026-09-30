# Status — the hand-over baton

> How to use and update this file: see `HandOver_Protocol.md`.

## Where we are right now

- Active task: [Rock-solid metadata](Tasks/Rock_solid_metadata.md) 🤘. It is a planning file per [Workflows_and_reviews.md](Workflows_and_reviews.md); no step is written yet.
- Terms and rules: [misc/metadata_terms.md](misc/metadata_terms.md). Fresh; the wording may still change.
- Web research: [misc/metadata_research.md](misc/metadata_research.md).
- Gap analysis: [misc/metadata_gap_analysis.md](misc/metadata_gap_analysis.md). All four paths are compared.
- The check `bash tools/check/check.sh` passes on today's code. It is the gate for workflow steps.
- A collection of drafts is present in `Tasks/Draft_Collection.md`.

## Next step

- Step 1: the user runs `tools/browser_tests/conversion_tests.html` in Firefox and Chrome and pastes the results; they go into `misc/metadata_research.md`.

## Open threads (not blocking)

- Gallery import button (📂, tooltip "Import", after 🗑️): parked on the user's list, probably its own session.
- ZIP export may lose images whose filenames collide (same prompt, same second). Not yet tested.
- With a mini model selected, images in the input area are ignored without a word.
- `components/image_converter.js` and `components/generation_panel.options.js` are unreachable. Both touch metadata, so the task decides about them.
- `tsc` reports about 180 type errors in the app code, all noise. The check ignores them; cleaning them up would be a task of its own.
