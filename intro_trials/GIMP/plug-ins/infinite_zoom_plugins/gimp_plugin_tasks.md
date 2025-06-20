# GIMP Step 2 Plugin: Automation Task List

## Purpose
Automate all necessary post-stacking steps for an infinite zoom project in GIMP 2.10, starting from a project file (XCF) and sequence file.

## Task List

1. [x] **Plugin Setup**
    1.1. [x] Create a new Python-Fu plugin for GIMP 2.10 (e.g., `infinite_zoom_step2_automation.py`).
    1.2. [x] Register the plugin with a clear menu entry (e.g., "AIxGIMP/Infinite Zoom Step 2: Automate Layers").
    1.3. [x] Operate on the currently open (active) image in GIMP (use `PF_IMAGE` as the first parameter).

2. [ ] **Validate Project and Sequence File**
    2.1. [ ] Use the currently open image as the project.
    2.2. [ ] Locate and validate the sequence file (`GIMP_infinite_zoom_sequence_files.txt`) in the same directory as the project file (if possible, infer from image metadata or prompt user if needed).
    2.3. [ ] Ensure all referenced PNGs exist in the directory.

3. [x] **Upscale All Layers**
    3.1. [x] For each layer in the project:
        3.1.1. [x] Scale the layer to the target size (e.g., 4096×4096 for 4× upscaling).
        3.1.2. [x] Use nearest-neighbour interpolation.
    3.2. [x] Parameterize the upscale factor (default: 4).

4. [x] **Add Center Guides**
    4.1. [x] Add horizontal and vertical guides at 50% of width and height for alignment.

5. [ ] **(Optional) Alignment Prompt**
    5.1. [ ] Optionally prompt the user to manually align each layer to a common pivot (center or user-defined).
    5.2. [ ] Optionally provide a temporary crosshair or guide layer for visual aid.

6. [ ] **(Optional) Mask Creation**
    6.1. [ ] Optionally create or prompt for central hole masks on each layer.
    6.2. [ ] Allow user to edit masks before proceeding.

7. [ ] **Save and Notify**
    7.1. [ ] Save the updated project file (do not overwrite if already open or locked).
    7.2. [ ] Notify the user of completion and next steps.

8. [x] **Error Handling and User Feedback**
    8.1. [x] Provide clear error messages for missing files, invalid input, or failed operations.
    8.2. [x] Log actions and results for troubleshooting.

9. [x] **Documentation and Comments**
    9.1. [x] Document all functions and major steps in the code.
    9.2. [x] Add usage instructions to the plugin header and menu entry.

---

**Note:** Steps 5 and 6 can be implemented as prompts or semi-automated actions, depending on feasibility and user feedback.
