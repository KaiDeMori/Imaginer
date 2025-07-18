# Region Zoom Revamped - Implementation Plan

## Problem Analysis

The current TRS-Flow approach fails because it tries to force region zoom through the same coordinate system designed for uniform scaling. The region zoom requires:

- Zooming into arbitrary off-center rectangular regions
- Massive scale factors (50x+)
- Complex coordinate transformations
- Translation values that exceed WebGL clip space limits [-1, +1]

**Root Cause**: Using TRS (Translation, Rotation, Scale) system for a fundamentally different operation than it was designed for.

## Solution Strategy

**Abandon TRS integration for region zoom.** Instead, implement a separate rendering path that calculates transformation matrices directly, similar to the working MatrixStack approach.

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

## Expected Benefits

1. **Elimination of coordinate overflow** - no more clip space saturation
2. **Simpler debugging** - direct matrix calculations are easier to trace
3. **Faster implementation** - no untangling of existing conversion logic
4. **Reliable functionality** - based on proven MatrixStack approach

## Implementation Notes

### Matrix Calculation Strategy
- Calculate region center, dimensions, and rotation from corner points
- Compute transformation matrix to map region to full viewport
- Apply identical matrix to both penultimate and final layers
- Set other layers to invisible (alpha = 0)

### Coordinate System Handling
- Work directly in screen/pixel coordinates
- Convert to normalized device coordinates only at final matrix stage
- Avoid intermediate coordinate system conversions

### Animation Integration
- Interpolate between start and target matrices using existing easing
- Maintain frame-by-frame update pattern
- Preserve transition timing from current implementation

## Success Criteria

- Region zoom works without black screen issues
- Smooth animation from final_rotation to region_zoom
- Region properly centers and scales to fill viewport
- No coordinate system overflow or clipping problems
- Clean, maintainable code without TRS conversion complexity

---

**Bottom Line**: Stop trying to force region zoom through TRS system. Implement direct matrix approach as separate rendering path. Keep it simple, keep it working.
