# Final Transition to Main App - Planning

## Objective
Seamlessly transition from the Phase 04 "Infinity Zoom" intro to the main Imaginer application. The transition must be invisible to the user, ensuring the final image of the intro matches exactly with the initial state of the app.

## Current State Analysis
- **Phase 04 End State**: The engine enters `final_rotation` phase, holding the "main zoom" at a covering scale. It waits for `FLAG_initiate_final_reveal` to be `true`.
- **Region Zoom**: Once the flag is set, the engine enters `region_zoom` phase, zooming into a specific region until it reaches the final image (`Final_recursion.jpg`).
- **Region Zoom End**: The engine enters `region_zoom_hold` phase, rendering only the final frame.
- **Main App**: The app (`index.html`) is a separate page. It has a `window.expose_internals_for_intro()` hook.
- **Intro Remote Control**: `intro_remote_control.js` exists and can inject `Final_recursion.jpg` into the app and position it to cover the screen exactly.

## Implementation Plan

### 1. Triggering the App Load
We will initiate the app loading process as soon as the "main zoom" completes and we enter the `final_rotation` phase.

**Location**: `infinity_zoom_II_engine.js` -> `update_main_zoom_state` (transition to `final_rotation`).

**Action**: Call a new function `window.infinity_zoom_II.app_transition_manager.start_loading_app()`.

### 2. App Transition Manager
Create a new module `intro/04/app_transition_manager.js` to handle the orchestration.

**Responsibilities**:
1.  **Create Iframe**:
    - Create an `iframe` element.
    - Set `src` to `index.html` (or root `/`).
    - Style: `position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; z-index: 1000; opacity: 0; pointer-events: none;`.
    - Append to `document.body`.

2.  **Monitor App Loading**:
    - Listen for the iframe's `load` event.
    - Once loaded, access `iframe.contentWindow`.

3.  **Setup App State**:
    - Import `Intro_remote_control` in the parent context (intro).
    - Instantiate `Intro_remote_control` passing the iframe's `contentWindow` as the target context.
    - Execute `remote_control.execute()`.
    - This avoids `eval` and script injection, leveraging same-origin access to manipulate the iframe directly.

4.  **Trigger Region Zoom**:
    - Once `remote_control.execute()` resolves, set `window.infinity_zoom_II.FLAG_initiate_final_reveal = true`.

5.  **Blend In**:
    - Monitor `window.infinity_zoom_II.engine.animation_phase`.
    - When it becomes `region_zoom_hold`:
        - Enable pointer events on iframe: `pointer-events: auto`.
        - Animate iframe opacity from 0 to 1 (CSS transition).
        - Once opacity is 1:
            - The transition is complete.
            - (Optional) Stop the intro engine / remove canvas to free resources.

### 3. Code Modifications

#### `intro/04/infinity_zoom_II_engine.js`
- In `update_main_zoom_state`:
  ```javascript
  if (final_layer_target_scale > covering_scale) {
      // ... existing code ...
      this.animation_phase = "final_rotation";
      this.final_rotation_start_time = now;
      
      // NEW: Start loading the app
      if (window.infinity_zoom_II.app_transition_manager) {
          window.infinity_zoom_II.app_transition_manager.start_loading_app();
      }
  }
  ```

#### `intro/04/app_transition_manager.js` (New File)
```javascript
import { Intro_remote_control } from '../../intro_remote_control.js';

export class AppTransitionManager {
    constructor() {
        this.iframe = null;
    }

    start_loading_app() {
        if (this.iframe) return; // Already started

        this.iframe = document.createElement('iframe');
        this.iframe.src = '../../index.html'; // Adjust path as needed
        this.iframe.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; z-index: 1000; opacity: 0; pointer-events: none; transition: opacity 1s ease-in-out;';
        document.body.appendChild(this.iframe);

        this.iframe.onload = async () => {
            await this.setup_app_state();
        };
    }

    async setup_app_state() {
        const app_window = this.iframe.contentWindow;
        
        // Instantiate remote control with the iframe's window context
        const remote = new Intro_remote_control(app_window);
        
        // Execute the setup sequence
        await remote.execute();
        
        // Signal ready for reveal
        window.infinity_zoom_II.FLAG_initiate_final_reveal = true;
    }
    
    // Monitor engine phase
    // On 'region_zoom_hold':
    // Fade in iframe
}
```

#### `intro_remote_control.js`
- Modify constructor to accept `target_window` (defaulting to `window`).
- Replace all `document` references with `this.target_window.document`.
- Replace all `window` references with `this.target_window`.
- Ensure `assets/dummy_pictures/Final_recursion.jpg` path resolution works correctly (relative to the document context).

### 4. Verification
- Verify `Final_recursion.jpg` matches the end of region zoom.
- Verify the "covering" logic in `Intro_remote_control` matches the "covering" logic in `region_zoom.js` (orthographic projection vs viewer zoom).
    - `region_zoom.js` uses orthographic projection to fill the screen.
    - `Intro_remote_control.js` calculates `covering_scale` to fill the screen.
    - They should visually match.

## Next Steps
1. Create `intro/04/app_transition_manager.js`.
2. Integrate it into `infinity_zoom_II_engine.js`.
3. Test the flow.
