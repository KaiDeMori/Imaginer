# Infinite Zoom Workflow

## High-Level Workflow

### 1. Concept Overview
- **Goal**: Create seamless zoom transitions from a planet to detailed levels (e.g., continent, city) using stacked image planes.
- **Technique**: Use alpha masks to reveal successive layers during zoom.
- **Desired Output**: Pixel-perfect PNG assets with minimal quality loss.

### 2. Key Steps
1. **Prepare Individual Image Files**:
   - Ensure all images match the specs: 1024×1024 pixels, RGB color space, 8-bit precision, PNG format.
   - Optionally save each image as an XCF file for editing.

2. **Create Master Alignment Canvas**:
   - Use the smallest plate dimensions and upscale by an integer factor (e.g., 4×).
   - Add center guides for alignment.

3. **Import Images as Layers**:
   - Import each image as a layer in the correct order (topmost = widest view).
   - Rename layers for clarity (e.g., `01_planet`, `02_continent`, `03_city`).

4. **Upscale Layers**:
   - Use nearest-neighbor scaling to upscale each layer to the desired resolution.

5. **Create Alpha Masks**:
   - Add central "hole" masks to each layer to reveal the next layer.

6. **Export Final PNGs**:
   - Downscale layers back to original sizes and export as PNGs.

### 3. Automation Goals
- **Maximize Automation**:
   - Use GIMP Python-Fu plug-ins for scripting repetitive tasks.
   - Parameterize input files, upscale factor, output folder, and mask shapes.
- **Minimize Manual Input**:
   - Automate alignment and masking where possible.
   - Allow manual adjustments for creative tasks (e.g., freehand masking).

### 4. Challenges
- **Tool Friction**:
   - Avoid resampling issues during scaling.
   - Streamline repetitive steps using scripts or plug-ins.
- **Runtime Fidelity**:
   - Ensure author-time images remain sharp despite runtime interpolation.

### 5. Example Page
- Create a simple HTML/CSS/JS example to demonstrate the zoom effect.
- Use vanilla JavaScript and CSS for animations.

### 6. Next Steps
- Draft Python-Fu scripts for GIMP automation.
- Prototype the example page with basic zoom functionality.
- Test workflows for efficiency and quality.
