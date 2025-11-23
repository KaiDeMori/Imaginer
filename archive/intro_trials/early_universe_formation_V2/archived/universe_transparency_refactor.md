# Universe Transparency Refactor Plan

## Goal
Enable per-layer control of transparency progression in the animation timeline. Each layer should be able to specify its own base opacity, easing function, and distance-to-camera fade parameters, allowing for more flexible and visually distinct transitions. The cosmic_fog layer now uses a per-layer distance-based fade window (distance_fade_start_z, distance_fade_end_z) to ensure a smooth fade-out before reaching the camera.

## Approach
- Extend `LAYER_TIMELINE` to include per-layer transparency parameters:
  - `base_opacity`: Starting opacity for the layer.
  - `fade_easing`: Easing function for fade-in/out (e.g., `linear`, `cubic_in_out`).
  - `distance_fade_end_z`: Z value at which the layer should be fully transparent.
  - (Optional) `distance_fade_start_z`: Z value at which distance-based fade begins (now used for cosmic_fog).
- Update `get_layer_states` to use these parameters for each layer.
- Provide a map of easing functions and allow each layer to select one.
- Ensure backward compatibility by providing defaults for omitted parameters.

## Example Timeline Entry
```js
{
  name: "cosmic_fog",
  p_in: 0.04,
  p_out: 0.24,
  z_start: 10,
  z_end: -5,
  base_opacity: 0.9,
  fade_easing: "cubic_in_out",
  distance_fade_start_z: 10, // start fading immediately
  distance_fade_end_z: -3    // invisible 2 WU in front of camera
}
```

## Files Involved in the Refactor
- `timeline_engine.js`  – Update timeline structure and per-layer opacity logic
- `sprite_instance_manager.js`  – (If needed) for any per-sprite transparency or Z logic
- `canvas_animation.js`  – (If needed) for rendering and applying per-layer opacity
- `early_universe_formation_V2.js`  – (If needed) for integration and testing
- `universe_transparency_refactor.md`  – This plan and task tracking

