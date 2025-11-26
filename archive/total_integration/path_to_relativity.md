# Path to Relativity: Intro System Migration Guide

## Executive Summary

The Imaginer intro system uses absolute paths that prevent deployment to different server locations. This guide provides the exact changes needed to convert to relative paths for full portability.

## Current Absolute Paths That Need Fixing

| Constant | Current Value | Location | Usage |
|----------|---------------|----------|-------|
| `ABSOLUTE_BASE_DIRECTORY_INTRO` | `"/Imaginer/intro"` | `asset_loader.js` | CSS, JS, audio loading |
| `ABSOLUTE_BASE_DIRECTORY_PHASE4` | `"/Imaginer/intro/04"` | `phase_04_transition.js` | Phase 4 dependencies |
| `ABSOLUTE_BASE_DIRECTORY` | `"/Imaginer/assets/ai_universe/zoom_images_planete/webp"` | `infinity_zoom_II_configs.js` | Zoom layer images |
| Display image paths | `"/Imaginer/assets/ai_universe/..."` | `infinity_zoom_II_configs.js` | Portal effect images |

## Path Conversion Mappings

**From `/intro/00/` context (main entry point):**
```
"/Imaginer/intro"                                    → "../"
"/Imaginer/intro/04"                                → "../04/"  
"/Imaginer/assets/ai_universe/zoom_images_planete/"  → "../../assets/ai_universe/zoom_images_planete/"
```

## Migration Task List

### asset_loader.js
- [ ] Replace `ABSOLUTE_BASE_DIRECTORY_INTRO = "/Imaginer/intro"` → `RELATIVE_BASE_DIRECTORY_INTRO = "../"`
- [ ] Update string templates: `${ABSOLUTE_BASE_DIRECTORY_INTRO}/${relative_url}` → `${RELATIVE_BASE_DIRECTORY_INTRO}${relative_url}`

### phase_04_transition.js  
- [ ] Replace `ABSOLUTE_BASE_DIRECTORY_PHASE4 = "/Imaginer/intro/04"` → `RELATIVE_BASE_DIRECTORY_PHASE4 = "../04"`
- [ ] Update usage in `load_phase_04_dependencies()` method

### infinity_zoom_II_configs.js
- [ ] Replace `ABSOLUTE_BASE_DIRECTORY = "/Imaginer/assets/ai_universe/zoom_images_planete/webp"` → `RELATIVE_BASE_DIRECTORY = "../../assets/ai_universe/zoom_images_planete/webp"`
- [ ] Convert all `REGION_DISPLAY_IMAGE_PATHS` entries: `"/Imaginer/assets/..."` → `"../../assets/..."`
- [ ] Convert all `MAIN_DISPLAY_IMAGE_PATHS` entries: `"/Imaginer/assets/..."` → `"../../assets/..."`

### infinity_zoom_II_preloader.js
- [ ] Update reference: `window.infinity_zoom_II.config.ABSOLUTE_BASE_DIRECTORY` → `window.infinity_zoom_II.config.RELATIVE_BASE_DIRECTORY`

## What NOT to Change

✅ **Already using relative paths correctly**:
- `"../../assets/ai_universe"` in `preloader_module.js`
- `"../03/preloader_module.js"` dynamic import in `asset_loader.js`  
- `"../03/early_universe_formation_V2.js"` in `phase_02_transition.js`
- Font paths: `../fonts/` in HTML files
- Audio paths: `../audio/` in HTML files

## Key Implementation Facts

- **Main entry point**: `/intro/00/cinematic_starfield_and_the_great_everywhere_shake.html`
- **ES6 imports already work** - resolve relative to `import.meta.url`
- **Dynamic script loading** resolves relative to `document.baseURI`

## Intro Directory Structure

```
intro/
│
├───00/
│       asset_loader.js
│       browser_detection.js
│       cinematic_bridge.js
│       phase_02_transition.js
│       pre_intro_ui.js
│
├───01/
│       cinematic_starfield.css
│       cinematic_starfield.js
│       cinematic_starfield_manager.js
│
├───02/
│       the_great_everywhere_shake.css
│       the_great_everywhere_shake.js
│
├───03/
│       canvas_animation.js
│       deterministic_rng.js
│       early_universe_formation_V2.css
│       early_universe_formation_V2.js
│       layers_model.js
│       preloader_module.js
│       seed_ui_panel.js
│       sprite_instance_manager.js
│       timeline_engine.js
│
├───04/
│       infinity_zoom_debug.js
│       infinity_zoom_II_configs.js
│       infinity_zoom_II_engine.js
│       infinity_zoom_II_featherer.js
│       infinity_zoom_II_preloader.js
│       infinity_zoom_II_utils.js
│       mystery_image_main_zoom.js
│       mystery_image_region_zoom.js
│       phase_04_transition.js
│       regions.js
│       region_zoom.js
│       region_zoom_utils.js
│
├───audio/
│       Also_sprach_Zarathustra.ogg
│       Bach_Air.m4a
│       blip.wav
│
└───fonts/
    ├───Andika/
    ├───Comic_Neue/
    ├───Noto_Sans/
    ├───Orbitron/
    └───Quicksand/
```

cinematic_starfield_and_the_great_everywhere_shake.html is the main entry point!