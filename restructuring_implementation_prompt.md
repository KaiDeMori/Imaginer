# Imaginer Folder Restructuring - Implementation Prompt

## Context

We are restructuring the Imaginer project to solve path complexity issues that prevent proper integration between the intro sequence and the main application. The current structure has the intro entry point deeply nested at `intro/00/` while the main app is at root, creating `../../` vs `../` path management problems across a multi-phase orchestrated system.

## The Solution

Move the intro entry point files from `intro/00/` to project root and rename the main HTML file to `intro.html`. Keep the main app at root as `index.html`. The `intro/` folder becomes a simple container for phase subfolders (01, 02, 03, 04). Both entry points will use `./` for all shared resources.

## Target Structure

```
├── intro.html                  (renamed from cinematic_starfield_and_the_great_everywhere_shake.html)
├── index.html                  (main app - stays at root)
├── app.js
├── main.css
├── intro_remote_control.js
├── asset_loader.js             (moved from intro/00/)
├── browser_detection.js        (moved from intro/00/)
├── cinematic_bridge.js         (moved from intro/00/)
├── phase_02_transition.js      (moved from intro/00/)
├── pre_intro_ui.js             (moved from intro/00/)
├── intro/
│   ├── 01/                     (phase 1 assets)
│   ├── 02/                     (phase 2 assets)
│   ├── 03/                     (phase 3 assets)
│   └── 04/                     (phase 4 assets)
├── components/                 (stays at root)
├── storage/                    (stays at root)
├── assets/                     (stays at root)
├── fonts/                      (stays at root)
└── audio/                      (stays at root)
```

## Implementation Task

Please implement the folder restructuring by:

1. **Moving files** from `intro/00/` to root and renaming the main HTML
2. **Updating all path references** in the moved files and affected intro phase files

Refer to `folder_restructuring_roadmap.md` for the complete list of files and exact path changes needed.

## Key Path Changes Summary

- `intro/00/` scripts now at root: change `../` references to `./intro/`
- Intro phases (01-04): change `../../assets/` to `./assets/`
- Main app integration: change redirect from `intro/00/cinematic_starfield_and_the_great_everywhere_shake.html` to `./intro.html`
- History API: change from `../../index.html` to `./index.html`

## Expected Result

After restructuring, both intro and main app will have clean, simple paths using `./` for all resources, eliminating the current path complexity and enabling seamless integration between the two systems.
