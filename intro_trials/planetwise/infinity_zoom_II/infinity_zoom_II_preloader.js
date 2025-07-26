function load_all_images(callback) {
  const layers_data = window.infinity_zoom_II.config.LAYERS_DATA;
  const image_path = window.infinity_zoom_II.config.RELATIVE_IMAGE_PATH;
  const mystery_image_paths = window.infinity_zoom_II.config.MYSTERY_IMAGES;
  const feather_size = window.infinity_zoom_II.config.feather_size;

  const layer_images = [];
  let loaded_count = 0;
  const total_count = layers_data.length + mystery_image_paths.length; // layers + mystery images
  const mystery_images = [];

  function on_all_loaded() {
    if (feather_size !== undefined) {
      window.infinity_zoom_II.featherer.process_images_with_feathering(layer_images, feather_size, (processed_images) => {
        callback(processed_images, mystery_images);
      });
    } else {
      callback(layer_images, mystery_images);
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

  // Load mystery images
  mystery_image_paths.forEach((mystery_path, i) => {
    const mystery_img = new Image();
    mystery_img.onload = () => {
      loaded_count++;
      if (loaded_count === total_count) {
        on_all_loaded();
      }
    };
    mystery_img.src = mystery_path;
    mystery_images[i] = mystery_img;
  });
}

// Attach to unified namespace
window.infinity_zoom_II.preloader = {
  load_all_images,
};
