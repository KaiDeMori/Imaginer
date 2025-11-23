# Alien Arrival — Brain-storm Notes
> Focus: planet-to-alien zoom, asset-prep workflow (editing stage only)

## 1. Original Concept
- Seamless zoom from full planet ➜ continent (and beyond) using stacked, flat planes.
- Each plane has a *central “hole”* (alpha mask) through which the next, higher-detail plate is visible.
- During animation: camera moves straight in (orthographic), and successive plates reveal themselves.
- Desire for *pixel-perfect* assets:
  - No quality loss from resampling while preparing the plates.
  - Idea: temporarily upscale both plates to a common multiple of width *and* height (nearest-neighbour, pure pixel duplication), punch the hole, then downscale back to originals—so the shipped PNGs equal the raw renders.
- Editing challenge: mainstream paint tools force resampling or make that workflow clunky.

## 2. Challenges Identified
1. **Tool friction**  
   Most editors default to smooth resampling when changing canvas size; nearest-neighbour / integer-only scaling is hidden or extra steps.
2. **Multiple Zoom Levels**  
   Repeating “up-scale ➜ edit hole ➜ down-scale” for every plate level quickly becomes tedious and error-prone.
3. **Runtime Reality**  
   Even if author-time images remain pristine, the browser will still scale them continuously during the zoom, introducing interpolation anyway.

## 3. Valid Additional Points
A. **Author-time vs. Runtime Fidelity**  
   - One sharp, author-time resample (or none) is visually insignificant compared to the unavoidable runtime transforms, unless the art is strict pixel-art.

B. **If Baked PNGs Remain a Must**  
   - Use a *single* master canvas inside GIMP/Krita/etc.:  
     1. Expand canvas to a common size (no resample).  
     2. Upscale once with Nearest-Neighbour (integer factor).  
     3. Add layer masks to create holes.  
     4. Export each layer back to original resolution.  
   - Automate repetitive steps with ImageMagick or a small script.

C. **Naming Convention (game-dev parlance)**  
   - This approach = “mask-based LOD swap” / “infinite zoom cut-out”.

## 4. Tentative Workflow Decision Points
1. Do we accept a single author-time NN resample?  
   • YES → baked holes viable, minimal quality cost.  
   • NO  → any tools available for this job?

3. Tooling  
# Example page
 - Use the existing animation engine to create an example (html/css/js).
 - The example page will just go from planet to continent continously back and forward.
 
## auto-reload
 - It would be nice to detect if the assets have changed them, but we dont have (or want) node.js since this is a pure page. So this might not be possible.
 - or periodically reload
 - maybe configure VSCode Live Server to check for changes in the assets, since we know it can reload the page under debugging.

## scripts, plugins, helpers
we gonna need some of that, I recon.

__

_FYI: this file is called: `alien_arrival_brainstorm.md`_

_update this file if needed_