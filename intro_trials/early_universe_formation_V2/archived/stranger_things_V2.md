# Early Universe Formation – Strange Asset Behaviour (V2)

This memo collects everything we currently **know**, **suspect**, and **still have to test** about the elusive "sometimes-rotated / sometimes-swapped" cosmic-fog sprite that shows up on reload.

---
## 1. Observations so far

| Reload # | Result | Notes |
|----------|--------|-------|
| ~70 %    | ✅ **Expected** | Same file, upright |
| ~20 %    | 🌀 **Rotated** | Same file name, orientation differs |
| ~10 %    | ❓ **Different file** | A completely different cosmic-fog texture |

*All tests used the *same* seed stored in `localStorage["eu_seed"]` (verified before and after each reload).*

---
## 2. What we have already ruled out

1. **Seed regeneration** – the value in `localStorage` remains unchanged.
2. **Visible calls to `Math.random()`** – a repo-wide search found none in executed code paths.
3. **Rotation inside `UniverseAnimator`** – there is no `ctx.rotate()` nor negative scale factor in the render loop.
4. **Import-order race** – `deterministic_rng.js` is imported *before* any `rand()` usage.

---
## 3. Potential culprits still on the table

| Hypothesis | Why it could matter | Current status |
|------------|--------------------|----------------|
| **Stray canvas transform** in an *un-pasted* helper or debug module | Any `ctx.rotate()` that fires *after* `UniverseAnimator` draws would explain the orientation change. | NOT YET VERIFIED – need to instrument `ctx.getTransform()` assertion. |
| **CSS transform** on `<canvas>` or a parent | A random CSS rule injected by another script could rotate or mirror the entire bitmap. | NOT YET VERIFIED – inspect computed styles when bug appears. |
| **EXIF / chunk orientation** inside PNG | Some browsers occasionally honour obscure orientation chunks; others don’t. Would also explain different file render order. | UNLIKELY but not impossible – inspect PNG metadata. |
| **Extra `rand()` consumption** in an async callback | If a promise resolves in non-deterministic order, the RNG sequence diverges and the *next* `rand()` (for fog pick) returns a different value. | PLAUSIBLE – needs console instrumentation (`console.log(rand())`) right before selection. |
| **Left-over `Math.random()`** advancing the PRNG in a build step | A tool/plugin could rewrite code and inject randomness (e.g. hash seeds). | LOW – build is currently vanilla ES modules. |

---
## 4. Recommended next tests

1. **Matrix assertion**
   ```js
   if (ctx.getTransform) {
     const m = ctx.getTransform();
     if (Math.abs(m.b) > 1e-4 || Math.abs(m.c) > 1e-4) {
       console.error("[Rotation-Watch] Non-zero shear detected", m);
     }
   }
   ```
   Place directly before the `drawImage` call; reload 20×.

2. **Log RNG stream**
   ```js
   console.log("[RNG-trace] next=", rand());
   ```
   – one line per call – to confirm *exactly* how many numbers are consumed before the fog-index pick.

3. **DevTools – Computed Style inspection** when a rotated frame appears. Look for any unexpected `transform` on the `<canvas>` or ancestors.

4. **Check PNG metadata** with a tool like `exiftool`:
   ```bash
   exiftool -a -G -Orientation assets/ai_universe/cosmic_fog/*.png
   ```

5. **Cross-browser sanity sweep** (Chrome, Firefox, Safari) & second machine to rule out GPU/driver quirks.

---
## 5. Interim conclusions

* There is **no smoking gun in the current JavaScript render path** – the rotation must be injected upstream (asset metadata) or downstream (CSS / post-draw canvas transform).
* The occasional *wrong file* suggests that **the deterministic RNG stream is being advanced unpredictably** on some reloads.
* Until we gather more telemetry, the issue is considered *cosmetic* and does **not** block current milestones.

---
## 6. Action items (owner → status)

| Task | Owner | Due | Status |
|------|-------|-----|--------|
| Instrument `ctx.getTransform()` assertion | @dev A | — | ⬜️ Pending |
| Add per-call `rand()` logging | @dev A | — | ⬜️ Pending |
| Inspect CSS transforms when bug manifests | QA team | — | ⬜️ Pending |
| EXIF orientation audit of PNGs | Art pipeline | — | ⬜️ Pending |
| Cross-browser & second-machine test sweep | @dev B | — | ⬜️ Pending |

---

