# Imaginer Intro: Technical Transition Design

## Purpose
This document details the technical implementation plan for the seamless transition from the Imaginer WebGL Infinity Zoom intro to the main AI image creation app. The goal is to create a magical, narrative-driven handoff that is robust, performant, and easy to maintain.

## Transition Flow Overview

1. **WebGL Infinity Zoom Intro**
  - Runs in a dedicated canvas/WebGL context.
  - Final zoom targets an alien holding a display device, which fills the viewport.
  - At this stage, the scene pauses on the alien and device, with only a single image slowly rotating (minimal WebGL load).
  - **During this pause, the main app and all critical assets are loaded in the background.**

  - Once loading is complete (or after a minimum display time), the final zoom into the display device begins, showing the transition image.
  - Note: The transition image is envisioned as a recursive scene—a girl on her laptop generating a picture of the alien, who is generating a picture, and so on—creating an "infinity-mirror" effect for the handoff.
  - **Aspect Ratio Cropping:** The alien's display is not square (e.g., 142x103), but the recursive transition image is (e.g., 1024x1024). At the start of the overlay, the alien image fills the entire canvas, showing the full scene. The recursive image is mapped and cropped to fit the alien’s device screen—appearing small, rotated, and embedded within the device. During the transition, the recursive image animates in sync with the device screen, scaling, translating, and rotating so that it always remains perfectly aligned with the device. Only in the final frame does the recursive image fully cover the user's viewport, with cropping as needed to avoid any empty space or bars, regardless of the user's screen aspect ratio. Once this condition is reached and the app is ready, the canvas is simply faded out, completing the seamless handoff to the main application.

2. **Transition Image Handoff**
  - The transition image is a real asset (not a screenshot or canvas capture).
  - The app preloads this image and its metadata (zoom, position, etc.) during the intro pause.
  - When the intro ends, the app overlays its own gallery/view component, displaying the same image, zoomed and positioned to match the final intro frame.

3. **Seamless Reveal**
  - The gallery/view overlay animates a zoom-out (using CSS transforms or canvas/WebGL as appropriate) to the default view state.
  - The overlay is then closed programmatically, revealing the main app UI.

## Technical Requirements
- **Image Asset Management**
  - Store the transition image in a known location (local or CDN).
  - Provide metadata: initial zoom, position, and any color grading or effects needed to match the intro.

- **State Synchronization**
  - The intro and app must agree on the image, zoom, and position for a pixel-perfect match.
  - Use a shared state object or event bus to communicate the transition parameters.

- **Preloading**
  - Preload the app bundle and transition image before the intro ends to avoid delays.
  - Optionally, lazy-load non-critical assets after the transition.

- **Animation**
  - Use requestAnimationFrame or CSS transitions for smooth zoom-out.
  - Ensure the animation is interruptible and accessible (e.g., allow skip for accessibility).

- **Overlay Management**
  - The gallery/view overlay should be a top-level component, rendered above all other UI.
  - Overlay must be fully opaque during the transition, then fade/slide out to reveal the app.

- **Performance**
  - Minimize layout thrashing and reflows during the transition.
  - Test on low-end devices to ensure smoothness.

## Integration Points
- **WebGL Intro**: Emits an event or callback when the final frame is reached, passing the transition image and parameters.
- **App Loader**: Listens for the event, preps the overlay, and ensures the app is ready in the background.
- **Gallery/View Overlay**: Receives the image and parameters, animates the zoom-out, then closes.

## Edge Cases & Considerations
- Handle slow image/app loading gracefully (show a spinner or fallback).
- Ensure the transition is robust to window resizes or orientation changes.
- Provide a way to skip the intro/transition for accessibility or returning users.

## Example Event Flow
1. `intro:finalFrame` event emitted with `{ imageUrl, zoom, position }`.
2. App preloads image and overlay, sets initial state.
3. Overlay animates zoom-out.
4. Overlay closes, app is interactive.


## Detailed Overlay Transition: Recursive Image on Device Screen

In the final phase of the intro, the animation overlays a custom recursive image (the transition image) onto the alien’s display device in the last layer. This requires precise synchronization and transformation to ensure a seamless effect.

### Synchronization & Parameters
- The device screen’s position, size, and orientation within the final layer image must be known (e.g., as normalized coordinates or pixel bounds, plus rotation).
- The overlay image is rendered with a transformation matrix that matches the device’s screen (translation, scale, rotation).
- Both the final layer and overlay are animated in sync, so the overlay appears to “emerge” from the device and expand to fill the viewport.

### Animation Phase
- Add a new animation phase (e.g., `final_overlay_transition`) to the state machine.
- At the start of this phase, record the current rotation, scale, and translation.
- Define the target state: overlay fully fills the viewport, device is centered, rotation is at the final angle.
- Interpolate (lerp or ease) all parameters (rotation, translation, scale) over a set duration.

### Transformation Math
- The transformation matrix for the overlay each frame is:
  1. Translate so the device’s screen center aligns with the canvas center.
  2. Apply the current scale and rotation.
  3. Animate these values from their initial to target states.
- The rest of the final layer can be faded out or masked as the overlay expands.

### Implementation Steps
1. Store device screen parameters in the final layer’s metadata (e.g., `{ x, y, width, height, rotation }`).
2. In the `final_overlay_transition` phase, animate the overlay image using the transformation matrix above.
3. Ensure the overlay and final layer remain visually in sync during the transition.
4. When the overlay fills the viewport, fade out the final layer and proceed to the app overlay reveal.

### Smoothing Curve Recommendation for Overlay Animation

For a natural, magical-feeling pan/zoom during the final overlay transition, use an “ease in-out” smoothing curve. This ensures the animation starts and ends gently, with smooth acceleration and deceleration.

**Recommended options:**

1. **Cubic Ease In-Out**
   ```js
   function easeInOutCubic(t) {
     return t < 0.5
       ? 4 * t * t * t
       : 1 - Math.pow(-2 * t + 2, 3) / 2;
   }
   // t goes from 0 (start) to 1 (end)
   ```

2. **Smoothstep**
   ```js
   function smoothstep(t) {
     return t * t * (3 - 2 * t);
   }
   // t goes from 0 (start) to 1 (end)
   ```

Use these functions to interpolate position, scale, and rotation parameters for the overlay and final layer.

### Example Data Structure
```js
{
  device_screen: {
    x: 0.62, // normalized center x (0-1)
    y: 0.48, // normalized center y (0-1)
    width: 0.18, // normalized width (0-1)
    height: 0.11, // normalized height (0-1)
    rotation: -0.12 // radians, relative to image axes
  }
}
```

---

**Document generated by: GitHub Copilot (GPT-4.1 Agent) for the Imaginer Project**
