# Tasks

Working documents for the development of Imaginer: notes, and later plans and tasks.
Files in this folder are not deployed, because the SFTP upload excludes `*.md`.
Other file types placed here would be uploaded.

## Files

- **`README.md`:** this overview.
- **`Notes.md`:** shared notes of the current investigation. Working agreement, knowledge register with entry IDs, reference material.
- **`Tasks cache busting.md`:** earlier task description for the cache refresh on version updates. Implemented in `cache_manifest.json` and `cache_refresh_manager.js`.
- **`Tasks .md`:** empty template.

## Starting a new session

1. Read `Notes.md`, Section 1 (How we work) and Section 2 (Terms).
2. Read the current focus at the top of `Notes.md`.
3. Read the register entries the current focus refers to, together with their evidence.

## Contents of Notes.md

Keep this list in sync with the headings of `Notes.md`.

- **Header:** purpose of the file and the current focus.
- **1. How we work:** working agreement, and the entry types K, S, U, R, G, D.
- **2. Terms:** fixed wording for recurring terms, such as apex address, www address and intro flag.
- **3. Incident:** what happened on 2026-09-27, the user's general rule on data loss, and a timeline.
- **4. Known:** verified facts, each with its evidence.
- **5. Suspected:** hypotheses, each with what would confirm or refute it.
- **6. Unclear:** open questions, including the evidence being gathered.
- **7. Refuted:** disproved hypotheses, kept for the record.
- **8. Goals (draft):** desired behavior for data safety, the intro, the address and the storage.
- **9. Decisions:** candidates, none agreed yet. D1 carries the address questions Q-A, Q-B and Q-C.
- **10. Reference:** storage keys, deleting code paths, places that touch the intro flag, deployment, Firefox behavior, git anchors.
- **Appendix A:** console snippet that reports storage state and audio support.
- **Appendix B:** curl checks for redirects and storage-related headers.
