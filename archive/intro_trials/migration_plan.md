# Phase 2 Migration Plan: intro_trials/early_universe_formation_V2/ → intro/03/

## Strategic Analysis

### Things to Look For:
1. **Import statements** - `import { ... } from "./file.js"`
2. **CSS href paths** - `<link rel="stylesheet" href="...">`
3. **Asset paths** - References to `../../assets/` or `../assets/`
4. **Script src paths** - `<script src="...">`
5. **Fetch URLs** - Any `fetch("...")` calls
6. **Image/resource URLs** - Direct file references in code

### Target Structure:
- Source: `intro_trials/early_universe_formation_V2/`
- Destination: `intro/03/`
- Asset path changes: `../../assets/` → `../assets/`

---

## File Analysis

### 1. early_universe_formation_V2.html
**Changes needed after move:**
- CSS href: `early_universe_formation_V2.css` (relative path - no change needed)
- Script src: `early_universe_formation_V2.js` (relative path - no change needed)

**Imports to analyze:**
- None (HTML file)

### 2. early_universe_formation_V2.js
**Changes needed after move:**
- No path changes needed (all imports use relative paths)

**Imports found:**
- `import { load_and_decode_images } from "./preloader_module.js"`
- `import { rand, eu_seed } from "./deterministic_rng.js"`  
- `import { UniverseAnimator } from "./canvas_animation.js"`
- `import "./seed_ui_panel.js"`

### 3. preloader_module.js
**Changes needed after move:**
- Asset base path: `const base = "../assets/ai_universe"` → `const base = "../assets/ai_universe"` (no change needed - already correct for intro/03/)

**Imports found:**
- None (no import statements)

### 4. deterministic_rng.js
**Changes needed after move:**
- No changes needed

**Imports found:**
- None (no import statements)

### 5. canvas_animation.js
**Changes needed after move:**
- No changes needed (all imports use relative paths)

**Imports found:**
- `import { generate_sprite_instances } from "./sprite_instance_manager.js"`
- `import { get_layer_states } from "./timeline_engine.js"`

### 6. seed_ui_panel.js
**Changes needed after move:**
- No changes needed

**Imports found:**
- None (no import statements)

### 7. sprite_instance_manager.js
**Changes needed after move:**
- No changes needed (all imports use relative paths)

**Imports found:**
- `import { rand } from "./deterministic_rng.js"`
- `import { layers_config } from "./layers_model.js"`

### 8. timeline_engine.js
**Changes needed after move:**
- No changes needed (all imports use relative paths)

**Imports found:**
- `import { layers_config } from "./layers_model.js"`

### 9. layers_model.js
**Changes needed after move:**
- No changes needed (all imports use relative paths)

**Imports found:**
- `import { rand } from "./deterministic_rng.js"`
- `import { asset_manifest } from "./preloader_module.js"`

### 10. early_universe_formation_V2.css
**Changes needed after move:**
- No changes needed (pure CSS, no external references found)

**Imports found:**
- None (CSS file)

---

## Summary

### Complete File List to Migrate:
1. `early_universe_formation_V2.html`
2. `early_universe_formation_V2.js` 
3. `early_universe_formation_V2.css`
4. `preloader_module.js`
5. `deterministic_rng.js`
6. `canvas_animation.js`
7. `seed_ui_panel.js`
8. `sprite_instance_manager.js`
9. `timeline_engine.js`
10. `layers_model.js`

### Path Changes Required:
- **NONE!** All imports use relative paths (`./filename.js`)
- Asset path in `preloader_module.js` is already correct (`../assets/ai_universe`)

### Migration Actions:
1. Create `intro/03/` folder
2. Copy all 10 files from `intro_trials/early_universe_formation_V2/` to `intro/03/`
3. Update `intro/asset_loader.js` import path from `../intro_trials/early_universe_formation_V2/preloader_module.js` to `03/preloader_module.js`
4. Update `intro/phase_transition.js` CSS href from `../intro_trials/early_universe_formation_V2/early_universe_formation_V2.css` to `03/early_universe_formation_V2.css`
5. Update `intro/phase_transition.js` import from `../intro_trials/early_universe_formation_V2/early_universe_formation_V2.js` to `03/early_universe_formation_V2.js`

---
