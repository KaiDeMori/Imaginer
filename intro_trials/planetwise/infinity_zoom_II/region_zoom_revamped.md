# Region Zoom Revamped - Implementation Plan

## Relevant Files

- `region_zoom.js` - Region zoom functionality (will be stripped and rebuilt)
- `infinity_zoom_II_engine.js` - Main engine with animation loop and state machine
- `infinity_zoom_II_utils.js` - Utility functions including TRS and WebGL helpers
- `infinity_zoom_II.html` - Main HTML file with layer configuration
- `infinity_zoom_sequence_screenplay.md` - Animation sequence documentation and requirements
- `region_zoom_revamped.md` - This implementation plan document

## Problem Analysis

The current TRS-Flow approach fails because it tries to force region zoom through the same coordinate system designed for uniform scaling. This creates a fundamental architectural mismatch.

### The Two Different Operations

#### Main Zoom (Works Perfectly with TRS)
```javascript
// TRS excels at this:
trs = { center_x: 0, center_y: 0, scale: 2.0, rotation: 0 }
// "Make everything 2x bigger, centered"
// Values stay reasonable: scale=2.0, center=(0,0)
```

#### Region Zoom (Cannot Work with TRS)
```javascript
// Region zoom needs this:
"Take arbitrarily rotated rectangle and make it fill entire viewport with correct orientation"
// This requires:
// - Large translations to move off-center regions to screen center
// - Large scale factors to zoom into regions  
// - Arbitrary rotation to align tilted region edges with viewport edges
// - Translation values that can exceed WebGL clip space [-1, +1]
```

**Note**: Our debug region `(0,0)→(99,0)→(99,99)→(0,99)` is axis-aligned. Production regions are always rotated.

### The Coordinate Overflow Problem

When forcing region zoom through TRS conversion:

1. **Large translation values needed**: Moving regions to screen center can require large translation values
2. **Arbitrary rotation required**: Production regions can be rotated at any angle
3. **WebGL clip space limits**: Valid range is [-1, +1], region zoom can need values outside this range
4. **Automatic culling**: When transformed vertices exceed clip space, WebGL culls the quad → black screen
5. **Clamping breaks geometry**: Limiting to [-1, +1] prevents culling but affects positioning accuracy

**Note**: Our debug region `p0:(0,0) p1:(99,0) p2:(99,99) p3:(0,99)` is axis-aligned. Production regions are always rotated.

### Three Failed Attempts Pattern

Each previous attempt hit the same wall:
- **Attempt 1**: Coordinate overflow → black screen
- **Attempt 2**: Different coordinate conversions → still overflow  
- **Attempt 3**: Clamping to prevent overflow → wrong geometry positioning

**Root Cause**: Using TRS (Translation, Rotation, Scale) system for a fundamentally different operation than it was designed for.

## Solution Strategy

**Abandon TRS integration for region zoom.** Instead, implement a separate rendering path that calculates transformation matrices directly, similar to the working MatrixStack approach.

### Why MatrixStack Succeeds

The MatrixStack version works because it **doesn't try to force region zoom through the TRS pipeline**. Instead:

```javascript
// MatrixStack approach (working):
if (animation_phase === "region_zoom") {
  // Use completely different renderer - NO TRS conversion
  matrix = calc_region_matrix_directly(region_rect, viewport);
  render_with_matrix(matrix);
} else {
  // Use TRS system for main zoom (perfect for uniform scaling)  
  matrix = TRS_to_matrix(layer.trs);
  render_with_matrix(matrix);
}
```

### The Key Insight: Different Math for Different Problems

- **Main Zoom**: Scale everything uniformly from center → TRS works well
- **Region Zoom**: Show specific rotated rectangular region filling screen → Direct matrix calculation needed

Production regions can involve rotated rectangular areas. The TRS system has limitations handling extreme translation, scaling, and rotation combinations.

### Architectural Lesson

The unified TRS system approach does not work well for region zoom. MatrixStack uses different approaches for different phases.

## Architecture Changes

### Current (Broken) Flow
```
Main Zoom: layers → TRS objects → matrices → render ✓
Region Zoom: region rect → TRS conversion → matrices → render ✗
```

### New (Planned) Flow  
```
Main Zoom: layers → TRS objects → matrices → render ✓
Region Zoom: region rect → direct matrices → render ✓
```

## Implementation Plan

### Phase 1: Clean Slate
1. Strip `region_zoom.js` to bare essentials:
   - **Keep**: region rectangle config (`p0, p1, p2, p3`)
   - **Keep**: animation timing and easing (`ease_in_out_cubic`)
   - **Keep**: state management structure (`init_region_zoom`, `update_region_zoom_state`)
   - **Keep**: basic helper functions (`calc_region_center`, `calc_region_dimensions`, `calc_region_rotation`)
   - **Remove**: All TRS coordinate conversion logic
   - **Remove**: `transform_point_through_TRS` function
   - **Remove**: `calc_region_target_TRS` function  
   - **Remove**: `calc_region_covering_scale` function (will be replaced with direct matrix approach)
   - **Remove**: NDC clamping hacks and test code
   - **Remove**: All debug logging related to TRS conversions

2. Clean up `infinity_zoom_II_engine.js`:
   - **Keep**: All main zoom state logic (working correctly)
   - **Keep**: Valid logging for phase transitions and debugging
   - **Remove**: Region zoom state handling from main animation loop (will be replaced)
   - **Remove**: Any references to TRS-based region zoom in state machine
   - **Add**: Placeholder for new region zoom render path

3. Clean up `infinity_zoom_II_utils.js`:
   - **Keep**: All TRS functions (used by working main zoom)
   - **Keep**: All WebGL utility functions
   - **Keep**: Matrix logging for TRS operations (useful for debugging)
   - **Remove**: Region zoom debug flags and logging (`window.infinity_zoom_II.region_zoom_phase`)
   - **Remove**: TRS matrix logging conditionals tied to region zoom phases
   - **Add**: New matrix utility functions for direct region zoom transformations

4. **Logging Preservation Rule**:
   - Keep all logging that helps debug main zoom phases (intro, hold, main_zoom, final_rotation)
   - Remove WebGL error logging and shader compilation logging
   - Keep performance and timing logs
   - Remove only TRS conversion debugging and region zoom coordinate overflow logs
   - Preserve engine state transition logging

### Phase 2: Direct Matrix Approach
1. Calculate transformation matrices directly from region rectangle
2. Apply matrices to layers without TRS system involvement
3. Use separate render path for region zoom phase

### Phase 3: Integration
1. Modify main animation loop to use different rendering for region zoom
2. Ensure smooth transition from final_rotation to region_zoom
3. Test with simple rectangular regions first

## Key Design Principles

### Separation of Concerns
- **Main zoom phases**: Continue using TRS system (working well)
- **Region zoom**: Use direct matrix calculations (avoid coordinate system conflicts)

### No Coordinate System Mixing
- Avoid converting between viewport-relative NDC and UV space
- Calculate final transformation matrices directly
- Skip intermediate TRS representation entirely

### Pragmatic Architecture
- Accept that different phases need different approaches
- Prioritize working functionality over architectural purity
- Follow MatrixStack pattern that already works

### Fail-Fast Development
- **NO defensive coding**: Let errors throw immediately and visibly
- **NO Node.js patterns**: Pure browser environment, no require/module.exports
- **Crash fast and hard**: Use direct property access, assume objects exist
- **Browser-first**: Use `window`, DOM APIs, and browser globals directly
- **No error handling**: If something is wrong, we want to know immediately via console errors

## The Architectural Insight

### Why We Kept Trying TRS
The TRS approach seemed simpler - one unified system for all transformations.

### The Lesson
Main zoom and region zoom are different operations that may need different approaches.

### Comparison with MatrixStack Success
```javascript
// MatrixStack approach:
if (is_main_zoom) use_TRS_system();
if (is_region_zoom) use_direct_matrices();

// TRS-Flow approach:
always_use_TRS_system(); // ← Problematic for region zoom
```

## Expected Benefits

1. **Elimination of coordinate overflow** - no more clip space saturation
2. **Simpler debugging** - direct matrix calculations are easier to trace
3. **Faster implementation** - no untangling of existing conversion logic
4. **Reliable functionality** - based on proven MatrixStack approach

## Implementation Notes

### Matrix Calculation Strategy
```javascript
// Direct approach (no TRS conversion):
calc_region_transformation_matrix(region_rect, viewport) {
  // 1. Calculate region properties from corner points
  const center = calc_region_center(p0, p1, p2, p3);
  const dimensions = calc_region_dimensions(p0, p1, p2, p3);
  const rotation = calc_region_rotation(p0, p1);
  
  // 2. Compute transformation to map region to viewport
  const scale_factor = calc_covering_scale(dimensions, viewport);
  const translation = calc_centering_offset(center, viewport);
  
  // 3. Build WebGL matrix directly
  return build_webgl_matrix(translation, scale_factor, rotation);
}
```

### Coordinate System Handling
- **Work in screen/pixel coordinates**: Avoid coordinate system conversions
- **Single conversion step**: Screen coordinates → WebGL matrix (at final stage only)
- **No intermediate representations**: Skip TRS, UV space, NDC conversions entirely

### Failed vs Working Approaches
```javascript
// FAILED: TRS approach
region_rect → convert_to_TRS() → TRS_to_matrix() → webgl_matrix
//              ↑ FAILS HERE ↑

// WORKING: Direct approach  
region_rect → calc_region_matrix_directly() → webgl_matrix
//            ↑ WORKS ↑
```

### Animation Integration
- **Matrix interpolation**: `lerp_matrix(start_matrix, target_matrix, t)`
- **Same easing function**: Continue using `ease_in_out_cubic`
- **Direct application**: Apply interpolated matrices to layers without TRS conversion

## Success Criteria

- Region zoom works without black screen issues
- Smooth animation from final_rotation to region_zoom
- Rotated regions properly center and scale to fill viewport
- No coordinate system overflow or clipping problems
- Clean, maintainable code without TRS conversion complexity

---

**Bottom Line**: Implement direct matrix approach as separate rendering path for region zoom.
