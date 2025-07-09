
# Infinity Zoom V1 – Key Code Snippets for Porting

This file collects minimal, well-commented code fragments from the original Infinity Zoom V1 project. Each snippet is labeled by concept and references the original file and line numbers for traceability. Use these as a reference for re-architecting Infinity Zoom II.

---

## Constants

### Minimum Render Size
**Purpose:** Only render layers above a certain pixel size.

```js
// infinity_zoom_webgl_engine.js, line 1
const INFINITY_ZOOM_MINIMUM_RENDER_SIZE = 3;
```

---

### Feather Value
**Purpose:** Centralize the feather value for all feathering logic.

```js
// (Recommended for V2) Define at the top of your engine file
const INFINITY_ZOOM_FEATHER_VALUE = 0.08;
```

---

### Feather Minimum Pixels
**Purpose:** Minimum feather in pixels for edge alpha ramp.

```js
// infinity_zoom_webgl_engine.js, used as default in functions
const INFINITY_ZOOM_FEATHER_MIN_PX = 2;
```

---

### Global Rotation Speed
**Purpose:** Set rotation speed (default: 1 rotation per 2 minutes).

```js
// infinity_zoom_webgl_engine.js, line 104
INFINITY_ZOOM_ROTATION_SPEED: Math.PI / 60,
```

---

### Global Zoom Speed
**Purpose:** Controls the exponential zoom rate for all layers.

```js
// infinity_zoom_webgl_engine.js, engine property
INFINITY_ZOOM_SPEED: 2,
```

---

## Layer Covers Viewport (with Feather)
**Purpose:** Check if a layer fully covers the viewport, including feathered border.

```js
// infinity_zoom_webgl_engine.js, lines 7–18 (modified for V2)
function layer_covers_viewport_with_feather(img, canvas, scale, feather_percent = INFINITY_ZOOM_FEATHER_VALUE, feather_min_px = 2) {
   const min_dim = Math.min(canvas.width, canvas.height);
   const draw_size = scale * min_dim;
   const feather_px = Math.max(feather_min_px, Math.max(canvas.width, canvas.height) * feather_percent);
   return (draw_size - 2 * feather_px) >= canvas.width && (draw_size - 2 * feather_px) >= canvas.height;
}
```

---

## Feathering in Fragment Shader
**Purpose:** Alpha ramp at edges for smooth transitions.

```glsl
// infinity_zoom_webgl_engine.js, lines 38–48 (fragment shader, use uniform for feather)
float min_edge = min(min(v_texcoord.x, 1.0 - v_texcoord.x), min(v_texcoord.y, 1.0 - v_texcoord.y));
float feather = u_feather; // Set from INFINITY_ZOOM_FEATHER_VALUE in JS
float edge_alpha = 1.0;
if (min_edge < feather) {
  edge_alpha = min_edge / feather;
}
vec4 color = texture(u_image, v_texcoord);
outColor = vec4(color.rgb, color.a * edge_alpha);
```

---

## Rotation Matrix (Clockwise)
**Purpose:** Apply global rotation to all layers.

```js
// infinity_zoom_webgl_engine.js, lines 90–97
function make_rotation_matrix(angle) {
   const c = Math.cos(angle);
   const s = Math.sin(angle);
   return [c, s, 0, -s, c, 0, 0, 0, 1];
}
```

---

## Discard Previous Layer When Covered
**Purpose:** Remove previous layer when the next covers the viewport (with feather).

```js
// infinity_zoom_webgl_engine.js, lines 170–184 (inside animate loop, modified for V2)
while (active_layers.length > 1) {
   const next = active_layers[1];
   const min_dim = Math.min(canvas.width, canvas.height);
   const feather_px = Math.max(2, Math.max(canvas.width, canvas.height) * INFINITY_ZOOM_FEATHER_VALUE);
   const draw_size = next.scale * min_dim;
   if ((draw_size - 2 * feather_px) >= canvas.width && (draw_size - 2 * feather_px) >= canvas.height) {
      delete_texture(active_layers[0]);
      active_layers.shift();
   } else {
      break;
   }
}
```

---

## Layer Data Format
**Purpose:** Structure for layer stack and image references.

```js
// infinity_zoom_webgl.html, lines 40–52
const LAYERS_DATA = [
   { zoom: 25, image: '10_new_planete.png' },
   { zoom: 25, image: '20_alien_island_II_tricky_transition_continental_B.png' },
   { zoom: 25, image: '30_alien_island_II_tricky_transition.png' },
   // ...
];
```

---

## Aspect-Correct Square Rendering

**Purpose:** Always render images as perfect squares, centered, regardless of canvas aspect ratio.

```js
// infinity_zoom_webgl_engine.js, lines 80–89
function make_matrix(img, canvas) {
   // Compute aspect-correct scale: ensures image is always square and centered
   const img_aspect = img.width / img.height;
   const canvas_aspect = canvas.width / canvas.height;
   let sx = 1, sy = 1;
   if (img_aspect > canvas_aspect) {
      sy = canvas_aspect / img_aspect;
   } else {
      sx = img_aspect / canvas_aspect;
   }
   return [sx, 0, 0, 0, sy, 0, 0, 0, 1];
}
```

**Vertex Shader (WebGL2, for aspect-correct rendering):**
```glsl
#version 300 es
precision mediump float;
in vec2 a_position;
in vec2 a_texcoord;
uniform mat3 u_matrix;
out vec2 v_texcoord;
void main() {
  vec3 pos = u_matrix * vec3(a_position, 1.0);
  v_texcoord = a_texcoord;
  gl_Position = vec4(pos.xy, 0, 1);
}
```

**Usage:**
Pass the matrix from `make_matrix(img, canvas)` as the `u_matrix` uniform to the vertex shader for each draw call. This ensures the image is always square and centered.

---

## Canvas Resize for Device Pixel Ratio
**Purpose:** Ensure crisp rendering on all screens.

```js
// infinity_zoom_webgl_engine.js, lines 20–30
function resize_canvas_to_display_size(canvas, gl) {
   const dpr = window.devicePixelRatio || 1;
   const width = Math.round(window.innerWidth * dpr);
   const height = Math.round(window.innerHeight * dpr);
   if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
   }
   gl.viewport(0, 0, canvas.width, canvas.height);
}
```

---

## Logging Utility
**Purpose:** Human-readable debug output.

```js
// infinity_zoom_webgl_engine.js, used throughout
log('main loop started');
log('[DEBUG] ...');
```

---

## Image Preloader (Early HTML Reference)
**Purpose:** Preload all layer images before canvas/engine initialization. Ensures images are available for the engine and avoids double-loading. Should be referenced in HTML before the canvas is initialized.

**Usage Example (HTML):**

```html
<script src="infinity_zoom_preloader.js"></script>
<script>
  window.infinity_zoom_preloader.preload_images(LAYERS_DATA, 'zoom_images_planete');
  window.infinity_zoom_preloader.on_images_loaded((images) => {
    // images[] is ready, start engine
  });
</script>
```

---

Add more snippets as needed for new concepts or as you encounter reusable logic.
