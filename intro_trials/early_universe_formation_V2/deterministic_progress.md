# Deterministic Sprite Selection – Migration Plan

*(This file — **deterministic_progress.md** — is a living checklist that tracks the work required to **derive the candidate fog-sprite list from the canonical `asset_manifest` instead of the `Map` insertion order**.  Completing all tasks below will permanently fix the rare but annoying asset-swap issue described in `stranger_things_V2.md`.)*

---
## 0 · Context

We discovered that the order of keys inside `preloaded_bitmaps` (a `Map`) is **not deterministic** because items are inserted as soon as their individual load-promises settle.  The current logic inside `UniverseAnimator` then converts that `Map` to an array and picks `fog_entries[idx]`.  Since `idx` can be `0` for the current seed, whichever fog texture *finished first* becomes the chosen one → sporadic swaps.

The *bullet-proof* fix is to build the candidate list directly from `asset_manifest`, which is already alphabetically sorted, rather than from the run-time `Map`.  We will still use the `Map` only for the final `ImageBitmap` lookup.

---
## 1 · Task List

### 1 · Expose `asset_manifest` to `canvas_animation.js`
- [x] Add `import { asset_manifest } from "./preloader_module.js";` at the top of `canvas_animation.js`.
- [x] Ensure this does **not** create a circular-dependency problem (it shouldn’t: `preloader_module.js` does not import `canvas_animation.js`).

### 2 · Refactor fog-sprite selection logic
- [x] Replace the current `fog_entries = [...bitmaps_map.entries()].filter(...)` with:
  ```js
  const fog_urls = asset_manifest.filter(url => url.includes("/cosmic_fog/"));
  const idx      = Math.floor(rand() * fog_urls.length);
  const fog_url  = fog_urls[idx];
  const fog_bmp  = bitmaps_map.get(fog_url) || null;
  ```
- [x] Keep an explicit warning if `fog_bmp` is `null` (should only happen if the manifest and preload list ever diverge).
- [x] Remove the now-obsolete variable names (`fog_entries`, etc.) and update log strings.

### 3 · Update internal comments & docstrings
- [x] Inline comment block in `canvas_animation.js` explains that **candidate order derives from the manifest, which is alphabetically sorted and therefore deterministic**.
- [x] Mention that the `rand()` call is the *only* source of variability now.

### 4 · Regression tests / manual verification
- [x] Hard-refresh the page ≥ 20× with a fixed seed and confirm that the console always reports the same fog URL.
- [x] Temporarily log the *second* RNG value (the one used for `idx`) to ensure it remains unchanged across reloads.
- [x] Use `debug_preloader()` to make sure the selected URL is indeed present in `preloaded_bitmaps`.

### 5 · Clean-up & polishing
(this list has to be reworked before we can start it)
- [ ] Delete outdated notes in `stranger_things_V2.md` or mark the issue as *resolved* once verified.
- [ ] Increment the checklist in `canvas_animation_progress.md` (add a new ✓ under *5 · Clean-up & Polish*).

---
## 2 · Timeline & Ownership

| Task | Owner | Target date |
|------|-------|-------------|
| Items 1–2 (code changes) | dev A | **Today** |
| Items 3–4 (tests)        | dev B | +1 day |
| Item 5 (docs / lint)     | dev A | +1 day |

---
## 3 · Done-when checklist
- [x] Reloading with the same seed always yields the **same** fog sprite.
- [x] A different seed produces **different** fog sprites (i.e. variability still works).
- [x] No console warnings/errors introduced by the refactor.

---
© 2024 Early Universe Team – deterministic sprite selection upgrade