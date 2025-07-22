function load_all_images(callback) {
  const layer_data = window.infinity_zoom_II.config.LAYERS_DATA;
  const image_path = window.infinity_zoom_II.config.RELATIVE_IMAGE_PATH;
}

// Attach to unified namespace
window.infinity_zoom_II.preloader = {
  load_all_images,
};
