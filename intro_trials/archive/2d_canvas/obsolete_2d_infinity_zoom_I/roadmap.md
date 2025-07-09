# Infinity Zoom Animation – Implementation Roadmap

## Tempo (Growth Ratio)
- **Growth ratio per second:** 1.1
- **Growth constant:** k = ln(1.1)

## Implementation Steps

1. **Animation Engine (`infinity_zoom_engine.js`)**
   - Use a growth ratio of 1.1 per second for scaling.
   - Compute growth constant: `k = Math.log(1.1)`.
   - Track current active layers and their scales.
   - Implement the animation loop using `requestAnimationFrame`.
   - For each frame:
     - Calculate elapsed time (delta t).
     - Update scale for each active layer: `s(t+dt) = s(t) * Math.exp(k * dt)`.
     - When the top layer fills the viewport, remove the underneath layer.
     - Draw all active layers, back-to-front, centered and scaled to canvas.
   - End animation when the last layer fills the viewport.

2. **Integration**
   - Expose a function to start the animation after images are loaded.
   - Call this function from the HTML inline script after `setup_canvas()`.

3. **Logging**
   - Use the existing `log()` function for debug output at key steps.

4. **Configurability**
   - Allow easy adjustment of tempo/growth ratio (default: 1.1).

## What Not To Do
- No user interaction, no error handling, no external dependencies, no panning, no fallback images.

---

**This roadmap is based on the Infinity Zoom documentation and current codebase.**
