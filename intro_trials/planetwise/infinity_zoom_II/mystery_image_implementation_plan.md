# Mystery Image Implementation Plan

## Current Status Analysis

### What's Complete (Phase 1) ✅
- **Configuration**: `MYSTERY_IMAGE` defined in `infinity_zoom_II_configs.js`
- **Preloader Integration**: `infinity_zoom_preloader.js` loads mystery image separately from layers
- **Texture Creation**: Engine creates `mystery_texture` in `init()` method
- **Placeholder Code**: Comment exists in `render()` method at line 395 for mystery image rendering

### What Needs Implementation (Phase 2)

## Implementation Tasks

### Task 1: Create Mystery Image Module (`mystery_image.js`)
**File**: Currently empty, needs complete implementation

**Functions to implement**:

1. **`calculate_mystery_TRS(alien_layer, region_rect, canvas_width, canvas_height)`**
   - Calculate region center from opposite corners: `(p0 + p2) / 2` for clockwise rectangle
   - Transform region center from alien image pixel space to screen TRS space
   - **CRITICAL**: Calculate region orientation from rectangle edges (NOT alien layer rotation)
   - Apply covering scale logic: `Math.max(screen_width/region_width, screen_height/region_height)`
   - **Key**: Mystery rotation = region_orientation + alien_layer.rotation (compound rotation)
   - Return TRS object for mystery image positioning

2. **`calculate_region_orientation(region_rect)`**
   - Calculate region's intrinsic orientation from rectangle edge vectors
   - Use vector from p0→p1 (top edge of clockwise rectangle) 
   - Apply atan2 with proper Y-axis handling for image coordinates
   - Return angle in radians representing region's tilt relative to image axes
   - **This is independent of alien layer rotation**

3. **`get_region_dimensions(region_rect)`**
   - Calculate region width and height from clockwise rectangle points
   - Return dimensions for covering scale calculation

4. **`calculate_covering_scale(region_width, region_height, screen_width, screen_height)`**
   - Implement covering scale: ensure mystery content fills entire screen region
   - Return scale factor

### Task 2: Modify Engine Render Method (`infinity_zoom_II_engine.js`)
### Task 6: WebGL State Management
**Location**: Engine `render()` method

**Changes needed**:
1. Replace comment `// Render mystery image before final alien layer` with actual implementation
2. Add mystery image rendering before final (alien) layer during main zoom phases
3. Skip mystery rendering during region zoom (handled separately)

**Implementation**:
```javascript
// Check if this is the final alien layer (last layer)
if (i === this.layers.length - 1) {
  // Calculate mystery image TRS synchronized with alien layer
  const region_rect = window.infinity_zoom_II.config.region_zoom.region_rect;
  const mystery_trs = window.infinity_zoom_II.mystery_image.calculate_mystery_TRS(
    layer, 
    region_rect, 
    this.canvas.width, 
    this.canvas.height
  );
  
  // Create temporary mystery layer object for rendering
  const mystery_layer = {
    texture: this.mystery_texture,
    trs: mystery_trs,
    alpha: layer.alpha // Same alpha as alien layer
  };
  
  // Render mystery image first (background)
  this.utils.render_layer(gl, this.program, this.quad_buffer, mystery_layer, this.canvas.width, this.canvas.height);
}
```

### Task 3: Region Axis Alignment (CRITICAL)
**The Missing Piece**: Mystery image must rotate to match the region's tilted orientation

**Problem**: The alien screen region is NOT aligned with the alien image axes. It can be rotated by any arbitrary angle within the alien image. The mystery image must appear as if it's actually displayed ON the tilted screen surface.

**Solution**: **Compound Rotation System**
```
mystery_rotation = region_intrinsic_orientation + alien_layer_rotation
```

**Implementation Details**:

1. **Region Intrinsic Orientation**: Calculate from region rectangle edges
   ```javascript
   // Vector from p0 to p1 (top edge of clockwise rectangle)  
   const dx = region_rect.p1.x - region_rect.p0.x;
   const dy = region_rect.p1.y - region_rect.p0.y;
   const region_orientation = Math.atan2(-dy, dx); // Y-flip for image coords
   ```

2. **Compound Rotation**: Add region tilt to alien rotation
   ```javascript
   const mystery_rotation = region_orientation + alien_layer.trs.rotation;
   ```

3. **Visual Result**: Mystery content appears perfectly aligned with the tilted screen edges, even as the entire alien rotates globally.

**Examples**:
- **debug_grid region**: Perfect square (0° region tilt) → mystery_rotation = 0 + alien_rotation  
- **original region**: Tilted screen (~15° region tilt) → mystery_rotation = 15° + alien_rotation
- **debug_grid_tilted**: 90° rotated square → mystery_rotation = 90° + alien_rotation

**Real Region Data** (from `regions.js`):
```javascript
// debug_grid: Perfect square - no intrinsic rotation
debug_grid: {
  p0: { x: 726, y: 726 }, // top left
  p1: { x: 921, y: 726 }, // top right  
  p2: { x: 921, y: 921 }, // bottom right
  p3: { x: 726, y: 921 }, // bottom left
}

// original: Real alien screen - tilted quadrilateral
original: {
  p0: { x: 1152, y: 1125 }, // origin (top-left)
  p1: { x: 1014, y: 1136 }, // end of top edge (u-axis)
  p2: { x: 1004, y: 1036 }, // far corner (bottom-right)
  p3: { x: 1142, y: 1024 }, // end of left edge (v-axis)
}
```

### Task 4: Coordinate System Integration
**Files**: `mystery_image.js` (new functions)

**Key coordinate transformations**:
1. **Region pixel coordinates** → **Normalized image coordinates** (-1 to +1)
2. **Apply alien layer TRS** → **Screen space coordinates**
3. **Handle Y-axis flip** between image coords (top=0) and WebGL coords (bottom=-1)

**Implementation approach**:
- Build from scratch (no reuse of existing utils functions)
- Direct implementation following the documentation's anti-patterns guidance
- Focus on correctness over code reuse

### Task 5: Region Rectangle Handling
**Data source**: `regions.js` contains predefined regions

**Current regions**:
- `original`: Real alien screen region (tilted quadrilateral)
- `debug_grid`: Perfect square for testing (726,726 to 921,921)
- `debug_grid_tilted`: 90° rotated square

**Implementation notes**:
- Use `debug_grid` region for initial development and testing
- Region points are in clockwise order: p0=top-left, p1=top-right, p2=bottom-right, p3=bottom-left
- Center calculation: `(p0 + p2) / 2` for opposite corners
- Orientation calculation: Vector from p0→p1 for rectangle edge direction

### Task 5: Region Rectangle Handling
**Location**: Engine `render()` method

**Requirements**:
1. **Texture binding order**: Mystery texture → render mystery quad → Alien texture → render alien quad
2. **Alpha blending**: Already enabled in `init_webgl()` with `gl.BLEND` and `gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)`
3. **Proper cleanup**: Ensure texture switches don't interfere

**Implementation**:
- Mystery image renders opaque (background layer)
- Alien image renders with alpha transparency in screen region
- WebGL blending creates portal effect automatically

## Technical Constraints & Guidelines

### Crash Hard and Fast Philosophy
- No defensive coding or null checks
- Direct property access: `region_rect.p0.x`, `alien_layer.trs.scale`
- Let WebGL errors throw immediately
- Browser-first development approach

### Naming Conventions
- Use `loose_snake_case` for all new functions and variables
- Examples: `calculate_mystery_TRS`, `region_center_pixels`, `mystery_scale`
- Keep existing function names unchanged

### Region Rectangle Format
- **Always rectangular** (not arbitrary quadrilateral)
- **Clockwise point order**: p0→p1→p2→p3→p0
- **Center**: Opposite corners (p0 + p2) / 2
- **Dimensions**: Width = |p1.x - p0.x|, Height = |p3.y - p0.y|

## Implementation Order

### Step 1: Mystery Image Module Foundation
1. Create basic structure in `mystery_image.js`
2. Implement region center calculation
3. Implement region dimensions and covering scale
4. Add to `window.infinity_zoom_II.mystery_image` namespace

### Step 2: Engine Integration
1. Modify `render()` method to call mystery image functions
2. Test with debug_grid region (perfect square)
3. Verify mystery texture renders before alien layer

### Step 3: TRS Synchronization
1. Implement coordinate transformations
2. Ensure mystery image moves with alien screen region
3. Test rotation, scaling, and translation synchronization

### Step 4: Covering Scale Refinement
1. Test mystery image fills screen region completely
2. Verify no letterboxing or gaps
3. Ensure proper aspect ratio maintenance

## Expected Visual Result

### Portal Effect Behavior
- Mystery content appears through alien's transparent screen region
- Perfect alignment maintained during zoom/rotation
- Smooth PNG alpha edges create natural transparency boundaries
- Mystery content scales/rotates as if displayed on alien's actual screen

### Animation Phases
1. **Main Zoom**: Mystery image transforms synchronously with alien layer
2. **Region Zoom**: Handled separately by region zoom system (no mystery image changes needed)
3. **Final Hold**: Mystery image frozen in final transformation state

## Files to Modify

### Primary Files
1. **`mystery_image.js`** - Complete implementation (currently empty)
2. **`infinity_zoom_II_engine.js`** - Add mystery rendering in `render()` method (line 395)

### Reference Files (Read Only)
- `infinity_zoom_II_configs.js` - Mystery image path and region configuration
- `regions.js` - Region rectangle definitions
- `infinity_zoom_II_utils.js` - Existing TRS and rendering utilities (don't modify)
- `infinity_zoom_preloader.js` - Already handles mystery image loading

## Testing Strategy

### Phase 1: Basic Integration
- Verify mystery texture loads and renders
- Test with debug_grid region (simple square)
- Ensure no WebGL errors or crashes

### Phase 2: Synchronization
- Test mystery image follows alien transformations
- Verify covering scale fills region completely  
- Check rotation and scaling alignment

### Phase 3: Visual Quality
- Test portal effect with alpha transparency
- Verify smooth edges and proper blending
- Test with different region configurations

## Success Criteria

✅ **Mystery image renders behind alien layer**  
✅ **Perfect synchronization during main zoom phases**  
✅ **Covering scale fills screen region without gaps**  
✅ **CRITICAL: Mystery image aligns with tilted region axes (compound rotation)**  
✅ **Portal effect shows mystery content through transparent alien screen**  
✅ **No performance degradation or WebGL errors**  
✅ **Code follows project conventions (crash hard, loose_snake_case)**

---

*Implementation focus: Phase 2 Main Zoom only. Region zoom integration deferred.*
