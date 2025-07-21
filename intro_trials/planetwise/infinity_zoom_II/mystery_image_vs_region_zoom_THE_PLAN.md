# Mystery Image Region Zoom Integration - THE PLAN

## Core Concept: Parallel Rendering in Orthographic Space

The region zoom system provides the perfect foundation for mystery image integration. We implement dual-layer rendering where both the alien image and mystery image operate in the same orthographic coordinate system.

## Coordinate System: Image Pixel Space

**Everything operates in image pixel coordinates:**
- Quad vertices: `(0, 0)` to `(image_width, image_height)`  
- Region center: Pixel coordinates within alien image
- Mystery center: Calculated region center in pixel coordinates
- Transformations: Same 3x3 matrix operations for both layers

## Architecture: Dual Shader Programs

### Alien Layer Rendering
- Uses existing `region_program` shader
- Renders alien image with alpha transparency
- Uses region zoom's existing transformation matrices

### Mystery Layer Rendering  
- Uses new `mystery_program` shader (identical to region shader)
- Renders mystery image as background layer
- Uses same orthographic matrices with offset center calculation

## Implementation File Structure

**New Implementation File:** `mystery_image_region_zoom.js`
- Contains all mystery image region zoom functionality
- Completely separate from existing mystery image code
- No dependencies on main zoom coordinate systems
- Clean slate implementation in orthographic space

## Rendering Pipeline

```javascript
render_dual_layer_frame(transformation_params) {
  // Clear canvas
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  // 1. Render mystery image (background)
  render_mystery_layer(mystery_transformation_params);
  
  // 2. Render alien image (foreground with alpha)
  render_alien_layer(alien_transformation_params);
}
```

## Mystery Image Positioning

**Center Calculation:**
- Calculate region rectangle center in alien image pixel coordinates
- Apply covering scale calculation (same as region zoom)
- Use compound rotation: region intrinsic orientation + current rotation

**Transformation Synchronization:**
- Both layers use identical animation timing
- Both layers use same easing functions  
- Mystery layer has offset center, everything else identical

## Key Implementation Steps

### Phase 1: Dual Rendering Setup
1. Create mystery shader program (copy of region shader)
2. Create mystery quad buffer (same dimensions as alien image)
3. Add mystery texture binding to region zoom initialization
4. Modify render pipeline to render both layers

### Phase 2: Mystery Center Calculation
1. Convert region rectangle to pixel coordinates
2. Calculate covering scale for mystery image
3. Apply compound rotation calculation
4. Generate mystery transformation parameters

### Phase 3: Synchronized Animation
1. Use region zoom's existing animation system
2. Apply same interpolation to both layers
3. Offset mystery transformation by calculated region center
4. Maintain perfect synchronization throughout animation

## Technical Benefits

**Unified Coordinate System:**
- No coordinate conversions between systems
- Consistent 3x3 matrix operations
- Same orthographic projection for both layers

**Reuse of Proven System:**
- Leverages working region zoom animation
- Uses tested matrix calculations
- Inherits stable transformation pipeline

**Clean Architecture:**
- Mystery functionality isolated in separate file
- No modification of existing region zoom code
- Clear separation of concerns

---

*Embrace the orthographic universe! 🌌*
