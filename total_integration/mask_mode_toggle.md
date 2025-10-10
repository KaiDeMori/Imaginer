# Mask Mode Toggle – UI/UX Checklist for Basic Mode

When the mask feature palette is disabled ("basic mode"), the following UI elements and behaviors must be hidden or disabled:

1. **Mask Mode Button**
   - Hide the button that toggles mask mode in the viewer overlay.

2. **Remove Masks Button**
   - Hide the button for clearing all masks in the viewer overlay.

3. **Mask Mode Controls Container**
   - Hide the flex container holding mask-related buttons (e.g., `.mask_mode_controls` or `.mask_button_group`).

4. **Any Mask-Related Toolbar/Palette**
   - Hide any additional mask tools, sliders, or palette UI elements.

5. **Mask Overlay/Visual Feedback**
   - Remove the red border or any mask overlay on images/thumbnails.

6. **Gallery Mask Indicators**
   - Hide any mask status icons, badges, or `[mask-active]` attributes in the gallery.

7. **Prompt Panel Mask Options**
   - Hide any mask-related options or controls in the prompt panel.

8. **Drag-and-Drop Mask Handling**
   - Disable or hide any UI for dragging/dropping masks or mask data.

9. **Config Dialog Mask Settings**
   - Hide the "Show Mask Mode Button" checkbox and any mask-related config options.

10. **Mask-Related Tooltips or Hints**
    - Hide any tooltips, help text, or hints about mask features.

**Behavior:**
- When basic mode is active, all mask-related UI and actions should be completely unavailable to the user.
- When mask features are enabled, all UI and functionality should be restored as normal.

---

## Implementation Plan: Mask Mode Toggle

Below is a list of files to update for a strict Mask Mode toggle implementation, with notes for each:

1. **components/config_dialog.js**
   - Add a new checkbox for "Enable Mask Mode" (or similar wording).
   - Save the setting to localStorage (e.g., `imaginer.enable_mask_mode`).
   - On change, trigger a UI update (possibly via a custom event or by reloading relevant UI).

2. **components/config_dialog.css**
   - (Optional) Style the new checkbox and hide mask-related config options when Mask Mode is disabled.

3. **components/viewer/viewer.js**
   - On initialization and when the setting changes, hide or disable all mask-related UI (mask mode button, remove masks button, mask overlays, etc.).
   - Prevent mask-related actions/events if Mask Mode is disabled.

4. **components/gallery.js**
   - Hide mask indicators (e.g., red border, `[mask-active]` attribute) when Mask Mode is disabled.
   - Prevent mask drag-and-drop if Mask Mode is disabled.

5. **components/prompt_panel.js**
   - Hide or disable any mask-related options or controls in the prompt panel when Mask Mode is disabled.

6. **main.css**
   - (Optional) Add or adjust CSS to ensure mask-related UI is hidden when Mask Mode is disabled.

7. **Any other mask-related files (e.g., mask_manager.js, mask_mode_behaviour.js)**
   - Ensure no mask logic is triggered or visible when Mask Mode is disabled.

---
This checklist should be referenced when implementing or reviewing the mask mode toggle feature for a strict "basic mode" experience.
