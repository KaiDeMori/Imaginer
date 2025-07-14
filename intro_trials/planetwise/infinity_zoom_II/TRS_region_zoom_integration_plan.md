# TRS-Based Region Zoom Integration Plan

## Goal
Integrate region zoom functionality directly into the Infinity Zoom II engine as a new state, using the existing TRS architecture and WebGL pipeline. Replace the standalone texture region zoom module with a clean, integrated solution.

## Concept
At the end of `final_rotation` state, the chill alien is visible at covering scale, rotated, looking at his display device screen. We zoom "into" the alien's screen by transitioning from the current TRS state to a new TRS state where the alien's screen region perfectly fills the viewport with aligned edges.

## Technical Requirements

### 1. Engine Integration
- **New State**: Add `"region_zoom"` as a new state in the engine state machine
- **Trigger**: Activated when `window.infinity_zoom_II.FLAG_initiate_final_reveal = true`
- **Transition**: `final_rotation` → `region_zoom` 
- **Reuse Infrastructure**: Use existing WebGL context, shaders, render pipeline, TRS system

### 2. Region Definition
- **Input Format**: 4 corner points defining the screen rectangle in image coordinates
- **Configuration**: `window.infinity_zoom_II.config.region_zoom.region_rect = {p0, p1, p2, p3}`
- **Coordinate System**: Points are in source image pixels (e.g., for 2048x2048 image)
- **Point Order**: p0=top-left, p1=top-right, p2=bottom-right, p3=bottom-left
- **Region Aspect Ratio**: Arbitrary - determined by the 4 corner points (could be wide, tall, square, etc.)

### 3. TRS Transformation
**Start State (current at end of final_rotation):**
- Current final layer TRS: covering scale, arbitrary rotation, centered
- Extract from final layer: `{center_x, center_y, scale, rotation}`

**End State (target for region zoom):**
- **CRITICAL**: Transform region corner points through current TRS before calculations
- Region center: `(transformed_p0 + transformed_p2) / 2` (average of transformed corners)
- Region dimensions: `width = distance(transformed_p0, transformed_p1)`, `height = distance(transformed_p1, transformed_p2)`
- Region rotation: `atan2(transformed_p1.y - transformed_p0.y, transformed_p1.x - transformed_p0.x)` (angle of transformed top edge)
- Covering scale: `max(viewport_width/region_width, viewport_height/region_height)`
- Target rotation: `0` (align region edges with viewport edges)

#### Covering Behavior with Arbitrary Aspect Ratios
**Challenge**: Two rectangles with arbitrary aspect ratios - region and viewport must achieve covering behavior.

**Abstract Reasoning**:
Covering behavior requires the source rectangle to completely fill the target rectangle, with acceptable overflow. Given two scaling options (width-based and height-based), covering demands the larger scale factor because:
- Larger scale ensures no gaps remain unfilled
- Smaller scale would leave portions of target uncovered
- Overflow is acceptable and expected in covering behavior

**Mental Test Validation**:
- Viewport: Very landscape (1920x540, AR = 3.56)
- Alien display: Portrait (400x800, AR = 0.5)

**Scale Options**:
- Scale by width: `1920/400 = 4.8x` → Region fills viewport width, overflows height
- Scale by height: `540/800 = 0.675x` → Region doesn't fill viewport completely

**Covering Result**: Use larger scale (4.8x) to ensure complete viewport fill with acceptable overflow.

**Code Implementation**:
```javascript
const scale_by_width = viewport_width / region_width;
const scale_by_height = viewport_height / region_height;
const covering_scale = Math.max(scale_by_width, scale_by_height);
```

**Formula Validation**: `max(viewport_width/region_width, viewport_height/region_height)` correctly selects the scale that guarantees complete coverage regardless of aspect ratio combinations.

**Interpolation:**
- Use existing `utils.lerp_TRS()` with `ease_in_out_cubic`
- Duration: `config.region_zoom.anim_duration` (milliseconds)

### 4. Dual Layer Rendering (Penultimate Strategy)
**Two Problems Requiring Penultimate Layer:**
1. **Feathered borders**: Final layer has feathered (semi-transparent) edges that would reveal black background
2. **Rotation corners**: Even without feathering, rotation of final layer alone causes background to appear at corners

**Solution**: Render both penultimate and final layers during region zoom
- **Penultimate layer**: Acts as backdrop, prevents background showing through
- **Final layer**: Rendered on top with feathered edges
- **Identical transforms**: Both layers use the same interpolated TRS (center, scale, rotation)
- **Rotation synchronization**: Both layers must rotate together to maintain alignment
- **Rendering order**: Penultimate first, then final layer

### 5. Layer Management During Region Zoom
- **Visible layers**: Only penultimate (index N-1) and final (index N) layers
- **Alpha values**: Both layers at full alpha (1.0)
- **Occlusion culling**: Disabled (only 2 layers active)
- **TRS updates**: Both layers get identical TRS from interpolation

### 6. Configuration Structure
```javascript
window.infinity_zoom_II.config.region_zoom = {
  anim_duration: 4000, // Animation duration in milliseconds
  region_rect: {
    p0: { x: 1152, y: 1125 }, // Top-left corner
    p1: { x: 1014, y: 1136 }, // Top-right corner  
    p2: { x: 1004, y: 1036 }, // Bottom-right corner
    p3: { x: 1142, y: 1024 }, // Bottom-left corner
  }
};
```

### 7. Implementation Steps
1. **Add region zoom code** to `region_zoom.js`:
   - `update_region_zoom_state(now)` function
   - `calc_region_center(p0, p1, p2, p3)`
   - `calc_region_dimensions(p0, p1, p2, p3)`
   - `calc_region_rotation(p0, p1)`
   - `calc_region_covering_scale(region_width, region_height, viewport_width, viewport_height)`
   - Region TRS calculation and interpolation

2. **Add region zoom state** to `infinity_zoom_II_engine.js`:
   - call `update_region_zoom_state`
   - State transition logic in main `animate()` loop

3. **Modify rendering** for region zoom state:
   - Render only penultimate and final layers
   - Apply identical TRS to both layers
   - Maintain proper rendering order

### 8. Success Criteria
- Smooth transition from final_rotation to region zoom
- No visible background/seams during transition
- Region perfectly fills viewport at end state
- Region edges aligned with viewport edges (no rotation)
- Clean TRS-based architecture
- Reuses existing engine infrastructure
- No duplicate WebGL setup or animation loops

## Notes
- All coordinate calculations assume square source images
- Region rectangle is always rotated within the containing image
- Region rectangle aspect ratio is arbitrary (defined by corner points)
- Region coordinates are in source image space - must transform through current TRS first
- Covering behavior ensures region always fills viewport completely
- Integration maintains all existing performance optimizations
- Source image transformations preserve natural 1:1 aspect ratio
