# Alien Arrival — GIMP Detailed Road-Map

Scope  
Produce a stack of perfectly aligned PNG plates—each with a central hole—for an HTML/CSS/JS zoom-through (planet -> continent -> city). Procedures rely solely on features present in GIMP 2.10/2.1.

---

## 0. Prerequisites & Tools
- GIMP 2.10 (or 2.1) installed.  
- Plug-in Export Layers (bundled).  
- Source artwork: one raster image (PNG) per zoom level.  
- An integer upscale factor N (2x, 4x, ...).

---

## 1. Prepare Individual XCF Files (optional)
- Open each source PNG.  
- File -> Save As ... -> 01_planet.xcf, 02_continent.xcf, 03_city.xcf, etc.  
- Repeat for every zoom level.

---

## 2. Create the Master Alignment Canvas
- Identify the smallest plate dimensions, W x H.  
- Select an integer upscale factor N.  
- File -> New ...  
  Width: W * N   Height: H * N   Fill: Transparency.  
- Add centre guides: Image -> Guides -> New Guide by Percent -> 50 % (horizontal). Repeat for vertical.  
- Enable View -> Snap to Guides.

---

## 3. Import Every Plate as a Layer
- File -> Open as Layers ... and select all XCF or PNG plates.  
- Rename layers 01_planet, 02_continent, 03_city, etc. (topmost = widest view).

---

## 4. Upscale All Layers (Nearest-Neighbour)
For each layer:  
Layer -> Scale Layer ...  
Width = original width * N (interpolation: None / Nearest Neighbour) -> Scale.

---

## 5. Align Layers
- Activate the Move tool with "Move the active layer".  
- Drag each layer toward the canvas centre; snapping locks to the guides.  
- Use arrow keys for pixel-level nudging.

---

## 6. Create Central Hole Masks
Perform on every layer except the deepest one.

- Layer -> Mask -> Add Layer Mask ... -> White (full opacity).  
- Activate the mask thumbnail.  
- Draw the desired hole shape with a selection tool (Ellipse, Rectangle, Free).  
  Feather: 2–4 %.  
  Ctrl+Shift while dragging keeps the selection centred.  
- Edit -> Fill with FG Color (black).  
- Select -> None.  
- Ensure each hole is slightly smaller than the one below it.

---

## 7. Nesting Check
Toggle layer visibility to confirm that deeper plates appear through the holes.  
Layer -> Mask -> Disable/Enable Layer Mask aids inspection.

---

## 8. Down-scale to Original Sizes (optional)
If final PNGs must match original pixel counts, repeat Layer -> Scale Layer ... for each layer, setting Width and Height to the original values (interpolation: None).

---

## 9. Export PNG Plates
- File -> Export Layers ...  
- Destination folder: select or create export/.  
- Filename pattern: zoom_%02d.png (produces zoom_01.png, zoom_02.png, ...).  
- File type: PNG. Disable "Trim layer size". -> Export.

---

## 10. Maintenance Tips
- Save the master canvas as zoom_master.xcf.  
- If artwork changes, use the "Replace Layer" plug-in to preserve masks.  
- Record the upscale factor in the file name, for example zoom_master_x4.xcf.

---

<DO_NOT_CHANGE>
## Version-Consistency Note (for future conversations)
The assistant that produced this roadmap is trained primarily on **GIMP 2.1**.  As a result, it sometimes "hallucinates" features that do not exist until GIMP 3.0+.  **For this project we intentionally limit ourselves to functionality that is present in GIMP 2.10/2.1**.  Please assume that every step above relies only on those capabilities.  If you discover that a step behaves differently in your actual install (currently **GIMP 3.0.4**), **let the assistant know** so the instructions can be updated accordingly.
</DO_NOT_CHANGE>