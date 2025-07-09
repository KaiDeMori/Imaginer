# Planetwise WebGL Refactor Task List

All files that need changing are within the folder 'planetwise' or it's subfolders.

- [ ] Remove local shader/program/buffer helpers from `image_region_zoom.js` and replace with `webgl_program_utils` usage
- [ ] Remove local shader/program/buffer helpers from `infinity_zoom_II_engine.js` and replace with `webgl_program_utils` usage
- [ ] Refactor all direct WebGL setup in `image_region_zoom.js` to use `webgl_program_utils`
- [ ] Refactor all direct WebGL setup in `infinity_zoom_II_engine.js` to use `webgl_program_utils`
- [ ] Ensure `region_zoom_animator.js` uses `webgl_program_utils` for any WebGL setup (if applicable)
- [ ] Update all references and imports to use the shared utility module
- [ ] Verify that the utility module remains generic and not tied to specific rendering logic
- [ ] Double-check and compare the code from `webgl_image_transformation_static.html` and the new code to make sure functionality is correctly ported
- [ ] Remove any now-unused or duplicate WebGL setup code from the code.