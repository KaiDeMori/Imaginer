# Status — the hand-over baton

> How to use and update this file: see `HandOver_Protocol.md`.

## Where we are right now

- [ZIP import](Tasks/ZIP_import.md) is built: `ZIP_import.js`, the gallery's import path split into loose files and ZIP files with one dialog afterwards, thumbnails inserted by timestamp, the input area's refusal of ZIP files, the file dialog accepting `.zip`, and the Node check `tools/check/ZIP_import_check.mjs`. README, User Manual, Technical Manual, FAQ and `misc/metadata_terms.md` describe it. The decisions made while building, and the manual tests, are in the planning file.
- [Rock-solid metadata](Tasks/Rock_solid_metadata.md) 🤘 and the [Gallery import button](Tasks/Gallery_import_button.md) are built, tested and reviewed; both shipped with 1.14.
- Terms and rules: [misc/metadata_terms.md](misc/metadata_terms.md), the reference for metadata in Imaginer. Web research: [misc/metadata_research.md](misc/metadata_research.md). Gap analysis: [misc/metadata_gap_analysis.md](misc/metadata_gap_analysis.md).
- The check `bash tools/check/check.sh` passes on today's code. It is the gate for every code step and runs the Node specifications in `tools/check/`.
- Releases: 1.14 is complete: `version.json`, the version message and the cache manifest. The ZIP import is not in a release yet; `version.json` and `version_messages/` are untouched, by the plan.
- Drafts: `Tasks/Draft_Collection.md`.

## Next step

- The user runs the manual tests in [Tasks/ZIP_import.md](Tasks/ZIP_import.md), section "Manual test". Then the review.

## Open threads (not blocking)

- 1.14 waits for the user's upload.
- The wording of the ZIP import's dialogs is a draft; the review decides it.
