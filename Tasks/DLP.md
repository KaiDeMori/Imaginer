# Data Loss Panic

Record of the gallery loss noticed on 2026-09-27, and of its investigation.
Working rules, entry types and terms as in `Notes.md`, Sections 1 and 2.
IDs are unique across both files. IDs cited here but not defined here live in `Notes.md`.

## Summary

On 2026-09-27 the user opened Imaginer in Firefox on this machine.
The intro started, asked for an API key, and ended in the app with an empty gallery.
The second song of the intro did not play (K6).
The user downloads the gallery regularly, so the loss itself is limited.
No user has reported a similar loss.

The concern was whether an Imaginer update causes data loss. K1 answers it: no.
Most likely cause: a manual deletion of all storage for the domain in Firefox (S5).

User assessment of the cause: first S1 or S2; since the recollection behind S5, most likely S5.

## Timeline

All times are local time (CEST).

- 2026-09-11: Version 1.12 released (`fb69ce8` with follow-ups until `a40867c`).
- 2026-09-21: Version 1.13 released (`39bdc35`).
- 2026-09-26 11:29–11:30: the databases `thinking_machines` and `thinking_machines_log` were last written in the apex origin storage on this machine (K5). *Evidence: Firefox profile listing on 2026-09-27.*
- Unknown: the last time the gallery was intact on this machine (U5).
- Suspected, before 2026-09-26 11:29: the user deletes all storage for the domain in Firefox while working on Thinking_Machines (S5).
- 2026-09-27 04:53: intro run on the apex address with empty storage (K3). Console log saved at 04:58.
- 2026-09-27, morning: Firefox profile listing on this machine. No storage for the www origin (K8).
- 2026-09-27, afterwards: the www redirect and the interrupted-intro dialog on the www address (K7, K10), and the check of the `.htaccess` files on the server (K11).

## Known

- **K2:** The deployed files are identical to the repository.
  *Evidence: byte comparison of 9 core files served by the apex address: `app.js`, `version.json`, `version_manager.js`, `default_config.js`, `storage/database_store.js`, `components/gallery.js`, `components/menu_bar/menu_bar.js`, `components/config_dialog/config_dialog.js`, `components/performance_warning/performance_warning.js`.*
- **K3:** At the start of the visit on 2026-09-27, the apex origin held no API key and no images, and the intro flag was missing.
  The "enter API key" screen was the intro's own screen (`check_for_api_key` and `setup_api_key_interface` in `intro/00/pre_intro_ui.js`), not the config dialog.
  The API key present in the app at the end of the intro is the key typed into that screen.
  `eu_seed` was created at 04:53:15, during this visit.
  The missing intro flag is inferred: the app redirected to the intro without the interrupted-intro dialog, according to the user's account.
  *Evidence: console log `misc/IMAGINER_console-export-2026-9-27_4-58-21.log`. Local only, `*.log` is gitignored.*
- **K8:** At the time of the profile listing, neither Firefox profile on this machine held storage for the www origin.
  Consequence: no copy of the lost gallery exists under the www origin on this machine.
  *Evidence: Firefox profile listing on 2026-09-27.*
- **K9:** Until `3164d96` (2026-04-12), `Viewer.open` offered to "clean up all old/bad images" for a broken image. Confirming emptied the whole gallery. It never touched `localStorage`.
  Not relevant for the incident (K3 includes `localStorage`). Kept as history.
  *Evidence: `git show 3164d96`.*

## Suspected

- **S1:** The data was deleted while the user tested one of the two new apps on the same origin.
  *Support: the user tested both apps on this machine and considers an accidental deletion possible; K5.*
  *Would confirm: a reset in one of those apps that clears `localStorage` and deletes all IndexedDB databases of the origin (U6), with a timing that fits U5.*
  A reset like that also deletes the `thinking_machines` databases. Their state in K5 then only fits a reset before 2026-09-26 11:29, after which the app recreated them.
- **S2:** Firefox removed the whole origin storage: eviction under storage pressure, "Delete cookies and site data when Firefox is closed", or clearing history including site data.
  *Weakened by K5: such a removal takes the whole origin and would have taken the `thinking_machines` databases too, unless it happened before 2026-09-26 11:29.*
  *Would confirm: U5 before that time, together with one of the following on this machine:*
  - Settings › Privacy & Security › Cookies and Site Data: "Delete cookies and site data when Firefox is closed" is on.
  - Settings › Privacy & Security › History: Firefox clears history on close, with site data included.
  - Low free disk space, or a Firefox warning about it.
  - A cleanup tool that clears browser data.
- **S5:** While working on the Thinking_Machines project, the user deleted all storage for the domain through a button in the Firefox UI. That also deleted Imaginer's data.
  *Support: the user's recollection; K5 fits: the deletion took the `thinking_machines` databases too, and Thinking_Machines recreated them on its next run, last written 2026-09-26 11:29–11:30.*
  *Would refute: U5 after 2026-09-26 11:29. U5 before that time fits, but does not separate S5 from S1 and S2.*
  This is the shared-storage risk from K5 in practice: clearing the storage for one app cleared Imaginer's as well.
  K12 fits: the identity panel's "Clear cookies and site data" clears the whole domain in one action.

## Unclear

- **U5:** When was the gallery last intact on this machine: before or after 2026-09-26 11:29?
  After that time refutes S2 and S5: a removal of the whole origin would have taken the `thinking_machines` databases (K5) too. Only a deletion of Imaginer's data alone would remain, a narrow variant of S1.
  Before that time fits S1, S2 and S5 alike.
  Possible evidence: the newest gallery export on this machine. Its file name `Imaginer_Export_<timestamp>.zip` carries the export time in UTC, and every image file name inside ends with the creation time of the image in Unix seconds.
- **U9:** Is the gallery on the second machine intact? If it is lost too, local causes like S1, S2 and S5 become unlikely.

## Refuted

- **R1:** The 1.12 or 1.13 update deletes data. *Refuted by K1.*
- **R2:** The deployed code differs from the repository. *Refuted by K2.*
- **R3:** The server wipes browser storage with `Clear-Site-Data`. *Refuted by K4.*
- **R5:** The API key in the app at the end of the intro contradicts empty storage. *Refuted by K3: the key was typed into the intro's own key screen.*
- **R6:** The lost gallery still exists under the www origin on this machine. *Refuted by K8.*

## Follow-ups in Notes.md

The general topics the incident raised are tracked in `Notes.md`:

- Shared storage with other apps on the domain: K5, U6, U7, G8, D5.
- Firefox's site-level clearing per base domain: K12, D5.
- Two addresses: K4, K7, K10, K11, S3, S4, U1, U2, U4, G6, D1.
- Interrupted-intro logic: G3, G4, G5, U8, D2.
- Reach of `tabula_rasa()`: G2, D3.
- Eviction by Firefox: G7, D4.
- Intro music: K6, U3, D6.
- The user's general rule on data loss: G1.
