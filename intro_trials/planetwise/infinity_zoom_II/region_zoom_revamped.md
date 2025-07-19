# Region Zoom Revamped - Implementation Plan

## Relevant Files

- `region_zoom.js` - Region zoom functionality (will be stripped and rebuilt)
- `infinity_zoom_II_engine.js` - Main engine with animation loop and state machine
- `infinity_zoom_II_utils.js` - Utility functions including TRS and WebGL helpers
- `infinity_zoom_II.html` - Main HTML file with layer configuration
- `infinity_zoom_sequence_screenplay.md` - Animation sequence documentation and requirements
- `region_zoom_revamped.md` - This implementation plan document


## Fail-Fast Development
- **NO defensive coding**: Let errors throw immediately and visibly
- **NO Node.js patterns**: Pure browser environment, no require/module.exports
- **Crash fast and hard**: Use direct property access, assume objects exist
- **Browser-first**: Use `window`, DOM APIs, and browser globals directly
- **No error handling**: If something is wrong, we want to know immediately via console errors


