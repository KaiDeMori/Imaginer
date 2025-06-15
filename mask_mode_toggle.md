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
This checklist should be referenced when implementing or reviewing the mask mode toggle feature for a strict "basic mode" experience.
