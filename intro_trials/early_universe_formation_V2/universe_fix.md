# Universe V2 – Zoom-through Fix & Refactor Road-map

This document distils all investigation results and the proposed way forward
for repairing the “fly-through” shot.  It is meant to be **the single source of
truth** for whoever works on the fix.

---
Note: the final planet asset stays in the center and is different. we want to keep it that way.

---
## A · Root-cause summary

| Symptom | Underlying Cause |
|---------|------------------|
| Sprites spawn almost on-axis | Offset scale was computed with `1 – z_factor`, so far layers (large **+Z**) got **≈ 0** multiplier → negligible offsets. |
| Radial motion looks as if it decelerates toward the edge | Drift magnitude was `max(0, –final_z)`, i.e. **0** until the sprite passes the camera plane; far layers hardly moved. |

---
## B · Quick tactical fix (already verified)

1. **Offset scale**  
   ```js
   const z_factor    = clamp(final_z / MAX_Z_POS, 0, 1); // 0 (far) … 1 (near)
   const spawn_scale = z_factor;                         // far ⇒ big offset
   ```

2. **Drift magnitude**  
   ```js
   const dist_to_cam = Math.abs(cam_z - final_z); // world-units distance
   const drift_r     = is_planet ? 0 : dist_to_cam * XY_DRIFT_PER_Z;
   ```

This yields a respectable fix but we are going with the **full refactor**
below.

---
## C · Full coordinate-system refactor (≈ ½ day)

Goal: express every sprite in **world coordinates** and step them with a true
velocity every frame.  Removes ad-hoc formulas and makes future tweaks
trivial.

### 1 · Data model (`sprite_instance_manager.js`)

Extra per-instance fields:
```ts
{
  // World position (initially on an annulus around origin)
  x: number,   // world units
  y: number,
  z: number,

  // Constant radial velocity (units s⁻¹).  Tangential component stays **0**
  // – we want straight outward motion.
  v_r: number,

  angle: number,   // already deterministic; gives radial direction
  …                // existing props unchanged
}
```
Per-layer constants:
```ts
const SPAWN_RADIUS     = { cosmic_fog: 1.0, galaxy_streams: 0.8, … };
const RADIAL_SPEED     = { cosmic_fog: 0.12, galaxy_streams: 0.18, … };
```
`x` and `y` are simply
```js
x = Math.cos(angle) * SPAWN_RADIUS[layer] * VIEWPORT_MIN;
y = Math.sin(angle) * SPAWN_RADIUS[layer] * VIEWPORT_MIN;
```
with `VIEWPORT_MIN` = min(viewport-w, viewport-h) translated to world units
(one world-unit ≈ one CSS px at Z = 0 by convention – keep simple).

### 2 · Frame update (`canvas_animation.js`)

```js
const dt = (ts - last_ts) / 1000; // seconds since last frame

// Step physics – identical for all non-planet sprites
sp.x += Math.cos(sp.angle) * sp.v_r * dt;
sp.y += Math.sin(sp.angle) * sp.v_r * dt;
// z stays fixed; camera moves instead (cam_z curve already exists)
```

### 3 · Projection (single place)

Using the existing perspective formula:
$$scale = \frac{cam_z}{cam_z - z}$$
```js
screen_x = cx + x * scale;
screen_y = cy + y * scale;
```
Sprite draw width/height = bitmap.w × scale (same as now).

### 4 · Opacity / easing

Keep the current timeline engine.  Opacity curves can later be replaced by
custom per-layer easing (cubic, quad …); the new physics are independent.

---
## D · Long-term niceties

1. **Auto-derive `MAX_Z_POS`**  
   ```js
   const MAX_Z_POS = Math.max(...LAYER_TIMELINE.map(t => t[3] /* zStart */));
   ```
2. Maintain per-layer easing curves (opacity, maybe scale) – to be designed.
3. All drift is radial **only** (tangential speed stays zero) – no spirals as
   requested.

---
## E · Implementation todo-list

- [x] Add `SPAWN_RADIUS` & `RADIAL_SPEED` tables – pick initial placeholders.
- [x] Extend `sprite_instance_manager.js` to generate the new world-space props.
- [x] Rewrite the per-frame loop to (a) advance positions, (b) project to screen.
- [x] Remove the old `spawn_offset_*`, `drift_r`, `z_factor` code paths.
- [x] Replace magic “10” with `MAX_Z_POS` helper.
- [ ] Smoke-test determinism (seed → identical positions every fresh load).
- [ ] Tweak radii / speeds until the fly-through feels right.
- [ ] After visual sign-off: consider separate easing curves for opacity.

---
