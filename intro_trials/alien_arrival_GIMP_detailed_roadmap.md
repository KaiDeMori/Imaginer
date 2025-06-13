

# Alien Arrival — GIMP Detailed Road-Map

---

## AI Collaboration Notes
- [ ] If any step is ambiguous, AI should prompt the user for clarification.
- [ ] All variables (e.g., `{upscale_factor}`) are defined in the Prerequisites section.
- [ ] Checklist format is used for easy tracking.
- [ ] Tool and version references are explicit.

---

## Scope
Produce a stack of perfectly aligned **and centred** PNG plates—each with a central hole—for an HTML/CSS/JS zoom-through (planet → continent → city).

All procedures rely solely on features present in **GIMP 2.10 / 2.1**.

---



## Step 00: Prerequisites & Tools
- [ ] GIMP 2.10 (or 2.1) installed. `[TOOL: GIMP v2.10]`
- [ ] Plug-in **Export Layers** (bundled).
- [ ] (Optional) Plug-in *Align Visible Layers* (see Appendix A).
- [ ] Source artwork: one raster image (PNG) per zoom level.
- [ ] Set `{upscale_factor}`: An integer (2, 4, ...).

---



## Step 01: Prepare Individual XCF Files (optional)
- [ ] Open each source PNG file.
- [ ] Save as XCF: `01_planet.xcf`, `02_continent.xcf`, `03_city.xcf`, etc.
  - Result: Each zoom level is now an XCF file.

---



## Step 02: Create the Master Alignment Canvas
- [ ] Identify the smallest plate dimensions: `{width} × {height}`.
- [ ] Set `{upscale_factor}` (see Prerequisites).
- [ ] File → **New …**
  - Width: `{width} × {upscale_factor}`
  - Height: `{height} × {upscale_factor}`
  - Fill: *Transparency*
- [ ] Add centre guides:
  - Image → Guides → **New Guide by Percent** → `50%` (horizontal)
  - Repeat for vertical
- [ ] Enable **View → Snap to Guides**

---



## Step 03: Import Every Plate as a Layer
- [ ] File → **Open as Layers …** and select all XCF/PNG plates.
- [ ] Rename layers: `01_planet`, `02_continent`, `03_city`, etc. (**topmost = widest view**)

---



## Step 04: Upscale All Layers (Nearest-Neighbour)
For each layer:
- [ ] Layer → **Scale Layer …**
  - Width = *original width* × `{upscale_factor}`
  - Interpolation: *None / Nearest Neighbour*
  - Click **Scale**

---



## Step 05: Normalise Subjects to a Common Pivot
- [ ] Decide which pixel will be the zoom axis (e.g., the alien city centre).
- [ ] Add a temporary *crosshair* layer or precise guides at that XY coordinate.
- [ ] Activate the **Move** tool (*Move the active layer*).
- [ ] For each layer:
  - Drag or arrow-key-nudge until the subject sits exactly under the crosshair (snapping to guides helps).
  - Lock the layer position (chain-link icon) once aligned.
- [ ] Delete or hide the crosshair when finished.

---



## Step 06: Create Central Hole Masks
Perform on every layer **except** the deepest one.

For each layer (except the deepest):
- [ ] Layer → **Mask → Add Layer Mask …** → *White (full opacity)*
- [ ] Activate the mask thumbnail
- [ ] Draw the desired hole shape with a selection tool *(Ellipse, Rectangle, Free)*
  - Feather: 2–4 %
  - Hold **Ctrl + Shift** while dragging to keep the selection centred on the pivot
- [ ] Edit → **Fill with FG Color** (*black*)
- [ ] Select → **None**
- [ ] Ensure each hole is slightly smaller than the one below it

---



## Step 07: Nesting Check
- [ ] Toggle layer visibility to confirm that deeper plates appear through the holes
- [ ] Layer → **Mask → Disable/Enable Layer Mask** aids inspection

---



## Step 08: Down-scale to Original Sizes (optional)
If final PNGs must match original pixel counts:
- [ ] For each layer, repeat **Layer → Scale Layer …**
  - Set Width and Height to the original values
  - Interpolation: None

---



## Step 09: Export Normalised PNG Plates
- [ ] File → **Export Layers …**
- [ ] Destination folder: select or create `{output_folder}` (e.g., `export/`)
- [ ] Filename pattern: `zoom_%02d.png` (produces `zoom_01.png`, `zoom_02.png`, ...)
- [ ] File type: **PNG**. Disable “Trim layer size”. → **Export**

---



## Step 10: Maintenance Tips
- [ ] Save the master canvas as `zoom_master.xcf`
- [ ] If artwork changes, use the “Replace Layer” plug-in to preserve masks
- [ ] Record the upscale factor in the file name, e.g., `zoom_master_x4.xcf`
- [ ] Keep the temporary crosshair layer hidden (not deleted) so you can realign future revisions rapidly

---



# Appendix A — Auto-alignment Plug-ins (not used now, but noted)
GIMP 2.10 ships with **Filters → Enhance → Align Visible Layers**. Choosing *Translation Only* can automatically stack photographic plates around common features. We are **not** using this in the current workflow, but it remains an option if hand-alignment becomes too time-consuming in later phases.



# Appendix B — JSON Offset Workflow (for future consideration)
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