# Region Zoom Revamped - Orthographic Projection Approach

## The Real Solution: MatrixStack's Orthographic System

After analyzing the working MatrixStack version, the solution is **NOT** fragment shader UV transformation. MatrixStack succeeds because it uses **orthographic projection** instead of direct clip space transformation.

### The Core Insight from MatrixStack Analysis

**The problem:** TRS system forces transformations through perspective/clip space where vertices must stay in `[-1, +1]` range

**MatrixStack's solution:** Use orthographic projection (`mat_ortho`) to safely convert screen pixel coordinates to clip space

### Key Architectural Differences

#### Failed TRS Approach (Your Current System)
```javascript
// Vertex positions calculated in clip space - causes overflow
vertex_position = TRS_matrix * quad_corner;  // Can exceed [-1,+1] → Clipped
gl_Position = vec4(vertex_position, 0, 1);
```

#### Working MatrixStack Approach
```javascript
// Vertex positions calculated in screen pixel space - never overflow
vertex_position_pixels = transformation_matrix * image_coordinates;  // Safe pixel values
orthographic_matrix = mat_ortho(screen_width, screen_height);        // Converts pixels→clip
gl_Position = orthographic_matrix * vertex_position_pixels;          // Always safe
```

## MatrixStack Technical Analysis

### 1. Orthographic Projection Matrix
```javascript
function mat_ortho(w, h) {
  return new Float32Array([2 / w, 0, 0, 0, -2 / h, 0, -1, 1, 1]);
}
```

**What this does:**
- Maps screen coordinates `(0,0)` to `(w,h)` → clip space `(-1,-1)` to `(1,1)`
- **Guarantees no coordinate overflow** - screen pixels are always finite
- **Eliminates clipping issues** - orthographic matrix handles conversion safely

### 2. Region Zoom Matrix Construction
```javascript
// MatrixStack builds transformation in screen pixel coordinates
const a_end = mat_mul(
  mat_mul(mat_mul(mat_translate(w * 0.5, h * 0.5), mat_scale(scale_end)), mat_rotate(-region_theta)),
  mat_translate(-center_end.x, -center_end.y)
);

// Then applies orthographic projection to convert to clip space
end_matrix = mat_mul(proj, a_end);
```

### 3. Geometry Setup (Critical Detail)
```javascript
// MatrixStack uses IMAGE PIXEL coordinates for geometry, not clip space
const pos = new Float32Array([0, 0, image_width, 0, 0, image_width, image_width, image_width]);
```

**Key insight:** Quad vertices are in **image pixel coordinates**, not `[-1,+1]` clip space!

### 4. Region Parameter Calculation
```javascript
// Region center in image pixel coordinates
const center_end = {
  x: (region_rect.p0.x + region_rect.p2.x) * 0.5,
  y: (region_rect.p0.y + region_rect.p2.y) * 0.5,
};

// Region dimensions and rotation
const region_w = Math.hypot(vx, vy);
const region_h = Math.hypot(ux, uy);
const region_theta = Math.atan2(vy, vx);

// Scale to fit region in screen (covering logic)
const scale_end = Math.max(w / region_w, h / region_h);
```

### 5. Animation System
```javascript
// TRS interpolation in screen pixel coordinates
const trs = {
  center_x: ease_strategy(trs_start.center_x, trs_end.center_x, t, false),
  center_y: ease_strategy(trs_start.center_y, trs_end.center_y, t, false),
  scale: ease_strategy(trs_start.scale, trs_end.scale, t, false),
  theta: ease_strategy_angle(trs_start.theta, trs_end.theta, t, true),
};

// Build matrix in screen coordinates, then apply orthographic projection
const mat = build_trs_matrix(trs, screen_width, screen_height);
```

## Why MatrixStack Works (Mathematical Proof)

### Coordinate Range Analysis
- **Screen pixel coordinates**: `(0,0)` to `(screen_width, screen_height)` - Always finite
- **Image pixel coordinates**: `(0,0)` to `(image_width, image_height)` - Always finite
- **Region coordinates**: Within image bounds - Always finite
- **Scale factors**: `screen_size / region_size` - Always finite and reasonable

**Result:** No coordinate can ever exceed reasonable bounds → No clipping possible

### Orthographic Conversion Safety
```javascript
// Orthographic matrix maps any finite screen coordinate to valid clip space
orthographic_matrix * finite_screen_coordinate = valid_clip_coordinate  // Always in [-1,+1]
```

## Implementation Plan

### Phase 1: Add Orthographic Matrix System

#### 1.1 Create Orthographic Utility Functions
**Add ALL functions to `region_zoom.js` - NOT to `infinity_zoom_II_utils.js`!**

```javascript
window.infinity_zoom_II.region_zoom = {
  // ... existing properties ...

  // 3x3 matrix multiplication (column-major) - DUPLICATED from MatrixStack
  matrix_multiply_3x3(a, b) {
    const result = new Float32Array(9);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        let sum = 0;
        for (let k = 0; k < 3; k++) {
          sum += a[i + k * 3] * b[k + j * 3];
        }
        result[i + j * 3] = sum;
      }
    }
    return result;
  },

  // Orthographic projection matrix for screen→clip conversion
  create_orthographic_matrix(screen_width, screen_height) {
    return new Float32Array([
      2 / screen_width, 0, 0,
      0, -2 / screen_height, 0,
      -1, 1, 1
    ]);
  },

  // Translation matrix (3x3)
  create_translation_matrix(tx, ty) {
    return new Float32Array([
      1, 0, 0,
      0, 1, 0,
      tx, ty, 1
    ]);
  },

  // Scale matrix (3x3)
  create_scale_matrix(scale) {
    return new Float32Array([
      scale, 0, 0,
      0, scale, 0,
      0, 0, 1
    ]);
  },

  // Rotation matrix (3x3)
  create_rotation_matrix(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return new Float32Array([
      c, s, 0,
      -s, c, 0,
      0, 0, 1
    ]);
  },

  // Build transformation matrix in screen pixel coordinates
  build_screen_space_matrix(center_x, center_y, scale, rotation, screen_width, screen_height) {
    // Step 1: Translation to screen center
    const translate_to_center = this.create_translation_matrix(screen_width * 0.5, screen_height * 0.5);
    
    // Step 2: Scale and rotation
    const scale_matrix = this.create_scale_matrix(scale);
    const rotation_matrix = this.create_rotation_matrix(rotation);
    
    // Step 3: Translation from image center
    const translate_from_center = this.create_translation_matrix(-center_x, -center_y);
    
    // Step 4: Compose transformation (order matters!)
    let result = translate_to_center;
    result = this.matrix_multiply_3x3(result, scale_matrix);
    result = this.matrix_multiply_3x3(result, rotation_matrix);
    result = this.matrix_multiply_3x3(result, translate_from_center);
    
    return result;
  }
};
```

#### 1.2 Region Zoom Separate Rendering Pipeline
**Create new rendering path in `region_zoom.js` that bypasses TRS system:**

```javascript
window.infinity_zoom_II.region_zoom = {
  // ... existing functions ...

  // Region zoom shader sources (3x3 matrices!)
  get_region_vertex_shader_source() {
    return `
      attribute vec2 a_position;  // In image pixel coordinates
      attribute vec2 a_texcoord;
      uniform mat3 u_matrix;      // Screen space + orthographic combined (3x3!)
      varying vec2 v_texcoord;
      
      void main() {
        vec3 pos = u_matrix * vec3(a_position, 1.0);
        gl_Position = vec4(pos.xy, 0, 1);  // Convert 3D→4D for WebGL
        v_texcoord = a_texcoord;
      }
    `;
  },

  get_region_fragment_shader_source() {
    return `
      precision mediump float;
      varying vec2 v_texcoord;
      uniform sampler2D u_texture;
      
      void main() {
        gl_FragColor = texture2D(u_texture, v_texcoord);
      }
    `;
  },

  // Create region zoom shader program (uses engine's WebGL utilities)
  create_region_shader_program(gl) {
    const engine_utils = window.infinity_zoom_II.utils;
    return engine_utils.create_program(
      gl,
      this.get_region_vertex_shader_source(),
      this.get_region_fragment_shader_source()
    );
  }
};
```

#### 1.3 Geometry Buffer for Image Coordinates
```javascript
window.infinity_zoom_II.region_zoom = {
  // ... existing functions ...

  // Create quad in IMAGE PIXEL coordinates (not clip space)
  create_image_pixel_quad_buffer(gl, image_width, image_height) {
    const vertices = new Float32Array([
      0, 0,                    0, 1,  // Bottom-left (pos + uv)
      image_width, 0,          1, 1,  // Bottom-right
      0, image_height,         0, 0,  // Top-left
      image_width, image_height, 1, 0   // Top-right
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    return buffer;
  }
};
```

### Phase 2: Region Zoom State Machine Integration

#### 2.1 Modify Engine Animation Loop
```javascript
// In engine.animate() method
if (this.animation_phase === "region_zoom") {
  // Use separate region zoom renderer - NO TRS system involvement
  window.infinity_zoom_II.region_zoom.update_and_render(now);
} else {
  // Use existing TRS system for all other phases
  this.render(); 
}
```

#### 2.2 Engine→Region Zoom Handoff
```javascript
// Pass final engine state to region zoom initialization
init_region_zoom(engine, now) {
  const final_layer = engine.layers[engine.layers.length - 1];
  
  // Extract engine's final transformation state
  this.start_params = {
    center_x: final_layer.image.width * 0.5,  // Image center
    center_y: final_layer.image.height * 0.5,
    scale: calculate_engine_final_scale(final_layer), // Convert from TRS scale
    rotation: engine.global_rotation
  };
  
  // Calculate target region parameters
  this.target_params = calculate_region_parameters(this.config.region_rect);
  
  this.start_time = now;
}
```

### Phase 3: Region Parameter Calculation

#### 3.1 Region Rectangle Analysis
```javascript
calc_region_parameters(region_rect) {
  const { p0, p1, p2, p3 } = region_rect;
  
  // Region center in image pixel coordinates
  const center_x = (p0.x + p2.x) * 0.5;
  const center_y = (p0.y + p2.y) * 0.5;
  
  // Region dimensions (handle arbitrary quadrilateral)
  const edge1 = { x: p1.x - p0.x, y: p1.y - p0.y };
  const edge2 = { x: p3.x - p0.x, y: p3.y - p0.y };
  const region_width = Math.hypot(edge1.x, edge1.y);
  const region_height = Math.hypot(edge2.x, edge2.y);
  
  // Region rotation from first edge
  const rotation = Math.atan2(edge1.y, edge1.x);
  
  // Scale to fit region in screen (covering scale)
  const screen_width = this.engine.canvas.width;
  const screen_height = this.engine.canvas.height;
  const scale = Math.max(screen_width / region_width, screen_height / region_height);
  
  return { center_x, center_y, scale, rotation };
}
```

### Phase 4: Animation Implementation

#### 4.1 Matrix Interpolation
```javascript
update_region_zoom_animation(now) {
  const elapsed = (now - this.start_time) / this.config.anim_duration;
  const t = Math.min(elapsed, 1.0);
  const eased_t = this.ease_in_out_cubic(t);
  
  // Interpolate transformation parameters in screen space
  const current_params = {
    center_x: this.lerp(this.start_params.center_x, this.target_params.center_x, eased_t),
    center_y: this.lerp(this.start_params.center_y, this.target_params.center_y, eased_t),
    scale: this.lerp(this.start_params.scale, this.target_params.scale, eased_t),
    rotation: this.lerp_angle(this.start_params.rotation, this.target_params.rotation, eased_t)
  };
  
  return current_params;
},

// Linear interpolation
lerp(a, b, t) {
  return a + (b - a) * t;
},

// Angle interpolation with wrap-around
lerp_angle(start_angle, end_angle, t) {
  const TWO_PI = 2 * Math.PI;
  let diff = end_angle - start_angle;
  
  // Normalize to shortest path
  while (diff > Math.PI) diff -= TWO_PI;
  while (diff < -Math.PI) diff += TWO_PI;
  
  return start_angle + diff * t;
}
```

#### 4.2 Rendering
```javascript
render_region_zoom_frame(transformation_params) {
  const gl = this.engine.gl_context;
  
  // Clear canvas
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  // Use region zoom shader program
  gl.useProgram(this.region_program);
  
  // Build transformation matrix in screen pixel coordinates
  const transform_matrix = this.build_screen_space_matrix(
    transformation_params.center_x,
    transformation_params.center_y, 
    transformation_params.scale,
    transformation_params.rotation,
    gl.canvas.width,
    gl.canvas.height
  );
  
  // Apply orthographic projection
  const orthographic = this.create_orthographic_matrix(gl.canvas.width, gl.canvas.height);
  const final_matrix = this.matrix_multiply_3x3(orthographic, transform_matrix);
  
  // Set uniforms
  gl.uniformMatrix3fv(this.u_matrix_location, false, final_matrix);
  
  // Bind texture
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, this.current_layer.texture);
  gl.uniform1i(this.u_texture_location, 0);
  
  // Draw quad
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
```

## Key Architectural Changes

### 1. Dual Rendering System
- **Main zoom phases**: Continue using existing TRS system (works perfectly)
- **Region zoom phase**: Use orthographic system (bypasses TRS limitations)

### 2. Coordinate System Separation
- **TRS system**: Works in normalized viewport coordinates
- **Orthographic system**: Works in screen pixel coordinates → converts to clip space safely

### 3. Matrix Math Requirements
New matrix utilities needed:
- 3x3 matrix multiplication (column-major)
- Translation, scale, rotation matrix creators  
- Orthographic projection matrix
- Matrix composition utilities

### 4. Geometry Changes
- **Main zoom**: Keep existing `[-1,+1]` quad
- **Region zoom**: New quad in image pixel coordinates

## Success Guarantees

### Mathematical Certainty
- Screen pixel coordinates are always finite → No overflow possible
- Orthographic conversion is always valid → No clipping possible
- Same approach as working MatrixStack → Proven to work

### Handles All Region Types
- **Axis-aligned rectangles**: Perfect handling
- **Rotated quadrilaterals**: Full support via rotation matrices
- **Arbitrary regions**: Handled through center/scale/rotation decomposition

## Implementation Priority

1. **Phase 1**: Add orthographic matrix utilities (foundation)
2. **Phase 2**: Create separate region zoom renderer (core functionality)  
3. **Phase 3**: Implement region parameter calculation (handles tilted regions)
4. **Phase 4**: Add animation and engine integration (complete system)

## Risk Mitigation

### No More Clipping Issues
- Orthographic approach mathematically eliminates coordinate overflow
- Screen pixel coordinates never exceed reasonable bounds

### Proven Approach  
- MatrixStack demonstrates this works in production
- Same mathematical foundation, different implementation

### Incremental Testing
- Test each phase independently
- Verify orthographic conversion before animation
- Debug with simple axis-aligned regions first

---

**Bottom Line:** Implement MatrixStack's orthographic projection approach to eliminate clipping issues while handling arbitrary rotated regions.

## Relevant Files

- `region_zoom.js` - Region zoom functionality (will be stripped and rebuilt)
- `infinity_zoom_II_engine.js` - Main engine with animation loop and state machine
- `infinity_zoom_II_utils.js` - Utility functions including TRS and WebGL helpers
- `infinity_zoom_II.html` - Main HTML file with layer configuration
- `infinity_zoom_sequence_screenplay.md` - Animation sequence documentation and requirements. READ THIS if any questions arise!
- `region_zoom_revamped.md` - This implementation plan document

## Fail-Fast Development Rules
- **NO defensive coding**: Let errors throw immediately and visibly
- **NO Node.js patterns**: Pure browser environment, no require/module.exports
- **Crash fast and hard**: Use direct property access, assume objects exist
- **Browser-first**: Use `window`, DOM APIs, and browser globals directly
- **No error handling**: If something is wrong, we want to know immediately via console errors

## Critical Implementation Guidelines

### Namespace Architecture
**All region zoom code goes into `region_zoom.js` - NO EXCEPTIONS!**

**Main Engine Namespaces:**
```javascript
window.infinity_zoom_II.engine          // Main engine
window.infinity_zoom_II.utils           // Main engine utilities (TRS, WebGL basics)
window.infinity_zoom_II.config          // Global configuration
```

**Region Zoom Namespace (Self-Contained):**
```javascript
window.infinity_zoom_II.region_zoom     // Region zoom main object
window.infinity_zoom_II.config.region_zoom  // Region zoom configuration
```

**Utils Handling:**
- **Main engine utils**: `window.infinity_zoom_II.utils` (keep as-is)
- **Region zoom utils**: Add directly to `window.infinity_zoom_II.region_zoom` object
- **NO sharing** between main engine and region zoom utilities to avoid confusion

### Code Separation Philosophy
- **Duplicate code is GOOD** - keeps region zoom completely isolated
- **All region zoom functionality** goes in `region_zoom.js` - shaders, matrices, rendering, everything
- **Main engine** stays untouched except for the animation loop switch
- **No cross-dependencies** - region zoom is self-contained

### Shader Implementation Rules
When implementing shaders, use this exact pattern:

```javascript
// INSIDE region_zoom.js - NOT in utils!
window.infinity_zoom_II.region_zoom = {
  // Shader sources (keep in region_zoom.js)
  get_region_vertex_shader_source() {
    return `
      attribute vec2 a_position;  
      attribute vec2 a_texcoord;
      uniform mat3 u_matrix;      // 3x3 matrix for orthographic!
      varying vec2 v_texcoord;
      
      void main() {
        vec3 pos = u_matrix * vec3(a_position, 1.0);
        gl_Position = vec4(pos.xy, 0, 1);  // Convert 3D result to 4D
        v_texcoord = a_texcoord;
      }
    `;
  },

  get_region_fragment_shader_source() {
    return `
      precision mediump float;
      varying vec2 v_texcoord;
      uniform sampler2D u_texture;
      
      void main() {
        gl_FragColor = texture2D(u_texture, v_texcoord);
      }
    `;
  },

  // Use engine's WebGL utilities by reference
  create_region_shader_program(gl) {
    const engine_utils = window.infinity_zoom_II.utils;
    return engine_utils.create_program(
      gl,
      this.get_region_vertex_shader_source(),
      this.get_region_fragment_shader_source()
    );
  }
};
```

### Matrix System (All in region_zoom.js)
```javascript
window.infinity_zoom_II.region_zoom = {
  // 3x3 matrix utilities (duplicate from MatrixStack - that's OK!)
  matrix_multiply_3x3(a, b) {
    const result = new Float32Array(9);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        let sum = 0;
        for (let k = 0; k < 3; k++) {
          sum += a[i + k * 3] * b[k + j * 3];
        }
        result[i + j * 3] = sum;
      }
    }
    return result;
  },

  create_orthographic_matrix(screen_width, screen_height) {
    return new Float32Array([
      2 / screen_width, 0, 0,
      0, -2 / screen_height, 0,
      -1, 1, 1
    ]);
  },

  // ... all other matrix functions here
};
```


