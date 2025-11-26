# Intro Phases Total Integration Evaluation

## Phase 00 – Pre-Intro Shell
- Dynamic loading is doable but wrapped in window-level globals (`asset_loader`, `cinematic_bridge`, `transition_to_phase_2`) and script-tag injection; keeping the existing load order is critical.
- `pre_intro_ui.js` bootstraps itself on `window.load`, assumes DOM IDs exist, and pulls in storage, fonts, and web APIs immediately; we will need to preserve these side effects when embedding inside the main app shell.
- `asset_loader.js` hardcodes `../` paths, performs sequential CSS/JS injection, and imports phase 3 assets via dynamic `import("../03/preloader_module.js")`; we should expect to remap URLs once the entry files move to root.
- Gentle-mode, localStorage defaults, and API key handling are all global state; any total-integration host must load this bundle into an isolated scope or accept that it will touch shared storage.

## Phase 01 – Cinematic Starfield
- The manager (`cinematic_starfield_manager.js`) instantiates immediately on `initialize_starfield`, expects `#cinematic_canvas`, and keeps internal animation state without cleanup hooks beyond `stop_cinematic_sequence`.
- Timing orchestration (`cinematic_starfield.js`) runs via `initialize_starfield` and sets up DOM overlays (`Imagine…` text) plus snapshot hand-off to phase 2; load order must ensure the class definition is ready before the initializer fires.
- Asset needs are handled earlier by phase 00; this phase has no additional network fetches, so once scripts are present we can spin it up on demand.

## Phase 02 – The Great Everywhere Shake
- Implemented as a single global `initialize_shake` that depends on window flags (`gentle_mode`), the starfield snapshot, and `transition_to_phase_2`; it reuses the phase 1 canvas and injects new DOM nodes.
- Runs long-lived `requestAnimationFrame` loops and timeouts; callers must invoke `window.stop_shake_animation` when tearing down to avoid zombie animations.
- CSS is currently assumed to be preloaded; dynamic hosting should either preload `02/the_great_everywhere_shake.css` alongside the script or extend the loader to attach it.

## Phase 03 – Early Universe Formation V2
- Uses ES modules (`import` / `export`), and exposes `initialize_early_universe_v2(canvas, overlay)`, which is already how phase 00 drives it; this makes dynamic loading straightforward if paths are corrected.
- `preloader_module.js` builds URLs with `../../assets/...`; after the restructure we will need to review the base path constant to keep fetches valid when scripts live at root.
- Standalone-mode code (query `?t=`) still executes on module load; it no-ops during integrated flow, but we should confirm that the `window` globals (audio defaults, `window.toggle_anim`) do not clash with main-app logic.

## Phase 04 – Infinity Zoom Transition
- `phase_04_transition.js` coordinates the hand-off by loading a long list of dependency scripts via DOM injection; order matters, and each dependency attaches globals (`window.infinity_zoom_II`, etc.).
- Expects to receive the existing canvas from phase 3, swaps it out for a WebGL canvas, and relies on `localStorage` volume plus `transition_to_phase_4(canvas)` being called at the right moment.
- Music crossover waits on both audio state and engine flags; integrating into the main app requires that nothing else manipulates the shared audio element or the engine’s `animation_phase` state while the promise chain runs.

## Cross-Phase Observations
- Every phase communicates via globals on `window` and shared DOM elements (`cinematic_canvas`, `cinematic_audio`); dynamic loaders must guarantee those handles stay stable during script swaps.
- CSS is sprinkled across phases and mostly loaded manually (phases 0 and 3); aligning on a central preloader (possibly `asset_loader.js`) will simplify future lazy-loading.
- Relative URL assumptions (`../` vs `./intro/`) appear in each phase; once the files live at root the new `./` contract should hold as long as we update the hard-coded strings during the move.
