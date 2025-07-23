function load_all_images(callback) {
  const layers_data = window.infinity_zoom_II.config.LAYERS_DATA;
  const image_path = window.infinity_zoom_II.config.RELATIVE_IMAGE_PATH;
  const mystery_image_path = window.infinity_zoom_II.config.MYSTERY_IMAGE;

  const layer_images = [];
  let loaded_count = 0;
  const total_count = layers_data.length + 1; // layers + mystery image
  let mystery_image = null;

  // Load layer images
  layers_data.forEach((layer, i) => {
    const img = new Image();
    img.onload = () => {
      loaded_count++;
      if (loaded_count === total_count) {
        callback(layer_images, mystery_image);
      }
    };
    img.src = `${image_path}/${layer.image}`;
    layer_images[i] = img;
  });

  // Load mystery image
  const mystery_img = new Image();
  mystery_img.onload = () => {
    loaded_count++;
    if (loaded_count === total_count) {
      callback(layer_images, mystery_image);
    }
  };
  mystery_img.src = mystery_image_path;
  mystery_image = mystery_img;
}

// Attach to unified namespace
window.infinity_zoom_II.preloader = {
  load_all_images,
};
