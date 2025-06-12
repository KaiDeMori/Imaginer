# Early Universe Formation – Planning V2

---

## 1. Vision & Storyboard

We want to create a *stand-alone* HTML/CSS/JS page that plays a cinematic "zoom through the early universe" animation, ending on a specific alien planet. The user should experience a smooth parallax-style camera move that continuously dives from large-scale cosmic fog all the way down to a single planetary body.

High-level shot order:
1. **White screen** – stay full white ≥ 1 s.
2. **Fade-out of white overlay** while *cosmic fog* layer is already moving.
3. **Cosmic fog** – approaches camera, scales up, fades out smoothly before reaching the camera using a per-layer distance-based fade window.
4. **Galaxy streams** – same behaviour.
5. **Nebulae** – same behaviour.
6. **Star clusters** – same behaviour but we continue zooming *into* one cluster.
7. **Target planet** appears and fills the viewport, staying opaque when everything else has faded.

The entire sequence must be deterministic, repeatable, and artefact-free.

### Environment Target *(desktop-only)*
• The experience is designed **exclusively for desktop / laptop computers** equipped with mouse and keyboard. No mobile or touch-only optimisation is required.

---

## 2. Assets Overview (full paths + descriptions)

| Layer          | Relative Path(s)                                                                                                                                                                               | Description / Notes                                                             |
|----------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------|
| Cosmic fog     | `assets/ai_universe/cosmic_fog/big_01.png` … `assets/ai_universe/cosmic_fog/big_05.png`                                                                                                        | 5 large, translucent fog sprites—used for the very first parallax pass-through. |
| Galaxy streams | `assets/ai_universe/galaxy_streams/01.png` … `assets/ai_universe/galaxy_streams/04.png`<br>`assets/ai_universe/galaxy_streams/big_01.png` … `assets/ai_universe/galaxy_streams/big_06.png`     | 4 standard + 6 big sweeping galaxy-arm textures for mid-range depth.            |
| Nebulae        | `assets/ai_universe/nebulae/01.png` … `assets/ai_universe/nebulae/09.png`<br>`assets/ai_universe/nebulae/big_01.png` … `assets/ai_universe/nebulae/big_04.png`                                | 9 regular + 4 extra-large coloured nebula clouds for the rich mid-zoom layers. |
| Star clusters  | `assets/ai_universe/star_clusters/big_01.png` … `assets/ai_universe/star_clusters/big_03.png`                                                                                                  | 3 dense star-cluster mattes; we zoom through and finally into one of these.     |
| Planet         | `assets/ai_universe/alien_planet/planet_totale.png`                                                                                                                                            | Final hero planet that fills the screen at the end of the sequence.             |

All assets are transparent PNGs with stars / alpha edges so they can be stacked.

---

## 3. Technical Architecture

| Topic                       | Decision / Notes |
|-----------------------------|------------------|
| **Rendering**               | Begin with **vanilla Canvas 2D** – zero external libraries. If desktop performance drops below 60 fps *after* the shot-flow is final, we may add a thin WebGL fallback. **All images will be converted to `ImageBitmap` after decode for optimal performance and to avoid GC hiccups.** |
| **Page structure**          | Single `early_universe_formation_V2.html`, linked `early_universe_formation_V2.css`, `early_universe_formation_V2.js`. No frameworks, no third-party runtime deps. |
| **Asset preloading**        | `Promise.all` + `new Image().decode()` to ensure decode is done. **After decode, convert each image to `ImageBitmap` using `createImageBitmap()` before use.** White overlay stays until *all* Promises resolve. We measure loading duration → `min(1 s, loadTime)` rule. |
| **Frame / tween engine**    | Custom `requestAnimationFrame` loop with linear interpolation based on `currentTime – startTime`. No GSAP or other animation libraries. |
| **Deterministic randomness**| Custom seeded RNG (e.g. `sfc32`). Seed read from `localStorage.getItem("eu_seed") ?? Date.now()`. Random pool generated once after preload. |
| **Performance guard-rails** | Cap texture size `w = 4096`, `h = 2160`. Use `will-change: transform` CSS where useful. Cull faded-out layers. |

---

## 4. Core Data Structures

```ts
interface LayerConfig {
  name: string;              // "cosmic_fog", ...
  files: string[];           // shuffled deterministically
  zStart: number;            // initial pseudo-Z (parallax)
  zEnd: number;              // final pseudo-Z
  fadeInAt: number;          // 0-1 timeline pos
  fadeOutAt: number;         // 0-1 timeline pos
}

interface FrameState {
  time: number;              // ms since reveal start
  progress: number;          // 0-1 normalized
}
```

All layers share the same master duration (e.g. 25 s). Individual fade/scale windows are offsets within that span.

---

## 5. Timeline Proposal (v1 numbers)

| Segment            | Start (s) | End (s) | Notes                       |
|--------------------|-----------|---------|-----------------------------|
| White hold         | 0         | **1**   | May stretch if assets slow. |
| Cosmic fog         | 1         | 6       | z: 10 → –5, α: 0 → 1 → 0, distance-based fade window (start_z: 10, end_z: –3). |
| Galaxy streams     | 4         | 10      | Overlap 2 s with fog.       |
| Nebulae            | 8         | 14      |                             |
| Star clusters      | 12        | 20      | Zoom continues into cluster |
| Planet focus       | 18        | 25      | Last 2 s hold full opacity  |

`progress = (now – revealStart) / 25 000 ms`.

---

## 6. Parallax / Zoom Maths

We fake 3-D by mapping a pseudo-Z to 2-D scale & velocity:

• Let camera move along +Z axis from 0 to **–Zmax**.  
• Sprite scale = `camZ / (camZ – layerZ)` (standard perspective).  
• Position offset = `(layerZ * parallaxFactor)` for mild XY drift (seeded random angle per sprite).

For Canvas implementation we update each sprite per frame, then paint back-to-front sorted by `layerZ`. For a future WebGL backend, each image would be a textured plane.

---

## 7. Deterministic Randomness – Implementation Details

```js
function sfc32(a, b, c, d) {
  return function() {
    a |= 0; b |= 0; c |= 0; d |= 0;
    let t = (a + b | 0) + d | 0;
    d = d + 1 | 0;
    a = b ^ b >>> 9;
    b = c + (c << 3) | 0;
    c = (c << 21 | c >>> 11);
    c = c + t | 0;
    return (t >>> 0) / 4294967296;
  };
}

const seedStr  = localStorage.getItem("eu_seed") || Date.now().toString();
const seedInts = [...seedStr.match(/.{1,8}/g)].map(s => parseInt(s, 10));
const rand     = sfc32(...seedInts);
```

`rand()` is invoked only once *after* asset load to:
1. Shuffle file order inside each layer.
2. Generate XY offset angles.
3. Generate per-sprite start/end Z nudge.

UI: a small fixed `<div>` shows the current seed, with a **regenerate** button that assigns a new `Date.now()` → `localStorage` → reload.

---

## 8. File Skeleton

```plaintext
early_universe_formation_V2.html
early_universe_formation_V2.css
early_universe_formation_V2.js
preloader_module.js   # Handles image preloading and decoding
seed_ui_panel.js      # Manages seed display and regeneration UI
assets/ (pngs)
```

**early_universe_formation_V2.html**  
• Minimal markup: `<canvas id="universeCanvas"></canvas>` + overlay divs.  
• `<script defer src="early_universe_formation_V2.js"></script>`.

**early_universe_formation_V2.css**  
• `html, body, canvas { width:100%; height:100%; margin:0; overflow:hidden; background:#fff; }`  
• White overlay: `#whiteScreen { position:fixed; inset:0; background:#fff; transition:opacity 1s; }`  
• `will-change: transform;` for canvas or sprite divs.

**early_universe_formation_V2.js**  
1. Preload → decode images.  
2. **Convert all images to `ImageBitmap` after decode.**  
3. Generate random pool.  
4. Build timeline config.  
5. `requestAnimationFrame` master loop.  
6. Handle seed UI.

---

## 9. Risk & Mitigation

| Risk                              | Mitigation                                         |
|-----------------------------------|----------------------------------------------------|
| GC hiccups on large images        | **Convert to `ImageBitmap` after decode.**             |
| Timing drift / dropped frames     | Use delta-time; clamp Δt; pre-render frames ≈ 16 ms |
| Non-deterministic JS engines      | FP decimals fine; we don’t rely on bit-perfect RNG |

Mobile-specific risks have been removed per desktop-only target.

---

## 10. Next Steps

1. Build *preloader* module & seed UI.  
2. Implement Canvas prototype with fog → planet.  
3. Benchmark on a range of desktop GPUs; decide if WebGL fallback is necessary.  
4. Tune timeline durations & layer densities.  
5. QA on Windows, macOS, Linux.  
6. Polish (motion blur, easing, subtle rotation).

---

# Addendum 1

## Project Naming and Casing Standards

### Naming Conventions
• Use **loose_snake_case** for all component, file, variable, and method names (e.g., `menu_bar.js`, `session_store.js`).  
• Retain normal uppercasing for abbreviations (e.g., `DB`, `SQL`) and for standard conventions (e.g., `onMouseDown`).  
• Use proper English words in names whenever possible; avoid abbreviations unless they are standard (e.g., `DB`, `SQL`).

#### Examples
• `open_DB_connection`  
• `save_image_as(image_format)`  
• `handle_SQL_error`  
• `menu_bar.js`  
• `session_store.js`

**Summary:** Use loose_snake_case for all names, keep abbreviations and conventions as normally capitalized, and prefer full English words over abbreviations.

---

## 11. Recent Testing Notes

• Ran ad-hoc performance checks on a low-spec machine accessed via remote desktop.  
• Observed occasional **low-frame-rate warnings** from the UniverseAnimator. These are expected on constrained hardware and can be safely ignored for now.  
• Observed **Hi-DPI mismatch** console warning:
  `DPR 1.5, canvas 1389×904 backing store, expected 1389×905.`  
  Likely caused by atypical OS-level accessibility scaling combined with the remote-desktop session. No action required.  
• Action item: introduce a development flag (e.g., `LOG_PERFORMANCE_WARNINGS`) to silence both warning classes during benchmark runs on weak hardware.  
• No functional regressions detected; sequence plays through to completion.
• The user insists to note the they are very impressed with the overall performance and the features.
