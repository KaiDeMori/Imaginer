const RELATIVE_BASE_DIRECTORY_INTRO = "../";

const ASSET_URLS_ORDERED = [
  "01/cinematic_starfield.css",
  "02/the_great_everywhere_shake.css",
  "01/cinematic_starfield_manager.js",
  "01/cinematic_starfield.js",
  "02/the_great_everywhere_shake.js",
  "00/cinematic_bridge.js",
  "00/phase_02_transition.js",
  "04/phase_04_transition.js",
  "audio/Also_sprach_Zarathustra.ogg",
];

const ASSET_URLS_BULK = [
  // Add URLs here that can load in parallel
];

const asset_loader = {
  async start_loading(callback) {
    // Load ordered assets sequentially
    for (const relative_url of ASSET_URLS_ORDERED) {
      const url = `${RELATIVE_BASE_DIRECTORY_INTRO}${relative_url}`;
      await this.load_asset(url);
    }

    // Load bulk assets in parallel (including phase 2 images)
    const bulk_promises = ASSET_URLS_BULK.map((relative_url) => {
      const url = `${RELATIVE_BASE_DIRECTORY_INTRO}${relative_url}`;
      return this.load_asset(url);
    });

    // Also load phase 2 images in parallel
    const phase_2_promise = this.load_phase_2_images();

    // Load phase 4 assets (Infinity Zoom)
    const phase_4_promise = this.load_phase_4_assets();

    await Promise.all([...bulk_promises, phase_2_promise, phase_4_promise]);

    callback();
  },

  async load_phase_4_assets() {
    const RELATIVE_BASE_DIRECTORY_PHASE4 = "../04";
    const dependencies = [
      "infinity_zoom_debug.js",
      "regions.js",
      "infinity_zoom_II_configs.js",
      "infinity_zoom_II_featherer.js",
      "infinity_zoom_II_preloader.js",
    ];

    // Load scripts sequentially
    for (const dep of dependencies) {
      await this.load_script(`${RELATIVE_BASE_DIRECTORY_PHASE4}/${dep}`);
    }

    // Trigger image preloading
    return new Promise((resolve) => {
      if (window.infinity_zoom_II && window.infinity_zoom_II.preloader) {
        console.log("Starting Phase 4 asset preloading...");
        window.infinity_zoom_II.preloader.load_all_images(() => {
          console.log("Phase 4 assets preloaded.");
          resolve();
        });
      } else {
        console.error("Phase 4 preloader not found.");
        resolve(); // Resolve anyway to not block
      }
    });
  },

  async load_phase_2_images() {
    // Import phase 2 preloader module and use it directly
    const { load_and_decode_images } = await import("../03/preloader_module.js");
    const { layers_config } = await import("../03/layers_model.js");
    const { LAYER_TIMELINE } = await import("../03/timeline_engine.js");

    // Calculate required URLs based on sprite counts
    const required_urls = new Set();
    for (const layer_def of LAYER_TIMELINE) {
      const config = layers_config.find((l) => l.name === layer_def.name);
      if (config) {
        const count = layer_def.sprite_count || 0;
        const files_to_load = config.files.slice(0, count);
        files_to_load.forEach((url) => required_urls.add(url));
      }
    }

    // Load all phase 2 images - they'll be cached for instant access during transition
    await load_and_decode_images(null, required_urls);
  },
  load_asset(url) {
    const extension = url.split(".").pop().toLowerCase();

    if (extension === "css") return this.load_css(url);
    if (extension === "js") return this.load_script(url);
    if (["webm", "mp3", "wav", "ogg"].includes(extension)) return this.load_audio(url);
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension)) return this.load_image(url);
  },

  load_css(url) {
    return new Promise((resolve, reject) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = url;
      link.onload = resolve;
      link.onerror = () => reject(new Error(`Failed to load CSS: ${url}`));
      document.head.appendChild(link);
    });
  },

  load_script(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = url;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
      document.head.appendChild(script);
    });
  },

  load_image(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = resolve;
      image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      image.src = url;
    });
  },

  async load_audio(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load audio: ${url} (${response.status} ${response.statusText})`);
    }
    const array_buffer = await response.arrayBuffer();
    const audio_context = new AudioContext();
    const decoded_buffer = await audio_context.decodeAudioData(array_buffer);

    // Store for cinematic bridge
    window.decoded_audio_buffer = decoded_buffer;
    window.audio_context = audio_context;
  },
};

// Expose to global scope
window.asset_loader = asset_loader;
