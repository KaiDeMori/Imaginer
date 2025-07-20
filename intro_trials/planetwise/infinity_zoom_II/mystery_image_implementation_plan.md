# Mystery Image Implementation Plan

## Meta-Analysis: Key System Understanding

### Current Coordinate Systems (Critical!)
1. **Image Pixel Space**: Region coordinates like `{x: 726, y: 726}` to `{x: 921, y: 921}` are in alien image pixels
2. **TRS Center Space**: `center_x`, `center_y` in TRS are viewport-relative (-1 to +1, center at 0,0)
3. **WebGL NDC Space**: Final rendering uses normalized device coordinates
4. **Y-Axis**: WebGL uses bottom-up Y, but region coordinates are top-down image pixels

### Current Layer Setup
- **Final layer index**: `layers.length - 1` = index 3 (4th layer)
- **Final layer image**: `100_alien_debug_grid.png`
- **Mystery image**: `alien_display_mystery_image_grid.png`
- **Active region**: `window.infinity_zoom_II.config.region_zoom.region_rect` = `regions.original`

### Current TRS System
- **Scale meaning**: `scale = 1.0` makes image fit to shorter viewport dimension
- **Covering scale**: `Math.max(viewport_width, viewport_height) / Math.min(viewport_width, viewport_height)`
- **Center coordinates**: 0,0 = viewport center, range approximately -1 to +1

## Implementation Steps

### Step 1: Create Region-to-Screen Coordinate Transform Function

**File**: `infinity_zoom_II_utils.js`
**New function**: `transform_region_center_to_screen(region_rect, alien_trs, alien_image_size)`

```javascript
transform_region_center_to_screen(region_rect, alien_trs, alien_image_size) {
  // Calculate region center in image pixel coordinates
  const region_center_pixels = {
    x: (region_rect.p0.x + region_rect.p2.x) / 2,
    y: (region_rect.p0.y + region_rect.p2.y) / 2
  };
  
  // Convert from image pixels to normalized image coordinates (-1 to +1)
  const region_center_normalized = {
    x: (region_center_pixels.x / alien_image_size) * 2 - 1,
    y: -((region_center_pixels.y / alien_image_size) * 2 - 1) // Y-flip for WebGL
  };
  
  // Apply alien's TRS transformation to get screen position
  // This is the complex part - need to apply scale, rotation, translation
  const cos_r = Math.cos(alien_trs.rotation);
  const sin_r = Math.sin(alien_trs.rotation);
  
  // Scale the normalized coordinates by alien's scale
  const scaled_x = region_center_normalized.x * alien_trs.scale;
  const scaled_y = region_center_normalized.y * alien_trs.scale;
  
  // Apply rotation
  const rotated_x = scaled_x * cos_r - scaled_y * sin_r;
  const rotated_y = scaled_x * sin_r + scaled_y * cos_r;
  
  // Apply translation (alien center)
  const final_x = rotated_x + alien_trs.center_x;
  const final_y = rotated_y + alien_trs.center_y;
  
  return { x: final_x, y: final_y };
}
```

### Step 2: Calculate Mystery Image Covering Scale

**File**: `infinity_zoom_II_utils.js`
**New function**: `calc_mystery_covering_scale(region_rect, alien_trs, alien_image_size, viewport_width, viewport_height)`

```javascript
calc_mystery_covering_scale(region_rect, alien_trs, alien_image_size, viewport_width, viewport_height) {
  // Calculate region dimensions in image pixels
  const region_width_pixels = Math.abs(region_rect.p1.x - region_rect.p0.x);
  const region_height_pixels = Math.abs(region_rect.p3.y - region_rect.p0.y);
  
  // Convert to screen space dimensions (accounting for alien's scale)
  const pixel_scale = alien_trs.scale * Math.min(viewport_width, viewport_height);
  const region_width_screen = (region_width_pixels / alien_image_size) * pixel_scale;
  const region_height_screen = (region_height_pixels / alien_image_size) * pixel_scale;
  
  // Calculate covering scale for mystery image to fill the screen region
  const covering_scale_x = viewport_width / region_width_screen;
  const covering_scale_y = viewport_height / region_height_screen;
  
  // Use maximum to ensure coverage (no letterboxing)
  const covering_scale_normalized = Math.max(covering_scale_x, covering_scale_y);
  
  // Convert back to TRS scale units
  return covering_scale_normalized * alien_trs.scale;
}
```

### Step 3: Create Mystery Image TRS Calculator

**File**: `infinity_zoom_II_engine.js`
**New method**: `calculate_mystery_image_TRS(alien_layer)`

```javascript
calculate_mystery_image_TRS(alien_layer) {
  const region_rect = window.infinity_zoom_II.config.region_zoom.region_rect;
  
  // Assume alien image is square (project uses 1:1 images)
  const alien_image_size = alien_layer.image.width; // or alien_layer.image.height
  
  // Get transformed region center in screen coordinates
  const mystery_center = this.utils.transform_region_center_to_screen(
    region_rect, 
    alien_layer.trs, 
    alien_image_size
  );
  
  // Calculate covering scale for mystery image
  const mystery_scale = this.utils.calc_mystery_covering_scale(
    region_rect,
    alien_layer.trs,
    alien_image_size,
    this.canvas.width,
    this.canvas.height
  );
  
  // Create mystery TRS with same rotation as alien
  return this.utils.create_TRS(
    mystery_center.x,
    mystery_center.y,
    mystery_scale,
    alien_layer.trs.rotation
  );
}
```

### Step 4: Update Main Rendering Loop

**File**: `infinity_zoom_II_engine.js`
**Method**: `render()` - modify existing dual rendering code

```javascript
// Replace current hardcoded mystery TRS with calculated one
if (i === this.layers.length - 1) {
  const mystery_trs = this.calculate_mystery_image_TRS(layer);
  const mystery_layer = {
    trs: mystery_trs,
    texture: this.mystery_texture,
    alpha: layer.alpha,
  };
  this.utils.render_layer(gl, this.program, this.quad_buffer, mystery_layer, this.canvas.width, this.canvas.height);
}
```

## Critical Considerations

### Y-Axis Handling (HIGH PRIORITY)
- **Image coordinates**: Y=0 at top, Y increases downward
- **WebGL coordinates**: Y=0 at bottom, Y increases upward
- **TRS coordinates**: Y=0 at center, positive Y upward
- **Fix**: Apply Y-flip when converting image pixels to normalized coordinates

### Aspect Ratio Chain (HIGHEST PRIORITY)
1. **Region rectangle** → **Image pixel coordinates**
2. **Image pixel coordinates** → **Normalized image coordinates (-1 to +1)**
3. **Apply alien TRS transformation** (scale, rotate, translate)
4. **Result in viewport-relative TRS coordinates**

### Transform Order (CRITICAL)
1. **Scale** the region center by alien's scale
2. **Rotate** around origin by alien's rotation
3. **Translate** by alien's center position

### Scale Calculations
- **Alien scale**: Controls how big alien appears in viewport
- **Mystery covering scale**: Must fill transformed region dimensions
- **Viewport dependency**: Both scales must account for viewport aspect ratio

## Testing Checkpoints

### Visual Verification
1. **Static test**: Mystery image appears behind alien screen region when both at scale 1
2. **Scale test**: Mystery content stays aligned as alien scales up/down
3. **Rotation test**: Mystery content rotates with alien
4. **Translation test**: Mystery content moves with alien (if alien ever moves)

### Mathematical Verification
1. **Region center calculation**: Verify transform from image pixels to screen coordinates
2. **Scale calculation**: Verify mystery image covers entire region area
3. **Y-axis consistency**: Check no upside-down artifacts

## Files Modified

1. **`infinity_zoom_II_utils.js`**
   - Add `transform_region_center_to_screen()`
   - Add `calc_mystery_covering_scale()`

2. **`infinity_zoom_II_engine.js`**
   - Add `calculate_mystery_image_TRS()` method
   - Update rendering loop in `render()` method

## Potential Issues

### Image Size Access
- Need `alien_layer.image.width` - verify this property exists
- Alternative: assume square and use viewport dimensions

### Coordinate System Bugs
- Most likely failure point: Y-axis flipping
- Second most likely: incorrect scale factor chain

### Performance
- Additional calculations per frame for final layer only
- Should be negligible impact

This plan addresses the core challenge of transforming region coordinates through the alien's TRS to position the mystery image correctly while maintaining proper aspect ratios and covering scale behavior.
