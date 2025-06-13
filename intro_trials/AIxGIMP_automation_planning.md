# AIxGIMP Automation Planning

**Related:** See also: [alien_arrival_GIMP_detailed_roadmap.md](alien_arrival_GIMP_detailed_roadmap.md)
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

## Open Questions / Decisions
- How will the user specify the pivot point for alignment? (Manual, or via config file?)
- What is the preferred way to batch input files (file list, folder scan, etc.)?
  
---

## Next Actions
- [ ] Review and finalize automation goals and open questions.
- [ ] Draft a high-level script outline.
- [ ] Identify which steps need user input and how to prompt for it.
- [ ] Design the workflow so the user can align each image relative to the previous one, then trigger automation for the rest of the steps.
- [ ] Ensure the workflow allows for freehand masking (e.g., eraser tool) to hide seams along terrain or coastlines before automation continues.
- [ ] Start prototyping the first script module.

---

## Collaboration Notes
- Please add ideas, questions, or comments below!

---

## Version-Consistency Note (for future conversations)
The assistant that produced this planning file is trained primarily on **GIMP 2.1**. As a result, it sometimes "hallucinates" features that do not exist until GIMP 3.0+. **For this project we intentionally limit ourselves to functionality that is present in GIMP 2.10/2.1**. Please assume that every step above relies only on those capabilities. If you discover that a step behaves differently in your actual install (currently **GIMP 3.0.4**), **let the assistant know** so the instructions and scripts can be updated accordingly.
