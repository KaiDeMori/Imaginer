# Folder Restructuring Roadmap

## The Idea

Move intro entry point from `intro/00/` to root and rename to `intro.html`. Keep main app at root as `index.html`. The `intro/` folder becomes a simple container for phase subfolders. Both entry points use `./` for all shared resources, eliminating all path complexity.

## Current vs Target Structure

**Current:**
- Entry: `intro/00/cinematic_starfield_and_the_great_everywhere_shake.html`
- Main app: `index.html` (root)
- Paths: intro uses `../` and `../../`, app uses `./`

**Target:**
- Entry: `intro.html` (root)
- Main app: `index.html` (root)
- Paths: both use `./` for everything

## Target Directory Structure

```
├── intro.html
├── index.html
├── app.js
├── main.css
├── intro_remote_control.js
├── asset_loader.js
├── browser_detection.js
├── cinematic_bridge.js
├── phase_02_transition.js
├── pre_intro_ui.js
├── intro/
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
├── components/
│   ├── menu_bar.js
│   ├── gallery.js
│   ├── prompt_panel.js
│   ├── resizable_divider.js
│   ├── drop_area_manager.js
│   ├── error_modal.js
│   ├── config_dialog.js
│   ├── config_dialog.css
│   ├── version_message_modal.js
│   ├── version_message_modal.css
│   └── viewer/
│       ├── viewer.js
│       └── viewer.css
├── storage/
│   └── session_store.js
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
- **Move & Rename**: `intro/00/cinematic_starfield_and_the_great_everywhere_shake.html` → `intro.html` (root)
- **Keep**: `intro/00/*.js` files stay in place (they have correct relative paths already)
- **Keep**: `index.html`, `app.js`, `main.css`, `components/`, `storage/`, `intro_remote_control.js` (already at root)

### 2. Path Updates in Intro System

**`intro/00/asset_loader.js`** (stays in intro/00/)
```javascript
// No changes needed - "../" from intro/00/ correctly reaches intro/
```

**`intro/00/phase_02_transition.js`** (stays in intro/00/)
```javascript
// No changes needed - "../03/" from intro/00/ correctly reaches intro/03/
```

**`intro/04/phase_04_transition.js`**
```javascript
// No changes needed - "../04" from intro/00/ correctly reaches intro/04/
```

**`intro/04/infinity_zoom_II_configs.js`**
```javascript
// Change: window.infinity_zoom_II.config.RELATIVE_BASE_DIRECTORY = "../../assets/ai_universe/zoom_images_planete/webp";
// To:     window.infinity_zoom_II.config.RELATIVE_BASE_DIRECTORY = "./assets/ai_universe/zoom_images_planete/webp";
```

### 3. HTML File Updates

**`intro.html`** (renamed and moved to root)
```html
<!-- Font paths stay as: ./fonts/ (already correct) -->
<!-- Audio paths stay as: ./audio/ (already correct) -->
<!-- Script paths change: -->
<!-- From: <script src="browser_detection.js"></script> -->
<!-- To:   <script src="./intro/00/browser_detection.js"></script> -->
<!-- From: <script src="pre_intro_ui.js"></script> -->
<!-- To:   <script src="./intro/00/pre_intro_ui.js"></script> -->
<!-- Firefox icon: -->
<!-- From: src="../../assets/Firefox_logo_2019.svg" -->
<!-- To:   src="./assets/Firefox_logo_2019.svg" -->
```

### 4. Application Entry Point

**`index.html`** (stays at root, no path changes needed)
```html
<!-- All paths already correct: ./main.css, ./app.js, ./components/ etc. -->
```

### 5. Integration Logic

**`index.html`** (add redirect logic)
```javascript
// Change: window.location.href = 'intro/00/cinematic_starfield_and_the_great_everywhere_shake.html';
// To:     window.location.href = './intro.html';
```

**`intro_remote_control.js`** (stays at root)
```javascript
// No changes needed - already uses correct path:
// const response = await fetch(`assets/dummy_pictures/${this.target_filename}`);
```

### 6. Additional File Updates

**`intro/03/preloader_module.js`**
```javascript
// No changes needed - "../../assets/ai_universe" from intro/03/ correctly reaches root assets/
```

**`intro/04/infinity_zoom_II_configs.js`** (display image paths)
```javascript
// No changes needed - "../../assets/" from intro/04/ correctly reaches root assets/
```

**`intro/04/phase_04_transition.js`** (audio path)
```javascript
// No changes needed - "../audio/" from intro/04/ correctly reaches intro/audio/
```

### 7. Main App Asset Loading

**Integration sequence updates** (in intro completion)
```javascript
// Change: history.replaceState(null, '', '../../index.html');
// To:     history.replaceState(null, '', './index.html');
```

**Asset loading paths** (for main app integration)
```javascript
// All main app assets now load from ./ (same root level)
// No complex path transformations needed!
```

### 8. App Component Files

**`components/gallery.js`** (stays at root level)
```javascript
// No changes needed - path already correct from root:
// const path = `assets/dummy_pictures/${String(i).padStart(2, "0")}.png`;
```

**`components/config_dialog.js`** (stays at root level)
```javascript
// No changes needed - imports already correct from root:
// import("../storage/session_store.js")
// import("../static_imports/jszip_loader.js")
```

### 9. Pre-Intro UI Updates

**`intro/00/pre_intro_ui.js`** (stays in intro/00/)
```javascript
// No changes needed - "../../storage/session_store.js" from intro/00/ correctly reaches root storage/
```

**Note:** This is why Option A (only move HTML) works perfectly - all JS files keep their existing correct relative paths!

### 10. Pre-Intro UI Asset Loading

**`intro/00/pre_intro_ui.js`**
```javascript
// Dynamic loading of asset_loader.js needs path update:
// Change: script.src = "asset_loader.js";
// To:     script.src = "./intro/00/asset_loader.js";
```

**Note:** This is loaded dynamically by pre_intro_ui.js, so it needs the updated path