# Alien Arrival — GIMP Master Document (Workflow & Automation)
_Codename `AIxGIMP`_

---

## Purpose & Scope
This document consolidates all planning, workflow, and automation notes for the Alien Arrival GIMP infinite zoom project. It combines the detailed step-by-step process, automation goals, script design ideas, and open questions into a single, authoritative reference. For all contributors: this is the canonical source for both manual and automated workflow development.

---

## Automation Goals
- Maximize automation of the PNG plate workflow using GIMP scripting and AI support.
- Minimize manual steps, except where human judgment or creativity is essential.
- Ensure the process is reproducible and parameterized.

---

## Script Design Ideas
- Use Python-Fu for GIMP scripting (preferred for flexibility and readability).
- Parameterize input files, upscale factor, output folder, pivot coordinates, and mask shapes.
- Modularize scripts for each major step.
- Add prompts or checkpoints for human input where needed (e.g., pivot selection).

---

## Open Questions / Decisions
- How will the user specify the pivot point for alignment? (Manual, or via config file?)
- What is the preferred way to batch input files (file list, folder scan, etc.?)

---

## Collaboration Notes
- Please add ideas, questions, or comments below!

---

## Detailed Workflow (Step-by-Step)

### Variables
- `{upscale_factor}`: Integer upscale factor (e.g., 2, 4, ...)
- `{output_folder}`: Output directory for exported PNGs (default: `export/`)

### Step 00: Prerequisites & Tools
- [ ] GIMP 2.10 (or 2.1) installed
- [ ] Plug-in **Export Layers** (bundled)
- [ ] (Optional) Plug-in *Align Visible Layers*
- [ ] Source artwork: one raster image (PNG) per zoom level
- [ ] Integer upscale factor `{upscale_factor}` (2 ×, 4 ×, ...)

### Step 01: Prepare Individual XCF Files (optional)
- [ ] Open each source PNG file
- [ ] File → **Save As …** → `01_planet.xcf`, `02_continent.xcf`, `03_city.xcf`, etc.
- [ ] Repeat for every zoom level
  - Result: Each zoom level is now an XCF file

### Step 02: Create the Master Alignment Canvas
1. Identify the smallest plate dimensions, **W × H**
2. Select an integer upscale factor `{upscale_factor}`
3. File → **New …**
   - Width: `W × {upscale_factor}`
   - Height: `H × {upscale_factor}`
   - Fill: *Transparency*
4. Add centre guides:
   - Image → Guides → **New Guide by Percent** → `50 %` (horizontal)
   - Repeat for vertical
5. Enable **View → Snap to Guides**

### Step 03: Import Every Plate as a Layer
- [ ] File → **Open as Layers …** and select all XCF/PNG plates
- [ ] Rename layers `01_planet`, `02_continent`, `03_city`, etc. (**topmost = widest view**)

### Step 04: Upscale All Layers (Nearest-Neighbour)
For each layer:
- [ ] Layer → **Scale Layer …**
- [ ] Set Width = *original width* × `{upscale_factor}` (interpolation: *None / Nearest Neighbour*) → **Scale**

### Step 05: Normalise Subjects to a Common Pivot
1. Decide which pixel will be the zoom axis (e.g. the alien city centre)
2. Drop a temporary *crosshair* layer or add precise guides at that XY coordinate
3. Activate the **Move** tool (*Move the active layer*)
4. For each layer:
   - [ ] Drag or arrow-key-nudge until the subject sits exactly under the crosshair (snapping to the guides helps)
   - [ ] Lock the layer position (chain-link icon) once aligned
5. Delete or hide the crosshair when finished

### Step 06: Create Central Hole Masks
For every layer **except** the deepest one:
1. [ ] Layer → **Mask → Add Layer Mask …** → *White (full opacity)*
2. [ ] Activate the mask thumbnail
3. [ ] Draw the desired hole shape with a selection tool *(Ellipse, Rectangle, Free)*
   - Feather: 2–4 %
   - Hold **Ctrl + Shift** while dragging to keep the selection centred on the pivot
4. [ ] Edit → **Fill with FG Color** (*black*)
5. [ ] Select → **None**
6. [ ] Ensure each hole is slightly smaller than the one below it

### Step 07: Nesting Check
- [ ] Toggle layer visibility to confirm that deeper plates appear through the holes
- [ ] Layer → **Mask → Disable/Enable Layer Mask** aids inspection

### Step 08: Down-scale to Original Sizes (optional)
If final PNGs must match original pixel counts:
- [ ] Repeat **Layer → Scale Layer …** for each layer
- [ ] Set Width and Height to the original values (interpolation: None)

### Step 09: Export Normalised PNG Plates
- [ ] File → **Export Layers …**
- [ ] Destination folder: select or create `{output_folder}`
- [ ] Filename pattern: `zoom_%02d.png` *(produces `zoom_01.png`, `zoom_02.png`, ...)*
- [ ] File type: **PNG**. Disable “Trim layer size”. → **Export**

### Step 10: Maintenance Tips
- [ ] Save the master canvas as `zoom_master.xcf`
- [ ] If artwork changes, use the “Replace Layer” plug-in to preserve masks
- [ ] Record the upscale factor in the file name, e.g. `zoom_master_x{upscale_factor}.xcf`
- [ ] Keep the temporary crosshair layer hidden (not deleted) so you can realign future revisions rapidly

---

## Appendix A — Auto-alignment Plug-ins (not used now, but noted)
GIMP 2.10 ships with **Filters → Enhance → Align Visible Layers**. Choosing *Translation Only* can automatically stack photographic plates around common features. We are **not** using this in the current workflow, but it remains an option if hand-alignment becomes too time-consuming in later phases.

## Appendix B — JSON Offset Workflow (for future consideration)
Instead of baking alignment into the PNGs you may store per-layer offsets in a companion JSON consumed by the JS animation engine:
```json
[
  { "file": "zoom_01.png", "dx":  37, "dy": 12 },
  { "file": "zoom_02.png", "dx": 102, "dy": 79 },
  { "file": "zoom_03.png", "dx":  -4, "dy": -8 }
]
```
At runtime each plate is rendered with
```css
transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(var(--z));
```
We are **currently not adopting** this approach, but the section is preserved for easy switching if project requirements change.

---


<DO_NOT_CHANGE>
## Version-Consistency Note (for future conversations)
The assistant that produced this roadmap is trained primarily on **GIMP 2.1**.  As a result, it sometimes "hallucinates" features that do not exist until GIMP 3.0+.  **For this project we intentionally limit ourselves to functionality that is present in GIMP 2.10/2.1**.  Please assume that every step above relies only on those capabilities.  If you discover that a step behaves differently in your actual install (currently **GIMP 3.0.4**), **let the assistant know** so the instructions can be updated accordingly.
</DO_NOT_CHANGE>