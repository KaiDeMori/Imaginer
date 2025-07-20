// Image preloader module for infinity zoom
let images = [];
let mystery_image = null;
let images_loaded = false;
let image_load_callbacks = [];

function preload_images(layer_data, image_folder = "zoom_images") {
  if (images_loaded) {
    log("[preload_images] Images already loaded, skipping.");
    return; // Prevent double loading
  }
  let loaded = 0;
  const total = layer_data.length + 1; // +1 for mystery image
  images = new Array(layer_data.length);
  if (layer_data.length === 0) {
    images_loaded = true;
    log("[preload_images] No images to load.");
    image_load_callbacks.forEach((cb) => cb(images, mystery_image));
    image_load_callbacks = [];
    return;
  }
  log(`[preload_images] Loading ${total} images (including mystery)...`);

  // Load mystery image first
  const mystery_img = new Image();
  mystery_img.onload = () => {
    mystery_image = mystery_img;
    loaded++;
    log(`[preload_images] [${loaded}/${total}] loaded mystery image (${mystery_img.width}x${mystery_img.height})`);
    if (loaded === total) {
      images_loaded = true;
      log(`[preload_images] All ${total} images loaded!`);
      image_load_callbacks.forEach((cb) => cb(images, mystery_image));
      image_load_callbacks = [];
    }
  };
  mystery_img.onerror = (e) => {
    log(`[preload_images] ERROR loading mystery image`);
  };
  mystery_img.src = window.infinity_zoom_II.config.MYSTERY_IMAGE;
  log(`[preload_images] Started loading mystery image`);

  // Load layer images
  layer_data.forEach((layer, i) => {
    const img = new Image();
    img.onload = () => {
      images[i] = img;
      loaded++;
      // Only log the file name, not the full path
      const file_name = get_file_name(layer.image);
      log(`[preload_images] [${loaded}/${total}] loaded: ${file_name} (${img.width}x${img.height})`);
      if (loaded === total) {
        images_loaded = true;
        log(`[preload_images] All ${total} images loaded!`);
        image_load_callbacks.forEach((cb) => cb(images, mystery_image));
        image_load_callbacks = [];
      }
    };
    img.onerror = (e) => {
      const file_name = get_file_name(layer.image);
      log(`[preload_images] ERROR loading image: ${file_name}`);
    };
    img.src = `${image_folder}/${layer.image}`;
    // Only log the file name, not the full path
    const file_name = get_file_name(layer.image);
    log(`[preload_images] Started loading: ${file_name}`);
  });
}

function on_images_loaded(callback) {
  if (images_loaded) {
    log("[on_images_loaded] Images already loaded, invoking callback immediately.");
    callback(images, mystery_image);
  } else {
    log("[on_images_loaded] Images not yet loaded, queuing callback.");
    image_load_callbacks.push(callback);
  }
}

// Load mystery image only
function load_mystery_image_only(callback) {
  const mystery_img = new Image();
  mystery_img.onload = () => {
    log(`[load_mystery_image_only] loaded mystery image (${mystery_img.width}x${mystery_img.height})`);
    callback(mystery_img);
  };
  mystery_img.onerror = (e) => {
    log(`[load_mystery_image_only] ERROR loading mystery image`);
  };
  mystery_img.src = window.infinity_zoom_II.config.MYSTERY_IMAGE;
  log(`[load_mystery_image_only] Started loading mystery image`);
}

// Load layer images only
function load_layer_images_only(layer_data, image_folder, callback) {
  if (layer_data.length === 0) {
    log("[load_layer_images_only] No layer images to load.");
    callback([]);
    return;
  }

  let loaded = 0;
  const total = layer_data.length;
  const images = new Array(total);

  log(`[load_layer_images_only] Loading ${total} layer images...`);

  layer_data.forEach((layer, i) => {
    const img = new Image();
    img.onload = () => {
      images[i] = img;
      loaded++;
      const file_name = get_file_name(layer.image);
      log(`[load_layer_images_only] [${loaded}/${total}] loaded: ${file_name} (${img.width}x${img.height})`);
      if (loaded === total) {
        log(`[load_layer_images_only] All ${total} layer images loaded!`);
        callback(images);
      }
    };
    img.onerror = (e) => {
      const file_name = get_file_name(layer.image);
      log(`[load_layer_images_only] ERROR loading image: ${file_name}`);
    };
    img.src = `${image_folder}/${layer.image}`;
    const file_name = get_file_name(layer.image);
    log(`[load_layer_images_only] Started loading: ${file_name}`);
  });
}

// Unified interface - handles feathering decision internally
function load_all_images(layer_data, image_folder, callback) {
  // Always load mystery image first (never feathered)
  load_mystery_image_only((mystery_img) => {
    // Check config for feathering decision
    const feather_size = window.infinity_zoom_II.config.feather_size;

    if (feather_size !== undefined) {
      // Use feather preloader for layers only
      log(`[load_all_images] Using feathering path with size: ${feather_size}`);
      window.infinity_zoom_II.feather_preloader.preload_and_feather_layers_only(layer_data, image_folder, feather_size, (feathered_images) => {
        log(`[load_all_images] Feathering complete, calling callback`);
        callback(feathered_images, mystery_img);
      });
    } else {
      // Use regular preloader for layers only
      log(`[load_all_images] Using regular path (no feathering)`);
      load_layer_images_only(layer_data, image_folder, (images) => {
        log(`[load_all_images] Layer loading complete, calling callback`);
        callback(images, mystery_img);
      });
    }
  });
}

// Utility: Get only the filename from a path string
function get_file_name(path) {
  return path.split("/").pop();
}

// Attach to unified namespace
window.infinity_zoom_II.preloader = {
  preload_images,
  on_images_loaded,
  load_mystery_image_only,
  load_layer_images_only,
  load_all_images,
};
