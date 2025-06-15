---

## GIMP 3 Python Plug-in Migration Details

See: [GIMP 3 API Migration Notes](GIMP/gimp3_api_migration_notes.md)

# AIxGIMP Automation Planning

## Expected Specs for Imported Images
- Size: 1024×1024 pixels (before upscaling)
- Color space: RGB color (GIMP built-in sRGB)
- Precision: 8-bit non-linear integer
- Format: PNG

All images used in the workflow should match these specs for best results.

## File List and Image Directory Requirement
The file list (e.g., `alien_arrival_sequence.txt`) and all referenced images must be in the same directory. Only file names (no directories or paths) should be used in the file list for safety and portability. The import process will always look for images in the same directory as the file list.

**Related:** See also: [alien_arrival_gimp_master_document.md](alien_arrival_gimp_master_document.md)
---

## User Input Summary
These steps require manual user input or creative judgment:
- Image alignment: User aligns each image relative to the previous one before automation continues.
- Freehand masking: User may use the eraser or other tools to hide seams along terrain or coastlines before running the next automation step.

## Purpose
This file will serve as a collaborative planning space for automating the Alien Arrival GIMP workflow. It will track automation goals, script design, open questions, and progress.

---

## Automation Goals
- Maximize automation of the PNG plate workflow using GIMP scripting and AI support.
- Minimize manual steps, except where human judgment or creativity is essential.
- Ensure the process is reproducible and parameterized.

---

## Steps to Automate (from roadmap)
**Upscaling factor for this workflow is set to 4× (e.g., 1024x1024 → 4096x4096).**
- [ ] Step 01: Prepare Individual XCF Files
- [ ] Step 02: Create the Master Alignment Canvas
- [ ] Step 03: Import Every Plate as a Layer
- [ ] Step 04: Upscale All Layers
- [ ] Step 05: Normalise Subjects to a Common Pivot (partially automatable)
- [ ] Step 06: Create Central Hole Masks
- [ ] Step 08: Down-scale to Original Sizes
- [ ] Step 09: Export Normalised PNG Plates

---

## Script Design Ideas
- Use Python-Fu for GIMP scripting (preferred for flexibility and readability).
- Parameterize input files, upscale factor, output folder, pivot coordinates, and mask shapes.
- Modularize scripts for each major step.
- Add prompts or checkpoints for human input where needed (e.g., pivot selection).

---


## Batch Input Decision
## Sample File List
Batch input is specified using a plain text file, with one filename per line. Example:

```
01_planet.png
02_continent.png
03_city.png
```

The automation will read this file to determine the order and selection of input images.
Batch input will be handled using a file list (e.g., text, CSV, or JSON). This approach was chosen because:
- It is the least error-prone to implement (straightforward logic)
- It is easy to check in to git, so any iteration is automatically maintained


## Next Actions
- [ ] Review and finalize automation goals and open questions.
- [ ] Draft a high-level script outline.
- [ ] Identify which steps need user input and how to prompt for it.
- [ ] Design the workflow so the user can align each image relative to the previous one, then trigger automation for the rest of the steps.
- [ ] Ensure the workflow allows for freehand masking (e.g., eraser tool) to hide seams along terrain or coastlines before automation continues.
- [ ] Start prototyping the first script module.

---

## Incremental Layer Addition: Minimal Adjustment Workflow

When adding a new (deeper) image to an existing, aligned stack:

- Only the new image and the mask on the layer directly above it typically need to be updated.
- There is no need to re-align or re-mask the upper layers unless the addition reveals a problem or you want to make further creative changes.
- This approach avoids unnecessary work and keeps the workflow efficient.

**Recommended Steps:**
1. Open the latest XCF file containing your current stack.
2. Import the new image as a new bottom layer.
3. Upscale and align the new layer to match the pivot/feature of the layer above.
4. Adjust the mask on the layer directly above to reveal the new layer as needed.
5. Optionally, review the stack visually to confirm everything looks correct.
6. Export the updated stack as needed.

---

## Collaboration Notes
- Please add ideas, questions, or comments below!

---

<DO_NOT_CHANGE>
## Version-Consistency Note (for future conversations)
The assistant that produced this roadmap is trained primarily on **GIMP 2.1**.  As a result, it sometimes "hallucinates" features that do not exist until GIMP 3.0+.  **For this project we intentionally limit ourselves to functionality that is present in GIMP 2.10/2.1**.  Please assume that every step above relies only on those capabilities.  If you discover that a step behaves differently in your actual install (currently **GIMP 3.0.4**), **let the assistant know** so the instructions can be updated accordingly.
</DO_NOT_CHANGE>