# Codebase Update Progress Checklist
*(Yes, saving a progress-file about updating progress-files is wonderfully ironic.)*

Below is the consolidated "edit-shopping-list" that pin-points every document or source file still carrying outdated check-boxes, TODOs, or narrative comments.  For each file you get the concrete clean-up / update actions that should be carried out—nothing else needs touching.

--------------------------------------------------
1. **multi_layer_animation_progress.md**
   • Section “6 · Final Planet Reveal”
     – Tick the three remaining empty boxes (all are now fully implemented).
   • Section “7 · Performance Guard-Rails”
     – Leave first item ticked, keep ▢ “Cap simultaneous draw calls …” and ▢ “toggle_layer_vis” (still open).
   • Section “8 · Debug / Dev Tooling”
     – Keep remaining boxes empty (features not done).
   • “Done-when checklist”
     – Tick ✔︎ “No flicker …”, ✔︎ “loop stops when planet fills viewport”, ✔︎ “constants not RNG”.

2. **canvas_animation_progress.md**
   • Remove “5 · Clean-up & Polish” – both unchecked boxes can be removed.
   • Remove the sentence that still calls the fog pass a “placeholder”.

3. **deterministic_progress.md**
   • All tasks (1 → 4) are done; tick every ☐, then move file to an “Archived / Resolved” section or add a header note “STATUS: FIX MERGED – file kept for historical reference”.
   • Delete the empty “5 · Clean-up & polishing”sub-list.

4. **stranger_things_V2.md**
   • Add a top banner: “RESOLVED – root cause was non-deterministic Map insertion order; see deterministic_progress.md”.
   • Remove sections 3-6.

5. **universe_tuning_progress.md**
   • Tick ✔︎ “Increased rotation dynamics” (already merged).
   • Tick ✔︎ “Early animation bootstrapping (white overlay)” (implemented).
   • Leave “Off-centre spawn”, “Perceptual Alpha Fall-off”, and the QA checklist items open.

6. **Early_Universe_Formation_Planning_V2.md**
   • Update §5 “Timeline Proposal” to note that distance-fade parameters are now per-layer and implemented.
   • Remove the “White overlay holds ≥1 s” caveat (min-hold logic now exists).
   • Add footnote that planet logic is constant-driven (no RNG).

7. **canvas_animation.js**  (code comment only)
   • Delete the line that still says “// NEW: animation engine” in constructor block (it’s no longer *new*).
   • Remove any “TODO: remove placeholder” notes near FPS sampling.

8. **timeline_engine.js**  (code comment only)
   • Prune the introductory comment: drop the “Task 2 ✓” checklist snippet; keep the factual description only.

9. **universe_fix.md**
   • Remove section “B · Quick tactical fix”.
   • Mark every checkbox in section E except the last three (QA / tweak work) as done.

10. **assets_loading_reloaded.md**
    • Replace the “Max number” table with a note that the generator is live—just bump the numbers when new files land.
    • Remove the long code sample (now redundant).

11. **preloader_ui_progress.md**  – Add a header “COMPLETE – no further action.”

---
