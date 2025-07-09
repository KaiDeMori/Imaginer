# Planetwise WebGL Refactor Tasklist

## Modular WebGL Utility Integration

- [ ] Ensure `webgl_program_utils.js` is fully generic and up to date for all shader, program, and buffer setup needs
- [ ] Remove all direct WebGL setup code (shader/program/buffer/attribute/uniform) from:
  - [ ] `infinity_zoom_II_engine.js`
  - [ ] `image_region_zoom_utils_render.js`
  - [ ] All related demo HTMLs and modules
- [ ] Replace with calls to `webgl_program_utils.js` utility functions
- [ ] Remove any duplicate or local helper functions for WebGL setup


## Integration

- [ ] Import/reference `webgl_program_utils.js` in all modules and HTML files that use WebGL setup
- [ ] Update all WebGL setup code to use the shared utility

## Codebase Consistency

- [ ] Ensure no duplicated WebGL setup logic remains in any module
- [ ] Ensure utility module is not tied to any specific rendering logic
- [ ] Update documentation/comments to reflect new utility usage

---