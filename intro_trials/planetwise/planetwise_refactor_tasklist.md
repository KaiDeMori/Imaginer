# Planetwise WebGL Refactor Task List

- [ ] Remove local shader/program/buffer helpers from `image_region_zoom.js` and replace with `webgl_program_utils` usage
- [ ] Remove local shader/program/buffer helpers from `infinity_zoom_II_engine.js` and replace with `webgl_program_utils` usage
- [ ] Refactor all direct WebGL setup in `image_region_zoom.js` to use `webgl_program_utils`
- [ ] Refactor all direct WebGL setup in `infinity_zoom_II_engine.js` to use `webgl_program_utils`
- [ ] Ensure `region_zoom_animator.js` uses `webgl_program_utils` for any WebGL setup (if applicable)
- [ ] Update all references and imports to use the shared utility module
- [ ] Verify that the utility module remains generic and not tied to specific rendering logic
- [ ] Test region zoom and infinity zoom features for correct rendering and animation after refactor
- [ ] Remove any now-unused or duplicate WebGL setup code from the codebase
