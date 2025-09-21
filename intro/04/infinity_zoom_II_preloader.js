function load_all_images(callback) {
  const layers_data = window.infinity_zoom_II.config.LAYERS_DATA;
  const image_path = window.infinity_zoom_II.config.RELATIVE_BASE_DIRECTORY;
  const region_display_image_paths = window.infinity_zoom_II.config.REGION_DISPLAY_IMAGE_PATHS;
  const main_display_image_paths = window.infinity_zoom_II.config.MAIN_DISPLAY_IMAGE_PATHS;

  const feather_size = window.infinity_zoom_II.config.feather_size;

  const layer_images = [];
  const region_display_images = [];
  const main_display_images = [];
  let loaded_count = 0;
  const total_count = layers_data.length + region_display_image_paths.length + main_display_image_paths.length;

  function on_all_loaded() {
    window.infinity_zoom_II.REGION_DISPLAY_IMAGES = region_display_images;
    window.infinity_zoom_II.MAIN_DISPLAY_IMAGES = main_display_images;

    if (feather_size !== undefined) {
      window.infinity_zoom_II.featherer.process_images_with_feathering(layer_images, feather_size, (processed_images) => {
        callback(processed_images);
      });
    } else {
      callback(layer_images);
    }
  }

  // Load layer images
  layers_data.forEach((layer, i) => {
    const img = new Image();
    img.onload = () => {
      log(`${layer.image} loaded.`);
      loaded_count++;
      if (loaded_count === total_count) {
        on_all_loaded();
      }
    };
    img.src = `${image_path}/${layer.image}`;
    layer_images[i] = img;
  });

  // Load display images

  region_display_image_paths.forEach((display_path, i) => {
    const display_img = new Image();
    display_img.onload = () => {
      log(`${display_path} loaded.`);
      loaded_count++;
      if (loaded_count === total_count) {
        on_all_loaded();
      }
    };
    display_img.src = display_path;
    region_display_images[i] = display_img;
  });

  main_display_image_paths.forEach((display_path, i) => {
    const display_img = new Image();
    display_img.onload = () => {
      log(`${display_path} loaded.`);
      loaded_count++;
      if (loaded_count === total_count) {
        on_all_loaded();
      }
    };
    display_img.src = display_path;
    main_display_images[i] = display_img;
  });
}

// Attach to unified namespace
window.infinity_zoom_II.preloader = {
  load_all_images,
};
