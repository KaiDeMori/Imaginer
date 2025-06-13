# GIMP Workflow — Plate-Based "Infinite Zoom" Preparation

> Purpose: produce a stack of perfectly aligned PNG plates (each with a central “hole”) for our HTML/CSS/JS cinematic zoom.
> This guide assumes **vanilla GIMP 2.10+** on any OS.

-------------------------------------------------------------------------------
## 0. Prerequisites & Tools

1. GIMP 2.10 or newer (menu names below follow 2.10).
2. Plug-in “Export Layers”
   • Included
3. Source artwork
   • One raster image (PNG) per zoom level, already rendered at its *native* pixel dimensions.
4. A calculator (or paper) to pick an **integer upscale factor** (2×, 4×, etc.).

-------------------------------------------------------------------------------
## 1. Prepare Individual XCF Files (optional but clean)

For archival clarity keep each zoom level in its own `.xcf`:

1. Open a source PNG → File ▸ Export As… → cancel → File ▸ Save As → `planet_level.xcf`.
2. Repeat for `continent_level.xcf`, `city_level.xcf`, …
3. Set **Image ▸ Print Size** to any dpi you need for print; the value is *ignored* later by HTML but good to keep.

-------------------------------------------------------------------------------
## 2. Create the “Master Alignment” Canvas

1. Decide the *smallest* plate (in pixels) — e.g. `city_level.png` = 2048×2048.
2. Choose an integer upscale factor *N* big enough for comfortable mask editing (most people pick 4×):
   • 2048 × N = 8192 ⇒ new master canvas 8192×8192.
3. File ▸ New…
   • Width: 8192 px   Height: 8192 px   Fill: Transparency.
4. Add guides for symmetry:
   • Image ▸ Guides ▸ New Guide by Percent → 50 % (horizontal). Repeat for vertical.
   • View ▸ Snap to Guides ✔.

-------------------------------------------------------------------------------
## 3. Import Every Plate as a Layer

1. File ▸ Open as Layers… → shift-click every `.xcf` (or source PNG) → Open.
2. In the **Layers panel** rename them `zoom_00_top`, `zoom_01_next`, … (uppermost = widest view).
3. All imported layers sit at their *original* size, centred at (0,0). We shall upscale them next.

-------------------------------------------------------------------------------
## 4. Upscale All Layers (Nearest-Neighbour)

Reason: edits & feathering are easier and crisper at higher resolution.

For each layer:
1. Select layer.
2. Layer ▸ Scale Layer…
   • Width = original_width × N   (e.g. 2048 → 8192)
   • Interpolation: **None (Nearest Neighbour)**
   • ✓ Scale.

Tip: use the chain icon in the dialog to lock aspect ratio, type the number once.

-------------------------------------------------------------------------------
## 5. Align Layers Perfectly

1. Pick the Move tool (M) → Tool Options: **Move the active layer**.
2. Drag each layer roughly to centre; snap will glue it to the 50 % guides.
3. Fine-tune with arrow keys while holding **Shift** (= 25-px nudge at 8k res).

-------------------------------------------------------------------------------
## 6. Create Central “Hole” Masks

We want each deeper level to show through its parent’s hole.

For every layer *except* the deepest (innermost) one:

1. Activate the layer.
2. Layer ▸ Mask ▸ Add Layer Mask…
   • Initialise Mask to: **White (full opacity)** → Add.
3. Make the mask thumbnail active (click it).
4. Draw the hole shape
   a. Choose **Ellipse Select** (E) or **Free Select** (F) for irregular holes.
   b. Set *Feather* to 2–4 % for soft edges.
   c. Click-drag from centre, press Ctrl+Shift to expand perfectly from centre.
5. Fill selection with **black** (Edit ▸ Fill with FG Color or hit Backspace).
6. Select ▸ None.
7. Optional: View ▸ Show Layer Mask to inspect.
8. Repeat for every higher layer, making each hole *slightly smaller* than the one below so they nest.

Hint: keep a scratch layer filled with a noisy colour below everything; it helps you see the holes.

-------------------------------------------------------------------------------
## 7. Test the Nesting Order Quickly

1. Toggle layer visibility (eye icon) top → bottom to verify that each deeper plate appears through the hole above.
2. Use **Layer ▸ Mask ▸ Disable/Enable Layer Mask** to preview masked vs original.

-------------------------------------------------------------------------------
## 8. Down-scale Layers Back to Original Size (Optional)

If exported PNGs must match the *original* pixel counts, scale back now.

For every layer (mask follows automatically):
1. Layer ▸ Scale Layer…
   • Width = original_width  (= 2048 in example)
   • Interpolation: **None (Nearest Neighbour)**
   • ✓ Scale.

The master canvas can stay oversized — transparent margins don’t hurt export.

-------------------------------------------------------------------------------
## 9. Export Perfectly Aligned PNGs

1. File ▸ Export Layers… (plug-in dialog opens).
2. Destination folder: `export/`.
3. Filename pattern: `zoom_%02d.png`  (gives `zoom_00.png`, `zoom_01.png`, …)
4. File type: **png**. Verify **Trim layer size** is *off* (we need identical canvas).
5. Export.

Check the folder: every PNG should share identical pixel dimensions; deeper levels will look mostly transparent except the centre.

-------------------------------------------------------------------------------
## 10. Quick Browser Smoke Test (optional)

Create `test.html` next to the PNG stack:
```html
<!doctype html>
<style>
body{margin:0;background:#000}
#stage{position:relative;width:100vw;height:100vh;perspective:1200px}
.layer{position:absolute;top:0;left:0;width:100%;height:100%;transform-origin:center}
</style>
<div id="stage">
  <img src="export/zoom_00.png" class="layer" style="transform:translateZ(0px)">
  <img src="export/zoom_01.png" class="layer" style="transform:translateZ(100px)">
  <img src="export/zoom_02.png" class="layer" style="transform:translateZ(200px)">
  <!-- add more -->
</div>
<script>
let t=0;const L=[...document.querySelectorAll('.layer')];
requestAnimationFrame(function ani(){t+=0.005;L.forEach((el,i)=>{
  el.style.transform=`translateZ(${i*150-t*600}px)`;
});requestAnimationFrame(ani);});
</script>
```
Open in a browser; you should glide through the plates.

-------------------------------------------------------------------------------
## 11. Maintenance & Tips

• Save the master canvas as `zoom_master.xcf` — a single file to redo masks later.
• If you change source art: **Layer ▸ Replace Layer** (plug-in) keeps masks intact.
• Document the upscale factor *N* in the XCF name: `zoom_master_×4.xcf`.
• For print-ready composites simply open the original `.xcfs` in Scribus/InDesign; dpi per file survives.

-------------------------------------------------------------------------------
## Appendix A – Handy Shortcuts

B   Brush tool (good for soft-edge mask cleanup)  
Ctrl+I  Invert selection / mask  
Shift+J  Cycle through Move modes  
\| key  Toggle Quick-Mask (great for viewing intricate feather)  

-------------------------------------------------------------------------------
**End of File**
