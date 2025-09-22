# Folder Restructuring Roadmap

## The Idea

Move intro entry point from `intro/00/` to `intro/` level and move main app from root to `application/` subfolder. This creates path symmetry where both systems use `../` to reach shared resources, eliminating the current `../../` vs `../` path complexity.

## Current vs Target Structure

**Current:**
- Entry: `intro/00/cinematic_starfield_and_the_great_everywhere_shake.html`
- Main app: `index.html` (root)
- Paths: intro uses `../` and `../../`, app uses `./`

**Target:**
- Entry: `intro/cinematic_starfield_and_the_great_everywhere_shake.html`
- Main app: `application/index.html`
- Paths: both use `../` for shared resources

## Target Directory Structure

```
├── intro/
│   ├── cinematic_starfield_and_the_great_everywhere_shake.html
│   ├── asset_loader.js
│   ├── browser_detection.js
│   ├── cinematic_bridge.js
│   ├── phase_02_transition.js
│   ├── pre_intro_ui.js
│   ├── 01/
│   │   ├── cinematic_starfield.css
│   │   ├── cinematic_starfield.js
│   │   └── cinematic_starfield_manager.js
│   ├── 02/
│   │   ├── the_great_everywhere_shake.css
│   │   └── the_great_everywhere_shake.js
│   ├── 03/
│   │   ├── early_universe_formation_V2.css
│   │   ├── early_universe_formation_V2.js
│   │   ├── preloader_module.js
│   │   ├── canvas_animation.js
│   │   ├── deterministic_rng.js
│   │   ├── layers_model.js
│   │   ├── seed_ui_panel.js
│   │   ├── sprite_instance_manager.js
│   │   └── timeline_engine.js
│   └── 04/
│       ├── infinity_zoom_II_configs.js
│       ├── infinity_zoom_II_engine.js
│       ├── infinity_zoom_II_preloader.js
│       ├── infinity_zoom_II_featherer.js
│       ├── infinity_zoom_II_utils.js
│       ├── phase_04_transition.js
│       ├── regions.js
│       ├── mystery_image_main_zoom.js
│       ├── mystery_image_region_zoom.js
│       ├── region_zoom.js
│       └── region_zoom_utils.js
├── application/
│   ├── index.html
│   ├── app.js
│   ├── main.css
│   ├── intro_remote_control.js
│   ├── components/
│   │   ├── menu_bar.js
│   │   ├── gallery.js
│   │   ├── prompt_panel.js
│   │   ├── resizable_divider.js
│   │   ├── drop_area_manager.js
│   │   ├── error_modal.js
│   │   ├── config_dialog.js
│   │   ├── config_dialog.css
│   │   └── viewer/
│   │       ├── viewer.js
│   │       └── viewer.css
│   └── storage/
│       └── session_store.js
├── assets/
│   ├── ai_universe/
│   │   └── zoom_images_planete/
│   │       ├── webp/
│   │       │   ├── 10_new_planete_fixed.webp
│   │       │   └── …
│   │       └── display_images/
│   │           ├── region_zoom/
│   │           │   ├── Final_recursion.jpg
│   │           │   └── …
│   │           └── main_zoom/
│   │               ├── A_unicorn-dinosaur_1749938156.jpg
│   │               └── …
│   └── dummy_pictures/
│       ├── Final_recursion.jpg
│       └── …
├── fonts/
│   ├── Andika/
│   │   ├── Andika-Regular.ttf
│   │   └── …
│   └── Orbitron/
│       ├── Orbitron-VariableFont_wght.ttf
│       └── …
└── audio/
    ├── Also_sprach_Zarathustra.ogg
    ├── Bach_Air.m4a
    └── blip.wav
```

## Critical Files to Edit

### 1. Move Operations
- **Move**: `intro/00/cinematic_starfield_and_the_great_everywhere_shake.html` → `intro/`
- **Move**: `intro/00/*.js` → `intro/`
- **Move**: `index.html`, `app.js`, `main.css`, `components/`, `storage/` → `application/`
- **Move**: `intro_remote_control.js` → `application/`

### 2. Path Updates in Intro System

**`intro/asset_loader.js`**
```javascript
// Change: const RELATIVE_BASE_DIRECTORY_INTRO = "../";
// To:     const RELATIVE_BASE_DIRECTORY_INTRO = "./";
```

**`intro/phase_02_transition.js`**
```javascript
// Change: css_link.href = "../03/early_universe_formation_V2.css";
// To:     css_link.href = "./03/early_universe_formation_V2.css";
```

**`intro/04/phase_04_transition.js`**
```javascript
// Change: const RELATIVE_BASE_DIRECTORY_PHASE4 = "../04";
// To:     const RELATIVE_BASE_DIRECTORY_PHASE4 = "./04";
```

**`intro/04/infinity_zoom_II_configs.js`**
```javascript
// Change: window.infinity_zoom_II.config.RELATIVE_BASE_DIRECTORY = "../../assets/ai_universe/zoom_images_planete/webp";
// To:     window.infinity_zoom_II.config.RELATIVE_BASE_DIRECTORY = "../assets/ai_universe/zoom_images_planete/webp";
```

### 3. HTML File Updates

**`intro/cinematic_starfield_and_the_great_everywhere_shake.html`**
```html
<!-- Change font paths from ../fonts/ to ../fonts/ -->
<!-- Change audio paths from ../audio/ to ../audio/ -->
<!-- Change script src paths from current to ./ -->
```

### 4. Application Entry Point

**New `application/index.html`**
```html
<!-- Change CSS href from ./main.css to ./main.css -->
<!-- Change script src from ./app.js to ./app.js -->
```

### 5. Integration Logic

**`application/index.html`** (add redirect logic)
```javascript
// Change: window.location.href = 'intro/00/cinematic_starfield_and_the_great_everywhere_shake.html';
// To:     window.location.href = '../intro/cinematic_starfield_and_the_great_everywhere_shake.html';
```

**`application/intro_remote_control.js`**
```javascript
// Change: const response = await fetch(`assets/dummy_pictures/${this.target_filename}`);
// To:     const response = await fetch(`../assets/dummy_pictures/${this.target_filename}`);
```

### 6. Additional File Updates

**`intro/03/preloader_module.js`**
```javascript
// Change: const base = "../../assets/ai_universe";
// To:     const base = "../assets/ai_universe";
```

**`intro/04/infinity_zoom_II_configs.js`** (display image paths)
```javascript
// Change all: "../../assets/ai_universe/zoom_images_planete/display_images/..."
// To:         "../assets/ai_universe/zoom_images_planete/display_images/..."
```

**`intro/04/phase_04_transition.js`** (audio path)
```javascript
// Change: source.src = "../audio/Bach_Air.m4a";
// To:     source.src = "../audio/Bach_Air.m4a"; // (stays same)
```

### 7. Main App Asset Loading

**Integration sequence updates** (in intro completion)
```javascript
// Change: history.replaceState(null, '', '../../index.html');
// To:     history.replaceState(null, '', '../application/index.html');
```

**Asset loading paths** (for main app integration)
```javascript
// Change all main app paths from ../../ to ../application/
```

### 8. App Component Files

**`application/components/gallery.js`**
```javascript
// Change: const path = `assets/dummy_pictures/${String(i).padStart(2, "0")}.png`;
// To:     const path = `../assets/dummy_pictures/${String(i).padStart(2, "0")}.png`;
```

**`application/components/config_dialog.js`**
```javascript
// Change: import("../storage/session_store.js")
// To:     import("./storage/session_store.js")
// Change: import("../static_imports/jszip_loader.js")
// To:     import("./static_imports/jszip_loader.js")
```

### 9. Pre-Intro UI Updates

**`intro/pre_intro_ui.js`**
```javascript
// Change: import("../../storage/session_store.js")
// To:     import("../application/storage/session_store.js")
```