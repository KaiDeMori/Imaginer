function load_all_images(callback) {
  const layers_data = window.infinity_zoom_II.config.LAYERS_DATA;
  const image_path = window.infinity_zoom_II.config.RELATIVE_IMAGE_PATH;
  const display_image_paths = window.infinity_zoom_II.config.region_zoom.DISPLAY_IMAGES;
  const feather_size = window.infinity_zoom_II.config.feather_size;

  const layer_images = [];
  let loaded_count = 0;
  const total_count = layers_data.length + display_image_paths.length; // layers + display images
  const display_images = [];

  function on_all_loaded() {
    if (feather_size !== undefined) {
      window.infinity_zoom_II.featherer.process_images_with_feathering(layer_images, feather_size, (processed_images) => {
        callback(processed_images, display_images);
      });
    } else {
      callback(layer_images, display_images);
    }
  }

  // Load layer images
  layers_data.forEach((layer, i) => {
    const img = new Image();
    img.onload = () => {
      loaded_count++;
      if (loaded_count === total_count) {
        on_all_loaded();
      }
    };
    img.src = `${image_path}/${layer.image}`;
    layer_images[i] = img;
  });

  // Load display images
  display_image_paths.forEach((display_path, i) => {
    const display_img = new Image();
    display_img.onload = () => {
      loaded_count++;
      if (loaded_count === total_count) {
        on_all_loaded();
      }
    };
    display_img.src = display_path;
    display_images[i] = display_img;
  });
}

// Attach to unified namespace
window.infinity_zoom_II.preloader = {
  load_all_images,
};
