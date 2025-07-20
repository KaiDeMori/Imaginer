# Mystery Image Implementation Plan - Detailed

## Current State Analysis

**Current Working Implementation:**
- Mystery image renders at scale 0.2, center (0,0) before final alien layer ✅
- Basic dual rendering functioning ✅ 
- Mystery texture loaded and available ✅

**Next Step:** Implement proper region-aligned transformation

## File Analysis

### Core Files (Verified)
- **`infinity_zoom_II_engine.js`** - Main engine with current basic mystery rendering
- **`infinity_zoom_II_utils.js`** - TRS utilities, transformation matrices
- **`infinity_zoom_II_configs.js`** - Configuration including `MYSTERY_IMAGE`
- **`regions.js`** - Region definitions (pixel coordinates in alien image)
- **`region_zoom.js`** - Region zoom config (`region_rect` points to active region)

### Current Mystery Rendering (Line ~396)
```javascript
if (i === this.layers.length - 1) {
  const mystery_trs = this.utils.create_TRS(0, 0, 0.2, 0);
  const mystery_layer = {
    trs: mystery_trs,
    texture: this.mystery_texture,
    alpha: layer.alpha,
  };
  this.utils.render_layer(gl, this.program, this.quad_buffer, mystery_layer, this.canvas.width, this.canvas.height);
}
```

## Implementation Steps

### Step 1: Add Region-to-Screen Transform Function
**Location:** `infinity_zoom_II_utils.js`
**New Function:**
```javascript
// Transform point from image pixel space to screen space using layer's TRS
transform_point_image_to_screen(pixel_x, pixel_y, layer_trs, image_size) {
  // Convert pixel coordinates to normalized image coordinates [-1, 1]
  const norm_x = (pixel_x / image_size) * 2 - 1;
  const norm_y = (pixel_y / image_size) * 2 - 1;
  
  // Apply TRS transformation (rotation, scale, translation)
  const cos_r = Math.cos(layer_trs.rotation);
  const sin_r = Math.sin(layer_trs.rotation);
  
  const rotated_x = norm_x * cos_r - norm_y * sin_r;
  const rotated_y = norm_x * sin_r + norm_y * cos_r;
  
  const scaled_x = rotated_x * layer_trs.scale;
  const scaled_y = rotated_y * layer_trs.scale;
  
  const screen_x = scaled_x + layer_trs.center_x;
  const screen_y = scaled_y + layer_trs.center_y;
  
  return { x: screen_x, y: screen_y };
}
```

### Step 2: Add Mystery TRS Calculation Function  
**Location:** `infinity_zoom_II_engine.js` 
**New Method:**
```javascript
calculate_mystery_image_TRS(alien_layer) {
  const region_rect = window.infinity_zoom_II.config.region_zoom.region_rect;
  
  // Calculate region center in alien image pixel coordinates
  const region_center_x = (region_rect.p0.x + region_rect.p2.x) / 2;
  const region_center_y = (region_rect.p0.y + region_rect.p2.y) / 2;
  
  // Get alien image size (assuming square images)
  const alien_image_size = alien_layer.image.width;
  
  // Transform region center to screen coordinates
  const screen_center = this.utils.transform_point_image_to_screen(
    region_center_x, 
    region_center_y, 
    alien_layer.trs, 
    alien_image_size
  );
  
  // Calculate covering scale for region dimensions
  const region_width = Math.abs(region_rect.p1.x - region_rect.p0.x);
  const region_height = Math.abs(region_rect.p3.y - region_rect.p0.y);
  const covering_scale = Math.max(
    this.canvas.width / region_width, 
    this.canvas.height / region_height
  ) * alien_layer.trs.scale;
  
  return this.utils.create_TRS(
    screen_center.x,
    screen_center.y,
    covering_scale,
    alien_layer.trs.rotation
  );
}
```

### Step 3: Update Mystery Rendering Call
**Location:** `infinity_zoom_II_engine.js` (Line ~396)
**Change:** Replace hardcoded TRS with calculated TRS
```javascript
// Replace this line:
const mystery_trs = this.utils.create_TRS(0, 0, 0.2, 0);

// With this:
const mystery_trs = this.calculate_mystery_image_TRS(layer);
```

## Implementation Details

### Region Coordinate System
- **Input:** Region defined as 4 points in alien image pixel space
  - `p0` (top-left), `p1` (top-right), `p2` (bottom-right), `p3` (bottom-left)
  - Currently using `regions.original` or `regions.debug_grid`
- **Center Calculation:** `(p0 + p2) / 2` gives region center in pixels
- **Size Calculation:** `|p1.x - p0.x|` and `|p3.y - p0.y|` give region dimensions

### Transformation Pipeline
1. **Region center in pixels** → **Normalized image coordinates** ([-1,1] range)
2. **Apply alien layer TRS** → **Screen coordinates** (viewport-relative)
3. **Calculate covering scale** → **Fill transformed region dimensions**
4. **Create mystery TRS** → **Same center, rotation; covering scale**

### Image Size Assumption
- All images are square (1:1 aspect ratio)
- Use `image.width` for normalization calculations
- Fits with project constraint: "ALL images maintain natural aspect ratio ALWAYS"

### Covering Scale Logic
- **Purpose:** Ensure mystery content fills entire screen region (no letterboxing)
- **Formula:** `Math.max(screen_width / region_width, screen_height / region_height)`
- **Scale Factor:** Multiply by `alien_layer.trs.scale` to account for alien's current scale

## Verification Steps

1. **Basic Function:** Mystery content visible through alien screen region
2. **Center Alignment:** Mystery content centered on alien screen region  
3. **Scale Verification:** Mystery content fills region completely (covering behavior)
4. **Rotation Sync:** Mystery rotates with alien layer
5. **Animation Sync:** Mystery follows alien during main zoom phases

## Expected Result

- Mystery image appears "behind" alien's transparent screen region
- Perfect alignment maintained during all TRS transformations
- Mystery content scales to fill the screen region completely
- Portal effect: appears as if looking through alien's actual screen display

## File Modification Summary

**Files to Edit:**
1. `infinity_zoom_II_utils.js` - Add `transform_point_image_to_screen()` function
2. `infinity_zoom_II_engine.js` - Add `calculate_mystery_image_TRS()` method and update rendering call

**No changes needed:**
- Configuration files (mystery image already loaded)
- Region definitions (using existing system)
- WebGL rendering pipeline (reusing existing infrastructure)
